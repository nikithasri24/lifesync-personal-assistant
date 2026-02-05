/**
 * Import CSV Button
 *
 * Note: This is a stub implementation. Full implementation pending.
 */

import React from 'react';
import { logger } from '@/services/logger';

interface ImportCSVButtonProps {
  onSuccess?: () => void;
}

export function ImportCSVButton({ onSuccess: _onSuccess }: ImportCSVButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        logger.warn('Finance', 'ImportCSVButton not implemented');
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Import CSV
    </button>
  );
}

export default ImportCSVButton;
