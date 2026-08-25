import { createSupabaseAnonClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { ProductRow } from '@/types/product';
import { productSeed } from './dev-seed';

const IS_DEV = process.env.NODE_ENV === 'development';
const FIELDS = 'id, slug, title, description, price, thumbnail_url, body';

export async function listProducts(): Promise<ProductRow[]> {
  if (!isSupabaseConfigured()) return IS_DEV ? productSeed : [];
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from('products')
    .select(FIELDS)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[listProducts]', error.message);
    return IS_DEV ? productSeed : [];
  }
  const rows = (data ?? []) as unknown as ProductRow[];
  return rows.length ? rows : IS_DEV ? productSeed : [];
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const devHit = () => (IS_DEV ? productSeed.find((p) => p.slug === slug) ?? null : null);
  if (!isSupabaseConfigured()) return devHit();
  const supabase = createSupabaseAnonClient();
  const { data } = await supabase
    .from('products')
    .select(FIELDS)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  return (data as unknown as ProductRow) ?? devHit();
}
