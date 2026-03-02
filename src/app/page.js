import { PrismaClient } from '@prisma/client';
import ResolveButton from './components/ResolveButton';

const prisma = new PrismaClient();
export const revalidate = 0; 

export default async function Dashboard() {
  const tickets = await prisma.equipmentTicket.findMany({
    where: { status: 'Open' }, // Add this filter
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased">
      <main className="max-w-6xl mx-auto px-8 py-16">
        
        {/* Header Section */}
        <header className="mb-12 flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Repair Operations</h1>
            <p className="text-slate-500 font-medium">Real-time equipment escalation queue from HubSpot.</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-slate-600">
              {tickets.length} Active {tickets.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
        </header>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] uppercase tracking-[0.1em] font-bold text-slate-400">
                <th className="px-6 py-4">Internal ID</th>
                <th className="px-6 py-4">CRM Reference</th>
                <th className="px-6 py-4">Issue Description</th>
                <th className="px-6 py-4">Logged At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-all duration-200 group">
                  <td className="px-6 py-5 font-mono text-[13px] text-slate-400">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">SYS-{ticket.id.toString().padStart(4, '0')}</span>
                  </td>
                  <td className="px-6 py-5 font-mono text-[13px] text-slate-500">
                    #{ticket.hubspotTicketId}
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-semibold text-slate-700">{ticket.equipmentIssue}</span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-sm">
                    {new Date(ticket.occurredAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <ResolveButton ticketId={ticket.id} hubspotId={ticket.hubspotTicketId} />
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-slate-400 font-medium">Queue is currently empty.</p>
                      <p className="text-slate-300 text-sm">New escalations will appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}