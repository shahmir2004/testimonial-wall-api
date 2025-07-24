// hf-tester/api/summarize.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get the secret Gemini API key directly from process.env
    // This is the variable you MUST set in your Vercel project settings.
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // A hard check to ensure the variable is loaded in the Vercel environment.
    if (!geminiApiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable not found in function runtime.");
      throw new Error('Server is not configured correctly. API key is missing.');
    }

    // 2. Get the text from the request body
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'A valid "text" field is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 3. Call the Google Gemini API using the SDK
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `You are a marketing assistant. Summarize the following customer testimonial into one punchy, positive sentence. Focus on the core benefit or emotion. Do not add any extra text or quotation marks, just the summarized sentence. Testimonial: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary) {
      throw new Error('AI failed to produce a valid summary.');
    }

    // 4. Return the successful response
    return new Response(JSON.stringify({ summary: summary.trim() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in summarize function:", error);
    const errorMessage = error.message || 'An internal server error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}