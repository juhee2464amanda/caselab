import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPromptBySlug, listPrompts } from '@/lib/data/prompts';
import { PromptDetail } from '@/components/prompts/PromptDetail';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // 한글 슬러그 — App Router params는 퍼센트 인코딩된 채로 온다.
  const prompt = await getPromptBySlug(decodeURIComponent(slug));
  if (!prompt) return {};
  // DM 공유 미리보기 — 제목/설명이 OG 카드에 노출된다.
  const description = prompt.description ?? '복사 한 번이면 끝. 실무에서 검증된 프롬프트.';
  return {
    title: `${prompt.title} | 바로 쓰는 프롬프트`,
    description,
    openGraph: {
      title: prompt.title,
      description,
    },
  };
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prompt = await getPromptBySlug(decodeURIComponent(slug));
  if (!prompt) notFound();

  const related = (await listPrompts())
    .filter((p) => p.category === prompt.category && p.slug !== prompt.slug)
    .slice(0, 4);

  return <PromptDetail prompt={prompt} related={related} />;
}
