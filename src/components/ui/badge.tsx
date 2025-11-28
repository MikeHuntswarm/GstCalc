import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClass =
    variant === 'outline'
      ? 'border border-muted text-muted-foreground bg-white'
      : variant === 'warning'
        ? 'bg-warning/10 text-warning-foreground'
        : 'bg-primary/10 text-primary';

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
