import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  { rules: { "react-hooks/set-state-in-effect": "warn" } },
  globalIgnores([
    ".next/**",
    "dist/**",
    "build/**",
    ".open-next/**",
    "worker-configuration.d.ts",
    "next-env.d.ts",
  ]),
]);

