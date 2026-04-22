import { NextResponse } from 'next/server';
import { searchRecentTweets } from '@/lib/twitter';
import { cacheGet, cacheSet } from '@/lib/cache';
import { rephraseWithClaude } from '@/lib/rephrase';
import { sendTweetEmail } from '@/lib/email';
import type { Tweet } from '@/lib/twitter';

const FOLLOWING_ACCOUNTS = [
  'UnderdogFantasy', 'Underdog_NFL', 'UnderdogNBA',
  'UnderdogNHL', 'UnderdogMLB', 'AdamSchefter', 'YahooSports',
];

const SEARCH_QUERY = `(${FOLLOWING_ACCOUNTS.map((a) => `from:${a}`).join(' OR ')}) -is:retweet`;
const SEEN_IDS_KEY = 'following:seen_ids';
const TWEETS_CACHE_KEY = 'tweets:following';

export async function GET(req: Request) {
  // Vercel sets this header automatically for cron jobs
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Search last 5 minutes (buffer covers the 2-min cron interval safely)
    const recent = await searchRecentTweets(SEARCH_QUERY, 20, 5 / 60);

    const seenIds = new Set<string>(await cacheGet<string[]>(SEEN_IDS_KEY) ?? []);
    const newTweets = recent.filter((t) => !seenIds.has(t.id));

    for (const tweet of newTweets) {
      try {
        const rephrased = await rephraseWithClaude(tweet);
        await sendTweetEmail(tweet, rephrased);
      } catch (err) {
        console.error(`Failed to process tweet ${tweet.id}:`, err);
      }
      seenIds.add(tweet.id);
    }

    if (newTweets.length > 0 || !(await cacheGet<Tweet[]>(TWEETS_CACHE_KEY))) {
      // Keep last 500 seen IDs to prevent unbounded growth
      await cacheSet(SEEN_IDS_KEY, Array.from(seenIds).slice(-500), 24 * 60 * 60);

      // Merge new tweets into the display cache (newest first, cap at 50)
      const existing = await cacheGet<Tweet[]>(TWEETS_CACHE_KEY) ?? [];
      const merged = [...newTweets, ...existing]
        .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
        .slice(0, 50);
      await cacheSet(TWEETS_CACHE_KEY, merged, 30 * 60); // 30-min display cache
    }

    return NextResponse.json({ checked: recent.length, new: newTweets.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cron error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
