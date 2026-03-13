'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { firestore } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import type { Ad } from '@/lib/types';

const t = {
  searchPlaceholder: "ابحث عن سيارات، أثاث، والمزيد...",
  searchButton: "بحث",
  searching: "جارٍ البحث...",
  searchFailedTitle: "خطأ في البحث",
  searchFailedDesc: "حدث خطأ غير متوقع. حاول مرة أخرى.",
  searchEmpty: "الرجاء إدخال كلمة للبحث",
};

export default function SearchForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: t.searchFailedTitle,
        description: t.searchEmpty,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const searchTerm = searchQuery.toLowerCase();

      // Client-side execution of search logic that was previously in the API Route
      const adsQuery = query(collectionGroup(firestore, 'ads'));
      const productsQuery = query(collectionGroup(firestore, 'products'));

      const [adsSnapshot, productsSnapshot] = await Promise.all([
        getDocs(adsQuery),
        getDocs(productsQuery),
      ]);
      
      const adsResults = adsSnapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id })) as Ad[];
      const productsResults = productsSnapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id })) as Ad[];

      const allItems = [...adsResults, ...productsResults];

      // Filter in memory for case-insensitive "contains" search
      const filteredItems = allItems.filter(item => 
          item.title && item.title.toLowerCase().includes(searchTerm)
      );

      // Remove duplicates
      const uniqueItems = Array.from(new Map(filteredItems.map(item => [item.id, item])).values());
      const relevantAdIds = uniqueItems
          .filter(item => item && item.id)
          .map(item => item.id);

      const adIdsString = relevantAdIds.join(',') || '';
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&ids=${adIdsString}`);
      
    } catch (error: any) {
      toast({
        title: t.searchFailedTitle,
        description: error.message || t.searchFailedDesc,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
      <form onSubmit={handleSearch} className="relative w-full flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
              type="search"
              placeholder={t.searchPlaceholder}
              className="w-full text-base md:text-lg bg-card border-border focus-visible:ring-accent pr-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading} size="lg" className="h-12">
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <Search className="h-5 w-5" />
            )}
            <span className="sr-only">{t.searchButton}</span>
        </Button>
      </form>
  );
}
