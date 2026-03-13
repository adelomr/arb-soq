'use client';
import Footer from "@/components/Footer";
import AdminDashboard from "@/components/AdminDashboard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Loader2, Users, Bell, Settings, ShieldCheck, Megaphone, BadgeDollarSign, Shapes, Briefcase, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import NotificationManager from "@/components/NotificationManager";
import ImageModerationTool from "@/components/ImageModerationTool";
import AnnouncementManager from "@/components/AnnouncementManager";
import AdModerationList from "@/components/AdModerationList";
import PricingManager from "@/components/PricingManager";
import CategoryManager from "@/components/CategoryManager";
import ProfessionManager from "@/components/ProfessionManager";
import dynamic from 'next/dynamic';
import ForumManager from "@/components/ForumManager";

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

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
    forumManagement: "إدارة المنتدى",
    forumManagementDesc: "إضافة وتعديل أقسام المنتدى والتحكم بالمواضيع.",
    backToDashboard: "العودة إلى لوحة التحكم",
};

type AdminView = 'dashboard' | 'users' | 'notifications' | 'settings' | 'moderation' | 'announcement' | 'pricing' | 'categories' | 'professions' | 'forum';

export default function AdminPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const [view, setView] = useState<AdminView>('dashboard');

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
            case 'forum':
                return <ForumManager />;
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <Card onClick={() => setView('users')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Users className="h-6 w-6 text-primary"/>
                                    {t.userManagement}
                                </CardTitle>
                                <CardDescription>{t.userManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                         <Card onClick={() => setView('categories')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Shapes className="h-6 w-6 text-primary"/>
                                    {t.categoryManagement}
                                </CardTitle>
                                <CardDescription>{t.categoryManagementDesc}</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card onClick={() => setView('professions')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Briefcase className="h-6 w-6 text-primary"/>
                                    {t.professionManagement}
                                </CardTitle>
                                <CardDescription>{t.professionManagementDesc}</CardDescription>
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
                        <Card onClick={() => setView('forum')} className="cursor-pointer hover:border-primary hover:shadow-lg transition-all bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <MessageSquare className="h-6 w-6 text-primary"/>
                                    {t.forumManagement}
                                </CardTitle>
                                <CardDescription>{t.forumManagementDesc}</CardDescription>
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
                 <button onClick={() => setView('dashboard')} className="mb-8 px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
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
