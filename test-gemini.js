// test-gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables from the .env file in the current directory
dotenv.config();

// The SDK will automatically look for the `GEMINI_API_KEY` environment variable.
// If it's not found, you'll get an error.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runTest() {
  try {
    console.log("🟡 Attempting to call the Gemini API...");
    
    // Check if the API key was loaded
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined. Please check your .env file.");
    }

    // Get the generative model. Use the latest valid model name.
    // As of now, gemini-1.5-flash-latest is a great choice.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = "Explain how AI works in a 100 words";
    console.log(`\nPrompt: "${prompt}"`);

    // Generate the content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n✅ SUCCESS! API responded.");
    console.log("----------------------------------------");
    console.log("Response Text:");
    console.log(text);
    console.log("----------------------------------------");

  } catch (error) {
    console.error("\n🔴 FAILED! An error occurred.");
    console.error("----------------------------------------");
    // The SDK provides detailed error objects. Let's print the whole thing.
    console.error(error);
    console.error("----------------------------------------");
    console.error("TROUBLESHOOTING TIPS:");
    console.error("1. Is the GEMINI_API_KEY in your .env file correct and active?");
    console.error("2. Is the Google Cloud project associated with this key active with billing enabled?");
    console.error("3. Is the 'Generative Language API' or 'Vertex AI API' enabled in your Google Cloud project?");
  }
}

runTest();