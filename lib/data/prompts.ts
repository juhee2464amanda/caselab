import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { PromptItem, PromptCategory } from '@/types/prompt';
import { PROMPT_CATEGORIES } from '@/types/prompt';
import { promptSeed } from './dev-seed';

const IS_DEV = process.env.NODE_ENV === 'development';

type ToolPromptRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pick_order: number | null;
  body: {
    prompt?: string;
    promptCategory?: string;
    source?: string;
    sourceUrl?: string;
  } | null;
};

function isPromptCategory(v: unknown): v is PromptCategory {
  return typeof v === 'string' && (PROMPT_CATEGORIES as readonly string[]).includes(v);
}

function mapPromptRow(r: ToolPromptRow): PromptItem {
  const b = r.body ?? {};
  return {
    id: r.id,
    slug: r.slug,
    title: r.name,
    description: r.description ?? undefined,
    prompt: b.prompt ?? '',
    category: isPromptCategory(b.promptCategory) ? b.promptCategory : 'think',
    source: b.source,
    sourceUrl: b.sourceUrl,
    pickOrder: r.pick_order ?? null,
  };
}

export async function listPrompts(): Promise<PromptItem[]> {
  if (!isSupabaseConfigured()) return IS_DEV ? promptSeed : [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tools')
    .select('id, slug, name, description, pick_order, body')
    .eq('category', 'prompt')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[listPrompts]', error.message);
    return IS_DEV ? promptSeed : [];
  }
  const rows = ((data ?? []) as unknown as ToolPromptRow[]).map(mapPromptRow);
  return rows.length ? rows : IS_DEV ? promptSeed : [];
}

export async function getPromptBySlug(slug: string): Promise<PromptItem | null> {
  const devHit = () =>
    IS_DEV ? promptSeed.find((p) => p.slug === slug) ?? null : null;
  if (!isSupabaseConfigured()) return devHit();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tools')
    .select('id, slug, name, description, pick_order, body')
    .eq('category', 'prompt')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) {
    console.warn('[getPromptBySlug]', error.message);
    return devHit();
  }
  const row = data as unknown as ToolPromptRow | null;
  return row ? mapPromptRow(row) : devHit();
}
