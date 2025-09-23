// app/chatbot/page.tsx
"use client";
import { useState } from 'react';

// Define types for better type safety
type SuccessResponse = {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type ErrorResponse = {
  error: string;
};

type SummarizeResponse = SuccessResponse | ErrorResponse;

export default function TextSummarizer() {
  const [inputText, setInputText] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setResponse('');

  try {
    const response = await fetch('/api/empathic-chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: inputText }),
    });

    const data: SummarizeResponse = await response.json();

    // ✅ Type guard: if it has 'error', it's an error response → throw
    if ('error' in data) {
      throw new Error(data.error);
    }

    // ✅ TypeScript now knows data is SuccessResponse
    setResponse(data.response);

  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unknown error occurred');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>💕 Empathic Chatbot 💕</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="text" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Scenario:
          </label>
          <textarea
            id="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="text here..."
            rows={8}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Responding' : 'Response'}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33',
          }}
        >
          Error: {error}
        </div>
      )}

      {response && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f0f8ff',
            border: '1px solid #0070f3',
            borderRadius: '4px',
          }}
        >
          <h3>📋 Summary:</h3>
          <p style={{ lineHeight: '1.6' }}>{response}</p>
        </div>
      )}

      {/* Sample text for testing */}
      <div style={{ marginTop: '2rem', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Tip:</strong> Try this sample scenario:
        </p>
        <textarea
          readOnly
          value={`I have so much homework and exams coming up. I feel like I'm drowning and I don't know where to start. My parents keep asking about my grades and I'm afraid to tell them.`}
          style={{
            width: '100%',
            height: '80px',
            padding: '0.5rem',
            border: '1px solid #eee',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9',
          }}
        />
        <button
        
          onClick={() =>
            setInputText(
                "I have so much homework and exams coming up. I feel like I'm drowning and I don't know where to start. My parents keep asking about my grades and I'm afraid to tell them."
            )
          }
          style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            fontSize: '12px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Use Sample Text
        </button>
      </div>
     
    </div>
  );
}