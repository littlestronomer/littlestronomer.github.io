import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  formatRelativeDate,
  formatShortDate,
  useGitHubPortfolioData,
} from '../lib/github';

const popAnimation = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 24,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      duration: 0.7,
      bounce: 0.18,
    },
  },
};

const repoSkeletons = Array.from({ length: 6 }, (_, index) => index);
const activitySkeletons = Array.from({ length: 4 }, (_, index) => index);

export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { data, isLoading, error } = useGitHubPortfolioData();

  const featuredRepos = data?.featuredRepos ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const profile = data?.profile;
  const profileUrl = profile?.url ?? 'https://github.com/littlestronomer';

  return (
    <section id="projects" className="section" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={popAnimation}
        >
          <div className="section-heading">
            <span className="section-kicker">Live From GitHub</span>
            <h2 className="section-title">Featured Repositories</h2>
            <p className="section-subtitle">
              Repositories and recent push events now come straight from your public GitHub,
              so the portfolio updates with the work instead of waiting for manual edits.
            </p>
          </div>

          <div className="github-summary card">
            <div>
              <p className="panel-label">GitHub Snapshot</p>
              <h3 className="panel-title">Your website now uses GitHub as the source of truth.</h3>
              <p className="panel-copy">
                Add the topics `featured` or `portfolio` on any repository to curate this grid.
                If nothing is tagged, the site automatically falls back to your latest non-fork
                public repositories.
              </p>
            </div>

            <div className="github-stats-grid">
              <div className="stat-chip">
                <span className="stat-chip-value">{profile?.publicRepos ?? data?.allRepoCount ?? '--'}</span>
                <span className="stat-chip-label">Public repos</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-value">{profile?.followers ?? '--'}</span>
                <span className="stat-chip-label">Followers</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-value">
                  {recentActivity[0] ? formatRelativeDate(recentActivity[0].createdAt) : '--'}
                </span>
                <span className="stat-chip-label">Latest push</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-value">{profile?.location?.trim() || 'Istanbul / Waterloo'}</span>
                <span className="stat-chip-label">Base</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 repo-grid">
            {isLoading &&
              repoSkeletons.map((item) => (
                <div key={item} className="card repo-card skeleton-card">
                  <div className="skeleton-line skeleton-line-short" />
                  <div className="skeleton-line skeleton-line-title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                  <div className="skeleton-tag-row">
                    <span className="skeleton-tag" />
                    <span className="skeleton-tag" />
                    <span className="skeleton-tag" />
                  </div>
                </div>
              ))}

            {!isLoading &&
              featuredRepos.map((repo, index) => (
                <motion.a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 18 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.16 + index * 0.06 }}
                  whileHover={{ y: -6 }}
                  className="card repo-card"
                >
                  <div className="repo-card-head">
                    <span className="repo-language">{repo.language ?? 'Code'}</span>
                    <span className="repo-date">Updated {formatRelativeDate(repo.pushedAt)}</span>
                  </div>

                  <h3 className="repo-title">{repo.name}</h3>
                  <p className="repo-description">{repo.description}</p>

                  <div className="repo-topic-row">
                    {(repo.topics.length > 0 ? repo.topics : ['GitHub', repo.language ?? 'Project'])
                      .slice(0, 4)
                      .map((topic) => (
                        <span key={topic} className="repo-topic">
                          {topic}
                        </span>
                      ))}
                  </div>

                  <div className="repo-card-footer">
                    <span>Stars {repo.stars}</span>
                    <span>Forks {repo.forks}</span>
                    <span>{formatShortDate(repo.updatedAt)}</span>
                  </div>
                </motion.a>
              ))}
          </div>

          {!isLoading && featuredRepos.length === 0 && (
            <div className="card github-empty-state">
              <h3>No repositories matched yet.</h3>
              <p>
                The GitHub API is reachable, but there are no non-fork public repositories to
                display right now.
              </p>
            </div>
          )}

          <div className="projects-actions">
            <a href={`${profileUrl}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              View All Repositories
            </a>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Open GitHub Overview
            </a>
          </div>

          <div className="activity-block">
            <div className="activity-heading">
              <div>
                <span className="section-kicker">Commit Pulse</span>
                <h3 className="activity-title">Recent public pushes</h3>
              </div>
              <p className="activity-copy">
                A lightweight activity feed sourced from GitHub public events, with direct links to
                the underlying commits.
              </p>
            </div>

            <div className="activity-grid">
              {isLoading &&
                activitySkeletons.map((item) => (
                  <div key={item} className="card activity-card skeleton-card">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </div>
                ))}

              {!isLoading &&
                recentActivity.map((event, index) => (
                  <motion.div
                    key={event.id}
                    className="card activity-card"
                    initial={{ opacity: 0, y: 18 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.24 + index * 0.06 }}
                  >
                    <div className="activity-card-head">
                      <div>
                        <p className="activity-repo-name">
                          <a href={event.repoUrl} target="_blank" rel="noopener noreferrer">
                            {event.repoName}
                          </a>
                        </p>
                        <p className="activity-meta">
                          {event.commitCount} commit{event.commitCount > 1 ? 's' : ''} to {event.branch}
                        </p>
                      </div>
                      <span className="activity-time">{formatRelativeDate(event.createdAt)}</span>
                    </div>

                    <div className="commit-list">
                      {event.commits.map((commit) => (
                        <a
                          key={commit.sha}
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="commit-item"
                        >
                          <span className="commit-sha">{commit.shortSha}</span>
                          <span className="commit-message">{commit.message}</span>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                ))}
            </div>

            {!isLoading && recentActivity.length === 0 && (
              <div className="card github-empty-state">
                <h3>No recent public push events.</h3>
                <p>As soon as new pushes land on public repositories, they will appear here.</p>
              </div>
            )}
          </div>

          {error && !data && (
            <p className="github-error">
              GitHub data could not be loaded right now. The layout is ready; reloading later should
              restore the live repository and commit feed.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
