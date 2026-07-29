import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ContentRow, HeroItem, JobTag } from '@/types/content';
import { caseSeed, applyCaseFilters } from './dev-seed';

const PUBLIC_FIELDS = 'id, slug, track, title, summary, body, job_tags, persona_coverage, read_min, apply_min, status, curated, thumbnail_url, author_quote, view_count, published_at, created_at, updated_at';

const IS_DEV = process.env.NODE_ENV === 'development';

type ListOpts = {
  track?: 'case' | 'trend';
  limit?: number;
  curated?: boolean;
  job?: string;
  timeCap?: number;
};

function devFallback(opts: ListOpts): ContentRow[] {
  if (!IS_DEV) return [];
  return applyCaseFilters(caseSeed, opts);
}

export async function listPublishedContents(opts: ListOpts = {}): Promise<ContentRow[]> {
  if (!isSupabaseConfigured()) return devFallback(opts);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('contents')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (opts.track) query = query.eq('track', opts.track);
  if (opts.curated) query = query.eq('curated', true);
  if (opts.job) query = query.contains('job_tags', [opts.job]);
  if (opts.timeCap) query = query.lte('read_min', opts.timeCap);
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) {
    console.warn('[listPublishedContents]', error.message);
    return devFallback(opts);
  }
  const rows = (data ?? []) as unknown as ContentRow[];
  return rows.length ? rows : devFallback(opts);
}

// featured_contents 조인 행 — content_id(→contents) 또는 tool_id(→tools) 중 하나가 채워짐.
type FeaturedContentJoin = {
  slug: string; track: 'case' | 'trend'; title: string; summary: string | null;
  thumbnail_url: string | null; read_min: number; job_tags: JobTag[] | null; status: string;
  published_at: string | null; created_at: string | null;
};
type FeaturedToolJoin = {
  slug: string; category: string; name: string; description: string | null;
  thumbnail_url: string | null; status: string; created_at: string | null;
};
type FeaturedJoinRow = {
  slot: number; content_id: string | null; tool_id: string | null;
  contents: FeaturedContentJoin | null; tools: FeaturedToolJoin | null;
};

const TOOL_TRACK: Record<string, HeroItem['track']> = { tool: 'tool', prompt: 'prompt', guide: 'guide' };

function heroFromContent(c: {
  slug: string; track: 'case' | 'trend'; title: string; summary: string | null;
  thumbnail_url: string | null; read_min: number; job_tags: JobTag[] | null;
  published_at?: string | null; created_at?: string | null;
}): HeroItem {
  return { slug: c.slug, title: c.title, summary: c.summary, track: c.track, thumbnail_url: c.thumbnail_url, read_min: c.read_min, job_tags: c.job_tags ?? [], date: c.published_at ?? c.created_at ?? null };
}

/**
 * Hero 큐레이션 — admin이 featured_contents(slot_type='hero')에 배정한 슬롯을 읽는다.
 * - active=true + 예약 노출 창(featured_from<=now<=featured_until, null=상시) 필터.
 * - 슬롯 순서대로 정렬. content_id는 contents(케이스/트렌드), tool_id는 tools(도구/프롬프트/가이드)를 가리킴.
 *   둘 다 published인 것만 노출. HeroItem으로 정규화해 캐러셀에 넘긴다.
 * - 비어있으면(미배정/전부 미발행) contents.curated → 그래도 비면 최신 발행 콘텐츠 순으로 폴백.
 *   → 발행 콘텐츠가 하나라도 있으면 히어로는 절대 비지 않는다. (admin 큐레이션은 항상 우선)
 * - Supabase 미구성이면 dev seed 폴백.
 */
async function heroCuratedFallback(limit: number): Promise<HeroItem[]> {
  const curated = await listPublishedContents({ curated: true, limit });
  if (curated.length) return curated.map(heroFromContent);
  // 큐레이션 미지정이어도 발행 콘텐츠가 있으면 최신순으로 노출 (빈 히어로 방지)
  return (await listPublishedContents({ limit })).map(heroFromContent);
}

export async function listFeaturedContents(limit = 5): Promise<HeroItem[]> {
  if (!isSupabaseConfigured()) return devFallback({ curated: true, limit }).map(heroFromContent);
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('featured_contents')
    .select(
      `slot, content_id, tool_id,
       contents:content_id(slug, track, title, summary, thumbnail_url, read_min, job_tags, status, published_at, created_at),
       tools:tool_id(slug, category, name, description, thumbnail_url, status, created_at)`,
    )
    .eq('slot_type', 'hero')
    .eq('active', true)
    .or(`featured_from.is.null,featured_from.lte.${nowIso}`)
    .or(`featured_until.is.null,featured_until.gte.${nowIso}`)
    .order('slot', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('[listFeaturedContents]', error.message);
    return heroCuratedFallback(limit);
  }
  const items: HeroItem[] = ((data ?? []) as unknown as FeaturedJoinRow[])
    .map((r): HeroItem | null => {
      if (r.contents && r.contents.status === 'published') return heroFromContent(r.contents);
      if (r.tools && r.tools.status === 'published') {
        const t = r.tools;
        return { slug: t.slug, title: t.name, summary: t.description, track: TOOL_TRACK[t.category] ?? 'tool', thumbnail_url: t.thumbnail_url, read_min: null, job_tags: [], date: t.created_at ?? null };
      }
      return null;
    })
    .filter((x): x is HeroItem => x !== null);
  return items.length ? items : heroCuratedFallback(limit);
}

export async function getContentBySlug(slug: string): Promise<ContentRow | null> {
  const devHit = () => (IS_DEV ? caseSeed.find((c) => c.slug === slug) ?? null : null);
  if (!isSupabaseConfigured()) return devHit();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('contents')
    .select(PUBLIC_FIELDS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return ((data as unknown as ContentRow) ?? devHit()) as ContentRow | null;
}

export async function listRelated(content: Pick<ContentRow, 'id' | 'job_tags' | 'track'>, limit = 6): Promise<ContentRow[]> {
  const devFallbackRelated = (): ContentRow[] =>
    IS_DEV ? caseSeed.filter((c) => c.id !== content.id).slice(0, limit) : [];
  if (!isSupabaseConfigured()) return devFallbackRelated();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('contents')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .neq('id', content.id)
    .overlaps('job_tags', content.job_tags?.length ? content.job_tags : ['planning'])
    .order('published_at', { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as unknown as ContentRow[];
  return rows.length ? rows : devFallbackRelated();
}
