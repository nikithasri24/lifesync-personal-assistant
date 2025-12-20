/**
 * Native Voice Provider using Capacitor plugins
 *
 * Uses:
 * - @capacitor-community/speech-recognition for STT
 * - @capacitor-community/text-to-speech for TTS
 *
 * Note: Plugins need to be installed separately:
 * npm install @capacitor-community/speech-recognition @capacitor-community/text-to-speech
 */

import {
  BaseVoiceProvider,
  type VoiceProviderOptions,
  type VoiceSpeakOptions,
  type VoiceRecognitionResult
} from './VoiceProvider';
import { isNative } from '../platform';

// Types for Capacitor speech plugins (will be fully typed when installed)
interface SpeechRecognitionPlugin {
  available(): Promise<{ available: boolean }>;
  hasPermission(): Promise<{ permission: boolean }>;
  requestPermission(): Promise<void>;
  start(options: { language?: string; partialResults?: boolean }): Promise<void>;
  stop(): Promise<{ matches?: string[] }>;
  addListener(event: 'partialResults', callback: (data: { matches: string[] }) => void): Promise<{ remove: () => void }>;
}

interface TextToSpeechPlugin {
  speak(options: { text: string; lang?: string; rate?: number; pitch?: number }): Promise<void>;
  stop(): Promise<void>;
  getSupportedLanguages(): Promise<{ languages: string[] }>;
}

// These will be dynamically imported when native plugins are installed
let SpeechRecognition: SpeechRecognitionPlugin | null = null;
let TextToSpeech: TextToSpeechPlugin | null = null;
let pluginsLoadAttempted = false;

// Helper function to dynamically import optional Capacitor plugins
async function tryImport<T>(moduleName: string): Promise<T | null> {
  try {
    // Use Function constructor to create a dynamic import that TypeScript won't analyze
    const importFn = new Function('m', 'return import(m)') as (m: string) => Promise<T>;
    return await importFn(moduleName);
  } catch {
    return null;
  }
}

// Async initialization of native plugins
async function loadNativePlugins(): Promise<void> {
  if (pluginsLoadAttempted) return;
  pluginsLoadAttempted = true;

  if (!isNative()) return;

  try {
    // Dynamic import - these modules may not exist if plugins aren't installed
    const speechModule = await tryImport<{ SpeechRecognition: SpeechRecognitionPlugin }>(
      '@capacitor-community/speech-recognition'
    );

    if (speechModule?.SpeechRecognition) {
      SpeechRecognition = speechModule.SpeechRecognition;
    }
  } catch {
    console.warn('[NativeVoiceProvider] Speech recognition plugin not available');
  }

  try {
    const ttsModule = await tryImport<{ TextToSpeech: TextToSpeechPlugin }>(
      '@capacitor-community/text-to-speech'
    );

    if (ttsModule?.TextToSpeech) {
      TextToSpeech = ttsModule.TextToSpeech;
    }
  } catch {
    console.warn('[NativeVoiceProvider] Text-to-speech plugin not available');
  }
}

// Lazy initialization - will be called when needed
const pluginsLoaded = loadNativePlugins();

export class NativeVoiceProvider extends BaseVoiceProvider {
  readonly name = 'NativeVoiceProvider';
  private partialResultsListener: { remove: () => void } | null = null;
  
  private async ensurePluginsLoaded(): Promise<void> {
    await pluginsLoaded;
  }
  
  isSupported(): boolean {
    return isNative();
  }
  
  isSpeechSupported(): boolean {
    return isNative() && TextToSpeech !== null;
  }
  
  async requestPermission(): Promise<boolean> {
    await this.ensurePluginsLoaded();
    if (!SpeechRecognition) return false;
    
    try {
      await SpeechRecognition.requestPermission();
      const { permission } = await SpeechRecognition.hasPermission();
      return permission;
    } catch {
      return false;
    }
  }
  
  async hasPermission(): Promise<boolean> {
    await this.ensurePluginsLoaded();
    if (!SpeechRecognition) return false;
    
    try {
      const { permission } = await SpeechRecognition.hasPermission();
      return permission;
    } catch {
      return false;
    }
  }
  
  async startListening(options?: VoiceProviderOptions): Promise<void> {
    await this.ensurePluginsLoaded();
    if (!SpeechRecognition) {
      throw new Error('Native speech recognition not available');
    }
    
    // Check and request permission
    const hasPermission = await this.hasPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        options?.onError?.('permission_denied');
        return;
      }
    }
    
    this.currentOptions = options;
    
    // Set up partial results listener if interim results requested
    if (options?.interimResults) {
      const listener = await SpeechRecognition.addListener('partialResults', (data) => {
        const transcript = data.matches?.[0] ?? '';
        const result: VoiceRecognitionResult = {
          transcript,
          isFinal: false,
          confidence: 0.5,
        };
        options.onResult?.(result);
      });
      this.partialResultsListener = listener;
    }
    
    try {
      await SpeechRecognition.start({
        language: options?.lang ?? 'en-US',
        partialResults: options?.interimResults ?? true,
      });
      
      this._isListening = true;
      options?.onStart?.();
    } catch (error) {
      options?.onError?.(String(error));
    }
  }
  
  async stopListening(): Promise<void> {
    await this.ensurePluginsLoaded();
    if (!SpeechRecognition || !this._isListening) return;
    
    // Clean up listener
    if (this.partialResultsListener) {
      this.partialResultsListener.remove();
      this.partialResultsListener = null;
    }
    
    try {
      const result = await SpeechRecognition.stop();
      this._isListening = false;
      
      // Emit final result
      if (result.matches?.[0]) {
        const finalResult: VoiceRecognitionResult = {
          transcript: result.matches[0],
          isFinal: true,
          confidence: 0.9,
        };
        this.currentOptions?.onResult?.(finalResult);
      }
      
      this.currentOptions?.onEnd?.();
    } catch {
      this._isListening = false;
      this.currentOptions?.onEnd?.();
    }
  }
  
  async speak(text: string, options?: VoiceSpeakOptions): Promise<void> {
    await this.ensurePluginsLoaded();
    if (!TextToSpeech) return;
    
    try {
      await TextToSpeech.speak({
        text,
        lang: options?.lang ?? 'en-US',
        rate: options?.rate ?? 1,
        pitch: options?.pitch ?? 1,
      });
    } catch {
      // Ignore TTS errors
    }
  }
  
  cancelSpeech(): void {
    this.ensurePluginsLoaded().then(() => {
      if (TextToSpeech) {
        TextToSpeech.stop().catch(() => {});
      }
    });
  }
  
  async getAvailableLanguages(): Promise<string[]> {
    await this.ensurePluginsLoaded();
    if (!TextToSpeech) return ['en-US'];
    
    try {
      const { languages } = await TextToSpeech.getSupportedLanguages();
      return languages;
    } catch {
      return ['en-US'];
    }
  }
  
  dispose(): void {
    if (this.partialResultsListener) {
      this.partialResultsListener.remove();
      this.partialResultsListener = null;
    }
    super.dispose();
  }
}

