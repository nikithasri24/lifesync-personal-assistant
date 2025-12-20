/**
 * Web Speech API implementation of VoiceProvider
 *
 * Uses the Web Speech API for voice recognition and synthesis
 * Works in modern browsers (Chrome, Edge, Safari)
 */

import {
  BaseVoiceProvider,
  type VoiceProviderOptions,
  type VoiceSpeakOptions
} from './VoiceProvider';

export class WebVoiceProvider extends BaseVoiceProvider {
  readonly name = 'WebVoiceProvider';
  private recognition: ISpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private lastResultIndex = 0;

  constructor() {
    super();
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async requestPermission(): Promise<boolean> {
    // Web Speech API requests permission when starting recognition
    // We can try to get microphone permission via getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch {
      // permissions API may not be supported
      return true; // assume granted, will fail on start if not
    }
  }

  async startListening(options?: VoiceProviderOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported');
    }

    // Stop any existing recognition
    await this.stopListening();

    this.currentOptions = options;
    this.lastResultIndex = 0;

    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      throw new Error('Speech recognition not supported');
    }
    this.recognition = new SpeechRecognitionCtor();

    this.recognition.continuous = options?.continuous ?? true;
    this.recognition.interimResults = options?.interimResults ?? true;
    this.recognition.lang = options?.lang ?? 'en-US';

    // Note: onstart isn't in ISpeechRecognition type, so we track manually
    this._isListening = true;
    options?.onStart?.();

    this.recognition.onend = () => {
      this._isListening = false;
      options?.onEnd?.();
    };

    this.recognition.onerror = (event: Event) => {
      const errorEvent = event as { error?: string };
      this._isListening = false;
      options?.onError?.(errorEvent.error ?? 'unknown_error');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Process results starting from where we left off
      for (let i = this.lastResultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        const confidence = result[0]?.confidence ?? 0;

        options?.onResult?.({
          transcript,
          isFinal: result.isFinal,
          confidence,
        });

        if (result.isFinal) {
          this.lastResultIndex = i + 1;
        }
      }
    };

    this.recognition.start();
  }
  
  async stopListening(): Promise<void> {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore errors when stopping
      }
      this.recognition = null;
    }
    this._isListening = false;
  }
  
  async speak(text: string, options?: VoiceSpeakOptions): Promise<void> {
    if (!this.isSpeechSupported() || !this.synthesis) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang ?? 'en-US';
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      // Cancel any ongoing speech
      this.cancelSpeech();
      
      this.synthesis!.speak(utterance);
    });
  }
  
  cancelSpeech(): void {
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch {
        // Ignore cancellation errors
      }
    }
  }
  
  async getAvailableLanguages(): Promise<string[]> {
    if (!this.synthesis) return ['en-US'];
    
    const voices = this.synthesis.getVoices();
    const langs = new Set(voices.map(v => v.lang));
    return Array.from(langs);
  }
  
  dispose(): void {
    this.stopListening();
    this.cancelSpeech();
    this.recognition = null;
    super.dispose();
  }
}

