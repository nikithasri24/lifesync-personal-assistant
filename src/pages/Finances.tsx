import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import type { FinancialAccountData, FinancialTransactionData } from '../services/apiClient'

interface TransactionView {
  id: string
  accountId: string
  accountName: string
  amount: number
  type: 'income' | 'expense'
  description: string
  category?: string
  date: Date
}

interface AccountView {
  id: string
  name: string
  institution?: string
  type?: string
  balance: number
  currency?: string
}

interface TransactionFormState {
  description: string
  amount: string
  type: 'income' | 'expense'
  accountId: string
  categoryId: string
  date: string
}

const normaliseAccount = (account: FinancialAccountData, index: number): AccountView => ({
  id: account.id ?? `account-${index}`,
  name: account.name,
  institution: account.institution ?? undefined,
  type: account.type,
  balance: typeof account.balance === 'number' ? account.balance : Number(account.balance ?? 0),
  currency: account.currency ?? 'USD',
})

const normaliseTransaction = (
  transaction: FinancialTransactionData,
  accounts: AccountView[],
  index: number,
): TransactionView => {
  const accountId = transaction.account_id ?? ''
  const account = accounts.find((item) => item.id === accountId)
  const rawDate = transaction.date ?? transaction.created_at ?? new Date().toISOString()
  return {
    id: transaction.id ?? `transaction-${index}`,
    accountId,
    accountName: account?.name ?? 'Unknown account',
    amount: typeof transaction.amount === 'number' ? transaction.amount : Number(transaction.amount ?? 0),
    type: (transaction.type as TransactionView['type']) ?? 'expense',
    description: transaction.description ?? '',
    category: transaction.category_id ?? undefined,
    date: new Date(rawDate),
  }
}

const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)

const Finances = () => {
  const {
    financialAccounts,
    financialTransactions,
    financesLoading,
    loadFinancialData,
    addFinancialTransaction,
  } = useAppStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [formState, setFormState] = useState<TransactionFormState>({
    description: '',
    amount: '',
    type: 'expense',
    accountId: '',
    categoryId: '',
    date: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadFinancialData()
  }, [loadFinancialData])

  useEffect(() => {
    if (!formState.accountId && financialAccounts.length > 0) {
      setFormState((prev) => ({ ...prev, accountId: financialAccounts[0]?.id ?? '' }))
    }
  }, [financialAccounts, formState.accountId])

  const accounts = useMemo(
    () => financialAccounts.map((account, index) => normaliseAccount(account, index)),
    [financialAccounts],
  )

  const transactions = useMemo(
    () =>
      financialTransactions
        .map((transaction, index) => normaliseTransaction(transaction, accounts, index))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [financialTransactions, accounts],
  )

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + (account.balance ?? 0), 0),
    [accounts],
  )

  const incomeTotal = useMemo(
    () => transactions.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  )

  const expenseTotal = useMemo(
    () => transactions.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false
      }
      if (accountFilter !== 'all' && transaction.accountId !== accountFilter) {
        return false
      }
      if (
        searchTerm &&
        !transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(transaction.category ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [transactions, typeFilter, accountFilter, searchTerm])

  const recentTransactions = filteredTransactions.slice(0, 10)

  const resetForm = () => {
    setFormState((prev) => ({
      description: '',
      amount: '',
      type: 'expense',
      accountId: accounts[0]?.id ?? prev.accountId,
      categoryId: '',
      date: '',
    }))
    setError(null)
  }

  const handleAddTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!formState.accountId) {
      setError('Select an account to record this transaction.')
      return
    }

    const amount = Number(formState.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    try {
      setSubmitting(true)
      await addFinancialTransaction({
        accountId: formState.accountId,
        amount,
        type: formState.type,
        description: formState.description,
        categoryId: formState.categoryId || undefined,
        date: formState.date ? new Date(formState.date) : undefined,
      })

      resetForm()
      setShowForm(false)
    } catch (err) {
      console.error('Failed to create transaction', err)
      setError('Unable to save transaction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Finance dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Track balances, spending, and savings across all of your accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search transactions..."
              className="h-10 rounded-full border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add transaction
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Total balance</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="rounded-full bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Monthly income</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(incomeTotal)}
              </p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Monthly spending</p>
              <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
                {formatCurrency(expenseTotal)}
              </p>
            </div>
            <div className="rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
              <ArrowDownRight className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Accounts</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-800">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{account.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {account.institution ?? account.type ?? 'Personal'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </div>
              ))}

              {accounts.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500 dark:text-slate-400">
                  No accounts connected yet. Add your first transaction to get started.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Need richer analytics? Connect your financial data in Supabase and LifeSync will pull
              balances and transactions automatically.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-10 rounded-full border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>

              <select
                className="h-10 rounded-full border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                value={accountFilter}
                onChange={(event) => setAccountFilter(event.target.value)}
              >
                <option value="all">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Filter className="h-4 w-4" />
              Advanced filters
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 dark:border-slate-700 dark:text-slate-200">
              Recent transactions
            </div>

            {financesLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                Loading financial data…
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                No transactions to display yet.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm dark:divide-slate-800">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.description || 'Transaction'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{transaction.type}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-200">{transaction.accountName}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-300">{transaction.category || 'Uncategorised'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        transaction.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-slate-300">
                        {format(transaction.date, 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add transaction</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">Record a new income or expense entry.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="rounded-full border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close add transaction form"
              >
                ×
              </button>
            </div>

            {error ? (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleAddTransaction}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-slate-200">
                  Description
                  <input
                    value={formState.description}
                    onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g. Grocery run"
                    required
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-slate-200">
                  Amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.amount}
                    onChange={(event) => setFormState({ ...formState, amount: event.target.value })}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-slate-200">
                  Type
                  <select
                    value={formState.type}
                    onChange={(event) => setFormState({ ...formState, type: event.target.value as 'income' | 'expense' })}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-slate-200">
                  Account
                  <select
                    value={formState.accountId}
                    onChange={(event) => setFormState({ ...formState, accountId: event.target.value })}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  >
                    <option value="" disabled>
                      Select account
                    </option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-slate-200">
                  Category (optional)
                  <input
                    value={formState.categoryId}
                    onChange={(event) => setFormState({ ...formState, categoryId: event.target.value })}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="e.g. groceries"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-slate-200">
                  Date
                  <input
                    type="date"
                    value={formState.date}
                    onChange={(event) => setFormState({ ...formState, date: event.target.value })}
                    className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Save transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Finances
