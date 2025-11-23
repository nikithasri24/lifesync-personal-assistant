import { CreditCard, Calendar, TrendingDown, Target } from 'lucide-react';

interface DebtSummaryCardsProps {
  totalDebt: number;
  totalMinimumPayments: number;
  weightedAverageRate: number;
  debtCount: number;
}

export default function DebtSummaryCards({
  totalDebt,
  totalMinimumPayments,
  weightedAverageRate,
  debtCount
}: DebtSummaryCardsProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Total Debt</p>
            <p className="text-2xl font-bold text-red-900">${totalDebt.toLocaleString()}</p>
          </div>
          <CreditCard className="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-800">Min Payments</p>
            <p className="text-2xl font-bold text-orange-900">${totalMinimumPayments.toFixed(0)}</p>
            <p className="text-xs text-orange-700">per month</p>
          </div>
          <Calendar className="w-8 h-8 text-orange-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Avg Interest Rate</p>
            <p className="text-2xl font-bold text-yellow-900">{weightedAverageRate.toFixed(1)}%</p>
          </div>
          <TrendingDown className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Debt Accounts</p>
            <p className="text-2xl font-bold text-green-900">{debtCount}</p>
          </div>
          <Target className="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>
  );
}
