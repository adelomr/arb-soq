
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import { Wallet, PlusCircle, ArrowDownCircle } from 'lucide-react';
import PaymentMethods from './PaymentMethods';
import AddFundsDialog from './AddFundsDialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CardType } from './PaymentMethods';


const t = {
    wallet: "المحفظة",
    walletDesc: "إدارة رصيدك وطرق الدفع.",
    currentBalance: "الرصيد الحالي",
    addFunds: "إضافة رصيد",
    withdraw: "سحب الرصيد",
};

export default function WalletDashboard() {
    const { userProfile } = useAuth();
    const { market } = useMarket();
    const { toast } = useToast();

    const [isAddFundsOpen, setAddFundsOpen] = useState(false);
    
    // This will hold the saved card tokens from Paymob in the future
    const [cards, setCards] = useState<CardType[]>([]); 

    const currencyFormatter = new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: market.currency,
        numberingSystem: 'latn' // Force Latin numerals
    });
    
    return (
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-headline flex items-center gap-4">
                        <Wallet className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                        {t.wallet}
                    </CardTitle>
                    <CardDescription>{t.walletDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 bg-secondary/50 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div>
                            <p className="text-sm text-muted-foreground">{t.currentBalance}</p>
                            <p className="text-3xl font-bold">{currencyFormatter.format(userProfile?.walletBalance || 0)}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setAddFundsOpen(true)} size="lg">
                                <PlusCircle className="mr-2 h-5 w-5" />
                                {t.addFunds}
                            </Button>
                            <Button variant="outline" size="lg" disabled>
                                <ArrowDownCircle className="mr-2 h-5 w-5" />
                                {t.withdraw}
                            </Button>
                        </div>
                    </div>
                    
                    <PaymentMethods 
                        cards={cards} 
                        setCards={setCards} 
                    />

                </CardContent>
            </Card>

            <AddFundsDialog isOpen={isAddFundsOpen} onOpenChange={setAddFundsOpen} />
        </div>
    );
}
