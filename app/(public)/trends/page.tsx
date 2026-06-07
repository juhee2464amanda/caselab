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
        description="새 도구가 나오면 직접 써보고 솔직히 알려드려요."
      />
      <TrendsBrowser items={items} />
    </>
  );
}
