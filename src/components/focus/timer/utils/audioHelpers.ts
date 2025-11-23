import { logger } from '../../../../services/logger';

export const playNotificationSound = (soundEnabled: boolean): void => {
  if (!soundEnabled) return;

  try {
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const audioContext = new AudioContextConstructor();

    const playTone = (frequency: number, startTime: number, duration: number): void => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(523.25, now, 0.2);
    playTone(659.25, now + 0.2, 0.2);
    playTone(783.99, now + 0.4, 0.4);
  } catch (error) {
    logger.debug('Audio playback failed:', { error });
  }
};

export const showNotification = (notificationsEnabled: boolean, title: string, body: string): void => {
  if (!notificationsEnabled) return;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '🎯'
    });
  }
};
