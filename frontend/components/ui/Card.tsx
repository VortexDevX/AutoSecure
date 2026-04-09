import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const baseClasses = 'glass-panel rounded-[22px]';
  const interactiveClasses = onClick
    ? 'cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(74,96,129,0.12)]'
    : '';

  return (
    <div className={clsx(baseClasses, interactiveClasses, className)} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={clsx('border-b border-white/45 px-4 py-4 text-slate-900', className)}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={clsx('px-4 py-4', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={clsx(
        'border-t border-slate-200/70 bg-[rgba(239,245,253,0.68)] px-4 py-4 backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={clsx('text-lg font-semibold tracking-[-0.02em] text-slate-900', className)}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return <p className={clsx('mt-1 text-sm text-slate-500', className)}>{children}</p>;
}

// Export all card components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;
