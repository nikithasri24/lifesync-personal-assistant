/**
 * Abstract VoiceProvider interface for cross-platform voice support
 * 
 * Implementations:
 * - WebVoiceProvider: Uses Web Speech API (browser)
 * - NativeVoiceProvider: Uses Capacitor Speech Recognition plugin (iOS/Android)
 */

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface VoiceSpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

export interface VoiceProviderOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceProvider {
  /**
   * Name of the provider for debugging
   */
  readonly name: string;
  
  /**
   * Check if voice recognition is supported on this platform
   */
  isSupported(): boolean;
  
  /**
   * Check if speech synthesis (TTS) is supported
   */
  isSpeechSupported(): boolean;
  
  /**
   * Request microphone permission (native platforms)
   * Returns true if permission granted
   */
  requestPermission(): Promise<boolean>;
  
  /**
   * Check if microphone permission is granted
   */
  hasPermission(): Promise<boolean>;
  
  /**
   * Start listening for voice input
   */
  startListening(options?: VoiceProviderOptions): Promise<void>;
  
  /**
   * Stop listening for voice input
   */
  stopListening(): Promise<void>;
  
  /**
   * Check if currently listening
   */
  isListening(): boolean;
  
  /**
   * Speak text using text-to-speech
   */
  speak(text: string, options?: VoiceSpeakOptions): Promise<void>;
  
  /**
   * Cancel any ongoing speech
   */
  cancelSpeech(): void;
  
  /**
   * Get available languages for speech recognition
   */
  getAvailableLanguages(): Promise<string[]>;
  
  /**
   * Clean up resources
   */
  dispose(): void;
}

/**
 * Base class with common functionality
 */
export abstract class BaseVoiceProvider implements VoiceProvider {
  abstract readonly name: string;
  protected currentOptions?: VoiceProviderOptions;
  protected _isListening = false;
  
  abstract isSupported(): boolean;
  abstract isSpeechSupported(): boolean;
  abstract requestPermission(): Promise<boolean>;
  abstract hasPermission(): Promise<boolean>;
  abstract startListening(options?: VoiceProviderOptions): Promise<void>;
  abstract stopListening(): Promise<void>;
  abstract speak(text: string, options?: VoiceSpeakOptions): Promise<void>;
  abstract cancelSpeech(): void;
  abstract getAvailableLanguages(): Promise<string[]>;
  
  isListening(): boolean {
    return this._isListening;
  }
  
  dispose(): void {
    this.stopListening();
    this.cancelSpeech();
    this._isListening = false;
    this.currentOptions = undefined;
  }
}

