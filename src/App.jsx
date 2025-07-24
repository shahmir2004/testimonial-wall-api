// hf-tester/src/App.jsx
import React, { useState } from 'react';
import './App.css'; // Make sure you have the corresponding CSS file

function App() {
  // State for the text area input
  const [inputText, setInputText] = useState(
    "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930."
  );
  // State to hold the final summary from the AI
  const [summary, setSummary] = useState('');
  // State to manage the loading spinner and disable the button
  const [isLoading, setIsLoading] = useState(false);
  // State to hold any error messages
  const [error, setError] = useState('');

  // Function to handle the button click
  const handleSummarize = async () => {
    // 1. Set initial states for a new request
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      // 2. Define the API endpoint for our Vercel Serverless Function
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/summarize`;

      // 3. Make the POST request to our backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      // 4. Always parse the JSON response body, whether it's a success or an error
      const responseData = await response.json();

      // 5. Check if the response was not successful (e.g., status 400, 500, etc.)
      if (!response.ok) {
        // If it failed, the `responseData.error` field will contain our readable message from the backend.
        // We throw this as a new Error to be caught by the catch block.
        throw new Error(responseData.error || `Request failed with an unknown error.`);
      }

      // 6. If the request was successful, set the summary state with the result
      setSummary(responseData.summary);

    } catch (err) {
      // 7. Catch any errors (from the `throw new Error` or network failures)
      console.error("Summarization Error:", err);
      // Set the error state so it can be displayed in the UI
      setError(err.message);
    } finally {
      // 8. No matter what happens, stop the loading state
      setIsLoading(false);
    }
  };

  // The JSX for rendering the user interface
  return (
    <div className="container">
      <header>
        <h1>Simple AI Summarizer Test</h1>
        <p>A minimal app to test an AI model (Google Gemini) via a Vercel Serverless Function.</p>
      </header>

      <main>
        <div className="input-section">
          <label htmlFor="text-to-summarize">Text to Summarize:</label>
          <textarea
            id="text-to-summarize"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows="10"
            placeholder="Paste a long paragraph here..."
          />
          <button onClick={handleSummarize} disabled={isLoading || !inputText.trim()}>
            {isLoading ? 'Summarizing...' : '✨ Summarize with AI'}
          </button>
        </div>

        <div className="output-section">
          <h2>Result:</h2>
          {isLoading && <div className="loading-spinner"></div>}
          {error && <div className="error-message">{error}</div>}
          {summary && <div className="summary-result">{summary}</div>}
        </div>
      </main>
    </div>
  );
}

export default App;