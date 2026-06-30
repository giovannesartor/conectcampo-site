import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/oauth/', '/callback', '/reset-password', '/verify-email', '/cpr/assinar/'],
    },
    sitemap: 'https://conectcampo.digital/sitemap.xml',
    host: 'https://conectcampo.digital',
  };
}
