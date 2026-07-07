
'use client';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, MapPin, Target, MessageCircle, StarHalf, Loader2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: Props) {
  const { id } = use(params);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(firestore, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ id: docSnap.id, ...docSnap.data() });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]" dir="rtl">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </main>
            <Footer />
        </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]" dir="rtl">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center text-slate-500">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold font-headline mb-2">المستخدم غير موجود</h2>
                    <p>عذراً، لم يتم العثور على الملف الشخصي المطلوب.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8 relative">
            <div className="h-32 md:h-48 bg-gradient-to-l from-primary/20 via-primary/5 to-transparent w-full"></div>
            
            <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8 -mt-16 md:-mt-20 relative z-10">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg p-2 flex-shrink-0">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                            <User className="h-12 w-12 md:h-16 md:w-16" />
                        </div>
                    )}
                </div>
                
                <div className="flex-grow mb-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold font-headline text-slate-900 dark:text-white">
                            {user.name}
                        </h1>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit">
                            عضو {user.role === 'admin' ? 'إدارة' : 'نشط'}
                        </span>
                    </div>
                    {user.profession && (
                        <div className="text-slate-500 mb-2 flex items-center gap-1.5 text-sm font-medium">
                            <Target className="h-4 w-4" /> {user.profession} {user.specialization ? ` - ${user.specialization}` : ''}
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                        {user.country && (
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {user.country}{user.city ? `، ${user.city}` : ''}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pb-2">
                     <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md">
                         <MessageCircle className="h-4 w-4" /> إرسال رسالة
                     </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 border-t border-slate-100 dark:border-slate-800/80 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="p-4 md:p-6 text-center">
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-headline flex items-center justify-center gap-1">
                        {user.rating || 0}
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center justify-center gap-1"><StarHalf className="h-3 w-3" /> التقييم</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="text-lg font-bold font-headline mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">نبذة</h3>
                    <div className="space-y-4 text-sm">
                         <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                             <span className="text-slate-400">الحالة</span>
                             <span className="flex items-center gap-1 text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded"><span className="w-2 h-2 rounded-full bg-green-500"></span> نشط</span>
                         </div>
                    </div>
                 </div>
            </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
