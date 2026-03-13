
'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Award, Gem, Star, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useMarket } from '@/context/MarketContext';
import { useAuth, PricingStructure } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { createPaymobPayment } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';

const translations = {
    ar: {
        title: "خطط وأسعار الإعلانات",
        subtitle: "اختر الباقة المناسبة لك وابدأ في نشر إعلانك للوصول إلى الملايين.",
        bestSeller: "الأكثر مبيعاً",
        buyNow: "اشترِ الآن",
        startFree: "ابدأ مجاناً",
        processingPayment: "جارٍ تحضير الدفع...",
        loginRequired: "الرجاء تسجيل الدخول أولاً",
        loginRequiredDesc: "يجب عليك تسجيل الدخول أو إنشاء حساب لشراء باقة.",
        redirecting: "جارٍ التوجيه...",
        redirectingDesc: "سيتم الآن توجيهك إلى صفحة دفع آمنة.",
        errorTitle: "فشل الدفع",
        errorDesc: "حدث خطأ أثناء إعداد عملية الدفع. يرجى المحاولة مرة أخرى.",
        planNotImplemented: "هذه الباقة غير متاحة بعد.",
        loadingPlans: "جارٍ تحميل الخطط...",
    }
};

type PlanId = 'free' | 'premium' | 'gold';

export default function PricingPage() {
    const { language } = useLanguage();
    const { market } = useMarket();
    const t = translations.ar;
    const { user, userProfile, getPricingPlans } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [plansData, setPlansData] = useState<PricingStructure | null>(null);
    const [isLoading, setIsLoading] = useState<PlanId | null>(null);
    const [isFetchingPlans, setIsFetchingPlans] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            setIsFetchingPlans(true);
            const data = await getPricingPlans();
            setPlansData(data);
            setIsFetchingPlans(false);
        };
        fetchPlans();
    }, [getPricingPlans]);

    const handlePayment = async (planId: PlanId, amount: string) => {
        if (!user || !userProfile) {
            toast({
                title: t.loginRequired,
                description: t.loginRequiredDesc,
                variant: 'destructive',
            });
            router.push('/login');
            return;
        }

        setIsLoading(planId);

        try {
            const paymentInput = {
                amount_cents: String(parseInt(amount) * 100),
                email: user.email!,
                first_name: userProfile.name.split(' ')[0],
                last_name: userProfile.name.split(' ').slice(1).join(' ') || userProfile.name.split(' ')[0],
                phone_number: userProfile.phoneNumber || 'N/A',
            };

            const result = await createPaymobPayment(paymentInput);

            if (result.success && result.url) {
                toast({
                    title: t.redirecting,
                    description: t.redirectingDesc,
                });
                window.location.href = result.url;
            } else {
                throw new Error(result.error || t.errorDesc);
            }
        } catch (error: any) {
            toast({
                title: t.errorTitle,
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(null);
        }
    };
    
    const handlePlanClick = (planId: PlanId, price: string) => {
        if (planId === 'free') {
            router.push('/submit');
        } else {
             handlePayment(planId, price);
        }
    };

    const planOrder: PlanId[] = ['free', 'premium', 'gold'];
    const planIcons = { free: Award, premium: Star, gold: Gem };

    if (isFetchingPlans || !plansData) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                 <main className="flex-1 bg-background">
                    <section className="bg-primary/90 text-primary-foreground py-16 md:py-24 text-center">
                        <div className="container mx-auto px-4">
                            <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.title}</h1>
                            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto">{t.subtitle}</p>
                        </div>
                    </section>
                    <section className="py-16 md:py-24">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                {[1,2,3].map(i => <Skeleton key={i} className="h-[450px] w-full" />)}
                            </div>
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        )
    }

    const { plans } = plansData;
    const featuresOrder: (keyof typeof plans.free.features)[] = ['images', 'search', 'highlight', 'extend'];
    
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background">
                <section className="bg-primary/90 text-primary-foreground py-16 md:py-24 text-center">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.title}</h1>
                        <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto">{t.subtitle}</p>
                    </div>
                </section>

                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="hidden md:grid md:grid-cols-4 gap-px bg-border rounded-lg border overflow-hidden max-w-6xl mx-auto shadow-lg">
                            {/* Headers */}
                            <div className="p-4 font-bold bg-secondary/50 flex items-center justify-center"></div>
                            {planOrder.map(planId => {
                                const plan = plans[planId];
                                const PlanIcon = planIcons[planId];
                                const isPremium = planId === 'premium';
                                return (
                                    <div key={planId} className={`p-6 text-center ${isPremium ? 'bg-primary/10' : 'bg-card'}`}>
                                        {isPremium && <div className="text-xs font-bold uppercase text-primary mb-2">{t.bestSeller}</div>}
                                        <PlanIcon className={`h-8 w-8 mx-auto mb-2 ${isPremium ? 'text-primary' : ''}`} />
                                        <h3 className="text-xl font-bold">{plan.name.ar}</h3>
                                    </div>
                                )
                            })}

                            {/* Feature Rows */}
                            {featuresOrder.map(featureKey => {
                                const featureName = {
                                  images: "عدد الصور",
                                  search: "الظهور بالبحث",
                                  highlight: "تمييز الإعلان",
                                  extend: "إمكانية التمديد"
                                }[featureKey];
                                
                                return (
                                    <React.Fragment key={featureKey}>
                                        <div className="p-4 font-semibold flex items-center justify-start bg-secondary/50 border-t">{featureName}</div>
                                        {planOrder.map(planId => {
                                            const plan = plans[planId];
                                            const feature = plan.features[featureKey];
                                            const isPremium = planId === 'premium';
                                            return (
                                                <div key={`${planId}-${featureKey}`} className={`p-4 text-center flex items-center justify-center border-t ${isPremium ? 'bg-primary/5' : 'bg-card'}`}>
                                                    {'available' in feature ? (
                                                        feature.available ? <Check className="h-6 w-6 text-green-500" /> : <X className="h-6 w-6 text-destructive" />
                                                    ) : (
                                                        <span className="font-medium">{feature.text.ar}</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </React.Fragment>
                                )
                            })}
                            
                            {/* Price Row */}
                             <div className="p-4 font-semibold flex items-center justify-start bg-secondary/50 border-t">السعر</div>
                             {planOrder.map(planId => {
                                const plan = plans[planId];
                                const isPremium = planId === 'premium';
                                return (
                                    <div key={`${planId}-price`} className={`p-4 text-center flex flex-col items-center justify-center border-t ${isPremium ? 'bg-primary/5' : 'bg-card'}`}>
                                        <div className="text-3xl font-bold">{plan.price.ar} <span className="text-sm text-muted-foreground">{market.currency}</span></div>
                                        <div className="text-sm text-muted-foreground">{plan.duration.ar}</div>
                                    </div>
                                )
                             })}

                            {/* Button Row */}
                            <div className="p-4 bg-secondary/50 border-t"></div>
                             {planOrder.map(planId => {
                                const plan = plans[planId];
                                const isPremium = planId === 'premium';
                                return (
                                     <div key={`${planId}-button`} className={`p-4 text-center flex items-center justify-center border-t ${isPremium ? 'bg-primary/5' : 'bg-card'}`}>
                                         <Button 
                                            size="lg" 
                                            className="w-full" 
                                            variant={planId === 'premium' ? 'default' : (planId === 'free' ? 'outline' : 'secondary')}
                                            onClick={() => handlePlanClick(planId, plan.price.en)}
                                            disabled={isLoading === planId}
                                        >
                                            {isLoading === planId ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    {t.processingPayment}
                                                </>
                                            ) : (
                                                planId === 'free' ? t.startFree : t.buyNow
                                            )}
                                        </Button>
                                     </div>
                                )
                             })}

                        </div>

                        {/* Mobile View */}
                        <div className="grid grid-cols-1 md:hidden gap-8 max-w-md mx-auto">
                            {planOrder.map((planId) => {
                                const plan = plans[planId];
                                const PlanIcon = planIcons[planId];
                                const isPremium = planId === 'premium';

                                return (
                                    <Card key={planId} className={`flex flex-col text-center transition-transform duration-300 hover:scale-105 ${isPremium ? 'border-primary shadow-lg' : ''}`}>
                                        <CardHeader className={`rounded-t-lg relative ${isPremium ? 'bg-primary text-primary-foreground' : 'bg-secondary/50'}`}>
                                            {isPremium && <div className="absolute top-2 right-2 text-xs font-bold uppercase bg-background text-primary px-2 py-1 rounded-full">{t.bestSeller}</div>}
                                            <PlanIcon className="h-10 w-10 mx-auto mb-2" />
                                            <CardTitle className="text-2xl font-bold">{plan.name.ar}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow p-6 flex flex-col">
                                            <div className="mb-6">
                                                <span className="text-5xl font-bold">{plan.price.ar}</span>
                                                <span className="text-muted-foreground"> {market.currency}</span>
                                                <p className="text-muted-foreground mt-2">{plan.duration.ar}</p>
                                            </div>
                                            <ul className="space-y-3 text-muted-foreground mb-8 text-sm text-left">
                                                {featuresOrder.map(featureKey => {
                                                    const feature = plan.features[featureKey];
                                                    const featureName = {images: "عدد الصور", search: "الظهور بالبحث", highlight: "تمييز الإعلان", extend: "إمكانية التمديد"}[featureKey];
                                                    
                                                    return (
                                                        <li key={featureKey} className="flex items-center gap-3">
                                                           {'available' in feature ? (
                                                                feature.available ? <Check className="h-5 w-5 text-green-500 shrink-0" /> : <X className="h-5 w-5 text-destructive shrink-0" />
                                                            ) : <Check className="h-5 w-5 text-green-500 shrink-0" />}
                                                            
                                                            <span>
                                                                {'available' in feature ? 
                                                                    (featureName) : 
                                                                    feature.text.ar
                                                                }
                                                            </span>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                            <Button 
                                                size="lg" 
                                                className="w-full mt-auto" 
                                                variant={isPremium ? 'default' : (planId === 'free' ? 'outline' : 'secondary')}
                                                onClick={() => handlePlanClick(planId, plan.price.en)}
                                                disabled={isLoading === planId}
                                            >
                                                {isLoading === planId ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        {t.processingPayment}
                                                    </>
                                                ) : (
                                                    planId === 'free' ? t.startFree : t.buyNow
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
