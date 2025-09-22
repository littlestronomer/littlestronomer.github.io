import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const skillCategories = [
  {
    title: "Programming",
    skills: ["Python", "CUDA", "C/C++", "WebGL", "SQL"]
  },
  {
    title: "ML/AI Frameworks",
    skills: ["PyTorch", "TensorFlow", "TensorRT", "ONNX", "Hugging Face"]
  },
  {
    title: "Computer Vision",
    skills: ["OpenCV", "Segmentation", "Object Detection", "Image Matching", "3D Vision"]
  },
  {
    title: "Data & Analysis",
    skills: ["Pandas", "NumPy", "XGBoost", "Scikit-learn", "Weights & Biases", "Plotly"]
  },
  {
    title: "Deployment",
    skills: ["Docker", "Kubernetes", "FastAPI", "ONNX Runtime", "TensorRT"]
  },
  {
    title: "Tools & Systems",
    skills: ["Git", "Linux", "CUDA Toolkit", "Conda", "LaTeX"]
  }
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
      type: "spring" as const,
      duration: 0.6,
      bounce: 0.2
    }
  }
};

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="skills" className="section section-alt" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={popAnimation}
        >
          <h2 className="section-title">Technical Skills</h2>
          
          <div className="grid grid-cols-3">
            {skillCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  type: "tween",
                  duration: 0.4, 
                  delay: 0.2 + index * 0.06
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 8px 20px rgba(118, 185, 0, 0.15)"
                }}
                className="card"
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#a0e426' }}>
                  {category.title}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {category.skills.map((skill, skillIndex) => (
                    <motion.li 
                      key={skill} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ 
                        type: "tween",
                        duration: 0.3, 
                        delay: 0.3 + index * 0.06 + skillIndex * 0.02 
                      }}
                      whileHover={{ x: 3 }}
                      style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ color: '#76b900', marginRight: '0.5rem' }}>▹</span>
                      <span style={{ fontSize: '0.95rem' }}>{skill}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}