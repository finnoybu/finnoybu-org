"use client";

import { useState, useEffect } from "react";
import { DomainSnapshot } from "@/lib/storage";

interface DomainData {
  domain: string;
  snapshot: DomainSnapshot;
}

export default function Home() {
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState<string>("");

  // Load domains on mount
  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      const response = await fetch("/api/snapshot");
      if (!response.ok) throw new Error("Failed to load domains");
      const data = await response.json();
      setDomains(data.domains || []);
      if (data.domains && data.domains.length > 0) {
        setSelectedDomain(data.domains[0].domain);
      }
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim()) {
      setError("Please enter a domain");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to add domain");
      }

      setNewDomain("");
      setAddingDomain(false);
      await loadDomains();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshSnapshot() {
    if (!selectedDomain) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh snapshot");
      }

      await loadDomains();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDomain() {
    if (!selectedDomain) return;

    if (!confirm(`Delete ${selectedDomain}?`)) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, action: "delete" }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete domain");
      }

      setSelectedDomain("");
      await loadDomains();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const selectedSnapshot = domains.find((d) => d.domain === selectedDomain)?.snapshot;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #ddd", paddingBottom: "1rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
          Finnoybu Organization --- Finnoybu IP LLC Properties
        </h1>
        <p style={{ margin: "0", color: "#666", fontSize: "0.9rem" }}>
          Domain Governance Snapshot Tool
        </p>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
              marginBottom: "1rem",
              border: "1px solid #f5c6cb",
            }}
          >
            Error: {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            style={{
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              minWidth: "200px",
            }}
            disabled={domains.length === 0}
          >
            <option value="">
              {domains.length === 0 ? "No domains" : "Select Domain"}
            </option>
            {domains.map((d) => (
              <option key={d.domain} value={d.domain}>
                {d.domain}
              </option>
            ))}
          </select>

          <button
            onClick={() => setAddingDomain(!addingDomain)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
            disabled={addingDomain}
          >
            Add Domain
          </button>

          <button
            onClick={handleRefreshSnapshot}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
            disabled={!selectedDomain || loading}
          >
            Refresh Snapshot
          </button>

          <button
            onClick={handleDeleteDomain}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
            disabled={!selectedDomain || loading}
          >
            Delete Domain
          </button>
        </div>

        {addingDomain && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "2rem",
            }}
          >
            <input
              type="text"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddDomain()}
              autoFocus
              style={{
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                flex: 1,
                maxWidth: "300px",
              }}
              disabled={loading}
            />
            <button
              onClick={handleAddDomain}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              Add
            </button>
            <button
              onClick={() => {
                setAddingDomain(false);
                setNewDomain("");
              }}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}

        {selectedSnapshot && (
          <div>
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#e7f3ff",
                borderLeft: "4px solid #007bff",
                borderRadius: "4px",
              }}
            >
              <strong>Last Snapshot:</strong>{" "}
              {new Date(selectedSnapshot.timestamp).toLocaleString()}
            </div>

            <pre
              style={{
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "1rem",
                overflow: "auto",
                fontSize: "0.85rem",
              }}
            >
              {JSON.stringify(selectedSnapshot, null, 2)}
            </pre>
          </div>
        )}

        {!selectedSnapshot && selectedDomain && (
          <p style={{ color: "#666" }}>No snapshot data available. Click &quot;Refresh Snapshot&quot; to fetch.</p>
        )}

        {!selectedDomain && domains.length > 0 && (
          <p style={{ color: "#666" }}>Select a domain from the dropdown to view its snapshot.</p>
        )}

        {domains.length === 0 && (
          <p style={{ color: "#666", fontSize: "1.1rem" }}>
            No domains yet. Click &quot;Add Domain&quot; to get started.
          </p>
        )}
      </main>
    </div>
  );
}
