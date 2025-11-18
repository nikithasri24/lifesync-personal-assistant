# Insurance Tracking Feature

This document outlines the comprehensive Insurance Tracking feature for the Finance Hub.

## Overview

The Insurance Tracking feature allows users to manage all their insurance policies in one centralized location. Track premiums, coverage, renewals, claims, beneficiaries, and payment history.

### Key Features

- **Multi-policy management**: Track health, auto, home, life, disability, umbrella, pet, and travel insurance
- **Premium tracking**: Monitor costs with automatic annual cost calculation
- **Renewal alerts**: Get notified about upcoming renewals
- **Claims management**: Track all insurance claims and their status
- **Beneficiary management**: Keep beneficiary information organized
- **Payment history**: Track all premium payments
- **Coverage overview**: See total coverage across all policies

## Database Schema

### Tables Created

#### 1. `insurance_policies`
Main table for storing insurance policy information.

**Key Fields:**
- `policy_name` - Friendly name for the policy
- `policy_number` - Official policy number
- `provider` - Insurance company name
- `type` - Policy type (health, auto, home, life, disability, umbrella, pet, travel, other)
- `status` - Policy status (active, expired, cancelled, pending)
- `coverage_amount` - Total coverage amount
- `deductible` - Policy deductible
- `premium_amount` - Premium cost
- `premium_frequency` - Payment frequency (monthly, quarterly, semi-annual, annual)
- `renewal_date` - When the policy renews
- `next_payment_date` - Next premium payment due date
- `auto_renew` - Whether auto-renewal is enabled
- `renewal_reminder_days` - Days before renewal to show reminder (default: 30)

#### 2. `insurance_claims`
Track all insurance claims filed.

**Key Fields:**
- `claim_number` - Official claim number from provider
- `claim_type` - Type of claim (accident, illness, property_damage, theft, natural_disaster, other)
- `claim_amount` - Amount claimed
- `approved_amount` - Amount approved by insurer
- `paid_amount` - Amount actually paid
- `status` - Claim status (filed, under_review, approved, denied, paid, closed)
- `incident_date` - When the incident occurred
- `adjuster_name/phone/email` - Claims adjuster contact info

#### 3. `insurance_beneficiaries`
Store beneficiary information for policies (especially life insurance).

**Key Fields:**
- `name` - Beneficiary name
- `relationship` - Relationship to policyholder
- `beneficiary_type` - Primary or contingent beneficiary
- `percentage` - Percentage of benefit they receive

#### 4. `insurance_premium_payments`
Track all premium payments made.

**Key Fields:**
- `payment_date` - When payment was made
- `amount` - Payment amount
- `payment_method` - How it was paid
- `status` - Payment status (pending, completed, failed, refunded)
- `transaction_id` - Link to finance transactions if applicable

### Views

#### `insurance_policy_summary`
Aggregated view showing policy details with:
- Claim count
- Total claims paid
- Beneficiary count
- Last payment date

## TypeScript Types

All types are defined in `src/finance/types.ts`:

```typescript
export type InsurancePolicy = {
  id: string;
  policyName: string;
  provider: string;
  type: InsuranceType;
  status: InsuranceStatus;
  coverageAmount?: number;
  deductible?: number;
  premiumAmount: number;
  premiumFrequency: PremiumFrequency;
  renewalDate?: string;
  nextPaymentDate?: string;
  autoRenew: boolean;
  // ... and more
};

export type InsuranceClaim = { /* ... */ };
export type InsuranceBeneficiary = { /* ... */ };
export type InsurancePremiumPayment = { /* ... */ };
```

## Components

### 1. InsuranceCard
`src/finance/components/insurance/InsuranceCard.tsx`

Individual policy card displaying:
- Policy type icon (auto, home, health, life, etc.)
- Status badge with color coding
- Coverage and deductible amounts
- Premium cost with annual calculation
- Renewal warnings (when within reminder period)
- Next payment date
- Claim count and total paid
- Auto-renew indicator

**Features:**
- Color-coded status (active = green, expired = red, pending = amber)
- Automatic annual cost calculation from any frequency
- Dynamic renewal warning based on `renewalReminderDays`
- Click handler for viewing details

### 2. InsurancePage
`src/finance/pages/InsurancePage.tsx`

Main insurance dashboard showing:

**Summary Cards:**
- Active policies count
- Total annual premium across all policies
- Total coverage amount
- Policies needing attention (renewals, expired, pending)

**Upcoming Renewals Section:**
- Shows next 3 policies renewing (within 60 days)
- Color-coded by urgency (< 14 days = amber)
- Days until renewal countdown

**Filter Tabs:**
- All policies
- By type (Health, Auto, Home, Life, etc.)
- Dynamic count badges

**Policy Grid:**
- Responsive grid layout (1-3 columns)
- Click to view details
- Add new policy button

### 3. InsuranceSummaryCard
`src/finance/components/insurance/InsuranceSummaryCard.tsx`

Compact dashboard card showing:
- Total active policies
- Annual premium total
- Monthly average
- Policies needing attention warning
- Coverage breakdown by type
- Click to navigate to full Insurance page

## Usage

### Viewing Insurance

1. Navigate to **Finance → Insurance**
2. View all policies in grid layout
3. Use filter tabs to view by type
4. Click any policy card for details

### Adding a Policy

1. Click "Add Policy" button
2. Fill in policy details:
   - Policy name and number
   - Provider
   - Type (auto, health, home, etc.)
   - Coverage amount and deductible
   - Premium amount and frequency
   - Start and renewal dates
   - Agent contact information

### Renewal Reminders

- Policies show warning badge when within renewal reminder period
- Default is 30 days before renewal
- Configurable per policy with `renewalReminderDays` field
- Upcoming renewals section shows next 3 renewals

### Tracking Claims

Claims can be tracked with:
- Claim number and type
- Incident and filing dates
- Claimed, approved, and paid amounts
- Current status
- Adjuster contact information

### Managing Beneficiaries

For life insurance and similar policies:
- Add primary and contingent beneficiaries
- Track percentage allocation
- Store contact information
- Must total 100% for primary beneficiaries

## Calculations

### Annual Premium
Automatically calculated based on frequency:
- **Monthly**: `premium × 12`
- **Quarterly**: `premium × 4`
- **Semi-annual**: `premium × 2`
- **Annual**: `premium × 1`

### Days Until Renewal
```typescript
const daysUntil = Math.ceil(
  (renewalDate - today) / (1000 * 60 * 60 * 24)
);
```

### Needs Attention
A policy needs attention if:
- Status is 'expired'
- Status is 'pending'
- Renewal is within reminder days (default 30)

## Integration

The Insurance tab is integrated into the Finance Hub:

**Navigation:**
```
Dashboard → Transactions → Net Worth → Goals → Credit Cards → Insurance → Settings
```

**File:** `src/pages/Finances.tsx`

## API Integration (Future)

Currently using mock data. Future API methods to implement:

```typescript
interface InsuranceAPI {
  // Policies
  listPolicies(): Promise<InsurancePolicy[]>;
  getPolicy(id: string): Promise<InsurancePolicy>;
  upsertPolicy(policy: InsurancePolicyInput): Promise<void>;
  deletePolicy(id: string): Promise<void>;

  // Claims
  listClaims(policyId: string): Promise<InsuranceClaim[]>;
  upsertClaim(claim: InsuranceClaimInput): Promise<void>;

  // Beneficiaries
  listBeneficiaries(policyId: string): Promise<InsuranceBeneficiary[]>;
  upsertBeneficiary(beneficiary: InsuranceBeneficiaryInput): Promise<void>;

  // Payments
  listPayments(policyId: string): Promise<InsurancePremiumPayment[]>;
  recordPayment(payment: InsurancePremiumPaymentInput): Promise<void>;
}
```

## Future Enhancements

1. **Document Storage**: Upload and store policy documents, claims, receipts
2. **Policy Comparison**: Compare different policies side-by-side
3. **Coverage Gaps**: Analyze coverage and identify gaps
4. **Rate Monitoring**: Track premium changes over time
5. **Provider Ratings**: Store and display provider ratings/reviews
6. **Automatic Reminders**: Email/SMS notifications for renewals and payments
7. **Multi-Member**: Support for family members on same policy
8. **Claims Assistant**: Guide users through claims process
9. **Policy Recommendations**: Suggest appropriate coverage amounts
10. **Integration**: Auto-sync with insurance providers
11. **Cost Optimization**: Suggest ways to reduce premiums
12. **Coverage Calculator**: Help determine appropriate coverage levels

## Files Created/Modified

### New Files
- `supabase/migrations/20251118_add_insurance_tracking.sql` - Database schema
- `src/finance/components/insurance/InsuranceCard.tsx` - Individual policy card
- `src/finance/components/insurance/InsuranceSummaryCard.tsx` - Dashboard summary
- `src/finance/pages/InsurancePage.tsx` - Main insurance page
- `docs/INSURANCE_TRACKING.md` - This documentation

### Modified Files
- `src/finance/types.ts` - Added insurance types
- `src/pages/Finances.tsx` - Added Insurance tab

## Status Indicators

**Active** (Green):
- Policy is currently in force
- Premiums are being paid
- Coverage is active

**Expired** (Red):
- Policy has lapsed
- Coverage ended
- Needs renewal

**Pending** (Amber):
- Application in process
- Awaiting approval
- Not yet active

**Cancelled** (Gray):
- Policy terminated
- No longer in effect
- Archived

## Best Practices

1. **Regular Updates**: Update policies after any changes
2. **Document Everything**: Upload policy documents and correspondence
3. **Track Claims**: Record all claims immediately
4. **Review Annually**: Check coverage amounts annually
5. **Update Beneficiaries**: Keep beneficiary information current
6. **Payment Records**: Track all premium payments
7. **Renewal Calendar**: Set reminders well before renewal dates
8. **Coverage Review**: Review policies during major life events

## Security

All insurance data is protected by:
- Row Level Security (RLS) policies
- User-based access control
- Secure password storage for documents
- Encrypted sensitive fields (future)

RLS ensures users can only access their own:
- Policies
- Claims
- Beneficiaries
- Payments

## Support

For questions or issues:
- Database schema: `supabase/migrations/20251118_add_insurance_tracking.sql`
- Types: `src/finance/types.ts`
- Main page: `src/finance/pages/InsurancePage.tsx`
- Components: `src/finance/components/insurance/`

## Example Usage

```typescript
// Example policy object
const autoPolicy: InsurancePolicy = {
  policyName: "Honda Civic Coverage",
  provider: "State Farm",
  type: "auto",
  status: "active",
  coverageAmount: 300000,
  deductible: 1000,
  premiumAmount: 125,
  premiumFrequency: "monthly",
  renewalDate: "2025-12-01",
  autoRenew: true,
  renewalReminderDays: 30
};
```

## Migration Applied

✅ Migration successfully applied on 2025-11-18
- 4 tables created
- 4 RLS policies configured
- 7 indexes created
- 3 triggers set up
- 1 view created
- 6 check constraints added

Ready for use!
