import React from 'react';
import { IncidentScenario, Hypothesis, RemediationAction } from '../types/incident';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';

interface IncidentSummaryCardProps {
  scenario: IncidentScenario;
  hypothesis?: Hypothesis | null;
  plan?: RemediationAction | null;
}

export const IncidentSummaryCard: React.FC<IncidentSummaryCardProps> = ({
  scenario,
  hypothesis,
  plan,
}) => {
  const rootCause = hypothesis?.root_cause || scenario.groundTruthCause || 'PostgreSQL connection pool exhaustion';
  const impact = scenario.impactSummary || 'Checkout requests returning HTTP 504';
  const affectedServices = (scenario.affectedServicesList || ['api-gateway', 'order-service', 'PostgreSQL']).join(', ');
  const confidence = hypothesis ? Math.round(hypothesis.confidence * 100) : 92;

  const recommendedAction =
    plan?.description ||
    'Increase connection pool capacity and restart affected service.';

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#1c1c22] pb-3 mb-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Incident Summary
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500">Confidence:</span>
            <span className="font-mono font-bold text-emerald-400">{confidence}%</span>
          </div>
        </div>

        {/* Structured 4-item Summary */}
        <div className="space-y-3.5 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Root Cause:
            </span>
            <p className="text-zinc-100 font-medium mt-0.5 leading-relaxed">
              {rootCause}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Impact:
            </span>
            <p className="text-zinc-300 font-normal mt-0.5 leading-relaxed">
              {impact}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Affected Services:
            </span>
            <p className="font-mono text-zinc-300 text-[11px] mt-0.5">
              {affectedServices}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Recommended Action:
            </span>
            <p className="text-blue-300 font-medium mt-0.5 leading-relaxed">
              {recommendedAction}
            </p>
          </div>
        </div>
      </div>

      {plan && (
        <div className="pt-2 border-t border-[#1a1a20]">
          <div className="p-2 rounded bg-[#09090c] border border-[#1e1e24] font-mono text-[11px] text-zinc-400 truncate">
            <span className="text-blue-400">cmd: </span>
            {plan.command}
          </div>
        </div>
      )}
    </div>
  );
};
