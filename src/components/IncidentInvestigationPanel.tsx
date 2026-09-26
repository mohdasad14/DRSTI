import React, { useState } from 'react';
import { TelemetryPayload, IncidentScenario, Hypothesis } from '../types/incident';
import { CausalTopologyGraph } from './CausalTopologyGraph';
import {
  Clock,
  GitCommit,
  AlertTriangle,
  AlertCircle,
  Activity,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface IncidentInvestigationPanelProps {
  telemetry: TelemetryPayload;
  scenario: IncidentScenario;
  hypothesis?: Hypothesis | null;
  onInjectProbe?: () => void;
  probeRequested?: boolean;
}

type TabType = 'timeline' | 'topology' | 'logs' | 'metrics' | 'traces';

export const IncidentInvestigationPanel: React.FC<IncidentInvestigationPanelProps> = ({
  telemetry,
  scenario,
  hypothesis,
  onInjectProbe,
  probeRequested,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Format base timestamp into clean HH:mm:ss format
  const formatTime = (ts: number, offsetSec: number = 0): string => {
    // If base detectedTime is provided like '14:32:01', calculate incremental offsets
    const baseHour = 14;
    const baseMin = 32;
    const baseSec = 1;

    const totalSeconds = baseHour * 3600 + baseMin * 60 + baseSec + offsetSec;
    const h = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Build clean unified timeline events from logs, metrics, traces, correlation
  const timelineEvents = [
    {
      id: 'ev-1',
      time: formatTime(0, 0),
      level: 'WARNING' as const,
      title: 'Connection latency exceeded threshold',
      service: telemetry.logs[0]?.service || 'order-service',
      detail: telemetry.logs[0]?.message || 'Connection acquisition latency exceeded 1500ms for pool [HikariPool-1]',
      raw: telemetry.logs[0],
    },
    {
      id: 'ev-2',
      time: formatTime(0, 2),
      level: 'ERROR' as const,
      title: 'Database connection timeout',
      service: telemetry.logs[1]?.service || 'order-service',
      detail: telemetry.logs[1]?.message || 'Timeout acquiring connection from pool HikariPool-1 (connection-timeout: 30000ms)',
      raw: telemetry.logs[1],
    },
    {
      id: 'ev-3',
      time: formatTime(0, 4),
      level: 'ERROR' as const,
      title: 'API Gateway 504',
      service: 'api-gateway',
      detail: telemetry.logs[2]?.message || 'Upstream HTTP 504 Gateway Timeout while proxying POST /api/v1/orders/checkout',
      raw: telemetry.logs[2],
    },
    {
      id: 'ev-4',
      time: formatTime(0, 6),
      level: 'ALERT' as const,
      title: 'Related events correlated into one incident',
      service: 'DRSTI Engine',
      detail: `Correlated ${telemetry.logs.length} logs, ${telemetry.metrics.length} metric spikes, and git deployment ${telemetry.deployment_metadata?.version || 'v1.4.2'} into root cause candidate.`,
      raw: telemetry.deployment_metadata,
    },
    // Any supplemental or additional logs
    ...(telemetry.logs.slice(3).map((l, idx) => ({
      id: l.id || `ev-extra-${idx}`,
      time: formatTime(0, 8 + idx * 2),
      level: l.level === 'FATAL' || l.level === 'ERROR' ? ('ERROR' as const) : ('WARNING' as const),
      title: l.message,
      service: l.service,
      detail: JSON.stringify(l.metadata || {}),
      raw: l,
    }))),
  ];

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl flex flex-col h-full min-h-[520px] shadow-sm">
      {/* Header & Tabs */}
      <div className="px-5 py-3.5 border-b border-[#1c1c22] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Incident Investigation
        </h2>

        {/* Clean Segmented Tab Control */}
        <div className="flex items-center gap-1 bg-[#121217] p-1 rounded-lg border border-[#202026]">
          {(
            [
              { id: 'timeline', label: 'Timeline' },
              { id: 'topology', label: 'Causal Graph' },
              { id: 'logs', label: 'Logs' },
              { id: 'metrics', label: 'Metrics' },
              { id: 'traces', label: 'Traces' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Clean Vertical Timeline (Default) */}
      {activeTab === 'timeline' && (
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Subtle info line */}
          <div className="text-[11px] text-zinc-500 mb-4 flex items-center justify-between">
            <span>Chronological event sequence from detection</span>
            <span className="font-mono">{timelineEvents.length} events correlated</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-[#202028]">
            {timelineEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const isWarning = ev.level === 'WARNING';
              const isError = ev.level === 'ERROR';
              const isAlert = ev.level === 'ALERT';

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Dot */}
                  <span
                    className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#0b0b0e] transition-transform ${
                      isError
                        ? 'bg-red-500'
                        : isWarning
                        ? 'bg-amber-400'
                        : isAlert
                        ? 'bg-blue-400'
                        : 'bg-zinc-400'
                    }`}
                  />

                  {/* Clean Timeline Row */}
                  <div
                    onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                    className="cursor-pointer hover:bg-[#121217] -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Timestamp */}
                      <span className="font-mono text-xs text-zinc-400 font-medium shrink-0">
                        {ev.time}
                      </span>

                      {/* Level Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                          isError
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : isAlert
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {ev.level}
                      </span>

                      {/* Event Title */}
                      <span className="text-xs font-medium text-zinc-200 flex-1 truncate">
                        {ev.title}
                      </span>

                      {/* Service tag */}
                      <span className="text-[11px] font-mono text-zinc-500 bg-[#141418] px-2 py-0.5 rounded border border-[#202026] shrink-0">
                        {ev.service}
                      </span>

                      {/* Expand chevron */}
                      <span className="text-zinc-600 group-hover:text-zinc-400">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-[#1e1e24] text-xs space-y-1.5 pl-16">
                        <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">
                          {ev.detail}
                        </p>
                        {ev.raw && (
                          <pre className="p-2 rounded bg-[#070709] border border-[#1b1b22] text-[10px] text-zinc-400 font-mono overflow-x-auto">
                            {JSON.stringify(ev.raw, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supplemental Telemetry Probe trigger if applicable */}
          {probeRequested && onInjectProbe && (
            <div className="mt-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
              <span>Verification Agent flagged sparse telemetry. Supplemental socket probe available.</span>
              <button
                onClick={onInjectProbe}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded text-xs transition-colors shrink-0"
              >
                Inject Probe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Causal Graph */}
      {activeTab === 'topology' && (
        <div className="p-4 flex-1 h-[440px]">
          <CausalTopologyGraph
            hypothesis={hypothesis || null}
            activeOriginService={scenario.groundTruthOriginService}
          />
        </div>
      )}

      {/* Tab 3: Clean Logs Table */}
      {activeTab === 'logs' && (
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Captured Telemetry Logs</span>
            <span className="font-mono text-xs text-zinc-500">{telemetry.logs.length} entries</span>
          </div>

          <div className="border border-[#1e1e24] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121217] text-zinc-400 border-b border-[#1e1e24]">
                <tr>
                  <th className="p-2.5">Level</th>
                  <th className="p-2.5">Service</th>
                  <th className="p-2.5">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17171e]">
                {telemetry.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121216] transition-colors">
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.level === 'ERROR' || log.level === 'FATAL'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : log.level === 'WARN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="p-2.5 text-zinc-300">{log.service}</td>
                    <td className="p-2.5 text-zinc-200 truncate max-w-md">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Clean Metrics */}
      {activeTab === 'metrics' && (
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="text-xs text-zinc-400 mb-2">Time-Series Breaches</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {telemetry.metrics.map((m) => {
              const breached = m.threshold !== undefined && m.value >= m.threshold;
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-lg bg-[#0e0e12] border border-[#1e1e24] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-300">{m.metric}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{m.service}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xl font-bold font-mono ${
                        breached ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {m.value}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">{m.unit}</span>
                    {m.threshold && (
                      <span className="text-[11px] text-zinc-500 font-mono ml-auto">
                        threshold: {m.threshold} {m.unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Clean Traces */}
      {activeTab === 'traces' && (
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <div className="text-xs text-zinc-400 mb-2">Distributed Trace Spans</div>
          {telemetry.traces.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No distributed trace spans captured for this edge case.
            </div>
          ) : (
            <div className="space-y-2">
              {telemetry.traces.map((tr) => (
                <div
                  key={tr.id}
                  className="p-3 rounded-lg bg-[#0e0e12] border border-[#1e1e24] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono text-zinc-200 font-medium">{tr.span}</div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {tr.service} • Trace ID: {tr.traceId}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        tr.status === 'error' ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {tr.duration_ms}ms
                    </span>
                    <div className="text-[10px] text-zinc-500 uppercase">{tr.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
