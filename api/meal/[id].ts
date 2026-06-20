import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendMealDb } from "../_lib/mealdb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const id = typeof req.query.id === "string" ? req.query.id : "";
  await sendMealDb(res, "lookup.php", { i: id }, 60 * 5);
}
