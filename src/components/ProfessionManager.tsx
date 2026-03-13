

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
import { Loader2, Save, Briefcase, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Switch } from './ui/switch';

const translations = {
  ar: {
    title: 'إدارة المهن',
    description: 'إضافة، تعديل، وحذف المهن المتاحة في سوق العمل.',
    save: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    success: 'تم الحفظ بنجاح!',
    successDesc: 'تم تحديث قائمة المهن.',
    error: 'خطأ',
    errorDesc: 'فشل حفظ التغييرات.',
    loading: 'جارٍ تحميل المهن...',
    professionNameAr: 'اسم المهنة',
    addProfession: 'إضافة مهنة جديدة',
    removeProfession: 'حذف المهنة',
    newProfession: 'مهنة جديدة',
    hasSpecialization: 'تتطلب تخصص',
    hasSpecializationDesc: 'هل هذه المهنة تتطلب حقل تخصص (مثل طبيب)؟',
  },
};

const professionSchema = z.object({
    id: z.string(),
    name: z.object({
        ar: z.string().min(1, "الاسم العربي مطلوب."),
    }),
    hasSpecialization: z.boolean().default(false),
});

const professionsSchema = z.object({
  professions: z.array(professionSchema),
});

type ProfessionsFormValues = z.infer<typeof professionsSchema>;

export default function ProfessionManager() {
  const { saveProfessions, getProfessions } = useAuth();
  const t = translations.ar;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<ProfessionsFormValues>({
    resolver: zodResolver(professionsSchema),
    defaultValues: { professions: [] }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "professions"
  });

  useEffect(() => {
    const fetchProfessions = async () => {
        setIsFetching(true);
        const data = await getProfessions();
        if (data) {
             form.reset({ professions: data });
        }
        setIsFetching(false);
    }
    fetchProfessions();
  }, [form, getProfessions]);


  const onSubmit = async (data: ProfessionsFormValues) => {
    setIsLoading(true);
    try {
      await saveProfessions(data.professions);
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

  const addProfession = () => {
    append({
      id: uuidv4(),
      name: { ar: '' },
      hasSpecialization: false,
    });
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
          <Briefcase className="h-6 w-6 md:h-8 md:w-8" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-secondary/50 rounded-lg space-y-4 relative">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">{form.watch(`professions.${index}.name.ar`) || t.newProfession}</h4>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <FormField control={form.control} name={`professions.${index}.name.ar`} render={({ field }) => ( <FormItem><FormLabel>{t.professionNameAr}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <FormField
                            control={form.control}
                            name={`professions.${index}.hasSpecialization`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>{t.hasSpecialization}</FormLabel>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={addProfession}>
                <Plus className="h-4 w-4 mr-2"/>
                {t.addProfession}
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
