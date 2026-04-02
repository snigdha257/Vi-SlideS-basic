import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_PROMPT = "You are a helpful teaching assistant who provides clear and concise answers 2 line answers to student questions .";

const SUMMARY_PROMPT = "You are an expert educator. Analyze the list of questions asked during a session and provide a concise summary (3-4 sentences) of the key topics and learning areas covered. Focus on identifying patterns and main themes.";

export async function askAI(question: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;

  const stripMarkdown = (text: string) => {
    return text.replace(/\*\*/g, "").replace(/#/g, "").trim();
  };

  // GROQ
  if (groqKey) {
    try {
      const groq = new Groq({
        apiKey: groqKey
      });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: `A student asked: "${question}"`
          }
        ],
        max_tokens: 300
      });

      const answer = completion.choices[0].message.content;
      if (answer) return stripMarkdown(answer);
    } catch (error: any) {
      console.error("Groq error:", error.message);
    }
  }

  return "Error: No AI API keys found in .env.";
}

export async function generateQuestionsummarY(questions: any[]): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;

  if (!questions || questions.length === 0) {
    return "No questions were asked during this session.";
  }

  const stripMarkdown = (text: string) => {
    return text.replace(/\*\*/g, "").replace(/#/g, "").trim();
  };

  // Format questions for the prompt
  const questionsList = questions
    .map((q: any) => `- "${q.question}" (asked by ${q.studentName})`)
    .join("\n");

  // GROQ
  if (groqKey) {
    try {
      const groq = new Groq({
        apiKey: groqKey
      });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: SUMMARY_PROMPT
          },
          {
            role: "user",
            content: `Here are the questions asked in a session:\n\n${questionsList}\n\nPlease provide a concise summary of the key topics covered and any insights about student learning needs.`
          }
        ],
        max_tokens: 500
      });

      const answer = completion.choices[0].message.content;
      if (answer) return stripMarkdown(answer);
    } catch (error: any) {
      console.error("Groq error in question summary:", error.message);
    }
  }

  return "Unable to generate summary at this moment.";
}