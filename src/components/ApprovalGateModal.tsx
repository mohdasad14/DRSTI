import React, { useState } from 'react';
import { RemediationAction, Hypothesis } from '../types/incident';
import {
  ShieldAlert,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Undo2,
  FileCode,
  Lock,
  Cpu
} from 'lucide-react';

interface ApprovalGateModalProps {
  action: RemediationAction;
  hypothesis?: Hypothesis | null;
  onApprove: (operator: string) => void;
  onReject: () => void;
  onSimulateSandbox: () => { passed: boolean; output: string; telemetryDelta: string };
  onRollback: () => void;
  isOpen: boolean;
  onClose: () => void;
  executionStatus?: 'idle' | 'sandbox_tested' | 'executed' | 'rolled_back';
}

export const ApprovalGateModal: React.FC<ApprovalGateModalProps> = ({
  action,
  hypothesis,
  onApprove,
  onReject,
  onSimulateSandbox,
  onRollback,
  isOpen,
  onClose,
  executionStatus = 'idle',
}) => {
  const [operatorName, setOperatorName] = useState('sre-lead-operator');
  const [sandboxLog, setSandboxLog] = useState<string | null>(null);
  const [sandboxPassed, setSandboxPassed] = useState<boolean | null>(null);
  const [telemetryDelta, setTelemetryDelta] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleRunSandbox = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = onSimulateSandbox();
      setSandboxPassed(res.passed);
      setSandboxLog(res.output);
      setTelemetryDelta(res.telemetryDelta);
      setIsSimulating(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0b0b0e] border border-[#24242c] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1c1c22] flex items-center justify-between bg-[#0e0e12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Mandatory Human-in-the-Loop Approval Gate
                <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-semibold">
                  RISK: HIGH
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Action requires human operator authorization before modifying production workloads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Action Spec Card */}
          <div className="bg-[#101015] p-3.5 rounded-lg border border-[#202028] space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Target Microservice:</span>
              <span className="font-mono text-blue-400 font-semibold">{action.target_service}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Action Identifier:</span>
              <span className="font-mono text-zinc-300">{action.action_id}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Isolated Root Cause:</span>
              <span className="text-zinc-200 font-medium text-right max-w-xs truncate">
                {hypothesis?.root_cause || 'Service Degradation'}
              </span>
            </div>
          </div>

          {/* Commands block */}
          <div className="space-y-2">
            <div>
              <span className="text-zinc-400 block mb-1 font-medium">
                Production Execution Command:
              </span>
              <div className="bg-[#09090c] p-2.5 rounded-lg font-mono text-blue-300 border border-[#202028] flex items-center justify-between">
                <code>{action.command}</code>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 block mb-1 font-medium">
                Reversible Rollback Command (Safety Guarantee):
              </span>
              <div className="bg-[#09090c] p-2.5 rounded-lg font-mono text-amber-300 border border-[#202028] flex items-center justify-between">
                <code>{action.rollback_command}</code>
              </div>
            </div>
          </div>

          {/* Policy Guardrails */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#101015] p-2.5 rounded-lg border border-[#202028]">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">eBPF Kernel Trace</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
              </span>
            </div>
            <div className="bg-[#101015] p-2.5 rounded-lg border border-[#202028]">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">OPA Gatekeeper</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
              </span>
            </div>
            <div className="bg-[#101015] p-2.5 rounded-lg border border-[#202028]">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">Data Loss Risk</span>
              <span className="text-zinc-300 font-semibold flex items-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> NONE
              </span>
            </div>
          </div>

          {/* Digital Twin Validation Playground */}
          <div className="bg-[#101015] p-3 rounded-lg border border-[#202028] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-zinc-200">
                  Digital Twin Ephemeral Sandbox
                </span>
              </div>
              <button
                onClick={handleRunSandbox}
                disabled={isSimulating}
                className="px-2.5 py-1 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 rounded-md transition-colors flex items-center gap-1 font-mono text-[11px]"
              >
                <Play className="w-3 h-3 fill-current" />
                {isSimulating ? 'Validating Twin...' : 'Simulate in Sandbox'}
              </button>
            </div>

            {sandboxLog ? (
              <div className="space-y-1.5 mt-2">
                <pre className="p-2.5 bg-[#09090c] text-zinc-300 font-mono text-[11px] rounded-lg overflow-x-auto whitespace-pre-wrap border border-[#1e1e24]">
                  {sandboxLog}
                </pre>
                {telemetryDelta && (
                  <div className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                    Predicted Telemetry Delta: {telemetryDelta}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-500 text-[11px]">
                Dry-run this playbook in a non-disruptive sandbox clone to observe telemetry deltas before authorizing production rollout.
              </p>
            )}
          </div>

          {/* Operator Signature */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-zinc-400 whitespace-nowrap">Operator Identity:</span>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="bg-[#09090c] border border-[#222228] rounded-lg px-2.5 py-1.5 text-zinc-200 font-mono w-full focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1c1c22] bg-[#0e0e12] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onReject}
              className="px-3 py-1.5 rounded-lg border border-[#282830] text-zinc-300 hover:bg-[#181820] transition-colors w-full sm:w-auto"
            >
              Reject / Abort
            </button>
            <button
              onClick={onRollback}
              title="Test rollback trigger"
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto text-xs font-medium"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Simulate Rollback
            </button>
          </div>

          <button
            onClick={() => onApprove(operatorName)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm shadow-blue-900/30 flex items-center justify-center gap-1.5 w-full sm:w-auto text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Authorize Production Execution
          </button>
        </div>
      </div>
    </div>
  );
};
