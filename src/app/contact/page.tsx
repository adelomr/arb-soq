'use client';

import Footer from "@/components/Footer";
import { Mail, MessageSquare, Briefcase, Bug, Lightbulb, ChevronLeft } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { useState } from 'react';
import { AdPlaceholder } from '@/components/Adsense';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const t = {
    title: "اتصل بنا",
    subtitle: "نحن هنا للمساعدة. اختر سبب التواصل أو أرسل لنا رسالة مباشرة.",
    formTitle: "أرسل رسالة",
    formDescription: "املأ النموذج أدناه وسيقوم فريقنا بالرد عليك.",
    email: "adelomr1878@gmail.com",
    contactReason: "ما هو سبب تواصلك؟",
    reasonAd: "استفسار بخصوص إعلان",
    reasonTechnical: "الإبلاغ عن مشكلة فنية",
    reasonSuggestion: "اقتراح لتحسين الموقع",
    reasonPartnership: "شراكة عمل",
    reasonOther: "سبب آخر / عام",
    back: "رجوع",
};

type View = 'reasons' | 'form';

export default function ContactPage() {
    const [view, setView] = useState<View>('reasons');
    const [initialSubject, setInitialSubject] = useState('');

    const reasons = [
        { id: 'ad', text: t.reasonAd, icon: MessageSquare },
        { id: 'technical', text: t.reasonTechnical, icon: Bug },
        { id: 'suggestion', text: t.reasonSuggestion, icon: Lightbulb },
        { id: 'partnership', text: t.reasonPartnership, icon: Briefcase },
        { id: 'other', text: t.reasonOther, icon: Mail },
    ];

    const handleReasonClick = (reason: {id: string, text: string}) => {
        if (reason.id === 'other') {
            setInitialSubject('');
        } else {
            setInitialSubject(reason.text);
        }
        setView('form');
    }

    const renderReasonsView = () => (
        <div className="text-center">
             <div className="mb-12">
                <Mail className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold font-headline">{t.title}</h1>
                <p className="mt-4 text-md md:text-lg text-muted-foreground">{t.subtitle}</p>
            </div>
            <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>{t.contactReason}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {reasons.map(reason => (
                        <Button 
                            key={reason.id} 
                            variant="outline" 
                            className="w-full justify-between p-6 text-base"
                            onClick={() => handleReasonClick(reason)}
                        >
                            <div className="flex items-center gap-3">
                                <reason.icon className="h-5 w-5 text-primary" />
                                <span>{reason.text}</span>
                            </div>
                            <ChevronLeft className="h-5 w-5"/>
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
    
    const renderFormView = () => (
         <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{t.formTitle}</CardTitle>
                        <CardDescription>{t.formDescription}</CardDescription>
                    </div>
                     <Button variant="ghost" onClick={() => setView('reasons')} className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        {t.back}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ContactForm initialSubject={initialSubject} />
            </CardContent>
        </Card>
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background py-12 md:py-20">
                <div className="container mx-auto px-4 max-w-4xl">
                   
                    {view === 'reasons' ? renderReasonsView() : renderFormView()}

                </div>
                 <section className="py-16">
                    <div className="container mx-auto px-4">
                        <AdPlaceholder />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
