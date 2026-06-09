/**
 * prod 더미 제거 — seed-prod.ts로 넣었던 dev-seed 더미를 Caselab-prod에서 삭제.
 * 더미는 dev 전용(fallback)으로만 보이게 한다. 슬러그 기준 삭제라 admin으로 넣은
 * 실제 콘텐츠(다른 슬러그)는 보존된다.
 *
 * 실행:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/clear-seed-prod.ts
 *
 * 멱등: slug IN (...) delete. service key라 RLS 우회.
 * ⚠️ seed-prod.ts는 다시 실행하지 말 것(prod에 더미 재삽입됨).
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

async function delBySlug(table: string, slugs: string[]) {
  if (!slugs.length) return;
  const { error, count } = await sb
    .from(table)
    .delete({ count: 'exact' })
    .in('slug', slugs);
  if (error) {
    console.error(`✗ ${table} 삭제 실패:`, error.message);
    process.exit(1);
  }
  console.log(`✓ ${table}: ${count ?? 0}행 삭제 (대상 슬러그 ${slugs.length}개)`);
}

async function main() {
  const toolSlugs = [
    ...toolSeed.map((t) => t.slug),
    ...promptSeed.map((p) => p.slug),
    ...guideSeed.map((g) => g.slug),
  ];
  const contentSlugs = caseSeed.map((c) => c.slug).filter(Boolean);
  const productSlugs = productSeed.map((p) => p.slug);

  // tools가 reactions/saves에 FK(on delete cascade)로 걸려 있어 자동 정리됨.
  await delBySlug('tools', toolSlugs);
  await delBySlug('contents', contentSlugs);
  await delBySlug('products', productSlugs);
  console.log('완료. (dev는 fallback으로 더미 계속 표시, prod는 빈 상태)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
