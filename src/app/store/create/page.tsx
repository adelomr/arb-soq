

'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, FileUp, Loader2, Store, Text, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });

const translations = {
    ar: {
        title: "إدارة متجرك",
        description: "قم بتحديث اسم متجرك ووصفه وصورة الغلاف.",
        storeName: "اسم المتجر",
        storeNamePlaceholder: "مثال: متجر الإلكترونيات الحديثة",
        storeNameMin: "يجب أن يكون اسم المتجر 3 أحرف على الأقل.",
        storeDescription: "وصف المتجر",
        storeDescriptionPlaceholder: "صف متجرك وما تبيعه...",
        storeCoverImage: "صورة غلاف المتجر",
        storeCoverImageDesc: "ستظهر هذه الصورة في أعلى صفحة متجرك.",
        changeCover: "تغيير الغلاف",
        saveChanges: "حفظ التغييرات",
        saving: "جارٍ الحفظ...",
        uploadingImage: "جارٍ تحميل الصورة...",
        imageUploadSuccess: "تم تحميل الصورة بنجاح!",
        imageUploadFailed: "فشل تحميل الصورة",
        imageUploadFailedDesc: "فشلت عملية رفع الصورة. يرجى المحاولة مرة أخرى.",
        updatingProfile: "جارٍ تحديث المتجر...",
        changesSaved: "تم حفظ التغييرات بنجاح!",
        unexpectedError: "حدث خطأ غير متوقع",
        unexpectedErrorDesc: "فشل تحديث المتجر.",
        loginRequired: "الرجاء تسجيل الدخول أولاً.",
    },
    en: {
        title: "Manage Your Store",
        description: "Update your store name, description, and cover image.",
        storeName: "Store Name",
        storeNamePlaceholder: "e.g., Modern Electronics Store",
        storeNameMin: "Store name must be at least 3 characters.",
        storeDescription: "Store Description",
        storeDescriptionPlaceholder: "Describe your store and what you sell...",
        storeCoverImage: "Store Cover Image",
        storeCoverImageDesc: "This image will appear at the top of your store page.",
        changeCover: "Change Cover",
        saveChanges: "Save Changes",
        saving: "Saving...",
        uploadingImage: "Uploading image...",
        imageUploadSuccess: "Image uploaded successfully!",
        imageUploadFailed: "Image Upload Failed",
        imageUploadFailedDesc: "The image upload failed. Please try again.",
        updatingProfile: "Updating store...",
        changesSaved: "Changes saved successfully!",
        unexpectedError: "An unexpected error occurred",
        unexpectedErrorDesc: "Failed to update store.",
        loginRequired: "Please log in first.",
    }
}

const getStoreFormSchema = (t: typeof translations.en) => z.object({
  storeName: z.string().min(3, { message: t.storeNameMin }),
  storeDescription: z.string().optional(),
});

export default function CreateStorePage() {
    const { toast } = useToast();
    const { user, userProfile, createOrUpdateUserStore, uploadProfileImage, loading: authLoading, getUserStore } = useAuth();
    const { language, direction } = useLanguage();
    const router = useRouter();
    const t = translations[language];
    
    const storeFormSchema = getStoreFormSchema(t);
    type StoreFormValues = z.infer<typeof storeFormSchema>;

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeFormSchema),
        defaultValues: {
            storeName: '',
            storeDescription: '',
        },
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            toast({ title: t.loginRequired, variant: 'destructive' });
            router.push('/login');
            return;
        }

        const fetchStoreData = async () => {
            const storeData = await getUserStore(user.uid);
            if (storeData) {
                form.reset({
                    storeName: storeData.storeName || '',
                    storeDescription: storeData.storeDescription || '',
                });
                if (storeData.coverImageUrl) {
                    setCoverPreview(storeData.coverImageUrl);
                }
            }
        };

        fetchStoreData();
    }, [user, authLoading, router, t, form, getUserStore]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
                setCoverFile(file);
            };
            reader.readAsDataURL(file);
        }
    };

    async function onSubmit(data: StoreFormValues) {
        if (!user) return;
        setIsSaving(true);
        
        let newCoverUrl = userProfile?.store?.coverImageUrl;

        try {
            if (coverFile) {
                toast({ title: t.uploadingImage });
                const filePath = `storeCovers/${user.uid}/${coverFile.name}`;
                newCoverUrl = await uploadProfileImage(user.uid, coverFile, filePath);
                toast({ title: t.imageUploadSuccess });
            }

            const storeData = {
                storeName: data.storeName,
                storeDescription: data.storeDescription,
                coverImageUrl: newCoverUrl || '',
                ownerId: user.uid,
            };

            toast({ title: t.updatingProfile });
            await createOrUpdateUserStore(user.uid, storeData);
            setCoverFile(null); 
            toast({ title: t.changesSaved });
            router.push(`/store/${user.uid}`);

        } catch (error: any) {
            console.error("Store creation/update error:", error);
            toast({
                title: t.imageUploadFailed,
                description: error.message || t.unexpectedErrorDesc,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }
  
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-background py-12 md:py-20">
                 <div className="container mx-auto px-4 max-w-2xl">
                     <div className="text-center mb-8">
                        <Store className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary mb-4" />
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">{t.title}</h1>
                        <p className="text-muted-foreground mt-2">{t.description}</p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card p-6 rounded-lg shadow-md">
                             <FormField
                                control={form.control}
                                name="storeName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-lg flex items-center gap-2"><Store className="h-5 w-5"/>{t.storeName}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t.storeNamePlaceholder} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="storeDescription"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-lg flex items-center gap-2"><Text className="h-5 w-5"/>{t.storeDescription}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t.storeDescriptionPlaceholder} className="min-h-28" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            
                             <div className="space-y-2">
                                <FormLabel className="text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5"/>{t.storeCoverImage}</FormLabel>
                                <FormDescription>{t.storeCoverImageDesc}</FormDescription>
                                <div className="w-full aspect-video relative rounded-lg overflow-hidden border bg-secondary/50 flex items-center justify-center">
                                    {coverPreview ? (
                                        <Image src={coverPreview} alt="Cover preview" layout="fill" objectFit="cover" />
                                    ) : (
                                        <ImageIcon className="h-16 w-16 text-muted-foreground/50"/>
                                    )}
                                     <label htmlFor="cover-upload" className="absolute inset-0 bg-black/30 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="text-center">
                                            <FileUp className="h-8 w-8 mx-auto" />
                                            <p>{t.changeCover}</p>
                                        </div>
                                    </label>
                                    <Input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </div>
                             </div>

                            <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className={direction === 'rtl' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />}
                            {isSaving ? t.saving : t.saveChanges}
                            </Button>
                        </form>
                    </Form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
