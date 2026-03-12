import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatRelativeDate, useGitHubPortfolioData } from '../lib/github';

const titles = [
  'AI Engineer / ML Systems Researcher',
  'CUDA Developer / Inference Optimizer',
  'Generative AI Architectures / Diffusion / Flows / AR',
];

const activitySkeletons = Array.from({ length: 5 }, (_, index) => index);

export default function Hero() {
  const { data, isLoading } = useGitHubPortfolioData();
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [isSelected, setIsSelected] = useState(false);
  const recentCommits = data?.recentCommits ?? [];
  const yearlyCommitCount = data?.publicCommitCountLastYear ?? 0;

  const firstName = 'Göktürk Batın';
  const lastName = 'Dervişoğlu';
  const fullText = `${firstName}\n${lastName}`;

  useEffect(() => {
    let index = 0;
    const typeInterval = window.setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index));
        index += 1;
        return;
      }

      window.clearInterval(typeInterval);
      window.setTimeout(() => setIsTypingComplete(true), 350);
    }, 80);

    const cursorInterval = window.setInterval(() => {
      setShowCursor((previous) => !previous);
    }, 480);

    return () => {
      window.clearInterval(typeInterval);
      window.clearInterval(cursorInterval);
    };
  }, [fullText]);

  useEffect(() => {
    const startDelay = 2200;
    let titleIndex = 0;
    let charIndex = 0;
    let timeoutId = 0;

    const typeSubtitle = () => {
      const currentTitle = titles[titleIndex];
      if (charIndex <= currentTitle.length) {
        setSubtitle(currentTitle.slice(0, charIndex));
        setIsSelected(false);
        charIndex += 1;
        timeoutId = window.setTimeout(typeSubtitle, 44);
        return;
      }

      timeoutId = window.setTimeout(() => {
        setIsSelected(true);

        timeoutId = window.setTimeout(() => {
          setSubtitle('');
          setIsSelected(false);
          charIndex = 0;
          titleIndex = (titleIndex + 1) % titles.length;
          timeoutId = window.setTimeout(typeSubtitle, 160);
        }, 140);
      }, 1150);
    };

    const startTimeoutId = window.setTimeout(() => {
      typeSubtitle();
    }, startDelay);

    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section id="home" className="section hero-section">
      <div className="container">
        <div className="hero-shell">
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-main"
          >
            <span className="hero-badge">Live from MLSys conference, currently in the NVIDIA track</span>
            <p className="hero-pretitle">Research Lab Console / Personal Site / GPU-Aware AI Systems</p>

            <h1 className="hero-title">
              {text}
              {!isTypingComplete && (
                <span
                  className="hero-cursor"
                  style={{ opacity: showCursor ? 0.85 : 0 }}
                  aria-hidden="true"
                />
              )}
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.45 }}
              className="hero-subtitle-wrap"
            >
              <span className={`hero-subtitle-line${isSelected ? ' is-selected' : ''}`}>
                {subtitle || '\u00A0'}
              </span>
              <span className="hero-rotating-cursor">|</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.5 }}
              className="hero-description"
            >
              I care about the place where model design meets systems reality: generative AI
              architectures, CUDA, inference hot paths, speech systems, and the performance
              decisions that decide whether something feels immediate or slow.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.95, duration: 0.45 }}
              className="hero-context-note"
            >
              Currently at MLSys in the NVIDIA track, working on Gated DeltaNet decode and prefill
              optimization while studying diffusion, flow matching, normalizing flows,
              autoregressive models, autoencoders, and GANs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.1, duration: 0.45 }}
              className="hero-actions"
            >
              <a href="#current-work" className="btn btn-primary">
                See Current Work
              </a>
              <a href="#projects" className="btn btn-secondary">
                Open Public GitHub Surface
              </a>
              <a href="/Awesome_CV.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Resume
              </a>
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.05, duration: 0.5 }}
            className="card hero-activity-card"
          >
            <p className="panel-label">Public Activity</p>
            <h2 className="panel-title">Public commits from the last year</h2>
            <p className="panel-copy hero-activity-copy">
              Showing the latest public commits from the last 12 months across your public
              repositories.
            </p>

            <div className="hero-activity-summary">
              <span className="hero-activity-count">{isLoading ? '--' : yearlyCommitCount}</span>
              <span className="hero-activity-label">public commits found in the last year</span>
            </div>

            <div className="commit-log-list hero-activity-list">
              {isLoading &&
                activitySkeletons.map((item) => (
                  <div key={item} className="commit-log-item skeleton-card">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line skeleton-line-title" />
                  </div>
                ))}

              {!isLoading &&
                recentCommits.map((commit) => (
                  <a
                    key={commit.sha}
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="commit-log-item"
                  >
                    <div className="commit-log-header">
                      <span className="commit-log-repo">{commit.repoName}</span>
                      <span className="commit-log-time">{formatRelativeDate(commit.createdAt)}</span>
                    </div>
                    <div className="commit-log-message-row">
                      <span className="commit-sha">{commit.shortSha}</span>
                      <span className="commit-message">{commit.message}</span>
                    </div>
                  </a>
                ))}
            </div>

            {!isLoading && recentCommits.length === 0 && (
              <div className="github-empty-state compact-empty-state">
                <h3>No public commits found for the last year.</h3>
                <p>If public repo commits appear later, they will be listed here.</p>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
