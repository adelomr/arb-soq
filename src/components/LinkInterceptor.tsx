'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

      // Never intercept tel: links or contact-btn-wrapper anchors
      if (href.startsWith('tel:')) return;
      if (anchor.classList.contains('contact-btn-wrapper')) return;

      // Intercept only absolute http/https links (external links)
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const url = new URL(href);
          const currentHost = window.location.host;

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
