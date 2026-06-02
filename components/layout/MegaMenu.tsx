import Link from 'next/link';
import { Wrench, MessageSquare, BookOpen } from 'lucide-react';

const CATEGORIES = [
  {
    href: '/tools',
    label: '도구',
    description: '실제로 써본 AI 도구 + 별로였던 후기',
    icon: Wrench,
  },
  {
    href: '/prompts',
    label: '프롬프트',
    description: '복붙해서 바로 쓰는 1000자 프롬프트',
    icon: MessageSquare,
  },
  {
    href: '/guides',
    label: '가이드',
    description: '맥락 카드·온보딩 같은 일하기 위한 자료',
    icon: BookOpen,
  },
];

interface Props {
  onClose: () => void;
}

export function MegaMenu({ onClose }: Props) {
  return (
    <div
      className="absolute left-1/2 top-full -translate-x-1/2 mt-1 w-[640px] rounded-lg border border-border bg-white shadow-elevated p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-md p-3 hover:bg-muted transition-colors"
          >
            <c.icon className="h-5 w-5 text-accent mb-2" />
            <div className="font-medium text-sm text-ink">{c.label}</div>
            <p className="text-xs text-ink/60 mt-0.5 leading-relaxed">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
