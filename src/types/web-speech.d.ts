// Minimal Web Speech API types to satisfy TS without adding deps
// Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative { transcript: string; confidence: number }

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => any) | null;
  onend: ((ev: Event) => any) | null;
  onerror: ((ev: any) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface Window {
  webkitSpeechRecognition?: { new (): ISpeechRecognition };
  SpeechRecognition?: { new (): ISpeechRecognition };
}

// Synthesis
interface SpeechSynthesisUtterance {
  new (text?: string): SpeechSynthesisUtterance;
  text: string;
  lang: string;
  rate: number;
  pitch: number;
}
declare var SpeechSynthesisUtterance: {
  prototype: SpeechSynthesisUtterance;
  new (text?: string): SpeechSynthesisUtterance;
};

