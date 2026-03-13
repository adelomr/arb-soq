
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
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const translations = {
    ar: {
        password: "كلمة المرور الجديدة",
        passwordPlaceholder: "********",
        confirmPassword: "تأكيد كلمة المرور الجديدة",
        passwordMin: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
        passwordsNoMatch: "كلمتا المرور غير متطابقتين",
        resetPasswordButton: "إعادة تعيين كلمة المرور",
        reseting: "جارٍ الحفظ...",
        successTitle: "تم تغيير كلمة المرور!",
        successDesc: "تم تحديث كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول.",
        backToLogin: "العودة لتسجيل الدخول",
        errorTitle: "فشل إعادة التعيين",
        errorDesc: "الرابط غير صالح أو انتهت صلاحيته. الرجاء طلب رابط جديد.",
        invalidLink: "رابط غير صالح أو منتهي الصلاحية. الرجاء المحاولة مرة أخرى.",
        verifyingLink: "جارٍ التحقق من الرابط...",
    },
    en: {
        password: "New Password",
        passwordPlaceholder: "********",
        confirmPassword: "Confirm New Password",
        passwordMin: "Password must be at least 6 characters.",
        passwordsNoMatch: "Passwords do not match",
        resetPasswordButton: "Reset Password",
        reseting: "Saving...",
        successTitle: "Password Changed!",
        successDesc: "Your password has been updated successfully. You can now log in.",
        backToLogin: "Back to Login",
        errorTitle: "Reset Failed",
        errorDesc: "The link is invalid or has expired. Please request a new one.",
        invalidLink: "Invalid or expired link. Please try again.",
        verifyingLink: "Verifying link...",
    }
}

const getResetPasswordFormSchema = (t: typeof translations.en) => z.object({
  password: z.string().min(6, { message: t.passwordMin }),
  confirmPassword: z.string().min(6, { message: t.passwordMin }),
}).refine(data => data.password === data.confirmPassword, {
    message: t.passwordsNoMatch,
    path: ['confirmPassword'],
});

function ResetPasswordFormComponent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyPasswordResetCode, confirmPasswordReset } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { language, direction } = useLanguage();
  const t = translations[language];

  const formSchema = getResetPasswordFormSchema(t);
  type FormValues = z.infer<typeof formSchema>;

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (code) {
      setOobCode(code);
      verifyPasswordResetCode(code)
        .then(() => setIsValidCode(true))
        .catch(() => {
            setIsValidCode(false);
            toast({
                title: t.errorTitle,
                description: t.invalidLink,
                variant: 'destructive',
            });
        });
    } else {
        setIsValidCode(false);
    }
  }, [searchParams, verifyPasswordResetCode, t, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: FormValues) {
    if (!oobCode) return;
    setIsLoading(true);
    try {
      await confirmPasswordReset(oobCode, data.password);
      toast({
        title: t.successTitle,
        description: t.successDesc,
      });
      setPasswordReset(true);
    } catch (error: any) {
       toast({
        title: t.errorTitle,
        description: t.errorDesc,
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (isValidCode === null) {
    return <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> {t.verifyingLink}</div>;
  }
  
  if (isValidCode === false) {
    return (
        <div className="text-center space-y-4">
            <p className="text-destructive">{t.invalidLink}</p>
            <Button asChild>
                <Link href="/forgot-password">اطلب رابطًا جديدًا</Link>
            </Button>
        </div>
    );
  }

  if (passwordReset) {
      return (
          <div className="text-center space-y-4">
              <p>{t.successDesc}</p>
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
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.password}</FormLabel>
                            <div className="relative">
                                <FormControl>
                                    <Input type={showPassword ? 'text' : 'password'} placeholder={t.passwordPlaceholder} {...field} />
                                </FormControl>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute inset-y-0 flex items-center p-2 text-muted-foreground ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t.confirmPassword}</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input type={showConfirmPassword ? 'text' : 'password'} placeholder={t.passwordPlaceholder} {...field} />
                            </FormControl>
                             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute inset-y-0 flex items-center p-2 text-muted-foreground ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />{t.reseting}</> : <><Save className="mr-2 h-4 w-4" /> {t.resetPasswordButton}</>}
                </Button>
            </form>
        </Form>
    </div>
  );
}

export default function ResetPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordFormComponent />
        </Suspense>
    )
}
