import { listPublishedContents } from '@/lib/data/contents';
import { CategoryHero } from '@/components/cases/CategoryHero';
import { TrendsBrowser } from '@/components/trends/TrendsBrowser';

export const revalidate = 60;

export default async function TrendsPage() {
  const items = await listPublishedContents({ track: 'trend' });
  return (
    <>
      <CategoryHero
        title="AI 트렌드"
        description="쏟아지는 AI 소식 중 일에 남는 것만. 실무자 눈으로 골라 정리했어요."
      />
      <TrendsBrowser items={items} />
    </>
  );
}
