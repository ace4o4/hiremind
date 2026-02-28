import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tavily } from '@tavily/core';
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

// OpenAI voice names → Groq PlayAI voice names
const VOICE_MAP: Record<string, string> = {
  onyx: 'Fritz-PlayAI',
  nova: 'Celeste-PlayAI',
  alloy: 'Atlas-PlayAI',
  echo: 'Hudson-PlayAI',
  fable: 'Indigo-PlayAI',
  shimmer: 'Arista-PlayAI',
};

// ---- Generic Groq LLM caller ----
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

// --- 5. TTS Agent (Groq PlayAI → raw MP3 audio bytes for Simli PCM16 conversion) ---
app.post('/api/agents/tts', async (req, res) => {
  try {
    const { text, voice = 'nova' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const groqVoice = VOICE_MAP[voice] ?? VOICE_MAP['nova'];

    const ttsRes = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'playai-tts',
        input: text,
        voice: groqVoice,
        response_format: 'mp3',
      }),
    });

    if (!ttsRes.ok) throw new Error(`Groq TTS ${ttsRes.status}: ${await ttsRes.text()}`);

    const buffer = Buffer.from(await ttsRes.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error: any) {
    console.error('TTS Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to generate speech', detail: error.message });
  }
});

// --- 6. Canvas Vision Agent (System Design whiteboard evaluation via Groq vision) ---
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

// --- 7. STT Agent (Groq Whisper speech-to-text) ---
// Accepts base64-encoded audio (webm/mp3/wav) and returns a transcript.
// Requires Node.js 18+ for native Blob and FormData support.
// Supported Groq Whisper formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
const SUPPORTED_AUDIO_TYPES: Record<string, string> = {
  webm: 'audio/webm', mp3: 'audio/mpeg', mp4: 'audio/mp4',
  mpeg: 'audio/mpeg', mpga: 'audio/mpeg', m4a: 'audio/mp4',
  ogg: 'audio/ogg', wav: 'audio/wav', flac: 'audio/flac',
};

app.post('/api/agents/stt', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 is required' });

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    // Derive extension from MIME type; default to webm which Whisper supports well
    const baseMime = mimeType.split(';')[0].trim();
    const ext = Object.keys(SUPPORTED_AUDIO_TYPES).find(
      k => SUPPORTED_AUDIO_TYPES[k] === baseMime
    ) ?? 'webm';

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: baseMime }), `audio.${ext}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', language);
    formData.append('response_format', 'json');

    const sttRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!sttRes.ok) throw new Error(`Groq STT ${sttRes.status}: ${await sttRes.text()}`);

    const data = await sttRes.json() as any;
    res.json({ text: data.text });
  } catch (error: any) {
    console.error('STT Agent Error:', error.message);
    res.status(500).json({ error: 'Failed to transcribe audio', detail: error.message });
  }
});

// --- 8. Resume Parser Agent ---
// Extracts structured data (skills, experience, gaps) from raw resume text.
app.post('/api/agents/resume-parse', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'resumeText is required' });

    const raw = await callGroq([
      {
        role: 'user',
        content: `You are an expert ATS resume analyst. Parse the following resume and extract structured information.

Resume:
"""
${resumeText}
"""

Return ONLY this JSON (no extra text):
{
  "name": "Candidate's full name or null",
  "skills": ["skill1", "skill2"],
  "years_of_experience": 0,
  "education": "Highest degree and institution",
  "current_role": "Current or most recent job title",
  "companies": ["company1", "company2"],
  "key_projects": ["brief description of 1-2 notable projects"],
  "gaps": ["identified weakness or gap in their profile"],
  "interview_focus_areas": ["area1", "area2", "area3"]
}`
      }
    ], FAST_MODEL, 0.1);

    const parsed = extractJSON(raw);
    res.json(parsed);
  } catch (error: any) {
    console.error('Resume Parser Error:', error.message);
    res.status(500).json({ error: 'Failed to parse resume', detail: error.message });
  }
});

// --- 9. Question Generator Agent ---
// Generates targeted interview questions from resume + JD.
app.post('/api/agents/generate-questions', async (req, res) => {
  try {
    const { resumeText, jdText, companyName, numQuestions = 5 } = req.body;
    if (!resumeText || !jdText) return res.status(400).json({ error: 'resumeText and jdText are required' });

    const raw = await callGroq([
      {
        role: 'user',
        content: `You are a world-class technical recruiter preparing for an interview at ${companyName || 'a top tech company'}.

Candidate Resume:
"""
${resumeText}
"""

Job Description:
"""
${jdText}
"""

Generate exactly ${numQuestions} hyper-personalized interview questions that:
1. Directly reference the candidate's specific past experience/projects from their resume.
2. Test whether their skills match the JD requirements.
3. Include a mix of behavioral (STAR), technical, and situational questions.
4. For each question, identify its type.

Return ONLY a JSON array (no extra text):
[
  {"question": "...", "type": "behavioral|technical|situational", "focus": "skill or gap being tested"}
]`
      }
    ], SMART_MODEL, 0.6);

    const questions = extractJSON(raw);
    res.json({ questions });
  } catch (error: any) {
    console.error('Question Generator Error:', error.message);
    res.status(500).json({ error: 'Failed to generate questions', detail: error.message });
  }
});

// --- 10. Interview Report Generator ---
// Produces a comprehensive post-interview report from the full conversation history.
app.post('/api/agents/generate-report', async (req, res) => {
  try {
    const { history, durationSeconds = 0, role, company } = req.body;
    if (!history || !Array.isArray(history) || history.length < 2) {
      return res.status(400).json({ error: 'history array with at least 2 messages is required' });
    }

    const transcript = history
      .map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
      .join('\n\n');

    const raw = await callGroq([
      {
        role: 'user',
        content: `You are an expert interview coach generating a detailed post-interview report.

Interview Details:
- Role: ${role || 'Software Engineer'}
- Company: ${company || 'Tech Company'}
- Duration: ${Math.round(durationSeconds / 60)} minutes

Full Interview Transcript:
"""
${transcript}
"""

Analyse the interview and return ONLY this JSON (no extra text, all numeric scores are 0-100):
{
  "overall_score": 0,
  "scores": {
    "content_quality": 0,
    "communication": 0,
    "technical_depth": 0,
    "structure": 0,
    "confidence": 0
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "standout_answers": ["brief description of best moment"],
  "weak_answers": ["brief description of weakest answer and why"],
  "overall_feedback": "3-4 sentences of honest, actionable feedback.",
  "improvement_roadmap": ["action1", "action2", "action3"]
}`
      }
    ], SMART_MODEL, 0.2);

    const report = extractJSON(raw);
    res.json(report);
  } catch (error: any) {
    console.error('Report Generator Error:', error.message);
    res.status(500).json({ error: 'Failed to generate report', detail: error.message });
  }
});

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    groq: !!GROQ_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/agents/tavily-research',
      'POST /api/agents/chat',
      'POST /api/agents/evaluate',
      'POST /api/agents/github-code-review',
      'POST /api/agents/tts',
      'POST /api/agents/canvas-evaluate',
      'POST /api/agents/stt',
      'POST /api/agents/resume-parse',
      'POST /api/agents/generate-questions',
      'POST /api/agents/generate-report',
    ],
  });
});

app.listen(port, () => {
  console.log(`🧠 AI Agent Server running on port ${port}`);
  console.log(`   Groq:   ${GROQ_API_KEY ? '✅' : '❌ missing'}`);
  console.log(`   Tavily: ${process.env.TAVILY_API_KEY ? '✅' : '❌ missing'}`);
  console.log('');
  console.log('   10 Features Ready:');
  console.log('   1. Company Intelligence   (Tavily + Groq)');
  console.log('   2. AI Chat Interviewer    (Panel/Single)');
  console.log('   3. Answer Evaluator       (Score + Feedback)');
  console.log('   4. GitHub Code Analyzer   (Octokit + Groq)');
  console.log('   5. Text-to-Speech         (Groq PlayAI)');
  console.log('   6. Canvas Vision          (Groq Llama 4 Vision)');
  console.log('   7. Speech-to-Text         (Groq Whisper)');
  console.log('   8. Resume Parser          (Groq)');
  console.log('   9. Question Generator     (Resume + JD → Groq)');
  console.log('  10. Interview Report       (Post-session Analysis)');
});
