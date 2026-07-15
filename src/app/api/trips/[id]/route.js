/**
 * src/app/api/trips/[id]/route.js
 * GET    /api/trips/[id] - Get trip details
 * PUT    /api/trips/[id] - Update trip
 * DELETE /api/trips/[id] - Delete trip
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

async function verifyTripAccess(tripId, userId, requireAdmin = false) {
  const result = await query(
    `SELECT t.id, t.created_by, tm.role AS member_role
     FROM trips t
     LEFT JOIN trip_members tm ON t.id = tm.trip_id AND tm.user_id = $2
     WHERE t.id = $1`,
    [tripId, userId]
  );

  if (result.rows.length === 0) return { error: 'Trip not found', status: 404 };

  const trip = result.rows[0];
  const isCreator = trip.created_by === userId;
  const isMember = trip.member_role !== null;

  if (!isCreator && !isMember) return { error: 'Access denied', status: 403 };
  if (requireAdmin && !isCreator && trip.member_role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { trip, isCreator };
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const access = await verifyTripAccess(id, session.user.id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    // Get full trip details with members, destinations, activities
    const [tripRes, membersRes, destRes, activitiesRes] = await Promise.all([
      query(
        `SELECT t.*, u.name AS created_by_name
         FROM trips t LEFT JOIN users u ON t.created_by = u.id
         WHERE t.id = $1`,
        [id]
      ),
      query(
        'SELECT * FROM trip_members WHERE trip_id = $1 ORDER BY joined_at ASC',
        [id]
      ),
      query(
        'SELECT * FROM destinations WHERE trip_id = $1 ORDER BY arrival_date ASC NULLS LAST',
        [id]
      ),
      query(
        'SELECT * FROM activities WHERE trip_id = $1 ORDER BY activity_date ASC, start_time ASC',
        [id]
      ),
    ]);

    const trip = tripRes.rows[0];
    trip.members = membersRes.rows;
    trip.destinations = destRes.rows;
    trip.activities = activitiesRes.rows;

    return NextResponse.json({ trip });
  } catch (err) {
    console.error('GET /api/trips/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const access = await verifyTripAccess(id, session.user.id, true);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await request.json();
    const { title, description, start_date, end_date, currency, cover_image } = body;

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return NextResponse.json({ error: 'end_date must be on or after start_date' }, { status: 400 });
    }

    const result = await query(
      `UPDATE trips SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date),
         currency = COALESCE($5, currency),
         cover_image = COALESCE($6, cover_image),
         updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, start_date, end_date, currency, cover_image, id]
    );

    return NextResponse.json({ trip: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/trips/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const access = await verifyTripAccess(id, session.user.id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    if (!access.isCreator && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only the trip creator can delete this trip' }, { status: 403 });
    }

    await query('DELETE FROM trips WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/trips/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
