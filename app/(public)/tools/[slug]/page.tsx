import { notFound } from 'next/navigation';
import { getToolBySlug, listTools } from '@/lib/data/tools';
import { ToolDetail } from '@/components/tools/ToolDetail';

export const revalidate = 60;

// 빌드 시 프리렌더 없이 첫 요청 때 생성 → revalidate 주기로 ISR 캐시 (미지정 시 매 요청 동적 렌더)
export function generateStaticParams() {
  return [];
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const related = (await listTools({ category: tool.category }))
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 4);

  return <ToolDetail tool={tool} related={related} />;
}
