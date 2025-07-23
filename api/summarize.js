// hf-tester/api/summarize.js
// This function now uses the official @google/generative-ai SDK.
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
    // 1. Get the secret Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Server Config Error: Missing GEMINI_API_KEY environment variable.');
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
    // Initialize the client with your API key
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Construct the prompt
    const prompt = `You are a marketing assistant. Summarize the following customer testimonial into a single, punchy, and positive sentence suitable for a website's 'Wall of Love'. Focus on the core benefit or emotion. Do not add any extra text or quotation marks, just the summarized sentence. Testimonial: "${text}"`;

    // Generate the content
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
    console.error("Critical Error in summarize function:", error);
    // The SDK often provides a more detailed error message
    const errorMessage = error.message || 'An internal server error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}