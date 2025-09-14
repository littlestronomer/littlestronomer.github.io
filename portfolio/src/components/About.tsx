import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const skills = [
  'CUDA', 'TensorRT', 'PyTorch', 'Python', 'C/C++',
  'Computer Vision', 'Generative AI', 'Diffusion Models',
  'Real-time Systems', 'Parallel Computing', 'ONNX',
  'Docker', 'Kubernetes', 'FastAPI'
];

const popAnimation = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 30
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.6,
      bounce: 0.2
    }
  }
};

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="section section-alt" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={popAnimation}
        >
          <h2 className="section-title">About Me</h2>
          
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginBottom: '3rem' }}
            >
              <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
                Hello! I'm a passionate AI engineer with expertise in high-performance computing 
                and parallel programming. Currently pursuing my B.Sc. in Artificial Intelligence & 
                Data Engineering at Istanbul Technical University (ITU), with an exchange at the 
                University of Waterloo.
              </p>
              <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
                I specialize in developing efficient AI algorithms and leveraging GPU acceleration 
                using CUDA to solve computationally intensive problems. My work bridges machine 
                learning research, real-time systems, and embedded AI optimization.
              </p>
              <p style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
                Experienced in CUDA kernel fusion, TensorRT deployment, and creating solutions 
                that not only work but work fast and efficiently.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#a0e426' }}>
                Technical Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                {skills.map((skill, index) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ 
                      type: "tween",
                      duration: 0.3, 
                      delay: 0.5 + index * 0.02
                    }}
                    className="skill-tag"
                    whileHover={{ scale: 1.05 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}