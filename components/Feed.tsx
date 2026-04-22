'use client';

import useSWR from 'swr';
import TweetCard from './TweetCard';
import type { Tweet } from '@/lib/twitter';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-zinc-800 rounded" />
          <div className="h-3 w-20 bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-zinc-800 rounded" />
        <div className="h-3 w-5/6 bg-zinc-800 rounded" />
        <div className="h-3 w-4/6 bg-zinc-800 rounded" />
      </div>
      <div className="flex gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 w-12 bg-zinc-800 rounded" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-zinc-900 border border-red-900 rounded-xl p-6 text-center">
      <p className="text-red-400 text-sm font-medium">Failed to load tweets</p>
      <p className="text-zinc-500 text-xs mt-1">{message}</p>
    </div>
  );
}

import type { Tab } from './TabNav';

interface FeedProps {
  tab: Tab;
  sport: string;
}

function apiUrl(tab: Tab, sport: string): string {
  if (tab === 'following') return '/api/tweets/following';
  if (tab === 'trending') return '/api/tweets/trending';
  if (tab === 'sports') return `/api/tweets/sports?topic=${sport}`;
  return '/api/tweets/competitors';
}

export default function Feed({ tab, sport }: FeedProps) {
  const url = apiUrl(tab, sport);
  const { data, error, isLoading, mutate } = useSWR<{ tweets: Tweet[]; error?: string }>(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true, // Only fetch once on initial mount
    dedupingInterval: Infinity, // Never auto-revalidate
  });

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error || data?.error) {
    return <ErrorState message={data?.error ?? 'Network error'} />;
  }

  const tweets = data?.tweets ?? [];

  if (tweets.length === 0) {
    return (
      <div className="mt-8 text-center text-zinc-500 text-sm">
        No tweets found.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => mutate()}
        className="mb-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors"
      >
        🔄 Refresh Feed
      </button>
      <div className="space-y-3">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    </div>
  );
}
