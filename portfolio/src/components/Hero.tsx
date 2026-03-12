import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const titles = [
  'AI Engineer / ML Systems Researcher',
  'CUDA Developer / Inference Optimizer',
  'Builder of fast speech and multimodal tools',
];

const highlightCards = [
  { label: 'Current track', value: 'MLSys x NVIDIA' },
  { label: 'Current target', value: 'Gated DeltaNet' },
  { label: 'Bias', value: 'Latency over fluff' },
];

const consoleRows = [
  { key: 'mode', value: 'active optimization' },
  { key: 'focus', value: 'decode + prefill stages' },
  { key: 'style', value: 'kernel-aware systems thinking' },
  { key: 'next', value: 'public repo soon' },
];

const consoleTrace = [
  'inspect hot path',
  'reduce prefill drag',
  'tighten decode loop',
  'ship the clean version',
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
    const startDelay = 2400;
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
          }, 420);
        }, 1800);
      }, 44);
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
              <span className="hero-subtitle-prefix">&gt; role</span>
              <span className={`hero-subtitle-line${isSelecting ? ' is-selected' : ''}`}>
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
              I like the part of AI where ideas collide with hardware: CUDA, inference hot paths,
              speech systems, multimodal tooling, and the small performance decisions that decide
              whether something feels instant or unusable.
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

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.25, duration: 0.5 }}
              className="hero-meta-grid"
            >
              {highlightCards.map((card) => (
                <div key={card.label} className="hero-meta-card">
                  <span className="hero-meta-label">{card.label}</span>
                  <strong className="hero-meta-value">{card.value}</strong>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.9, duration: 0.55 }}
            className="card hero-console"
          >
            <div className="console-head">
              <div>
                <p className="panel-label">Live Console</p>
                <h2 className="console-title">Current work, current obsessions, current signal.</h2>
              </div>
              <div className="console-leds" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="console-grid">
              {consoleRows.map((row) => (
                <div key={row.key} className="console-row">
                  <span className="console-key">{row.key}</span>
                  <span className="console-value">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="console-trace">
              {consoleTrace.map((item, index) => (
                <div key={item} className="console-trace-item">
                  <span className="console-trace-index">0{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
