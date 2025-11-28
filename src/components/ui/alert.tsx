import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warning' | 'destructive';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const variantClass =
    variant === 'warning'
      ? 'border-warning/40 bg-warning/10 text-warning-foreground'
      : variant === 'destructive'
        ? 'border-danger/40 bg-danger/10 text-danger-foreground'
        : 'border-muted bg-muted text-muted-foreground';

  return (
    <div
      className={cn('rounded-lg border px-4 py-3 text-sm leading-relaxed', variantClass, className)}
      {...props}
    />
  );
}
