'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { CreditCard, Plus, MoreVertical, Trash2, Star } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export type CardType = {
    id: string; // This will be the token from Paymob in the future
    brand: string;
    last4: string;
};

const translations = {
    ar: {
        paymentMethods: "طرق الدفع",
        paymentMethodsDesc: "إدارة بطاقات الدفع المحفوظة.",
        addNewCard: "إضافة بطاقة جديدة",
        expires: "تنتهي",
        primary: "الأساسية",
        makePrimary: "تعيين كأساسية",
        delete: "حذف",
        noCards: "لا توجد بطاقات محفوظة.",
        addYourFirst: "أضف بطاقتك الأولى عبر إتمام عملية دفع.",
        cardDeleted: "تم حذف البطاقة بنجاح.",
        primaryChanged: "تم تغيير البطاقة الأساسية."
    },
    en: {
        paymentMethods: "Payment Methods",
        paymentMethodsDesc: "Manage your saved payment cards.",
        addNewCard: "Add New Card",
        expires: "Expires",
        primary: "Primary",
        makePrimary: "Make Primary",
        delete: "Delete",
        noCards: "No saved cards.",
        addYourFirst: "Add your first card by completing a payment.",
        cardDeleted: "Card deleted successfully.",
        primaryChanged: "Primary card changed."
    }
}

const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
        case 'visa':
            return 'https://www.svgrepo.com/show/303204/visa-logo.svg';
        case 'mastercard':
            return 'https://www.svgrepo.com/show/303202/mastercard-logo.svg';
        default:
            return 'https://www.svgrepo.com/show/493741/card-payment.svg'; // Generic card icon
    }
};

interface PaymentMethodsProps {
    cards: CardType[];
    setCards: React.Dispatch<React.SetStateAction<CardType[]>>;
}

export default function PaymentMethods({ cards, setCards }: PaymentMethodsProps) {
    const { language } = useLanguage();
    const t = translations[language];
    const { toast } = useToast();

    // In a real app, these actions would call server actions to update the DB
    const handleDeleteCard = (cardId: string) => {
        setCards(currentCards => currentCards.filter(card => card.id !== cardId));
        toast({
            title: t.cardDeleted,
        });
    };
    
    const handleSetPrimary = (cardId: string) => {
        // This logic will be more complex when dealing with real data
        toast({
            title: t.primaryChanged,
        });
    }

    return (
        <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t.paymentMethods}
                    </CardTitle>
                    <CardDescription>{t.paymentMethodsDesc}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {cards.length > 0 ? cards.map((card, index) => (
                         <div key={card.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0 ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
                            <div className="flex items-center gap-4">
                                <Image src={getCardIcon(card.brand)} alt={card.brand} width={40} height={25} className="h-auto" />
                                <div>
                                    <p className="font-semibold">
                                        •••• {card.last4}
                                        {index === 0 && <span className="text-xs text-primary font-bold ml-2">({t.primary})</span>}
                                    </p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {index !== 0 && (
                                        <DropdownMenuItem onSelect={() => handleSetPrimary(card.id)}>
                                            <Star className="mr-2 h-4 w-4" />
                                            {t.makePrimary}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => handleDeleteCard(card.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t.delete}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                    )) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>{t.noCards}</p>
                            <p className="text-sm">{t.addYourFirst}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
