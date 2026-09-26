import React, { useState, useMemo } from 'react';
import { IncidentScenario } from '../types/incident';
import { Filter, ArrowUpDown, Search, Check, AlertOctagon, AlertTriangle, Info, RotateCcw } from 'lucide-react';

interface IncidentCatalogViewProps {
  scenarios: IncidentScenario[];
  currentScenarioId: string;
  onSelectScenario: (scenario: IncidentScenario) => void;
  onNavigateToOverview: () => void;
}

export type SeverityFilterType = 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO';
export type SortOptionType = 'severity-desc' | 'severity-asc' | 'code-asc';

export const IncidentCatalogView: React.FC<IncidentCatalogViewProps> = ({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  onNavigateToOverview,
}) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilterType>('ALL');
  const [sortOption, setSortOption] = useState<SortOptionType>('severity-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Map P1 -> CRITICAL, P2 -> WARNING, P3 -> INFO
  const mapSeverityLevel = (sev: string): 'CRITICAL' | 'WARNING' | 'INFO' => {
    if (sev === 'P1') return 'CRITICAL';
    if (sev === 'P2') return 'WARNING';
    return 'INFO';
  };

  const getSeverityBadgeClass = (level: 'CRITICAL' | 'WARNING' | 'INFO') => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'INFO':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const filteredAndSortedScenarios = useMemo(() => {
    return scenarios
      .filter((sc) => {
        const level = mapSeverityLevel(sc.severity);
        // 1. Severity level filter
        if (severityFilter !== 'ALL' && level !== severityFilter) {
          return false;
        }
        // 2. Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (sc.shortTitle || sc.title).toLowerCase().includes(q);
          const matchService = sc.groundTruthOriginService.toLowerCase().includes(q);
          const matchCode = (sc.incidentCode || '').toLowerCase().includes(q);
          const matchDesc = sc.description.toLowerCase().includes(q);
          if (!matchTitle && !matchService && !matchCode && !matchDesc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const severityRank = { P1: 3, P2: 2, P3: 1 };
        const rankA = severityRank[a.severity] || 0;
        const rankB = severityRank[b.severity] || 0;

        if (sortOption === 'severity-desc') {
          return rankB - rankA;
        } else if (sortOption === 'severity-asc') {
          return rankA - rankB;
        } else {
          const codeA = a.incidentCode || a.id;
          const codeB = b.incidentCode || b.id;
          return codeA.localeCompare(codeB);
        }
      });
  }, [scenarios, severityFilter, sortOption, searchQuery]);

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c1c22] pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Active Incident Catalog</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Filter and prioritize incident scenarios for root-cause diagnosis and remediation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 bg-[#121217] px-2.5 py-1 rounded-md border border-[#202026]">
            {filteredAndSortedScenarios.length} of {scenarios.length} Scenarios
          </span>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e0e13] p-3 rounded-lg border border-[#1e1e24]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Severity Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              Severity:
            </span>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityFilterType)}
              className="bg-[#14141a] border border-[#25252e] hover:border-[#33333e] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL (P1)</option>
              <option value="WARNING">WARNING (P2)</option>
              <option value="INFO">INFO (P3)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 border-l border-[#1f1f26] pl-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              Sort:
            </span>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOptionType)}
              className="bg-[#14141a] border border-[#25252e] hover:border-[#33333e] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="severity-desc">Highest Severity First</option>
              <option value="severity-asc">Lowest Severity First</option>
              <option value="code-asc">Incident Code (Ascending)</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service, code, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14141a] border border-[#25252e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Scenario Cards List */}
      {filteredAndSortedScenarios.length === 0 ? (
        <div className="p-8 text-center bg-[#0e0e13] rounded-xl border border-[#1e1e24] space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto">
            <Filter className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-zinc-300">
            No incident scenarios match the selected filter
          </div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your severity filter or search keywords to view available incident scenarios.
          </p>
          <button
            onClick={() => {
              setSeverityFilter('ALL');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#181820] hover:bg-[#20202a] text-zinc-200 text-xs font-medium border border-[#282834] transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedScenarios.map((sc) => {
            const isCurrent = sc.id === currentScenarioId;
            const severityLevel = mapSeverityLevel(sc.severity);
            const badgeClass = getSeverityBadgeClass(severityLevel);

            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-[#121218] border-blue-500/40 shadow-sm'
                    : 'bg-[#0d0d11] border-[#1f1f26] hover:border-[#2b2b36]'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {sc.incidentCode || 'INC'}
                    </span>

                    {/* Formatted Severity Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase flex items-center gap-1 ${badgeClass}`}
                    >
                      {severityLevel === 'CRITICAL' && <AlertOctagon className="w-3 h-3" />}
                      {severityLevel === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                      {severityLevel === 'INFO' && <Info className="w-3 h-3" />}
                      <span>
                        {sc.severity} {severityLevel}
                      </span>
                    </span>

                    <span className="text-xs font-mono text-zinc-400">{sc.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">
                    {sc.shortTitle || sc.title}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                    {sc.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden md:block">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono block">Origin</span>
                    <span className="text-xs font-mono text-zinc-300">
                      {sc.groundTruthOriginService}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectScenario(sc);
                      onNavigateToOverview();
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                        : 'bg-[#181820] hover:bg-[#22222c] text-zinc-200 border border-[#282834]'
                    }`}
                  >
                    {isCurrent ? 'Active in Overview' : 'Investigate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
