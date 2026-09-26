export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type IncidentState =
  | 'DETECTED'
  | 'CORRELATING'
  | 'INVESTIGATING'
  | 'INSUFFICIENT_EVIDENCE'
  | 'PLANNING_REMEDIATION'
  | 'PENDING_APPROVAL'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'ROLLED_BACK';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface MetricEntry {
  id: string;
  timestamp: number;
  service: string;
  metric: string;
  value: number;
  unit: string;
  threshold?: number;
  historical?: number[];
}

export interface TraceSpan {
  id: string;
  timestamp: number;
  traceId: string;
  span: string;
  service: string;
  duration_ms: number;
  status: 'ok' | 'error';
  parentSpan?: string;
  errorMessage?: string;
}

export interface DeploymentMetadata {
  service: string;
  version: string;
  deployed_ago_min: number;
  commitHash: string;
  author: string;
  diffSummary: string;
  commitMessage: string;
}

export interface TelemetryPayload {
  logs: LogEntry[];
  metrics: MetricEntry[];
  traces: TraceSpan[];
  deployment_metadata: DeploymentMetadata;
}

export interface Hypothesis {
  root_cause: string;
  confidence: number; // 0.0 - 1.0
  supporting_evidence: string[];
  risk_level: RiskLevel;
  origin_service: string;
  cascading_services: string[];
  suggested_action?: string;
}

export interface RemediationAction {
  action_id: string;
  description: string;
  target_service: string;
  command: string;
  risk_level: RiskLevel;
  rollback_command: string;
  policy_checks: {
    ebpf_guardrail: boolean;
    opa_compliance: boolean;
    data_loss_risk: 'NONE' | 'LOW' | 'HIGH';
  };
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action_id: string;
  agent: string;
  environment: 'sandbox_digital_twin' | 'production';
  command: string;
  status: 'SUCCESS' | 'FAILED' | 'EXECUTED' | 'ROLLED_BACK' | 'BLOCKED_PENDING_APPROVAL' | 'REJECTED';
  output: string;
  verified_metric_change?: string;
  operator?: string;
}

export interface AgentLogMessage {
  id: string;
  timestamp: number;
  agent: 'Orchestrator' | 'CausalDiscovery' | 'Verification' | 'VerificationAgent' | 'RemediationPlanner' | 'SandboxEngine' | 'System';
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
  detail?: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  type: 'gateway' | 'service' | 'database' | 'queue' | 'cache';
  status: 'nominal' | 'degraded' | 'critical' | 'origin_fault';
  p99LatencyMs: number;
  errorRatePercent: number;
  activeIncidents: number;
  x: number;
  y: number;
  dependencies: string[];
}

export interface IncidentScenario {
  id: string;
  incidentCode?: string;
  shortTitle?: string;
  detectedTime?: string;
  impactSummary?: string;
  affectedServicesList?: string[];
  suspectedSourceService?: string;
  dependencyChain?: Array<{ name: string; type: string; isSuspected?: boolean }>;
  title: string;
  category: string;
  severity: 'P1' | 'P2' | 'P3';
  description: string;
  telemetry: TelemetryPayload;
  groundTruthCause: string;
  groundTruthOriginService: string;
  expectedRiskLevel: RiskLevel;
  recommendedCommand: string;
  rollbackCommand: string;
  insufficientInitially?: boolean;
  supplementalTelemetry?: Partial<TelemetryPayload>;
}

export interface EvaluationResult {
  scenarioId: string;
  scenarioTitle: string;
  joint_root_cause_accuracy: number; // 1.0 or 0.0
  mean_time_to_diagnosis_sec: number;
  mean_time_to_remediation_sec: number;
  evidence_count: number;
  verified_safe: boolean;
  timestamp: number;
}
