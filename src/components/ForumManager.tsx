'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, MessageSquare, Plus, Trash2, ChevronDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as lucideIcons from 'lucide-react';
import { getCategoryIcon } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const CATEGORIES_COLLECTION = 'forum_categories';

const iconNames = Object.keys(lucideIcons).filter(key => 
    key[0] === key[0].toUpperCase() && 
    !['createLucideIcon', 'icons', 'LucideIcon', 'Icon'].includes(key) &&
    typeof (lucideIcons as any)[key] === 'object'
);

const translations = {
  ar: {
    title: 'إدارة أقسام المنتدى',
    description: 'إضافة وتعديل وحذف أقسام المنتدى الرئيسية والفرعية (يدعم التداخل المتعدد).',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    success: 'تم الحفظ بنجاح!',
    successDesc: 'تم تحديث أقسام المنتدى بنجاح.',
    error: 'خطأ',
    errorDesc: 'فشل حفظ التغييرات.',
    loading: 'جارٍ تحميل الأقسام...',
    categoryNameAr: 'اسم القسم (عربي)',
    categoryDescAr: 'وصف القسم (عربي)',
    icon: 'الأيقونة',
    addMainCategory: 'إضافة قسم رئيسي جديد',
    addSubCategory: 'إضافة قسم فرعي هنا',
    removeCategory: 'حذف القسم',
    newCategory: 'قسم جديد',
    newSubCategory: 'قسم فرعي جديد',
    searchIcon: "ابحث عن أيقونة...",
    order: "الترتيب",
    type: "نوع القسم",
    mainCategory: "قسم رئيسي",
    subCategory: "قسم فرعي (تابع لـ: {name})",
  },
};

const categorySchema = z.object({
    id: z.string(),
    parentId: z.string().optional(),
    name: z.object({
        ar: z.string().min(1),
    }),
    description: z.object({
        ar: z.string().min(1),
    }),
    icon: z.string().min(1),
    order: z.number().min(0),
});

const categoriesSchema = z.object({
  categories: z.array(categorySchema),
});

type CategoriesFormValues = z.infer<typeof categoriesSchema>;

const IconPicker = ({ value, onChange }: { value: string, onChange: (iconName: string) => void }) => {
    const t = translations.ar;
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = iconNames.filter(name => name.toLowerCase().includes(search.toLowerCase())).slice(0, 100);
    const CurrentIcon = (lucideIcons as any)[value] || MessageSquare;

    return (
        <div className="space-y-2">
            <FormLabel>{t.icon}</FormLabel>
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-12 w-12 shrink-0 rounded-md border bg-secondary">
                    <CurrentIcon className="h-6 w-6 text-primary" />
                </div>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>{value}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                        <div className="p-2 border-b">
                             <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder={t.searchIcon} 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    className="pl-8" 
                                />
                            </div>
                        </div>
                        <ScrollArea className="h-72">
                            <div className="grid grid-cols-4 gap-2 p-2">
                                {filteredIcons.map(iconName => {
                                    const IconComponent = (lucideIcons as any)[iconName];
                                    return (
                                        <Button
                                            key={iconName}
                                            variant={value === iconName ? 'secondary' : 'ghost'}
                                            className="h-16 flex-col gap-1.5 text-xs"
                                            onClick={() => {
                                                onChange(iconName);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <IconComponent className="h-6 w-6" />
                                            <span className="truncate w-full">{iconName}</span>
                                        </Button>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

function CategoryTreeItem({ 
    fieldId, 
    index, 
    form, 
    remove, 
    addSubCategory, 
    openCollapsibles, 
    toggleCollapsible,
    allFields,
    level = 0
}: { 
    fieldId: string, 
    index: number, 
    form: any, 
    remove: (i: number) => void, 
    addSubCategory: (pId: string) => void,
    openCollapsibles: Record<string, boolean>,
    toggleCollapsible: (id: string) => void,
    allFields: any[],
    level?: number
}) {
    const t = translations.ar;
    const catName = form.watch(`categories.${index}.name.ar`);
    const isMain = !form.watch(`categories.${index}.parentId`);
    const children = allFields.filter(f => form.watch(`categories.${allFields.indexOf(f)}.parentId`) === fieldId);

    return (
        <div className={cn("space-y-4", level > 0 && "mr-4 md:mr-8 border-r border-slate-200 pr-4")}>
            <Collapsible open={openCollapsibles[fieldId] || false} onOpenChange={() => toggleCollapsible(fieldId)} className={cn(
                "space-y-4 rounded-lg border p-4 transition-all",
                isMain ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/30"
            )}>
                <div className="flex items-center justify-between gap-4">
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer flex-1">
                            <Badge variant={isMain ? "default" : "outline"}>
                                {isMain ? t.mainCategory : t.subCategory.replace('{name}', '')}
                            </Badge>
                            <h3 className={cn("font-bold truncate", isMain ? "text-lg md:text-xl" : "text-base md:text-lg")}>
                                {catName || (isMain ? t.newCategory : t.newSubCategory)}
                            </h3>
                            <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                        </div>
                    </CollapsibleTrigger>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addSubCategory(fieldId)} title={t.addSubCategory}>
                            <Plus className="h-4 w-4 md:mr-2"/>
                            <span className="hidden md:inline">{t.addSubCategory}</span>
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
                <CollapsibleContent className="space-y-4 pt-4 border-t mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name={`categories.${index}.name.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.categoryNameAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name={`categories.${index}.order`} render={({ field }) => ( <FormItem><FormLabel>{t.order}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name={`categories.${index}.description.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.categoryDescAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name={`categories.${index}.icon`} render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />} />
                </CollapsibleContent>
            </Collapsible>

            {/* Render Children Recursively */}
            {children.length > 0 && (
                <div className="space-y-4">
                    {children.map(childField => {
                        const childIndex = allFields.indexOf(childField);
                        return (
                            <CategoryTreeItem 
                                key={childField.id}
                                fieldId={childField.id}
                                index={childIndex}
                                form={form}
                                remove={remove}
                                addSubCategory={addSubCategory}
                                openCollapsibles={openCollapsibles}
                                toggleCollapsible={toggleCollapsible}
                                allFields={allFields}
                                level={level + 1}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    );
}

export default function ForumManager() {
  const t = translations.ar;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});

  const form = useForm<CategoriesFormValues>({
    resolver: zodResolver(categoriesSchema),
    defaultValues: { categories: [] }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories"
  });

  useEffect(() => {
    const fetchCategories = async () => {
        setIsFetching(true);
        try {
            const q = query(collection(firestore, CATEGORIES_COLLECTION), orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            form.reset({ categories: cats });
        } catch (error) {
            console.error("Error fetching forum categories:", error);
        } finally {
            setIsFetching(false);
        }
    }
    fetchCategories();
  }, [form]);

  const onSubmit = async (data: CategoriesFormValues) => {
    setIsLoading(true);
    try {
      const batch = writeBatch(firestore);
      
      data.categories.forEach((cat) => {
          const docRef = doc(firestore, CATEGORIES_COLLECTION, cat.id);
          const { id, ...saveData } = cat;
          batch.set(docRef, {
              ...saveData,
              updatedAt: serverTimestamp(),
          }, { merge: true });
      });

      await batch.commit();
      
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

  const addMainCategory = () => {
    const newId = `fcat_${Date.now()}`;
    append({
      id: newId,
      name: { ar: '' },
      description: { ar: '' },
      icon: 'MessageSquare',
      order: fields.length,
    });
    setOpenCollapsibles(prev => ({ ...prev, [newId]: true }));
  };

  const addSubCategory = (parentId: string) => {
    const newId = `fsub_${Date.now()}`;
    append({
      id: newId,
      parentId,
      name: { ar: '' },
      description: { ar: '' },
      icon: 'ChevronLeft',
      order: fields.length,
    });
    setOpenCollapsibles(prev => ({ ...prev, [newId]: true }));
  }
  
  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const mainCategories = fields.filter(f => !form.watch(`categories.${fields.indexOf(f)}.parentId`));

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
          <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8">
                {mainCategories.map((mainField) => {
                    const mainIndex = fields.indexOf(mainField);
                    return (
                        <CategoryTreeItem 
                            key={mainField.id}
                            fieldId={mainField.id}
                            index={mainIndex}
                            form={form}
                            remove={remove}
                            addSubCategory={addSubCategory}
                            openCollapsibles={openCollapsibles}
                            toggleCollapsible={toggleCollapsible}
                            allFields={fields}
                        />
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={addMainCategory} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2"/>
                    {t.addMainCategory}
                </Button>

                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary">
                {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> ) : ( <><Save className="mr-2 h-4 w-4" />{t.save}</> )}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
