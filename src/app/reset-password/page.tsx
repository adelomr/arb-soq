'use client';
import Footer from "@/components/Footer";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { KeyRound } from "lucide-react";
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "تعيين كلمة مرور جديدة",
    description: "أدخل كلمة المرور الجديدة أدناه.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12 md:py-20 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8">
              <KeyRound className="mx-auto h-16 w-16 text-primary mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold font-headline">{t.title}</h1>
              <p className="text-muted-foreground mt-2">
                {t.description}
              </p>
            </div>
            <ResetPasswordForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
