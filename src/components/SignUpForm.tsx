

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
import { UserPlus, Loader2, Briefcase, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import ProfessionSelect from './ProfessionSelect';
import { markets, Market } from '@/lib/markets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const translations = {
    ar: {
        fullName: "الاسم الكامل",
        namePlaceholder: "أدخل اسمك...",
        nameMin: "يجب أن يكون الاسم من حرفين على الأقل.",
        email: "البريد الإلكتروني",
        address: "العنوان",
        country: "الدولة",
        countryPlaceholder: "مثال: السعودية",
        countryRequired: "الدولة مطلوبة.",
        province: "المحافظة / المنطقة",
        provincePlaceholder: "مثال: منطقة الرياض",
        provinceRequired: "المحافظة مطلوبة.",
        city: "المدينة",
        cityPlaceholder: "مثال: الرياض",
        cityRequired: "المدينة مطلوبة.",
        village: "القرية (اختياري)",
        villagePlaceholder: "مثال: الدرعية",
        completeRegistration: "إكمال التسجيل",
        creatingAccount: "جارٍ الإنشاء...",
        login: "تسجيل الدخول",
        loading: "جار التحميل...",
        registrationComplete: "اكتمل التسجيل!",
        registrationCompleteDesc: "تم إنشاء حسابك بنجاح. سيتم توجيهك الآن.",
        signupFailed: "فشل إنشاء الحساب",
        genericSignupError: "حدث خطأ أثناء إنشاء حسابك.",
        profession: "المهنة (اختياري)",
        specialization: "التخصص (اختياري)",
        specializationPlaceholder: "مثال: طب الأطفال، برمجة الواجهة الأمامية",
        phoneNumber: "رقم الهاتف (اختياري)",
        phonePlaceholder: "",
        phoneCountryCode: "الدولة"
    },
}

const getSignUpFormSchema = (t: typeof translations.ar) => z.object({
  name: z.string().min(2, { message: t.nameMin }),
  email: z.string().email(),
  country: z.string().min(2, { message: t.countryRequired }),
  province: z.string().min(2, { message: t.provinceRequired }),
  city: z.string().min(2, { message: t.cityRequired }),
  village: z.string().optional(),
  profession: z.string().optional(),
  specialization: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
});


export default function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, createUserProfile, loading: authLoading, professions } = useAuth();
  const { language, direction } = useLanguage();
  const t = translations.ar;

  const [isLoading, setIsLoading] = useState(false);
    
  const signUpFormSchema = getSignUpFormSchema(t);
  type SignUpFormValues = z.infer<typeof signUpFormSchema>;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: '',
      email: '',
      country: '',
      province: '',
      city: '',
      village: '',
      profession: '',
      specialization: '',
      phoneCountryCode: markets[0].id,
      phoneNumber: '',
    },
  });

  const selectedPhoneCountryId = form.watch('phoneCountryCode');
  const selectedPhoneCountry = markets.find(m => m.id === selectedPhoneCountryId);

  useEffect(() => {
    if (!authLoading && !user) {
        // If not logged in and not loading, go to login page
        router.push('/login');
    }
    if (user) {
        form.setValue('name', user.displayName || '');
        form.setValue('email', user.email || '');
    }
  }, [user, authLoading, router, form]);


  async function onSubmit(data: SignUpFormValues) {
    if (!user) {
        router.push('/login');
        return;
    }
    setIsLoading(true);

    let fullPhoneNumber = '';
    if (data.phoneNumber && data.phoneCountryCode) {
        const country = markets.find(m => m.id === data.phoneCountryCode);
        if (country) {
            fullPhoneNumber = `${country.phoneCode}${data.phoneNumber.replace(/^0+/, '')}`;
        }
    }

    try {
      await createUserProfile(user.uid, { 
          name: data.name,
          email: data.email,
          country: data.country,
          province: data.province,
          city: data.city,
          village: data.village,
          profession: data.profession,
          specialization: data.specialization,
          phoneNumber: fullPhoneNumber,
      });
      
      toast({
        title: t.registrationComplete,
        description: t.registrationCompleteDesc,
      });
      router.push('/');
    } catch (error: any) {
       toast({
        title: t.signupFailed,
        description: t.genericSignupError,
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }
  
  const watchedProfessionId = form.watch('profession');
  const selectedProfessionData = professions.find(p => p.id === watchedProfessionId);
  const showSpecialization = selectedProfessionData?.hasSpecialization === true || (selectedProfessionData?.name?.ar && ['طبيب', 'معلم'].includes(selectedProfessionData.name.ar));


  if (authLoading || !user) {
      return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.fullName}</FormLabel>
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
                <Input type="email" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <Label className="text-lg font-medium">{t.address}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.country}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.countryPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                        <FormItem>
                             <FormLabel>{t.province}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.provincePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                         <FormItem>
                             <FormLabel>{t.city}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.cityPlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="village"
                    render={({ field }) => (
                         <FormItem>
                             <FormLabel>{t.village}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.villagePlaceholder} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            {t.profession}
                        </FormLabel>
                        <ProfessionSelect 
                            value={field.value || ''}
                            onChange={field.onChange}
                            professions={professions}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            {showSpecialization && (
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.specialization}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.specializationPlaceholder} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
        </div>
        
        <div className="space-y-4">
            <Label className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-5 w-5"/>
                {t.phoneNumber}
            </Label>
             <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t.phoneCountryCode}</FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        dir="rtl"
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر دولة" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {markets.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name.ar}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t.phoneNumber}</FormLabel>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                <span>{selectedPhoneCountry?.phoneCode}</span>
                            </div>
                            <FormControl>
                            <Input
                                type="tel"
                                {...field}
                                placeholder={t.phonePlaceholder}
                                dir="ltr"
                                className="pl-16 text-left"
                            />
                            </FormControl>
                        </div>
                    </FormItem>
                )}
            />
             <FormMessage />
        </div>
        
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? <><Loader2 className="animate-spin h-4 w-4" /> {t.creatingAccount}</> : <><UserPlus className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {t.completeRegistration}</>}
        </Button>
         <div className="text-center text-sm">
            <Link href="/login" className="underline text-primary">
                {t.login}
            </Link>
        </div>
      </form>
    </Form>
  );
}
