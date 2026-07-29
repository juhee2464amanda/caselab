import { GNB } from '@/components/layout/GNB';
import { CategoryChips } from '@/components/home/CategoryChips';
import { Footer } from '@/components/layout/Footer';
import { AdminEditProvider } from '@/components/admin/AdminEditProvider';
import { AdminBar } from '@/components/admin/AdminBar';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminEditProvider>
      <GNB />
      {/* 카테고리 칩 — 모바일 전용 sticky 내비. 레이아웃에 두어 페이지 이동 후에도 계속 노출 */}
      <CategoryChips />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <AdminBar />
    </AdminEditProvider>
  );
}
