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
  MessageSquare,
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
  sellerId?: string;
}

const INITIAL_SHOW_COUNT = 4;

export default function CommentsSection({ entityId, entityType, sellerId }: CommentsSectionProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
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

  const visibleComments = showAll ? comments : comments.slice(0, INITIAL_SHOW_COUNT);

  return (
    <div className="space-y-6" dir="rtl">

      {/* === Header Card === */}
      <div className="rounded-2xl border bg-card shadow-sm p-5">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          التعليقات
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          اطرح سؤالك أو شارك رأيك حول هذا الإعلان
        </p>
      </div>

      {/* === Write a Comment Form === */}
      {user ? (
        <div className="rounded-2xl border bg-card shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            أضف تعليقك
          </h3>
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
              <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} />
              <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                {(userProfile?.name || user.displayName || 'م')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <form onSubmit={handleSubmit} className="flex-1 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="min-h-[90px] resize-none text-sm rounded-xl focus:ring-2 focus:ring-primary/40"
                dir="rtl"
                disabled={submitting}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="rounded-xl gap-2"
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
                {newComment.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setNewComment('')}
                    className="rounded-xl text-muted-foreground"
                  >
                    مسح
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-dashed border-border bg-muted/30 text-center">
          <p className="text-muted-foreground mb-3 font-medium">سجّل دخولك لإضافة تعليق</p>
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </Link>
          </Button>
        </div>
      )}

      {/* === Comments List === */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">جاري تحميل التعليقات...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">لا توجد تعليقات بعد. كن أول من يعلّق!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              {visibleComments.map((comment) => {
                const isOwner = user?.uid === comment.userId;
                const isSeller = sellerId ? comment.userId === sellerId : false;
                const isAdmin = userProfile?.role === 'admin';
                const canDelete = isOwner || isAdmin;

                return (
                  <div key={comment.id} className="px-5 py-5 group hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
                        <AvatarImage src={comment.userAvatar} />
                        <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                          {(comment.userName || 'م')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-semibold text-sm text-foreground leading-tight flex items-center gap-2">
                              {comment.userName}
                              {isSeller && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0 rounded font-bold">
                                  صاحب الإعلان
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {comment.createdAt?.toDate && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(comment.createdAt.toDate(), {
                                  addSuffix: true,
                                  locale: ar,
                                })}
                              </span>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => comment.id && handleDelete(comment.id, comment.userId)}
                                title="حذف التعليق"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Comment text */}
                        <p className="text-sm text-foreground/80 mt-2 leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more / less */}
            {comments.length > INITIAL_SHOW_COUNT && (
              <div className="border-t px-5 py-3">
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
                  {showAll ? 'عرض أقل' : `عرض كل التعليقات (${comments.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
