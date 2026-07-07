import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/dashboard/', 
        '/api/', 
        '/profile/', // Private profile settings
        '/submit',
        '/cart',
        '/wallet',
      ],
    },
    sitemap: 'https://sooq-elarab.com/sitemap.xml',
  };
}
