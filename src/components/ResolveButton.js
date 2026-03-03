'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ResolveButton({ ticketId, hubspotId }) {
  const [isResolving, setIsResolving] = useState(false);
  const router = useRouter();

  const handleResolve = async () => {
    setIsResolving(true);
    
    // ✨ 1. The Premium SaaS Toast Styling
    const premiumToastStyle = {
      style: {
        background: '#0f172a', // deep slate-900
        color: '#f8fafc',      // slate-50
        fontWeight: '600',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #334155', 
      },
      iconTheme: {
        primary: '#10b981', // emerald-500
        secondary: '#0f172a',
      },
    };

    const toastId = toast.loading('Closing ticket...', premiumToastStyle);

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, hubspotId }),
      });

      if (!response.ok) throw new Error('Failed to update database');

      toast.success(`Task SYS-${ticketId.toString().padStart(4, '0')} resolved!`, { 
        id: toastId,
        duration: 4000,
        ...premiumToastStyle 
      });

      // ✨ 2. The Magic "Swoosh" Exit Animation
      const cardElement = document.getElementById(`ticket-card-${ticketId}`);
      if (cardElement) {
        // Force the CSS to animate the card shrinking and fading out
        cardElement.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.95) translateY(15px)';
      }

      // ✨ 3. Wait exactly 400ms for the animation to finish, THEN refresh the server
      setTimeout(() => {
        router.refresh(); 
      }, 400);

    } catch (error) {
      console.error(error);
      toast.error('Failed to resolve task. Try again.', { id: toastId, ...premiumToastStyle });
      setIsResolving(false); 
    }
  };

  return (
    <button
      onClick={handleResolve}
      disabled={isResolving}
      className={`inline-flex items-center justify-center px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-all duration-200 rounded-lg shadow-sm ${
        isResolving
          ? 'bg-indigo-400 cursor-not-allowed opacity-80'
          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-95'
      }`}
    >
      {isResolving ? (
        <>
          <svg className="w-4 h-4 mr-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Closing...
        </>
      ) : (
        'Resolve Task'
      )}
    </button>
  );
}