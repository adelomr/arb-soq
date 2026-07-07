import { Metadata } from 'next';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import WorkerPageClient from '@/components/worker/page'; // Reusing the component
import { UserProfile } from '@/lib/types';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ userId: string }>;
};

async function getWorkerData(userId: string): Promise<UserProfile | null> {
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  const userData = userSnap.data() as UserProfile;
  // Check if they are actually a worker
  if (!userData.profession) return null;

  return { ...userData, id: userSnap.id };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const worker = await getWorkerData(userId);

  if (!worker) {
    return {
      title: 'العامل غير موجود | سوق العرب',
    };
  }

  const description = `${worker.name} - ${worker.profession} في سوق العرب. اعثر على أفضل العمال والحرفيين لمشاريعك.`;
  const imageUrl = worker.avatarUrl || '/og-image.png';

  return {
    title: `${worker.name} | ${worker.profession} | سوق العرب`,
    description: description,
    openGraph: {
      title: `${worker.name} - ${worker.profession}`,
      description: description,
      images: [imageUrl],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${worker.name} - ${worker.profession}`,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function WorkerPage({ params }: Props) {
  const { userId } = await params;
  const worker = await getWorkerData(userId);

  if (!worker) {
    notFound();
  }

  // The component expects userId from params via useParams, but we can pass it or 
  // just let the client component handle the fetching as it already does.
  // However, for total SEO consistency, we might want to pass initial data if possible.
  // Currently WorkerPage component in components/worker/page.tsx doesn't take props.
  // I will create a small wrapper if needed or just render it.
  
  return <WorkerPageClient />;
}
