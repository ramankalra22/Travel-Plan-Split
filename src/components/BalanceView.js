'use client';

import { useEffect, useState } from 'react';

export default function BalanceView({ tripId, currency }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchBalances() {
    setLoading(true);
    try {
      const res = await fetch(`/api/expense-balances/${tripId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tripId) fetchBalances();
  }, [tripId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '60px' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.75rem', color: '#fca5a5' }}>
        ❌ {error}
      </div>
    );
  }

  if (!data) return null;

  const cur = currency || data.currency || 'USD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Total summary */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Total Trip Expenses</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#93c5fd' }}>
          {cur} {parseFloat(data.total_expenses || 0).toFixed(2)}
        </span>
      </div>

      {/* Member balances */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
          💳 Member Balances
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(data.balances || []).map((member) => {
            const isPositive = member.net > 0.01;
            const isNegative = member.net < -0.01;
            const netAbs = Math.abs(member.net).toFixed(2);

            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  gap: '0.75rem',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isPositive
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : isNegative
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #6b7280, #4b5563)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {member.name?.[0]?.toUpperCase()}
                </div>

                {/* Name & stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    Paid: {cur} {parseFloat(member.paid || 0).toFixed(2)} · Owes: {cur} {parseFloat(member.owed || 0).toFixed(2)}
                  </div>
                </div>

                {/* Net amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isPositive ? (
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.95rem' }}>
                      +{cur} {netAbs}
                    </div>
                  ) : isNegative ? (
                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.95rem' }}>
                      -{cur} {netAbs}
                    </div>
                  ) : (
                    <div style={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.875rem' }}>
                      Settled ✓
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                    {isPositive ? 'is owed' : isNegative ? 'owes' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement transactions */}
      {data.settlements && data.settlements.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
            🔁 Suggested Settlements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.settlements.map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <span style={{ fontWeight: 700, color: '#fca5a5' }}>{s.from}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>→</span>
                <span style={{ fontWeight: 700, color: '#6ee7b7' }}>{s.to}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#fcd34d', fontSize: '1rem' }}>
                  {cur} {s.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.5rem' }}>
            💡 These are the minimum transactions needed to settle all debts.
          </p>
        </div>
      )}

      {data.settlements?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#34d399' }}>
          ✅ All expenses are settled!
        </div>
      )}

      <button
        onClick={fetchBalances}
        className="btn-secondary"
        style={{ alignSelf: 'center', fontSize: '0.85rem', padding: '0.4rem 1rem' }}
      >
        🔄 Refresh Balances
      </button>
    </div>
  );
}
