import React, { useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Scan Receipt</h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-md" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Left Column: Image Upload & Camera */}
          <div>
            <div className="border rounded-lg p-3 min-h-[200px] flex items-center justify-center bg-gray-50 relative select-none">
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
                  <img ref={receiptImgRef} src={receiptImageUrl} alt="Receipt" className="max-h-64 object-contain" />
                  {cropEnabled && cropStart && cropEnd && (
                    <div
                      className="absolute border-2 border-amber-500 bg-amber-200/20"
                      style={{
                        left: Math.min(cropStart.x, cropEnd.x),
                        top: Math.min(cropStart.y, cropEnd.y),
                        width: Math.abs(cropEnd.x - cropStart.x),
                        height: Math.abs(cropEnd.y - cropStart.y),
                      }}
                    />
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">Upload a receipt image</span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input type="file" accept="image/*" capture="environment" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0]; if (!f) return; setReceiptImageUrl(URL.createObjectURL(f));
              }} />
              {!receiptCameraOn ? (
                <button type="button" className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50" onClick={() => void startCamera()}>Use Camera</button>
              ) : (
                <>
                  <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-500" onClick={() => void captureImage()}>Capture</button>
                  <button type="button" className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50" onClick={stopCamera}>Stop</button>
                </>
              )}
              <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-500" onClick={() => void extractTextOnDevice()}>Extract text (beta)</button>
              <button type="button" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500" title="Use the server OCR service to extract text" onClick={() => void extractTextViaServer()} disabled={receiptOcrLoading}>{receiptOcrLoading ? 'Extracting…' : 'Auto extract & parse'}</button>
              {receiptImageUrl && (
                <>
                  <a href={receiptImageUrl} target="_blank" rel="noreferrer" className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50" title="Open image in new tab">Open image</a>
                  <a href={receiptImageUrl} download={`receipt-${Date.now()}.jpg`} className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50" title="Download image">Download</a>
                  <button type="button" className={`px-3 py-1 rounded border text-sm ${cropEnabled ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`} onClick={() => { setCropEnabled(!cropEnabled); setCropStart(null); setCropEnd(null); }} title="Toggle crop selection">{cropEnabled ? 'Cancel Crop' : 'Enable Crop'}</button>
                  <button type="button" className="px-3 py-1 rounded bg-amber-600 text-white text-sm hover:bg-amber-500 disabled:opacity-50" disabled={!cropEnabled || !cropStart || !cropEnd} onClick={cropImage}>Crop to selection</button>
                </>
              )}
            </div>

            {receiptCameraOn && (
              <div className="mt-2 relative rounded overflow-hidden bg-black">
                <video ref={receiptVideoRef} className="w-full h-64 object-contain" playsInline muted autoPlay />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs">Align receipt and tap Capture</div>
              </div>
            )}
            {receiptCameraMsg && <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{receiptCameraMsg}</p>}
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-gray-700">Or paste text</span>
              <textarea rows={6} value={receiptText} onChange={(e) => setReceiptText(e.target.value)} className="rounded border border-gray-300 px-2 py-1" placeholder="Paste recognized text from your receipt" />
              <div className="flex justify-end">
                <button type="button" className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50" onClick={parseManualText}>Parse</button>
              </div>
            </label>
          </div>

          {/* Right Column: Parsed Items */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-gray-900">Detected items</h4>
                <div className="flex items-center rounded-full bg-gray-100 p-0.5 text-xs">
                  <button type="button" className={`px-2 py-1 rounded-full ${receiptViewMode === 'pretty' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`} onClick={() => setReceiptViewMode('pretty')} title="Show receipt-style preview">Receipt view</button>
                  <button type="button" className={`px-2 py-1 rounded-full ${receiptViewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`} onClick={() => setReceiptViewMode('table')} title="Show editable table">Table view</button>
                </div>
              </div>

              {parsedReceipt.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <label className="inline-flex items-center gap-1">
                    <input type="checkbox" checked={receiptSelectAll} onChange={(e) => { setReceiptSelectAll(e.target.checked); setParsedReceipt(list => list.map(x => ({ ...x, selected: e.target.checked }))); }} />
                    <span>{receiptSelectAll ? 'Deselect all' : 'Select all'}</span>
                  </label>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-700">Category</span>
                  <CategorySelector value={receiptBulkCategory} onChange={setReceiptBulkCategory} className="rounded border border-gray-300 px-2 py-1" />
                  <button className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setParsedReceipt(list => list.map(x => x.selected ? { ...x, category: receiptBulkCategory } : x))}>Apply</button>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-700">Threshold</span>
                  <input value={receiptBulkThreshold} onChange={(e) => setReceiptBulkThreshold(e.target.value)} className="w-20 rounded border border-gray-300 px-2 py-1" placeholder="0" />
                  <button className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setParsedReceipt(list => list.map(x => x.selected ? { ...x, threshold: receiptBulkThreshold } : x))}>Apply</button>
                </div>
              )}
            </div>

            {/* Receipt Summary Card */}
            {(Boolean(receiptMeta.merchant) || receiptMeta.total != null || receiptMeta.subtotal != null || parsedReceipt.length > 0) && (
              <div className="mt-2 rounded border bg-white p-3 text-xs text-gray-700">
                {receiptMeta.merchant && <div className="font-medium text-gray-900">{receiptMeta.merchant}</div>}
                {receiptMeta.address && <div className="text-gray-500">{receiptMeta.address}</div>}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {receiptMeta.date && <div><span className="text-gray-500">Date:</span> {receiptMeta.date}</div>}
                  {receiptMeta.time && <div><span className="text-gray-500">Time:</span> {receiptMeta.time}</div>}
                  {receiptMeta.subtotal != null && <div><span className="text-gray-500">Subtotal:</span> ${receiptMeta.subtotal?.toFixed(2)}</div>}
                  {receiptMeta.tax != null && <div><span className="text-gray-500">Tax:</span> ${receiptMeta.tax?.toFixed(2)}</div>}
                  {receiptMeta.total != null && <div className="col-span-2"><span className="text-gray-500">Total:</span> <span className="font-medium text-gray-900">${receiptMeta.total?.toFixed(2)}</span></div>}
                  {receiptMeta.payment && <div className="col-span-2"><span className="text-gray-500">Payment:</span> {receiptMeta.payment}</div>}
                </div>
                {receiptCategorySummary.estSubtotal > 0 && (
                  <div className="mt-2 text-gray-600">
                    <div>Items est subtotal: ${receiptCategorySummary.estSubtotal.toFixed(2)} {receiptMeta.subtotal ? `(vs $${receiptMeta.subtotal.toFixed(2)})` : ''}</div>
                  </div>
                )}
              </div>
            )}

            {parsedReceipt.length === 0 ? <p className="text-sm text-gray-500 mt-2">No items parsed yet.</p> : receiptViewMode === 'table' ? (
              <div className="mt-2 overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-3 py-2 w-10"></th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Qty</th><th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-left">Threshold</th><th className="px-3 py-2 text-left">Details</th></tr></thead>
                  <tbody>
                    {parsedReceipt.map((it, idx) => (
                      <tr key={it.id} className={idx % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2 align-top"><input type="checkbox" checked={it.selected} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, selected: e.target.checked } : x))} /></td>
                        <td className="px-3 py-2 align-top"><div className="font-medium text-gray-900 truncate" title={it.name}>{it.name}</div></td>
                        <td className="px-3 py-2 align-top"><input type="number" min={1} value={it.quantity} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, quantity: Math.max(1, Number(e.target.value)||1) } : x))} className="w-20 rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                        <td className="px-3 py-2 align-top"><CategorySelector value={it.category} onChange={(cat) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, category: cat } : x))} className="rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                        <td className="px-3 py-2 align-top"><input type="number" min={0} value={it.threshold} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, threshold: e.target.value } : x))} className="w-24 rounded border border-gray-300 px-2 py-1 text-sm" placeholder="0" /></td>
                        <td className="px-3 py-2 align-top text-xs text-gray-600">{it.size ?? ''}{it.price != null ? ((it.size ?? false) ? ' • ' : '') + `$${it.price.toFixed(2)}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-2 rounded border bg-white">
                <div className="p-4">
                  <div className="text-sm text-gray-900 font-semibold">Store: {receiptMeta.merchant ?? '—'}</div>
                  <div className="text-xs text-gray-600 mt-0.5">Date {receiptMeta.date ?? '—'}{receiptMeta.time ? ` ${receiptMeta.time}` : ''}</div>
                </div>
                <div className="border-t">
                  <div className="px-4 py-2 text-xs text-gray-500">Items</div>
                  <ul className="divide-y">
                    {parsedReceipt.map((it) => (
                      <li key={it.id} className="px-4 py-2 text-sm">
                        <div className="font-medium text-gray-900">{it.name}</div>
                        <div className="text-xs text-gray-600">{it.price != null ? `$${it.price.toFixed(2)}` : ''}{(it.size ?? it.quantity) ? `${it.price != null ? ' ' : ''}${it.size ?? ''}${it.size && it.quantity ? ' • ' : ''}${it.quantity ? `${it.quantity} ${it.quantity > 1 ? 'units' : 'unit'}` : ''}` : ''}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold text-gray-900">${(receiptMeta.total ?? receiptCategorySummary.estSubtotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50" onClick={handleClose}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50" disabled={parsedReceipt.filter(x => x.selected).length === 0} onClick={() => void handleAddToPantry()}>Add to Pantry</button>
              {onLogExpense && <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-500" title="Log groceries expense in Financial Tracker" onClick={() => void handleLogExpense()}>Log Groceries Expense</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
