/**
 * Voice module - cross-platform voice recognition and speech synthesis
 */

export { 
  type VoiceProvider, 
  type VoiceProviderOptions,
  type VoiceRecognitionResult,
  type VoiceSpeakOptions,
  BaseVoiceProvider 
} from './VoiceProvider';

export { WebVoiceProvider } from './WebVoiceProvider';
export { NativeVoiceProvider } from './NativeVoiceProvider';

export { 
  getVoiceProvider, 
  setVoiceProvider, 
  resetVoiceProvider 
} from './VoiceProviderFactory';

