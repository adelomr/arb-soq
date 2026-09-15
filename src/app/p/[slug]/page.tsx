import { getPageBySlug, getAllPages } from "@/lib/page-service";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactPageClient from "@/components/ContactPageClient";
import ContentWrapper from "@/components/ContentWrapper";
import LandingPageClient from "@/components/LandingPageClient";
import AdPageClient from "@/components/AdPageClient";
import PageViewIncrementer from "@/components/PageViewIncrementer";

export const revalidate = 60;


type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
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
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const p = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams?.preview === 'true';
  const slug = decodeURIComponent(p.slug);
  const page = await getPageBySlug(slug);
  
  if (!page || (!page.isPublished && !isPreview)) {
    return { title: 'الصفحة غير موجودة | سوق العرب' };
  }

  // Strip HTML for clean description
  const cleanDescription = (page.description || page.content || '').substring(0, 150).replace(/<[^>]+>/g, '');

  const canonicalUrl = `https://www.arb-soq.com/p/${page.slug}`;
  const cleanDesc = (page.description || page.content || '').substring(0, 160).replace(/<[^>]+>/g, '');

  return {
    title: `${page.title}${!page.isPublished ? ' (مسودة)' : ''} | سوق العرب`,
    description: cleanDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    // منع فهرسة المسودات نهائياً
    robots: {
      index: page.isPublished,
      follow: page.isPublished,
    },
    openGraph: {
      type: 'website',
      locale: 'ar_SA',
      url: canonicalUrl,
      siteName: 'سوق العرب',
      title: page.title,
      description: cleanDesc,
      ...(page.coverImageUrl && {
        images: [{ url: page.coverImageUrl, width: 1200, height: 630, alt: page.title }],
      }),
    },
  };
}

export default async function CustomPageDetail({ params, searchParams }: Props) {
  const p = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams?.preview === 'true';
  // Decode Arabic or special-character slugs encoded in the URL
  const slug = decodeURIComponent(p.slug);
  const page = await getPageBySlug(slug);

  if (!page || (!page.isPublished && !isPreview)) {
    notFound(); // Triggers 404 page
  }

  const draftBanner = !page.isPublished ? (
    <div className="bg-yellow-500/15 border-b border-yellow-500/30 py-2.5 px-4 text-center text-yellow-800 dark:text-yellow-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md" dir="rtl">
      <span>⚠️ وضع المعاينة الإداري: هذه الصفحة حالياً في حالة (مسودة) وهي مخفية وغير مرئية لزوار الموقع.</span>
    </div>
  ) : null;

  // ===== صفحات إعلانية: عرض AdPageClient دائماً =====
  if (page.pageType === 'adpage' && page.adpageCategoryId) {
    const serializedPage = {
      ...page,
      adpageMode: 'showcase' as const, // دائماً showcase بغض النظر عن القيمة المخزنة
      createdAt: page.createdAt?.seconds ?? null,
      updatedAt: page.updatedAt?.seconds ?? null,
    };

    const adpageJsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: page.title,
        description: (page.description || page.content || '').replace(/<[^>]+>/g, '').substring(0, 200),
        url: `https://www.arb-soq.com/p/${page.slug}`,
        inLanguage: 'ar-SA',
        isPartOf: {
          '@type': 'WebSite',
          name: 'سوق العرب',
          url: 'https://www.arb-soq.com',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://www.arb-soq.com' },
          { '@type': 'ListItem', position: 2, name: page.title, item: `https://www.arb-soq.com/p/${page.slug}` },
        ],
      },
    ];

    return (
      <main className="min-h-screen bg-background">
        {draftBanner}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(adpageJsonLd) }}
        />
        <AdPageClient page={serializedPage as any} />
        <PageViewIncrementer pageId={page.id} />
      </main>
    );
  }



  // ===== صفحات الهبوط: عرض احترافي مخصص =====
  if (page.pageType === 'landing') {
    // JSON-LD للأعمال المحلية لصفحات الهبوط
    const landingJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: page.serviceName || page.title,
      description: (page.description || page.content || '').replace(/<[^>]+>/g, '').substring(0, 200),
      url: `https://www.arb-soq.com/p/${page.slug}`,
      ...(page.coverImageUrl && { image: page.coverImageUrl }),
      ...(page.phoneNumber && { telephone: page.phoneNumber }),
      ...(page.whatsappNumber && { telephone: page.whatsappNumber }),
      ...(page.serviceArea && {
        areaServed: { '@type': 'Place', name: page.serviceArea },
        address: { '@type': 'PostalAddress', addressLocality: page.serviceArea },
      }),
      ...(page.features && page.features.length > 0 && {
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'خدماتنا',
          itemListElement: page.features.map((f, i) => ({
            '@type': 'Offer',
            position: i + 1,
            name: f.title,
            description: f.desc,
          })),
        },
      }),
    };

    // Serialize Firestore timestamps to avoid "plain objects only" Next.js error
    const serializedPage = {
      ...page,
      createdAt: page.createdAt?.seconds ?? null,
      updatedAt: page.updatedAt?.seconds ?? null,
    };
    return (
      <main className="min-h-screen bg-background">
        {draftBanner}
        {page.googleAdsTagId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${page.googleAdsTagId.trim()}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${page.googleAdsTagId.trim()}');`,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
        />
        {page.customHeadScript && (
          <div
            dangerouslySetInnerHTML={{ __html: page.customHeadScript }}
            style={{ display: 'none' }}
          />
        )}
        <LandingPageClient page={serializedPage as any} />
        <PageViewIncrementer pageId={page.id} />
      </main>
    );
  }

  // ===== الصفحات العادية: العرض الكلاسيكي =====
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {draftBanner}
      <Header />
      <PageViewIncrementer pageId={page.id} />

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
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
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
