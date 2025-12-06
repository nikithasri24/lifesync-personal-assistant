export interface BudgetRecommendation {
  category: string;
  categoryName: string;
  currentSpending: number;
  recommendedBudget: number;
  percentageOfIncome: number;
  status: 'under' | 'over' | 'optimal';
  savings: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

export interface BudgetStrategy {
  id: string;
  name: string;
  description: string;
  allocations: { [category: string]: number };
  totalSavingsRate: number;
  suitability: number;
  pros: string[];
  cons: string[];
}

export interface SmartBudgetPlan {
  totalIncome: number;
  totalExpenses: number;
  currentSavingsRate: number;
  recommendedSavingsRate: number;
  totalSavings: number;
  recommendations: BudgetRecommendation[];
  strategies: BudgetStrategy[];
  insights: string[];
  warnings: string[];
}
