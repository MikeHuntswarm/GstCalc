import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClass =
    variant === 'outline'
      ? 'border border-slate-300 text-slate-700'
      : variant === 'warning'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-blue-100 text-blue-800';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
        variantClass,
        className,
      )}
      {...props}
    />
  );
}
