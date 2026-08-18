import { Metadata } from 'next';
import StoreClient from './StoreClient';

export const metadata: Metadata = {
  title: 'متجر دار الشيخة للأزياء والعبايات الخليجية | سوق العرب',
  description: 'تسوقي أرقى العبايات الخليجية والمخاوير الإماراتية والجلابيات والفساتين الراقية من دار الشيخة عبر سوق العرب.',
};

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <StoreClient storeId={resolvedParams.id} />;
}
