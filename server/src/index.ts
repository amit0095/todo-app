import "dotenv/config";
import pg from "pg";
import { createApp } from "./app.js";
import { SCHEMA_SQL } from "./schema.js";
import { createTaskService } from "./taskService.js";

const { DATABASE_URL, PORT = "4000", CORS_ORIGIN } = process.env;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.",
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
await pool.query(SCHEMA_SQL);

const app = createApp(createTaskService(pool), CORS_ORIGIN);
const server = app.listen(Number(PORT), () =>
  console.log(`API listening on :${PORT}`),
);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () =>
    server.close(() => pool.end().then(() => process.exit(0))),
  );
}
