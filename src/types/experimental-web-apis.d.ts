/**
 * Type declarations for experimental Web APIs
 * These APIs don't have standard TypeScript definitions yet
 */

// Speech Recognition API (WebKit)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;

  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
  onstart: ((ev: Event) => void) | null;

  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
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

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Barcode Detection API
interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  rawValue: string;
  format: string;
  cornerPoints: ReadonlyArray<{x: number; y: number}>;
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

declare const BarcodeDetector: {
  prototype: BarcodeDetector;
  new(options?: BarcodeDetectorOptions): BarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
};

// Text Detection API (Shape Detection API)
interface DetectedText {
  boundingBox: DOMRectReadOnly;
  rawValue: string;
  cornerPoints: ReadonlyArray<{x: number; y: number}>;
}

interface TextDetector {
  detect(image: ImageBitmapSource): Promise<DetectedText[]>;
}

declare const TextDetector: {
  prototype: TextDetector;
  new(): TextDetector;
};

// Extend Window with experimental APIs
declare global {
  interface Window {
    /**
     * WebKit Speech Recognition (Safari/iOS)
     */
    webkitSpeechRecognition?: typeof SpeechRecognition;

    /**
     * Barcode Detection API
     */
    BarcodeDetector?: typeof BarcodeDetector;

    /**
     * Text Detection API (part of Shape Detection API)
     */
    TextDetector?: typeof TextDetector;
  }
}

export {};
