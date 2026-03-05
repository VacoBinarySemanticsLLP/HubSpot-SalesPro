"use client";

import { useState, useEffect } from "react";

interface Ticket {
  ticket_id: number;
  subject: string;
  merchant_id: string;
  restaurant_tier: string;
  investigation_reason: string;
  sales_investigation_required: string;
  owner_name: string;
  owner_email: string;
  company_name: string;
  company_city: string;
  contact_name: string;
  contact_phone: string;
  sla_deadline: string;
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchTickets = () => {
    setLoading(true);
    fetch("http://34.173.108.205:8000/tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tickets:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    let result = tickets;

    // Filter Logic
    if (activeFilter !== "All") {
      if (activeFilter === "Tier 1") {
        result = result.filter((t) => t.restaurant_tier === "Fine Dining"); // Mapping Tier 1 to Fine Dining for example
      } else {
        result = result.filter((t) => t.investigation_reason === activeFilter);
      }
    }

    // Global Search Logic (Merchant ID, Company, Owner, Reason)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchant_id?.toLowerCase().includes(lowerSearch) ||
          t.company_name?.toLowerCase().includes(lowerSearch) ||
          t.owner_name?.toLowerCase().includes(lowerSearch) ||
          t.investigation_reason?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredTickets(result);
  }, [searchTerm, activeFilter, tickets]);

  const filters = [
    { label: "All", value: "All" },
    { label: "Documentation support", value: "Documentation support" },
    { label: "Non-compliant sales", value: "Non-compliant sales" },
    { label: "Tier 1", value: "Tier 1" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-[#38BDF8] h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-[#38BDF8] rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-2 bg-[#38BDF8] rounded col-span-2"></div>
              <div className="h-2 bg-[#38BDF8] rounded col-span-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Search Header Bar - Fixed */}
      <div className="sticky top-0 z-50 bg-[#0F172A]/80 backdrop-blur-md pb-6 pt-4 border-b border-[#F8FAFC]/10">
        <div className="max-w-7xl mx-auto px-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#F8FAFC] tracking-tight">
              Investigation <span className="text-[#38BDF8]">Dashboard</span>
            </h1>
            <button 
              onClick={fetchTickets}
              className="bg-[#38BDF8] text-[#0F172A] px-4 py-2 rounded-lg hover:opacity-90 transition-all font-bold shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </header>

          <div className="flex flex-col gap-6">
            {/* Global Search */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-3xl">
                <input
                  type="text"
                  placeholder="Global Search (Merchant, Company, Owner, Reason)..."
                  className="w-full bg-[#1E293B] border-2 border-[#38BDF8]/20 rounded-2xl px-6 py-4 shadow-xl focus:outline-none focus:ring-4 focus:ring-[#38BDF8]/20 transition-all text-[#F8FAFC] text-lg font-medium placeholder:text-[#94A3B8]/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-4 top-4 bg-[#38BDF8] p-1.5 rounded-lg">
                  <svg className="w-5 h-5 text-[#0F172A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                    activeFilter === f.value
                      ? "bg-[#38BDF8] border-[#38BDF8] text-[#0F172A] shadow-md shadow-[#38BDF8]/30"
                      : "bg-[#1E293B] border-white/5 text-[#F8FAFC] hover:border-[#38BDF8] hover:text-[#38BDF8]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1E293B]/50 rounded-[2rem] p-4 shadow-inner border border-white/5">
          <div className="overflow-x-auto rounded-[1.5rem]">
            <table className="w-full text-left border-separate border-spacing-y-2.5 px-2">
              <thead>
                <tr className="text-[#94A3B8] text-sm uppercase tracking-wider font-extrabold">
                  <th className="px-6 py-4">Merchant & Tier</th>
                  <th className="px-6 py-4">Subject & Reason</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4 text-center">SLA</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="bg-[#1E293B] hover:bg-slate-800 shadow-sm transition-all duration-300 group cursor-default"
                  >
                    <td className="px-6 py-5 rounded-l-2xl">
                      <div className="font-bold text-[#F8FAFC]">
                        {ticket.company_name}
                      </div>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-xs font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded text-[#38BDF8]">
                          {ticket.merchant_id}
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 text-[#0F172A] bg-[#38BDF8]/80 rounded-full">
                          {ticket.restaurant_tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-[#F8FAFC] line-clamp-1">
                        {ticket.subject}
                      </div>
                      <div className="text-xs font-medium text-[#94A3B8] mt-1 italic">
                        {ticket.investigation_reason}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#38BDF8]/20 flex items-center justify-center font-bold text-[#38BDF8] text-xs">
                          {ticket.owner_name?.charAt(0)}
                        </div>
                        <div className="text-sm font-bold text-[#F8FAFC]">
                          {ticket.owner_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        {ticket.investigation_reason === "Documentation support" ? (
                          <span className="bg-[#FBBF24] text-[#0F172A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            72h
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#38BDF8]/20 text-[#38BDF8]">
                            48h
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-mono font-bold text-[#38BDF8]/70">
                      {ticket.sla_deadline}
                    </td>
                    <td className="px-6 py-5 rounded-r-2xl text-right">
                      <button className="bg-[#38BDF8] hover:bg-white text-[#0F172A] px-4 py-2 rounded-xl text-xs font-black shadow-md hover:shadow-xl transition-all active:scale-95">
                        VIEW DETAILS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTickets.length === 0 && (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-[#1E293B] p-6 rounded-3xl shadow-xl border border-white/5">
                  <svg className="w-12 h-12 text-[#38BDF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#F8FAFC]">Zero Results</h3>
                  <p className="text-[#94A3B8] font-medium">Clear search or change filter to start again</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
