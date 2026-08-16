import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CategoryRedirectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sParams = await searchParams;

  const search = new URLSearchParams();
  if (id) {
    search.set('q', decodeURIComponent(id));
  }

  if (sParams) {
    for (const [key, value] of Object.entries(sParams)) {
      if (key !== 'q') {
        if (typeof value === 'string') {
          search.set(key, value);
        } else if (Array.isArray(value)) {
          value.forEach(v => search.append(key, v));
        }
      }
    }
  }

  const queryString = search.toString();
  const targetPath = `/search${queryString ? `?${queryString}` : ''}`;

  redirect(targetPath);
}

