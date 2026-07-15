import { TrackedCtaLink } from '@/components/analytics/TrackedCtaLink';
import { Editable } from '@/components/admin/Editable';

/**
 * 무료 전자책 배포 배너 — mockup index L385~394 정합
 *
 * 그라데이션 배경 (#1e3a5f → #2563eb), 흰 글씨, 우측 CTA.
 * 문구는 site_content 오버라이드(home.banner.*) 가능 — props 기본값은 현재 카피.
 */
interface Props {
  tag?: string;
  title?: string;
  desc?: string;
  cta?: string;
}

export function FreeBookBanner({
  tag = '무료 배포 중',
  title = 'AI, 누구나 쉽게 시작할 수 있도록',
  desc = '첫 번째 ebook을 무료로 드립니다. 다운로드 후 바로 읽어보세요.',
  cta = '무료로 받기 →',
}: Props) {
  return (
    <section
      className="bg-gradient-to-br text-white"
      style={{
        backgroundImage: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      }}
    >
      <div className="mx-auto max-w-[1100px] px-6 py-7 flex flex-wrap items-center justify-between gap-6">
        <div>
          <Editable
            k="home.banner.tag"
            value={tag}
            className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-2"
          />
          <Editable
            as="h2"
            k="home.banner.title"
            value={title}
            className="text-[22px] md:text-[26px] font-extrabold leading-tight tracking-tight keepall mb-1"
          />
          <Editable
            as="p"
            k="home.banner.desc"
            value={desc}
            className="text-sm text-white/70 keepall"
          />
        </div>
        <TrackedCtaLink
          href="/ebooks"
          label="free_ebook_banner"
          className="inline-flex items-center text-[15px] font-bold text-ink bg-white hover:bg-muted px-7 py-3 rounded-[10px] transition-colors whitespace-nowrap shrink-0 tracking-tight"
        >
          <Editable k="home.banner.cta" value={cta} />
        </TrackedCtaLink>
      </div>
    </section>
  );
}
