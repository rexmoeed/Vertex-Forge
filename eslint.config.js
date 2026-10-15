// ESLint Configuration for Vertex Forge
export default [
  {
    ignores: [
      "dist/**",
      "dist-electron/**",
      "release/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts"
    ]
  },
  {
    files: ["src/**/*.{ts,tsx}", "server.ts", "electron/**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": "off",
      "prefer-const": "warn"
    }
  }
];
