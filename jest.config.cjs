module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-error-boundary)/)'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  setupFilesAfterEnv: ['@testing-library/jest-dom']
}
