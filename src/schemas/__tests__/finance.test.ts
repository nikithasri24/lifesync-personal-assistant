import { describe, it, expect } from 'vitest';
import {
  UUIDSchema,
  ISODateSchema,
  YearMonthSchema,
  EmailSchema,
  PhoneSchema,
  PercentageSchema,
  APRSchema,
  DayOfMonthSchema,
  AccountTypeSchema,
  RewardsTypeSchema,
  TxnTypeSchema,
  GoalTypeSchema,
  InstitutionSchema,
  InstitutionInputSchema,
  AccountSchema,
  AccountInputSchema,
  CategorySchema,
  TransactionSchema,
  TransactionInputSchema,
  BudgetSchema,
  BudgetTemplateSchema,
  GoalSchema,
  GoalInputSchema,
  GoalProgressPointSchema,
  GoalRecommendationSchema,
  CreditCardStatementSchema,
  CardBenefitSchema,
  CardCategoryBonusSchema,
  WelcomeBonusSchema,
  CardOfferSchema,
  InsurancePolicySchema,
  InsurancePolicyInputSchema,
  InsuranceClaimSchema,
  InsuranceBeneficiarySchema,
  InsurancePremiumPaymentSchema,
  validateFinanceArrayWithFilter,
  validateFinanceItem,
} from '../finance';

describe('Finance Schemas', () => {
  describe('Common Schemas', () => {
    it('should validate UUID', () => {
      expect(UUIDSchema.parse('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(() => UUIDSchema.parse('not-a-uuid')).toThrow();
    });

    it('should validate ISO dates', () => {
      expect(ISODateSchema.parse('2024-01-15')).toBe('2024-01-15');
      expect(ISODateSchema.parse('2024-01-15T10:00:00Z')).toBe('2024-01-15T10:00:00Z');
      expect(() => ISODateSchema.parse('2024/01/15')).toThrow();
    });

    it('should validate year-month format', () => {
      expect(YearMonthSchema.parse('2024-01')).toBe('2024-01');
      expect(YearMonthSchema.parse('2024-12')).toBe('2024-12');
      expect(() => YearMonthSchema.parse('2024-1')).toThrow();
      expect(() => YearMonthSchema.parse('2024/01')).toThrow();
    });

    it('should validate email', () => {
      expect(EmailSchema.parse('user@example.com')).toBe('user@example.com');
      expect(() => EmailSchema.parse('not-an-email')).toThrow();
    });

    it('should validate phone numbers', () => {
      expect(PhoneSchema.parse('123-456-7890')).toBe('123-456-7890');
      expect(PhoneSchema.parse('(123) 456-7890')).toBe('(123) 456-7890');
      expect(() => PhoneSchema.parse('abc')).toThrow();
    });

    it('should validate percentages', () => {
      expect(PercentageSchema.parse(50)).toBe(50);
      expect(PercentageSchema.parse(0)).toBe(0);
      expect(PercentageSchema.parse(100)).toBe(100);
      expect(() => PercentageSchema.parse(-1)).toThrow();
      expect(() => PercentageSchema.parse(101)).toThrow();
    });

    it('should validate APR', () => {
      expect(APRSchema.parse(15.99)).toBe(15.99);
      expect(APRSchema.parse(0)).toBe(0);
      expect(() => APRSchema.parse(-1)).toThrow();
      expect(() => APRSchema.parse(101)).toThrow();
    });

    it('should validate day of month', () => {
      expect(DayOfMonthSchema.parse(1)).toBe(1);
      expect(DayOfMonthSchema.parse(31)).toBe(31);
      expect(DayOfMonthSchema.parse(-1)).toBe(-1); // Last day of month
      expect(() => DayOfMonthSchema.parse(0)).toThrow();
      expect(() => DayOfMonthSchema.parse(32)).toThrow();
      expect(() => DayOfMonthSchema.parse(-2)).toThrow();
    });
  });

  describe('Enum Schemas', () => {
    it('should validate account types', () => {
      expect(AccountTypeSchema.parse('checking')).toBe('checking');
      expect(AccountTypeSchema.parse('401k')).toBe('401k');
      expect(() => AccountTypeSchema.parse('invalid')).toThrow();
    });

    it('should validate rewards types', () => {
      expect(RewardsTypeSchema.parse('points')).toBe('points');
      expect(RewardsTypeSchema.parse('cashback')).toBe('cashback');
      expect(() => RewardsTypeSchema.parse('invalid')).toThrow();
    });

    it('should validate transaction types', () => {
      expect(TxnTypeSchema.parse('debit')).toBe('debit');
      expect(TxnTypeSchema.parse('credit')).toBe('credit');
      expect(() => TxnTypeSchema.parse('invalid')).toThrow();
    });

    it('should validate goal types', () => {
      expect(GoalTypeSchema.parse('savings')).toBe('savings');
      expect(GoalTypeSchema.parse('debt')).toBe('debt');
      expect(() => GoalTypeSchema.parse('investment')).toThrow();
    });
  });

  describe('InstitutionSchema', () => {
    const validInstitution = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Chase Bank',
      logoUrl: 'https://example.com/logo.png',
    };

    it('should validate complete institution', () => {
      const result = InstitutionSchema.parse(validInstitution);
      expect(result.name).toBe('Chase Bank');
    });

    it('should validate without logo', () => {
      const { logoUrl, ...institution } = validInstitution;
      const result = InstitutionSchema.parse(institution);
      expect(result.logoUrl).toBeUndefined();
    });

    it('should reject invalid institution name', () => {
      expect(() => InstitutionSchema.parse({ ...validInstitution, name: '' })).toThrow();
    });
  });

  describe('AccountSchema', () => {
    const validAccount = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Chase Freedom',
      type: 'credit',
      balance: -1500.00,
      lastUpdatedISO: '2024-01-15T10:00:00Z',
    };

    it('should validate complete account', () => {
      const result = AccountSchema.parse(validAccount);
      expect(result.name).toBe('Chase Freedom');
      expect(result.balance).toBe(-1500.00);
    });

    it('should validate with credit card fields', () => {
      const creditCard = {
        ...validAccount,
        liability: true,
        creditLimit: 10000,
        apr: 18.99,
        paymentDueDay: 15,
        minimumPayment: 35,
        statementBalance: -1500,
        statementDate: '2024-01-01',
        annualFee: 95,
        annualFeeDueDate: '2024-12-01',
        rewardsBalance: 15000,
        rewardsType: 'points',
        baseRewardsRate: 1.0,
      };

      const result = AccountSchema.parse(creditCard);
      expect(result.creditLimit).toBe(10000);
      expect(result.rewardsType).toBe('points');
    });

    it('should reject negative credit limit', () => {
      expect(() =>
        AccountSchema.parse({ ...validAccount, creditLimit: -1000 })
      ).toThrow();
    });

    it('should reject invalid APR', () => {
      expect(() =>
        AccountSchema.parse({ ...validAccount, apr: 101 })
      ).toThrow();
    });

    it('should reject invalid payment due day', () => {
      expect(() =>
        AccountSchema.parse({ ...validAccount, paymentDueDay: 32 })
      ).toThrow();
    });
  });

  describe('CategorySchema', () => {
    const validCategory = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Groceries',
      icon: 'shopping-cart',
      color: '#4CAF50',
    };

    it('should validate complete category', () => {
      const result = CategorySchema.parse(validCategory);
      expect(result.name).toBe('Groceries');
      expect(result.color).toBe('#4CAF50');
    });

    it('should validate with parent category', () => {
      const subCategory = {
        ...validCategory,
        parentId: '323e4567-e89b-12d3-a456-426614174000',
      };

      const result = CategorySchema.parse(subCategory);
      expect(result.parentId).toBeDefined();
    });

    it('should reject invalid color format', () => {
      expect(() =>
        CategorySchema.parse({ ...validCategory, color: 'red' })
      ).toThrow();
      expect(() =>
        CategorySchema.parse({ ...validCategory, color: '#FFF' })
      ).toThrow();
    });
  });

  describe('TransactionSchema', () => {
    const validTransaction = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      accountId: '323e4567-e89b-12d3-a456-426614174000',
      dateISO: '2024-01-15',
      description: 'Whole Foods',
      amount: 125.50,
      type: 'debit',
    };

    it('should validate complete transaction', () => {
      const result = TransactionSchema.parse(validTransaction);
      expect(result.description).toBe('Whole Foods');
      expect(result.amount).toBe(125.50);
    });

    it('should validate with categorization fields', () => {
      const categorizedTxn = {
        ...validTransaction,
        categoryId: '423e4567-e89b-12d3-a456-426614174000',
        merchantName: 'Whole Foods Market',
        confidenceScore: 0.95,
        suggestedCategoryId: '523e4567-e89b-12d3-a456-426614174000',
        notes: 'Weekly groceries',
      };

      const result = TransactionSchema.parse(categorizedTxn);
      expect(result.confidenceScore).toBe(0.95);
    });

    it('should reject negative amount', () => {
      expect(() =>
        TransactionSchema.parse({ ...validTransaction, amount: -10 })
      ).toThrow();
    });

    it('should reject invalid confidence score', () => {
      expect(() =>
        TransactionSchema.parse({ ...validTransaction, confidenceScore: 1.5 })
      ).toThrow();
      expect(() =>
        TransactionSchema.parse({ ...validTransaction, confidenceScore: -0.1 })
      ).toThrow();
    });
  });

  describe('BudgetSchema', () => {
    const validBudget = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      categoryId: '323e4567-e89b-12d3-a456-426614174000',
      month: '2024-01',
      limit: 500,
    };

    it('should validate complete budget', () => {
      const result = BudgetSchema.parse(validBudget);
      expect(result.month).toBe('2024-01');
      expect(result.limit).toBe(500);
    });

    it('should reject invalid month format', () => {
      expect(() =>
        BudgetSchema.parse({ ...validBudget, month: '2024-1' })
      ).toThrow();
      expect(() =>
        BudgetSchema.parse({ ...validBudget, month: '01-2024' })
      ).toThrow();
    });

    it('should reject non-positive limit', () => {
      expect(() =>
        BudgetSchema.parse({ ...validBudget, limit: 0 })
      ).toThrow();
      expect(() =>
        BudgetSchema.parse({ ...validBudget, limit: -100 })
      ).toThrow();
    });
  });

  describe('GoalSchema', () => {
    const validGoal = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 5000,
      startingAmount: 0,
      dueDateISO: '2025-12-31',
      type: 'savings',
    };

    it('should validate complete goal', () => {
      const result = GoalSchema.parse(validGoal);
      expect(result.name).toBe('Emergency Fund');
      expect(result.targetAmount).toBe(10000);
    });

    it('should validate with optional fields', () => {
      const goalWithOptionals = {
        ...validGoal,
        connectionId: '323e4567-e89b-12d3-a456-426614174000',
        linkedCategoryId: '423e4567-e89b-12d3-a456-426614174000',
        linkedAccountId: '523e4567-e89b-12d3-a456-426614174000',
        trackNetworth: true,
        isShared: true,
        createdAtISO: '2024-01-01',
        updatedAtISO: '2024-01-15',
      };

      const result = GoalSchema.parse(goalWithOptionals);
      expect(result.isShared).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(() =>
        GoalSchema.parse({ ...validGoal, targetAmount: -1000 })
      ).toThrow();
      expect(() =>
        GoalSchema.parse({ ...validGoal, currentAmount: -100 })
      ).toThrow();
    });
  });

  describe('CreditCardStatementSchema', () => {
    const validStatement = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      accountId: '223e4567-e89b-12d3-a456-426614174000',
      statementDate: '2024-01-01',
      dueDate: '2024-01-25',
      balance: 1500,
      minimumPayment: 35,
      paid: false,
      createdAt: '2024-01-01T10:00:00Z',
    };

    it('should validate complete statement', () => {
      const result = CreditCardStatementSchema.parse(validStatement);
      expect(result.balance).toBe(1500);
      expect(result.minimumPayment).toBe(35);
    });

    it('should validate with payment info', () => {
      const paidStatement = {
        ...validStatement,
        paid: true,
        paidAmount: 1500,
        paidDate: '2024-01-20',
        apr: 18.99,
      };

      const result = CreditCardStatementSchema.parse(paidStatement);
      expect(result.paid).toBe(true);
      expect(result.paidAmount).toBe(1500);
    });

    it('should reject due date before statement date', () => {
      expect(() =>
        CreditCardStatementSchema.parse({
          ...validStatement,
          statementDate: '2024-01-25',
          dueDate: '2024-01-01',
        })
      ).toThrow();
    });

    it('should reject negative minimum payment', () => {
      expect(() =>
        CreditCardStatementSchema.parse({ ...validStatement, minimumPayment: -10 })
      ).toThrow();
    });
  });

  describe('CardBenefitSchema', () => {
    const validBenefit = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      accountId: '323e4567-e89b-12d3-a456-426614174000',
      benefitType: 'travel_credit',
      name: 'Annual Travel Credit',
      value: 300,
      frequency: 'annual',
      usedAmount: 0,
      active: true,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    };

    it('should validate complete benefit', () => {
      const result = CardBenefitSchema.parse(validBenefit);
      expect(result.name).toBe('Annual Travel Credit');
      expect(result.value).toBe(300);
    });

    it('should reject negative used amount', () => {
      expect(() =>
        CardBenefitSchema.parse({ ...validBenefit, usedAmount: -10 })
      ).toThrow();
    });
  });

  describe('WelcomeBonusSchema', () => {
    const validBonus = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      accountId: '323e4567-e89b-12d3-a456-426614174000',
      bonusAmount: 60000,
      requiredSpend: 4000,
      currentSpend: 2500,
      deadline: '2024-06-01',
      completed: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('should validate complete welcome bonus', () => {
      const result = WelcomeBonusSchema.parse(validBonus);
      expect(result.bonusAmount).toBe(60000);
      expect(result.requiredSpend).toBe(4000);
    });

    it('should validate completed bonus', () => {
      const completedBonus = {
        ...validBonus,
        currentSpend: 4000,
        completed: true,
        completedDate: '2024-05-15',
      };

      const result = WelcomeBonusSchema.parse(completedBonus);
      expect(result.completed).toBe(true);
      expect(result.completedDate).toBe('2024-05-15');
    });

    it('should reject non-positive bonus amount', () => {
      expect(() =>
        WelcomeBonusSchema.parse({ ...validBonus, bonusAmount: 0 })
      ).toThrow();
    });
  });

  describe('InsurancePolicySchema', () => {
    const validPolicy = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '223e4567-e89b-12d3-a456-426614174000',
      policyName: 'Home Insurance',
      provider: 'State Farm',
      type: 'home',
      status: 'active',
      premiumAmount: 1200,
      premiumFrequency: 'annual',
      startDate: '2024-01-01',
      autoRenew: true,
      renewalReminderDays: 30,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    };

    it('should validate complete insurance policy', () => {
      const result = InsurancePolicySchema.parse(validPolicy);
      expect(result.policyName).toBe('Home Insurance');
      expect(result.premiumAmount).toBe(1200);
    });

    it('should validate with all optional fields', () => {
      const policyWithOptionals = {
        ...validPolicy,
        policyNumber: 'POL-123456',
        coverageAmount: 500000,
        deductible: 1000,
        endDate: '2025-01-01',
        renewalDate: '2025-01-01',
        nextPaymentDate: '2025-01-01',
        agentName: 'John Doe',
        agentPhone: '555-123-4567',
        agentEmail: 'john@example.com',
        notes: 'Annual policy',
        documents: [{ name: 'policy.pdf' }],
        claimCount: 0,
        totalClaimsPaid: 0,
        beneficiaryCount: 2,
        lastPaymentDate: '2024-01-01',
      };

      const result = InsurancePolicySchema.parse(policyWithOptionals);
      expect(result.coverageAmount).toBe(500000);
      expect(result.agentEmail).toBe('john@example.com');
    });

    it('should reject end date before start date', () => {
      expect(() =>
        InsurancePolicySchema.parse({
          ...validPolicy,
          startDate: '2025-01-01',
          endDate: '2024-01-01',
        })
      ).toThrow();
    });

    it('should reject non-positive premium amount', () => {
      expect(() =>
        InsurancePolicySchema.parse({ ...validPolicy, premiumAmount: 0 })
      ).toThrow();
    });
  });

  describe('InsuranceClaimSchema', () => {
    const validClaim = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      policyId: '223e4567-e89b-12d3-a456-426614174000',
      claimType: 'Water Damage',
      claimDate: '2024-01-20',
      incidentDate: '2024-01-15',
      claimAmount: 5000,
      status: 'filed',
      description: 'Pipe burst in bathroom',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    };

    it('should validate complete claim', () => {
      const result = InsuranceClaimSchema.parse(validClaim);
      expect(result.claimType).toBe('Water Damage');
      expect(result.claimAmount).toBe(5000);
    });

    it('should validate with all optional fields', () => {
      const claimWithOptionals = {
        ...validClaim,
        claimNumber: 'CLM-123',
        approvedAmount: 4500,
        paidAmount: 4500,
        deductiblePaid: 500,
        notes: 'Claim processed quickly',
        adjusterName: 'Jane Smith',
        adjusterPhone: '555-987-6543',
        adjusterEmail: 'jane@example.com',
        filedDate: '2024-01-20',
        approvedDate: '2024-01-25',
        paidDate: '2024-02-01',
        closedDate: '2024-02-05',
      };

      const result = InsuranceClaimSchema.parse(claimWithOptionals);
      expect(result.approvedAmount).toBe(4500);
      expect(result.adjusterEmail).toBe('jane@example.com');
    });

    it('should reject claim date before incident date', () => {
      expect(() =>
        InsuranceClaimSchema.parse({
          ...validClaim,
          incidentDate: '2024-01-25',
          claimDate: '2024-01-20',
        })
      ).toThrow();
    });
  });

  describe('InsuranceBeneficiarySchema', () => {
    const validBeneficiary = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      policyId: '223e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
      relationship: 'Spouse',
      beneficiaryType: 'primary',
      percentage: 100,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    };

    it('should validate complete beneficiary', () => {
      const result = InsuranceBeneficiarySchema.parse(validBeneficiary);
      expect(result.name).toBe('Jane Doe');
      expect(result.percentage).toBe(100);
    });

    it('should reject invalid percentage', () => {
      expect(() =>
        InsuranceBeneficiarySchema.parse({ ...validBeneficiary, percentage: -1 })
      ).toThrow();
      expect(() =>
        InsuranceBeneficiarySchema.parse({ ...validBeneficiary, percentage: 101 })
      ).toThrow();
    });
  });

  describe('InsurancePremiumPaymentSchema', () => {
    const validPayment = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      policyId: '223e4567-e89b-12d3-a456-426614174000',
      paymentDate: '2024-01-01',
      amount: 100,
      status: 'completed',
      createdAt: '2024-01-01T10:00:00Z',
    };

    it('should validate complete payment', () => {
      const result = InsurancePremiumPaymentSchema.parse(validPayment);
      expect(result.amount).toBe(100);
      expect(result.status).toBe('completed');
    });

    it('should validate with coverage period', () => {
      const paymentWithCoverage = {
        ...validPayment,
        coveragePeriodStart: '2024-01-01',
        coveragePeriodEnd: '2024-02-01',
      };

      const result = InsurancePremiumPaymentSchema.parse(paymentWithCoverage);
      expect(result.coveragePeriodStart).toBe('2024-01-01');
    });

    it('should reject coverage end before start', () => {
      expect(() =>
        InsurancePremiumPaymentSchema.parse({
          ...validPayment,
          coveragePeriodStart: '2024-02-01',
          coveragePeriodEnd: '2024-01-01',
        })
      ).toThrow();
    });
  });

  describe('Helper Functions', () => {
    describe('validateFinanceArrayWithFilter', () => {
      it('should filter out invalid items and keep valid ones', () => {
        const items = [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Valid Institution',
          },
          {
            id: 'invalid-uuid',
            userId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Invalid Institution',
          },
        ];

        const result = validateFinanceArrayWithFilter(
          InstitutionSchema,
          items,
          'test'
        );

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Valid Institution');
      });
    });

    describe('validateFinanceItem', () => {
      it('should return validated item on success', () => {
        const item = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Test Institution',
        };

        const result = validateFinanceItem(InstitutionSchema, item, 'test');
        expect(result.name).toBe('Test Institution');
      });

      it('should throw on validation failure', () => {
        const item = {
          id: 'invalid',
          userId: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Test',
        };

        expect(() =>
          validateFinanceItem(InstitutionSchema, item, 'test')
        ).toThrow(/Validation failed for test/);
      });
    });
  });
});
