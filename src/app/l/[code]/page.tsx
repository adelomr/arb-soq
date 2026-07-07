import { getPageByShortCode } from "@/lib/page-service";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const page = await getPageByShortCode(code);
  if (!page) return { title: "صفحة غير موجودة" };
  return {
    title: page.title,
    description: page.description || page.title,
    robots: { index: false },
  };
}

export default async function ShortUrlPage({ params }: Props) {
  const { code } = await params;
  if (!code || code.length > 25) notFound();
  const page = await getPageByShortCode(code);
  if (!page || !page.slug) notFound();
  redirect("/p/" + page.slug);
}