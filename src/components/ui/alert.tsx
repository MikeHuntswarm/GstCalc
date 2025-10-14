import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warning' | 'destructive';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const variantClass =
    variant === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : variant === 'destructive'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-slate-200 bg-slate-50 text-slate-900';

  return (
    <div
      className={cn('rounded-lg border px-4 py-3 text-sm leading-relaxed', variantClass, className)}
      {...props}
    />
  );
}
