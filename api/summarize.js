// api/ai/summarize.js

import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
// Load .env.local in development
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};



const ai = new GoogleGenAI({});

export async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a 100 words",
  });
  return response.text;
}
