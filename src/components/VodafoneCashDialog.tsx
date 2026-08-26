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
  AlertCircle,
  ChevronLeft,
  UploadCloud,
  ImageIcon,
  X,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';

interface VodafoneCashDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  planId: 'premium' | 'gold';
  planName: string;
  amount: number;
  currency: string;
}

type Step = 'instructions' | 'confirm' | 'success';

export default function VodafoneCashDialog({
  isOpen,
  onOpenChange,
  planId,
  planName,
  amount,
  currency,
}: VodafoneCashDialogProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('instructions');
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

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
    setCopiedNumber(true);
    toast({ title: 'تم نسخ الرقم بنجاح!' });
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
    const objectUrl = URL.createObjectURL(file);
    setReceiptPreview(objectUrl);
  };

  const handleRemoveImage = () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndSubmit = async () => {
    setPhoneError('');
    setRefError('');

    // التحقق من رقم الهاتف
    const phoneClean = transferPhone.replace(/\s+/g, '').replace(/^0/, '');
    if (!/^[17][0-9]{8}$/.test(phoneClean) && !/^01[0-9]{9}$/.test(transferPhone.replace(/\s+/g, ''))) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح (مثل: 01012345678)');
      return;
    }

    // التحقق من الرقم المرجعي
    if (transactionRef.trim().length < 4) {
      setRefError('يرجى إدخال رقم عملية التحويل كما ورد في رسالة فودافون كاش');
      return;
    }

    setIsLoading(true);
    try {
      let uploadedReceiptUrl: string | undefined = undefined;

      // رفع صورة الإيصال إن وُجدت
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
        userProfile?.name || userProfile?.fullName || user?.displayName || 'عميل';

      // ── 1. الحفظ المباشر في Firestore باستخدام جلسة تسجيل دخول المستخدم ──
      const newPaymentId = await submitVodafoneCashPayment({
        userId: user?.uid || 'guest',
        userName: displayName,
        userEmail: user?.email || '',
        transferPhone: transferPhone.trim(),
        transactionRef: transactionRef.trim(),
        amount,
        currency,
        planId,
        planName,
        receiptUrl: uploadedReceiptUrl,
      });

      setPaymentId(newPaymentId);
      setStep('success');

      // ── 2. إرسال إشعار واتساب للأدمن عبر API في الخلفية بدون حجب المستخدم ──
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
          amount,
          currency,
          planId,
          planName,
          receiptUrl: uploadedReceiptUrl,
        }),
      }).catch((err) => {
        console.warn('Background admin notification error:', err);
      });
    } catch (error: any) {
      console.error('Vodafone cash submission error:', error);
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
        setStep('instructions');
        setTransferPhone('');
        setTransactionRef('');
        setPhoneError('');
        setRefError('');
        setPaymentId('');
        handleRemoveImage();
      }, 300);
    }
  };

  const isGold = planId === 'gold';
  const planEmoji = isGold ? '👑' : '⭐';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-card">
        {/* ── رأس الحوار بألوان وهوية الموقع الأنيقة ── */}
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-accent text-primary-foreground p-6 pb-7 select-none overflow-hidden">
          {/* زخرفة خلفية ناعمة */}
          <div className="absolute -left-10 -top-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-accent/20 rounded-full blur-xl pointer-events-none" />

          {/* العنوان والأيقونة */}
          <div className="flex items-center gap-3.5 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/80 bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  دفع مباشر وسريع
                </span>
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> موثوق
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                الدفع عبر فودافون كاش والمحافظ
              </h2>
            </div>
          </div>

          {/* ملخص الباقة */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 px-4 flex items-center justify-between border border-white/15 shadow-sm relative z-10">
            <div>
              <p className="text-xs text-white/80 font-medium">{planEmoji} {planName}</p>
              <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                {amount.toLocaleString('ar-EG')} <span className="text-base font-bold text-white/90">{currency}</span>
              </p>
            </div>
            <div className="text-left bg-black/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-2xs text-white/70">مدة التفعيل</p>
              <p className="text-xs font-bold text-white">{isGold ? '60 يوماً VIP' : '30 يوماً مميز'}</p>
            </div>
          </div>

          {/* شريط المراحل */}
          {step !== 'success' && (
            <div className="flex items-center gap-2.5 mt-4 relative z-10">
              {(['instructions', 'confirm'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s
                        ? 'bg-white text-primary shadow-sm font-bold'
                        : i < ['instructions', 'confirm'].indexOf(step)
                        ? 'bg-emerald-400 text-slate-900 font-bold'
                        : 'bg-white/20 text-white/70'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-medium text-white/90">
                    {s === 'instructions' ? 'بيانات التحويل' : 'تأكيد العملية'}
                  </span>
                  {i < 1 && <div className="w-8 h-0.5 bg-white/20" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── محتوى الخطوات ── */}
        <div className="p-6 bg-background space-y-5" dir="rtl">
          {/* ─── الخطوة 1: تعليمات التحويل ─── */}
          {step === 'instructions' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-primary" />
                  خطوات تحويل المبلغ
                </h3>
                <p className="text-xs text-muted-foreground">
                  قم بتحويل المبلغ المطلوب من محفظتك إلى الرقم الموضح أدناه:
                </p>
              </div>

              {/* بطاقة رقم المحفظة */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    رقم محفظة فودافون كاش الرسمية:
                  </span>
                  <span className="text-2xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                    استقبال فوري
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 bg-background rounded-xl border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-foreground select-all">
                      {VODAFONE_CASH_NUMBER}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyNumber}
                    className="gap-1.5 text-xs font-bold shrink-0 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    {copiedNumber ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرقم</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span>المبلغ المطلوب تحويله:</span>
                  <span className="font-bold text-foreground text-sm">
                    {amount.toLocaleString('ar-EG')} {currency}
                  </span>
                </div>
              </div>

              {/* خطوات التحويل المرقمة */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 border">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    من هاتفك، اطلب <strong className="text-foreground font-mono">*9#</strong> أو افتح تطبيق <strong className="text-foreground">Ana Vodafone</strong> واختر تحويل أموال.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 border">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    أدخل رقم التحويل والمبلغ، ثم احتفظ بـ <strong className="text-foreground">رسالة التأكيد أو لقطة الشاشة</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 border">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    اضغط زر <strong className="text-foreground">«التالي»</strong> بالأسفل لإدخال رقم العملية ورفع صورة الإيصال.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setStep('confirm')}
                className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <span>لقد حوّلت المبلغ — المتابعة للتأكيد</span>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* ─── الخطوة 2: نموذج التأكيد ورفع الصورة ─── */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b">
                <div>
                  <h3 className="text-base font-bold text-foreground">بيانات التأكيد</h3>
                  <p className="text-xs text-muted-foreground">أدخل تفاصيل العملية لتفعيل باقتك فوراً</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('instructions')}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  رجوع
                </button>
              </div>

              {/* رقم الهاتف الذي حوّل منه */}
              <div className="space-y-1.5">
                <Label className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  رقم الهاتف الذي قمت بالتحويل منه:
                </Label>
                <Input
                  type="tel"
                  placeholder="مثال: 01012345678"
                  value={transferPhone}
                  onChange={(e) => {
                    setTransferPhone(e.target.value);
                    setPhoneError('');
                  }}
                  dir="ltr"
                  className={`font-mono text-left text-sm h-10 rounded-xl ${
                    phoneError ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                {phoneError && (
                  <p className="text-2xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {phoneError}
                  </p>
                )}
              </div>

              {/* الرقم المرجعي */}
              <div className="space-y-1.5">
                <Label className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  رقم عملية التحويل (من رسالة فودافون كاش):
                </Label>
                <Input
                  type="text"
                  placeholder="مثال: 452981038"
                  value={transactionRef}
                  onChange={(e) => {
                    setTransactionRef(e.target.value);
                    setRefError('');
                  }}
                  dir="ltr"
                  className={`font-mono text-left text-sm h-10 rounded-xl ${
                    refError ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
                {refError && (
                  <p className="text-2xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {refError}
                  </p>
                )}
              </div>

              {/* رفع صورة إيصال التحويل / لقطة الشاشة */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    صورة إشعار أو إيصال التحويل (مستحسن):
                  </Label>
                  <span className="text-2xs text-muted-foreground">اختياري للتسريع</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  id="receipt-upload-input"
                />

                {!receiptPreview ? (
                  <label
                    htmlFor="receipt-upload-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/60 rounded-2xl cursor-pointer transition-all gap-1.5 text-center group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-foreground">اضغط لرفع لقطة الشاشة أو الإيصال</p>
                    <p className="text-2xs text-muted-foreground">صيغ مدعومة: JPG, PNG, WEBP (حتى 8MB)</p>
                  </label>
                ) : (
                  <div className="relative rounded-2xl border bg-secondary/30 p-2.5 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border bg-background shrink-0">
                      <Image
                        src={receiptPreview}
                        alt="إيصال التحويل"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {receiptFile?.name || 'صورة الإيصال'}
                      </p>
                      <p className="text-2xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> تم اختيار الصورة بنجاح
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveImage}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* تنبيه بالسرعة */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs">
                <Clock className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>يتم مراجعة التحويل وتفعيل الباقة فورياً وبشكل موثوق.</span>
              </div>

              <Button
                onClick={validateAndSubmit}
                disabled={isLoading}
                className="w-full py-6 text-sm sm:text-base font-bold rounded-2xl gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUploadingImage ? 'جارٍ رفع الإيصال...' : 'جارٍ إرسال الطلب...'}</span>
                  </>
                ) : (
                  <>
                    <span>إرسال وتأكيد الطلب</span>
                    <ChevronLeft className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ─── الخطوة 3: شاشة النجاح ─── */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-black text-foreground mb-1.5">
                  تم استلام طلب التحويل بنجاح! 🎉
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  تم إرسال تفاصيل الدفع والإيصال إلى إدارة الموقع تلقائياً. سيتم مراجعة العملية وتفعيل اشتراكك في{' '}
                  <strong className="text-foreground font-bold">{planName}</strong> فورياً.
                </p>
              </div>

              {/* بطاقة تأكيد الإرسال التلقائي */}
              <div className="w-full p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-right text-2xs sm:text-xs">
                  تم إرسال إشعار فوري لمدير الموقع عبر واتساب وسيتولى التفعيل الآن.
                </span>
              </div>

              {paymentId && (
                <div className="w-full p-3 rounded-xl bg-secondary/50 border text-xs">
                  <p className="text-muted-foreground text-2xs mb-0.5">رقم طلبك المرجعي في النظام:</p>
                  <p className="font-mono font-bold text-foreground text-xs select-all break-all">
                    {paymentId}
                  </p>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full py-6 text-sm font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                تم، المتابعة إلى الموقع
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
