import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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

  // 있는 섹션만 목차에 (모든 섹션 optional)
  const toc = (
    [
      body.what?.length && { id: 's1', label: '무슨 소식' },
      body.why?.length && { id: 's2', label: '왜 화두' },
      body.forWho?.length && { id: 's3', label: '누구한테' },
      body.keyPoints?.length && { id: 's4', label: '핵심 3가지' },
      body.deepDive?.length && { id: 's5', label: '더 들어가면' },
      body.soWhat?.length && { id: 's6', label: '내 일엔?' },
    ] as ({ id: string; label: string } | false | 0 | undefined)[]
  ).filter(Boolean) as { id: string; label: string }[];

  let n = 0;
  const num = () => String(++n).padStart(2, '0');

  return (
    <article>
      <DeepReadTracker contentId={content.id} />
      <div className="mx-auto max-w-[1200px] px-6 flex gap-0">
        <ToolToc items={toc} />

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
            {/* 무슨 소식이에요 */}
            {body.what && body.what.length > 0 && (
              <section id="s1" className="pt-2">
                <SectionHeader num={num()} title="무슨 소식이에요" />
                {renderBlocks(body.what, 'what', content.id)}
              </section>
            )}

            {/* 왜 지금 화두예요 */}
            {body.why && body.why.length > 0 && (
              <section id="s2" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num={num()} title="왜 지금 화두예요" />
                {renderBlocks(body.why, 'why', content.id)}
              </section>
            )}

            {/* 누구한테 중요해요 */}
            {body.forWho && body.forWho.length > 0 && (
              <section id="s3" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num={num()} title="누구한테 중요해요" />
                <div className="grid gap-3 sm:grid-cols-2 mt-1">
                  {body.forWho.map((w, i) => (
                    <div key={i} className="rounded-xl border border-border bg-white p-4">
                      <div className="text-sm font-bold text-accent mb-1">{w.role}</div>
                      <div className="text-[13.5px] text-ink/70 leading-relaxed break-keep">{w.why}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 핵심 3가지 */}
            {body.keyPoints && body.keyPoints.length > 0 && (
              <section id="s4" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num={num()} title="핵심만 빠르게" />
                <ul className="flex flex-col gap-2.5 mt-1">
                  {body.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-[11px] font-bold text-accent">
                        {i + 1}
                      </span>
                      <span className="text-[15px] text-ink/80 leading-relaxed break-keep">{k}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 좀 더 들어가면 (선택) */}
            {body.deepDive && body.deepDive.length > 0 && (
              <section id="s5" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num={num()} title="좀 더 들어가면" />
                {renderBlocks(body.deepDive, 'deep', content.id)}
              </section>
            )}

            {/* 그래서, 내 일엔? */}
            {body.soWhat && body.soWhat.length > 0 && (
              <section id="s6" className="pt-11 mt-11 border-t border-border">
                <SectionHeader num={num()} title="그래서, 내 일엔?" />
                <div className="rounded-xl border border-accent/20 bg-accent-50/40 p-5">
                  {renderBlocks(body.soWhat, 'so', content.id)}
                </div>
              </section>
            )}

            {/* 출처·더 보기 */}
            {body.sources && body.sources.length > 0 && (
              <section className="pt-11 mt-11 border-t border-border">
                <div className="text-xs font-bold text-ink/40 tracking-[0.08em] mb-3">출처·더 보기</div>
                <ul className="flex flex-col gap-1.5">
                  {body.sources.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                      >
                        {s.label}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <ActionsBar contentId={content.id} />
          <ContentShareSection url={url} title={content.title} />
          <CommentThread contentId={content.id} />
          <ExploreOtherContent />
        </div>

        <RecommendSidebar items={related} />
      </div>
    </article>
  );
}
