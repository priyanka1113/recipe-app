import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendCachedCategories } from "./_lib/mealdb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  await sendCachedCategories(res);
}
