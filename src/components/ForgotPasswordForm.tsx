
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const translations = {
    ar: {
        email: "البريد الإلكتروني",
        emailPlaceholder: "you@example.com",
        sendResetLink: "إرسال رابط إعادة التعيين",
        sending: "جارٍ الإرسال...",
        emailSent: "تم إرسال البريد الإلكتروني!",
        emailSentDesc: "إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة لإعادة تعيين كلمة المرور.",
        sendFailed: "فشل الإرسال",
        sendFailedDesc: "حدث خطأ أثناء إرسال البريد الإلكتروني. الرجاء المحاولة مرة أخرى.",
        backToLogin: "العودة لتسجيل الدخول",
        emailInvalid: "الرجاء إدخال بريد إلكتروني صالح.",
    },
    en: {
        email: "Email",
        emailPlaceholder: "you@example.com",
        sendResetLink: "Send Reset Link",
        sending: "Sending...",
        emailSent: "Email Sent!",
        emailSentDesc: "If an account with this email exists, a password reset link has been sent.",
        sendFailed: "Send Failed",
        sendFailedDesc: "An error occurred while sending the email. Please try again.",
        backToLogin: "Back to Login",
        emailInvalid: "Please enter a valid email address.",
    }
}

const getForgotPasswordFormSchema = (t: typeof translations.en) => z.object({
  email: z.string().email({ message: t.emailInvalid }),
});

export default function ForgotPasswordForm() {
  const { toast } = useToast();
  const { sendPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  const formSchema = getForgotPasswordFormSchema(t);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await sendPasswordReset(data.email);
      toast({
        title: t.emailSent,
        description: t.emailSentDesc,
      });
      setEmailSent(true);
    } catch (error: any) {
       toast({
        title: t.sendFailed,
        description: t.sendFailedDesc,
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }

  if (emailSent) {
      return (
          <div className="text-center space-y-4">
              <p>{t.emailSentDesc}</p>
              <Button asChild>
                  <Link href="/login">{t.backToLogin}</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? t.sending : <><Send className="mr-2 h-4 w-4" /> {t.sendResetLink}</>}
                </Button>
            </form>
        </Form>
        <div className="text-center text-sm">
            <Link href="/login" className="underline text-primary">
                {t.backToLogin}
            </Link>
        </div>
    </div>
  );
}
