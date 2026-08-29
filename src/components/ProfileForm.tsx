

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
import { User, Save, FileUp, Loader2, Phone, MessageSquare, BadgeCheck, MapPin, Store, Trash2, Briefcase, Eye, EyeOff, Pencil } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Label } from './ui/label';
import { useMarket } from '@/context/MarketContext';
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


export default function ProfileForm() {
  const { toast } = useToast();
  const { user, userProfile, updateUserProfile, uploadProfileImage, loading: authLoading, sendVerificationCode, confirmVerificationCode, deleteUserProfile, refreshUserProfile, professions } = useAuth();
  const { market } = useMarket();
  const { language, direction } = useLanguage();
  const router = useRouter();
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
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showVerificationSentDialog, setShowVerificationSentDialog] = useState(false);
  // ── لوحة التشخيص ──
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [showDiag, setShowDiag] = useState(false);
  const [diagCopied, setDiagCopied] = useState(false);
  
  const COOLDOWN_SECONDS = 60;
  const COOLDOWN_STORAGE_KEY = 'phoneVerificationCooldown';

  const addDiagLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('ar-EG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDiagLogs(prev => [...prev, `[${ts}] ${msg}`]);
  };
  const clearDiagLogs = () => { setDiagLogs([]); setDiagCopied(false); };

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

      const activeMarket = phoneCountry || market || markets[0];

      form.reset({
        name: userProfile.name || '',
        country: userProfile.country || '',
        province: userProfile.province || '',
        city: userProfile.city || '',
        village: userProfile.village || '',
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
  }, [userProfile, market, form]);
  
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

  // ── إرسال كود التحقق حصرياً عبر بوابة واتساب ──
  const handleSendWhatsAppOTP = async () => {
      if (!user) return;
      const phoneNumberInput = form.getValues('phoneNumber');
      const phoneCountry = markets.find(m => m.id === form.getValues('phoneCountryCode')) || market || markets[0];
      const phoneCountryCode = phoneCountry?.phoneCode;

      // بدء التشخيص (فقط على السيرفر المحلي localhost)
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal) {
        clearDiagLogs();
        setShowDiag(true);
        addDiagLog(`🔵 بدء محاولة الإرسال`);
        addDiagLog(`📱 الرقم المدخل: "${phoneNumberInput}"`);
        addDiagLog(`🌍 كود الدولة: ${phoneCountryCode || 'غير محدد'}`);
      }

      if (!phoneNumberInput || !phoneCountryCode) {
          addDiagLog(`❌ فشل: رقم الهاتف أو كود الدولة فارغ`);
          toast({ title: t.invalidPhoneNumber, description: t.invalidPhoneNumberDesc, variant: 'destructive' });
          return;
      }
      
      const fullPhoneNumber = `${phoneCountryCode}${phoneNumberInput.replace(/^0+/, '')}`;
      addDiagLog(`📞 الرقم الكامل: ${fullPhoneNumber}`);

      if (!/^\+[1-9]\d{1,14}$/.test(fullPhoneNumber)) {
          addDiagLog(`❌ فشل: صيغة الرقم غير صحيحة (يجب أن يبدأ بـ +)`);
          toast({ title: t.invalidPhoneNumber, description: t.invalidPhoneNumberDesc, variant: 'destructive' });
          return;
      }
  
      setIsSendingCode(true);
      const t0 = Date.now();
      try {
          addDiagLog(`➡️ POST إلى: /api/auth/whatsapp-otp/send`);
          addDiagLog(`   userId: ${user?.uid?.substring(0, 12)}...`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch('/api/auth/whatsapp-otp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: fullPhoneNumber, userId: user?.uid }),
              signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const elapsed = Date.now() - t0;
          addDiagLog(`⬅️ API: HTTP ${res.status} ${res.statusText} (${elapsed}ms)`);

          const data = await res.json().catch(() => ({ success: false, error: 'استجابة غير صالحة من الخادم.' }));
          addDiagLog(`   JSON: ${JSON.stringify(data)}`);

          if (data.success) {
              addDiagLog(`✅ نجح! OTP أُرسل عبر البوابة`);
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

          addDiagLog(`❌ فشل API: ${data.error || 'خطأ مجهول'}`);
          toast({
              title: 'تعذر إرسال الرمز عبر واتساب',
              description: data.error || 'يرجى التأكد من تشغيل خادم بوابة واتساب والاتصال بالحساب.',
              variant: 'destructive',
          });
      } catch (error: any) {
          const elapsed = Date.now() - t0;
          console.error("Error sending WhatsApp OTP: ", error);
          let errorMsg = error.message || 'حدث خطأ أثناء إرسال كود التحقق عبر واتساب.';
          if (error.name === 'AbortError') {
              errorMsg = 'استغرقت عملية الإرسال وقتاً طويلاً. يرجى التأكد من تشغيل بوابة واتساب والاتصال بالإنترنت.';
              addDiagLog(`❌ Timeout بعد ${elapsed}ms`);
          } else {
              addDiagLog(`❌ خطأ JS: [${error.name}] ${error.message} (بعد ${elapsed}ms)`);
          }
          toast({ 
              title: 'خطأ في إرسال الرمز', 
              description: errorMsg, 
              variant: 'destructive' 
          });
      } finally {
          setIsSendingCode(false);
          addDiagLog(`─── انتهى الطلب (${Date.now() - t0}ms إجمالاً) ───`);
      }
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

        if (user?.uid) {
            await updateUserProfile(user.uid, { phoneNumber: fullPhoneNumber, phoneVerified: true });
        }

        toast({ title: t.phoneVerifiedSuccess, description: t.phoneVerifiedSuccessDesc });

        setCodeSent(false);
        setIsEditingPhone(false);
        await refreshUserProfile();

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


  async function onSubmit(data: ProfileFormValues) {
    if (!user || !userProfile) return;

    // إذا كان هناك رمز تحقق تم إرساله ولم يتم تأكيده بعد
    if (codeSent) {
      if (data.verificationCode && data.verificationCode.trim()) {
        await handleVerifyCode();
        return;
      } else {
        toast({
          title: "يرجى تأكيد رقم الهاتف",
          description: "تم إرسال رمز التحقق إلى واتساب. يرجى إدخال الرمز والضغط على 'تأكيد الرمز'.",
          variant: "destructive",
        });
        return;
      }
    }
    
    const phoneCountry = markets.find(m => m.id === (data.phoneCountryCode || market?.id)) || market || markets[0];
    const fullPhoneNumber = data.phoneNumber
    ? `${phoneCountry?.phoneCode}${data.phoneNumber.replace(/^0+/, '')}`
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

        router.push('/');
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

  const handleWhatsAppVerification = async () => {
    if (!user || !userProfile) return;

    const nameVal = form.getValues('name');
    const countryVal = form.getValues('country');
    const provinceVal = form.getValues('province');
    const cityVal = form.getValues('city');
    const phoneInputVal = form.getValues('phoneNumber');

    const phoneCountry = markets.find(m => m.id === (form.getValues('phoneCountryCode') || market?.id)) || market || markets[0];
    const fullPhoneNumber = phoneInputVal
      ? `${phoneCountry?.phoneCode}${phoneInputVal.replace(/^0+/, '')}`
      : (userProfile.phoneNumber || '');

    if (!nameVal || !countryVal || !provinceVal || !cityVal || !fullPhoneNumber) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى تعبئة الاسم الكامل والعنوان ورقم الهاتف أولاً.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save profile updates to Firestore
      const profileData: Partial<UserProfile> = {
        name: nameVal,
        country: countryVal,
        province: provinceVal,
        city: cityVal,
        village: form.getValues('village'),
        profession: form.getValues('profession'),
        specialization: form.getValues('specialization'),
        phoneNumber: fullPhoneNumber,
      };
      await updateUserProfile(user.uid, profileData);

      // 2. Save verification request in Firestore
      const reqId = `${user.uid}_${Date.now()}`;
      await setDoc(doc(firestore, 'verification_requests', reqId), {
        id: reqId,
        userId: user.uid,
        userName: nameVal,
        userEmail: user.email || '',
        phoneNumber: fullPhoneNumber,
        country: countryVal,
        province: provinceVal,
        city: cityVal,
        profession: form.getValues('profession') || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // 3. Open WhatsApp chat with pre-filled message to official support number
      const msg = `السلام عليكم إدارة سوق العرب 🛍️\nأرغب في توثيق حسابي بالعلامة الزرقاء 🛡️\n\n📌 بيانات الحساب:\n• الاسم: ${nameVal}\n• رقم الهاتف: ${fullPhoneNumber}\n• الدولة والمدينة: ${countryVal} - ${cityVal}\n• معرّف الحساب (ID): ${user.uid}`;
      const waUrl = `https://wa.me/201003975823?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      // 4. Open confirmation Dialog
      setShowVerificationSentDialog(true);
      await refreshUserProfile();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "حدث خطأ",
        description: err.message || "فشل إرسال طلب التوثيق.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };



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
  const showVerification = !userProfile?.phoneVerified || isPhoneDirty || !userProfile.phoneNumber || isEditingPhone;
  const isPhoneInputDisabled = codeSent || (userProfile?.phoneVerified && !!userProfile.phoneNumber && !isEditingPhone);

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
                          className="relative min-w-28 flex items-center justify-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                      >
                          <Pencil className="h-3.5 w-3.5" />
                          تعديل الرقم
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
                 <div className="flex gap-2">
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
                        className="relative min-w-28 font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                    >
                        {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : 'تأكيد الرمز'}
                     </Button>
                 </div>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
       
        {/* ── لوحة التشخيص (تظهر فقط عند الاستخدام على السيرفر المحلي localhost) ── */}
        {showDiag && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-500/30 p-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-amber-500" />
                🔍 سجل التشخيص
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(diagLogs.join('\n'));
                      setDiagCopied(true);
                      setTimeout(() => setDiagCopied(false), 2500);
                    } catch {
                      // fallback
                      const el = document.createElement('textarea');
                      el.value = diagLogs.join('\n');
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      setDiagCopied(true);
                      setTimeout(() => setDiagCopied(false), 2500);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                >
                  {diagCopied ? '✅ تم النسخ!' : '📋 نسخ الكل'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiag(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                >
                  ✕ إغلاق
                </button>
              </div>
            </div>
            <div
              dir="ltr"
              className="max-h-52 overflow-y-auto rounded-lg bg-slate-900 text-green-300 p-2.5 space-y-0.5 text-[11px] leading-relaxed select-all"
            >
              {diagLogs.length === 0 ? (
                <div className="text-slate-500 italic">جارٍ التحميل...</div>
              ) : (
                diagLogs.map((log, i) => (
                  <div key={i} className={
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('🔵') ? 'text-blue-400' :
                    log.includes('➡️') ? 'text-yellow-300' :
                    log.includes('⬅️') ? 'text-cyan-300' :
                    log.includes('───') ? 'text-slate-500' :
                    'text-green-300'
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
            <p className="text-amber-600 dark:text-amber-400 text-[10px]">
              💡 اضغط على "نسخ الكل" وأرسل النص للدعم الفني لتشخيص المشكلة
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />}
          {isSaving ? t.saving : t.saveChanges}
        </Button>
      </form>
    </Form>


    {/* Account Verification Section */}
    <div className="mt-8 rounded-2xl border p-6 bg-card shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b">
        <BadgeCheck className="h-6 w-6 text-blue-500 fill-blue-500/10" />
        <h3 className="text-lg font-bold">توثيق الحساب بالعلامة الزرقاء 🛡️</h3>
      </div>
      
      {userProfile?.verified ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
          <BadgeCheck className="h-8 w-8 text-green-500 fill-green-500/10 flex-shrink-0 animate-bounce" />
          <div>
            <h4 className="font-bold text-sm">حسابك موثق رسمياً بالعلامة الزرقاء! 🛡️✨</h4>
            <p className="text-xs opacity-90 mt-1">تظهر شارة التوثيق الآن على جميع إعلاناتك وصفحتك الشخصية لزيادة المصداقية وجذب المشترين وتأكيد هويتك.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            احصل على <strong>شارة التوثيق الزرقاء 🛡️</strong> الرسمية لإعلاناتك وحسابك في سوق العرب لبناء ثقة فورية مع المشترين ومضاعفة المبيعات.
          </p>
          
          <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/60 space-y-2.5">
            <div className="text-xs font-bold text-foreground">بيانات التوثيق المطلوبة:</div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${form.watch('name') ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className={form.watch('name') ? 'text-foreground font-medium' : 'text-muted-foreground'}>الاسم الكامل</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${form.watch('country') && form.watch('province') && form.watch('city') ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className={form.watch('country') && form.watch('province') && form.watch('city') ? 'text-foreground font-medium' : 'text-muted-foreground'}>العنوان بالكامل (البلد، المحافظة، المدينة)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${form.watch('phoneNumber') || userProfile?.phoneNumber ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className={form.watch('phoneNumber') || userProfile?.phoneNumber ? 'text-foreground font-medium' : 'text-muted-foreground'}>رقم الهاتف للتواصل</span>
            </div>
          </div>

          <Button 
            type="button" 
            onClick={handleWhatsAppVerification}
            disabled={isSaving || !form.watch('name') || !form.watch('country') || !form.watch('province') || !form.watch('city') || (!form.watch('phoneNumber') && !userProfile?.phoneNumber)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl h-12 shadow-md hover:shadow-lg transition-all text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <MessageSquare className="h-5 w-5 fill-white/20" />
                <BadgeCheck className="h-5 w-5" />
                <span>طلب توثيق الحساب عبر واتساب 🛡️📱</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>

    <div className="pt-4 flex justify-center">
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

      <AlertDialog open={showVerificationSentDialog} onOpenChange={setShowVerificationSentDialog}>
        <AlertDialogContent className="max-w-md text-right" dir="rtl">
          <AlertDialogHeader className="text-right">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 shadow-inner">
              <BadgeCheck className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold font-headline text-center">
              تم إرسال طلب التوثيق بنجاح! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2 leading-relaxed">
              سيقوم فريق إدارة <strong>سوق العرب</strong> بمراجعة بياناتك والتواصل معك عبر واتساب لتأكيد وتفعيل شارة التوثيق الزرقاء 🛡️ لحسابك خلال 24 ساعة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-4">
            <AlertDialogAction 
              onClick={() => setShowVerificationSentDialog(false)}
              className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11"
            >
              حسناً، فهمت
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
