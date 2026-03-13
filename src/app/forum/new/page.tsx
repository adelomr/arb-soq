'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  getForumCategories, 
  createForumThread 
} from "@/lib/forum-service";
import { ForumCategory } from "@/lib/forum-types";
import { useAuth } from "@/context/AuthContext";
import { 
    MessageSquare, 
    ArrowRight, 
    Send, 
    Loader2, 
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NewThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCatId = searchParams.get('cat');
  
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(initialCatId || "");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getForumCategories();
        setCategories(data);
        if (!categoryId && data.length > 0) {
            setCategoryId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        router.push('/login');
        return;
    }

    if (!title.trim() || !categoryId || !content.trim()) {
        setError("يرجى إكمال جميع الحقول المطلوبة.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
        const threadId = await createForumThread({
            categoryId,
            title,
            content,
            authorId: user.uid,
            authorName: userProfile?.name || user.displayName || 'مستخدم',
            authorAvatar: userProfile?.avatarUrl || undefined,
            isPinned: false,
            isLocked: false,
            isSolved: false,
        });
        
        toast({
            title: "تم نشر الموضوع بنجاح",
            description: "سيتم توجيهك الآن إلى الموضوع الجديد.",
        });
        
        router.push(`/forum/thread/${threadId}`);
    } catch (error) {
        console.error("Error creating thread:", error);
        setError("حدث خطأ أثناء نشر الموضوع. يرجى المحاولة مرة أخرى.");
        toast({
            title: "خطأ",
            description: "فشل في إنشاء الموضوع.",
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

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
            <div className="text-right">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-headline">إضافة موضوع جديد</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">شارك خبراتك أو اطرح استفساراتك في المنتدى.</p>
            </div>
            <Link href="/forum" className="flex items-center text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                العودة للمنتدى
                <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
            </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">قسم المنتدى <span className="text-red-500">*</span></label>
                    <select 
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all appearance-none"
                        required
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name.ar}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">عنوان الموضوع <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="اكتب عنواناً جذاباً لموضوعك..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المحتوى <span className="text-red-500">*</span></label>
                    <textarea 
                        className="w-full min-h-[300px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all resize-none"
                        placeholder="اكتب محتوى الموضوع بالتفصيل هنا..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                </div>

                <div className="pt-4 flex justify-start">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-3.5 rounded-xl font-medium flex items-center transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        ) : (
                            <Send className="h-5 w-5 ml-2" />
                        )}
                        نشر الموضوع
                    </button>
                </div>
            </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
