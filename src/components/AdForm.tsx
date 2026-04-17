

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, FileUp, Sparkles, Send, MapPin, ShoppingBag, Wrench, Handshake, Loader2, CreditCard, Map, Store, PlusCircle, Trash2, X, Globe, Info, Hash, Package, Tv, ImageIcon } from 'lucide-react';
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

const translations = {
    ar: {
        adSent: "تم إرسال الإعلان للمراجعة!",
        adSentDesc: "سيقوم فريقنا بمراجعة إعلانك وسيتم نشره قريباً.",
        adUpdated: "تم تحديث الإعلان!",
        adUpdatedDesc: "تم حفظ تغييراتك بنجاح وسيتم مراجعتها.",
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
        submitAd: "إرسال للمراجعة",
        updateAd: "تحديث الإعلان",
        saving: "جارٍ الحفظ...",
        adTypeRequired: "الرجاء تحديد نوع الإجراء.",
        titleMin: "يجب أن يكون العنوان 5 أحرف على الأقل.",
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
        communicationMode: "تفعيل الوسائل التواصل",
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
    }
};

const getAdFormSchema = (t: typeof translations.ar, isStoreProduct: boolean) => z.object({
  adType: z.enum(['sell-item', 'sell-service', 'request-service', 'video', 'image'], {
    required_error: t.adTypeRequired
  }),
  title: z.string().max(100).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().max(1000),
  price: z.coerce.number().optional(),
  productCode: z.string().optional(),
  market: z.string().optional(),
  province: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.object({ file: z.any().nullable(), url: z.string() })).min(0, t.imageRequired), // Changed to 0 temporarily
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
  isPremium: z.boolean().default(false),
}).superRefine((data, ctx) => {
    if (data.videoSource !== 'playlist') {
        if (!data.title || data.title.trim().length < 5) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.titleMin,
                path: ['title'],
            });
        }
    }

    if (data.adType !== 'video' && data.adType !== 'image') {
        if (!data.description || data.description.trim().length < 20) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.descriptionMin,
                path: ['description'],
            });
        }
    }
    
    if (data.adType === 'video') {
        if (data.videoSource === 'single' && !data.videoUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.videoUrlRequired,
                path: ['videoUrl'],
            });
        } else if (data.videoSource === 'playlist' && !data.playlistUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.playlistUrlRequired,
                path: ['playlistUrl'],
            });
        }
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

function AdFormContent({ adId, userId, isEditMode }: { adId?: string | null, userId?: string | null, isEditMode: boolean }) {
  const { market } = useMarket();
  const { user, userProfile, addAd, updateAd, getAdById, categories } = useAuth();
  const t = translations.ar;
  const direction = 'rtl';
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type');
  const isStoreProduct = typeParam === 'store-product';

  const adFormSchema = getAdFormSchema(t, isStoreProduct);
  type AdFormValues = z.infer<typeof adFormSchema>;

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isMapOpen, setMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoadingAd, setIsLoadingAd] = useState(isEditMode);

  const hasPaymentMethod = true;

  const { toast } = useToast();
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      adType: isStoreProduct ? 'sell-item' : 'sell-service',
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

  useEffect(() => {
    if (isEditMode && adId && userId) {
        setIsLoadingAd(true);
        const fetchAd = async () => {
            const ad = await getAdById(userId, adId, isStoreProduct);
            if (ad) {
                form.reset({
                    adType: ad.adType as any,
                    title: ad.title,
                    description: ad.description,
                    price: ad.price || 0,
                    productCode: ad.productCode || '',
                    productCode: ad.productCode || '',
                    market: ad.market,
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
                    isPremium: ad.isPremium || false,
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
  const selectedMarket = useMemo(() => markets.find(m => m.id === marketValue), [marketValue]);

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
                    if (data.locationScope === 'village') {
                        calculatedGov = userProfile?.province || data.governorate || '';
                        calculatedCity = userProfile?.city || data.city || '';
                        calculatedVillage = userProfile?.village || data.village || '';
                    } else if (data.locationScope === 'city') {
                        calculatedGov = userProfile?.province || data.governorate || '';
                        calculatedCity = userProfile?.city || data.city || '';
                    } else if (data.locationScope === 'governorate') {
                        calculatedGov = userProfile?.province || data.governorate || '';
                    }

                    const pureLocationName = data.locationScope === 'village' ? (userProfile?.village || data.village || userProfile?.country || '') : 
                                  data.locationScope === 'city' ? (userProfile?.city || data.city || userProfile?.country || '') : 
                                  data.locationScope === 'governorate' ? (userProfile?.province || data.governorate || userProfile?.country || '') : 
                                  (data.market || userProfile?.country || '');
                                  
                    const adDataToSave = {
                        ...data,
                        title: data.title && data.title.length > 0 ? data.title : `فيديو من قائمة تشغيل`,
                        description: data.description && data.description.length > 0 ? data.description : `فيديو من قائمة تشغيل`,
                        videoUrl,
                        playlistUrl: undefined,
                        category: finalCategory,
                        categoryId: finalCategory,
                        market: data.market,
                        country: data.market || userProfile?.country || '',
                        governorate: calculatedGov,
                        city: calculatedCity,
                        village: calculatedVillage,
                        location: pureLocationName,
                        showCommIcon: data.showCommIcon,
                        websiteUrl: !data.showCommIcon ? data.websiteUrl : '',
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

        let finalCategory = data.subcategory || data.category;
        if (isStoreProduct) {
            finalCategory = 'store-product';
        }
            
        const newImageFiles = data.images.map(img => img.file).filter(Boolean) as File[];

        let calculatedGov = '', calculatedCity = '', calculatedVillage = '';
        if (data.locationScope === 'village') {
            calculatedGov = userProfile?.province || data.governorate || '';
            calculatedCity = userProfile?.city || data.city || '';
            calculatedVillage = userProfile?.village || data.village || '';
        } else if (data.locationScope === 'city') {
            calculatedGov = userProfile?.province || data.governorate || '';
            calculatedCity = userProfile?.city || data.city || '';
            calculatedVillage = ''; 
        } else if (data.locationScope === 'governorate') {
            calculatedGov = userProfile?.province || data.governorate || '';
            calculatedCity = ''; 
            calculatedVillage = '';
        } else {
            // country
            calculatedGov = ''; calculatedCity = ''; calculatedVillage = '';
        }

        const pureLocationName = data.locationScope === 'village' ? (userProfile?.village || data.village || userProfile?.country || '') : 
                      data.locationScope === 'city' ? (userProfile?.city || data.city || userProfile?.country || '') : 
                      data.locationScope === 'governorate' ? (userProfile?.province || data.governorate || userProfile?.country || '') : 
                      (data.market || userProfile?.country || '');

        const adDataToSave = { 
            ...data,
            category: finalCategory, 
            market: data.market,
            // Hierarchical location synchronization (Android compatibility)
            country: data.market || userProfile?.country || '',
            governorate: calculatedGov,
            city: calculatedCity,
            village: calculatedVillage,
            location: pureLocationName,
            categoryId: finalCategory,
            videoUrl: data.videoUrl || '',
            adType: data.adType,
            showCommIcon: data.showCommIcon,
            websiteUrl: !data.showCommIcon ? data.websiteUrl : '',
            isPremium: data.isPremium || false,
        };

        if (isEditMode && adId && userId) {
            await updateAd(userId, adId, adDataToSave, newImageFiles, (message: string) => toast({ title: message }));
        } else {
            await addAd(adDataToSave, newImageFiles, user, (message: string) => toast({ title: message }));
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
        router.push('/dashboard');
    } catch(error: any) {
        console.error("Submission error:", error);
        toast({ title: t.submissionFailed, description: t.submissionError, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }
  
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!isEditMode && !isStoreProduct && (
        <FormField
          control={form.control}
          name="adType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg">{t.whatToDo}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >

                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="sell-service" id="sell-service" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="sell-service"
                      className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer transition-all", 
                        field.value === 'sell-service' ? "border-primary bg-accent/50 text-accent-foreground" : "border-muted"
                      )}
                    >
                      <Wrench className="mb-2 h-6 w-6 text-primary" />
                      <span className="text-sm font-bold">{t.offerService}</span>
                    </FormLabel>
                  </FormItem>

                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="request-service" id="request-service" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="request-service"
                      className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer transition-all", 
                        field.value === 'request-service' ? "border-primary bg-accent/50 text-accent-foreground" : "border-muted"
                      )}
                    >
                      <Handshake className="mb-2 h-6 w-6 text-primary" />
                      <span className="text-sm font-bold">{t.requestService}</span>
                    </FormLabel>
                  </FormItem>

                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="video" id="video" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="video"
                      className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer transition-all", 
                        field.value === 'video' ? "border-primary bg-accent/50 text-accent-foreground" : "border-muted"
                      )}
                    >
                      <Tv className="mb-2 h-6 w-6 text-primary" />
                      <span className="text-sm font-bold">{t.videoAd}</span>
                    </FormLabel>
                  </FormItem>

                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="image" id="image" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="image"
                      className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer transition-all", 
                        field.value === 'image' ? "border-primary bg-accent/50 text-accent-foreground" : "border-muted"
                      )}
                    >
                      <ImageIcon className="mb-2 h-6 w-6 text-primary" />
                      <span className="text-sm font-bold">{t.imageAd}</span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        )}
        
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(adType !== 'request-service' && !isStoreProduct) && (
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
                                {categories.filter(c => c.id !== 'services' && c.id !== 'store-product' && c.id !== 'stores').map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name?.ar || cat.id}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
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
            
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel className="text-lg">{(adType === 'video' || adType === 'image') ? t.adName : (isStoreProduct ? t.productName : t.adTitle)}</FormLabel><FormControl><Input placeholder={t.adTitlePlaceholder} {...field} /></FormControl><FormMessage /></FormItem> )}/>
            
            {(adType !== 'image' && adType !== 'video') ? (
               <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel className="text-lg">{t.description}</FormLabel><FormControl><Textarea placeholder={t.descriptionPlaceholder} className="resize-y min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            ) : (
                <div className="hidden">
                     <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormControl><Textarea {...field} /></FormControl></FormItem> )}/>
                </div>
            )}

            {adType === 'video' && (
                <div className="space-y-6 p-6 rounded-2xl border bg-secondary/5 shrink-0">
                    <FormField
                        control={form.control}
                        name="videoSource"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-lg font-bold flex items-center gap-2">
                                    <Hash className="h-5 w-5 text-primary" />
                                    {t.videoSource}
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir={direction}>
                                    <FormControl>
                                        <SelectTrigger className="w-full h-11">
                                            <SelectValue placeholder={t.videoSource} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="single">{t.singleVideo}</SelectItem>
                                        <SelectItem value="playlist">{t.playlistSource}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {form.watch('videoSource') === 'single' ? (
                        <FormField
                            control={form.control}
                            name="videoUrl"
                            render={({ field }) => (
                            <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormLabel className="text-sm font-medium">
                                    {t.videoUrl}
                                </FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <Input placeholder="https://youtube.com/watch?v=..." {...field} className="pr-10 h-11" />
                                    <Tv className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                </div>
                                </FormControl>
                                <FormDescription>
                                    ادعم إعلانك بفيديو احترافي يظهر في صفحة "سوق بلدنا".
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    ) : (
                        <FormField
                            control={form.control}
                            name="playlistUrl"
                            render={({ field }) => (
                            <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormLabel className="text-sm font-medium">
                                    {t.playlistUrl}
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input placeholder="https://youtube.com/playlist?list=..." {...field} className="pr-10 h-11" />
                                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    سيتم استيراد كافة فيديوهات القائمة دفعة واحدة.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </div>
            )}
            {adType === 'sell-item' && (
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-lg">{t.condition}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
                          <FormControl>
                            <RadioGroupItem value="new" id="new" />
                          </FormControl>
                          <FormLabel htmlFor="new" className="font-normal cursor-pointer">{t.conditionNew}</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
                          <FormControl>
                            <RadioGroupItem value="used" id="used" />
                          </FormControl>
                          <FormLabel htmlFor="used" className="font-normal cursor-pointer">{t.conditionUsed}</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(adType !== 'request-service' && adType !== 'image' && adType !== 'video') && (
                  <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                      <FormItem>
                      <FormLabel className="text-lg">{t.price} ({market.currency})</FormLabel>
                      <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                          <Input type="number" placeholder="0" className="pl-8" {...field} 
                            step="1"
                            onKeyDown={(e) => {
                                if (e.key === '.') {
                                    e.preventDefault();
                                }
                            }}
                          />
                          </FormControl>
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
                                <Image src={image.url} alt={`Preview ${index + 1}`} layout="fill" className="object-cover rounded-lg border" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
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
        
        {watchedImages && watchedImages.length > 0 && categoryValue && adType !== 'request-service' && adType !== 'image' && adType !== 'video' && !isStoreProduct && (
            <div className="flex justify-center">
                <Button type="button" onClick={handleSuggestion} disabled={isSuggesting} variant="outline" className="gap-2 w-full sm:w-auto">
                    {isSuggesting ? ( <><Loader2 className="h-4 w-4 animate-spin"/>{t.suggesting}</> ) : ( <><Sparkles className="h-4 w-4 text-yellow-500"/>{t.suggestWithAI}</> )}
                </Button>
            </div>
        )}

        <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t.communicationMode || "وسيلة التواصل"}
            </h3>
            <FormField
                control={form.control}
                name="showCommIcon"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                            <RadioGroup
                                onValueChange={(val) => field.onChange(val === 'true')}
                                defaultValue={field.value ? 'true' : 'false'}
                                className="flex flex-col gap-4"
                            >
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="true" id="comm-app" />
                                    </FormControl>
                                    <FormLabel htmlFor="comm-app" className="font-normal text-md cursor-pointer">
                                        {t.commApp || "تواصل عبر التطبيق (رسائل/اتصال)"}
                                    </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="false" id="comm-web" />
                                    </FormControl>
                                    <FormLabel htmlFor="comm-web" className="font-normal text-md cursor-pointer">
                                        {t.commWebsite || "رابط موقع إلكتروني خارجي"}
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            {form.watch('showCommIcon') === false && (
                <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.websiteUrl || "رابط الموقع الإلكتروني الخاص بمشروعك"}</FormLabel>
                            <FormControl>
                                <Input placeholder={t.websitePlaceholder || "https://your-site.com"} {...field} dir="ltr" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>

        {/* ========== ADMIN ONLY: PREMIUM AD TOGGLE ========== */}
        {userProfile?.role === 'admin' && (
            <div className="space-y-6 pt-6 border-t bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Sparkles className="h-5 w-5" />
                    صلاحيات الإدارة: ترقية الإعلان
                </h3>
                <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-yellow-500/20 p-4 bg-background">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base font-bold">إعلان ممول (Premium) 👑</FormLabel>
                                <FormDescription>
                                    تفعيل هذا الخيار سيجعل الإعلان يظهر باللون الذهبي ويثبته في أعلى نتائج سوق بلدنا.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        )}

        <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t.targetCountry}
            </h3>
            <FormField
                control={form.control}
                name="market"
                render={({ field }) => (
                    <FormItem>
                        <Select onValueChange={field.onChange} value={field.value} dir={direction}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الدولة" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {markets.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name.ar}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        {selectedMarket && userProfile?.country && (
            selectedMarket.id.toLowerCase() === userProfile.country.toLowerCase() || 
            selectedMarket.name.ar.trim() === userProfile.country.trim()
        ) && !isStoreProduct && (
            <div className="space-y-6 pt-6 border-t">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t.locationScope}
                </h3>
                <FormField
                    control={form.control}
                    name="locationScope"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                {t.locationScope || "اختر النطاق المستهدف"}
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'city'} dir={direction}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر نطاق الظهور" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {userProfile?.village && userProfile?.village !== 'غير محدد' && (
                                        <SelectItem value="village">
                                            {t.scopeVillage || "القرية فقط"} ({userProfile.village})
                                        </SelectItem>
                                    )}
                                    {(userProfile?.city || userProfile?.village) && userProfile?.city !== 'غير محدد' && (
                                        <SelectItem value="city">
                                            {t.scopeCity || "المدينة بالكامل"} ({userProfile?.city || t.city})
                                        </SelectItem>
                                    )}
                                    <SelectItem value="governorate">
                                        {t.scopeGov || "المحافظة بالكامل"} ({userProfile?.governorate || userProfile?.province || t.governorate})
                                    </SelectItem>
                                    <SelectItem value="country">
                                        {t.scopeCountry || "الدولة بالكامل"} ({userProfile?.country || t.country})
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {t.updateLocationInProfile || "يجب تحديث بيانات موقعك من ملفك الشخصي لتوسيع النطاق."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

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

    </Form>
  );
}

export default function AdForm(props: { adId?: string | null, userId?: string | null, isEditMode: boolean }) {
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
