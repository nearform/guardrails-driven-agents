import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import noAmountArithmetic from "./eslint-rules/no-amount-arithmetic.js";

const generatedClientRestriction = {
  // Match the directory, not generator-produced filenames: Massimo's output
  // names drift, and `no-restricted-imports` matches the specifier string as
  // written (never the resolved path), so every spelling of the alias needs
  // covering too.
  group: [
    "**/generated-client",
    "**/generated-client/**",
    "@/generated-client",
    "@/generated-client/**",
    "src/generated-client",
    "src/generated-client/**",
  ],
  // Type-only imports are fine: reusing the spec-derived types keeps the
  // contract as the single source of truth. What the boundary forbids is
  // *constructing / calling* the generated client outside client.ts.
  allowTypeImports: true,
  message:
    "Do not import the generated Massimo client at runtime. Import { api } from " +
    "'src/features/common/api/client' instead — it is the only module allowed " +
    "to import the generated client. (Type-only `import type { ... }` is allowed.)",
};

// `fetch` is the other way a component could bypass the sanctioned data path.
const fetchRestriction = {
  name: "fetch",
  message:
    "Components and routes never fetch. Move this call into a server function " +
    "(src/features/*/server/*.functions.ts) that uses { api }, and read the " +
    "result via a route loader / useLoaderData() instead.",
};

const apiClientRestriction = {
  group: ["**/common/api/client"],
  message:
    "Only server functions (src/features/*/server/*.functions.ts) may import " +
    "{ api } from the client wrapper. Move this fetch into a server function " +
    "and read the result via a route loader / useLoaderData() instead.",
};

export default defineConfig([
  {
    ignores: [
      "dist/**",
      ".output/**",
      "src/routeTree.gen.ts",
      "src/generated-client/**",
    ],
  },
  {
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      local: { rules: { "no-amount-arithmetic": noAmountArithmetic } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        { patterns: [generatedClientRestriction, apiClientRestriction] },
      ],
      "no-restricted-globals": ["error", fetchRestriction],
      "local/no-amount-arithmetic": "error",
    },
  },
  {
    files: ["src/features/common/api/client.ts"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-globals": "off",
    },
  },
  {
    files: ["src/features/*/server/*.functions.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [generatedClientRestriction] },
      ],
      "no-restricted-globals": "off",
    },
  },
]);
