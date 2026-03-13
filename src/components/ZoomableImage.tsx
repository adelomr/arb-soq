
'use client';

import Image from 'next/image';
import { useState, useRef, WheelEvent, MouseEvent, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { DialogClose } from '@/components/ui/dialog';

const t = {
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    reset: 'إعادة تعيين',
    close: 'إغلاق',
    previous: 'السابق',
    next: 'التالي',
  };

interface ZoomableImageProps {
  src: string;
  alt: string;
  gallery?: string[];
}

export default function ZoomableImage({ src, alt, gallery = [] }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const imageRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const imageSources = gallery.length > 0 ? gallery : [src];
  const [currentIndex, setCurrentIndex] = useState(() => {
    const initialIndex = imageSources.findIndex(s => s === src);
    return initialIndex >= 0 ? initialIndex : 0;
  });

  const currentSrc = imageSources[currentIndex];

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    handleReset();
  }, [currentSrc, handleReset]);

  const handleNext = useCallback(() => {
    if (imageSources.length > 1) {
      setCurrentIndex(prev => (prev + 1) % imageSources.length);
    }
  }, [imageSources.length]);

  const handlePrevious = useCallback(() => {
    if (imageSources.length > 1) {
      setCurrentIndex(prev => (prev - 1 + imageSources.length) % imageSources.length);
    }
  }, [imageSources.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'Escape') {
        const closeButton = document.querySelector('[data-radix-dialog-close]') as HTMLElement;
        closeButton?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (scale > 1) {
      isPanning.current = true;
      startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      if (imageRef.current) {
        imageRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    if (imageRef.current) {
      imageRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning.current) {
      setPosition({
        x: e.clientX - startPos.current.x,
        y: e.clientY - startPos.current.y,
      });
    }
  };

  const handleZoomIn = () => {
    setScale(s => Math.min(s + 0.2, 5));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div
      className="w-full h-full bg-black/80 flex items-center justify-center overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={imageRef}
        className="relative transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          cursor: scale > 1 ? 'grab' : 'default',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
        )}
        <Image
          src={currentSrc}
          alt={alt}
          width={1920}
          height={1080}
          className="max-w-full max-h-full object-contain pointer-events-none"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </div>

       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious} aria-label={t.previous}>
                <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label={t.zoomOut}>
                <ZoomOut className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} aria-label={t.reset}>
                <RotateCcw className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label={t.zoomIn}>
                <ZoomIn className="h-5 w-5" />
            </Button>
             <Button variant="outline" size="icon" onClick={handleNext} aria-label={t.next}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogClose asChild>
                <Button variant="destructive" size="icon" aria-label={t.close}>
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>
        </div>
    </div>
  );
}
