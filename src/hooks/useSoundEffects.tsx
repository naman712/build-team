import { useCallback, useRef } from 'react';

type SoundType = 'like' | 'sendMessage' | 'receiveMessage' | 'notification' | 'connectionRequest' | 'swipeRight' | 'swipeLeft' | 'success' | 'click';

const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; volume: number; secondFreq?: number }> = {
  like: { frequency: 800, duration: 0.1, type: 'sine', volume: 0.3 },
  sendMessage: { frequency: 600, duration: 0.08, type: 'sine', volume: 0.2 },
  receiveMessage: { frequency: 900, duration: 0.15, type: 'sine', volume: 0.25 },
  notification: { frequency: 700, duration: 0.2, type: 'triangle', volume: 0.3 },
  connectionRequest: { frequency: 523, duration: 0.15, type: 'sine', volume: 0.3, secondFreq: 659 },
  swipeRight: { frequency: 600, duration: 0.12, type: 'sine', volume: 0.25, secondFreq: 800 },
  swipeLeft: { frequency: 400, duration: 0.1, type: 'sine', volume: 0.15 },
  success: { frequency: 523, duration: 0.1, type: 'sine', volume: 0.25, secondFreq: 784 },
  click: { frequency: 1000, duration: 0.05, type: 'sine', volume: 0.1 },
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
