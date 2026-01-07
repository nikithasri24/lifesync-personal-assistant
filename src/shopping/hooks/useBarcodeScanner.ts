/**
 * Barcode Scanner Hook
 * Handles camera access and barcode detection
 */

import { useState, useRef, useCallback } from 'react';
import { logger } from '../../services/logger';
import '../../types/experimental-web-apis.d.ts';

interface ProductInfo {
  name: string;
  price?: number;
  category?: string;
  brand?: string;
  image?: string;
}

interface UseBarcodeScannerReturn {
  isScanning: boolean;
  barcodeResult: string | null;
  captureMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  captureNow: () => Promise<void>;
  setBarcodeResult: (barcode: string | null) => void;
}

export function useBarcodeScanner(
  onProductFound?: (barcode: string, productInfo: ProductInfo) => void
): UseBarcodeScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barcodeDetectorRef = useRef<{ detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const lookupProduct = async (barcode: string): Promise<ProductInfo> => {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (!resp.ok) throw new Error('lookup failed');
      const data = (await resp.json()) as {
        name?: string;
        price?: number;
        category?: string;
        brand?: string;
        image?: string;
      };
      return {
        name: data.name ?? `Product ${barcode.slice(-4)}`,
        price: typeof data.price === 'number' ? data.price : undefined,
        category: data.category ?? 'other',
        brand: data.brand ?? undefined,
        image: data.image ?? undefined,
      };
    } catch {
      return { name: `Product ${barcode.slice(-4)}`, category: 'other' };
    }
  };

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    scanningRef.current = false;
    setCaptureMessage(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Ignore pause errors
      }
      videoRef.current.srcObject = null;
    }
  }, []);

  const startScanning = useCallback(async () => {
    setIsScanning(true);
    scanningRef.current = true;
    setBarcodeResult(null);
    setCaptureMessage(null);

    try {
      if (!('BarcodeDetector' in window)) {
        logger.warn('useBarcodeScanner', 'Barcode scanning not supported on this device.');
        setIsScanning(false);
        scanningRef.current = false;
        return;
      }

      // Initialize barcode detector
      const desired = [
        'code_128',
        'code-128',
        'code_39',
        'code-39',
        'ean_13',
        'ean-13',
        'ean_8',
        'ean-8',
        'upc_a',
        'upc-a',
        'upc_e',
        'upc-e',
      ];
      let formats: string[] | undefined = undefined;
      try {
        const supported: string[] =
          window.BarcodeDetector && typeof window.BarcodeDetector.getSupportedFormats === 'function'
            ? await window.BarcodeDetector.getSupportedFormats()
            : [];
        if (Array.isArray(supported) && supported.length) {
          const supportedSet = new Set(supported);
          formats = desired.filter((f) => supportedSet.has(f));
        }
      } catch {
        // Ignore getSupportedFormats errors
      }

      const detectorOpts = formats?.length ? { formats } : undefined;
      if (!window.BarcodeDetector) {
        throw new Error('BarcodeDetector not supported');
      }
      const barcodeDetector = new window.BarcodeDetector(detectorOpts) as { detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> };
      barcodeDetectorRef.current = barcodeDetector;

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Ignore play errors
        }
      }

      // Start barcode detection loop
      const detectBarcodes = async (): Promise<void> => {
        if (!scanningRef.current) return;
        const video = videoRef.current;
        if (!video?.videoWidth || !video.videoHeight) {
          requestAnimationFrame(() => {
            void detectBarcodes();
          });
          return;
        }

        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            setBarcodeResult(barcode);

            // Look up product info
            const productInfo = await lookupProduct(barcode);

            if (onProductFound) {
              onProductFound(barcode, productInfo);
            }

            stopScanning();
            return;
          }
        } catch (_error) {
          // Some browsers intermittently throw while the frame is not ready
        }

        if (scanningRef.current) {
          requestAnimationFrame(() => {
            void detectBarcodes();
          });
        }
      };

      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          void detectBarcodes();
        };
      }
    } catch (error) {
      logger.error('useBarcodeScanner', error as Error, { context: 'Camera access error' });
      logger.warn('useBarcodeScanner', 'Camera access denied. Please enable camera permissions to scan barcodes.');
      setIsScanning(false);
      scanningRef.current = false;
    }
  }, [onProductFound, stopScanning]);

  const captureNow = useCallback(async () => {
    setCaptureMessage(null);
    try {
      const detector = barcodeDetectorRef.current;
      const video = videoRef.current;
      if (!detector || !video) return;

      const result: Array<{ rawValue: string }> = await detector.detect(video);
      if (Array.isArray(result) && result.length > 0) {
        const firstBarcode: { rawValue: string } | undefined = result[0];
        if (firstBarcode && typeof firstBarcode.rawValue === 'string') {
          const code: string = firstBarcode.rawValue;
          setBarcodeResult(code);

          const productInfo = await lookupProduct(code);
          if (onProductFound) {
            onProductFound(code, productInfo);
          }

          stopScanning();
        }
      } else {
        setCaptureMessage(
          'No barcode found. Try moving closer, centering, and tapping Capture again.'
        );
      }
    } catch (_e) {
      setCaptureMessage('Capture failed. Please try again or enter manually.');
    }
  }, [onProductFound, stopScanning]);

  return {
    isScanning,
    barcodeResult,
    captureMessage,
    videoRef,
    startScanning,
    stopScanning,
    captureNow,
    setBarcodeResult,
  };
}
