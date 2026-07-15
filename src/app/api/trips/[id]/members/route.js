/**
 * src/app/api/trips/[id]/members/route.js
 * GET    /api/trips/[id]/members - List trip members
 * POST   /api/trips/[id]/members - Add a member to the trip
 * DELETE /api/trips/[id]/members?memberId=xxx - Remove a member
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify user has access to this trip
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND (
        created_by = $2 OR EXISTS (
          SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2
        )
      )`,
      [id, session.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    const result = await query(
      `SELECT tm.*, u.avatar_url
       FROM trip_members tm
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE tm.trip_id = $1
       ORDER BY tm.role DESC, tm.joined_at ASC`,
      [id]
    );

    return NextResponse.json({ members: result.rows });
  } catch (err) {
    console.error('GET members error:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, email, role = 'member' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Member name is required' }, { status: 400 });
    }

    // Only trip owners/admins can add members
    const accessCheck = await query(
      `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    const isCreator = await query('SELECT id FROM trips WHERE id = $1 AND created_by = $2', [id, session.user.id]);

    if (accessCheck.rows.length === 0 && isCreator.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const memberRole = accessCheck.rows[0];
    if (memberRole && memberRole.role === 'member' && isCreator.rows.length === 0) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    // Check if email already added
    if (email) {
      const existing = await query(
        'SELECT id FROM trip_members WHERE trip_id = $1 AND email = $2',
        [id, email.toLowerCase()]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Member with this email already added' }, { status: 409 });
      }
    }

    // Try to link to registered user if email matches
    let userId = null;
    if (email) {
      const userResult = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userResult.rows.length > 0) userId = userResult.rows[0].id;
    }

    const result = await query(
      `INSERT INTO trip_members (trip_id, user_id, name, email, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId, name.trim(), email ? email.toLowerCase() : null, role]
    );

    return NextResponse.json({ member: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST members error:', err);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'memberId query parameter required' }, { status: 400 });
    }

    // Check member ownership or trip admin
    const isCreator = await query('SELECT id FROM trips WHERE id = $1 AND created_by = $2', [id, session.user.id]);
    if (isCreator.rows.length === 0) {
      return NextResponse.json({ error: 'Only trip creator can remove members' }, { status: 403 });
    }

    await query('DELETE FROM trip_members WHERE id = $1 AND trip_id = $2', [memberId, id]);
    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('DELETE member error:', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
