
'use client';

import { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import Link from 'next/link';
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
import { MoreHorizontal, Ban, Trash2, UserCheck, Users, Loader2, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const translations = {
  ar: {
    userManagement: 'إدارة المستخدمين',
    userManagementDesc: 'عرض وإدارة جميع المستخدمين في النظام.',
    user: 'المستخدم',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    status: 'الحالة',
    actions: 'الإجراءات',
    admin: 'مشرف',
    userRole: 'مستخدم',
    active: 'نشط',
    suspended: 'موقوف',
    deleted: 'محذوف',
    toggleMenu: 'تبديل القائمة',
    suspend: 'إيقاف',
    activate: 'تفعيل',
    delete: 'حذف',
    suspendUserTitle: 'هل أنت متأكد من إيقاف هذا المستخدم؟',
    suspendUserDesc: 'سيتم منع المستخدم من تسجيل الدخول والوصول إلى الموقع.',
    activateUserTitle: 'هل أنت متأكد من تفعيل هذا المستخدم؟',
    activateUserDesc: 'سيتمكن المستخدم من تسجيل الدخول والوصول إلى الموقع مرة أخرى.',
    deleteUserTitle: 'هل أنت متأكد من حذف هذا المستخدم؟',
    deleteUserDesc: 'سيتم تغيير حالة المستخدم إلى "محذوف" ومنعه من الوصول إلى التطبيق. لا يمكن التراجع عن هذا الإجراء بسهولة.',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    userSuspended: 'تم إيقاف المستخدم.',
    userActivated: 'تم تفعيل المستخدم.',
    userDeleted: 'تم حذف المستخدم.',
    error: 'خطأ',
    errorOccurred: 'حدث خطأ. الرجاء المحاولة مرة أخرى.',
    loadingUsers: 'جارٍ تحميل المستخدمين...',
  },
};

type UserWithId = UserProfile & { id: string };

type DialogState = {
  isOpen: boolean;
  action: 'suspend' | 'delete' | null;
  user: UserWithId | null;
}

export default function AdminDashboard() {
  const { user: currentUser, getAllUsers, updateUserProfile } = useAuth();
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, action: null, user: null });
  const t = translations.ar;
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (userToUpdate: UserWithId) => {
    try {
      const newStatus = userToUpdate.status === 'active' ? 'suspended' : 'active';
      await updateUserProfile(userToUpdate.id, { status: newStatus });
      toast({ title: newStatus === 'suspended' ? t.userSuspended : t.userActivated });
      await fetchUsers(); // Refresh users list
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Instead of deleting, we suspend and mark as deleted.
      await updateUserProfile(userId, { status: 'deleted' });
      toast({ title: t.userDeleted });
      await fetchUsers(); // Refresh users list
    } catch (e) {
      console.error(e);
      toast({ title: t.error, description: t.errorOccurred, variant: 'destructive' });
    }
  };

  const openDialog = (action: 'suspend' | 'delete', user: UserWithId) => {
    setDialogState({ isOpen: true, action, user });
  }
  
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, user: null });
  }

  const confirmAction = () => {
    if (!dialogState.action || !dialogState.user) return;
    if (dialogState.action === 'suspend') {
      handleToggleSuspend(dialogState.user);
    } else if (dialogState.action === 'delete') {
      handleDeleteUser(dialogState.user.id);
    }
    closeDialog();
  }


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center gap-3">
            <Users className="h-6 w-6 md:h-8 md:w-8"/>
            {t.userManagement}
          </CardTitle>
          <CardDescription>{t.userManagementDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mx-4 text-lg">{t.loadingUsers}</p>
        </CardContent>
      </Card>
    )
  }

  const isSuspended = dialogState.user?.status !== 'active';
  const DialogContentMap = {
    suspend: {
        title: isSuspended ? t.activateUserTitle : t.suspendUserTitle,
        description: isSuspended ? t.activateUserDesc : t.suspendUserDesc,
        confirmVariant: 'default' as const
    },
    delete: {
        title: t.deleteUserTitle,
        description: t.deleteUserDesc,
        confirmVariant: 'destructive' as const
    }
  }

  const currentDialogContent = dialogState.action ? DialogContentMap[dialogState.action] : null;


  return (
    <>
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-2xl md:text-3xl font-headline flex items-center gap-3">
              <Users className="h-6 w-6 md:h-8 md:w-8"/>
              {t.userManagement}
          </CardTitle>
          <CardDescription>{t.userManagementDesc}</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة مقالة للمدونة
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.user}</TableHead>
              <TableHead className="hidden md:table-cell">{t.email}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.role}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>
                <span className="sr-only">{t.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={user.id === currentUser?.uid ? 'bg-secondary/50' : ''}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      alt={user.name}
                      className="aspect-square rounded-full object-cover"
                      height="40"
                      src={user.avatarUrl || `https://avatar.vercel.sh/${user.id}.png`}
                      width="40"
                    />
                    <div className="font-medium">{user.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                <TableCell className="hidden sm:table-cell">
                   <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                       {user.role === 'admin' ? t.admin : t.userRole}
                   </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'} 
                         className={cn(
                           user.status === 'active' && 'border-green-500/50 bg-green-500/10 text-green-700',
                           user.status === 'suspended' && 'border-red-500/50 bg-red-500/10 text-red-700',
                           user.status === 'deleted' && 'border-gray-500/50 bg-gray-500/10 text-gray-700',
                         )}>
                    {user.status === 'active' ? t.active : (user.status === 'suspended' ? t.suspended : t.deleted)}
                  </Badge>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={user.id === currentUser?.uid}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t.toggleMenu}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={'start'}>
                          <DropdownMenuItem onSelect={() => openDialog('suspend', user)}>
                            {user.status === 'active' ? 
                              <><Ban className={'ml-2 h-4 w-4'} />{t.suspend}</> :
                              <><UserCheck className={'ml-2 h-4 w-4'} />{t.activate}</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => openDialog('delete', user)}>
                            <Trash2 className={'ml-2 h-4 w-4'} />
                            {t.delete}
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
    
      <AlertDialog open={dialogState.isOpen} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentDialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>{currentDialogContent?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className={cn(currentDialogContent?.confirmVariant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}>
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
