import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const contactLinks = [
  { name: 'GitHub', url: 'https://github.com/littlestronomer' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/gokturk-batin-dervisoglu' },
  { name: 'Resume', url: '/Awesome_CV.pdf' },
];

const fitAreas = [
  'ML systems and inference engineering',
  'Speech, audio, and multimodal research prototypes',
  'GPU optimization and performance-focused product work',
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
      bounce: 0.2,
    },
  },
};

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="contact" className="section" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={popAnimation}
        >
          <div className="section-heading">
            <span className="section-kicker">Contact</span>
            <h2 className="section-title">Let&apos;s build something fast and meaningful</h2>
            <p className="section-subtitle">
              I am most excited by teams and collaborators working on ML systems, real-time AI,
              speech or multimodal interfaces, and ambitious research-backed products.
            </p>
          </div>

          <div className="contact-layout">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="card contact-card"
            >
              <p className="panel-label">Reach Out</p>
              <h3 className="panel-title">Best for research collaborations, internships, and ML systems roles.</h3>
              <p className="panel-copy">
                If you are working on low-latency AI, GPU-heavy pipelines, or product ideas that
                need serious experimentation behind them, I would love to hear about it.
              </p>

              <div className="contact-detail-list">
                <div>
                  <span className="contact-detail-label">Email</span>
                  <a href="mailto:dervisoglu21@itu.edu.tr" className="contact-detail-value">
                    dervisoglu21@itu.edu.tr
                  </a>
                </div>
                <div>
                  <span className="contact-detail-label">Location</span>
                  <p className="contact-detail-value">Istanbul, Turkey / Waterloo, Canada</p>
                </div>
                <div>
                  <span className="contact-detail-label">Status</span>
                  <p className="contact-detail-value accent-text">Open to strong technical teams and research-heavy work</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.28 }}
              className="card contact-card"
            >
              <p className="panel-label">Good Match</p>
              <h3 className="panel-title">The kind of work I naturally lean toward</h3>
              <div className="hero-focus-list compact-focus-list">
                {fitAreas.map((area) => (
                  <div key={area} className="hero-focus-item">
                    <span className="hero-focus-dot" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>

              <div className="contact-links-row">
                {contactLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target={link.url.startsWith('http') ? '_blank' : undefined}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="btn btn-secondary"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.28, delay: 0.34 + index * 0.05 }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
