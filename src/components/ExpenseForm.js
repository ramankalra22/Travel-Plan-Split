'use client';

import { useState } from 'react';

const CATEGORIES = ['food', 'transport', 'accommodation', 'activity', 'shopping', 'general', 'other'];

export default function ExpenseForm({ tripId, members, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    category: 'general',
    expense_date: new Date().toISOString().split('T')[0],
    paid_by: members[0]?.id || '',
    split_type: 'equal',
    participants: members.map((m) => m.id),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exactAmounts, setExactAmounts] = useState({});
  const [percentages, setPercentages] = useState({});

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleParticipant(memberId) {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.includes(memberId)
        ? prev.participants.filter((id) => id !== memberId)
        : [...prev.participants, memberId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title || !form.amount || !form.paid_by) {
      setError('Title, amount, and payer are required');
      return;
    }

    if (form.participants.length === 0) {
      setError('Select at least one participant');
      return;
    }

    // Build participants payload based on split type
    let participantsPayload;
    if (form.split_type === 'equal') {
      participantsPayload = form.participants;
    } else if (form.split_type === 'exact') {
      participantsPayload = form.participants.map((id) => ({
        memberId: id,
        amount: parseFloat(exactAmounts[id] || 0),
      }));
      const total = participantsPayload.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(total - parseFloat(form.amount)) > 0.01) {
        setError(`Exact amounts must sum to ${form.amount}. Current sum: ${total.toFixed(2)}`);
        return;
      }
    } else {
      participantsPayload = form.participants.map((id) => ({
        memberId: id,
        percent: parseFloat(percentages[id] || 0),
      }));
      const total = participantsPayload.reduce((s, p) => s + p.percent, 0);
      if (Math.abs(total - 100) > 0.1) {
        setError(`Percentages must sum to 100. Current: ${total.toFixed(1)}%`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          paid_by: form.paid_by,
          title: form.title,
          description: form.description,
          amount: parseFloat(form.amount),
          currency: form.currency,
          category: form.category,
          expense_date: form.expense_date,
          split_type: form.split_type,
          participants: participantsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create expense');

      onSuccess && onSuccess(data.expense);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const eqShare = form.participants.length > 0
    ? (parseFloat(form.amount || 0) / form.participants.length).toFixed(2)
    : '0.00';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Title & Amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Team dinner"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">Amount *</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Category, Date, Currency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: '#1a1a2e' }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Date</label>
          <input
            className="form-input"
            type="date"
            value={form.expense_date}
            onChange={(e) => update('expense_date', e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Currency</label>
          <input
            className="form-input"
            type="text"
            maxLength={5}
            value={form.currency}
            onChange={(e) => update('currency', e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {/* Paid by */}
      <div>
        <label className="form-label">Paid by *</label>
        <select className="form-input" value={form.paid_by} onChange={(e) => update('paid_by', e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id} style={{ background: '#1a1a2e' }}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Split type */}
      <div>
        <label className="form-label">Split Type</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['equal', 'exact', 'percentage'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update('split_type', type)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.6rem',
                border: '1px solid',
                borderColor: form.split_type === type ? 'rgba(99, 102, 241, 0.6)' : 'rgba(255,255,255,0.1)',
                background: form.split_type === type ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                color: form.split_type === type ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {type === 'equal' ? '⚖️' : type === 'exact' ? '💵' : '%'} {type}
            </button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div>
        <label className="form-label">
          Split among ({form.participants.length} selected
          {form.split_type === 'equal' && form.amount ? ` · ${form.currency} ${eqShare} each` : ''})
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {members.map((member) => {
            const selected = form.participants.includes(member.id);
            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.6rem',
                  background: selected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => toggleParticipant(member.id)}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {}}
                  style={{ accentColor: '#6366f1' }}
                />
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{member.name}</span>

                {/* Exact amount input */}
                {selected && form.split_type === 'exact' && (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={exactAmounts[member.id] || ''}
                    onChange={(e) => setExactAmounts((prev) => ({ ...prev, [member.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '90px' }}
                    className="form-input"
                  />
                )}

                {/* Percentage input */}
                {selected && form.split_type === 'percentage' && (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={percentages[member.id] || ''}
                    onChange={(e) => setPercentages((prev) => ({ ...prev, [member.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '70px' }}
                    className="form-input"
                  />
                )}

                {/* Equal share display */}
                {selected && form.split_type === 'equal' && form.amount && (
                  <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>{form.currency} {eqShare}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="form-label">Notes (optional)</label>
        <textarea
          className="form-input"
          rows={2}
          placeholder="Additional details..."
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.6rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.875rem',
          }}
        >
          ❌ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
          {loading ? '⏳ Saving...' : '💰 Add Expense'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
