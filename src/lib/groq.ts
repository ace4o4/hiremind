const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 2048 }),
    });

    if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content as string;
}

export interface InterviewQuestion {
    id: number;
    type: 'behavioral' | 'technical' | 'situational';
    question: string;
    hint?: string;
}

export interface AnswerScore {
    score: number; // 0-100
    feedback: string;
    idealAnswer: string;
    strengths: string[];
    improvements: string[];
}

export async function generateQuestions(
    resumeText: string,
    jdText: string,
    role: string,
    company?: string
): Promise<InterviewQuestion[]> {
    const prompt = `You are an expert technical interviewer at ${company || 'a top tech company'}.

Job Role: ${role}
${company ? `Company: ${company}` : ''}

Job Description:
${jdText.slice(0, 1500)}

Candidate Resume:
${resumeText.slice(0, 1500)}

Generate exactly 10 interview questions tailored to this candidate and role. Mix of:
- 4 behavioral questions (use STAR method)
- 4 technical questions specific to the JD
- 2 situational/problem-solving questions

Return ONLY a JSON array. No extra text. Format:
[
  { "id": 1, "type": "behavioral", "question": "...", "hint": "Focus on STAR method" },
  { "id": 2, "type": "technical", "question": "...", "hint": "..." },
  ...
]`;

    const raw = await callGroq([{ role: 'user', content: prompt }]);

    // Extract JSON from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse questions from AI response');
    return JSON.parse(jsonMatch[0]) as InterviewQuestion[];
}

export async function scoreAnswer(
    question: string,
    answer: string,
    role: string,
    questionType: string
): Promise<AnswerScore> {
    const prompt = `You are a strict but fair interview evaluator for a ${role} position.

Question (${questionType}): ${question}

Candidate's Answer: ${answer}

Evaluate this answer on a scale of 0-100. Consider: relevance, depth, structure, and clarity.

Return ONLY a JSON object. No extra text. Format:
{
  "score": <0-100>,
  "feedback": "<2-3 sentence overall feedback>",
  "idealAnswer": "<what a perfect answer would include in 2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

    const raw = await callGroq([{ role: 'user', content: prompt }]);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse score from AI response');
    return JSON.parse(jsonMatch[0]) as AnswerScore;
}

export async function generateInterviewSummary(
    role: string,
    answers: { question: string; answer: string; score: number; feedback: string }[]
): Promise<{ overallScore: number; summary: string; topStrengths: string[]; topImprovements: string[] }> {
    const avgScore = Math.round(answers.reduce((a, b) => a + b.score, 0) / answers.length);

    const prompt = `You are an interview coach summarizing a mock interview for a ${role} position.

Interview scores: ${answers.map((a, i) => `Q${i + 1}: ${a.score}/100`).join(', ')}
Average: ${avgScore}/100

Based on these results, provide a summary. Return ONLY JSON:
{
  "overallScore": ${avgScore},
  "summary": "<3-4 sentence overall performance summary>",
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "topImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

    const raw = await callGroq([{ role: 'user', content: prompt }]);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { overallScore: avgScore, summary: 'Interview completed.', topStrengths: [], topImprovements: [] };
    return JSON.parse(jsonMatch[0]);
}
