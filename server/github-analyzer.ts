import { Octokit } from "@octokit/rest";
import * as acorn from "acorn";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1024;

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  return data.choices[0].message.content as string;
}

/**
 * 1. Fetch user's top recent repositories
 */
async function fetchTopRepos(username: string) {
  try {
    const { data } = await octokit.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 3,
    });
    return data;
  } catch (error) {
    console.error(`Error fetching repos for ${username}:`, error);
    return [];
  }
}

/**
 * 2. Fetch specific critical files from a repository
 */
async function fetchCriticalFiles(owner: string, repo: string) {
  const filesToAnalyze = [];
  try {
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: '1'
    });

    const targetExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', 'package.json'];
    const codeFiles = (treeData.tree as any[])
      .filter(file => file.type === 'blob' && targetExtensions.some(ext => file.path?.endsWith(ext)))
      .slice(0, 5);

    for (const file of codeFiles) {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.path,
      });
      if (!Array.isArray(data) && data.type === 'file' && data.content) {
        filesToAnalyze.push({
          path: file.path,
          content: Buffer.from(data.content, 'base64').toString('utf-8')
        });
      }
    }
  } catch(e) { /* Ignore empty/auth errors */ }
  return filesToAnalyze;
}

/**
 * 3. Use AST (Acorn) to extract structural summary — reduces tokens sent to Groq.
 */
function analyzeAST(codeText: string, filename: string): string {
    if (!filename.endsWith('.js') && !filename.endsWith('.ts') && !filename.endsWith('.jsx') && !filename.endsWith('.tsx')) {
        return `File: ${filename}\n(Raw snippet preview)\n${codeText.substring(0, 500)}...`;
    }
    try {
        acorn.parse(codeText, { ecmaVersion: 2020, sourceType: 'module' });
        return `File: ${filename} (Parsable Structure)\n  Successfully parsed as JS/TS module. Contains logic.\n`;
    } catch {
        return `File: ${filename}\n(Contains raw logic)\n${codeText.substring(0, 500)}...`;
    }
}

/**
 * Main Interface: Generates questions based on a GitHub username
 */
export async function generateGitHubQuestions(username: string): Promise<string[]> {
  const repos = await fetchTopRepos(username);
  if (!repos.length) {
    return ["I see you don't have public GitHub repositories listed. Could you describe a recent technical project you built from scratch?"];
  }

  let systemSummary = `Candidate: ${username}\nActive Repositories Analysed:\n`;

  for (const repo of repos) {
    systemSummary += `\n--- Repository: ${repo.name} (Language: ${repo.language}) ---\n`;
    const files = await fetchCriticalFiles(username, repo.name);
    for (const file of files) {
       systemSummary += analyzeAST(file.content, file.path) + "\n";
    }
  }

  const prompt = `
    You are an elite Senior Staff Engineer conducting a technical interview.
    Before the interview, you reviewed the candidate's actual public GitHub codebase.

    Here is a summarized structural analysis of their top recent repositories:
    ${systemSummary}

    Based ONLY on the actual code, architecture, or languages they used in these repositories, formulate 2 highly specific, challenging technical interview questions.
    Make it clear you read their code (e.g. "I saw in your 'ecommerce' repo you used Express but didn't implement rate limiting. How would you architect that?").

    Return EXACTLY a JSON array of strings. No markdown formatting.
  `;

  const raw = await callGroq(prompt);

  try {
    return JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch {
    return [raw];
  }
}
