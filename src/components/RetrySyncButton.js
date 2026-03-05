'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { retrySyncAction } from '@/app/actions';

export default function RetrySyncButton({ ticketId, hubspotId }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  const handleRetry = async () => {
    setIsRetrying(true);
    
    // ✨ Premium Dark-Mode SaaS Styling
    const premiumStyle = {
      style: {
        background: '#0f172a', 
        color: '#f8fafc',      
        fontWeight: '600',
        fontSize: '13px',
        padding: '14px 18px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #334155',
        maxWidth: '350px', // Prevents it from getting too wide
        lineHeight: '1.4'
      }
    };

    const toastId = toast.loading('Retrying sync to HubSpot...', premiumStyle);

    try {
      const result = await retrySyncAction(ticketId, hubspotId);

      // 🛑 Gracefully handle failure WITHOUT throwing a Javascript Error!
      if (!result.success) {
        toast.error(result.error ? result.error.split('.')[0] : 'Retry failed', { 
          id: toastId,
          style: premiumStyle.style,
          iconTheme: { primary: '#f59e0b', secondary: '#0f172a' } // Amber icon
        });
        setIsRetrying(false);
        return; // Stop execution here
      }

      // ✅ Handle Success
      toast.success(`Task SYS-${ticketId.toString().padStart(4, '0')} synced!`, { 
        id: toastId,
        style: premiumStyle.style,
        iconTheme: { primary: '#10b981', secondary: '#0f172a' } // Emerald icon
      });
      
      router.refresh();
      
    } catch (error) {
      toast.error('Network connection failed.', { 
        id: toastId,
        style: premiumStyle.style,
        iconTheme: { primary: '#ef4444', secondary: '#0f172a' } // Red icon
      });
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className={`inline-flex items-center justify-center text-xs font-bold px-4 py-2 rounded-lg border shadow-sm transition-all ${
        isRetrying 
          ? 'bg-amber-100 text-amber-500 border-amber-200 cursor-not-allowed' 
          : 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100 hover:shadow-md active:scale-95'
      }`}
    >
      {isRetrying ? (
        <>
          <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Syncing...
        </>
      ) : (
        'Retry Sync'
      )}
    </button>
  );
}