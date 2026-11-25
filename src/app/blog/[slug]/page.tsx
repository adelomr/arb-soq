import { getBlogBySlug, getAllBlogs } from "@/lib/blog-service";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogDetailClient from "@/components/BlogDetailClient";

const BASE_URL = 'https://www.arb-soq.com';

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate static params for faster initial load
export async function generateStaticParams() {
  try {
    const blogs = await getAllBlogs();
    return blogs
      .filter(blog => blog && blog.slug)
      .map((blog) => ({ slug: blog.slug }));
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

  const cleanDescription = (blog.content || '')
    .substring(0, 160)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const canonicalUrl = `${BASE_URL}/blog/${blog.slug}`;
  const ogImage = blog.imageUrl || `${BASE_URL}/og-image.png`;

  return {
    title: `${blog.title} | سوق العرب`,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: `${blog.title} | سوق العرب`,
      description: cleanDescription,
      siteName: 'سوق العرب',
      locale: 'ar_SA',
      publishedTime: blog.createdAt?.seconds
        ? new Date(blog.createdAt.seconds * 1000).toISOString()
        : undefined,
      authors: [blog.author || 'سوق العرب'],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${blog.title} | سوق العرب`,
      description: cleanDescription,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const p = await params;
  const blog = await getBlogBySlug(p.slug);

  if (!blog) {
    notFound();
  }

  const canonicalUrl = `${BASE_URL}/blog/${blog.slug}`;
  const ogImage = blog.imageUrl || `${BASE_URL}/og-image.png`;
  const datePublished = blog.createdAt?.seconds
    ? new Date(blog.createdAt.seconds * 1000).toISOString()
    : new Date().toISOString();

  const cleanDesc = (blog.content || '')
    .substring(0, 160)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: cleanDesc,
    image: [ogImage],
    datePublished: datePublished,
    dateModified: datePublished,
    author: {
      '@type': 'Person',
      name: blog.author || 'سوق العرب',
    },
    publisher: {
      '@type': 'Organization',
      name: 'سوق العرب',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/app-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'المدونة',
        item: `${BASE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <BlogDetailClient slug={p.slug} initialBlog={blog ? JSON.parse(JSON.stringify(blog)) : null} />
    </>
  );
}
