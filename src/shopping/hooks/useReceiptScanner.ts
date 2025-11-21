import { useState, useRef } from 'react';
import { logger } from '../../services/logger';
import { parseReceiptToItems, parseReceiptMeta, type ParsedReceiptItem } from '../services/receiptParser';
import '../../types/experimental-web-apis';

export function useReceiptScanner() {
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [receiptText, setReceiptText] = useState('');
  const receiptVideoRef = useRef<HTMLVideoElement | null>(null);
  const [receiptCameraOn, setReceiptCameraOn] = useState(false);
  const [receiptCameraMsg, setReceiptCameraMsg] = useState<string | null>(null);

  // Cropping/snippet state
  const receiptImgRef = useRef<HTMLImageElement | null>(null);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropStart, setCropStart] = useState<{x:number;y:number}|null>(null);
  const [cropEnd, setCropEnd] = useState<{x:number;y:number}|null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Receipt metadata and parsed items
  const [receiptMeta, setReceiptMeta] = useState<{
    merchant?: string;
    address?: string;
    date?: string;
    time?: string;
    subtotal?: number;
    tax?: number;
    total?: number;
    payment?: string
  }>({});
  const [receiptOcrLoading, setReceiptOcrLoading] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceiptItem[]>([]);

  const startCamera = async () => {
    setReceiptCameraOn(true);
    setReceiptCameraMsg('Starting camera… If it does not appear, ensure you are on https or localhost and camera permission is allowed.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      if (receiptVideoRef.current) {
        receiptVideoRef.current.srcObject = stream;
        try {
          await receiptVideoRef.current.play();
        } catch {}
      }
      setReceiptCameraMsg(null);
    } catch (e) {
      setReceiptCameraMsg('Camera access failed. Use Upload, or open this site via https/localhost and allow camera permissions.');
      setReceiptCameraOn(false);
    }
  };

  const stopCamera = () => {
    const stream: any = receiptVideoRef.current?.srcObject;
    if (stream) {
      stream.getTracks?.().forEach((t: any) => t.stop());
    }
    if (receiptVideoRef.current) {
      receiptVideoRef.current.srcObject = null;
    }
    setReceiptCameraOn(false);
    setReceiptCameraMsg(null);
  };

  const captureImage = () => {
    const video = receiptVideoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setReceiptImageUrl(dataUrl);
  };

  const extractTextOnDevice = async () => {
    if (!receiptImageUrl) return;

    setParsedReceipt([]);
    setReceiptText('');

    try {
      if ('TextDetector' in window) {
        const img = new Image();
        img.src = receiptImageUrl;
        await new Promise(r => { img.onload = r });
        const bitmap = await createImageBitmap(img);

        // @ts-expect-error experimental API
        const td = new window.TextDetector();
        const results = await td.detect(bitmap);
        let text = '';

        if (Array.isArray(results) && results.length) {
          // Group by y-position to reconstruct lines
          const groups: Record<string, Array<any>> = {};
          for (const r of results) {
            const box = (r.boundingBox || r.boundingClientRect || { y: 0, top: 0 });
            const y = Math.round((box.y ?? box.top ?? 0) / 10) * 10;
            const key = String(y);
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
          }

          const lines = Object.keys(groups)
            .map(k => ({
              y: Number(k),
              items: groups[k].sort((a,b) => (a.boundingBox?.x ?? a.boundingBox?.left ?? 0) - (b.boundingBox?.x ?? b.boundingBox?.left ?? 0))
            }))
            .sort((a,b) => a.y - b.y)
            .map(g => g.items.map(it => String(it.rawValue || '').trim()).filter(Boolean).join(' '));

          text = lines.join('\n');
        }

        setReceiptText(text);
        setReceiptMeta(parseReceiptMeta(text));
        const items = parseReceiptToItems(text);
        setParsedReceipt(items);
      } else {
        alert('On-device text detection is not supported in this browser. Paste text below instead, or use Extract via server.');
      }
    } catch (e) {
      logger.warn('useReceiptScanner', 'Text detection failed', e);
      alert('Text detection failed. Paste text below instead, or use Extract via server.');
    }
  };

  const extractTextViaServer = async () => {
    if (!receiptImageUrl) return;

    try {
      setReceiptOcrLoading(true);

      // Convert blob URL to data URL if needed
      let dataUrl = receiptImageUrl;
      if (dataUrl.startsWith('blob:')) {
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        });
      }

      const resp = await fetch('/api/ocr/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${resp.status}`);
      }

      const j = await resp.json();
      const text = String(j.text || '');
      setReceiptText(text);
      setReceiptMeta(parseReceiptMeta(text));
      const items = parseReceiptToItems(text);
      setParsedReceipt(items);
    } catch (e) {
      alert('Server OCR failed. Please paste text manually or try again.');
    } finally {
      setReceiptOcrLoading(false);
    }
  };

  const parseManualText = () => {
    setReceiptMeta(parseReceiptMeta(receiptText));
    const items = parseReceiptToItems(receiptText);
    setParsedReceipt(items);
  };

  const cropImage = () => {
    if (!receiptImgRef.current || !cropStart || !cropEnd) return;

    const img = receiptImgRef.current;
    const dispWidth = img.clientWidth;
    const dispHeight = img.clientHeight;
    const scaleX = img.naturalWidth / dispWidth;
    const scaleY = img.naturalHeight / dispHeight;

    const x = Math.round(Math.min(cropStart.x, cropEnd.x) * scaleX);
    const y = Math.round(Math.min(cropStart.y, cropEnd.y) * scaleY);
    const w = Math.round(Math.abs(cropEnd.x - cropStart.x) * scaleX);
    const h = Math.round(Math.abs(cropEnd.y - cropStart.y) * scaleY);

    if (w <= 2 || h <= 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const temp = new Image();
    temp.src = img.src;
    temp.onload = () => {
      ctx.drawImage(temp, x, y, w, h, 0, 0, w, h);
      const url = canvas.toDataURL('image/jpeg', 0.95);
      setReceiptImageUrl(url);
      setCropStart(null);
      setCropEnd(null);
      setCropEnabled(false);
    };
  };

  const reset = () => {
    setReceiptImageUrl(null);
    setReceiptText('');
    setParsedReceipt([]);
    setReceiptMeta({});
    setCropEnabled(false);
    setCropStart(null);
    setCropEnd(null);
    stopCamera();
  };

  return {
    // State
    receiptImageUrl,
    receiptText,
    receiptCameraOn,
    receiptCameraMsg,
    cropEnabled,
    cropStart,
    cropEnd,
    isCropping,
    receiptMeta,
    receiptOcrLoading,
    parsedReceipt,

    // Refs
    receiptVideoRef,
    receiptImgRef,

    // Setters
    setReceiptImageUrl,
    setReceiptText,
    setCropEnabled,
    setCropStart,
    setCropEnd,
    setIsCropping,
    setParsedReceipt,

    // Actions
    startCamera,
    stopCamera,
    captureImage,
    extractTextOnDevice,
    extractTextViaServer,
    parseManualText,
    cropImage,
    reset,
  };
}
