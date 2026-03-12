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
  const [selectedCharacters, setSelectedCharacters] = useState(0);

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
    let selectionIndex = 0;
    let timeoutId = 0;

    const typeSubtitle = () => {
      const currentTitle = titles[titleIndex];
      if (charIndex <= currentTitle.length) {
        setSubtitle(currentTitle.slice(0, charIndex));
        setSelectedCharacters(0);
        charIndex += 1;
        timeoutId = window.setTimeout(typeSubtitle, 44);
        return;
      }

      timeoutId = window.setTimeout(selectSubtitle, 1050);
    };

    const startTimeoutId = window.setTimeout(() => {
      typeSubtitle();
    }, startDelay);

    const selectSubtitle = () => {
      const currentTitle = titles[titleIndex];
      if (selectionIndex <= currentTitle.length) {
        setSelectedCharacters(selectionIndex);
        selectionIndex += 1;
        timeoutId = window.setTimeout(selectSubtitle, 18);
        return;
      }

      timeoutId = window.setTimeout(() => {
        setSubtitle('');
        setSelectedCharacters(0);
        charIndex = 0;
        selectionIndex = 0;
        titleIndex = (titleIndex + 1) % titles.length;
        timeoutId = window.setTimeout(typeSubtitle, 180);
      }, 110);
    };

    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const selectedSubtitle = subtitle.slice(0, selectedCharacters);
  const unselectedSubtitle = subtitle.slice(selectedCharacters);

  return (
    <section id="home" className="section hero-section">
      <div className="container">
        <div className="hero-shell">
          <div className="hero-lighting" aria-hidden="true">
            <span className="hero-light hero-light-primary" />
            <span className="hero-light hero-light-secondary" />
            <span className="hero-light hero-light-beam" />
          </div>

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
              <span className="hero-subtitle-prefix">gokturk@lab:~$</span>
              <span className="hero-subtitle-line">
                <span className="hero-subtitle-selected">{selectedSubtitle}</span>
                <span className="hero-subtitle-plain">{unselectedSubtitle || (!selectedSubtitle ? '\u00A0' : '')}</span>
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
