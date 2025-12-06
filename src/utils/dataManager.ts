import { useAppStore } from '../stores/useAppStore';
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
  const store = useAppStore.getState() as {
    habits?: unknown;
    todos?: unknown;
    notes?: unknown;
    journalEntries?: unknown;
    recipes?: unknown;
    shoppingItems?: unknown;
    financialRecords?: unknown;
    budgets?: unknown;
  };

  return {
    habits: (store.habits ?? []) as Habit[],
    todos: (store.todos ?? []) as TodoItem[],
    notes: (store.notes ?? []) as Note[],
    journalEntries: (store.journalEntries ?? []) as JournalEntry[],
    recipes: (store.recipes ?? []) as Recipe[],
    shoppingItems: (store.shoppingItems ?? []) as ShoppingItem[],
    financialRecords: (store.financialRecords ?? []) as Transaction[],
    budgets: (store.budgets ?? []) as Budget[],
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
  const store = useAppStore.getState() as {
    habits: Habit[];
    todos: TodoItem[];
    notes: Note[];
    journalEntries: JournalEntry[];
    recipes: Recipe[];
    shoppingItems: ShoppingItem[];
    financialRecords: Transaction[];
    budgets: Budget[];
  };

  if (replaceExisting) {
    // Replace all data
    useAppStore.setState({
      habits: importedData.habits ?? [],
      todos: importedData.todos ?? [],
      notes: importedData.notes ?? [],
      journalEntries: importedData.journalEntries ?? [],
      recipes: importedData.recipes ?? [],
      shoppingItems: importedData.shoppingItems ?? [],
      financialRecords: importedData.financialRecords ?? [],
      budgets: importedData.budgets ?? []
    });
  } else {
    // Merge with existing data (avoid duplicates by ID)
    const mergeArray = <T extends { id: string }>(existing: T[], imported: T[]): T[] => {
      const existingIds = new Set(existing.map(item => item.id));
      const newItems = imported.filter(item => !existingIds.has(item.id));
      return [...existing, ...newItems];
    };

    useAppStore.setState({
      habits: mergeArray(store.habits, importedData.habits ?? []),
      todos: mergeArray(store.todos, importedData.todos ?? []),
      notes: mergeArray(store.notes, importedData.notes ?? []),
      journalEntries: mergeArray(store.journalEntries, importedData.journalEntries ?? []),
      recipes: mergeArray(store.recipes, importedData.recipes ?? []),
      shoppingItems: mergeArray(store.shoppingItems, importedData.shoppingItems ?? []),
      financialRecords: mergeArray(store.financialRecords, importedData.financialRecords ?? []),
      budgets: mergeArray(store.budgets, importedData.budgets ?? [])
    });
  }
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
    logger.error('Failed to create backup:', { error });
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
    logger.error('Failed to restore backup:', { error });
    return false;
  }
};

// Create automatic backup every hour
if (typeof window !== 'undefined') {
  setInterval(createAutoBackup, 60 * 60 * 1000); // 1 hour
}