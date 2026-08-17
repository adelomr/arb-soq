'use client';

import { useState } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, deleteField } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

type CleanupStatus = 'idle' | 'scanning' | 'running' | 'done' | 'error';

export default function UserDataCleanup() {
  const { toast } = useToast();
  const [status, setStatus] = useState<CleanupStatus>('idle');
  const [scannedCount, setScannedCount] = useState(0);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const handleCleanup = async () => {
    setStatus('scanning');
    setScannedCount(0);
    setCleanedCount(0);
    setSkippedCount(0);
    setLog([]);

    try {
      addLog('جاري مسح مستخدمي قاعدة البيانات...');
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const total = usersSnap.size;
      setScannedCount(total);
      addLog(`تم العثور على ${total} مستخدم اجمالاً.`);

      const BATCH_SIZE = 400;
      let batch = writeBatch(firestore);
      let batchCount = 0;
      let cleaned = 0;
      let skipped = 0;

      setStatus('running');

      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const hasProfession = data.profession !== undefined;
        const hasSpecialization = data.specialization !== undefined;

        if (hasProfession || hasSpecialization) {
          const updatePayload: Record<string, unknown> = {};
          if (hasProfession) updatePayload.profession = deleteField();
          if (hasSpecialization) updatePayload.specialization = deleteField();

          batch.update(doc(firestore, 'users', userDoc.id), updatePayload);
          batchCount++;
          cleaned++;

          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            addLog(`تم تنظيف ${cleaned} سجل (دفعة)`);
            batch = writeBatch(firestore);
            batchCount = 0;
          }
        } else {
          skipped++;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      setCleanedCount(cleaned);
      setSkippedCount(skipped);
      addLog(`اكتمل التنظيف!`);
      addLog(`تم تنظيف: ${cleaned} مستخدم`);
      addLog(`لا يحتاج تنظيف: ${skipped} مستخدم`);
      setStatus('done');

      toast({ title: 'تم التنظيف بنجاح!', description: `تم حذف بيانات المهنة من ${cleaned} مستخدم.` });
    } catch (e) {
      console.error(e);
      addLog(`خطأ: ${e instanceof Error ? e.message : 'خطأ غير معروف'}`);
      setStatus('error');
      toast({ title: 'خطأ اثناء التنظيف', description: 'راجع السجل أدناه.', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          تنظيف بيانات المهن القديمة من حسابات المستخدمين
        </CardTitle>
        <CardDescription>
          يحذف هذه الأداة حقلَي <code className="bg-muted px-1 rounded text-xs">profession</code> و <code className="bg-muted px-1 rounded text-xs">specialization</code> من جميع سجلات المستخدمين في قاعدة البيانات دفعةً واحدة.
          السجلات التي لا تحتوي على هذه الحقول سيتم تخطيها تلقائياً.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status !== 'idle' && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold">{scannedCount}</p>
              <p className="text-xs text-muted-foreground">اجمالي المستخدمين</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{cleanedCount}</p>
              <p className="text-xs text-muted-foreground">تم تنظيفهم</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-2xl font-bold text-muted-foreground">{skippedCount}</p>
              <p className="text-xs text-muted-foreground">لا يحتاجون تنظيف</p>
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-muted rounded-lg p-4 font-mono text-sm max-h-48 overflow-y-auto space-y-1 text-start" dir="rtl">
            {log.map((line, i) => (
              <p key={i} className={
                line.includes('خطأ') ? 'text-destructive' :
                line.includes('اكتمل') || line.includes('تم تنظيف') ? 'text-green-600' :
                'text-muted-foreground'
              }>
                {line}
              </p>
            ))}
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">اكتمل التنظيف بنجاح!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">حدث خطأ، يرجى مراجعة السجل أعلاه.</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="destructive"
          onClick={handleCleanup}
          disabled={status === 'scanning' || status === 'running'}
          className="w-full"
        >
          {status === 'scanning' || status === 'running' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              {status === 'scanning' ? 'جاري المسح...' : 'جاري التنظيف...'}
            </>
          ) : status === 'done' ? (
            <>
              <CheckCircle className="h-4 w-4 ml-2" />
              تم التنظيف - يمكن التشغيل مجدداً
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 ml-2" />
              بدء تنظيف قاعدة البيانات
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
