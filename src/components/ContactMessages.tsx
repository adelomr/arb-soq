'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Trash2, CheckCircle2, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'unread' | 'read';
    timestamp: Timestamp;
}

export default function ContactMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(firestore, 'contact_messages'), orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ContactMessage));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(firestore, 'contact_messages', id), {
                status: 'read'
            });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const deleteMessage = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
        try {
            await deleteDoc(doc(firestore, 'contact_messages', id));
            toast({
                title: "تم الحذف",
                description: "تم حذف الرسالة بنجاح.",
            });
        } catch (error) {
            console.error("Error deleting message:", error);
            toast({
                title: "خطأ",
                description: "فشل حذف الرسالة.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <Card className="text-center p-12">
                <CardContent>
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">لا توجد رسائل حالياً.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((msg) => (
                <Card key={msg.id} className={`${msg.status === 'unread' ? 'border-primary shadow-sm' : ''} transition-all`}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {msg.name}
                                        {msg.status === 'unread' && (
                                            <Badge variant="default" className="bg-primary text-[10px] h-4">جديد</Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <a href={`mailto:${msg.email}`} className="hover:underline text-primary/80">
                                            {msg.email}
                                        </a>
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                    <Clock className="h-3 w-3" />
                                    {msg.timestamp ? format(msg.timestamp.toDate(), 'PPP p', { locale: ar }) : 'غير معروف'}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-secondary/30 p-4 rounded-lg mb-4">
                            <h4 className="font-bold text-sm mb-2 text-primary">{msg.subject}</h4>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            {msg.status === 'unread' && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => markAsRead(msg.id)}
                                    className="gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    تحديد كمقروء
                                </Button>
                            )}
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => deleteMessage(msg.id)}
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                حذف
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
