
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, PricingStructure } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, BadgeDollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const translations = {
  ar: {
    title: 'إدارة خطط الأسعار',
    description: 'تعديل أسعار وميزات الباقات التي تظهر للمستخدمين.',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    success: 'تم الحفظ بنجاح!',
    successDesc: 'تم تحديث خطط الأسعار.',
    error: 'خطأ',
    errorDesc: 'فشل حفظ التغييرات.',
    loading: 'جارٍ تحميل الخطط...',
    planFree: 'الباقة المجانية',
    planPremium: 'الباقة المميزة',
    planGold: 'الباقة الذهبية',
    nameAr: 'اسم الباقة',
    priceAr: 'السعر (بالشكل المعروض)',
    priceEn: 'السعر (بالأرقام الإنجليزية للدفع)',
    durationAr: 'مدة الإعلان',
    featureImagesAr: 'نص ميزة الصور',
    featureSearch: 'الظهور بالبحث',
    featureHighlight: 'تمييز الإعلان',
    featureExtend: 'إمكانية التمديد',
    featureAvailable: 'متاحة',
  },
};

const planFeatureSchema = z.object({
  text: z.object({
    ar: z.string().min(1),
  }),
});

const planFeatureWithAvailabilitySchema = z.object({
  available: z.boolean(),
});

const planSchema = z.object({
  name: z.object({ ar: z.string().min(1) }),
  price: z.object({ en: z.string().min(1), ar: z.string().min(1) }),
  duration: z.object({ ar: z.string().min(1) }),
  features: z.object({
    images: planFeatureSchema,
    search: planFeatureWithAvailabilitySchema,
    highlight: planFeatureWithAvailabilitySchema,
    extend: planFeatureWithAvailabilitySchema,
  }),
});

const pricingSchema = z.object({
  plans: z.object({
    free: planSchema,
    premium: planSchema,
    gold: planSchema,
  }),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

export default function PricingManager() {
  const { savePricingPlans, getPricingPlans } = useAuth();
  const t = translations.ar;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
  });

  useEffect(() => {
    const fetchPlans = async () => {
      setIsFetching(true);
      const data = await getPricingPlans();
      if (data) {
        form.reset(data);
      }
      setIsFetching(false);
    };
    fetchPlans();
  }, [form, getPricingPlans]);

  const onSubmit = async (data: PricingFormValues) => {
    setIsLoading(true);
    try {
      await savePricingPlans(data);
      toast({
        title: t.success,
        description: t.successDesc,
      });
    } catch (e) {
      toast({
        title: t.error,
        description: t.errorDesc,
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderPlanForm = (planName: 'free' | 'premium' | 'gold') => {
      const planTitle = {
          free: t.planFree,
          premium: t.planPremium,
          gold: t.planGold,
      }[planName];

      return (
          <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">{planTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name={`plans.${planName}.name.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.nameAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name={`plans.${planName}.price.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.priceAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name={`plans.${planName}.price.en`} render={({ field }) => ( <FormItem><FormLabel>{t.priceEn}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name={`plans.${planName}.duration.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.durationAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              
              <h4 className="font-semibold mt-6">عدد الصور</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name={`plans.${planName}.features.images.text.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.featureImagesAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <FormField control={form.control} name={`plans.${planName}.features.search.available`} render={({ field }) => ( <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>{t.featureSearch}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                <FormField control={form.control} name={`plans.${planName}.features.highlight.available`} render={({ field }) => ( <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>{t.featureHighlight}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                <FormField control={form.control} name={`plans.${planName}.features.extend.available`} render={({ field }) => ( <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>{t.featureExtend}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
              </div>
          </div>
      )
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mx-4 text-lg">{t.loading}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-headline">
          <BadgeDollarSign className="h-6 w-6 md:h-8 md:w-8" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="free" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="free">{t.planFree}</TabsTrigger>
                <TabsTrigger value="premium">{t.planPremium}</TabsTrigger>
                <TabsTrigger value="gold">{t.planGold}</TabsTrigger>
              </TabsList>
              <TabsContent value="free" className="mt-6">{renderPlanForm('free')}</TabsContent>
              <TabsContent value="premium" className="mt-6">{renderPlanForm('premium')}</TabsContent>
              <TabsContent value="gold" className="mt-6">{renderPlanForm('gold')}</TabsContent>
            </Tabs>
            <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
              {isLoading ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.saving} </>
              ) : (
                <> <Save className="mr-2 h-4 w-4" /> {t.save} </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
