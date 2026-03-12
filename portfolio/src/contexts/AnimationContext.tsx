import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimationContext } from './animationContext';

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const storedPreference = window.localStorage.getItem('portfolio-animations-enabled');
    if (storedPreference !== null) {
      return storedPreference === 'true';
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const toggleAnimations = () => {
    setAnimationsEnabled(prev => !prev);
  };

  useEffect(() => {
    window.localStorage.setItem('portfolio-animations-enabled', String(animationsEnabled));
  }, [animationsEnabled]);

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
}
