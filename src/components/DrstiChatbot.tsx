import React, { useState, useEffect, useRef } from 'react';
import { DrstiLogo } from './DrstiLogo';
import {
  IncidentScenario,
  IncidentState,
  TelemetryPayload,
  Hypothesis,
  RemediationAction
} from '../types/incident';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  Loader2,
  Check,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  incidentCode?: string;
  isError?: boolean;
  suggestedAction?: {
    label: string;
    command?: string;
  };
}

interface DrstiChatbotProps {
  currentScenario: IncidentScenario;
  currentState: IncidentState;
  telemetry: TelemetryPayload;
  hypothesis?: Hypothesis | null;
  plan?: RemediationAction | null;
  onReviewRemediation?: () => void;
}

const QUICK_ACTIONS = [
  {
    label: 'Explain Incident',
    query: 'Explain the current incident in simple terms, detailing what happened and what the customer impact is.',
  },
  {
    label: 'Find Root Cause',
    query: 'Analyze the current incident and identify the most likely root cause using the available events, logs, metrics, and correlation data.',
  },
  {
    label: 'Summarize',
    query: 'Summarize this incident, including affected services, severity, timeline, and current investigation status.',
  },
  {
    label: 'Analyze Events',
    query: 'Show me the important events and chronological timeline leading up to this incident.',
  },
  {
    label: 'Suggest Remediation',
    query: 'What is the recommended remediation and rollback command for this incident, and what are the safety guardrails?',
  },
];

export const DrstiChatbot: React.FC<DrstiChatbotProps> = ({
  currentScenario,
  currentState,
  telemetry,
  hypothesis,
  plan,
  onReviewRemediation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  const prevIncidentIdRef = useRef<string>(currentScenario.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcoming greeting
  useEffect(() => {
    const code = currentScenario.incidentCode || 'INC-1042';
    const title = currentScenario.shortTitle || currentScenario.title;
    setMessages([
      {
        id: `welcome-${currentScenario.id}`,
        role: 'assistant',
        content: `Hello! I am **DRSTI Assistant**, your real-time incident response AI.\n\nI have loaded the live telemetry and topology for **${code} (${title})**.\n\nYou can ask me what happened, explore root causes, inspect event timelines, or evaluate remediation playbooks.`,
        timestamp: Date.now(),
        incidentCode: code,
      },
    ]);
  }, []);

  // Update context when user switches active incident in DRSTI dashboard
  useEffect(() => {
    if (prevIncidentIdRef.current !== currentScenario.id) {
      const code = currentScenario.incidentCode || 'INC-1042';
      const title = currentScenario.shortTitle || currentScenario.title;
      prevIncidentIdRef.current = currentScenario.id;

      // Add context transition note to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `switch-${Date.now()}`,
          role: 'assistant',
          content: `🔄 **Active Incident Context Switched:** Now tracking **${code} - ${title}** (${currentScenario.severity} ${
            currentScenario.severity === 'P1' ? 'CRITICAL' : 'HIGH'
          }). How can I assist with this incident?`,
          timestamp: Date.now(),
          incidentCode: code,
        },
      ]);
    }
  }, [currentScenario]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Assemble full DRSTI live incident payload
  const buildIncidentContextPayload = () => {
    const code = currentScenario.incidentCode || 'INC-1042';
    const title = currentScenario.shortTitle || currentScenario.title;
    const origin = currentScenario.groundTruthOriginService || 'order-service';

    return {
      incidentCode: code,
      title,
      severity: currentScenario.severity,
      status: currentState,
      detectedTime: currentScenario.detectedTime || '14:32:01',
      originService: origin,
      suspectedSourceService: currentScenario.suspectedSourceService || origin,
      affectedServices: currentScenario.affectedServicesList || [origin],
      impactSummary: currentScenario.impactSummary || currentScenario.description,
      category: currentScenario.category,
      dependencyChain: currentScenario.dependencyChain || [
        { name: 'api-gateway', type: 'Gateway' },
        { name: 'order-service', type: 'Microservice' },
        { name: 'PostgreSQL', type: 'Primary Database', isSuspected: true },
      ],
      rootCause: hypothesis?.root_cause || currentScenario.groundTruthCause,
      confidence: hypothesis?.confidence ?? 0.92,
      supportingEvidence: hypothesis?.supporting_evidence || [
        `Breached acquisition latency timeout on ${origin}`,
        `Max capacity pool saturation threshold reached`,
      ],
      remediationPlan: plan || {
        description: currentScenario.description,
        target_service: origin,
        command: currentScenario.recommendedCommand,
        rollback_command: currentScenario.rollbackCommand,
        risk_level: currentScenario.expectedRiskLevel || 'HIGH',
      },
      timeline: telemetry.logs.map((l, i) => ({
        time: `14:32:0${i * 2 + 1}`,
        level: l.level,
        title: l.message,
        service: l.service,
      })),
      logs: telemetry.logs.slice(0, 10).map((l) => ({
        level: l.level,
        service: l.service,
        message: l.message,
        metadata: l.metadata,
      })),
      metrics: telemetry.metrics.map((m) => ({
        metric: m.metric,
        service: m.service,
        value: m.value,
        unit: m.unit,
        threshold: m.threshold,
      })),
      traces: telemetry.traces.map((tr) => ({
        span: tr.span,
        service: tr.service,
        duration_ms: tr.duration_ms,
        status: tr.status,
        errorMessage: tr.errorMessage,
      })),
      deployment: telemetry.deployment_metadata,
    };
  };

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      incidentCode: currentScenario.incidentCode,
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history (exclude welcome greeting for cleaner LLM context)
      const history = messages
        .filter((m) => !m.id.startsWith('welcome-') && !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const incidentContext = buildIncidentContextPayload();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          incidentId: currentScenario.incidentCode || 'INC-1042',
          history,
          incidentContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const botResponse =
        data.response ||
        "I don't have enough information in the current DRSTI incident data to determine that.";

      // Check if response suggests remediation to display [Review Remediation] button
      const hasRemediationSuggestion =
        botResponse.toLowerCase().includes('remediation') ||
        botResponse.toLowerCase().includes('rollback') ||
        botResponse.toLowerCase().includes('kubectl') ||
        botResponse.toLowerCase().includes('sysctl');

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: botResponse,
        timestamp: Date.now(),
        incidentCode: currentScenario.incidentCode,
        suggestedAction: hasRemediationSuggestion
          ? {
              label: 'Review Remediation',
              command: plan?.command || currentScenario.recommendedCommand,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Chat error:', err);
      setIsConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach DRSTI Assistant. Please try again.',
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const code = currentScenario.incidentCode || 'INC-1042';
    const title = currentScenario.shortTitle || currentScenario.title;
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation cleared. I am ready to answer questions about active incident **${code} (${title})**.`,
        timestamp: Date.now(),
        incidentCode: code,
      },
    ]);
  };

  return (
    <>
      {/* 1. FLOATING CHAT BUTTON (Bottom-Right Corner) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-xl shadow-blue-950/60 border border-blue-400/30 transition-all group"
          title="Open DRSTI Assistant"
        >
          <div className="relative">
            <DrstiLogo size={18} className="w-4.5 h-4.5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          </div>
          <span className="text-xs font-bold tracking-tight">DRSTI Assistant</span>
          <span className="text-[10px] font-mono bg-blue-700/80 px-1.5 py-0.2 rounded border border-blue-400/20">
            {currentScenario.incidentCode || 'INC'}
          </span>
        </button>
      )}

      {/* 2. CHAT PANEL */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-[#0b0b0e] border border-[#222228] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized
              ? 'w-80 h-14'
              : 'w-[92vw] sm:w-[420px] md:w-[440px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Top Panel Header */}
          <div className="h-14 px-4 bg-[#0e0e13] border-b border-[#1c1c22] flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-[#14141a] border border-[#222228] text-blue-400">
                <DrstiLogo size={18} className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">DRSTI Assistant</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    AI Live
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Connected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear History */}
              {!isMinimized && (
                <button
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="p-1.5 rounded-md hover:bg-[#181820] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Minimize / Maximize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand chat' : 'Minimize chat'}
                className="p-1.5 rounded-md hover:bg-[#181820] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-md hover:bg-[#181820] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Live Incident Context Ribbon */}
              <div className="px-3.5 py-1.5 bg-[#101015] border-b border-[#1c1c22] flex items-center justify-between text-[11px] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-blue-400 shrink-0">
                    {currentScenario.incidentCode || 'INC'}
                  </span>
                  <span className="text-zinc-300 truncate max-w-[200px]">
                    {currentScenario.shortTitle || currentScenario.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">
                    {currentScenario.severity}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                    {currentState}
                  </span>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-md bg-[#16161c] border border-[#222228] flex items-center justify-center shrink-0 text-blue-400 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 space-y-2 leading-relaxed ${
                          isUser
                            ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30'
                            : msg.isError
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                            : 'bg-[#121217] text-zinc-200 border border-[#202026]'
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans text-xs">
                          {msg.content}
                        </div>

                        {/* Optional Remediation Review Button */}
                        {msg.suggestedAction && onReviewRemediation && (
                          <div className="pt-2 border-t border-[#222228]">
                            <button
                              onClick={onReviewRemediation}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>{msg.suggestedAction.label}</span>
                            </button>
                          </div>
                        )}

                        <div className="text-[9px] font-mono text-zinc-400 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-200 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-md bg-[#16161c] border border-[#222228] flex items-center justify-center shrink-0 text-blue-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="bg-[#121217] border border-[#202026] text-zinc-400 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>DRSTI Assistant is analyzing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions Carousel */}
              <div className="px-3 py-1.5 bg-[#0e0e13] border-t border-[#1c1c22] shrink-0 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSendMessage(action.query)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-md bg-[#14141a] hover:bg-[#1a1a22] text-zinc-300 hover:text-white border border-[#22222a] text-[11px] font-medium whitespace-nowrap transition-colors disabled:opacity-50 active:scale-95"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }}
                className="p-3 bg-[#0e0e13] border-t border-[#1c1c22] flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask DRSTI Assistant... (Press Enter to send)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-[#131318] border border-[#222228] rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  title="Send message"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-[#181820] disabled:text-zinc-600 text-white transition-all shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
