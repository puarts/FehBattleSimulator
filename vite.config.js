import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue'; // Enable in Section 06

export default defineConfig({
    root: 'Sources',
    // plugins: [vue()], // Enable in Section 06
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        // Override top-level root ('Sources') so Vitest resolves Tests/ from project root
        root: './',
        include: ['Tests/**/*.test.js'],
        exclude: ['**/All.test.js', '**/node_modules/**'],
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
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
    resolve: {
        alias: {
            // Enable in Section 06 (Vue 3 Core):
            // Vue 3 runtime compiler build needed for in-HTML templates
            // 'vue': 'vue/dist/vue.esm-bundler.js',
        },
    },
});
