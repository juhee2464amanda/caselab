import Link from 'next/link';
import { Editable } from '@/components/admin/Editable';
import { EditableImage } from '@/components/admin/EditableImage';

/**
 * 일잘러의 AI 자료실 — 4 시리즈 카드 그리드 (mockup index L464~533)
 *
 * 시리즈: 쓸만한 AI 도구 / 바로 쓰는 프롬프트 / 공식 가이드 / AI 트렌드
 * 각 카드 = 썸네일(badge: 개수) + 시리즈명 + 설명 + 최근 추가 + 업데이트 시각
 */

export interface SeriesCard {
  /** site_content key 접두사 — 예: home.series.tools */
  k: string;
  href: string;
  name: string;
  desc: string;
  thumb: string;
  count: number;
  recentTitle: string | null;
  freshText: string;
}

export function SeriesGrid({ series }: { series: SeriesCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      {series.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className="group block border border-border rounded-[14px] overflow-hidden bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-ink/20 transition-all"
        >
          <div className="aspect-[4/3] overflow-hidden relative bg-muted">
            <EditableImage
              k={`${s.k}.thumb`}
              src={s.thumb || null}
              imgClassName="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
            />
            <span className="absolute top-2.5 left-2.5 text-[11px] font-bold text-white bg-black/55 backdrop-blur px-2 py-0.5 rounded">
              {s.count}개
            </span>
          </div>
          <div className="p-4 pb-4.5">
            <Editable
              as="h3"
              k={`${s.k}.name`}
              value={s.name}
              className="text-[17px] font-extrabold tracking-tight mb-1.5"
            />
            <Editable
              as="p"
              k={`${s.k}.desc`}
              value={s.desc}
              multiline
              className="text-[13px] text-ink/60 leading-snug keepall"
            />
            {s.recentTitle && (
              <div className="mt-3 pt-2.5 border-t border-muted flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-accent whitespace-nowrap shrink-0 tracking-tight">
                  최근 추가
                </span>
                <span className="text-[13px] font-semibold text-ink truncate min-w-0 flex-1 tracking-tight">
                  {s.recentTitle}
                </span>
              </div>
            )}
            <div className="mt-1.5 text-[11px] text-ink/50 tracking-tight">
              {s.freshText}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
