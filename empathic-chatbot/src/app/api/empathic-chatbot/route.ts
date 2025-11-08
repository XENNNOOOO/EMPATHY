// app/api/empathic-chatbot/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface SummarizeRequest {
  text: string;
}

type SuccessResponse = {
  response: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
};

type ErrorResponse = {
  error: string;
};

// --- System Instruction for LONG-MONOTONOUS Condition ---
const systemInstruction = {
  parts: [{
    text: "You are an experimental chatbot for a psychology study; respond to the user in a natural, empathetic, and conversational tone without sounding robotic or overly formal, keeping tone consistent across all replies, and provide a long answer (80–100 words)."
  }]
};
// -----------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    console.log('API route called!');

    const body: SummarizeRequest = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide text.' },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable.');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: text }]
            }
          ],
          systemInstruction: systemInstruction,
          generationConfig: {
            // ***FIX #2***: Increased tokens to 100 to ensure it does not hit MAX_TOKENS.
            // The system prompt will still keep the actual *response* short.
            maxOutputTokens: 1200,
            temperature: 0.1,
          },
        }),
      }
    );

    const data = await response.json();
    console.log('Gemini raw response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json(
        { error: `Gemini API error: ${data.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    if (data.error) {
      return NextResponse.json(
        { error: `Gemini API error: ${data.error.message}` },
        { status: 500 }
      );
    }

    // ***FIX #1***: Moved candidate declaration *before* it is accessed.
    const candidate = data.candidates?.[0];

    // --- Improved check for safety/block reasons ---
    if (!candidate) {
        console.error('No candidate found in Gemini response:', data);
        return NextResponse.json(
          { error: 'No response candidate found.' },
          { status: 500 }
        );
    }
    
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      console.warn(`Gemini finished with reason: ${candidate.finishReason}`);
      if (candidate.finishReason === "MAX_TOKENS") {
          return NextResponse.json(
            { error: 'Model output was cut off (MAX_TOKENS).' },
            { status: 500 }
          );
      }
      // Handle other reasons like SAFETY, RECITATION, etc.
      return NextResponse.json(
        { error: `Gemini stopped generating for an unexpected reason: ${candidate.finishReason}` },
        { status: 500 }
      );
    }
    // ----------------------------------------------------

    const textResponse = candidate?.content?.parts?.[0]?.text?.trim();

    if (!textResponse) {
      console.error('Unexpected Gemini response format or empty text:', data);
      return NextResponse.json(
        { error: 'Invalid or empty response from Gemini API' },
        { status: 500 }
      );
    }

    const usageMetadata = data.usageMetadata || {};

    return NextResponse.json({
      response: textResponse,
      usage: {
        promptTokens: usageMetadata.promptTokenCount || 0,
        candidatesTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
      },
    });

  } catch (err: unknown) {
    console.error('Response error:', err);

    if (err instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate response: ${err.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response due to an unknown error.' },
      { status: 500 }
    );
  }
}
