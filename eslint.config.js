import js from "@eslint/js"

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        describe: true,
        it: true,
        expect: true,
        window: true,
        document: true,
      },
    },
  },
]
