import { ReactNode } from 'react';

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
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-gray-100 text-gray-700 border-gray-300',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
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
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
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
