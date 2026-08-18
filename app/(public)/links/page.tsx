import Link from 'next/link';
import { Instagram, Mail, BookOpen } from 'lucide-react';
import { listPublishedContents } from '@/lib/data/contents';
import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/lib/constants';

export const revalidate = 60;

const LINKS = [
  { href: '/cases', label: '실전 케이스 보기' },
  { href: '/trends', label: 'AI 트렌드 보기' },
  { href: '/ebooks', label: '무료 전자책 받기', icon: BookOpen },
  { href: '/opinions/new', label: '의견 보내기', icon: Mail },
];

export default async function LinksPage() {
  const recent = await listPublishedContents({ limit: 3 });

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-accent mx-auto mb-3 grid place-items-center text-white font-serif text-2xl font-bold">
            C
          </div>
          <h1 className="font-serif text-2xl font-bold">{INSTAGRAM_HANDLE}</h1>
          <p className="mt-1 text-sm text-ink/60">일이 풀리는 AI 사용법</p>
        </div>

        <div className="space-y-2">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 card p-4 hover:shadow-elevated transition-shadow"
              >
                {Icon && <Icon className="h-4 w-4 text-accent" />}
                <span className="text-sm font-medium">{l.label}</span>
              </Link>
            );
          })}
        </div>

        {recent.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-3">
              최근 콘텐츠
            </h2>
            <ul className="space-y-2">
              {recent.map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/${it.track === 'case' ? 'cases' : 'trends'}/${it.slug}`}
                    className="card p-3 flex gap-3 hover:shadow-elevated"
                  >
                    {it.thumbnail_url ? (
                      <img src={it.thumbnail_url} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-2 leading-snug">{it.title}</p>
                      <p className="text-xs text-ink/50 mt-0.5">읽기 {it.read_min}분</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex w-full items-center justify-center gap-2 text-ink/60 hover:text-ink text-sm"
        >
          <Instagram className="h-4 w-4" /> instagram.com/ai_caselab
        </a>
      </div>
    </div>
  );
}
