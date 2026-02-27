import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

const visionLlm = new ChatOpenAI({
  modelName: "gpt-4o", // Must be a vision-capable model
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * 1. Interface for the Vision Canvas Agent
 * Receives a Base64 encoded screenshot of the user's current drawing/architecture 
 * from the frontend (e.g., Tldraw or Excalidraw integration).
 */
export async function evaluateCanvasDesign(
    base64Image: string, 
    currentQuestionContext: string,
    previousCanvasStateSummary: string = ""
): Promise<{ actionable_feedback: string, new_followup_question: string }> {

  try {
    const systemPrompt = `
      You are an elite Staff Software Engineer conducting a System Design Interview. 
      You are looking at a live whiteboard/canvas drawn by the candidate.
      
      Current Interview Context (What you asked them to design):
      ${currentQuestionContext}

      ${previousCanvasStateSummary ? `Previous State Summary: ${previousCanvasStateSummary}` : ''}

      Analyze the image of the architecture they are drawing.
      1. Point out one critical missing component, bottleneck, or single point of failure.
      2. Ask a highly specific follow-up question based *exactly* on what they have drawn so far (e.g., "I see you put a Redis cache between the API and DB, what happens to inflight requests if the cache cluster dies?").

      Return EXACTLY a JSON object with two string keys: 
      - "actionable_feedback": A brief statement pointing out the flaw or interesting choice.
      - "new_followup_question": The specific architectural question.
      No markdown, just raw JSON.
    `;

    // Construct the payload for the Vision Model
    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage({
            content: [
                { type: "text", text: "Here is the candidate's current whiteboard architecture." },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${base64Image}`,
                        detail: "high"
                    },
                },
            ],
        }),
    ];

    const response = await visionLlm.invoke(messages);
    
    try {
        const cleanContent = response.content.toString().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanContent);
    } catch(e) {
        return { 
            actionable_feedback: "Could not clearly parse the architecture diagram.",
            new_followup_question: "Could you walk me through the specific components you've drawn so far?" 
        };
    }

  } catch (error) {
    console.error("Vision Agent Error:", error);
    throw new Error("Failed to evaluate canvas design");
  }
}
