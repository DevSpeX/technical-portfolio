import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { PROJECTS, SITE_CONFIG } from '@/config';
import { cn } from '@/shared/lib/cn';
import { AppProviders } from '@/shared/providers/app-providers';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

function isRealUrl(url: string): boolean {
  return (
    /^https?:\/\//i.test(url) &&
    !/example\.invalid|PLACEHOLDER_/i.test(url)
  );
}

function buildStructuredData() {
  const siteUrl = SITE_CONFIG.metadata.siteUrl.replace(/\/$/, '');
  const personId = `${siteUrl}/#person`;
  const profilePageId = `${siteUrl}/#profile-page`;

  const sameAs = SITE_CONFIG.socials
    .filter((social) => social.external && isRealUrl(social.href))
    .map((social) => social.href);

  const knowsAbout = Array.from(
    new Set([
      ...SITE_CONFIG.skillDomains.map((domain) => domain.title),
      ...SITE_CONFIG.skillDomains.flatMap((domain) => domain.stack),
    ]),
  );

  const personNode: Record<string, unknown> = {
    '@type': 'Person',
    '@id': personId,
    name: SITE_CONFIG.owner.name,
    alternateName: SITE_CONFIG.owner.handle,
    jobTitle: SITE_CONFIG.owner.role,
    description: SITE_CONFIG.metadata.description,
    url: siteUrl,
    knowsAbout,
    homeLocation: {
      '@type': 'Place',
      name: SITE_CONFIG.owner.location,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const featuredWorks = PROJECTS.filter((project) => project.featured).map(
    (project) => ({
      '@type': 'SoftwareSourceCode',
      name: project.title,
      description: project.tagline,
      programmingLanguage: [...project.techStack],
      ...(project.links.repository && isRealUrl(project.links.repository)
        ? { codeRepository: project.links.repository }
        : {}),
      ...(project.links.live && isRealUrl(project.links.live)
        ? { url: project.links.live }
        : {}),
    }),
  );

  const profilePageNode: Record<string, unknown> = {
    '@type': 'ProfilePage',
    '@id': profilePageId,
    url: siteUrl,
    name: SITE_CONFIG.metadata.title,
    description: SITE_CONFIG.metadata.description,
    inLanguage: 'de-DE',
    mainEntity: { '@id': personId },
    hasPart: featuredWorks,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [personNode, profilePageNode],
  };
}

const siteUrl = SITE_CONFIG.metadata.siteUrl.replace(/\/$/, '');
const ogImageUrl = SITE_CONFIG.metadata.ogImage;
const twitterCreator =
  SITE_CONFIG.metadata.twitterHandle &&
  !/PLACEHOLDER_/i.test(SITE_CONFIG.metadata.twitterHandle)
    ? SITE_CONFIG.metadata.twitterHandle
    : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: `${SITE_CONFIG.owner.name} Portfolio`,
  title: {
    default: SITE_CONFIG.metadata.title,
    template: SITE_CONFIG.metadata.titleTemplate,
  },
  description: SITE_CONFIG.metadata.description,
  keywords: [...SITE_CONFIG.metadata.keywords],
  authors: [{ name: SITE_CONFIG.owner.name, url: siteUrl }],
  creator: SITE_CONFIG.owner.name,
  publisher: SITE_CONFIG.owner.name,
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'profile',
    locale: SITE_CONFIG.metadata.locale,
    url: siteUrl,
    title: SITE_CONFIG.metadata.title,
    description: SITE_CONFIG.metadata.description,
    siteName: SITE_CONFIG.owner.name,
    firstName: SITE_CONFIG.owner.name,
    username: SITE_CONFIG.owner.handle,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.metadata.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.metadata.title,
    description: SITE_CONFIG.metadata.description,
    ...(twitterCreator ? { creator: twitterCreator } : {}),
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#07080a',
  width: 'device-width',
  initialScale: 1,
};

export interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const jsonLd = buildStructuredData();

  return (
    <html
      lang="de"
      className={cn(plusJakartaSans.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:border-focus focus:bg-elevated focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:text-ink"
        >
          Zum Hauptinhalt springen
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
