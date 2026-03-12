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

const repoSkeletons = Array.from({ length: 4 }, (_, index) => index);
export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { data, isLoading, error } = useGitHubPortfolioData();

  const profile = data?.profile;
  const featuredRepos = data?.featuredRepos ?? [];
  const spotlightRepo = featuredRepos[0];
  const supportingRepos = featuredRepos.slice(1, 5);
  const profileUrl = profile?.url ?? 'https://github.com/littlestronomer';
  const recentCommits = data?.recentCommits ?? [];

  return (
    <section id="projects" className="section" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={popAnimation}
        >
          <div className="section-heading">
            <span className="section-kicker">Public GitHub Surface</span>
            <h2 className="section-title">Selected public repositories</h2>
            <p className="section-subtitle">
              The public repo list stays curated here, while recent commit activity now lives next
              to the hero so visitors immediately see that the work is active.
            </p>
          </div>

          <div className="github-summary card">
            <div>
              <p className="panel-label">Source of Truth</p>
              <h3 className="panel-title">Public repos are the main portfolio layer.</h3>
              <p className="panel-copy">
                Add the topics `featured` or `portfolio` on GitHub to pin repositories here. Until
                the MLSys work goes public, the portfolio highlights the best public repos while the
                recent public commit stream stays visible in the hero.
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
                  {recentCommits[0] ? formatRelativeDate(recentCommits[0].createdAt) : '--'}
                </span>
                <span className="stat-chip-label">Latest public push</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-value">{profile?.location?.trim() || 'Istanbul / Waterloo'}</span>
                <span className="stat-chip-label">Base</span>
              </div>
            </div>
          </div>

          <div className="projects-layout">
            <div className="projects-main-column">
              {isLoading && (
                <>
                  <div className="card featured-repo-card skeleton-card">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-tag-row">
                      <span className="skeleton-tag" />
                      <span className="skeleton-tag" />
                    </div>
                  </div>
                  <div className="repo-mini-grid">
                    {repoSkeletons.map((item) => (
                      <div key={item} className="card repo-card skeleton-card">
                        <div className="skeleton-line skeleton-line-short" />
                        <div className="skeleton-line skeleton-line-title" />
                        <div className="skeleton-line" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!isLoading && spotlightRepo && (
                <motion.a
                  href={spotlightRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card featured-repo-card"
                  initial={{ opacity: 0, y: 18 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.16 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="featured-repo-topline">
                    <span className="repo-language">Spotlight Repository</span>
                    <span className="repo-date">Updated {formatRelativeDate(spotlightRepo.pushedAt)}</span>
                  </div>

                  <h3 className="featured-repo-title">{spotlightRepo.name}</h3>
                  <p className="featured-repo-description">{spotlightRepo.description}</p>

                  <div className="repo-topic-row">
                    {(spotlightRepo.topics.length > 0
                      ? spotlightRepo.topics
                      : ['GitHub', spotlightRepo.language ?? 'Project']
                    )
                      .slice(0, 4)
                      .map((topic) => (
                        <span key={topic} className="repo-topic">
                          {topic}
                        </span>
                      ))}
                  </div>

                  <div className="featured-repo-footer">
                    <span>Language {spotlightRepo.language ?? 'Mixed'}</span>
                    <span>Stars {spotlightRepo.stars}</span>
                    <span>Forks {spotlightRepo.forks}</span>
                    <span>{formatShortDate(spotlightRepo.updatedAt)}</span>
                  </div>
                </motion.a>
              )}

              {!isLoading && supportingRepos.length > 0 && (
                <div className="repo-mini-grid">
                  {supportingRepos.map((repo, index) => (
                    <motion.a
                      key={repo.id}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card repo-card"
                      initial={{ opacity: 0, y: 18 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.35, delay: 0.22 + index * 0.06 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="repo-card-head">
                        <span className="repo-language">{repo.language ?? 'Code'}</span>
                        <span className="repo-date">{formatRelativeDate(repo.pushedAt)}</span>
                      </div>
                      <h3 className="repo-title">{repo.name}</h3>
                      <p className="repo-description">{repo.description}</p>
                    </motion.a>
                  ))}
                </div>
              )}

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
                <a
                  href={`${profileUrl}?tab=repositories`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  View All Repositories
                </a>
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Open GitHub Overview
                </a>
              </div>
            </div>
          </div>

          {error && !data && (
            <p className="github-error">
              GitHub data could not be loaded right now. Reloading later should restore the live
              repository list and public commit log.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
