/**
 * src/app/api/expenses/route.js
 * GET  /api/expenses?tripId=xxx - List expenses for a trip
 * POST /api/expenses             - Create an expense with participants
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, getClient } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    // Verify trip access
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND (
        created_by = $2 OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2)
      )`,
      [tripId, session.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    const expensesResult = await query(
      `SELECT e.*,
              tm.name AS paid_by_name,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', ep.id,
                  'member_id', ep.member_id,
                  'member_name', ptm.name,
                  'share_amount', ep.share_amount,
                  'share_percent', ep.share_percent,
                  'is_settled', ep.is_settled
                ) ORDER BY ptm.name
              ) FILTER (WHERE ep.id IS NOT NULL) AS participants
       FROM expenses e
       LEFT JOIN trip_members tm ON e.paid_by = tm.id
       LEFT JOIN expense_participants ep ON e.id = ep.expense_id
       LEFT JOIN trip_members ptm ON ep.member_id = ptm.id
       WHERE e.trip_id = $1
       GROUP BY e.id, tm.name
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      [tripId]
    );

    return NextResponse.json({ expenses: expensesResult.rows });
  } catch (err) {
    console.error('GET expenses error:', err);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await getClient();
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      trip_id, paid_by, title, description, amount, currency = 'USD',
      category = 'general', expense_date, split_type = 'equal', participants
    } = body;

    // Validation
    if (!trip_id || !paid_by || !title || !amount) {
      return NextResponse.json(
        { error: 'trip_id, paid_by, title, and amount are required' },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ error: 'At least one participant is required' }, { status: 400 });
    }

    // Verify trip access
    const tripCheck = await query(
      `SELECT currency FROM trips WHERE id = $1 AND (
        created_by = $2 OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2)
      )`,
      [trip_id, session.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    // Calculate shares
    const totalAmount = parseFloat(amount);
    let shares = [];

    if (split_type === 'equal') {
      const share = parseFloat((totalAmount / participants.length).toFixed(2));
      // Handle rounding: give the remainder to first participant
      const remainder = parseFloat((totalAmount - share * participants.length).toFixed(2));
      shares = participants.map((memberId, idx) => ({
        memberId,
        shareAmount: idx === 0 ? share + remainder : share,
        sharePercent: parseFloat((100 / participants.length).toFixed(2)),
      }));
    } else if (split_type === 'exact') {
      // participants should be array of { memberId, amount }
      const totalShares = participants.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      if (Math.abs(totalShares - totalAmount) > 0.01) {
        return NextResponse.json({ error: 'Exact shares must sum to total amount' }, { status: 400 });
      }
      shares = participants.map((p) => ({
        memberId: p.memberId,
        shareAmount: parseFloat(p.amount),
        sharePercent: parseFloat(((p.amount / totalAmount) * 100).toFixed(2)),
      }));
    } else if (split_type === 'percentage') {
      // participants should be array of { memberId, percent }
      const totalPercent = participants.reduce((sum, p) => sum + parseFloat(p.percent || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        return NextResponse.json({ error: 'Percentages must sum to 100' }, { status: 400 });
      }
      shares = participants.map((p) => ({
        memberId: p.memberId,
        shareAmount: parseFloat(((p.percent / 100) * totalAmount).toFixed(2)),
        sharePercent: parseFloat(p.percent),
      }));
    }

    // Transaction: insert expense + participants
    await client.query('BEGIN');

    const expenseResult = await client.query(
      `INSERT INTO expenses (trip_id, paid_by, title, description, amount, currency, category, expense_date, split_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [trip_id, paid_by, title.trim(), description || null, totalAmount,
       currency, category, expense_date || new Date().toISOString().split('T')[0], split_type]
    );

    const expense = expenseResult.rows[0];

    // Insert participants
    for (const share of shares) {
      await client.query(
        `INSERT INTO expense_participants (expense_id, member_id, share_amount, share_percent)
         VALUES ($1, $2, $3, $4)`,
        [expense.id, share.memberId, share.shareAmount, share.sharePercent]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('POST expenses error:', err);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  } finally {
    client.release();
  }
}
