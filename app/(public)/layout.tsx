import { GNB } from '@/components/layout/GNB';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <GNB />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </>
  );
}
