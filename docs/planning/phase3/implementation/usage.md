# Usage Guide — Phase 3 Vite Migration

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start Vite dev server with HMR
npm run dev

# Open in browser
open http://localhost:5173/Sources/ArenaSimulator.html
```

### Testing

```bash
# Full test + lint (matches CI)
npm test

# Tests only
npm run test:only

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### Building for Production

```bash
# Build with Vite
npm run build

# Preview production build locally
npm run preview
```

## What Was Built

### Build System (Vite)
- `vite.config.js` — Multi-page app configuration with 8 HTML entry points
- `npm run dev` — Development server with Hot Module Replacement (HMR)
- `npm run build` — Production build to `dist/`

### Test Framework (Vitest)
- `vitest.config.js` — Test configuration (jsdom environment, globals)
- 500 tests across 30 test files using ESM imports
- Each test file in `Tests/` runs independently (no concatenation needed)

### Vue 3 + Pinia
- Vue 3 with `createApp()` API (migrated from Vue 2 `new Vue()`)
- Pinia store at `Sources/store.js` (migrated from Vuex)
- Components in `Sources/VueComponents.js`

### jQuery-Free UI
- `Sources/DialogUtil.js` — Dialog management (replaces jQuery UI `.dialog()`)
- Native `<progress>` element (replaces jQuery UI `.progressbar()`)
- Native DOM APIs throughout (replaces `$()` selectors)

### npm Libraries (replacing CDNs)
- `lz-string` — Data compression for save/load/URL sharing
- `cropperjs` — Image cropping for OCR feature
- `@fortawesome/fontawesome-free` — Icons
- `vue-draggable-plus` — Drag and drop (replaces Vue.Draggable)

## Simulators

| Simulator | URL Path |
|-----------|----------|
| Arena Simulator | `/Sources/ArenaSimulator.html` |
| Aether Raid Simulator | `/Sources/AetherRaidSimulator.html` |
| Summoner Duels Simulator | `/Sources/SummonerDuelsSimulator.html` |
| Unit Builder | `/Sources/UnitBuilder.html` |
| Damage Calculator | `/Sources/DamageCalculator.html` |
| Status Calculator | `/Sources/StatusCalculator.html` |
| Hero Icon Lister | `/Sources/HeroIconLister.html` |
| Hero Status Clusterer | `/Sources/HeroStatusClusterer.html` |

## CI Pipeline

GitHub Actions workflow (`.github/workflows/jekyll.yml`):
1. Jekyll documentation build
2. `npm install`
3. `npm test` (Vitest + ESLint)
4. `npm run build` (Vite production build)
