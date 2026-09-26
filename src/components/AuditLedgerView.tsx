import React, { useState } from 'react';
import { AuditEntry } from '../types/incident';
import {
  ShieldCheck,
  Download,
  Filter,
  Terminal,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Undo2
} from 'lucide-react';

interface AuditLedgerViewProps {
  ledger: AuditEntry[];
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({ ledger }) => {
  const [envFilter, setEnvFilter] = useState<'ALL' | 'sandbox_digital_twin' | 'production'>('ALL');

  const filtered = ledger.filter((entry) => {
    if (envFilter === 'ALL') return true;
    return entry.environment === envFilter;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ledger, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis-sre-audit-ledger-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadge = (status: AuditEntry['status']) => {
    switch (status) {
      case 'SUCCESS':
      case 'EXECUTED':
        return 'text-emerald-400 border-emerald-800/80 bg-emerald-950/30';
      case 'ROLLED_BACK':
        return 'text-amber-400 border-amber-800/80 bg-amber-950/30';
      case 'BLOCKED_PENDING_APPROVAL':
        return 'text-rose-400 border-rose-800/80 bg-rose-950/30';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/50';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Sandboxed Audit Ledger</span>
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of all autonomous dry-runs, human approvals, execution dispatches, and rollbacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value as any)}
            className="text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Environments</option>
            <option value="sandbox_digital_twin">Sandbox (Digital Twin)</option>
            <option value="production">Production Cluster</option>
          </select>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[500px] border border-slate-800/80 rounded bg-slate-950/60 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No audit records created yet. Executions in Digital Twin or Production will append here automatically.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px]">
                <th className="p-2.5 font-medium">Timestamp</th>
                <th className="p-2.5 font-medium">Environment</th>
                <th className="p-2.5 font-medium">Action & Command</th>
                <th className="p-2.5 font-medium">Status</th>
                <th className="p-2.5 font-medium">Operator / Agent</th>
                <th className="p-2.5 font-medium">Telemetry Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-900/50 transition-colors text-slate-300"
                >
                  <td className="p-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        entry.environment === 'sandbox_digital_twin'
                          ? 'border-purple-800/70 bg-purple-950/40 text-purple-300'
                          : 'border-blue-800/70 bg-blue-950/40 text-blue-300'
                      }`}
                    >
                      {entry.environment === 'sandbox_digital_twin' ? 'SANDBOX TWIN' : 'PRODUCTION'}
                    </span>
                  </td>
                  <td className="p-2.5 max-w-xs truncate">
                    <div className="text-slate-200 truncate">{entry.command}</div>
                    <div className="text-[10px] text-slate-500 truncate">{entry.action_id}</div>
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(
                        entry.status
                      )}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-400 whitespace-nowrap">
                    {entry.operator || entry.agent}
                  </td>
                  <td className="p-2.5 text-slate-400 text-[11px] max-w-xs truncate">
                    {entry.verified_metric_change || 'Pre-execution state'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
