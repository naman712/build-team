import { useCallback, useRef } from 'react';

type SoundType = 'like' | 'sendMessage' | 'receiveMessage' | 'notification';

const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; volume: number }> = {
  like: { frequency: 800, duration: 0.1, type: 'sine', volume: 0.3 },
  sendMessage: { frequency: 600, duration: 0.08, type: 'sine', volume: 0.2 },
  receiveMessage: { frequency: 900, duration: 0.15, type: 'sine', volume: 0.25 },
  notification: { frequency: 700, duration: 0.2, type: 'triangle', volume: 0.3 },
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
    
    gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  } catch (error) {
    console.log('Sound playback failed:', error);
  }
};
