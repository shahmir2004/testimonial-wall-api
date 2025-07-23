// api/summarize.js
import { InferenceClient } from "@huggingface/inference";

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
    // Get the secret key from environment variables
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) {
      throw new Error('Server Config Error: Missing HF_API_KEY environment variable.');
    }

    // Get the text from the request body
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'A valid "text" field is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Call the Hugging Face API using the SDK
    const hf = new InferenceClient(hfApiKey);
    const result = await hf.summarization({
      model: "Falconsai/text_summarization",
      inputs: text,
    });

    // Extract the summary
    const summary = result.summary_text;
    if (!summary) {
      throw new Error('AI failed to produce a valid summary.');
    }

    // Return the successful response
    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Handle potential cold start errors from Hugging Face
    if (error.message && error.message.includes('is currently loading')) {
        return new Response(JSON.stringify({ error: `Model is warming up. Please try again in a moment.` }), {
          status: 503, // Service Unavailable
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    // Handle all other errors
    console.error("Error in summarize function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}