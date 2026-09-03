'use client';

import React from 'react';
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BadgeCheck, UserPlus, Sparkles } from 'lucide-react';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

export default function ProfilePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isSignupMode = Boolean(
    searchParams.get('mode') === 'signup' || 
    (!authLoading && userProfile && (userProfile.hasCompletedProfile === false || userProfile.isNewUser || (!userProfile.country && !userProfile.city)))
  );
  const isVerified = !!userProfile?.verified;

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2">
                {isSignupMode ? (
                  <>
                    <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-foreground">
                      إنشاء الحساب وتحديد منطقتك
                    </h1>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-foreground">
                      {isVerified ? "تعديل بياناتي" : "توثيق حسابي وبياناتي"}
                    </h1>
                    {isVerified && <BadgeCheck className="h-7 w-7 text-blue-500 fill-blue-500/10" />}
                  </>
                )}
              </div>
              <p className="text-muted-foreground mt-2 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                {isSignupMode
                  ? "أهلاً بك في سوق العرب! أكمل بياناتك الشخصية وحدد منطقتك ورقم هاتفك لتصفح ونشر الإعلانات المخصصة لمدينتك بسهولة."
                  : isVerified 
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
              <ProfileForm isSignupMode={isSignupMode} />
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
