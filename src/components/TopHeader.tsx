import React, { useState } from 'react';
import { DrstiLogo } from './DrstiLogo';
import { IncidentScenario, IncidentState } from '../types/incident';
import { Play, SkipForward, RotateCcw, Settings, ChevronDown, Check, Sparkles } from 'lucide-react';

interface TopHeaderProps {
  currentScenario: IncidentScenario;
  onSelectScenario: (scenario: IncidentScenario) => void;
  scenarios: IncidentScenario[];
  onRunAuto: () => void;
  onStepNext: () => void;
  onReset: () => void;
  isRunning: boolean;
  canStep: boolean;
  currentState: IncidentState;
  onOpenGeminiModal: () => void;
  aiAvailable: boolean;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentScenario,
  onSelectScenario,
  scenarios,
  onRunAuto,
  onStepNext,
  onReset,
  isRunning,
  canStep,
  currentState,
  onOpenGeminiModal,
  aiAvailable,
  onOpenSettings,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-[#08080a] border-b border-[#1c1c20] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand: Logo + Title + Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-[#111114] border border-[#222228]">
          <DrstiLogo size={24} className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white font-sans">DRSTI</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              v2.4
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-normal">
            Real-Time Intelligent Incident Detection &amp; Response
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* System Online Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#111114] border border-[#202024] text-xs text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-[11px] text-zinc-300">System Online</span>
        </div>

        {/* Incident Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111114] hover:bg-[#16161a] border border-[#222228] text-xs text-zinc-200 font-medium transition-colors"
          >
            <span className="text-blue-400 font-mono font-semibold">
              {currentScenario.incidentCode || 'INC-1042'}
            </span>
            <span className="hidden md:inline text-zinc-300 truncate max-w-[160px]">
              {currentScenario.shortTitle || currentScenario.title}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-[#101014] border border-[#24242a] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-[#1c1c22]">
                Select Incident Scenario
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {scenarios.map((sc) => {
                  const isSelected = sc.id === currentScenario.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        onSelectScenario(sc);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-600/10 text-white'
                          : 'text-zinc-300 hover:bg-[#17171d] hover:text-white'
                      }`}
                    >
                      <span className="font-mono text-blue-400 font-bold shrink-0 mt-0.5">
                        {sc.incidentCode || sc.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{sc.shortTitle || sc.title}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{sc.groundTruthOriginService}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Run Agents Button (Electric Blue) */}
        <button
          onClick={onRunAuto}
          disabled={isRunning || currentState === 'RESOLVED'}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
            isRunning
              ? 'bg-blue-700/60 text-blue-200 cursor-not-allowed'
              : currentState === 'RESOLVED'
              ? 'bg-[#18181c] text-zinc-500 border border-[#242428] cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-900/20'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'Running Agents...' : 'Run Agents'}</span>
        </button>

        {/* Step Lifecycle Button */}
        {canStep && (
          <button
            onClick={onStepNext}
            title="Step through one FSM lifecycle cycle"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111114] hover:bg-[#17171c] border border-[#222228] text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5 text-zinc-400" />
            <span>Step</span>
          </button>
        )}

        {/* Reset / Restart */}
        <button
          onClick={onReset}
          title="Reset incident state"
          className="p-1.5 rounded-lg bg-[#111114] hover:bg-[#17171c] border border-[#222228] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Settings / Gemini Modal Trigger */}
        <button
          onClick={onOpenSettings}
          title="DRSTI Platform Settings & Diagnostics"
          className="p-1.5 rounded-lg bg-[#111114] hover:bg-[#17171c] border border-[#222228] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
