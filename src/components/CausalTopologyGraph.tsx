import React, { useState } from 'react';
import { TOPOLOGY_NODES } from '../data/scenarios';
import { ServiceNode, Hypothesis } from '../types/incident';
import {
  Server,
  Database,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Radio
} from 'lucide-react';

interface CausalTopologyGraphProps {
  hypothesis: Hypothesis | null;
  activeOriginService?: string;
  cascadingServices?: string[];
}

export const CausalTopologyGraph: React.FC<CausalTopologyGraphProps> = ({
  hypothesis,
  activeOriginService,
  cascadingServices = [],
}) => {
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);

  const originService = activeOriginService || hypothesis?.origin_service || 'order-service';
  const cascades = cascadingServices.length > 0 ? cascadingServices : (hypothesis?.cascading_services || []);

  const getNodeStatus = (nodeId: string) => {
    if (nodeId === originService) return 'origin_fault';
    if (cascades.includes(nodeId)) return 'critical';
    if (nodeId === 'api-gateway' && originService === 'order-service') return 'critical';
    return 'nominal';
  };

  const getNodeTypeIcon = (type: ServiceNode['type']) => {
    switch (type) {
      case 'database':
        return Database;
      case 'queue':
      case 'cache':
        return Layers;
      default:
        return Server;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>Causal Dependency Graph & Topology</span>
            <span className="text-xs font-normal text-slate-400">
              (Origin Fault vs. Cascading Symptoms)
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Automated graph traversal isolating root cause from downstream cascading failures.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <span className="text-rose-400 font-medium">Origin Root Fault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-400 font-medium">Cascading Symptom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-400 font-medium">Nominal</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-x-auto bg-slate-950/80 rounded border border-slate-800/80 p-2 min-h-[380px] flex items-center justify-center">
        <svg
          viewBox="0 0 920 360"
          className="w-full max-w-[920px] h-[360px] select-none"
        >
          <defs>
            <linearGradient id="edgeGradNominal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="edgeGradFault" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <filter id="glowFault" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw Edges */}
          {TOPOLOGY_NODES.map((node) => {
            return node.dependencies.map((targetId) => {
              const targetNode = TOPOLOGY_NODES.find((n) => n.id === targetId);
              if (!targetNode) return null;

              const isConnectedToFault =
                node.id === originService || targetNode.id === originService;

              return (
                <g key={`${node.id}->${targetId}`}>
                  <line
                    x1={node.x + 50}
                    y1={node.y + 25}
                    x2={targetNode.x + 10}
                    y2={targetNode.y + 25}
                    stroke={isConnectedToFault ? '#f43f5e' : '#334155'}
                    strokeWidth={isConnectedToFault ? 2.5 : 1.5}
                    strokeDasharray={isConnectedToFault ? '4 3' : undefined}
                    className={isConnectedToFault ? 'animate-pulse' : ''}
                  />
                  {/* Arrow marker */}
                  <polygon
                    points={`${targetNode.x + 10},${targetNode.y + 25} ${targetNode.x + 2},${targetNode.y + 20} ${targetNode.x + 2},${targetNode.y + 30}`}
                    fill={isConnectedToFault ? '#f43f5e' : '#475569'}
                  />
                </g>
              );
            });
          })}

          {/* Draw Nodes */}
          {TOPOLOGY_NODES.map((node) => {
            const status = getNodeStatus(node.id);
            const isOrigin = status === 'origin_fault';
            const isCritical = status === 'critical';
            const isSelected = selectedNode?.id === node.id;
            const Icon = getNodeTypeIcon(node.type);

            let strokeColor = '#334155';
            let fillColor = '#0f172a';
            let textColor = '#cbd5e1';

            if (isOrigin) {
              strokeColor = '#f43f5e';
              fillColor = '#3f0c1b';
              textColor = '#fecdd3';
            } else if (isCritical) {
              strokeColor = '#f59e0b';
              fillColor = '#2b1a07';
              textColor = '#fef3c7';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                {/* Glow ring for origin fault */}
                {isOrigin && (
                  <rect
                    x="-4"
                    y="-4"
                    width="128"
                    height="58"
                    rx="8"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    opacity="0.7"
                    filter="url(#glowFault)"
                    className="animate-pulse"
                  />
                )}

                {/* Node Box */}
                <rect
                  x="0"
                  y="0"
                  width="120"
                  height="50"
                  rx="6"
                  fill={fillColor}
                  stroke={isSelected ? '#38bdf8' : strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Title */}
                <text
                  x="12"
                  y="22"
                  fontSize="10"
                  fontWeight="600"
                  fill={textColor}
                  className="font-sans"
                >
                  {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
                </text>

                {/* Node Subtitle / Metric */}
                <text
                  x="12"
                  y="38"
                  fontSize="9"
                  fill={isOrigin ? '#fca5a5' : isCritical ? '#fcd34d' : '#64748b'}
                  className="font-mono"
                >
                  {isOrigin
                    ? 'ORIGIN FAULT'
                    : isCritical
                    ? 'CASCADING'
                    : `${node.p99LatencyMs}ms · 0.0%`}
                </text>

                {/* Status Dot */}
                <circle
                  cx="108"
                  cy="14"
                  r="4"
                  fill={isOrigin ? '#f43f5e' : isCritical ? '#f59e0b' : '#10b981'}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Inspector or Origin Details */}
      <div className="mt-3 p-3 bg-slate-950/60 rounded border border-slate-800 text-xs">
        {selectedNode ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  {selectedNode.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase px-1 border border-slate-800 rounded">
                  {selectedNode.type}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    getNodeStatus(selectedNode.id) === 'origin_fault'
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-800/80'
                      : getNodeStatus(selectedNode.id) === 'critical'
                      ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
                      : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80'
                  }`}
                >
                  {getNodeStatus(selectedNode.id).toUpperCase()}
                </span>
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">
                Dependencies: {selectedNode.dependencies.join(', ') || 'None (Terminal Leaf Node)'}
              </p>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">p99 Latency</span>
                <span className="text-slate-200">{selectedNode.p99LatencyMs}ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Error Rate</span>
                <span className="text-rose-400">{selectedNode.errorRatePercent}%</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-slate-300 underline"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>
                Isolated Root Fault Origin:{' '}
                <strong className="text-rose-300 font-mono">{originService}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any node in graph to inspect dependency metrics
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
