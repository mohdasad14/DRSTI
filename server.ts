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

    const systemInstruction = `You are the lead SRE Causal Diagnostic Agent in AegisSRE.
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
