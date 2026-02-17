/**
 * Receipt Scanning Types
 * Type definitions for OCR receipt scanning and processing
 */

import type { ShoppingItem } from './index';

/**
 * Raw item extracted from receipt OCR
 */
export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  lineNumber: number; // Original line number in receipt
}

/**
 * Structured receipt data extracted from OCR
 */
export interface ReceiptData {
  rawText: string; // Full OCR text
  storeName?: string;
  storeAddress?: string;
  date?: string; // ISO date string
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  confidence: number; // 0-1, overall OCR confidence
}

/**
 * Match between receipt item and shopping list item
 */
export interface ReceiptItemMatch {
  receiptItem: ReceiptItem;
  shoppingItem: ShoppingItem | null;
  confidence: number; // 0-1, match confidence score
  suggestions: Array<{
    item: ShoppingItem;
    score: number;
  }>;
  userConfirmed: boolean;
  skipItem: boolean; // User chose to skip this item
}

/**
 * Complete receipt matching result
 */
export interface ReceiptMatchResult {
  receiptData: ReceiptData;
  matches: ReceiptItemMatch[];
  unmatchedCount: number;
  totalMatched: number;
  totalAmount: number;
}

/**
 * OCR processing status
 */
export type OCRStatus =
  | 'idle'
  | 'loading'
  | 'recognizing'
  | 'parsing'
  | 'matching'
  | 'completed'
  | 'error';

/**
 * OCR progress information
 */
export interface OCRProgress {
  status: OCRStatus;
  progress: number; // 0-100
  message: string;
}
