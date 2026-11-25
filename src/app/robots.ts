import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.metadata.siteUrl.replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
