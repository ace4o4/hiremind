import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

/**
 * Evaluates a candidate's system-design whiteboard using Groq's vision model.
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
      2. Ask a highly specific follow-up question based *exactly* on what they have drawn so far.

      Return EXACTLY a JSON object with two string keys:
      - "actionable_feedback": A brief statement pointing out the flaw or interesting choice.
      - "new_followup_question": The specific architectural question.
      No markdown, just raw JSON.
    `;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.3,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: "Here is the candidate's current whiteboard architecture." },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq Vision ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as any;
    const rawContent = (data.choices[0].message.content as string)
      .replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(rawContent);
    } catch {
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
