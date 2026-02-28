import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tavily } from '@tavily/core';
import OpenAI from 'openai';
import { generateGitHubQuestions } from './github-analyzer.js';
import { evaluateCanvasDesign } from './canvas-vision-agent.js';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 3001;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FAST_MODEL = 'llama-3.3-70b-versatile';
const SMART_MODEL = 'llama-3.3-70b-versatile';

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- Generic Groq caller ----
async function callGroq(
  messages: { role: string; content: string }[],
  model = FAST_MODEL,
  temperature = 0.7
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  return data.choices[0].message.content as string;
}

function extractJSON(raw: string): any {
  const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]);
}

// --- 1. Tavily Intelligence Agent ---
app.post('/api/agents/tavily-research', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) return res.status(400).json({ error: 'companyName is required' });

    const searchTool = tavily({ apiKey: process.env.TAVILY_API_KEY! });
    const searchResponse = await searchTool.search(
      `${companyName} recent news tech product launches 2025`,
      { maxResults: 3 }
    );
    const news = JSON.stringify(searchResponse.results);

    const raw = await callGroq([
      {
        role: 'user',
        content: `You are an expert technical recruiter preparing for an interview with a candidate applying to ${companyName}.
Here is the latest news about ${companyName}:\n\n${news}\n\n
Based STRICTLY on this news, generate 2 hyper-relevant challenging interview questions that test the candidate's industry awareness.
Return ONLY a JSON array of strings: ["question1", "question2"]`
      }
    ]);

    const questions = extractJSON(raw);
    res.json({ questions, raw_news: news });
  } catch (error: any) {
    console.error('Tavily Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to run intelligence agent', detail: error.message });
  }
});

// --- 2. Chat Interviewer (supports single persona and panel mode) ---
app.post('/api/agents/chat', async (req, res) => {
  try {
    const { message, history = [], persona, personas } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    let systemPrompt: string;
    let defaultSpeaker: string;

    if (personas && Array.isArray(personas) && personas.length > 1) {
      // Panel Attack Mode: multiple personas
      const panelDesc = personas.map((p: any) => `- ${p.name} (${p.desc})`).join('\n');
      defaultSpeaker = personas[0].name;
      systemPrompt = `You are a panel of ${personas.length} distinct AI interviewers conducting a technical interview together:
${panelDesc}

Rules:
1. Decide which panelist speaks next based on context — rotate naturally or pick whoever is most relevant.
2. Speak AS that panelist only — stay in their character and tone.
3. Ask ONE question at a time or make ONE evaluative comment.
4. Briefly acknowledge the candidate's last answer before asking the next question.
5. Keep responses concise and professional.
You MUST respond with ONLY a raw JSON object (no markdown): {"speaker": "<panelist name exactly as listed>", "content": "<what they say>"}`;
    } else {
      // Single persona mode
      const personaDesc = (personas && personas[0])
        ? `${personas[0].name}: ${personas[0].desc}`
        : (persona || 'Standard Technical Lead');
      defaultSpeaker = (personas && personas[0]?.name) || 'Interviewer';
      systemPrompt = `You are an expert AI Interviewer for a Senior Tech Role. Persona: ${personaDesc}.
Act strictly as the interviewer. Ask ONE question at a time. Briefly evaluate the candidate's last answer before asking the next.
Keep responses concise, professional, and directly related to the role.
You MUST respond with ONLY a raw JSON object (no markdown): {"speaker": "${defaultSpeaker}", "content": "<your response>"}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })),
      { role: 'user', content: message }
    ];

    const raw = await callGroq(messages, SMART_MODEL, 0.7);

    try {
      const parsed = extractJSON(raw);
      const speaker = parsed.speaker || defaultSpeaker;
      const content = parsed.content || raw;
      res.json({ content, speaker });
    } catch {
      // Fallback: if LLM didn't return JSON, wrap the raw text
      res.json({ content: raw, speaker: defaultSpeaker });
    }
  } catch (error: any) {
    console.error('Chat Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to generate response', detail: error.message });
  }
});

// --- 3. Evaluator Agent ---
app.post('/api/agents/evaluate', async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'question and answer are required' });

    const raw = await callGroq([
      {
        role: 'user',
        content: `You are an expert strict interview evaluator.
Question: "${question}"
Candidate's answer: "${answer}"

Evaluate on two metrics (0-100):
1. Content Quality (accuracy, depth, STAR method if behavioral)
2. Delivery (clarity, structure, confidence)

Return STRICTLY this JSON (no extra text):
{"score_content": 85, "score_delivery": 70, "feedback": "2 sentences max.", "is_weakness": false}`
      }
    ], FAST_MODEL, 0.2);

    const evaluation = extractJSON(raw);
    res.json(evaluation);
  } catch (error: any) {
    console.error('Evaluator Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to evaluate answer', detail: error.message });
  }
});

// --- 4. GitHub Code Analysis Agent ---
app.post('/api/agents/github-code-review', async (req, res) => {
  try {
    const { githubUsername } = req.body;
    if (!githubUsername) return res.status(400).json({ error: 'githubUsername is required' });

    const questions = await generateGitHubQuestions(githubUsername);
    res.json({ questions });
  } catch (error: any) {
    console.error('GitHub Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to analyze GitHub repos', detail: error.message });
  }
});

// --- 5. TTS Agent (OpenAI TTS → raw MP3 audio bytes for Simli PCM16 conversion) ---
app.post('/api/agents/tts', async (req, res) => {
  try {
    const { text, voice = 'nova' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const mp3 = await openaiClient.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error: any) {
    console.error('TTS Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to generate speech', detail: error.message });
  }
});

// --- 6. Canvas Vision Agent (System Design whiteboard evaluation) ---
app.post('/api/agents/canvas-evaluate', async (req, res) => {
  try {
    const { base64Image, currentQuestionContext, previousCanvasStateSummary } = req.body;
    if (!base64Image || !currentQuestionContext) {
      return res.status(400).json({ error: 'base64Image and currentQuestionContext are required' });
    }

    const result = await evaluateCanvasDesign(base64Image, currentQuestionContext, previousCanvasStateSummary);
    res.json(result);
  } catch (error: any) {
    console.error('Canvas Vision Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to evaluate canvas design', detail: error.message });
  }
});

// --- 7. Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    groq: !!GROQ_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🧠 AI Agent Server running on port ${port}`);
  console.log(`   Groq:   ${GROQ_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`   Tavily: ${process.env.TAVILY_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`   OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌ missing (TTS + Canvas Vision disabled)'}`);
});
