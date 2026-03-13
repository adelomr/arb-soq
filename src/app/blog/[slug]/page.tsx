import { getBlogBySlug, getAllBlogs } from "@/lib/blog-service";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import 'react-quill/dist/quill.snow.css'; // basic styling for WYSIWYG content

// export const revalidate = 60; // Set this if you want background revalidation


type Props = {
  params: Promise<{ slug: string }>;
};

// Generate static params for faster initial load
export async function generateStaticParams() {
  try {
    const blogs = await getAllBlogs();
    return blogs
      .filter(blog => blog && blog.slug)
      .map((blog) => ({
        slug: blog.slug,
      }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

// Next.js dynamic metadata generation for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const blog = await getBlogBySlug(p.slug);
  
  if (!blog) {
    return { title: 'المقالة غير موجودة | سوق العرب' };
  }

  return {
    title: `${blog.title} | سوق العرب`,
    description: blog.content.substring(0, 150).replace(/<[^>]+>/g, ''), // strip HTML
    openGraph: {
      images: blog.imageUrl ? [blog.imageUrl] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const p = await params;
  const blog = await getBlogBySlug(p.slug);

  if (!blog) {
    notFound(); // Triggers 404 page
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <main className="max-w-4xl mx-auto bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        
        {/* Header Image */}
        {blog.imageUrl && (
          <div className="relative w-full h-[40vh] min-h-[300px] bg-muted">
            <Image
              src={blog.imageUrl}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="p-8 md:p-12">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمدونة
          </Link>

          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags?.map((tag, i) => (
              <span key={i} className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center justify-between border-b border-border/50 pb-8 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {blog.author.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium text-foreground">{blog.author}</p>
                  <svg className="w-4 h-4 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <p>الكاتب الموثق</p>
              </div>
            </div>
            <div>
              {blog.createdAt?.seconds 
                ? format(new Date(blog.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: ar })
                : "حديثاً"}
            </div>
          </div>

          {/* Render Rich Text Content */}
          <article 
            className="prose prose-lg dark:prose-invert max-w-none 
              prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:border"
            dangerouslySetInnerHTML={{ __html: blog.content }} 
          />
        </div>
      </main>
    </div>
  );
}
