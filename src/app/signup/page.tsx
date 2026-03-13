'use client';
import Footer from "@/components/Footer";
import SignUpForm from "@/components/SignUpForm";
import Image from "next/image";
import { appIconUrl } from '@/lib/data';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "إنشاء حساب جديد",
    description: "أدخل معلوماتك للبدء.",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                  <Image src={appIconUrl} alt="App Icon" width={128} height={128} className="h-24 w-24 md:h-28 md:w-28" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline">{t.title}</h1>
              <p className="text-muted-foreground mt-2">
                {t.description}
              </p>
            </div>
            <SignUpForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
