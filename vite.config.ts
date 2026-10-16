import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { watch: { usePolling: process.env.CHAIN_GARDEN_POLLING === "1" } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
