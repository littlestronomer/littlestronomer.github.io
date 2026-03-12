import { createContext } from 'react';

export interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
}

export const AnimationContext = createContext<AnimationContextType | undefined>(undefined);
