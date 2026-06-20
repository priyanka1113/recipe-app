import type { VercelResponse } from "@vercel/node";

const MEALDB_API_BASE = process.env.MEALDB_API_BASE ?? "https://www.themealdb.com/api/json/v1";
const MEALDB_API_KEY = process.env.MEALDB_API_KEY ?? "1";
const CATEGORY_TTL_MS = 1000 * 60 * 30;

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
};

const cache = new Map<string, CacheEntry>();

export function mealDbUrl(endpoint: string, params: Record<string, string | undefined> = {}) {
  const url = new URL(`${MEALDB_API_BASE}/${MEALDB_API_KEY}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value.trim() !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

export function setProxyCacheHeaders(res: VercelResponse, seconds: number) {
  res.setHeader("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
}

export async function fetchMealDb(endpoint: string, params?: Record<string, string | undefined>) {
  const response = await fetch(mealDbUrl(endpoint, params), {
    headers: {
      Accept: "application/json",
      "User-Agent": "recipe-pwa/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`TheMealDB responded with ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export async function sendMealDb(
  res: VercelResponse,
  endpoint: string,
  params?: Record<string, string | undefined>,
  cacheSeconds = 60,
) {
  try {
    const payload = await fetchMealDb(endpoint, params);
    setProxyCacheHeaders(res, cacheSeconds);
    res.status(200).json(payload);
  } catch (error) {
    console.error(`Failed to proxy ${endpoint}`, error);
    res.status(502).json({
      error: "Unable to fetch recipe data right now.",
    });
  }
}

export async function sendCachedCategories(res: VercelResponse) {
  const cached = cache.get("categories");

  if (cached && cached.expiresAt > Date.now()) {
    setProxyCacheHeaders(res, 60 * 30);
    res.status(200).json(cached.payload);
    return;
  }

  try {
    const payload = await fetchMealDb("categories.php");
    cache.set("categories", {
      expiresAt: Date.now() + CATEGORY_TTL_MS,
      payload,
    });
    setProxyCacheHeaders(res, 60 * 30);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Failed to proxy categories", error);
    res.status(502).json({
      error: "Unable to fetch categories right now.",
    });
  }
}
