/**
 * Finance Timeline Page
 * Smart moves, statement countdowns (A3 pill rail), payment priority, loan payoffs
 */

import React from 'react';
import { useAccountsQuery, useLoansQuery, useRecurringTransactionsQuery } from '@/hooks/useFinanceQuery';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Account } from '../types';

// ─── Date helpers ────────────────────────────────────────────────────────────

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFrom(date: Date): number {
  return Math.ceil((date.getTime() - today().getTime()) / 86_400_000);
}

/** Next occurrence of a given day-of-month from today */
function nextDayOfMonth(day: number): Date {
  const t = today();
  const attempt = new Date(t.getFullYear(), t.getMonth(), day);
  if (attempt <= t) attempt.setMonth(attempt.getMonth() + 1);
  return attempt;
}

/** Derive statement close day from statementDate string (day of that date) */
function statementCloseDayFromISO(iso: string): number {
  return new Date(iso).getDate();
}

function formatMonth(iso: string): string {
  return new Date(iso + '-01').toLocaleString('default', { month: 'short', year: 'numeric' });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n));
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Urgency = 'urgent' | 'soon' | 'income' | 'later' | 'promo';

interface PillEvent {
  id: string;
  days: number;
  title: string;
  sub: string;
  amount: string;
  urgency: Urgency;
  isReceived?: boolean;
}

interface SmartMove {
  id: string;
  urgency: 'red' | 'amber' | 'blue' | 'green' | 'purple';
  badge: string;
  title: string;
  detail: string;
  action?: string;
}

// ─── Colour maps ─────────────────────────────────────────────────────────────

const urgencyColors: Record<Urgency, { num: string; sectionLabel: string; sectionColor: string; chip: string; chipText: string }> = {
  urgent: { num: '#EF4444', sectionLabel: '🔴 Act now',           sectionColor: '#DC2626', chip: '#FEE2E2', chipText: '#DC2626' },
  soon:   { num: '#F59E0B', sectionLabel: '🟡 This week',         sectionColor: '#D97706', chip: '#FEF3C7', chipText: '#D97706' },
  income: { num: '#10B981', sectionLabel: '🟢 Income',            sectionColor: '#059669', chip: '#D1FAE5', chipText: '#059669' },
  later:  { num: '#9CA3AF', sectionLabel: '⬜ Later this month',  sectionColor: '#6B7280', chip: '#F3F4F6', chipText: '#6B7280' },
  promo:  { num: '#8B5CF6', sectionLabel: '✨ 0% cards — low priority', sectionColor: '#7C3AED', chip: '#EDE9FE', chipText: '#7C3AED' },
};

const moveColors = {
  red:    { bg: '#FEE2E2', badge: '#DC2626', border: '#EF4444' },
  amber:  { bg: '#FEF3C7', badge: '#D97706', border: '#F59E0B' },
  blue:   { bg: '#DBEAFE', badge: '#2563EB', border: '#3B82F6' },
  green:  { bg: '#D1FAE5', badge: '#059669', border: '#10B981' },
  purple: { bg: '#EDE9FE', badge: '#7C3AED', border: '#8B5CF6' },
};

// ─── Derived data ─────────────────────────────────────────────────────────────

function buildEvents(accounts: Account[], recurringTxns: ReturnType<typeof useRecurringTransactionsQuery>['data']): PillEvent[] {
  const events: PillEvent[] = [];

  // Credit card statement & due events
  for (const acc of accounts) {
    if (acc.type !== 'credit' || acc.isArchived) continue;

    // Statement close
    if (acc.statementDate) {
      const closeDay = statementCloseDayFromISO(acc.statementDate);
      const closeDate = nextDayOfMonth(closeDay);
      const days = daysFrom(closeDate);
      const urgency: Urgency = days <= 4 ? 'soon' : days <= 18 ? (acc.apr === 0 ? 'promo' : 'soon') : (acc.apr === 0 ? 'promo' : 'later');
      events.push({
        id: `${acc.id}-close`,
        days,
        title: `${acc.name} closes`,
        sub: days <= 4 ? 'Avoid new purchases' : acc.apr === 0 ? `0% APR${acc.promoAprEndDate ? ` until ${formatMonth(acc.promoAprEndDate)}` : ''}` : `${acc.apr}% APR`,
        amount: acc.statementBalance ? formatCurrency(acc.statementBalance) : acc.balance ? formatCurrency(acc.balance) : '—',
        urgency,
      });
    }

    // Payment due
    if (acc.paymentDueDay) {
      const dueDate = nextDayOfMonth(acc.paymentDueDay);
      const days = daysFrom(dueDate);
      const urgency: Urgency = days <= 2 ? 'urgent' : days <= 7 ? 'soon' : acc.apr === 0 ? 'promo' : 'later';
      events.push({
        id: `${acc.id}-due`,
        days,
        title: `${acc.name} due`,
        sub: acc.apr === 0 ? 'Minimum only — 0% APR' : `Pay in full · ${acc.apr ?? '?'}% APR`,
        amount: acc.apr === 0 ? 'min' : acc.statementBalance ? formatCurrency(acc.statementBalance) : '—',
        urgency,
      });
    }

    // 0% promo expiry alert
    if (acc.promoAprEndDate) {
      const daysLeft = daysFrom(new Date(acc.promoAprEndDate));
      if (daysLeft <= 180 && daysLeft > 0) {
        events.push({
          id: `${acc.id}-promo`,
          days: daysLeft,
          title: `${acc.name} 0% expires`,
          sub: `${formatMonth(acc.promoAprEndDate)} — ${Math.round(daysLeft / 30)} months left`,
          amount: formatCurrency(Math.abs(acc.balance)),
          urgency: daysLeft <= 90 ? 'urgent' : 'soon',
        });
      }
    }
  }

  // Income from recurring transactions
  const incomeRecurring = (recurringTxns ?? []).filter(t => t.type === 'credit' && t.active);
  for (const rec of incomeRecurring) {
    if (!rec.nextOccurrenceDate) continue;
    const date = new Date(rec.nextOccurrenceDate);
    const days = daysFrom(date);
    if (days < 0 || days > 35) continue;
    const isReceived = days < 0;
    events.push({
      id: `rec-${rec.id}`,
      days: Math.abs(days),
      title: rec.description,
      sub: isReceived ? `${date.toLocaleDateString('default', { month: 'short', day: 'numeric' })} · received ✓` : date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      amount: `+${formatCurrency(rec.amount)}`,
      urgency: 'income',
      isReceived,
    });
  }

  return events.sort((a, b) => {
    // urgent first, then by days
    const urgencyOrder: Record<Urgency, number> = { urgent: 0, soon: 1, income: 2, later: 3, promo: 4 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    return a.days - b.days;
  });
}

function buildSmartMoves(accounts: Account[], loans: Loan[]): SmartMove[] {
  const moves: SmartMove[] = [];
  const t = today();

  for (const acc of accounts) {
    if (acc.type !== 'credit' || acc.isArchived) continue;

    // Payment due very soon
    if (acc.paymentDueDay) {
      const dueDate = nextDayOfMonth(acc.paymentDueDay);
      const days = daysFrom(dueDate);
      if (days <= 2 && (acc.apr ?? 0) > 0) {
        moves.push({
          id: `due-${acc.id}`,
          urgency: 'red',
          badge: `🔴 Due in ${days === 0 ? 'today' : days === 1 ? '1 day' : `${days} days`}`,
          title: `${acc.name} ${acc.statementBalance ? formatCurrency(acc.statementBalance) : ''} due ${dueDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
          detail: `Pay to avoid ${acc.apr}% interest.`,
          action: 'Pay now →',
        });
      }
    }

    // Statement closes very soon
    if (acc.statementDate && (acc.apr ?? 0) > 15) {
      const closeDay = statementCloseDayFromISO(acc.statementDate);
      const closeDate = nextDayOfMonth(closeDay);
      const days = daysFrom(closeDate);
      if (days <= 4) {
        moves.push({
          id: `close-${acc.id}`,
          urgency: 'amber',
          badge: `⏰ Closes in ${days} days`,
          title: `Avoid ${acc.name} purchases until ${closeDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
          detail: `${acc.statementBalance ? formatCurrency(acc.statementBalance) : 'Balance'} already on statement. New charges increase your next payment.`,
        });
      }
    }

    // 0% APR expiry — critical
    if (acc.promoAprEndDate) {
      const daysLeft = daysFrom(new Date(acc.promoAprEndDate));
      if (daysLeft > 0 && daysLeft <= 180) {
        const monthsLeft = Math.round(daysLeft / 30);
        const balance = Math.abs(acc.balance);
        const needed = monthsLeft > 0 ? Math.ceil(balance / monthsLeft) : balance;
        moves.push({
          id: `promo-${acc.id}`,
          urgency: daysLeft <= 90 ? 'red' : 'purple',
          badge: `${daysLeft <= 90 ? '🚨' : '✨'} 0% expires in ${monthsLeft} months`,
          title: `${acc.name} needs ${formatCurrency(needed)}/mo to clear before interest`,
          detail: `Balance ${formatCurrency(balance)} · 0% until ${formatMonth(acc.promoAprEndDate)}. After that, interest kicks in.`,
          action: 'See payoff plan →',
        });
      }

      // Routing tip — use 0% card for purchases
      if (daysLeft > 30) {
        const highAprCards = accounts.filter(a => a.type === 'credit' && !a.isArchived && (a.apr ?? 0) > 15 && a.id !== acc.id);
        if (highAprCards.length > 0) {
          moves.push({
            id: `route-${acc.id}`,
            urgency: 'blue',
            badge: '💡 Routing tip',
            title: `Use ${acc.name} for purchases instead of ${highAprCards[0].name}`,
            detail: `0% vs ${highAprCards[0].apr}% APR. A $500 charge saves ~$${Math.round(500 * ((highAprCards[0].apr ?? 0) / 100) * 0.5)} over 6 months.`,
          });
        }
      }
    }
  }

  // Loan: higher interest first
  const activeLoans = loans.filter(l => l.status === 'active');
  if (activeLoans.length >= 2) {
    const sorted = [...activeLoans].sort((a, b) => b.interestRate - a.interestRate);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    if (highest.interestRate - lowest.interestRate > 1) {
      moves.push({
        id: 'loan-avalanche',
        urgency: 'green',
        badge: '🎯 Save more interest',
        title: `Extra payments → ${highest.loanName} (${highest.interestRate}%), not ${lowest.loanName} (${lowest.interestRate}%)`,
        detail: `At ${highest.interestRate}% vs ${lowest.interestRate}%, every $100 extra saves ${((highest.interestRate - lowest.interestRate)).toFixed(1)}% more per year on the higher-rate loan.`,
      });
    }
  }

  return moves.slice(0, 5);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#C18B5E',
    padding: '20px 16px 8px',
    display: 'flex', alignItems: 'center', gap: '8px',
  }}>
    {children}
    <div style={{ flex: 1, height: 1, background: 'rgba(193,139,94,0.2)' }} />
  </div>
);

const Card: React.FC<{ children: React.ReactNode; noPad?: boolean }> = ({ children, noPad }) => (
  <div style={{
    background: 'white', borderRadius: 16,
    margin: '0 16px 10px',
    boxShadow: '0 2px 8px rgba(139,111,71,0.07)',
    overflow: 'hidden',
    padding: noPad ? 0 : undefined,
  }}>
    {children}
  </div>
);

// Smart Move card
const SmartMoveCard: React.FC<{ move: SmartMove }> = ({ move }) => {
  const c = moveColors[move.urgency];
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 16px',
      borderBottom: '1px solid #F5EDE3',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: c.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18,
      }}>
        {move.urgency === 'red' ? '🚨' : move.urgency === 'amber' ? '⏰' : move.urgency === 'blue' ? '💡' : move.urgency === 'green' ? '🎯' : '✨'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 9, fontWeight: 800, padding: '2px 7px',
          borderRadius: 999, marginBottom: 4,
          background: c.bg, color: c.badge,
        }}>
          {move.badge}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', lineHeight: 1.3 }}>{move.title}</div>
        <div style={{ fontSize: 11, color: '#9B8B7A', marginTop: 3, lineHeight: 1.4 }}>{move.detail}</div>
        {move.action && (
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#C18B5E' }}>{move.action}</div>
        )}
      </div>
    </div>
  );
};

// Pill section header
const PillSectionHeader: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px 4px',
    fontSize: 9, fontWeight: 800,
    letterSpacing: '0.08em', textTransform: 'uppercase', color,
  }}>
    {label}
    <div style={{ flex: 1, height: 1, background: '#F0E8DF' }} />
  </div>
);

// Single pill row
const PillRow: React.FC<{ event: PillEvent }> = ({ event }) => {
  const c = urgencyColors[event.urgency];
  const displayNum = event.isReceived ? '✓' : event.days === 0 ? '!' : String(event.days);
  const displayUnit = event.isReceived ? 'done' : event.days === 0 ? 'today' : event.days === 1 ? 'day' : 'days';

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '9px 16px', borderBottom: '1px solid #F5EDE3', gap: 0,
    }}>
      {/* Countdown */}
      <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: c.num }}>{displayNum}</div>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: '#9B8B7A' }}>{displayUnit}</div>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 28, background: '#E8DCC8', margin: '0 12px', flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1F2937' }}>{event.title}</div>
        <div style={{ fontSize: 10, color: '#9B8B7A', marginTop: 1 }}>{event.sub}</div>
      </div>

      {/* Amount chip */}
      <div style={{
        fontSize: 12, fontWeight: 800,
        padding: '3px 9px', borderRadius: 999, flexShrink: 0,
        background: c.chip, color: c.chipText,
      }}>
        {event.amount}
      </div>
    </div>
  );
};

// Payment priority row
const PriorityRow: React.FC<{ rank: number; acc: Account }> = ({ rank, acc }) => {
  const isPromo = acc.apr === 0 || (acc.promoAprEndDate && daysFrom(new Date(acc.promoAprEndDate)) > 0);
  const rankColors = ['#DC2626', '#D97706', '#D97706', '#7C3AED'];
  const rankBg    = ['#FEE2E2', '#FEF3C7', '#FEF3C7', '#EDE9FE'];
  const tagLabel  = rank === 1 ? 'Pay first' : rank === 2 ? 'Pay next' : isPromo ? 'Min only' : 'Pay in full';
  const tagBg     = rank <= 2 ? '#FEE2E2' : isPromo ? '#EDE9FE' : '#FEF3C7';
  const tagColor  = rank <= 2 ? '#DC2626' : isPromo ? '#7C3AED' : '#D97706';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '11px 16px',
      borderBottom: '1px solid #F5EDE3', gap: 12,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800,
        background: rankBg[rank - 1] ?? '#F3F4F6',
        color: rankColors[rank - 1] ?? '#6B7280',
      }}>
        {rank}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>{acc.name}</div>
        <div style={{ fontSize: 10, color: '#9B8B7A', marginTop: 1 }}>
          {acc.statementBalance ? `Bal ${formatCurrency(acc.statementBalance)}` : `Bal ${formatCurrency(Math.abs(acc.balance))}`}
          {acc.minimumPayment ? ` · Min ${formatCurrency(acc.minimumPayment)}` : ''}
          {acc.paymentDueDay ? ` · Due ${nextDayOfMonth(acc.paymentDueDay).toLocaleDateString('default', { month: 'short', day: 'numeric' })}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: isPromo ? '#7C3AED' : rank <= 2 ? '#DC2626' : '#D97706' }}>
          {isPromo ? '0% ✨' : `${acc.apr ?? '?'}%`}
        </div>
        <div style={{
          display: 'inline-block', fontSize: 9, fontWeight: 700,
          padding: '2px 7px', borderRadius: 999, marginTop: 3,
          background: tagBg, color: tagColor,
        }}>
          {tagLabel}
        </div>
      </div>
    </div>
  );
};


// ─── Main page ────────────────────────────────────────────────────────────────

type SubTab = 'overview' | 'statements' | 'payments';

const TimelinePage: React.FC = () => {
  const colors = useThemeColors();
  const [subTab, setSubTab] = React.useState<SubTab>('overview');

  const { data: accounts = [] } = useAccountsQuery();
  const { data: loans = [] } = useLoansQuery();
  const { data: recurringTxns = [] } = useRecurringTransactionsQuery();

  const creditCards = React.useMemo(
    () => accounts.filter(a => a.type === 'credit' && !a.isArchived),
    [accounts]
  );

  const events = React.useMemo(
    () => buildEvents(accounts, recurringTxns),
    [accounts, recurringTxns]
  );

  const smartMoves = React.useMemo(
    () => buildSmartMoves(accounts, loans),
    [accounts, loans]
  );

  // Payment priority: sort credit cards by APR desc (0% last)
  const priorityCards = React.useMemo(() =>
    [...creditCards].sort((a, b) => {
      const aprA = a.promoAprEndDate && daysFrom(new Date(a.promoAprEndDate)) > 0 ? 0 : (a.apr ?? 0);
      const aprB = b.promoAprEndDate && daysFrom(new Date(b.promoAprEndDate)) > 0 ? 0 : (b.apr ?? 0);
      return aprB - aprA;
    }),
    [creditCards]
  );

  // Group events by urgency
  const grouped = React.useMemo(() => {
    const order: Urgency[] = ['urgent', 'soon', 'income', 'later', 'promo'];
    const map = new Map<Urgency, PillEvent[]>();
    for (const u of order) map.set(u, []);
    for (const e of events) map.get(e.urgency)?.push(e);
    return order.map(u => ({ urgency: u, events: map.get(u) ?? [] })).filter(g => g.events.length > 0);
  }, [events]);

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'overview',   label: 'Overview' },
    { key: 'statements', label: 'Statements' },
    { key: 'payments',   label: 'Payments' },
  ];

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 1rem 0.75rem', background: colors.bg.white }}>
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
          <span className="text-4xl">📅</span>
          Timeline
        </h1>
        <p style={{ fontSize: 12, color: colors.text.secondary, marginTop: 4 }}>
          Smart moves · Statement countdowns · Loan payoffs
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ background: colors.bg.white, padding: '8px 16px 0', borderBottom: `1px solid ${colors.border.light}` }}>
        <div style={{
          display: 'flex', background: 'rgba(212,165,116,0.1)',
          borderRadius: 10, padding: 3, gap: 2,
        }}>
          {subTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 7, border: 'none',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: subTab === t.key ? 'white' : 'none',
                color: subTab === t.key ? '#C18B5E' : '#9B8B7A',
                boxShadow: subTab === t.key ? '0 1px 3px rgba(139,111,71,0.15)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ height: 12 }} />
      </div>

      {/* ── OVERVIEW ─────────────────────────────── */}
      {subTab === 'overview' && (
        <>
          {smartMoves.length > 0 ? (
            <>
              <SectionLabel>⚡ Smart moves</SectionLabel>
              <Card noPad>
                {smartMoves.map((m, i) => (
                  <div key={m.id} style={{ borderBottom: i < smartMoves.length - 1 ? '1px solid #F5EDE3' : 'none' }}>
                    <SmartMoveCard move={m} />
                  </div>
                ))}
              </Card>
            </>
          ) : (
            <>
              <SectionLabel>⚡ Smart moves</SectionLabel>
              <Card>
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9B8B7A', fontSize: 13 }}>
                  🎉 No urgent actions right now. Add statement dates and due days to your credit cards to see smart moves.
                </div>
              </Card>
            </>
          )}

          {/* Quick preview of next 3 pill events */}
          {events.length > 0 && (
            <>
              <SectionLabel>📋 Coming up</SectionLabel>
              <Card noPad>
                {events.slice(0, 4).map(e => <PillRow key={e.id} event={e} />)}
                <button
                  onClick={() => setSubTab('statements')}
                  style={{
                    width: '100%', padding: '10px 16px', border: 'none',
                    background: 'none', fontSize: 12, fontWeight: 700,
                    color: '#C18B5E', cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  See all statements & dues →
                </button>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── STATEMENTS ───────────────────────────── */}
      {subTab === 'statements' && (
        <>
          {events.length === 0 ? (
            <>
              <SectionLabel>📋 Statements & dues</SectionLabel>
              <Card>
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3C2A1A', marginBottom: 6 }}>Add statement dates to your cards</div>
                  <div style={{ fontSize: 11, color: '#9B8B7A', lineHeight: 1.5 }}>
                    Edit each credit card account and fill in the Statement Date and Payment Due Day to see the countdown feed here.
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>
              {grouped.map(group => (
                <React.Fragment key={group.urgency}>
                  <PillSectionHeader
                    label={urgencyColors[group.urgency].sectionLabel}
                    color={urgencyColors[group.urgency].sectionColor}
                  />
                  <Card noPad>
                    {group.events.map((e, i) => (
                      <div key={e.id} style={{ borderBottom: i < group.events.length - 1 ? '1px solid #F5EDE3' : 'none' }}>
                        <PillRow event={e} />
                      </div>
                    ))}
                  </Card>
                </React.Fragment>
              ))}
            </>
          )}
        </>
      )}

      {/* ── PAYMENTS ─────────────────────────────── */}
      {subTab === 'payments' && (
        <>
          <SectionLabel>🎯 Payment priority</SectionLabel>
          {priorityCards.length > 0 ? (
            <>
              <Card noPad>
                {priorityCards.map((acc, i) => (
                  <div key={acc.id} style={{ borderBottom: i < priorityCards.length - 1 ? '1px solid #F5EDE3' : 'none' }}>
                    <PriorityRow rank={i + 1} acc={acc} />
                  </div>
                ))}
              </Card>
              {/* Insight */}
              {priorityCards.some(a => a.promoAprEndDate && daysFrom(new Date(a.promoAprEndDate)) <= 180 && daysFrom(new Date(a.promoAprEndDate)) > 0) && (
                <div style={{
                  margin: '0 16px 10px',
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  borderRadius: 12, padding: '10px 13px',
                  fontSize: 11, color: '#92400E', lineHeight: 1.5,
                }}>
                  ⚠️ You have a 0% promo card expiring soon. Pay minimums on it now — stack extra payments on high-APR cards first, then clear the 0% balance before it expires.
                </div>
              )}
            </>
          ) : (
            <Card>
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9B8B7A', fontSize: 13 }}>
                No credit cards found. Add credit card accounts to see payment priority.
              </div>
            </Card>
          )}
        </>
      )}


      <div style={{ height: '5rem' }} />
    </div>
  );
};

export default TimelinePage;
