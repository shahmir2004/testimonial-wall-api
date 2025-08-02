// server.js - The complete backend for Testimonial Wall
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import nodemailer from 'nodemailer';

// Load environment variables from .env file for local development
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Render will provide the PORT

// --- CORS Configuration ---
// This is crucial for security in production.
const allowedOrigins = [
  'http://localhost:5173', // Your local Vite frontend
  process.env.FRONTEND_URL    // Your live Vercel frontend URL
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
// --- End CORS ---

app.use(express.json()); // Middleware to parse JSON bodies

// === API ENDPOINTS ===

// --- 1. AI Summarizer Endpoint ---
app.post('/api/summarize', async (req, res) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!geminiApiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Server Config Error: Missing API keys or URLs.');
    }

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token.' });
    }
    const jwt = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    // Validate input
    const { text } = req.body;
    if (!text) { return res.status(400).json({ error: 'A valid "text" field is required.' }); }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `You are a marketing assistant... Testimonial: "${text}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    if (!summary) throw new Error('AI failed to produce a valid summary.');

    return res.status(200).json({ summary: summary.trim() });

  } catch (error) {
    console.error("Error in /api/summarize:", error);
    return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
});

// --- 2. Contact Form Endpoint ---
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER_SENDER,
        pass: process.env.EMAIL_PASS_SENDER,
      },
    });

    // Email to you
    const mailToOwnerOptions = {
      from: `"Portfolio Contact <${process.env.EMAIL_USER_SENDER}>"`,
      to: process.env.EMAIL_RECEIVER,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `...`, // Your HTML email body
    };
    await transporter.sendMail(mailToOwnerOptions);

    // Confirmation email to user
    const mailToUserOptions = {
      from: `"Shahmir Ahmed - Portfolio <${process.env.EMAIL_USER_SENDER}>"`,
      to: email,
      subject: "Thanks for contacting me!",
      html: `...`, // Your HTML confirmation body
    };
    await transporter.sendMail(mailToUserOptions);

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error("Error in /api/contact:", error);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

app.post('/api/testimonials/submit', async (req, res) => {
  try {
    // For this public endpoint, we create a client with the anon key
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { author_name, author_title, testimonial_text, userId } = req.body;

    // --- Validation ---
    if (!author_name || !testimonial_text || !userId) {
      return res.status(400).json({ error: 'Missing required fields: author_name, testimonial_text, and userId are required.' });
    }
    // A simple check to see if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ error: 'Invalid User ID format.' });
    }

    // --- Insert the new testimonial into the database ---
    // The RLS policy we will create will ensure this is allowed.
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        author_name: author_name,
        author_title: author_title || null, // Ensure optional fields are null if empty
        testimonial_text: testimonial_text,
        user_id: userId,
        is_published: false // <<-- IMPORTANT: New testimonials always come in as drafts (unpublished)
      });

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }
    
    // Optional: Update the status of a request link if you are tracking it in a `requests` table

    return res.status(200).json({ success: true, message: 'Thank you for your feedback!' });

  } catch (error) {
    console.error("Error in /api/testimonials/submit:", error);
    return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
});


// --- 3. Root Endpoint for Health Check ---
app.get('/', (req, res) => {
  res.status(200).send('Testimonial Wall API is alive and running!');
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});