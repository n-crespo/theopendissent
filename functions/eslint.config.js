const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const importX = require("eslint-plugin-import-x");

module.exports = tseslint.config(
  {
    // replaces ignorePatterns
    ignores: ["lib/**/*", "generated/**/*"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
      },
    },
    plugins: {
      "import-x": importX,
    },
    rules: {
      // your specific firebase project overrides
      quotes: ["error", "double"],
      "object-curly-spacing": ["error", "always"],
      indent: ["error", 2],
      "no-tabs": "error",
      "max-len": "off",
      "import-x/no-unresolved": 0,
    },
  },
);
