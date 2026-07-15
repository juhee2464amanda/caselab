import { renderBlocks } from '@/lib/content-render';
import type { RichSection } from '@/types/content';

/**
 * 자유 리치 섹션 렌더 — 도구·케이스·프롬프트·가이드 상세 공통.
 * 운영자가 관리자에서 추가한 이미지·갤러리·북마크·문단 섹션을
 * 고정 섹션 뒤에 순서대로 렌더한다. label(eyebrow)·heading(h2)은 선택.
 * 블록이 없는 섹션은 건너뛴다.
 */
export function RichSections({
  sections,
  keyPrefix = 'section',
  contentId,
}: {
  sections?: RichSection[] | null;
  keyPrefix?: string;
  contentId?: string;
}) {
  const list = (sections ?? []).filter((s) => s.blocks?.length);
  if (!list.length) return null;

  return (
    <>
      {list.map((s, i) => (
        <section
          key={i}
          id={`${keyPrefix}-${i}`}
          className="pt-11 mt-11 border-t border-border scroll-mt-20"
        >
          {s.label && (
            <div className="text-xs font-bold text-ink/40 tracking-[0.08em] mb-0.5">{s.label}</div>
          )}
          {s.heading && (
            <h2 className="text-[22px] md:text-2xl font-extrabold tracking-[-0.025em] mb-5 break-keep">
              {s.heading}
            </h2>
          )}
          {renderBlocks(s.blocks, `${keyPrefix}-${i}`, contentId)}
        </section>
      ))}
    </>
  );
}
