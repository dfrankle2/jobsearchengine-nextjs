import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasExaKey: !!process.env.EXA_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    // Don't expose actual values for security
    exaKeyLength: process.env.EXA_API_KEY?.length || 0,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
  });
}