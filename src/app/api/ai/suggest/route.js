/**
 * src/app/api/ai/suggest/route.js
 * POST /api/ai/suggest
 * Forwards travel-related prompts to OpenAI and returns suggestions
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert travel planner assistant. Help users plan their trips by providing:
- Destination recommendations and highlights
- Activity suggestions based on interests and dates
- Budget tips and expense management advice
- Local food, culture, and travel tips
- Itinerary optimization suggestions
- Expense splitting strategies for group travel

Always be concise, practical, and enthusiastic. Format responses with bullet points for readability.
If asked about splitting expenses, explain fair division strategies.`;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, tripContext } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: 'Prompt too long (max 2000 chars)' }, { status: 400 });
    }

    // Build context-aware message
    let userMessage = prompt;
    if (tripContext) {
      userMessage = `Trip Context:
- Trip: ${tripContext.title || 'N/A'}
- Dates: ${tripContext.start_date || 'N/A'} to ${tripContext.end_date || 'N/A'}
- Destinations: ${tripContext.destinations?.join(', ') || 'N/A'}
- Members: ${tripContext.memberCount || 1} people
- Currency: ${tripContext.currency || 'USD'}

User Question: ${prompt}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const suggestion = completion.choices[0]?.message?.content || 'No suggestion available';

    return NextResponse.json({
      suggestion,
      tokens_used: completion.usage?.total_tokens || 0,
    });
  } catch (err) {
    console.error('AI suggest error:', err);

    if (err.status === 401) {
      return NextResponse.json({ error: 'Invalid OpenAI API key' }, { status: 502 });
    }
    if (err.status === 429) {
      return NextResponse.json({ error: 'OpenAI rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    return NextResponse.json({ error: 'AI suggestion failed' }, { status: 500 });
  }
}
