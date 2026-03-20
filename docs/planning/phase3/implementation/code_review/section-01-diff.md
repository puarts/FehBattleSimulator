diff --git a/.gitignore b/.gitignore
index ca806b5b..07b05e5e 100644
--- a/.gitignore
+++ b/.gitignore
@@ -13,6 +13,7 @@ Sources/samples/
 Outputs/
 dist/
 x64/
+.vite/
 
 # C++ / Visual Studio
 .vs/
diff --git a/Tests/ViteSetup.test.js b/Tests/ViteSetup.test.js
new file mode 100644
index 00000000..6cc3e796
--- /dev/null
+++ b/Tests/ViteSetup.test.js
@@ -0,0 +1,76 @@
+/**
+ * Section 01: Vite Setup verification tests
+ *
+ * These tests verify that Vite is properly installed and configured.
+ * Run with: node --test Tests/ViteSetup.test.js
+ * (Uses Node.js built-in test runner since Vitest is not yet configured)
+ */
+
+import { describe, it } from 'node:test';
+import assert from 'node:assert';
+import { readFileSync, existsSync } from 'fs';
+import { join } from 'path';
+
+const ROOT = join(import.meta.dirname, '..');
+
+describe('A.1 package.json dependencies', () => {
+    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
+
+    it('should have vite in devDependencies', () => {
+        assert.ok(pkg.devDependencies.vite, 'vite should be in devDependencies');
+    });
+
+    it('should have @vitejs/plugin-vue in devDependencies', () => {
+        assert.ok(pkg.devDependencies['@vitejs/plugin-vue'],
+            '@vitejs/plugin-vue should be in devDependencies');
+    });
+});
+
+describe('A.2 vite.config.js', () => {
+    it('should exist at project root', () => {
+        assert.ok(existsSync(join(ROOT, 'vite.config.js')),
+            'vite.config.js should exist at project root');
+    });
+
+    it('should set root to Sources', async () => {
+        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
+        assert.ok(content.includes("root:") && content.includes("Sources"),
+            'vite.config.js should set root to Sources directory');
+    });
+
+    it('should configure build.outDir to ../dist', async () => {
+        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
+        assert.ok(content.includes("outDir") && content.includes("../dist"),
+            'vite.config.js should set outDir to ../dist');
+    });
+
+    it('should list all 8 HTML entry points in rollupOptions.input', async () => {
+        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
+        const expectedHtmlFiles = [
+            'AetherRaidSimulator',
+            'ArenaSimulator',
+            'SummonerDuelsSimulator',
+            'UnitBuilder',
+            'StatusCalculator',
+            'DamageCalculator',
+            'HeroIconLister',
+            'HeroStatusClusterer',
+        ];
+        for (const name of expectedHtmlFiles) {
+            assert.ok(content.includes(name),
+                `vite.config.js should reference ${name}`);
+        }
+    });
+
+    it('should set build.target to es2015', async () => {
+        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
+        assert.ok(content.includes('es2015'),
+            'vite.config.js should set build target to es2015');
+    });
+
+    it('should include comment or placeholder for Vue 3 runtime compiler alias', async () => {
+        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
+        assert.ok(content.includes('vue/dist/vue.esm-bundler') || content.includes('esm-bundler'),
+            'vite.config.js should have a placeholder for Vue 3 runtime compiler alias');
+    });
+});
diff --git a/package-lock.json b/package-lock.json
index aabe2d4a..b31ecd83 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -10,9 +10,11 @@
       "license": "MIT",
       "devDependencies": {
         "@types/lz-string": "^1.5.0",
+        "@vitejs/plugin-vue": "^6.0.5",
         "eslint": "^8.57.0",
         "jest": "^29.7.0",
-        "jest-environment-jsdom": "^29.7.0"
+        "jest-environment-jsdom": "^29.7.0",
+        "vite": "^8.0.1"
       },
       "engines": {
         "node": ">=22"
@@ -525,6 +527,40 @@
       "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
       "dev": true
     },
+    "node_modules/@emnapi/core": {
+      "version": "1.9.1",
+      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.9.1.tgz",
+      "integrity": "sha512-mukuNALVsoix/w1BJwFzwXBN/dHeejQtuVzcDsfOEsdpCumXb/E9j8w11h5S54tT1xhifGfbbSm/ICrObRb3KA==",
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "@emnapi/wasi-threads": "1.2.0",
+        "tslib": "^2.4.0"
+      }
+    },
+    "node_modules/@emnapi/runtime": {
+      "version": "1.9.1",
+      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.9.1.tgz",
+      "integrity": "sha512-VYi5+ZVLhpgK4hQ0TAjiQiZ6ol0oe4mBx7mVv7IflsiEp0OWoVsp/+f9Vc1hOhE0TtkORVrI1GvzyreqpgWtkA==",
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "tslib": "^2.4.0"
+      }
+    },
+    "node_modules/@emnapi/wasi-threads": {
+      "version": "1.2.0",
+      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.0.tgz",
+      "integrity": "sha512-N10dEJNSsUx41Z6pZsXU8FjPjpBEplgH24sfkmITrBED1/U2Esum9F3lfLrMjKHHjmi557zQn7kR9R+XWXu5Rg==",
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "tslib": "^2.4.0"
+      }
+    },
     "node_modules/@eslint-community/eslint-utils": {
       "version": "4.4.0",
       "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.4.0.tgz",
@@ -978,10 +1014,11 @@
       }
     },
     "node_modules/@jridgewell/sourcemap-codec": {
-      "version": "1.4.15",
-      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.4.15.tgz",
-      "integrity": "sha512-eF2rxCRulEKXHTRiDrDy6erMYWqNw4LPdQ8UQA4huuxaQsVeRPFl2oM8oDGxMFhJUWZf9McpLtJasDDZb/Bpeg==",
-      "dev": true
+      "version": "1.5.5",
+      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
+      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
+      "dev": true,
+      "license": "MIT"
     },
     "node_modules/@jridgewell/trace-mapping": {
       "version": "0.3.25",
@@ -993,6 +1030,23 @@
         "@jridgewell/sourcemap-codec": "^1.4.14"
       }
     },
+    "node_modules/@napi-rs/wasm-runtime": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-1.1.1.tgz",
+      "integrity": "sha512-p64ah1M1ld8xjWv3qbvFwHiFVWrq1yFvV4f7w+mzaqiR4IlSgkqhcRdHwsGgomwzBH51sRY4NEowLxnaBjcW/A==",
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "@emnapi/core": "^1.7.1",
+        "@emnapi/runtime": "^1.7.1",
+        "@tybys/wasm-util": "^0.10.1"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/Brooooooklyn"
+      }
+    },
     "node_modules/@nodelib/fs.scandir": {
       "version": "2.1.5",
       "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
@@ -1028,6 +1082,278 @@
         "node": ">= 8"
       }
     },
+    "node_modules/@oxc-project/types": {
+      "version": "0.120.0",
+      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.120.0.tgz",
+      "integrity": "sha512-k1YNu55DuvAip/MGE1FTsIuU3FUCn6v/ujG9V7Nq5Df/kX2CWb13hhwD0lmJGMGqE+bE1MXvv9SZVnMzEXlWcg==",
+      "dev": true,
+      "license": "MIT",
+      "funding": {
+        "url": "https://github.com/sponsors/Boshen"
+      }
+    },
+    "node_modules/@rolldown/binding-android-arm64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm64/-/binding-android-arm64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-jOHxwXhxmFKuXztiu1ORieJeTbx5vrTkcOkkkn2d35726+iwhrY1w/+nYY/AGgF12thg33qC3R1LMBF5tHTZHg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-darwin-arm64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-arm64/-/binding-darwin-arm64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-gED05Teg/vtTZbIJBc4VNMAxAFDUPkuO/rAIyyxZjTj1a1/s6z5TII/5yMGZ0uLRCifEtwUQn8OlYzuYc0m70w==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-darwin-x64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-x64/-/binding-darwin-x64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-rI15NcM1mA48lqrIxVkHfAqcyFLcQwyXWThy+BQ5+mkKKPvSO26ir+ZDp36AgYoYVkqvMcdS8zOE6SeBsR9e8A==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-freebsd-x64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-freebsd-x64/-/binding-freebsd-x64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-XZRXHdTa+4ME1MuDVp021+doQ+z6Ei4CCFmNc5/sKbqb8YmkiJdj8QKlV3rCI0AJtAeSB5n0WGPuJWNL9p/L2w==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-arm-gnueabihf": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.0.0-rc.10.tgz",
+      "integrity": "sha512-R0SQMRluISSLzFE20sPWYHVmJdDQnRyc/FzSCN72BqQmh2SOZUFG+N3/vBZpR4C6WpEUVYJLrYUXaj43sJsNLA==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-arm64-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-Y1reMrV/o+cwpduYhJuOE3OMKx32RMYCidf14y+HssARRmhDuWXJ4yVguDg2R/8SyyGNo+auzz64LnPK9Hq6jg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-arm64-musl": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.0.0-rc.10.tgz",
+      "integrity": "sha512-vELN+HNb2IzuzSBUOD4NHmP9yrGwl1DVM29wlQvx1OLSclL0NgVWnVDKl/8tEks79EFek/kebQKnNJkIAA4W2g==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-ppc64-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-ZqrufYTgzxbHwpqOjzSsb0UV/aV2TFIY5rP8HdsiPTv/CuAgCRjM6s9cYFwQ4CNH+hf9Y4erHW1GjZuZ7WoI7w==",
+      "cpu": [
+        "ppc64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-s390x-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-gSlmVS1FZJSRicA6IyjoRoKAFK7IIHBs7xJuHRSmjImqk3mPPWbR7RhbnfH2G6bcmMEllCt2vQ/7u9e6bBnByg==",
+      "cpu": [
+        "s390x"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-x64-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-eOCKUpluKgfObT2pHjztnaWEIbUabWzk3qPZ5PuacuPmr4+JtQG4k2vGTY0H15edaTnicgU428XW/IH6AimcQw==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-linux-x64-musl": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-musl/-/binding-linux-x64-musl-1.0.0-rc.10.tgz",
+      "integrity": "sha512-Xdf2jQbfQowJnLcgYfD/m0Uu0Qj5OdxKallD78/IPPfzaiaI4KRAwZzHcKQ4ig1gtg1SuzC7jovNiM2TzQsBXA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-openharmony-arm64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-openharmony-arm64/-/binding-openharmony-arm64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-o1hYe8hLi1EY6jgPFyxQgQ1wcycX+qz8eEbVmot2hFkgUzPxy9+kF0u0NIQBeDq+Mko47AkaFFaChcvZa9UX9Q==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "openharmony"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-wasm32-wasi": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-wasm32-wasi/-/binding-wasm32-wasi-1.0.0-rc.10.tgz",
+      "integrity": "sha512-Ugv9o7qYJudqQO5Y5y2N2SOo6S4WiqiNOpuQyoPInnhVzCY+wi/GHltcLHypG9DEUYMB0iTB/huJrpadiAcNcA==",
+      "cpu": [
+        "wasm32"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "@napi-rs/wasm-runtime": "^1.1.1"
+      },
+      "engines": {
+        "node": ">=14.0.0"
+      }
+    },
+    "node_modules/@rolldown/binding-win32-arm64-msvc": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.0.0-rc.10.tgz",
+      "integrity": "sha512-7UODQb4fQUNT/vmgDZBl3XOBAIOutP5R3O/rkxg0aLfEGQ4opbCgU5vOw/scPe4xOqBwL9fw7/RP1vAMZ6QlAQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/binding-win32-x64-msvc": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.0.0-rc.10.tgz",
+      "integrity": "sha512-PYxKHMVHOb5NJuDL53vBUl1VwUjymDcYI6rzpIni0C9+9mTiJedvUxSk7/RPp7OOAm3v+EjgMu9bIy3N6b408w==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      }
+    },
+    "node_modules/@rolldown/pluginutils": {
+      "version": "1.0.0-rc.2",
+      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-rc.2.tgz",
+      "integrity": "sha512-izyXV/v+cHiRfozX62W9htOAvwMo4/bXKDrQ+vom1L1qRuexPock/7VZDAhnpHCLNejd3NJ6hiab+tO0D44Rgw==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/@sinclair/typebox": {
       "version": "0.27.8",
       "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.27.8.tgz",
@@ -1061,6 +1387,17 @@
         "node": ">= 10"
       }
     },
+    "node_modules/@tybys/wasm-util": {
+      "version": "0.10.1",
+      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.1.tgz",
+      "integrity": "sha512-9tTaPJLSiejZKx+Bmog4uSubteqTvFrVrURwkmHixBo0G4seD0zUxp98E1DzUBJxLQ3NPwXrGKDiVjwx/DpPsg==",
+      "dev": true,
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "tslib": "^2.4.0"
+      }
+    },
     "node_modules/@types/babel__core": {
       "version": "7.20.5",
       "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
@@ -1157,12 +1494,13 @@
       }
     },
     "node_modules/@types/node": {
-      "version": "20.11.30",
-      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.11.30.tgz",
-      "integrity": "sha512-dHM6ZxwlmuZaRmUPfv1p+KrdD1Dci04FbdEm/9wEMouFqxYoFl5aMkt0VMAUtYRQDyYvD41WJLukhq/ha3YuTw==",
+      "version": "25.5.0",
+      "resolved": "https://registry.npmjs.org/@types/node/-/node-25.5.0.tgz",
+      "integrity": "sha512-jp2P3tQMSxWugkCUKLRPVUpGaL5MVFwF8RDuSRztfwgN1wmqJeMSbKlnEtQqU8UrhTmzEmZdu2I6v2dpp7XIxw==",
       "dev": true,
+      "license": "MIT",
       "dependencies": {
-        "undici-types": "~5.26.4"
+        "undici-types": "~7.18.0"
       }
     },
     "node_modules/@types/stack-utils": {
@@ -1198,6 +1536,145 @@
       "integrity": "sha512-zuVdFrMJiuCDQUMCzQaD6KL28MjnqqN8XnAqiEq9PNm/hCPTSGfrXCOfwj1ow4LFb/tNymJPwsNbVePc1xFqrQ==",
       "dev": true
     },
+    "node_modules/@vitejs/plugin-vue": {
+      "version": "6.0.5",
+      "resolved": "https://registry.npmjs.org/@vitejs/plugin-vue/-/plugin-vue-6.0.5.tgz",
+      "integrity": "sha512-bL3AxKuQySfk1iGcBsQnoRVexTPJq0Z/ixFVM8OhVJAP6ZXXXLtM7NFKWhLl30Kg7uTBqIaPXbh+nuQCuBDedg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@rolldown/pluginutils": "1.0.0-rc.2"
+      },
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      },
+      "peerDependencies": {
+        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0",
+        "vue": "^3.2.25"
+      }
+    },
+    "node_modules/@vue/compiler-core": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.5.30.tgz",
+      "integrity": "sha512-s3DfdZkcu/qExZ+td75015ljzHc6vE+30cFMGRPROYjqkroYI5NV2X1yAMX9UeyBNWB9MxCfPcsjpLS11nzkkw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.29.0",
+        "@vue/shared": "3.5.30",
+        "entities": "^7.0.1",
+        "estree-walker": "^2.0.2",
+        "source-map-js": "^1.2.1"
+      }
+    },
+    "node_modules/@vue/compiler-core/node_modules/entities": {
+      "version": "7.0.1",
+      "resolved": "https://registry.npmjs.org/entities/-/entities-7.0.1.tgz",
+      "integrity": "sha512-TWrgLOFUQTH994YUyl1yT4uyavY5nNB5muff+RtWaqNVCAK408b5ZnnbNAUEWLTCpum9w6arT70i1XdQ4UeOPA==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=0.12"
+      },
+      "funding": {
+        "url": "https://github.com/fb55/entities?sponsor=1"
+      }
+    },
+    "node_modules/@vue/compiler-dom": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.5.30.tgz",
+      "integrity": "sha512-eCFYESUEVYHhiMuK4SQTldO3RYxyMR/UQL4KdGD1Yrkfdx4m/HYuZ9jSfPdA+nWJY34VWndiYdW/wZXyiPEB9g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vue/compiler-core": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "node_modules/@vue/compiler-sfc": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-sfc/-/compiler-sfc-3.5.30.tgz",
+      "integrity": "sha512-LqmFPDn89dtU9vI3wHJnwaV6GfTRD87AjWpTWpyrdVOObVtjIuSeZr181z5C4PmVx/V3j2p+0f7edFKGRMpQ5A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.29.0",
+        "@vue/compiler-core": "3.5.30",
+        "@vue/compiler-dom": "3.5.30",
+        "@vue/compiler-ssr": "3.5.30",
+        "@vue/shared": "3.5.30",
+        "estree-walker": "^2.0.2",
+        "magic-string": "^0.30.21",
+        "postcss": "^8.5.8",
+        "source-map-js": "^1.2.1"
+      }
+    },
+    "node_modules/@vue/compiler-ssr": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-ssr/-/compiler-ssr-3.5.30.tgz",
+      "integrity": "sha512-NsYK6OMTnx109PSL2IAyf62JP6EUdk4Dmj6AkWcJGBvN0dQoMYtVekAmdqgTtWQgEJo+Okstbf/1p7qZr5H+bA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vue/compiler-dom": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "node_modules/@vue/reactivity": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.5.30.tgz",
+      "integrity": "sha512-179YNgKATuwj9gB+66snskRDOitDiuOZqkYia7mHKJaidOMo/WJxHKF8DuGc4V4XbYTJANlfEKb0yxTQotnx4Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "node_modules/@vue/runtime-core": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/runtime-core/-/runtime-core-3.5.30.tgz",
+      "integrity": "sha512-e0Z+8PQsUTdwV8TtEsLzUM7SzC7lQwYKePydb7K2ZnmS6jjND+WJXkmmfh/swYzRyfP1EY3fpdesyYoymCzYfg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vue/reactivity": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "node_modules/@vue/runtime-dom": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/runtime-dom/-/runtime-dom-3.5.30.tgz",
+      "integrity": "sha512-2UIGakjU4WSQ0T4iwDEW0W7vQj6n7AFn7taqZ9Cvm0Q/RA2FFOziLESrDL4GmtI1wV3jXg5nMoJSYO66egDUBw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vue/reactivity": "3.5.30",
+        "@vue/runtime-core": "3.5.30",
+        "@vue/shared": "3.5.30",
+        "csstype": "^3.2.3"
+      }
+    },
+    "node_modules/@vue/server-renderer": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/server-renderer/-/server-renderer-3.5.30.tgz",
+      "integrity": "sha512-v+R34icapydRwbZRD0sXwtHqrQJv38JuMB4JxbOxd8NEpGLny7cncMp53W9UH/zo4j8eDHjQ1dEJXwzFQknjtQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vue/compiler-ssr": "3.5.30",
+        "@vue/shared": "3.5.30"
+      },
+      "peerDependencies": {
+        "vue": "3.5.30"
+      }
+    },
+    "node_modules/@vue/shared": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/shared/-/shared-3.5.30.tgz",
+      "integrity": "sha512-YXgQ7JjaO18NeK2K9VTbDHaFy62WrObMa6XERNfNOkAhD1F1oDSf3ZJ7K6GqabZ0BvSDHajp8qfS5Sa2I9n8uQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/abab": {
       "version": "2.0.6",
       "resolved": "https://registry.npmjs.org/abab/-/abab-2.0.6.tgz",
@@ -1781,6 +2258,13 @@
       "integrity": "sha512-b0tGHbfegbhPJpxpiBPU2sCkigAqtM9O121le6bbOlgyV+NyGyCmVfJ6QW9eRjz8CpNfWEOYBIMIGRYkLwsIYg==",
       "dev": true
     },
+    "node_modules/csstype": {
+      "version": "3.2.3",
+      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
+      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/data-urls": {
       "version": "3.0.2",
       "resolved": "https://registry.npmjs.org/data-urls/-/data-urls-3.0.2.tgz",
@@ -1856,6 +2340,16 @@
         "node": ">=0.4.0"
       }
     },
+    "node_modules/detect-libc": {
+      "version": "2.1.2",
+      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
+      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/detect-newline": {
       "version": "3.1.0",
       "resolved": "https://registry.npmjs.org/detect-newline/-/detect-newline-3.1.0.tgz",
@@ -2257,6 +2751,13 @@
         "node": ">=4.0"
       }
     },
+    "node_modules/estree-walker": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-2.0.2.tgz",
+      "integrity": "sha512-Rfkk/Mp/DL7JVje3u18FxFujQlTNR2q6QfMSMB7AvCBx91NGj/ba3kCfza0f6dVDbw7YlRf/nDrn7pQrCCyQ/w==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/esutils": {
       "version": "2.0.3",
       "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
@@ -3733,6 +4234,267 @@
         "node": ">= 0.8.0"
       }
     },
+    "node_modules/lightningcss": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.32.0.tgz",
+      "integrity": "sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==",
+      "dev": true,
+      "license": "MPL-2.0",
+      "dependencies": {
+        "detect-libc": "^2.0.3"
+      },
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      },
+      "optionalDependencies": {
+        "lightningcss-android-arm64": "1.32.0",
+        "lightningcss-darwin-arm64": "1.32.0",
+        "lightningcss-darwin-x64": "1.32.0",
+        "lightningcss-freebsd-x64": "1.32.0",
+        "lightningcss-linux-arm-gnueabihf": "1.32.0",
+        "lightningcss-linux-arm64-gnu": "1.32.0",
+        "lightningcss-linux-arm64-musl": "1.32.0",
+        "lightningcss-linux-x64-gnu": "1.32.0",
+        "lightningcss-linux-x64-musl": "1.32.0",
+        "lightningcss-win32-arm64-msvc": "1.32.0",
+        "lightningcss-win32-x64-msvc": "1.32.0"
+      }
+    },
+    "node_modules/lightningcss-android-arm64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.32.0.tgz",
+      "integrity": "sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "android"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-darwin-arm64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.32.0.tgz",
+      "integrity": "sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-darwin-x64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.32.0.tgz",
+      "integrity": "sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "darwin"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-freebsd-x64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.32.0.tgz",
+      "integrity": "sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "freebsd"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-linux-arm-gnueabihf": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.32.0.tgz",
+      "integrity": "sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==",
+      "cpu": [
+        "arm"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-linux-arm64-gnu": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.32.0.tgz",
+      "integrity": "sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-linux-arm64-musl": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.32.0.tgz",
+      "integrity": "sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-linux-x64-gnu": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.32.0.tgz",
+      "integrity": "sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-linux-x64-musl": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.32.0.tgz",
+      "integrity": "sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "linux"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-win32-arm64-msvc": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.32.0.tgz",
+      "integrity": "sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==",
+      "cpu": [
+        "arm64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
+    "node_modules/lightningcss-win32-x64-msvc": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.32.0.tgz",
+      "integrity": "sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==",
+      "cpu": [
+        "x64"
+      ],
+      "dev": true,
+      "license": "MPL-2.0",
+      "optional": true,
+      "os": [
+        "win32"
+      ],
+      "engines": {
+        "node": ">= 12.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/parcel"
+      }
+    },
     "node_modules/lines-and-columns": {
       "version": "1.2.4",
       "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
@@ -3775,6 +4537,16 @@
         "lz-string": "bin/bin.js"
       }
     },
+    "node_modules/magic-string": {
+      "version": "0.30.21",
+      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
+      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jridgewell/sourcemap-codec": "^1.5.5"
+      }
+    },
     "node_modules/make-dir": {
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/make-dir/-/make-dir-4.0.0.tgz",
@@ -3909,6 +4681,25 @@
       "integrity": "sha512-sGkPx+VjMtmA6MX27oA4FBFELFCZZ4S4XqeGOXCv68tT+jb3vk/RyaKWP0PTKyWtmLSM0b+adUTEvbs1PEaH2w==",
       "dev": true
     },
+    "node_modules/nanoid": {
+      "version": "3.3.11",
+      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
+      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "bin": {
+        "nanoid": "bin/nanoid.cjs"
+      },
+      "engines": {
+        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
+      }
+    },
     "node_modules/natural-compare": {
       "version": "1.4.0",
       "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
@@ -4161,6 +4952,35 @@
         "node": ">=8"
       }
     },
+    "node_modules/postcss": {
+      "version": "8.5.8",
+      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.8.tgz",
+      "integrity": "sha512-OW/rX8O/jXnm82Ey1k44pObPtdblfiuWnrd8X7GJ7emImCOstunGbXUpp7HdBrFQX6rJzn3sPT397Wp5aCwCHg==",
+      "dev": true,
+      "funding": [
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/postcss/"
+        },
+        {
+          "type": "tidelift",
+          "url": "https://tidelift.com/funding/github/npm/postcss"
+        },
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/ai"
+        }
+      ],
+      "license": "MIT",
+      "dependencies": {
+        "nanoid": "^3.3.11",
+        "picocolors": "^1.1.1",
+        "source-map-js": "^1.2.1"
+      },
+      "engines": {
+        "node": "^10 || ^12 || >=14"
+      }
+    },
     "node_modules/prelude-ls": {
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
@@ -4356,6 +5176,47 @@
         "url": "https://github.com/sponsors/isaacs"
       }
     },
+    "node_modules/rolldown": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/rolldown/-/rolldown-1.0.0-rc.10.tgz",
+      "integrity": "sha512-q7j6vvarRFmKpgJUT8HCAUljkgzEp4LAhPlJUvQhA5LA1SUL36s5QCysMutErzL3EbNOZOkoziSx9iZC4FddKA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@oxc-project/types": "=0.120.0",
+        "@rolldown/pluginutils": "1.0.0-rc.10"
+      },
+      "bin": {
+        "rolldown": "bin/cli.mjs"
+      },
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      },
+      "optionalDependencies": {
+        "@rolldown/binding-android-arm64": "1.0.0-rc.10",
+        "@rolldown/binding-darwin-arm64": "1.0.0-rc.10",
+        "@rolldown/binding-darwin-x64": "1.0.0-rc.10",
+        "@rolldown/binding-freebsd-x64": "1.0.0-rc.10",
+        "@rolldown/binding-linux-arm-gnueabihf": "1.0.0-rc.10",
+        "@rolldown/binding-linux-arm64-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-arm64-musl": "1.0.0-rc.10",
+        "@rolldown/binding-linux-ppc64-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-s390x-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-x64-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-x64-musl": "1.0.0-rc.10",
+        "@rolldown/binding-openharmony-arm64": "1.0.0-rc.10",
+        "@rolldown/binding-wasm32-wasi": "1.0.0-rc.10",
+        "@rolldown/binding-win32-arm64-msvc": "1.0.0-rc.10",
+        "@rolldown/binding-win32-x64-msvc": "1.0.0-rc.10"
+      }
+    },
+    "node_modules/rolldown/node_modules/@rolldown/pluginutils": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-rc.10.tgz",
+      "integrity": "sha512-UkVDEFk1w3mveXeKgaTuYfKWtPbvgck1dT8TUG3bnccrH0XtLTuAyfCoks4Q/M5ZGToSVJTIQYCzy2g/atAOeg==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/run-parallel": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
@@ -4457,6 +5318,16 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/source-map-js": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
+      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/source-map-support": {
       "version": "0.5.13",
       "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.13.tgz",
@@ -4613,6 +5484,55 @@
       "integrity": "sha1-f17oI66AUgfACvLfSoTsP8+lcLQ=",
       "dev": true
     },
+    "node_modules/tinyglobby": {
+      "version": "0.2.15",
+      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.15.tgz",
+      "integrity": "sha512-j2Zq4NyQYG5XMST4cbs02Ak8iJUdxRM0XI5QyxXuZOzKOINmWurp3smXu3y5wDcJrptwpSjgXHzIQxR0omXljQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "fdir": "^6.5.0",
+        "picomatch": "^4.0.3"
+      },
+      "engines": {
+        "node": ">=12.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/SuperchupuDev"
+      }
+    },
+    "node_modules/tinyglobby/node_modules/fdir": {
+      "version": "6.5.0",
+      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
+      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12.0.0"
+      },
+      "peerDependencies": {
+        "picomatch": "^3 || ^4"
+      },
+      "peerDependenciesMeta": {
+        "picomatch": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/tinyglobby/node_modules/picomatch": {
+      "version": "4.0.3",
+      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
+      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/jonschlinkert"
+      }
+    },
     "node_modules/tmpl": {
       "version": "1.0.5",
       "resolved": "https://registry.npmjs.org/tmpl/-/tmpl-1.0.5.tgz",
@@ -4658,6 +5578,14 @@
         "node": ">=12"
       }
     },
+    "node_modules/tslib": {
+      "version": "2.8.1",
+      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
+      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
+      "dev": true,
+      "license": "0BSD",
+      "optional": true
+    },
     "node_modules/type-check": {
       "version": "0.4.0",
       "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
@@ -4692,10 +5620,11 @@
       }
     },
     "node_modules/undici-types": {
-      "version": "5.26.5",
-      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-5.26.5.tgz",
-      "integrity": "sha512-JlCMO+ehdEIKqlFxk6IfVoAUVmgz7cU7zD/h9XZ0qzeosSHmUJVOzSQvvYSYWXkFXC+IfLKSIffhv0sVZup6pA==",
-      "dev": true
+      "version": "7.18.2",
+      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-7.18.2.tgz",
+      "integrity": "sha512-AsuCzffGHJybSaRrmr5eHr81mwJU3kjw6M+uprWvCXiNeN9SOGwQ3Jn8jb8m3Z6izVgknn1R0FTCEAP2QrLY/w==",
+      "dev": true,
+      "license": "MIT"
     },
     "node_modules/universalify": {
       "version": "0.2.0",
@@ -4745,28 +5674,142 @@
         "punycode": "^2.1.0"
       }
     },
-    "node_modules/url-parse": {
-      "version": "1.5.10",
-      "resolved": "https://registry.npmjs.org/url-parse/-/url-parse-1.5.10.tgz",
-      "integrity": "sha512-WypcfiRhfeUP9vvF0j6rw0J3hrWrw6iZv3+22h6iRMJ/8z1Tj6XfLP4DsUix5MhMPnXpiHDoKyoZ/bdCkwBCiQ==",
+    "node_modules/url-parse": {
+      "version": "1.5.10",
+      "resolved": "https://registry.npmjs.org/url-parse/-/url-parse-1.5.10.tgz",
+      "integrity": "sha512-WypcfiRhfeUP9vvF0j6rw0J3hrWrw6iZv3+22h6iRMJ/8z1Tj6XfLP4DsUix5MhMPnXpiHDoKyoZ/bdCkwBCiQ==",
+      "dev": true,
+      "dependencies": {
+        "querystringify": "^2.1.1",
+        "requires-port": "^1.0.0"
+      }
+    },
+    "node_modules/v8-to-istanbul": {
+      "version": "9.2.0",
+      "resolved": "https://registry.npmjs.org/v8-to-istanbul/-/v8-to-istanbul-9.2.0.tgz",
+      "integrity": "sha512-/EH/sDgxU2eGxajKdwLCDmQ4FWq+kpi3uCmBGpw1xJtnAxEjlD8j8PEiGWpCIMIs3ciNAgH0d3TTJiUkYzyZjA==",
+      "dev": true,
+      "dependencies": {
+        "@jridgewell/trace-mapping": "^0.3.12",
+        "@types/istanbul-lib-coverage": "^2.0.1",
+        "convert-source-map": "^2.0.0"
+      },
+      "engines": {
+        "node": ">=10.12.0"
+      }
+    },
+    "node_modules/vite": {
+      "version": "8.0.1",
+      "resolved": "https://registry.npmjs.org/vite/-/vite-8.0.1.tgz",
+      "integrity": "sha512-wt+Z2qIhfFt85uiyRt5LPU4oVEJBXj8hZNWKeqFG4gRG/0RaRGJ7njQCwzFVjO+v4+Ipmf5CY7VdmZRAYYBPHw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "lightningcss": "^1.32.0",
+        "picomatch": "^4.0.3",
+        "postcss": "^8.5.8",
+        "rolldown": "1.0.0-rc.10",
+        "tinyglobby": "^0.2.15"
+      },
+      "bin": {
+        "vite": "bin/vite.js"
+      },
+      "engines": {
+        "node": "^20.19.0 || >=22.12.0"
+      },
+      "funding": {
+        "url": "https://github.com/vitejs/vite?sponsor=1"
+      },
+      "optionalDependencies": {
+        "fsevents": "~2.3.3"
+      },
+      "peerDependencies": {
+        "@types/node": "^20.19.0 || >=22.12.0",
+        "@vitejs/devtools": "^0.1.0",
+        "esbuild": "^0.27.0",
+        "jiti": ">=1.21.0",
+        "less": "^4.0.0",
+        "sass": "^1.70.0",
+        "sass-embedded": "^1.70.0",
+        "stylus": ">=0.54.8",
+        "sugarss": "^5.0.0",
+        "terser": "^5.16.0",
+        "tsx": "^4.8.1",
+        "yaml": "^2.4.2"
+      },
+      "peerDependenciesMeta": {
+        "@types/node": {
+          "optional": true
+        },
+        "@vitejs/devtools": {
+          "optional": true
+        },
+        "esbuild": {
+          "optional": true
+        },
+        "jiti": {
+          "optional": true
+        },
+        "less": {
+          "optional": true
+        },
+        "sass": {
+          "optional": true
+        },
+        "sass-embedded": {
+          "optional": true
+        },
+        "stylus": {
+          "optional": true
+        },
+        "sugarss": {
+          "optional": true
+        },
+        "terser": {
+          "optional": true
+        },
+        "tsx": {
+          "optional": true
+        },
+        "yaml": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/vite/node_modules/picomatch": {
+      "version": "4.0.3",
+      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
+      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
       "dev": true,
-      "dependencies": {
-        "querystringify": "^2.1.1",
-        "requires-port": "^1.0.0"
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/jonschlinkert"
       }
     },
-    "node_modules/v8-to-istanbul": {
-      "version": "9.2.0",
-      "resolved": "https://registry.npmjs.org/v8-to-istanbul/-/v8-to-istanbul-9.2.0.tgz",
-      "integrity": "sha512-/EH/sDgxU2eGxajKdwLCDmQ4FWq+kpi3uCmBGpw1xJtnAxEjlD8j8PEiGWpCIMIs3ciNAgH0d3TTJiUkYzyZjA==",
+    "node_modules/vue": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/vue/-/vue-3.5.30.tgz",
+      "integrity": "sha512-hTHLc6VNZyzzEH/l7PFGjpcTvUgiaPK5mdLkbjrTeWSRcEfxFrv56g/XckIYlE9ckuobsdwqd5mk2g1sBkMewg==",
       "dev": true,
+      "license": "MIT",
+      "peer": true,
       "dependencies": {
-        "@jridgewell/trace-mapping": "^0.3.12",
-        "@types/istanbul-lib-coverage": "^2.0.1",
-        "convert-source-map": "^2.0.0"
+        "@vue/compiler-dom": "3.5.30",
+        "@vue/compiler-sfc": "3.5.30",
+        "@vue/runtime-dom": "3.5.30",
+        "@vue/server-renderer": "3.5.30",
+        "@vue/shared": "3.5.30"
       },
-      "engines": {
-        "node": ">=10.12.0"
+      "peerDependencies": {
+        "typescript": "*"
+      },
+      "peerDependenciesMeta": {
+        "typescript": {
+          "optional": true
+        }
       }
     },
     "node_modules/w3c-xmlserializer": {
@@ -5378,6 +6421,37 @@
       "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
       "dev": true
     },
+    "@emnapi/core": {
+      "version": "1.9.1",
+      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.9.1.tgz",
+      "integrity": "sha512-mukuNALVsoix/w1BJwFzwXBN/dHeejQtuVzcDsfOEsdpCumXb/E9j8w11h5S54tT1xhifGfbbSm/ICrObRb3KA==",
+      "dev": true,
+      "optional": true,
+      "requires": {
+        "@emnapi/wasi-threads": "1.2.0",
+        "tslib": "^2.4.0"
+      }
+    },
+    "@emnapi/runtime": {
+      "version": "1.9.1",
+      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.9.1.tgz",
+      "integrity": "sha512-VYi5+ZVLhpgK4hQ0TAjiQiZ6ol0oe4mBx7mVv7IflsiEp0OWoVsp/+f9Vc1hOhE0TtkORVrI1GvzyreqpgWtkA==",
+      "dev": true,
+      "optional": true,
+      "requires": {
+        "tslib": "^2.4.0"
+      }
+    },
+    "@emnapi/wasi-threads": {
+      "version": "1.2.0",
+      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.0.tgz",
+      "integrity": "sha512-N10dEJNSsUx41Z6pZsXU8FjPjpBEplgH24sfkmITrBED1/U2Esum9F3lfLrMjKHHjmi557zQn7kR9R+XWXu5Rg==",
+      "dev": true,
+      "optional": true,
+      "requires": {
+        "tslib": "^2.4.0"
+      }
+    },
     "@eslint-community/eslint-utils": {
       "version": "4.4.0",
       "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.4.0.tgz",
@@ -5727,9 +6801,9 @@
       "dev": true
     },
     "@jridgewell/sourcemap-codec": {
-      "version": "1.4.15",
-      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.4.15.tgz",
-      "integrity": "sha512-eF2rxCRulEKXHTRiDrDy6erMYWqNw4LPdQ8UQA4huuxaQsVeRPFl2oM8oDGxMFhJUWZf9McpLtJasDDZb/Bpeg==",
+      "version": "1.5.5",
+      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
+      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
       "dev": true
     },
     "@jridgewell/trace-mapping": {
@@ -5742,6 +6816,18 @@
         "@jridgewell/sourcemap-codec": "^1.4.14"
       }
     },
+    "@napi-rs/wasm-runtime": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-1.1.1.tgz",
+      "integrity": "sha512-p64ah1M1ld8xjWv3qbvFwHiFVWrq1yFvV4f7w+mzaqiR4IlSgkqhcRdHwsGgomwzBH51sRY4NEowLxnaBjcW/A==",
+      "dev": true,
+      "optional": true,
+      "requires": {
+        "@emnapi/core": "^1.7.1",
+        "@emnapi/runtime": "^1.7.1",
+        "@tybys/wasm-util": "^0.10.1"
+      }
+    },
     "@nodelib/fs.scandir": {
       "version": "2.1.5",
       "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
@@ -5768,6 +6854,126 @@
         "fastq": "^1.6.0"
       }
     },
+    "@oxc-project/types": {
+      "version": "0.120.0",
+      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.120.0.tgz",
+      "integrity": "sha512-k1YNu55DuvAip/MGE1FTsIuU3FUCn6v/ujG9V7Nq5Df/kX2CWb13hhwD0lmJGMGqE+bE1MXvv9SZVnMzEXlWcg==",
+      "dev": true
+    },
+    "@rolldown/binding-android-arm64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm64/-/binding-android-arm64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-jOHxwXhxmFKuXztiu1ORieJeTbx5vrTkcOkkkn2d35726+iwhrY1w/+nYY/AGgF12thg33qC3R1LMBF5tHTZHg==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-darwin-arm64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-arm64/-/binding-darwin-arm64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-gED05Teg/vtTZbIJBc4VNMAxAFDUPkuO/rAIyyxZjTj1a1/s6z5TII/5yMGZ0uLRCifEtwUQn8OlYzuYc0m70w==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-darwin-x64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-x64/-/binding-darwin-x64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-rI15NcM1mA48lqrIxVkHfAqcyFLcQwyXWThy+BQ5+mkKKPvSO26ir+ZDp36AgYoYVkqvMcdS8zOE6SeBsR9e8A==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-freebsd-x64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-freebsd-x64/-/binding-freebsd-x64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-XZRXHdTa+4ME1MuDVp021+doQ+z6Ei4CCFmNc5/sKbqb8YmkiJdj8QKlV3rCI0AJtAeSB5n0WGPuJWNL9p/L2w==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-arm-gnueabihf": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.0.0-rc.10.tgz",
+      "integrity": "sha512-R0SQMRluISSLzFE20sPWYHVmJdDQnRyc/FzSCN72BqQmh2SOZUFG+N3/vBZpR4C6WpEUVYJLrYUXaj43sJsNLA==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-arm64-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-Y1reMrV/o+cwpduYhJuOE3OMKx32RMYCidf14y+HssARRmhDuWXJ4yVguDg2R/8SyyGNo+auzz64LnPK9Hq6jg==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-arm64-musl": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.0.0-rc.10.tgz",
+      "integrity": "sha512-vELN+HNb2IzuzSBUOD4NHmP9yrGwl1DVM29wlQvx1OLSclL0NgVWnVDKl/8tEks79EFek/kebQKnNJkIAA4W2g==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-ppc64-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-ZqrufYTgzxbHwpqOjzSsb0UV/aV2TFIY5rP8HdsiPTv/CuAgCRjM6s9cYFwQ4CNH+hf9Y4erHW1GjZuZ7WoI7w==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-s390x-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-gSlmVS1FZJSRicA6IyjoRoKAFK7IIHBs7xJuHRSmjImqk3mPPWbR7RhbnfH2G6bcmMEllCt2vQ/7u9e6bBnByg==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-x64-gnu": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.0.0-rc.10.tgz",
+      "integrity": "sha512-eOCKUpluKgfObT2pHjztnaWEIbUabWzk3qPZ5PuacuPmr4+JtQG4k2vGTY0H15edaTnicgU428XW/IH6AimcQw==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-linux-x64-musl": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-musl/-/binding-linux-x64-musl-1.0.0-rc.10.tgz",
+      "integrity": "sha512-Xdf2jQbfQowJnLcgYfD/m0Uu0Qj5OdxKallD78/IPPfzaiaI4KRAwZzHcKQ4ig1gtg1SuzC7jovNiM2TzQsBXA==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-openharmony-arm64": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-openharmony-arm64/-/binding-openharmony-arm64-1.0.0-rc.10.tgz",
+      "integrity": "sha512-o1hYe8hLi1EY6jgPFyxQgQ1wcycX+qz8eEbVmot2hFkgUzPxy9+kF0u0NIQBeDq+Mko47AkaFFaChcvZa9UX9Q==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-wasm32-wasi": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-wasm32-wasi/-/binding-wasm32-wasi-1.0.0-rc.10.tgz",
+      "integrity": "sha512-Ugv9o7qYJudqQO5Y5y2N2SOo6S4WiqiNOpuQyoPInnhVzCY+wi/GHltcLHypG9DEUYMB0iTB/huJrpadiAcNcA==",
+      "dev": true,
+      "optional": true,
+      "requires": {
+        "@napi-rs/wasm-runtime": "^1.1.1"
+      }
+    },
+    "@rolldown/binding-win32-arm64-msvc": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.0.0-rc.10.tgz",
+      "integrity": "sha512-7UODQb4fQUNT/vmgDZBl3XOBAIOutP5R3O/rkxg0aLfEGQ4opbCgU5vOw/scPe4xOqBwL9fw7/RP1vAMZ6QlAQ==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/binding-win32-x64-msvc": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.0.0-rc.10.tgz",
+      "integrity": "sha512-PYxKHMVHOb5NJuDL53vBUl1VwUjymDcYI6rzpIni0C9+9mTiJedvUxSk7/RPp7OOAm3v+EjgMu9bIy3N6b408w==",
+      "dev": true,
+      "optional": true
+    },
+    "@rolldown/pluginutils": {
+      "version": "1.0.0-rc.2",
+      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-rc.2.tgz",
+      "integrity": "sha512-izyXV/v+cHiRfozX62W9htOAvwMo4/bXKDrQ+vom1L1qRuexPock/7VZDAhnpHCLNejd3NJ6hiab+tO0D44Rgw==",
+      "dev": true
+    },
     "@sinclair/typebox": {
       "version": "0.27.8",
       "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.27.8.tgz",
@@ -5798,6 +7004,16 @@
       "integrity": "sha512-XCuKFP5PS55gnMVu3dty8KPatLqUoy/ZYzDzAGCQ8JNFCkLXzmI7vNHCR+XpbZaMWQK/vQubr7PkYq8g470J/A==",
       "dev": true
     },
+    "@tybys/wasm-util": {
+      "version": "0.10.1",
+      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.1.tgz",
+      "integrity": "sha512-9tTaPJLSiejZKx+Bmog4uSubteqTvFrVrURwkmHixBo0G4seD0zUxp98E1DzUBJxLQ3NPwXrGKDiVjwx/DpPsg==",
+      "dev": true,
+      "optional": true,
+      "requires": {
+        "tslib": "^2.4.0"
+      }
+    },
     "@types/babel__core": {
       "version": "7.20.5",
       "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
@@ -5893,12 +7109,12 @@
       }
     },
     "@types/node": {
-      "version": "20.11.30",
-      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.11.30.tgz",
-      "integrity": "sha512-dHM6ZxwlmuZaRmUPfv1p+KrdD1Dci04FbdEm/9wEMouFqxYoFl5aMkt0VMAUtYRQDyYvD41WJLukhq/ha3YuTw==",
+      "version": "25.5.0",
+      "resolved": "https://registry.npmjs.org/@types/node/-/node-25.5.0.tgz",
+      "integrity": "sha512-jp2P3tQMSxWugkCUKLRPVUpGaL5MVFwF8RDuSRztfwgN1wmqJeMSbKlnEtQqU8UrhTmzEmZdu2I6v2dpp7XIxw==",
       "dev": true,
       "requires": {
-        "undici-types": "~5.26.4"
+        "undici-types": "~7.18.0"
       }
     },
     "@types/stack-utils": {
@@ -5934,6 +7150,120 @@
       "integrity": "sha512-zuVdFrMJiuCDQUMCzQaD6KL28MjnqqN8XnAqiEq9PNm/hCPTSGfrXCOfwj1ow4LFb/tNymJPwsNbVePc1xFqrQ==",
       "dev": true
     },
+    "@vitejs/plugin-vue": {
+      "version": "6.0.5",
+      "resolved": "https://registry.npmjs.org/@vitejs/plugin-vue/-/plugin-vue-6.0.5.tgz",
+      "integrity": "sha512-bL3AxKuQySfk1iGcBsQnoRVexTPJq0Z/ixFVM8OhVJAP6ZXXXLtM7NFKWhLl30Kg7uTBqIaPXbh+nuQCuBDedg==",
+      "dev": true,
+      "requires": {
+        "@rolldown/pluginutils": "1.0.0-rc.2"
+      }
+    },
+    "@vue/compiler-core": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.5.30.tgz",
+      "integrity": "sha512-s3DfdZkcu/qExZ+td75015ljzHc6vE+30cFMGRPROYjqkroYI5NV2X1yAMX9UeyBNWB9MxCfPcsjpLS11nzkkw==",
+      "dev": true,
+      "requires": {
+        "@babel/parser": "^7.29.0",
+        "@vue/shared": "3.5.30",
+        "entities": "^7.0.1",
+        "estree-walker": "^2.0.2",
+        "source-map-js": "^1.2.1"
+      },
+      "dependencies": {
+        "entities": {
+          "version": "7.0.1",
+          "resolved": "https://registry.npmjs.org/entities/-/entities-7.0.1.tgz",
+          "integrity": "sha512-TWrgLOFUQTH994YUyl1yT4uyavY5nNB5muff+RtWaqNVCAK408b5ZnnbNAUEWLTCpum9w6arT70i1XdQ4UeOPA==",
+          "dev": true
+        }
+      }
+    },
+    "@vue/compiler-dom": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.5.30.tgz",
+      "integrity": "sha512-eCFYESUEVYHhiMuK4SQTldO3RYxyMR/UQL4KdGD1Yrkfdx4m/HYuZ9jSfPdA+nWJY34VWndiYdW/wZXyiPEB9g==",
+      "dev": true,
+      "requires": {
+        "@vue/compiler-core": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "@vue/compiler-sfc": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-sfc/-/compiler-sfc-3.5.30.tgz",
+      "integrity": "sha512-LqmFPDn89dtU9vI3wHJnwaV6GfTRD87AjWpTWpyrdVOObVtjIuSeZr181z5C4PmVx/V3j2p+0f7edFKGRMpQ5A==",
+      "dev": true,
+      "requires": {
+        "@babel/parser": "^7.29.0",
+        "@vue/compiler-core": "3.5.30",
+        "@vue/compiler-dom": "3.5.30",
+        "@vue/compiler-ssr": "3.5.30",
+        "@vue/shared": "3.5.30",
+        "estree-walker": "^2.0.2",
+        "magic-string": "^0.30.21",
+        "postcss": "^8.5.8",
+        "source-map-js": "^1.2.1"
+      }
+    },
+    "@vue/compiler-ssr": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/compiler-ssr/-/compiler-ssr-3.5.30.tgz",
+      "integrity": "sha512-NsYK6OMTnx109PSL2IAyf62JP6EUdk4Dmj6AkWcJGBvN0dQoMYtVekAmdqgTtWQgEJo+Okstbf/1p7qZr5H+bA==",
+      "dev": true,
+      "requires": {
+        "@vue/compiler-dom": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "@vue/reactivity": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.5.30.tgz",
+      "integrity": "sha512-179YNgKATuwj9gB+66snskRDOitDiuOZqkYia7mHKJaidOMo/WJxHKF8DuGc4V4XbYTJANlfEKb0yxTQotnx4Q==",
+      "dev": true,
+      "requires": {
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "@vue/runtime-core": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/runtime-core/-/runtime-core-3.5.30.tgz",
+      "integrity": "sha512-e0Z+8PQsUTdwV8TtEsLzUM7SzC7lQwYKePydb7K2ZnmS6jjND+WJXkmmfh/swYzRyfP1EY3fpdesyYoymCzYfg==",
+      "dev": true,
+      "requires": {
+        "@vue/reactivity": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "@vue/runtime-dom": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/runtime-dom/-/runtime-dom-3.5.30.tgz",
+      "integrity": "sha512-2UIGakjU4WSQ0T4iwDEW0W7vQj6n7AFn7taqZ9Cvm0Q/RA2FFOziLESrDL4GmtI1wV3jXg5nMoJSYO66egDUBw==",
+      "dev": true,
+      "requires": {
+        "@vue/reactivity": "3.5.30",
+        "@vue/runtime-core": "3.5.30",
+        "@vue/shared": "3.5.30",
+        "csstype": "^3.2.3"
+      }
+    },
+    "@vue/server-renderer": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/server-renderer/-/server-renderer-3.5.30.tgz",
+      "integrity": "sha512-v+R34icapydRwbZRD0sXwtHqrQJv38JuMB4JxbOxd8NEpGLny7cncMp53W9UH/zo4j8eDHjQ1dEJXwzFQknjtQ==",
+      "dev": true,
+      "requires": {
+        "@vue/compiler-ssr": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
+    "@vue/shared": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/@vue/shared/-/shared-3.5.30.tgz",
+      "integrity": "sha512-YXgQ7JjaO18NeK2K9VTbDHaFy62WrObMa6XERNfNOkAhD1F1oDSf3ZJ7K6GqabZ0BvSDHajp8qfS5Sa2I9n8uQ==",
+      "dev": true
+    },
     "abab": {
       "version": "2.0.6",
       "resolved": "https://registry.npmjs.org/abab/-/abab-2.0.6.tgz",
@@ -6361,6 +7691,12 @@
         }
       }
     },
+    "csstype": {
+      "version": "3.2.3",
+      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
+      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
+      "dev": true
+    },
     "data-urls": {
       "version": "3.0.2",
       "resolved": "https://registry.npmjs.org/data-urls/-/data-urls-3.0.2.tgz",
@@ -6412,6 +7748,12 @@
       "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
       "dev": true
     },
+    "detect-libc": {
+      "version": "2.1.2",
+      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
+      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
+      "dev": true
+    },
     "detect-newline": {
       "version": "3.1.0",
       "resolved": "https://registry.npmjs.org/detect-newline/-/detect-newline-3.1.0.tgz",
@@ -6692,6 +8034,12 @@
       "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
       "dev": true
     },
+    "estree-walker": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-2.0.2.tgz",
+      "integrity": "sha512-Rfkk/Mp/DL7JVje3u18FxFujQlTNR2q6QfMSMB7AvCBx91NGj/ba3kCfza0f6dVDbw7YlRf/nDrn7pQrCCyQ/w==",
+      "dev": true
+    },
     "esutils": {
       "version": "2.0.3",
       "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
@@ -7796,6 +9144,103 @@
         "type-check": "~0.4.0"
       }
     },
+    "lightningcss": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.32.0.tgz",
+      "integrity": "sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==",
+      "dev": true,
+      "requires": {
+        "detect-libc": "^2.0.3",
+        "lightningcss-android-arm64": "1.32.0",
+        "lightningcss-darwin-arm64": "1.32.0",
+        "lightningcss-darwin-x64": "1.32.0",
+        "lightningcss-freebsd-x64": "1.32.0",
+        "lightningcss-linux-arm-gnueabihf": "1.32.0",
+        "lightningcss-linux-arm64-gnu": "1.32.0",
+        "lightningcss-linux-arm64-musl": "1.32.0",
+        "lightningcss-linux-x64-gnu": "1.32.0",
+        "lightningcss-linux-x64-musl": "1.32.0",
+        "lightningcss-win32-arm64-msvc": "1.32.0",
+        "lightningcss-win32-x64-msvc": "1.32.0"
+      }
+    },
+    "lightningcss-android-arm64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.32.0.tgz",
+      "integrity": "sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-darwin-arm64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.32.0.tgz",
+      "integrity": "sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-darwin-x64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.32.0.tgz",
+      "integrity": "sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-freebsd-x64": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.32.0.tgz",
+      "integrity": "sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-linux-arm-gnueabihf": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.32.0.tgz",
+      "integrity": "sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-linux-arm64-gnu": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.32.0.tgz",
+      "integrity": "sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-linux-arm64-musl": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.32.0.tgz",
+      "integrity": "sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-linux-x64-gnu": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.32.0.tgz",
+      "integrity": "sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-linux-x64-musl": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.32.0.tgz",
+      "integrity": "sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-win32-arm64-msvc": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.32.0.tgz",
+      "integrity": "sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==",
+      "dev": true,
+      "optional": true
+    },
+    "lightningcss-win32-x64-msvc": {
+      "version": "1.32.0",
+      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.32.0.tgz",
+      "integrity": "sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==",
+      "dev": true,
+      "optional": true
+    },
     "lines-and-columns": {
       "version": "1.2.4",
       "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
@@ -7832,6 +9277,15 @@
       "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
       "dev": true
     },
+    "magic-string": {
+      "version": "0.30.21",
+      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
+      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
+      "dev": true,
+      "requires": {
+        "@jridgewell/sourcemap-codec": "^1.5.5"
+      }
+    },
     "make-dir": {
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/make-dir/-/make-dir-4.0.0.tgz",
@@ -7934,6 +9388,12 @@
       "integrity": "sha512-sGkPx+VjMtmA6MX27oA4FBFELFCZZ4S4XqeGOXCv68tT+jb3vk/RyaKWP0PTKyWtmLSM0b+adUTEvbs1PEaH2w==",
       "dev": true
     },
+    "nanoid": {
+      "version": "3.3.11",
+      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
+      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
+      "dev": true
+    },
     "natural-compare": {
       "version": "1.4.0",
       "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
@@ -8121,6 +9581,17 @@
         "find-up": "^4.0.0"
       }
     },
+    "postcss": {
+      "version": "8.5.8",
+      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.8.tgz",
+      "integrity": "sha512-OW/rX8O/jXnm82Ey1k44pObPtdblfiuWnrd8X7GJ7emImCOstunGbXUpp7HdBrFQX6rJzn3sPT397Wp5aCwCHg==",
+      "dev": true,
+      "requires": {
+        "nanoid": "^3.3.11",
+        "picocolors": "^1.1.1",
+        "source-map-js": "^1.2.1"
+      }
+    },
     "prelude-ls": {
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
@@ -8251,6 +9722,39 @@
         "glob": "^7.1.3"
       }
     },
+    "rolldown": {
+      "version": "1.0.0-rc.10",
+      "resolved": "https://registry.npmjs.org/rolldown/-/rolldown-1.0.0-rc.10.tgz",
+      "integrity": "sha512-q7j6vvarRFmKpgJUT8HCAUljkgzEp4LAhPlJUvQhA5LA1SUL36s5QCysMutErzL3EbNOZOkoziSx9iZC4FddKA==",
+      "dev": true,
+      "requires": {
+        "@oxc-project/types": "=0.120.0",
+        "@rolldown/binding-android-arm64": "1.0.0-rc.10",
+        "@rolldown/binding-darwin-arm64": "1.0.0-rc.10",
+        "@rolldown/binding-darwin-x64": "1.0.0-rc.10",
+        "@rolldown/binding-freebsd-x64": "1.0.0-rc.10",
+        "@rolldown/binding-linux-arm-gnueabihf": "1.0.0-rc.10",
+        "@rolldown/binding-linux-arm64-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-arm64-musl": "1.0.0-rc.10",
+        "@rolldown/binding-linux-ppc64-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-s390x-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-x64-gnu": "1.0.0-rc.10",
+        "@rolldown/binding-linux-x64-musl": "1.0.0-rc.10",
+        "@rolldown/binding-openharmony-arm64": "1.0.0-rc.10",
+        "@rolldown/binding-wasm32-wasi": "1.0.0-rc.10",
+        "@rolldown/binding-win32-arm64-msvc": "1.0.0-rc.10",
+        "@rolldown/binding-win32-x64-msvc": "1.0.0-rc.10",
+        "@rolldown/pluginutils": "1.0.0-rc.10"
+      },
+      "dependencies": {
+        "@rolldown/pluginutils": {
+          "version": "1.0.0-rc.10",
+          "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-rc.10.tgz",
+          "integrity": "sha512-UkVDEFk1w3mveXeKgaTuYfKWtPbvgck1dT8TUG3bnccrH0XtLTuAyfCoks4Q/M5ZGToSVJTIQYCzy2g/atAOeg==",
+          "dev": true
+        }
+      }
+    },
     "run-parallel": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
@@ -8320,6 +9824,12 @@
       "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
       "dev": true
     },
+    "source-map-js": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
+      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
+      "dev": true
+    },
     "source-map-support": {
       "version": "0.5.13",
       "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.13.tgz",
@@ -8439,6 +9949,32 @@
       "integrity": "sha1-f17oI66AUgfACvLfSoTsP8+lcLQ=",
       "dev": true
     },
+    "tinyglobby": {
+      "version": "0.2.15",
+      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.15.tgz",
+      "integrity": "sha512-j2Zq4NyQYG5XMST4cbs02Ak8iJUdxRM0XI5QyxXuZOzKOINmWurp3smXu3y5wDcJrptwpSjgXHzIQxR0omXljQ==",
+      "dev": true,
+      "requires": {
+        "fdir": "^6.5.0",
+        "picomatch": "^4.0.3"
+      },
+      "dependencies": {
+        "fdir": {
+          "version": "6.5.0",
+          "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
+          "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
+          "dev": true,
+          "requires": {}
+        },
+        "picomatch": {
+          "version": "4.0.3",
+          "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
+          "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
+          "dev": true,
+          "peer": true
+        }
+      }
+    },
     "tmpl": {
       "version": "1.0.5",
       "resolved": "https://registry.npmjs.org/tmpl/-/tmpl-1.0.5.tgz",
@@ -8475,6 +10011,13 @@
         "punycode": "^2.1.1"
       }
     },
+    "tslib": {
+      "version": "2.8.1",
+      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
+      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
+      "dev": true,
+      "optional": true
+    },
     "type-check": {
       "version": "0.4.0",
       "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
@@ -8497,9 +10040,9 @@
       "dev": true
     },
     "undici-types": {
-      "version": "5.26.5",
-      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-5.26.5.tgz",
-      "integrity": "sha512-JlCMO+ehdEIKqlFxk6IfVoAUVmgz7cU7zD/h9XZ0qzeosSHmUJVOzSQvvYSYWXkFXC+IfLKSIffhv0sVZup6pA==",
+      "version": "7.18.2",
+      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-7.18.2.tgz",
+      "integrity": "sha512-AsuCzffGHJybSaRrmr5eHr81mwJU3kjw6M+uprWvCXiNeN9SOGwQ3Jn8jb8m3Z6izVgknn1R0FTCEAP2QrLY/w==",
       "dev": true
     },
     "universalify": {
@@ -8548,6 +10091,42 @@
         "convert-source-map": "^2.0.0"
       }
     },
+    "vite": {
+      "version": "8.0.1",
+      "resolved": "https://registry.npmjs.org/vite/-/vite-8.0.1.tgz",
+      "integrity": "sha512-wt+Z2qIhfFt85uiyRt5LPU4oVEJBXj8hZNWKeqFG4gRG/0RaRGJ7njQCwzFVjO+v4+Ipmf5CY7VdmZRAYYBPHw==",
+      "dev": true,
+      "requires": {
+        "fsevents": "~2.3.3",
+        "lightningcss": "^1.32.0",
+        "picomatch": "^4.0.3",
+        "postcss": "^8.5.8",
+        "rolldown": "1.0.0-rc.10",
+        "tinyglobby": "^0.2.15"
+      },
+      "dependencies": {
+        "picomatch": {
+          "version": "4.0.3",
+          "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
+          "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
+          "dev": true
+        }
+      }
+    },
+    "vue": {
+      "version": "3.5.30",
+      "resolved": "https://registry.npmjs.org/vue/-/vue-3.5.30.tgz",
+      "integrity": "sha512-hTHLc6VNZyzzEH/l7PFGjpcTvUgiaPK5mdLkbjrTeWSRcEfxFrv56g/XckIYlE9ckuobsdwqd5mk2g1sBkMewg==",
+      "dev": true,
+      "peer": true,
+      "requires": {
+        "@vue/compiler-dom": "3.5.30",
+        "@vue/compiler-sfc": "3.5.30",
+        "@vue/runtime-dom": "3.5.30",
+        "@vue/server-renderer": "3.5.30",
+        "@vue/shared": "3.5.30"
+      }
+    },
     "w3c-xmlserializer": {
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/w3c-xmlserializer/-/w3c-xmlserializer-4.0.0.tgz",
diff --git a/package.json b/package.json
index b9989c94..b34ed580 100644
--- a/package.json
+++ b/package.json
@@ -9,7 +9,10 @@
     "build": "node scripts/build.mjs",
     "build:minify": "node scripts/build.mjs --minify",
     "deploy": "node scripts/build.mjs --minify --deploy",
-    "validate:esm": "node scripts/validate-esm.mjs && node scripts/check-esm-coverage.mjs"
+    "validate:esm": "node scripts/validate-esm.mjs && node scripts/check-esm-coverage.mjs",
+    "vite:build": "vite build",
+    "vite:dev": "vite",
+    "vite:preview": "vite preview"
   },
   "repository": {
     "type": "git",
@@ -26,8 +29,10 @@
   "homepage": "https://github.com/puarts/FehBattleSimulator#readme",
   "devDependencies": {
     "@types/lz-string": "^1.5.0",
+    "@vitejs/plugin-vue": "^6.0.5",
     "eslint": "^8.57.0",
     "jest": "^29.7.0",
-    "jest-environment-jsdom": "^29.7.0"
+    "jest-environment-jsdom": "^29.7.0",
+    "vite": "^8.0.1"
   }
 }
diff --git a/vite.config.js b/vite.config.js
new file mode 100644
index 00000000..27eb4dcf
--- /dev/null
+++ b/vite.config.js
@@ -0,0 +1,36 @@
+import { defineConfig } from 'vite';
+// import vue from '@vitejs/plugin-vue'; // Enable in Section 06
+
+export default defineConfig({
+    root: 'Sources',
+    // plugins: [vue()], // Enable in Section 06
+    build: {
+        outDir: '../dist',
+        emptyOutDir: true,
+        target: 'es2015',
+        rollupOptions: {
+            input: {
+                AetherRaidSimulator: 'AetherRaidSimulator.html',
+                ArenaSimulator: 'ArenaSimulator.html',
+                SummonerDuelsSimulator: 'SummonerDuelsSimulator.html',
+                UnitBuilder: 'UnitBuilder.html',
+                StatusCalculator: 'StatusCalculator.html',
+                DamageCalculator: 'DamageCalculator.html',
+                HeroIconLister: 'HeroIconLister.html',
+                HeroStatusClusterer: 'HeroStatusClusterer.html',
+            },
+            output: {
+                // Force single JS bundle per entry point for deploy compatibility.
+                // Fallback: run 8 individual builds if manualChunks doesn't work.
+                manualChunks: undefined, // Will be configured in Section 02 after testing
+            },
+        },
+    },
+    resolve: {
+        alias: {
+            // Enable in Section 06 (Vue 3 Core):
+            // Vue 3 runtime compiler build needed for in-HTML templates
+            // 'vue': 'vue/dist/vue.esm-bundler.js',
+        },
+    },
+});
