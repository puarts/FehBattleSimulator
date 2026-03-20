// Vitest setup file (replaces jest.setup.js for Vitest)
//
// The original jest.setup.js provided polyfills for:
//   - globalThis.performance (from 'perf_hooks')
//   - globalThis.TextEncoder (from 'util')
//   - globalThis.TextDecoder (from 'util')
//
// In Vitest with jsdom environment on Node 22+, all three are
// already globally available, so no polyfills are needed.
// This file is kept as a placeholder for any future setup needs.
