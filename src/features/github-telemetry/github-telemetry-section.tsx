import { SITE_CONFIG } from '@/config';
import { InspectableModule } from '@/features/inspector';
import { fetchGitHubTelemetry } from './api/github';
import { GitHubTelemetryBoard } from './github-telemetry-board';

/**
 * Next.js Server Component that loads GitHub repository telemetry with 1-hour
 * ISR revalidation and streams structured metrics into the client board.
 */
export async function GitHubTelemetrySection() {
  const telemetry = await fetchGitHubTelemetry(
    SITE_CONFIG.owner.githubUsername,
  );

  return (
    <InspectableModule
      as="section"
      id="telemetry"
      tabIndex={-1}
      name="GitHubTelemetrySection"
      layer="RSC // ISR Telemetry (3600s)"
      renderMetric={
        telemetry.source === 'live'
          ? `Live · ${telemetry.repositories.length} Repos · ${telemetry.recentCommits.length} Commits`
          : `Fallback · ${telemetry.repositories.length} Repos`
      }
      tone="rsc"
      className="scroll-mt-24 border-t border-border-subtle py-16 sm:py-20"
    >
      <GitHubTelemetryBoard data={telemetry} />
    </InspectableModule>
  );
}
