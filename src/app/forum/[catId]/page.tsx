import { getForumThreads, getForumCategories } from "@/lib/forum-service";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageSquare, Plus, ArrowRight, User, Clock, MessageCircle, Pin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface CategoryPageProps {
  params: {
    catId: string;
  };
}

export default async function ForumCategoryPage({ params }: CategoryPageProps) {
  const { catId } = params;
  const categories = await getForumCategories();
  const category = categories.find(c => c.id === catId);
  const threads = await getForumThreads(catId);

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">القسم غير موجود</h1>
        <Link href="/forum" className="text-primary hover:underline">العودة للمنتدى</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/forum" className="hover:text-primary transition-colors">المنتدى</Link>
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span className="text-slate-600 dark:text-slate-300">{category.name.ar}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 gap-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-headline">{category.name.ar}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{category.description.ar}</p>
          </div>
          <Link href={`/forum/new?cat=${catId}`}>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium flex items-center transition-all shadow-sm w-full md:w-auto justify-center">
              <Plus className="w-5 h-5 ml-2" />
              موضوع جديد
            </button>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {threads.length === 0 ? (
            <div className="text-center py-20">
               <MessageCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400">لا توجد مواضيع في هذا القسم بعد.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {threads.map((thread) => (
                <div key={thread.id} className={`p-4 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4 ${thread.isPinned ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  <div className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                    {thread.authorAvatar ? (
                        <img src={thread.authorAvatar} alt={thread.authorName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.isPinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary" />}
                      {thread.isSolved && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                      <Link href={`/forum/thread/${thread.id}`} className="text-lg font-bold text-slate-900 dark:text-white hover:text-primary transition-colors line-clamp-1">
                        {thread.title}
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {thread.authorName}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(thread.createdAt.toDate(), { addSuffix: true, locale: ar })}
                        </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-8 px-4 flex-shrink-0">
                    <div className="text-center min-w-[60px]">
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{thread.replyCount || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">ردود</span>
                    </div>
                    <div className="hidden sm:block text-center min-w-[60px]">
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">{thread.viewCount || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">مشاهدة</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
