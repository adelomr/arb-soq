'use client';

import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { getCategoryIcon } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Shapes } from 'lucide-react';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    allCategories: "جميع الفئات",
    browseAll: "تصفح جميع الفئات المتاحة في السوق.",
};

export default function AllCategoriesPage() {
    const { categories, loading: authLoading } = useAuth();

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background">
                <section className="bg-secondary/50 py-12 text-center">
                    <div className="container mx-auto px-4">
                        <Shapes className="mx-auto h-16 w-16 text-primary mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.allCategories}</h1>
                        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">{t.browseAll}</p>
                    </div>
                </section>
                
                <section className="py-12 md:py-16">
                    <div className="container mx-auto px-4">
                         {authLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                            </div>
                        ) : (
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {categories.map((category) => {
                                     const CategoryIcon = getCategoryIcon(category.icon);
                                     const href = category.id === 'services' ? '/services' : (category.id === 'stores' ? '/shops' : `/category/${category.id}`);
                                     return (
                                        <Link key={category.id} href={href} className="w-full">
                                           <Card className="flex flex-col items-center justify-center p-4 h-28 text-center transition-all hover:bg-primary/5 hover:shadow-md hover:-translate-y-1">
                                                <div className="p-3 rounded-full bg-secondary mb-2">
                                                  <CategoryIcon className="h-6 w-6 text-primary" />
                                                </div>
                                                <p className="text-sm font-semibold text-center w-full truncate">{category.name.ar}</p>
                                           </Card>
                                        </Link>
                                     )
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
