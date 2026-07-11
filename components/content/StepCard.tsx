import { renderInline } from '@/lib/inline-md';
import type { StepCard as StepCardType } from '@/types/content';
import { PromptInline } from './PromptInline';

export function StepCard({
  step,
  contentId,
}: {
  step: StepCardType;
  contentId?: string;
}) {
  return (
    <div className="p-6 bg-white border border-border rounded-2xl">
      <div className="pb-3.5 mb-4 border-b border-border flex items-center gap-2">
        <span className="inline-block text-[11px] font-bold text-ink/50 bg-muted px-2.5 py-1 rounded-full tracking-[0.04em]">
          Step {step.num}
        </span>
        <span className="text-[15px] font-bold text-ink tracking-[-0.02em]">
          — {step.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
        <div className="bg-muted rounded-xl p-4">
          <div className="text-[11px] font-bold text-ink/50 uppercase tracking-[0.06em] mb-1.5">
            사람이 할 일
          </div>
          <p className="text-sm text-ink/80 leading-[1.6]">{renderInline(step.human)}</p>
        </div>
        <div className="bg-muted rounded-xl p-4">
          <div className="text-[11px] font-bold text-ink/50 uppercase tracking-[0.06em] mb-1.5">
            AI에게 시킬 것
          </div>
          <p className="text-sm text-ink/80 leading-[1.6]">{renderInline(step.ai)}</p>
        </div>
      </div>

      <PromptInline content={step.prompt} contentId={contentId} label={step.label} />

      {(step.goodResult || step.badResult) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {step.goodResult && (
            <div className="bg-muted rounded-xl p-4 text-sm leading-[1.6]">
              <div className="text-xs font-bold text-ink/50 mb-2">✓ 잘된 것</div>
              <div className="text-ink/80 break-keep">{renderInline(step.goodResult)}</div>
            </div>
          )}
          {step.badResult && (
            <div className="bg-muted rounded-xl p-4 text-sm leading-[1.6]">
              <div className="text-xs font-bold text-ink/40 mb-2">
                ✗ 별로인 것
              </div>
              <div className="text-ink/80 break-keep">{renderInline(step.badResult)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
