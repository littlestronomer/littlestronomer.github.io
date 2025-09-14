import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  
  const firstName = "Göktürk Batın";
  const lastName = "Dervişoğlu";
  const fullText = `${firstName}\n${lastName}`;
  
  const titles = ["AI Engineer", "ML Researcher", "CUDA Developer"];
  
  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
        // Hide cursor after typing is done
        setTimeout(() => setIsTypingComplete(true), 500);
      }
    }, 100);

    // Cursor blinking while typing
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  // Subtitle cycling effect
  useEffect(() => {
    const startDelay = 3000; // Wait for name to finish typing
    let titleIndex = 0;
    
    const cycleSubtitle = () => {
      const currentTitle = titles[titleIndex];
      let charIndex = 0;
      
      // Type out the current title
      const typeTitle = setInterval(() => {
        if (charIndex <= currentTitle.length) {
          setSubtitle(currentTitle.slice(0, charIndex));
          setIsSelecting(false);
          charIndex++;
        } else {
          clearInterval(typeTitle);
          
          // Wait, then "select" the text
          setTimeout(() => {
            setIsSelecting(true);
            
            // After selection effect, move to next title
            setTimeout(() => {
              titleIndex = (titleIndex + 1) % titles.length;
              cycleSubtitle();
            }, 300);
          }, 2000);
        }
      }, 80);
    };
    
    const timeout = setTimeout(() => {
      cycleSubtitle();
    }, startDelay);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section id="home" className="section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '80px' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 5rem)', 
            fontWeight: 'bold', 
            marginBottom: '1.5rem', 
            color: '#76b900',
            minHeight: '2.4em',
            whiteSpace: 'pre-line',
            lineHeight: '1.2',
            position: 'relative',
            display: 'inline-block'
          }}>
            {text}
            {!isTypingComplete && (
              <span style={{ 
                display: 'inline-block',
                width: '0.05em',
                height: '1.1em',
                backgroundColor: '#a0e426',
                opacity: showCursor ? 0.8 : 0,
                transition: 'opacity 0.1s',
                marginLeft: '2px',
                verticalAlign: 'text-bottom'
              }}></span>
            )}
          </h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 0.5 }}
            style={{ 
              fontSize: 'clamp(1.25rem, 3vw, 2rem)', 
              marginBottom: '1.5rem', 
              color: '#a0e426',
              minHeight: '1.5em',
              position: 'relative'
            }}
          >
            <span style={{
              backgroundColor: isSelecting ? '#a0e426' : 'transparent',
              color: isSelecting ? '#0a0a0a' : '#a0e426',
              padding: isSelecting ? '2px 4px' : '0',
              borderRadius: '2px',
              transition: 'all 0.15s ease-in-out'
            }}>
              {subtitle}
            </span>
            <span style={{ 
              color: '#76b900',
              opacity: subtitle ? 1 : 0,
              animation: 'blink 1s infinite'
            }}>|</span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.5 }}
            style={{ fontSize: '1.125rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem', color: '#b0b0b0' }}
          >
            Creating cutting-edge AI solutions with a focus on 
            performance optimization and parallel computing.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4, duration: 0.5 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <a href="#projects" className="btn btn-primary">
              View My Work
            </a>
            <a href="#contact" className="btn btn-secondary">
              Get In Touch
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}