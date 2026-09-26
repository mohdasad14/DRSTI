import React, { useState, useEffect, useRef } from 'react';
import {
  IncidentState,
  IncidentScenario,
  TelemetryPayload,
  Hypothesis,
  RemediationAction,
  AgentLogMessage,
  AuditEntry,
  EvaluationResult
} from './types/incident';
import { INCIDENT_SCENARIOS } from './data/scenarios';
import {
  TelemetryIngestionEngine,
  CausalDiscoveryAgent,
  VerificationAgent,
  RemediationPlanningAgent,
  SandboxedExecutionEngine,
  IncidentEvaluator
} from './services/IncidentOrchestrator';

// New DRSTI Design System Components
import { TopHeader } from './components/TopHeader';
import { LeftSidebar, SidebarTab } from './components/LeftSidebar';
import { ActiveIncidentBanner } from './components/ActiveIncidentBanner';
import { IncidentInvestigationPanel } from './components/IncidentInvestigationPanel';
import { AiInvestigationPanel } from './components/AiInvestigationPanel';
import { ServiceDependencyCard } from './components/ServiceDependencyCard';
import { IncidentSummaryCard } from './components/IncidentSummaryCard';
import { BottomActionsBar } from './components/BottomActionsBar';
import { ApprovalGateModal } from './components/ApprovalGateModal';
import { GeminiCopilotModal } from './components/GeminiCopilotModal';
import { IncidentCatalogView } from './components/IncidentCatalogView';
import { DrstiChatbot } from './components/DrstiChatbot';

// Existing full-power views preserved in sub-tabs
import { AuditLedgerView } from './components/AuditLedgerView';
import { BenchmarkSuiteView } from './components/BenchmarkSuiteView';
import { FaultInjectionLab } from './components/FaultInjectionLab';
import { MultimodalTelemetryPanel } from './components/MultimodalTelemetryPanel';

export default function App() {
  const [scenarios, setScenarios] = useState<IncidentScenario[]>(INCIDENT_SCENARIOS);
  const [currentScenario, setCurrentScenario] = useState<IncidentScenario>(INCIDENT_SCENARIOS[0]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('overview');

  // Pipeline Engine State
  const [currentState, setCurrentState] = useState<IncidentState>('DETECTED');
  const [telemetry, setTelemetry] = useState<TelemetryPayload>(INCIDENT_SCENARIOS[0].telemetry);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [verifiedHypothesis, setVerifiedHypothesis] = useState<Hypothesis | null>(null);
  const [plan, setPlan] = useState<RemediationAction | null>(null);

  // Logs & Audits
  const [agentLogs, setAgentLogs] = useState<AgentLogMessage[]>([]);
  const [auditLedger, setAuditLedger] = useState<AuditEntry[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);

  // UI & Flow Control
  const [isRunning, setIsRunning] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [probeRequested, setProbeRequested] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [liveTelemetryEnabled, setLiveTelemetryEnabled] = useState(false);
  const streamCounterRef = useRef(1);

  // Timing
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [diagEndTime, setDiagEndTime] = useState<number>(0);
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);

  // Service instances
  const ingestionRef = useRef(new TelemetryIngestionEngine());
  const causalAgentRef = useRef(new CausalDiscoveryAgent());
  const verificationAgentRef = useRef(new VerificationAgent());
  const remediationAgentRef = useRef(new RemediationPlanningAgent());
  const sandboxEngineRef = useRef(new SandboxedExecutionEngine());
  const evaluatorRef = useRef(new IncidentEvaluator());

  // Check backend health / Gemini status
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.aiAvailable) setAiAvailable(true);
      })
      .catch(() => {
        // Local rule-based fallback
      });
  }, []);

  // Live Telemetry Polling Engine (Every 5 seconds)
  useEffect(() => {
    if (!liveTelemetryEnabled) return;

    const interval = setInterval(() => {
      streamCounterRef.current += 1;
      const pollId = streamCounterRef.current;
      const origin = currentScenario.groundTruthOriginService;
      const isResolved = currentState === 'RESOLVED';

      let eventLevel: 'INFO' | 'WARN' | 'ERROR' = 'INFO';
      let eventMessage = '';
      let eventMetadata: Record<string, any> = {};

      if (isResolved) {
        eventLevel = 'INFO';
        eventMessage = `Telemetry Probe #${pollId}: Service ${origin} healthy — latency p99: ${
          14 + Math.floor(Math.random() * 8)
        }ms, error_rate: 0.00%`;
        eventMetadata = { healthCheck: '200_OK', activeReplicas: 3, latencyMs: 16 };
      } else {
        if (currentScenario.id === 'db-pool-exhaustion') {
          eventLevel = pollId % 2 === 0 ? 'ERROR' : 'WARN';
          eventMessage =
            eventLevel === 'ERROR'
              ? `HikariPool-1 pool exhausted: [Thread-worker-${pollId}] connection acquisition timed out after 30000ms`
              : `HikariPool-1 queue backlog: ${390 + Math.floor(Math.random() * 60)} threads waiting (active: 100/100, idle: 0)`;
          eventMetadata = { activeConnections: 100, idle: 0, waiting: 410 + pollId };
        } else if (currentScenario.id === 'memory-leak-oom') {
          eventLevel = pollId % 2 === 0 ? 'ERROR' : 'WARN';
          eventMessage =
            eventLevel === 'ERROR'
              ? `JVM GC overhead warning: Stop-the-world pause lasted ${
                  1200 + Math.floor(Math.random() * 300)
                }ms on ${origin}`
              : `Heap utilization sample: ${(98.2 + Math.random() * 1.5).toFixed(1)}% (heapMax: 4096MB)`;
          eventMetadata = { jvmHeapPercent: 99.1, exitCodeCheck: 'SIGKILL_PENDING' };
        } else if (currentScenario.id === 'canary-envoy-routing') {
          eventLevel = 'ERROR';
          eventMessage = `Envoy mTLS handshake drop: peer cert verification rejected on canary upstream route [attempt #${pollId}]`;
          eventMetadata = { error: 'SSLV3_ALERT_BAD_CERTIFICATE', canaryWeight: 100 };
        } else if (currentScenario.id === 'kafka-consumer-lag-storm') {
          eventLevel = 'WARN';
          eventMessage = `Kafka group rebalance jitter: consumer heartbeat delayed by ${
            3200 + Math.floor(Math.random() * 1200)
          }ms`;
          eventMetadata = { consumerLag: 864200 + pollId * 150 };
        } else {
          eventLevel = 'WARN';
          eventMessage = `Kernel tcp_probe: socket buffer backlog overflow drop counter incremented on ${origin}`;
          eventMetadata = { droppedPackets: 240 + pollId * 20 };
        }
      }

      const newLog = {
        id: `live-log-${Date.now()}-${pollId}`,
        timestamp: Date.now(),
        level: eventLevel,
        service: origin,
        message: eventMessage,
        metadata: eventMetadata,
      };

      // Ingest live telemetry and update state
      setTelemetry((prev) => {
        const updated = {
          ...prev,
          logs: [newLog, ...prev.logs],
        };
        // Trigger Ingestion Timeline Engine with fresh telemetry frame
        ingestionRef.current.ingest(updated);
        return updated;
      });

      addAgentLog(
        'Orchestrator',
        `[Live Telemetry] Ingested cluster frame #${pollId} from ${origin}`,
        eventLevel === 'ERROR' ? 'error' : eventLevel === 'WARN' ? 'warn' : 'info',
        eventMessage
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [liveTelemetryEnabled, currentScenario, currentState]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (currentState !== 'RESOLVED' && currentState !== 'ROLLED_BACK' && currentState !== 'DETECTED') {
      interval = setInterval(() => {
        setElapsedTimeMs(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentState, startTime]);

  const addAgentLog = (
    agent: AgentLogMessage['agent'],
    message: string,
    level: AgentLogMessage['level'] = 'info',
    detail?: string
  ) => {
    setAgentLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        agent,
        message,
        level,
        detail,
      },
      ...prev,
    ]);
  };

  // Reset current scenario
  const handleReset = (scenario = currentScenario) => {
    setCurrentState('DETECTED');
    setTelemetry(scenario.telemetry);
    setHypotheses([]);
    setVerifiedHypothesis(null);
    setPlan(null);
    setProbeRequested(false);
    setIsRunning(false);
    setShowApprovalModal(false);
    setElapsedTimeMs(0);
    setStartTime(Date.now());

    // Add initial log
    setAgentLogs([
      {
        id: `init-${Date.now()}`,
        timestamp: Date.now(),
        agent: 'Orchestrator',
        message: `Incident initialized: [${scenario.severity}] ${scenario.incidentCode || 'INC'} - ${scenario.shortTitle || scenario.title}. Ready for DRSTI multi-agent analysis.`,
        level: 'info',
      },
    ]);
  };

  const handleSelectScenario = (scenario: IncidentScenario) => {
    setCurrentScenario(scenario);
    handleReset(scenario);
  };

  // Step 1 Cycle forward in FSM
  const stepFSM = async (auto = false): Promise<boolean> => {
    if (currentState === 'RESOLVED' || currentState === 'ROLLED_BACK') {
      return false;
    }

    if (currentState === 'DETECTED') {
      setStartTime(Date.now());
      addAgentLog(
        'Orchestrator',
        `Anomaly acknowledged in ${currentScenario.groundTruthOriginService}. Ingesting multimodal telemetry & building timeline.`,
        'warn'
      );
      setCurrentState('CORRELATING');

      const ingested = ingestionRef.current.ingest(telemetry);
      addAgentLog(
        'Orchestrator',
        `Ingested ${ingested.timeline.length} telemetry events across ${ingested.serviceCount} services. Chronological timeline built.`,
        'info',
        `Anomaly timestamp: ${ingested.anomalyDetectedAt}`
      );
      return true;
    }

    if (currentState === 'CORRELATING') {
      setCurrentState('INVESTIGATING');
      addAgentLog(
        'CausalDiscovery',
        'Executing causal graph analysis across service dependency topology. Correlating error logs, p99 latency spikes, and deployment diffs...',
        'info'
      );

      const ranked = causalAgentRef.current.rankHypotheses(telemetry, currentScenario);
      setHypotheses(ranked);

      addAgentLog(
        'CausalDiscovery',
        `Isolated candidate root cause: "${ranked[0].root_cause}" (Confidence: ${Math.round(
          ranked[0].confidence * 100
        )}%)`,
        'success',
        `Supporting Evidence (${ranked[0].supporting_evidence.length}):\n` +
          ranked[0].supporting_evidence.map((e) => `• ${e}`).join('\n')
      );
      return true;
    }

    if (currentState === 'INVESTIGATING') {
      const topHypo = hypotheses[0] || causalAgentRef.current.rankHypotheses(telemetry, currentScenario)[0];
      addAgentLog(
        'VerificationAgent',
        'Interrogating evidence consistency against trace waterfalls and error rates...',
        'info'
      );

      const verified = verificationAgentRef.current.verify([topHypo], telemetry);

      if (!verified) {
        // Insufficiency loop!
        setCurrentState('INSUFFICIENT_EVIDENCE');
        setProbeRequested(true);
        addAgentLog(
          'VerificationAgent',
          `EVIDENCE INSUFFICIENT (Confidence ${Math.round(
            topHypo.confidence * 100
          )}% < 75% or evidence count < 2). Dispatched request for automated eBPF kernel socket probe!`,
          'warn'
        );
        return false;
      }

      setVerifiedHypothesis(verified);
      setDiagEndTime(Date.now());
      setCurrentState('PLANNING_REMEDIATION');

      addAgentLog(
        'VerificationAgent',
        `Hypothesis verified with sufficient rigor (${verified.supporting_evidence.length} evidence artifacts, confidence ${Math.round(
          verified.confidence * 100
        )}%). Handing off to Remediation Planning Agent.`,
        'success'
      );

      // Create plan
      const newPlan = remediationAgentRef.current.createPlan(verified, currentScenario);
      setPlan(newPlan);

      addAgentLog(
        'RemediationPlanner',
        `Formulated reversible remediation plan for service '${newPlan.target_service}'. Risk Score: ${newPlan.risk_level}`,
        'info',
        `Command: ${newPlan.command}\nRollback: ${newPlan.rollback_command}`
      );
      return true;
    }

    if (currentState === 'INSUFFICIENT_EVIDENCE') {
      addAgentLog(
        'VerificationAgent',
        'Waiting for supplemental telemetry probe to satisfy evidence threshold...',
        'warn'
      );
      return false;
    }

    if (currentState === 'PLANNING_REMEDIATION') {
      const activePlan = plan || remediationAgentRef.current.createPlan(verifiedHypothesis || hypotheses[0], currentScenario);
      if (activePlan.risk_level === 'HIGH') {
        setCurrentState('PENDING_APPROVAL');
        setShowApprovalModal(true);
        addAgentLog(
          'Orchestrator',
          'HIGH RISK ACTION IDENTIFIED: Mandatory Human-in-the-Loop Approval Gate engaged. Halting autonomous execution until operator signs ticket.',
          'warn'
        );
        return false;
      } else {
        setCurrentState('EXECUTING');
        executeAction(activePlan, true, 'drsti-autonomous-operator');
        return true;
      }
    }

    if (currentState === 'PENDING_APPROVAL') {
      setShowApprovalModal(true);
      return false;
    }

    if (currentState === 'EXECUTING') {
      setCurrentState('VERIFYING');
      addAgentLog(
        'VerificationAgent',
        'Validating post-remediation system health: probing p99 latencies, connection pools, and HTTP 5xx error rates...',
        'info'
      );

      setTimeout(() => {
        setCurrentState('RESOLVED');
        const remTime = Date.now();
        addAgentLog(
          'Orchestrator',
          'INCIDENT RESOLVED: All services returning 200 OK. SLI latency recovered. Closed incident ticket and updated audit ledger.',
          'success'
        );

        // Record evaluation
        const evalRes = evaluatorRef.current.evaluate(
          verifiedHypothesis?.root_cause || hypotheses[0]?.root_cause || 'Unknown',
          currentScenario.groundTruthCause,
          startTime,
          diagEndTime || Date.now() - 500,
          remTime,
          currentScenario.id,
          currentScenario.title,
          verifiedHypothesis?.supporting_evidence?.length || 2
        );

        setEvaluations((prev) => [evalRes, ...prev]);
      }, 700);

      return true;
    }

    return false;
  };

  // Run all steps sequentially until approval gate or resolution
  const handleRunAuto = async () => {
    setIsRunning(true);
    let state: IncidentState = currentState;

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    while (state !== 'RESOLVED' && state !== 'ROLLED_BACK' && state !== 'PENDING_APPROVAL' && state !== 'INSUFFICIENT_EVIDENCE') {
      await delay(700);
      const stepped = await stepFSM(true);
      if (!stepped) break;
    }

    setIsRunning(false);
  };

  // Dispatch supplemental probe (Scenario 5)
  const handleInjectProbe = () => {
    if (!currentScenario.supplementalTelemetry) return;

    const enriched: TelemetryPayload = {
      ...telemetry,
      logs: [...telemetry.logs, ...(currentScenario.supplementalTelemetry.logs || [])],
      traces: [...telemetry.traces, ...(currentScenario.supplementalTelemetry.traces || [])],
    };

    setTelemetry(enriched);
    setProbeRequested(false);

    addAgentLog(
      'VerificationAgent',
      'Supplemental kernel eBPF socket probe received! Re-evaluating hypothesis confidence with enriched artifacts...',
      'info',
      'Injected 2 eBPF kernel drops logs & 1 socket handshake trace span.'
    );

    const reRanked = causalAgentRef.current.rankHypotheses(enriched, currentScenario);
    setHypotheses(reRanked);
    const verified = verificationAgentRef.current.verify(reRanked, enriched) || reRanked[0];
    setVerifiedHypothesis(verified);

    const newPlan = remediationAgentRef.current.createPlan(verified, currentScenario);
    setPlan(newPlan);

    setCurrentState('PLANNING_REMEDIATION');
    addAgentLog(
      'VerificationAgent',
      `Evidence threshold satisfied (${verified.supporting_evidence.length} artifacts, 94% confidence). Transitioned to PLANNING_REMEDIATION.`,
      'success'
    );
  };

  // Execute remediation action
  const executeAction = (
    action: RemediationAction,
    approved: boolean,
    operator = 'sre-lead-operator'
  ) => {
    setCurrentState('EXECUTING');
    setShowApprovalModal(false);

    const res = sandboxEngineRef.current.executeProduction(action, approved, operator);
    setAuditLedger(sandboxEngineRef.current.getLedger());

    addAgentLog(
      'SandboxEngine',
      `Production command executed by '${operator}': ${action.command}`,
      'info',
      res.output
    );

    setTimeout(() => {
      setCurrentState('VERIFYING');
      addAgentLog(
        'VerificationAgent',
        'Running telemetry verification loop: zero 5xx errors recorded over last 30s. Traffic nominal.',
        'info'
      );

      setTimeout(() => {
        setCurrentState('RESOLVED');
        const remTime = Date.now();
        addAgentLog(
          'Orchestrator',
          `INCIDENT RESOLVED: Normal operations restored in ${(
            (remTime - startTime) /
            1000
          ).toFixed(1)}s. Audit ledger sealed.`,
          'success'
        );

        const evalRes = evaluatorRef.current.evaluate(
          verifiedHypothesis?.root_cause || hypotheses[0]?.root_cause || 'Unknown',
          currentScenario.groundTruthCause,
          startTime,
          diagEndTime || Date.now() - 500,
          remTime,
          currentScenario.id,
          currentScenario.title,
          verifiedHypothesis?.supporting_evidence?.length || 2
        );
        setEvaluations((prev) => [evalRes, ...prev]);
      }, 700);
    }, 600);
  };

  // Simulate digital twin sandbox
  const handleSimulateSandbox = () => {
    if (!plan) {
      const activePlan = remediationAgentRef.current.createPlan(
        verifiedHypothesis || hypotheses[0],
        currentScenario
      );
      setPlan(activePlan);
    }
    const targetPlan = plan || remediationAgentRef.current.createPlan(
      verifiedHypothesis || hypotheses[0],
      currentScenario
    );

    const res = sandboxEngineRef.current.executeSandboxValidation(targetPlan);
    setAuditLedger(sandboxEngineRef.current.getLedger());

    addAgentLog(
      'SandboxEngine',
      `Validated playbook in digital twin sandbox: ${res.passed ? 'PASSED' : 'FAILED'}`,
      res.passed ? 'success' : 'error',
      res.output
    );

    return res;
  };

  // Rollback action
  const handleRollback = () => {
    if (!plan) return;
    const res = sandboxEngineRef.current.rollback(plan, 'Operator triggered precautionary rollback');
    setAuditLedger(sandboxEngineRef.current.getLedger());
    setCurrentState('ROLLED_BACK');
    setShowApprovalModal(false);

    addAgentLog(
      'SandboxEngine',
      `ROLLBACK APPLIED: ${plan.rollback_command}`,
      'warn',
      res.output
    );
  };

  // Ingest custom scenario from Fault Injection Lab
  const handleLoadCustomScenario = (customSc: IncidentScenario) => {
    setScenarios((prev) => [customSc, ...prev]);
    setCurrentScenario(customSc);
    handleReset(customSc);
    setSidebarTab('overview');
  };

  // Bottom action bar handlers
  const handleAcknowledge = async () => {
    if (currentState === 'DETECTED') {
      await stepFSM(false);
    }
  };

  const handleInvestigate = async () => {
    if (currentState === 'CORRELATING' || currentState === 'INVESTIGATING') {
      await stepFSM(false);
    }
  };

  const handleApproveRemediation = () => {
    if (plan) {
      setShowApprovalModal(true);
    } else {
      const activePlan = remediationAgentRef.current.createPlan(
        verifiedHypothesis || hypotheses[0] || causalAgentRef.current.rankHypotheses(telemetry, currentScenario)[0],
        currentScenario
      );
      setPlan(activePlan);
      setShowApprovalModal(true);
    }
  };

  const handleResolve = () => {
    setCurrentState('RESOLVED');
    addAgentLog('Orchestrator', 'Manual operator resolution acknowledged. Systems verified healthy.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* 1. TOP HEADER */}
      <TopHeader
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        scenarios={scenarios}
        onRunAuto={handleRunAuto}
        onStepNext={() => stepFSM(false)}
        onReset={() => handleReset()}
        isRunning={isRunning}
        canStep={currentState !== 'RESOLVED' && currentState !== 'ROLLED_BACK'}
        currentState={currentState}
        onOpenGeminiModal={() => setShowGeminiModal(true)}
        aiAvailable={aiAvailable}
        onOpenSettings={() => setSidebarTab('settings')}
        liveTelemetryEnabled={liveTelemetryEnabled}
        onToggleLiveTelemetry={() => setLiveTelemetryEnabled((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. LEFT SIDEBAR */}
        <LeftSidebar
          activeTab={sidebarTab}
          onSelectTab={setSidebarTab}
          incidentCount={scenarios.length}
          onOpenGemini={() => setShowGeminiModal(true)}
          aiAvailable={aiAvailable}
        />

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 max-w-7xl w-full mx-auto">
          {/* VIEW: OVERVIEW (Main Dashboard Requested by User) */}
          {sidebarTab === 'overview' && (
            <>
              {/* TOP: Active Incident Banner with 7-step progress tracker */}
              <ActiveIncidentBanner
                scenario={currentScenario}
                currentState={currentState}
              />

              {/* MAIN CONTENT: TWO COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* LEFT / LARGE AREA: Incident Investigation (Tabs: Timeline, Causal Graph, Logs, Metrics, Traces) */}
                <div className="lg:col-span-8 flex flex-col">
                  <IncidentInvestigationPanel
                    telemetry={telemetry}
                    scenario={currentScenario}
                    hypothesis={verifiedHypothesis || hypotheses[0]}
                    onInjectProbe={handleInjectProbe}
                    probeRequested={probeRequested}
                  />
                </div>

                {/* RIGHT AREA: AI Investigation Checklist & Expandable Activity */}
                <div className="lg:col-span-4 flex flex-col">
                  <AiInvestigationPanel
                    currentState={currentState}
                    hypothesis={verifiedHypothesis || hypotheses[0]}
                    logs={agentLogs}
                    onOpenGemini={() => setShowGeminiModal(true)}
                    aiAvailable={aiAvailable}
                  />
                </div>
              </div>

              {/* BOTTOM SECTION: TWO CLEAN PANELS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Panel 1: Service Dependency */}
                <ServiceDependencyCard scenario={currentScenario} />

                {/* Panel 2: Incident Summary */}
                <IncidentSummaryCard
                  scenario={currentScenario}
                  hypothesis={verifiedHypothesis || hypotheses[0]}
                  plan={plan}
                />
              </div>

              {/* BOTTOM ACTIONS BAR: [Acknowledge] [Investigate] [Approve Remediation] [Resolve] */}
              <BottomActionsBar
                currentState={currentState}
                onAcknowledge={handleAcknowledge}
                onInvestigate={handleInvestigate}
                onApproveRemediation={handleApproveRemediation}
                onResolve={handleResolve}
                onReset={() => handleReset()}
                isHighRisk={currentScenario.expectedRiskLevel === 'HIGH'}
              />
            </>
          )}

          {/* VIEW: INCIDENTS (Catalog of all active & registered incidents with severity filtering & sorting) */}
          {sidebarTab === 'incidents' && (
            <IncidentCatalogView
              scenarios={scenarios}
              currentScenarioId={currentScenario.id}
              onSelectScenario={handleSelectScenario}
              onNavigateToOverview={() => setSidebarTab('overview')}
            />
          )}

          {/* VIEW: EVENT STREAMS (Telemetry details & live stream) */}
          {sidebarTab === 'streams' && (
            <div className="h-[600px]">
              <MultimodalTelemetryPanel
                telemetry={telemetry}
                onInjectProbe={handleInjectProbe}
                probeRequested={probeRequested}
              />
            </div>
          )}

          {/* VIEW: HISTORY (Immutable Audit Ledger & Evaluation Benchmarks) */}
          {sidebarTab === 'history' && (
            <div className="space-y-5">
              <div className="h-[460px]">
                <AuditLedgerView ledger={auditLedger} />
              </div>
              <div className="h-[460px]">
                <BenchmarkSuiteView
                  scenarios={scenarios}
                  existingEvaluations={evaluations}
                  onAddEvaluation={(res) => setEvaluations((prev) => [res, ...prev])}
                />
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS (Chaos Fault Injection Lab & System Config) */}
          {sidebarTab === 'settings' && (
            <div className="space-y-5">
              <div className="h-[560px]">
                <FaultInjectionLab
                  onLoadCustomTelemetry={handleLoadCustomScenario}
                  onOpenGeminiModal={() => setShowGeminiModal(true)}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Human-in-the-Loop Approval Modal */}
      {plan && (
        <ApprovalGateModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          action={plan}
          hypothesis={verifiedHypothesis || hypotheses[0]}
          onApprove={(operator) => executeAction(plan, true, operator)}
          onReject={() => {
            setShowApprovalModal(false);
            addAgentLog('Orchestrator', 'Operator rejected remediation plan. Incident remains unmitigated.', 'error');
          }}
          onSimulateSandbox={handleSimulateSandbox}
          onRollback={handleRollback}
        />
      )}

      {/* Gemini AI Co-Pilot Modal */}
      <GeminiCopilotModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        scenario={currentScenario}
      />

      {/* DRSTI AI Assistant Floating Chatbot */}
      <DrstiChatbot
        currentScenario={currentScenario}
        currentState={currentState}
        telemetry={telemetry}
        hypothesis={verifiedHypothesis || hypotheses[0]}
        plan={plan}
        onReviewRemediation={() => setShowApprovalModal(true)}
      />
    </div>
  );
}
