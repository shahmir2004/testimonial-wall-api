// src/App.jsx
import React, { useState } from 'react';
import './App.css'; // We'll add styles here

function App() {
  const [inputText, setInputText] = useState("The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.");
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      // The API endpoint for our Vercel Serverless Function
      const apiUrl = '/api/summarize';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If the server returns an error (like 503, 400, 500), throw it
        throw new Error(responseData.error || `Request failed with status ${response.status}`);
      }

      setSummary(responseData.summary);

    } catch (err) {
      console.error("Summarization Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Simple Hugging Face Summarizer</h1>
        <p>A minimal app to test the `facebook/bart-large-cnn` model via a Vercel Serverless Function.</p>
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
          <button onClick={handleSummarize} disabled={isLoading}>
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