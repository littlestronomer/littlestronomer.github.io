import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const workstreams = [
  {
    stage: 'Prefill',
    summary: 'Reduce prompt ingestion cost so long contexts do not dominate end-to-end latency.',
  },
  {
    stage: 'Decode',
    summary: 'Tighten the token-by-token critical path where every microsecond compounds.',
  },
  {
    stage: 'Systems View',
    summary: 'Treat memory traffic, scheduling, and GPU efficiency as first-class design constraints.',
  },
];

const workingNotes = [
  'Currently participating in the MLSys conference NVIDIA track with a friend.',
  'Focused on optimizing Gated DeltaNet rather than only benchmarking it.',
  'Planning to make the work public once the repo is ready to share cleanly.',
];

const popAnimation = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 24,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      duration: 0.7,
      bounce: 0.16,
    },
  },
};

export default function CurrentWork() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="current-work" className="section current-work-section" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={popAnimation}
        >
          <div className="section-heading">
            <span className="section-kicker">Now</span>
            <h2 className="section-title">MLSys x NVIDIA track, with Gated DeltaNet in the loop</h2>
            <p className="section-subtitle">
              Right now the most honest representation of my work is not a static portfolio entry.
              It is an active optimization effort around Gated DeltaNet prefill and decode stages,
              approached like a systems problem rather than a demo problem.
            </p>
          </div>

          <div className="current-work-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="card current-work-primary"
            >
              <div className="current-work-chip-row">
                <span className="current-work-chip">MLSys conference</span>
                <span className="current-work-chip">NVIDIA track</span>
                <span className="current-work-chip">Gated DeltaNet</span>
              </div>

              <h3 className="current-work-title">The current question is simple: how far can we push the inference path?</h3>
              <p className="current-work-copy">
                I am working on the parts that actually decide whether a model feels deployable:
                prefill cost, decode efficiency, and the GPU-side realities that sit underneath the
                architecture. That means reasoning about throughput, memory movement, and how the
                implementation behaves in practice, not only in plots.
              </p>

              <div className="current-work-stage-grid">
                {workstreams.map((item, index) => (
                  <motion.div
                    key={item.stage}
                    initial={{ opacity: 0, y: 18 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.22 + index * 0.06 }}
                    className="stage-card"
                  >
                    <span className="stage-card-label">{item.stage}</span>
                    <p className="stage-card-copy">{item.summary}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="current-work-side-column">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.24 }}
                className="card current-work-secondary"
              >
                <p className="panel-label">Working Notes</p>
                <div className="current-work-note-list">
                  {workingNotes.map((note) => (
                    <div key={note} className="current-work-note-item">
                      <span className="hero-focus-dot" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="card current-work-secondary"
              >
                <p className="panel-label">Why It Matters</p>
                <h3 className="current-work-side-title">This is the kind of work I want the site to signal.</h3>
                <p className="panel-copy">
                  Less "I know ML" and more "I care about what happens in the hot path when real
                  inference workloads hit the hardware." Once the repository is public, it should be
                  the first thing visitors see in the GitHub section.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
