'use client';

import { useState } from 'react';

export default function AIAssistant({ tripContext }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const suggestions = [
    '🍜 Suggest local foods to try',
    '💡 Tips for budget travel',
    '📅 Optimize our itinerary',
    '💰 Fair expense splitting tips',
    '🎯 Must-see attractions',
  ];

  async function handleAsk(customPrompt) {
    const q = customPrompt || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setError('');

    const userEntry = { role: 'user', content: q };
    setHistory((prev) => [...prev, userEntry]);
    setPrompt('');

    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, tripContext }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      setHistory((prev) => [...prev, { role: 'assistant', content: data.suggestion }]);
    } catch (err) {
      setError(err.message);
      setHistory((prev) => prev.slice(0, -1)); // remove user entry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Quick suggestion chips */}
      {history.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleAsk(s)}
              disabled={loading}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '99px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#93c5fd',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: 500,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation history */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '0.25rem',
        }}
      >
        {history.map((entry, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: entry.role === 'user'
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${entry.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.07)'}`,
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: entry.role === 'user' ? '#c4b5fd' : '#e2e8f0',
              whiteSpace: 'pre-wrap',
            }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>
              {entry.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
            </span>
            {entry.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.25rem' }}>
              🤖 AI Assistant
            </span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    animation: 'pulse 1.2s ease-in-out infinite',
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.6rem 0.85rem', borderRadius: '0.6rem', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.25)' }}>
          ❌ {error}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          className="form-input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about your trip, activities, expenses..."
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleAsk()}
          disabled={loading}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !prompt.trim()}
          className="btn-primary"
          style={{ padding: '0.6rem 1rem', flexShrink: 0 }}
        >
          {loading ? '⏳' : '→'}
        </button>
      </div>

      {history.length > 0 && (
        <button
          onClick={() => setHistory([])}
          style={{
            alignSelf: 'flex-end',
            padding: '0.25rem 0.6rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.35)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Clear conversation
        </button>
      )}
    </div>
  );
}
