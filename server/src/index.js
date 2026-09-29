import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function main() {
  await connectDB();
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[agrilink] API listening on http://localhost:${PORT}`);
    console.log(`[agrilink] CORS allows: ${process.env.CLIENT_ORIGIN || "http://localhost:5173"}`);
  });

  // Graceful shutdown
  const shutdown = async (sig) => {
    console.log(`\n[${sig}] shutting down...`);
    server.close(async () => {
      const { closeDB } = await import("./config/db.js");
      await closeDB();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[agrilink] fatal:", err);
  process.exit(1);
});
