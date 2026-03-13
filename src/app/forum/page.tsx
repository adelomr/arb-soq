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
          <div className="space-y-4" dir="rtl">
            {categories.map((category) => {
              const IconComponent = (lucideIcons as any)[category.icon] || MessageSquare;
              return (
                <Link 
                  href={`/forum/${category.id}`} 
                  key={category.id} 
                  className="group block bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="flex-grow">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                        {category.name.ar}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        {category.description.ar}
                      </p>
                    </div>

                    <div className="flex items-center gap-8 md:px-6 md:border-r border-slate-100 dark:border-slate-800">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">{category.threadCount || 0}</span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">موضوع</span>
                        </div>
                        <ChevronLeft className="h-6 w-6 text-slate-300 group-hover:text-primary group-hover:translate-x-[-4px] transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
