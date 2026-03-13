'use client';

import Footer from "@/components/Footer";
import WalletDashboard from "@/components/WalletDashboard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    loading: "جار التحميل...",
    accessDenied: "الوصول مرفوض",
    pleaseLogin: "الرجاء تسجيل الدخول للوصول إلى محفظتك.",
    backToHome: "العودة إلى الرئيسية",
};

export default function WalletPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">{t.loading}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <WalletDashboard />
                </div>
            </main>
            <Footer />
        </div>
    );
}
