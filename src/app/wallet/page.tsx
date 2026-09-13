'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';
import WalletDashboard from '@/components/WalletDashboard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

export default function WalletPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/wallet');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <WalletDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
