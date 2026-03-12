import { useEffect, useState } from 'react';

const GITHUB_USERNAME = 'littlestronomer';
const CACHE_KEY = `portfolio-github-data:v2:${GITHUB_USERNAME}`;
const CACHE_TTL = 15 * 60 * 1000;
const FEATURED_TOPICS = new Set(['featured', 'portfolio']);
const RECENT_COMMIT_REPO_LIMIT = 8;
const RECENT_COMMITS_PER_REPO = 8;

interface GitHubProfileResponse {
  login: string;
  html_url: string;
  blog: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
  updated_at: string;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  updated_at: string;
  private: boolean;
  archived: boolean;
  disabled: boolean;
  fork: boolean;
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      date: string;
    } | null;
  };
}

export interface GitHubProfile {
  login: string;
  url: string;
  blog: string | null;
  location: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  updatedAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string;
  language: string | null;
  topics: string[];
  homepage: string | null;
  stars: number;
  forks: number;
  pushedAt: string;
  updatedAt: string;
  isFeatured: boolean;
}

export interface GitHubRecentCommit {
  sha: string;
  shortSha: string;
  message: string;
  url: string;
  repoName: string;
  repoUrl: string;
  createdAt: string;
}

export interface GitHubPortfolioData {
  profile: GitHubProfile;
  featuredRepos: GitHubRepo[];
  allRepoCount: number;
  recentCommits: GitHubRecentCommit[];
}

interface CachedGitHubPortfolioData {
  timestamp: number;
  data: GitHubPortfolioData;
}

let memoryCache: CachedGitHubPortfolioData | null = null;
let inFlightRequest: Promise<GitHubPortfolioData> | null = null;

function formatTopic(topic: string) {
  return topic
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function daysSince(dateString: string) {
  const milliseconds = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.floor(milliseconds / (1000 * 60 * 60 * 24)));
}

function scoreRepo(repo: GitHubRepo) {
  let score = 0;

  if (repo.isFeatured) {
    score += 1000;
  }

  if (repo.description.trim()) {
    score += 40;
  }

  if (repo.homepage) {
    score += 10;
  }

  score += Math.min(repo.stars * 12, 120);
  score += Math.max(0, 365 - daysSince(repo.pushedAt));

  return score;
}

function toProfile(profile: GitHubProfileResponse): GitHubProfile {
  return {
    login: profile.login,
    url: profile.html_url,
    blog: profile.blog,
    location: profile.location,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.public_repos,
    updatedAt: profile.updated_at,
  };
}

function toRepo(repo: GitHubRepoResponse): GitHubRepo {
  const topics = (repo.topics ?? []).map(formatTopic).slice(0, 4);
  const isFeatured = (repo.topics ?? []).some((topic) => FEATURED_TOPICS.has(topic.toLowerCase()));

  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description ?? 'Repository details live on GitHub.',
    language: repo.language,
    topics,
    homepage: repo.homepage,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    isFeatured,
  };
}

function selectFeaturedRepos(repos: GitHubRepoResponse[]) {
  const eligibleRepos = repos
    .filter((repo) => !repo.private && !repo.archived && !repo.disabled && !repo.fork)
    .filter((repo) => repo.name !== 'littlestronomer.github.io')
    .map(toRepo)
    .sort((left, right) => scoreRepo(right) - scoreRepo(left));

  const featuredRepos = eligibleRepos.filter((repo) => repo.isFeatured);
  const selectedRepos = (featuredRepos.length > 0 ? featuredRepos : eligibleRepos).slice(0, 6);

  return {
    featuredRepos: selectedRepos,
    allRepoCount: eligibleRepos.length,
  };
}

async function fetchRecentCommits(repos: GitHubRepoResponse[]) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const trackedRepos = repos
    .filter((repo) => !repo.private && !repo.archived && !repo.disabled)
    .sort(
      (left, right) => new Date(right.pushed_at).getTime() - new Date(left.pushed_at).getTime(),
    )
    .slice(0, RECENT_COMMIT_REPO_LIMIT);

  const commitBatches = await Promise.all(
    trackedRepos.map(async (repo) => {
      try {
        const commits = await fetchJson<GitHubCommitResponse[]>(
          `/repos/${repo.full_name}/commits?author=${GITHUB_USERNAME}&per_page=${RECENT_COMMITS_PER_REPO}&since=${encodeURIComponent(oneYearAgo.toISOString())}`,
        );

        return commits.map((commit) => ({
          sha: commit.sha,
          shortSha: commit.sha.slice(0, 7),
          message: commit.commit.message.split('\n')[0],
          url: commit.html_url,
          repoName: repo.name,
          repoUrl: repo.html_url,
          createdAt: commit.commit.author?.date ?? repo.pushed_at,
        } satisfies GitHubRecentCommit));
      } catch {
        return [];
      }
    }),
  );

  return commitBatches
    .flat()
    .sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 8);
}

function readCache(maxAge = CACHE_TTL) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const cachedValue = JSON.parse(rawValue) as CachedGitHubPortfolioData;

    if (Date.now() - cachedValue.timestamp > maxAge) {
      return null;
    }

    return cachedValue;
  } catch {
    return null;
  }
}

function writeCache(data: GitHubPortfolioData) {
  if (typeof window === 'undefined') {
    return;
  }

  const cachedValue: CachedGitHubPortfolioData = {
    timestamp: Date.now(),
    data,
  };

  memoryCache = cachedValue;

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cachedValue));
  } catch {
    // Ignore storage write failures.
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(responseText || `GitHub API request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function fetchGitHubPortfolioData() {
  const [profileResponse, repoResponse] = await Promise.all([
    fetchJson<GitHubProfileResponse>(`/users/${GITHUB_USERNAME}`),
    fetchJson<GitHubRepoResponse[]>(`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`),
  ]);

  const repoSelection = selectFeaturedRepos(repoResponse);
  const recentCommits = await fetchRecentCommits(repoResponse);

  return {
    profile: toProfile(profileResponse),
    featuredRepos: repoSelection.featuredRepos,
    allRepoCount: repoSelection.allRepoCount,
    recentCommits,
  } satisfies GitHubPortfolioData;
}

export async function getGitHubPortfolioData() {
  if (memoryCache && Date.now() - memoryCache.timestamp <= CACHE_TTL) {
    return memoryCache.data;
  }

  const freshLocalCache = readCache();
  if (freshLocalCache) {
    memoryCache = freshLocalCache;
    return freshLocalCache.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = fetchGitHubPortfolioData()
    .then((data) => {
      writeCache(data);
      return data;
    })
    .catch((error) => {
      const staleCache = readCache(Number.POSITIVE_INFINITY);

      if (staleCache) {
        memoryCache = staleCache;
        return staleCache.data;
      }

      throw error;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
}

export function useGitHubPortfolioData() {
  const [data, setData] = useState<GitHubPortfolioData | null>(memoryCache?.data ?? null);
  const [isLoading, setIsLoading] = useState(!memoryCache?.data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(!memoryCache?.data);

    getGitHubPortfolioData()
      .then((githubData) => {
        if (!isMounted) {
          return;
        }

        setData(githubData);
        setError(null);
      })
      .catch((caughtError) => {
        if (!isMounted) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : 'Unable to load GitHub data.';
        setError(message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
  };
}

export function formatRelativeDate(dateString: string) {
  const days = daysSince(dateString);

  if (days === 0) {
    return 'today';
  }

  if (days === 1) {
    return '1 day ago';
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months === 1) {
    return '1 month ago';
  }

  if (months < 12) {
    return `${months} months ago`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function formatShortDate(dateString: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}
