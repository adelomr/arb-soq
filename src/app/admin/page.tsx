'use client';
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Shield, 
  Loader2, 
  Users, 
  Bell, 
  Settings, 
  ShieldCheck, 
  Megaphone, 
  BadgeDollarSign, 
  Shapes, 
  MessageSquare,
  FileText,
  NotebookPen,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase";
import { collection, getCountFromServer } from "firebase/firestore";

import AdminDashboard from "@/components/AdminDashboard";
import NotificationManager from "@/components/NotificationManager";
import AnnouncementManager from "@/components/AnnouncementManager";
import AdModerationList from "@/components/AdModerationList";
import PricingManager from "@/components/PricingManager";
import CategoryManager from "@/components/CategoryManager";

import ContactMessages from "@/components/ContactMessages";
import PageManager from "@/components/PageManager";
import TopicManager from "@/components/TopicManager";
import GoogleAdsSettings from "@/components/GoogleAdsSettings";
import AdPlacementManager from "@/components/AdPlacementManager";
import PaymentGatewayManager from "@/components/PaymentGatewayManager";
import VodafoneCashManager from "@/components/VodafoneCashManager";
import { Smartphone } from "lucide-react";

const t = {
    adminDashboard: "لوحة تحكم المسؤول",
    loading: "جار التحميل...",
    accessDenied: "الوصول مرفوض",
    notAdmin: "ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.",
    backToHome: "العودة إلى الرئيسية",
    vodafoneCash: "طلبات دفع فودافون كاش 📱",
    vodafoneCashDesc: "مراجعة إيصالات التحويل وتفعيل باقات المشتركين فورياً.",
    userManagement: "إدارة المستخدمين",
    userManagementDesc: "عرض، إيقاف، وحذف المستخدمين.",
    paymentGateway: "بوابة الدفع (Paymob)",
    paymentGatewayDesc: "ربط وتفعيل مفاتيح الدفع الإلكتروني وتتبع عمليات الدفع.",
    notifications: "إدارة الإشعارات",
    notificationsDesc: "إرسال إشعارات مخصصة للمستخدمين.",
    adSettings: "مراجعة وتمييز الإعلانات 🚀",
    adSettingsDesc: "الموافقة، الإيقاف، وتمييز الإعلانات بالباقات الذهبية والفضية.",
    announcementBar: "إدارة شريط الإعلانات",
    announcementBarDesc: "التحكم في شريط الإعلانات العلوي.",
    pricingManagement: "إدارة الأسعار",
    pricingManagementDesc: "تعديل خطط وباقات الأسعار.",
    categoryManagement: "إدارة الفئات",
    categoryManagementDesc: "إضافة وتعديل فئات الإعلانات.",

    contactMessages: "رسائل الزوار",
    contactMessagesDesc: "عرض وإدارة الرسائل الواردة من صفحة اتصل بنا.",
    pageManagement: "إدارة الصفحات",
    pageManagementDesc: "إنشاء وإدارة كل صفحات الموقع وصفحات الهبوط التسويقية.",
    topicManagement: "إدارة الموضوعات",
    topicManagementDesc: "عرض، تعديل، وحذف الموضوعات والمقالات المنشورة.",
    createTopic: "إضافة موضوع جديد",
    createTopicDesc: "كتابة ونشر مقال أو موضوع جديد مباشرة.",

    backToDashboard: "العودة إلى لوحة التحكم",
    googleAdsSettings: "إدارة المساحات الإعلانية والبنرات",
    googleAdsSettingsDesc: "التحكم في بنرات الموقع وإعلانات جوجل أدسنس والمساحات المخصصة وإحصائياتها.",
};

type AdminView = 'dashboard' | 'vodafone-cash' | 'users' | 'notifications' | 'settings' | 'announcement' | 'pricing' | 'categories' | 'messages' | 'pages' | 'topics' | 'create-topic' | 'ads-settings' | 'payment-gateway';

export default function AdminPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab') || searchParams?.get('view');

    const [view, setView] = useState<AdminView>('dashboard');
    const [topicInitialView, setTopicInitialView] = useState<'list' | 'create'>('list');
    const [userCount, setUserCount] = useState<number | null>(null);

    useEffect(() => {
        if (tabParam === 'ads' || tabParam === 'settings' || tabParam === 'moderation') {
            setView('settings');
        } else if (tabParam && ['vodafone-cash', 'users', 'notifications', 'announcement', 'pricing', 'categories', 'messages', 'pages', 'topics', 'create-topic', 'ads-settings', 'payment-gateway'].includes(tabParam)) {
            setView(tabParam as AdminView);
        }
    }, [tabParam]);

    useEffect(() => {
        // جلب عدد المستخدمين الكلي من Firestore
        const fetchUserCount = async () => {
            try {
                const snap = await getCountFromServer(collection(firestore, 'users'));
                setUserCount(snap.data().count);
            } catch {
                setUserCount(null);
            }
        };
        fetchUserCount();
    }, []);

    useEffect(() => {
        if (!loading && userProfile?.role !== 'admin') {
            router.push('/');
        }
    }, [userProfile, loading, router]);

    if (loading || !userProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">{t.loading}</p>
                </div>
            </div>
        );
    }

    if (userProfile.role !== 'admin') {
         return (
             <div className="flex flex-col min-h-screen">
                 <Header />
                 <main className="flex-1 flex items-center justify-center bg-background">
                     <div className="text-center p-8 max-w-md">
                         <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
                         <h1 className="text-2xl font-bold">{t.accessDenied}</h1>
                         <p className="text-muted-foreground mt-2">{t.notAdmin}</p>
                     </div>
                 </main>
                 <Footer />
             </div>
         );
    }

    const renderView = () => {
        switch (view) {
            case 'vodafone-cash':
                return <VodafoneCashManager />;
            case 'users':
                return <AdminDashboard />;
            case 'notifications':
                return <NotificationManager />;
            case 'settings':
                return <AdModerationList />;
            case 'announcement':
                return <AnnouncementManager />;
            case 'pricing':
                return <PricingManager />;
            case 'categories':
                return <CategoryManager />;

            case 'messages':
                return <ContactMessages />;
            case 'pages':
                return <PageManager initialFilter="all" />;
            case 'topics':
                return <TopicManager initialView={topicInitialView} />;
            case 'create-topic':
                return <TopicManager initialView="create" />;
            case 'ads-settings':
                return <AdPlacementManager />;
            case 'payment-gateway':
                return <PaymentGatewayManager />;
            case 'dashboard':
            default: {
                const adminNavItems: {
                    id: AdminView;
                    title: string;
                    desc: string;
                    icon: React.ComponentType<{ className?: string }>;
                }[] = [
                    { id: 'settings', title: t.adSettings, desc: t.adSettingsDesc, icon: ShieldCheck },
                    { id: 'users', title: t.userManagement, desc: t.userManagementDesc, icon: Users },
                    { id: 'vodafone-cash', title: t.vodafoneCash, desc: t.vodafoneCashDesc, icon: Smartphone },
                    { id: 'payment-gateway', title: t.paymentGateway, desc: t.paymentGatewayDesc, icon: CreditCard },
                    { id: 'notifications', title: t.notifications, desc: t.notificationsDesc, icon: Bell },
                    { id: 'announcement', title: t.announcementBar, desc: t.announcementBarDesc, icon: Megaphone },
                    { id: 'pricing', title: t.pricingManagement, desc: t.pricingManagementDesc, icon: BadgeDollarSign },
                    { id: 'categories', title: t.categoryManagement, desc: t.categoryManagementDesc, icon: Shapes },
                    { id: 'messages', title: t.contactMessages, desc: t.contactMessagesDesc, icon: MessageSquare },
                    { id: 'pages', title: t.pageManagement, desc: t.pageManagementDesc, icon: FileText },
                    { id: 'topics', title: t.topicManagement, desc: t.topicManagementDesc, icon: NotebookPen },
                    { id: 'ads-settings', title: t.googleAdsSettings, desc: t.googleAdsSettingsDesc, icon: Settings },
                ];

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        {adminNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Card 
                                    key={item.id}
                                    onClick={() => setView(item.id)} 
                                    className="group cursor-pointer rounded-2xl border border-border/70 hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card hover:bg-card/90 flex flex-col justify-between overflow-hidden"
                                >
                                    <CardHeader className="p-5 sm:p-6 space-y-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 flex-shrink-0">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-base sm:text-lg font-bold font-headline text-foreground group-hover:text-primary transition-colors leading-snug">
                                                {item.title}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            {item.desc}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                );
            }
        }
    }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black font-headline flex items-center gap-3.5 text-foreground">
                    <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    <span>{t.adminDashboard}</span>
                </h1>
            </div>
            
            {view !== 'dashboard' && (
                 <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setView('dashboard');
                    }} 
                    className="mb-8 rounded-xl font-bold gap-2 text-xs sm:text-sm border-border/80 hover:border-primary/40 shadow-xs"
                 >
                    <ArrowRight className="h-4 w-4" />
                    <span>{t.backToDashboard}</span>
                 </Button>
            )}

            {renderView()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
