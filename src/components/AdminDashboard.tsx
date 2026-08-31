
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, Ad } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
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
  Phone
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

type UserFilterType = 'all' | 'gold' | 'silver' | 'regular' | 'admin' | 'suspended';

export default function AdminDashboard() {
  const { user: currentUser, getAllUsers, updateUserProfile } = useAuth();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, action: null, user: null });
  const [filter, setFilter] = useState<UserFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const t = translations.ar;
  const { toast } = useToast();

  const fetchUsersAndAds = async () => {
    setLoading(true);
    try {
      const [allUsers, adsSnap] = await Promise.all([
        getAllUsers(),
        getDocs(collection(firestore, 'ads')).catch(() => null),
      ]);
      setUsers(allUsers || []);

      if (adsSnap && !adsSnap.empty) {
        const fetchedAds: Ad[] = [];
        adsSnap.forEach((docSnap) => {
          fetchedAds.push({ id: docSnap.id, ...docSnap.data() } as Ad);
        });
        setAds(fetchedAds);
      }
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
    };
  };

  // حساب الإحصائيات الكلية للباقات والمستخدمين
  const stats = useMemo(() => {
    const now = new Date();
    let goldSubscribers = 0;
    let silverSubscribers = 0;
    let regularUsers = 0;
    let adminUsers = 0;
    let suspendedUsers = 0;

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
    };
  }, [users, ads]);

  // تصفية المستخدمين بناءً على الفلتر والبحث
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const userStat = getUserStats(u.id);

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
        return matchName || matchEmail || matchPhone;
      }

      return true;
    });
  }, [users, ads, filter, searchQuery]);

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

                    return (
                      <TableRow 
                        key={user.id} 
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          isCurrentAuthUser && "bg-primary/5 font-semibold"
                        )}
                      >
                        {/* المستخدم */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Image
                              alt={user.name || user.email || 'صورة المستخدم'}
                              className="aspect-square rounded-full object-cover border border-border/80"
                              height={38}
                              src={user.avatarUrl || `https://avatar.vercel.sh/${user.id}.png`}
                              width={38}
                            />
                            <div>
                              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
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
