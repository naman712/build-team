import { useCallback, useRef } from 'react';
import { triggerHaptic } from './useHapticFeedback';

type SoundType = 'like' | 'sendMessage' | 'receiveMessage' | 'notification' | 'connectionRequest' | 'swipeRight' | 'swipeLeft' | 'success' | 'click';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; volume: number; secondFreq?: number; haptic?: HapticType }> = {
  like: { frequency: 800, duration: 0.1, type: 'sine', volume: 0.3, haptic: 'light' },
  sendMessage: { frequency: 600, duration: 0.08, type: 'sine', volume: 0.2, haptic: 'light' },
  receiveMessage: { frequency: 900, duration: 0.15, type: 'sine', volume: 0.25, haptic: 'medium' },
  notification: { frequency: 700, duration: 0.2, type: 'triangle', volume: 0.3, haptic: 'medium' },
  connectionRequest: { frequency: 523, duration: 0.15, type: 'sine', volume: 0.3, secondFreq: 659, haptic: 'success' },
  swipeRight: { frequency: 600, duration: 0.12, type: 'sine', volume: 0.25, secondFreq: 800, haptic: 'medium' },
  swipeLeft: { frequency: 400, duration: 0.1, type: 'sine', volume: 0.15, haptic: 'light' },
  success: { frequency: 523, duration: 0.1, type: 'sine', volume: 0.25, secondFreq: 784, haptic: 'success' },
  click: { frequency: 1000, duration: 0.05, type: 'sine', volume: 0.1, haptic: 'selection' },
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    try {
      const audioContext = getAudioContext();
      const config = soundConfigs[type];
      
      // Trigger haptic feedback
      if (config.haptic) {
        triggerHaptic(config.haptic);
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      
      // Add second frequency for two-tone sounds
      if (config.secondFreq) {
        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(config.secondFreq, audioContext.currentTime + config.duration / 2);
      }
      
      // Fade out effect
      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  }, [getAudioContext]);

  return {
    playLike: useCallback(() => playSound('like'), [playSound]),
    playSendMessage: useCallback(() => playSound('sendMessage'), [playSound]),
    playReceiveMessage: useCallback(() => playSound('receiveMessage'), [playSound]),
    playNotification: useCallback(() => playSound('notification'), [playSound]),
    playConnectionRequest: useCallback(() => playSound('connectionRequest'), [playSound]),
    playSwipeRight: useCallback(() => playSound('swipeRight'), [playSound]),
    playSwipeLeft: useCallback(() => playSound('swipeLeft'), [playSound]),
    playSuccess: useCallback(() => playSound('success'), [playSound]),
    playClick: useCallback(() => playSound('click'), [playSound]),
  };
};

// Singleton for use outside React components
let audioContext: AudioContext | null = null;

export const playSoundEffect = (type: SoundType) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const config = soundConfigs[type];
    
    // Trigger haptic feedback
    if (config.haptic) {
      triggerHaptic(config.haptic);
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
    
    // Add second frequency for two-tone sounds
    if (config.secondFreq) {
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(config.secondFreq, audioContext.currentTime + config.duration / 2);
    }
    
    gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  } catch (error) {
    console.log('Sound playback failed:', error);
  }
};
