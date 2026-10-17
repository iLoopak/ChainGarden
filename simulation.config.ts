import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["scripts/simulation.test.ts"],
    environment: "node",
    testTimeout: 120000,
  },
});
