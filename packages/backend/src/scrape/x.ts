// X (Twitter) user-timeline scraper.
//
// Lifted from gtm-tool/photon-gtm/agents/discovery/twitter-launches.py — the
// X API v2 call shape (recent-search → users/by/username → users/:id/tweets).
// Ports the XDK Python SDK pattern to raw fetch in TS.
//
// FAIL LOUD per CLAUDE.md Rule 6:
//   - X_BEARER_TOKEN not set → throw (don't try nitter mirrors — unreliable in 2026).
//   - Empty handle → throw.
//   - 404 (handle not found) → throw with handle.
//   - 401/403 (auth fail) → throw with status + body.
//   - Any other non-200 → throw with status + body.

import { log } from "../logger.js";

const X_API_BASE = "https://api.twitter.com/2";
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_TWEETS = 30;
const USER_AGENT = "DoublesBot/0.1 (+https://github.com/johnnysheng/doubles)";

export interface XTweet {
  id: string;
  text: string;
  created_at: string;
}

export interface XScrapeResult {
  handle: string;
  user_id: string;
  name: string;
  description: string;
  tweets: XTweet[];
}

export async function scrapeX(handle: string, maxTweets = DEFAULT_MAX_TWEETS): Promise<XScrapeResult> {
  if (!handle || handle.trim().length === 0) {
    throw new Error("[x] scrapeX() received empty handle — caller bug.");
  }
  const clean = handle.trim().replace(/^@/, "");

  const bearer = process.env.X_BEARER_TOKEN;
  if (!bearer) {
    throw new Error(
      `[x] X_BEARER_TOKEN env not set — refusing to scrape handle=${clean}. ` +
        `Nitter mirrors are unreliable in 2026; either set the bearer token ` +
        `(https://developer.twitter.com/en/portal/dashboard) or skip this scraper.`,
    );
  }

  log.debug("x_scrape_start", { handle: clean, maxTweets });

  const userResp = (await xGet(
    `/users/by/username/${encodeURIComponent(clean)}?user.fields=description,name,username`,
    bearer,
  )) as { data?: { id?: string; name?: string; username?: string; description?: string }; errors?: Array<Record<string, unknown>> };

  if (!userResp.data?.id) {
    throw new Error(
      `[x] users/by/username returned no data for handle=${clean}: errors=${JSON.stringify(userResp.errors ?? [])}`,
    );
  }
  const user = userResp.data;
  const userId = user.id!;

  // X caps per_page at 100; we keep 30 to match the github + general convention.
  const tweetsResp = (await xGet(
    `/users/${encodeURIComponent(userId)}/tweets?max_results=${Math.min(Math.max(maxTweets, 5), 100)}&tweet.fields=created_at`,
    bearer,
  )) as { data?: Array<{ id?: string; text?: string; created_at?: string }>; errors?: Array<Record<string, unknown>> };

  if (!Array.isArray(tweetsResp.data)) {
    throw new Error(
      `[x] /users/${userId}/tweets did not return an array for handle=${clean}: ` +
        `errors=${JSON.stringify(tweetsResp.errors ?? [])} data=${JSON.stringify(tweetsResp.data).slice(0, 200)}`,
    );
  }
  const tweets: XTweet[] = tweetsResp.data
    .filter((t) => t.id && t.text)
    .map((t) => ({
      id: t.id!,
      text: t.text!,
      created_at: t.created_at ?? "",
    }))
    .slice(0, maxTweets);

  const result: XScrapeResult = {
    handle: user.username ?? clean,
    user_id: userId,
    name: user.name ?? "",
    description: user.description ?? "",
    tweets,
  };

  log.info("x_scrape_ok", {
    handle: result.handle,
    user_id: result.user_id,
    tweetsCount: result.tweets.length,
  });

  return result;
}

export interface XUserTweet {
  id: string;
  text: string;
  createdAt: string;
  publicMetrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count?: number;
  };
}

/**
 * Fetch a user's last N days of public tweets via X API v2.
 * Two-step: GET /2/users/by/username/{handle} → id, then GET /2/users/{id}/tweets?...
 * Throws on 401/404/429 with status + first 500 chars of body.
 */
export async function fetchUserTweets(handle: string, days: number = 30): Promise<XUserTweet[]> {
  if (!handle || handle.trim().length === 0) {
    throw new Error("[x] fetchUserTweets() received empty handle — caller bug.");
  }
  const clean = handle.trim().replace(/^@/, "");

  const bearer = process.env.X_BEARER_TOKEN;
  if (!bearer) {
    throw new Error(
      `[x] X_BEARER_TOKEN env not set — refusing to fetch tweets for handle=${clean}.`,
    );
  }

  const t0 = Date.now();
  log.info("x_tweets_fetch_start", { handle: clean, days });

  let userId: string;
  try {
    const userResp = (await xGet(
      `/users/by/username/${encodeURIComponent(clean)}`,
      bearer,
    )) as { data?: { id?: string }; errors?: Array<Record<string, unknown>> };

    if (!userResp.data?.id) {
      throw new Error(
        `[x] users/by/username returned no id for handle=${clean}: errors=${JSON.stringify(userResp.errors ?? [])}`,
      );
    }
    userId = userResp.data.id;
  } catch (err) {
    log.error("x_tweets_fetch_failed", err, { handle: clean, days });
    throw err;
  }

  const startTime = new Date(Date.now() - days * 86_400_000).toISOString();
  const tweetsPath =
    `/users/${encodeURIComponent(userId)}/tweets` +
    `?max_results=100` +
    `&start_time=${encodeURIComponent(startTime)}` +
    `&tweet.fields=created_at,public_metrics` +
    `&exclude=retweets,replies`;

  let tweets: XUserTweet[];
  try {
    const tweetsResp = (await xGet(tweetsPath, bearer)) as {
      data?: Array<{
        id?: string;
        text?: string;
        created_at?: string;
        public_metrics?: {
          retweet_count: number;
          reply_count: number;
          like_count: number;
          quote_count?: number;
        };
      }>;
      errors?: Array<Record<string, unknown>>;
    };

    // X returns no `data` key (not an error) when the user has no tweets in window.
    if (tweetsResp.data === undefined || tweetsResp.data === null) {
      tweets = [];
    } else if (!Array.isArray(tweetsResp.data)) {
      throw new Error(
        `[x] /users/${userId}/tweets did not return an array for handle=${clean}: ` +
          `errors=${JSON.stringify(tweetsResp.errors ?? [])}`,
      );
    } else {
      tweets = tweetsResp.data
        .filter((t) => t.id && t.text)
        .map((t) => ({
          id: t.id!,
          text: t.text!,
          createdAt: t.created_at ?? "",
          ...(t.public_metrics ? { publicMetrics: t.public_metrics } : {}),
        }));
    }
  } catch (err) {
    log.error("x_tweets_fetch_failed", err, { handle: clean, days });
    throw err;
  }

  log.info("x_tweets_fetch_complete", {
    handle: clean,
    days,
    tweetCount: tweets.length,
    latencyMs: Date.now() - t0,
  });

  return tweets;
}

async function xGet(path: string, bearer: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${X_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 404) {
    throw new Error(`[x] not found: GET ${path} → 404`);
  }
  if (response.status === 401 || response.status === 403) {
    const bodySnippet = (await response.text()).slice(0, 300);
    throw new Error(
      `[x] auth fail: GET ${path} → ${response.status}. Check X_BEARER_TOKEN. body=${bodySnippet}`,
    );
  }
  if (response.status === 429) {
    const reset = response.headers.get("x-rate-limit-reset") ?? "(unknown)";
    const remaining = response.headers.get("x-rate-limit-remaining") ?? "(unknown)";
    throw new Error(
      `[x] rate-limited: GET ${path} → 429. ` +
        `x-rate-limit-remaining=${remaining} x-rate-limit-reset=${reset} (unix).`,
    );
  }
  if (!response.ok) {
    const bodySnippet = (await response.text()).slice(0, 400);
    throw new Error(
      `[x] unexpected status: GET ${path} → ${response.status} ${response.statusText}. body=${bodySnippet}`,
    );
  }

  return response.json();
}
