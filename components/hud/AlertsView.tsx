"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Search, Filter, ArrowUpDown, Link } from "lucide-react";
import { useDashboard } from "@/lib/DashboardContext";
import { SeverityDonut } from "@/components/hud/SeverityDonut";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/types";

type SortField = "created_at" | "severity" | "type";
type SortDir = "asc" | "desc";

const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function AlertsView() {
  const { alerts, trucks } = useDashboard();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [truckFilter, setTruckFilter] = useState<string | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const info = alerts.filter((a) => a.severity === "info").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const critical = alerts.filter((a) => a.severity === "critical").length;

  const filtered = useMemo(() => {
    let list = [...alerts];

    if (severityFilter !== "all") list = list.filter((a) => a.severity === severityFilter);
    if (truckFilter !== "all") list = list.filter((a) => a.truck_id === truckFilter);
    if (search) list = list.filter((a) => a.type.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase()));

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === "severity") cmp = severityOrder[a.severity] - severityOrder[b.severity];
      else if (sortField === "type") cmp = a.type.localeCompare(b.type);
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [alerts, severityFilter, truckFilter, search, sortField, sortDir]);

  const selectedAlert = selectedAlertId ? alerts.find((a) => a.id === selectedAlertId) ?? null : null;

  const truckIds = useMemo(() => Array.from(trucks.keys()), [trucks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="flex h-full">
      {/* Main alert list */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filter bar */}
        <div className="flex items-center gap-2 p-2 border-b border-border-default bg-surface flex-wrap">
          <div className="flex items-center gap-1.5 bg-base rounded px-2 py-1 border border-border-default">
            <Search className="w-3 h-3 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts..."
              className="bg-transparent border-none outline-none text-xs font-mono text-text-primary placeholder:text-text-muted/50 w-32"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | "all")}
            className="bg-base text-text-primary text-[10px] font-mono border border-border-default rounded px-1.5 py-1 outline-none"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={truckFilter}
            onChange={(e) => setTruckFilter(e.target.value)}
            className="bg-base text-text-primary text-[10px] font-mono border border-border-default rounded px-1.5 py-1 outline-none"
          >
            <option value="all">All Trucks</option>
            {truckIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          <div className="flex-1" />

          <SeverityDonut info={info} warning={warning} critical={critical} />
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 py-1 text-[9px] uppercase tracking-wider text-text-muted font-mono border-b border-border-default bg-surface/50">
          <button onClick={() => handleSort("type")} className="flex items-center gap-1 hover:text-text-primary w-24">
            Type {sortField === "type" && <ArrowUpDown className="w-2.5 h-2.5" />}
          </button>
          <button onClick={() => handleSort("severity")} className="flex items-center gap-1 hover:text-text-primary w-16">
            Sev {sortField === "severity" && <ArrowUpDown className="w-2.5 h-2.5" />}
          </button>
          <div className="flex-1">Message</div>
          <div className="w-20">Truck</div>
          <button onClick={() => handleSort("created_at")} className="flex items-center gap-1 hover:text-text-primary w-24 text-right">
            Time {sortField === "created_at" && <ArrowUpDown className="w-2.5 h-2.5" />}
          </button>
          <div className="w-6" />
        </div>

        {/* Alert rows */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAlertId(a.id === selectedAlertId ? null : a.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors text-xs border-b border-border-default/30",
                selectedAlertId === a.id ? "bg-accent-info/10" : "hover:bg-surface/50",
              )}
            >
              <div className="w-24 font-mono font-semibold text-text-primary truncate">{a.type}</div>
              <div className="w-16">
                <span className={cn(
                  "text-[9px] px-1 py-px rounded uppercase font-mono",
                  a.severity === "critical" && "bg-accent-critical/20 text-accent-critical",
                  a.severity === "warning" && "bg-accent-warning/20 text-accent-warning",
                  a.severity === "info" && "bg-accent-safe/20 text-accent-safe",
                )}>{a.severity}</span>
              </div>
              <div className="flex-1 text-text-muted truncate">{a.message}</div>
              <div className="w-20 font-mono text-text-muted truncate">{a.truck_id}</div>
              <div className="w-24 font-mono text-text-muted text-right truncate">
                {new Date(a.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="w-6 flex justify-center">
                {a.onchain_tx_hash ? (
                  <Link className="w-3 h-3 text-accent-safe" />
                ) : (
                  <span className="w-3 h-3" />
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-text-muted text-xs text-center py-12">No alerts match the current filters</div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedAlert && (
        <div className="w-72 border-l border-border-default bg-surface overflow-y-auto shrink-0 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "w-4 h-4",
              selectedAlert.severity === "critical" && "text-accent-critical",
              selectedAlert.severity === "warning" && "text-accent-warning",
              selectedAlert.severity === "info" && "text-accent-safe",
            )} />
            <div>
              <div className="text-sm font-mono font-semibold text-text-primary uppercase">{selectedAlert.type}</div>
              <span className={cn(
                "text-[9px] px-1 py-px rounded uppercase font-mono",
                selectedAlert.severity === "critical" && "bg-accent-critical/20 text-accent-critical",
                selectedAlert.severity === "warning" && "bg-accent-warning/20 text-accent-warning",
                selectedAlert.severity === "info" && "bg-accent-safe/20 text-accent-safe",
              )}>{selectedAlert.severity}</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Message</div>
            <div className="text-xs text-text-primary">{selectedAlert.message}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">Truck</div>
              <div className="text-xs font-mono text-text-primary">{selectedAlert.truck_id}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">Created</div>
              <div className="text-xs font-mono text-text-primary">{new Date(selectedAlert.created_at).toLocaleString()}</div>
            </div>
          </div>

          {selectedAlert.triggered_by && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Triggered By</div>
              <pre className="text-[10px] font-mono text-text-muted bg-base rounded p-2 overflow-x-auto border border-border-default">
                {JSON.stringify(selectedAlert.triggered_by, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">On-Chain Status</div>
            <div className="flex items-center gap-1.5 text-xs">
              {selectedAlert.onchain_tx_hash ? (
                <>
                  <Link className="w-3 h-3 text-accent-safe" />
                  <span className="font-mono text-accent-safe text-[10px]">{selectedAlert.onchain_tx_hash.slice(0, 16)}...</span>
                </>
              ) : (
                <span className="text-text-muted">Pending</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
