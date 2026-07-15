import { GNB } from '@/components/layout/GNB';
import { Footer } from '@/components/layout/Footer';
import { AdminEditProvider } from '@/components/admin/AdminEditProvider';
import { AdminBar } from '@/components/admin/AdminBar';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminEditProvider>
      <GNB />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <AdminBar />
    </AdminEditProvider>
  );
}
