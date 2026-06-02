export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-narrow py-12">
      {children}
    </div>
  );
}
