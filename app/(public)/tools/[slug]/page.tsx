import { notFound } from 'next/navigation';
import { getToolBySlug, listTools } from '@/lib/data/tools';
import { ToolDetail } from '@/components/tools/ToolDetail';

export const revalidate = 60;

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
