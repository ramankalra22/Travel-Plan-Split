'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = session
    ? [
        { href: '/', label: '🗺️ Dashboard' },
        { href: '/trips', label: '✈️ My Trips' },
        { href: '/profile', label: '👤 Profile' },
      ]
    : [];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🌍</span>
          <span
            className="gradient-text"
            style={{
              fontFamily: 'var(--font-outfit)',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
            }}
          >
            TravelSplit
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: pathname === link.href ? '#93c5fd' : 'rgba(255,255,255,0.65)',
                background: pathname === link.href ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}

          {status === 'loading' ? null : session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '2rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {session.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  {session.user?.name?.split(' ')[0]}
                </span>
                {session.user?.role === 'admin' && (
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                    admin
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link href="/login" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
