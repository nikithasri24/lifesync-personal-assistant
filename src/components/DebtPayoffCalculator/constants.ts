import type { DebtAccount } from '../../types/finance';

export const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card', icon: '💳', color: '#EF4444' },
  { value: 'student_loan', label: 'Student Loan', icon: '🎓', color: '#3B82F6' },
  { value: 'mortgage', label: 'Mortgage', icon: '🏠', color: '#10B981' },
  { value: 'loan', label: 'Personal Loan', icon: '💰', color: '#F59E0B' },
  { value: 'other', label: 'Other Debt', icon: '📋', color: '#8B5CF6' }
];

export const MOCK_DEBTS: DebtAccount[] = [
  {
    id: '1',
    accountId: 'acc1',
    type: 'credit_card',
    balance: 5420.50,
    interestRate: 18.99,
    minimumPayment: 125.00,
    dueDate: new Date('2024-02-15'),
    creditLimit: 8000,
    payoffStrategies: []
  },
  {
    id: '2',
    accountId: 'acc2',
    type: 'credit_card',
    balance: 2850.00,
    interestRate: 24.99,
    minimumPayment: 85.00,
    dueDate: new Date('2024-02-20'),
    creditLimit: 5000,
    payoffStrategies: []
  },
  {
    id: '3',
    accountId: 'acc3',
    type: 'student_loan',
    balance: 28500.00,
    interestRate: 6.5,
    minimumPayment: 310.00,
    dueDate: new Date('2024-02-10'),
    payoffStrategies: []
  }
];
