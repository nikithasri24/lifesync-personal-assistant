/**
 * Receipt Scanning Modal Component
 * Advanced OCR and receipt parsing with terracotta theme
 * Supports camera capture, image upload, text extraction, and pantry integration
 */

import React, { useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useReceiptScanner } from '../../hooks/useReceiptScanner';
import { calculateReceiptCategorySummary, type ParsedReceiptItem } from '../../services/receiptParser';
import type { ShoppingItem } from '../../types';
import { validateCategory } from '../../utils/typeValidators';

interface CategorySelectorProps {
  value: ShoppingItem['category'];
  onChange: (value: ShoppingItem['category']) => void;
  className?: string;
}

function CategorySelector({ value, onChange, className = '' }: CategorySelectorProps): React.ReactElement {
  return (
    <select value={value} onChange={(e) => onChange(validateCategory(e.target.value))} className={className}>
      <option value="produce">Produce</option>
      <option value="dairy">Dairy</option>
      <option value="meat">Meat</option>
      <option value="pantry">Pantry</option>
      <option value="frozen">Frozen</option>
      <option value="bakery">Bakery</option>
      <option value="deli">Deli</option>
      <option value="household">Household</option>
      <option value="personal">Personal</option>
      <option value="electronics">Electronics</option>
      <option value="other">Other</option>
    </select>
  );
}

interface ReceiptScanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToPantry: (items: ParsedReceiptItem[]) => Promise<void>;
  onLogExpense?: (amount: number, merchant: string) => Promise<void>;
}

export function ReceiptScanningModal({
  isOpen,
  onClose,
  onAddToPantry,
  onLogExpense
}: ReceiptScanningModalProps): React.ReactElement {
  const colors = useThemeColors();
  const {
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
    receiptVideoRef,
    receiptImgRef,
    setReceiptImageUrl,
    setReceiptText,
    setCropEnabled,
    setCropStart,
    setCropEnd,
    setIsCropping,
    setParsedReceipt,
    startCamera,
    stopCamera,
    captureImage,
    extractTextOnDevice,
    extractTextViaServer,
    parseManualText,
    cropImage,
    reset,
  } = useReceiptScanner();

  const [receiptViewMode, setReceiptViewMode] = React.useState<'table' | 'pretty'>('pretty');
  const [receiptSelectAll, setReceiptSelectAll] = React.useState<boolean>(false);
  const [receiptBulkCategory, setReceiptBulkCategory] = React.useState<ShoppingItem['category']>('pantry');
  const [receiptBulkThreshold, setReceiptBulkThreshold] = React.useState<string>('');

  const receiptCategorySummary = useMemo(() => {
    return calculateReceiptCategorySummary(parsedReceipt);
  }, [parsedReceipt]);

  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleClose = (): void => {
    reset();
    setReceiptViewMode('pretty');
    setReceiptSelectAll(false);
    setReceiptBulkCategory('pantry');
    setReceiptBulkThreshold('');
    onClose();
  };

  const handleAddToPantry = async (): Promise<void> => {
    const chosen = parsedReceipt.filter(x => x.selected);
    await onAddToPantry(chosen);
    handleClose();
  };

  const handleLogExpense = async (): Promise<void> => {
    if (!onLogExpense) return;

    const amount = (receiptMeta.total !== null && receiptMeta.total !== undefined && receiptMeta.total > 0)
      ? receiptMeta.total
      : receiptCategorySummary.estSubtotal;

    await onLogExpense(amount ?? 0, receiptMeta.merchant ?? 'Unknown Store');
  };

  if (!isOpen) return <></> as React.ReactElement;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const inputClassName = `rounded-xl px-3 py-2 text-sm transition-all duration-200 outline-none`;
  const buttonClassName = `px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98]`;

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
        className="w-full lg:max-w-4xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '95vh',
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
            Scan Receipt
          </h2>
          <button
            type="button"
            onClick={handleClose}
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
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Image Upload & Camera */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-4 min-h-[200px] flex items-center justify-center relative select-none"
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px dashed ${colors.border.medium}`,
                }}
              >
                {receiptImageUrl ? (
                  <div
                    className={`relative inline-block ${cropEnabled ? 'cursor-crosshair' : ''}`}
                    onMouseDown={(e) => {
                      if (!cropEnabled) return;
                      setIsCropping(true);
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setCropEnd(null);
                    }}
                    onMouseMove={(e) => {
                      if (!cropEnabled || !isCropping || !cropStart) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseUp={() => setIsCropping(false)}
                  >
                    <img ref={receiptImgRef} src={receiptImageUrl} alt="Receipt" className="max-h-64 object-contain rounded-lg" />
                    {cropEnabled && cropStart && cropEnd && (
                      <div
                        className="absolute"
                        style={{
                          border: `2px solid ${colors.accent.start}`,
                          backgroundColor: 'rgba(212, 165, 116, 0.2)',
                          left: Math.min(cropStart.x, cropEnd.x),
                          top: Math.min(cropStart.y, cropEnd.y),
                          width: Math.abs(cropEnd.x - cropStart.x),
                          height: Math.abs(cropEnd.y - cropStart.y),
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: colors.text.tertiary }}>
                    Upload a receipt image
                  </span>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setReceiptImageUrl(URL.createObjectURL(f));
                  }}
                  className="text-sm"
                />
                {!receiptCameraOn ? (
                  <button
                    type="button"
                    className={buttonClassName}
                    style={{
                      backgroundColor: colors.bg.white,
                      border: `2px solid ${colors.border.medium}`,
                      color: colors.text.secondary,
                    }}
                    onClick={() => void startCamera()}
                  >
                    Use Camera
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={buttonClassName}
                      style={{
                        background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                        color: 'white',
                      }}
                      onClick={() => void captureImage()}
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      className={buttonClassName}
                      style={{
                        backgroundColor: colors.bg.white,
                        border: `2px solid ${colors.border.medium}`,
                        color: colors.text.secondary,
                      }}
                      onClick={stopCamera}
                    >
                      Stop
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={buttonClassName}
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                    color: 'white',
                  }}
                  onClick={() => void extractTextOnDevice()}
                >
                  Extract text (beta)
                </button>
                <button
                  type="button"
                  className={buttonClassName}
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                    color: 'white',
                  }}
                  title="Use the server OCR service to extract text"
                  onClick={() => void extractTextViaServer()}
                  disabled={receiptOcrLoading}
                >
                  {receiptOcrLoading ? 'Extracting…' : 'Auto extract & parse'}
                </button>
              </div>

              {/* Additional Controls */}
              {receiptImageUrl && (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={receiptImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClassName}
                    style={{
                      backgroundColor: colors.bg.white,
                      border: `2px solid ${colors.border.medium}`,
                      color: colors.text.secondary,
                    }}
                    title="Open image in new tab"
                  >
                    Open image
                  </a>
                  <a
                    href={receiptImageUrl}
                    download={`receipt-${Date.now()}.jpg`}
                    className={buttonClassName}
                    style={{
                      backgroundColor: colors.bg.white,
                      border: `2px solid ${colors.border.medium}`,
                      color: colors.text.secondary,
                    }}
                    title="Download image"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    className={buttonClassName}
                    style={{
                      backgroundColor: cropEnabled ? 'rgba(212, 165, 116, 0.1)' : colors.bg.white,
                      border: `2px solid ${cropEnabled ? colors.accent.start : colors.border.medium}`,
                      color: cropEnabled ? colors.accent.start : colors.text.secondary,
                    }}
                    onClick={() => {
                      setCropEnabled(!cropEnabled);
                      setCropStart(null);
                      setCropEnd(null);
                    }}
                    title="Toggle crop selection"
                  >
                    {cropEnabled ? 'Cancel Crop' : 'Enable Crop'}
                  </button>
                  <button
                    type="button"
                    className={buttonClassName}
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                      color: 'white',
                      opacity: (!cropEnabled || !cropStart || !cropEnd) ? 0.5 : 1,
                    }}
                    disabled={!cropEnabled || !cropStart || !cropEnd}
                    onClick={cropImage}
                  >
                    Crop to selection
                  </button>
                </div>
              )}

              {/* Camera Video */}
              {receiptCameraOn && (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video ref={receiptVideoRef} className="w-full h-64 object-contain" playsInline muted autoPlay />
                  <div
                    className="absolute inset-x-0 bottom-0 p-3 text-white text-sm text-center"
                    style={{
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
                    }}
                  >
                    Align receipt and tap Capture
                  </div>
                </div>
              )}

              {receiptCameraMsg && (
                <p
                  className="text-xs p-3 rounded-xl"
                  style={{
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    border: `1px solid ${colors.accent.start}`,
                    color: colors.text.secondary,
                  }}
                >
                  {receiptCameraMsg}
                </p>
              )}

              {/* Manual Text Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Or paste text
                </label>
                <textarea
                  rows={6}
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                    width: '100%',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                  placeholder="Paste recognized text from your receipt"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    className={buttonClassName}
                    style={{
                      backgroundColor: colors.bg.white,
                      border: `2px solid ${colors.border.medium}`,
                      color: colors.text.secondary,
                    }}
                    onClick={parseManualText}
                  >
                    Parse
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Parsed Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                  Detected items
                </h4>
                <div
                  className="flex items-center rounded-full p-1 text-xs"
                  style={{ backgroundColor: colors.bg.secondary }}
                >
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-full transition-all ${receiptViewMode === 'pretty' ? 'shadow' : ''}`}
                    style={{
                      backgroundColor: receiptViewMode === 'pretty' ? '#FFFFFF' : 'transparent',
                      color: receiptViewMode === 'pretty' ? colors.text.primary : colors.text.tertiary,
                    }}
                    onClick={() => setReceiptViewMode('pretty')}
                    title="Show receipt-style preview"
                  >
                    Receipt view
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-full transition-all ${receiptViewMode === 'table' ? 'shadow' : ''}`}
                    style={{
                      backgroundColor: receiptViewMode === 'table' ? '#FFFFFF' : 'transparent',
                      color: receiptViewMode === 'table' ? colors.text.primary : colors.text.tertiary,
                    }}
                    onClick={() => setReceiptViewMode('table')}
                    title="Show editable table"
                  >
                    Table view
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {parsedReceipt.length > 0 && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={receiptSelectAll}
                      onChange={(e) => {
                        setReceiptSelectAll(e.target.checked);
                        setParsedReceipt(list => list.map(x => ({ ...x, selected: e.target.checked })));
                      }}
                    />
                    <span style={{ color: colors.text.secondary }}>
                      {receiptSelectAll ? 'Deselect all' : 'Select all'}
                    </span>
                  </label>
                  <span style={{ color: colors.border.medium }}>|</span>
                  <span style={{ color: colors.text.secondary }}>Category</span>
                  <CategorySelector
                    value={receiptBulkCategory}
                    onChange={setReceiptBulkCategory}
                    className="rounded-lg px-2 py-1 text-xs"
                  />
                  <button
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: colors.bg.white,
                      border: `1px solid ${colors.border.medium}`,
                      color: colors.text.secondary,
                    }}
                    onClick={() =>
                      setParsedReceipt(list => list.map(x => (x.selected ? { ...x, category: receiptBulkCategory } : x)))
                    }
                  >
                    Apply
                  </button>
                  <span style={{ color: colors.border.medium }}>|</span>
                  <span style={{ color: colors.text.secondary }}>Threshold</span>
                  <input
                    value={receiptBulkThreshold}
                    onChange={(e) => setReceiptBulkThreshold(e.target.value)}
                    className="w-20 rounded-lg px-2 py-1 text-xs"
                    placeholder="0"
                  />
                  <button
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: colors.bg.white,
                      border: `1px solid ${colors.border.medium}`,
                      color: colors.text.secondary,
                    }}
                    onClick={() =>
                      setParsedReceipt(list => list.map(x => (x.selected ? { ...x, threshold: receiptBulkThreshold } : x)))
                    }
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Receipt Summary Card */}
              {(Boolean(receiptMeta.merchant) ||
                receiptMeta.total != null ||
                receiptMeta.subtotal != null ||
                parsedReceipt.length > 0) && (
                <div
                  className="rounded-xl p-4 text-xs"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: `1px solid ${colors.border.light}`,
                  }}
                >
                  {receiptMeta.merchant && (
                    <div className="font-medium text-base mb-1" style={{ color: colors.text.primary }}>
                      {receiptMeta.merchant}
                    </div>
                  )}
                  {receiptMeta.address && (
                    <div className="mb-2" style={{ color: colors.text.tertiary }}>
                      {receiptMeta.address}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {receiptMeta.date && (
                      <div style={{ color: colors.text.secondary }}>
                        <span style={{ color: colors.text.tertiary }}>Date:</span> {receiptMeta.date}
                      </div>
                    )}
                    {receiptMeta.time && (
                      <div style={{ color: colors.text.secondary }}>
                        <span style={{ color: colors.text.tertiary }}>Time:</span> {receiptMeta.time}
                      </div>
                    )}
                    {receiptMeta.subtotal != null && (
                      <div style={{ color: colors.text.secondary }}>
                        <span style={{ color: colors.text.tertiary }}>Subtotal:</span> ${receiptMeta.subtotal?.toFixed(2)}
                      </div>
                    )}
                    {receiptMeta.tax != null && (
                      <div style={{ color: colors.text.secondary }}>
                        <span style={{ color: colors.text.tertiary }}>Tax:</span> ${receiptMeta.tax?.toFixed(2)}
                      </div>
                    )}
                    {receiptMeta.total != null && (
                      <div className="col-span-2">
                        <span style={{ color: colors.text.tertiary }}>Total:</span>{' '}
                        <span className="font-medium" style={{ color: colors.text.primary }}>
                          ${receiptMeta.total?.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {receiptMeta.payment && (
                      <div className="col-span-2" style={{ color: colors.text.secondary }}>
                        <span style={{ color: colors.text.tertiary }}>Payment:</span> {receiptMeta.payment}
                      </div>
                    )}
                  </div>
                  {receiptCategorySummary.estSubtotal > 0 && (
                    <div className="mt-2" style={{ color: colors.text.secondary }}>
                      <div>
                        Items est subtotal: ${receiptCategorySummary.estSubtotal.toFixed(2)}{' '}
                        {receiptMeta.subtotal ? `(vs $${receiptMeta.subtotal.toFixed(2)})` : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Display */}
              {parsedReceipt.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: colors.text.tertiary }}>
                  No items parsed yet.
                </p>
              ) : receiptViewMode === 'table' ? (
                <div
                  className="overflow-x-auto rounded-xl"
                  style={{ border: `1px solid ${colors.border.light}` }}
                >
                  <table className="min-w-full text-sm">
                    <thead style={{ backgroundColor: colors.bg.primary }}>
                      <tr>
                        <th className="px-3 py-2 w-10"></th>
                        <th className="px-3 py-2 text-left" style={{ color: colors.text.secondary }}>
                          Item
                        </th>
                        <th className="px-3 py-2 text-left" style={{ color: colors.text.secondary }}>
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left" style={{ color: colors.text.secondary }}>
                          Category
                        </th>
                        <th className="px-3 py-2 text-left" style={{ color: colors.text.secondary }}>
                          Threshold
                        </th>
                        <th className="px-3 py-2 text-left" style={{ color: colors.text.secondary }}>
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedReceipt.map((it, idx) => (
                        <tr
                          key={it.id}
                          style={{ backgroundColor: idx % 2 ? colors.bg.white : colors.bg.primary }}
                        >
                          <td className="px-3 py-2 align-top">
                            <input
                              type="checkbox"
                              checked={it.selected}
                              onChange={(e) =>
                                setParsedReceipt(list =>
                                  list.map(x => (x.id === it.id ? { ...x, selected: e.target.checked } : x))
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="font-medium truncate" style={{ color: colors.text.primary }} title={it.name}>
                              {it.name}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) =>
                                setParsedReceipt(list =>
                                  list.map(x =>
                                    x.id === it.id ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x
                                  )
                                )
                              }
                              className="w-20 rounded-lg px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <CategorySelector
                              value={it.category}
                              onChange={cat =>
                                setParsedReceipt(list => list.map(x => (x.id === it.id ? { ...x, category: cat } : x)))
                              }
                              className="rounded-lg px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              min={0}
                              value={it.threshold}
                              onChange={(e) =>
                                setParsedReceipt(list =>
                                  list.map(x => (x.id === it.id ? { ...x, threshold: e.target.value } : x))
                                )
                              }
                              className="w-24 rounded-lg px-2 py-1 text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-xs" style={{ color: colors.text.tertiary }}>
                            {it.size ?? ''}
                            {it.price != null ? ((it.size ?? false) ? ' • ' : '') + `$${it.price.toFixed(2)}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${colors.border.light}`, backgroundColor: colors.bg.white }}
                >
                  <div className="p-4" style={{ backgroundColor: colors.bg.primary }}>
                    <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                      Store: {receiptMeta.merchant ?? '—'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                      Date {receiptMeta.date ?? '—'}
                      {receiptMeta.time ? ` ${receiptMeta.time}` : ''}
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${colors.border.light}` }}>
                    <div className="px-4 py-2 text-xs" style={{ color: colors.text.tertiary }}>
                      Items
                    </div>
                    <ul style={{ borderTop: `1px solid ${colors.border.light}` }}>
                      {parsedReceipt.map(it => (
                        <li
                          key={it.id}
                          className="px-4 py-2 text-sm"
                          style={{ borderTop: `1px solid ${colors.border.light}` }}
                        >
                          <div className="font-medium" style={{ color: colors.text.primary }}>
                            {it.name}
                          </div>
                          <div className="text-xs" style={{ color: colors.text.secondary }}>
                            {it.price != null ? `$${it.price.toFixed(2)}` : ''}
                            {(it.size ?? it.quantity)
                              ? `${it.price != null ? ' ' : ''}${it.size ?? ''}${it.size && it.quantity ? ' • ' : ''}${
                                  it.quantity ? `${it.quantity} ${it.quantity > 1 ? 'units' : 'unit'}` : ''
                                }`
                              : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 text-sm" style={{ borderTop: `1px solid ${colors.border.light}` }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: colors.text.secondary }}>Total</span>
                      <span className="font-semibold" style={{ color: colors.text.primary }}>
                        ${(receiptMeta.total ?? receiptCategorySummary.estSubtotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 flex-wrap">
                <button
                  className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: `2px solid ${colors.border.medium}`,
                    color: colors.text.secondary,
                  }}
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                    color: 'white',
                    opacity: parsedReceipt.filter(x => x.selected).length === 0 ? 0.5 : 1,
                  }}
                  disabled={parsedReceipt.filter(x => x.selected).length === 0}
                  onClick={() => void handleAddToPantry()}
                >
                  Add to Pantry
                </button>
                {onLogExpense && (
                  <button
                    className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white',
                    }}
                    title="Log groceries expense in Financial Tracker"
                    onClick={() => void handleLogExpense()}
                  >
                    Log Expense
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
