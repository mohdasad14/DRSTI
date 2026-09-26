import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// AI Diagnostic Co-pilot endpoint
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI API key not configured on server. Running in rule-based diagnostic simulation mode.',
        fallback: true,
      });
    }

    const { telemetry, incidentScenario, prompt } = req.body;

    const systemInstruction = `You are the lead SRE Causal Diagnostic Agent in DRSTI.
Given the telemetry (logs, metrics, traces, deployment diffs), analyze root causes vs cascading downstream symptoms.
Format your response as valid JSON with the following structure:
{
  "root_cause": "string summary of isolated root cause",
  "confidence": 0.0 to 1.0,
  "supporting_evidence": ["evidence 1", "evidence 2", "evidence 3"],
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "causal_chain": ["origin service/component", "intermediate cascade", "impacted downstream client"],
  "remediation": {
    "description": "remediation description",
    "target_service": "service name",
    "command": "cli command",
    "rollback_command": "cli rollback command",
    "risk_level": "LOW" | "MEDIUM" | "HIGH"
  },
  "explanation": "concise technical post-mortem analysis"
}`;

    const userPrompt = `Incident Scenario: ${incidentScenario || 'Custom Telemetry'}\nAdditional Context: ${prompt || 'Analyze telemetry payload'}\n\nTelemetry Data:\n${JSON.stringify(telemetry, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze incident telemetry with Gemini',
      fallback: true,
    });
  }
});

// DRSTI Assistant Real-Time Conversational Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, incidentId, history = [], incidentContext } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Unable to reach DRSTI Assistant. AI service is not initialized on the server.',
        response: 'Unable to reach DRSTI Assistant. Please try again.',
        incidentId: incidentId || 'INC-1042',
      });
    }

    // Build rich, grounded DRSTI incident telemetry context
    const contextLines: string[] = [
      'CURRENT DRSTI INCIDENT TELEMETRY & RUNTIME STATE:',
      '==================================================',
      `Incident ID: ${incidentContext?.incidentCode || incidentId || 'INC-1042'}`,
      `Title: ${incidentContext?.title || 'Unknown Incident'}`,
      `Severity: ${incidentContext?.severity || 'P1'} (Level: ${incidentContext?.severity === 'P1' ? 'CRITICAL' : incidentContext?.severity === 'P2' ? 'HIGH' : 'ELEVATED'})`,
      `Workflow State: ${incidentContext?.status || 'INVESTIGATING'}`,
      `Detected Time: ${incidentContext?.detectedTime || '14:32:01'}`,
      `Suspected Origin Service: ${incidentContext?.suspectedSourceService || incidentContext?.originService || 'Unknown'}`,
      `Affected Services Tier: ${(incidentContext?.affectedServices || []).join(', ') || 'None listed'}`,
      `Impact Summary: ${incidentContext?.impactSummary || 'Traffic degradation detected'}`,
      '',
      'Service Topology Chain:',
      ...(incidentContext?.dependencyChain && incidentContext.dependencyChain.length > 0
        ? incidentContext.dependencyChain.map(
            (n: any) => `  - ${n.name} (${n.type})${n.isSuspected ? ' [SUSPECTED ROOT SOURCE]' : ''}`
          )
        : ['  - No topology recorded']),
      '',
      'Root Cause Analysis (Causal Discovery):',
      `  - Isolated Root Cause: ${incidentContext?.rootCause || 'Under active multi-agent investigation'}`,
      `  - Confidence Score: ${
        typeof incidentContext?.confidence === 'number'
          ? `${Math.round(incidentContext.confidence * 100)}%`
          : 'Pending verification'
      }`,
      'Supporting Diagnostic Evidence:',
      ...(incidentContext?.supportingEvidence && incidentContext.supportingEvidence.length > 0
        ? incidentContext.supportingEvidence.map((ev: string) => `  • ${ev}`)
        : ['  • Awaiting verification completion']),
      '',
      'Remediation Playbook:',
      `  - Recommended Action: ${incidentContext?.remediationPlan?.description || 'Increase connection capacity and restart affected workloads'}`,
      `  - Target Microservice: ${incidentContext?.remediationPlan?.target_service || incidentContext?.originService || 'N/A'}`,
      `  - Production Command: ${incidentContext?.remediationPlan?.command || 'N/A'}`,
      `  - Reversible Rollback Command: ${incidentContext?.remediationPlan?.rollback_command || 'N/A'}`,
      `  - Operational Risk Level: ${incidentContext?.remediationPlan?.risk_level || incidentContext?.expectedRiskLevel || 'HIGH'}`,
      '',
      'Live Event Timeline (Chronological):',
      ...(incidentContext?.timeline && incidentContext.timeline.length > 0
        ? incidentContext.timeline.slice(0, 10).map((t: any) => `  [${t.time}] ${t.level}: ${t.title || t.message} (${t.service})`)
        : ['  - No chronological timeline entries available']),
      '',
      'Correlated Telemetry Logs:',
      ...(incidentContext?.logs && incidentContext.logs.length > 0
        ? incidentContext.logs.slice(0, 8).map((l: any) => `  [${l.level}] [${l.service}] ${l.message}`)
        : ['  - No logs captured']),
      '',
      'Metric Spikes & Threshold Breaches:',
      ...(incidentContext?.metrics && incidentContext.metrics.length > 0
        ? incidentContext.metrics.map(
            (m: any) => `  • ${m.metric} on ${m.service}: ${m.value} ${m.unit} (Threshold: ${m.threshold} ${m.unit})`
          )
        : ['  - None']),
      '',
      'Distributed Trace Spans:',
      ...(incidentContext?.traces && incidentContext.traces.length > 0
        ? incidentContext.traces.map(
            (tr: any) => `  • Span: ${tr.span} (${tr.service}) -> ${tr.duration_ms}ms [${tr.status}] ${tr.errorMessage || ''}`
          )
        : ['  - None']),
      '',
      'Deployment / Git Metadata:',
      incidentContext?.deployment
        ? `  Service: ${incidentContext.deployment.service} | Version: ${incidentContext.deployment.version} | Commit: ${incidentContext.deployment.commitHash} | Diff: ${incidentContext.deployment.diffSummary}`
        : '  None',
      '==================================================',
    ];

    const contextPrompt = contextLines.join('\n');

    const systemInstruction = `You are DRSTI Assistant, the real-time intelligent incident detection and response AI for DRSTI (Real-Time Intelligent Incident Detection & Response).
You assist Site Reliability Engineers (SREs), DevOps on-call engineers, and incident commanders in interrogating active incidents, discovering root causes, and evaluating remediation playbooks.

STRICT ANTI-HALLUCINATION & FACTUALITY RULES:
1. Ground every answer strictly in the CURRENT DRSTI INCIDENT TELEMETRY provided in the prompt.
2. NEVER invent, fabricate, or hallucinate logs, metrics, service names, error messages, root causes, or commands not present in the incident context.
3. If the user asks for information, services, metrics, or logs not present in the current DRSTI incident data, you MUST respond with this exact phrasing or meaning:
   "I don't have enough information in the current DRSTI incident data to determine that."
4. Directly and concisely answer questions like:
   - "What happened?"
   - "Why was this incident created?"
   - "What is the root cause?"
   - "Which services are affected?"
   - "How severe is the impact?"
   - "Show me the important events."
   - "What happened before the incident?"
   - "What should I investigate first?"
   - "What is the recommended remediation?"
   - "Summarize this incident."
   - "Explain this incident in simple terms."
5. REMEDIATION SAFETY: When discussing remediation commands, explicitly clarify that actions are recommendations and must be reviewed and authorized by an operator before mutating production infrastructure.
6. FORMATTING: Use clean, professional, concise markdown with bullet points, bold headers, and inline code formatting. Keep answers crisp and actionable.`;

    // Multi-turn conversation assembly
    const contents: any[] = [];

    // Prime the conversation with the current DRSTI telemetry context
    contents.push({
      role: 'user',
      parts: [
        {
          text: `Here is the authoritative telemetry data for the active incident:\n\n${contextPrompt}\n\nPlease acknowledge receipt of this DRSTI incident state and stand by to answer user questions strictly based on it.`,
        },
      ],
    });

    contents.push({
      role: 'model',
      parts: [
        {
          text: `Understood. I have loaded and verified the live incident telemetry for ${
            incidentContext?.incidentCode || incidentId || 'the active incident'
          }. I am ready to assist with root cause discovery, impact assessment, timeline analysis, and safe remediation recommendations strictly grounded in this data.`,
        },
      ],
    });

    // Append prior conversation history
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (item.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: item.content || item.text || '' }],
          });
        } else if (item.role === 'assistant' || item.role === 'model') {
          contents.push({
            role: 'model',
            parts: [{ text: item.content || item.text || '' }],
          });
        }
      }
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high factual accuracy and zero hallucination
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[DRSTI Assistant] Model ${model} failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!responseText) {
      // Deterministic SRE rule fallback if upstream API is unreachable
      if (lastErr) {
        console.error('[DRSTI Assistant] All models failed:', lastErr);
      }
      return res.status(500).json({
        error: lastErr?.message || 'Unable to reach DRSTI Assistant. Please try again.',
        response: 'Unable to reach DRSTI Assistant. Please try again.',
        incidentId: req.body?.incidentId || 'INC-1042',
      });
    }

    return res.json({
      response: responseText,
      incidentId: incidentId || incidentContext?.incidentCode || 'INC-1042',
    });
  } catch (error: any) {
    console.error('DRSTI Assistant error:', error);
    return res.status(500).json({
      error: error?.message || 'Unable to reach DRSTI Assistant. Please try again.',
      response: 'Unable to reach DRSTI Assistant. Please try again.',
      incidentId: req.body?.incidentId || 'INC-1042',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AegisSRE Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
