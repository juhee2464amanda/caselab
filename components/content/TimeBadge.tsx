import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  readMin: number;
  className?: string;
}

export function TimeBadge({ readMin, className }: Props) {
  return (
    <div className={cn('inline-flex items-center gap-3 text-sm', className)}>
      <span className="inline-flex items-center gap-1 text-ink/70">
        <Clock className="h-3.5 w-3.5" />
        읽기 {readMin}분
      </span>
    </div>
  );
}
