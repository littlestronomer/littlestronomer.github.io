import { useEffect, useRef } from 'react';
import { useAnimation } from '../contexts/AnimationContext';

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { animationsEnabled } = useAnimation();
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Characters to be displayed - binary for clean look
    const characters = '01';
    
    // Font size and column count
    const fontSize = 12;
    const columns = canvas.width / fontSize;
    
    // Array to track the y position of each character
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    function draw() {
      // If animations are disabled, clear and return
      if (!animationsEnabled) {
        if (ctx && canvas) {
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Set a translucent black background to create fade effect
      if (ctx && canvas) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set color and font for the characters
        ctx.fillStyle = '#76b900';
        ctx.font = `${fontSize}px monospace`;
      
      // Loop through each column
      for (let i = 0; i < drops.length; i++) {
        // Get a random character
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        
        // Draw the character at the current position
        if (ctx) {
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        }
        
        // Randomly reset some drops to the top of the screen
        if (canvas && drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        // Move the drop down
        drops[i]++;
      }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(draw);

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recalculate columns and drops
      const newColumns = canvas.width / fontSize;
      const newDrops: number[] = [];
      for (let i = 0; i < newColumns; i++) {
        newDrops[i] = 1;
      }
      drops.length = 0;
      drops.push(...newDrops);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationsEnabled]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.05, // Very subtle effect like in the template
      }}
    />
  );
}