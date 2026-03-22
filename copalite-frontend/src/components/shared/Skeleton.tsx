import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'card' | 'circle';
  count?: number;
}

export default function Skeleton({ className, variant = 'line', count = 1 }: SkeletonProps) {
  const baseClass = 'animate-pulse rounded bg-coal-800/60';

  const variantClass = {
    line: 'h-4 w-full',
    card: 'h-28 w-full rounded-xl',
    circle: 'h-10 w-10 rounded-full',
  }[variant];

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={clsx(baseClass, variantClass, className)} />
      ))}
    </div>
  );
}
