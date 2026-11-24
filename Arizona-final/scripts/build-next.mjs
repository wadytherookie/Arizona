import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
  {
    stdio: "inherit",
    env: { ...process.env, ARIZONA_HOST: process.env.ARIZONA_HOST || "sites" },
  },
);
process.exit(result.status ?? 1);
