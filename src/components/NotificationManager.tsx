
'use client';

import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Search, CheckCircle, BellRing } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const translations = {
  ar: {
    title: 'إدارة الإشعارات',
    description: 'أرسل إشعارات إلى مستخدمين محددين أو إلى جميع المستخدمين.',
    message: 'رسالة الإشعار',
    messagePlaceholder: 'اكتب رسالتك هنا...',
    notificationType: 'نوع الإشعار',
    general: 'عام (للجميع)',
    private: 'خاص (لمستخدم واحد)',
    selectUser: 'اختر مستخدمًا',
    noUserSelected: 'لم يتم اختيار مستخدم',
    sendNotification: 'إرسال الإشعار',
    sending: 'جارٍ الإرسال...',
    success: 'تم الإرسال بنجاح!',
    successDesc: 'تم إرسال الإشعار بنجاح.',
    error: 'خطأ',
    errorDesc: 'فشل إرسال الإشعار. حاول مرة أخرى.',
    errorUser: 'الرجاء اختيار مستخدم للإشعار الخاص.',
    errorMessage: 'الرجاء كتابة رسالة.',
    searchUser: 'ابحث عن مستخدم بالاسم أو البريد الإلكتروني...',
    noUsersFound: 'لم يتم العثور على مستخدمين.',
    selectedUser: 'المستخدم المختار:',
    fetchingUsers: 'جارٍ جلب المستخدمين...',
  },
  en: {
    title: 'Notification Management',
    description: 'Send notifications to specific users or to all users.',
    message: 'Notification Message',
    messagePlaceholder: 'Type your message here...',
    notificationType: 'Notification Type',
    general: 'General (to all)',
    private: 'Private (to one user)',
    selectUser: 'Select a user',
    noUserSelected: 'No user selected',
    sendNotification: 'Send Notification',
    sending: 'Sending...',
    success: 'Success!',
    successDesc: 'The notification was sent successfully.',
    error: 'Error',
    errorDesc: 'Failed to send notification. Please try again.',
    errorUser: 'Please select a user for a private notification.',
    errorMessage: 'Please enter a message.',
    searchUser: 'Search for a user by name or email...',
    noUsersFound: 'No users found.',
    selectedUser: 'Selected User:',
    fetchingUsers: 'Fetching users...',
  },
};

export default function NotificationManager() {
  const { getAllUsers, sendNotification, sendGeneralNotification } = useAuth();
  const { language, direction } = useLanguage();
  const t = translations[language];

  const [users, setUsers] = useState<(UserProfile & { id: string })[]>([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'general' | 'private'>('general');
  const [selectedUser, setSelectedUser] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsFetchingUsers(true);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        toast({ title: t.error, description: t.errorDesc, variant: 'destructive' });
      } finally {
        setIsFetchingUsers(false);
      }
    };
    fetchUsers();
  }, [getAllUsers, t.error, t.errorDesc, toast]);
  
  const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!message) {
      toast({ title: t.error, description: t.errorMessage, variant: 'destructive' });
      return;
    }
    if (type === 'private' && !selectedUser) {
      toast({ title: t.error, description: t.errorUser, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'private' && selectedUser) {
        await sendNotification(selectedUser, message, 'private');
      } else {
        await sendGeneralNotification(message);
      }
      toast({ title: t.success, description: t.successDesc });
      setMessage('');
      setSelectedUser(undefined);
      setSearchQuery('');
    } catch (e) {
      toast({ title: t.error, description: t.errorDesc, variant: 'destructive' });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUserInfo = users.find(u => u.id === selectedUser);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-headline">
          <BellRing className="h-6 w-6 md:h-8 md:w-8"/>
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="message" className="text-base">{t.message}</Label>
          <Textarea
            id="message"
            placeholder={t.messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-32"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base">{t.notificationType}</Label>
          <RadioGroup value={type} onValueChange={(v) => setType(v as 'general' | 'private')} className="flex gap-4 pt-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="cursor-pointer">{t.general}</Label>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="cursor-pointer">{t.private}</Label>
            </div>
          </RadioGroup>
        </div>

        {type === 'private' && (
          <div className="space-y-4 rounded-lg border bg-background p-4">
             <Label className="text-base font-semibold">{t.selectUser}</Label>
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === 'rtl' ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t.searchUser}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${direction === 'rtl' ? 'pr-10' : 'pl-10'}`}
              />
            </div>
             {isFetchingUsers ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="mx-2">{t.fetchingUsers}</span>
                </div>
             ) : (
                <ScrollArea className="h-48">
                    <div className="p-1 space-y-1">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                        <button 
                            key={user.id} 
                            onClick={() => setSelectedUser(user.id)}
                            className={`w-full text-sm p-2 rounded-md text-left flex justify-between items-center transition-colors ${selectedUser === user.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Image
                                    alt={user.name}
                                    className="aspect-square rounded-full object-cover"
                                    height="32"
                                    src={user.avatarUrl || `https://avatar.vercel.sh/${user.id}.png`}
                                    width="32"
                                />
                                <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className={selectedUser === user.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}>{user.email}</div>
                                </div>
                            </div>
                            {selectedUser === user.id && <CheckCircle className="h-5 w-5" />}
                        </button>
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground p-4 h-full flex items-center justify-center">
                            {t.noUsersFound}
                        </div>
                    )}
                    </div>
                </ScrollArea>
             )}
            {selectedUserInfo && (
                <div className="text-sm p-2 bg-secondary rounded-md text-secondary-foreground">
                    <span className="font-semibold">{t.selectedUser}</span> {selectedUserInfo.name} ({selectedUserInfo.email})
                </div>
            )}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className={`h-4 w-4 animate-spin ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t.sending}
            </>
          ) : (
            <>
              <Send className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t.sendNotification}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
