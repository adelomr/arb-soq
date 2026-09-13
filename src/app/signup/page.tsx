'use client';

import React, { useEffect, useState } from 'react';
import Footer from "@/components/Footer";
import SignUpForm from "@/components/SignUpForm";
import Image from "next/image";
import { appIconUrl } from '@/lib/data';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fill="#4285F4" d="M22.052 12.182c0-.818-.073-1.636-.209-2.455H12v4.654h5.64c-.245 1.5-1.077 2.777-2.396 3.66v3.018h3.868c2.26-2.086 3.56-5.177 3.56-8.877z"/>
    <path fill="#34A853" d="M12 23c3.245 0 5.968-1.077 7.955-2.918l-3.868-3.018c-1.077.723-2.455 1.15-4.087 1.15-3.14 0-5.8-2.11-6.75-4.96H1.36v3.104C3.322 20.332 7.364 23 12 23z"/>
    <path fill="#FBBC05" d="M5.25 14.04c-.16-.482-.25-.99-.25-1.54s.09-.1.06.25-1.56l-3.89 3.104C.59 14.632 0 13.355 0 12s.59-2.632 1.61-3.664l3.89 3.104c.16.48.25.99.25 1.54z"/>
    <path fill="#EA4335" d="M12 4.85c1.75 0 3.33.604 4.58 1.814l3.42-3.418C17.96.97 15.245 0 12 0 7.364 0 3.322 2.668 1.36 6.232l3.89 3.104C6.2 6.43 8.86 4.85 12 4.85z"/>
  </svg>
);

export default function SignUpPage() {
  const { user, userProfile, loading: authLoading, signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.warn('Google sign-in error on signup page:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isProfileComplete = Boolean(
    userProfile && 
    userProfile.country && 
    (userProfile.city || userProfile.governorate || userProfile.province) &&
    !userProfile.isNewUser &&
    userProfile.hasCompletedProfile !== false
  );

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="flex-1 py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card p-6 sm:p-10 rounded-3xl shadow-xl border border-border">
              {/* الشعار والعنوان العام */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <Image 
                    src={appIconUrl} 
                    alt="سوق العرب" 
                    width={100} 
                    height={100} 
                    className="h-20 w-20 md:h-24 md:w-24 drop-shadow-md" 
                    priority
                  />
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-headline text-foreground">
                  {!user ? 'الانضمام إلى سوق العرب' : isProfileComplete ? 'حسابك مكتمل ونشط' : 'إكمال بيانات حسابك الجديد'}
                </h1>
                <p className="text-muted-foreground mt-2 text-xs sm:text-sm md:text-base max-w-md mx-auto">
                  {!user
                    ? 'منصتك الأولى للإعلانات المبوبة في الوطن العربي. بيع واشتري السيارات، العقارات، والخدمات بسهولة وأمان.'
                    : isProfileComplete
                    ? 'أنت مسجل بالفعل في سوق العرب وبياناتك مكتملة.'
                    : 'أهلاً بك! يرجى تحديد منطقتك ورقم هاتفك للبدء في البيع والشراء.'}
                </p>
              </div>

              {/* حالة التحميل الأولي للمستخدم */}
              {authLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">جارٍ التحقق من بياناتك...</span>
                </div>
              ) : !user ? (
                /* ============================================================ */
                /* الخطوة 1: المستخدم غير مسجّل دخول — إظهار زر الدخول بجوجل */
                /* ============================================================ */
                <div className="space-y-6 max-w-md mx-auto py-2">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 text-center space-y-1">
                    <span className="text-xs font-bold text-foreground block">
                      خطوة واحدة سريعة للبدء:
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      سجّل الآن بضغطة زر واحدة وآمنة دون الحاجة لحفظ كلمات مرور.
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 bg-card hover:bg-muted text-foreground border-2 border-border shadow-md hover:shadow-lg rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>جارٍ تسجيل الدخول عبر Google...</span>
                      </>
                    ) : (
                      <>
                        <GoogleIcon className="w-5 h-5" />
                        <span>المتابعة باستخدام Google</span>
                      </>
                    )}
                  </Button>

                  <div className="space-y-2.5 pt-4 text-xs text-muted-foreground border-t">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>تسجيل فوري بضغطة واحدة باستخدام حساب Google</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>بياناتك محمية ومشفرة وفق أعلى معايير الخصوصية والأمان</span>
                    </div>
                  </div>
                </div>
              ) : isProfileComplete ? (
                /* ============================================================ */
                /* في حالة كان المستخدم مسجلاً بالفعل وبياناته كاملة */
                /* ============================================================ */
                <div className="text-center py-6 space-y-5 max-w-md mx-auto">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-1">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-base text-foreground">
                      مرحباً بعودتك، {userProfile?.name || user.displayName}!
                    </div>
                    <p className="text-xs text-muted-foreground">
                      حسابك نشط بالفعل في سوق العرب ومعتمد في منطقتك ({userProfile?.city || userProfile?.governorate || userProfile?.country}).
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild className="flex-1 rounded-xl font-bold">
                      <Link href="/">تصفح سوق العرب</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 rounded-xl font-bold">
                      <Link href="/profile">حسابي وإعلاناتي</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                /* ============================================================ */
                /* الخطوة 2: المستخدم سجّل بجوجل — فتح نموذج إكمال إنشاء الحساب */
                /* ============================================================ */
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>تم تسجيل حساب Google بنجاح! أكمل موقعك ورقم هاتفك لإتمام التسجيل.</span>
                  </div>
                  <SignUpForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
