import { Suspense } from 'react';
import { PROJECTS, SITE_CONFIG } from '@/config';
import { ContactFooter, ContactSection } from '@/features/contact';
import { ExperienceMatrixSection } from '@/features/experience';
import { GitHubTelemetrySection } from '@/features/github-telemetry';
import { HeroSection } from '@/features/hero';
import { InspectableModule } from '@/features/inspector';
import { ProjectsSection } from '@/features/projects';
import { FloatingDockNav } from '@/shared/components';
import { Container } from '@/shared/ui/container';

function TelemetryFallbackSkeleton() {
  return (
    <InspectableModule
      as="section"
      id="telemetry"
      tabIndex={-1}
      name="GitHubTelemetrySection"
      layer="RSC // Suspense Fallback"
      renderMetric="Streaming..."
      tone="rsc"
      className="scroll-mt-24 border-t border-border-subtle py-16 sm:py-20"
    >
      <Container>
        <div className="mb-8 space-y-2">
          <div className="h-3 w-44 animate-pulse rounded bg-elevated" />
          <div className="h-7 w-80 animate-pulse rounded bg-elevated" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 animate-pulse rounded-xl border border-border-subtle bg-elevated/70"
            />
          ))}
        </div>
      </Container>
    </InspectableModule>
  );
}

export default function HomePage() {
  return (
    <InspectableModule
      name="HomePage"
      layer="RSC // Server Component"
      renderMetric="App Router Shell"
      tone="rsc"
    >
      <div className="relative min-h-screen bg-canvas text-ink">
        <FloatingDockNav site={SITE_CONFIG} />

        <main id="main-content">
          <HeroSection site={SITE_CONFIG} />
          <ProjectsSection projects={PROJECTS} />
          <Suspense fallback={<TelemetryFallbackSkeleton />}>
            <GitHubTelemetrySection />
          </Suspense>
          <ExperienceMatrixSection />
          <ContactSection site={SITE_CONFIG} />
        </main>

        <ContactFooter site={SITE_CONFIG} />
      </div>
    </InspectableModule>
  );
}
