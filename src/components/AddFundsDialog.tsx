
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DollarSign, Loader2, User, Mail, Phone, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { createPaymobPayment } from '@/app/actions';


const translations = {
    ar: {
        title: "إضافة رصيد إلى المحفظة",
        description: "أدخل المبلغ المطلوب وبيانات الفواتير الخاصة بك. سيتم توجيهك إلى صفحة دفع آمنة لإدخال تفاصيل بطاقتك.",
        amount: "مبلغ الشحن",
        firstName: "الاسم الأول",
        lastName: "الاسم الأخير",
        email: "البريد الإلكتروني",
        phoneNumber: "رقم الهاتف",
        payNow: "ادفع الآن",
        processing: "جارٍ التحضير...",
        error: "فشلت العملية",
        errorDesc: "حدث خطأ أثناء تحضير عملية الدفع. يرجى المحاولة مرة أخرى.",
        configError: "بوابة الدفع غير مهيأة. يرجى مراجعة صاحب الموقع.",
        redirecting: "جارٍ التوجيه إلى صفحة الدفع...",
        redirectingDesc: "سيتم الآن فتح صفحة دفع آمنة لإكمال العملية.",
        amountMin: "يجب أن يكون المبلغ أكبر من 0",
        fieldRequired: "هذا الحقل مطلوب",
    },
    en: {
        title: "Add Funds to Wallet",
        description: "Enter the amount and your billing information. You will be redirected to a secure payment page to enter your card details.",
        amount: "Amount to Add",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phoneNumber: "Phone Number",
        payNow: "Pay Now",
        processing: "Processing...",
        error: "Failed",
        errorDesc: "An error occurred while preparing the payment. Please try again.",
        configError: "Payment gateway is not configured. Please contact the site owner.",
        redirecting: "Redirecting to payment...",
        redirectingDesc: "A secure payment page will now open to complete the transaction.",
        amountMin: "Amount must be greater than 0",
        fieldRequired: "This field is required",
    }
};

const getAddFundsSchema = (t: typeof translations.en) => z.object({
  amount: z.coerce.number().min(1, t.amountMin),
  firstName: z.string().min(1, t.fieldRequired),
  lastName: z.string().min(1, t.fieldRequired),
  email: z.string().email(),
  phoneNumber: z.string().min(1, t.fieldRequired),
});

interface AddFundsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function AddFundsDialog({ isOpen, onOpenChange }: AddFundsDialogProps) {
    const { language } = useLanguage();
    const { user, userProfile } = useAuth();
    const t = translations[language];
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const addFundsSchema = getAddFundsSchema(t);
    type AddFundsValues = z.infer<typeof addFundsSchema>;

    const form = useForm<AddFundsValues>({
        resolver: zodResolver(addFundsSchema),
        defaultValues: {
            amount: 100,
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
        },
    });

    useEffect(() => {
        if (userProfile && user) {
            form.reset({
                amount: 100,
                email: user.email || '',
                firstName: userProfile.name?.split(' ')[0] || '',
                lastName: userProfile.name?.split(' ').slice(1).join(' ') || '',
                phoneNumber: userProfile.phoneNumber || '',
            });
        }
    }, [userProfile, user, form]);

    async function onSubmit(data: AddFundsValues) {
        setIsLoading(true);
        try {
            const paymentInput = {
                amount_cents: String(data.amount * 100),
                email: data.email,
                first_name: data.firstName,
                last_name: data.lastName,
                phone_number: data.phoneNumber,
            };
            
            const result = await createPaymobPayment(paymentInput);

            if (result.success && result.url) {
                 toast({
                    title: t.redirecting,
                    description: t.redirectingDesc,
                    action: <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2"><ExternalLink className="h-4 w-4"/> افتح الآن</a>
                });
                window.location.href = result.url;
            } else {
                const errorMessage = result.error === "Payment gateway is not configured correctly." 
                    ? t.configError 
                    : result.error || t.errorDesc;
                throw new Error(errorMessage);
            }

        } catch (error: any) {
            toast({
                title: t.error,
                description: error.message || t.errorDesc,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!isLoading) {
                onOpenChange(open);
            }
        }}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{t.title}</DialogTitle>
                    <DialogDescription>{t.description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t.amount}</FormLabel>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input type="number" placeholder="100" className="pl-8" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t.firstName}</FormLabel>
                                        <FormControl><Input placeholder="..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t.lastName}</FormLabel>
                                        <FormControl><Input placeholder="..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t.email}</FormLabel>
                                     <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl><Input type="email" placeholder="you@example.com" className="pl-8" {...field} /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t.phoneNumber}</FormLabel>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl><Input type="tel" placeholder="+201234567890" className="pl-8" {...field} /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full sm:w-auto">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? t.processing : t.payNow}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
