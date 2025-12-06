/**
 * CSV Parser for Finance Data
 * Parses the user's finance CSV files
 */

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  categoryName: string;
}

/**
 * Parse CSV content from the finance tracker
 * Format: Category headers in row 26, then item/amount pairs in columns
 */
export function parseFinanceCSV(content: string, month: string): ParsedTransaction[] {
  const lines = content.split('\n');
  const transactions: ParsedTransaction[] = [];

  // Find the row with category headers (row 26, index 25)
  const categoryRowIndex = 25;
  const categoryRow = lines[categoryRowIndex];

  if (!categoryRow) {
    return transactions;
  }

  const cells = categoryRow.split(',');

  // Extract category names and their column positions
  const categories: Array<{ name: string; itemCol: number; amountCol: number }> = [];

  for (let i = 0; i < cells.length - 1; i++) {
    const cell = cells[i]?.trim();
    if (cell && cell !== 'Total') {
      categories.push({
        name: cell,
        itemCol: i,
        amountCol: i + 1
      });
    }
  }

  // Parse transactions starting from row after category headers
  for (let rowIndex = categoryRowIndex + 1; rowIndex < lines.length; rowIndex++) {
    const row = lines[rowIndex];
    if (!row || row.trim() === '') continue;

    const rowCells = row.split(',');

    // Process each category column pair
    for (const category of categories) {
      const description = rowCells[category.itemCol]?.trim();
      const amountStr = rowCells[category.amountCol]?.trim();

      if (description && amountStr) {
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          transactions.push({
            date: month,
            description,
            amount,
            categoryName: category.name
          });
        }
      }
    }
  }

  return transactions;
}

/**
 * Map CSV category names to database category names
 */
export function mapCategoryName(categoryName: string): string {
  const mapping: Record<string, string> = {
    'Utilities': 'Bills & Utilities',
    'Food': 'Food & Dining',
    'Miscellaneous': 'Shopping',
    'Shopping + Trips': 'Shopping',
    'Groceries': 'Groceries',
    'Groceries ': 'Groceries' // Handle trailing space
  };
  return mapping[categoryName] || categoryName;
}
