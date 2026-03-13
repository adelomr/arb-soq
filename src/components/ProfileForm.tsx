

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Save, FileUp, Loader2, Phone, MessageSquare, BadgeCheck, MapPin, Store, Trash2, Briefcase, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useEffect, useState, useRef } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { Skeleton } from './ui/skeleton';
import type { ConfirmationResult } from 'firebase/auth';
import { Badge } from './ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfessionSelect from './ProfessionSelect';
import { Label } from './ui/label';
import { markets, Market } from '@/lib/markets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

const translations = {
    ar: {
        name: "الاسم",
        namePlaceholder: "أدخل اسمك الكامل",
        nameMin: "يجب أن يكون الاسم من حرفين على الأقل.",
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
        phoneNumber: "رقم الهاتف",
        phonePlaceholder: "",
        phoneDesc: "أدخل رقم هاتفك مع رمز البلد للتحقق.",
        phoneVerified: "تم التحقق",
        sendCode: "إرسال الرمز",
        codeSent: "تم الإرسال",
        resendCode: "إعادة إرسال",
        verificationCode: "رمز التحقق",
        verificationCodePlaceholder: "أدخل الرمز المكون من 6 أرقام",
        verify: "تحقق",
        verifying: "جارٍ التحقق...",
        changePicture: "تغيير الصورة",
        saveChanges: "حفظ التغييرات",
        saving: "جارٍ الحفظ...",
        uploadingImage: "جارٍ تحميل الصورة...",
        imageUploadSuccess: "تم تحميل الصورة بنجاح!",
        imageUploadFailed: "فشل تحميل الصورة",
        imageUploadFailedDesc: "فشلت عملية رفع الصورة. يرجى المحاولة مرة أخرى.",
        updatingProfile: "جارٍ تحديث الملف الشخصي...",
        changesSaved: "تم حفظ التغييرات بنجاح!",
        noChangesToSave: "لا توجد تغييرات تستوجب الحفظ",
        unexpectedError: "حدث خطأ غير متوقع",
        unexpectedErrorDesc: "فشل تحديث الملف الشخصي.",
        invalidPhoneNumber: "رقم هاتف غير صالح",
        invalidPhoneNumberDesc: "الرجاء إدخال رقم هاتف صالح مع رمز البلد (مثال: +966501234567).",
        codeSentSuccess: "تم إرسال الرمز",
        codeSentSuccessDesc: "تم إرسال رمز التحقق إلى هاتفك.",
        codeSendError: "فشل إرسال الرمز",
        codeSendErrorDesc: "حدث خطأ أثناء إرسال رمز التحقق. تأكد من أن رقم الهاتف صالح وأنك قد أكملت reCAPTCHA (قد يكون غير مرئي).",
        tooManyRequestsError: "تم إرسال طلبات كثيرة جدًا. الرجاء المحاولة مرة أخرى لاحقًا.",
        verificationError: "خطأ",
        verificationErrorDesc: "الرجاء إدخال رمز التحقق أولاً.",
        phoneVerifiedSuccess: "تم التحقق من الهاتف!",
        phoneVerifiedSuccessDesc: "تم التحقق من رقم هاتفك بنجاح.",
        dangerZone: "منطقة الخطر",
        deleteAccount: "حذف الحساب",
        deleteAccountDesc: "سيتم حزف جميع اعلاناتك والمتاجرالتي قمت بانشائها واي بيانات خاصة بالحسابات او المحفظة بشكل نهائي ولن تتمكن من استرداد البيانات حتي بعد التسجيل بنفس الحساب مرة اخري ولن تتمكن من استرداد البيانات حتي بعد التسجيل بنفس الحساب مرة اخري",
        cancel: "إلغاء",
        confirmDelete: "نعم، احذف حسابي",
        deleting: "جارٍ الحذف...",
        accountDeleted: "تم حذف الحساب",
        accountDeletedDesc: "تم حذف حسابك بنجاح. سيتم الآن تسجيل خروجك.",
        deleteError: "فشل حذف الحساب",
        deleteDialogTitle: "هل أنت متأكد من حذف حسابك؟",
        deleteDialogDesc: "سيتم حذف حسابك وجميع بياناتك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.",
        reauthRequiredTitle: "مطلوب إعادة المصادقة",
        reauthRequiredDesc: "لأسباب أمنية، يرجى تسجيل الخروج ثم تسجيل الدخول مرة أخرى قبل محاولة حذف حسابك.",
        login: "تسجيل الدخول",
        contactSupport: "تواصل مع الدعم",
        continueAttempt: "متابعة المحاولة",
        profession: "المهنة",
        professionDesc: "مهنتك ستظهر في سوق العمال.",
        specialization: "التخصص",
        specializationPlaceholder: "مثال: طب الأطفال، برمجة الواجهة الأمامية",
        phoneCountryCode: "الدولة"
    },
}

const getProfileFormSchema = (t: typeof translations.ar) => z.object({
  name: z.string().min(2, { message: t.nameMin }),
  country: z.string().min(2, { message: t.countryRequired }),
  province: z.string().min(2, { message: t.provinceRequired }),
  city: z.string().min(2, { message: t.cityRequired }),
  village: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  verificationCode: z.string().optional(),
  profession: z.string().optional(),
  specialization: z.string().optional(),
});


export default function ProfileForm() {
  const { toast } = useToast();
  const { user, userProfile, updateUserProfile, uploadProfileImage, loading: authLoading, sendVerificationCode, confirmVerificationCode, deleteUserProfile, refreshUserProfile, professions } = useAuth();
  const { language, direction } = useLanguage();
  const router = useRouter();
  const t = translations.ar;
  const profileFormSchema = getProfileFormSchema(t);
  type ProfileFormValues = z.infer<typeof profileFormSchema>;
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
  const [showEgyptPhoneWarning, setShowEgyptPhoneWarning] = useState(false);
  const [sendCodeAttempts, setSendCodeAttempts] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  const COOLDOWN_SECONDS = 60;
  const COOLDOWN_STORAGE_KEY = 'phoneVerificationCooldown';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      country: '',
      province: '',
      city: '',
      village: '',
      phoneCountryCode: markets[0].id,
      phoneNumber: '',
      verificationCode: '',
      profession: '',
      specialization: '',
    },
  });

  const selectedPhoneCountryId = form.watch('phoneCountryCode');
  const selectedPhoneCountry = markets.find(m => m.id === selectedPhoneCountryId);

  useEffect(() => {
    setIsClient(true);
    if (userProfile) {
      const phone = userProfile.phoneNumber || '';
      let phoneCountry : Market | null = null;
      let phoneNum = phone;

      for (const m of markets) {
          if (phone.startsWith(m.phoneCode)) {
              phoneCountry = m;
              phoneNum = phone.substring(m.phoneCode.length);
              break;
          }
      }

      form.reset({
        name: userProfile.name || '',
        country: userProfile.country || '',
        province: userProfile.province || '',
        city: userProfile.city || '',
        village: userProfile.village || '',
        phoneCountryCode: phoneCountry?.id || markets[0].id,
        phoneNumber: phoneNum,
        profession: userProfile.profession || '',
        specialization: userProfile.specialization || '',
        verificationCode: '',
      });
      if(userProfile.avatarUrl) {
        setAvatarPreview(userProfile.avatarUrl);
      }
    }
  }, [userProfile, form]);
  
  useEffect(() => {
    const cooldownEndTime = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (cooldownEndTime) {
      const remainingTime = Math.ceil((parseInt(cooldownEndTime, 10) - Date.now()) / 1000);
      if (remainingTime > 0) {
        setCooldown(remainingTime);
      }
    }

    return () => {
      if (cooldownTimer.current) {
        clearTimeout(cooldownTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimer.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    } else {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
    }
  
    return () => {
      if (cooldownTimer.current) {
        clearTimeout(cooldownTimer.current);
      }
    };
  }, [cooldown]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const proceedWithSendCode = async () => {
      if (!user) return;
      const phoneNumberInput = form.getValues('phoneNumber');
      const phoneCountryCode = markets.find(m => m.id === form.getValues('phoneCountryCode'))?.phoneCode;
      
      if (!phoneNumberInput || !phoneCountryCode) {
          toast({ title: t.invalidPhoneNumber, description: t.invalidPhoneNumberDesc, variant: 'destructive' });
          return;
      }
      
      const fullPhoneNumber = `${phoneCountryCode}${phoneNumberInput.replace(/^0+/, '')}`;

      if (!/^\+[1-9]\d{1,14}$/.test(fullPhoneNumber)) {
          toast({ title: t.invalidPhoneNumber, description: t.invalidPhoneNumberDesc, variant: 'destructive' });
          return;
      }
  
      setIsSendingCode(true);
      try {
          const result = await sendVerificationCode(fullPhoneNumber);
          setConfirmationResult(result);
          setCodeSent(true);
          const cooldownEndTime = Date.now() + COOLDOWN_SECONDS * 1000;
          localStorage.setItem(COOLDOWN_STORAGE_KEY, cooldownEndTime.toString());
          setCooldown(COOLDOWN_SECONDS);
          toast({ title: t.codeSentSuccess, description: t.codeSentSuccessDesc });
      } catch (error: any) {
          console.error("Error sending verification code: ", error);
          let description = t.codeSendErrorDesc;
          if (error.code === 'auth/too-many-requests') {
              description = t.tooManyRequestsError;
          }
          toast({ title: t.codeSendError, description: description, variant: 'destructive' });
          setConfirmationResult(null);
      } finally {
          setIsSendingCode(false);
      }
  };

  const handleSendCode = async () => {
    const phoneNumber = form.getValues('phoneNumber');
    setSendCodeAttempts(prev => prev + 1);

    if (phoneNumber?.startsWith('+2011') && sendCodeAttempts < 1) {
        setShowEgyptPhoneWarning(true);
    } else {
        proceedWithSendCode();
    }
  };

  const handleVerifyCode = async () => {
    const code = form.getValues('verificationCode');
    if (!confirmationResult || !code) {
        toast({ title: t.verificationError, description: t.verificationErrorDesc, variant: 'destructive' });
        return;
    }
    
    setIsVerifying(true);
    try {
        await confirmVerificationCode(confirmationResult, code);
        
        const phoneNumberInput = form.getValues('phoneNumber');
        const phoneCountry = markets.find(m => m.id === form.getValues('phoneCountryCode'));
        const fullPhoneNumber = phoneCountry ? `${phoneCountry.phoneCode}${phoneNumberInput?.replace(/^0+/, '')}` : '';

        await updateUserProfile(user!.uid, { phoneNumber: fullPhoneNumber, phoneVerified: true });

        toast({ title: t.phoneVerifiedSuccess, description: t.phoneVerifiedSuccessDesc });

        setCodeSent(false);
        setConfirmationResult(null);
        await refreshUserProfile();

    } catch (error) {
        console.error("Error verifying code: ", error);
        toast({ title: "فشل التحقق", description: "رمز التحقق غير صالح. الرجاء المحاولة مرة أخرى.", variant: 'destructive' });
    } finally {
        setIsVerifying(false);
    }
  };


  async function onSubmit(data: ProfileFormValues) {
    if (!user || !userProfile) return;
    
    const fullPhoneNumber = data.phoneNumber && data.phoneCountryCode
    ? `${markets.find(m => m.id === data.phoneCountryCode)?.phoneCode}${data.phoneNumber.replace(/^0+/, '')}`
    : '';

    const hasFormChanged = 
        data.name !== userProfile.name ||
        data.country !== userProfile.country ||
        data.province !== userProfile.province ||
        data.city !== userProfile.city ||
        data.village !== userProfile.village ||
        data.profession !== userProfile.profession ||
        data.specialization !== userProfile.specialization ||
        fullPhoneNumber !== userProfile.phoneNumber ||
        imageFile !== null;

    if (!hasFormChanged) {
        toast({ title: t.noChangesToSave });
        router.push('/');
        return;
    }

    setIsSaving(true);
    try {
        let newAvatarUrl = userProfile.avatarUrl;
        const hadProfession = !!userProfile.profession;

        if (imageFile) {
            toast({ title: t.uploadingImage });
            const filePath = `avatars/${user.uid}/${imageFile.name}`;
            newAvatarUrl = await uploadProfileImage(user.uid, imageFile, filePath);
            toast({ title: t.imageUploadSuccess });
        }

        const profileData: Partial<UserProfile> = {
            name: data.name,
            country: data.country,
            province: data.province,
            city: data.city,
            village: data.village,
            avatarUrl: newAvatarUrl,
            profession: data.profession,
            specialization: data.specialization,
        };
        
        if (fullPhoneNumber !== userProfile.phoneNumber) {
            profileData.phoneNumber = fullPhoneNumber;
            profileData.phoneVerified = false; // Always reset verification status on number change
        }

        toast({ title: t.updatingProfile });
        await updateUserProfile(user.uid, profileData);
        setImageFile(null); 
        toast({ title: t.changesSaved });

        if (data.profession && !hadProfession) {
             router.push('/labor-market');
        } else {
            router.push('/');
        }
    } catch (error: any) {
        console.error("Profile update error:", error);
        toast({
            title: t.unexpectedError,
            description: error.message || t.unexpectedErrorDesc,
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
}
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);
    try {
        await deleteUserProfile();
        toast({
            title: t.accountDeleted,
            description: t.accountDeletedDesc,
        });
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
            toast({
                title: t.reauthRequiredTitle,
                description: t.reauthRequiredDesc,
                variant: "destructive",
                duration: 9000,
            });
        } else {
            toast({
                title: t.deleteError,
                description: error.message || t.unexpectedError,
                variant: "destructive",
            });
        }
    } finally {
        setIsDeleting(false);
    }
  };

  const watchedProfessionId = form.watch('profession');
  const selectedProfessionData = professions.find(p => p.id === watchedProfessionId);
  const showSpecialization = selectedProfessionData?.hasSpecialization === true || (selectedProfessionData?.name?.ar && ['طبيب', 'معلم'].includes(selectedProfessionData.name.ar));


  if (authLoading) {
    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    )
  }

  const isPhoneDirty = form.watch('phoneNumber') !== (userProfile?.phoneNumber || '').substring((selectedPhoneCountry?.phoneCode || '').length);
  const isPhoneEmpty = !form.watch('phoneNumber');
  const showVerification = !userProfile?.phoneVerified || isPhoneDirty || !userProfile.phoneNumber;
  const isPhoneInputDisabled = codeSent || (userProfile?.phoneVerified && !!userProfile.phoneNumber && !isPhoneDirty);

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
             <Avatar className="w-24 h-24 md:w-32 md:w-32 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={avatarPreview || undefined} alt={form.watch('name')} />
                <AvatarFallback><User className="w-12 h-12 md:w-16 md:w-16" /></AvatarFallback>
            </Avatar>
            <div className="relative">
                <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                    <FileUp className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t.changePicture}
                </Button>
                <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
        </div>

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
        
        {isClient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.profession}</FormLabel>
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
        )}


        <div className="space-y-4">
            <Label className="text-lg font-medium">العنوان</Label>
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

        <div className="space-y-4">
            <Label className="text-lg font-medium flex items-center gap-2">
                 <Phone className="h-5 w-5"/>
                <span>{t.phoneNumber}</span>
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
                            disabled={isPhoneInputDisabled}
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
            <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                            <FormItem className="flex-1">
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
                                    disabled={isPhoneInputDisabled}
                                />
                                </FormControl>
                            </div>
                         </FormItem>
                    )}
                />
                {showVerification && (
                    <div className="self-end">
                        <Button
                            type="button"
                            onClick={handleSendCode}
                            disabled={isSendingCode || isPhoneEmpty || cooldown > 0}
                            variant="secondary"
                            className="relative w-28"
                        >
                            {isSendingCode ? <Loader2 className="animate-spin h-4 w-4" /> : cooldown > 0 ? `${t.resendCode} (${cooldown})` : t.sendCode}
                        </Button>
                    </div>
                )}
            </div>
            <FormMessage />
        </div>


        {codeSent && (
            <FormField
            control={form.control}
            name="verificationCode"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center">
                    <MessageSquare className={direction === 'rtl' ? 'ml-2 h-5 w-5' : 'mr-2 h-s w-5'}/>
                    {t.verificationCode}
                </FormLabel>
                 <div className="flex gap-2">
                    <FormControl>
                        <Input 
                            type="text" 
                            placeholder={t.verificationCodePlaceholder} 
                            {...field} 
                            maxLength={6}
                            dir="ltr"
                            className="tracking-[0.5em] md:tracking-[1rem] text-center"
                        />
                    </FormControl>
                     <Button 
                        type="button" 
                        onClick={handleVerifyCode} 
                        disabled={isVerifying || !form.watch('verificationCode')}
                        className="relative w-28"
                    >
                        {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : t.verify}
                     </Button>
                 </div>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
       
        <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />}
          {isSaving ? t.saving : t.saveChanges}
        </Button>
      </form>
    </Form>

    <Separator className="my-8" />
    
    <div className="space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <h3 className="text-lg font-semibold text-destructive">{t.dangerZone}</h3>
        <p className="text-sm text-destructive/80">{t.deleteAccountDesc}</p>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />}
            {isDeleting ? t.deleting : t.deleteAccount}
        </Button>
    </div>

     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDialogDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.deleting}</>
              ) : (
                t.confirmDelete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEgyptPhoneWarning} onOpenChange={setShowEgyptPhoneWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{'مشكلة في رقم الهاتف المصري'}</AlertDialogTitle>
            <AlertDialogDescription>{'هناك مشكلة معروفة مع بعض شركات الاتصالات في مصر قد تمنعك من استلام الرمز. هل ترغب في المتابعة والمحاولة على أي حال؟'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
                <Link href="/contact">{t.contactSupport}</Link>
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => {
                setShowEgyptPhoneWarning(false);
                proceedWithSendCode();
            }}>
              {t.continueAttempt}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
