import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { GuideItem, GuideCategory, GuideSourceType } from '@/types/guide';
import type { RichSection } from '@/types/content';
import { GUIDE_CATEGORIES } from '@/types/guide';
import { guideSeed } from './dev-seed';

const IS_DEV = process.env.NODE_ENV === 'development';

type ToolGuideRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  url: string | null;
  body: {
    guideCategory?: string;
    source?: string;
    sourceType?: string;
    thumbLabel?: string;
    thumbImage?: string;
    thumbBg?: string;
    thumbColor?: string;
    linkLabel?: string;
    bodyRich?: string;
    images?: { url: string; caption?: string }[];
    sections?: RichSection[];
  } | null;
};

function asCategory(v: unknown): GuideCategory {
  return typeof v === 'string' && (GUIDE_CATEGORIES as readonly string[]).includes(v)
    ? (v as GuideCategory)
    : 'prompt';
}

function asSourceType(v: unknown): GuideSourceType {
  return v === 'github' || v === 'course' ? v : 'default';
}

function mapGuideRow(r: ToolGuideRow): GuideItem {
  const b = r.body ?? {};
  return {
    id: r.id,
    slug: r.slug,
    title: r.name,
    description: r.description ?? '',
    url: r.url ?? '#',
    category: asCategory(b.guideCategory),
    source: b.source ?? '공식 문서',
    sourceType: asSourceType(b.sourceType),
    thumbLabel: b.thumbLabel ?? r.name,
    thumbImage: b.thumbImage,
    thumbBg: b.thumbBg,
    thumbColor: b.thumbColor,
    linkLabel: b.linkLabel,
    bodyRich: b.bodyRich,
    images: Array.isArray(b.images) ? b.images.filter((im) => im && typeof im.url === 'string' && im.url) : undefined,
    sections: Array.isArray(b.sections) ? b.sections.filter((s) => s && Array.isArray(s.blocks) && s.blocks.length) : undefined,
  };
}

export async function listGuides(): Promise<GuideItem[]> {
  if (!isSupabaseConfigured()) return IS_DEV ? guideSeed : [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tools')
    .select('id, slug, name, description, url, body')
    .in('category', ['guide', 'context-card'])
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[listGuides]', error.message);
    return IS_DEV ? guideSeed : [];
  }
  const rows = ((data ?? []) as unknown as ToolGuideRow[]).map(mapGuideRow);
  return rows.length ? rows : IS_DEV ? guideSeed : [];
}

export async function getGuideBySlug(slug: string): Promise<GuideItem | null> {
  const devHit = () => (IS_DEV ? guideSeed.find((g) => g.slug === slug) ?? null : null);
  if (!isSupabaseConfigured()) return devHit();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tools')
    .select('id, slug, name, description, url, body')
    .in('category', ['guide', 'context-card'])
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) {
    console.warn('[getGuideBySlug]', error.message);
    return devHit();
  }
  const row = data as unknown as ToolGuideRow | null;
  return row ? mapGuideRow(row) : devHit();
}
