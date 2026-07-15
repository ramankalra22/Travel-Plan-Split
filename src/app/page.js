/**
 * src/app/page.js — Dashboard
 * Shows greeting, stats, and recent trips
 */
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TripCard from '@/components/TripCard';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchTrips();
  }, [status]);

  async function fetchTrips() {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return <DashboardSkeleton />;
  }

  if (!session) return null;

  const upcoming = trips.filter((t) => new Date(t.end_date) >= new Date());
  const past = trips.filter((t) => new Date(t.end_date) < new Date());

  return (
    <div className="hero-gradient" style={{ minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Hero greeting */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
            Welcome back,{' '}
            <span className="gradient-text">{session.user?.name?.split(' ')[0]} ✈️</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem' }}>
            {trips.length === 0
              ? 'Start planning your first adventure!'
              : `You have ${upcoming.length} upcoming trip${upcoming.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {/* Stats row */}
        <div
          className="animate-fade-in-up delay-100"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {[
            { label: 'Total Trips', value: trips.length, icon: '🗺️', color: '#60a5fa' },
            { label: 'Upcoming', value: upcoming.length, icon: '🚀', color: '#a78bfa' },
            { label: 'Completed', value: past.length, icon: '✅', color: '#34d399' },
            { label: 'Destinations', value: trips.reduce((s, t) => s + (parseInt(t.destination_count) || 0), 0), icon: '📍', color: '#fb923c' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div
          className="animate-fade-in-up delay-200"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}
        >
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {upcoming.length > 0 ? 'Upcoming Trips' : 'All Trips'}
          </h2>
          <Link href="/trips/new" className="btn-primary">
            + New Trip
          </Link>
        </div>

        {/* Trip grid */}
        {loading ? (
          <TripGridSkeleton />
        ) : trips.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem',
              }}
            >
              {(upcoming.length > 0 ? upcoming : trips).slice(0, 6).map((trip, i) => (
                <div
                  key={trip.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
            {trips.length > 6 && (
              <div style={{ textAlign: 'center' }}>
                <Link href="/trips" className="btn-secondary">
                  View All Trips →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="glass-card animate-fade-in"
      style={{ padding: '4rem 2rem', textAlign: 'center' }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌍</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        No trips yet
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
        Create your first trip and start planning your adventure!
      </p>
      <Link href="/trips/new" className="btn-primary">
        🚀 Create First Trip
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div className="skeleton" style={{ height: '3rem', width: '50%', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: '1.5rem', width: '30%', marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
      </div>
      <TripGridSkeleton />
    </div>
  );
}

function TripGridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: '220px' }} />
      ))}
    </div>
  );
}
