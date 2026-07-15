/**
 * src/app/api/trips/route.js
 * GET /api/trips  - List all trips for the authenticated user
 * POST /api/trips - Create a new trip
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return trips where user is a member or creator
    const result = await query(
      `SELECT t.id, t.title, t.description, t.start_date, t.end_date,
              t.cover_image, t.currency, t.created_at,
              u.name AS created_by_name,
              COUNT(DISTINCT tm.id) AS member_count,
              COUNT(DISTINCT d.id) AS destination_count
       FROM trips t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN trip_members tm ON t.id = tm.trip_id
       LEFT JOIN destinations d ON t.id = d.trip_id
       WHERE t.created_by = $1
          OR EXISTS (
            SELECT 1 FROM trip_members tm2
            WHERE tm2.trip_id = t.id AND tm2.user_id = $1
          )
       GROUP BY t.id, u.name
       ORDER BY t.created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({ trips: result.rows });
  } catch (err) {
    console.error('GET /api/trips error:', err);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, start_date, end_date, currency = 'USD', cover_image } = body;

    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Title, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    if (new Date(end_date) < new Date(start_date)) {
      return NextResponse.json(
        { error: 'end_date must be on or after start_date' },
        { status: 400 }
      );
    }

    // Create the trip
    const tripResult = await query(
      `INSERT INTO trips (title, description, start_date, end_date, currency, cover_image, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description || null, start_date, end_date, currency, cover_image || null, session.user.id]
    );

    const trip = tripResult.rows[0];

    // Auto-add creator as owner member
    await query(
      `INSERT INTO trip_members (trip_id, user_id, name, email, role)
       VALUES ($1, $2, $3, $4, 'owner')`,
      [trip.id, session.user.id, session.user.name, session.user.email]
    );

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error('POST /api/trips error:', err);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
