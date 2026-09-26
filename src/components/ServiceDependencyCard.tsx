import React from 'react';
import { IncidentScenario } from '../types/incident';
import { Database, Server, Globe, ArrowDown, AlertOctagon } from 'lucide-react';

interface ServiceDependencyCardProps {
  scenario: IncidentScenario;
}

export const ServiceDependencyCard: React.FC<ServiceDependencyCardProps> = ({ scenario }) => {
  // Use scenario-specific chain or default to api-gateway -> order-service -> PostgreSQL
  const chain = scenario.dependencyChain || [
    { name: 'api-gateway', type: 'API Gateway', isSuspected: false },
    { name: 'order-service', type: 'Order Service', isSuspected: false },
    { name: 'PostgreSQL', type: 'Primary Database', isSuspected: true },
  ];

  const getNodeIcon = (type: string) => {
    if (type.toLowerCase().includes('database') || type.toLowerCase().includes('sql')) {
      return Database;
    }
    if (type.toLowerCase().includes('gateway') || type.toLowerCase().includes('ingress')) {
      return Globe;
    }
    return Server;
  };

  return (
    <div className="bg-[#0b0b0e] border border-[#1e1e24] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#1c1c22] pb-3 mb-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Service Dependency
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">
            {chain.length} Tier Topology
          </span>
        </div>

        {/* Clean Vertical Flow */}
        <div className="flex flex-col items-center space-y-2 py-2">
          {chain.map((node, idx) => {
            const Icon = getNodeIcon(node.type);
            const isSuspected = node.isSuspected ?? idx === chain.length - 1;

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
                      <div className="font-mono text-xs font-semibold tracking-tight truncate">
                        {node.name}
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
      </div>

      <div className="pt-2 text-[11px] text-zinc-500 text-center font-mono">
        Dependency path correlated via OpenTelemetry distributed traces
      </div>
    </div>
  );
};
