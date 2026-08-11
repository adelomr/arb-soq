import AdPage from '../[userId]/[adId]/page';

type Props = {
  params: Promise<{ adId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const p = await params;
  const adPageParams = Promise.resolve({ userId: 'owner', adId: p.adId });
  const { generateMetadata: originalMetadata } = await import('../[userId]/[adId]/page');
  return originalMetadata({ params: adPageParams });
}

export default async function SingleAdPage({ params }: Props) {
  const p = await params;
  const adPageParams = Promise.resolve({ userId: 'owner', adId: p.adId });
  return <AdPage params={adPageParams} />;
}
