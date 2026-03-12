import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const highlights = [
  '3.7TB+ audio pipeline',
  '2x-4x faster than real time',
  'Merged open-source contributions',
];

const titles = ['AI Engineer', 'ML Systems Researcher', 'CUDA Developer'];

const focusAreas = [
  'Low-latency speech and multimodal systems',
  'CUDA, TensorRT, and inference optimization',
  'Research-minded product engineering',
];

export default function Hero() {
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);

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
      window.setTimeout(() => setIsTypingComplete(true), 500);
    }, 90);

    const cursorInterval = window.setInterval(() => {
      setShowCursor((previous) => !previous);
    }, 500);

    return () => {
      window.clearInterval(typeInterval);
      window.clearInterval(cursorInterval);
    };
  }, [fullText]);

  useEffect(() => {
    const startDelay = 2800;
    let titleIndex = 0;
    let typeTitleId = 0;
    let pauseTimeoutId = 0;
    let loopTimeoutId = 0;

    const cycleSubtitle = () => {
      const currentTitle = titles[titleIndex];
      let charIndex = 0;

      typeTitleId = window.setInterval(() => {
        if (charIndex <= currentTitle.length) {
          setSubtitle(currentTitle.slice(0, charIndex));
          setIsSelecting(false);
          charIndex += 1;
          return;
        }

        window.clearInterval(typeTitleId);
        pauseTimeoutId = window.setTimeout(() => {
          setIsSelecting(true);

          loopTimeoutId = window.setTimeout(() => {
            titleIndex = (titleIndex + 1) % titles.length;
            cycleSubtitle();
          }, 280);
        }, 1900);
      }, 70);
    };

    const startTimeoutId = window.setTimeout(() => {
      cycleSubtitle();
    }, startDelay);

    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(pauseTimeoutId);
      window.clearTimeout(loopTimeoutId);
      window.clearInterval(typeTitleId);
    };
  }, []);

  return (
    <section id="home" className="section hero-section">
      <div className="container">
        <div className="hero-grid">
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-copy-block"
          >
            <span className="hero-eyebrow">Istanbul x Waterloo | AI systems | CUDA-first engineering</span>

            <h1 className="hero-title">
              {text}
              {!isTypingComplete && (
                <span
                  className="hero-cursor"
                  style={{ opacity: showCursor ? 0.8 : 0 }}
                  aria-hidden="true"
                />
              )}
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.5 }}
              className="hero-rotating-title"
            >
              <span
                className={`hero-rotating-title-text${isSelecting ? ' is-selected' : ''}`}
              >
                {subtitle}
              </span>
              <span className="hero-rotating-cursor">|</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.2, duration: 0.5 }}
              className="hero-description"
            >
              I build low-latency AI systems that feel immediate, from speech pipelines and
              CUDA-accelerated inference to multimodal tools that turn research into usable
              products.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.4, duration: 0.45 }}
              className="hero-highlight-row"
            >
              {highlights.map((highlight) => (
                <span key={highlight} className="hero-highlight-pill">
                  {highlight}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.8, duration: 0.5 }}
              className="hero-actions"
            >
              <a href="#projects" className="btn btn-primary">
                Explore GitHub Work
              </a>
              <a href="/Awesome_CV.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Open Resume
              </a>
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.5, duration: 0.55 }}
            className="hero-panel card"
          >
            <p className="panel-label">Current Focus</p>
            <h2 className="panel-title">Latency, throughput, and research that survives contact with production.</h2>
            <p className="panel-copy">
              I care about the full stack of modern AI systems: model behavior, kernel-level
              performance, developer ergonomics, and user-facing responsiveness.
            </p>

            <div className="hero-focus-list">
              {focusAreas.map((area) => (
                <div key={area} className="hero-focus-item">
                  <span className="hero-focus-dot" />
                  <span>{area}</span>
                </div>
              ))}
            </div>

            <div className="hero-panel-footer">
              <div>
                <span className="panel-foot-label">Best fit</span>
                <strong>ML systems, GPU optimization, speech/audio, multimodal tooling</strong>
              </div>
              <div>
                <span className="panel-foot-label">Open to</span>
                <strong>Research collaborations, internships, and ambitious engineering teams</strong>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
