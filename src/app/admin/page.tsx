'use client';
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  PenTool,
  Mail
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { firestore } from "@/lib/firebase";
import { collection, getCountFromServer } from "firebase/firestore";

import AdminDashboard from "@/components/AdminDashboard";
import UserDataCleanup from "@/components/UserDataCleanup";
import NotificationManager from "@/components/NotificationManager";
import AnnouncementManager from "@/components/AnnouncementManager";
import AdModerationList from "@/components/AdModerationList";
import PricingManager from "@/components/PricingManager";
import CategoryManager from "@/components/CategoryManager";

import ContactMessages from "@/components/ContactMessages";
import PageManager from "@/components/PageManager";
import TopicManager from "@/components/TopicManager";
import NewsletterManager from "@/components/NewsletterManager";
import GoogleAdsSettings from "@/components/GoogleAdsSettings";
import AdPlacementManager from "@/components/AdPlacementManager";

const t = {
    adminDashboard: "لوحة تحكم المسؤول",
    loading: "جار التحميل...",
    accessDenied: "الوصول مرفوض",
    notAdmin: "ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.",
    backToHome: "العودة إلى الرئيسية",
    userManagement: "إدارة المستخدمين",
    userManagementDesc: "عرض، إيقاف، وحذف المستخدمين.",
    notifications: "إدارة الإشعارات",
    notificationsDesc: "إرسال إشعارات مخصصة للمستخدمين.",
    adSettings: "مراجعة الإعلانات",
    adSettingsDesc: "الموافقة على أو رفض الإعلانات الجديدة.",
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
    newsletterManagement: "إدارة القائمة البريدية",
    newsletterManagementDesc: "إرسال النشرات البريدية للمشتركين وضبط إعدادات الخدمة.",
    googleAdsSettings: "إدارة المساحات الإعلانية والبنرات",
    googleAdsSettingsDesc: "التحكم في بنرات الموقع وإعلانات جوجل أدسنس والمساحات المخصصة وإحصائياتها.",
};

type AdminView = 'dashboard' | 'users' | 'notifications' | 'settings' | 'announcement' | 'pricing' | 'categories' | 'messages' | 'pages' | 'topics' | 'create-topic' | 'newsletter' | 'ads-settings';

export default function AdminPage() {
    const { userProfile, loading } = useAuth();

    const router = useRouter();
    const [view, setView] = useState<AdminView>('dashboard');
    const [topicInitialView, setTopicInitialView] = useState<'list' | 'create'>('list');
    const [userCount, setUserCount] = useState<number | null>(null);

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
            case 'users':
                return (
                  <div className="space-y-6">
                    <AdminDashboard />
                    <UserDataCleanup />
                  </div>
                );
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
            case 'newsletter':
                return <NewsletterManager />;
            case 'ads-settings':
                return <AdPlacementManager />;
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card onClick={() => setView('users')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-6 w-6 text-primary"/>
                                        {t.userManagement}
                                    </div>
                                    {/* عداد عدد المستخدمين */}
                                    {userCount !== null ? (
                                        <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
                                            {userCount.toLocaleString('ar-EG')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription>{t.userManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('settings')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 text-primary"/>
                                    {t.adSettings}
                                </CardTitle>
                                <CardDescription>{t.adSettingsDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('notifications')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Bell className="h-6 w-6 text-primary"/>
                                    {t.notifications}
                                </CardTitle>
                                <CardDescription>{t.notificationsDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('announcement')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Megaphone className="h-6 w-6 text-primary"/>
                                    {t.announcementBar}
                                </CardTitle>
                                <CardDescription>{t.announcementBarDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('pricing')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <BadgeDollarSign className="h-6 w-6 text-primary"/>
                                    {t.pricingManagement}
                                </CardTitle>
                                <CardDescription>{t.pricingManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('categories')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Shapes className="h-6 w-6 text-primary"/>
                                    {t.categoryManagement}
                                </CardTitle>
                                <CardDescription>{t.categoryManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>

                         <Card onClick={() => setView('messages')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary"/>
                                    {t.contactMessages}
                                </CardTitle>
                                <CardDescription>{t.contactMessagesDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('pages')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary"/>
                                    {t.pageManagement}
                                </CardTitle>
                                <CardDescription>{t.pageManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('topics')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <NotebookPen className="h-6 w-6 text-primary"/>
                                    {t.topicManagement}
                                </CardTitle>
                                <CardDescription>{t.topicManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('newsletter')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Mail className="h-6 w-6 text-primary"/>
                                    {t.newsletterManagement}
                                </CardTitle>
                                <CardDescription>{t.newsletterManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('ads-settings')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Settings className="h-6 w-6 text-primary"/>
                                    {t.googleAdsSettings}
                                </CardTitle>
                                <CardDescription>{t.googleAdsSettingsDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                );
        }
    }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background py-8 md:py-12">
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-4">
                    <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    {t.adminDashboard}
                </h1>
            </div>
            
            {view !== 'dashboard' && (
                 <button onClick={() => {
                          setView('dashboard');
                 }} className="mb-8 px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
                    &larr; {t.backToDashboard}
                 </button>
            )}

            {renderView()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
