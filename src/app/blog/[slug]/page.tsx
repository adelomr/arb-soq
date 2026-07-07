import { getBlogBySlug, getAllBlogs } from "@/lib/blog-service";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogDetailClient from "@/components/BlogDetailClient";

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

  return {
    title: `${blog.title} | سوق العرب`,
    description: (blog.content || '').substring(0, 150).replace(/<[^>]+>/g, ''),
    openGraph: {
      images: blog.imageUrl ? [blog.imageUrl] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const p = await params;
  const blog = await getBlogBySlug(p.slug);

  if (!blog) {
    notFound();
  }

  return <BlogDetailClient slug={p.slug} />;
}
