'use client';

import { useEffect, useRef } from 'react';
import { incrementPageViews } from '@/lib/page-service';
import { handleIncrementPageViews } from '@/app/actions';

interface Props {
  pageId?: string;
}

export default function PageViewIncrementer({ pageId }: Props) {
  const incrementedRef = useRef(false);

  useEffect(() => {
    if (pageId && !incrementedRef.current) {
      incrementedRef.current = true;
      // Try direct client-side update first, with fallback to server action
      incrementPageViews(pageId).catch(() => {
        handleIncrementPageViews(pageId).catch((err) => {
          console.error('Failed to increment views:', err);
        });
      });
    }
  }, [pageId]);

  return null;
}
