import React, { useState } from 'react';
import { IncidentScenario, Hypothesis, RemediationAction } from '../types/incident';
import { generateIncidentPdfReport } from '../utils/generatePdfReport';
import { FileDown, Check, Loader2 } from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const rootCause = hypothesis?.root_cause || scenario.groundTruthCause || 'PostgreSQL connection pool exhaustion';
  const impact = scenario.impactSummary || 'Checkout requests returning HTTP 504';
  const affectedServices = (scenario.affectedServicesList || ['api-gateway', 'order-service', 'PostgreSQL']).join(', ');
  const confidence = hypothesis ? Math.round(hypothesis.confidence * 100) : 92;

  const recommendedAction =
    plan?.description ||
    'Increase connection pool capacity and restart affected service.';

  const handleDownloadPdf = () => {
    try {
      setIsGenerating(true);
      setTimeout(() => {
        generateIncidentPdfReport({ scenario, hypothesis, plan });
        setIsGenerating(false);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 3000);
      }, 400);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        {/* Header with Title, Confidence badge, and Download PDF Report button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#1c1c22] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Incident Summary
            </h3>
            <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {confidence}% Confidence
            </span>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            title="Export root cause, blast radius, and remediation metadata as formatted PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14141a] hover:bg-[#1b1b24] text-zinc-200 border border-[#24242e] hover:border-[#333340] text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-60 shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Exporting PDF...</span>
              </>
            ) : downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Report Downloaded</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-blue-400" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
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
          <div className="p-2 rounded bg-[#09090c] border border-[#1e1e24] font-mono text-[11px] text-zinc-400 truncate flex items-center justify-between">
            <span className="truncate">
              <span className="text-blue-400">cmd: </span>
              {plan.command}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
