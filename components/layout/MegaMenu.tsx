import Link from 'next/link';
import { TrendingUp, SlidersHorizontal, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MegaMenu — mockup index.html / cases.html 의 .mega-menu 정합 (2026-06-06)
 *
 * 4 카드 = AI 트렌드 / 쓸만한 AI 도구 / 공식 가이드 / Caselab 도구(soon)
 * hover 안정화: 가짜 영역 (h-6) + GNB의 250ms 닫힘 지연 (mockup ::before + setTimeout 패턴)
 */

type Category = {
  href: string;
  label: string;
  description: string;
  icon: typeof TrendingUp;
  soon?: boolean;
};

const CATEGORIES: Category[] = [
  {
    href: '/trends',
    label: 'AI 트렌드',
    description: '요즘 떠오르는 AI 트렌드',
    icon: TrendingUp,
  },
  {
    href: '/tools',
    label: '쓸만한 AI 도구',
    description: '써보고 골라낸 것만',
    icon: SlidersHorizontal,
  },
  {
    href: '/guides',
    label: '공식 가이드',
    description: 'OpenAI·Anthropic 공식 문서',
    icon: BookOpen,
  },
  {
    href: '#',
    label: 'Caselab 도구',
    description: '곧 공개합니다',
    icon: Sparkles,
    soon: true,
  },
];

interface Props {
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MegaMenu({ onClose, onMouseEnter, onMouseLeave }: Props) {
  return (
    <div
      className="absolute left-1/2 top-full -translate-x-1/2 z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 가짜 hover 영역 — 트리거와 메뉴 사이 공백 hover 유지 */}
      <div className="h-6" />
      <div className="w-[900px] rounded-xl border border-border bg-white shadow-elevated p-4 animate-fade-in">
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              onClick={(e) => {
                if (c.soon) e.preventDefault();
                else onClose();
              }}
              className={cn(
                'flex items-center gap-3.5 px-4 py-4 border rounded-xl transition-all',
                c.soon
                  ? 'opacity-70 cursor-default border-border'
                  : 'border-border hover:border-accent hover:shadow-[0_2px_12px_rgba(49,130,246,0.08)]'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-[10px] flex items-center justify-center flex-shrink-0',
                  'bg-gradient-to-br from-[#f3f4f6] to-[#fafafa]',
                  c.soon ? 'text-ink/40' : 'text-ink/70'
                )}
              >
                <c.icon className="w-[22px] h-[22px]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-[-0.02em] mb-0.5 text-ink">
                  {c.label}
                </div>
                <div
                  className={cn(
                    'text-xs',
                    c.soon ? 'text-ink/30 font-semibold' : 'text-ink/50'
                  )}
                >
                  {c.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
