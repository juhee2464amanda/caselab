/**
 * 출시용 prod 콘텐츠 시드 — dev-seed를 Caselab-prod에 transform + upsert.
 *
 * 실행:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-prod.ts
 *
 * 멱등: onConflict=slug 로 재실행 안전. service key라 RLS 우회.
 * dev-seed 타입 ≠ DB 행 → 아래 transform 참고.
 */
import { createClient } from '@supabase/supabase-js';
import {
  toolSeed,
  promptSeed,
  guideSeed,
  productSeed,
  caseSeed,
} from '../lib/data/dev-seed';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // 1) tool_subcategory slug → id 맵
  const { data: cats, error: catErr } = await sb
    .from('categories')
    .select('id, slug')
    .eq('type', 'tool_subcategory');
  if (catErr) throw catErr;
  const subId = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  // 2) tools (category='tool' + subcategory_id) — toolSeed
  const toolRows = toolSeed.map((t) => ({
    slug: t.slug,
    name: t.name,
    category: 'tool',
    subcategory_id: subId.get(t.category) ?? null,
    description: t.description,
    url: t.url ?? null,
    thumbnail_url: t.thumbnail_url,
    thumbnail_emoji: t.thumbnail_emoji ?? null,
    pricing_label: t.pricing_label ?? null,
    is_paid: t.is_paid ?? null,
    pro_pricing: t.pro_pricing ?? null,
    has_review: t.has_review ?? false,
    body: t.body ?? {},
    status: 'published',
  }));

  // 3) prompts (category='prompt', body=prompt 본문) — promptSeed
  const promptRows = promptSeed.map((p) => ({
    slug: p.slug,
    name: p.title,
    category: 'prompt',
    description: null,
    body: {
      prompt: p.prompt,
      promptCategory: p.category,
      source: p.source ?? null,
      sourceUrl: p.sourceUrl ?? null,
    },
    status: 'published',
  }));

  // 4) guides (category='guide', url+body) — guideSeed
  const guideRows = guideSeed.map((g) => ({
    slug: g.slug,
    name: g.title,
    category: 'guide',
    description: g.description,
    url: g.url,
    body: {
      guideCategory: g.category,
      source: g.source,
      sourceType: g.sourceType,
      thumbLabel: g.thumbLabel,
      thumbBg: g.thumbBg ?? null,
      thumbColor: g.thumbColor ?? null,
      linkLabel: g.linkLabel ?? null,
    },
    status: 'published',
  }));

  // 5) products (ebook) — productSeed
  const productRows = productSeed.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    type: 'ebook',
    price: p.price,
    thumbnail_url: p.thumbnail_url,
    body: p.body ?? {},
    status: 'active',
  }));

  // 6) contents (case/trend) — caseSeed (빈 slug 제외)
  const contentRows = caseSeed
    .filter((c) => c.slug)
    .map((c) => ({
      slug: c.slug,
      track: c.track,
      title: c.title,
      summary: c.summary,
      body: c.body,
      job_tags: c.job_tags,
      persona_coverage: c.persona_coverage,
      read_min: c.read_min,
      apply_min: c.apply_min,
      status: 'published',
      curated: c.curated ?? false,
      thumbnail_url: c.thumbnail_url,
      author_quote: c.author_quote ?? null,
      published_at: c.published_at,
    }));

  // upsert 실행
  const steps: [string, string, unknown[]][] = [
    ['tools(tool)', 'tools', toolRows],
    ['tools(prompt)', 'tools', promptRows],
    ['tools(guide)', 'tools', guideRows],
    ['products', 'products', productRows],
    ['contents', 'contents', contentRows],
  ];
  for (const [label, table, rows] of steps) {
    if (!rows.length) {
      console.log(`- ${label}: 0건 (스킵)`);
      continue;
    }
    const { error } = await sb.from(table).upsert(rows as never, { onConflict: 'slug' });
    if (error) {
      console.error(`✗ ${label} 실패:`, error.message);
      process.exit(1);
    }
    console.log(`✓ ${label}: ${rows.length}건 upsert`);
  }
  console.log('완료.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
