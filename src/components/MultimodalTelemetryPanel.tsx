import React, { useState } from 'react';
import { TelemetryPayload, LogEntry, MetricEntry, TraceSpan } from '../types/incident';
import {
  FileText,
  BarChart3,
  GitBranch,
  Network,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Code
} from 'lucide-react';

interface MultimodalTelemetryPanelProps {
  telemetry: TelemetryPayload;
  onInjectProbe?: () => void;
  probeRequested?: boolean;
}

export const MultimodalTelemetryPanel: React.FC<MultimodalTelemetryPanelProps> = ({
  telemetry,
  onInjectProbe,
  probeRequested = false,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'logs' | 'metrics' | 'traces' | 'deploy'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN'>('ALL');

  const filteredLogs = telemetry.logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      levelFilter === 'ALL' ||
      (levelFilter === 'ERROR' && (log.level === 'ERROR' || log.level === 'FATAL')) ||
      (levelFilter === 'WARN' && log.level === 'WARN');
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col h-full">
      {/* Subheader & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">
            Multimodal Telemetry Engine
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">
            {telemetry.logs.length} logs · {telemetry.metrics.length} metrics · {telemetry.traces.length} spans
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'timeline' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chronological Timeline
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'logs' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs ({telemetry.logs.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'metrics' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Metrics ({telemetry.metrics.length})
          </button>
          <button
            onClick={() => setActiveTab('traces')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'traces' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Traces ({telemetry.traces.length})
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'deploy' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deploy Diff
          </button>
        </div>
      </div>

      {/* Insufficient Evidence Warning Banner */}
      {probeRequested && onInjectProbe && (
        <div className="mb-3 p-3 bg-amber-950/40 border border-amber-600/70 rounded flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <strong className="font-semibold">Insufficient Evidence Loop Detected:</strong> Telemetry confidence &lt; 0.75 or &lt; 2 evidence artifacts. Verification Agent is requesting automated kernel eBPF probe.
            </div>
          </div>
          <button
            onClick={onInjectProbe}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded shadow transition-colors whitespace-nowrap"
          >
            Dispatch eBPF Probe
          </button>
        </div>
      )}

      {/* Tab 1: Chronological Timeline */}
      {activeTab === 'timeline' && (
        <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1 scrollbar-thin">
          {/* Collect and sort events */}
          {(() => {
            const allEvents = [
              ...telemetry.logs.map((l) => ({ type: 'log', time: l.timestamp, data: l })),
              ...telemetry.metrics.map((m) => ({ type: 'metric', time: m.timestamp, data: m })),
              ...telemetry.traces.map((t) => ({ type: 'trace', time: t.timestamp, data: t })),
            ].sort((a, b) => a.time - b.time);

            return allEvents.map((event, idx) => {
              if (event.type === 'log') {
                const log = event.data as LogEntry;
                const isError = log.level === 'ERROR' || log.level === 'FATAL';
                return (
                  <div
                    key={`ev-log-${log.id}-${idx}`}
                    className={`p-2.5 rounded border text-xs font-mono transition-colors ${
                      isError
                        ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            isError ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          [{log.level}]
                        </span>
                        <span className="text-slate-300">{log.service}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        t+{idx * 2}s · ts:{log.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-200">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-1 text-[10px] text-slate-400 bg-slate-900/70 p-1.5 rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              } else if (event.type === 'metric') {
                const m = event.data as MetricEntry;
                const breached = m.threshold !== undefined && m.value >= m.threshold;
                return (
                  <div
                    key={`ev-m-${m.id}-${idx}`}
                    className={`p-2.5 rounded border text-xs font-mono transition-colors ${
                      breached
                        ? 'bg-amber-950/20 border-amber-900/60 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                      <span className="font-bold text-cyan-400">[METRIC] {m.service}</span>
                      <span className="text-[10px] text-slate-500">t+{idx * 2}s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">{m.metric}:</span>
                      <span className="font-bold text-slate-100">
                        {m.value} {m.unit}
                        {m.threshold !== undefined && (
                          <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                            (alert limit: {m.threshold})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              } else {
                const t = event.data as TraceSpan;
                const isError = t.status === 'error';
                return (
                  <div
                    key={`ev-tr-${t.id}-${idx}`}
                    className={`p-2.5 rounded border text-xs font-mono transition-colors ${
                      isError
                        ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                      <span className="font-bold text-purple-400">[TRACE] {t.service}</span>
                      <span className="text-rose-400 font-semibold">{t.duration_ms}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">{t.span}</span>
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded ${
                          isError ? 'bg-rose-900/50 text-rose-300' : 'bg-emerald-900/50 text-emerald-300'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    {t.errorMessage && (
                      <p className="mt-1 text-[11px] text-rose-300">{t.errorMessage}</p>
                    )}
                  </div>
                );
              }
            });
          })()}
        </div>
      )}

      {/* Tab 2: Logs */}
      {activeTab === 'logs' && (
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs by keyword or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">Errors Only</option>
              <option value="WARN">Warnings Only</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1 scrollbar-thin">
            {filteredLogs.map((log) => {
              const isError = log.level === 'ERROR' || log.level === 'FATAL';
              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded border text-xs font-mono ${
                    isError
                      ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <div className="flex items-center gap-2">
                      <span className={isError ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                        {log.level}
                      </span>
                      <span className="text-slate-400 font-semibold">{log.service}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp * 1000).toISOString().substr(11, 8)}
                    </span>
                  </div>
                  <p className="text-slate-200 select-text">{log.message}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="mt-1 text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Metrics */}
      {activeTab === 'metrics' && (
        <div className="flex-1 overflow-y-auto max-h-[460px] grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 scrollbar-thin">
          {telemetry.metrics.map((m) => {
            const breached = m.threshold !== undefined && m.value >= m.threshold;
            return (
              <div
                key={m.id}
                className={`p-3 rounded border flex flex-col justify-between ${
                  breached
                    ? 'bg-rose-950/20 border-rose-800/80'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono text-cyan-400">{m.service}</span>
                    {breached && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                        THRESHOLD BREACHED
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">{m.metric}</h4>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-bold font-mono text-white">
                      {m.value}{' '}
                      <span className="text-xs font-normal text-slate-400">{m.unit}</span>
                    </span>
                    {m.threshold !== undefined && (
                      <span className="text-xs text-slate-400 font-mono">
                        threshold: {m.threshold} {m.unit}
                      </span>
                    )}
                  </div>

                  {/* Sparkline simulation */}
                  {m.historical && (
                    <div className="flex items-end gap-1 h-8 pt-1">
                      {m.historical.map((val, hIdx) => {
                        const maxVal = Math.max(...(m.historical || [100]));
                        const heightPercent = Math.max(15, Math.min(100, (val / (maxVal || 1)) * 100));
                        return (
                          <div
                            key={hIdx}
                            style={{ height: `${heightPercent}%` }}
                            className={`flex-1 rounded-xs transition-all ${
                              hIdx === m.historical!.length - 1
                                ? breached
                                  ? 'bg-rose-500'
                                  : 'bg-cyan-500'
                                : 'bg-slate-700'
                            }`}
                            title={`Point ${hIdx}: ${val}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Traces (Waterfall) */}
      {activeTab === 'traces' && (
        <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1 scrollbar-thin">
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span>Trace Waterfall & Span Latency (Distributed Call Tree)</span>
            <span className="text-[11px] font-mono text-slate-500">
              Trace ID: {telemetry.traces[0]?.traceId || 'N/A'}
            </span>
          </div>

          {telemetry.traces.length === 0 ? (
            <div className="text-xs text-slate-500 p-8 text-center bg-slate-950/40 rounded border border-dashed border-slate-800">
              No distributed trace spans captured in current telemetry window.
            </div>
          ) : (
            telemetry.traces.map((trace, idx) => {
              const maxDuration = Math.max(...telemetry.traces.map((t) => t.duration_ms), 1000);
              const barWidthPercent = Math.max(10, Math.min(100, (trace.duration_ms / maxDuration) * 100));
              const isChild = !!trace.parentSpan;

              return (
                <div
                  key={trace.id}
                  className={`p-2.5 rounded border text-xs font-mono ${
                    trace.status === 'error'
                      ? 'bg-rose-950/20 border-rose-900/60'
                      : 'bg-slate-950/60 border-slate-800'
                  } ${isChild ? 'ml-4' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-200 truncate">
                        {trace.span}
                      </span>
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                        {trace.service}
                      </span>
                    </div>
                    <span
                      className={`font-bold tabular-nums ${
                        trace.duration_ms > 2000 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {trace.duration_ms}ms
                    </span>
                  </div>

                  {/* Latency bar */}
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden mb-1">
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className={`h-full rounded ${
                        trace.status === 'error' ? 'bg-rose-500' : 'bg-cyan-500'
                      }`}
                    />
                  </div>

                  {trace.errorMessage && (
                    <div className="text-[11px] text-rose-300 mt-1">
                      Error: {trace.errorMessage}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 5: Deploy Diff */}
      {activeTab === 'deploy' && (
        <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-3 scrollbar-thin">
          <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Deployed Service:</span>
              <span className="font-bold text-slate-200 font-mono">
                {telemetry.deployment_metadata.service} ({telemetry.deployment_metadata.version})
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Commit Hash / Author:</span>
              <span className="font-mono text-cyan-400">
                {telemetry.deployment_metadata.commitHash} · {telemetry.deployment_metadata.author}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Deployed Ago:</span>
              <span className="font-mono text-slate-300">
                {telemetry.deployment_metadata.deployed_ago_min} minutes ago
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-1">Commit Message:</span>
              <p className="font-mono text-slate-200 bg-slate-900 p-2 rounded">
                {telemetry.deployment_metadata.commitMessage}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 block mb-1">Causal Diff Summary:</span>
            <div className="bg-slate-900 p-2.5 rounded text-amber-300">
              {telemetry.deployment_metadata.diffSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
