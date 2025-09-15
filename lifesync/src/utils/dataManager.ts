import { useAppStore } from '../stores/useAppStore';

export interface ExportData {
  habits: any[];
  todos: any[];
  notes: any[];
  journalEntries: any[];
  recipes: any[];
  shoppingItems: any[];
  financialRecords: any[];
  budgets: any[];
  exportDate: string;
  version: string;
}

export const exportData = (): ExportData => {
  const store = useAppStore.getState();
  
  return {
    habits: store.habits,
    todos: store.todos,
    notes: store.notes,
    journalEntries: store.journalEntries,
    recipes: store.recipes,
    shoppingItems: store.shoppingItems,
    financialRecords: store.financialRecords,
    budgets: store.budgets,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
};

export const downloadJSON = (data: any, filename: string) => {
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

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
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
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.version || !data.exportDate) {
          throw new Error('Invalid export file format');
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse import file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const mergeImportedData = (importedData: ExportData, replaceExisting = false) => {
  const store = useAppStore.getState();
  
  if (replaceExisting) {
    // Replace all data
    useAppStore.setState({
      habits: importedData.habits || [],
      todos: importedData.todos || [],
      notes: importedData.notes || [],
      journalEntries: importedData.journalEntries || [],
      recipes: importedData.recipes || [],
      shoppingItems: importedData.shoppingItems || [],
      financialRecords: importedData.financialRecords || [],
      budgets: importedData.budgets || []
    });
  } else {
    // Merge with existing data (avoid duplicates by ID)
    const mergeArray = (existing: any[], imported: any[]) => {
      const existingIds = new Set(existing.map(item => item.id));
      const newItems = imported.filter(item => !existingIds.has(item.id));
      return [...existing, ...newItems];
    };
    
    useAppStore.setState({
      habits: mergeArray(store.habits, importedData.habits || []),
      todos: mergeArray(store.todos, importedData.todos || []),
      notes: mergeArray(store.notes, importedData.notes || []),
      journalEntries: mergeArray(store.journalEntries, importedData.journalEntries || []),
      recipes: mergeArray(store.recipes, importedData.recipes || []),
      shoppingItems: mergeArray(store.shoppingItems, importedData.shoppingItems || []),
      financialRecords: mergeArray(store.financialRecords, importedData.financialRecords || []),
      budgets: mergeArray(store.budgets, importedData.budgets || [])
    });
  }
};

// Backup management
export const createAutoBackup = () => {
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
  } catch (error) {
    console.error('Failed to create backup:', error);
    return null;
  }
};

export const getAvailableBackups = () => {
  const backupKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('lifesync-backup-'))
    .sort()
    .reverse();
    
  return backupKeys.map(key => {
    const timestamp = parseInt(key.replace('lifesync-backup-', ''));
    return {
      key,
      date: new Date(timestamp),
      size: localStorage.getItem(key)?.length || 0
    };
  });
};

export const restoreFromBackup = (backupKey: string) => {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error('Backup not found');
    }
    
    const data = JSON.parse(backupData);
    mergeImportedData(data, true);
    return true;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return false;
  }
};

// Create automatic backup every hour
if (typeof window !== 'undefined') {
  setInterval(createAutoBackup, 60 * 60 * 1000); // 1 hour
}