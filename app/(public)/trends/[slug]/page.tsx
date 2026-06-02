import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContentBySlug, listRelated } from '@/lib/data/contents';
import { renderBlocks } from '@/lib/content-render';
import { TimeBadge } from '@/components/content/TimeBadge';
import { JobTags } from '@/components/content/JobTags';
import { PersonaCoverageBadge } from '@/components/content/PersonaCoverageBadge';
import { AuthorQuote } from '@/components/content/AuthorQuote';
import { ShareButtons } from '@/components/content/ShareButtons';
import { RelatedSidebar } from '@/components/content/RelatedSidebar';
import { RelatedCarousel } from '@/components/content/RelatedCarousel';
import { CommentThread } from '@/components/content/CommentThread';
import { DeepReadTracker } from '@/components/analytics/DeepReadTracker';

export const revalidate = 60;

export default async function TrendDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContentBySlug(slug);
  if (!content || content.track !== 'trend') notFound();
  if (content.body.kind !== 'trend') notFound();

  const body = content.body;
  const related = await listRelated(content);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/trends/${slug}`;

  return (
    <article className="container-wide py-10">
      <DeepReadTracker contentId={content.id} />
      <nav className="text-xs text-ink/50 mb-6">
        <Link href="/trends" className="hover:text-ink">← AI 트렌드로</Link>
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
            <h2 className="font-serif text-2xl font-semibold mt-10 mb-3">1. 뭐가 나왔나</h2>
            {renderBlocks(body.whats_new, 'new')}

            <h2 className="font-serif text-2xl font-semibold mt-12 mb-3">2. 직접 실험</h2>
            {renderBlocks(body.experiment, 'exp')}

            <h2 className="font-serif text-2xl font-semibold mt-12 mb-3">3. 언제 쓸만/별로</h2>
            <div className="my-4 rounded-md border border-green-200 bg-green-50/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">쓸만한 케이스</div>
              {renderBlocks(body.verdict.useful, 'use')}
            </div>
            <div className="my-4 rounded-md border border-red-200 bg-red-50/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-2">별로인 케이스</div>
              {renderBlocks(body.verdict.notUseful, 'nuse')}
            </div>
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
