import { createOpenAI } from "@ai-sdk/openai";
import { getServerEnv } from "@/lib/env";

export const groqConfig = {
  apiKeyEnv: "GROQ_API_KEY",
  defaultModelEnv: "GROQ_CHAT_MODEL",
  defaultModel: "llama-3.3-70b-versatile",
} as const;

export type CoachToolName =
  | "addHydrationLog"
  | "createMealFromText"
  | "updateMealNutrition"
  | "deleteMeal"
  | "markSupplementTaken"
  | "createCoachMemory";

export type CoachProvider = "groq";

export function getCoachProvider(): CoachProvider {
  return "groq";
}

export function getGroqChatModel() {
  const env = getServerEnv();
  const groq = createOpenAI({
    apiKey: env.groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  return groq(env.groqChatModel);
}
