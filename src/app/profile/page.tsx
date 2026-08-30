'use client';
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";
import dynamic from 'next/dynamic';

import { useAuth } from '@/context/AuthContext';
import { BadgeCheck } from 'lucide-react';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

export default function ProfilePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const isVerified = !!userProfile?.verified;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">
                  {isVerified ? "تعديل بياناتي" : "توثيق حسابي"}
                </h1>
                {isVerified && <BadgeCheck className="h-7 w-7 text-blue-500 fill-blue-500/10" />}
              </div>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {isVerified 
                  ? "يمكنك تعديل معلوماتك الشخصية وعنوانك وتفاصيل ملفك في أي وقت." 
                  : "أدخل معلوماتك وعنوانك ورقم هاتفك للحصول على شارة التوثيق الرسمية في سوق العرب."}
              </p>
            </div>
            {authLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-28 w-28 rounded-full bg-secondary" />
                  <div className="h-9 w-28 bg-secondary rounded-lg" />
                </div>
                <div className="h-10 w-full bg-secondary rounded-lg" />
                <div className="h-10 w-full bg-secondary rounded-lg" />
                <div className="h-12 w-full bg-secondary rounded-lg" />
              </div>
            ) : (
              <ProfileForm />
            )}
          </div>
        </div>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
