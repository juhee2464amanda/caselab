import Link from 'next/link';

const TABS = [
  { href: '/mypage/profile', label: '프로필' },
  { href: '/mypage/saved', label: '저장' },
  { href: '/mypage/liked', label: '좋아요' },
  { href: '/mypage/subscriptions', label: '구독' },
  { href: '/mypage/ebooks', label: '구매한 전자책' },
  { href: '/mypage/support', label: '고객센터' },
];

export default function MypageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="container-wide py-10">
      <h1 className="font-serif text-3xl font-semibold mb-6">마이페이지</h1>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside>
          <ul className="space-y-1">
            {TABS.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="block px-3 py-2 rounded-md text-sm hover:bg-muted text-ink/80"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
