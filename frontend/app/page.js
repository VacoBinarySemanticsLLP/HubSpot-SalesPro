"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

function StatusBadge({ status }) {
  const background =
    status === "Resolved"
      ? "#dcfce7"
      : status === "In Progress"
      ? "#fef3c7"
      : "#dbeafe";
  const color =
    status === "Resolved"
      ? "#166534"
      : status === "In Progress"
      ? "#92400e"
      : "#1d4ed8";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.15rem 0.5rem",
        borderRadius: "999px",
        fontSize: "0.7rem",
        fontWeight: 600,
        background,
        color,
      }}
    >
      {status || "Open"}
    </span>
  );
}

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [showRaw, setShowRaw] = useState(false);
  const [drafts, setDrafts] = useState({});

  const loadInvestigations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/investigations`);
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

  const visibleItems = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

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
      const res = await fetch(`${API_BASE}/investigations/${ticketId}/status`, {
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
            Tickets pulled from HubSpot where{" "}
            <code>sales_investigation_required</code> is <strong>Yes</strong>.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["All", ...STATUS_OPTIONS].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              style={{
                borderRadius: "999px",
                padding: "0.25rem 0.75rem",
                fontSize: "0.75rem",
                border: "1px solid",
                borderColor: filter === label ? "#0f172a" : "#cbd5e1",
                backgroundColor: filter === label ? "#0f172a" : "#ffffff",
                color: filter === label ? "#ffffff" : "#0f172a",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            style={{
              borderRadius: "999px",
              padding: "0.25rem 0.75rem",
              fontSize: "0.75rem",
              border: "1px solid #cbd5e1",
              backgroundColor: showRaw ? "#0f172a" : "#ffffff",
              color: showRaw ? "#ffffff" : "#0f172a",
              cursor: "pointer",
            }}
          >
            {showRaw ? "Hide JSON" : "Show JSON"}
          </button>
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
              borderRadius: "0.35rem",
              padding: "0.25rem 0.75rem",
              fontSize: "0.75rem",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              cursor: "pointer",
            }}
          >
            Refresh
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
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>
                  Issue
                </th>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem" }}>
                  Comments
                </th>
                <th style={{ textAlign: "right", padding: "0.6rem 0.75rem" }}>
                  Sync
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "1.5rem 0.75rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No investigations found. Make sure your HubSpot tickets have{" "}
                    <code>sales_investigation_required = Yes</code> and run{" "}
                    <code>/sync-tickets</code>.
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
                    <td style={{ padding: "0.6rem 0.75rem", verticalAlign: "top" }}>
                      <StatusBadge status={inv.status} />
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
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem", verticalAlign: "top" }}>
                      <textarea
                        rows={2}
                        value={draft.comments ?? inv.comments ?? ""}
                        onChange={(e) =>
                          updateDraft(inv.ticket_id, { comments: e.target.value })
                        }
                        style={{
                          width: "100%",
                          resize: "vertical",
                          padding: "0.35rem 0.4rem",
                          fontSize: "0.75rem",
                          borderRadius: "0.4rem",
                          border: "1px solid #cbd5e1",
                        }}
                        placeholder="Notes that will be stored with this ticket…"
                      />
                    </td>
                    <td
                      style={{
                        padding: "0.6rem 0.75rem",
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
                          padding: "0.3rem 0.9rem",
                          fontSize: "0.75rem",
                          border: "none",
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        Update & Sync
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
