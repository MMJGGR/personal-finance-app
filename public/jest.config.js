// jest.config.js
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
};
