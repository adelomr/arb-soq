'use client';

import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppDownloadButtonProps {
  className?: string;
  variant?: 'default' | 'compact' | 'footer' | 'header';
  onClick?: () => void;
}

export default function AppDownloadButton({ className, variant = 'default', onClick }: AppDownloadButtonProps) {
  const isCompact = variant === 'compact' || variant === 'header';

  return (
    <a
      href="https://arab-store.allqaqasyana.com/store-item?id=com.arb.soq"
      target="_blank"
      rel="noopener noreferrer no-redirect"
      data-contact-btn="true"
      onClick={onClick}
      className={cn(
        'app-download-btn relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full transition-all duration-300',
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs hover:shadow-md',
        'hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 group font-medium',
        isCompact ? 'px-2.5 py-1 text-2xs sm:text-xs h-7 sm:h-8' : 'px-3 py-1 text-xs h-7.5 sm:h-8',
        className
      )}
    >
      {/* Animated sheen / shine effect */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      <Smartphone className={cn('transition-transform duration-300 group-hover:scale-110 flex-shrink-0', isCompact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5')} />

      <span className={cn('font-bold tracking-wide z-10 truncate', isCompact ? 'text-2xs sm:text-xs' : 'text-xs')}>
        تطبيق سوق العرب
      </span>
    </a>
  );
}
