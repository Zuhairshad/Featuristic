import { defineConfig } from "vitest/config";

// Unit tests only. They need no database, network, or Docker.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
