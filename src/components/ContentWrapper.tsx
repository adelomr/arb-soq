'use client';

import React, { useEffect, useRef } from 'react';

interface ContentWrapperProps {
  html: string;
  className?: string;
}

function processButtons(container: HTMLElement) {
  // 1. Process Download Buttons — span[data-download-btn] → <a> wrapper
  const downloadSpans = container.querySelectorAll<HTMLElement>('span[data-download-btn]');
  downloadSpans.forEach(span => {
    if (span.parentElement?.tagName === 'A') return; // already wrapped
    const url = span.getAttribute('data-url') || '#';
    const anchor = document.createElement('a');
    anchor.href = `/redirect?url=${encodeURIComponent(url)}`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'download-btn-wrapper';
    span.parentNode?.insertBefore(anchor, span);
    anchor.appendChild(span);
  });

  // 2. Process Contact Buttons — span[data-contact-btn] → <a href="tel:" / "https://wa.me/"> wrapper
  const contactSpans = container.querySelectorAll<HTMLElement>('span[data-contact-btn]');
  contactSpans.forEach(span => {
    if (span.parentElement?.tagName === 'A') return; // already wrapped
    const type = span.getAttribute('data-contact-btn') || 'whatsapp';
    const phone = (span.getAttribute('data-phone') || '').replace(/\s+/g, '');
    const cleanPhone = phone.replace(/^\+/, '');

    let href = '#';
    if (type === 'whatsapp' && cleanPhone) {
      href = `https://wa.me/${cleanPhone}`;
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

  // Process buttons every time html changes (after DOM paint)
  useEffect(() => {
    if (!containerRef.current) return;
    processButtons(containerRef.current);
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
