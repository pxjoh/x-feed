const BEARER_TOKEN = process.env.X_BEARER_TOKEN!;
const BASE_URL = 'https://api.twitter.com/2';

export interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    handle: string;
    avatar_url: string;
  };
  created_at: string;
  metrics: {
    views: number;
    replies: number;
    likes: number;
    retweets: number;
  };
}

interface RawTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
}

interface RawUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
}

function authHeader() {
  return { Authorization: `Bearer ${BEARER_TOKEN}` };
}

function buildTweet(raw: RawTweet, userMap: Map<string, RawUser>): Tweet {
  const user = userMap.get(raw.author_id);
  return {
    id: raw.id,
    text: raw.text,
    author: {
      name: user?.name ?? 'Unknown',
      handle: user?.username ?? 'unknown',
      avatar_url: user?.profile_image_url ?? '',
    },
    created_at: raw.created_at,
    metrics: {
      views: raw.public_metrics?.impression_count ?? 0,
      replies: raw.public_metrics?.reply_count ?? 0,
      likes: raw.public_metrics?.like_count ?? 0,
      retweets: raw.public_metrics?.retweet_count ?? 0,
    },
  };
}

export async function searchRecentTweets(
  query: string,
  maxResults = 100,
  startHoursAgo = 12,
  endHoursAgo?: number,
): Promise<Tweet[]> {
  const startTime = new Date(Date.now() - startHoursAgo * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(maxResults, 100)),
    start_time: startTime,
    'tweet.fields': 'created_at,public_metrics,author_id',
    expansions: 'author_id',
    'user.fields': 'name,username,profile_image_url',
  });
  if (endHoursAgo !== undefined && endHoursAgo > 0) {
    params.set('end_time', new Date(Date.now() - endHoursAgo * 60 * 60 * 1000).toISOString());
  }

  const res = await fetch(`${BASE_URL}/tweets/search/recent?${params}`, {
    headers: authHeader(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 402) {
      try {
        const errorData = JSON.parse(body);
        if (errorData.title === 'CreditsDepleted') {
          throw new Error('X API credits depleted. Please add credits to your Twitter Developer account at https://developer.twitter.com/en/portal/dashboard');
        }
      } catch {
        // If parsing fails, fall through to generic error
      }
    }
    throw new Error(`X API search error ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (!data.data) return [];

  const userMap = new Map<string, RawUser>(
    (data.includes?.users ?? []).map((u: RawUser) => [u.id, u])
  );

  return data.data.map((t: RawTweet) => buildTweet(t, userMap));
}

export async function getUserIdsByUsernames(usernames: string[]): Promise<Map<string, string>> {
  const params = new URLSearchParams({ usernames: usernames.join(',') });

  const res = await fetch(`${BASE_URL}/users/by?${params}`, {
    headers: authHeader(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 402) {
      try {
        const errorData = JSON.parse(body);
        if (errorData.title === 'CreditsDepleted') {
          throw new Error('X API credits depleted. Please add credits to your Twitter Developer account at https://developer.twitter.com/en/portal/dashboard');
        }
      } catch {
        // If parsing fails, fall through to generic error
      }
    }
    throw new Error(`X API users/by error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const map = new Map<string, string>();
  for (const user of data.data ?? []) {
    map.set(user.username.toLowerCase(), user.id);
  }
  return map;
}

export async function getUserTweets(userId: string, maxResults = 10): Promise<Tweet[]> {
  const params = new URLSearchParams({
    max_results: String(Math.min(maxResults, 100)),
    'tweet.fields': 'created_at,public_metrics,author_id',
    expansions: 'author_id',
    'user.fields': 'name,username,profile_image_url',
    exclude: 'retweets,replies',
  });

  const res = await fetch(`${BASE_URL}/users/${userId}/tweets?${params}`, {
    headers: authHeader(),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 402) {
      try {
        const errorData = JSON.parse(body);
        if (errorData.title === 'CreditsDepleted') {
          throw new Error('X API credits depleted. Please add credits to your Twitter Developer account at https://developer.twitter.com/en/portal/dashboard');
        }
      } catch {
        // If parsing fails, fall through to generic error
      }
    }
    throw new Error(`X API user tweets error ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (!data.data) return [];

  const userMap = new Map<string, RawUser>(
    (data.includes?.users ?? []).map((u: RawUser) => [u.id, u])
  );

  return data.data.map((t: RawTweet) => buildTweet(t, userMap));
}
