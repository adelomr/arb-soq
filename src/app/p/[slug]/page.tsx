import { getPageBySlug, getAllPages, incrementPageViews } from "@/lib/page-service";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactPageClient from "@/components/ContactPageClient";
import ContentWrapper from "@/components/ContentWrapper";
import LandingPageClient from "@/components/LandingPageClient";

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate static params for faster initial load
export async function generateStaticParams() {
  try {
    const pages = await getAllPages();
    return pages
      .filter(page => page && page.slug && page.isPublished)
      .map((page) => ({
        slug: page.slug,
      }));
  } catch (error) {
    console.error("Error in generateStaticParams for pages:", error);
    return [];
  }
}

// Next.js dynamic metadata generation for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const slug = decodeURIComponent(p.slug);
  const page = await getPageBySlug(slug);
  
  if (!page || !page.isPublished) {
    return { title: 'الصفحة غير موجودة | سوق العرب' };
  }

  // Strip HTML for clean description
  const cleanDescription = (page.description || page.content || '').substring(0, 150).replace(/<[^>]+>/g, '');

  return {
    title: `${page.title} | سوق العرب`,
    description: cleanDescription,
    openGraph: page.coverImageUrl ? {
      images: [{ url: page.coverImageUrl }],
      title: page.title,
      description: cleanDescription,
    } : undefined,
  };
}

export default async function CustomPageDetail({ params }: Props) {
  const p = await params;
  // Decode Arabic or special-character slugs encoded in the URL
  const slug = decodeURIComponent(p.slug);
  const page = await getPageBySlug(slug);

  if (!page || !page.isPublished) {
    notFound(); // Triggers 404 page
  }

  if (page.id) {
    try { await incrementPageViews(page.id); } catch {}
  }

  // ===== صفحات الهبوط: عرض احترافي مخصص =====
  if (page.pageType === 'landing') {
    // Serialize Firestore timestamps to avoid "plain objects only" Next.js error
    const serializedPage = {
      ...page,
      createdAt: page.createdAt?.seconds ?? null,
      updatedAt: page.updatedAt?.seconds ?? null,
    };
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1">
          <LandingPageClient page={serializedPage as any} />
        </main>
        <Footer />
      </div>
    );
  }

  // ===== الصفحات العادية: العرض الكلاسيكي =====
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 py-12 md:py-16 px-4">
        {/* Special handling for the contact page — show interactive form */}
        {slug === 'contact' ? (
          <ContactPageClient title={page.title} content={page.content} />
        ) : (
          <article className="max-w-4xl mx-auto bg-card p-6 md:p-12 rounded-3xl shadow-sm border border-border text-right" dir="rtl">
            
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-8 pb-4 border-b border-border/60">
              {page.title}
            </h1>

            {/* Render Rich Text Content with custom styling wrapper */}
            <ContentWrapper
              html={page.content}
              className="custom-page-content text-foreground/90 font-body text-base leading-relaxed"
            />
          </article>
        )}
      </main>

      <Footer />

      {/* Embedded CSS for Rich Text Editor formatting inside the custom page */}
      <style>{`
        .custom-page-content {
          font-size: 16px;
          line-height: 1.8;
        }
        .custom-page-content p {
          margin-bottom: 1.25rem;
        }
        .custom-page-content h1, 
        .custom-page-content h2, 
        .custom-page-content h3 {
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .custom-page-content h1 { font-size: 1.8rem; }
        .custom-page-content h2 { font-size: 1.5rem; }
        .custom-page-content h3 { font-size: 1.25rem; }
        .custom-page-content ul, 
        .custom-page-content ol {
          margin-top: 1rem;
          margin-bottom: 1.25rem;
          padding-right: 1.75rem;
          padding-left: 0;
        }
        .custom-page-content ul {
          list-style-type: disc;
        }
        .custom-page-content ol {
          list-style-type: decimal;
        }
        .custom-page-content li {
          margin-bottom: 0.5rem;
        }
        .custom-page-content a:not(.contact-btn-wrapper) {
          color: hsl(var(--primary));
          text-decoration: underline;
          font-weight: 500;
        }
        .custom-page-content a:not(.contact-btn-wrapper):hover {
          color: hsl(var(--accent));
        }
        .custom-page-content .contact-btn-wrapper {
          text-decoration: none !important;
          color: transparent !important;
          background: none !important;
          padding: 0 !important;
          font-weight: normal !important;
        }
        .custom-page-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          display: block;
          margin: 1.5rem auto;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .custom-page-content blockquote {
          border-right: 4px solid hsl(var(--primary));
          border-left: 0;
          padding-right: 1.25rem;
          padding-left: 0;
          margin: 1.5rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .custom-page-content pre {
          background-color: hsl(var(--muted));
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          font-family: monospace;
          direction: ltr;
          text-align: left;
          margin-bottom: 1.25rem;
        }
      `}</style>
    </div>
  );
}
