import { useEffect, useState } from 'react'

// Keeps "Lately on GitHub" current while the page is open, from GitHub's public activity
// feed. Visitors are not signed in to GitHub, so every request counts against their limit
// of 60 an hour. GitHub also caches the feed for five minutes, so the browser answers most
// checks from its own cache and a visitor spends about a dozen requests an hour at most.

const USER = 'littlestronomer'
const FEED_URL = `https://api.github.com/users/${USER}/events/public?per_page=30`
const SHOWN = 3
const CHECK_EVERY_MS = 2 * 60 * 1000
const MESSAGES_KEY = 'horizon-commit-messages:v1'

export type LiveCommit = {
  sha: string
  /** First line of the commit message. */
  message: string
  url: string
  repo: string
  /** When the push reached GitHub (ISO 8601). */
  pushedAt: string
}

export type LiveCommits = {
  /** isNew marks a commit that showed up while the page was open. */
  commits: (LiveCommit & { isNew: boolean })[]
  /** loading: first check under way. live: checking on a schedule. resting: GitHub asked us to
   *  slow down until resumesAt. failed: GitHub could not be reached. */
  status: 'loading' | 'live' | 'resting' | 'failed'
  resumesAt: number | null
}

type PushEvent = {
  type: string
  created_at: string
  repo: { name: string }
  payload: { head?: string }
}

// The feed no longer carries commit messages (GitHub removed them in October 2025), so each
// new push costs one more request for its message. Messages never change, so they are kept.
function loadMessages(): Map<string, LiveCommit> {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? '{}')))
  } catch {
    return new Map()
  }
}

const messages = loadMessages()

function saveMessages() {
  try {
    const newest = [...messages.values()].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)).slice(0, 20)
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(Object.fromEntries(newest.map((commit) => [commit.sha, commit]))))
  } catch {
    // Storage can be full or blocked; the messages are only a convenience.
  }
}

// Lookups already on their way, so two checks never ask GitHub for the same commit twice.
const lookups = new Map<string, Promise<LiveCommit | null>>()

function describePush(event: PushEvent): Promise<LiveCommit | null> {
  const sha = event.payload.head
  if (!sha) return Promise.resolve(null)
  const known = messages.get(sha)
  if (known) return Promise.resolve(known)
  let lookup = lookups.get(sha)
  if (!lookup) {
    lookup = lookUpCommit(event, sha).finally(() => lookups.delete(sha))
    lookups.set(sha, lookup)
  }
  return lookup
}

async function lookUpCommit(event: PushEvent, sha: string): Promise<LiveCommit | null> {
  const response = await fetch(`https://api.github.com/repos/${event.repo.name}/commits/${sha}`)
  if (!response.ok) return null
  const details = (await response.json()) as { html_url: string; commit: { message: string } }
  const commit = {
    sha,
    message: details.commit.message.split('\n')[0],
    url: details.html_url,
    repo: event.repo.name.split('/')[1] ?? event.repo.name,
    pushedAt: event.created_at,
  }
  messages.set(sha, commit)
  saveMessages()
  return commit
}

export function useLiveCommits(): LiveCommits {
  const [state, setState] = useState<LiveCommits>({ commits: [], status: 'loading', resumesAt: null })

  useEffect(() => {
    let stopped = false
    let timer = 0
    let lastCheck = 0
    let wait = CHECK_EVERY_MS

    const schedule = (ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(check, ms)
    }

    async function check() {
      // A hidden tab stops checking; coming back to it picks up where it left off.
      if (stopped || document.visibilityState !== 'visible') return
      lastCheck = Date.now()
      wait = CHECK_EVERY_MS
      try {
        const response = await fetch(FEED_URL)
        if (response.status === 403 || response.status === 429) {
          const reset = Number(response.headers.get('X-RateLimit-Reset')) * 1000
          const resumesAt = reset > Date.now() ? reset : Date.now() + 10 * 60 * 1000
          wait = resumesAt - Date.now()
          if (!stopped) setState((previous) => ({ ...previous, status: 'resting', resumesAt }))
          return
        }
        if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
        wait = Math.max(CHECK_EVERY_MS, Number(response.headers.get('X-Poll-Interval')) * 1000 || 0)
        const events = (await response.json()) as PushEvent[]
        const pushes = events.filter((event) => event.type === 'PushEvent').slice(0, SHOWN)
        const commits = (await Promise.all(pushes.map(describePush))).filter((commit) => commit !== null)
        if (!stopped) {
          setState((previous) => ({
            commits: commits.map((commit) => ({
              ...commit,
              isNew: previous.status !== 'loading' && !previous.commits.some((seen) => seen.sha === commit.sha),
            })),
            status: 'live',
            resumesAt: null,
          }))
        }
      } catch {
        if (!stopped) setState((previous) => ({ ...previous, status: 'failed', resumesAt: null }))
      } finally {
        if (!stopped) schedule(wait)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') schedule(Math.max(0, lastCheck + wait - Date.now()))
      else window.clearTimeout(timer)
    }

    check()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return state
}

/** The current time, refreshed every `everyMs`, so "3 minutes ago" keeps counting. */
export function useNow(everyMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(id)
  }, [everyMs])
  return now
}

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "3 minutes ago", "yesterday", "5 days ago". */
export function timeAgo(iso: string, now: number) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
