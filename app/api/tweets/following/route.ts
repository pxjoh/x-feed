import { NextResponse } from 'next/server';
import { cacheGet } from '@/lib/cache';
import type { Tweet } from '@/lib/twitter';

export async function GET() {
  const tweets = await cacheGet<Tweet[]>('tweets:following');
  return NextResponse.json({ tweets: tweets ?? [] });
}
