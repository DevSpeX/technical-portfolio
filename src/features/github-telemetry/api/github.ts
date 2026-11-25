import { SITE_CONFIG } from '@/config';

export interface GitHubProfileMetrics {
  readonly username: string;
  readonly displayName: string;
  readonly bio: string;
  readonly profileUrl: string;
  readonly publicRepos: number;
  readonly followers: number;
  readonly totalStars: number;
  readonly totalForks: number;
}

export interface GitHubRepository {
  readonly id: string;
  readonly name: string;
  readonly fullName: string;
  readonly description: string;
  readonly htmlUrl: string;
  readonly language: string;
  readonly stargazersCount: number;
  readonly forksCount: number;
  readonly updatedAt: string;
  readonly defaultBranch: string;
  readonly isFork: boolean;
  readonly isArchived: boolean;
  readonly architectureTags: readonly string[];
  readonly isPlaceholderLink?: boolean;
}

export interface GitHubCommitActivity {
  readonly id: string;
  readonly sha: string;
  readonly shortSha: string;
  readonly message: string;
  readonly repoName: string;
  readonly branch: string;
  readonly timestamp: string;
  readonly htmlUrl: string;
  readonly authorName: string;
  readonly isPlaceholderLink?: boolean;
}

export interface LanguageStat {
  readonly language: string;
  readonly count: number;
  readonly percentage: number;
  readonly color: string;
}

export type TelemetrySource = 'live' | 'fallback';

export interface GitHubTelemetryData {
  readonly source: TelemetrySource;
  readonly fallbackReason?: string;
  readonly fetchedAt: string;
  readonly revalidateSeconds: number;
  readonly profile: GitHubProfileMetrics;
  readonly repositories: readonly GitHubRepository[];
  readonly recentCommits: readonly GitHubCommitActivity[];
  readonly commitsEnriched: boolean;
  readonly languageDistribution: readonly LanguageStat[];
}

interface RawGitHubUser {
  readonly login?: string;
  readonly name?: string | null;
  readonly bio?: string | null;
  readonly html_url?: string;
  readonly public_repos?: number;
  readonly followers?: number;
}

interface RawGitHubRepo {
  readonly id: number;
  readonly name: string;
  readonly full_name: string;
  readonly description: string | null;
  readonly html_url: string;
  readonly language: string | null;
  readonly stargazers_count: number;
  readonly forks_count: number;
  readonly updated_at: string;
  readonly default_branch?: string;
  readonly topics?: readonly string[];
  readonly fork?: boolean;
  readonly archived?: boolean;
}

interface RawGitHubEventCommit {
  readonly sha?: string;
  readonly message?: string;
  readonly author?: { readonly name?: string };
}

interface RawGitHubEvent {
  readonly id: string;
  readonly type: string;
  readonly repo?: { readonly name?: string };
  readonly created_at?: string;
  readonly payload?: {
    readonly ref?: string;
    readonly head?: string;
    readonly commits?: readonly RawGitHubEventCommit[];
  };
}

interface RawGitHubRepoCommit {
  readonly sha?: string;
  readonly html_url?: string;
  readonly commit?: {
    readonly message?: string;
    readonly author?: { readonly name?: string; readonly date?: string };
    readonly committer?: { readonly date?: string };
  };
  readonly author?: { readonly login?: string } | null;
}

const REVALIDATE_SECONDS = 3600;
const MAX_COMMIT_ITEMS = 15;
const MAX_ENRICHED_REPOS = 6;

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#60a5fa',
  JavaScript: '#fbbf24',
  Python: '#38bdf8',
  Rust: '#e5a955',
  'C#': '#34d399',
  Shell: '#94a3b8',
  Go: '#22d3ee',
  Lua: '#a78bfa',
  Other: '#64748b',
};

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? '#64748b';
}

function isPlaceholderUsername(username: string): boolean {
  const trimmed = username.trim();
  if (!trimmed) {
    return true;
  }
  return (
    /^placeholder/i.test(trimmed) ||
    /insert_link/i.test(trimmed) ||
    /\s/.test(trimmed)
  );
}

function firstCommitLine(message: string | undefined): string {
  const firstLine = (message ?? '').split(/\r?\n/, 1)[0]?.trim();
  return firstLine && firstLine.length > 0
    ? firstLine
    : 'Commit ohne Nachricht';
}

function extractBranchName(ref: string | undefined, fallbackBranch = 'main'): string {
  if (!ref) {
    return fallbackBranch;
  }
  const stripped = ref.replace(/^refs\/heads\//, '').trim();
  return stripped || fallbackBranch;
}

function deriveArchitectureTags(repo: RawGitHubRepo): readonly string[] {
  const tags = new Set<string>();

  if (Array.isArray(repo.topics)) {
    for (const topic of repo.topics.slice(0, 4)) {
      tags.add(topic);
    }
  }

  const haystack = `${repo.name} ${repo.description ?? ''}`.toLowerCase();

  if (tags.size < 3) {
    if (/next|react|web|ui|frontend|rpg/.test(haystack)) tags.add('web-arch');
    if (/ai|llm|agent|orchestr/.test(haystack)) tags.add('ai-pipeline');
    if (/linux|void|arch|dotfile|wayland|systemd|distro/.test(haystack)) {
      tags.add('linux-systems');
    }
    if (/unity|game|webgl|canvas|physics|shader|rpg/.test(haystack)) {
      tags.add('realtime-sim');
    }
    if (/cli|rust|daemon|telemetry/.test(haystack)) tags.add('systems-cli');
  }

  if (tags.size === 0 && repo.language) {
    tags.add(repo.language.toLowerCase());
  }

  return Array.from(tags).slice(0, 4);
}

function buildLanguageDistribution(
  repositories: readonly GitHubRepository[],
): readonly LanguageStat[] {
  const counts = new Map<string, number>();

  for (const repo of repositories) {
    const lang = repo.language || 'Other';
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }

  const total = repositories.length || 1;

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      color: getLanguageColor(language),
    }));
}

function normalizeRepo(repo: RawGitHubRepo): GitHubRepository {
  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    description:
      repo.description?.trim() ||
      'Öffentliches Engineering-Repository ohne Kurzbeschreibung.',
    htmlUrl: repo.html_url,
    language: repo.language ?? 'Other',
    stargazersCount: repo.stargazers_count ?? 0,
    forksCount: repo.forks_count ?? 0,
    updatedAt: repo.updated_at,
    defaultBranch: repo.default_branch?.trim() || 'main',
    isFork: Boolean(repo.fork),
    isArchived: Boolean(repo.archived),
    architectureTags: deriveArchitectureTags(repo),
    isPlaceholderLink: false,
  };
}

function createFallbackTelemetry(
  username: string,
  reason: string,
): GitHubTelemetryData {
  const cleanUser = isPlaceholderUsername(username) ? 'DevSpeX' : username.trim();
  const fallbackRepos: readonly GitHubRepository[] = [
    {
      id: 'fallback-unknown-adventure',
      name: 'Unknown-Adventure-Web-RPG',
      fullName: `${cleanUser}/Unknown-Adventure-Web-RPG`,
      description: '"Unknown Adventure" Web RPG',
      htmlUrl: `https://github.com/${cleanUser}/Unknown-Adventure-Web-RPG`,
      language: 'JavaScript',
      stargazersCount: 0,
      forksCount: 0,
      updatedAt: '2026-11-24T15:29:39Z',
      defaultBranch: 'master',
      isFork: false,
      isArchived: false,
      architectureTags: ['web-arch', 'realtime-sim', 'javascript'],
      isPlaceholderLink: true,
    },
    {
      id: 'fallback-voidstation',
      name: 'VoidStation',
      fullName: `${cleanUser}/VoidStation`,
      description:
        'A Void Linux based Distro for multimedia purposes on TVs and Home Theatres',
      htmlUrl: `https://github.com/${cleanUser}/VoidStation`,
      language: 'Python',
      stargazersCount: 1,
      forksCount: 0,
      updatedAt: '2026-10-13T08:04:45Z',
      defaultBranch: 'main',
      isFork: true,
      isArchived: false,
      architectureTags: ['linux-systems', 'python'],
      isPlaceholderLink: true,
    },
  ];

  const fallbackCommits: readonly GitHubCommitActivity[] = [
    {
      id: 'fallback-commit-1',
      sha: 'c7b6b04000000000000000000000000000000000',
      shortSha: 'c7b6b04',
      message: 'chore(voidstation): sync multimedia service provisioning & runtime profile',
      repoName: `${cleanUser}/VoidStation`,
      branch: 'main',
      timestamp: '2026-11-24T16:46:52Z',
      htmlUrl: `https://github.com/${cleanUser}/VoidStation`,
      authorName: cleanUser,
      isPlaceholderLink: true,
    },
    {
      id: 'fallback-commit-2',
      sha: 'a3f91c2000000000000000000000000000000000',
      shortSha: 'a3f91c2',
      message: 'feat(rpg-engine): refine combat state loop and canvas frame pacing',
      repoName: `${cleanUser}/Unknown-Adventure-Web-RPG`,
      branch: 'master',
      timestamp: '2026-11-24T15:29:39Z',
      htmlUrl: `https://github.com/${cleanUser}/Unknown-Adventure-Web-RPG`,
      authorName: cleanUser,
      isPlaceholderLink: true,
    },
  ];

  const totalStars = fallbackRepos.reduce(
    (sum, repo) => sum + repo.stargazersCount,
    0,
  );
  const totalForks = fallbackRepos.reduce(
    (sum, repo) => sum + repo.forksCount,
    0,
  );

  return {
    source: 'fallback',
    fallbackReason: reason,
    fetchedAt: new Date().toISOString(),
    revalidateSeconds: REVALIDATE_SECONDS,
    profile: {
      username: cleanUser,
      displayName: SITE_CONFIG.owner.name,
      bio: 'Systems & Full-Stack Software Engineer — Web Architecture, AI-Orchestration, Linux & Game Systems.',
      profileUrl: `https://github.com/${cleanUser}`,
      publicRepos: fallbackRepos.length,
      followers: 0,
      totalStars,
      totalForks,
    },
    repositories: fallbackRepos,
    recentCommits: fallbackCommits,
    commitsEnriched: false,
    languageDistribution: buildLanguageDistribution(fallbackRepos),
  };
}

/**
 * Server-side GitHub REST API telemetry loader with ISR (`revalidate: 3600`).
 * Fetches all public repositories (including forks and unannotated repos)
 * and enriches recent PushEvent activity with direct `/repos/.../commits` calls.
 */
export async function fetchGitHubTelemetry(
  username: string = SITE_CONFIG.owner.githubUsername,
): Promise<GitHubTelemetryData> {
  if (isPlaceholderUsername(username)) {
    return createFallbackTelemetry(
      username,
      'Kein Live-GitHub-Username in site.config.ts konfiguriert — zeige kuratierte Struktur-Telemetrie.',
    );
  }

  const cleanUsername = username.trim();
  const encodedUsername = encodeURIComponent(cleanUsername);
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'florian-portfolio-telemetry/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodedUsername}`, {
        headers,
        next: { revalidate: REVALIDATE_SECONDS },
      }),
      fetch(
        `https://api.github.com/users/${encodedUsername}/repos?sort=updated&per_page=100`,
        {
          headers,
          next: { revalidate: REVALIDATE_SECONDS },
        },
      ),
      fetch(
        `https://api.github.com/users/${encodedUsername}/events/public?per_page=30`,
        {
          headers,
          next: { revalidate: REVALIDATE_SECONDS },
        },
      ),
    ]);

    if (
      userRes.status === 403 ||
      userRes.status === 429 ||
      reposRes.status === 403 ||
      reposRes.status === 429
    ) {
      return createFallbackTelemetry(
        cleanUsername,
        'GitHub REST API Rate-Limit erreicht — zeige zwischengespeicherte Struktur-Telemetrie.',
      );
    }

    if (!userRes.ok || !reposRes.ok) {
      return createFallbackTelemetry(
        cleanUsername,
        `GitHub API Antwort (${userRes.status}/${reposRes.status}) — Fallback-Telemetrie aktiv.`,
      );
    }

    const rawUser = (await userRes.json()) as RawGitHubUser;
    const rawRepos = (await reposRes.json()) as RawGitHubRepo[];

    if (!Array.isArray(rawRepos) || rawRepos.length === 0) {
      return createFallbackTelemetry(
        cleanUsername,
        'Keine öffentlichen Repositories gefunden — zeige kuratierte Struktur-Telemetrie.',
      );
    }

    // Keep ALL public repositories (including forks, zero-star, and no-description repos)
    const allRepositories: GitHubRepository[] = rawRepos.map(normalizeRepo);

    const totalStars = allRepositories.reduce(
      (sum, repo) => sum + repo.stargazersCount,
      0,
    );
    const totalForks = allRepositories.reduce(
      (sum, repo) => sum + repo.forksCount,
      0,
    );

    // 1. Parse PushEvents from public events API
    const commitsBySha = new Map<string, GitHubCommitActivity>();
    const repoBranchHints = new Map<string, string>();
    const reposToEnrich = new Set<string>();

    for (const repo of allRepositories.slice(0, MAX_ENRICHED_REPOS)) {
      reposToEnrich.add(repo.fullName);
      repoBranchHints.set(repo.fullName, repo.defaultBranch);
    }

    if (eventsRes.ok) {
      const rawEvents = (await eventsRes.json()) as RawGitHubEvent[];
      if (Array.isArray(rawEvents)) {
        for (const event of rawEvents) {
          if (event.type !== 'PushEvent') {
            continue;
          }

          const repoName = event.repo?.name?.trim();
          if (!repoName) {
            continue;
          }

          const matchingRepo = allRepositories.find(
            (r) => r.fullName.toLowerCase() === repoName.toLowerCase(),
          );
          const branch = extractBranchName(
            event.payload?.ref,
            matchingRepo?.defaultBranch ?? 'main',
          );

          repoBranchHints.set(repoName, branch);
          if (reposToEnrich.size < MAX_ENRICHED_REPOS) {
            reposToEnrich.add(repoName);
          }

          const eventCommits = event.payload?.commits;
          if (Array.isArray(eventCommits) && eventCommits.length > 0) {
            for (const commit of eventCommits) {
              const sha = commit.sha?.trim();
              if (!sha) {
                continue;
              }
              commitsBySha.set(sha, {
                id: `${event.id}-${sha}`,
                sha,
                shortSha: sha.slice(0, 7),
                message: firstCommitLine(commit.message),
                repoName,
                branch,
                timestamp: event.created_at ?? new Date().toISOString(),
                htmlUrl: `https://github.com/${repoName}/commit/${sha}`,
                authorName: commit.author?.name?.trim() || cleanUsername,
                isPlaceholderLink: false,
              });
            }
          }
        }
      }
    }

    // 2. Always enrich with direct `/repos/{fullName}/commits?per_page=5` requests
    //    so PushEvents with empty `payload.commits` still show real commit messages
    let commitsEnriched = false;
    const enrichTargets = Array.from(reposToEnrich).slice(0, MAX_ENRICHED_REPOS);

    if (enrichTargets.length > 0) {
      const commitResults = await Promise.allSettled(
        enrichTargets.map(async (repoFullName) => {
          const branch = repoBranchHints.get(repoFullName);
          const shaParam = branch
            ? `&sha=${encodeURIComponent(branch)}`
            : '';
          const res = await fetch(
            `https://api.github.com/repos/${repoFullName}/commits?per_page=5${shaParam}`,
            {
              headers,
              next: { revalidate: REVALIDATE_SECONDS },
            },
          );
          if (!res.ok) {
            return null;
          }
          const payload = (await res.json()) as RawGitHubRepoCommit[];
          return {
            repoFullName,
            branch: branch ?? 'main',
            commits: Array.isArray(payload) ? payload : [],
          };
        }),
      );

      for (const result of commitResults) {
        if (result.status !== 'fulfilled' || !result.value) {
          continue;
        }
        const { repoFullName, branch, commits } = result.value;
        if (commits.length > 0) {
          commitsEnriched = true;
        }
        for (const item of commits) {
          const sha = item.sha?.trim();
          if (!sha) {
            continue;
          }
          const timestamp =
            item.commit?.author?.date ??
            item.commit?.committer?.date ??
            new Date().toISOString();
          const authorName =
            item.author?.login?.trim() ||
            item.commit?.author?.name?.trim() ||
            cleanUsername;

          const existing = commitsBySha.get(sha);
          commitsBySha.set(sha, {
            id: existing?.id ?? `${repoFullName}-${sha}`,
            sha,
            shortSha: sha.slice(0, 7),
            message: firstCommitLine(item.commit?.message),
            repoName: repoFullName,
            branch: existing?.branch ?? branch,
            timestamp,
            htmlUrl:
              item.html_url?.trim() ||
              `https://github.com/${repoFullName}/commit/${sha}`,
            authorName,
            isPlaceholderLink: false,
          });
        }
      }
    }

    const recentCommits = Array.from(commitsBySha.values())
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, MAX_COMMIT_ITEMS);

    return {
      source: 'live',
      fetchedAt: new Date().toISOString(),
      revalidateSeconds: REVALIDATE_SECONDS,
      profile: {
        username: rawUser.login ?? cleanUsername,
        displayName: rawUser.name ?? rawUser.login ?? SITE_CONFIG.owner.name,
        bio:
          rawUser.bio ??
          'Systems & Full-Stack Software Engineer — Web Architecture, AI-Orchestration & Linux.',
        profileUrl:
          rawUser.html_url ?? `https://github.com/${encodedUsername}`,
        publicRepos: rawUser.public_repos ?? allRepositories.length,
        followers: rawUser.followers ?? 0,
        totalStars,
        totalForks,
      },
      repositories: allRepositories,
      recentCommits,
      commitsEnriched,
      languageDistribution: buildLanguageDistribution(allRepositories),
    };
  } catch {
    return createFallbackTelemetry(
      cleanUsername,
      'GitHub REST API aktuell nicht erreichbar — zeige resiliente Fallback-Telemetrie.',
    );
  }
}
