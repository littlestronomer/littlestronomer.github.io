import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const focusTags = [
  'CUDA',
  'TensorRT',
  'PyTorch',
  'Speech Processing',
  'Computer Vision',
  'LLM Fine-Tuning',
  'Real-Time Systems',
  'Parallel Computing',
  'Diffusion Models',
  'FastAPI',
];

const highlights = [
  {
    label: 'Scale',
    value: '3.7TB+',
    detail: 'Audio preprocessing pipeline designed for large multi-format datasets.',
  },
  {
    label: 'Speed',
    value: '2x-4x',
    detail: 'Faster-than-real-time processing in production-oriented internship work.',
  },
  {
    label: 'Research',
    value: 'F1 0.92',
    detail: 'Idiomatic expression detection across Turkish and Italian NLP settings.',
  },
  {
    label: 'Proof',
    value: 'OSS + awards',
    detail: 'Hackathon placements, merged contributions, and public experimentation.',
  },
];

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

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="section section-alt" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={popAnimation}
        >
          <div className="section-heading">
            <span className="section-kicker">About</span>
            <h2 className="section-title">Research energy with systems instincts</h2>
            <p className="section-subtitle">
              I am an AI engineering student at Istanbul Technical University, currently shaped by
              both ITU and the University of Waterloo, with a strong bias toward fast systems,
              careful experimentation, and GPU-aware product building.
            </p>
          </div>

          <div className="about-layout">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="about-copy card"
            >
              <p>
                My favorite problems live where research meets performance engineering: speech and
                audio systems, model acceleration, low-latency inference, and tooling that makes AI
                feel responsive instead of theatrical.
              </p>
              <p>
                I have worked on large-scale audio preprocessing, XTTS and CosyVoice fine-tuning,
                real-time diarization and transcription, idiomatic expression detection, and
                machine unlearning on diffusion models. I care as much about how a system runs as
                what it predicts.
              </p>
              <p>
                The throughline is simple: build things that are technically sharp, experimentally
                grounded, and fast enough to matter in the real world.
              </p>

              <div className="about-tags">
                {focusTags.map((tag) => (
                  <span key={tag} className="skill-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="about-highlight-grid">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={highlight.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.22 + index * 0.06 }}
                  className="card highlight-card"
                >
                  <span className="highlight-label">{highlight.label}</span>
                  <strong className="highlight-value">{highlight.value}</strong>
                  <p className="highlight-detail">{highlight.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
