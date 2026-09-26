import React from 'react';
import { IncidentState } from '../types/incident';
import {
  AlertTriangle,
  GitMerge,
  Search,
  HelpCircle,
  Wrench,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  Undo2,
  Clock
} from 'lucide-react';

interface PipelineLifecycleProps {
  currentState: IncidentState;
  elapsedTimeMs: number;
  onIntervene?: (targetState: IncidentState) => void;
}

const STATES_ORDER: Array<{
  state: IncidentState;
  label: string;
  agent: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    state: 'DETECTED',
    label: 'Detected',
    agent: 'Ingestion Engine',
    icon: AlertTriangle,
    description: 'Telemetry ingest & anomaly trip',
  },
  {
    state: 'CORRELATING',
    label: 'Correlating',
    agent: 'Ingestion Engine',
    icon: GitMerge,
    description: 'Chronological event timeline',
  },
  {
    state: 'INVESTIGATING',
    label: 'Investigating',
    agent: 'Causal Discovery Agent',
    icon: Search,
    description: 'Causal graph & origin isolation',
  },
  {
    state: 'INSUFFICIENT_EVIDENCE',
    label: 'Insufficiency Loop',
    agent: 'Verification Agent',
    icon: HelpCircle,
    description: 'Evidence < threshold (probe needed)',
  },
  {
    state: 'PLANNING_REMEDIATION',
    label: 'Planning',
    agent: 'Remediation Planner',
    icon: Wrench,
    description: 'Playbook synthesis & rollback spec',
  },
  {
    state: 'PENDING_APPROVAL',
    label: 'Approval Gate',
    agent: 'Human-in-the-Loop',
    icon: ShieldAlert,
    description: 'High-risk verification gate',
  },
  {
    state: 'EXECUTING',
    label: 'Executing',
    agent: 'Sandbox Engine',
    icon: Terminal,
    description: 'Digital twin & prod execution',
  },
  {
    state: 'VERIFYING',
    label: 'Verifying',
    agent: 'Verification Agent',
    icon: CheckCircle2,
    description: 'Post-action telemetry delta check',
  },
  {
    state: 'RESOLVED',
    label: 'Resolved',
    agent: 'Orchestrator',
    icon: CheckCircle2,
    description: 'SLI recovered & incident closed',
  },
  {
    state: 'ROLLED_BACK',
    label: 'Rolled Back',
    agent: 'Sandbox Engine',
    icon: Undo2,
    description: 'Reversible rollback dispatched',
  },
];

export const PipelineLifecycle: React.FC<PipelineLifecycleProps> = ({
  currentState,
  elapsedTimeMs,
}) => {
  const currentIndex = STATES_ORDER.findIndex((s) => s.state === currentState);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 lg:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Agent Lifecycle FSM State
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs font-mono text-cyan-400">
            {currentState}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>MTTD/MTTR Clock: {(elapsedTimeMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center min-w-[850px] gap-2">
          {STATES_ORDER.map((item, index) => {
            const isCurrent = item.state === currentState;
            const isCompleted =
              currentIndex > index && currentState !== 'ROLLED_BACK';
            const isRolledBackState =
              currentState === 'ROLLED_BACK' && item.state === 'ROLLED_BACK';
            const isInsufficientState =
              currentState === 'INSUFFICIENT_EVIDENCE' && item.state === 'INSUFFICIENT_EVIDENCE';

            let pillStyle = 'bg-slate-950/70 border-slate-800 text-slate-500';
            let iconColor = 'text-slate-600';

            if (isCurrent) {
              if (isRolledBackState) {
                pillStyle = 'bg-amber-950/40 border-amber-500 text-amber-200 ring-1 ring-amber-500/50';
                iconColor = 'text-amber-400';
              } else if (isInsufficientState) {
                pillStyle = 'bg-amber-950/40 border-amber-500 text-amber-200 ring-1 ring-amber-500/50';
                iconColor = 'text-amber-400 animate-pulse';
              } else if (currentState === 'RESOLVED') {
                pillStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50';
                iconColor = 'text-emerald-400';
              } else if (currentState === 'PENDING_APPROVAL') {
                pillStyle = 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50 animate-pulse';
                iconColor = 'text-rose-400';
              } else {
                pillStyle = 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50';
                iconColor = 'text-cyan-400 animate-pulse';
              }
            } else if (isCompleted) {
              pillStyle = 'bg-slate-900 border-slate-700 text-slate-300';
              iconColor = 'text-emerald-400';
            }

            const Icon = item.icon;

            return (
              <React.Fragment key={item.state}>
                <div
                  className={`flex-1 min-w-[100px] flex flex-col p-2 rounded border transition-all ${pillStyle}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      0{index + 1}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                  </div>
                  <span className="text-xs font-semibold truncate">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.agent}
                  </span>
                </div>
                {index < STATES_ORDER.length - 1 && (
                  <div
                    className={`w-3 h-0.5 shrink-0 ${
                      currentIndex > index ? 'bg-emerald-500/70' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
