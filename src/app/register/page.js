'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto-login after registration
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
    if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#10b981', width: '75%' };
    return { label: 'Strong', color: '#06b6d4', width: '100%' };
  })();

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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✈️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Create account
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join TravelSplit and start planning
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label className="form-label">Full name</label>
              <input
                id="name"
                className="form-input"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="form-label">Email address</label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
              />
              {passwordStrength && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '99px',
                        background: passwordStrength.color,
                        width: passwordStrength.width,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: passwordStrength.color }}>
                    {passwordStrength.label} password
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Confirm password</label>
              <input
                id="confirm-password"
                className="form-input"
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter password"
                style={{
                  borderColor:
                    form.confirm && form.confirm !== form.password
                      ? 'rgba(239, 68, 68, 0.5)'
                      : undefined,
                }}
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
              id="register-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.25rem' }}
            >
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
