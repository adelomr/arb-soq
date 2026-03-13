
'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Shapes, Plus, Trash2, ChevronDown, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as lucideIcons from 'lucide-react';
import type { Category } from '@/lib/types';
import { getCategoryIcon } from '@/lib/data';
import { ScrollArea } from './ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const iconNames = Object.keys(lucideIcons).filter(key => 
    key[0] === key[0].toUpperCase() && 
    !['createLucideIcon', 'icons', 'LucideIcon', 'Icon'].includes(key) &&
    typeof (lucideIcons as any)[key] === 'object'
);


const translations = {
  ar: {
    title: 'إدارة الفئات',
    description: 'إضافة، تعديل، وحذف فئات الإعلانات والفئات الفرعية.',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    success: 'تم الحفظ بنجاح!',
    successDesc: 'تم تحديث الفئات.',
    error: 'خطأ',
    errorDesc: 'فشل حفظ التغييرات.',
    loading: 'جارٍ تحميل الفئات...',
    categoryNameAr: 'اسم الفئة',
    icon: 'الأيقونة',
    selectIcon: 'اختر أيقونة',
    addSubcategory: 'إضافة فئة فرعية',
    addCategory: 'إضافة فئة رئيسية',
    removeCategory: 'حذف الفئة',
    removeSubcategory: 'حذف الفئة الفرعية',
    subcategories: 'الفئات الفرعية',
    newCategory: 'فئة جديدة',
    newSubcategory: 'فئة فرعية جديدة',
    changeIcon: "تغيير الأيقونة",
    searchIcon: "ابحث عن أيقونة..."
  },
};

const subCategorySchema = z.object({
    id: z.string(),
    name: z.object({
        ar: z.string().min(1),
    }),
    icon: z.string().min(1),
    parentId: z.string(),
});

const categorySchema = z.object({
    id: z.string(),
    name: z.object({
        ar: z.string().min(1),
    }),
    icon: z.string().min(1),
    subcategories: z.array(subCategorySchema).optional(),
});

const categoriesSchema = z.object({
  categories: z.array(categorySchema),
});

type CategoriesFormValues = z.infer<typeof categoriesSchema>;


const IconPicker = ({ value, onChange }: { value: string, onChange: (iconName: string) => void }) => {
    const t = translations.ar;
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredIcons = iconNames.filter(name => name.toLowerCase().includes(search.toLowerCase()));
    const CurrentIcon = getCategoryIcon(value);

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
                                    const IconComponent = getCategoryIcon(iconName);
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

export default function CategoryManager() {
  const { saveCategories, getCategories, loading: authLoading } = useAuth();
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
        const cats = await getCategories();
        form.reset({ categories: cats });
        setIsFetching(false);
    }
    fetchCategories();
  }, [form, getCategories]);


  const onSubmit = async (data: CategoriesFormValues) => {
    setIsLoading(true);
    try {
      await saveCategories(data.categories);
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

  const addCategory = () => {
    const newId = `cat_${Date.now()}`;
    append({
      id: newId,
      name: { ar: '' },
      icon: 'Shapes',
      subcategories: []
    });
    setOpenCollapsibles(prev => ({ ...prev, [newId]: true }));
  };
  
  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({ ...prev, [id]: !prev[id] }));
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
          <Shapes className="h-6 w-6 md:h-8 md:w-8" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                {fields.map((field, index) => (
                    <Collapsible key={field.id} open={openCollapsibles[field.id] || false} onOpenChange={() => toggleCollapsible(field.id)} className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer flex-1">
                                    <h3 className="text-xl font-semibold">{form.watch(`categories.${index}.name.ar`) || t.newCategory}</h3>
                                    <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                                </div>
                            </CollapsibleTrigger>
                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 md:mr-2"/>
                                <span className="hidden md:inline">{t.removeCategory}</span>
                            </Button>
                        </div>
                        <CollapsibleContent className="space-y-4 pt-4">
                            <FormField control={form.control} name={`categories.${index}.name.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.categoryNameAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField
                                control={form.control}
                                name={`categories.${index}.icon`}
                                render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
                            />
                            <SubcategoryManager parentIndex={index} form={form} />
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={addCategory}>
                <Plus className="h-4 w-4 mr-2"/>
                {t.addCategory}
            </Button>

            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.saving}</> ) : ( <><Save className="mr-2 h-4 w-4" />{t.save}</> )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


function SubcategoryManager({ parentIndex, form }: { parentIndex: number, form: any }) {
    const { fields, remove, append } = useFieldArray({
      control: form.control,
      name: `categories.${parentIndex}.subcategories`
    });
    const t = translations.ar;

    const addSubcategory = () => {
        const categoryId = form.getValues(`categories.${parentIndex}.id`);
        append({
            id: `subcat_${Date.now()}`,
            name: { ar: '' },
            icon: 'Shapes',
            parentId: categoryId,
        });
    }

    return (
        <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4">
            <h4 className="font-semibold">{t.subcategories}</h4>
            {fields.map((field, index) => (
                <div key={field.id} className="p-3 bg-secondary/50 rounded-lg space-y-3 relative">
                     <div className="flex items-center justify-between">
                        <h5 className="font-medium">{form.watch(`categories.${parentIndex}.subcategories.${index}.name.ar`) || t.newSubcategory}</h5>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                    <FormField control={form.control} name={`categories.${parentIndex}.subcategories.${index}.name.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.categoryNameAr}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                    <FormField
                        control={form.control}
                        name={`categories.${parentIndex}.subcategories.${index}.icon`}
                        render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
                    />
                </div>
            ))}
            <Button type="button" variant="secondary" onClick={addSubcategory}>
                <Plus className="h-4 w-4 mr-2"/>
                {t.addSubcategory}
            </Button>
        </div>
    )
}
