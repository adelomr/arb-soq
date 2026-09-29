'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, Ad } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Ban, 
  Trash2, 
  UserCheck, 
  Users, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  Award, 
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { detectCountry, ALL_COUNTRIES } from '@/lib/country-helpers';

const translations = {
  ar: {
    userManagement: 'إدارة المستخدمين والمشتركين',
    userManagementDesc: 'عرض وإدارة بيانات المستخدمين، صلاحيات الإشراف، وباقات التمييز الذهبية والفضية.',
    user: 'المستخدم',
    email: 'البريد الإلكتروني / الهاتف',
    planTier: 'نوع الباقة / الإعلانات',
    role: 'الصلاحية',
    status: 'الحالة',
    actions: 'الإجراءات والتحكم',
    admin: 'مشرف',
    userRole: 'مستخدم',
    active: 'نشط',
    suspended: 'موقوف',
    deleted: 'محذوف',
    suspend: 'إيقاف',
    activate: 'تفعيل',
    delete: 'حذف',
    suspendUserTitle: 'هل أنت متأكد من إيقاف هذا المستخدم؟',
    suspendUserDesc: 'سيتم منع المستخدم من تسجيل الدخول والوصول إلى الموقع ونشر الإعلانات.',
    activateUserTitle: 'هل أنت متأكد من تفعيل هذا المستخدم؟',
    activateUserDesc: 'سيتمكن المستخدم من تسجيل الدخول والوصول إلى حسابه بشكل طبيعي.',
    deleteUserTitle: 'هل أنت متأكد من حذف هذا المستخدم؟',
    deleteUserDesc: 'سيتم تغيير حالة المستخدم إلى "محذوف" ومنعه من الوصول إلى التطبيق.',
    cancel: 'إلغاء',
    confirm: 'تأكيد الإجراء',
    userSuspended: 'تم إيقاف المستخدم بنجاح.',
    userActivated: 'تم تفعيل حساب المستخدم بنجاح.',
    userDeleted: 'تم حذف حساب المستخدم بنجاح.',
    error: 'خطأ',
    errorOccurred: 'حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة مرة أخرى.',
    loadingUsers: 'جارٍ تحميل بيانات المستخدمين والباقات...',
    userMadeAdmin: 'تمت ترقية المستخدم إلى مشرف بنجاح.',
    userMadeNormal: 'تم إرجاع المستخدم كعضو عادي.',
    promoteToAdmin: 'ترقية لمشرف',
    demoteToUser: 'إرجاع لمستخدم',
    toggleRoleTitle: 'تغيير صلاحيات المستخدم',
    toggleRoleDescAdmin: 'هل أنت متأكد من ترقية هذا المستخدم إلى مشرف؟ سيتمكن من الوصول إلى جميع إعدادات لوحة التحكم.',
    toggleRoleDescUser: 'هل أنت متأكد من سحب صلاحيات الإشراف من هذا المستخدم وإرجاعه كعضو عادي؟',
  },
};

type UserWithId = UserProfile & { id: string };

type DialogState = {
  isOpen: boolean;
  action: 'suspend' | 'delete' | 'toggleRole' | null;
  user: UserWithId | null;
};

type UserFilterType = 
  | 'all' 
  | 'new_7days' 
  | 'new_month' 
  | 'new_year' 
  | 'gold' 
  | 'silver' 
  | 'regular' 
  | 'admin' 
  | 'suspended';

/**
 * دالة مساعدة لتحليل تاريخ التسجيل من مختلف الصيغ
 */
function parseRegistrationDate(createdAt: any): Date | null {
  if (!createdAt) return null;
  if (typeof createdAt?.toDate === 'function') {
    try { return createdAt.toDate(); } catch {}
  } else if (typeof createdAt === 'object' && 'seconds' in createdAt) {
    return new Date(createdAt.seconds * 1000);
  } else if (typeof createdAt === 'number') {
    return new Date(createdAt);
  } else if (createdAt instanceof Date && !isNaN(createdAt.getTime())) {
    return createdAt;
  } else if (typeof createdAt === 'string') {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * تنسيق تاريخ تسجيل المستخدم إلى العربية
 */
function getFormattedRegistrationDate(createdAt: any): string {
  const date = parseRegistrationDate(createdAt) || new Date();
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return date.toLocaleDateString('ar-EG');
  }
}

export default function AdminDashboard() {
  const { user: currentUser, getAllUsers, updateUserProfile } = useAuth();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, action: null, user: null });
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [filter, setFilter] = useState<UserFilterType>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const t = translations.ar;
  const { toast } = useToast();

  // حساب أعداد المستخدمين لكل دولة للأعلام
  const activeCountries = useMemo(() => {
    const list: { id: string; name: string; flag: string; count: number }[] = [];
    ALL_COUNTRIES.forEach((c) => {
      const count = users.filter((u) => detectCountry(u).id === c.id).length;
      if (count > 0) {
        list.push({ id: c.id, name: c.name, flag: c.flag, count });
      }
    });
    const otherCount = users.filter((u) => detectCountry(u).id === 'other').length;
    if (otherCount > 0) {
      list.push({ id: 'other', name: 'أخرى', flag: '🌐', count: otherCount });
    }
    return list.sort((a, b) => b.count - a.count);
  }, [users]);

  const fetchUsersAndAds = async () => {
    setLoading(true);
    try {
      const [allUsers, adsSnap] = await Promise.all([
        getAllUsers(),
        getDocs(collection(firestore, 'ads')).catch(() => null),
      ]);

      const fetchedAds: Ad[] = [];
      if (adsSnap && !adsSnap.empty) {
        adsSnap.forEach((docSnap) => {
          fetchedAds.push({ id: docSnap.id, ...docSnap.data() } as Ad);
        });
        setAds(fetchedAds);
      }

      // إثبات تاريخ التسجيل للأعضاء غير معروف تاريخهم بتاريخ حديث وحفظه بقاعدة البيانات
      const processedUsers = (allUsers || []).map((u) => {
        if (!u.createdAt) {
          const userAds = fetchedAds.filter((a) => a.userId === u.id || a.user?.id === u.id);
          let assignedDateStr = new Date().toISOString();
          if (userAds.length > 0) {
            const firstAd = userAds[userAds.length - 1];
            if (firstAd?.postedAt || firstAd?.timestamp) {
              assignedDateStr = new Date(firstAd.postedAt || firstAd.timestamp!).toISOString();
            }
          }

          // تثبيت التاريخ في Firestore بشكل دائم
          updateDoc(doc(firestore, 'users', u.id), { createdAt: assignedDateStr }).catch((err) => {
            console.warn(`Could not backfill createdAt for user ${u.id}:`, err);
          });

          return { ...u, createdAt: assignedDateStr };
        }
        return u;
      });

      setUsers(processedUsers);
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndAds();
  }, []);

  const handleToggleSuspend = async (userToUpdate: UserWithId) => {
    try {
      const newStatus = userToUpdate.status === 'active' ? 'suspended' : 'active';
      await updateUserProfile(userToUpdate.id, { status: newStatus });
      toast({ title: newStatus === 'suspended' ? t.userSuspended : t.userActivated });
      await fetchUsersAndAds();
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await updateUserProfile(userId, { status: 'deleted' });
      toast({ title: t.userDeleted });
      await fetchUsersAndAds();
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    }
  };

  const handleToggleRole = async (userToUpdate: UserWithId) => {
    try {
      const newRole = userToUpdate.role === 'admin' ? 'user' : 'admin';
      await updateUserProfile(userToUpdate.id, { role: newRole });
      toast({ title: newRole === 'admin' ? t.userMadeAdmin : t.userMadeNormal });
      await fetchUsersAndAds();
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    }
  };

  const openDialog = (action: 'suspend' | 'delete' | 'toggleRole', user: UserWithId) => {
    setDialogState({ isOpen: true, action, user });
  };
  
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, user: null });
  };

  const confirmAction = () => {
    if (!dialogState.action || !dialogState.user) return;
    if (dialogState.action === 'suspend') {
      handleToggleSuspend(dialogState.user);
    } else if (dialogState.action === 'delete') {
      handleDeleteUser(dialogState.user.id);
    } else if (dialogState.action === 'toggleRole') {
      handleToggleRole(dialogState.user);
    }
    closeDialog();
  };

  // مساعد لحساب إعلانات وباقات كل مستخدم
  const getUserStats = (userId: string) => {
    const userAds = ads.filter((a) => a.userId === userId || a.user?.id === userId);
    const now = new Date();
    const goldAds = userAds.filter(
      (a) => a.featuredTier === 'gold' && (!a.featuredUntil || new Date(a.featuredUntil) > now)
    );
    const silverAds = userAds.filter(
      (a) => a.featuredTier === 'silver' && (!a.featuredUntil || new Date(a.featuredUntil) > now)
    );
    const hasGold = goldAds.length > 0;
    const hasSilver = silverAds.length > 0;
    const isRegular = !hasGold && !hasSilver;

    return {
      totalAds: userAds.length,
      goldAdsCount: goldAds.length,
      silverAdsCount: silverAds.length,
      hasGold,
      hasSilver,
      isRegular,
      userAds,
    };
  };

  // حساب الإحصائيات الكلية للباقات والمستخدمين
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    let goldSubscribers = 0;
    let silverSubscribers = 0;
    let regularUsers = 0;
    let adminUsers = 0;
    let suspendedUsers = 0;
    let new7DaysCount = 0;
    let newMonthCount = 0;
    let newYearCount = 0;

    let totalGoldAds = 0;
    let totalSilverAds = 0;

    ads.forEach((a) => {
      if (a.featuredTier === 'gold' && (!a.featuredUntil || new Date(a.featuredUntil) > now)) {
        totalGoldAds++;
      } else if (a.featuredTier === 'silver' && (!a.featuredUntil || new Date(a.featuredUntil) > now)) {
        totalSilverAds++;
      }
    });

    users.forEach((u) => {
      if (u.role === 'admin') adminUsers++;
      if (u.status === 'suspended' || u.status === 'deleted') suspendedUsers++;

      const uDate = parseRegistrationDate(u.createdAt);
      if (uDate) {
        if (uDate >= sevenDaysAgo) new7DaysCount++;
        if (uDate >= thirtyDaysAgo) newMonthCount++;
        if (uDate >= startOfYear) newYearCount++;
      }

      const uAds = ads.filter((a) => a.userId === u.id || a.user?.id === u.id);
      const isGold = uAds.some((a) => a.featuredTier === 'gold' && (!a.featuredUntil || new Date(a.featuredUntil) > now));
      const isSilver = uAds.some((a) => a.featuredTier === 'silver' && (!a.featuredUntil || new Date(a.featuredUntil) > now));

      if (isGold) goldSubscribers++;
      if (isSilver) silverSubscribers++;
      if (!isGold && !isSilver) regularUsers++;
    });

    return {
      totalUsers: users.length,
      goldSubscribers,
      silverSubscribers,
      regularUsers,
      adminUsers,
      suspendedUsers,
      totalGoldAds,
      totalSilverAds,
      new7DaysCount,
      newMonthCount,
      newYearCount,
    };
  }, [users, ads]);

  // تصفية المستخدمين بناءً على الفلتر والبحث
  const filteredUsers = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    return users.filter((u) => {
      const userStat = getUserStats(u.id);
      const uDate = parseRegistrationDate(u.createdAt);
      const userCountry = detectCountry(u);

      // تطبيق فلتر الدولة بالأعلام
      if (selectedCountry !== 'all' && userCountry.id !== selectedCountry) return false;

      // تطبيق فلاتر الأعضاء الجدد حسب الفترة الزمنية
      if (filter === 'new_7days' && (!uDate || uDate < sevenDaysAgo)) return false;
      if (filter === 'new_month' && (!uDate || uDate < thirtyDaysAgo)) return false;
      if (filter === 'new_year' && (!uDate || uDate < startOfYear)) return false;

      // تطبيق فلتر الباقة / الحالة
      if (filter === 'gold' && !userStat.hasGold) return false;
      if (filter === 'silver' && !userStat.hasSilver) return false;
      if (filter === 'regular' && !userStat.isRegular) return false;
      if (filter === 'admin' && u.role !== 'admin') return false;
      if (filter === 'suspended' && u.status !== 'suspended' && u.status !== 'deleted') return false;

      // تطبيق فلتر البحث
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = (u.name || '').toLowerCase().includes(query);
        const matchEmail = (u.email || '').toLowerCase().includes(query);
        const matchPhone = (u.phoneNumber || '').includes(query);
        const matchCountry = userCountry.name.toLowerCase().includes(query);
        return matchName || matchEmail || matchPhone || matchCountry;
      }

      return true;
    });
  }, [users, ads, filter, selectedCountry, searchQuery]);

  if (loading) {
    return (
      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center gap-3">
            <Users className="h-6 w-6 md:h-8 md:w-8 text-primary"/>
            {t.userManagement}
          </CardTitle>
          <CardDescription>{t.userManagementDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-base text-muted-foreground font-medium">{t.loadingUsers}</p>
        </CardContent>
      </Card>
    );
  }

  const isSuspended = dialogState.user?.status !== 'active';
  const DialogContentMap = {
    suspend: {
      title: isSuspended ? t.activateUserTitle : t.suspendUserTitle,
      description: isSuspended ? t.activateUserDesc : t.suspendUserDesc,
      confirmVariant: 'default' as const,
    },
    delete: {
      title: t.deleteUserTitle,
      description: t.deleteUserDesc,
      confirmVariant: 'destructive' as const,
    },
    toggleRole: {
      title: t.toggleRoleTitle,
      description: dialogState.user?.role === 'admin' ? t.toggleRoleDescUser : t.toggleRoleDescAdmin,
      confirmVariant: 'default' as const,
    },
  };

  const currentDialogContent = dialogState.action ? DialogContentMap[dialogState.action] : null;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 📊 بطاقات الإحصائيات الشاملة للمستخدمين والباقات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* إجمالي المستخدمين */}
        <Card className="rounded-2xl border-border/60 shadow-xs bg-card hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي المستخدمين</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 font-mono text-foreground">
                {stats.totalUsers.toLocaleString('en-US')}
              </h3>
              <p className="text-2xs text-muted-foreground mt-0.5">مسجل في المنصة</p>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* مشتركو الباقة الذهبية */}
        <Card className="rounded-2xl border-amber-500/30 shadow-xs bg-amber-500/5 hover:border-amber-500/50 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                <span>الباقة الذهبية</span>
                <span>🥇</span>
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 font-mono text-amber-700 dark:text-amber-400">
                {stats.goldSubscribers.toLocaleString('en-US')}
              </h3>
              <p className="text-2xs text-amber-800/80 dark:text-amber-300/80 font-medium mt-0.5">
                {stats.totalGoldAds} إعلان ذهبي نشط
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* مشتركو الباقة الفضية */}
        <Card className="rounded-2xl border-slate-400/30 shadow-xs bg-slate-500/5 hover:border-slate-400/50 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                <span>الباقة الفضية</span>
                <span>🥈</span>
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 font-mono text-slate-700 dark:text-slate-300">
                {stats.silverSubscribers.toLocaleString('en-US')}
              </h3>
              <p className="text-2xs text-slate-800/80 dark:text-slate-300/80 font-medium mt-0.5">
                {stats.totalSilverAds} إعلان فضي نشط
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-500/15 text-slate-600 dark:text-slate-300">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* المستخدمون العاديون */}
        <Card className="rounded-2xl border-border/60 shadow-xs bg-card hover:border-border transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">مستخدمون عاديون</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 font-mono text-foreground">
                {stats.regularUsers.toLocaleString('en-US')}
              </h3>
              <p className="text-2xs text-muted-foreground mt-0.5">باقات مجانية عادية</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary text-muted-foreground">
              <UserIcon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📋 جدول المستخدمين والتحكم */}
      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-black font-headline flex items-center gap-2.5">
                <Users className="h-6 w-6 text-primary"/>
                <span>{t.userManagement}</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">{t.userManagementDesc}</CardDescription>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto text-xs px-3 py-1 font-bold bg-primary/5 text-primary border-primary/20">
              العدد المعروض: {filteredUsers.length} من {users.length}
            </Badge>
          </div>

          {/* 🔍 شريط الفلاتر السريعة والبحث المباشر */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            
            {/* أزرار الفلترة السريعة */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="h-8 text-xs font-bold rounded-xl gap-1.5"
              >
                <span>الكل</span>
                <span className="text-2xs opacity-80">({stats.totalUsers})</span>
              </Button>

              <Button
                variant={filter === 'new_7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('new_7days')}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  filter === 'new_7days'
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                )}
              >
                <span>آخر 7 أيام ⏱️</span>
                <span className="text-2xs opacity-80">({stats.new7DaysCount})</span>
              </Button>

              <Button
                variant={filter === 'new_month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('new_month')}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  filter === 'new_month'
                    ? "bg-sky-600 hover:bg-sky-700 text-white"
                    : "border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10"
                )}
              >
                <span>آخر شهر 📅</span>
                <span className="text-2xs opacity-80">({stats.newMonthCount})</span>
              </Button>

              <Button
                variant={filter === 'new_year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('new_year')}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  filter === 'new_year'
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                )}
              >
                <span>هذا العام 🗓️</span>
                <span className="text-2xs opacity-80">({stats.newYearCount})</span>
              </Button>

              <Button
                variant={filter === 'gold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('gold')}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  filter === 'gold' 
                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                    : "border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                )}
              >
                <span>ذهبية 🥇</span>
                <span className="text-2xs opacity-80">({stats.goldSubscribers})</span>
              </Button>

              <Button
                variant={filter === 'silver' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('silver')}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  filter === 'silver' 
                    ? "bg-slate-600 hover:bg-slate-700 text-white" 
                    : "border-slate-400/40 text-slate-700 dark:text-slate-300 hover:bg-slate-500/10"
                )}
              >
                <span>فضية 🥈</span>
                <span className="text-2xs opacity-80">({stats.silverSubscribers})</span>
              </Button>

              <Button
                variant={filter === 'regular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('regular')}
                className="h-8 text-xs font-bold rounded-xl gap-1.5"
              >
                <span>عادي 📄</span>
                <span className="text-2xs opacity-80">({stats.regularUsers})</span>
              </Button>

              <Button
                variant={filter === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('admin')}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5",
                  filter === 'admin' && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                <span>مشرفون 🛡️</span>
                <span className="text-2xs opacity-80">({stats.adminUsers})</span>
              </Button>

              {stats.suspendedUsers > 0 && (
                <Button
                  variant={filter === 'suspended' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('suspended')}
                  className={cn(
                    "h-8 text-xs font-bold rounded-xl gap-1.5",
                    filter === 'suspended' 
                      ? "bg-rose-600 hover:bg-rose-700 text-white" 
                      : "border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
                  )}
                >
                  <span>موقوفون ⛔</span>
                  <span className="text-2xs opacity-80">({stats.suspendedUsers})</span>
                </Button>
              )}
            </div>

            {/* مربع البحث */}
            <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، البريد، أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pr-9 pl-3 text-xs rounded-xl bg-background border-border/80"
              />
            </div>
          </div>

          {/* 🌍 شريط فلترة الدول بالأعلام */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40 text-xs">
            <span className="text-muted-foreground font-semibold ml-1 flex items-center gap-1">
              <span>الدولة:</span>
            </span>
            <Button
              variant={selectedCountry === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCountry('all')}
              className="h-7 text-xs font-bold rounded-lg px-2.5 gap-1"
            >
              <span>جميع الدول 🌐</span>
              <span className="text-2xs opacity-80">({users.length})</span>
            </Button>
            {activeCountries.map((c) => (
              <Button
                key={c.id}
                variant={selectedCountry === c.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCountry(c.id)}
                className={cn(
                  "h-7 text-xs font-semibold rounded-lg px-2.5 gap-1.5 transition-all",
                  selectedCountry === c.id
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-background hover:bg-muted text-foreground border border-border/70"
                )}
              >
                <span className="text-sm">{c.flag}</span>
                <span>{c.name}</span>
                <span className={cn(
                  "text-2xs px-1 rounded-full",
                  selectedCountry === c.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {c.count}
                </span>
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-right font-bold text-xs">{t.user}</TableHead>
                  <TableHead className="text-right font-bold text-xs hidden md:table-cell">{t.email}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t.planTier}</TableHead>
                  <TableHead className="text-right font-bold text-xs hidden sm:table-cell">{t.role}</TableHead>
                  <TableHead className="text-right font-bold text-xs">{t.status}</TableHead>
                  <TableHead className="text-center font-bold text-xs min-w-[240px]">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      لا يوجد مستخدمون يطابقون خيارات الفلتر والبحث المحددة.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userStat = getUserStats(user.id);
                    const isCurrentAuthUser = user.id === currentUser?.uid;
                    const userCountry = detectCountry(user);

                    return (
                      <TableRow 
                        key={user.id} 
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          isCurrentAuthUser && "bg-primary/5 font-semibold"
                        )}
                      >
                        {/* المستخدم مع إمكانية الضغط على الصورة وعلم الدولة */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="relative cursor-pointer group flex-shrink-0"
                              onClick={() => setSelectedUser(user)}
                              title="اضغط على الصورة لعرض تفاصيل المستخدم"
                            >
                              <Image
                                alt={user.name || user.email || 'صورة المستخدم'}
                                className="aspect-square rounded-full object-cover border border-border/80 group-hover:ring-2 group-hover:ring-primary transition-all duration-200"
                                height={38}
                                src={user.avatarUrl || `https://avatar.vercel.sh/${user.id}.png`}
                                width={38}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                                <span className="text-base" title={`الدولة: ${userCountry.name}`}>
                                  {userCountry.flag}
                                </span>
                                <span>{user.name || 'مستخدم بدون اسم'}</span>
                                {isCurrentAuthUser && (
                                  <Badge variant="outline" className="text-3xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                    أنت
                                  </Badge>
                                )}
                              </div>
                              <div className="text-2xs text-muted-foreground md:hidden mt-0.5">
                                {user.email || user.phoneNumber || user.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* البريد والهاتف */}
                        <TableCell className="hidden md:table-cell text-xs">
                          <div className="space-y-0.5">
                            {user.email && <div className="text-foreground">{user.email}</div>}
                            {user.phoneNumber && (
                              <div className="text-2xs text-muted-foreground font-mono flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground/70" />
                                <span>{user.phoneNumber}</span>
                              </div>
                            )}
                            {!user.email && !user.phoneNumber && (
                              <span className="text-2xs text-muted-foreground">معرف: {user.id.slice(0, 8)}...</span>
                            )}
                          </div>
                        </TableCell>

                        {/* باقة الإعلانات (ذهبية / فضية / عادية) */}
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            {userStat.hasGold && (
                              <Badge className="text-2xs font-bold px-2 py-0.5 bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 gap-1 shadow-2xs">
                                <span>🥇</span>
                                <span>ذهبية ({userStat.goldAdsCount})</span>
                              </Badge>
                            )}
                            {userStat.hasSilver && (
                              <Badge className="text-2xs font-bold px-2 py-0.5 bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-400/30 gap-1 shadow-2xs">
                                <span>🥈</span>
                                <span>فضية ({userStat.silverAdsCount})</span>
                              </Badge>
                            )}
                            {userStat.isRegular && (
                              <Badge variant="outline" className="text-2xs font-medium px-2 py-0.5 text-muted-foreground border-border/80 gap-1">
                                <span>📄</span>
                                <span>عادي ({userStat.totalAds})</span>
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* الدور */}
                        <TableCell className="hidden sm:table-cell">
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'outline'}
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5",
                              user.role === 'admin' ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-muted-foreground"
                            )}
                          >
                            {user.role === 'admin' ? 'مشرف 🛡️' : 'عضو 👤'}
                          </Badge>
                        </TableCell>

                        {/* الحالة */}
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5",
                              user.status === 'active' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                              user.status === 'suspended' && 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                              user.status === 'deleted' && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            )}
                          >
                            {user.status === 'active' ? 'نشط' : (user.status === 'suspended' ? 'موقوف' : 'محذوف')}
                          </Badge>
                        </TableCell>

                        {/* أزرار الإجراءات المباشرة (مشرف / إيقاف / حذف) */}
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            
                            {/* زر تغيير الدور (مشرف / عضو) */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentAuthUser}
                              onClick={() => openDialog('toggleRole', user)}
                              className={cn(
                                "h-7 px-2 text-xs font-semibold rounded-lg gap-1 transition-all shadow-2xs",
                                user.role === 'admin'
                                  ? "text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                                  : "text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                              )}
                              title={user.role === 'admin' ? 'إرجاع المستخدم إلى عضو عادي' : 'ترقية المستخدم إلى مشرف'}
                            >
                              {user.role === 'admin' ? (
                                <>
                                  <ShieldAlert className="h-3 w-3" />
                                  <span className="hidden sm:inline">تنزيل لعضو</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3 w-3" />
                                  <span className="hidden sm:inline">مشرف</span>
                                </>
                              )}
                            </Button>

                            {/* زر الإيقاف والتفعيل */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentAuthUser}
                              onClick={() => openDialog('suspend', user)}
                              className={cn(
                                "h-7 px-2 text-xs font-semibold rounded-lg gap-1 transition-all shadow-2xs",
                                user.status === 'active'
                                  ? "text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                                  : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                              )}
                              title={user.status === 'active' ? 'إيقاف المستخدم عن الدخول' : 'إعادة تفعيل المستخدم'}
                            >
                              {user.status === 'active' ? (
                                <>
                                  <Ban className="h-3 w-3" />
                                  <span>إيقاف</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  <span>تفعيل</span>
                                </>
                              )}
                            </Button>

                            {/* زر الحذف */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentAuthUser}
                              onClick={() => openDialog('delete', user)}
                              className="h-7 px-2 text-xs font-semibold rounded-lg gap-1 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 transition-all shadow-2xs"
                              title="حذف حساب المستخدم"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>حذف</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 🖼️ نافذة معلومات المستخدم عند الضغط على الصورة */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-6" dir="rtl">
          {selectedUser && (() => {
            const userStat = getUserStats(selectedUser.id);
            const regDateStr = getFormattedRegistrationDate(selectedUser.createdAt);
            const isPhoneVerified = Boolean(selectedUser.phoneVerified);

            return (
              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                {/* صورة المستخدم */}
                <div className="relative">
                  <Image
                    alt={selectedUser.name || 'المستخدم'}
                    src={selectedUser.avatarUrl || `https://avatar.vercel.sh/${selectedUser.id}.png`}
                    width={90}
                    height={90}
                    className="rounded-full object-cover border-2 border-primary/30 shadow-md aspect-square"
                  />
                  {selectedUser.role === 'admin' && (
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-3xs px-2 py-0.5">
                      مشرف
                    </Badge>
                  )}
                </div>

                {/* الاسم ومعرف الحساب وعلم الدولة */}
                <div>
                  <DialogTitle className="text-xl font-bold font-headline flex items-center justify-center gap-2">
                    <span className="text-2xl">{detectCountry(selectedUser).flag}</span>
                    <span>{selectedUser.name || 'مستخدم بدون اسم'}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    الدولة: {detectCountry(selectedUser).name} | معرف الحساب: {selectedUser.id}
                  </DialogDescription>
                </div>

                {/* بطاقات البيانات المطلوبة: الإيميل، رقم الهاتف، عدد الإعلانات، تاريخ التسجيل */}
                <div className="w-full space-y-2.5 pt-2 text-right">
                  
                  {/* الإيميل */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>البريد الإلكتروني:</span>
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[200px]" dir="ltr">
                      {selectedUser.email || 'غير مسجل'}
                    </span>
                  </div>

                  {/* رقم الهاتف وتأكيده */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>رقم الهاتف:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground" dir="ltr">
                        {selectedUser.phoneNumber || 'غير مسجل'}
                      </span>
                      {selectedUser.phoneNumber && (
                        isPhoneVerified ? (
                          <Badge className="text-3xs font-bold px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>مؤكد</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-3xs font-medium px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1">
                            <AlertCircle className="h-2.5 w-2.5" />
                            <span>غير مؤكد</span>
                          </Badge>
                        )
                      )}
                    </div>
                  </div>

                  {/* عدد الإعلانات */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>عدد الإعلانات:</span>
                    </span>
                    <Badge className="text-xs font-bold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
                      {userStat.totalAds} {userStat.totalAds === 1 ? 'إعلان' : 'إعلانات'}
                    </Badge>
                  </div>

                  {/* تاريخ التسجيل */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>تاريخ التسجيل:</span>
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {regDateStr}
                    </span>
                  </div>
                </div>

                {/* 🖼️ قسم إعلانات المستخدم كصور مصغرة للمراجعة السريعة */}
                <div className="w-full pt-3 border-t border-border/60 text-right space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>إعلانات المستخدم ({userStat.totalAds}):</span>
                    </span>
                    {userStat.totalAds > 0 && (
                      <span className="text-3xs text-muted-foreground">انقر على الإعلان لمعاينته</span>
                    )}
                  </div>

                  {userStat.userAds.length === 0 ? (
                    <div className="text-center py-4 bg-muted/20 border border-dashed border-border/60 rounded-2xl text-2xs text-muted-foreground">
                      لا توجد إعلانات منشورة لهذا المستخدم بعد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {userStat.userAds.map((ad) => {
                        const thumbUrl = ad.imageUrls?.[0] || ad.imageUrl || (ad as any).videoThumbnail || `https://avatar.vercel.sh/${ad.id}.png`;

                        return (
                          <Link
                            key={ad.id}
                            href={`/ad/${ad.userId || selectedUser.id}/${ad.id}`}
                            target="_blank"
                            className="group relative flex flex-col rounded-xl overflow-hidden border border-border/80 bg-card hover:border-primary hover:shadow-md transition-all text-right"
                            title={`${ad.title} - انقر للمعاينة`}
                          >
                            <div className="relative aspect-square w-full bg-muted overflow-hidden">
                              <Image
                                src={thumbUrl}
                                alt={ad.title || 'إعلان'}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              {ad.featuredTier === 'gold' && (
                                <span className="absolute top-1 right-1 bg-amber-500 text-white text-3xs font-bold px-1 rounded shadow">
                                  🥇
                                </span>
                              )}
                              {ad.featuredTier === 'silver' && (
                                <span className="absolute top-1 right-1 bg-slate-500 text-white text-3xs font-bold px-1 rounded shadow">
                                  🥈
                                </span>
                              )}
                              {ad.status !== 'active' && (
                                <span className="absolute bottom-1 right-1 bg-black/75 text-white text-3xs px-1 rounded">
                                  {ad.status === 'sold' ? 'مباع' : (ad.status === 'rejected' ? 'مرفوض' : 'معلق')}
                                </span>
                              )}
                            </div>
                            <div className="p-1.5 space-y-0.5">
                              <p className="text-3xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {ad.title || 'إعلان بدون عنوان'}
                              </p>
                              {typeof ad.price === 'number' && (
                                <p className="text-3xs font-bold text-primary font-mono truncate" dir="ltr">
                                  {ad.price.toLocaleString('en-US')} {ad.currency || 'ج.م'}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* زر الإغلاق */}
                <div className="w-full pt-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-bold text-xs"
                    onClick={() => setSelectedUser(null)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* نافذة التأكيد قبل تنفيذ الإجراء */}
      <AlertDialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <AlertDialogContent className="rounded-3xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-lg font-bold">
              {currentDialogContent?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {currentDialogContent?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel onClick={closeDialog} className="rounded-xl font-bold">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction} 
              className={cn(
                "rounded-xl font-bold",
                currentDialogContent?.confirmVariant === 'destructive' 
                  ? 'bg-rose-600 text-white hover:bg-rose-700' 
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
