import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سوق العرب - Sooq Al Arab',
    short_name: 'سوق العرب',
    description: 'سوق العرب - بيع وشراء كل شيء في منطقتك',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#186959',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    share_target: {
      action: '/submit',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  };
}
