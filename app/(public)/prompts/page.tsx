import { CategoryHero } from '@/components/cases/CategoryHero';
import { PromptsBrowser } from '@/components/prompts/PromptsBrowser';
import { listPrompts } from '@/lib/data/prompts';

export const revalidate = 60;

export default async function PromptsPage() {
  const prompts = await listPrompts();
  return (
    <>
      <CategoryHero
        title="바로 쓰는 프롬프트"
        description="복사 한 번이면 끝. 출처를 밝혀 일 종류별로 정리했어요."
      />
      <PromptsBrowser prompts={prompts} />
    </>
  );
}
