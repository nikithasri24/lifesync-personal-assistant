/**
 * Import CSV Button Component
 * Production-ready CSV import with proper error handling and validation
 */

import React from 'react';
import { logger } from '../../services/logger';

import { Button } from '../ui/Button';
import { parseFinanceCSV, mapCategoryName } from '../utils/csvParser';
import type { ParsedTransaction } from '../utils/csvParser';
import { useAccountsQuery, useCategoriesQuery, useUpsertTransactionMutation } from '../hooks/useFinanceQuery';

interface ImportStats {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ transaction: string; error: string }>;
}

const ImportCSVButton: React.FC<{ _onSuccess: () => void }> = ({ _onSuccess }) => {
  const [importing, setImporting] = React.useState<boolean>(false);
  const [progress, setProgress] = React.useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // React Query hooks
  const { data: accounts = [] } = useAccountsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const upsertTransactionMutation = useUpsertTransactionMutation();

  const ensureCategoriesExist = async (
    existingCategories: Array<{ name: string; id: string }>,
    requiredCategories: Set<string>
  ): Promise<Map<string, string>> => {
    const categoryMap = new Map<string, string>();

    // Map existing categories
    if (Array.isArray(existingCategories)) {
      existingCategories.forEach(cat => categoryMap.set(cat.name, cat.id));
    }

    // Create missing categories
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    for (const categoryName of requiredCategories) {
      if (!categoryMap.has(categoryName)) {
        logger.debug('ImportCSVButton', `Creating missing category: ${categoryName}`);

        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userData.user.id,
            name: categoryName
          })
          .select('id')
          .single();

        if (error) {
          logger.error('ImportCSVButton', `Failed to create category ${categoryName}:`, error);
        } else if (data) {
          categoryMap.set(categoryName, data.id as string);
        }
      }
    }

    return categoryMap;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);
    setProgress(0);

    const stats: ImportStats = {
      total: 0,
      imported: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get account
      if (accounts.length === 0) {
        throw new Error('No account found. Please create an account first.');
      }
      const accountId = accounts[0].id;

      // Parse all CSV files
      let allTransactions: ParsedTransaction[] = [];
      const fileNames: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNames.push(file.name);
        const content = await file.text();

        // Extract month from filename (e.g., "Jul 2025" → "2025-07-15")
        const monthMatch = file.name.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/);
        let month = '2025-01-15'; // Default
        if (monthMatch) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthNum = monthNames.indexOf(monthMatch[1]) + 1;
          const year = monthMatch[2];
          month = `${year}-${monthNum.toString().padStart(2, '0')}-15`;
        }

        const transactions = parseFinanceCSV(content, month);
        allTransactions = allTransactions.concat(transactions);
      }

      if (allTransactions.length === 0) {
        // eslint-disable-next-line no-alert
        window.alert('No transactions found in the selected files.');
        return;
      }

      stats.total = allTransactions.length;

      // Get required categories
      const requiredCategories = new Set<string>();
      allTransactions.forEach(txn => {
        requiredCategories.add(mapCategoryName(txn.categoryName));
      });

      logger.info('ImportCSVButton', 'Import Summary:');
      logger.debug('ImportCSVButton', `- Files: ${fileNames.join(', ')}`);
      logger.debug('ImportCSVButton', `- Total transactions: ${stats.total}`);
      logger.debug('ImportCSVButton', `- Required categories: ${Array.from(requiredCategories).join(', ')}`);

      // Confirm import
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Import ${stats.total} transactions from ${files.length} file(s)?\n\nFiles: ${fileNames.join(', ')}`)) {
        return;
      }

      // Ensure all categories exist
      logger.info('ImportCSVButton', 'Ensuring categories exist...');
      const categoryMap = await ensureCategoriesExist(categories, requiredCategories);
      logger.info('ImportCSVButton', 'Categories ready:', Array.from(categoryMap.entries()));

      // Import transactions
      logger.info('ImportCSVButton', 'Starting import...');
      for (const txn of allTransactions) {
        try {
          // Map category name
          const mappedCategory = mapCategoryName(txn.categoryName);
          const categoryId = categoryMap.get(mappedCategory);

          if (!categoryId) {
            throw new Error(`Category not found: ${mappedCategory}`);
          }

          // Generate UUID for new transaction
          const txnId = crypto.randomUUID();

          const transactionData = {
            id: txnId,
            accountId,
            dateISO: txn.date,
            description: txn.description,
            categoryId,
            amount: txn.amount,
            type: 'debit' as const
          };

          // Insert transaction using React Query mutation
          await upsertTransactionMutation.mutateAsync(transactionData);

          stats.imported++;
          setProgress(Math.round((stats.imported / stats.total) * 100));

          if (stats.imported % 10 === 0) {
            logger.debug('ImportCSVButton', `  Progress: ${stats.imported}/${stats.total}`);
          }
        } catch (err) {
          stats.failed++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          stats.errors.push({
            transaction: `${txn.description} ($${txn.amount})`,
            error: errorMsg
          });
          logger.error('ImportCSVButton', `Failed: ${txn.description}:`, errorMsg);
        }
      }

      logger.info('ImportCSVButton', 'Import complete!');
      logger.debug('ImportCSVButton', `- Imported: ${stats.imported}`);
      logger.debug('ImportCSVButton', `- Failed: ${stats.failed}`);

      if (stats.errors.length > 0) {
        logger.group('Errors:');
        stats.errors.forEach(e => logger.error('ImportCSVButton', `${e.transaction}: ${e.error}`));
        logger.groupEnd();
      }

      // Show results
      let message = `Successfully imported ${stats.imported} of ${stats.total} transactions!`;
      if (stats.failed > 0) {
        message += `\n\n${stats.failed} failed (check console for details)`;
      }
      message += '\n\nPage will refresh to show new transactions...';

      // eslint-disable-next-line no-alert
      window.alert(message);

      // Force full page reload
      window.location.reload();

    } catch (error) {
      logger.error('ImportCSVButton', 'Import failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-alert
      window.alert(`Import failed: ${errorMsg}\n\nCheck console for details.`);
    } finally {
      setImporting(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = React.useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        multiple
        onChange={(e): void => { void handleFileSelect(e); }}
        style={{ display: 'none' }}
      />
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={importing}
      >
        {importing ? `Importing... ${progress}%` : 'Import CSV Files'}
      </Button>
    </>
  );
};

export default ImportCSVButton;
