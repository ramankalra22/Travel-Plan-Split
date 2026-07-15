'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="hero-gradient"
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌍</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            Sign in to your TravelSplit account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Email address</label>
              <input
                id="email"
                className="form-input"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

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

            <button
              id="login-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {loading ? '⏳ Signing in...' : '🔑 Sign In'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
