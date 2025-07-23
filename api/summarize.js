// api/ai/summarize.js

import dotenv from 'dotenv';
import path from 'path';

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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- Environment Variable Checks ---
    const geminiApiKey = process.env.TSW_GEMINI_API_KEY;
    

    if (!geminiApiKey) throw new Error('Server Config Error: Missing TSW_GEMINI_API_KEY.');
    
    // --- Validate the request body (remains the same) ---
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length < 10) { /* ... */ }

    // --- 3. Call the Google Gemini API ---
     const model = 'gemini-1.5-flash-latest'; // Use the fast and powerful Flash model
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const prompt = `You are a marketing assistant. Summarize the following customer testimonial into a single, punchy, and positive sentence suitable for a website's 'Wall of Love'. Focus on the core benefit or emotion. Do not add any extra text or quotation marks, just the summarized sentence. Testimonial: "${text}"`;

       const geminiResponse = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        }),
    });

    const result = await geminiResponse.json();


    if (!geminiResponse.ok) {
      console.error("Gemini API Error Response:", result);
      // Extract the specific error message from Google's response object
      const errorMessage = result.error?.message || 'Failed to get summary from Gemini AI.';
      throw new Error(errorMessage);
    }

    // Safely access the nested summary text
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!summary) {
      console.error("Unexpected Gemini Response Structure:", result);
      throw new Error('AI returned an unexpected response structure.');
    }

    // 4. Return the successful response
    return new Response(JSON.stringify({ summary: summary.trim() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Critical Error in summarize function:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}