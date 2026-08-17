

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { DollarSign, FileUp, Sparkles, Send, MapPin, ShoppingBag, Wrench, Handshake, Loader2, CreditCard, Map, Store, PlusCircle, Trash2, X, Globe, Info, Hash, Package, Tv, ImageIcon, Phone, Tag, BadgeDollarSign, AlertCircle } from 'lucide-react';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AdType, AdCondition, Category } from '@/lib/types';
import { useMarket } from '@/context/MarketContext';
import { handleAdSuggestion, fetchYouTubePlaylistItems } from '@/app/actions';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from './ui/separator';
import { markets } from '@/lib/markets';
import { isPhysicalGoodsCategory } from '@/lib/category-utils';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const translations = {
    ar: {
        adSent: "تم نشر الإعلان بنجاح!",
        adSentDesc: "تم نشر إعلانك بنجاح على منصة سوق العرب.",
        adUpdated: "تم تحديث الإعلان!",
        adUpdatedDesc: "تم حفظ تغييراتك بنجاح.",
        whatToDo: "ماذا تريد أن تفعل؟",
        sellItem: "بيع منتج",
        offerService: "بيع خدمة",
        requestService: "طلب خدمة",
        adTitle: "عنوان الإعلان",
        productName: "اسم المنتج",
        adTitlePlaceholder: "مثال: أريكة جلدية عتيقة",
        category: "الفئة الرئيسية",
        subcategory: "الفئة الفرعية",
        categoryPlaceholder: "اختر فئة لإعلانك",
        subcategoryPlaceholder: "اختر فئة فرعية",
        categoryMode: "نوع التصنيف",
        categoryModeCategory: "فئة",
        categoryModeProfession: "مهنة",
        professionPlaceholder: "اختر مهنة",
        price: "السعر",
        productCode: "كود المنتج (SKU)",
        productCodePlaceholder: "مثال: SOFA-00123",
        description: "الوصف",
        descriptionPlaceholder: "صف العنصر بالتفصيل...",
        targetMarket: "أين تريد أن يظهر إعلانك؟",
        targetMarketPlaceholder: "اختر البلد المستهدف",
        targetMarketTooltip: "سيظهر إعلانك في السوق الذي تختاره هنا.",
        province: "مزيد من التحديد (المحافظة)",
        provincePlaceholder: "اختر المحافظة أو المدينة",
        provinceTooltip: "تحديد المحافظة سيجعل إعلانك يظهر للمستخدمين في هذه المنطقة المحددة.",
        selectOnMap: "تحديد على الخريطة",
        uploadImages: "تحميل الصور",
        uploadImagesDescSell: "أرفق صورًا للمنتج أو الخدمة. في الإعلان الصوري، يمكنك رفع عدة صور وسيتم عرضها كنظام شرائح (Slideshow) تلقائي.",
        uploadImagesDescRequest: "أرفق صورة توضيحية للخدمة المطلوبة. للحصول على أفضل النتائج، استخدم صورة بنسبة عرض إلى ارتفاع 16:9.",
        clickToUpload: "انقر للتحميل",
        dragAndDrop: "أو السحب والإفلات",
        imageFormats: "PNG, JPG, or GIF",
        promoteAd: "تمييز إعلانك",
        promoteAdDesc: "الإعلانات المميزة تحصل على مشاهدات تصل إلى 10 أضعاف.",
        submitAd: "نشر الإعلان",
        updateAd: "تحديث الإعلان",
        saving: "جارٍ الحفظ...",
        adTypeRequired: "الرجاء تحديد نوع الإجراء.",
        titleMin: "يجب أن يكون العنوان 5 أحرف على الأقل.",
        titleMax: "يجب ألا يتجاوز العنوان 50 حرفاً.",
        categoryRequired: "الرجاء اختيار فئة.",
        subcategoryRequired: "الرجاء اختيار فئة فرعية.",
        descriptionMin: "يجب أن يكون الوصف 20 حرفًا على الأقل.",
        pricePositive: "يجب أن يكون السعر رقمًا موجبًا.",
        marketRequired: "البلد المستهدف مطلوب.",
        locationRequired: "الموقع مطلوب",
        imageRequired: "الرجاء تحميل صورة واحدة على الأقل.",
        suggestWithAI: "اقترح بالذكاء الاصطناعي",
        suggesting: "جارٍ الاقتراح...",
        suggestionFailed: "فشل إنشاء الاقتراح. حاول مرة أخرى.",
        noImageForAISuggestion: "الرجاء تحميل صورة أولاً لإنشاء اقتراح.",
        noCategoryForAISuggestion: "الرجاء اختيار فئة أولاً لإنشاء اقتراح.",
        clearImage: "مسح الصورة",
        paymentMethodRequired: "مطلوب وسيلة دفع",
        paymentMethodRequiredDesc: "لتمييز إعلانك، يجب عليك إضافة وسيلة دفع إلى حسابك أولاً.",
        addPaymentMethod: "إضافة وسيلة دفع",
        cancel: "إلغاء",
        selectLocation: "تحديد الموقع على الخريطة",
        loadingAd: "جارٍ تحميل الإعلان...",
        submissionStarted: "بدء عملية الحفظ...",
        submissionStartedDesc: "الرجاء الانتظار.",
        uploadingImages: "جارٍ رفع الصور...",
        uploadingImagesDesc: (count: number) => `يتم رفع ${count} صورة.`,
        uploadComplete: "اكتمل رفع الصور بنجاح!",
        uploadCompleteDesc: "الآن يتم حفظ بيانات الإعلان.",
        savingAdData: "جارٍ حفظ بيانات الإعلان...",
        savingAdDataDesc: "قد يستغرق هذا بعض الوقت.",
        submissionFailed: "فشل الإرسال",
        submissionError: "حدث خطأ أثناء الحفظ.",
        loginRequired: "الرجاء تسجيل الدخول لنشر إعلان.",
        adNotFound: "لم يتم العثور على الإعلان.",
        condition: "الحالة",
        conditionNew: "جديد",
        conditionUsed: "مستعمل",
        videoAd: "إعلان فيديو",
        imageAd: "إعلان صوري",
        adName: "اسم الإعلان / العنوان",
        videoUrl: "رابط الفيديو (يوتيوب أو MP4)",
        playlistUrl: "رابط قائمة تشغيل يوتيوب (إضافة جماعية)",
        education: "تعليم",
        communicationMode: "اختار وسيلة التواصل",
        commApp: "تواصل عبر التطبيق (رسائل/اتصال)",
        commWebsite: "رابط موقع إلكتروني خارجي",
        targetCountry: "الدولة المستهدفة",
        advertiserCountry: "دولة صاحب الإعلان",
        locationScope: "نطاق ظهور الإعلان",
        websiteUrl: "رابط الموقع الإلكتروني الخاص بمشروعك",
        governorate: "المحافظة",
        city: "المركز/المدينة",
        village: "القرية",
        videoUrlRequired: "يرجى إضافة رابط الفيديو",
        videoSource: "مصدر الفيديو",
        singleVideo: "فيديو واحد",
        playlistSource: "قائمة تشغيل (إضافة جماعية)",
        playlistUrlRequired: "يرجى إضافة رابط قائمة التشغيل",
        phoneNumber: "رقم الهاتف",
        phoneNumberPlaceholder: "مثال: 00201234567890",
        mapLocation: "موقعي على الخريطة",
        mapLocationDesc: "حدد موقعك على الخريطة لتسهيل وصول المشترين إليك.",
        openMapPicker: "تحديد على الخريطة",
        locationSelected: "تم تحديد الموقع",
        locationCleared: "تم مسح الموقع",
        scopeVillage: "القرية فقط",
        scopeCity: "المدينة بالكامل",
        scopeGov: "المحافظة بالكامل",
        scopeCountry: "الدولة بالكامل",
        country: "الدولة",
        websitePlaceholder: "https://your-site.com",
        updateLocationInProfile: "يجب تحديث بيانات موقعك من ملفك الشخصي لتوسيع النطاق.",
    }
};

const CURRENCIES = [
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' },
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي' },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي' },
  { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني' },
  { code: 'IQD', symbol: 'د.ع', name: 'دينار عراقي' },
  { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني' },
  { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري' },
  { code: 'OMR', symbol: 'ر.ع', name: 'ريال عُماني' },
  { code: 'LBP', symbol: 'ل.ل', name: 'ليرة لبنانية' },
  { code: 'SYP', symbol: 'ل.س', name: 'ليرة سورية' },
  { code: 'MAD', symbol: 'د.م', name: 'درهم مغربي' },
  { code: 'DZD', symbol: 'د.ج', name: 'دينار جزائري' },
  { code: 'TND', symbol: 'د.ت', name: 'دينار تونسي' },
  { code: 'LYD', symbol: 'د.ل', name: 'دينار ليبي' },
  { code: 'SDG', symbol: 'ج.س', name: 'جنيه سوداني' },
  { code: 'YER', symbol: 'ر.ي', name: 'ريال يمني' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
];

const getAdFormSchema = (t: typeof translations.ar, isStoreProduct: boolean) => z.object({
  adType: z.enum(['sell-item', 'sell-service', 'request-service', 'video', 'image'], {
    required_error: t.adTypeRequired
  }).default('sell-item'),
  title: z.string().min(5, t.titleMin).max(50, t.titleMax),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().min(10, 'يرجى كتابة وصف مناسب للإعلان').max(1000),
  price: z.coerce.number().optional(),
  currency: z.string().optional(),
  productCode: z.string().optional(),
  market: z.string().optional(),
  province: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.object({ file: z.any().nullable(), url: z.string() })).min(0, t.imageRequired),
  condition: z.enum(['new', 'used']).optional(),
  videoSource: z.enum(['single', 'playlist']).default('single'),
  videoUrl: z.string().optional(),
  playlistUrl: z.string().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  village: z.string().optional(),
  categoryId: z.string().optional(),
  showCommIcon: z.boolean().default(true),
  websiteUrl: z.string().optional(),
  locationScope: z.string().optional(),
  phoneNumber: z.string().optional(),
}).superRefine((data, ctx) => {
    const phone = (data.phoneNumber || '').trim();

    if (!phone) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'رقم الهاتف أساسي ولا يمكن حفظ الإعلان بدونه.',
            path: ['phoneNumber'],
        });
    }

    if (data.adType === 'sell-item' && data.category !== 'store-product') {
        if (!data.category) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.categoryRequired,
                path: ['category'],
            });
        }
    }
    if (data.adType === 'sell-service' && !data.category) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t.categoryRequired,
            path: ['category'],
        });
    }
});


const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

function AdFormContent({ adId, userId, isEditMode, onSuccess }: { adId?: string | null, userId?: string | null, isEditMode: boolean, onSuccess?: () => void }) {
  const { market } = useMarket();
  const { user, userProfile, addAd, updateAd, deleteAd, getAdById, categories, professions, getUserActiveAdsCount } = useAuth();
  const t = translations.ar;
  const direction = 'rtl';
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type');
  const isStoreProduct = typeParam === 'store-product';

  const adFormSchema = getAdFormSchema(t, isStoreProduct);
  type AdFormValues = z.infer<typeof adFormSchema>;

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [duplicateCraftAdInfo, setDuplicateCraftAdInfo] = useState<{
    existingAdId: string;
    existingAd: any;
    newAdData: any;
    newImageFiles: File[];
  } | null>(null);
  const [isMapOpen, setMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoadingAd, setIsLoadingAd] = useState(isEditMode);
  const [categoryMode, setCategoryMode] = useState<'category' | 'profession'>('category');
  const [activeAdsCount, setActiveAdsCount] = useState<number | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const hasPaymentMethod = true;

  const { toast } = useToast();
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      adType: isStoreProduct ? 'sell-item' : 'image',
      title: '',
      description: '',
      price: 0,
      productCode: '',
      images: [],
      market: userProfile?.country || market.id,
      province: '',
      location: '',
      category: isStoreProduct ? 'store-product' : undefined,
      condition: 'new',
      showCommIcon: true,
      videoSource: 'single',
      websiteUrl: '',
      locationScope: 'city',
      phoneNumber: '',
      currency: markets.find(m => m.id === (userProfile?.country || market.id))?.currency || 'EGP',
    },
  });

  // Handle incoming share target data
  useEffect(() => {
    if (isEditMode) return;
    
    const sharedTitle = searchParams.get('title');
    const sharedText = searchParams.get('text');
    const sharedUrl = searchParams.get('url');

    if (sharedTitle || sharedText || sharedUrl) {
      let finalTitle = sharedTitle || '';
      let finalDescription = sharedText || '';
      const finalUrl = sharedUrl || '';

      // If text/url looks like a YouTube video, set adType to video
      const isYouTube = (sharedText && (sharedText.includes('youtube.com') || sharedText.includes('youtu.be'))) || 
                        (sharedUrl && (sharedUrl.includes('youtube.com') || sharedUrl.includes('youtu.be')));
      
      if (isYouTube) {
        form.setValue('adType', 'video');
        const videoUrl = sharedUrl || sharedText || '';
        form.setValue('videoUrl', videoUrl);
        if (!finalTitle) finalTitle = 'مشاركة من يوتيوب';
        if (!finalDescription) finalDescription = 'إعلان فيديو تمت مشاركته من يوتيوب';
      }

      if (finalTitle) form.setValue('title', finalTitle);
      if (finalDescription) form.setValue('description', finalDescription);
    }
  }, [searchParams, form, isEditMode]);
  
  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images",
  });

  // التحقق من رصيد الباقة المجانية عند فتح نموذج إنشاء إعلان جديد
  useEffect(() => {
    if (!isEditMode && user?.uid && !isStoreProduct) {
      getUserActiveAdsCount(user.uid).then(count => {
        setActiveAdsCount(count);
        const isAdmin = userProfile?.role === 'admin';
        const userPlan = (userProfile as any)?.plan || 'free';
        const isPaidPlan = userPlan === 'premium' || userPlan === 'gold';
        if (!isAdmin && !isPaidPlan && count >= 5) {
          setShowQuotaModal(true);
        }
      });
    }
  }, [user, userProfile, isEditMode, isStoreProduct, getUserActiveAdsCount]);

  useEffect(() => {
    if (isEditMode && adId && userId) {
        setIsLoadingAd(true);
        const fetchAd = async () => {
            const ad = await getAdById(userId, adId, isStoreProduct);
            if (ad) {
                const normalizedMarket = markets.find(m => m.id === ad.market || m.name.ar === ad.market)?.id || ad.market || userProfile?.country || market.id;
                let inferredScope = (ad as any).locationScope;
                if (!inferredScope) {
                    if (ad.village) inferredScope = 'village';
                    else if (ad.city) inferredScope = 'city';
                    else if (ad.governorate && ad.governorate !== 'country') inferredScope = 'governorate';
                    else inferredScope = 'country';
                }

                form.reset({
                    adType: ad.adType as any,
                    title: ad.title,
                    description: ad.description,
                    price: ad.price || 0,
                    productCode: ad.productCode || '',
                    market: normalizedMarket,
                    province: ad.province,
                    location: ad.location,
                    latitude: ad.latitude,
                    longitude: ad.longitude,
                    category: ad.category,
                    subcategory: ad.subcategory,
                    images: ad.imageUrls.map(url => ({ file: null, url })),
                    condition: ad.condition || 'new',
                    videoSource: ad.playlistUrl ? 'playlist' : 'single',
                    videoUrl: ad.videoUrl || '',
                    playlistUrl: ad.playlistUrl || '',
                    governorate: ad.governorate || '',
                    city: ad.city || '',
                    village: ad.village || '',
                    locationScope: inferredScope,
                    currency: ad.currency || 'EGP',
                    phoneNumber: ad.phoneNumber || '',
                });
                
                const mainCategory = categories.find(c => c.id === ad.category || c.subcategories?.some(s => s.id === ad.category));
                if (mainCategory) {
                    setSelectedCategory(mainCategory);
                    form.setValue('category', mainCategory.id);
                    if (mainCategory.subcategories?.some(s => s.id === ad.category)) {
                        form.setValue('subcategory', ad.category);
                    }
                }
            } else {
                 toast({ title: t.adNotFound, variant: 'destructive' });
                 router.push('/dashboard');
            }
            setIsLoadingAd(false);
        };
        fetchAd();
    }
  }, [isEditMode, adId, userId, form, getAdById, categories, router, toast, t, isStoreProduct]);
  
  const adType = form.watch('adType');
  const watchedImages = form.watch('images');
  const categoryValue = form.watch('category');
  const subcategoryValue = form.watch('subcategory');
  const marketValue = form.watch('market');
  const locationScope = form.watch('locationScope');
  const selectedMarket = useMemo(() => markets.find(m => m.id === marketValue), [marketValue]);

  // معرف بلد المستخدم الأصلي
  const userHomeCountryId = useMemo(() => {
    if (!userProfile?.country) return market.id;
    const found = markets.find(m => m.id === userProfile.country || m.name.ar === userProfile.country);
    return found ? found.id : userProfile.country;
  }, [userProfile, market.id]);

  const userGovName = useMemo(() => userProfile?.province || userProfile?.governorate || '', [userProfile]);
  const userCityName = useMemo(() => userProfile?.city || '', [userProfile]);
  const userVillageName = useMemo(() => userProfile?.village || '', [userProfile]);

  const isHomeCountryTarget = useMemo(() => {
    const currentMarket = marketValue || userHomeCountryId;
    const normalizedCurrent = markets.find(m => m.id === currentMarket || m.name.ar === currentMarket)?.id || currentMarket;
    return !currentMarket || normalizedCurrent === userHomeCountryId;
  }, [marketValue, userHomeCountryId]);

  // ضبط التحديد الافتراضي لبلد المستخدم الأصلي
  useEffect(() => {
    if (!isEditMode && userProfile?.country) {
      const userHome = markets.find(m => m.id === userProfile.country || m.name.ar === userProfile.country)?.id || userProfile.country;
      if (userHome && markets.some(m => m.id === userHome)) {
        form.setValue('market', userHome);
      }
    }
  }, [userProfile, isEditMode, form]);

  // اختيار العملة تلقائياً عند تغيير الدولة المستهدفة
  useEffect(() => {
    if (selectedMarket?.currency) {
      form.setValue('currency', selectedMarket.currency);
    }
  }, [selectedMarket, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const filesToAdd = Array.from(files);
      const addFileToForm = (file: File) => {
        appendImage({ file, url: URL.createObjectURL(file) });
      };

      if (isStoreProduct) {
        if (imageFields.length > 0) {
          removeImage(0);
        }
        if (filesToAdd.length > 0) {
          addFileToForm(filesToAdd[0]);
        }
      } else {
        for (const file of filesToAdd) {
          addFileToForm(file);
        }
      }
    }
  };

  const handleSuggestion = async () => {
      if (!watchedImages || watchedImages.length === 0) {
          toast({ title: t.noImageForAISuggestion, variant: 'destructive' });
          return;
      }
      
      let categoryForAI = categoryValue;
      let categoryNameForAI = selectedCategory?.name.ar || '';

      if (selectedCategory && selectedCategory.subcategories && subcategoryValue) {
        const sub = selectedCategory.subcategories.find(s => s.id === subcategoryValue);
        if (sub) {
            categoryForAI = sub.id;
            categoryNameForAI = sub.name.ar;
        }
      }

      if (!categoryForAI) {
          toast({ title: t.noCategoryForAISuggestion, variant: 'destructive' });
          return;
      }
      
      setIsSuggesting(true);
      try {
          const response = await handleAdSuggestion({
              photoDataUri: watchedImages[0].url,
              category: categoryNameForAI,
          });

          if (response.success && response.data) {
              form.setValue('title', response.data.title);
              form.setValue('description', response.data.description);
          } else {
              throw new Error(response.error || t.suggestionFailed);
          }
      } catch (error) {
          console.error(error);
          toast({ title: t.suggestionFailed, variant: 'destructive' });
      } finally {
          setIsSuggesting(false);
      }
  }

  async function onSubmit(data: AdFormValues) {
    if (!user || !userProfile) {
        toast({ title: t.loginRequired, variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    
    try {
        if (data.adType === 'video' && data.playlistUrl) {
            const playlistResult = await fetchYouTubePlaylistItems(data.playlistUrl);
            if (playlistResult.success && playlistResult.videos) {
                toast({ title: `جاري إضافة ${playlistResult.videos.length} فيديوهات من القائمة...` });
                
                for (const videoId of playlistResult.videos) {
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    
                    let finalCategory = data.subcategory || data.category || 'education';
                    if (isStoreProduct) finalCategory = 'store-product';

                    let calculatedGov = '', calculatedCity = '', calculatedVillage = '';
                    const isHomeTarget = (data.market || userHomeCountryId) === userHomeCountryId;

                    if (isHomeTarget) {
                        if (data.locationScope === 'village') {
                            calculatedGov = userGovName || data.governorate || '';
                            calculatedCity = userCityName || data.city || '';
                            calculatedVillage = userVillageName || data.village || '';
                        } else if (data.locationScope === 'city') {
                            calculatedGov = userGovName || data.governorate || '';
                            calculatedCity = userCityName || data.city || '';
                        } else if (data.locationScope === 'governorate') {
                            calculatedGov = userGovName || data.governorate || '';
                        }
                    } else {
                        if (data.governorate && data.governorate !== 'country') {
                            calculatedGov = data.governorate;
                        }
                    }

                    const marketArabicName = markets.find(m => m.id === data.market)?.name.ar || userProfile?.country || '';
                    const pureLocationName = isHomeTarget ? (
                        data.locationScope === 'village' ? (calculatedVillage || calculatedCity || calculatedGov || marketArabicName) : 
                        data.locationScope === 'city' ? (calculatedCity || calculatedGov || marketArabicName) : 
                        data.locationScope === 'governorate' ? (calculatedGov || marketArabicName) : 
                        marketArabicName
                    ) : (
                        calculatedGov || marketArabicName
                    );
                                  
                    // تحويل نوع الإعلان إلى العربي للتوافق مع التطبيق
                    const adTypeArMap: Record<string, string> = {
                        'sell-service': 'بيع خدمة',
                        'sell-item': 'بيع منتج',
                        'request-service': 'طلب خدمة',
                        'video': 'فيديو',
                        'image': 'صوري',
                    };

                    const adDataToSave = {
                        ...data,
                        title: data.title && data.title.length > 0 ? data.title : `فيديو من قائمة تشغيل`,
                        description: data.description && data.description.length > 0 ? data.description : `فيديو من قائمة تشغيل`,
                        videoUrl,
                        playlistUrl: undefined,
                        category: finalCategory,
                        categoryId: finalCategory,
                        market: data.market,
                        // حفظ اسم الدولة بالعربي وليس معرّف السوق حتى يتعرف عليه التطبيق
                        country: marketArabicName,
                        governorate: calculatedGov,
                        city: calculatedCity,
                        village: calculatedVillage,
                        location: pureLocationName,
                        showCommIcon: data.showCommIcon,
                        websiteUrl: !data.showCommIcon ? data.websiteUrl : '',
                        // حقل التوافق مع التطبيق: نوع الإعلان بالعربي
                        adTypeAr: adTypeArMap[data.adType] || data.adType,
                    };
                    await addAd(adDataToSave, [], user, () => {});
                }
                
                toast({ title: "تمت إضافة فيديوهات قائمة التشغيل بنجاح!" });
                router.push('/dashboard');
                return;
            } else if (!playlistResult.success) {
                toast({ title: playlistResult.error || "فشل جلب قائمة التشغيل", variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }
        }

        const isCreativeAd = data.adType === 'image' || data.adType === 'video';
        if (isCreativeAd) {
            if (!data.title) data.title = `إعلان ${data.adType === 'video' ? 'فيديو' : 'صوري'}`;
            if (!data.description) data.description = data.title || `تفاصيل إعلان ${data.adType === 'video' ? 'فيديو' : 'صوري'}`;
            // Set default category to 'education' if the user requested it specifically or 'general'
            if (!data.category) data.category = 'general';
        }

        const mainCatId = isStoreProduct ? 'store-product' : (data.category || 'general');
        const subCatId = isStoreProduct ? '' : (data.subcategory || '');

        const selectedMainCategory = categories.find(c => c.id === mainCatId);
        const mainCategoryName = selectedMainCategory?.name?.ar || mainCatId;
        let subCategoryName = '';
        if (selectedMainCategory && selectedMainCategory.subcategories && subCatId) {
            const subObj = selectedMainCategory.subcategories.find(s => s.id === subCatId);
            if (subObj) subCategoryName = subObj.name?.ar || '';
        }
            
        const newImageFiles = data.images.map(img => img.file).filter(Boolean) as File[];

        // اسخراج URLs الصور الموجودة (بدون ملف جديد) بالترتيب الجديد الذي اختاره المستخدم
        const orderedExistingUrls = data.images
            .filter(img => img.file === null || img.file === undefined)
            .map(img => img.url);

        let calculatedGov = '', calculatedCity = '', calculatedVillage = '';
        const isHomeTarget = (data.market || userHomeCountryId) === userHomeCountryId;

        if (isHomeTarget) {
            if (data.locationScope === 'village') {
                calculatedGov = userGovName || data.governorate || '';
                calculatedCity = userCityName || data.city || '';
                calculatedVillage = userVillageName || data.village || '';
            } else if (data.locationScope === 'city') {
                calculatedGov = userGovName || data.governorate || '';
                calculatedCity = userCityName || data.city || '';
                calculatedVillage = ''; 
            } else if (data.locationScope === 'governorate') {
                calculatedGov = userGovName || data.governorate || '';
                calculatedCity = ''; 
                calculatedVillage = '';
            } else {
                calculatedGov = ''; calculatedCity = ''; calculatedVillage = '';
            }
        } else {
            if (data.governorate && data.governorate !== 'country') {
                calculatedGov = data.governorate;
                calculatedCity = data.city || '';
                calculatedVillage = '';
            } else {
                calculatedGov = ''; 
                calculatedCity = data.city || ''; 
                calculatedVillage = '';
            }
        }

        const marketArabicName = markets.find(m => m.id === data.market)?.name.ar || userProfile?.country || '';

        const pureLocationName = isHomeTarget ? (
            data.locationScope === 'village' ? (calculatedVillage || calculatedCity || calculatedGov || marketArabicName) : 
            data.locationScope === 'city' ? (calculatedCity || calculatedGov || marketArabicName) : 
            data.locationScope === 'governorate' ? (calculatedGov || marketArabicName) : 
            marketArabicName
        ) : (
            calculatedCity ? (calculatedGov && calculatedGov !== 'country' ? `${calculatedGov} - ${calculatedCity}` : calculatedCity) : (calculatedGov || marketArabicName)
        );

        // تحويل نوع الإعلان إلى العربي للتوافق مع التطبيق
        const adTypeArMap: Record<string, string> = {
            'sell-service': 'بيع خدمة',
            'sell-item': 'بيع منتج',
            'request-service': 'طلب خدمة',
            'video': 'فيديو',
            'image': 'صوري',
        };
        const isPhysicalGood = data.adType === 'sell-item' && isPhysicalGoodsCategory(mainCatId, mainCategoryName);
        const conditionToSave = isPhysicalGood ? (data.condition || 'new') : undefined;

        const adDataToSave = { 
            ...data,
            condition: conditionToSave,
            category: mainCatId, 
            categoryId: mainCatId,
            subcategory: subCatId,
            subcategoryId: subCatId,
            categoryName: mainCategoryName,
            subcategoryName: subCategoryName,
            market: data.market,
            // Hierarchical location synchronization (Android compatibility)
            // حفظ اسم الدولة بالعربي وليس معرّف السوق حتى يتعرف عليه التطبيق
            country: marketArabicName,
            governorate: calculatedGov,
            city: calculatedCity,
            village: calculatedVillage,
            location: pureLocationName,
            videoUrl: data.videoUrl || '',
            adType: data.adType,
            // حقل التوافق مع التطبيق: نوع الإعلان بالعربي
            adTypeAr: adTypeArMap[data.adType] || data.adType,
            showCommIcon: data.showCommIcon,
            websiteUrl: !data.showCommIcon ? data.websiteUrl : '',
            currency: data.currency || 'EGP',
            phoneNumber: data.phoneNumber || '',
            // تمرير ترتيب الصور الجديد عند التعديل حتى تحترم صورة الغلاف الجديدة
            ...(isEditMode && newImageFiles.length === 0 && orderedExistingUrls.length > 0 ? {
                imageUrls: orderedExistingUrls,
                imageUrl: orderedExistingUrls[0],
            } : {}),
        };

        let result = { success: true, error: undefined, isCraftDuplicate: false, existingAdId: undefined, existingAd: undefined };
        if (isEditMode && adId && userId) {
            await updateAd(userId, adId, adDataToSave, newImageFiles, (message: string) => toast({ title: message }));
        } else {
            const addResult = await addAd(adDataToSave, newImageFiles, user, (message: string) => toast({ title: message }));
            result = {
                success: addResult.success,
                error: addResult.error as any,
                isCraftDuplicate: (addResult as any).isCraftDuplicate,
                existingAdId: (addResult as any).existingAdId,
                existingAd: (addResult as any).existingAd,
                isQuotaExceeded: (addResult as any).isQuotaExceeded,
            } as any;
        }

        if (!result.success) {
            if (result.isCraftDuplicate && result.existingAdId && result.existingAd) {
                setDuplicateCraftAdInfo({
                    existingAdId: result.existingAdId,
                    existingAd: result.existingAd,
                    newAdData: adDataToSave,
                    newImageFiles: newImageFiles
                });
                return;
            } else if ((result as any).isQuotaExceeded) {
                setShowQuotaModal(true);
                return;
            } else {
                toast({ title: t.submissionFailed, description: result.error || t.submissionError, variant: 'destructive' });
                return;
            }
        }

        toast({
            title: isEditMode ? t.adUpdated : t.adSent,
            description: isEditMode ? t.adUpdatedDesc : t.adSentDesc,
        });
        
        if (!isEditMode) {
            form.reset();
            form.setValue('images', []);
            setSelectedCategory(null);
        }
        if (onSuccess) {
            onSuccess();
        } else {
            router.push('/dashboard');
        }
    } catch(error: any) {
        console.error("Submission error:", error);
        toast({ title: t.submissionFailed, description: t.submissionError, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleUpdateDuplicate = () => {
      if (!duplicateCraftAdInfo) return;
      const { existingAdId } = duplicateCraftAdInfo;
      setDuplicateCraftAdInfo(null);
      router.push(`/submit?id=${existingAdId}&userId=${user?.uid}`);
  };

  const handleDeleteAndPostNew = async () => {
      if (!duplicateCraftAdInfo || !user) return;
      const { existingAdId, existingAd, newAdData, newImageFiles } = duplicateCraftAdInfo;
      setDuplicateCraftAdInfo(null);
      setIsSubmitting(true);
      try {
          toast({ title: "جاري حذف الإعلان القديم..." });
          await deleteAd(user.uid, existingAdId, existingAd);
          
          toast({ title: "جاري نشر الإعلان الجديد..." });
          const res = await addAd(newAdData, newImageFiles, user, (message: string) => toast({ title: message }));
          if (res.success) {
              toast({
                  title: t.adSent,
                  description: t.adSentDesc,
              });
              form.reset();
              form.setValue('images', []);
              setSelectedCategory(null);
              if (onSuccess) {
                  onSuccess();
              } else {
                  router.push('/dashboard');
              }
          } else {
              toast({ title: t.submissionFailed, description: res.error, variant: 'destructive' });
          }
      } catch (err: any) {
          console.error("Error during delete & repost:", err);
          toast({ title: t.submissionFailed, description: t.submissionError, variant: 'destructive' });
      } finally {
          setIsSubmitting(false);
      }
  };
  
  const getImageDescription = () => {
      switch(adType) {
          case 'request-service': return t.uploadImagesDescRequest;
          default: return t.uploadImagesDescSell;
      }
  }

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
    form.setValue('category', categoryId);
    form.setValue('subcategory', undefined); 
  }

  if (isLoadingAd) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
      )
  }

  const isQuotaReached = !isEditMode && !isStoreProduct && activeAdsCount !== null && activeAdsCount >= 5 && userProfile?.role !== 'admin' && (userProfile as any)?.plan !== 'premium' && (userProfile as any)?.plan !== 'gold';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isQuotaReached && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 text-right flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm sm:text-base">
                  وصلت للحد الأقصى للباقة المجانية (5 إعلانات نشطة)
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  تتيح الباقة المجانية نشر 5 إعلانات فقط. اختر إحدى باقاتنا المميزة لنشر المزيد، أو قم بإدارة إعلاناتك السابقة.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                type="button"
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm"
              >
                <BadgeDollarSign className="ml-1.5 h-4 w-4" />
                اختر إحدى الباقات
              </Button>
            </div>
          </div>
        )}
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(adType !== 'request-service' && !isStoreProduct) && (
                    <div className="space-y-3 md:col-span-2">
                        {/* Unified Category Select */}
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg">{t.category}</FormLabel>
                                <Select onValueChange={handleCategoryChange} value={field.value} dir={direction}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t.categoryPlaceholder} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.filter(c => c.id !== 'store-product' && c.id !== 'stores').map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name?.ar || cat.id}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                )}
                {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && adType !== 'request-service' && !isStoreProduct && (
                    <FormField
                        control={form.control}
                        name="subcategory"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-lg">{t.subcategory}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir={direction}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t.subcategoryPlaceholder} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {selectedCategory.subcategories?.map(sub => (
                                    <SelectItem key={sub.id} value={sub.id}>{sub.name?.ar || sub.id}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>

            {/* حقل حالة المنتج (جديد أو مستعمل) - يظهر فقط للسلع المادية */}
            {adType === 'sell-item' && isPhysicalGoodsCategory(
              form.watch('category') || selectedCategory?.id,
              selectedCategory?.name?.ar
            ) && (
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-4 space-y-0 animate-in fade-in py-1">
                    <FormLabel className="text-base font-semibold shrink-0">{t.condition}:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || 'used'}
                        className="flex items-center gap-6"
                      >
                        <FormItem className="flex items-center gap-2.5 cursor-pointer space-y-0">
                          <FormControl>
                            <RadioGroupItem value="new" id="new" />
                          </FormControl>
                          <FormLabel htmlFor="new" className="font-medium cursor-pointer text-sm mr-1.5">
                            {t.conditionNew}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2.5 cursor-pointer space-y-0">
                          <FormControl>
                            <RadioGroupItem value="used" id="used" />
                          </FormControl>
                          <FormLabel htmlFor="used" className="font-medium cursor-pointer text-sm mr-1.5">
                            {t.conditionUsed}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-lg">
                      {(adType === 'video' || adType === 'image') ? t.adName : (isStoreProduct ? t.productName : t.adTitle)}
                    </FormLabel>
                    <span className={cn(
                      "text-xs font-mono px-2 py-0.5 rounded-full font-bold transition-colors",
                      (field.value?.length || 0) >= 50
                        ? "bg-destructive/15 text-destructive"
                        : (field.value?.length || 0) >= 40
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {field.value?.length || 0} / 50
                    </span>
                  </div>
                  <FormControl>
                    <Input
                      placeholder={t.adTitlePlaceholder}
                      maxLength={50}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    اختر عنواناً مركزاً ومختصراً بحد أقصى 50 حرفاً (حوالي 6-8 كلمات) لضمان ظهوره كاملاً في سطرين دون قطع.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control} 
              name="description" 
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel className="text-lg">{t.description}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.descriptionPlaceholder} className="resize-y min-h-[120px] custom-scrollbar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem> 
              )}
            />

            {/* حقل صور الإعلان - مباشرة بعد الوصف */}
            <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-lg">{t.uploadImages}</FormLabel>
                        <FormDescription>{getImageDescription()}</FormDescription>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {imageFields.map((image, index) => (
                                <div key={image.id} className="relative group aspect-square">
                                    <Image src={image.url} alt={`Preview ${index + 1}`} layout="fill" className={`object-cover rounded-lg border-2 ${index === 0 ? 'border-primary' : 'border-transparent'}`} />
                                    {/* شارة صورة الغلاف للصورة الأولى */}
                                    {index === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/85 text-primary-foreground text-xs font-bold text-center py-1 rounded-b-lg backdrop-blur-sm pointer-events-none">
                                            صورة الغلاف
                                        </div>
                                    )}
                                    {/* زر "جعلها صورة الغلاف" للصور الأخرى */}
                                    {index !== 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = form.getValues('images');
                                                const newOrder = [...current];
                                                const [moved] = newOrder.splice(index, 1);
                                                newOrder.unshift(moved);
                                                form.setValue('images', newOrder);
                                            }}
                                            className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-bold text-center py-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                                        >
                                            اجعلها صورة الغلاف
                                        </button>
                                    )}
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                             {(!isStoreProduct || imageFields.length < 1) && (
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 text-muted-foreground">
                                    <PlusCircle className="w-8 h-8 mb-1" />
                                    <span className="text-sm">{t.clickToUpload}</span>
                                </label>
                             )}
                            <FormControl>
                                <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple={!isStoreProduct} />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(adType !== 'request-service' && adType !== 'video') && (
                  <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                      <FormItem>
                      <FormLabel className="text-lg">{t.price}</FormLabel>
                      <div className="flex gap-3 items-end">
                          {/* منتقي العملة */}
                          <FormField
                              control={form.control}
                              name="currency"
                              render={({ field: currField }) => (
                                  <div className="flex flex-col gap-1.5">
                                      <label className="text-sm font-medium text-foreground">اختار العملة</label>
                                      <Select onValueChange={currField.onChange} value={currField.value || 'EGP'} dir="ltr">
                                          <SelectTrigger className="w-[140px] shrink-0 font-mono font-bold text-primary border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors">
                                              <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="w-[220px]">
                                              {CURRENCIES.map(c => (
                                                  <SelectItem key={c.code} value={c.code}>
                                                      <div className="flex items-center gap-2">
                                                          <span className="font-mono font-bold text-primary w-10">{c.code}</span>
                                                          <span className="text-muted-foreground text-sm">{c.name}</span>
                                                      </div>
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                  </div>
                              )}
                          />
                          {/* حقل السعر */}
                          <div className="flex flex-col gap-1.5 flex-1">
                              <label className="text-sm font-medium text-foreground">السعر</label>
                              <FormControl>
                                  <Input type="number" placeholder="أدخل السعر..." className="h-10"
                                      {...field}
                                      value={field.value === 0 ? '' : (field.value ?? '')}
                                      step="1"
                                      onKeyDown={(e) => {
                                          if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') e.preventDefault();
                                      }}
                                  />
                              </FormControl>
                          </div>
                      </div>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              )}
               {isStoreProduct && (
                <FormField
                  control={form.control}
                  name="productCode"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">{t.productCode}</FormLabel>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder={t.productCodePlaceholder} className="pl-8" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              )}
            </div>
        </>
        
        <div className="space-y-6 pt-6 border-t">
            {/* Phone Number Field - Mandatory/Essential */}
            <div className="space-y-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base font-bold text-foreground">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>رقم الهاتف / واتساب</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder={t.phoneNumberPlaceholder || "مثال: 00201234567890"}
                                        {...field}
                                        dir="ltr"
                                        className="pl-10 font-mono"
                                    />
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Box: Optional Features (ميزات اختيارية) */}
            <div className="p-5 rounded-2xl border border-border bg-secondary/20 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <h3 className="text-base font-bold text-foreground font-headline">ميزات اختيارية</h3>
                </div>

                {/* 1. Website URL Field */}
                <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Globe className="h-4 w-4 text-primary" />
                                <span>رابط موقع إلكتروني (اختياري)</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input placeholder={t.websitePlaceholder || "https://your-site.com"} {...field} dir="ltr" className="pl-10 h-10 text-xs bg-background" />
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormDescription className="text-2xs text-muted-foreground">
                                يمكنك إضافة رابط موقعك الإلكتروني الخارجي لتوجيه الزوار إليه مباشرة.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 2. Video Link Field */}
                <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5 pt-3 border-t border-border/40">
                            <FormLabel className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Tv className="h-4 w-4 text-primary" />
                                <span>رابط فيديو توضيحي (اختياري - يوتيوب / Shorts)</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input placeholder="https://youtube.com/watch?v=... أو Shorts" {...field} dir="ltr" className="pl-10 h-10 text-xs bg-background" />
                                    <Tv className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </FormControl>
                            <FormDescription className="text-2xs text-muted-foreground">
                                يمكنك إرفاق رابط فيديو يوتيوب لعرض شرح توضيحي للمنتج أو الخدمة داخل صفحة الإعلان.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        
        {!isEditMode && watchedImages && watchedImages.length > 0 && categoryValue && adType !== 'request-service' && adType !== 'image' && adType !== 'video' && !isStoreProduct && (
            <div className="flex justify-center">
                <Button type="button" onClick={handleSuggestion} disabled={isSuggesting} variant="outline" className="gap-2 w-full sm:w-auto">
                    {isSuggesting ? ( <><Loader2 className="h-4 w-4 animate-spin"/>{t.suggesting}</> ) : ( <><Sparkles className="h-4 w-4 text-yellow-500"/>{t.suggestWithAI}</> )}
                </Button>
            </div>
        )}





        {/* مربع الاستهداف (Targeting Box) */}
        <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                مربع الاستهداف
            </h3>
            
            {/* 1. قائمة اختيار الدولة المستهدفة (الافتراضي: بلد المستخدم) */}
            <FormField
                control={form.control}
                name="market"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-md font-semibold">الدولة المستهدفة</FormLabel>
                        <Select
                            onValueChange={(val) => {
                                field.onChange(val);
                                if (val !== userHomeCountryId) {
                                    form.setValue('locationScope', 'country');
                                    form.setValue('governorate', '');
                                } else {
                                    form.setValue('locationScope', 'country');
                                }
                            }}
                            value={field.value || userHomeCountryId}
                            dir={direction}
                        >
                            <FormControl>
                                <SelectTrigger className="h-12 text-base font-semibold">
                                    <SelectValue placeholder="اختر الدولة" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {markets.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="text-base py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span>{m.name.ar}</span>
                                            {m.id === userHomeCountryId && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal">
                                                    (بلدك الأصلي)
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* 2. إذا تم اختيار بلد المستخدم الأصلي -> تظهر 4 اختيارات محددة تلقائياً من بيانات المستخدم */}
            {isHomeCountryTarget ? (
                <div className="space-y-4 pt-2">
                    <FormLabel className="text-md font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        اختر المكان الذي تريد أن يظهر إعلانك فيه
                    </FormLabel>
                    <FormField
                        control={form.control}
                        name="locationScope"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value || 'country'}
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                    >
                                        {/* الخيار 1: الدولة بالكامل */}
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="country" id="scope-country" className="sr-only" />
                                            </FormControl>
                                            <FormLabel
                                                htmlFor="scope-country"
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-accent/40",
                                                    (field.value === 'country' || !field.value) ? "border-primary bg-primary/5 shadow-sm" : "border-border/60"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", (field.value === 'country' || !field.value) ? "border-primary bg-primary" : "border-muted-foreground")}>
                                                        {(field.value === 'country' || !field.value) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="font-bold text-sm">الدولة بالكامل</span>
                                                </div>
                                                <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                                                    {selectedMarket?.name.ar || userProfile?.country || 'كل المحافظات'}
                                                </span>
                                            </FormLabel>
                                        </FormItem>

                                        {/* الخيار 2: المحافظة بالكامل */}
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="governorate" id="scope-gov" className="sr-only" />
                                            </FormControl>
                                            <FormLabel
                                                htmlFor="scope-gov"
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-accent/40",
                                                    field.value === 'governorate' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", field.value === 'governorate' ? "border-primary bg-primary" : "border-muted-foreground")}>
                                                        {field.value === 'governorate' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="font-bold text-sm">المحافظة بالكامل</span>
                                                </div>
                                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md max-w-[130px] truncate">
                                                    {userGovName || form.watch('governorate') || 'غير محددة'}
                                                </span>
                                            </FormLabel>
                                        </FormItem>

                                        {/* الخيار 3: المدينة بالكامل */}
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="city" id="scope-city" className="sr-only" />
                                            </FormControl>
                                            <FormLabel
                                                htmlFor="scope-city"
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-accent/40",
                                                    field.value === 'city' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", field.value === 'city' ? "border-primary bg-primary" : "border-muted-foreground")}>
                                                        {field.value === 'city' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="font-bold text-sm">المدينة بالكامل</span>
                                                </div>
                                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md max-w-[130px] truncate">
                                                    {userCityName || form.watch('city') || 'غير محددة'}
                                                </span>
                                            </FormLabel>
                                        </FormItem>

                                        {/* الخيار 4: القرية بالكامل */}
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="village" id="scope-village" className="sr-only" />
                                            </FormControl>
                                            <FormLabel
                                                htmlFor="scope-village"
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-accent/40",
                                                    field.value === 'village' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", field.value === 'village' ? "border-primary bg-primary" : "border-muted-foreground")}>
                                                        {field.value === 'village' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="font-bold text-sm">القرية بالكامل</span>
                                                </div>
                                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md max-w-[130px] truncate">
                                                    {userVillageName || form.watch('village') || 'غير محددة'}
                                                </span>
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* حقول أدخل المكان مباشرة لو لم تكن متوفرة بملف المستخدم */}
                    {locationScope === 'governorate' && !userGovName && (
                        <FormField
                            control={form.control}
                            name="governorate"
                            render={({ field }) => (
                                <FormItem className="pt-2 animate-in fade-in">
                                    <FormLabel className="text-xs text-muted-foreground">اسم المحافظة</FormLabel>
                                    <FormControl><Input placeholder="أدخل اسم المحافظة..." {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                    )}
                    {locationScope === 'city' && !userCityName && (
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem className="pt-2 animate-in fade-in">
                                    <FormLabel className="text-xs text-muted-foreground">اسم المدينة/المركز</FormLabel>
                                    <FormControl><Input placeholder="أدخل اسم المدينة..." {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                    )}
                    {locationScope === 'village' && !userVillageName && (
                        <FormField
                            control={form.control}
                            name="village"
                            render={({ field }) => (
                                <FormItem className="pt-2 animate-in fade-in">
                                    <FormLabel className="text-xs text-muted-foreground">اسم القرية/الحي</FormLabel>
                                    <FormControl><Input placeholder="أدخل اسم القرية..." {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            ) : (
                /* 3. إذا اختار بلد آخر غير بلده الأصلي -> يظهر له مربع اختيار المحافظة ومربع كتابة الحي/الشارع التفصيلي */
                <div className="space-y-4 pt-2 animate-in fade-in">
                    <FormField
                        control={form.control}
                        name="governorate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-md font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    اختر المدينة / المحافظة المستهدفة في {selectedMarket?.name.ar}
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || 'country'} dir={direction}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue placeholder="اختر المدينة / المحافظة" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="country" className="font-bold py-2">
                                            الدولة بالكامل ({selectedMarket?.name.ar})
                                        </SelectItem>
                                        {selectedMarket?.majorCities && selectedMarket.majorCities.map((city) => (
                                            <SelectItem key={city} value={city} className="py-2">
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* حقل تفاصيل الحي أو الشارع للمستهدفين في دول أخرى */}
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem className="pt-1">
                                <FormLabel className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    <span>إضافة حي أو شارع أو منطقة تفصيلية (اختياري)</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="شمال الرياض حي العارض"
                                            {...field}
                                            className="h-11 text-sm bg-background pl-10 placeholder:text-muted-foreground/60"
                                        />
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>

        <Button type="submit" className="w-full py-6 text-lg" size="lg" disabled={isSubmitting}>
             {isSubmitting ? (
                <>
                    <Loader2 className={`h-5 w-5 animate-spin ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t.saving}
                </>
            ) : (
                <>
                    <Send className={`h-5 w-5 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {isEditMode ? t.updateAd : t.submitAd}
                </>
            )}
        </Button>
      </form>

      {duplicateCraftAdInfo && (
        <AlertDialog open={!!duplicateCraftAdInfo} onOpenChange={(open) => !open && setDuplicateCraftAdInfo(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader className="text-right">
              <AlertDialogTitle className="text-xl font-bold font-headline text-right">إعلان مكرر في فئة المهن والحرف</AlertDialogTitle>
              <AlertDialogDescription className="text-right text-base text-muted-foreground mt-3">
                لقد قمت بالإعلان عن هذه المهنة الفرعية من قبل. 
                <br />
                هل تريد تحديث الإعلان القديم أم حذفه ونشر إعلان جديد؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row-reverse sm:justify-start gap-2 mt-6">
              <Button onClick={handleDeleteAndPostNew} variant="destructive" className="w-full sm:w-auto">
                حذف ونشر الجديد
              </Button>
              <Button onClick={handleUpdateDuplicate} variant="outline" className="w-full sm:w-auto">
                تحديث الإعلان القديم
              </Button>
              <AlertDialogCancel onClick={() => setDuplicateCraftAdInfo(null)} className="w-full sm:w-auto mt-0">
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showQuotaModal && (
        <AlertDialog open={showQuotaModal} onOpenChange={setShowQuotaModal}>
          <AlertDialogContent className="max-w-md text-right" dir="rtl">
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Sparkles className="h-7 w-7" />
              </div>
              <AlertDialogTitle className="text-xl font-bold font-headline text-center">
                لقد وصلت إلى الحد الأقصى للباقة المجانية (5 إعلانات)
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
                تتيح لك الباقة المجانية نشر ما يصل إلى <strong>5 إعلانات</strong> نشطة.
                <br />
                لإضافة المزيد من الإعلانات والاستفادة من ميزات الترويج والظهور المضاعف، يرجى اختيار إحدى باقاتنا المميزة، أو إدارة إعلاناتك الحالية وحذف القديم منها.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowQuotaModal(false);
                  router.push('/pricing');
                }}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                <BadgeDollarSign className="ml-1.5 h-4 w-4" />
                اختر إحدى الباقات
              </Button>
              <Button
                onClick={() => {
                  setShowQuotaModal(false);
                  router.push('/profile');
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                إدارة إعلاناتي
              </Button>
              <AlertDialogCancel
                onClick={() => setShowQuotaModal(false)}
                className="w-full sm:w-auto mt-0"
              >
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Form>
  );
}

export default function AdForm(props: { adId?: string | null, userId?: string | null, isEditMode: boolean, onSuccess?: () => void }) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
             <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
        )
    }

    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <AdFormContent {...props} />
        </Suspense>
    )
}
