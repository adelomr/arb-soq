import AdPage from './[adId]/page';

type Props = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const p = await params;
  const adPageParams = Promise.resolve({ userId: 'owner', adId: p.userId });
  const { generateMetadata: originalMetadata } = await import('./[adId]/page');
  return originalMetadata({ params: adPageParams });
}

export default async function SingleAdPage({ params }: Props) {
  const p = await params;
  const adPageParams = Promise.resolve({ userId: 'owner', adId: p.userId });
  return <AdPage params={adPageParams} />;
}
