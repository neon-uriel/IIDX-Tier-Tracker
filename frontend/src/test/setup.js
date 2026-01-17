import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock for window.matchMedia, which can be used by some components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
      value: vi.fn().mockImplementation(query => ({    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: vi.fn(),
  })),
});
