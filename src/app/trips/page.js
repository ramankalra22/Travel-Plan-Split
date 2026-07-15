'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TripCard from '@/components/TripCard';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'SGD', 'THB'];

export default function TripsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | upcoming | past

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchTrips();
  }, [status]);

  async function fetchTrips() {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      setTrips(data.trips || []);
    } finally {
      setLoading(false);
    }
  }

  const filtered = trips
    .filter((t) => {
      const now = new Date();
      if (filter === 'upcoming') return new Date(t.end_date) >= now;
      if (filter === 'past') return new Date(t.end_date) < now;
      return true;
    })
    .filter((t) =>
      search
        ? t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.description || '').toLowerCase().includes(search.toLowerCase())
        : true
    );

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '2.5rem', width: '40%', marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '220px' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="hero-gradient" style={{ minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div
          className="animate-fade-in-up"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            ✈️ My <span className="gradient-text">Trips</span>
          </h1>
          <Link href="/trips/new" className="btn-primary">
            + New Trip
          </Link>
        </div>

        {/* Search & Filter */}
        <div
          className="animate-fade-in-up delay-100"
          style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
        >
          <input
            className="form-input"
            type="text"
            placeholder="🔍 Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['all', 'upcoming', 'past'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.6rem',
                  border: '1px solid',
                  borderColor: filter === f ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255,255,255,0.1)',
                  background: filter === f ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: filter === f ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {filtered.length} trip{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Trip grid */}
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No trips match your search.</p>
            {trips.length === 0 && (
              <Link href="/trips/new" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                Create your first trip
              </Link>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {filtered.map((trip, i) => (
              <div key={trip.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
