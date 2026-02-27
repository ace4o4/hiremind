import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { tavily } from '@tavily/core';
import { generateGitHubQuestions } from './github-analyzer.js';
import { evaluateCanvasDesign } from './canvas-vision-agent.js';

dotenv.config({ path: '../.env' }); // Load from parent directory

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

// Initialize LangChain Models
const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY, // Assume user adds this to .env
});

const fastLlm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// --- 1. Tavily Intelligence Agent Endpoint ---
app.post('/api/agents/tavily-research', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Use Tavily to search for recent company news
    const searchTool = tavily({
      apiKey: process.env.TAVILY_API_KEY, // Assume user adds this to .env
    });
    
    const searchResponse = await searchTool.search(`${companyName} recent news tech layoffs product launches`, { maxResults: 3 });
    const searchResults = JSON.stringify(searchResponse.results);
    
    // Synthesize the results into 2 killer questions
    const synthesisPrompt = PromptTemplate.fromTemplate(`
      You are an expert technical recruiter preparing for an interview with a candidate applying to {company}.
      Here is the latest news about {company}:\n\n{news}\n\n
      Based STRICTLY on this news, generate 2 hyper-relevant, challenging interview questions that test the candidate's industry awareness and ability to adapt to the company's current situation.
      Return ONLY a JSON array of strings containing the questions.
    `);

    const chain = synthesisPrompt.pipe(fastLlm);
    const response = await chain.invoke({ company: companyName, news: searchResults });

    let parsedQuestions = [];
    try {
      // Clean up potential markdown formatting from LLM response
      const cleanContent = (response.content as string).replace(/```json/g, '').replace(/```/g, '').trim();
      parsedQuestions = JSON.parse(cleanContent);
    } catch(e) {
      parsedQuestions = [response.content]; // Fallback if not strict JSON
    }

    res.json({ questions: parsedQuestions, raw_news: searchResults });

  } catch (error) {
    console.error("Tavily Agent Error:", error);
    res.status(500).json({ error: 'Failed to run intelligence agent' });
  }
});

// --- 2. Main Interviewer Logic Edge ---
app.post('/api/agents/chat', async (req, res) => {
  try {
    const { message, history, persona } = req.body;

    const systemPrompt = `
      You are an expert AI Interviewer for a Senior Tech Role. Your current persona is: ${persona || 'Standard Technical Lead'}.
      Act strictly as the interviewer. Ask ONE question at a time. Evaluate the candidate's last answer briefly before asking the next question.
      Keep your responses concise, professional, and directly related to the role setup.
    `;

    // Construct history for LangChain
    const messages = [
      ["system", systemPrompt],
      ...history.map((msg: any) => [msg.role === 'user' ? 'human' : 'ai', msg.content]),
      ["human", message]
    ];

    const response = await llm.invoke(messages);

    res.json({ 
      content: response.content,
      // You could also run an EQ analyzer here using sentiment analysis on the user's message
    });
  } catch (error) {
    console.error("Chat Agent Error:", error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// --- 3. Evaluator Agent (Async Grading) ---
app.post('/api/agents/evaluate', async (req, res) => {
  try {
     const { question, answer } = req.body;

     const evaluationPrompt = PromptTemplate.fromTemplate(`
        You are an expert strict interview evaluator. 
        Question asked: "{question}"
        Candidate's answer: "{answer}"
        
        Evaluate the answer on two metrics from 0 to 100:
        1. Content Quality (Accuracy, depth, STAR method usage if behavioral)
        2. Delivery (Clarity, structure, confidence implied by phrasing)
        
        Provide constructive feedback (max 2 sentences) pointing out exactly what was missing or what was good.
        Also, determine if this answer reveals a fundamental "weakness" (True/False).
        
        Return STRICTLY in this JSON format:
        {{"score_content": 85, "score_delivery": 70, "feedback": "Good structural approach but lacked specific metrics in the result phase.", "is_weakness": false}}
     `);

     const chain = evaluationPrompt.pipe(fastLlm);
     const response = await chain.invoke({ question, answer });
     
     let evaluation;
     try {
       const cleanContent = (response.content as string).replace(/```json/g, '').replace(/```/g, '').trim();
       evaluation = JSON.parse(cleanContent);
     } catch(e) {
       evaluation = { score_content: 50, score_delivery: 50, feedback: "Failed to parse evaluation.", is_weakness: true };
     }

     res.json(evaluation);
  } catch (error) {
    console.error("Evaluator Agent Error:", error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// --- 4. Killer Feature: GitHub Code Analysis Agent ---
app.post('/api/agents/github-code-review', async (req, res) => {
  try {
    const { githubUsername } = req.body;
    if (!githubUsername) return res.status(400).json({ error: 'GitHub username required' });

    const questions = await generateGitHubQuestions(githubUsername);
    res.json({ questions });
  } catch (error) {
    console.error("GitHub Agent Error:", error);
    res.status(500).json({ error: 'Failed to analyze GitHub repositories' });
  }
});

// --- 5. Killer Feature: Interactive Canvas Vision Agent ---
app.post('/api/agents/canvas-evaluator', async (req, res) => {
  try {
    const { base64Image, currentQuestionContext, previousCanvasStateSummary } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'Base64 image is required' });

    const evaluation = await evaluateCanvasDesign(
        base64Image, 
        currentQuestionContext || "Design a scalable backend architecture.", 
        previousCanvasStateSummary
    );
    res.json(evaluation);
  } catch (error) {
    console.error("Canvas Vision Agent Error:", error);
    res.status(500).json({ error: 'Failed to evaluate canvas architecture' });
  }
});

app.listen(port, () => {
  console.log(`🧠 AI Agent Server running on port ${port}`);
});
