import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendMealDb } from "./_lib/mealdb.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  await sendMealDb(res, "random.php", {}, 0);
}
