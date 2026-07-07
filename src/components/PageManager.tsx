'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  getAllPages, 
  createPage, 
  updatePage, 
  deletePage, 
  generatePageSlug,
  normalizeShortCode
} from '@/lib/page-service';
import type { PageData, PageType, LandingTheme, LandingFeature, LandingTestimonial, LandingFaq } from '@/lib/types';
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
  X
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import Image from 'next/image';


const SYSTEM_SLUGS = ['redirect'];
const LANDING_THEMES: { value: LandingTheme; label: string; desc: string; color: string }[] = [
  { value: 'default', label: 'افتراضي', desc: 'بنفسجي عصري', color: 'border-violet-500 bg-violet-500/10 text-violet-600' },
  { value: 'greenery', label: 'زراعي أخضر', desc: 'للمشاتل والحدائق', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600' },
  { value: 'dark-luxury', label: 'فخامة داكنة', desc: 'ذهبي وأسود أنيق', color: 'border-amber-500 bg-amber-500/10 text-amber-600' },
  { value: 'corporate-blue', label: 'أزرق مؤسسي', desc: 'للشركات والأعمال', color: 'border-blue-500 bg-blue-500/10 text-blue-600' },
];


export default function PageManager() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // View states: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  
  // Form states
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [countdown, setCountdown] = useState<number>(20);
  const [pageType, setPageType] = useState<PageType>('system');
  const [shortCode, setShortCode] = useState('');

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


  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    const data = await getAllPages();
    setPages(data);
    setLoading(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (view === 'create') {
      setSlug(generatePageSlug(val));
    }
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
  };

  const handleOpenCreate = () => {
    setSelectedPage(null);
    setTitle('');
    setSlug('');
    setContent('');
    setIsPublished(true);
    setCountdown(20);
    setPageType('system');
    setShortCode('');
    resetLandingFields();
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
    setView('edit');
  };

  // ---- Upload helpers ----
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
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({
        title: 'خطأ في المدخلات',
        description: 'يرجى تعبئة العنوان والرمز الرابط والمحتوى.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      if (view === 'create') {
        // Check if slug already exists
        const slugExists = pages.some(p => p.slug === slug);
        if (slugExists) {
          toast({
            title: 'الرمز الرابط مستخدم',
            description: 'الرمز الرابط (slug) مستخدم بالفعل لصفحة أخرى، يرجى كتابة رمز فريد.',
            variant: 'destructive',
          });
          setActionLoading(false);
          return;
        }

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
        } : {};
        await createPage({
          title,
          slug,
          content,
          isPublished,
          pageType,
          shortCode: pageType === 'landing' && shortCode ? normalizeShortCode(shortCode) : undefined,
          countdown: slug === 'redirect' ? countdown : undefined,
          ...landingExtras,
        });

        toast({
          title: 'تم إنشاء الصفحة',
          description: 'تم إنشاء الصفحة بنجاح ونشرها.',
        });
      } else if (view === 'edit' && selectedPage?.id) {
        // Check if slug is used by other pages
        const slugExists = pages.some(p => p.slug === slug && p.id !== selectedPage.id);
        if (slugExists) {
          toast({
            title: 'الرمز الرابط مستخدم',
            description: 'الرمز الرابط (slug) مستخدم بالفعل لصفحة أخرى، يرجى كتابة رمز فريد.',
            variant: 'destructive',
          });
          setActionLoading(false);
          return;
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
        } : {};
        await updatePage(selectedPage.id, {
          title,
          slug,
          content,
          isPublished,
          pageType,
          shortCode: pageType === 'landing' && shortCode ? normalizeShortCode(shortCode) : undefined,
          countdown: slug === 'redirect' ? countdown : undefined,
          ...landingExtrasUpdate,
        });

        toast({
          title: 'تم تحديث الصفحة',
          description: 'تم حفظ تعديلات الصفحة بنجاح.',
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري تحميل الصفحات...</p>
      </div>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
        <div className="text-right">
          <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold font-headline">
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            إدارة الصفحات
          </CardTitle>
          <CardDescription>إنشاء وتعديل وحذف الصفحات الثابتة والديناميكية للموقع.</CardDescription>
        </div>
        
        {view === 'list' && (
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة صفحة جديدة
          </Button>
        )}

        {view !== 'list' && (
          <Button variant="outline" onClick={() => setView('list')} className="w-full sm:w-auto flex items-center justify-center gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        {view === 'list' ? (
          pages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              <FileLock className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
              <p className="text-lg font-medium">لا توجد صفحات منشأة حالياً</p>
              <p className="text-sm mt-1">اضغط على زر "إضافة صفحة جديدة" للبدء.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-sm">
                    <th className="pb-3 pt-1 font-semibold">عنوان الصفحة</th>
                    <th className="pb-3 pt-1 font-semibold">الرابط</th>
                    <th className="pb-3 pt-1 font-semibold text-center">النوع</th>
                    <th className="pb-3 pt-1 font-semibold text-center">المشاهدات</th>
                    <th className="pb-3 pt-1 font-semibold text-center">الحالة</th>
                    <th className="pb-3 pt-1 font-semibold text-left">العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {pages.map((page) => {
                    const isSystemSlug = SYSTEM_SLUGS.includes(page.slug);
                    const pageUrl = isSystemSlug ? `/${page.slug}` : `/p/${page.slug}`;

                    return (
                      <tr key={page.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 font-medium text-foreground">{page.title}</td>
                        <td className="py-4 text-muted-foreground font-mono text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span dir="ltr">{pageUrl}</span>
                            {page.shortCode && (
                              <span dir="ltr" className="text-primary/70 flex items-center gap-1">
                                <Link2 className="h-3 w-3" />/l/{page.shortCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {page.pageType === 'landing' ? (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/20">
                              <Rocket className="h-3 w-3" />هبوط
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

              <div className="space-y-2">
                {view === 'create' ? (
                  <>
                    <Label className="text-foreground font-medium">الرابط المتوقع للصفحة</Label>
                    <div className="bg-muted p-2.5 rounded-lg border border-border font-mono text-left text-sm text-muted-foreground" dir="ltr">
                      /p/{slug || '...'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">سيتم توليد الرابط تلقائياً بناءً على عنوان الصفحة المدخل.</p>
                  </>
                ) : (
                  <>
                    <Label className="text-foreground font-medium">رابط الصفحة</Label>
                    <div className="bg-muted p-2.5 rounded-lg border border-border font-mono text-left text-sm flex items-center justify-between" dir="ltr">
                      <span className="text-primary select-all font-semibold">
                        {SYSTEM_SLUGS.includes(slug) ? `/${slug}` : `/p/${slug}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1 hover:bg-background"
                        onClick={handleCopyLink}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            نسخ الرابط
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">رابط الصفحة تلقائي ولا يمكن تعديله لتجنب كسر الروابط الخارجية.</p>
                  </>
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

            {/* ========== LANDING PAGE ADVANCED PANEL ========== */}
            {pageType === 'landing' && (
              <div className="space-y-6 p-5 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">أدوات صفحة الهبوط الاحترافية</h3>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => setFeatures(prev => [...prev, { title: '', desc: '', iconName: '' }])} className="flex items-center gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" />إضافة ميزة
                    </Button>
                  </div>
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
                  <span className="text-xs text-muted-foreground font-normal">(اختياري — حروف إنجليزية وأرقام وشرطات فقط، max 20 حرفاً)</span>
                </Label>
                <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden bg-background" dir="ltr">
                  <span className="px-3 py-2 bg-muted text-muted-foreground text-sm font-mono border-l border-border select-none">/l/</span>
                  <Input
                    id="page-shortcode"
                    type="text"
                    value={shortCode}
                    onChange={(e) => setShortCode(normalizeShortCode(e.target.value))}
                    placeholder="sbk-ryad"
                    maxLength={20}
                    className="border-0 rounded-none bg-transparent font-mono text-sm focus-visible:ring-0"
                  />
                </div>
                {shortCode && (
                  <p className="text-xs text-primary font-mono" dir="ltr">
                    الرابط القصير: {window?.location?.origin}/l/{shortCode}
                  </p>
                )}
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

            <div className="space-y-2">
              <Label className="text-foreground font-medium">محتوى الصفحة <span className="text-destructive">*</span></Label>
              <RichTextEditor 
                value={content} 
                onChange={setContent} 
                placeholder="اكتب المحتوى المنسق لصفحتك هنا..." 
              />
            </div>

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
