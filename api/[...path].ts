import type { VercelRequest, VercelResponse } from "@vercel/node";

const MEALDB_API_BASE = process.env.MEALDB_API_BASE ?? "https://www.themealdb.com/api/json/v1";
const MEALDB_API_KEY = process.env.MEALDB_API_KEY ?? "1";
const CATEGORY_TTL_MS = 1000 * 60 * 30;

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
};

const cache = new Map<string, CacheEntry>();

function mealDbUrl(endpoint: string, params: Record<string, string | undefined> = {}) {
  const url = new URL(`${MEALDB_API_BASE}/${MEALDB_API_KEY}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value.trim() !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

function setProxyCacheHeaders(res: VercelResponse, seconds: number) {
  res.setHeader("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
}

async function fetchMealDb(endpoint: string, params?: Record<string, string | undefined>) {
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

async function sendMealDb(
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [];
  const route = pathParts[0];

  if (route === "health") {
    res.status(200).json({ ok: true });
    return;
  }

  if (route === "search") {
    const query = typeof req.query.s === "string" ? req.query.s : "";
    await sendMealDb(res, "search.php", { s: query }, 60);
    return;
  }

  if (route === "meal" && typeof pathParts[1] === "string") {
    await sendMealDb(res, "lookup.php", { i: pathParts[1] }, 60 * 5);
    return;
  }

  if (route === "categories") {
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
    return;
  }

  if (route === "filter") {
    const category = typeof req.query.c === "string" ? req.query.c : "";
    await sendMealDb(res, "filter.php", { c: category }, 60 * 10);
    return;
  }

  if (route === "random") {
    await sendMealDb(res, "random.php", {}, 0);
    return;
  }

  res.status(404).json({ error: "Not found" });
}
