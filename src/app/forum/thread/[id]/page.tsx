'use client';

import { useState, useEffect, useRef } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  getForumThreadById, 
  getForumReplies, 
  createForumReply,
  getForumCategories 
} from "@/lib/forum-service";
import { ForumThread, ForumReply, ForumCategory } from "@/lib/forum-types";
import { useAuth } from "@/context/AuthContext";
import { 
    User, 
    Clock, 
    MessageCircle, 
    ArrowRight, 
    Send, 
    Loader2, 
    CheckCircle2, 
    PinIcon, 
    Share2,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function ThreadViewPage() {
  const { id } = useParams();
  const threadId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!threadId) return;
      try {
        const [threadData, categories] = await Promise.all([
          getForumThreadById(threadId),
          getForumCategories()
        ]);
        
        if (threadData) {
          setThread(threadData);
          setCategory(categories.find(c => c.id === threadData.categoryId) || null);
          const repliesData = await getForumReplies(threadId);
          setReplies(repliesData);
        }
      } catch (error) {
        console.error("Error fetching thread data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        router.push('/login');
        return;
    }
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
        await createForumReply({
            threadId: threadId!,
            content: replyContent,
            authorId: user.uid,
            authorName: userProfile?.name || user.displayName || 'مستخدم',
            authorAvatar: userProfile?.avatarUrl || undefined,
        });
        
        // Refresh replies
        const newReplies = await getForumReplies(threadId!);
        setReplies(newReplies);
        setReplyContent("");
        toast({
            title: "تمت إضافة الرد",
            description: "شكراً لمشاركتك في المناقشة.",
        });
    } catch (error) {
        console.error("Error posting reply:", error);
        toast({
            title: "خطأ",
            description: "فشل في إضافة الرد. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <h1 className="text-2xl font-bold mb-4">الموضوع غير موجود</h1>
        <Link href="/forum" className="text-primary hover:underline">العودة للمنتدى</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/forum" className="hover:text-primary transition-colors">المنتدى</Link>
            <ArrowRight className="h-4 w-4 rotate-180" />
            {category && (
                <>
                    <Link href={`/forum/${category.id}`} className="hover:text-primary transition-colors">{category.name.ar}</Link>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                </>
            )}
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{thread.title}</span>
        </div>

        {/* Thread Header */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><PinIcon className="h-3 w-3" /> مثبت</span>}
                    {thread.isSolved && <span className="bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><CheckCircle2 className="h-3 w-3" /> تم الحل</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight font-headline">
                    {thread.title}
                </h1>
            </div>
            <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-primary transition-colors border border-slate-100 dark:border-slate-800 rounded-xl" title="مشاركة">
                    <Share2 className="h-5 w-5" />
                </button>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                {thread.authorAvatar ? (
                    <img src={thread.authorAvatar} alt={thread.authorName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="h-6 w-6" />
                    </div>
                )}
              </div>
              <div className="flex-grow">
                <div className="font-bold text-slate-900 dark:text-white">{thread.authorName}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(thread.createdAt.toDate(), { addSuffix: true, locale: ar })}
                </div>
              </div>
          </div>

          <div className="mt-6 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap forum-content prose dark:prose-invert max-w-none">
            {thread.content}
          </div>
        </div>

        {/* Replies Section */}
        <div className="space-y-6 mb-10">
            <div className="flex items-center gap-3 px-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">الردود ({replies.length})</h2>
            </div>

            {replies.map((reply, index) => (
                <div key={reply.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-slate-50 dark:bg-slate-800"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                            {reply.authorAvatar ? (
                                <img src={reply.authorAvatar} alt={reply.authorName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                    <User className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{reply.authorName}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true, locale: ar })}
                            </div>
                        </div>
                        <div className="text-xs font-mono text-slate-300">#{index + 1}</div>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                        {reply.content}
                    </div>
                </div>
            ))}
        </div>

        {/* Reply Editor */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-primary/20 dark:border-primary/10 shadow-lg shadow-primary/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                أضف رداً
            </h3>
            {user ? (
                <form onSubmit={handleReply} className="space-y-4">
                    <textarea 
                        className="w-full min-h-[150px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all text-sm resize-none"
                        placeholder="اكتب ردك هنا..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        required
                    ></textarea>
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !replyContent.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium flex items-center transition-all disabled:opacity-50 shadow-md hover:shadow-lg disabled:hover:shadow-none"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4 ml-2" />
                                    إضافة الرد
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 mb-4 text-sm">يجب عليك تسجيل الدخول لتتمكن من الرد.</p>
                    <Link href="/login">
                        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium">تسجيل الدخول</button>
                    </Link>
                </div>
            )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
