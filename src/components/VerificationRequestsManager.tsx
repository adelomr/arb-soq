'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  BadgeCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  User, 
  MapPin, 
  Phone, 
  Loader2, 
  Trash2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { formatWhatsAppNumber } from '@/lib/utils';

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  phoneNumber: string;
  country: string;
  province?: string;
  city?: string;
  profession?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  approvedAt?: any;
}

export default function VerificationRequestsManager() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(firestore, 'verification_requests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VerificationRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as VerificationRequest);
      });
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to verification requests:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (req: VerificationRequest) => {
    setProcessingId(req.id);
    try {
      // 1. Update user profile to verified
      const userRef = doc(firestore, 'users', req.userId);
      await updateDoc(userRef, {
        verified: true,
        phoneVerified: true,
        verifiedAt: new Date().toISOString(),
      });

      // 2. Update request status
      const reqRef = doc(firestore, 'verification_requests', req.id);
      await updateDoc(reqRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });

      // 3. Send congratulatory in-app notification
      const notifRef = doc(collection(firestore, 'notifications'));
      await setDoc(notifRef, {
        userId: req.userId,
        title: 'مبروك! تم توثيق حسابك بالعلامة الزرقاء 🛡️',
        message: 'تهانينا! قامت إدارة سوق العرب بمراجعة بياناتك وتوثيق حسابك رسمياً. تظهر شارة التوثيق الزرقاء الآن على جميع إعلاناتك وصفحتك الشخصية.',
        type: 'verification_approved',
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'تم التوثيق بنجاح! ✅',
        description: `تم توثيق حساب ${req.userName} بالعلامة الزرقاء وإرسال إشعار له.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'فشل التوثيق',
        description: err.message || 'حدث خطأ أثناء تفعيل التوثيق.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: VerificationRequest) => {
    setProcessingId(req.id);
    try {
      const reqRef = doc(firestore, 'verification_requests', req.id);
      await updateDoc(reqRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      });

      toast({
        title: 'تم رفض الطلب',
        description: `تم تحديث حالة طلب ${req.userName} إلى مرفوض.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'خطأ',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'verification_requests', id));
      toast({ title: 'تم حذف الطلب' });
    } catch (err: any) {
      toast({ title: 'خطأ في الحذف', description: err.message, variant: 'destructive' });
    }
  };

  const openWhatsApp = (req: VerificationRequest) => {
    const cleanNum = formatWhatsAppNumber(req.phoneNumber);
    const msg = `مرحباً ${req.userName}، معك إدارة سوق العرب بخصوص طلب توثيق حسابك بالعلامة الزرقاء 🛡️`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border border-border bg-card">
        <CardHeader className="text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold font-headline">
                  إدارة طلبات توثيق الحسابات (العلامة الزرقاء 🛡️)
                </CardTitle>
                <CardDescription className="mt-1">
                  مراجعة طلبات التوثيق الواردة من المستخدمين عبر واتساب، والموافقة عليها لتفعيل الشارة الزرقاء.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1 font-bold">
              {pendingRequests.length} طلبات جديدة
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Requests List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          <span>طلبات قيد المراجعة ({pendingRequests.length})</span>
        </h3>

        {pendingRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-green-500/60 mx-auto mb-2" />
            <p className="font-medium">لا توجد أي طلبات توثيق معلقة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="border border-amber-500/30 bg-card shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                        <User className="h-4 w-4 text-primary" />
                        <span>{req.userName}</span>
                      </h4>
                      {req.profession && (
                        <p className="text-xs text-muted-foreground mt-0.5">{req.profession}</p>
                      )}
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      قيد المراجعة
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground border-y py-3 border-border/50">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-foreground font-medium" dir="ltr">{req.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{req.country} {req.province ? `• ${req.province}` : ''} {req.city ? `• ${req.city}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs opacity-75">معرّف الحساب:</span>
                      <span className="font-mono text-2xs truncate max-w-[200px]" dir="ltr">{req.userId}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 flex-1"
                    >
                      {processingId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" />
                      )}
                      <span>توثيق بالعلامة الزرقاء ✅</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWhatsApp(req)}
                      className="gap-1.5 text-green-600 border-green-600/30 hover:bg-green-50 dark:hover:bg-green-950/20"
                      title="مراسلة العميل على واتساب"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>واتساب</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(req)}
                      disabled={processingId === req.id}
                      className="text-destructive hover:bg-destructive/10 px-2"
                      title="رفض الطلب"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests History */}
      {processedRequests.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-base font-bold text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>السجل السابق ({processedRequests.length})</span>
          </h3>

          <div className="space-y-2">
            {processedRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60 text-xs">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-foreground">{req.userName}</div>
                  <div className="text-muted-foreground font-mono" dir="ltr">{req.phoneNumber}</div>
                  <div className="text-muted-foreground">{req.country} - {req.city}</div>
                </div>

                <div className="flex items-center gap-3">
                  {req.status === 'approved' ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">موثق ✅</Badge>
                  ) : (
                    <Badge variant="destructive">مرفوض ❌</Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(req.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
