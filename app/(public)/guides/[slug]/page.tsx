import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGuideBySlug } from '@/lib/data/guides';
import { guideHasDetail } from '@/types/guide';
import { GuideDetail } from '@/components/guides/GuideDetail';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(decodeURIComponent(slug));
  if (!guide) return {};
  const description = guide.description || '공식이 큐레이션한 AI 학습 가이드.';
  return {
    title: `${guide.title} | 공식 가이드`,
    description,
    openGraph: { title: guide.title, description },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuideBySlug(decodeURIComponent(slug));
  // 상세 본문이 없는 가이드는 외부 링크 카드 전용 — 상세 페이지를 노출하지 않는다.
  if (!guide || !guideHasDetail(guide)) notFound();
  return <GuideDetail guide={guide} />;
}
