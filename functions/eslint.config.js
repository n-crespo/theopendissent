const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const importX = require("eslint-plugin-import-x");

module.exports = tseslint.config(
  {
    // global ignores
    ignores: ["lib/**/*", "generated/**/*"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // target only typescript files for type-aware rules
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "import-x": importX,
    },
    rules: {
      quotes: ["error", "double"],
      "object-curly-spacing": ["error", "always"],
      "no-tabs": "error",
      "max-len": "off",
      "import-x/no-unresolved": 0,
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-useless-assignment": "warn",
    },
  },
  {
    // separate block for the config file itself (no TS project needed)
    files: ["eslint.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      quotes: ["error", "double"],
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
