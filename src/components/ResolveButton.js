'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { resolveTicketAction } from '@/app/actions';

export default function ResolveButton({ ticketId, hubspotId }) {
  const [isResolving, setIsResolving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Used for trigger-less React animation
  const router = useRouter();

  const handleResolve = async () => {
    setIsResolving(true);

    const premiumToastStyle = {
      style: {
        background: '#0f172a',
        color: '#f8fafc',
        fontWeight: '600',
        fontSize: '14px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #334155',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#0f172a',
      },
    };

    const toastId = toast.loading('Closing ticket...', premiumToastStyle);

    try {
      // Calling the NEW Server Action instead of the API route
      const result = await resolveTicketAction(ticketId, hubspotId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update database');
      }

      toast.success(`Task SYS-${ticketId.toString().padStart(4, '0')} resolved!`, {
        id: toastId,
        duration: 4000,
        ...premiumToastStyle
      });

      // Trigger the "React way" animation
      setIsSuccess(true);

      // Wait for animation, then refresh server components
      setTimeout(() => {
        router.refresh();
      }, 500);

    } catch (error) {
      console.error(error);
      toast.error('Failed to resolve task. Try again.', { id: toastId, ...premiumToastStyle });
      setIsResolving(false);
    }
  };

  return (
    <div className={`transition-all duration-500 ${isSuccess ? 'opacity-0 scale-95 translate-y-4 pointer-events-none' : 'opacity-100'}`}>
      <button
        onClick={handleResolve}
        disabled={isResolving}
        className={`inline-flex items-center justify-center px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-all duration-200 rounded-lg shadow-sm ${isResolving
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
    </div>
  );
}