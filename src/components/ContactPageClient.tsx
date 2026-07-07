'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Briefcase, Bug, Lightbulb, ChevronLeft } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
