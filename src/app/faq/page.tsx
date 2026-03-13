'use client';

import Footer from "@/components/Footer";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AdPlaceholder } from '@/components/Adsense';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "الأسئلة الشائعة",
    subtitle: "هل لديك أسئلة؟ لدينا إجابات. إليك بعض الأسئلة الأكثر شيوعًا.",
    q1: "كيف أنشر إعلانًا؟",
    a1: "لنشر إعلان، انقر على زر 'إضافة إعلان' في رأس الصفحة. املأ النموذج بالتفاصيل المطلوبة، بما في ذلك العنوان والوصف والسعر والصور. بمجرد إرساله، ستتم مراجعته والموافقة عليه.",
    q2: "هل استخدام سوق العرب مجاني؟",
    a2: "نعم، نشر الإعلانات الأساسية مجاني تمامًا. نقدم أيضًا خيارات مدفوعة مثل 'الإعلانات المميزة' لزيادة ظهور إعلانك.",
    q3: "كيف أتواصل مع البائع؟",
    a3: "في صفحة تفاصيل الإعلان، ستجد معلومات الاتصال التي قدمها البائع، مثل رقم الهاتف أو نموذج المراسلة. نوصي باستخدام نظام المراسلة الخاص بنا للتواصل الأولي.",
    q4: "ماذا أفعل إذا اشتبهت في إعلان احتيالي؟",
    a4: "إذا واجهت إعلانًا يبدو مشبوهًا، فيرجى استخدام زر 'الإبلاغ عن الإعلان' الموجود في صفحة الإعلان. سيقوم فريق الإشراف لدينا بالتحقيق واتخاذ الإجراء المناسب.",
    q5: "كيف يمكنني تعديل أو حذف إعلاني؟",
    a5: "يمكنك إدارة إعلاناتك من خلال 'لوحة التحكم' الخاصة بك. انتقل إلى لوحة التحكم الخاصة بك للعثور على خيارات لتعديل أو حذف إعلاناتك الحالية.",
};

export default function FaqPage() {
    const faqs = [
        { question: t.q1, answer: t.a1 },
        { question: t.q2, answer: t.a2 },
        { question: t.q3, answer: t.a3 },
        { question: t.q4, answer: t.a4 },
        { question: t.q5, answer: t.a5 },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-12">
                        <HelpCircle className="mx-auto h-16 w-16 text-primary mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold font-headline">{t.title}</h1>
                        <p className="mt-4 text-lg text-muted-foreground">{t.subtitle}</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <section className="pt-16">
                        <AdPlaceholder />
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
