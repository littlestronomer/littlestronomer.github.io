import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const popAnimation = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 40
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      duration: 0.7,
      bounce: 0.25
    }
  }
};

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="section" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={popAnimation}
        >
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">
            Feel free to reach out if you're looking for an AI engineer, 
            have a research collaboration idea, or just want to connect.
          </p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                type: "tween",
                duration: 0.5, 
                delay: 0.3
              }}
              style={{ marginBottom: '3rem' }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#a0e426' }}>
                Let's Connect
              </h3>
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                style={{ marginBottom: '2rem' }}
              >
                <p style={{ fontSize: '0.875rem', color: '#808080', marginBottom: '0.25rem' }}>Email</p>
                <a 
                  href="mailto:gbdervio@uwaterloo.ca" 
                  style={{ fontSize: '1.125rem', color: '#76b900', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#a0e426'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#76b900'}
                >
                  gbdervio@uwaterloo.ca
                </a>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                style={{ marginBottom: '2rem' }}
              >
                <p style={{ fontSize: '0.875rem', color: '#808080', marginBottom: '0.25rem' }}>Location</p>
                <p style={{ fontSize: '1.125rem' }}>Istanbul, Turkey / Waterloo, Canada</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                style={{ marginBottom: '3rem' }}
              >
                <p style={{ fontSize: '0.875rem', color: '#808080', marginBottom: '0.25rem' }}>Status</p>
                <motion.p 
                  animate={{ color: ['#a0e426', '#76b900', '#a0e426'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: '1.125rem' }}
                >
                  Open to opportunities
                </motion.p>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                type: "tween",
                duration: 0.5, 
                delay: 0.7
              }}
              style={{ marginBottom: '3rem' }}
            >
              <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Follow Me</h4>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { name: 'GitHub', url: 'https://github.com/littlestronomer' },
                  { name: 'LinkedIn', url: 'https://linkedin.com/in/gokturk-batin-dervisoglu' },
                  { name: 'Twitter', url: 'https://twitter.com/littlestronomer' }
                ].map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ 
                      type: "tween",
                      duration: 0.3, 
                      delay: 0.8 + index * 0.05
                    }}
                    whileHover={{ 
                      scale: 1.05
                    }}
                    whileTap={{ scale: 0.98 }}
                    style={{ padding: '10px 24px' }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                type: "tween",
                duration: 0.5, 
                delay: 1
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 8px 20px rgba(160, 228, 38, 0.15)"
              }}
              className="card"
              style={{ 
                maxWidth: '400px', 
                margin: '0 auto'
              }}
            >
              <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#a0e426' }}>
                Future Goals
              </h4>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.1 }}
                style={{ marginBottom: '0.5rem' }}
              >
                🎓 Ph.D. in ML/Generative AI
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.15 }}
                style={{ marginBottom: '0.5rem' }}
              >
                🎯 Target: CMU, NUS, Tsinghua
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
              >
                🚀 Long-term: AI Engineer at frontier labs
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}