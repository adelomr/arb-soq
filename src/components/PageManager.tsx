'use client';

import { useEffect, useState, useRef } from 'react';
import { handleRevalidatePage } from '@/app/actions';
import { useAuth } from '@/context/AuthContext';
import type { Ad } from '@/lib/types';
import { 
  getAllPages, 
  createPage, 
  updatePage, 
  deletePage, 
  generatePageSlug,
  generateLandingSlug,
  arabicToSlug,
  resolveUniqueSlug,
  normalizeShortCode,
  generateShortCode
} from '@/lib/page-service';
import type { Category, SubCategory, PageData, PageType, LandingTheme, LandingFeature, LandingTestimonial, LandingFaq, AdpageStore, AdpageBrand, AdpageConditionFilter } from '@/lib/types';
import { uploadFileAndReturnInfo } from '@/lib/firebase-storage-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  FileText,
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  ArrowRight, 
  Eye, 
  Globe, 
  FileLock,
  Copy,
  Check,
  Rocket,
  Scale,
  Building2,
  Link2,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  Palette,
  Star,
  HelpCircle,
  Upload,
  X,
  RefreshCw,
  Sparkles,
  Tag,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  CarFront
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import Image from 'next/image';
import { POPULAR_CAR_BRANDS } from '@/lib/car-brands';


const SYSTEM_SLUGS = ['redirect'];
const LANDING_THEMES: { value: LandingTheme; label: string; desc: string; color: string }[] = [
  { value: 'default', label: 'افتراضي', desc: 'بنفسجي عصري', color: 'border-violet-500 bg-violet-500/10 text-violet-600' },
  { value: 'greenery', label: 'زراعي أخضر', desc: 'للمشاتل والحدائق', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600' },
  { value: 'dark-luxury', label: 'فخامة داكنة', desc: 'ذهبي وأسود أنيق', color: 'border-amber-500 bg-amber-500/10 text-amber-600' },
  { value: 'corporate-blue', label: 'أزرق مؤسسي', desc: 'للشركات والأعمال', color: 'border-blue-500 bg-blue-500/10 text-blue-600' },
  { value: 'clear-cover', label: 'غلاف طبيعي', desc: 'بدون فلاتر أو ألوان ستارة', color: 'border-slate-500 bg-slate-500/10 text-slate-600' },
];


interface PageManagerProps {
  initialFilter?: 'all' | 'landing' | 'site' | 'adpages';
}

export default function PageManager({ initialFilter = 'all' }: PageManagerProps) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'landing' | 'site' | 'adpages'>(initialFilter as any);
  // Dynamic Category state loaded from Category Management (Firestore DB)
  const { categories: authCategories } = useAuth();
  const dbCategories = authCategories || [];

  // Adpage customizable form states
  const [adpageCategoryId, setAdpageCategoryId] = useState('');
  const [adpageSubcategoryId, setAdpageSubcategoryId] = useState('');
  const [adpageQuery, setAdpageQuery] = useState('');
  const [adpageDescription, setAdpageDescription] = useState('');
  const [adpageCoverImage, setAdpageCoverImage] = useState('');
  const [adpageSubtitle, setAdpageSubtitle] = useState('');
  const [adpageButtonText, setAdpageButtonText] = useState('');
  // adpageMode is always 'showcase' — redirect mode removed
  const [adpageStores, setAdpageStores] = useState<AdpageStore[]>([]);
  const [adpageBrands, setAdpageBrands] = useState<AdpageBrand[]>([]);
  const [adpageConditionFilters, setAdpageConditionFilters] = useState<AdpageConditionFilter[]>([]);
  const [adpageCoverUploading, setAdpageCoverUploading] = useState(false);
  const adpageCoverInputRef = useRef<HTMLInputElement>(null);

  
  // View states: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  
  // Form states
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState('');
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showAdvancedSlug, setShowAdvancedSlug] = useState(false);
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [countdown, setCountdown] = useState<number>(20);
  const [pageType, setPageType] = useState<PageType>('system');
  const [shortCode, setShortCode] = useState('');
  const [shortCodeManuallyEdited, setShortCodeManuallyEdited] = useState(false);

  // Landing page specific states
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [theme, setTheme] = useState<LandingTheme>('default');
  const [features, setFeatures] = useState<LandingFeature[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<LandingTestimonial[]>([]);
  const [faqs, setFaqs] = useState<LandingFaq[]>([]);
  const [locationEmbed, setLocationEmbed] = useState('');

  // Upload states
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  const handleCopyLink = () => {
    const pageUrl = SYSTEM_SLUGS.includes(slug) ? `/${slug}` : `/p/${slug}`;
    const fullUrl = `${window.location.origin}${pageUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({
      title: 'تم نسخ الرابط',
      description: 'تم نسخ الرابط الكامل للصفحة إلى الحافظة.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySpecificLink = (pageSlug: string) => {
    const pageUrl = SYSTEM_SLUGS.includes(pageSlug) ? `/${pageSlug}` : `/p/${pageSlug}`;
    const fullUrl = `${window.location.origin}${pageUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(pageSlug);
    toast({
      title: 'تم نسخ الرابط',
      description: 'تم نسخ رابط الصفحة بنجاح إلى الحافظة.',
    });
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleServiceChange = (val: string) => {
    setServiceName(val);
    if (view === 'create') {
      if (!titleManuallyEdited) {
        const autoTitle = `${val} ${serviceArea}`.trim();
        setTitle(autoTitle);
      }
      if (!slugManuallyEdited) {
        if (val.trim() || serviceArea.trim()) {
          setSlug(generateLandingSlug(val, serviceArea));
        } else if (title) {
          setSlug(generatePageSlug(title));
        }
      }
      if (!shortCodeManuallyEdited) {
        setShortCode(generateShortCode(val || title, serviceArea));
      }
    }
  };

  const handleAreaChange = (val: string) => {
    setServiceArea(val);
    if (view === 'create') {
      if (!titleManuallyEdited) {
        const autoTitle = `${serviceName} ${val}`.trim();
        setTitle(autoTitle);
      }
      if (!slugManuallyEdited) {
        if (serviceName.trim() || val.trim()) {
          setSlug(generateLandingSlug(serviceName, val));
        } else if (title) {
          setSlug(generatePageSlug(title));
        }
      }
      if (!shortCodeManuallyEdited) {
        setShortCode(generateShortCode(serviceName || title, val));
      }
    }
  };


  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    const data = await getAllPages();
    setPages(data);
    setLoading(false);
  };

  const handleCopyAdPageLink = (page: PageData) => {
    const url = `${window.location.origin}/p/${page.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(page.slug);
    toast({ title: 'تم نسخ الرابط', description: 'تم نسخ رابط الصفحة الإعلانية إلى الحافظة.' });
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setTitleManuallyEdited(val.trim().length > 0);
    if (view === 'create' && !slugManuallyEdited) {
      if (pageType === 'landing' && (serviceName.trim() || serviceArea.trim())) {
        setSlug(generateLandingSlug(serviceName, serviceArea));
      } else {
        setSlug(generatePageSlug(val));
      }
    }
  };

  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const val = arabicToSlug(raw);
    setSlug(val);
    setSlugManuallyEdited(true);
  };

  const handleRegenerateSlug = () => {
    setSlugManuallyEdited(false);
    if (pageType === 'landing' && (serviceName.trim() || serviceArea.trim())) {
      setSlug(generateLandingSlug(serviceName, serviceArea));
    } else {
      setSlug(generatePageSlug(title));
    }
    toast({
      title: 'تم تحويل وتوليد الرابط الإنجليزي',
      description: 'تم إنشاء رابط إنجليزي ناصع وسهل للمشاركة بنجاح.',
    });
  };


  const resetLandingFields = () => {
    setCoverImageUrl('');
    setLogoUrl('');
    setSubtitle('');
    setWhatsappNumber('');
    setWhatsappMessage('');
    setPhoneNumber('');
    setTheme('default');
    setFeatures([]);
    setGallery([]);
    setTestimonials([]);
    setFaqs([]);
    setLocationEmbed('');
    setServiceName('');
    setServiceArea('');
  };

  const resetAdpageFields = () => {
    setAdpageCategoryId('');
    setAdpageSubcategoryId('');
    setAdpageQuery('');
    setAdpageDescription('');
    setAdpageCoverImage('');
    setAdpageSubtitle('');
    setAdpageButtonText('');
    // adpageMode always showcase — no reset needed
    setAdpageStores([]);
    setAdpageBrands([]);
    setAdpageConditionFilters([]);
  };

  const handleOpenCreate = () => {
    setSelectedPage(null);
    setTitle('');
    setSlug('');
    setContent('');
    setIsPublished(true);
    setCountdown(20);
    setPageType(activeFilter === 'landing' ? 'landing' : activeFilter === 'adpages' ? 'adpage' : 'system');
    setShortCode('');
    setTitleManuallyEdited(false);
    setSlugManuallyEdited(false);
    setShortCodeManuallyEdited(false);
    resetLandingFields();
    resetAdpageFields();
    setView('create');
  };

  const handleOpenEdit = (page: PageData) => {
    setSelectedPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setIsPublished(page.isPublished);
    setCountdown(page.countdown ?? 20);
    setPageType(page.pageType ?? 'system');
    setShortCode(page.shortCode ?? '');
    setTitleManuallyEdited(true);
    setSlugManuallyEdited(true);
    setShortCodeManuallyEdited(true);
    // landing fields
    setCoverImageUrl(page.coverImageUrl ?? '');
    setLogoUrl(page.logoUrl ?? '');
    setSubtitle(page.subtitle ?? '');
    setWhatsappNumber(page.whatsappNumber ?? '');
    setWhatsappMessage(page.whatsappMessage ?? '');
    setPhoneNumber(page.phoneNumber ?? '');
    setTheme(page.theme ?? 'default');
    setFeatures(page.features ?? []);
    setGallery(page.gallery ?? []);
    setTestimonials(page.testimonials ?? []);
    setFaqs(page.faqs ?? []);
    setLocationEmbed(page.locationEmbed ?? '');
    setServiceName(page.serviceName ?? '');
    setServiceArea(page.serviceArea ?? '');
    // adpage fields
    setAdpageCategoryId(page.adpageCategoryId ?? '');
    setAdpageSubcategoryId(page.adpageSubcategoryId ?? '');
    setAdpageQuery(page.adpageQuery ?? '');
    setAdpageDescription(page.adpageDescription ?? '');
    setAdpageCoverImage(page.adpageCoverImage ?? '');
    setAdpageSubtitle(page.adpageSubtitle ?? '');
    setAdpageButtonText(page.adpageButtonText ?? '');
    // adpageMode always showcase — no state to set
    setAdpageStores(page.adpageStores ?? []);
    setAdpageBrands(page.adpageBrands ?? []);
    setAdpageConditionFilters(page.adpageConditionFilters ?? []);
    setView('edit');
  };

  // ---- Upload helpers ----
  const handleUploadAdpageCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdpageCoverUploading(true);
    try {
      const { url } = await uploadFileAndReturnInfo(file, 'adpage-covers');
      setAdpageCoverImage(url);
      toast({ title: 'تم رفع صورة الغلاف', description: 'تم رفع صورة الغلاف الإعلاني بنجاح.' });
    } catch {
      toast({ title: 'فشل الرفع', description: 'حدث خطأ أثناء رفع صورة الغلاف.', variant: 'destructive' });
    } finally { setAdpageCoverUploading(false); }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { url } = await uploadFileAndReturnInfo(file, 'landing-covers');
      setCoverImageUrl(url);
      toast({ title: 'تم رفع صورة الغلاف', description: 'تم رفع الصورة بنجاح.' });
    } catch {
      toast({ title: 'فشل الرفع', description: 'حدث خطأ أثناء رفع صورة الغلاف.', variant: 'destructive' });
    } finally { setCoverUploading(false); }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await uploadFileAndReturnInfo(file, 'landing-logos');
      setLogoUrl(url);
      toast({ title: 'تم رفع الشعار', description: 'تم رفع الشعار بنجاح.' });
    } catch {
      toast({ title: 'فشل الرفع', description: 'حدث خطأ أثناء رفع الشعار.', variant: 'destructive' });
    } finally { setLogoUploading(false); }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      const uploads = await Promise.all(files.map(f => uploadFileAndReturnInfo(f, 'landing-galleries')));
      setGallery(prev => [...prev, ...uploads.map(u => u.url)]);
      toast({ title: 'تم رفع الصور', description: `تم رفع ${uploads.length} صورة بنجاح.` });
    } catch {
      toast({ title: 'فشل الرفع', description: 'حدث خطأ أثناء رفع الصور.', variant: 'destructive' });
    } finally { setGalleryUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdPage = pageType === 'adpage';
    if (!title.trim() || !slug.trim() || (!isAdPage && !content.trim())) {
      toast({
        title: 'خطأ في المدخلات',
        description: isAdPage ? 'يرجى تعبئة عنوان الصفحة ورابط الصفحة.' : 'يرجى تعبئة العنوان والرمز الرابط والمحتوى.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const finalContent = isAdPage ? (content.trim() || adpageDescription.trim() || title.trim()) : content;

      if (view === 'create') {
        const existingSlugs = pages.map(p => p.slug);
        const finalSlug = resolveUniqueSlug(slug, existingSlugs);

        const landingExtras = pageType === 'landing' ? {
          coverImageUrl: coverImageUrl || undefined,
          logoUrl: logoUrl || undefined,
          subtitle: subtitle || undefined,
          whatsappNumber: whatsappNumber || undefined,
          whatsappMessage: whatsappMessage || undefined,
          phoneNumber: phoneNumber || undefined,
          theme,
          features: features.length ? features : undefined,
          gallery: gallery.length ? gallery : undefined,
          testimonials: testimonials.length ? testimonials : undefined,
          faqs: faqs.length ? faqs : undefined,
          locationEmbed: locationEmbed || undefined,
          serviceName: serviceName || undefined,
          serviceArea: serviceArea || undefined,
        } : {};

        const adpageExtras = isAdPage ? {
          adpageCategoryId: adpageCategoryId || undefined,
          adpageSubcategoryId: adpageSubcategoryId || undefined,
          adpageQuery: adpageQuery || undefined,
          adpageDescription: adpageDescription || undefined,
          adpageCoverImage: adpageCoverImage || undefined,
          adpageSubtitle: adpageSubtitle || undefined,
          adpageButtonText: adpageButtonText || undefined,
          adpageMode: 'showcase' as 'showcase',
          adpageStores: adpageStores.length ? adpageStores : undefined,
          adpageBrands: adpageBrands.length ? adpageBrands : undefined,
          adpageConditionFilters: adpageConditionFilters.length ? adpageConditionFilters : undefined,
        } : {};

        await createPage({
          title,
          slug: finalSlug,
          content: finalContent,
          isPublished,
          pageType,
          shortCode: (pageType === 'landing' || pageType === 'adpage') && shortCode ? normalizeShortCode(shortCode) : undefined,
          countdown: slug === 'redirect' ? countdown : undefined,
          ...landingExtras,
          ...adpageExtras,
        });

        await handleRevalidatePage(finalSlug);

        toast({
          title: 'تم إنشاء الصفحة',
          description: finalSlug !== slug 
            ? `تم إنشاء الصفحة بنجاح برابط فريد: ${finalSlug}` 
            : 'تم إنشاء الصفحة بنجاح ونشرها.',
        });
      } else if (view === 'edit' && selectedPage?.id) {
        const existingSlugs = pages.filter(p => p.id !== selectedPage.id).map(p => p.slug);
        const finalSlug = resolveUniqueSlug(slug, existingSlugs);
        
        const oldSlug = selectedPage.slug;
        let finalLegacySlug = selectedPage.legacySlug || '';
        
        // If slug changed, store the old slug as legacySlug for 301 redirects
        if (oldSlug && oldSlug !== finalSlug) {
          finalLegacySlug = oldSlug;
        }

        const landingExtrasUpdate = pageType === 'landing' ? {
          coverImageUrl: coverImageUrl || undefined,
          logoUrl: logoUrl || undefined,
          subtitle: subtitle || undefined,
          whatsappNumber: whatsappNumber || undefined,
          whatsappMessage: whatsappMessage || undefined,
          phoneNumber: phoneNumber || undefined,
          theme,
          features: features.length ? features : undefined,
          gallery: gallery.length ? gallery : undefined,
          testimonials: testimonials.length ? testimonials : undefined,
          faqs: faqs.length ? faqs : undefined,
          locationEmbed: locationEmbed || undefined,
          serviceName: serviceName || undefined,
          serviceArea: serviceArea || undefined,
        } : {};

        const adpageExtrasUpdate = isAdPage ? {
          adpageCategoryId: adpageCategoryId || undefined,
          adpageSubcategoryId: adpageSubcategoryId || undefined,
          adpageQuery: adpageQuery || undefined,
          adpageDescription: adpageDescription || undefined,
          adpageCoverImage: adpageCoverImage || undefined,
          adpageSubtitle: adpageSubtitle || undefined,
          adpageButtonText: adpageButtonText || undefined,
          adpageMode: 'showcase' as 'showcase',
          adpageStores: adpageStores.length ? adpageStores : undefined,
          adpageBrands: adpageBrands.length ? adpageBrands : undefined,
          adpageConditionFilters: adpageConditionFilters.length ? adpageConditionFilters : undefined,
        } : {};

        await updatePage(selectedPage.id, {
          title,
          slug: finalSlug,
          legacySlug: finalLegacySlug || undefined,
          content: finalContent,
          isPublished,
          pageType,
          shortCode: (pageType === 'landing' || pageType === 'adpage') && shortCode ? normalizeShortCode(shortCode) : undefined,
          countdown: slug === 'redirect' ? countdown : undefined,
          ...landingExtrasUpdate,
          ...adpageExtrasUpdate,
        });


        await handleRevalidatePage(finalSlug);
        if (oldSlug && oldSlug !== finalSlug) {
          await handleRevalidatePage(oldSlug);
        }

        toast({
          title: 'تم تحديث الصفحة',
          description: finalSlug !== slug 
            ? `تم تحديث الصفحة بنجاح برابط فريد: ${finalSlug}` 
            : 'تم حفظ تعديلات الصفحة بنجاح.',
        });
      }

      setView('list');
      fetchPages();
    } catch (error) {
      console.error(error);
      toast({
        title: 'فشلت العملية',
        description: 'حدث خطأ غير متوقع أثناء حفظ الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const [migrating, setMigrating] = useState(false);

  const handleMigrateSlugs = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في ترحيل روابط صفحات الهبوط وتوليد الروابط القصيرة؟ لن يتم حذف أي بيانات وسيتم حفظ الروابط القديمة لعمل redirect 301.')) return;
    
    setMigrating(true);
    try {
      const prefixList = ["شركة", "فني", "معلم", "محل", "ورشة", "مكتب", "خدمات", "كشف", "نقل", "عزل", "تنظيف", "مكافحة", "رش", "صيانة"];
      const stopwords = ['أفضل', 'افضل', 'ممتاز', 'رقم', 'خصم', 'بخصم', 'ارخص', 'أرخص', 'بأرخص', 'بارخص', 'للاتصال', 'اتصل', 'جوال', 'تليفون', 'هاتف'];

      const usedSlugs = new Set();
      pages.forEach(page => {
        if (page.pageType !== 'landing') {
          usedSlugs.add(page.slug);
        }
      });

      let migratedCount = 0;

      for (const page of pages) {
        if (page.pageType !== 'landing') {
          continue;
        }

        const oldSlug = page.slug;
        const words = oldSlug.split('-');
        const cleanWords = [];

        for (const word of words) {
          if (/[0-9\u0660-\u0669]/.test(word) || stopwords.includes(word.toLowerCase())) {
            break;
          }
          cleanWords.push(word);
        }

        if (cleanWords.length === 0) {
          cleanWords.push(...words.slice(0, 3));
        }

        const baseNewSlug = cleanWords.join('-');

        let finalSlug = baseNewSlug;
        let counter = 2;
        while (usedSlugs.has(finalSlug)) {
          finalSlug = `${baseNewSlug}-${counter}`;
          counter++;
        }
        usedSlugs.add(finalSlug);

        // Service & Area
        let serviceName = "";
        let serviceArea = "";

        if (cleanWords.length >= 3 && prefixList.includes(cleanWords[0])) {
          serviceName = cleanWords.slice(0, 2).join(' ');
          serviceArea = cleanWords.slice(2).join(' ');
        } else if (cleanWords.length > 0) {
          serviceName = cleanWords[0];
          serviceArea = cleanWords.slice(1).join(' ');
        } else {
          serviceName = page.title;
          serviceArea = "";
        }

        const updateData: Partial<PageData> = {};
        if (oldSlug !== finalSlug) {
          updateData.slug = finalSlug;
          updateData.legacySlug = oldSlug;
        }
        if (!page.serviceName) {
          updateData.serviceName = serviceName;
        }
        if (!page.serviceArea) {
          updateData.serviceArea = serviceArea;
        }

        if (Object.keys(updateData).length > 0 && page.id) {
          await updatePage(page.id, updateData);
          migratedCount++;
        }
      }

      toast({
        title: 'تم الترحيل بنجاح',
        description: `تم تحديث روابط ${migratedCount} صفحة هبوط بنجاح.`,
      });
      fetchPages();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'فشل الترحيل',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الصفحة نهائياً؟')) return;

    setActionLoading(true);
    try {
      await deletePage(id);
      toast({
        title: 'تم حذف الصفحة',
        description: 'تمت إزالة الصفحة بنجاح من النظام.',
      });
      fetchPages();
    } catch (error) {
      console.error(error);
      toast({
        title: 'فشل الحذف',
        description: 'حدث خطأ أثناء محاولة حذف الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorderPage = async (pageId: string, direction: 'up' | 'down') => {
    // Work on the currently-filtered list so the move is relative to what's visible
    const currentFiltered = pages.filter(p => {
      if (activeFilter === 'landing') return p.pageType === 'landing';
      if (activeFilter === 'site') return p.pageType !== 'landing' && p.pageType !== 'adpage';
      if (activeFilter === 'adpages') return p.pageType === 'adpage';
      return true;
    }).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const idx = currentFiltered.findIndex(p => p.id === pageId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentFiltered.length) return;

    // Swap in the filtered list
    const reordered = [...currentFiltered];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

    // Assign new order values
    const updates: Promise<void>[] = reordered.map((p, i) => {
      if (p.id) return updatePage(p.id, { order: i });
      return Promise.resolve();
    });

    // Optimistically update local state
    setPages(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      reordered.forEach((p, i) => { if (p.id && map.has(p.id)) map.set(p.id, { ...map.get(p.id)!, order: i }); });
      return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    try {
      await Promise.all(updates);
    } catch {
      toast({ title: 'فشل الترتيب', description: 'حدث خطأ أثناء حفظ الترتيب.', variant: 'destructive' });
      fetchPages(); // re-sync on failure
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري تحميل الصفحات...</p>
      </div>
    );
  }

  const landingPagesCount = pages.filter(p => p.pageType === 'landing').length;
  const adPagesCount = pages.filter(p => p.pageType === 'adpage').length;
  const sitePagesCount = pages.filter(p => p.pageType !== 'landing' && p.pageType !== 'adpage').length;
  const filteredPages = pages.filter(p => {
    if (activeFilter === 'landing') return p.pageType === 'landing';
    if (activeFilter === 'site') return p.pageType !== 'landing' && p.pageType !== 'adpage';
    if (activeFilter === 'adpages') return p.pageType === 'adpage';
    return true;
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
        <div className="text-right">
          <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold font-headline">
            {activeFilter === 'landing' ? (
              <>
                <Rocket className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                إدارة صفحات الهبوط
              </>
            ) : activeFilter === 'site' ? (
              <>
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                صفحات الموقع
              </>
            ) : activeFilter === 'adpages' ? (
              <>
                <Tag className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
                الصفحات الإعلانية
              </>
            ) : (
              <>
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                إدارة الصفحات
              </>
            )}
          </CardTitle>
          <CardDescription>
            {activeFilter === 'landing' 
              ? 'إنشاء وتعديل صفحات الهبوط التسويقية والخدمية.' 
              : activeFilter === 'site' 
                ? 'إدارة الصفحات الثابتة والنظامية للموقع.' 
                : activeFilter === 'adpages'
                  ? 'صفحات تعلنية مخصصة تنتقل بك مباشرةً لصفحة فئة مع فلاتير محددة — رابط قصير نظيف.'
                  : 'إنشاء وتعديل وحذف الصفحات الثابتة والديناميكية للموقع.'}
          </CardDescription>
        </div>
        
        {view === 'list' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {activeFilter === 'landing' && (
              <Button 
                variant="outline" 
                onClick={handleMigrateSlugs} 
                disabled={migrating}
                className="border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2"
              >
                {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                ترحيل الروابط
              </Button>
            )}

            <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              {activeFilter === 'landing' ? 'إضافة صفحة هبوط جديدة' : activeFilter === 'adpages' ? 'إنشاء صفحة إعلانية جديدة' : 'إضافة صفحة جديدة'}
            </Button>
          </div>
        )}

        {view !== 'list' && (
          <Button variant="outline" onClick={() => setView('list')} className="w-full sm:w-auto flex items-center justify-center gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        {view === 'list' && (
          <div className="flex items-center gap-2 mb-6 border-b border-border/60 pb-4 overflow-x-auto">
            <Button
              type="button"
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              الكل ({pages.length})
            </Button>
            <Button
              type="button"
              variant={activeFilter === 'landing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('landing')}
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              <Rocket className="h-3.5 w-3.5 text-blue-400" />
              صفحات الهبوط ({landingPagesCount})
            </Button>
            <Button
              type="button"
              variant={activeFilter === 'site' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('site')}
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              <Building2 className="h-3.5 w-3.5 text-primary" />
              صفحات الموقع ({sitePagesCount})
            </Button>
            <Button
              type="button"
              variant={activeFilter === 'adpages' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('adpages')}
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              <Tag className="h-3.5 w-3.5 text-amber-500" />
              الصفحات الإعلانية ({adPagesCount})
            </Button>
          </div>
        )}

        {view === 'list' ? (
          filteredPages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              <FileLock className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
              <p className="text-lg font-medium">لا توجد صفحات منشأة حالياً في هذا القسم</p>
              <p className="text-sm mt-1">اضغط على زر "إضافة صفحة جديدة" للبدء.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-sm">
                    <th className="pb-3 pt-1 font-semibold w-8 text-center">الترتيب</th>
                    <th className="pb-3 pt-1 font-semibold">عنوان الصفحة</th>
                    <th className="pb-3 pt-1 font-semibold">الرابط</th>
                    <th className="pb-3 pt-1 font-semibold text-center">النوع</th>
                    <th className="pb-3 pt-1 font-semibold text-center">المشاهدات</th>
                    <th className="pb-3 pt-1 font-semibold text-center">الحالة</th>
                    <th className="pb-3 pt-1 font-semibold text-left">العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {filteredPages.map((page) => {
                    const isSystemSlug = SYSTEM_SLUGS.includes(page.slug);
                    const pageUrl = isSystemSlug ? `/${page.slug}` : `/p/${page.slug}`;

                    const isFirst = filteredPages[0]?.id === page.id;
                    const isLast = filteredPages[filteredPages.length - 1]?.id === page.id;

                    return (
                      <tr key={page.id} className="hover:bg-muted/40 transition-colors">
                        {/* Reorder column */}
                        <td className="py-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => page.id && handleReorderPage(page.id, 'up')}
                              disabled={isFirst}
                              title="نقل للأعلى"
                              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => page.id && handleReorderPage(page.id, 'down')}
                              disabled={isLast}
                              title="نقل للأسفل"
                              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-foreground">
                          <div>{page.title}</div>
                          {page.pageType === 'adpage' && page.adpageCategoryId && (
                            <div className="text-2xs text-amber-600 dark:text-amber-400 font-normal mt-0.5 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>
                                الفئة: {dbCategories.find(c => c.id === page.adpageCategoryId)?.name?.ar || page.adpageCategoryId}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-muted-foreground font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span dir="ltr">{pageUrl}</span>
                              {page.shortCode && (
                                <span dir="ltr" className="text-primary/70 flex items-center gap-1">
                                  <Link2 className="h-3 w-3" />/l/{page.shortCode}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-muted"
                              onClick={() => handleCopySpecificLink(page.slug)}
                              title="نسخ الرابط"
                            >
                              {copiedSlug === page.slug ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {page.pageType === 'landing' ? (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/20">
                              <Rocket className="h-3 w-3" />هبوط
                            </span>
                          ) : page.pageType === 'adpage' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-xs font-medium border border-amber-500/20">
                              <Tag className="h-3 w-3" />إعلانية
                            </span>
                          ) : page.pageType === 'legal' ? (
                            <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full text-xs font-medium border border-orange-500/20">
                              <Scale className="h-3 w-3" />قانوني
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium border border-border">
                              <Building2 className="h-3 w-3" />نظام
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center font-mono font-medium text-foreground">
                          {(page.views || 0).toLocaleString('en-US')}
                        </td>
                        <td className="py-4 text-center">
                          {page.isPublished ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-500/20">
                              <Globe className="h-3 w-3" />
                              منشورة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 rounded-full text-xs font-medium border border-yellow-500/20">
                              <FileLock className="h-3 w-3" />
                              مسودة
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-left">
                          <div className="flex justify-end gap-2">
                            {page.isPublished && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                asChild 
                                title="معاينة الصفحة"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <a 
                                  href={pageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenEdit(page)} 
                              title="تعديل الصفحة"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => page.id && handleDelete(page.id)} 
                              title="حذف الصفحة"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <form onSubmit={handleSave} className="space-y-6 text-right" dir="rtl">
            {/* Floating Sticky Save Bar */}
            <div className="sticky top-20 z-30 bg-card/95 backdrop-blur-md border border-border/80 p-3.5 rounded-xl shadow-lg flex items-center justify-between gap-4 transition-all">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-bold text-sm md:text-base text-foreground truncate">
                  {title ? `${view === 'edit' ? 'تعديل' : 'إنشاء'}: ${title}` : (view === 'edit' ? 'تعديل الصفحة' : 'صفحة جديدة')}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button type="button" variant="outline" onClick={() => setView('list')} disabled={actionLoading} size="sm">
                  إلغاء
                </Button>
                <Button type="submit" disabled={actionLoading} size="sm" className="bg-primary text-primary-foreground flex items-center gap-1.5 px-4 shadow-sm hover:opacity-90">
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {view === 'edit' ? 'حفظ التعديلات' : 'إنشاء الصفحة'}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="page-title" className="text-foreground font-medium">عنوان الصفحة <span className="text-destructive">*</span></Label>
                <Input 
                  id="page-title"
                  type="text" 
                  value={title} 
                  onChange={handleTitleChange} 
                  placeholder="مثال: من نحن، الشروط والأحكام..."
                  className="bg-background border-border text-foreground text-right"
                  required 
                />
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                {view === 'create' ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/30 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-muted-foreground font-medium flex-shrink-0">رابط الصفحة المتوقع:</span>
                      <span dir="ltr" className="font-mono font-bold text-primary truncate">/p/{slug || '...'}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-2xs text-muted-foreground hover:text-foreground h-auto p-1 flex-shrink-0"
                      onClick={() => setShowAdvancedSlug(!showAdvancedSlug)}
                    >
                      {showAdvancedSlug ? 'إخفاء الرابط' : 'تعديل الرابط (متقدم)'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/30 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-muted-foreground font-medium flex-shrink-0">رابط الصفحة:</span>
                      <span dir="ltr" className="font-mono font-bold text-primary truncate">
                        {SYSTEM_SLUGS.includes(slug) ? `/${slug}` : `/p/${slug}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-2xs text-primary h-auto p-1"
                        onClick={handleCopyLink}
                      >
                        {copied ? 'تم النسخ' : 'نسخ الرابط'}
                      </Button>
                      {!SYSTEM_SLUGS.includes(slug) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-2xs text-muted-foreground hover:text-foreground h-auto p-1"
                          onClick={() => setShowAdvancedSlug(!showAdvancedSlug)}
                        >
                          {showAdvancedSlug ? 'إخفاء' : 'تعديل الرابط'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {showAdvancedSlug && (
                  <div className="mt-2 space-y-2 p-3 rounded-xl border border-border bg-background transition-all">
                    <Label htmlFor="page-slug" className="text-xs text-foreground font-medium">رابط الصفحة (Slug)</Label>
                    <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden bg-background" dir="ltr">
                      <span className="px-3 py-2 bg-muted text-muted-foreground text-sm font-mono border-l border-border select-none">
                        {SYSTEM_SLUGS.includes(slug) ? '/' : '/p/'}
                      </span>
                      <Input
                        id="page-slug"
                        type="text"
                        value={slug}
                        onChange={handleSlugInputChange}
                        className="border-0 rounded-none bg-transparent font-mono text-sm focus-visible:ring-0 text-left w-full"
                        disabled={SYSTEM_SLUGS.includes(slug)}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                      <span>يتم توليد رابط احترافي باللغة الإنجليزية في الخلفية تلقائياً.</span>
                      <Button type="button" variant="link" size="sm" onClick={handleRegenerateSlug} className="text-2xs text-primary p-0 h-auto font-normal">
                        إعادة التوليد تلقائياً
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Page Type Selector */}
            <div className="space-y-3">
              <Label className="text-foreground font-medium">نوع الصفحة</Label>
              <div className="flex flex-wrap gap-3">
                {([
                  { value: 'system', label: 'نظام', icon: Building2, desc: 'صفحات النظام (من نحن، FAQ، اتصل بنا)' },
                  { value: 'legal', label: 'قانوني', icon: Scale, desc: 'سياسة الخصوصية، الشروط والأحكام' },
                  { value: 'landing', label: 'هبوط', icon: Rocket, desc: 'صفحة تسويقية مع رابط قصير' },
                  { value: 'adpage', label: 'إعلانية', icon: Tag, desc: 'رابط قصير ينتقل لصفحة فئة بفلاتير محددة' },
                ] as const).map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPageType(value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      pageType === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                    title={desc}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ========== ADPAGE PANEL ========== */}
            {pageType === 'adpage' && (
              <div className="space-y-6 p-5 rounded-2xl border border-border bg-card shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground text-base">إعدادات الصفحة الإعلانية</h3>
                  </div>
                  <span className="bg-primary/10 text-primary border border-primary/20 text-2xs px-2.5 py-1 rounded-full font-medium">
                    صفحة إعلانية مخصصة
                  </span>
                </div>

                {/* Mode is always showcase — no selector needed */}

                {/* Category & Subcategory Selectors from real DB categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adpage-cat" className="font-medium text-foreground text-xs">
                      الفئة الرئيسية <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="adpage-cat"
                      value={adpageCategoryId}
                      onChange={e => { setAdpageCategoryId(e.target.value); setAdpageSubcategoryId(''); }}
                      className="w-full rounded-xl border border-border bg-background text-foreground text-right px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required={pageType === 'adpage'}
                    >
                      <option value="">— اختر الفئة —</option>
                      {dbCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {typeof cat.name === 'string' ? cat.name : cat.name?.ar || cat.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adpage-subcat" className="font-medium text-foreground text-xs">
                      الفئة الفرعية (اختياري)
                    </Label>
                    <select
                      id="adpage-subcat"
                      value={adpageSubcategoryId}
                      onChange={e => setAdpageSubcategoryId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background text-foreground text-right px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={!adpageCategoryId}
                    >
                      <option value="">— كل الفئات الفرعية —</option>
                      {dbCategories
                        .find(c => c.id === adpageCategoryId)
                        ?.subcategories?.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {typeof sub.name === 'string' ? sub.name : sub.name?.ar || sub.id}
                          </option>
                        )) ?? []}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adpage-query" className="font-medium text-foreground text-xs">
                      نص تصفية البحث (اختياري)
                    </Label>
                    <Input
                      id="adpage-query"
                      value={adpageQuery}
                      onChange={e => setAdpageQuery(e.target.value)}
                      placeholder="مثال: تويوتا كامري، شقة للبيع..."
                      className="bg-background border-border text-foreground text-right text-xs"
                    />
                  </div>
                </div>

                {/* Subtitle & CTA Button Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adpage-subtitle" className="font-medium text-foreground text-xs">
                      العنوان الفرعي / الوصف المختصر
                    </Label>
                    <Input
                      id="adpage-subtitle"
                      value={adpageSubtitle}
                      onChange={e => setAdpageSubtitle(e.target.value)}
                      placeholder="مثال: تصفح أحدث عروض السيارات بأفضل الأسعار المتاحة"
                      className="bg-background border-border text-foreground text-right text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adpage-btntext" className="font-medium text-foreground text-xs">
                      نص زر التحويل والاتصال (CTA Button Text)
                    </Label>
                    <Input
                      id="adpage-btntext"
                      value={adpageButtonText}
                      onChange={e => setAdpageButtonText(e.target.value)}
                      placeholder="مثال: تصفح كل الإعلانات الآن"
                      className="bg-background border-border text-foreground text-right text-xs"
                    />
                  </div>
                </div>

                {/* Cover Image / Banner */}
                <div className="space-y-2">
                  <Label className="font-medium flex items-center gap-2 text-foreground text-xs">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    صورة الغلاف / البانر الإعلاني
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {adpageCoverImage && (
                      <div className="relative w-36 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        <Image src={adpageCoverImage} alt="Cover Preview" fill className="object-cover" sizes="150px" />
                        <button 
                          type="button" 
                          onClick={() => setAdpageCoverImage('')} 
                          className="absolute top-1 left-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          title="حذف الصورة"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input ref={adpageCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAdpageCover} />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => adpageCoverInputRef.current?.click()} 
                        disabled={adpageCoverUploading}
                        className="flex items-center gap-2 border-border text-foreground hover:bg-muted text-xs"
                      >
                        {adpageCoverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-primary" />}
                        {adpageCoverUploading ? 'جاري الرفع...' : (adpageCoverImage ? 'تغيير صورة الغلاف' : 'رفع صورة غلاف إعلاني')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Featured Showrooms / Companies Section */}
                <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2 text-foreground text-xs">
                      <Building2 className="h-4 w-4 text-primary" />
                      الشركات والمعارض المميزة (Featured Showrooms)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAdpageStores(prev => [...prev, { id: `store_${Date.now()}`, name: '', logoText: '', subText: 'معرض معتمد' }])}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة معرض
                    </Button>
                  </div>

                  {adpageStores.length === 0 ? (
                    <div className="text-center py-3 border border-dashed border-border rounded-lg text-muted-foreground text-2xs">
                      لا توجد معارض مميزة مضافة — اضغط "إضافة معرض" لإضافة معرض أو شركة.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adpageStores.map((st, i) => (
                        <div key={st.id || i} className="grid grid-cols-[1.2fr_1fr_auto_auto] gap-2 items-center bg-background p-2 rounded-xl border border-border">
                          <Input
                            value={st.name}
                            onChange={e => {
                              const n = [...adpageStores];
                              n[i] = { ...n[i], name: e.target.value, logoText: e.target.value };
                              setAdpageStores(n);
                            }}
                            placeholder="اسم المعرض أو الشركة"
                            className="bg-background text-xs h-8"
                          />
                          <Input
                            value={st.subText || ''}
                            onChange={e => {
                              const n = [...adpageStores];
                              n[i] = { ...n[i], subText: e.target.value };
                              setAdpageStores(n);
                            }}
                            placeholder="الصفة (مثال: معرض معتمد)"
                            className="bg-background text-xs h-8"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const n = [...adpageStores];
                              n[i] = { ...n[i], active: !n[i].active };
                              setAdpageStores(n);
                            }}
                            className={`flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-bold transition-all border ${
                              st.active 
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs' 
                                : 'bg-background text-muted-foreground border-border hover:border-amber-500/50'
                            }`}
                            title="تمييز المعرض باللون الذهبي"
                          >
                            <Star className={`h-3.5 w-3.5 ${st.active ? 'fill-white' : ''}`} />
                            <span>{st.active ? 'مميز' : 'عادي'}</span>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setAdpageStores(prev => prev.filter((_, idx) => idx !== i))}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="حذف المعرض"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Condition / Status Custom Filter Buttons Section */}
                <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2 text-foreground text-xs">
                      <Sparkles className="h-4 w-4 text-primary" />
                      أزرار الفلترة السريعة وحالة المنتجات (Condition Filter Pills)
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_all`, name: 'الكل', value: 'all' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + الكل
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_recent`, name: 'الأحدث', value: 'recent' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + الأحدث
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_top`, name: '⭐ الأعلى تقييماً', value: 'top_rated' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + الأعلى تقييماً
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_new`, name: 'جديد', value: 'new' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + جديد
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_used`, name: 'مستعمل', value: 'used' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + مستعمل
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_low`, name: 'الأقل سعراً', value: 'price_low' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + الأقل سعراً
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_high`, name: 'الأعلى سعراً', value: 'price_high' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + الأعلى سعراً
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_sale`, name: 'للبيع / تمليك', value: 'sale' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + للبيع
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_rent`, name: 'للإيجار', value: 'rent' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + للإيجار
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_ver`, name: 'حسابات موثقة', value: 'verified' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + موثق
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_pop`, name: 'الأكثر اختياراً', value: 'popular' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + الأكثر اختياراً
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageConditionFilters(prev => [...prev, { id: `cfilter_${Date.now()}_custom`, name: 'زر مخصص', value: 'custom' }])}
                        className="text-2xs h-7 px-2 bg-secondary/40"
                      >
                        + زر مخصص
                      </Button>
                    </div>
                  </div>

                  {adpageConditionFilters.length === 0 ? (
                    <div className="text-center py-3 border border-dashed border-border rounded-lg text-muted-foreground text-2xs">
                      لا توجد أزرار فلترة مضافة — يمكنك اختيار أحد الأزرار أعلاه أو إضافة زر مخصص.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adpageConditionFilters.map((cf, i) => (
                        <div key={cf.id || i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center bg-background p-2 rounded-xl border border-border">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => {
                                setAdpageConditionFilters(prev => {
                                  if (i === 0) return prev;
                                  const list = [...prev];
                                  const temp = list[i - 1];
                                  list[i - 1] = list[i];
                                  list[i] = temp;
                                  return list;
                                });
                              }}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                              title="تحريك لأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={i === adpageConditionFilters.length - 1}
                              onClick={() => {
                                setAdpageConditionFilters(prev => {
                                  if (i >= prev.length - 1) return prev;
                                  const list = [...prev];
                                  const temp = list[i + 1];
                                  list[i + 1] = list[i];
                                  list[i] = temp;
                                  return list;
                                });
                              }}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                              title="تحريك لأسفل"
                            >
                              ▼
                            </button>
                          </div>

                          <Input
                            value={cf.name}
                            onChange={e => {
                              const n = [...adpageConditionFilters];
                              n[i] = { ...n[i], name: e.target.value };
                              setAdpageConditionFilters(n);
                            }}
                            placeholder="اسم الزر المعروض (مثال: الكل / الأحدث / الأعلى تقييماً)"
                            className="bg-background text-xs h-8"
                          />
                          <select
                            value={cf.value}
                            onChange={e => {
                              const n = [...adpageConditionFilters];
                              n[i] = { ...n[i], value: e.target.value };
                              setAdpageConditionFilters(n);
                            }}
                            className="w-full rounded-lg border border-border bg-background text-foreground text-right px-2 py-1 text-xs h-8 focus:outline-none"
                          >
                            <option value="all">الكل (عرض جميع الإعلانات)</option>
                            <option value="recent">الأحدث (ترتيب حسب أحدث الإعلانات)</option>
                            <option value="top_rated">الأعلى تقييماً (ترتيب حسب التقييم)</option>
                            <option value="price_low">الأقل سعراً (ترتيب تصاعدي)</option>
                            <option value="price_high">الأعلى سعراً (ترتيب تنازلي)</option>
                            <option value="new">جديد</option>
                            <option value="used">مستعمل</option>
                            <option value="sale">للبيع / تمليك</option>
                            <option value="rent">للإيجار</option>
                            <option value="popular">الأكثر اختياراً / رواجاً</option>
                            <option value="verified">حسابات ومتاجر موثقة</option>
                            <option value="custom">تصفية بحسب نص اسم الزر بالضبط</option>
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setAdpageConditionFilters(prev => prev.filter((_, idx) => idx !== i))}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="حذف الزر"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brands / Quick Filter Pills Section */}
                <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2 text-foreground text-xs">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      ماركات السيارات وأزرار الفلترة السريعة (Brand Pills)
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setAdpageBrands(POPULAR_CAR_BRANDS.filter(b => b.isPopular).map(b => ({ id: b.id, name: b.name })))}
                        className="flex items-center gap-1 text-2xs bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <CarFront className="h-3 w-3" />
                        إدراج الماركات الشائعة
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAdpageBrands(prev => [...prev, { id: `brand_${Date.now()}`, name: '' }])}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة ماركة
                      </Button>
                    </div>
                  </div>

                  {adpageBrands.length === 0 ? (
                    <div className="text-center py-3 border border-dashed border-border rounded-lg text-muted-foreground text-2xs">
                      لا توجد ماركات مضافة — اضغط "إضافة ماركة" لإضافة ماركة جديدة.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {adpageBrands.map((b, i) => (
                        <div key={b.id || i} className="flex items-center gap-1 bg-background p-1 pl-2 rounded-lg border border-border">
                          <Input
                            value={b.name}
                            onChange={e => {
                              const n = [...adpageBrands];
                              n[i] = { ...n[i], name: e.target.value };
                              setAdpageBrands(n);
                            }}
                            placeholder="اسم الماركة"
                            className="bg-background text-xs h-7 w-28"
                          />
                          <button
                            type="button"
                            onClick={() => setAdpageBrands(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target Category URL Preview */}
                {adpageCategoryId && (
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border text-xs font-mono space-y-1" dir="ltr">
                    <div className="flex items-center justify-between text-muted-foreground text-2xs">
                      <span>Target Category:</span>
                      <span className="text-primary font-sans font-bold">صفحة إعلانات مخصصة</span>
                    </div>
                    <div className="text-primary font-bold break-all">
                      /p/{slug || '...'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== LANDING PAGE ADVANCED PANEL ========== */}
            {pageType === 'landing' && (
              <div className="space-y-6 p-5 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">أدوات صفحة الهبوط الاحترافية</h3>
                </div>

                {/* Service Name & Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lp-servicename" className="font-medium text-foreground">اسم الخدمة <span className="text-destructive">*</span></Label>
                    <Input 
                      id="lp-servicename" 
                      value={serviceName} 
                      onChange={e => handleServiceChange(e.target.value)} 
                      placeholder="مثال: سباك، كهربائي، تنظيف منازل..." 
                      className="bg-background border-border text-foreground text-right"
                      required={pageType === 'landing'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp-servicearea" className="font-medium text-foreground">المنطقة أو الحي <span className="text-destructive">*</span></Label>
                    <Input 
                      id="lp-servicearea" 
                      value={serviceArea} 
                      onChange={e => handleAreaChange(e.target.value)} 
                      placeholder="مثال: شمال الرياض، جدة، حي الياسمين..." 
                      className="bg-background border-border text-foreground text-right"
                      required={pageType === 'landing'}
                    />
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <Label className="font-medium flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />ثيم الصفحة البصري</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANDING_THEMES.map(t => (
                      <button key={t.value} type="button" onClick={() => setTheme(t.value)}
                        className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${theme === t.value ? t.color + ' border-2' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                        <span className="font-bold">{t.label}</span>
                        <span className="opacity-70">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" />صورة الغلاف (Hero)</Label>
                    <div className="flex flex-col gap-2">
                      {coverImageUrl && (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-border">
                          <Image src={coverImageUrl} alt="Cover" fill className="object-cover" sizes="400px" />
                          <button type="button" onClick={() => setCoverImageUrl('')} className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
                      <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()} disabled={coverUploading} className="flex items-center gap-2">
                        {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {coverUploading ? 'جاري الرفع...' : 'رفع صورة غلاف'}
                      </Button>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" />شعار/لوجو الجهة</Label>
                    <div className="flex flex-col gap-2">
                      {logoUrl && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                          <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="80px" />
                          <button type="button" onClick={() => setLogoUrl('')} className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                      <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="flex items-center gap-2">
                        {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {logoUploading ? 'جاري الرفع...' : 'رفع الشعار'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="space-y-2">
                  <Label htmlFor="lp-subtitle" className="font-medium">العنوان الفرعي (Subtitle)</Label>
                  <Input id="lp-subtitle" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="مثال: أفضل مشتل في شمال الرياض منذ 1995" className="bg-background" />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lp-wa" className="font-medium flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-600" />رقم الواتساب</Label>
                    <Input id="lp-wa" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="966568304308" dir="ltr" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp-phone" className="font-medium flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" />رقم الاتصال المباشر</Label>
                    <Input id="lp-phone" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="0568304308" dir="ltr" className="bg-background" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp-wamsg" className="font-medium">رسالة الواتساب الجاهزة (اختياري)</Label>
                  <Input id="lp-wamsg" value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} placeholder="مرحباً، أريد الاستفسار عن..." className="bg-background" />
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2"><Check className="h-4 w-4 text-primary" />مميزات الخدمة/المنتج</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFeatures(prev => [...prev, { title: '', desc: '', iconName: 'star' }])} className="flex items-center gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />إضافة ميزة
                    </Button>
                  </div>
                  {features.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                      لا توجد مميزات مضافة — اضغط "إضافة ميزة" لإضافة ميزة جديدة
                    </div>
                  )}
                  {features.map((feat, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                      <Input value={feat.title} onChange={e => { const n=[...features]; n[i]={...n[i],title:e.target.value}; setFeatures(n); }} placeholder="عنوان الميزة" className="bg-background text-sm" />
                      <Input value={feat.desc} onChange={e => { const n=[...features]; n[i]={...n[i],desc:e.target.value}; setFeatures(n); }} placeholder="وصف الميزة" className="bg-background text-sm" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setFeatures(prev => prev.filter((_,idx)=>idx!==i))} className="h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>


                {/* Gallery */}
                <div className="space-y-3">
                  <Label className="font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" />معرض الصور</Label>
                  {gallery.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {gallery.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <Image src={url} alt={`gallery-${i}`} fill className="object-cover" sizes="100px" />
                          <button type="button" onClick={() => setGallery(prev => prev.filter((_,idx)=>idx!==i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadGallery} />
                  <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading} className="flex items-center gap-2">
                    {galleryUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {galleryUploading ? 'جاري الرفع...' : 'إضافة صور للمعرض'}
                  </Button>
                </div>

                {/* Testimonials */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />آراء العملاء</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setTestimonials(prev => [...prev, { name: '', review: '', rating: 5 }])} className="flex items-center gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />إضافة رأي
                    </Button>
                  </div>
                  {testimonials.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-start">
                      <Input value={t.name} onChange={e => { const n=[...testimonials]; n[i]={...n[i],name:e.target.value}; setTestimonials(n); }} placeholder="اسم العميل" className="bg-background text-sm" />
                      <Input value={t.review} onChange={e => { const n=[...testimonials]; n[i]={...n[i],review:e.target.value}; setTestimonials(n); }} placeholder="نص التقييم" className="bg-background text-sm" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setTestimonials(prev => prev.filter((_,idx)=>idx!==i))} className="h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>

                {/* FAQs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" />الأسئلة الشائعة</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFaqs(prev => [...prev, { question: '', answer: '' }])} className="flex items-center gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />إضافة سؤال
                    </Button>
                  </div>
                  {faqs.map((faq, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex gap-2">
                        <Input value={faq.question} onChange={e => { const n=[...faqs]; n[i]={...n[i],question:e.target.value}; setFaqs(n); }} placeholder="السؤال" className="bg-background text-sm" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setFaqs(prev => prev.filter((_,idx)=>idx!==i))} className="h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <Input value={faq.answer} onChange={e => { const n=[...faqs]; n[i]={...n[i],answer:e.target.value}; setFaqs(n); }} placeholder="الإجابة" className="bg-background text-sm" />
                    </div>
                  ))}
                </div>

                {/* Location embed */}
                <div className="space-y-2">
                  <Label htmlFor="lp-location" className="font-medium">رابط خرائط جوجل المضمّن (src الـ iframe)</Label>
                  <Input id="lp-location" value={locationEmbed} onChange={e => setLocationEmbed(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." dir="ltr" className="bg-background text-xs font-mono" />
                  <p className="text-xs text-muted-foreground">افتح جوجل ماب → مشاركة → تضمين الخريطة → انسخ رابط src</p>
                </div>
              </div>
            )}

            {/* Short Code — landing pages only */}
            {pageType === 'landing' && (
              <div className="space-y-2 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <Label htmlFor="page-shortcode" className="text-foreground font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  الكود القصير للرابط
                  <span className="text-xs text-muted-foreground font-normal">(يُولَّد تلقائياً — يمكنك تعديله أو الضغط على 🔄 لإعادة التوليد)</span>
                </Label>
                <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden bg-background" dir="ltr">
                  <span className="px-3 py-2 bg-muted text-muted-foreground text-sm font-mono border-l border-border select-none">/l/</span>
                  <Input
                    id="page-shortcode"
                    type="text"
                    value={shortCode}
                    onChange={(e) => {
                      setShortCode(normalizeShortCode(e.target.value));
                      setShortCodeManuallyEdited(true);
                    }}
                    placeholder="sbk-ryad"
                    maxLength={20}
                    className="border-0 rounded-none bg-transparent font-mono text-sm focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    title="توليد تلقائي"
                    onClick={() => {
                      setShortCode(generateShortCode(serviceName, serviceArea));
                      setShortCodeManuallyEdited(false);
                    }}
                    className="px-3 py-2 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border-r border-border"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                {shortCode && (
                  <p className="text-xs text-primary font-mono" dir="ltr">
                    الرابط القصير: {window?.location?.origin}/l/{shortCode}
                  </p>
                )}
              </div>
            )}

            {/* Google Ads Sitelinks Guide — landing pages only */}
            {pageType === 'landing' && slug && (
              <div className="space-y-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-600 text-sm">
                  <Rocket className="h-4 w-4" />
                  <span>روابط أقسام إعلانات جوجل (Google Ads Sitelinks)</span>
                </div>
                <p className="text-muted-foreground">
                  يمكنك استخدام هذه الروابط في حملات إعلانات جوجل كروابط أقسام (Sitelinks) للتوجيه المباشر لجميع مكونات صفحة الهبوط:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs" dir="ltr">
                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between">
                    <span className="truncate text-foreground font-bold">/p/{slug}#details</span>
                    <span className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">التفاصيل</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between">
                    <span className="truncate text-foreground font-bold">/p/{slug}#features</span>
                    <span className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">المميزات</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between">
                    <span className="truncate text-foreground font-bold">/p/{slug}#gallery</span>
                    <span className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">المعرض</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between">
                    <span className="truncate text-foreground font-bold">/p/{slug}#testimonials</span>
                    <span className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">الآراء</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between">
                    <span className="truncate text-foreground font-bold">/p/{slug}#faqs</span>
                    <span className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">الأسئلة</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between">
                    <span className="truncate text-foreground font-bold">/p/{slug}#contact</span>
                    <span className="text-2xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">التواصل</span>
                  </div>
                </div>
              </div>
            )}

            {slug === 'redirect' && (
              <div className="space-y-2 max-w-sm border border-border/60 bg-muted/20 p-4 rounded-xl">
                <Label htmlFor="page-countdown" className="text-foreground font-medium flex justify-between items-center mb-1">
                  <span>مدة العد التنازلي للتحويل (بالثواني)</span>
                  <span className="font-mono text-primary text-base font-bold">{countdown} ثانية</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 text-xl font-bold flex items-center justify-center"
                    onClick={() => setCountdown(prev => Math.max(1, prev - 1))}
                  >
                    -
                  </Button>
                  <Input 
                    id="page-countdown"
                    type="number"
                    min={1}
                    max={120}
                    value={countdown}
                    onChange={(e) => setCountdown(Math.max(1, parseInt(e.target.value) || 20))}
                    className="bg-background border-border text-center font-mono text-lg font-bold w-24"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 text-xl font-bold flex items-center justify-center"
                    onClick={() => setCountdown(prev => Math.min(120, prev + 1))}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  هذا الوقت يحدد عدد الثواني التي ينتظرها الزائر قبل تمكينه من الانتقال للرابط الخارجي.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 py-2">
              <Checkbox 
                id="page-published" 
                checked={isPublished} 
                onCheckedChange={(checked) => setIsPublished(!!checked)}
              />
              <Label htmlFor="page-published" className="text-foreground cursor-pointer font-medium select-none">نشر الصفحة للعامة فور الحفظ</Label>
            </div>

            {pageType !== 'adpage' && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">محتوى الصفحة <span className="text-destructive">*</span></Label>
                <RichTextEditor 
                  value={content} 
                  onChange={setContent} 
                  placeholder="اكتب المحتوى المنسق لصفحتك هنا..." 
                  stickyTopOffset="top-[144px]"
                />
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setView('list')} disabled={actionLoading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-primary text-primary-foreground flex items-center gap-2">
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    حفظ الصفحة
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
