/**
 * Barcode Scanner Modal Component
 * Modal for scanning product barcodes using device camera
 */

import React, { useEffect } from 'react';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  isScanning: boolean;
  barcodeResult: string | null;
  captureMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onClose: () => void;
  onCapture: () => void;
  onStop: () => void;
}

export function BarcodeScannerModal({
  isOpen,
  isScanning,
  barcodeResult,
  captureMessage,
  videoRef,
  onClose,
  onCapture,
  onStop,
}: BarcodeScannerModalProps) {
  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Barcode Scanner</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Camera size={48} className="text-blue-500 animate-pulse" />
          </div>

          {isScanning ? (
            <div className="space-y-3">
              <div className="relative w-full overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs">
                  Point your camera at a barcode • Supports UPC, EAN, Code 128, Code 39
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">Camera scanning for barcodes...</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onCapture}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={onStop}
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                  Stop
                </button>
              </div>
              {captureMessage && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-center">
                  {captureMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">Camera access is required to scan barcodes</p>
            </div>
          )}

          {barcodeResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Barcode found:</strong> {barcodeResult}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>Supports: UPC, EAN, Code 128, Code 39</p>
            <p>Or enter barcode manually in the add item form</p>
          </div>
        </div>
      </div>
    </div>
  );
}
