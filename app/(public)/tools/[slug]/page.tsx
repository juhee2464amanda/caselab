import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: tool } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!tool) notFound();

  return (
    <article className="container-narrow py-10">
      <Link href="/tools" className="text-xs text-ink/50 hover:text-ink mb-6 inline-block">
        ← 도구 목록으로
      </Link>
      <header className="mb-6 flex items-start gap-4">
        {tool.thumbnail_url ? (
          <img src={tool.thumbnail_url} alt="" className="h-16 w-16 rounded-md" />
        ) : (
          <div className="h-16 w-16 rounded-md bg-muted" />
        )}
        <div>
          <h1 className="font-serif text-3xl font-semibold">{tool.name}</h1>
          <span className="badge mt-1">{tool.pricing_tier}</span>
        </div>
      </header>
      <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">{tool.description}</p>
      {tool.url && (
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1 text-accent hover:underline"
        >
          공식 사이트 <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </article>
  );
}
