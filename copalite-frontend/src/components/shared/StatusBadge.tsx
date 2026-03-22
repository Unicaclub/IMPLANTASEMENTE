import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  active: 'badge-success',
  completed: 'badge-success',
  done: 'badge-success',
  approved: 'badge-success',
  confirmed: 'badge-success',
  match: 'badge-success',
  running: 'badge-info',
  in_progress: 'badge-info',
  planned: 'badge-info',
  inferred: 'badge-info',
  pending: 'badge-warning',
  open: 'badge-warning',
  triaged: 'badge-warning',
  unvalidated: 'badge-warning',
  needs_review: 'badge-warning',
  partial_match: 'badge-warning',
  failed: 'badge-danger',
  cancelled: 'badge-danger',
  blocked: 'badge-danger',
  divergent: 'badge-danger',
  critical: 'badge-danger',
  dismissed: 'badge-neutral',
  archived: 'badge-neutral',
  inactive: 'badge-neutral',
  draft: 'badge-neutral',
  outdated: 'badge-neutral',
};

export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] || 'badge-neutral';
  return (
    <span className={clsx(style, className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
