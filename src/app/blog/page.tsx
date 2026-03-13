import { getAllBlogs } from "@/lib/blog-service";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "المدونة | سوق العرب",
  description: "أحدث المقالات والأخبار التقنية ونصائح الصيانة على موقع سوق العرب.",
};

export const revalidate = 60; // revalidate every 60 seconds

export default async function BlogListingPage() {
  const blogs = await getAllBlogs();

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border mb-10 gap-6 text-right" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-foreground">مدونة سوق العرب</h1>
            <p className="text-muted-foreground mt-2">
              أحدث المقالات والأخبار التقنية ونصائح الصيانة.
            </p>
          </div>
          <Link href="/admin/blog/new">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium flex items-center transition-all shadow-sm hover:shadow-md">
              <Plus className="w-5 h-5 ml-2" />
              إضافة تدوينة جديدة
            </button>
          </Link>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <h3 className="text-xl font-medium text-muted-foreground">لا توجد مقالات بعد</h3>
            <p className="text-sm text-muted-foreground mt-2">سيتم إضافة محتوى قريباً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link href={`/blog/${blog.slug}`} key={blog.id} className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border">
                {/* Image */}
                <div className="relative w-full h-48 bg-muted overflow-hidden">
                  {blog.imageUrl ? (
                    <Image
                      src={blog.imageUrl}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      لا توجد صورة
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex gap-2 mb-3 max-w-full overflow-hidden">
                    {blog.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full inline-block">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {blog.title}
                  </h2>
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-6" dangerouslySetInnerHTML={{ __html: blog.content?.substring(0, 150) + "..." }} />
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-4">
                    <div className="flex items-center gap-1">
                      <span>{blog.author}</span>
                      <svg className="w-3 h-3 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <span>
                      {blog.createdAt?.seconds 
                        ? format(new Date(blog.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: ar })
                        : "حديثاً"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
