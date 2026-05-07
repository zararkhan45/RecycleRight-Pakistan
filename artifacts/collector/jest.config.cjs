/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

