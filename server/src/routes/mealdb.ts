import { Router, type Request, type Response } from "express";

const MEALDB_API_BASE = process.env.MEALDB_API_BASE ?? "https://www.themealdb.com/api/json/v1";
const MEALDB_API_KEY = process.env.MEALDB_API_KEY ?? "1";
const CATEGORY_TTL_MS = 1000 * 60 * 30;

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
};

const cache = new Map<string, CacheEntry>();

export const mealDbRouter = Router();

function mealDbUrl(endpoint: string, params: Record<string, string | undefined> = {}) {
  const url = new URL(`${MEALDB_API_BASE}/${MEALDB_API_KEY}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value.trim() !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

function setProxyCacheHeaders(res: Response, seconds: number) {
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
  req: Request,
  res: Response,
  endpoint: string,
  params?: Record<string, string | undefined>,
  cacheSeconds = 60,
) {
  try {
    const payload = await fetchMealDb(endpoint, params);
    setProxyCacheHeaders(res, cacheSeconds);
    res.json(payload);
  } catch (error) {
    console.error(`Failed to proxy ${req.path}`, error);
    res.status(502).json({
      error: "Unable to fetch recipe data right now.",
    });
  }
}

mealDbRouter.get("/search", (req, res) => {
  const query = typeof req.query.s === "string" ? req.query.s : "";
  return sendMealDb(req, res, "search.php", { s: query }, 60);
});

mealDbRouter.get("/meal/:id", (req, res) => {
  return sendMealDb(req, res, "lookup.php", { i: req.params.id }, 60 * 5);
});

mealDbRouter.get("/categories", async (req, res) => {
  const cached = cache.get("categories");

  // Categories change rarely, so keep a short in-memory cache to reduce proxy churn.
  if (cached && cached.expiresAt > Date.now()) {
    setProxyCacheHeaders(res, 60 * 30);
    res.json(cached.payload);
    return;
  }

  try {
    const payload = await fetchMealDb("categories.php");
    cache.set("categories", {
      expiresAt: Date.now() + CATEGORY_TTL_MS,
      payload,
    });
    setProxyCacheHeaders(res, 60 * 30);
    res.json(payload);
  } catch (error) {
    console.error(`Failed to proxy ${req.path}`, error);
    res.status(502).json({
      error: "Unable to fetch categories right now.",
    });
  }
});

mealDbRouter.get("/filter", (req, res) => {
  const category = typeof req.query.c === "string" ? req.query.c : "";
  return sendMealDb(req, res, "filter.php", { c: category }, 60 * 10);
});

mealDbRouter.get("/random", (req, res) => {
  return sendMealDb(req, res, "random.php", {}, 0);
});
