import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { GuideItem, GuideCategory, GuideSourceType } from '@/types/guide';
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
    thumbBg?: string;
    thumbColor?: string;
    linkLabel?: string;
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
    thumbBg: b.thumbBg,
    thumbColor: b.thumbColor,
    linkLabel: b.linkLabel,
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
