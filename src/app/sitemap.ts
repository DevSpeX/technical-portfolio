import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.metadata.siteUrl.replace(/\/$/, '');
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
