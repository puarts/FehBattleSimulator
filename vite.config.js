import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite root is Sources/, but HTML references /images/ and /AetherRaidTacticsBoard/
// which live at the repo root. This plugin serves them directly from the repo root.
function serveRepoRootAssets() {
    const repoRoot = __dirname;
    const prefixes = ['/images/', '/AetherRaidTacticsBoard/'];
    const mimeTypes = {
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
        '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json',
    };
    return {
        name: 'serve-repo-root-assets',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url.split('?')[0];
                if (prefixes.some(p => url.startsWith(p))) {
                    const filePath = path.join(repoRoot, url);
                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath).toLowerCase();
                        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                        fs.createReadStream(filePath).pipe(res);
                        return;
                    }
                }
                next();
            });
        },
    };
}

export default defineConfig({
    root: 'Sources',
    plugins: [vue(), serveRepoRootAssets()],
    test: {
        globals: true,
        environment: 'jsdom',
        // Override top-level root ('Sources') so Vitest resolves Tests/ from project root
        root: './',
        include: ['Tests/**/*.test.js'],
        exclude: ['**/All.test.js', '**/node_modules/**'],
        // Single-threaded: tests share global state (g_appData, skill hooks)
        pool: 'threads',
        singleThread: true,
    },
    server: {
        cors: true,
        fs: {
            allow: [
                // Allow serving files from repo root (images/, AetherRaidTacticsBoard/)
                path.resolve(__dirname),
            ],
        },
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'es2015',
        rollupOptions: {
            input: {
                AetherRaidSimulator: path.resolve(__dirname, 'Sources/AetherRaidSimulator.html'),
                ArenaSimulator: path.resolve(__dirname, 'Sources/ArenaSimulator.html'),
                SummonerDuelsSimulator: path.resolve(__dirname, 'Sources/SummonerDuelsSimulator.html'),
                UnitBuilder: path.resolve(__dirname, 'Sources/UnitBuilder.html'),
                StatusCalculator: path.resolve(__dirname, 'Sources/StatusCalculator.html'),
                DamageCalculator: path.resolve(__dirname, 'Sources/DamageCalculator.html'),
                HeroIconLister: path.resolve(__dirname, 'Sources/HeroIconLister.html'),
                HeroStatusClusterer: path.resolve(__dirname, 'Sources/HeroStatusClusterer.html'),
            },
            // Output chunking will be configured in Section 02 after testing.
            // Fallback: run 8 individual builds if manualChunks doesn't work.
        },
    },
    define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
        alias: {
            'vue': 'vue/dist/vue.esm-bundler.js',
        },
    },
});
