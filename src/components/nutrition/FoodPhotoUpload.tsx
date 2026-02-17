/**
 * Food Photo Upload Component
 * Camera/gallery photo upload with AI nutrition analysis
 */

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { foodPhotoService, type FoodAnalysisResult } from '@/services/nutrition/api/FoodPhotoService';

interface FoodPhotoUploadProps {
  onAnalysisComplete: (result: FoodAnalysisResult, imageUrl: string) => void;
  onCancel: () => void;
}

export function FoodPhotoUpload({ onAnalysisComplete, onCancel }: FoodPhotoUploadProps): React.ReactElement {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setError(null);
    } catch (err) {
      setError('Unable to access camera. Please use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImageDataUrl(dataUrl);
    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!imageDataUrl) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await foodPhotoService.analyzePhoto(imageDataUrl);
      setAnalysisResult(result);
    } catch (err) {
      setError('Failed to analyze photo. Please try again or enter manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmAnalysis = async () => {
    if (!analysisResult || !imageDataUrl) return;
    // The parent will handle the upload and logging
    onAnalysisComplete(analysisResult, imageDataUrl);
  };

  const reset = () => {
    setImageDataUrl(null);
    setAnalysisResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#C18B5E]" />
          Snap Your Meal
        </h3>
        <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Camera view */}
      {cameraActive && !imageDataUrl && (
        <div className="relative">
          <video ref={videoRef} className="w-full rounded-lg" autoPlay playsInline muted />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={capturePhoto}
              className="px-6 py-2 bg-white text-gray-900 rounded-full shadow-lg font-medium"
            >
              Capture
            </button>
            <button onClick={stopCamera} className="px-4 py-2 bg-gray-800/80 text-white rounded-full">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload options */}
      {!cameraActive && !imageDataUrl && (
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4A574] hover:bg-[#F5EBE0] transition-colors"
          >
            <Camera className="w-6 h-6 text-gray-500" />
            <span className="font-medium text-gray-700">Take Photo</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D4A574] hover:bg-[#F5EBE0] transition-colors"
          >
            <Upload className="w-6 h-6 text-gray-500" />
            <span className="font-medium text-gray-700">Upload</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {/* Preview and analysis */}
      {imageDataUrl && !analysisResult && (
        <div className="space-y-3">
          <img src={imageDataUrl} alt="Food preview" className="w-full max-h-64 object-contain rounded-lg" />
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RotateCcw className="w-4 h-4 inline mr-1" /> Retake
            </button>
            <button onClick={analyzePhoto} disabled={isAnalyzing}
              className="flex-1 py-2 bg-[#C18B5E] text-white rounded-lg hover:bg-[#B5795A] disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 inline animate-spin mr-1" /> : <Sparkles className="w-4 h-4 inline mr-1" />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <div className="space-y-3">
          <img src={imageDataUrl!} alt="Food" className="w-full max-h-40 object-contain rounded-lg" />
          <div className="bg-gradient-to-r from-[#F9F3ED] to-[#F5EBE0] rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 font-medium">
              <Sparkles className="w-4 h-4" />
              AI Analysis ({Math.round(analysisResult.confidence * 100)}% confident)
            </div>
            <p className="text-sm text-gray-600">{analysisResult.description}</p>
            <div className="grid grid-cols-4 gap-2 pt-2">
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-orange-600">{analysisResult.totalCalories}</div>
                <div className="text-xs text-gray-500">Calories</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-red-600">{Math.round(analysisResult.totalProtein)}g</div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-blue-600">{Math.round(analysisResult.totalCarbs)}g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{Math.round(analysisResult.totalFat)}g</div>
                <div className="text-xs text-gray-500">Fat</div>
              </div>
            </div>
            {analysisResult.items.length > 1 && (
              <div className="text-xs text-gray-500 pt-1">
                Detected:{' '}
                {analysisResult.items
                  .map((item) => item.count && item.count > 1 ? `${item.name} x${item.count}` : item.name)
                  .join(', ')}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Try Again
            </button>
            <button onClick={confirmAnalysis}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Log This Meal
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
