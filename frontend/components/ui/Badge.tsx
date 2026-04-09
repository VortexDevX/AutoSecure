import { ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean; // Show colored dot before text
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}: BadgeProps) {
  const variantClasses = {
    default: 'border-slate-200/70 bg-white/70 text-slate-700',
    primary: 'border-primary/20 bg-primary/10 text-primary-700',
    secondary: 'border-slate-200/70 bg-slate-100/80 text-slate-600',
    success: 'border-emerald-200/60 bg-emerald-50/80 text-emerald-700',
    warning: 'border-amber-200/70 bg-amber-50/85 text-amber-700',
    danger: 'border-rose-200/70 bg-rose-50/85 text-rose-700',
    info: 'border-cyan-200/60 bg-cyan-50/80 text-cyan-700',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[10px] tracking-[0.18em]',
    md: 'px-3 py-1.5 text-[11px] tracking-[0.16em]',
    lg: 'px-3.5 py-1.5 text-xs tracking-[0.14em]',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-cyan-500',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase backdrop-blur-sm',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

// Preset badge components for common use cases
export function SuccessBadge({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="success" {...props}>
      {children}
    </Badge>
  );
}

export function WarningBadge({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="warning" {...props}>
      {children}
    </Badge>
  );
}

export function DangerBadge({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="danger" {...props}>
      {children}
    </Badge>
  );
}

export function InfoBadge({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="info" {...props}>
      {children}
    </Badge>
  );
}

export function PrimaryBadge({ children, ...props }: Omit<BadgeProps, 'variant'>) {
  return (
    <Badge variant="primary" {...props}>
      {children}
    </Badge>
  );
}

// Status-specific badges for policies
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, BadgeVariant> = {
    active: 'success',
    pending: 'warning',
    expired: 'danger',
    cancelled: 'danger',
    draft: 'secondary',
    done: 'success',
  };

  return (
    <Badge variant={statusMap[status.toLowerCase()] || 'default'} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
