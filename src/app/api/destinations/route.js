/**
 * src/app/api/destinations/route.js
 * GET  /api/destinations?tripId=xxx - List destinations for a trip
 * POST /api/destinations             - Create a new destination
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
      return NextResponse.json({ error: 'tripId query parameter is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT d.*
       FROM destinations d
       JOIN trips t ON d.trip_id = t.id
       WHERE d.trip_id = $1
         AND (t.created_by = $2 OR EXISTS (
           SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = $2
         ))
       ORDER BY d.arrival_date ASC NULLS LAST, d.created_at ASC`,
      [tripId, session.user.id]
    );

    return NextResponse.json({ destinations: result.rows });
  } catch (err) {
    console.error('GET destinations error:', err);
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { trip_id, name, country, city, latitude, longitude, arrival_date, departure_date, notes } = body;

    if (!trip_id || !name) {
      return NextResponse.json({ error: 'trip_id and name are required' }, { status: 400 });
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
      `INSERT INTO destinations (trip_id, name, country, city, latitude, longitude, arrival_date, departure_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [trip_id, name.trim(), country || null, city || null,
       latitude || null, longitude || null,
       arrival_date || null, departure_date || null, notes || null]
    );

    return NextResponse.json({ destination: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST destinations error:', err);
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
  }
}
