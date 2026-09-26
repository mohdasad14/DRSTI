import React from 'react';
import {
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  FastForward,
  Cpu
} from 'lucide-react';
import { IncidentScenario } from '../types/incident';

interface TopNavigationProps {
  currentScenario: IncidentScenario;
  onSelectScenario: (scenario: IncidentScenario) => void;
  scenarios: IncidentScenario[];
  activeTab: 'studio' | 'topology' | 'telemetry' | 'sandbox' | 'benchmarks' | 'injector';
  setActiveTab: (tab: 'studio' | 'topology' | 'telemetry' | 'sandbox' | 'benchmarks' | 'injector') => void;
  onRunAuto: () => void;
  onStepNext: () => void;
  onReset: () => void;
  isRunning: boolean;
  canStep: boolean;
  onOpenGeminiModal: () => void;
  aiAvailable: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentScenario,
  onSelectScenario,
  scenarios,
  activeTab,
  setActiveTab,
  onRunAuto,
  onStepNext,
  onReset,
  isRunning,
  canStep,
  onOpenGeminiModal,
  aiAvailable,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                AegisSRE
                <span className="text-xs font-normal text-slate-400 border border-slate-700/60 rounded px-1.5 py-0.2">
                  Multi-Agent Engine
                </span>
              </span>
            </div>
          </div>

          {/* Scenario Selector Dropdown */}
          <div className="relative">
            <select
              value={currentScenario.id}
              onChange={(e) => {
                const found = scenarios.find((s) => s.id === e.target.value);
                if (found) onSelectScenario(found);
              }}
              className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 pr-7 font-mono truncate max-w-[210px] md:max-w-[280px]"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.severity}] {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: Navigation Views */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Studio
          </button>
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'topology'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Causal Graph
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multimodal Data
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Digital Twin & Ledger
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'benchmarks'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evaluation Benchmark
          </button>
          <button
            onClick={() => setActiveTab('injector')}
            className={`px-3 py-1.5 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'injector'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetry Lab
          </button>
        </nav>

        {/* Zone 3: Execution Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onRunAuto}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none rounded transition-colors shadow-sm shadow-cyan-600/30 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Running Pipeline...' : 'Run Agents'}
          </button>

          <button
            onClick={onStepNext}
            disabled={isRunning || !canStep}
            title="Step through one FSM agent cycle"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none rounded border border-slate-700 transition-colors whitespace-nowrap"
          >
            <FastForward className="w-3.5 h-3.5" />
            Step
          </button>

          <button
            onClick={onReset}
            title="Reset incident state"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenGeminiModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 rounded border border-purple-800/60 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Co-Pilot</span>
            {aiAvailable && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Gemini 3.8 Connected" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
