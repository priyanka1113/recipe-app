import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendMealDb } from "./_lib/mealdb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const query = typeof req.query.s === "string" ? req.query.s : "";
  await sendMealDb(res, "search.php", { s: query }, 60);
}
