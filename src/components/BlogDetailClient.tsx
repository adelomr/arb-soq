'use client';

import { useEffect, useState } from 'react';
import { getBlogBySlug, incrementBlogViews } from '@/lib/blog-service';
import type { BlogPost } from '@/lib/blog-service';
import { getAuthorSettings } from '@/lib/blog-service';
import type { AuthorSettings } from '@/lib/blog-service';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ArrowRight, Calendar, Clock, Tag, User, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CommentsSection from '@/components/CommentsSection';
import ContentWrapper from '@/components/ContentWrapper';
import 'react-quill/dist/quill.snow.css';

const Header = dynamic(() => import('@/components/Header'), { ssr: false });
const QuickOptions = dynamic(() => import('@/components/QuickOptions'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

interface BlogDetailClientProps {
  slug: string;
}

function AuthorCard({ blog, authorSettings }: { blog: BlogPost; authorSettings: AuthorSettings | null }) {
  const authorName = authorSettings?.name || blog.author;
  const authorAvatar = authorSettings?.avatar || blog.authorAvatar || '';
  const authorBio = authorSettings?.bio || blog.authorBio || 'كاتب ومحرر في سوق العرب';
  const initials = authorName.charAt(0).toUpperCase();

  return (
    <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20" dir="rtl">
      <div className="flex items-center gap-4">
        <div className="relative">
          {authorAvatar ? (
            <Image
              src={authorAvatar}
              alt={authorName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
              <span className="text-primary font-bold text-2xl">{initials}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card"></div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground text-lg">{authorName}</h3>
            <svg className="w-4 h-4 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{authorBio}</p>
        </div>
      </div>
    </div>
  );
}

export default function BlogDetailClient({ slug }: BlogDetailClientProps) {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [authorSettings, setAuthorSettings] = useState<AuthorSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [b, a] = await Promise.all([getBlogBySlug(slug), getAuthorSettings()]);
      if (!active) return;
      setBlog(b);
      setAuthorSettings(a);
      setLoading(false);
      
      if (b?.id) {
        try {
          await incrementBlogViews(b.id);
        } catch (e) {
          console.error("Failed to increment blog views:", e);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);



  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <QuickOptions />
        <main className="flex-1 bg-background py-16 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <QuickOptions />
        <main className="flex-1 bg-background py-16 px-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">الموضوع غير موجود</h1>
            <Link href="/blog" className="text-primary hover:underline">
              العودة للمدونة
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const readingTime = Math.ceil((blog.content?.replace(/<[^>]+>/g, '').length || 0) / 200);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <QuickOptions />
      <main className="flex-1 bg-background py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <article className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                {/* Header Image */}
                {blog.imageUrl && (
                  <div className="relative w-full h-[40vh] min-h-[280px] bg-muted">
                    <Image
                      src={blog.imageUrl}
                      alt={blog.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                <div className="p-6 md:p-10" dir="rtl">
                  {/* Back Link */}
                  <Link
                    href="/blog"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
                  >
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:-translate-x-1 transition-transform" />
                    العودة للمدونة
                  </Link>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {blog.tags?.map((tag, i) => (
                      <span key={i} className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
                    {blog.title}
                  </h1>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/50 pb-7 mb-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {authorSettings?.name || blog.author}
                      </span>
                    </div>
                    {blog.createdAt?.seconds && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(blog.createdAt.seconds * 1000), 'd MMMM, yyyy', { locale: ar })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{readingTime} دقيقة قراءة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-primary" />
                      <span>{blog.views || 0} مشاهدة</span>
                    </div>
                  </div>

                  {/* Content */}
                  <ContentWrapper
                    html={blog.content}
                    className="prose prose-lg dark:prose-invert max-w-none
                      prose-headings:font-bold prose-headings:text-foreground
                      prose-p:text-muted-foreground prose-p:leading-relaxed
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-xl prose-img:border prose-img:max-w-full
                      prose-blockquote:border-r-4 prose-blockquote:border-primary prose-blockquote:pr-4 prose-blockquote:not-italic"
                  />
                  <style>{`
                    /* Download button — rendered in blog view from span[data-download-btn] */
                    .download-btn-wrapper {
                      display: inline-flex;
                      text-decoration: none !important;
                    }
                    span.download-btn-custom {
                      display: inline-flex;
                      align-items: center;
                      gap: 6px;
                      background: linear-gradient(135deg, #059669, #0d9488);
                      color: #fff;
                      border-radius: 8px;
                      padding: 6px 14px;
                      font-size: 14px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: opacity 0.2s;
                      user-select: none;
                      text-decoration: none;
                    }
                    span.download-btn-custom:hover {
                      opacity: 0.88;
                    }
                    /* ── Contact Buttons: prevent Prose from overriding them as plain links ── */
                    article.prose a.contact-btn-wrapper,
                    .prose a.contact-btn-wrapper {
                      color: transparent !important;
                      text-decoration: none !important;
                      font-weight: normal !important;
                      background: none !important;
                      padding: 0 !important;
                      display: inline-flex !important;
                      margin: 4px 2px !important;
                    }
                    article.prose a.contact-btn-wrapper span.contact-btn-custom,
                    .prose a.contact-btn-wrapper span.contact-btn-custom {
                      display: inline-flex !important;
                      align-items: center !important;
                      gap: 8px !important;
                      color: #fff !important;
                      font-weight: 700 !important;
                      padding: 10px 20px !important;
                      border-radius: 12px !important;
                      font-size: 14px !important;
                      text-decoration: none !important;
                      cursor: pointer !important;
                      transition: all 0.2s ease-in-out !important;
                    }
                    article.prose a.contact-btn-wrapper span.contact-btn-custom[data-contact-btn="whatsapp"],
                    .prose a.contact-btn-wrapper span.contact-btn-custom[data-contact-btn="whatsapp"] {
                      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
                      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3) !important;
                    }
                    article.prose a.contact-btn-wrapper span.contact-btn-custom[data-contact-btn="call"],
                    .prose a.contact-btn-wrapper span.contact-btn-custom[data-contact-btn="call"] {
                      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%) !important;
                      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
                    }
                  `}</style>

                  {/* Author Card */}
                  <AuthorCard blog={blog} authorSettings={authorSettings} />

                  {/* Comments */}
                  <CommentsSection entityId={blog.slug} entityType="blog" />
                </div>
              </article>
            </div>
          </main>
      <Footer />
    </div>
  );
}
