import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink';

/**
 * 무료 전자책 배포 배너 — mockup index L385~394 정합
 *
 * 그라데이션 배경 (#1e3a5f → #2563eb), 흰 글씨, 우측 CTA.
 */
export function FreeBookBanner() {
  return (
    <section
      className="bg-gradient-to-br text-white"
      style={{
        backgroundImage: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      }}
    >
      <div className="mx-auto max-w-[1100px] px-6 py-7 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-2">
            무료 배포 중
          </span>
          <h2 className="text-[22px] md:text-[26px] font-extrabold leading-tight tracking-tight keepall mb-1">
            AI, 누구나 쉽게 시작할 수 있도록
          </h2>
          <p className="text-sm text-white/70 keepall">
            첫 번째 ebook을 무료로 드립니다. 다운로드 후 바로 읽어보세요.
          </p>
        </div>
        <TrackedCtaLink
          href="/ebooks"
          label="free_ebook_banner"
          className="inline-flex items-center text-[15px] font-bold text-ink bg-white hover:bg-muted px-7 py-3 rounded-[10px] transition-colors whitespace-nowrap shrink-0 tracking-tight"
        >
          무료로 받기 →
        </TrackedCtaLink>
      </div>
    </section>
  );
}
