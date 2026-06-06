import '@testing-library/jest-dom'

// Mock global fetch for tests since jsdom doesn't have a native fetch
// Tests that need specific fetch behavior should use vi.fn() mocks
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
  status: 200,
  statusText: 'OK',
} as Response)
