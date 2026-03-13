"use client";
import { useEffect, useState } from "react";
import { useAuth, UserProfile } from "@/context/AuthContext";
import StoreCard from "@/components/StoreCard";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Building } from 'lucide-react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
  allStores: "تصفح جميع المتاجر",
  discoverStores: "اكتشف مجموعة متنوعة من المتاجر التي أنشأها بائعون موثوقون.",
  loading: "جارٍ التحميل...",
  noStores: "لا توجد متاجر متاحة حاليًا.",
};

export default function ShopsPage() {
  const { getUsersWithStores } = useAuth();
  const [stores, setStores] = useState<(UserProfile & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const usersWithStores = await getUsersWithStores();
        setStores(usersWithStores);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [getUsersWithStores]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <section className="bg-secondary/50 py-12 text-center">
          <div className="container mx-auto px-4">
            <Building className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.allStores}</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">{t.discoverStores}</p>
          </div>
        </section>
        
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
              </div>
            ) : stores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stores.map(store => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">{t.noStores}</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
