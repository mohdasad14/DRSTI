import React from 'react';
import { IncidentScenario, IncidentState } from '../types/incident';
import { AlertCircle, ChevronRight, Check } from 'lucide-react';

interface ActiveIncidentBannerProps {
  scenario: IncidentScenario;
  currentState: IncidentState;
}

const LIFECYCLE_STEPS = [
  { id: 'DETECTED', label: 'Detected' },
  { id: 'CORRELATING', label: 'Correlating' },
  { id: 'INVESTIGATING', label: 'Investigating' },
  { id: 'PLANNING_REMEDIATION', label: 'Planning' },
  { id: 'EXECUTING', label: 'Executing' },
  { id: 'VERIFYING', label: 'Verifying' },
  { id: 'RESOLVED', label: 'Resolved' },
];

export const ActiveIncidentBanner: React.FC<ActiveIncidentBannerProps> = ({
  scenario,
  currentState,
}) => {
  // Map currentState to step index
  const getStepIndex = (state: IncidentState): number => {
    switch (state) {
      case 'DETECTED':
        return 0;
      case 'CORRELATING':
        return 1;
      case 'INVESTIGATING':
      case 'INSUFFICIENT_EVIDENCE':
        return 2;
      case 'PLANNING_REMEDIATION':
      case 'PENDING_APPROVAL':
        return 3;
      case 'EXECUTING':
        return 4;
      case 'VERIFYING':
        return 5;
      case 'RESOLVED':
      case 'ROLLED_BACK':
        return 6;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(currentState);

  const getStatusDisplay = (state: IncidentState): string => {
    switch (state) {
      case 'DETECTED':
        return 'Detected';
      case 'CORRELATING':
        return 'Correlating';
      case 'INVESTIGATING':
        return 'Investigating';
      case 'INSUFFICIENT_EVIDENCE':
        return 'Evidence Required';
      case 'PLANNING_REMEDIATION':
        return 'Planning Remediation';
      case 'PENDING_APPROVAL':
        return 'Awaiting Approval';
      case 'EXECUTING':
        return 'Executing';
      case 'VERIFYING':
        return 'Verifying Health';
      case 'RESOLVED':
        return 'Resolved';
      case 'ROLLED_BACK':
        return 'Rolled Back';
      default:
        return state;
    }
  };

  const incidentCode = scenario.incidentCode || 'INC-1042';
  const incidentTitle = scenario.shortTitle || scenario.title;
  const detectedTime = scenario.detectedTime || '14:32:01';
  const affectedService = scenario.groundTruthOriginService || 'order-service';

  return (
    <section className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Row: Incident Header & Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Code, Title, Severity */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-zinc-400">
              {incidentCode}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wide">
              {scenario.severity === 'P1' ? 'CRITICAL' : scenario.severity === 'P2' ? 'HIGH' : 'ELEVATED'}
            </span>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            {incidentTitle}
          </h1>
        </div>

        {/* Right: Key Facts */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div>
            <span className="text-zinc-500 block text-[11px]">Affected Service:</span>
            <span className="font-mono font-medium text-zinc-200">{affectedService}</span>
          </div>

          <div className="border-l border-[#24242a] pl-6">
            <span className="text-zinc-500 block text-[11px]">Detected:</span>
            <span className="font-mono font-medium text-zinc-200">{detectedTime}</span>
          </div>

          <div className="border-l border-[#24242a] pl-6">
            <span className="text-zinc-500 block text-[11px]">Status:</span>
            <span
              className={`font-medium ${
                currentState === 'RESOLVED'
                  ? 'text-emerald-400'
                  : currentState === 'PENDING_APPROVAL' || currentState === 'INSUFFICIENT_EVIDENCE'
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {getStatusDisplay(currentState)}
            </span>
          </div>
        </div>
      </div>

      {/* Incident Progress Indicator */}
      <div className="pt-3 border-t border-[#1a1a20]">
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCurrent = idx === currentStepIdx;
            const isCompleted = idx < currentStepIdx;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                      isCurrent
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                        : isCompleted
                        ? 'text-zinc-400 font-medium'
                        : 'text-zinc-600 font-normal'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
                    )}
                    <span>{step.label}</span>
                  </div>
                </div>

                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <span className="text-zinc-700 text-xs px-1 select-none">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
