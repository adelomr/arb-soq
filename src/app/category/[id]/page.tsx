import { redirect } from 'next/navigation';
import { getCategorySlug } from '@/lib/category-utils';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CategoryRedirectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sParams = await searchParams;

  const slug = getCategorySlug(id);
  const search = new URLSearchParams();

  if (sParams) {
    for (const [key, value] of Object.entries(sParams)) {
      if (typeof value === 'string') {
        search.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => search.append(key, v));
      }
    }
  }

  const queryString = search.toString();
  const targetPath = `/p/${slug}${queryString ? `?${queryString}` : ''}`;

  redirect(targetPath);
}
