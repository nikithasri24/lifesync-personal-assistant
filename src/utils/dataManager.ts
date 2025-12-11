// TODO: This file is deprecated and should be removed or refactored to use the API layer directly
// The useComposedStore no longer contains data arrays (they're in React Query now)
// This file is not currently used in the application

import { logger } from '../services/logger';
import type { Habit, TodoItem, Note, JournalEntry, Recipe } from '../types';
import type { ShoppingItem } from '../shopping/types';
import type { Transaction, Budget } from '../types/finance';

export interface ExportData {
  habits: Habit[];
  todos: TodoItem[];
  notes: Note[];
  journalEntries: JournalEntry[];
  recipes: Recipe[];
  shoppingItems: ShoppingItem[];
  financialRecords: Transaction[];
  budgets: Budget[];
  exportDate: string;
  version: string;
}

export const exportData = (): ExportData => {
  // TODO: Refactor to use React Query cache or API layer
  logger.warn('dataManager', 'exportData is deprecated - data is now in React Query, not Zustand');

  return {
    habits: [],
    todos: [],
    notes: [],
    journalEntries: [],
    recipes: [],
    shoppingItems: [],
    financialRecords: [],
    budgets: [],
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
};

export const downloadJSON = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle different types of values safely
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'string') {
          if (value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        // For objects, arrays, etc.
        return JSON.stringify(value);
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid file content');
        }
        const data: unknown = JSON.parse(result);

        // Validate data structure
        if (
          !data ||
          typeof data !== 'object' ||
          !('version' in data) ||
          !('exportDate' in data)
        ) {
          throw new Error('Invalid export file format');
        }

        resolve(data as ExportData);
      } catch (_error) {
        reject(new Error('Failed to parse import file'));
      }
    };
    reader.onerror = (): void => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

export const mergeImportedData = (importedData: ExportData, replaceExisting = false): void => {
  // TODO: Refactor to use API layer to insert data into Supabase
  logger.warn('dataManager', 'mergeImportedData is deprecated - data should be imported via API layer', { importedData, replaceExisting });

  // This function is no longer functional since data is in React Query/Supabase, not Zustand
  throw new Error('mergeImportedData is deprecated - please use API layer to import data');
};

// Backup management
export const createAutoBackup = (): string | null => {
  const data = exportData();
  const backupKey = `lifesync-backup-${Date.now()}`;

  try {
    localStorage.setItem(backupKey, JSON.stringify(data));

    // Keep only last 5 backups
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('lifesync-backup-'));
    allKeys.sort();
    if (allKeys.length > 5) {
      allKeys.slice(0, allKeys.length - 5).forEach(key => {
        localStorage.removeItem(key);
      });
    }

    return backupKey;
  } catch (error: unknown) {
    logger.error('Failed to create backup:', error);
    return null;
  }
};

export const getAvailableBackups = (): Array<{ key: string; date: Date; size: number }> => {
  const backupKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('lifesync-backup-'))
    .sort()
    .reverse();

  return backupKeys.map(key => {
    const timestamp = parseInt(key.replace('lifesync-backup-', ''), 10);
    return {
      key,
      date: new Date(timestamp),
      size: localStorage.getItem(key)?.length ?? 0
    };
  });
};

export const restoreFromBackup = (backupKey: string): boolean => {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error('Backup not found');
    }

    const data: unknown = JSON.parse(backupData);
    mergeImportedData(data as ExportData, true);
    return true;
  } catch (error: unknown) {
    logger.error('Failed to restore backup:', error);
    return false;
  }
};

// Create automatic backup every hour
if (typeof window !== 'undefined') {
  setInterval(createAutoBackup, 60 * 60 * 1000); // 1 hour
}