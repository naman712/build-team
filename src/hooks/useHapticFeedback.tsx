import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 30],
  error: [50, 30, 50],
  selection: 5,
};

export const useHapticFeedback = () => {
  const vibrate = useCallback((type: HapticType = 'medium') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(hapticPatterns[type]);
    }
  }, []);

  return { vibrate };
};

export const triggerHaptic = (type: HapticType = 'medium') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(hapticPatterns[type]);
  }
};
