/**
 * Barcode Scanner Modal Component
 * Modal for scanning product barcodes using device camera
 * Terracotta themed with bottom sheet style
 */

import React, { useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';

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
  const colors = useThemeColors();

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile only) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Scan Barcode
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: colors.badge.bg,
              color: colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.badge.bg;
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Camera Icon */}
          <div className="flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
              }}
            >
              <Camera size={40} className="text-white animate-pulse" />
            </div>
          </div>

          {isScanning ? (
            <div className="space-y-4">
              <div className="relative w-full overflow-hidden rounded-2xl bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white text-sm text-center"
                  style={{
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
                  }}
                >
                  Point your camera at a barcode
                </div>
              </div>

              <p className="text-center text-sm font-medium" style={{ color: colors.text.secondary }}>
                Scanning for barcodes...
              </p>

              <p className="text-center text-xs" style={{ color: colors.text.tertiary }}>
                Supports: UPC, EAN, Code 128, Code 39
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCapture}
                  className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                    color: 'white',
                  }}
                  aria-label="Capture barcode"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={onStop}
                  className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: `2px solid ${colors.border.medium}`,
                    color: colors.text.secondary,
                  }}
                  aria-label="Stop scanning"
                >
                  Stop
                </button>
              </div>

              {captureMessage && (
                <div
                  className="rounded-xl p-3 text-center text-sm"
                  style={{
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    border: `1px solid ${colors.accent.start}`,
                    color: colors.text.secondary,
                  }}
                >
                  {captureMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center" style={{ color: colors.text.secondary }}>
                Camera access is required to scan barcodes
              </p>
            </div>
          )}

          {barcodeResult && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22C55E',
              }}
            >
              <p className="text-sm font-medium" style={{ color: '#15803D' }}>
                <strong>Barcode found:</strong> {barcodeResult}
              </p>
            </div>
          )}

          <div className="text-center text-xs pt-2" style={{ color: colors.text.tertiary }}>
            <p>Or enter barcode manually in the add item form</p>
          </div>
        </div>
      </div>
    </div>
  );
}
