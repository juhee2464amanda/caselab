import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getContentBySlug, listRelated } from '@/lib/data/contents';
import { renderBlocks } from '@/lib/content-render';
import { ContentHeader } from '@/components/content/ContentHeader';
import { AuthorQuote } from '@/components/content/AuthorQuote';
import { ActionsBar } from '@/components/content/ActionsBar';
import { ContentShareSection } from '@/components/content/ContentShareSection';
import { CommentThread } from '@/components/content/CommentThread';
import { ExploreOtherContent } from '@/components/content/ExploreOtherContent';
import { RecommendSidebar } from '@/components/content/RecommendSidebar';
import { ToolToc } from '@/components/tools/ToolToc';
import { DeepReadTracker } from '@/components/analytics/DeepReadTracker';

export const revalidate = 60;

const TOC = [
  { id: 's1', label: '뭐가 나왔나' },
  { id: 's2', label: '직접 실험' },
  { id: 's3', label: '언제 쓸만·별로' },
];

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <>
      <div className="text-xs font-bold text-ink/40 tracking-[0.08em] mb-0.5">{num}</div>
      <h2 className="text-[22px] md:text-2xl font-extrabold tracking-[-0.025em] mb-5 break-keep">
        {title}
      </h2>
    </>
  );
}

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
    <article>
      <DeepReadTracker contentId={content.id} />
      <div className="mx-auto max-w-[1200px] px-6 flex gap-0">
        <ToolToc items={TOC} />

        <div className="flex-1 min-w-0 max-w-[720px] mx-auto xl:px-10">
          <nav className="pt-6">
            <Link
              href="/trends"
              className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink hover:underline underline-offset-2 transition-colors py-1.5 -my-1.5"
            >
              ← AI 트렌드로
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
            <section id="s1" className="pt-2">
              <SectionHeader num="01" title="뭐가 나왔나" />
              {renderBlocks(body.whats_new, 'new')}
            </section>

            <section id="s2" className="pt-11 mt-11 border-t border-border">
              <SectionHeader num="02" title="직접 실험해봤다" />
              {renderBlocks(body.experiment, 'exp')}
            </section>

            <section id="s3" className="pt-11 mt-11 border-t border-border">
              <SectionHeader num="03" title="언제 쓸만하고, 언제 별로인가" />
              <div className="grid gap-3.5 md:grid-cols-2 mt-1">
                <div className="rounded-xl border border-[#03b26c]/25 bg-[#e8f8f0]/50 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#03b26c] mb-2">
                    쓸만한 케이스
                  </div>
                  {renderBlocks(body.verdict.useful, 'use')}
                </div>
                <div className="rounded-xl border border-[#f04452]/25 bg-[#fdecef]/50 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f04452] mb-2">
                    별로인 케이스
                  </div>
                  {renderBlocks(body.verdict.notUseful, 'nuse')}
                </div>
              </div>
            </section>
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
