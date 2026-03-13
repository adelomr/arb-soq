'use client';

import { Card } from './ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Megaphone } from 'lucide-react';

const translations = {
    ar: {
        advertiseHere: "أعلن هنا",
        contactUs: "تواصل معنا لعرض إعلانك",
    },
    en: {
        advertiseHere: "Advertise Here",
        contactUs: "Contact us to display your ad",
    }
}

interface PlaceholderAdProps {
  type?: 'horizontal' | 'square';
}

export default function PlaceholderAd({ type = 'horizontal' }: PlaceholderAdProps) {
    const { language } = useLanguage();
    const t = translations[language];

    const aspectRatio = type === 'square' ? 'aspect-square' : 'aspect-[2/1] sm:aspect-[4/1]';

    return (
        <Link href="/contact" className="block group">
            <Card className={`relative w-full overflow-hidden bg-secondary/50 border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all ${aspectRatio}`}>
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                    <Megaphone className="h-10 w-10 text-primary/80 mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg text-primary/90">{t.advertiseHere}</h3>
                    <p className="text-sm text-muted-foreground">{t.contactUs}</p>
                </div>
            </Card>
        </Link>
    );
}
