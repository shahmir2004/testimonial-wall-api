// hf-tester/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config(); // Load variables from .env file

const app = express();
const PORT = process.env.PORT || 3001; // Render will provide the PORT

app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON body parsing

// The API endpoint will now be at the root of this server
app.post('/api/summarize', async (req, res) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Server Config Error: Missing GEMINI_API_KEY.');
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'A valid "text" field is required.' });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `You are a marketing assistant... Testimonial: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary) {
      throw new Error('AI failed to produce a valid summary.');
    }

    return res.status(200).json({ summary: summary.trim() });

  } catch (error) {
    console.error("Critical Error in summarize function:", error);
    return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
});

// A root route for health checks
app.get('/', (req, res) => {
    res.send('AI Summarizer API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});