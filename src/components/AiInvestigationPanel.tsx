import React, { useState } from 'react';
import { IncidentState, Hypothesis, AgentLogMessage } from '../types/incident';
import { Check, ChevronDown, ChevronUp, Bot, Sparkles } from 'lucide-react';

interface AiInvestigationPanelProps {
  currentState: IncidentState;
  hypothesis?: Hypothesis | null;
  logs: AgentLogMessage[];
  onOpenGemini?: () => void;
  aiAvailable?: boolean;
}

export const AiInvestigationPanel: React.FC<AiInvestigationPanelProps> = ({
  currentState,
  hypothesis,
  logs,
  onOpenGemini,
  aiAvailable,
}) => {
  const [showActivity, setShowActivity] = useState(false);

  // Compute status items based on state
  const isCorrelatingOrLater = currentState !== 'DETECTED';
  const isInvestigatingOrLater =
    currentState !== 'DETECTED' && currentState !== 'CORRELATING';
  const isPlanningOrLater =
    isInvestigatingOrLater &&
    currentState !== 'INVESTIGATING' &&
    currentState !== 'INSUFFICIENT_EVIDENCE';
  const isExecutingOrLater =
    isPlanningOrLater &&
    currentState !== 'PLANNING_REMEDIATION' &&
    currentState !== 'PENDING_APPROVAL';
  const isResolved = currentState === 'RESOLVED';

  const statusItems = [
    {
      id: 'telemetry',
      label: 'Telemetry analyzed',
      status: isCorrelatingOrLater ? 'completed' : 'in_progress',
    },
    {
      id: 'correlation',
      label: 'Related events correlated',
      status: isInvestigatingOrLater
        ? 'completed'
        : currentState === 'CORRELATING'
        ? 'in_progress'
        : 'pending',
    },
    {
      id: 'root_cause',
      label: 'Investigating root cause',
      status: isPlanningOrLater
        ? 'completed'
        : currentState === 'INVESTIGATING' || currentState === 'INSUFFICIENT_EVIDENCE'
        ? 'in_progress'
        : 'pending',
    },
    {
      id: 'remediation',
      label: isResolved
        ? 'Remediation completed & verified'
        : isExecutingOrLater
        ? 'Remediation executing'
        : isPlanningOrLater
        ? 'Remediation plan ready'
        : 'Remediation plan pending',
      status: isResolved
        ? 'completed'
        : isExecutingOrLater || isPlanningOrLater
        ? 'in_progress'
        : 'pending',
    },
  ];

  // Most recent 4 agent logs for clean summary
  const recentLogs = logs.slice(0, 4);

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c1c22] pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              AI Investigation
            </h2>
          </div>

          {hypothesis && (
            <span className="text-[11px] font-mono text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {Math.round(hypothesis.confidence * 100)}% Confidence
            </span>
          )}
        </div>

        {/* 4 Clean Checklist Items */}
        <div className="space-y-3 py-1">
          {statusItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-xs">
              {item.status === 'completed' ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              ) : item.status === 'in_progress' ? (
                <div className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-zinc-700 text-zinc-600 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </div>
              )}

              <span
                className={`font-medium ${
                  item.status === 'completed'
                    ? 'text-zinc-200'
                    : item.status === 'in_progress'
                    ? 'text-blue-400 font-semibold'
                    : 'text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Isolated Root Cause Callout if available */}
        {hypothesis && (
          <div className="p-3 rounded-lg bg-[#111116] border border-[#22222a] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Suspected Root Cause
            </span>
            <p className="text-xs text-zinc-200 font-medium leading-relaxed">
              {hypothesis.root_cause}
            </p>
          </div>
        )}
      </div>

      {/* Expandable: Agent Activity */}
      <div className="border-t border-[#1c1c22] pt-3">
        <button
          onClick={() => setShowActivity(!showActivity)}
          className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 py-1 transition-colors"
        >
          <span className="font-semibold text-zinc-300">Agent Activity</span>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="text-[11px] font-mono">{logs.length} events</span>
            {showActivity ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {showActivity && (
          <div className="mt-2.5 pt-2 border-t border-[#19191f] space-y-2 max-h-48 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-[11px] text-zinc-500">No agent actions recorded yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-[#0f0f13] border border-[#1e1e24] text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span className="text-blue-400 font-semibold">{log.agent}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {log.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
