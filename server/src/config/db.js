import mongoose from "mongoose";

/**
 * Connect to MongoDB using MONGO_URI from env.
 * Retries a few times so `docker-compose up` order doesn't kill startup.
 */
export async function connectDB(uri, retries = 5) {
  const target = uri || process.env.MONGO_URI;
  if (!target) {
    throw new Error("MONGO_URI is not set — check server/.env");
  }

  mongoose.set("strictQuery", true);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(target, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[mongo] connected → ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error(`[mongo] attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

export async function closeDB() {
  await mongoose.disconnect();
  console.log("[mongo] disconnected");
}
