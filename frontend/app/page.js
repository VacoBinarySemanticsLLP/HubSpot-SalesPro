"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

const ITEMS_PER_PAGE = 5;

function StatusBadge({ status }) {
  const background =
    status === "Resolved"
      ? "#dcfce7" // light green
      : status === "In Progress"
        ? "#fef08a" // light yellow
        : "#eff6ff"; // light blue
  const color =
    status === "Resolved"
      ? "#15803d" // strong green
      : status === "In Progress"
        ? "#a16207" // strong amber/brown
        : "#1d4ed8"; // strong blue
  const border =
    status === "Resolved"
      ? "1px solid #bbf7d0"
      : status === "In Progress"
        ? "1px solid #fde047"
        : "1px solid #bfdbfe";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background,
        color,
        border,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}
    >
      {status || "Open"}
    </span>
  );
}

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showRaw, setShowRaw] = useState(false);
  const [drafts, setDrafts] = useState({});

  const loadInvestigations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/investigations`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setItems(data);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const inv of data) {
          if (!next[inv.ticket_id]) {
            next[inv.ticket_id] = {
              status: inv.status || "Open",
              comments: inv.comments || "",
            };
          }
        }
        return next;
      });
    } catch (e) {
      setError(e.message || "Failed to load investigations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestigations();
  }, []);

  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync-tickets`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to sync tickets from HubSpot");
      await loadInvestigations();
    } catch (e) {
      setError(e.message || "Failed to trigger sync");
    } finally {
      setSyncingAll(false);
    }
  };

  const filteredAndSearchedItems = useMemo(() => {
    let result = items;
    if (filter === "All") {
      result = result.filter((i) => i.status !== "Resolved");
    } else {
      result = result.filter((i) => i.status === filter);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          (i.merchant_name && i.merchant_name.toLowerCase().includes(q)) ||
          (i.ticket_id && String(i.ticket_id).includes(q))
      );
    }
    return result;
  }, [items, filter, searchQuery]);

  const totalPages = Math.ceil(filteredAndSearchedItems.length / ITEMS_PER_PAGE) || 1;
  // Ensure we don't sit on an empty page after filtering
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const visibleItems = useMemo(() => {
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    return filteredAndSearchedItems.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredAndSearchedItems, page]);

  const updateDraft = (ticketId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [ticketId]: { ...(prev[ticketId] || {}), ...patch },
    }));
  };

  const handleSync = async (ticketId) => {
    const draft = drafts[ticketId] || {};
    const payload = {
      status: draft.status || "Open",
      comments: draft.comments || "",
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/investigations/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.status === "error") {
        throw new Error(
          body?.hubspot_error?.message ||
          body?.detail ||
          "Failed to update HubSpot"
        );
      }
      await loadInvestigations();
    } catch (e) {
      alert(e.message || "Unable to sync. Check backend logs.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
            Investigation queue
          </h2>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.85rem",
              color: "#64748b",
            }}
          >
            Manage and sync tickets assigned from HubSpot.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll}
            style={{
              borderRadius: "0.4rem",
              padding: "0.35rem 0.8rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              border: "1px solid #cbd5e1",
              backgroundColor: syncingAll ? "#f1f5f9" : "#ffffff",
              color: syncingAll ? "#94a3b8" : "#0f172a",
              cursor: syncingAll ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            {syncingAll ? (
              <>
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing HubSpot...
              </>
            ) : (
              "↻ Sync Tickets"
            )}
          </button>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          backgroundColor: "#f8fafc",
          padding: "0.75rem",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search Name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // reset to page 1 on search
            }}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              borderRadius: "0.4rem",
              border: "1px solid #cbd5e1",
              minWidth: "220px",
              outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {["All", ...STATUS_OPTIONS].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setFilter(label);
                  setPage(1); // reset to page 1 on filter
                }}
                style={{
                  borderRadius: "0.4rem",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: filter === label ? 600 : 400,
                  border: "1px solid",
                  borderColor: filter === label ? "#0f172a" : "#e2e8f0",
                  backgroundColor: filter === label ? "#0f172a" : "#ffffff",
                  color: filter === label ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              style={{
                marginLeft: "1rem",
                borderRadius: "0.4rem",
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                border: "1px solid #cbd5e1",
                backgroundColor: showRaw ? "#0f172a" : "#ffffff",
                color: showRaw ? "#ffffff" : "#0f172a",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {showRaw ? "Hide JSON" : "Show JSON"}
            </button>
          </div>
        </div>
      </section>

      {showRaw && (
        <section
          style={{
            backgroundColor: "#020617",
            color: "#e5e7eb",
            borderRadius: "0.75rem",
            padding: "0.75rem 0.9rem",
            fontSize: "0.75rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.35rem",
            }}
          >
            <span style={{ opacity: 0.8 }}>
              GET <code style={{ color: "#22c55e" }}>{API_BASE}/investigations</code>
            </span>
            <span style={{ opacity: 0.6 }}>
              {items.length} record{items.length === 1 ? "" : "s"}
            </span>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(items, null, 2)}
          </pre>
        </section>
      )}

      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow:
            "0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.06)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "999px",
                backgroundColor: loading ? "#facc15" : "#22c55e",
              }}
            />
            {loading ? "Syncing with backend…" : "Live from FastAPI backend"}
          </div>
          <button
            type="button"
            onClick={loadInvestigations}
            style={{
              borderRadius: "0.4rem",
              padding: "0.25rem 0.75rem",
              fontSize: "0.75rem",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Reload Local Data
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderBottom: "1px solid #fecaca",
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
          >
            <thead style={{ backgroundColor: "#f8fafc", color: "#64748b" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>
                  Merchant
                </th>
                <th style={{ textAlign: "left", padding: "0.8rem 0.75rem", fontWeight: 600 }}>
                  Issue
                </th>
                <th style={{ textAlign: "left", padding: "0.8rem 0.75rem", fontWeight: 600 }}>
                  Inv. Reason
                </th>
                <th style={{ textAlign: "left", padding: "0.8rem 0.75rem", fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "0.8rem 0.75rem", fontWeight: 600 }}>
                  Comments
                </th>
                <th style={{ textAlign: "right", padding: "0.8rem 0.75rem", fontWeight: 600 }}>
                  Sync
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2.5rem 0.75rem",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "0.9rem"
                    }}
                  >
                    No investigations found matching your criteria.
                  </td>
                </tr>
              )}

              {visibleItems.map((inv) => {
                const draft = drafts[inv.ticket_id] || {};
                return (
                  <tr key={inv.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.6rem 0.75rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {inv.merchant_name || "Unknown Merchant"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          marginTop: "0.15rem",
                        }}
                      >
                        Ticket #{inv.ticket_id}
                      </div>
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem", verticalAlign: "top" }}>
                      {inv.reason || "No subject"}
                    </td>
                    <td style={{ padding: "0.8rem 0.75rem", verticalAlign: "top" }}>
                      <span style={{
                        display: "inline-block",
                        backgroundColor: "#f1f5f9",
                        padding: "0.3rem 0.5rem",
                        borderRadius: "0.3rem",
                        fontSize: "0.75rem",
                        color: "#475569"
                      }}>
                        {inv.investigation_reason || "-"}
                      </span>
                    </td>
                    <td style={{ padding: "0.8rem 0.75rem", verticalAlign: "top" }}>
                      <StatusBadge status={inv.status} />
                      {inv.status !== "Resolved" && (
                        <div style={{ marginTop: "0.4rem" }}>
                          <select
                            value={draft.status || inv.status || "Open"}
                            onChange={(e) =>
                              updateDraft(inv.ticket_id, { status: e.target.value })
                            }
                            style={{
                              width: "100%",
                              padding: "0.25rem 0.4rem",
                              fontSize: "0.75rem",
                              borderRadius: "0.4rem",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.8rem 0.75rem", verticalAlign: "top" }}>
                      <textarea
                        rows={2}
                        value={draft.comments ?? inv.comments ?? ""}
                        onChange={(e) =>
                          updateDraft(inv.ticket_id, { comments: e.target.value })
                        }
                        style={{
                          width: "100%",
                          resize: "vertical",
                          padding: "0.4rem 0.6rem",
                          fontSize: "0.75rem",
                          borderRadius: "0.4rem",
                          border: "1px solid #cbd5e1",
                          outline: "none",
                          backgroundColor: "#f8fafc",
                          transition: "border-color 0.2s"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#94a3b8"}
                        onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                        placeholder="Add internal notes..."
                      />
                    </td>
                    <td
                      style={{
                        padding: "0.8rem 0.75rem",
                        verticalAlign: "top",
                        textAlign: "right",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSync(inv.ticket_id)}
                        disabled={loading}
                        style={{
                          borderRadius: "0.4rem",
                          padding: "0.4rem 0.9rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          border: "none",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                          boxShadow: "0 1px 2px rgba(37,99,235,0.2)",
                          transition: "background-color 0.2s"
                        }}
                        onMouseOver={(e) => {
                          if (!loading) e.target.style.backgroundColor = "#1d4ed8";
                        }}
                        onMouseOut={(e) => {
                          if (!loading) e.target.style.backgroundColor = "#2563eb";
                        }}
                      >
                        Push to HubSpot
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1rem",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc"
            }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Showing <strong style={{ color: "#0f172a" }}>{visibleItems.length}</strong> of <strong style={{ color: "#0f172a" }}>{filteredAndSearchedItems.length}</strong> items
              </span>

              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "0.25rem 0.6rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.35rem",
                    backgroundColor: page === 1 ? "#f1f5f9" : "#ffffff",
                    color: page === 1 ? "#94a3b8" : "#334155",
                    fontSize: "0.75rem",
                    cursor: page === 1 ? "not-allowed" : "pointer"
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", color: "#475569" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "0.25rem 0.6rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.35rem",
                    backgroundColor: page === totalPages ? "#f1f5f9" : "#ffffff",
                    color: page === totalPages ? "#94a3b8" : "#334155",
                    fontSize: "0.75rem",
                    cursor: page === totalPages ? "not-allowed" : "pointer"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
