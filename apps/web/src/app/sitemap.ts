import type { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/lib/blog-posts';
import { AGRO_CITIES } from '@/lib/agro-cities';

const BASE = 'https://conectcampo.digital';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/como-funciona', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/planos', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/parceiros', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sobre', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contato', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/carreiras', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/api-docs', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/legal/termos-de-uso', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/politica-de-privacidade', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/login', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/register', priority: 0.6, changeFrequency: 'monthly' },
  ];

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const cityEntries: MetadataRoute.Sitemap = AGRO_CITIES.map((c) => ({
    url: `${BASE}/credito-rural/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries, ...cityEntries];
}
