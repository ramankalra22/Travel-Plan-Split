/**
 * src/app/api/profile/route.js
 * PUT /api/profile - Update user name and/or password
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      }

      const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [session.user.id]);
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await query(
        'UPDATE users SET name = $1, password_hash = $2, updated_at = NOW() WHERE id = $3',
        [name.trim(), newHash, session.user.id]
      );
    } else {
      await query(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
        [name.trim(), session.user.id]
      );
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
