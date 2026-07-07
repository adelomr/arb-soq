'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToComments,
  addComment,
  deleteComment,
  type Comment,
} from '@/lib/comments-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  LogIn,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface CommentsSectionProps {
  entityId: string;
  entityType: 'blog' | 'ad';
}

export default function CommentsSection({ entityId, entityType }: CommentsSectionProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToComments(entityId, entityType, (data) => {
      setComments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [entityId, entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment({
        entityId,
        entityType,
        userId: user.uid,
        userName: userProfile?.name || user.displayName || 'مستخدم',
        userAvatar: userProfile?.avatarUrl || user.photoURL || '',
        content: newComment.trim(),
      });
      setNewComment('');
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال التعليق.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string, ownerId: string) => {
    if (!user) return;
    const isOwner = user.uid === ownerId;
    const isAdmin = userProfile?.role === 'admin';
    if (!isOwner && !isAdmin) return;

    try {
      await deleteComment(commentId);
      toast({ title: 'تم حذف التعليق' });
    } catch {
      toast({ title: 'فشل الحذف', variant: 'destructive' });
    }
  };

  return (
    <section className="mt-12 pt-10 border-t border-border/50" dir="rtl">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-full bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          التعليقات
          {comments.length > 0 && (
            <span className="mr-2 text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h2>
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="flex gap-3 items-start">
            <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
              <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {(userProfile?.name || user.displayName || 'م')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="resize-none bg-background border-border text-right min-h-[80px] focus:ring-primary"
                dir="rtl"
                disabled={submitting}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      إرسال التعليق
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-5 rounded-xl border border-dashed border-border bg-muted/30 text-center">
          <p className="text-muted-foreground mb-3">سجّل دخولك لإضافة تعليق</p>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </Link>
          </Button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>جاري تحميل التعليقات...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-xl">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">لا توجد تعليقات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">كن أول من يعلّق!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => {
            const isOwner = user?.uid === comment.userId;
            const isAdmin = userProfile?.role === 'admin';
            const canDelete = isOwner || isAdmin;

            return (
              <div
                key={comment.id}
                className="group flex gap-3 p-4 rounded-xl bg-card hover:bg-muted/30 transition-colors border border-border/30"
              >
                <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                  <AvatarImage src={comment.userAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {(comment.userName || 'م')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {comment.userName}
                      </span>
                      {comment.createdAt?.toDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      )}
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => comment.id && handleDelete(comment.id, comment.userId)}
                        title="حذف التعليق"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </section>
  );
}
