import js from "@eslint/js";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";

export default [
  { linterOptions: { reportUnusedDisableDirectives: "off" } },
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": hooks },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
