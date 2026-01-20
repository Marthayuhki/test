import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// NOTE: In a real app, API Key should be in process.env.API_KEY
// For this generated code to function without a bundler setup, we assume process.env.API_KEY is available.
// Ideally, the user provides this key in their environment.
const apiKey = process.env.API_KEY || ''; 

let aiClient: GoogleGenAI | null = null;

if (apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
}

export const sendMessageToGemini = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  if (!aiClient) {
    console.warn("Gemini API Key missing");
    return "I'm sorry, I'm currently offline (API Key missing).";
  }

  try {
    const model = 'gemini-3-flash-preview'; // Used for basic text tasks
    const contents = [...history, { role: 'user', parts: [{ text: message }] }];

    const response = await aiClient.models.generateContent({
      model: model,
      contents: contents as any, // Cast to any to avoid strict type checks on history structure for this MVP
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the library network. Please try again later.";
  }
};