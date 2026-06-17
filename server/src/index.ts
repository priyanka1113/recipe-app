import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT ?? 5174);

app.listen(port, () => {
  console.log(`Recipe proxy listening on http://localhost:${port}`);
});
