import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ContentRow } from '@/types/content';
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

/**
 * Hero 큐레이션 — admin이 featured_contents(slot_type='hero')에 배정한 슬롯을 읽는다.
 * - active=true + 예약 노출 창(featured_from<=now<=featured_until, null=상시) 필터.
 * - slot 순서대로 정렬, contents는 published만(!inner).
 * - 비어있거나(예약 만료/미배정) Supabase 미구성이면 contents.curated 폴백.
 *   → admin 큐레이션이 비로소 공개 Hero에 반영됨 (이전엔 curated 플래그만 봤음).
 */
export async function listFeaturedContents(limit = 5): Promise<ContentRow[]> {
  if (!isSupabaseConfigured()) return devFallback({ curated: true, limit });
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('featured_contents')
    .select(`slot, contents:content_id!inner(${PUBLIC_FIELDS})`)
    .eq('slot_type', 'hero')
    .eq('active', true)
    .eq('contents.status', 'published')
    .or(`featured_from.is.null,featured_from.lte.${nowIso}`)
    .or(`featured_until.is.null,featured_until.gte.${nowIso}`)
    .order('slot', { ascending: true })
    .limit(limit);
  if (error) {
    console.warn('[listFeaturedContents]', error.message);
    return listPublishedContents({ curated: true, limit });
  }
  const rows = (data ?? []) as unknown as Array<{ contents: ContentRow }>;
  const contents = rows.map((r) => r.contents).filter(Boolean);
  return contents.length ? contents : listPublishedContents({ curated: true, limit });
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
