

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
import { User, Save, FileUp, Loader2, Phone, MessageSquare, BadgeCheck, MapPin, Store, Trash2, Briefcase, Eye, EyeOff, Pencil, LocateFixed, Globe, Building2, Building, Home, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { firestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Label } from './ui/label';
import { useMarket } from '@/context/MarketContext';
import { markets, Market } from '@/lib/markets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { detectUserLocation, buildFullAddress, saveAndSyncLocation, LocationData, loadSavedLocation } from '@/lib/locationEngine';

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
        village: "الحي / الشارع (اختياري)",
        villagePlaceholder: "مثال: شارع الملك فهد - حي العليا",
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


export default function ProfileForm({ isSignupMode = false }: { isSignupMode?: boolean }) {
  const { toast } = useToast();
  const { user, userProfile, updateUserProfile, uploadProfileImage, loading: authLoading, sendVerificationCode, confirmVerificationCode, deleteUserProfile, refreshUserProfile, professions } = useAuth();
  const { market } = useMarket();
  const { language, direction } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const t = translations.ar;
  const profileFormSchema = getProfileFormSchema(t);
  type ProfileFormValues = z.infer<typeof profileFormSchema>;
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
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
      phoneCountryCode: market?.id || markets[0].id,
      phoneNumber: '',
      verificationCode: '',
      profession: '',
      specialization: '',
    },
  });

  const selectedPhoneCountryId = form.watch('phoneCountryCode') || market?.id;
  const selectedPhoneCountry = markets.find(m => m.id === selectedPhoneCountryId) || market || markets[0];
  const watchedPhoneNumber = form.watch('phoneNumber');
  const isPhoneDirty = watchedPhoneNumber !== (userProfile?.phoneNumber || '').substring((selectedPhoneCountry?.phoneCode || '').length);
  const isPhoneEmpty = !watchedPhoneNumber;
  const showVerification = !userProfile?.phoneVerified || isPhoneDirty || !userProfile?.phoneNumber || isEditingPhone;
  const isPhoneInputDisabled = codeSent || (userProfile?.phoneVerified && !!userProfile?.phoneNumber && !isEditingPhone);

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

      const savedLoc = loadSavedLocation();
      const initialCountry = userProfile.country || (savedLoc?.country !== 'غير محدد' ? savedLoc?.country : '') || '';
      const initialProvince = userProfile.province || (userProfile as any).governorate || (savedLoc?.governorate !== 'غير محدد' ? savedLoc?.governorate : '') || '';
      const initialCity = userProfile.city || (savedLoc?.city !== 'غير محدد' ? savedLoc?.city : '') || '';
      const initialVillage = userProfile.village || (savedLoc?.village !== 'غير محدد' ? savedLoc?.village : '') || '';

      const activeMarket = phoneCountry || market || markets[0];

      form.reset({
        name: userProfile.name || user?.displayName || '',
        country: initialCountry,
        province: initialProvince,
        city: initialCity,
        village: initialVillage,
        phoneCountryCode: activeMarket.id,
        phoneNumber: phoneNum,
        profession: userProfile.profession || '',
        specialization: userProfile.specialization || '',
        verificationCode: '',
      });
      if(userProfile.avatarUrl) {
        setAvatarPreview(userProfile.avatarUrl);
      }
    }
  }, [userProfile, user, market, form]);
  
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

  const handleDetectGPS = async () => {
    setIsDetectingLocation(true);
    try {
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

  // ── إرسال كود التحقق حصرياً عبر بوابة واتساب ──
  const handleSendWhatsAppOTP = async () => {
      if (!user) return;
      const phoneNumberInput = form.getValues('phoneNumber');
      const phoneCountry = markets.find(m => m.id === form.getValues('phoneCountryCode')) || market || markets[0];
      const phoneCountryCode = phoneCountry?.phoneCode;

      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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
      const t0 = Date.now();
      try {
          if (isLocal) {
            console.log(`[WhatsApp OTP] Sending request for ${fullPhoneNumber} (userId: ${user?.uid})`);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const res = await fetch('/api/auth/whatsapp-otp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: fullPhoneNumber, userId: user?.uid }),
              signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const elapsed = Date.now() - t0;
          const data = await res.json().catch(() => ({ success: false, error: 'استجابة غير صالحة من الخادم.' }));

          if (data.success) {
              if (isLocal) {
                console.log(`[WhatsApp OTP] ✅ Success in ${elapsed}ms:`, data);
              }
              setCodeSent(true);
              const cooldownEndTime = Date.now() + COOLDOWN_SECONDS * 1000;
              localStorage.setItem(COOLDOWN_STORAGE_KEY, cooldownEndTime.toString());
              setCooldown(COOLDOWN_SECONDS);
              toast({ 
                  title: '✅ تم إرسال رمز التحقق عبر واتساب!', 
                  description: `تم إرسال رمز التحقق المكون من 6 أرقام إلى واتساب رقم (${fullPhoneNumber}).` 
              });
              return;
          }

          if (data.isPhoneAlreadyInUse || res.status === 409) {
            toast({
              title: '⚠️ رقم الهاتف مستخدم بالفعل',
              description: data.error || 'هذا الرقم مرتبط ومؤكد بالفعل بحساب آخر على سوق العرب. يرجى تسجيل الدخول بحسابك السابق أو استخدام رقم هاتف آخر لتأكيد هذا الحساب.',
              variant: 'destructive',
              duration: 9000,
            });
            return;
          }

          if (isLocal) {
            console.error(`[WhatsApp OTP] ❌ Failed in ${elapsed}ms:`, data);
          }

          const userFriendlyError = isLocal
            ? (data.error || 'يرجى التأكد من تشغيل خادم بوابة واتساب والاتصال بالحساب.')
            : (data.error || 'يرجى الانتظار بعض الوقت ثم إعادة المحاولة، يتم الآن تحديث السيرفر، يرجى المحاولة بعد قليل.');

          toast({
              title: 'تعذر إرسال الرمز عبر واتساب',
              description: userFriendlyError,
              variant: 'destructive',
          });
      } catch (error: any) {
          const elapsed = Date.now() - t0;
          console.error('[WhatsApp OTP] Exception:', error);
          const errorMsg = isLocal
            ? (error.name === 'AbortError' ? 'استغرقت عملية الإرسال وقتاً طويلاً (Timeout).' : error.message)
            : 'يرجى الانتظار بعض الوقت ثم إعادة المحاولة، يتم الآن تحديث السيرفر، يرجى المحاولة بعد قليل.';

          toast({ 
              title: 'تعذر إرسال الرمز', 
              description: errorMsg, 
              variant: 'destructive' 
          });
      } finally {
          setIsSendingCode(false);
      }
  };

  const syncCurrentLocation = async (countryVal?: string, provinceVal?: string, cityVal?: string, villageVal?: string) => {
    if (!countryVal && !provinceVal && !cityVal) return;
    const fullAddress = buildFullAddress(villageVal, cityVal, provinceVal, countryVal);
    const locationPayload: LocationData = {
      country: countryVal || 'غير محدد',
      governorate: provinceVal || 'غير محدد',
      city: cityVal || 'غير محدد',
      village: villageVal || 'غير محدد',
      fullAddress,
      latitude: coords?.lat || (userProfile as any)?.latitude || 0,
      longitude: coords?.lng || (userProfile as any)?.longitude || 0,
      scope: villageVal ? 'village' : cityVal ? 'city' : 'governorate',
      updatedAt: Date.now(),
    };
    await saveAndSyncLocation(locationPayload, user?.uid);
  };

  // ── التحقق من كود الـ OTP عبر بوابة واتساب ──
  const handleVerifyCode = async () => {
    const code = form.getValues('verificationCode');
    if (!code || !code.trim()) {
        toast({ title: t.verificationError, description: t.verificationErrorDesc, variant: 'destructive' });
        return;
    }
    
    setIsVerifying(true);
    try {
        const phoneNumberInput = form.getValues('phoneNumber');
        const phoneCountry = markets.find(m => m.id === form.getValues('phoneCountryCode')) || market || markets[0];
        const fullPhoneNumber = phoneCountry ? `${phoneCountry.phoneCode}${phoneNumberInput?.replace(/^0+/, '')}` : '';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const verifyRes = await fetch('/api/auth/whatsapp-otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: fullPhoneNumber, code: code.trim(), userId: user?.uid }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const verifyData = await verifyRes.json().catch(() => ({ success: false, error: 'استجابة غير صالحة من السيرفر.' }));

        if (!verifyData.success) {
            toast({ 
                title: "فشل التحقق", 
                description: verifyData.error || "رمز التحقق غير صحيح أو منتهي الصلاحية.", 
                variant: 'destructive' 
            });
            return;
        }

        const nameVal = form.getValues('name') || userProfile?.name || '';
        const countryVal = form.getValues('country') || userProfile?.country || '';
        const provinceVal = form.getValues('province') || userProfile?.province || '';
        const cityVal = form.getValues('city') || userProfile?.city || '';
        const villageVal = form.getValues('village') || userProfile?.village || '';
        const isDataComplete = Boolean(nameVal && countryVal && provinceVal && cityVal);

        if (user?.uid) {
            await updateUserProfile(user.uid, { 
              phoneNumber: fullPhoneNumber, 
              phoneVerified: true,
              country: countryVal,
              province: provinceVal,
              governorate: provinceVal,
              city: cityVal,
              village: villageVal,
              ...(isDataComplete ? { verified: true } : {})
            });
        }

        await syncCurrentLocation(countryVal, provinceVal, cityVal, villageVal);
        await refreshUserProfile();
        setCodeSent(false);
        setIsEditingPhone(false);

        if (isSignupMode) {
          toast({ 
            title: "🎉 تم إنشاء وتفعيل حسابك بنجاح!", 
            description: "تم تأكيد رقم هاتفك وتحديد موقع منطقتك، وأصبح حسابك موثقاً 🛡️." 
          });
          router.push(redirectUrl);
        } else {
          if (isDataComplete) {
            toast({ 
              title: "🎉 أصبح حسابك الآن موثقاً!", 
              description: "تم تأكيد رقم هاتفك واكتمال جميع بياناتك، وأصبح حسابك موثقاً بالعلامة الزرقاء 🛡️." 
            });
          } else {
            toast({ 
              title: t.phoneVerifiedSuccess, 
              description: "تم تأكيد رقم هاتفك بنجاح. أكمل باقي بياناتك الشخصية والعنوان ليصبح حسابك موثقاً." 
            });
          }
        }

    } catch (error: any) {
        console.error("Error verifying WhatsApp OTP: ", error);
        let errorDesc = error.message || "رمز التحقق غير صالح أو انتهت صلاحيته. الرجاء المحاولة مرة أخرى.";
        if (error.name === 'AbortError') {
            errorDesc = "استغرقت عملية التحقق وقتاً طويلاً. يرجى المحاولة ثانية.";
        }
        toast({ title: "فشل التحقق", description: errorDesc, variant: 'destructive' });
    } finally {
        setIsVerifying(false);
    }
  };

  const handleSaveAndSkipPhone = async () => {
    const isValid = await form.trigger(['name', 'country', 'province', 'city']);
    if (!isValid) {
      toast({
        title: "بيانات الموقع مطلوبة",
        description: "يرجى إدخال اسمك وتحديد (الدولة والمحافظة والمدينة) لحفظ موقعك الجغرافي.",
        variant: "destructive",
      });
      return;
    }
    const values = form.getValues();
    await onSubmit(values);
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !userProfile) return;

    setIsSaving(true);
    try {
        let newAvatarUrl = userProfile.avatarUrl;

        if (imageFile) {
            toast({ title: t.uploadingImage });
            const filePath = `avatars/${user.uid}/${imageFile.name}`;
            newAvatarUrl = await uploadProfileImage(user.uid, imageFile, filePath);
            toast({ title: t.imageUploadSuccess });
        }

        const phoneCountry = markets.find(m => m.id === (data.phoneCountryCode || market?.id)) || market || markets[0];
        const fullPhoneNumber = data.phoneNumber
        ? `${phoneCountry?.phoneCode}${data.phoneNumber.replace(/^0+/, '')}`
        : '';

        const isDataComplete = Boolean(data.name && data.country && data.province && data.city);
        const isPhoneVerifiedNow = Boolean(userProfile.phoneVerified && fullPhoneNumber === userProfile.phoneNumber);
        const isFullyVerified = isDataComplete && isPhoneVerifiedNow;

        const profileData: Partial<UserProfile> = {
            name: data.name,
            country: data.country,
            province: data.province,
            governorate: data.province,
            city: data.city,
            village: data.village,
            avatarUrl: newAvatarUrl,
            profession: data.profession,
            specialization: data.specialization,
            ...(isFullyVerified ? { verified: true } : {})
        };
        
        if (fullPhoneNumber) {
            profileData.phoneNumber = fullPhoneNumber;
            if (fullPhoneNumber !== userProfile.phoneNumber) {
                profileData.phoneVerified = false;
                profileData.verified = false;
            }
        }

        toast({ title: isSignupMode ? "جارٍ إكمال إنشاء الحساب وحفظ الموقع..." : t.updatingProfile });
        await updateUserProfile(user.uid, profileData);
        await syncCurrentLocation(data.country, data.province, data.city, data.village);
        await refreshUserProfile();
        setImageFile(null); 
        
        if (isSignupMode) {
            toast({ 
              title: "تم إنشاء حسابك وحفظ موقعك بنجاح! ✨", 
              description: "تم تحديد منطقتك بنجاح، ويمكنك تأكيد رقم هاتفك لاحقاً في أي وقت من ملفك الشخصي." 
            });
            router.push(redirectUrl);
        } else {
            if (isFullyVerified && !userProfile.verified) {
                toast({ 
                  title: "🎉 أصبح حسابك الآن موثقاً!", 
                  description: "تم حفظ بياناتك واكتمال تأكيد الهاتف، وأصبح حسابك موثقاً بالعلامة الزرقاء 🛡️." 
                });
            } else {
                toast({ title: t.changesSaved });
            }
            router.push(redirectUrl === '/' ? '/' : redirectUrl);
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

        {!userProfile?.verified && (
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center gap-2.5 text-xs animate-in fade-in">
            <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
            <span>عند ملء جميع بياناتك (الاسم والعنوان) وتأكيد رقم هاتفك، سيصبح حسابك موثقاً بالعلامة الزرقاء 🛡️ تلقائياً.</span>
          </div>
        )}

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



        {/* قسم العنوان والمربعات الأربعة */}
        <div className="p-4 sm:p-5 rounded-3xl bg-muted/20 border border-border/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-base font-bold flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              العنوان ومربعات الاستهداف الجغرافي (4 مستويات)
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
                  <span>جارٍ تحويل الإحداثيات لأسماء...</span>
                </>
              ) : (
                <>
                  <LocateFixed className="h-4 w-4" />
                  <span>تحديد موقعي وتعبئة المربعات (GPS)</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 1. الدولة */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="p-3 rounded-2xl bg-card border border-border/70 space-y-1">
                  <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    1. الدولة
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
                    2. المحافظة / المنطقة
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
                    3. المدينة / المركز
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
                    4. القرية / الحي
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t.villagePlaceholder} {...field} className="h-9 text-xs border-border/60" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ملخص العنوان الكامل */}
          {buildFullAddress(form.watch('village'), form.watch('city'), form.watch('province'), form.watch('country')) !== 'غير محدد' && (
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">العنوان المعتمد:</span>
              <strong className="text-foreground font-semibold">
                {buildFullAddress(form.watch('village'), form.watch('city'), form.watch('province'), form.watch('country'))}
              </strong>
            </div>
          )}
        </div>

        <div className="space-y-4">
            <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4"/>
                                  <span>{t.phoneNumber}</span>
                                </div>
                                {userProfile?.phoneVerified && !isEditingPhone && (
                                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-bold">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                    مؤكد
                                  </span>
                                )}
                            </FormLabel>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-foreground/80 font-bold text-sm">
                                    <span dir="ltr">{selectedPhoneCountry?.phoneCode}</span>
                                </div>
                                <FormControl>
                                <Input
                                    type="tel"
                                    {...field}
                                    placeholder={t.phonePlaceholder}
                                    dir="ltr"
                                    className="pl-16 text-left font-medium"
                                    disabled={isPhoneInputDisabled}
                                />
                                </FormControl>
                            </div>
                        </FormItem>
                    )}
                />
                <div className="self-end">
                  {userProfile?.phoneVerified && !isEditingPhone ? (
                      <Button
                          type="button"
                          onClick={() => {
                            setIsEditingPhone(true);
                            setTimeout(() => {
                              const inputEl = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement;
                              if (inputEl) {
                                inputEl.focus();
                                inputEl.select();
                              }
                            }, 50);
                          }}
                          variant="outline"
                          title="تعديل رقم الهاتف"
                          className="shrink-0 h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold text-xs sm:text-sm"
                      >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>تعديل</span>
                      </Button>
                  ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={handleSendWhatsAppOTP}
                            disabled={isSendingCode || isPhoneEmpty || cooldown > 0}
                            className="relative min-w-36 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm transition-all"
                        >
                            {isSendingCode ? (
                              <Loader2 className="animate-spin h-4 w-4" />
                            ) : cooldown > 0 ? (
                              `إعادة الإرسال (${cooldown})`
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4" />
                                <span>تأكيد عبر واتساب</span>
                              </>
                            )}
                        </Button>
                      </div>
                  )}
                </div>
            </div>
            
            {/* نص توضيحي لطريقة الاستلام عبر واتساب */}
            {(!userProfile?.phoneVerified || isEditingPhone) && !codeSent && (
              <p className="text-2xs text-muted-foreground flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="h-3 w-3" />
                <span>سيصلك رمز التحقق المكون من 6 أرقام في رسالة عبر واتساب لتأكيد رقم هاتفك.</span>
              </p>
            )}
            
            <FormMessage />
        </div>


        {codeSent && (
            <FormField
            control={form.control}
            name="verificationCode"
            render={({ field }) => (
                <FormItem className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <FormLabel className="flex items-center justify-between text-xs font-bold text-foreground">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="h-4 w-4"/>
                      <span>أدخل رمز التفعيل المستلم على واتساب:</span>
                    </div>
                    <span className="text-2xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono">صالح لـ 5 دقائق</span>
                </FormLabel>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <FormControl>
                        <Input 
                            type="text" 
                            placeholder="• • • • • •" 
                            {...field} 
                            maxLength={6}
                            dir="ltr"
                            className="tracking-[0.5em] md:tracking-[0.8rem] text-center font-mono font-black text-lg h-11 bg-background focus-visible:ring-emerald-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleVerifyCode();
                              }
                            }}
                        />
                    </FormControl>
                     <Button 
                        type="button" 
                        onClick={handleVerifyCode} 
                        disabled={isVerifying || !form.watch('verificationCode')}
                        className="relative min-w-32 font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                    >
                        {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : 'تأكيد الرمز'}
                     </Button>
                 </div>
                 {/* خيار الحفظ والمتابعة في حال تعذر استلام الكود */}
                 <div className="pt-1 flex items-center justify-between border-t border-border/40 text-2xs">
                   <span className="text-muted-foreground">لم يصلك الرمز بعد أو حدث خطأ؟</span>
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={handleSaveAndSkipPhone}
                     disabled={isSaving}
                     className="text-xs text-primary font-bold hover:underline h-auto p-1 cursor-pointer"
                   >
                     حفظ ومتابعة (تأكيد الهاتف لاحقاً)
                   </Button>
                 </div>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

        <div className="space-y-3 pt-2">
          <Button type="submit" className="w-full h-12 text-sm sm:text-base font-bold shadow-md rounded-2xl" size="lg" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 ml-2" />
                <span>{isSignupMode ? "جارٍ إكمال إنشاء الحساب..." : t.saving}</span>
              </>
            ) : isSignupMode ? (
              <>
                <Sparkles className="ml-2 h-4 w-4" />
                <span>حفظ وإنشاء الحساب وتحديد موقعي</span>
              </>
            ) : (
              <>
                <Save className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                <span>{t.saveChanges}</span>
              </>
            )}
          </Button>

          {isSignupMode && (
            <p className="text-2xs text-center text-muted-foreground">
              سيتم حفظ موقعك الجغرافي لتخصيص إعلانات سوق بلدنا وتعبئة مربعات الإعلانات لك تلقائياً.
            </p>
          )}
        </div>
      </form>
    </Form>


    <div className="pt-6 flex justify-center">
      <Button 
        type="button" 
        variant="ghost" 
        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-2 font-medium"
        onClick={() => setShowDeleteDialog(true)} 
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

    </>
  );
}
