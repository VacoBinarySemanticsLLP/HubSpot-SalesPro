import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import ResolveButton from '../components/ResolveButton';

const prisma = new PrismaClient();
export const revalidate = 0; 

export default async function Dashboard({ searchParams }) {
  // 👉 1. THE FIX: Await the searchParams promise (Next.js 15+ requirement)
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab || 'active';

  // 2. Build the database query dynamically based on the tab
  let whereFilter = { status: 'Open' }; 
  
  if (currentTab === 'priority') {
    whereFilter = { status: 'Open', priority: 'HIGH' };
  } else if (currentTab === 'resolved') {
    whereFilter = { status: { not: 'Open' } }; // Anything closed or resolved
  }

  // 3. Fetch the correctly filtered tickets
  let tickets = await prisma.equipmentTicket.findMany({
    where: whereFilter,
    orderBy: { createdAt: 'desc' },
  });

  // SQLite edge-case fix: Ensure priority filtering is completely case-insensitive
  if (currentTab === 'priority') {
    tickets = tickets.filter(t => t.priority?.toUpperCase() === 'HIGH');
  }

  // 4. Dynamic Empty States based on the active tab
  const getEmptyState = () => {
    if (currentTab === 'priority') return { emoji: "🔥", title: "No fires to put out!", desc: "There are no high-priority tasks in the queue." };
    if (currentTab === 'resolved') return { emoji: "✅", title: "No resolved cases yet.", desc: "Completed repairs will show up here for your audit log." };
    return { emoji: "🏸", title: "Queue is clear!", desc: "No pending repair tickets. New escalations will automatically appear here." };
  };

  const emptyState = getEmptyState();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-20">
      
      {/* Global Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner">
            S
          </div>
          <span className="text-xl font-bold tracking-wide">SmashOps<span className="text-indigo-400 font-medium">.pro</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300 hidden md:block">Technician Dashboard</span>
          <div className="h-9 w-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold shadow-sm">
            PN
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Repair Queue</h1>
              <p className="text-slate-500 text-sm mt-1">Real-time escalation sync from CRM.</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                {currentTab !== 'resolved' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTab === 'resolved' ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {tickets.length} {currentTab === 'resolved' ? 'Archived' : 'Active'} {tickets.length === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
          </div>

          {/* SaaS Tabs */}
          <div className="flex space-x-6 border-b border-slate-200 text-sm font-medium text-slate-500">
            <Link 
              href="?tab=active" 
              className={`pb-3 border-b-2 transition-colors ${currentTab === 'active' ? 'border-indigo-500 text-indigo-600 font-semibold' : 'border-transparent hover:text-slate-700'}`}
            >
              Active Queue
            </Link>
            <Link 
              href="?tab=priority" 
              className={`pb-3 border-b-2 transition-colors ${currentTab === 'priority' ? 'border-red-500 text-red-600 font-semibold' : 'border-transparent hover:text-slate-700'}`}
            >
              High Priority
            </Link>
            <Link 
              href="?tab=resolved" 
              className={`pb-3 border-b-2 transition-colors ${currentTab === 'resolved' ? 'border-emerald-500 text-emerald-600 font-semibold' : 'border-transparent hover:text-slate-700'}`}
            >
              Resolved History
            </Link>
          </div>
        </header>

        {/* Dynamic Empty State */}
        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border border-slate-200 border-dashed rounded-2xl">
            <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">{emptyState.emoji}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{emptyState.title}</h3>
            <p className="text-slate-500 text-center text-sm max-w-sm">{emptyState.desc}</p>
          </div>
        )}

        {/* Dynamic Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => {
            const isHighPriority = ticket.priority?.toUpperCase() === 'HIGH';
            const partsList = ticket.requiredParts ? ticket.requiredParts.split(';') : [];
            const isWarrantyActive = ticket.warrantyStatus?.toLowerCase() === 'active';

            return (
              <div 
                key={ticket.id}
                id={`ticket-card-${ticket.id}`} // <-- ADD THIS ID
                className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden border ${isHighPriority ? 'border-red-200' : 'border-slate-200'}`}
              >
                {/* Priority Top Border */}
                <div className={`h-1 w-full absolute top-0 left-0 ${isHighPriority ? 'bg-red-500' : 'bg-slate-200 group-hover:bg-indigo-400'} transition-colors`}></div>

                <div className="p-6 flex flex-col flex-grow">
                  {/* Top Row: ID & Date */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      SYS-{ticket.id.toString().padStart(4, '0')}
                    </span>
                    {ticket.targetCompletionDate && currentTab !== 'resolved' && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${isHighPriority ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                        Due: {ticket.targetCompletionDate}
                      </span>
                    )}
                  </div>

                  {/* Main Title & Issue */}
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 leading-tight mb-2">
                      {ticket.ticketName || 'Unnamed Ticket'}
                    </h2>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                      {currentTab !== 'resolved' && (
                         <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
                      )}
                      {ticket.equipmentIssue}
                    </div>
                  </div>

                  {/* Technician Specs Grid */}
                  <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-3 mb-4 border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Tension</p>
                      <p className="text-sm font-semibold text-slate-700">{ticket.stringTension ? `${ticket.stringTension} lbs` : '--'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Warranty</p>
                      <p className={`text-sm font-semibold ${isWarrantyActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {ticket.warrantyStatus || '--'}
                      </p>
                    </div>
                  </div>

                  {/* Inventory Tags */}
                  {partsList.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Required Parts</p>
                      <div className="flex flex-wrap gap-1.5">
                        {partsList.map((part, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                            {part.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-grow"></div>
                </div>

                {/* Footer Action Area */}
                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200">
                      {ticket.customerName !== 'Unassigned' ? ticket.customerName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Customer</span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{ticket.customerName}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    {currentTab === 'resolved' ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                        Resolved
                      </span>
                    ) : (
                      <ResolveButton ticketId={ticket.id} hubspotId={ticket.hubspotTicketId} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}