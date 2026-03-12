import { useEffect, useRef } from 'react';
import { useAnimation } from '../contexts/useAnimation';

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { animationsEnabled } = useAnimation();
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const characters = '01{}<>/CUDA[]';
    const fontSize = 14;
    let columns = 0;
    let burstFrames = 0;
    const drops: number[] = [];

    const seedDrops = (mode: 'ambient' | 'burst') => {
      drops.length = 0;

      for (let index = 0; index < columns; index += 1) {
        if (mode === 'burst') {
          const startAboveScreen = Math.random() > 0.45;
          drops.push(
            startAboveScreen
              ? -Math.floor(Math.random() * 36)
              : Math.floor((Math.random() * window.innerHeight) / fontSize),
          );
          continue;
        }

        drops.push(Math.floor((Math.random() * window.innerHeight) / fontSize));
      }
    };

    const triggerBurst = () => {
      burstFrames = 34;
      seedDrops('burst');
    };

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(window.innerWidth * pixelRatio);
      canvas.height = Math.floor(window.innerHeight * pixelRatio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      columns = Math.max(1, Math.floor(window.innerWidth / fontSize));
      seedDrops('ambient');
    };

    const drawGuides = () => {
      context.save();
      context.strokeStyle = 'rgba(126, 214, 178, 0.035)';
      context.lineWidth = 1;

      for (let column = 0; column < columns; column += 8) {
        const x = column * fontSize + 0.5;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, window.innerHeight);
        context.stroke();
      }

      context.restore();
    };

    const draw = () => {
      if (!animationsEnabled) {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        animationFrameRef.current = window.requestAnimationFrame(draw);
        return;
      }

      const isBursting = burstFrames > 0;

      context.fillStyle = isBursting ? 'rgba(3, 8, 10, 0.05)' : 'rgba(3, 8, 10, 0.12)';
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);

      drawGuides();

      if (isBursting) {
        const progress = 1 - burstFrames / 34;
        const sweepY = progress * window.innerHeight;
        context.fillStyle = 'rgba(185, 255, 214, 0.08)';
        context.fillRect(0, sweepY, window.innerWidth, 3);
      }

      context.font = `${fontSize}px "JetBrains Mono", monospace`;
      context.textBaseline = 'top';

      for (let index = 0; index < drops.length; index += 1) {
        const x = index * fontSize;
        const y = drops[index] * fontSize;
        const character = characters.charAt(Math.floor(Math.random() * characters.length));
        const isLead = Math.random() > (isBursting ? 0.72 : 0.92);

        context.fillStyle = isBursting
          ? isLead
            ? 'rgba(185, 255, 214, 0.92)'
            : 'rgba(118, 185, 0, 0.62)'
          : isLead
            ? 'rgba(185, 255, 214, 0.7)'
            : 'rgba(118, 185, 0, 0.4)';
        context.fillText(character, x, y);

        if (Math.random() > (isBursting ? 0.92 : 0.985)) {
          context.fillStyle = isBursting ? 'rgba(185, 255, 214, 0.24)' : 'rgba(126, 214, 178, 0.18)';
          context.fillRect(x, Math.max(0, y - fontSize * 4), 1, fontSize * (isBursting ? 3 : 2));
        }

        if (y > window.innerHeight && Math.random() > (isBursting ? 0.92 : 0.975)) {
          drops[index] = -Math.floor(Math.random() * (isBursting ? 30 : 12));
        }

        drops[index] += isBursting ? (isLead ? 3.4 : 2.2) : isLead ? 1.4 : 0.9;
      }

      if (isBursting) {
        burstFrames -= 1;
      }

      animationFrameRef.current = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    if (animationsEnabled) {
      triggerBurst();
    }
    animationFrameRef.current = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [animationsEnabled]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.18,
        mixBlendMode: 'screen',
        maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.85) 40%, rgba(0, 0, 0, 0.08))',
      }}
    />
  );
}
