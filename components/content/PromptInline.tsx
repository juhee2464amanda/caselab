'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function PromptInline({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative bg-muted rounded-xl font-mono text-[13px] leading-[1.7] text-ink p-5 pt-11 whitespace-pre-wrap overflow-x-auto mb-3.5">
      <button
        type="button"
        onClick={copy}
        className={cn(
          'absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md font-sans transition-colors',
          copied
            ? 'bg-ink/5 border border-border text-ink'
            : 'bg-white border border-border text-ink/60 hover:border-ink/40 hover:text-ink'
        )}
      >
        {copied ? '복사됨' : '복사'}
      </button>
      {content}
    </div>
  );
}
