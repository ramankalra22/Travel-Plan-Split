'use client';

import Link from 'next/link';

const CATEGORY_COLORS = {
  food: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.3)', emoji: '🍽️' },
  transport: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)', emoji: '🚗' },
  accommodation: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)', emoji: '🏨' },
  activity: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', emoji: '🎯' },
  shopping: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)', emoji: '🛍️' },
  general: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)', emoji: '💰' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Completed', color: '#34d399' };
  if (diff === 0) return { label: 'Today!', color: '#fb923c' };
  if (diff <= 7) return { label: `${diff}d left`, color: '#f59e0b' };
  return { label: `${diff} days`, color: '#60a5fa' };
}

export default function TripCard({ trip }) {
  const status = getDaysUntil(trip.end_date);
  const startFormatted = formatDate(trip.start_date);
  const endFormatted = formatDate(trip.end_date);

  // Gradient based on trip id (deterministic)
  const gradients = [
    'linear-gradient(135deg, #1e3a5f 0%, #3b1a5f 100%)',
    'linear-gradient(135deg, #1a3a2f 0%, #1a2f4f 100%)',
    'linear-gradient(135deg, #3f1a1a 0%, #1a1a3f 100%)',
    'linear-gradient(135deg, #2a1a3f 0%, #1a3a3f 100%)',
    'linear-gradient(135deg, #3a2a1a 0%, #1a3a2a 100%)',
  ];
  const gradientIdx = trip.id ? trip.id.charCodeAt(0) % gradients.length : 0;

  return (
    <Link href={`/trips/${trip.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="glass-card"
        style={{
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        {/* Card Header / Cover */}
        <div
          style={{
            height: '120px',
            background: trip.cover_image ? `url(${trip.cover_image}) center/cover` : gradients[gradientIdx],
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0.75rem 1rem',
          }}
        >
          {/* Overlay gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />

          {/* Status badge */}
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '99px',
              background: 'rgba(0,0,0,0.5)',
              color: status.color,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${status.color}40`,
            }}
          >
            {status.label}
          </span>

          <h3
            style={{
              position: 'relative',
              zIndex: 1,
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
            }}
          >
            {trip.title}
          </h3>
        </div>

        {/* Card Body */}
        <div style={{ padding: '1rem' }}>
          {/* Dates */}
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 0.75rem' }}>
            📅 {startFormatted} → {endFormatted}
          </p>

          {/* Description */}
          {trip.description && (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.6)',
                margin: '0 0 0.75rem',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {trip.description}
            </p>
          )}

          {/* Stats footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                👥 {trip.member_count || 0}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                📍 {trip.destination_count || 0}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.4rem',
              }}
            >
              {trip.currency || 'USD'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
