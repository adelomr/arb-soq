'use client';
import Footer from "@/components/Footer";
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
  Briefcase, 
  MessageSquare,
  FileText,
  NotebookPen,
  PenTool,
  Mail
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const AdminDashboard = dynamic(() => import("@/components/AdminDashboard"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const NotificationManager = dynamic(() => import("@/components/NotificationManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const ImageModerationTool = dynamic(() => import("@/components/ImageModerationTool"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const AnnouncementManager = dynamic(() => import("@/components/AnnouncementManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const AdModerationList = dynamic(() => import("@/components/AdModerationList"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const PricingManager = dynamic(() => import("@/components/PricingManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const CategoryManager = dynamic(() => import("@/components/CategoryManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const ProfessionManager = dynamic(() => import("@/components/ProfessionManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const ContactMessages = dynamic(() => import("@/components/ContactMessages"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const PageManager = dynamic(() => import("@/components/PageManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const TopicManager = dynamic(() => import("@/components/TopicManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });
const NewsletterManager = dynamic(() => import("@/components/NewsletterManager"), { ssr: false, loading: () => <div className="p-4 text-center text-muted-foreground">جار التحميل...</div> });

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
    imageModeration: "الإشراف على الصور",
    imageModerationDesc: "فحص الصور بحثًا عن محتوى غير لائق.",
    announcementBar: "إدارة شريط الإعلانات",
    announcementBarDesc: "التحكم في شريط الإعلانات العلوي.",
    pricingManagement: "إدارة الأسعار",
    pricingManagementDesc: "تعديل خطط وباقات الأسعار.",
    categoryManagement: "إدارة الفئات",
    categoryManagementDesc: "إضافة وتعديل فئات الإعلانات.",
    professionManagement: "إدارة المهن",
    professionManagementDesc: "إضافة وتعديل المهن المتاحة في سوق العمل.",
    contactMessages: "رسائل الزوار",
    contactMessagesDesc: "عرض وإدارة الرسائل الواردة من صفحة اتصل بنا.",
    pageManagement: "إدارة الصفحات",
    pageManagementDesc: "إنشاء وإدارة الصفحات الثابتة والديناميكية للموقع.",
    topicManagement: "إدارة الموضوعات",
    topicManagementDesc: "عرض، تعديل، وحذف الموضوعات والمقالات المنشورة.",
    createTopic: "إضافة موضوع جديد",
    createTopicDesc: "كتابة ونشر مقال أو موضوع جديد مباشرة.",

    backToDashboard: "العودة إلى لوحة التحكم",
    newsletterManagement: "إدارة القائمة البريدية",
    newsletterManagementDesc: "إرسال النشرات البريدية للمشتركين وضبط إعدادات الخدمة.",
};

type AdminView = 'dashboard' | 'users' | 'notifications' | 'settings' | 'moderation' | 'announcement' | 'pricing' | 'categories' | 'professions' | 'messages' | 'pages' | 'topics' | 'create-topic' | 'newsletter';

export default function AdminPage() {
    // const { userProfile, loading } = useAuth();
    const userProfile = { role: 'admin' };
    const loading = false;
    const router = useRouter();
    const [view, setView] = useState<AdminView>('dashboard');
    const [topicInitialView, setTopicInitialView] = useState<'list' | 'create'>('list');

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
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4 text-center p-4">
                    <Shield className="h-16 w-16 text-destructive" />
                    <h1 className="text-3xl font-bold">{t.accessDenied}</h1>
                    <p className="text-lg text-muted-foreground">{t.notAdmin}</p>
                    <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md">
                        {t.backToHome}
                    </button>
                </div>
            </div>
        );
    }
    
    const renderView = () => {
        switch(view) {
            case 'users':
                return <AdminDashboard />;
            case 'notifications':
                return <NotificationManager />;
            case 'moderation':
                return <ImageModerationTool />;
            case 'announcement':
                return <AnnouncementManager />;
            case 'pricing':
                return <PricingManager />;
            case 'categories':
                return <CategoryManager />;
            case 'professions':
                return <ProfessionManager />;
            case 'settings':
                return <AdModerationList />;
            case 'messages':
                return <ContactMessages />;
            case 'pages':
                return <PageManager />;
            case 'topics':
                return <TopicManager initialView={topicInitialView} />;
            case 'create-topic':
                return <TopicManager initialView="create" />;
            case 'newsletter':
                return <NewsletterManager />;

            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <Card onClick={() => setView('pages')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary"/>
                                    {t.pageManagement}
                                </CardTitle>
                                <CardDescription>{t.pageManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => { setTopicInitialView('list'); setView('topics'); }} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <NotebookPen className="h-6 w-6 text-primary"/>
                                    {t.topicManagement}
                                </CardTitle>
                                <CardDescription>{t.topicManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => { setTopicInitialView('create'); setView('topics'); }} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <PenTool className="h-6 w-6 text-primary"/>
                                    {t.createTopic}
                                </CardTitle>
                                <CardDescription>{t.createTopicDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        
                        <Card onClick={() => setView('users')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Users className="h-6 w-6 text-primary"/>
                                    {t.userManagement}
                                </CardTitle>
                                <CardDescription>{t.userManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('categories')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Shapes className="h-6 w-6 text-primary"/>
                                    {t.categoryManagement}
                                </CardTitle>
                                <CardDescription>{t.categoryManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('professions')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Briefcase className="h-6 w-6 text-primary"/>
                                    {t.professionManagement}
                                </CardTitle>
                                <CardDescription>{t.professionManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('messages')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary"/>
                                    {t.contactMessages}
                                </CardTitle>
                                <CardDescription>{t.contactMessagesDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('settings')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Settings className="h-6 w-6 text-primary"/>
                                    {t.adSettings}
                                </CardTitle>
                                <CardDescription>{t.adSettingsDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('pricing')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <BadgeDollarSign className="h-6 w-6 text-primary"/>
                                    {t.pricingManagement}
                                </CardTitle>
                                <CardDescription>{t.pricingManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('notifications')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Bell className="h-6 w-6 text-primary"/>
                                    {t.notifications}
                                </CardTitle>
                                <CardDescription>{t.notificationsDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('moderation')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 text-primary"/>
                                    {t.imageModeration}
                                </CardTitle>
                                <CardDescription>{t.imageModerationDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('announcement')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Megaphone className="h-6 w-6 text-primary"/>
                                    {t.announcementBar}
                                </CardTitle>
                                <CardDescription>{t.announcementBarDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('newsletter')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Mail className="h-6 w-6 text-primary"/>
                                    {t.newsletterManagement}
                                </CardTitle>
                                <CardDescription>{t.newsletterManagementDesc}</CardDescription>
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
