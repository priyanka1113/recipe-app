import { createApp } from "../server/dist/app.js";

// Vercel routes all /api/* traffic here; Express handles the nested paths.
const app = createApp();

export default app;
