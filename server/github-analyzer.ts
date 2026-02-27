import { Octokit } from "@octokit/rest";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import * as acorn from "acorn"; // Lightweight AST parser for JS/TS
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * 1. Fetch user's top recent repositories
 */
async function fetchTopRepos(username: string) {
  try {
    const { data } = await octokit.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 3, // Just top 3 active repos
    });
    return data;
  } catch (error) {
    console.error(`Error fetching repos for ${username}:`, error);
    return [];
  }
}

/**
 * 2. Fetch specific critical files from a repository (e.g., package.json, src/index, architecture folders)
 */
async function fetchCriticalFiles(owner: string, repo: string) {
  // A naive approach: look for 'package.json' or a main 'src' tree
  // In a full implementation, we'd recursively clone or use the Git Trees API to find key structural files
  const filesToAnalyze = [];
  try {
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: '1'
    });

    const targetExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', 'package.json'];
    // Slice top 5 largest or most complex looking files (very simplified heuristic)
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
 * 3. Use AST (Acorn) to extract structural components (Functions, Classes, Imports)
 * This reduces the token load sent to the LLM by summarizing the code structure.
 */
function analyzeAST(codeText: string, filename: string): string {
    if (!filename.endsWith('.js') && !filename.endsWith('.ts') && !filename.endsWith('.jsx') && !filename.endsWith('.tsx')) {
        return `File: ${filename}\n(Raw snippet preview)\n${codeText.substring(0, 500)}...`;
    }

    try {
        // Very basic parsing attempt. Real AST requires robust loaders for TSX
        const ast = acorn.parse(codeText, { ecmaVersion: 2020, sourceType: 'module' });
        // Simplified summary
        let summary = `File: ${filename} (Parsable Structure)\n`;
        // In a true AST implementation, we traverse the nodes here (e.g. estraverse)
        // to list out class names, exported functions, and heavy dependencies.
        summary += `  Successfully parsed as JS/TS module. Contains logic.\n`;
        return summary;
    } catch(e) {
        // Fallback to raw text summary
        return `File: ${filename}\n(Contains raw logic)\n${codeText.substring(0, 500)}...`;
    }
}

/**
 * Main Interface: Generates questions based on a GitHub username
 */
export async function generateGitHubQuestions(username: string): Promise<string[]> {
  const repos = await fetchTopRepos(username);
  if (!repos.length) return ["I see you don't have public GitHub repositories listed. Could you describe a recent technical project you built from scratch?"];

  let systemSummary = `Candidate: ${username}\nActive Repositories Analysed:\n`;
  
  for (const repo of repos) {
    systemSummary += `\n--- Repository: ${repo.name} (Language: ${repo.language}) ---\n`;
    const files = await fetchCriticalFiles(username, repo.name);
    for (const file of files) {
       systemSummary += analyzeAST(file.content, file.path) + "\n";
    }
  }

  const prompt = PromptTemplate.fromTemplate(`
    You are an elite Senior Staff Engineer conducting a technical interview.
    Before the interview, you reviewed the candidate's actual public GitHub codebase.
    
    Here is a summarized structural analysis of their top recent repositories:
    {systemSummary}
    
    Based ONLY on the actual code, architecture, or languages they used in these repositories, formulate 2 highly specific, challenging technical interview questions. 
    Make it clear you read their code. (e.g. "I saw in your 'ecommerce' repo you used Express but didn't implement rate limiting. How would you architect that?").
    
    Return EXACTLY a JSON array of strings. No markdown formatting.
  `);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ systemSummary });
  
  try {
     return JSON.parse((response.content as string).replace(/```json/g, '').replace(/```/g, '').trim());
  } catch(e) {
     return [response.content as string];
  }
}
