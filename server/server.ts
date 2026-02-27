import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tavily } from '@tavily/core';
import { generateGitHubQuestions } from './github-analyzer.js';

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FAST_MODEL = 'llama-3.3-70b-versatile';
const SMART_MODEL = 'llama-3.3-70b-versatile';

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

// --- 2. Chat Interviewer ---
app.post('/api/agents/chat', async (req, res) => {
  try {
    const { message, history = [], persona } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const systemPrompt = `You are an expert AI Interviewer for a Senior Tech Role. Persona: ${persona || 'Standard Technical Lead'}.
Act strictly as the interviewer. Ask ONE question at a time. Briefly evaluate the candidate's last answer before asking the next.
Keep responses concise, professional, and directly related to the role.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })),
      { role: 'user', content: message }
    ];

    const content = await callGroq(messages, SMART_MODEL, 0.7);
    res.json({ content });
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

// --- 5. Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    groq: !!GROQ_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🧠 AI Agent Server running on port ${port}`);
  console.log(`   Groq: ${GROQ_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`   Tavily: ${process.env.TAVILY_API_KEY ? '✅' : '❌ missing'}`);
});
