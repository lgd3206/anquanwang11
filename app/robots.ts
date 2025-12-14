import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/*.json$',
        '/*?*sort=',
      ],
    },
    sitemap: 'https://www.hseshare.com/sitemap.xml',
  };
}
