/**
 * src/app/api/activities/route.js
 * GET  /api/activities?tripId=xxx - List activities
 * POST /api/activities             - Create activity
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT a.*, d.name AS destination_name
       FROM activities a
       LEFT JOIN destinations d ON a.destination_id = d.id
       JOIN trips t ON a.trip_id = t.id
       WHERE a.trip_id = $1
         AND (t.created_by = $2 OR EXISTS (
           SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = $2
         ))
       ORDER BY a.activity_date ASC NULLS LAST, a.start_time ASC`,
      [tripId, session.user.id]
    );

    return NextResponse.json({ activities: result.rows });
  } catch (err) {
    console.error('GET activities error:', err);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      trip_id, destination_id, title, description,
      activity_date, start_time, end_time, location,
      cost = 0, currency = 'USD', booking_ref, status = 'planned'
    } = body;

    if (!trip_id || !title) {
      return NextResponse.json({ error: 'trip_id and title are required' }, { status: 400 });
    }

    // Verify trip access
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND (
        created_by = $2 OR EXISTS (SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2)
      )`,
      [trip_id, session.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or access denied' }, { status: 403 });
    }

    const result = await query(
      `INSERT INTO activities (trip_id, destination_id, title, description, activity_date,
                               start_time, end_time, location, cost, currency, booking_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [trip_id, destination_id || null, title.trim(), description || null,
       activity_date || null, start_time || null, end_time || null,
       location || null, cost, currency, booking_ref || null, status]
    );

    return NextResponse.json({ activity: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST activities error:', err);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
