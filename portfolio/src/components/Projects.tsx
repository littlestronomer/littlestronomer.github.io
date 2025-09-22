import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const projects = [
  {
    title: "Emotion Injection to StyleTTS2",
    category: "Speech Synthesis",
    tech: ["StyleTTS2", "PyTorch", "Emotion Control", "TTS"],
    description: "Enhanced StyleTTS2 with emotion injection capabilities for expressive speech synthesis.",
  },
  {
    title: "2025 Image Matching Challenge",
    category: "Computer Vision",
    tech: ["Feature Matching", "SIFT/SURF", "Deep Learning", "OpenCV"],
    description: "Competition entry for advanced image matching algorithms and feature correspondence.",
  },
  {
    title: "Commeme",
    category: "Creative AI",
    tech: ["Meme Generation", "Cultural AI", "NLP", "Image Generation"],
    description: "Making memes humanity's collective legacy, transcending nation-specific cultural boundaries.",
  },
  {
    title: "Real-Time Speaker Diarization",
    category: "Audio AI",
    tech: ["Whisper", "TensorRT", "CUDA"],
    description: "Real-time transcription with speaker identification using CUDA kernel fusion.",
  },
  {
    title: "Symbolic Music Generation",
    category: "Generative AI",
    tech: ["MuseMorphose", "ABC Notation", "LLMs"],
    description: "Fine-tuning models for composer-specific sequences in Turkish classical music.",
  },
  {
    title: "Spell Card Generator",
    category: "Creative AI",
    tech: ["FastMCP", "Diffusion", "ElevenLabs"],
    description: "Multi-modal spell card generation with image, animation, and audio synthesis.",
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

export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="projects" className="section" ref={ref}>
      <div className="container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={popAnimation}
        >
          <h2 className="section-title">My Projects</h2>
          <p className="section-subtitle">
            Recent projects showcasing my skills in AI, machine learning, and high-performance computing.
          </p>
          
          <div className="grid grid-cols-3">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  type: "tween",
                  duration: 0.4, 
                  delay: 0.2 + index * 0.08
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(118, 185, 0, 0.2)"
                }}
                className="card"
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a0e426' }}>
                    {project.category}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#76b900' }}>
                  {project.title}
                </h3>
                
                <p style={{ marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {project.description}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        backgroundColor: 'rgba(118, 185, 0, 0.1)',
                        border: '1px solid #2a6340',
                        borderRadius: '4px'
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}