"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllPlacements, 
  savePlacement, 
  createPlacement, 
  deletePlacement, 
  resetPlacementStats 
} from "@/lib/ad-placement-service";
import { AdPlacement, AdType } from "@/lib/ad-placement-types";
import { uploadFileAndReturnInfo } from "@/lib/firebase-storage-helpers";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Megaphone, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Upload, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles,
  LayoutGrid,
  Calendar,
  Globe
} from "lucide-react";
import Image from "next/image";

export default function AdPlacementManager() {
  const { adSenseSettings, saveAdSenseSettings } = useAuth();
  const { toast } = useToast();

  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Global AdSense switch
  const [globalAdsEnabled, setGlobalAdsEnabled] = useState(true);
  const [autoAdsEnabled, setAutoAdsEnabled] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  // New placement dialog
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newSlotTitle, setNewSlotTitle] = useState("");
  const [newSlotKey, setNewSlotKey] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Reset stats confirmation dialog
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);

  // Delete custom placement dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load data
  const fetchPlacements = async () => {
    setLoading(true);
    try {
      const data = await getAllPlacements();
      setPlacements(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ في التحميل",
        description: "تعذر جلب بيانات المساحات الإعلانية.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  useEffect(() => {
    if (adSenseSettings) {
      setGlobalAdsEnabled(adSenseSettings.adsEnabled);
      setAutoAdsEnabled(adSenseSettings.autoAdsEnabled);
    }
  }, [adSenseSettings]);

  // Handle global save
  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await saveAdSenseSettings({
        adsEnabled: globalAdsEnabled,
        autoAdsEnabled: autoAdsEnabled,
      });
      toast({
        title: "تم حفظ الإعدادات العامة",
        description: "تم تحديث الحالة العامة للإعلانات بنجاح.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات العامة.",
        variant: "destructive",
      });
    } finally {
      setSavingGlobal(false);
    }
  };

  // Local placement state updater
  const updateLocalPlacement = (id: string, updates: Partial<AdPlacement>) => {
    setPlacements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Save single placement
  const handleSavePlacement = async (placement: AdPlacement) => {
    setSavingId(placement.id);
    try {
      await savePlacement(placement);
      toast({
        title: "تم حفظ المساحة الإعلانية",
        description: `تم تحديث إعدادات (${placement.slot_title}) بنجاح.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات المساحة.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  // Upload image
  const handleImageUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const { url } = await uploadFileAndReturnInfo(file, 'ad-banners');
      updateLocalPlacement(id, { banner_image_url: url });
      toast({
        title: "تم رفع البنر بنجاح",
        description: "تم تحويل وضغط الصورة بصيغة WebP وحفظها.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "فشل رفع الصورة",
        description: "تعذر رفع ملف الصورة، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  // Create new placement
  const handleCreateNewPlacement = async () => {
    if (!newSlotTitle.trim() || !newSlotKey.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى كتابة اسم المساحة والمفتاح البرمجي.",
        variant: "destructive",
      });
      return;
    }

    const cleanKey = newSlotKey.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      const created = await createPlacement({
        slot_key: cleanKey,
        slot_title: newSlotTitle.trim(),
        description: newDescription.trim() || "مساحة إعلانية مخصصة",
        ad_type: "adsense",
        open_in_new_tab: true,
        is_active: true,
      });

      setPlacements((prev) => [...prev, created]);
      setIsNewDialogOpen(false);
      setNewSlotTitle("");
      setNewSlotKey("");
      setNewDescription("");

      toast({
        title: "تم إنشاء المساحة",
        description: "أصبحت المساحة الإعلانية الجديدة جاهزة للاستخدام.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "فشل إنشاء المساحة",
        description: "حدث خطأ أثناء إضافة المساحة الجديدة.",
        variant: "destructive",
      });
    }
  };

  // Reset stats
  const handleResetStats = async () => {
    if (!resetConfirmId) return;
    try {
      await resetPlacementStats(resetConfirmId);
      updateLocalPlacement(resetConfirmId, { impressions_count: 0, clicks_count: 0 });
      toast({
        title: "تم تصفير الإحصائيات",
        description: "تمت إعادة تعيين عداد الظهور والنقرات إلى الصفر بنجاح.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل تصفير الإحصائيات.",
        variant: "destructive",
      });
    } finally {
      setResetConfirmId(null);
    }
  };

  // Delete custom placement
  const handleDeletePlacement = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePlacement(deleteConfirmId);
      setPlacements((prev) => prev.filter((p) => p.id !== deleteConfirmId));
      toast({
        title: "تم حذف المساحة",
        description: "تم إزالة المساحة الإعلانية نهائياً.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل حذف المساحة.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-base">جارٍ تحميل نظام إدارة المساحات الإعلانية...</p>
      </div>
    );
  }

  // Calculate total overview stats
  const totalImpressions = placements.reduce((acc, p) => acc + (p.impressions_count || 0), 0);
  const totalClicks = placements.reduce((acc, p) => acc + (p.clicks_count || 0), 0);
  const overallCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-8" dir="rtl">
      {/* 1. Global Settings & Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-primary" />
                  إدارة المساحات الإعلانية والحملات
                </CardTitle>
                <CardDescription className="mt-1">
                  التحكم المباشر في بنرات الموقع وإعلانات Google AdSense وحساب المشاهدات والنقرات.
                </CardDescription>
              </div>
              <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-bold flex items-center gap-1.5 shadow-md">
                    <PlusCircle className="h-4 w-4" />
                    مساحة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة مساحة إعلانية جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="slot-title">اسم المساحة التوضيحي</Label>
                      <Input
                        id="slot-title"
                        placeholder="مثال: بنر صفحة المتاجر الجانبي"
                        value={newSlotTitle}
                        onChange={(e) => setNewSlotTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slot-key">المفتاح البرمجي الفريد (Slot Key)</Label>
                      <Input
                        id="slot-key"
                        placeholder="مثال: store_sidebar_banner"
                        value={newSlotKey}
                        onChange={(e) => setNewSlotKey(e.target.value)}
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        يُستخدم لاستدعاء المساحة في الكود عبر: &lt;AdSlot slotKey="{newSlotKey || 'slot_key'}" /&gt;
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slot-desc">وصف المساحة (اختياري)</Label>
                      <Input
                        id="slot-desc"
                        placeholder="أين تظهر هذه المساحة..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleCreateNewPlacement} className="font-bold">إضافة المساحة</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <Switch
                  id="global-ads"
                  checked={globalAdsEnabled}
                  onCheckedChange={setGlobalAdsEnabled}
                />
                <Label htmlFor="global-ads" className="font-bold cursor-pointer text-sm sm:text-base">
                  تفعيل نظام الإعلانات بالكامل في الموقع
                </Label>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveGlobal}
                disabled={savingGlobal}
                className="font-bold w-full sm:w-auto"
              >
                {savingGlobal && <Loader2 className="h-4 w-4 animate-spin ml-1.5" />}
                حفظ الحالة العامة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Total Stats Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              إجمالي أداء البنرات المباشرة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-blue-500" />
                المشاهدات (Impressions):
              </span>
              <span className="text-base font-bold text-foreground font-mono">
                {totalImpressions.toLocaleString('ar-EG')}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MousePointerClick className="h-3.5 w-3.5 text-purple-500" />
                النقرات (Clicks):
              </span>
              <span className="text-base font-bold text-foreground font-mono">
                {totalClicks.toLocaleString('ar-EG')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                نسبة التفاعل (CTR):
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold font-mono">
                {overallCTR}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Placements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {placements.map((placement) => {
          const isSaving = savingId === placement.id;
          const isUploading = uploadingId === placement.id;
          const ctr = placement.impressions_count > 0 
            ? ((placement.clicks_count / placement.impressions_count) * 100).toFixed(2) 
            : "0.00";

          return (
            <Card 
              key={placement.id} 
              className={`border transition-all duration-200 ${
                placement.is_active 
                  ? 'border-border bg-card shadow-sm hover:border-primary/40' 
                  : 'border-border/50 bg-muted/20 opacity-75'
              }`}
            >
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg font-bold">
                        {placement.slot_title}
                      </CardTitle>
                      <Badge variant="secondary" className="font-mono text-[11px] px-2" dir="ltr">
                        {placement.slot_key}
                      </Badge>
                    </div>
                    {placement.description && (
                      <CardDescription className="text-xs">
                        {placement.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border">
                      <Switch
                        id={`active-${placement.id}`}
                        checked={placement.is_active}
                        onCheckedChange={(checked) => updateLocalPlacement(placement.id, { is_active: checked })}
                      />
                      <Label htmlFor={`active-${placement.id}`} className="text-xs font-bold cursor-pointer">
                        {placement.is_active ? 'مفعلة' : 'معطلة'}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Mode Selector Tabs */}
                <Tabs 
                  value={placement.ad_type} 
                  onValueChange={(val) => updateLocalPlacement(placement.id, { ad_type: val as AdType })}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
                    <TabsTrigger value="adsense" className="font-bold text-xs sm:text-sm">
                      <Globe className="h-3.5 w-3.5 ml-1.5" />
                      Google AdSense
                    </TabsTrigger>
                    <TabsTrigger value="custom_banner" className="font-bold text-xs sm:text-sm">
                      <Sparkles className="h-3.5 w-3.5 ml-1.5 text-amber-500" />
                      بنر مخصص (معلن مباشر)
                    </TabsTrigger>
                  </TabsList>

                  {/* Mode 1: Google AdSense */}
                  <TabsContent value="adsense" className="space-y-3 pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        كود إعلان AdSense أو معرّف الوحدة (Slot ID)
                      </Label>
                      <Textarea
                        placeholder={`الصق كود الوحدة الإعلانية أو رقم الـ Slot ID هنا...\nمثال:\n<ins class="adsbygoogle" data-ad-client="ca-pub-4808414573627321" data-ad-slot="1234567890"></ins>`}
                        value={placement.adsense_code || ''}
                        onChange={(e) => updateLocalPlacement(placement.id, { adsense_code: e.target.value })}
                        className="font-mono text-xs min-h-[90px] resize-y"
                        dir="ltr"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        إذا تُرك الحقل فارغاً، سيتم عرض إعلان متجاوب تلقائي باستخدام رقم الناشر الأساسي.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Mode 2: Custom Banner */}
                  <TabsContent value="custom_banner" className="space-y-4 pt-3">
                    {/* Image Preview & Upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">صورة البنر الإعلاني</Label>
                      
                      {placement.banner_image_url ? (
                        <div className="relative w-full aspect-[4/1] rounded-xl overflow-hidden border border-border group bg-secondary/20">
                          <Image
                            src={placement.banner_image_url}
                            alt={placement.slot_title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg hover:bg-primary/90">
                              <Upload className="h-3.5 w-3.5" />
                              تغيير الصورة
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(placement.id, file);
                                }}
                              />
                            </label>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateLocalPlacement(placement.id, { banner_image_url: '' })}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all text-center">
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                          ) : (
                            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          )}
                          <span className="text-xs font-bold text-foreground">
                            {isUploading ? 'جارٍ رفع وضغط الصورة...' : 'اضغط هنا لرفع صورة البنر'}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            PNG, JPG, WEBP (يتم تحسينها وضغطها تلقائياً)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(placement.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Target URL & Expiry Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">رابط التحويل عند النقر</Label>
                        <Input
                          placeholder="https://example.com"
                          value={placement.banner_target_url || ''}
                          onChange={(e) => updateLocalPlacement(placement.id, { banner_target_url: e.target.value })}
                          dir="ltr"
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          تاريخ انتهاء الإعلان (اختياري)
                        </Label>
                        <Input
                          type="date"
                          value={placement.expiry_date || ''}
                          onChange={(e) => updateLocalPlacement(placement.id, { expiry_date: e.target.value || null })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        id={`new-tab-${placement.id}`}
                        checked={placement.open_in_new_tab}
                        onCheckedChange={(checked) => updateLocalPlacement(placement.id, { open_in_new_tab: checked })}
                      />
                      <Label htmlFor={`new-tab-${placement.id}`} className="text-xs font-medium cursor-pointer">
                        فتح الرابط في نافذة / تبويب جديد
                      </Label>
                    </div>

                    {/* Banner Stats Bar */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono font-bold text-foreground">
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          {placement.impressions_count || 0} ظهور
                        </span>
                        <span className="flex items-center gap-1 font-mono font-bold text-foreground">
                          <MousePointerClick className="h-3.5 w-3.5 text-purple-500" />
                          {placement.clicks_count || 0} نقرة
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                          CTR: {ctr}%
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResetConfirmId(placement.id)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                        title="تصفير الإحصائيات"
                      >
                        <RefreshCw className="h-3 w-3 ml-1" />
                        تصفير
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/40 pt-3">
                <div className="text-[11px] text-muted-foreground">
                  {placement.updated_at ? `آخر تحديث: ${new Date(placement.updated_at).toLocaleDateString('ar-EG')}` : ''}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSavePlacement(placement)}
                    disabled={isSaving}
                    className="font-bold flex items-center gap-1.5 px-4 shadow-sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    حفظ التعديلات
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!resetConfirmId} onOpenChange={() => setResetConfirmId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من تصفير الإحصائيات؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إعادة تعيين عداد المشاهدات والنقرات إلى الصفر لهذه المساحة الإعلانية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetStats}>تأكيد التصفير</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
