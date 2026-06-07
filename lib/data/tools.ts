import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Tool, ToolCategory } from '@/types/tool';
import { toolSeed } from './dev-seed';

const IS_DEV = process.env.NODE_ENV === 'development';

// NOTE: DB의 tools.category = 자료 타입(tool/prompt/guide/context-card).
// 공개 /tools는 기능분류가 필요하므로 categories(type='tool_subcategory')를
// tools.subcategory_id FK로 join(!inner)해 그 slug를 Tool.category로 매핑해 노출한다.
// (기능분류 6종은 마이그레이션 0006에서 시드. !inner라 subcategory 없는 행은 자연히 제외)
const PUBLIC_FIELDS =
  'id, slug, name, description, thumbnail_url, thumbnail_emoji, ' +
  'pricing_label, is_paid, pro_pricing, has_review, status, created_at, ' +
  'subcategory:categories!tools_subcategory_id_fkey!inner(slug, label)';

// 상세 페이지용 — 카드 필드 + url + body(jsonb)
const DETAIL_FIELDS = PUBLIC_FIELDS + ', url, body';

type ToolEmbedRow = Omit<Tool, 'category'> & {
  subcategory: { slug: ToolCategory; label: string } | null;
};

function mapToolRow(r: ToolEmbedRow): Tool {
  const { subcategory, ...rest } = r;
  return { ...rest, category: subcategory!.slug };
}

type ListOpts = { category?: ToolCategory };

function applyToolFilters(items: Tool[], opts: ListOpts): Tool[] {
  if (!opts.category) return items;
  return items.filter((t) => t.category === opts.category);
}

function devFallback(opts: ListOpts): Tool[] {
  if (!IS_DEV) return [];
  return applyToolFilters(toolSeed, opts);
}

export async function listTools(opts: ListOpts = {}): Promise<Tool[]> {
  if (!isSupabaseConfigured()) return devFallback(opts);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('tools')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (opts.category) query = query.eq('subcategory.slug', opts.category);
  const { data, error } = await query;
  if (error) {
    console.warn('[listTools]', error.message);
    return devFallback(opts);
  }
  const rows = ((data ?? []) as unknown as ToolEmbedRow[])
    .filter((r) => r.subcategory)
    .map(mapToolRow);
  return rows.length ? rows : devFallback(opts);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const devHit = () =>
    IS_DEV ? toolSeed.find((t) => t.slug === slug) ?? null : null;
  if (!isSupabaseConfigured()) return devHit();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('tools')
    .select(DETAIL_FIELDS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  const row = data as unknown as ToolEmbedRow | null;
  if (!row?.subcategory) return devHit();
  return mapToolRow(row);
}
