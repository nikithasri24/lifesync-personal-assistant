/**
 * RetirementPage
 * Main page for managing retirement accounts (401k, IRA, HSA, etc.)
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useAccountsQuery,
  useRetirementAccountsQuery,
  useRetirementAccountQuery,
  useUpsertRetirementAccountMetadataMutation,
  useDeleteRetirementAccountMetadataMutation,
} from '../hooks/useFinanceQuery';
import { RetirementDashboard } from '../components/retirement';
import RetirementAccountEditor from '../components/retirement/RetirementAccountEditor';
import type { Account, RetirementAccountWithStats, RetirementAccountMetadataInput } from '../types';
import { logger } from '../../services/logger';

const RetirementPage: React.FC = () => {
  const { data: accounts = [], refetch: refetchAccounts } = useAccountsQuery();
  const { data: retirementAccounts = [], isLoading: loading } = useRetirementAccountsQuery();
  const upsertMetadataMutation = useUpsertRetirementAccountMetadataMutation();
  const deleteMetadataMutation = useDeleteRetirementAccountMetadataMutation();

  const [showEditor, setShowEditor] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<RetirementAccountWithStats | null>(null);

  // User profile data (you may want to fetch this from your user settings)
  const [annualSalary, setAnnualSalary] = useState(75000); // Default, should come from user profile
  const [age, setAge] = useState(35); // Default, should come from user profile

  // Filter retirement account types
  const retirementAccountTypes = ['401k', '403b', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa'];
  const retirementOnlyAccounts = accounts.filter(acc => retirementAccountTypes.includes(acc.type));

  const handleAddAccount = () => {
    setEditingAccount(null);
    setEditingMetadata(null);
    setShowEditor(true);
  };

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    const metadata = retirementAccounts.find(ra => ra.accountId === accountId);
    setEditingAccount(account);
    setEditingMetadata(metadata || null);
    setShowEditor(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this retirement account? This will remove all associated metadata, contributions, and performance history.')) {
      return;
    }

    try {
      await deleteMetadataMutation.mutateAsync(accountId);
      // Note: We're not deleting the actual account, just the retirement metadata
      // If you want to delete the account too, you'll need to add a deleteAccount mutation
    } catch (error) {
      logger.error('RetirementPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleDelete', accountId });
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleSave = async (metadata: RetirementAccountMetadataInput) => {
    try {
      // If editing existing account, just update metadata
      if (editingAccount) {
        await upsertMetadataMutation.mutateAsync(metadata);
      } else {
        // For new accounts, this should be handled by first creating the account
        // then adding metadata - you may want to add account creation flow here
        alert('Please create the account first from the Accounts page, then configure retirement settings.');
        return;
      }

      setShowEditor(false);
      setEditingAccount(null);
      setEditingMetadata(null);
    } catch (error) {
      logger.error('RetirementPage', error instanceof Error ? error : new Error(String(error)), { context: 'handleSave', metadata });
      alert('Failed to save retirement account. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingAccount(null);
    setEditingMetadata(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading retirement accounts...</div>
      </div>
    );
  }

  // Find retirement accounts that don't have metadata yet
  const unconfiguredAccounts = retirementOnlyAccounts.filter(
    acc => !retirementAccounts.some(ra => ra.accountId === acc.id)
  );

  return (
    <div className="space-y-6 p-6">
      {/* Show unconfigured accounts prompt */}
      {unconfiguredAccounts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
            ⚠️ Unconfigured Retirement Accounts ({unconfiguredAccounts.length})
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-400 mb-3">
            The following accounts need retirement settings configured:
          </p>
          <div className="space-y-2">
            {unconfiguredAccounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{account.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {account.type.toUpperCase()} • Balance: ${account.balance.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleEditAccount(account.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Configure
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <RetirementDashboard
        retirementAccounts={retirementAccounts}
        annualSalary={annualSalary}
        age={age}
        onAddAccount={handleAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Settings Hint */}
      {retirementAccounts.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡 <strong>Tip:</strong> Update your annual salary (${annualSalary.toLocaleString()}) and age ({age}) in Settings for more accurate employer match and retirement readiness calculations.
          </p>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && editingAccount && (
        <RetirementAccountEditor
          account={editingAccount}
          existingMetadata={editingMetadata || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Help Modal for creating new accounts */}
      {showEditor && !editingAccount && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Add Retirement Account
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                To add a new retirement account:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Go to the <strong>Accounts</strong> page</li>
                <li>Click <strong>"Add Manual Account"</strong></li>
                <li>Choose account type: <strong>401k, Roth IRA, HSA</strong>, etc.</li>
                <li>Enter the account details and balance</li>
                <li>Return here to configure retirement-specific settings</li>
              </ol>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Once created, the account will appear in the list above where you can click "Edit" to configure contribution limits, employer match, vesting, and more.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirementPage;
