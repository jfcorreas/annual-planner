import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom does not implement crypto.randomUUID in every version.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let counter = 0
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: () =>
      `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
  })
}

// jsdom implements confirm/alert as no-ops that log "not implemented";
// tests that need a specific answer stub the method themselves.
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
