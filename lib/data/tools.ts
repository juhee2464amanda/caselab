import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Tool, ToolCategory } from '@/types/tool';
import { toolSeed } from './dev-seed';

const IS_DEV = process.env.NODE_ENV === 'development';
const PUBLIC_FIELDS =
  'id, slug, name, category, description, thumbnail_url, pricing_label, is_paid, pro_pricing, has_review, status, created_at';

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
  if (opts.category) query = query.eq('category', opts.category);
  const { data, error } = await query;
  if (error) {
    console.warn('[listTools]', error.message);
    return devFallback(opts);
  }
  const rows = (data ?? []) as unknown as Tool[];
  return rows.length ? rows : devFallback(opts);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const devHit = () =>
    IS_DEV ? toolSeed.find((t) => t.slug === slug) ?? null : null;
  if (!isSupabaseConfigured()) return devHit();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('tools')
    .select(PUBLIC_FIELDS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return ((data as unknown as Tool) ?? devHit()) as Tool | null;
}
