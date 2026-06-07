import { CategoryHero } from '@/components/cases/CategoryHero';
import { GuidesBrowser } from '@/components/guides/GuidesBrowser';
import { listGuides } from '@/lib/data/guides';

export const revalidate = 60;

export default async function GuidesPage() {
  const guides = await listGuides();
  return (
    <>
      <CategoryHero
        title="공식 가이드"
        description="OpenAI, Anthropic, Google 공식 문서와 업계가 신뢰하는 GitHub 자료들을 카테고리별로 정리했습니다."
      />
      <GuidesBrowser guides={guides} />
    </>
  );
}
