import { Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DebtAccount } from '../../types/finance';
import type { DebtPaymentPlan } from './types';

interface DebtCardProps {
  debt: DebtAccount;
  typeInfo: { value: string; label: string; icon: string; color: string };
  utilization: number;
  schedule: DebtPaymentPlan[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function DebtCard({
  debt,
  typeInfo,
  utilization,
  schedule,
  onEdit,
  onDelete
}: DebtCardProps): JSX.Element {
  const payoffMonths = schedule.length;
  const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${typeInfo.color}20` }}
          >
            <span className="text-2xl">{typeInfo.icon}</span>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900">{typeInfo.label}</h4>
            <p className="text-gray-600">{debt.interestRate}% APR</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>Min Payment: ${debt.minimumPayment.toFixed(0)}</span>
              {debt.creditLimit && (
                <>
                  <span>•</span>
                  <span>Limit: ${debt.creditLimit.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div>
            <h5 className="font-medium text-gray-700 mb-1">Current Balance</h5>
            <div className="text-3xl font-bold text-red-600">
              ${debt.balance.toLocaleString()}
            </div>
          </div>

          {debt.creditLimit && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Credit Utilization</span>
                <span className={`text-sm font-medium ${
                  utilization > 80 ? 'text-red-600' :
                  utilization > 30 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {utilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    utilization > 80 ? 'bg-red-500' :
                    utilization > 30 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">With Minimum Payments</h5>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {payoffMonths} months
            </div>
            <div className="text-sm text-gray-600">
              {Math.floor(payoffMonths / 12)} years, {payoffMonths % 12} months
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">
              ${totalInterest.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">total interest</div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Recommendations</h5>
          <div className="space-y-2">
            {debt.interestRate > 20 && (
              <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-red-800">High Interest Rate</div>
                  <div className="text-red-700">Consider balance transfer or aggressive payoff</div>
                </div>
              </div>
            )}

            {utilization > 80 && (
              <div className="flex items-start space-x-2 p-2 bg-orange-50 rounded-lg">
                <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-800">High Utilization</div>
                  <div className="text-orange-700">May impact credit score</div>
                </div>
              </div>
            )}

            {debt.interestRate < 10 && (
              <div className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-green-800">Low Interest Rate</div>
                  <div className="text-green-700">Consider minimum payments</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
