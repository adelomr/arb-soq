

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
import { DollarSign, FileUp, Sparkles, Send, MapPin, ShoppingBag, Wrench, Handshake, Loader2, CreditCard, Map, Store, PlusCircle, Trash2, X, Globe, Info, Hash, Package } from 'lucide-react';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AdType, AdCondition, Category } from '@/lib/types';
import { useMarket } from '@/context/MarketContext';
import { handleAdSuggestion } from '@/app/actions';
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
        uploadImagesDescSell: "أرفق صورًا للمنتج أو الخدمة التي تقدمها. الصورة الأولى ستكون الصورة الرئيسية.",
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
    }
};

const getAdFormSchema = (t: typeof translations.ar, isStoreProduct: boolean) => z.object({
  adType: z.enum(['sell-item', 'sell-service', 'request-service'], {
    required_error: t.adTypeRequired
  }),
  title: z.string().min(5, { message: t.titleMin }).max(100),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().min(20, { message: t.descriptionMin }).max(1000),
  price: z.coerce.number().optional(),
  productCode: z.string().optional(),
  market: z.string().min(1, { message: t.marketRequired }),
  province: z.string().optional(),
  location: isStoreProduct ? z.string().optional() : z.string().min(1, { message: t.locationRequired }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.object({ file: z.any().nullable(), url: z.string() })).min(0, t.imageRequired), // Changed to 0 temporarily
  isPromoted: z.boolean().default(false),
  condition: z.enum(['new', 'used']).optional(),
}).superRefine((data, ctx) => {
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isMapOpen, setMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoadingAd, setIsLoadingAd] = useState(isEditMode);

  const hasPaymentMethod = true;

  const { toast } = useToast();
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      adType: isStoreProduct ? 'sell-item' : 'sell-item',
      title: '',
      description: '',
      price: 0,
      productCode: '',
      images: [],
      isPromoted: false,
      market: market.id,
      province: '',
      location: '',
      category: isStoreProduct ? 'store-product' : undefined,
      condition: 'new',
    },
  });
  
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
                    isPromoted: ad.isPromoted,
                    market: ad.market,
                    province: ad.province,
                    location: ad.location,
                    latitude: ad.latitude,
                    longitude: ad.longitude,
                    category: ad.category,
                    subcategory: ad.subcategory,
                    images: ad.imageUrls.map(url => ({ file: null, url })),
                    condition: ad.condition || 'new',
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

  const handlePromotionToggle = (checked: boolean) => {
    if (checked && !hasPaymentMethod) {
        setShowPaymentDialog(true);
    } else {
        form.setValue('isPromoted', checked);
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
        let finalCategory = data.subcategory || data.category;
        if (isStoreProduct) {
            finalCategory = 'store-product';
        }
            
        const newImageFiles = data.images.map(img => img.file).filter(Boolean) as File[];

        const adDataToSave = { 
            ...data, 
            category: finalCategory, 
            market: data.market,
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
    form.setValue('subcategory', undefined); // Reset subcategory
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
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="sell-item" id="sell-item" className="sr-only" />
                    </FormControl>
                    <FormLabel
                      htmlFor="sell-item"
                      className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer", 
                        adType === 'sell-item' && "border-primary"
                      )}
                    >
                      <ShoppingBag className="mb-3 h-6 w-6" />
                      {t.sellItem}
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="sell-service"
                        id="sell-service"
                        className="sr-only"
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="sell-service"
                      className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer", 
                        adType === 'sell-service' && "border-primary"
                      )}
                    >
                      <Wrench className="mb-3 h-6 w-6" />
                      {t.offerService}
                    </FormLabel>
                  </FormItem>
                   <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="request-service"
                        id="request-service"
                        className="sr-only"
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="request-service"
                       className={cn("flex flex-col items-center justify-center rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground h-full cursor-pointer", 
                        adType === 'request-service' && "border-primary"
                      )}
                    >
                      <Handshake className="mb-3 h-6 w-6" />
                      {t.requestService}
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
                                <SelectItem key={cat.id} value={cat.id}>{cat.name.ar}</SelectItem>
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
                                    <SelectItem key={sub.id} value={sub.id}>{sub.name.ar}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>
             <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel className="text-lg">{isStoreProduct ? t.productName : t.adTitle}</FormLabel><FormControl><Input placeholder={t.adTitlePlaceholder} {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel className="text-lg">{t.description}</FormLabel><FormControl><Textarea placeholder={t.descriptionPlaceholder} className="resize-y min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            
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
              {adType !== 'request-service' && (
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
        
        {watchedImages && watchedImages.length > 0 && categoryValue && adType !== 'request-service' && !isStoreProduct && (
            <div className="flex justify-center">
                <Button type="button" onClick={handleSuggestion} disabled={isSuggesting} variant="outline" className="gap-2 w-full sm:w-auto">
                    {isSuggesting ? ( <><Loader2 className="h-4 w-4 animate-spin"/>{t.suggesting}</> ) : ( <><Sparkles className="h-4 w-4 text-yellow-500"/>{t.suggestWithAI}</> )}
                </Button>
            </div>
        )}

      
        {!isStoreProduct && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="market"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg flex items-center gap-2">
                                    {t.targetMarket}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t.targetMarketTooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir={direction}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t.targetMarketPlaceholder} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {markets.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name.ar}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg flex items-center gap-2">
                                    {t.province}
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t.provinceTooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir={direction} disabled={!selectedMarket}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t.provincePlaceholder} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {selectedMarket?.majorCities?.map(city => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-lg flex items-center gap-2">{t.selectLocation}</FormLabel>
                            <div className="flex gap-2 items-center">
                                <FormControl>
                                    <Input {...field} readOnly placeholder="لم يتم تحديد الموقع" />
                                </FormControl>
                                <Dialog open={isMapOpen} onOpenChange={setMapOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" size="icon">
                                            <MapPin className="h-5 w-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl h-[80vh] p-0">
                                      <DialogHeader>
                                          <DialogTitle className="sr-only">Location Picker</DialogTitle>
                                      </DialogHeader>
                                       <LocationPicker onLocationSelect={(address: string) => {
                                            form.setValue('location', address);
                                            setMapOpen(false);
                                        }} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

        {!isStoreProduct && (
            <FormField
            control={form.control}
            name="isPromoted"
            render={({ field }) => (
                <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 bg-secondary/50 gap-4">
                <div className="space-y-0.5">
                    <FormLabel className="text-lg flex items-center">
                    <Sparkles className={`h-5 w-5 text-yellow-500 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t.promoteAd}
                    </FormLabel>
                    <FormDescription>
                    {t.promoteAdDesc}
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={handlePromotionToggle}
                    />
                </FormControl>
                </FormItem>
            )}
            />
        )}


        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
             {isSubmitting ? (
                <>
                    <Loader2 className={`h-4 w-4 animate-spin ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {isEditMode ? t.saving : t.saving}
                </>
            ) : (
                <>
                    <Send className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {isEditMode ? t.updateAd : t.submitAd}
                </>
            )}
        </Button>
      </form>
       <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t.paymentMethodRequired}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.paymentMethodRequiredDesc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                       <Link href="/wallet">{t.addPaymentMethod}</Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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
