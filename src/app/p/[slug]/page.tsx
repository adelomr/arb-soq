import { getPageBySlug, getPageByLegacySlug, getAllPages, createPage } from "@/lib/page-service";
import { notFound, permanentRedirect } from "next/navigation";
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
  let page = await getPageBySlug(slug);
  
  if (!page) {
    page = await getPageByLegacySlug(slug);
  }
  
  if (!page || !page.isPublished) {
    return { title: 'الصفحة غير موجودة | سوق العرب' };
  }

  // Strip HTML for clean description
  const cleanDescription = (page.description || page.content || '').substring(0, 150).replace(/<[^>]+>/g, '');

  const canonicalUrl = `https://www.arb-soq.com/p/${page.slug}`;
  const cleanDesc = (page.description || page.content || '').substring(0, 160).replace(/<[^>]+>/g, '');

  return {
    title: `${page.title} | سوق العرب`,
    description: cleanDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    // السماح بفهرسة صفحات الهبوط لتعمل مع إعلانات جوجل
    robots: {
      index: page.pageType === 'landing' ? true : true,
      follow: true,
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

export default async function CustomPageDetail({ params }: Props) {
  const p = await params;
  // Decode Arabic or special-character slugs encoded in the URL
  const slug = decodeURIComponent(p.slug);
  let page = await getPageBySlug(slug);

  if (!page) {
    page = await getPageByLegacySlug(slug);
    if (page && page.isPublished) {
      // 301 Permanent Redirect to the new clean slug URL
      permanentRedirect(`/p/${page.slug}`);
    }
  }

  // ===== Auto-create known category pages if missing from Firebase =====
  if (!page) {
    const knownCategoryPages: Record<string, { title: string; categoryId: string; description: string; shortCode: string }> = {
      'cars-auto-parts':      { title: 'عربيات وقطع غيار', categoryId: 'vehicles',    shortCode: 'cars',        description: 'سوق السيارات والمركبات وقطع الغيار الشامل.' },
      'real-estate':          { title: 'عقارات',            categoryId: 'realestate',  shortCode: 'realestate',  description: 'سوق العقارات الشامل - شقق وفلل ومحلات وأراضي.' },
      'mobiles-tablets':      { title: 'موبايلات وتابلت',  categoryId: 'mobiles',     shortCode: 'mobiles',     description: 'سوق الهواتف والموبايلات والتابلت وإكسسواراتها.' },
      'jobs-careers':         { title: 'وظائف',            categoryId: 'jobs',        shortCode: 'jobs',        description: 'سوق الفرص الوظيفية والمهنية.' },
      'home-office-furniture':{ title: 'أثاث المنزل والمكتب', categoryId: 'furniture', shortCode: 'furniture',   description: 'سوق الأثاث المنزلي والمكتبي والديكور.' },
      'electronics-appliances':{ title: 'أجهزة إلكترونية',categoryId: 'electronics', shortCode: 'electronics', description: 'سوق الأجهزة الإلكترونية والشاشات وأجهزة الكمبيوتر والألعاب.' },
      'fashion-beauty':       { title: 'الموضة والجمال',  categoryId: 'fashion',     shortCode: 'fashion',     description: 'سوق الموضة والجمال والملابس والإكسسوارات.' },
      'pets-animals':         { title: 'حيوانات أليفة',   categoryId: 'pets',        shortCode: 'pets',        description: 'سوق الحيوانات الأليفة والكلاب والقطط والطيور.' },
      'baby-kids':            { title: 'مستلزمات أطفال',  categoryId: 'baby',        shortCode: 'baby',        description: 'سوق مستلزمات وحاجيات الرضع والأطفال.' },
      'hobbies-sports':       { title: 'هوايات وتسلية',   categoryId: 'hobbies',     shortCode: 'hobbies',     description: 'سوق الهوايات والرياضة والمقتنيات والكتب.' },
      'commercial-industrial':{ title: 'تجارة وصناعة',    categoryId: 'trade',       shortCode: 'trade',       description: 'سوق المعدات الصناعية والتجارية وأعمال البناء.' },
      'professional-services':{ title: 'خدمات',            categoryId: 'services',    shortCode: 'services',    description: 'دليل الخدمات والشركات والصيانة والحفلات.' },
      'crafts-professions':   { title: 'المهن والحرف',     categoryId: 'crafts',      shortCode: 'crafts',      description: 'سوق المهن والحرف - سباكة، كهرباء، نجارة، دهانات.' },
      'transport-delivery':   { title: 'نقل وتوصيل',       categoryId: 'transport',   shortCode: 'transport',   description: 'سوق الخدمات النقل والشحن والتوصيل وتأجير سيارات النقل.' },
    };

    const spec = knownCategoryPages[slug];
    if (spec) {
      try {
        await createPage({
          title: spec.title,
          slug,
          shortCode: spec.shortCode,
          content: spec.description,
          isPublished: true,
          pageType: 'adpage' as any,
          adpageMode: 'showcase' as any,
          adpageCategoryId: spec.categoryId,
          adpageDescription: spec.description,
          adpageSubtitle: `تصفح أفضل عروض ${spec.title}`,
          adpageButtonText: 'تصفح الإعلانات',
          views: 0,
        });
        page = await getPageBySlug(slug);
      } catch (e) {
        console.error('Auto-create page failed:', e);
      }
    }
  }

  if (!page || !page.isPublished) {
    notFound(); // Triggers 404 page
  }

  // ===== صفحات إعلانية: عرض AdPageClient دائماً =====
  if (page.pageType === 'adpage' && page.adpageCategoryId) {
    const serializedPage = {
      ...page,
      adpageMode: 'showcase' as const, // دائماً showcase بغض النظر عن القيمة المخزنة
      createdAt: page.createdAt?.seconds ?? null,
      updatedAt: page.updatedAt?.seconds ?? null,
    };
    return (
      <main className="min-h-screen bg-background">
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
        />
        <LandingPageClient page={serializedPage as any} />
        <PageViewIncrementer pageId={page.id} />
      </main>
    );
  }

  // ===== الصفحات العادية: العرض الكلاسيكي =====
  return (
    <div className="flex flex-col min-h-screen bg-background">
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
