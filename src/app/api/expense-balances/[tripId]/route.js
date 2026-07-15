/**
 * src/app/api/expense-balances/[tripId]/route.js
 * GET /api/expense-balances/[tripId]
 * Returns net balances per member and optimal settlement transactions
 * Uses the "net balance" Splitwise algorithm
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * Calculate minimum transactions to settle debts
 * Uses a greedy algorithm: pair largest debtor with largest creditor
 */
function calculateSettlements(balances) {
  const members = Object.entries(balances)
    .map(([id, data]) => ({ id, name: data.name, balance: data.net }))
    .filter((m) => Math.abs(m.balance) > 0.01);

  const settlements = [];
  const debtors = members.filter((m) => m.balance < -0.01).sort((a, b) => a.balance - b.balance);
  const creditors = members.filter((m) => m.balance > 0.01).sort((a, b) => b.balance - a.balance);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.name,
        from_id: debtor.id,
        to: creditor.name,
        to_id: creditor.id,
        amount: parseFloat(amount.toFixed(2)),
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return settlements;
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tripId } = await params;

    // Verify trip access
    const tripCheck = await query(
      `SELECT id, currency FROM trips WHERE id = $1 AND (
        created_by = $2 OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2)
      )`,
      [tripId, session.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    const tripCurrency = tripCheck.rows[0].currency;

    // Get all members
    const membersResult = await query(
      'SELECT id, name, email FROM trip_members WHERE trip_id = $1',
      [tripId]
    );

    // Get all expenses with paid_by
    const expensesResult = await query(
      `SELECT e.id, e.paid_by, e.amount, e.title,
              ep.member_id, ep.share_amount, ep.is_settled
       FROM expenses e
       JOIN expense_participants ep ON e.id = ep.expense_id
       WHERE e.trip_id = $1`,
      [tripId]
    );

    // Build balance map
    const balances = {};
    for (const member of membersResult.rows) {
      balances[member.id] = {
        id: member.id,
        name: member.name,
        email: member.email,
        paid: 0,       // total amount this member paid
        owed: 0,       // total amount this member owes
        net: 0,        // positive = owed money, negative = owes money
      };
    }

    // Calculate paid amounts (from expenses)
    const paidByMember = {};
    for (const row of expensesResult.rows) {
      if (!paidByMember[row.paid_by]) paidByMember[row.paid_by] = 0;
      paidByMember[row.paid_by] = row.amount; // set once per expense (will be overwritten but ok for grouping)
    }

    // Better: aggregate paid per member
    const paidAgg = await query(
      `SELECT paid_by, SUM(amount) AS total_paid
       FROM expenses WHERE trip_id = $1
       GROUP BY paid_by`,
      [tripId]
    );

    for (const row of paidAgg.rows) {
      if (balances[row.paid_by]) {
        balances[row.paid_by].paid = parseFloat(row.total_paid);
      }
    }

    // Aggregate owed per member (from expense_participants)
    const owedAgg = await query(
      `SELECT ep.member_id, SUM(ep.share_amount) AS total_owed
       FROM expense_participants ep
       JOIN expenses e ON ep.expense_id = e.id
       WHERE e.trip_id = $1 AND ep.is_settled = FALSE
       GROUP BY ep.member_id`,
      [tripId]
    );

    for (const row of owedAgg.rows) {
      if (balances[row.member_id]) {
        balances[row.member_id].owed = parseFloat(row.total_owed);
      }
    }

    // Calculate net: what they paid - what they owe
    for (const key of Object.keys(balances)) {
      balances[key].net = parseFloat((balances[key].paid - balances[key].owed).toFixed(2));
    }

    const settlements = calculateSettlements(balances);

    // Summary stats
    const totalExpenses = await query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE trip_id = $1',
      [tripId]
    );

    return NextResponse.json({
      currency: tripCurrency,
      total_expenses: parseFloat(totalExpenses.rows[0].total),
      balances: Object.values(balances),
      settlements,
    });
  } catch (err) {
    console.error('GET expense-balances error:', err);
    return NextResponse.json({ error: 'Failed to calculate balances' }, { status: 500 });
  }
}
