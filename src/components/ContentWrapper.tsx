'use client';

import React, { useEffect, useRef } from 'react';
import { formatWhatsAppNumber } from '../lib/utils';

interface ContentWrapperProps {
  html: string;
  className?: string;
}

function processButtons(container: HTMLElement) {
  // 1. Process Download Buttons — span[data-download-btn] / .download-btn-custom → <a> wrapper
  const downloadSpans = container.querySelectorAll<HTMLElement>(
    'span[data-download-btn], [data-download-btn], span.download-btn-custom, .download-btn-custom'
  );

  downloadSpans.forEach(span => {
    // Remove contenteditable="false" because it suppresses click/link events in Blink/WebKit
    span.removeAttribute('contenteditable');
    span.style.cursor = 'pointer';

    const parent = span.parentElement;
    if (parent?.tagName === 'A') {
      // Already wrapped in anchor, ensure proper attributes and href
      const currentHref = parent.getAttribute('href') || '';
      const url = span.getAttribute('data-url') || currentHref;
      if (url && url !== '#' && !currentHref.startsWith('/redirect')) {
        parent.setAttribute('href', `/redirect?url=${encodeURIComponent(url)}`);
      }
      parent.setAttribute('target', '_blank');
      parent.setAttribute('rel', 'noopener noreferrer');
      if (!parent.classList.contains('download-btn-wrapper')) {
        parent.classList.add('download-btn-wrapper');
      }
      return;
    }

    const url = span.getAttribute('data-url') || '#';
    if (!url || url === '#') return;

    const anchor = document.createElement('a');
    anchor.href = `/redirect?url=${encodeURIComponent(url)}`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'download-btn-wrapper';
    anchor.style.textDecoration = 'none';
    anchor.style.display = 'inline-flex';
    anchor.style.cursor = 'pointer';

    span.parentNode?.insertBefore(anchor, span);
    anchor.appendChild(span);
  });

  // 2. Process Contact Buttons — span[data-contact-btn] → <a href="tel:" / "https://wa.me/"> wrapper
  const contactSpans = container.querySelectorAll<HTMLElement>(
    'span[data-contact-btn], [data-contact-btn], span.contact-btn-custom, .contact-btn-custom'
  );

  contactSpans.forEach(span => {
    span.removeAttribute('contenteditable');
    span.style.cursor = 'pointer';

    if (span.parentElement?.tagName === 'A') return; // already wrapped

    const type = span.getAttribute('data-contact-btn') || 'whatsapp';
    const phone = (span.getAttribute('data-phone') || '').replace(/\s+/g, '');

    let href = '#';
    if (type === 'whatsapp' && phone) {
      href = `https://wa.me/${formatWhatsAppNumber(phone)}`;
    } else if (type === 'call' && phone) {
      href = `tel:${phone}`;
    }

    const anchor = document.createElement('a');
    anchor.href = href;
    if (type === 'whatsapp') {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    anchor.className = 'contact-btn-wrapper';
    span.parentNode?.insertBefore(anchor, span);
    anchor.appendChild(span);
  });
}

export default function ContentWrapper({ html, className }: ContentWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process buttons whenever html changes or on mount
  useEffect(() => {
    if (!containerRef.current) return;
    processButtons(containerRef.current);
  }, [html]);

  // Click delegation handler: guarantees immediate response on click even if
  // React reconciliation or timing hasn't wrapped the DOM in <a> yet, or if
  // contenteditable blocked default anchor navigation.
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Download Button Click
    const downloadEl = target.closest<HTMLElement>(
      'span[data-download-btn], [data-download-btn], .download-btn-custom, .download-btn-wrapper'
    );
    if (downloadEl) {
      const rawUrl =
        downloadEl.getAttribute('data-url') ||
        (downloadEl.tagName === 'A' ? downloadEl.getAttribute('href') : '') ||
        downloadEl.querySelector('[data-url]')?.getAttribute('data-url') ||
        '';

      // If it's an anchor that already navigates to /redirect, let the browser handle it
      if (downloadEl.tagName === 'A' && rawUrl.startsWith('/redirect')) {
        return;
      }

      if (rawUrl && rawUrl !== '#' && !rawUrl.startsWith('javascript:')) {
        e.preventDefault();
        e.stopPropagation();

        const cleanUrl = rawUrl.startsWith('/redirect')
          ? rawUrl
          : `/redirect?url=${encodeURIComponent(rawUrl)}`;

        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    // 2. Contact Button Click (WhatsApp / Call)
    const contactEl = target.closest<HTMLElement>(
      'span[data-contact-btn], [data-contact-btn], .contact-btn-custom, .contact-btn-wrapper'
    );
    if (contactEl) {
      const type =
        contactEl.getAttribute('data-contact-btn') ||
        contactEl.querySelector('[data-contact-btn]')?.getAttribute('data-contact-btn') ||
        'whatsapp';
      const phone = (
        contactEl.getAttribute('data-phone') ||
        contactEl.querySelector('[data-phone]')?.getAttribute('data-phone') ||
        ''
      ).replace(/\s+/g, '');

      if (contactEl.tagName === 'A') {
        const href = contactEl.getAttribute('href') || '';
        if (href.startsWith('https://wa.me') || href.startsWith('tel:')) {
          return; // Let standard link behavior proceed
        }
      }

      if (type === 'whatsapp' && phone) {
        e.preventDefault();
        e.stopPropagation();
        window.open(`https://wa.me/${formatWhatsAppNumber(phone)}`, '_blank', 'noopener,noreferrer');
      } else if (type === 'call' && phone) {
        e.preventDefault();
        window.location.href = `tel:${phone}`;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={handleContainerClick}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

