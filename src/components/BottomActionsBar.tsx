import React from 'react';
import { IncidentState } from '../types/incident';
import { CheckCircle2, Search, ShieldCheck, Check, RotateCcw } from 'lucide-react';

interface BottomActionsBarProps {
  currentState: IncidentState;
  onAcknowledge: () => void;
  onInvestigate: () => void;
  onApproveRemediation: () => void;
  onResolve: () => void;
  onReset: () => void;
  isHighRisk?: boolean;
}

export const BottomActionsBar: React.FC<BottomActionsBarProps> = ({
  currentState,
  onAcknowledge,
  onInvestigate,
  onApproveRemediation,
  onResolve,
  onReset,
  isHighRisk = true,
}) => {
  // Determine enabled states
  const canAcknowledge = currentState === 'DETECTED';
  const canInvestigate =
    currentState === 'CORRELATING' || currentState === 'INVESTIGATING';
  const canApprove =
    currentState === 'PLANNING_REMEDIATION' ||
    currentState === 'PENDING_APPROVAL';
  const canResolve =
    currentState === 'EXECUTING' || currentState === 'VERIFYING';
  const isResolved = currentState === 'RESOLVED';

  return (
    <footer className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Current State Summary Pill */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="text-zinc-500 font-mono">Workflow Status:</span>
        <span
          className={`font-semibold font-mono px-2 py-0.5 rounded text-[11px] ${
            isResolved
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : canApprove
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {currentState}
        </span>
      </div>

      {/* 4 Clean Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Acknowledge Button */}
        <button
          onClick={onAcknowledge}
          disabled={!canAcknowledge}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            canAcknowledge
              ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 active:scale-95 shadow-sm'
              : 'bg-[#121216] text-zinc-600 border border-[#1c1c20] cursor-not-allowed'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Acknowledge</span>
        </button>

        {/* Investigate Button */}
        <button
          onClick={onInvestigate}
          disabled={!canInvestigate}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            canInvestigate
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/30 active:scale-95'
              : 'bg-[#121216] text-zinc-600 border border-[#1c1c20] cursor-not-allowed'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Investigate</span>
        </button>

        {/* Approve Remediation Button */}
        <button
          onClick={onApproveRemediation}
          disabled={!canApprove}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            canApprove
              ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-sm shadow-amber-950/40 active:scale-95'
              : 'bg-[#121216] text-zinc-600 border border-[#1c1c20] cursor-not-allowed'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Approve Remediation</span>
        </button>

        {/* Resolve Button */}
        <button
          onClick={onResolve}
          disabled={!canResolve}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            canResolve
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/30 active:scale-95'
              : isResolved
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
              : 'bg-[#121216] text-zinc-600 border border-[#1c1c20] cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isResolved ? 'Resolved' : 'Resolve'}</span>
        </button>

        {/* Reset Trigger */}
        <button
          onClick={onReset}
          title="Reset incident cycle"
          className="p-2 rounded-lg bg-[#121216] hover:bg-[#181820] border border-[#202026] text-zinc-400 hover:text-zinc-200 transition-colors ml-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
