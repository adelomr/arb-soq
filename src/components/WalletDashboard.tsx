
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
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { Wallet, PlusCircle, ArrowDownCircle } from 'lucide-react';
import PaymentMethods from './PaymentMethods';
import AddFundsDialog from './AddFundsDialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CardType } from './PaymentMethods';


const t = {
    wallet: "المحفظة ورصيد الإعلانات",
    walletDesc: "إدارة رصيدك، شحن المحفظة، وترقية الباقات.",
    currentBalance: "الرصيد الحالي المتاح",
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

    const { formatConvertedBalance } = useCurrency();
    const isEgypt = (market?.id || 'eg').toLowerCase() === 'eg';
    const baseBalanceEgp = userProfile?.walletBalance || 0;
    const converted = formatConvertedBalance(baseBalanceEgp, market?.id);
    
    return (
        <div className="space-y-8">
            <Card className="shadow-lg rounded-3xl border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl sm:text-3xl font-headline flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <Wallet className="h-7 w-7" />
                        </div>
                        {t.wallet}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t.walletDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 bg-secondary/50 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">{t.currentBalance}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl sm:text-4xl font-black text-foreground font-mono">
                                    {converted.formatted} {converted.symbol}
                                </span>
                                {!isEgypt && (
                                    <span className="text-xs text-muted-foreground font-medium bg-secondary/80 border px-2 py-0.5 rounded-md">
                                        (يعادل {baseBalanceEgp.toLocaleString()} ج.م)
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={() => setAddFundsOpen(true)} size="lg" className="rounded-xl text-xs sm:text-sm font-bold">
                                <PlusCircle className="mr-2 h-5 w-5" />
                                {t.addFunds}
                            </Button>
                            <Button variant="outline" size="lg" disabled className="rounded-xl text-xs sm:text-sm opacity-60">
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
