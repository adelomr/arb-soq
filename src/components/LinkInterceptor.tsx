'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const EXCLUDED_HOSTS = [
  'arb-soq.com',
  'www.arb-soq.com',
  'arab-store.allqaqasyana.com',
  'allqaqasyana.com',
  'wa.me',
  'whatsapp.com',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'facebook.com',
  'fb.com',
  'fb.watch',
  'm.facebook.com',
  'instagram.com',
  'instagr.am',
  'twitter.com',
  'x.com',
  't.co',
  't.me',
  'telegram.org',
  'telegram.me',
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'snapchat.com',
  'linkedin.com',
  'pinterest.com',
  'threads.net',
];

function isExcludedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return EXCLUDED_HOSTS.some(domain => host === domain || host.endsWith('.' + domain));
}

export default function LinkInterceptor() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable interception on redirect page (avoid loops) and on admin pages (allow editors to test links)
    if (pathname === '/redirect' || pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest anchor tag
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Never intercept tel:, mailto:, or sms: links
      if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('sms:')) return;
      
      // Never intercept contact / social / app download buttons
      if (
        anchor.classList.contains('contact-btn-wrapper') ||
        anchor.classList.contains('contact-btn') ||
        anchor.classList.contains('whatsapp-btn') ||
        anchor.classList.contains('call-btn') ||
        anchor.classList.contains('social-btn') ||
        anchor.classList.contains('app-download-btn') ||
        anchor.hasAttribute('data-contact-btn') ||
        anchor.querySelector('[data-contact-btn]') ||
        anchor.getAttribute('rel')?.includes('no-redirect')
      ) return;

      // Intercept only absolute http/https links (external links)
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const url = new URL(href);
          const currentHost = window.location.host;

          // Exclude social media and messenger domains
          if (isExcludedHost(url.hostname)) return;

          // If the link host is different from the current website host, intercept it
          if (url.host !== currentHost) {
            e.preventDefault();
            
            const redirectUrl = `/redirect?url=${encodeURIComponent(href)}`;
            
            // Respect target="_blank"
            if (anchor.target === '_blank') {
              window.open(redirectUrl, '_blank');
            } else {
              window.location.href = redirectUrl;
            }
          }
        } catch (err) {
          console.error('Failed to parse URL in global click intercept:', err);
        }
      }
    };

    // Attach to document.body to intercept all dynamically rendered anchors as well
    document.body.addEventListener('click', handleGlobalClick);

    return () => {
      document.body.removeEventListener('click', handleGlobalClick);
    };
  }, [pathname]);

  return null;
}

