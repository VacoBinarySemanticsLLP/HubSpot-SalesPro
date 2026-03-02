'use client';

import { useState } from 'react';

export default function ResolveButton({ ticketId, hubspotId }) {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const handleResolve = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, hubspotId }),
      });

      if (!res.ok) throw new Error();
      
      setState('success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  return (
    <button 
      onClick={handleResolve}
      disabled={state !== 'idle'}
      className={`relative inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 border
        ${state === 'idle' ? 'text-slate-400 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50' : ''}
        ${state === 'loading' ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-wait' : ''}
        ${state === 'success' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200' : ''}
        ${state === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}`}
    >
      {state === 'loading' && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {state === 'idle' && 'Resolve'}
      {state === 'loading' && 'Syncing'}
      {state === 'success' && '✓ Done'}
      {state === 'error' && 'Retry'}
    </button>
  );
}