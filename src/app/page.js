import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from 'next/link';
import ResolveButton from '../components/ResolveButton';
import IssueFilter from '../components/IssueFilter';
import RetrySyncButton from '../components/RetrySyncButton';

const prisma = new PrismaClient();
export const revalidate = 0;

export default async function Dashboard({ searchParams }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab || 'active';
  const issueFilter = resolvedParams?.issue || 'all';

  let whereFilter = { status: 'Open' };

  if (currentTab === 'priority') {
    whereFilter.priority = 'HIGH';
  } else if (currentTab === 'resolved') {
    whereFilter = { status: { not: 'Open' } };
  }

  if (issueFilter !== 'all') {
    whereFilter.equipmentIssue = issueFilter.replace(/-/g, ' ');
  }

  let tickets = await prisma.equipmentTicket.findMany({
    where: whereFilter,
    orderBy: { createdAt: 'desc' },
  });

  if (currentTab === 'priority') {
    tickets = tickets.filter(t => t.priority?.toUpperCase() === 'HIGH');
  }

  const getEmptyState = () => {
    if (currentTab === 'priority') return { emoji: "🔥", title: "No fires to put out!", desc: "There are no high-priority tasks in the queue." };
    if (currentTab === 'resolved') return { emoji: "✅", title: "No resolved cases yet.", desc: "Completed repairs will show up here for your audit log." };
    return { emoji: "🏸", title: "Queue is clear!", desc: "No pending repair tickets. New escalations will automatically appear here." };
  };

  const emptyState = getEmptyState();

  const issueTypes = [
    'All Issues',
    'Broken String',
    'Shattered Frame',
    'Grip Replacement',
    'Grommet Cave in',
    'Loose Cone Cap',
    'Tension Loss'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-20">

      <nav className="bg-slate-900 text-white px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner">S</div>
          <span className="text-xl font-bold tracking-wide">SmashOps<span className="text-indigo-400 font-medium">.pro</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300 hidden md:block">Technician Dashboard</span>
          <div className="h-9 w-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold shadow-sm">PN</div>
          <Link
            href="/api/auth/signout"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors border border-slate-700 px-3 py-1.5 rounded-lg"
          >
            LOGOUT
          </Link>
        </div>
      </nav>

      {/* 🚀 Restored margins with max-w-7xl and xl:px-12 */}
      <main className="max-w-7xl mx-auto px-6 xl:px-12 pt-10">

        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Repair Queue</h1>
              <p className="text-slate-500 text-sm mt-1">Real-time escalation sync from CRM.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
              <IssueFilter
                issueTypes={issueTypes.filter(type => type !== 'All Issues')}
                currentFilter={issueFilter}
              />

              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <span className="relative flex h-2 w-2">
                  {currentTab !== 'resolved' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTab === 'resolved' ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  {tickets.length} {currentTab === 'resolved' ? 'Archived' : 'Active'} {tickets.length === 1 ? 'Task' : 'Tasks'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-8 border-b border-slate-200 text-sm font-medium text-slate-500 pl-2">
            <Link
              href={`?tab=active${issueFilter !== 'all' ? `&issue=${issueFilter}` : ''}`}
              className={`pb-3 border-b-2 transition-colors ${currentTab === 'active' ? 'border-indigo-500 text-indigo-600 font-bold' : 'border-transparent hover:text-slate-700'}`}
            >
              Active Queue
            </Link>
            <Link
              href={`?tab=priority${issueFilter !== 'all' ? `&issue=${issueFilter}` : ''}`}
              className={`pb-3 border-b-2 transition-colors ${currentTab === 'priority' ? 'border-red-500 text-red-600 font-bold' : 'border-transparent hover:text-slate-700'}`}
            >
              High Priority
            </Link>
            <Link
              href={`?tab=resolved${issueFilter !== 'all' ? `&issue=${issueFilter}` : ''}`}
              className={`pb-3 border-b-2 transition-colors ${currentTab === 'resolved' ? 'border-emerald-500 text-emerald-600 font-bold' : 'border-transparent hover:text-slate-700'}`}
            >
              Resolved History
            </Link>
          </div>
        </header>

        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 px-4 bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">{emptyState.emoji}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{emptyState.title}</h3>
            <p className="text-slate-500 text-center text-base max-w-md">{emptyState.desc}</p>
          </div>
        )}

        {/* 🚀 Strictly 3 Columns max to preserve perfect card dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tickets.map((ticket) => {
            const isHighPriority = ticket.priority?.toUpperCase() === 'HIGH';
            const partsList = ticket.requiredParts ? ticket.requiredParts.split(';') : [];
            const isSyncFailed = ticket.hubspotSyncStatus === 'FAILED';

            // 🚀 Fixed Warranty Colors
            const warrantyRaw = ticket.warrantyStatus?.toLowerCase() || '';
            let warrantyColor = 'text-slate-500'; // Default Slate for Void/Unknown
            if (warrantyRaw === 'active') warrantyColor = 'text-emerald-600';
            else if (warrantyRaw === 'expired') warrantyColor = 'text-rose-600';

            return (
              <div
                key={ticket.id}
                id={`ticket-card-${ticket.id}`}
                className={`group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden border ${isSyncFailed ? 'border-amber-200 bg-amber-50/10' : (isHighPriority ? 'border-red-200' : 'border-slate-200')}`}
              >
                <div className={`h-1.5 w-full absolute top-0 left-0 ${isSyncFailed ? 'bg-amber-400' : (isHighPriority ? 'bg-red-500' : 'bg-slate-200 group-hover:bg-indigo-400')} transition-colors`}></div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      SYS-{ticket.id.toString().padStart(4, '0')}
                    </span>
                    {ticket.targetCompletionDate && currentTab !== 'resolved' && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${isHighPriority ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                        Due: {ticket.targetCompletionDate}
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 leading-snug mb-3">
                      {ticket.ticketName || 'Unnamed Ticket'}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                        {currentTab !== 'resolved' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
                        )}
                        {ticket.equipmentIssue}
                      </div>

                      {isSyncFailed && (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-sm animate-bounce" title={ticket.lastSyncError}>
                          SYNC FAILED
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🚀 New mt-auto container anchors the stats and parts to the bottom! */}
                  <div className="mt-auto flex flex-col gap-4 mt-4">
                    <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4 border border-slate-100">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Tension</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{ticket.stringTension ? `${ticket.stringTension} lbs` : '--'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Warranty</p>
                        <p className={`text-sm font-bold truncate ${warrantyColor}`}>
                          {ticket.warrantyStatus || '--'}
                        </p>
                      </div>
                    </div>

                    {partsList.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Required Parts</p>
                        <div className="flex flex-wrap gap-2">
                          {partsList.map((part, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200 shadow-sm">
                              {part.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/50 px-5 py-4 border-t border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200 shadow-inner">
                      {ticket.customerName !== 'Unassigned' ? ticket.customerName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Customer</span>
                      <span className="text-xs font-bold text-slate-700 truncate block">{ticket.customerName}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {currentTab === 'resolved' ? (
                      isSyncFailed ? (
                        <RetrySyncButton ticketId={ticket.id} hubspotId={ticket.hubspotTicketId} />
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 shadow-sm">
                          Resolved
                        </span>
                      )
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