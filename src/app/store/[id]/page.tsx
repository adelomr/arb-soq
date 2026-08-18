import { Metadata } from 'next';
import StoreClient from './StoreClient';

export const metadata: Metadata = {
  title: 'متجر دار الشيخة للأزياء والعبايات الخليجية | سوق العرب',
  description: 'تسوقي أرقى العبايات الخليجية والمخاوير الإماراتية والجلابيات والفساتين الراقية من دار الشيخة عبر سوق العرب.',
};

export default function StorePage({ params }: { params: { id: string } }) {
  return <StoreClient storeId={params.id} />;
}
