'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (session?.user) {
      setForm((prev) => ({ ...prev, name: session.user.name || '' }));
    }
  }, [status, session]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword && form.newPassword !== form.confirm) {
      setError('New passwords do not match');
      return;
    }

    if (form.newPassword && form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('Profile updated successfully!');
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirm: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '200px' }} />
      </div>
    );
  }

  return (
    <div className="hero-gradient" style={{ minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '540px', paddingTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
          👤 My <span className="gradient-text">Profile</span>
        </h1>

        {/* Profile card */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>{session?.user?.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{session?.user?.email}</p>
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`badge ${session?.user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                {session?.user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Edit Profile</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Display name</label>
              <input
                className="form-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="divider" />

            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: '-0.5rem 0' }}>
              Leave password fields blank to keep current password
            </p>

            <div>
              <label className="form-label">Current password</label>
              <input
                className="form-input"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Required to change password"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">New password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Min. 8 chars"
                />
              </div>
              <div>
                <label className="form-label">Confirm new password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat"
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.875rem' }}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: '0.875rem' }}>
                ✅ {success}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.85rem' }}>
              {loading ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
