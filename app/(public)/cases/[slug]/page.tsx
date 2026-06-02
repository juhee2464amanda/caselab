import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContentBySlug, listRelated } from '@/lib/data/contents';
import { renderBlocks } from '@/lib/content-render';
import { TimeBadge } from '@/components/content/TimeBadge';
import { JobTags } from '@/components/content/JobTags';
import { PersonaCoverageBadge } from '@/components/content/PersonaCoverageBadge';
import { AuthorQuote } from '@/components/content/AuthorQuote';
import { CustomizationChecklist } from '@/components/content/CustomizationChecklist';
import { FailureSection } from '@/components/content/FailureSection';
import { IntentBox } from '@/components/content/IntentBox';
import { ShareButtons } from '@/components/content/ShareButtons';
import { RelatedSidebar } from '@/components/content/RelatedSidebar';
import { RelatedCarousel } from '@/components/content/RelatedCarousel';
import { CommentThread } from '@/components/content/CommentThread';
import { DeepReadTracker } from '@/components/analytics/DeepReadTracker';

export const revalidate = 60;

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
    <article className="container-wide py-10">
      <DeepReadTracker contentId={content.id} />
      <nav className="text-xs text-ink/50 mb-6">
        <Link href="/cases" className="hover:text-ink">← 실전 케이스로</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <main className="max-w-2xl">
          <header className="mb-8">
            <PersonaCoverageBadge personas={content.persona_coverage} className="mb-3" />
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
              {content.title}
            </h1>
            {content.summary && (
              <p className="mt-3 text-lg text-ink/70 leading-relaxed">{content.summary}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <TimeBadge readMin={content.read_min} applyMin={content.apply_min} />
                <JobTags tags={content.job_tags} />
              </div>
              <ShareButtons url={url} title={content.title} />
            </div>
          </header>

          {content.author_quote && <AuthorQuote quote={content.author_quote} />}

          <section className="prose-caselab">
            <h2 className="font-serif text-2xl font-semibold mt-10 mb-3">1. 본질</h2>
            {renderBlocks(body.essence, 'essence')}

            <h2 className="font-serif text-2xl font-semibold mt-12 mb-3">2. Framework</h2>
            <div className="space-y-10">
              {body.framework.map((step, i) => (
                <div key={i}>
                  <h3 className="font-serif text-xl font-semibold mt-6 mb-1">
                    Step {i + 1}. {step.name}
                  </h3>
                  {step.description && (
                    <p className="text-sm text-ink/60 mb-2">{step.description}</p>
                  )}
                  <IntentBox step={i + 1} text={step.intent} />
                  {renderBlocks(step.blocks, `step-${i}`)}
                </div>
              ))}
            </div>

            <FailureSection title="3. 별로였던 사례 — 솔직히 말하면">
              {renderBlocks(body.failures, 'fail')}
            </FailureSection>

            <h2 className="font-serif text-2xl font-semibold mt-12 mb-3">4. 솔직한 후기</h2>
            {renderBlocks(body.review, 'review')}

            <CustomizationChecklist items={body.customization} />
          </section>

          <RelatedCarousel items={related.slice(0, 6)} />
          <CommentThread contentId={content.id} />
        </main>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <RelatedSidebar items={related.slice(0, 5)} />
        </aside>
      </div>
    </article>
  );
}
