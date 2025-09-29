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

export async function POST(request: NextRequest) {
  try {
    console.log('API route called!');

    const body: SummarizeRequest = await request.json();
    const { text } = body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide scenario (minimum 10 characters).' },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable.');
    }

    const prompt = `You are an empathetic assistant. 
    Your job is to respond quickly and kindly to the user’s feelings.
    Write 3 short supportive sentences only. 
    Do not restate the user’s message. Respond immediately and concisely with a maximum of 150 words. 
    User's Message: \n\n${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.3,
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


    const candidate = data.candidates?.[0];
    const textResponse = candidate?.content?.parts?.[0]?.text?.trim();

    if (!textResponse) {
      console.error('Unexpected Gemini response format:', data);
      return NextResponse.json(
        { error: 'Invalid response format from Gemini API' },
        { status: 500 }
      );
    }


    const usageMetadata = data.usageMetadata || {};

    return NextResponse.json({
      response: candidate.content.parts[0].text.trim(),
      usage: {
        promptTokens: usageMetadata.promptTokenCount || 0,
        candidatesTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
      },
    });

  } catch (err: unknown) {
    console.error('Respone error:', err);

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