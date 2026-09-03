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
import {
  UserPlus,
  Loader2,
  Phone,
  MapPin,
  LocateFixed,
  Globe,
  Building2,
  Building,
  Home,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { markets } from '@/lib/markets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectUserLocation, buildFullAddress } from '@/lib/locationEngine';

const translations = {
  ar: {
    fullName: "الاسم الكامل",
    namePlaceholder: "أدخل اسمك...",
    nameMin: "يجب أن يكون الاسم من حرفين على الأقل.",
    email: "البريد الإلكتروني",
    address: "بيانات الموقع والعنوان (4 مربعات)",
    country: "1. الدولة",
    countryPlaceholder: "مثال: السعودية أو مصر",
    countryRequired: "الدولة مطلوبة.",
    province: "2. المحافظة / المنطقة",
    provincePlaceholder: "مثال: منطقة الرياض أو الدقهلية",
    provinceRequired: "المحافظة مطلوبة.",
    city: "3. المدينة / المركز",
    cityPlaceholder: "مثال: الرياض أو المنصورة",
    cityRequired: "المدينة مطلوبة.",
    village: "4. الحي / القرية / الشارع",
    villagePlaceholder: "مثال: حي العليا أو شارع الجيش",
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
    phoneCountryCode: "الدولة",
    detectLocationBtn: "تحديد موقعي وتعبئة المربعات تلقائياً (GPS)",
    detectingLocation: "جارٍ تحديد الموقع وتحويل الإحداثيات لأسماء...",
  },
};

const getSignUpFormSchema = (t: typeof translations.ar) => z.object({
  name: z.string().min(2, { message: t.nameMin }),
  email: z.string().email(),
  country: z.string().min(2, { message: t.countryRequired }),
  province: z.string().min(2, { message: t.provinceRequired }),
  city: z.string().min(2, { message: t.cityRequired }),
  village: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export default function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, createUserProfile, loading: authLoading } = useAuth();
  const { language, direction } = useLanguage();
  const t = translations.ar;

  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

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
      phoneCountryCode: markets[0].id,
      phoneNumber: '',
    },
  });

  const selectedPhoneCountryId = form.watch('phoneCountryCode');
  const selectedPhoneCountry = markets.find(m => m.id === selectedPhoneCountryId);

  const watchedCountry = form.watch('country');
  const watchedProvince = form.watch('province');
  const watchedCity = form.watch('city');
  const watchedVillage = form.watch('village');
  const fullAddressSummary = buildFullAddress(watchedVillage, watchedCity, watchedProvince, watchedCountry);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      form.setValue('name', user.displayName || '');
      form.setValue('email', user.email || '');
    }
  }, [user, authLoading, router, form]);

  const handleDetectGPS = async () => {
    setIsDetectingLocation(true);
    try {
      // قراءة الـ GPS وتحويل الإحداثيات لأسماء عبر Geocoder
      const loc = await detectUserLocation();

      if (loc.country && loc.country !== 'غير محدد') {
        form.setValue('country', loc.country, { shouldValidate: true });
      }
      if (loc.governorate && loc.governorate !== 'غير محدد') {
        form.setValue('province', loc.governorate, { shouldValidate: true });
      }
      if (loc.city && loc.city !== 'غير محدد') {
        form.setValue('city', loc.city, { shouldValidate: true });
      }
      if (loc.village && loc.village !== 'غير محدد') {
        form.setValue('village', loc.village, { shouldValidate: true });
      }

      if (loc.latitude && loc.longitude) {
        setCoords({ lat: loc.latitude, lng: loc.longitude });
      }

      toast({
        title: 'تم تحديد موقعك بدقة 🛰️',
        description: `تم تحويل الإحداثيات وتعبئة المربعات الأربعة: ${loc.fullAddress}`,
      });
    } catch (err: any) {
      toast({
        title: 'تنبيه الموقع الجغرافي',
        description: err?.message || 'تعذر تحديد الموقع. تأكد من تفعيل الـ GPS في جهازك.',
        variant: 'destructive',
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  async function onSubmit(data: SignUpFormValues) {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsLoading(true);

    let fullPhoneNumber = '';
    if (data.phoneNumber && data.phoneCountryCode) {
      const countryObj = markets.find(m => m.id === data.phoneCountryCode);
      if (countryObj) {
        fullPhoneNumber = `${countryObj.phoneCode}${data.phoneNumber.replace(/^0+/, '')}`;
      }
    }

    try {
      await createUserProfile(
        user.uid,
        {
          name: data.name,
          email: data.email,
          country: data.country,
          province: data.province,
          city: data.city,
          village: data.village,
          address: fullAddressSummary,
          latitude: coords?.lat || 0,
          longitude: coords?.lng || 0,
          phoneNumber: fullPhoneNumber,
        },
        user.photoURL || undefined
      );

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

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
        {/* الاسم الكامل */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-sm">{t.fullName}</FormLabel>
              <FormControl>
                <Input placeholder={t.namePlaceholder} {...field} className="h-11 text-sm rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* البريد الإلكتروني */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-sm">{t.email}</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled className="h-11 text-sm rounded-xl bg-muted/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* قسم العنوان والمربعات الأربعة (Targeting 4 Boxes) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-muted/20 border border-border/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-base font-bold flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              {t.address}
            </Label>

            {/* زر تحديد الموقع التلقائي من GPS */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDetectGPS}
              disabled={isDetectingLocation}
              className="h-10 px-4 rounded-xl border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t.detectingLocation}</span>
                </>
              ) : (
                <>
                  <LocateFixed className="h-4 w-4" />
                  <span>{t.detectLocationBtn}</span>
                </>
              )}
            </Button>
          </div>

          {/* شبكة المربعات الأربعة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 1. الدولة */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="p-3 rounded-2xl bg-card border border-border/70 space-y-1">
                  <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    {t.country}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.countryPlaceholder} {...field} className="h-9 text-xs border-border/60" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. المحافظة / المنطقة */}
            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem className="p-3 rounded-2xl bg-card border border-border/70 space-y-1">
                  <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    {t.province}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.provincePlaceholder} {...field} className="h-9 text-xs border-border/60" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. المدينة / المركز */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="p-3 rounded-2xl bg-card border border-border/70 space-y-1">
                  <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    {t.city}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.cityPlaceholder} {...field} className="h-9 text-xs border-border/60" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. الحي / القرية */}
            <FormField
              control={form.control}
              name="village"
              render={({ field }) => (
                <FormItem className="p-3 rounded-2xl bg-card border border-border/70 space-y-1">
                  <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-primary" />
                    {t.village}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.villagePlaceholder} {...field} className="h-9 text-xs border-border/60" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* شريط ملخص العنوان الكامل */}
          {fullAddressSummary && fullAddressSummary !== 'غير محدد' && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">العنوان الكامل المعتمد:</span>
              <strong className="text-foreground font-semibold">{fullAddressSummary}</strong>
            </div>
          )}
        </div>

        {/* رقم الهاتف */}
        <div className="space-y-4">
          <Label className="text-base font-bold flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {t.phoneNumber}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="phoneCountryCode"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel className="text-xs font-bold">{t.phoneCountryCode}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl text-xs">
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
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-xs font-bold">{t.phoneNumber}</FormLabel>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground text-xs font-mono">
                      <span>{selectedPhoneCountry?.phoneCode}</span>
                    </div>
                    <FormControl>
                      <Input
                        type="tel"
                        {...field}
                        placeholder={t.phonePlaceholder}
                        dir="ltr"
                        className="h-11 pl-16 text-left rounded-xl text-sm font-mono"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* زر إنشاء الحساب */}
        <Button type="submit" className="w-full h-12 text-base font-bold rounded-2xl shadow-lg" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 ml-2" /> {t.creatingAccount}
            </>
          ) : (
            <>
              <UserPlus className="ml-2 h-5 w-5" /> {t.completeRegistration}
            </>
          )}
        </Button>

        <div className="text-center text-sm pt-2">
          <Link href="/login" className="underline text-primary font-medium hover:text-primary/80">
            {t.login}
          </Link>
        </div>
      </form>
    </Form>
  );
}
