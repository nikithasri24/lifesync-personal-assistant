-- Create view with calculated fields for finance_loans

CREATE OR REPLACE VIEW finance_loans_with_stats AS
SELECT
  l.*,
  COALESCE(SUM(lp.amount), 0) as total_paid,
  COALESCE(SUM(lp.interest_amount), 0) as interest_paid,
  COALESCE(SUM(lp.principal_amount), 0) as principal_paid,
  COUNT(lp.id) as payment_count,
  CASE
    WHEN l.monthly_payment + l.extra_payment > 0 THEN
      CEIL(l.current_balance / (l.monthly_payment + l.extra_payment))
    ELSE NULL
  END as remaining_payments,
  CASE
    WHEN l.monthly_payment + l.extra_payment > 0 THEN
      (CURRENT_DATE + (CEIL(l.current_balance / (l.monthly_payment + l.extra_payment)) || ' months')::INTERVAL)::DATE
    ELSE NULL
  END as projected_payoff_date
FROM finance_loans l
LEFT JOIN finance_loan_payments lp ON l.id = lp.loan_id
GROUP BY l.id;

-- Grant access to the view
GRANT SELECT ON finance_loans_with_stats TO authenticated;

-- Add RLS to view
ALTER VIEW finance_loans_with_stats SET (security_invoker = true);

