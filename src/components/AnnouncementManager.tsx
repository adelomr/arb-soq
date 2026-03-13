'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, Announcement } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Megaphone, Palette, Link as LinkIcon, Eye } from 'lucide-react';
import Link from 'next/link';


const translations = {
  ar: {
    title: 'إدارة شريط الإعلانات',
    description: 'تعديل محتوى وحالة ولون شريط الإعلانات العلوي الذي يظهر لجميع المستخدمين.',
    enableBar: 'تفعيل الشريط',
    enableBarDesc: 'عند التفعيل، سيظهر الشريط لجميع الزوار.',
    messageAr: 'الرسالة',
    linkTextAr: 'نص الرابط',
    linkUrl: 'رابط الوجهة (URL)',
    linkUrlDesc: 'اتركه فارغًا إذا لم يكن هناك رابط.',
    backgroundColor: 'لون الخلفية',
    textColor: 'لون النص',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    success: 'تم الحفظ!',
    successDesc: 'تم تحديث شريط الإعلانات بنجاح.',
    error: 'خطأ',
    errorDesc: 'فشل حفظ التغييرات.',
    loading: 'جارٍ تحميل الإعدادات...',
    fieldRequired: 'هذا الحقل مطلوب',
    livePreview: 'معاينة حية',
    previewDesc: 'هذا هو شكل الشريط الذي سيظهر للمستخدمين.'
  },
};

const getAnnouncementSchema = (t: typeof translations.ar) => z.object({
  isEnabled: z.boolean(),
  message_ar: z.string().min(1, t.fieldRequired),
  linkText_ar: z.string().optional(),
  link: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
});

type AnnouncementFormValues = z.infer<ReturnType<typeof getAnnouncementSchema>>;

const PreviewBar = ({ form }: { form: any }) => {
    const values = form.watch();
    const t = translations.ar;

    if (!values.isEnabled) {
        return null;
    }

    const barStyle: React.CSSProperties = {
        backgroundColor: values.backgroundColor || '#186959',
        color: values.textColor || '#FFFFFF',
    };
     const linkStyle: React.CSSProperties = {
        color: values.textColor || '#FFFFFF',
    }

    const message = values.message_ar;
    const linkText = values.linkText_ar;

    return (
        <div className='mb-6 space-y-2'>
            <h3 className="font-medium flex items-center gap-2"><Eye className="h-5 w-5 text-primary"/>{t.livePreview}</h3>
            <p className="text-sm text-muted-foreground">{t.previewDesc}</p>
            <div className="relative rounded-lg" style={barStyle}>
                <div className="container mx-auto px-4 py-2 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        <p>
                            {message}
                            {values.link && linkText && (
                                <Link href={values.link || '#'} className="font-bold underline mx-2" style={linkStyle} onClick={(e) => e.preventDefault()}>
                                    {linkText}
                                </Link>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AnnouncementManager() {
  const { saveAnnouncement, getAnnouncement } = useAuth();
  const t = translations.ar;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const announcementSchema = getAnnouncementSchema(t);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      isEnabled: false,
      message_ar: '',
      linkText_ar: '',
      link: '',
      backgroundColor: '#186959',
      textColor: '#FFFFFF'
    },
  });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setIsFetching(true);
      const data = await getAnnouncement();
      if (data) {
        form.reset({
          isEnabled: data.isEnabled,
          message_ar: data.message.ar,
          linkText_ar: data.linkText?.ar || '',
          link: data.link || '',
          backgroundColor: data.backgroundColor || '#186959',
          textColor: data.textColor || '#FFFFFF',
        });
      }
      setIsFetching(false);
    };
    fetchAnnouncement();
  }, [form, getAnnouncement]);

  const onSubmit = async (data: AnnouncementFormValues) => {
    setIsLoading(true);
    try {
      const announcementData: Omit<Announcement, 'id' | 'updatedAt'> = {
        isEnabled: data.isEnabled,
        message: { ar: data.message_ar },
        link: data.link,
        linkText: { ar: data.linkText_ar || '' },
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
      };
      await saveAnnouncement(announcementData);
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
          <Megaphone className="h-6 w-6 md:h-8 md:w-8" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <PreviewBar form={form} />

            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t.enableBar}</FormLabel>
                    <FormDescription>{t.enableBarDesc}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/>الألوان</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.backgroundColor}</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input {...field} placeholder="#186959" />
                                    <Input type="color" className="absolute top-0 right-0 h-full w-10 p-1 border-none cursor-pointer" value={field.value} onChange={field.onChange} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="textColor"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t.textColor}</FormLabel>
                             <FormControl>
                                <div className="relative">
                                    <Input {...field} placeholder="#FFFFFF" />
                                    <Input type="color" className="absolute top-0 right-0 h-full w-10 p-1 border-none cursor-pointer" value={field.value} onChange={field.onChange} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            <FormField
              control={form.control}
              name="message_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.messageAr}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4"/>{t.linkUrl}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="/submit" dir="ltr" />
                  </FormControl>
                  <FormDescription>{t.linkUrlDesc}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkText_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.linkTextAr}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t.save}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
