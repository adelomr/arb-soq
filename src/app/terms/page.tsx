'use client';

import Footer from "@/components/Footer";
import { Handshake, FileText } from "lucide-react";
import { AdPlaceholder } from '@/components/Adsense';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "اتفاقية الاستخدام",
    lastUpdated: "آخر تحديث: 24 يوليو 2024",
    acceptance: "1. قبول الشروط",
    acceptanceText: "باستخدامك لمنصة سوق العرب، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق على هذه الشروط، فيرجى عدم استخدام المنصة.",
    userConduct: "2. سلوك المستخدم",
    userConductText: "أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك. توافق على عدم استخدام المنصة لأي غرض غير قانوني أو محظور. وهذا يشمل نشر محتوى مضلل أو احتيالي أو مسيء.",
    content: "3. المحتوى",
    contentText: "أنت تحتفظ بجميع حقوق الملكية في المحتوى الذي تنشره، ولكنك تمنحنا ترخيصًا عالميًا وغير حصري لاستخدام هذا المحتوى وتوزيعه وإعادة إنتاجه فيما يتعلق بخدماتنا.",
    disclaimers: "4. إخلاء المسؤولية",
    disclaimersText: "يتم توفير المنصة \"كما هي\". نحن لا نضمن دقة أو اكتمال أو موثوقية أي محتوى. يتم إجراء جميع المعاملات على مسؤوليتك الخاصة.",
    limitation: "5. تحديد المسؤولية",
    limitationText: "لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية تنشأ عن استخدامك للمنصة.",
    changes: "6. التغييرات على الشروط",
    changesText: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنخطرك بأي تغييرات عن طريق نشر الشروط الجديدة على هذه الصفحة.",
};

export default function TermsPage() {
    const sections = [
        { title: t.acceptance, text: t.acceptanceText },
        { title: t.userConduct, text: t.userConductText },
        { title: t.content, text: t.contentText },
        { title: t.disclaimers, text: t.disclaimersText },
        { title: t.limitation, text: t.limitationText },
        { title: t.changes, text: t.changesText },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-12">
                        <Handshake className="mx-auto h-16 w-16 text-primary mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">{t.lastUpdated}</p>
                    </div>

                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <div key={index} className="p-6 bg-card rounded-lg shadow-sm">
                                <h2 className="text-2xl font-semibold font-headline flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary"/>
                                    {section.title}
                                </h2>
                                <p className="text-muted-foreground mt-4 leading-relaxed">{section.text}</p>
                            </div>
                        ))}
                    </div>
                    <section className="pt-16">
                        <AdPlaceholder />
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
