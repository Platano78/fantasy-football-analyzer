/**
 * Test Setup Configuration
 * Sets up global test environment, mocks, and utilities
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  static CONNECTING = 0
  static CLOSING = 2

  public readyState = MockWebSocket.CONNECTING
  public onopen?: () => void
  public onclose?: () => void
  public onmessage?: (event: { data: string }) => void
  public onerror?: (error: any) => void

  constructor(url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.()
    }, 10)
  }

  send(data: string) {
    // Mock sending data
    setTimeout(() => {
      this.onmessage?.({ data: '{"type":"pong"}' })
    }, 10)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.()
  }
}

global.WebSocket = MockWebSocket as any

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockStorage })

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock timers to avoid recursion issues in tests
const originalSetTimeout = globalThis.setTimeout
const originalSetInterval = globalThis.setInterval
const originalClearTimeout = globalThis.clearTimeout
const originalClearInterval = globalThis.clearInterval

vi.stubGlobal('setTimeout', (fn: Function, delay?: number) => {
  return originalSetTimeout(fn, 0)
})

vi.stubGlobal('setInterval', (fn: Function, delay?: number) => {
  return originalSetInterval(fn, 10)
})

vi.stubGlobal('clearTimeout', (id: number) => {
  originalClearTimeout(id)
})

vi.stubGlobal('clearInterval', (id: number) => {
  originalClearInterval(id)
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
}

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('VITE_LOCAL_GEMINI_ENABLED', 'true')
vi.stubEnv('VITE_LOCAL_GEMINI_URL', 'http://localhost:3001')