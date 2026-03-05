'use client'; // This directive tells Next.js this file runs in the browser

import { useRouter, useSearchParams } from 'next/navigation';

export default function IssueFilter({ issueTypes, currentFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (e) => {
    const selectedIssue = e.target.value;
    
    // Create a new URLSearchParams object based on the current URL
    const params = new URLSearchParams(searchParams.toString());

    if (selectedIssue === 'all') {
      params.delete('issue'); // Remove the filter if 'all' is selected
    } else {
      params.set('issue', selectedIssue); // Set the new filter
    }

    // Navigate to the new URL without refreshing the page (Client-side routing)
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative">
      <select 
        className="appearance-none bg-white border border-slate-300 text-slate-700 text-sm font-medium py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all"
        value={currentFilter}
        onChange={handleFilterChange}
      >
        <option value="all">All Issue Types</option>
        {issueTypes.map(type => (
          <option key={type} value={type.replace(/\s+/g, '-')}>{type}</option> 
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
}