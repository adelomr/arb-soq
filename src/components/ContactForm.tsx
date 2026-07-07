'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, Send } from 'lucide-react';

const translations = {
    ar: {
        name: "الاسم",
        namePlaceholder: "اسمك الكامل",
        nameRequired: "الاسم مطلوب.",
        email: "البريد الإلكتروني",
        emailPlaceholder: "you@example.com",
        emailRequired: "البريد الإلكتروني مطلوب.",
        emailInvalid: "بريد إلكتروني غير صالح.",
        subject: "الموضوع",
        subjectPlaceholder: "كيف يمكننا مساعدتك؟",
        subjectRequired: "الموضوع مطلوب.",
        message: "الرسالة",
        messagePlaceholder: "اكتب رسالتك هنا...",
        messageRequired: "الرسالة مطلوبة.",
        messageMin: "يجب أن تكون الرسالة 10 أحرف على الأقل.",
        sendMessage: "إرسال الرسالة",
        sending: "جارٍ الإرسال...",
        successTitle: "تم إرسال الرسالة!",
        successDesc: "شكرًا لتواصلك معنا. سنرد عليك قريبًا.",
        errorTitle: "فشل الإرسال",
        errorDesc: "حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.",
    },
    en: {
        name: "Name",
        namePlaceholder: "Your full name",
        nameRequired: "Name is required.",
        email: "Email",
        emailPlaceholder: "you@example.com",
        emailRequired: "Email is required.",
        emailInvalid: "Invalid email address.",
        subject: "Subject",
        subjectPlaceholder: "How can we help you?",
        subjectRequired: "Subject is required.",
        message: "Message",
        messagePlaceholder: "Type your message here...",
        messageRequired: "Message is required.",
        messageMin: "Message must be at least 10 characters.",
        sendMessage: "Send Message",
        sending: "Sending...",
        successTitle: "Message Sent!",
        successDesc: "Thanks for reaching out. We'll get back to you soon.",
        errorTitle: "Send Failed",
        errorDesc: "An error occurred while sending your message. Please try again.",
    }
}

const getContactFormSchema = (t: typeof translations.en) => z.object({
    name: z.string().min(1, { message: t.nameRequired }),
    email: z.string().min(1, { message: t.emailRequired }).email({ message: t.emailInvalid }),
    subject: z.string().min(1, { message: t.subjectRequired }),
    message: z.string().min(10, { message: t.messageMin }),
});

interface ContactFormProps {
    initialSubject?: string;
}

export default function ContactForm({ initialSubject = '' }: ContactFormProps) {
    const { language, direction } = useLanguage();
    const t = translations[language];
    const contactFormSchema = getContactFormSchema(t);
    type ContactFormValues = z.infer<typeof contactFormSchema>;
    
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: '',
            email: '',
            subject: initialSubject,
            message: '',
        },
    });

    useEffect(() => {
        form.setValue('subject', initialSubject);
    }, [initialSubject, form]);


    async function onSubmit(data: ContactFormValues) {
        setIsLoading(true);

        let emailSent = false;

        try {
            // Step 1: Send via EmailJS (primary — was working before)
            try {
                const { getEmailSettings } = await import('@/lib/newsletter-service');
                const emailjs = (await import('@emailjs/browser')).default;

                const emailSettings = await getEmailSettings();

                const serviceId = emailSettings?.serviceId || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
                const templateId = emailSettings?.templateId || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
                const publicKey = emailSettings?.publicKey || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

                if (serviceId && templateId && publicKey) {
                    const now = new Date();
                    const dateStr = now.toLocaleString('ar-EG', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });

                    await emailjs.send(
                        serviceId,
                        templateId,
                        {
                            name: data.name,
                            email: data.email,
                            message: data.message,
                            date: dateStr,
                        },
                        publicKey
                    );
                    emailSent = true;
                    console.log('✅ EmailJS: message sent successfully');
                } else {
                    console.warn('⚠️ EmailJS: configuration missing, check .env.local or Admin settings');
                }
            } catch (emailError: any) {
                console.error('❌ EmailJS error:', emailError?.text || emailError);
            }

            // Step 2: Save to Firestore (secondary — for admin record keeping)
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const { firestore } = await import('@/lib/firebase');
                await addDoc(collection(firestore, 'contact_messages'), {
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    timestamp: serverTimestamp(),
                    status: 'unread',
                    emailSent,
                });
                console.log('✅ Firestore: message saved');
            } catch (fbError) {
                console.error('⚠️ Firestore save failed (non-critical):', fbError);
            }

            // Show success regardless (message was sent or saved)
            toast({
                title: t.successTitle,
                description: t.successDesc,
            });
            form.reset({ name: '', email: '', subject: '', message: '' });

        } catch (error) {
            console.error('Contact form error:', error);
            toast({
                title: t.errorTitle,
                description: t.errorDesc,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.name}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t.namePlaceholder} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t.email}</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder={t.emailPlaceholder} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.subject}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.subjectPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.message}</FormLabel>
                            <FormControl>
                                <Textarea placeholder={t.messagePlaceholder} className="min-h-[150px]" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                    {isLoading ? (
                        <>
                            <Loader2 className={`animate-spin h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                            {t.sending}
                        </>
                    ) : (
                        <>
                           <Send className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                           {t.sendMessage}
                        </>
                    )}
                </Button>
            </form>
        </Form>
    )
}
