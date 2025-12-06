import React from 'react';
import { CreditCard } from 'lucide-react';
import { calculateCreditCardPayoff } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const DebtPayoffCalculator: React.FC = () => {
  const [balance, setBalance] = React.useState(5000);
  const [apr, setApr] = React.useState(18);
  const [monthlyPayment, setMonthlyPayment] = React.useState(200);

  const result = calculateCreditCardPayoff(balance, apr, monthlyPayment);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-6 w-6 text-red-600" />
        <h3 className="text-xl font-bold text-primary">Debt Payoff Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Current Balance
            </label>
            <input
              type="number"
              value={balance}
              onChange={e => setBalance(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              APR (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={apr}
              onChange={e => setApr(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Monthly Payment
            </label>
            <input
              type="number"
              value={monthlyPayment}
              onChange={e => setMonthlyPayment(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-orange-50">
            <p className="text-sm text-red-700 mb-1">Time to Pay Off</p>
            <p className="text-4xl font-bold text-red-900">
              {result.monthsToPayoff} months
            </p>
            <p className="text-sm text-red-600 mt-1">
              ({(result.monthsToPayoff / 12).toFixed(1)} years)
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50">
            <p className="text-sm text-amber-700 mb-1">Total Interest Paid</p>
            <p className="text-2xl font-bold text-amber-900">
              {formatCurrency(result.totalInterest)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-1">Total Amount Paid</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(result.totalPaid)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800 mb-2">
              💰 If you doubled your payment to {formatCurrency(monthlyPayment * 2)}/month:
            </p>
            <div className="space-y-1 text-xs text-emerald-700">
              <p>⏱ Pay off in {result.comparison.doubled.months} months (save {result.comparison.savings.months} months)</p>
              <p>💵 Save {formatCurrency(result.comparison.savings.interest)} in interest!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
