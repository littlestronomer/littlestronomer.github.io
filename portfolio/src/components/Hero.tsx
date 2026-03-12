import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const titles = [
  'AI Engineer / ML Systems Researcher',
  'CUDA Developer / Inference Optimizer',
  'Generative AI Architectures / Diffusion / Flows / AR',
];

const highlightCards = [
  { label: 'Current track', value: 'MLSys x NVIDIA' },
  { label: 'Current target', value: 'Gated DeltaNet' },
  { label: 'Depth', value: 'Diffusion / Flows / AR' },
];

export default function Hero() {
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [isSelected, setIsSelected] = useState(false);

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
              <span className="hero-subtitle-prefix">gokturk@lab:~$</span>
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
        </div>
      </div>
    </section>
  );
}
