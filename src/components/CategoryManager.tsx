'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2,
  Save,
  Shapes,
  Plus,
  Trash2,
  Search,
  Pencil,
  Layers,
  Smartphone,
  Sofa,
  Car,
  Building,
  Shirt,
  ShoppingBag,
  Briefcase,
  Handshake,
  Heart,
  Home,
  PawPrint,
  Paintbrush,
  Tablet,
  Tv,
  Laptop,
  CarFront,
  Truck,
  Bus,
  PackageSearch,
  Music,
  Camera,
  Gamepad2,
  FolderPlus,
  GripVertical,
  Sparkles,
  Building2,
  Dog,
  Baby,
  Dumbbell,
  Factory,
  Wrench,
  Sliders,
  Monitor,
  Headphones,
  Radio,
  Speaker,
  Mic,
  Plug,
  BatteryCharging,
  Printer,
  Server,
  HardDrive,
  Router,
  CircuitBoard,
  Projector,
  Fan,
  Zap,
  Cpu,
  Watch,
  Bike,
  Utensils,
  GraduationCap,
  Stethoscope,
  Plane,
  KeyRound,
} from 'lucide-react';
import type { Category, SubCategory } from '@/lib/types';
import { getCategoryIcon } from '@/lib/data';

// ─── DnD Kit ───────────────────────────────────────────────────────────────
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Icon Palette ───────────────────────────────────────────────────────────
const AVAILABLE_ICONS = [
  { name: 'CarFront', label: 'عربيات', icon: CarFront },
  { name: 'Building2', label: 'عقارات', icon: Building2 },
  { name: 'Smartphone', label: 'جوالات', icon: Smartphone },
  { name: 'Briefcase', label: 'وظائف', icon: Briefcase },
  { name: 'Sofa', label: 'أثاث', icon: Sofa },
  { name: 'Tv', label: 'تلفزيونات', icon: Tv },
  { name: 'Monitor', label: 'شاشات', icon: Monitor },
  { name: 'Laptop', label: 'لابتوبات', icon: Laptop },
  { name: 'Tablet', label: 'تابلت', icon: Tablet },
  { name: 'Headphones', label: 'سماعات', icon: Headphones },
  { name: 'Speaker', label: 'مكبر صوت', icon: Speaker },
  { name: 'Radio', label: 'راديو', icon: Radio },
  { name: 'Mic', label: 'ميكروفون', icon: Mic },
  { name: 'Camera', label: 'كاميرات', icon: Camera },
  { name: 'Gamepad2', label: 'ألعاب', icon: Gamepad2 },
  { name: 'Printer', label: 'طابعات', icon: Printer },
  { name: 'Cpu', label: 'معالجات', icon: Cpu },
  { name: 'HardDrive', label: 'هارد ديسك', icon: HardDrive },
  { name: 'Router', label: 'راوتر', icon: Router },
  { name: 'Server', label: 'سيرفرات', icon: Server },
  { name: 'BatteryCharging', label: 'شواحن', icon: BatteryCharging },
  { name: 'Plug', label: 'وصلات', icon: Plug },
  { name: 'CircuitBoard', label: 'لوحات إلكترونية', icon: CircuitBoard },
  { name: 'Projector', label: 'بروجكتور', icon: Projector },
  { name: 'Fan', label: 'تبريد ومراوح', icon: Fan },
  { name: 'Zap', label: 'كهرباء', icon: Zap },
  { name: 'Watch', label: 'ساعات', icon: Watch },
  { name: 'Sparkles', label: 'موضة', icon: Sparkles },
  { name: 'Dog', label: 'حيوانات', icon: Dog },
  { name: 'Baby', label: 'أطفال', icon: Baby },
  { name: 'Dumbbell', label: 'هوايات', icon: Dumbbell },
  { name: 'Factory', label: 'تجارة', icon: Factory },
  { name: 'Wrench', label: 'خدمات', icon: Wrench },
  { name: 'Car', label: 'سيارات', icon: Car },
  { name: 'Building', label: 'مباني', icon: Building },
  { name: 'Shirt', label: 'ملابس', icon: Shirt },
  { name: 'ShoppingBag', label: 'تسوق', icon: ShoppingBag },
  { name: 'Handshake', label: 'خدمات2', icon: Handshake },
  { name: 'Heart', label: 'صحة', icon: Heart },
  { name: 'Home', label: 'منازل', icon: Home },
  { name: 'PawPrint', label: 'حيوانات2', icon: PawPrint },
  { name: 'Paintbrush', label: 'تشطيب', icon: Paintbrush },
  { name: 'Truck', label: 'شاحنات', icon: Truck },
  { name: 'Bus', label: 'حافلات', icon: Bus },
  { name: 'Music', label: 'صوتيات', icon: Music },
  { name: 'PackageSearch', label: 'بضائع', icon: PackageSearch },
  { name: 'Bike', label: 'دراجات', icon: Bike },
  { name: 'Utensils', label: 'مطاعم', icon: Utensils },
  { name: 'GraduationCap', label: 'تعليم', icon: GraduationCap },
  { name: 'Stethoscope', label: 'طب', icon: Stethoscope },
  { name: 'Plane', label: 'سياحة', icon: Plane },
  { name: 'KeyRound', label: 'مفاتيح', icon: KeyRound },
  { name: 'Shapes', label: 'افتراضي', icon: Shapes },
];

// ─── Sortable Category Card ─────────────────────────────────────────────────
interface SortableCategoryCardProps {
  cat: Category;
  isDragging?: boolean;
  inlineInput: string;
  onInlineInputChange: (catId: string, val: string) => void;
  onInlineAddSubcategory: (catId: string) => void;
  onInlineRemoveSubcategory: (catId: string, subId: string) => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (catId: string) => void;
}

function SortableCategoryCard({
  cat,
  isDragging = false,
  inlineInput,
  onInlineInputChange,
  onInlineAddSubcategory,
  onInlineRemoveSubcategory,
  onEditCategory,
  onDeleteCategory,
}: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: cat.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
    zIndex: isSortableDragging ? 50 : undefined,
  };

  const IconComponent = getCategoryIcon(cat.icon);

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={`group flex flex-col justify-between transition-all duration-200 shadow-sm ${
          isDragging
            ? 'border-primary shadow-2xl ring-2 ring-primary/30 scale-[1.02]'
            : 'hover:border-primary/50'
        }`}
      >
        <div>
          {/* Card Header */}
          <CardHeader className="pb-3 border-b bg-secondary/20 rounded-t-xl">
            <div className="flex items-center justify-between gap-2">
              {/* Drag Handle */}
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0 touch-none"
                title="اسحب لإعادة الترتيب"
                aria-label="سحب لإعادة الترتيب"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              {/* Icon + Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-bold font-headline truncate">{cat.name.ar}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {cat.subcategories?.length || 0} فئة فرعية
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => onEditCategory(cat)}
                  title="تعديل الفئة"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteCategory(cat.id)}
                  title="حذف الفئة"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Subcategories */}
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1.5 min-h-[52px]">
              {cat.subcategories && cat.subcategories.length > 0 ? (
                cat.subcategories.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-foreground border border-border/50 hover:bg-secondary/70 transition-colors"
                  >
                    <span>{sub.name.ar}</span>
                    <button
                      onClick={() => onInlineRemoveSubcategory(cat.id, sub.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                      title="حذف الفئة الفرعية"
                    >
                      &times;
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">لا توجد فئات فرعية بعد.</p>
              )}
            </div>
          </CardContent>
        </div>

        {/* Inline Quick-Add Subcategory */}
        <div className="p-3 border-t bg-secondary/10 rounded-b-xl flex items-center gap-2">
          <Input
            placeholder="إضافة فئة فرعية سريعة..."
            value={inlineInput}
            onChange={(e) => onInlineInputChange(cat.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onInlineAddSubcategory(cat.id);
              }
            }}
            className="text-xs h-8 bg-background border-border"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold px-3 flex-shrink-0"
            onClick={() => onInlineAddSubcategory(cat.id)}
          >
            <Plus className="h-3.5 w-3.5 ml-1 text-primary" />
            إضافة
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Main CategoryManager ────────────────────────────────────────────────────
export default function CategoryManager() {
  const { saveCategories, getCategories } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [subcatLimit, setSubcatLimit] = useState<number>(4);

  // Dialog state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formCatId, setFormCatId] = useState('');
  const [formCatNameAr, setFormCatNameAr] = useState('');
  const [formCatIcon, setFormCatIcon] = useState('Shapes');
  const [formSubcategories, setFormSubcategories] = useState<SubCategory[]>([]);

  // Inline subcategory input per card
  const [inlineSubcatInputs, setInlineSubcatInputs] = useState<Record<string, string>>({});

  // DnD sensors — require 8px move to distinguish from a click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Load limit from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('subcategories_display_limit');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) setSubcatLimit(parsed);
    }
  }, []);

  const handleSubcatLimitChange = (val: number) => {
    setSubcatLimit(val);
    localStorage.setItem('subcategories_display_limit', val.toString());
    window.dispatchEvent(new Event('subcat_limit_updated'));
    toast({
      title: 'تم تحديد عدد الفئات الفرعية',
      description: `سيتم عرض ${val} فئات فرعية تحت كل فئة رئيسية لضمان توازن القوائم الأربعة.`,
    });
  };

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => { fetchCategoriesData(); }, []);

  const fetchCategoriesData = async () => {
    setIsFetching(true);
    try {
      const data = await getCategories();
      const sanitized = (data || []).map((cat) => ({
        ...cat,
        icon: cat.icon || 'Shapes',
        subcategories: (cat.subcategories || []).map((sub) => ({
          ...sub,
          icon: sub.icon || 'Shapes',
          parentId: sub.parentId || cat.id,
        })),
      }));
      setCategories(sanitized);
    } catch {
      setCategories([]);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء تحميل الفئات.', variant: 'destructive' });
    } finally {
      setIsFetching(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.ar.toLowerCase().includes(q) ||
        c.subcategories?.some((s) => s.name.ar.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const totalSubcategories = useMemo(
    () => categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0),
    [categories]
  );

  const sortedIds = useMemo(() => filteredCategories.map((c) => c.id), [filteredCategories]);

  const activeCat = useMemo(
    () => categories.find((c) => c.id === activeDragId) ?? null,
    [categories, activeDragId]
  );

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    setCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });

    toast({
      title: 'تم إعادة الترتيب',
      description: 'لا تنسَ النقر على "حفظ التغييرات" لحفظ الترتيب الجديد.',
    });
  }, [toast]);

  // ── Dialog helpers ────────────────────────────────────────────────────────
  const openCreateDialog = () => {
    setDialogMode('create');
    setFormCatId(`cat_${Date.now()}`);
    setFormCatNameAr('');
    setFormCatIcon('Shapes');
    setFormSubcategories([]);
    setIsCategoryDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setDialogMode('edit');
    setFormCatId(cat.id);
    setFormCatNameAr(cat.name.ar || '');
    setFormCatIcon(cat.icon || 'Shapes');
    setFormSubcategories(cat.subcategories || []);
    setIsCategoryDialogOpen(true);
  };

  const handleSaveDialogCategory = () => {
    if (!formCatNameAr.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى كتابة اسم الفئة الرئيسية.', variant: 'destructive' });
      return;
    }
    const updated: Category = {
      id: formCatId,
      name: { ar: formCatNameAr.trim() },
      icon: formCatIcon,
      subcategories: formSubcategories.map((s) => ({
        ...s,
        name: { ar: s.name.ar.trim() },
        parentId: formCatId,
      })),
    };
    if (dialogMode === 'create') {
      setCategories((prev) => [...prev, updated]);
    } else {
      setCategories((prev) => prev.map((c) => (c.id === formCatId ? updated : c)));
    }
    setIsCategoryDialogOpen(false);
    toast({ title: 'تم التحديث المبدئي', description: 'انقر على "حفظ التغييرات" لتأكيد الحفظ.' });
  };

  // ── Category card actions ─────────────────────────────────────────────────
  const handleDeleteCategory = useCallback((catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    toast({ title: 'تم حذف الفئة', description: 'انقر على "حفظ التغييرات" لتأكيد الحذف.' });
  }, [toast]);

  const handleInlineInputChange = useCallback((catId: string, val: string) => {
    setInlineSubcatInputs((prev) => ({ ...prev, [catId]: val }));
  }, []);

  const handleInlineAddSubcategory = useCallback((catId: string) => {
    const text = (inlineSubcatInputs[catId] || '').trim();
    if (!text) return;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          subcategories: [
            ...(c.subcategories || []),
            { id: `subcat_${Date.now()}`, name: { ar: text }, icon: 'Shapes', parentId: catId },
          ],
        };
      })
    );
    setInlineSubcatInputs((prev) => ({ ...prev, [catId]: '' }));
    toast({ title: 'تمت إضافة الفئة الفرعية', description: `"${text}" تمت إضافتها بنجاح.` });
  }, [inlineSubcatInputs, toast]);

  const handleInlineRemoveSubcategory = useCallback((catId: string, subId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId ? c : { ...c, subcategories: (c.subcategories || []).filter((s) => s.id !== subId) }
      )
    );
  }, []);

  const handleAddModalSubcategory = () => {
    setFormSubcategories((prev) => [
      ...prev,
      { id: `subcat_${Date.now()}`, name: { ar: '' }, icon: 'Shapes', parentId: formCatId },
    ]);
  };

  const handleRemoveModalSubcategory = (subId: string) => {
    setFormSubcategories((prev) => prev.filter((s) => s.id !== subId));
  };

  // ── Global save ───────────────────────────────────────────────────────────
  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      await saveCategories(categories);
      toast({ title: 'تم الحفظ بنجاح!', description: 'تم تحديث جميع الفئات والترتيب في قاعدة البيانات.' });
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحفظ.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-semibold">جارٍ تحميل نظام الفئات...</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Sticky Toolbar ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Title + Badges */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Shapes className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-headline text-foreground">
                إدارة الفئات
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs font-normal">
                  <Shapes className="h-3 w-3 ml-1 text-primary" />
                  {categories.length} فئة رئيسية
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  <Layers className="h-3 w-3 ml-1 text-primary" />
                  {totalSubcategories} فئة فرعية
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={openCreateDialog}
              className="font-bold flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة فئة جديدة</span>
            </Button>
            <Button
              onClick={handleGlobalSave}
              disabled={isSaving}
              className="font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>جارٍ الحفظ...</span></>
              ) : (
                <><Save className="h-4 w-4" /><span>حفظ التغييرات</span></>
              )}
            </Button>
          </div>
        </div>

        {/* Search & Subcategories Control */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن فئة رئيسية أو فرعية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 bg-secondary/40 border-border"
            />
          </div>

          {/* Subcategories Display Limit Box */}
          <div className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-xl border border-border flex-wrap justify-between md:justify-start">
            <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-foreground">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>الفئات الفرعية المعروضة:</span>
            </div>
            <div className="flex items-center gap-1">
              {[3, 4, 5, 6, 8].map((num) => (
                <Button
                  key={num}
                  type="button"
                  size="sm"
                  variant={subcatLimit === num ? 'default' : 'ghost'}
                  onClick={() => handleSubcatLimitChange(num)}
                  className={`h-7 px-2.5 text-xs font-bold ${
                    subcatLimit === num
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'hover:bg-background'
                  }`}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DnD Grid ── */}
      {filteredCategories.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <PackageSearch className="h-12 w-12 mx-auto mb-3 opacity-40 text-primary" />
          <p className="text-base font-semibold">لم يتم العثور على فئات مطابقة للبحث.</p>
          <Button onClick={() => setSearchQuery('')} variant="link" className="mt-2 text-primary">
            تفريغ البحث
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((cat) => (
                <SortableCategoryCard
                  key={cat.id}
                  cat={cat}
                  inlineInput={inlineSubcatInputs[cat.id] || ''}
                  onInlineInputChange={handleInlineInputChange}
                  onInlineAddSubcategory={handleInlineAddSubcategory}
                  onInlineRemoveSubcategory={handleInlineRemoveSubcategory}
                  onEditCategory={openEditDialog}
                  onDeleteCategory={handleDeleteCategory}
                />
              ))}
            </div>
          </SortableContext>

          {/* Floating drag overlay */}
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.4' } },
              }),
            }}
          >
            {activeCat ? (
              <SortableCategoryCard
                cat={activeCat}
                isDragging
                inlineInput=""
                onInlineInputChange={() => {}}
                onInlineAddSubcategory={() => {}}
                onInlineRemoveSubcategory={() => {}}
                onEditCategory={() => {}}
                onDeleteCategory={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── Category Create / Edit Dialog ── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
              <Shapes className="h-5 w-5 text-primary" />
              <span>{dialogMode === 'create' ? 'إضافة فئة رئيسية جديدة' : 'تعديل الفئة الرئيسية'}</span>
            </DialogTitle>
            <DialogDescription>
              اضبط اسم الفئة وأيقونتها وفئاتها الفرعية، ثم احفظ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">اسم الفئة الرئيسية</label>
              <Input
                placeholder="مثال: عقارات، سيارات، هواتف..."
                value={formCatNameAr}
                onChange={(e) => setFormCatNameAr(e.target.value)}
              />
            </div>

            {/* Icon Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">الأيقونة البصرية</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-secondary/20">
                {AVAILABLE_ICONS.map((item) => {
                  const ItemIcon = item.icon;
                  const selected = formCatIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setFormCatIcon(item.name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <ItemIcon className="h-5 w-5 mb-1" />
                      <span className="text-[10px] truncate w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subcategories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">الفئات الفرعية</label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleAddModalSubcategory}
                  className="text-xs text-primary font-semibold"
                >
                  <FolderPlus className="h-3.5 w-3.5 ml-1" />
                  إضافة فرعية
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-secondary/10">
                {formSubcategories.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">لم يتم إضافة فئات فرعية بعد.</p>
                ) : (
                  formSubcategories.map((sub, idx) => (
                    <div key={sub.id} className="flex items-center gap-2 bg-background p-2 rounded-md border border-border">
                      <Input
                        placeholder={`اسم الفئة الفرعية #${idx + 1}`}
                        value={sub.name.ar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSubcategories((prev) =>
                            prev.map((s) => (s.id === sub.id ? { ...s, name: { ar: val } } : s))
                          );
                        }}
                        className="text-xs h-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive flex-shrink-0"
                        onClick={() => handleRemoveModalSubcategory(sub.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveDialogCategory} className="bg-primary text-primary-foreground font-bold">
              حفظ الفئة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
