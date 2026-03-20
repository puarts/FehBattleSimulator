import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    root: 'Sources',
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
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
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'es2015',
        rollupOptions: {
            input: {
                AetherRaidSimulator: 'AetherRaidSimulator.html',
                ArenaSimulator: 'ArenaSimulator.html',
                SummonerDuelsSimulator: 'SummonerDuelsSimulator.html',
                UnitBuilder: 'UnitBuilder.html',
                StatusCalculator: 'StatusCalculator.html',
                DamageCalculator: 'DamageCalculator.html',
                HeroIconLister: 'HeroIconLister.html',
                HeroStatusClusterer: 'HeroStatusClusterer.html',
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
