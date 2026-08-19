'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Briefcase, Bug, Lightbulb, ChevronLeft } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WhatsAppIcon = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor">
    <path d="M17.472 14.382c-.022-.08-.115-.188-.417-.329-.3-.14-1.778-.877-2.037-.972-.26-.095-.448-.142-.642.148-.193.29-.749.972-.919 1.162-.17.19-.34.21-.641.07-.3-.14-1.272-.468-2.423-1.493-.895-.8-1.5-1.787-1.675-2.09-.175-.3-.018-.463.132-.613.136-.135.3-.35.45-.524.15-.175.2-.292.3-.487.1-.197.05-.369-.025-.51-.07-.14-.642-1.547-.882-2.128-.233-.564-.47-.488-.642-.496-.166-.008-.356-.01-.546-.01-.19 0-.5.07-.76.357-.26.29-1 .975-1 2.378 0 1.4 1.01 2.75 1.15 2.94.14.19 1.98 3.03 4.8 4.24.67.29 1.2.46 1.61.59.67.21 1.28.18 1.76.11.53-.08 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.26-.19-.56-.33zM12.002 2c-5.523 0-10 4.477-10 10 0 1.778.463 3.507 1.345 5.032L2 22l5.132-1.347c1.472.8 3.12 1.222 4.87 1.222 5.523 0 10-4.477 10-10s-4.477-10-10-10z"/>
  </svg>
);

interface ContactPageClientProps {
  title: string;
  content: string;
}

type View = 'reasons' | 'form';

export default function ContactPageClient({ title, content }: ContactPageClientProps) {
  const [view, setView] = useState<View>('reasons');
  const [initialSubject, setInitialSubject] = useState('');

  const reasons = [
    { id: 'ad', text: 'استفسار بخصوص إعلان', icon: MessageSquare },
    { id: 'technical', text: 'الإبلاغ عن مشكلة فنية', icon: Bug },
    { id: 'suggestion', text: 'اقتراح لتحسين الموقع', icon: Lightbulb },
    { id: 'partnership', text: 'شراكة عمل', icon: Briefcase },
    { id: 'other', text: 'سبب آخر / عام', icon: Mail },
  ];

  const handleReasonClick = (reason: { id: string; text: string }) => {
    if (reason.id === 'other') {
      setInitialSubject('');
    } else {
      setInitialSubject(reason.text);
    }
    setView('form');
  };

  const renderReasonsView = () => (
    <div className="text-center animate-in fade-in duration-300">
      <div className="mb-12 text-right" dir="rtl">
        <Mail className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4 text-center">{title}</h1>
        <div 
          className="dynamic-contact-desc text-md md:text-lg text-muted-foreground leading-relaxed text-center"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <Card className="max-w-2xl mx-auto shadow-lg text-right" dir="rtl">
        <CardHeader>
          <CardTitle>ما هو سبب تواصلك؟</CardTitle>
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

      {/* زر واتساب المباشر */}
      <div className="max-w-2xl mx-auto mt-4" dir="rtl">
        <a
          href="https://wa.me/201003975823"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full p-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-base transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.01]"
        >
          <WhatsAppIcon />
          <span>تواصل معنا عبر واتساب</span>
        </a>
      </div>
      <style jsx global>{`
        .dynamic-contact-desc p {
          margin-bottom: 0.75rem;
        }
        .dynamic-contact-desc a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </div>
  );

  const renderFormView = () => (
    <Card className="max-w-2xl mx-auto shadow-lg text-right animate-in fade-in duration-300" dir="rtl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>أرسل رسالة</CardTitle>
            <CardDescription>املأ النموذج أدناه وسيقوم فريقنا بالرد عليك.</CardDescription>
          </div>
          <Button variant="ghost" onClick={() => setView('reasons')} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            رجوع
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ContactForm initialSubject={initialSubject} />
      </CardContent>
    </Card>
  );

  return view === 'reasons' ? renderReasonsView() : renderFormView();
}
