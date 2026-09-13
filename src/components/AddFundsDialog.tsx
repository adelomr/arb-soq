'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useMarket } from '@/context/MarketContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getMarketCurrency } from '@/lib/currency-service';
import { useToast } from '@/hooks/use-toast';
import { VODAFONE_CASH_NUMBER, submitVodafoneCashPayment } from '@/lib/vodafone-cash-service';
import { uploadFileAndReturnInfo } from '@/lib/firebase-storage-helpers';
import Image from 'next/image';
import {
  Smartphone,
  Copy,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Phone,
  Hash,
  ChevronLeft,
  UploadCloud,
  ImageIcon,
  X,
  ShieldCheck,
  Zap,
  Wallet,
  Sparkles,
  Coins,
  ArrowRightLeft
} from 'lucide-react';

interface AddFundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'amount' | 'instructions' | 'confirm' | 'success';

const EGP_PRESETS = [50, 100, 250, 500, 750, 1000];
const LOCAL_PRESETS = [10, 25, 50, 100, 150, 250];

export default function AddFundsDialog({ isOpen, onOpenChange }: AddFundsDialogProps) {
  const { user, userProfile } = useAuth();
  const { market } = useMarket();
  const { convertEgpTo, convertToEgp } = useCurrency();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const localCurrency = getMarketCurrency(market?.id);
  const isEgypt = (market?.id || 'eg').toLowerCase() === 'eg';

  const [paymentCurrency, setPaymentCurrency] = useState<'EGP' | 'LOCAL'>('EGP');

  const isPayingInEgp = paymentCurrency === 'EGP' || isEgypt;
  const activeCurrencySymbol = isPayingInEgp ? 'ج.م' : localCurrency.symbol;
  const activeCurrencyCode = isPayingInEgp ? 'EGP' : localCurrency.code;
  const presetAmounts = isPayingInEgp ? EGP_PRESETS : LOCAL_PRESETS;

  const [step, setStep] = useState<Step>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [paymentId, setPaymentId] = useState('');

  const [transferPhone, setTransferPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [refError, setRefError] = useState('');

  // صورة إيصال التحويل
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // الحسابات المزدوجة بالجنيه والعملة المحلية
  const rawInputAmount = customAmount ? Number(customAmount) : selectedAmount;
  const effectiveEgp = isPayingInEgp
    ? rawInputAmount
    : convertToEgp(rawInputAmount, activeCurrencyCode);
  const equivalentLocalAmount = isPayingInEgp
    ? convertEgpTo(rawInputAmount, localCurrency.code)
    : rawInputAmount;

  // للتوافق مع المعرفات الحالية
  const effectiveAmount = rawInputAmount;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
    setCopiedNumber(true);
    toast({ title: 'تم نسخ رقم فودافون كاش بنجاح! 📋' });
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'نوع الملف غير صالح',
        description: 'يرجى اختيار صورة صالحة (PNG أو JPG أو WEBP).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: 'حجم الصورة كبير',
        description: 'الحد الأقصى لحجم الصورة هو 8 ميجابايت.',
        variant: 'destructive',
      });
      return;
    }

    setReceiptFile(file);
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '');
    const egRegex = /^(010|011|012|015)\d{8}$/;
    const intlRegex = /^\+?[1-9]\d{7,14}$/;
    return egRegex.test(cleaned) || intlRegex.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setRefError('');

    let hasError = false;

    if (!transferPhone.trim()) {
      setPhoneError('يرجى إدخال رقم الهاتف الذي قمت بالتحويل منه.');
      hasError = true;
    } else if (!validatePhone(transferPhone)) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح (مثال: 01012345678).');
      hasError = true;
    }

    if (!transactionRef.trim()) {
      setRefError('يرجى إدخال رقم مرجع العملية من رسالة فودافون كاش.');
      hasError = true;
    } else if (transactionRef.trim().length < 4) {
      setRefError('رقم العملية يبدو قصيراً جداً، يرجى التأكد منه.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      let uploadedReceiptUrl: string | undefined = undefined;

      if (receiptFile) {
        setIsUploadingImage(true);
        try {
          const uploadRes = await uploadFileAndReturnInfo(
            receiptFile,
            `vodafone_receipts/${user?.uid || 'guest'}`
          );
          uploadedReceiptUrl = uploadRes.url;
        } catch (uploadErr) {
          console.warn('Failed to upload receipt image:', uploadErr);
        } finally {
          setIsUploadingImage(false);
        }
      }

      const displayName =
        userProfile?.name || userProfile?.fullName || user?.displayName || 'عميل سوق العرب';

      // ── 1. حفظ طلب الشحن في Firestore (القيمة بالجنيه المصري كعملة أساسية) ──
      const newPaymentId = await submitVodafoneCashPayment({
        userId: user?.uid || 'guest',
        userName: displayName,
        userEmail: user?.email || '',
        transferPhone: transferPhone.trim(),
        transactionRef: transactionRef.trim(),
        amount: effectiveEgp,
        currency: 'EGP',
        planId: 'wallet_topup',
        planName: isPayingInEgp 
          ? `شحن رصيد المحفظة (${effectiveEgp} ج.م)` 
          : `شحن محفظة (${rawInputAmount} ${activeCurrencySymbol} ≈ ${effectiveEgp} ج.م)`,
        receiptUrl: uploadedReceiptUrl,
      });

      setPaymentId(newPaymentId);
      setStep('success');

      // ── 2. إرسال إشعار للأدمن عبر السيرفر في الخلفية ──
      fetch('/api/vodafone-cash/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: newPaymentId,
          userId: user?.uid,
          userName: displayName,
          userEmail: user?.email || '',
          transferPhone: transferPhone.trim(),
          transactionRef: transactionRef.trim(),
          amount: effectiveEgp,
          currency: 'EGP',
          planId: 'wallet_topup',
          planName: isPayingInEgp 
            ? `شحن رصيد المحفظة (${effectiveEgp} ج.م)` 
            : `شحن محفظة (${rawInputAmount} ${activeCurrencySymbol} ≈ ${effectiveEgp} ج.م)`,
          receiptUrl: uploadedReceiptUrl,
        }),
      }).catch((err) => {
        console.warn('Background admin notification error:', err);
      });
    } catch (error: any) {
      console.error('Vodafone cash topup submission error:', error);
      toast({
        title: 'فشل إرسال الطلب',
        description: error.message || 'حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setTimeout(() => {
        setStep('amount');
        setSelectedAmount(100);
        setCustomAmount('');
        setPaymentCurrency('EGP');
        setTransferPhone('');
        setTransactionRef('');
        setPhoneError('');
        setRefError('');
        setPaymentId('');
        handleRemoveImage();
      }, 300);
    }
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `مرحباً، قمت بتحويل مبلغ ${effectiveEgp} ج.م ${!isPayingInEgp ? `(ما يعادل ${rawInputAmount} ${activeCurrencySymbol})` : ''} عبر فودافون كاش لشحن محفظتي في سوق العرب 👛.\n` +
      `رقم هاتفي المُحوِّل: ${transferPhone}\n` +
      `رقم العملية: ${transactionRef}\n` +
      (paymentId ? `رقم الطلب: ${paymentId}` : '')
    );
    window.open(`https://api.whatsapp.com/send?phone=201127556848&text=${text}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-card" dir="rtl">
        {/* ── الرأس ── */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white p-6 pb-7 select-none overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  شحن عبر فودافون كاش والمحافظ
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-white mt-1">
                إضافة رصيد إلى المحفظة
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="text-xs text-white/80 leading-relaxed max-w-sm">
            حول المبلغ المطلوب إلى رقم فودافون كاش، وسيتم إضافة الرصيد فوراً إلى محفظتك لاستخدامه في الباقات والميزات.
          </DialogDescription>
        </div>

        {/* ── الخطوة 1: اختيار المبلغ والعملة ── */}
        {step === 'amount' && (
          <div className="p-6 space-y-5">
            {/* خيار تبديل العملة للمستخدمين من خارج مصر */}
            {!isEgypt && (
              <div className="p-3.5 rounded-2xl bg-secondary/70 border border-primary/20 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                    <span>عملة تحويل الرصيد:</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    سعر صرف حي 🌐
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentCurrency('EGP');
                      setSelectedAmount(100);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      isPayingInEgp
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-background text-foreground hover:bg-secondary border-border'
                    }`}
                  >
                    <span>🇪🇬 الجنيه المصري (ج.م)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentCurrency('LOCAL');
                      setSelectedAmount(25);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      !isPayingInEgp
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-background text-foreground hover:bg-secondary border-border'
                    }`}
                  >
                    <span>{market?.name?.ar || 'عملة بلدك'} ({localCurrency.symbol})</span>
                  </button>
                </div>

                <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                  {isPayingInEgp
                    ? '💡 موصى به: ستقوم بالتحويل بمبلغ الجنيه المصري مباشرة على محفظة فودافون كاش.'
                    : `💡 ستقوم بتحديد المبلغ بـ (${localCurrency.symbol})، وسيتم احتساب ما يعادله بالجنيه المصري تلقائياً وإضافته لمحفظتك.`}
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs font-bold text-foreground block mb-2.5">
                اختر مبلغ الشحن ({activeCurrencySymbol}):
              </Label>
              <div className="grid grid-cols-3 gap-2.5">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-3 px-2 rounded-2xl font-black text-sm transition-all border ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                        : 'bg-secondary/60 text-foreground border-border hover:bg-secondary'
                    }`}
                  >
                    {amt} {activeCurrencySymbol}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground block mb-2">
                أو اكتب مبلغاً مخصصاً ({activeCurrencySymbol}):
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100000"
                  placeholder={isPayingInEgp ? "مثال: 300" : "مثال: 50"}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="h-12 text-base font-bold rounded-2xl pr-10 text-left font-mono"
                  dir="ltr"
                />
                <Coins className="w-5 h-5 text-muted-foreground absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/60 border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">المبلغ المحدد للشحن:</span>
                <span className="text-base font-black text-foreground font-mono">
                  {rawInputAmount || 0} {activeCurrencySymbol}
                </span>
              </div>

              {!isPayingInEgp ? (
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>المبلغ المطلوب تحويله بفودافون كاش:</span>
                  <span className="text-base font-black font-mono">
                    ≈ {effectiveEgp} ج.م
                  </span>
                </div>
              ) : !isEgypt ? (
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-muted-foreground">
                  <span>ما يعادله بعملة بلدك اليوم ({localCurrency.symbol}):</span>
                  <span className="font-mono font-bold text-foreground">
                    ≈ {equivalentLocalAmount} {localCurrency.symbol}
                  </span>
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              disabled={!rawInputAmount || rawInputAmount <= 0}
              onClick={() => setStep('instructions')}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl gap-2 shadow-md"
            >
              <span>متابعة لتعليمات التحويل ({effectiveEgp} ج.م)</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── الخطوة 2: تعليمات التحويل ورقم المحفظة ── */}
        {step === 'instructions' && (
          <div className="p-6 space-y-6">
            {/* بطاقة رقم التحويل والمبلغ */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-secondary/70 to-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">رقم فودافون كاش للتحويل:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                  المطلوب: {effectiveEgp} ج.م {!isPayingInEgp ? `(${rawInputAmount} ${activeCurrencySymbol})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background border">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-foreground select-all">
                  {VODAFONE_CASH_NUMBER}
                </span>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyNumber}
                  variant="outline"
                  className="rounded-xl text-xs font-bold gap-1.5 h-9 shrink-0 shadow-xs"
                >
                  {copiedNumber ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNumber ? 'تم النسخ!' : 'نسخ الرقم'}</span>
                </Button>
              </div>
            </div>

            {/* خطوات التحويل */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-foreground block">خطوات التحويل البسيطة:</span>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside pr-1 leading-relaxed">
                <li>
                  اطلب من هاتفك كود فودافون كاش <code className="font-mono font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">*9*7*الرقم*المبلغ#</code> أو عبر تطبيق <strong className="text-foreground">Ana Vodafone</strong> أو أي محفظة إلكترونية.
                </li>
                <li>
                  حول مبلغ <strong className="text-foreground font-bold font-mono">{effectiveEgp} ج.م</strong> {!isPayingInEgp ? `(ما يعادل ${rawInputAmount} ${activeCurrencySymbol})` : ''} إلى الرقم الموضح أعلاه.
                </li>
                <li>
                  احتفظ برسالة التأكيد النصية (SMS) أو التقط لقطة شاشة للتحويل.
                </li>
              </ol>
            </div>

            {/* أزرار التنقل */}
            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('amount')}
                className="rounded-2xl h-12 px-4 text-xs font-bold"
              >
                تغيير المبلغ
              </Button>

              <Button
                type="button"
                onClick={() => setStep('confirm')}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl gap-2 shadow-md text-xs sm:text-sm"
              >
                <span>تم التحويل، تأكيد البيانات</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── الخطوة 3: إدخال بيانات العملية والإيصال ── */}
        {step === 'confirm' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>رقم الهاتف الذي قمت بالتحويل منه:</span>
              </Label>
              <Input
                type="tel"
                placeholder="010XXXXXXXX"
                value={transferPhone}
                onChange={(e) => {
                  setTransferPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                dir="ltr"
                className={`h-11 rounded-2xl text-left font-mono ${phoneError ? 'border-destructive' : ''}`}
              />
              {phoneError && <p className="text-2xs text-destructive">{phoneError}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>رقم العملية / مرجع التحويل (من رسالة فودافون):</span>
              </Label>
              <Input
                type="text"
                placeholder="مثال: 987654321"
                value={transactionRef}
                onChange={(e) => {
                  setTransactionRef(e.target.value);
                  if (refError) setRefError('');
                }}
                dir="ltr"
                className={`h-11 rounded-2xl text-left font-mono ${refError ? 'border-destructive' : ''}`}
              />
              {refError && <p className="text-2xs text-destructive">{refError}</p>}
            </div>

            {/* رفع صورة الإيصال (اختياري) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>صورة الإيصال أو لقطة الشاشة (اختياري لتسريع الشحن):</span>
                </span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {receiptPreview ? (
                <div className="relative rounded-2xl border p-2 bg-secondary/30 flex items-center gap-3">
                  <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-background border shrink-0">
                    <Image src={receiptPreview} alt="Receipt preview" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-semibold truncate text-foreground">{receiptFile?.name}</p>
                    <p className="text-muted-foreground text-2xs">
                      {receiptFile ? `${(receiptFile.size / 1024).toFixed(0)} كيلوبايت` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveImage}
                    className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-border hover:border-emerald-500/60 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all bg-secondary/20"
                >
                  <UploadCloud className="w-6 h-6 text-emerald-600 mb-0.5" />
                  <span className="font-bold">انقر لاختيار صورة الإيصال</span>
                  <span className="text-2xs text-muted-foreground">PNG أو JPG (الحد الأقصى 8 ميجابايت)</span>
                </button>
              )}
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => setStep('instructions')}
                className="rounded-2xl h-12 px-4 text-xs font-bold"
              >
                رجوع
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl gap-2 shadow-md text-xs sm:text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد وشحن المحفظة ({effectiveEgp} ج.م) {!isPayingInEgp ? `(${rawInputAmount} ${activeCurrencySymbol})` : ''}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* ── الخطوة 4: شاشة النجاح ── */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-foreground">تم استلام طلب شحن المحفظة بنجاح! 🎉</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                شكراً لك! تم تسجيل طلب شحن محفظتك بمبلغ <strong className="text-foreground font-bold">{effectiveEgp} ج.م</strong> {!isPayingInEgp ? `(ما يعادل ${rawInputAmount} ${activeCurrencySymbol})` : ''}. سيتم مراجعة التحويل وإضافة الرصيد إلى محفظتك في أقرب وقت.
              </p>
            </div>

            {paymentId && (
              <div className="p-3 rounded-2xl bg-secondary/50 border text-xs text-muted-foreground flex items-center justify-between">
                <span>رقم مرجع الطلب:</span>
                <span className="font-mono font-bold text-foreground">{paymentId}</span>
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <Button
                type="button"
                onClick={handleWhatsAppContact}
                className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold h-12 rounded-2xl gap-2 text-xs sm:text-sm shadow-md"
              >
                <span>إشعار الإدارة عبر واتساب فوراً ⚡</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full rounded-2xl h-11 text-xs font-bold"
              >
                إغلاق والعودة للمحفظة
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
