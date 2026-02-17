/**
 * Receipt OCR Service
 * Handles optical character recognition for receipt images using Tesseract.js
 */

import { createWorker, type Worker, type RecognizeResult } from 'tesseract.js';
import { ValidationError } from '../../lib/errors';
import type { OCRProgress } from '../types/receipt';

let worker: Worker | null = null;

/**
 * Initialize Tesseract worker (reuse across scans)
 */
async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker;
  }

  worker = await createWorker('eng', 1, {
    logger: () => {}, // Disable default logging
  });

  return worker;
}

/**
 * Terminate the worker (cleanup)
 */
export async function terminateOCRWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

/**
 * Scan a receipt image and extract text
 * @param imageFile - Receipt image file or blob
 * @param onProgress - Progress callback
 * @returns OCR text result
 */
export async function scanReceiptImage(
  imageFile: File | Blob,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  try {
    // Report loading status
    onProgress?.({
      status: 'loading',
      progress: 10,
      message: 'Initializing OCR engine...',
    });

    // Get or create worker
    const ocrWorker = await getWorker();

    // Report recognition status
    onProgress?.({
      status: 'recognizing',
      progress: 30,
      message: 'Reading receipt text...',
    });

    // Perform OCR
    const result: RecognizeResult = await ocrWorker.recognize(imageFile, {}, {
      text: true,
      blocks: true,
      hocr: false,
      tsv: false,
    });

    // Report completion
    onProgress?.({
      status: 'completed',
      progress: 100,
      message: 'Text extracted successfully',
    });

    return result.data.text;
  } catch (error) {
    onProgress?.({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'OCR failed',
    });
    throw new ValidationError(`Receipt OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Preprocess image for better OCR results
 * @param imageFile - Original image
 * @returns Processed image blob
 */
export async function preprocessImage(imageFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Set canvas size (limit max dimensions for performance)
      const maxWidth = 2000;
      const maxHeight = 3000;
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to grayscale for better OCR
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // R
        data[i + 1] = avg; // G
        data[i + 2] = avg; // B
      }

      // Increase contrast
      const factor = 1.2;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * factor);
        data[i + 1] = Math.min(255, data[i + 1] * factor);
        data[i + 2] = Math.min(255, data[i + 2] * factor);
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(imageFile);
  });
}
