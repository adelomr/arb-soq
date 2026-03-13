import { getForumCategories } from "@/lib/forum-service";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageSquare, Plus, ChevronLeft, LayoutDashboard, Users, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import * as lucideIcons from 'lucide-react';

export const metadata: Metadata = {
  title: "المنتدى | سوق العرب",
  description: "منتدى سوق العرب لتبادل الخبرات وحلول المشاكل التقنية والصيانة.",
};

export const revalidate = 60;

export default async function ForumHomePage() {
  const categories = await getForumCategories();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 gap-6 text-right" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-headline">منتدى سوق العرب</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              منصة تفاعلية لمشاركة حلول الصيانة، الخبرات التقنية، وطرح الاستفسارات.
            </p>
          </div>
          <div className="flex gap-3">
             <Link href="/forum/new">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium flex items-center transition-all shadow-sm hover:shadow-md">
                <Plus className="w-5 h-5 ml-2" />
                مشاركة موضوع جديد
                </button>
            </Link>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-500">لا توجد أقسام في المنتدى بعد</h3>
            <p className="text-sm text-slate-400 mt-2">سيتم إضافة محتوى قريباً من قبل الإدارة.</p>
          </div>
        ) : (
          <div className="space-y-12" dir="rtl">
            {categories.filter(c => !c.parentId).map((mainCategory) => {
              const subs = categories.filter(c => c.parentId === mainCategory.id);
              const MainIcon = (lucideIcons as any)[mainCategory.icon] || LayoutDashboard;
              
              return (
                <div key={mainCategory.id} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <MainIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold font-headline text-slate-900 dark:text-white">
                      {mainCategory.name.ar}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subs.map((sub) => {
                       const SubIcon = (lucideIcons as any)[sub.icon] || MessageSquare;
                       return (
                        <Link 
                          href={`/forum/${sub.id}`} 
                          key={sub.id} 
                          className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                               <SubIcon className="h-6 w-6" />
                            </div>
                            
                            <div className="flex-grow">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                {sub.name.ar}
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                                {sub.description.ar}
                              </p>
                              <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {sub.threadCount || 0} موضوع
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                       );
                    })}
                    {subs.length === 0 && (
                      <div className="md:col-span-2 lg:col-span-3 p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                        <p className="text-slate-400 text-sm">هذا القسم الرئيسي لا يحتوي على أقسام فرعية بعد.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
