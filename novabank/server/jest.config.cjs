module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["index.js"],
  coverageThreshold: {
    global: {
      lines: 85,
      statements: 85,
      functions: 85,
    },
  },
};
