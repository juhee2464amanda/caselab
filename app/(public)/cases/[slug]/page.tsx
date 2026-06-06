import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContentBySlug, listRelated } from '@/lib/data/contents';
import { renderBlocks } from '@/lib/content-render';
import { AuthorQuote } from '@/components/content/AuthorQuote';
import { CommentThread } from '@/components/content/CommentThread';
import { LeftToc } from '@/components/content/LeftToc';
import { ContentHeader } from '@/components/content/ContentHeader';
import { RecommendSidebar } from '@/components/content/RecommendSidebar';
import { ActionsBar } from '@/components/content/ActionsBar';
import { ContentShareSection } from '@/components/content/ContentShareSection';
import { ExploreOtherContent } from '@/components/content/ExploreOtherContent';
import { ForWhoBox } from '@/components/content/ForWhoBox';
import { PainPointsGrid } from '@/components/content/PainPointsGrid';
import { FrameworkRefSection } from '@/components/content/FrameworkRefSection';
import { StepCard } from '@/components/content/StepCard';
import { ProsConsGrid } from '@/components/content/ProsConsGrid';
import { TakingPointsList } from '@/components/content/TakingPointsList';
import { DeepReadTracker } from '@/components/analytics/DeepReadTracker';

export const revalidate = 60;

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <>
      <div className="text-xs font-bold text-ink/40 tracking-[0.08em] mb-0.5">
        {num}
      </div>
      <h2 className="text-[22px] md:text-2xl font-extrabold tracking-[-0.025em] mb-5 break-keep">
        {title}
      </h2>
    </>
  );
}

function SectionLead({ text }: { text: string }) {
  return (
    <p className="text-[15px] text-ink/60 leading-[1.7] mb-4 max-w-[600px] break-keep">
      {text}
    </p>
  );
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  if (!content || content.track !== 'case') notFound();
  if (content.body.kind !== 'case') notFound();

  const body = content.body;
  const related = await listRelated(content);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/cases/${slug}`;

  return (
    <article>
      <DeepReadTracker contentId={content.id} />
      <div className="mx-auto max-w-[1200px] px-6 flex gap-0">
        <LeftToc />

        <div className="flex-1 min-w-0 max-w-[720px] mx-auto xl:px-10">
          <nav className="pt-6">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink hover:underline underline-offset-2 transition-colors py-1.5 -my-1.5"
            >
              ← 실전 케이스로
            </Link>
          </nav>

          <ContentHeader
            title={content.title}
            summary={content.summary}
            jobTags={content.job_tags}
            readMin={content.read_min}
            applyMin={content.apply_min}
            publishedAt={content.published_at}
          />

          {content.author_quote && <AuthorQuote quote={content.author_quote} />}

          <div className="prose-caselab">
            {/* 01. 이런 분들을 위한 글 */}
            {body.forWho && body.forWho.length > 0 && (
              <section id="s1" className="pt-2">
                <SectionHeader num="01" title="이런 분들을 위한 글이에요" />
                <ForWhoBox items={body.forWho} />
              </section>
            )}

            {/* 02. 어떤 케이스를 다루나요 */}
            {body.caseIntro && body.caseIntro.length > 0 && (
              <section id="s2" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num="02" title="어떤 케이스를 다루나요" />
                {renderBlocks(body.caseIntro, 'intro')}
              </section>
            )}

            {/* 03. 막히는 이유 */}
            {body.painPoints && body.painPoints.length > 0 && (
              <section id="s3" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num="03" title="보통 이런 일에서 막히는 이유" />
                <SectionLead text="실무에서 반복적으로 나오는 3가지 문제와, 그 근본 원인을 정리했습니다." />
                <PainPointsGrid items={body.painPoints} />
              </section>
            )}

            {/* 04. 적용한 Framework */}
            {body.frameworkReference && (
              <section id="s4" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num="04" title="적용한 Framework" />
                <SectionLead text="공통 원인을 푸는 사고법으로, 가설 중심 구조를 차용했습니다." />
                <FrameworkRefSection
                  reference={body.frameworkReference}
                  steps={body.stepCards}
                />
              </section>
            )}

            {/* 05. 단계별 AI 활용 */}
            {body.stepCards && body.stepCards.length > 0 && (
              <section id="s5" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num="05" title="단계별 AI 활용" />
                <SectionLead text='단계마다 사람이 먼저 손으로 만든 입력이 있어야 AI 출력이 쓸 만합니다. 각 단계는 "사람이 할 일 / AI에 시킬 일 / 프롬프트 / 결과 비교" 4개로 구성됩니다.' />
                <div className="flex flex-col gap-3.5 mt-3.5">
                  {body.stepCards.map((step) => (
                    <StepCard key={step.num} step={step} />
                  ))}
                </div>
              </section>
            )}

            {/* 06. 좋았던 점 · 아쉬웠던 점 */}
            {body.pros && body.cons && (
              <section id="s6" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num="06" title="좋았던 점 · 아쉬웠던 점" />
                <ProsConsGrid pros={body.pros} cons={body.cons} />
              </section>
            )}

            {/* 07. 핵심 Taking point */}
            {body.takingPoints && body.takingPoints.length > 0 && (
              <section id="s7" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num="07" title="핵심 Taking point" />
                <SectionLead text="이 글에서 가져갈 3가지. 본인 일에 바로 옮길 수 있는 액션도 함께." />
                <TakingPointsList items={body.takingPoints} />
              </section>
            )}

            {/* legacy fallback — 신규 필드 없는 콘텐츠는 기존 4섹션 본문 표시 */}
            {!body.forWho && !body.stepCards && (
              <section id="s1" className="pt-2">
                <SectionHeader num="01" title="본질" />
                {renderBlocks(body.essence, 'essence')}
                <div className="pt-11 mt-11 border-t border-border">
                  <SectionHeader num="02" title="Framework" />
                  <div className="space-y-10">
                    {body.framework.map((step, i) => (
                      <div key={i}>
                        <h3 className="text-lg font-bold mt-6 mb-2">
                          Step {i + 1}. {step.name}
                        </h3>
                        {step.description && (
                          <p className="text-sm text-ink/60 mb-3">
                            {step.description}
                          </p>
                        )}
                        {renderBlocks(step.blocks, `step-${i}`)}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          <ActionsBar />
          <ContentShareSection url={url} title={content.title} />
          <CommentThread contentId={content.id} />
          <ExploreOtherContent />
        </div>

        <RecommendSidebar items={related} />
      </div>
    </article>
  );
}
