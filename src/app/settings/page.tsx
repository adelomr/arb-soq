import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'ضبط وإعدادات التطبيق | سوق العرب',
  description: 'ضبط وتحديد موقعك الجغرافي بدقة (القرية، المدينة، المحافظة)، وتخصيص إعدادات المظهر والخيارات في سوق العرب.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
