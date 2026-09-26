import React, { useState } from 'react';
import { IncidentScenario } from '../types/incident';
import { Database, Server, Globe, ArrowDown, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface ServiceDependencyCardProps {
  scenario: IncidentScenario;
}

interface TrendPoint {
  timeLabel: string;
  errorRate: number;
}

export const ServiceDependencyCard: React.FC<ServiceDependencyCardProps> = ({ scenario }) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  // Use scenario-specific chain or default to api-gateway -> order-service -> PostgreSQL
  const chain = scenario.dependencyChain || [
    { name: 'api-gateway', type: 'API Gateway', isSuspected: false },
    { name: 'order-service', type: 'Order Service', isSuspected: false },
    { name: 'PostgreSQL', type: 'Primary Database', isSuspected: true },
  ];

  const getNodeIcon = (type: string) => {
    if (type.toLowerCase().includes('database') || type.toLowerCase().includes('sql') || type.toLowerCase().includes('postgres')) {
      return Database;
    }
    if (type.toLowerCase().includes('gateway') || type.toLowerCase().includes('ingress')) {
      return Globe;
    }
    return Server;
  };

  // 30-minute historical error rate trend points for PostgreSQL
  const postgresErrorTrend: TrendPoint[] = [
    { timeLabel: '-30m', errorRate: 0.02 },
    { timeLabel: '-25m', errorRate: 0.03 },
    { timeLabel: '-20m', errorRate: 0.05 },
    { timeLabel: '-15m', errorRate: 0.18 },
    { timeLabel: '-10m', errorRate: 3.4 },
    { timeLabel: '-5m', errorRate: 19.8 },
    { timeLabel: '-2m', errorRate: 32.5 },
    { timeLabel: 'Now', errorRate: 38.4 },
  ];

  // SVG Sparkline dimensions
  const svgWidth = 320;
  const svgHeight = 44;
  const maxVal = 45; // headroom above 38.4%
  const minVal = 0;
  const thresholdVal = 1.0; // SLO breach threshold

  // Map data to SVG coordinates
  const points = postgresErrorTrend.map((pt, i) => {
    const x = 12 + (i / (postgresErrorTrend.length - 1)) * (svgWidth - 24);
    const normalizedY = (pt.errorRate - minVal) / (maxVal - minVal);
    const y = svgHeight - 6 - normalizedY * (svgHeight - 14);
    return { ...pt, x, y };
  });

  const linePathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  const thresholdY = svgHeight - 6 - (thresholdVal / maxVal) * (svgHeight - 14);

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#1c1c22] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Service Dependency
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {chain.length} Tier Topology
          </span>
        </div>

        {/* Clean Vertical Flow */}
        <div className="flex flex-col items-center space-y-2 py-1">
          {chain.map((node, idx) => {
            const Icon = getNodeIcon(node.type || node.name);
            const isSuspected = node.isSuspected ?? idx === chain.length - 1;
            const isPostgres = node.name.toLowerCase().includes('postgres');

            return (
              <React.Fragment key={node.name}>
                {/* Node Box */}
                <div
                  className={`w-full max-w-sm px-4 py-2.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSuspected
                      ? 'bg-red-500/10 border-red-500/30 text-white shadow-sm shadow-red-950/20'
                      : 'bg-[#121217] border-[#222228] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSuspected
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-[#18181f] text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-mono text-xs font-semibold tracking-tight truncate flex items-center gap-1.5">
                        <span>{node.name}</span>
                        {isPostgres && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500">{node.type}</div>
                    </div>
                  </div>

                  {isSuspected && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                      SUSPECTED SOURCE
                    </span>
                  )}
                </div>

                {/* Downward Arrow */}
                {idx < chain.length - 1 && (
                  <div className="text-zinc-600 flex items-center justify-center my-0.5">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* PostgreSQL 30-Minute Error Rate Sparkline Sub-Panel */}
        <div className="mt-3.5 pt-3 border-t border-[#1a1a20] bg-[#0e0e13] p-3 rounded-lg border border-[#202028]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-zinc-200">
                PostgreSQL Error Rate Trend
              </span>
              <span className="text-[10px] font-mono text-zinc-500">(Last 30m)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-red-400">
                {hoveredPoint ? `${hoveredPoint.errorRate.toFixed(2)}%` : '38.4%'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-[#16161c] px-1.5 py-0.2 rounded border border-[#25252e]">
                SLO: &lt;1.0%
              </span>
            </div>
          </div>

          {/* SVG Sparkline Graph */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-11 overflow-visible"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                {/* Red Gradient fill for area under sparkline */}
                <linearGradient id="pgErrorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                  <stop offset="80%" stopColor="#ef4444" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* SLO Threshold Dashed Reference Line */}
              <line
                x1="8"
                y1={thresholdY}
                x2={svgWidth - 8}
                y2={thresholdY}
                stroke="#64748b"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* Shaded Area */}
              <path d={areaPathD} fill="url(#pgErrorGradient)" />

              {/* Smooth Trend Line */}
              <path
                d={linePathD}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active data point markers */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === points.length - 1 ? 3 : 1.5}
                  className={`${
                    i === points.length - 1
                      ? 'fill-red-400 stroke-red-950 stroke-2'
                      : 'fill-red-500/60'
                  } transition-all cursor-pointer`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              ))}

              {/* Pulsing Beacon on Current Value */}
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="5"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1"
                className="animate-ping opacity-60"
              />
            </svg>

            {/* Time labels below chart */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1 px-1">
              <span>-30m</span>
              <span>-15m</span>
              <span>-5m</span>
              <span className="text-red-400 font-semibold">Now (Surge)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 text-[11px] text-zinc-500 text-center font-mono">
        Dependency path correlated via OpenTelemetry distributed traces
      </div>
    </div>
  );
};
