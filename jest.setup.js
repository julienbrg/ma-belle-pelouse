import '@testing-library/jest-dom'

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
    }
  },
  usePathname() {
    return '/'
  },
}))

// Mock for window.fs
global.window = Object.assign(global.window || {}, {
  fs: {
    readFile: jest.fn().mockImplementation(() => Promise.resolve(new Uint8Array())),
  },
})

// Silence console errors during tests
console.error = jest.fn()
