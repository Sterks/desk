import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import uikitPlugin from "./eslint-plugin/index.js";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", ".histoire", ".idea", "**/*.d.ts", "components/icons/default-icons.ts", "components/icons/custom-icons.ts"]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],

  {
    files: ["**/*.{ts,tsx,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        // Use the TypeScript parser inside <script lang="ts"> blocks.
        parser: tseslint.parser
      }
    },
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/no-v-html": "off"
    }
  },

  uikitPlugin.configs["flat/recommended"],

  // Node CommonJS scripts (build helpers, config files).
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  },

  // ESM config files.
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },

  // Run Prettier as an ESLint rule (errors) and turn off conflicting formatting rules.
  eslintPluginPrettierRecommended
);
