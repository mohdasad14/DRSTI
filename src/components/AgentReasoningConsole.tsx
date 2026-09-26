import React, { useState } from 'react';
import { AgentLogMessage } from '../types/incident';
import {
  Terminal,
  Cpu,
  Shield,
  Search,
  Wrench,
  CheckCircle,
  Copy,
  Check,
  Trash2
} from 'lucide-react';

interface AgentReasoningConsoleProps {
  logs: AgentLogMessage[];
  onClearLogs?: () => void;
}

export const AgentReasoningConsole: React.FC<AgentReasoningConsoleProps> = ({
  logs,
  onClearLogs,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const filtered = selectedAgent === 'ALL'
    ? logs
    : logs.filter((l) => l.agent === selectedAgent);

  const getAgentColor = (agent: AgentLogMessage['agent']) => {
    switch (agent) {
      case 'Orchestrator':
        return 'text-cyan-400 border-cyan-800/80 bg-cyan-950/30';
      case 'CausalDiscovery':
        return 'text-purple-400 border-purple-800/80 bg-purple-950/30';
      case 'Verification':
      case 'VerificationAgent':
        return 'text-amber-400 border-amber-800/80 bg-amber-950/30';
      case 'RemediationPlanner':
        return 'text-blue-400 border-blue-800/80 bg-blue-950/30';
      case 'SandboxEngine':
        return 'text-emerald-400 border-emerald-800/80 bg-emerald-950/30';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
  };

  const getAgentIcon = (agent: AgentLogMessage['agent']) => {
    switch (agent) {
      case 'Orchestrator':
        return Cpu;
      case 'CausalDiscovery':
        return Search;
      case 'Verification':
        return Shield;
      case 'RemediationPlanner':
        return Wrench;
      case 'SandboxEngine':
        return Terminal;
      default:
        return Terminal;
    }
  };

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toISOString()}] [${l.agent}] ${l.message} ${l.detail || ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Multi-Agent Diagnostic & Execution Console
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sub-Agents</option>
            <option value="Orchestrator">Orchestrator</option>
            <option value="CausalDiscovery">Causal Discovery</option>
            <option value="Verification">Verification Agent</option>
            <option value="RemediationPlanner">Remediation Planner</option>
            <option value="SandboxEngine">Sandbox Engine</option>
          </select>

          <button
            onClick={handleCopy}
            title="Copy audit log"
            className="p-1 text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              title="Clear log console"
              className="p-1 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1 font-mono text-xs scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="text-slate-500 text-center py-12">
            No agent reasoning events dispatched yet. Click "Run Agents" or "Step" to begin.
          </div>
        ) : (
          filtered.map((log) => {
            const Icon = getAgentIcon(log.agent);
            const agentStyle = getAgentColor(log.agent);

            return (
              <div
                key={log.id}
                className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${agentStyle}`}
                    >
                      <Icon className="w-3 h-3" />
                      {log.agent}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold ${
                      log.level === 'error'
                        ? 'text-rose-400'
                        : log.level === 'warn'
                        ? 'text-amber-400'
                        : log.level === 'success'
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {log.level.toUpperCase()}
                  </span>
                </div>

                <p className="text-slate-200 select-text leading-relaxed">
                  {log.message}
                </p>

                {log.detail && (
                  <pre className="mt-1.5 p-2 rounded bg-slate-900/90 text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                    {log.detail}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
