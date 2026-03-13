

'use client';
import AdForm from "@/components/AdForm";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

const translations = {
    ar: {
        createTitle: "إنشاء إعلان جديد",
        createDescription: "املأ التفاصيل أدناه لنشر إعلانك على سوق العرب.",
        editTitle: "تعديل الإعلان",
        editDescription: "قم بتحديث تفاصيل إعلانك أدناه.",
        addProductTitle: "إضافة منتج جديد لمتجرك",
        addProductDescription: "املأ تفاصيل المنتج أدناه.",
        loading: "جارٍ التحميل...",
    },
    en: {
        createTitle: "Create a New Ad",
        createDescription: "Fill in the details below to post your ad on Arab Market.",
        editTitle: "Edit Ad",
        editDescription: "Update the details of your ad below.",
        addProductTitle: "Add New Product to Your Store",
        addProductDescription: "Fill in the product details below.",
        loading: "Loading...",
    }
}

function SubmitAdPageContent() {
    const { language } = useLanguage();
    const searchParams = useSearchParams();
    const adId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    const isEditMode = !!adId && !!userId;
    const isStoreProduct = type === 'store-product';

    const t = translations[language];
    
    let title = t.createTitle;
    let description = t.createDescription;

    if (isEditMode) {
        title = t.editTitle;
        description = t.editDescription;
    } else if (isStoreProduct) {
        title = t.addProductTitle;
        description = t.addProductDescription;
    }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background py-12 md:py-20">
        <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{title}</h1>
                    <p className="text-muted-foreground mt-2">{description}</p>
                </div>
                <AdForm adId={adId} userId={userId} isEditMode={isEditMode} />
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SubmitAdPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SubmitAdPageContent />
        </Suspense>
    )
}
