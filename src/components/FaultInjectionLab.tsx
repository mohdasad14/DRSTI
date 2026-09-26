import React, { useState } from 'react';
import { TelemetryPayload, IncidentScenario } from '../types/incident';
import {
  FlaskConical,
  Upload,
  Play,
  RotateCcw,
  Sparkles,
  FileJson,
  Check,
  AlertCircle
} from 'lucide-react';

interface FaultInjectionLabProps {
  onLoadCustomTelemetry: (customScenario: IncidentScenario) => void;
  onOpenGeminiModal: (customPayload?: TelemetryPayload) => void;
}

const SAMPLE_CUSTOM_PAYLOAD = {
  title: 'Redis Cluster Memory Eviction & Cache Stampede',
  category: 'Caching / Stampede',
  severity: 'P1',
  description: 'Redis maxmemory-policy allkeys-lru thrashing keys due to flash sale burst. Downstream auth cache misses flooding PostgreSQL.',
  groundTruthCause: 'Redis maxmemory-policy cache stampede in auth-service',
  groundTruthOriginService: 'redis-cache',
  expectedRiskLevel: 'HIGH',
  recommendedCommand: 'kubectl set resources deployment/redis-cache --limits=memory=8Gi -n production && redis-cli config set maxmemory 7gb',
  rollbackCommand: 'kubectl set resources deployment/redis-cache --limits=memory=2Gi -n production',
  telemetry: {
    logs: [
      {
        id: 'c-log-1',
        timestamp: 1711450000,
        level: 'WARN',
        service: 'redis-cache',
        message: 'OOM command not allowed when used memory > maxmemory (evicting 182,000 keys)',
        metadata: { usedMemory: '2147483648', maxmemory: '2147483648' }
      },
      {
        id: 'c-log-2',
        timestamp: 1711450005,
        level: 'ERROR',
        service: 'auth-service',
        message: 'Session token cache miss rate jumped to 94.2%. Querying primary Postgres DB directly.',
        metadata: { cacheMissPercent: 94.2 }
      }
    ],
    metrics: [
      {
        id: 'c-m-1',
        timestamp: 1711450008,
        service: 'redis-cache',
        metric: 'evicted_keys_per_sec',
        value: 42000,
        unit: 'keys/s',
        threshold: 1000,
        historical: [12, 18, 45, 1200, 18000, 42000]
      },
      {
        id: 'c-m-2',
        timestamp: 1711450010,
        service: 'postgres-primary',
        metric: 'cpu_utilization_percent',
        value: 98.7,
        unit: '%',
        threshold: 80,
        historical: [18, 22, 25, 64, 88, 98.7]
      }
    ],
    traces: [
      {
        id: 'c-tr-1',
        timestamp: 1711450012,
        traceId: 'tr-stampede-1',
        span: 'GET /user/profile',
        service: 'auth-service',
        duration_ms: 3800,
        status: 'error',
        errorMessage: 'Database query queue full under cache stampede'
      }
    ],
    deployment_metadata: {
      service: 'redis-cache',
      version: 'v7.0.12',
      deployed_ago_min: 240,
      commitHash: '7c8a192',
      author: 'infra-cache',
      diffSummary: 'infra: updated Redis memory limits to 2GB ahead of flash sale traffic burst',
      commitMessage: 'infra: set redis memory limit'
    }
  }
};

export const FaultInjectionLab: React.FC<FaultInjectionLabProps> = ({
  onLoadCustomTelemetry,
  onOpenGeminiModal,
}) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE_CUSTOM_PAYLOAD, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.telemetry || !parsed.telemetry.logs) {
        throw new Error("Payload must contain a 'telemetry' object with 'logs', 'metrics', and 'traces'.");
      }

      const scenario: IncidentScenario = {
        id: `custom-${Date.now()}`,
        title: parsed.title || 'Custom Injected Incident',
        category: parsed.category || 'Custom Fault',
        severity: parsed.severity || 'P2',
        description: parsed.description || 'User injected synthetic fault scenario',
        groundTruthCause: parsed.groundTruthCause || 'Custom root cause',
        groundTruthOriginService: parsed.groundTruthOriginService || parsed.telemetry.logs[0]?.service || 'order-service',
        expectedRiskLevel: parsed.expectedRiskLevel || 'HIGH',
        recommendedCommand: parsed.recommendedCommand || 'kubectl rollout restart deployment/custom-service',
        rollbackCommand: parsed.rollbackCommand || 'kubectl rollout undo deployment/custom-service',
        telemetry: parsed.telemetry,
      };

      setParseError(null);
      setSuccessMsg(true);
      onLoadCustomTelemetry(scenario);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON format');
    }
  };

  const handleResetSample = () => {
    setJsonText(JSON.stringify(SAMPLE_CUSTOM_PAYLOAD, null, 2));
    setParseError(null);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span>Telemetry Lab & Synthetic Fault Injector</span>
          </h3>
          <p className="text-xs text-slate-500">
            Define custom multimodal telemetry payloads (logs, metrics, traces, deployment diffs) and execute multi-agent diagnostic runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSample}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-950 rounded border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Load Sample Template
          </button>

          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors shadow-sm shadow-purple-600/30 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Inject & Run Agents
          </button>
        </div>
      </div>

      {/* Parse Feedback */}
      {parseError && (
        <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Custom Telemetry Payload successfully injected into Multi-Agent Pipeline!</span>
        </div>
      )}

      {/* JSON Editor */}
      <div className="flex-1 flex flex-col min-h-[380px]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-mono">Telemetry JSON Specification:</span>
          <span className="text-[11px] text-slate-500">
            Strict Schema (logs, metrics, traces, deployment_metadata)
          </span>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="flex-1 w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500 selection:bg-purple-500/30 resize-none leading-relaxed scrollbar-thin"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
