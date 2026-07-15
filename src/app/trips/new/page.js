'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'SGD', 'THB', 'MXN'];

export default function NewTripPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    currency: 'USD',
    cover_image: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  function update(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title || !form.start_date || !form.end_date) {
      setError('Title, start date and end date are required');
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError('End date must be on or after start date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trip');

      router.push(`/trips/${data.trip.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const dayCount = form.start_date && form.end_date
    ? Math.max(0, Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24))) + 1
    : null;

  return (
    <div
      className="hero-gradient"
      style={{ minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
    >
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '600px', paddingTop: '1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/trips" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Back to trips
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.75rem' }}>
            🗺️ New <span className="gradient-text">Trip</span>
          </h1>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
              <label className="form-label">Trip title *</label>
              <input
                id="trip-title"
                className="form-input"
                type="text"
                required
                placeholder="e.g. Summer Euro Trip 2025"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Describe your trip..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Start date *</label>
                <input
                  id="start-date"
                  className="form-input"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => update('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">End date *</label>
                <input
                  id="end-date"
                  className="form-input"
                  type="date"
                  required
                  value={form.end_date}
                  onChange={(e) => update('end_date', e.target.value)}
                />
              </div>
            </div>

            {dayCount !== null && (
              <div
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#93c5fd',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}
              >
                🗓️ {dayCount} day{dayCount !== 1 ? 's' : ''} trip
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Currency</label>
                <select
                  className="form-input"
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Cover image URL</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://..."
                  value={form.cover_image}
                  onChange={(e) => update('cover_image', e.target.value)}
                />
              </div>
            </div>

            {/* Cover preview */}
            {form.cover_image && (
              <div style={{ borderRadius: '0.75rem', overflow: 'hidden', height: '140px' }}>
                <img
                  src={form.cover_image}
                  alt="Cover preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                }}
              >
                ❌ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '0.85rem' }}>
                {loading ? '⏳ Creating...' : '🚀 Create Trip'}
              </button>
              <Link href="/trips" className="btn-secondary" style={{ flex: 1, padding: '0.85rem', textAlign: 'center' }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
