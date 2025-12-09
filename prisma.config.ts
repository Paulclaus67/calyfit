import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    // 👉 commande exécutée par `npx prisma db seed`
    seed: "tsx prisma/seed.ts",
  },
});
