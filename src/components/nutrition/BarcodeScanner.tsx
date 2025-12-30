/**
 * Barcode Scanner Component
 * Uses device camera to scan food barcodes and look up nutrition info from OpenFoodFacts
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Search, AlertCircle } from 'lucide-react';
import { openFoodFactsService, type NutritionInfo } from '@/services/nutrition/OpenFoodFactsService';

interface BarcodeScannerProps {
  onProductFound: (product: NutritionInfo) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onProductFound, onCancel }: BarcodeScannerProps): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const supportsBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError('Camera access denied. Please enter barcode manually.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureAndDecode = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!supportsBarcodeDetector) {
      setError('Auto-scan not supported on this device. Please enter the barcode manually.');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const Detector = window.BarcodeDetector;
      if (!Detector) {
        setError('Auto-scan not supported on this device. Please enter the barcode manually.');
        return;
      }
      const detector = new Detector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });
      const results = await detector.detect(canvas);
      if (results.length > 0) {
        await lookupBarcode(results[0].rawValue);
        return;
      }
      setError('No barcode detected. Try again or enter manually.');
    } catch (err) {
      setError('Failed to scan barcode. Please enter it manually.');
    }
  };

  const lookupBarcode = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    setIsLookingUp(true);
    setError(null);
    
    try {
      const product = await openFoodFactsService.lookupBarcode(barcode.trim());
      if (product) {
        stopCamera();
        onProductFound(product);
      } else {
        setError('Product not found. Try a different barcode or search by name.');
      }
    } catch (err) {
      setError('Failed to look up product. Please try again.');
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600" />
          Scan Barcode
        </h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-200 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Camera view */}
        {!cameraError && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-24 border-2 border-white/50 rounded-lg" />
            </div>
            {isScanning && (
              <button
                onClick={captureAndDecode}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
              >
                Capture
              </button>
            )}
          </div>
        )}

        {cameraError && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{cameraError}</span>
          </div>
        )}

        {/* Manual barcode entry */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Enter barcode manually:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value)}
              placeholder="e.g., 5901234123457"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              onKeyDown={e => e.key === 'Enter' && lookupBarcode(manualBarcode)}
            />
            <button
              onClick={() => lookupBarcode(manualBarcode)}
              disabled={isLookingUp || !manualBarcode.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Look Up
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
