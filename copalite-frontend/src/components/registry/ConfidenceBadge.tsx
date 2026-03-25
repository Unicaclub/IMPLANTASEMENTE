import clsx from 'clsx';
import { CONFIDENCE_STATUS_LABELS, CONFIDENCE_STATUS_COLORS } from '@/types/registry';
import type { ConfidenceStatus } from '@/types/registry';

interface Props {
  readonly status: ConfidenceStatus;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

export default function ConfidenceBadge({ status, size = 'sm', className }: Props) {
  const color = CONFIDENCE_STATUS_COLORS[status] ?? 'badge-neutral';
  return (
    <span className={clsx(color, size === 'sm' ? 'text-[10px]' : 'text-xs', className)}>
      {CONFIDENCE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
