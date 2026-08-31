'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  getVodafoneCashPayments,
  approveVodafoneCashPayment,
  rejectVodafoneCashPayment,
  deleteVodafoneCashPayment,
  type VodafoneCashPayment,
  type VodafoneCashStatus,
} from '@/lib/vodafone-cash-service';
import Image from 'next/image';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Phone,
  Hash,
  User,
  Calendar,
  Filter,
  Eye,
  ImageIcon,
  ShieldCheck,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | VodafoneCashStatus;

function formatDate(ts: any): string {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function StatusBadge({ status }: { status: VodafoneCashStatus }) {
  const map: Record<VodafoneCashStatus, { label: string; className: string }> = {
    pending: {
      label: 'قيد المراجعة',
      className: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 font-bold',
    },
    approved: {
      label: 'مفعلة',
      className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 font-bold',
    },
    rejected: {
      label: 'مرفوضة',
      className: 'bg-destructive/10 text-destructive border-destructive/20 font-bold',
    },
  };
  const cfg = map[status] || map.pending;
  return (
    <Badge variant="outline" className={cn('font-semibold text-xs py-0.5', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export default function VodafoneCashManager() {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [payments, setPayments] = useState<VodafoneCashPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // معاينة صورة الإيصال
  const [previewImage, setPreviewImage] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: '',
    title: '',
  });

  // حوار الرفض
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    paymentId: string;
    note: string;
  }>({ open: false, paymentId: '', note: '' });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await getVodafoneCashPayments(status);
      setPayments(data);
    } catch (e) {
      toast({ title: 'خطأ', description: 'فشل تحميل الطلبات.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApprove = async (paymentId: string) => {
    setActionLoading(paymentId);
    try {
      const adminName = userProfile?.name || 'الأدمن';
      const success = await approveVodafoneCashPayment(paymentId, adminName);
      if (success) {
        toast({ title: '✅ تم التفعيل!', description: 'تم تفعيل باقة المستخدم وإرسال إشعار فوري له.' });
        fetchPayments();
      } else {
        toast({ title: 'فشل التفعيل', description: 'تعذر تفعيل الباقة. تأكد من وجود المستخدم.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    const { paymentId, note } = rejectDialog;
    if (!note.trim()) {
      toast({ title: 'أدخل سبب الرفض', variant: 'destructive' });
      return;
    }
    setActionLoading(paymentId);
    setRejectDialog((s) => ({ ...s, open: false }));
    try {
      const adminName = userProfile?.name || 'الأدمن';
      await rejectVodafoneCashPayment(paymentId, adminName, note.trim());
      toast({ title: '❌ تم الرفض', description: 'تم رفض الطلب وإخطار المستخدم بالسبب.' });
      fetchPayments();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟');
    if (!confirmed) return;

    setActionLoading(paymentId);
    try {
      await deleteVodafoneCashPayment(paymentId);
      toast({ title: '🗑️ تم حذف السجل بنجاح' });
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (e: any) {
      toast({ title: 'خطأ أثناء الحذف', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'الكل', value: 'all' },
    { label: 'المعلقة', value: 'pending' },
    { label: 'المُفعَّلة', value: 'approved' },
    { label: 'المرفوضة', value: 'rejected' },
  ];

  return (
    <>
      <Card className="border border-border shadow-sm" dir="rtl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  طلبات دفع فودافون كاش
                  {pendingCount > 0 && filterStatus !== 'pending' && (
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                      {pendingCount} معلق
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  مراجعة إيصالات التحويل والبيانات وتفعيل اشتراكات وباقات المستخدمين
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPayments}
              disabled={loading}
              className="gap-1.5 shrink-0 rounded-xl"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              تحديث القائمة
            </Button>
          </div>

          {/* فلاتر الحالة */}
          <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t mt-3">
            <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            {filterButtons.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all',
                  filterStatus === value
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {label}
                {value === 'pending' && pendingCount > 0 && (
                  <span className="mr-1.5 bg-background/30 text-xs px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">جارٍ تحميل طلبات الدفع...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Smartphone className="w-7 h-7 opacity-40" />
              </div>
              <p className="font-semibold text-sm">لا توجد طلبات {filterStatus !== 'all' ? 'في هذه الحالة' : ''}</p>
              <p className="text-xs">ستظهر هنا طلبات التحويل فور إرسالها من صفحة الأسعار</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right hidden md:table-cell">رقم التحويل</TableHead>
                    <TableHead className="text-right">الباقة / المبلغ</TableHead>
                    <TableHead className="text-right">رقم العملية / الإيصال</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">التاريخ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-secondary/30">
                      {/* المستخدم */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{payment.userName}</p>
                            <p className="text-2xs text-muted-foreground font-mono">{payment.userEmail || '—'}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* رقم التحويل */}
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          {payment.transferPhone}
                        </div>
                      </TableCell>

                      {/* الباقة */}
                      <TableCell>
                        <div>
                          <p className="font-bold text-xs sm:text-sm">
                            {payment.planId === 'gold' ? '👑' : '⭐'} {payment.planName}
                          </p>
                          <p className="text-xs font-bold text-primary mt-0.5">
                            {payment.amount.toLocaleString('ar-EG')} {payment.currency}
                          </p>
                        </div>
                      </TableCell>

                      {/* رقم العملية وصورة الإيصال */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground bg-secondary/50 px-2 py-1 rounded-lg border w-fit">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span>{payment.transactionRef}</span>
                          </div>

                          {payment.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage({
                                  open: true,
                                  url: payment.receiptUrl!,
                                  title: `إيصال العميل: ${payment.userName}`,
                                })
                              }
                              className="flex items-center gap-1.5 text-2xs font-bold text-primary hover:text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 transition-colors"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>معاينة صورة الإيصال</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <span className="text-2xs text-muted-foreground">بدون صورة إيصال</span>
                          )}
                        </div>
                      </TableCell>

                      {/* التاريخ */}
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(payment.createdAt)}
                        </div>
                      </TableCell>

                      {/* الحالة */}
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>

                      {/* الإجراء */}
                      <TableCell>
                        {payment.status === 'pending' ? (
                          <div className="flex flex-col sm:flex-row gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(payment.id)}
                              disabled={actionLoading === payment.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 h-8 px-3 rounded-lg font-bold shadow-xs"
                            >
                              {actionLoading === payment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              تفعيل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setRejectDialog({
                                  open: true,
                                  paymentId: payment.id,
                                  note: '',
                                })
                              }
                              disabled={actionLoading === payment.id}
                              className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1 h-8 px-2.5 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              رفض
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{payment.reviewedBy || 'تمت المراجعة'}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePayment(payment.id)}
                              disabled={actionLoading === payment.id}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              title="حذف هذا السجل نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── حوار معاينة صورة الإيصال بالكامل ── */}
      <Dialog
        open={previewImage.open}
        onOpenChange={(open) => setPreviewImage((s) => ({ ...s, open }))}
      >
        <DialogContent className="sm:max-w-xl p-4 overflow-hidden rounded-3xl" dir="rtl">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ImageIcon className="w-4 h-4 text-primary" />
              {previewImage.title}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full max-h-[70vh] min-h-[300px] rounded-2xl overflow-hidden bg-secondary/50 border flex items-center justify-center p-2">
            {previewImage.url && (
              <img
                src={previewImage.url}
                alt="إيصال التحويل"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-sm"
              />
            )}
          </div>
          <DialogFooter className="pt-2 flex justify-between items-center">
            <a
              href={previewImage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              فتح الصورة بالحجم الكامل
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewImage((s) => ({ ...s, open: false }))}
              className="rounded-xl"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── حوار الرفض ── */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((s) => ({ ...s, open }))}
      >
        <DialogContent className="sm:max-w-md rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <XCircle className="w-5 h-5 text-destructive" />
              رفض طلب الدفع
            </DialogTitle>
            <DialogDescription className="text-xs">
              أدخل سبب الرفض — سيُرسَل للمستخدم كإشعار توضيحي داخل حسابه.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="مثال: رقم العملية غير مطابق، أو لم يتم استلام التحويل في المحفظة..."
              value={rejectDialog.note}
              onChange={(e) => setRejectDialog((s) => ({ ...s, note: e.target.value }))}
              rows={3}
              className="resize-none rounded-2xl text-sm"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'رقم العملية غير مطابق',
                'لم يتم استلام التحويل في المحفظة',
                'صورة الإيصال غير واضحة',
                'المبلغ المحول غير كافٍ للباقة',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectDialog((s) => ({ ...s, note: reason }))}
                  className="text-3xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary transition-colors border border-border/60 font-medium"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialog((s) => ({ ...s, open: false }))}
              className="rounded-xl text-xs"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectDialog.note.trim()}
              className="rounded-xl text-xs font-bold"
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
