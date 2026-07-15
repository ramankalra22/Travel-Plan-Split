'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ExpenseForm from '@/components/ExpenseForm';
import BalanceView from '@/components/BalanceView';
import AIAssistant from '@/components/AIAssistant';

const ACTIVITY_STATUS_COLORS = {
  planned: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  confirmed: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  completed: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

const EXPENSE_CATEGORY_EMOJI = {
  food: '🍽️', transport: '🚗', accommodation: '🏨',
  activity: '🎯', shopping: '🛍️', general: '💰', other: '📦',
};

export default function TripDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const tripId = params.id;

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddDest, setShowAddDest] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'member' });
  const [destForm, setDestForm] = useState({ name: '', country: '', city: '', arrival_date: '', departure_date: '' });
  const [activityForm, setActivityForm] = useState({ title: '', activity_date: '', location: '', status: 'planned', cost: '' });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && tripId) {
      fetchTrip();
      fetchExpenses();
    }
  }, [status, tripId]);

  async function fetchTrip() {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) { router.push('/trips'); return; }
      const data = await res.json();
      setTrip(data.trip);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpenses() {
    try {
      const res = await fetch(`/api/expenses?tripId=${tripId}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch {}
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function addMember(e) {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrip((prev) => ({ ...prev, members: [...(prev.members || []), data.member] }));
      setMemberForm({ name: '', email: '', role: 'member' });
      setShowAddMember(false);
      showToast('Member added!');
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function addDestination(e) {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...destForm, trip_id: tripId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrip((prev) => ({ ...prev, destinations: [...(prev.destinations || []), data.destination] }));
      setDestForm({ name: '', country: '', city: '', arrival_date: '', departure_date: '' });
      setShowAddDest(false);
      showToast('Destination added!');
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function addActivity(e) {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activityForm, trip_id: tripId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrip((prev) => ({ ...prev, activities: [...(prev.activities || []), data.activity] }));
      setActivityForm({ title: '', activity_date: '', location: '', status: 'planned', cost: '' });
      setShowAddActivity(false);
      showToast('Activity added!');
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function removeMember(memberId) {
    if (!confirm('Remove this member?')) return;
    await fetch(`/api/trips/${tripId}/members?memberId=${memberId}`, { method: 'DELETE' });
    setTrip((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== memberId) }));
    showToast('Member removed');
  }

  function handleExpenseSuccess(expense) {
    fetchExpenses(); // Refresh expense list
    setShowExpenseForm(false);
    showToast('Expense added! Balances updated.');
  }

  if (loading || !trip) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '200px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '40px', width: '100px' }} />)}
        </div>
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'itinerary', label: '📍 Itinerary' },
    { id: 'expenses', label: `💰 Expenses (${expenses.length})` },
    { id: 'balances', label: '⚖️ Balances' },
    { id: 'ai', label: '🤖 AI Assistant' },
  ];

  const tripContext = {
    title: trip.title,
    start_date: trip.start_date,
    end_date: trip.end_date,
    destinations: trip.destinations?.map((d) => d.name) || [],
    memberCount: trip.members?.length || 1,
    currency: trip.currency,
  };

  return (
    <div className="hero-gradient" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Hero */}
      <div
        style={{
          height: '220px',
          background: trip.cover_image
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(10,10,15,1)), url(${trip.cover_image}) center/cover`
            : 'linear-gradient(135deg, #1e3a5f 0%, #3b1a5f 50%, #1a3a2f 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <Link href="/trips" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← My Trips
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '0.25rem' }}>
            {trip.title}
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              📅 {new Date(trip.start_date).toLocaleDateString()} → {new Date(trip.end_date).toLocaleDateString()}
            </span>
            <span className="badge badge-blue">{trip.currency}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              👥 {trip.members?.length || 0} members
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '1.5rem',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Members */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>👥 Members</h2>
                <button onClick={() => { setShowAddMember(true); setFormError(''); }} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                  + Add
                </button>
              </div>

              {showAddMember && (
                <form onSubmit={addMember} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <input className="form-input" placeholder="Name *" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} required />
                  <input className="form-input" type="email" placeholder="Email (optional)" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} />
                  <select className="form-input" value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}>
                    <option value="member" style={{ background: '#1a1a2e' }}>Member</option>
                    <option value="admin" style={{ background: '#1a1a2e' }}>Admin</option>
                  </select>
                  {formError && <p style={{ color: '#fca5a5', fontSize: '0.8rem' }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Add</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowAddMember(false)} style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(trip.members || []).map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {m.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      {m.email && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>}
                    </div>
                    <span className={`badge ${m.role === 'owner' ? 'badge-purple' : m.role === 'admin' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>{m.role}</span>
                    {m.role !== 'owner' && trip.created_by === session?.user?.id && (
                      <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trip info */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>ℹ️ Trip Details</h2>
              {trip.description && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{trip.description}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { label: 'Duration', value: `${Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000) + 1} days` },
                  { label: 'Destinations', value: trip.destinations?.length || 0 },
                  { label: 'Activities', value: trip.activities?.length || 0 },
                  { label: 'Currency', value: trip.currency },
                  { label: 'Created by', value: trip.created_by_name },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── ITINERARY TAB ─── */}
        {activeTab === 'itinerary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Destinations */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📍 Destinations</h2>
                <button onClick={() => { setShowAddDest(true); setFormError(''); }} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>+ Add</button>
              </div>

              {showAddDest && (
                <form onSubmit={addDestination} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <input className="form-input" placeholder="Destination name *" value={destForm.name} onChange={e => setDestForm({ ...destForm, name: e.target.value })} required />
                    <input className="form-input" placeholder="Country" value={destForm.country} onChange={e => setDestForm({ ...destForm, country: e.target.value })} />
                    <input className="form-input" placeholder="City" value={destForm.city} onChange={e => setDestForm({ ...destForm, city: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input className="form-input" type="date" placeholder="Arrival" value={destForm.arrival_date} onChange={e => setDestForm({ ...destForm, arrival_date: e.target.value })} />
                    <input className="form-input" type="date" placeholder="Departure" value={destForm.departure_date} onChange={e => setDestForm({ ...destForm, departure_date: e.target.value })} />
                  </div>
                  {formError && <p style={{ color: '#fca5a5', fontSize: '0.8rem' }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Add Destination</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowAddDest(false)} style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
                  </div>
                </form>
              )}

              {trip.destinations?.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1.5rem' }}>No destinations yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {trip.destinations?.map((d) => (
                    <div key={d.id} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>📍 {d.name}</div>
                      {d.city && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{d.city}{d.country ? `, ${d.country}` : ''}</div>}
                      {d.arrival_date && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Arrive: {new Date(d.arrival_date).toLocaleDateString()}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activities */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🎯 Activities</h2>
                <button onClick={() => { setShowAddActivity(true); setFormError(''); }} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>+ Add</button>
              </div>

              {showAddActivity && (
                <form onSubmit={addActivity} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                    <input className="form-input" placeholder="Activity title *" value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} required />
                    <input className="form-input" type="date" value={activityForm.activity_date} onChange={e => setActivityForm({ ...activityForm, activity_date: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                    <input className="form-input" placeholder="Location" value={activityForm.location} onChange={e => setActivityForm({ ...activityForm, location: e.target.value })} />
                    <input className="form-input" type="number" step="0.01" min="0" placeholder="Cost" value={activityForm.cost} onChange={e => setActivityForm({ ...activityForm, cost: e.target.value })} />
                    <select className="form-input" value={activityForm.status} onChange={e => setActivityForm({ ...activityForm, status: e.target.value })}>
                      {['planned', 'confirmed', 'completed', 'cancelled'].map(s => <option key={s} value={s} style={{ background: '#1a1a2e' }}>{s}</option>)}
                    </select>
                  </div>
                  {formError && <p style={{ color: '#fca5a5', fontSize: '0.8rem' }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Add Activity</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowAddActivity(false)} style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
                  </div>
                </form>
              )}

              {trip.activities?.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1.5rem' }}>No activities yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {trip.activities?.map((a) => {
                    const sc = ACTIVITY_STATUS_COLORS[a.status] || ACTIVITY_STATUS_COLORS.planned;
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div>
                          {a.location && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>📍 {a.location}</div>}
                          {a.activity_date && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{new Date(a.activity_date).toLocaleDateString()}</div>}
                        </div>
                        {a.cost > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa' }}>{trip.currency} {parseFloat(a.cost).toFixed(2)}</span>}
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{a.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── EXPENSES TAB ─── */}
        {activeTab === 'expenses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="btn-primary">
                {showExpenseForm ? '✕ Cancel' : '+ Add Expense'}
              </button>
            </div>

            {showExpenseForm && (
              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>💰 New Expense</h3>
                <ExpenseForm
                  tripId={tripId}
                  members={trip.members || []}
                  onSuccess={handleExpenseSuccess}
                  onCancel={() => setShowExpenseForm(false)}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expenses.length === 0 ? (
                <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💸</div>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No expenses yet. Add your first one!</p>
                </div>
              ) : (
                expenses.map((exp) => (
                  <div key={exp.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{EXPENSE_CATEGORY_EMOJI[exp.category] || '💰'}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.title}</span>
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{exp.category}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                          Paid by <strong style={{ color: '#93c5fd' }}>{exp.paid_by_name}</strong>
                          {' · '}
                          {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : ''}
                          {' · '}
                          Split: {exp.split_type}
                        </div>
                        {/* Participants */}
                        {exp.participants && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {exp.participants.map((p) => (
                              <span key={p.id} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {p.member_name}: {exp.currency} {parseFloat(p.share_amount).toFixed(2)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                          {exp.currency} {parseFloat(exp.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── BALANCES TAB ─── */}
        {activeTab === 'balances' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              ⚖️ Expense Balances & Settlements
            </h2>
            <BalanceView tripId={tripId} currency={trip.currency} />
          </div>
        )}

        {/* ─── AI ASSISTANT TAB ─── */}
        {activeTab === 'ai' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🤖 AI Travel Assistant</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Powered by GPT-4o-mini. Ask anything about your trip!
              </p>
            </div>
            <AIAssistant tripContext={tripContext} />
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}
