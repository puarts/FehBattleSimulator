diff --git a/Tests/VitestSetup.test.js b/Tests/VitestSetup.test.js
new file mode 100644
index 00000000..8fd4b7af
--- /dev/null
+++ b/Tests/VitestSetup.test.js
@@ -0,0 +1,25 @@
+// Vitest setup verification test
+// This file validates the Vitest configuration works correctly.
+
+describe('Vitest environment setup', () => {
+    test('globals are available without import (globals: true)', () => {
+        // describe, test, expect should be available without importing from vitest
+        expect(true).toBe(true);
+    });
+
+    test('jsdom environment provides document and window', () => {
+        expect(typeof document).toBe('object');
+        expect(typeof window).toBe('object');
+        expect(document.createElement).toBeDefined();
+    });
+
+    test('performance API is available', () => {
+        expect(globalThis.performance).toBeDefined();
+        expect(typeof performance.now).toBe('function');
+    });
+
+    test('TextEncoder and TextDecoder are available', () => {
+        expect(globalThis.TextEncoder).toBeDefined();
+        expect(globalThis.TextDecoder).toBeDefined();
+    });
+});
diff --git a/package-lock.json b/package-lock.json
index b31ecd83..14829b10 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -14,7 +14,8 @@
         "eslint": "^8.57.0",
         "jest": "^29.7.0",
         "jest-environment-jsdom": "^29.7.0",
-        "vite": "^8.0.1"
+        "vite": "^8.0.1",
+        "vitest": "^4.1.0"
       },
       "engines": {
         "node": ">=22"
@@ -1378,6 +1379,13 @@
         "@sinonjs/commons": "^3.0.0"
       }
     },
+    "node_modules/@standard-schema/spec": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
+      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/@tootallnate/once": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/@tootallnate/once/-/once-2.0.0.tgz",
@@ -1439,6 +1447,31 @@
         "@babel/types": "^7.20.7"
       }
     },
+    "node_modules/@types/chai": {
+      "version": "5.2.3",
+      "resolved": "https://registry.npmjs.org/@types/chai/-/chai-5.2.3.tgz",
+      "integrity": "sha512-Mw558oeA9fFbv65/y4mHtXDs9bPnFMZAL/jxdPFUpOHHIXX91mcgEHbS5Lahr+pwZFR8A7GQleRWeI6cGFC2UA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/deep-eql": "*",
+        "assertion-error": "^2.0.1"
+      }
+    },
+    "node_modules/@types/deep-eql": {
+      "version": "4.0.2",
+      "resolved": "https://registry.npmjs.org/@types/deep-eql/-/deep-eql-4.0.2.tgz",
+      "integrity": "sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/@types/estree": {
+      "version": "1.0.8",
+      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.8.tgz",
+      "integrity": "sha512-dWHzHa2WqEXI/O1E9OjrocMTKJl2mSrEolh1Iomrv6U+JuNwaHXsXx9bLu5gG7BUWFIN0skIQJQ/L1rIex4X6w==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/@types/graceful-fs": {
       "version": "4.1.9",
       "resolved": "https://registry.npmjs.org/@types/graceful-fs/-/graceful-fs-4.1.9.tgz",
@@ -1553,6 +1586,129 @@
         "vue": "^3.2.25"
       }
     },
+    "node_modules/@vitest/expect": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/expect/-/expect-4.1.0.tgz",
+      "integrity": "sha512-EIxG7k4wlWweuCLG9Y5InKFwpMEOyrMb6ZJ1ihYu02LVj/bzUwn2VMU+13PinsjRW75XnITeFrQBMH5+dLvCDA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@standard-schema/spec": "^1.1.0",
+        "@types/chai": "^5.2.2",
+        "@vitest/spy": "4.1.0",
+        "@vitest/utils": "4.1.0",
+        "chai": "^6.2.2",
+        "tinyrainbow": "^3.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/mocker": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/mocker/-/mocker-4.1.0.tgz",
+      "integrity": "sha512-evxREh+Hork43+Y4IOhTo+h5lGmVRyjqI739Rz4RlUPqwrkFFDF6EMvOOYjTx4E8Tl6gyCLRL8Mu7Ry12a13Tw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/spy": "4.1.0",
+        "estree-walker": "^3.0.3",
+        "magic-string": "^0.30.21"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      },
+      "peerDependencies": {
+        "msw": "^2.4.9",
+        "vite": "^6.0.0 || ^7.0.0 || ^8.0.0-0"
+      },
+      "peerDependenciesMeta": {
+        "msw": {
+          "optional": true
+        },
+        "vite": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@vitest/mocker/node_modules/estree-walker": {
+      "version": "3.0.3",
+      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
+      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/estree": "^1.0.0"
+      }
+    },
+    "node_modules/@vitest/pretty-format": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/pretty-format/-/pretty-format-4.1.0.tgz",
+      "integrity": "sha512-3RZLZlh88Ib0J7NQTRATfc/3ZPOnSUn2uDBUoGNn5T36+bALixmzphN26OUD3LRXWkJu4H0s5vvUeqBiw+kS0A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tinyrainbow": "^3.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/runner": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/runner/-/runner-4.1.0.tgz",
+      "integrity": "sha512-Duvx2OzQ7d6OjchL+trw+aSrb9idh7pnNfxrklo14p3zmNL4qPCDeIJAK+eBKYjkIwG96Bc6vYuxhqDXQOWpoQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/utils": "4.1.0",
+        "pathe": "^2.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/snapshot": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/snapshot/-/snapshot-4.1.0.tgz",
+      "integrity": "sha512-0Vy9euT1kgsnj1CHttwi9i9o+4rRLEaPRSOJ5gyv579GJkNpgJK+B4HSv/rAWixx2wdAFci1X4CEPjiu2bXIMg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/pretty-format": "4.1.0",
+        "@vitest/utils": "4.1.0",
+        "magic-string": "^0.30.21",
+        "pathe": "^2.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/spy": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/spy/-/spy-4.1.0.tgz",
+      "integrity": "sha512-pz77k+PgNpyMDv2FV6qmk5ZVau6c3R8HC8v342T2xlFxQKTrSeYw9waIJG8KgV9fFwAtTu4ceRzMivPTH6wSxw==",
+      "dev": true,
+      "license": "MIT",
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
+    "node_modules/@vitest/utils": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/utils/-/utils-4.1.0.tgz",
+      "integrity": "sha512-XfPXT6a8TZY3dcGY8EdwsBulFCIw+BeeX0RZn2x/BtiY/75YGh8FeWGG8QISN/WhaqSrE2OrlDgtF8q5uhOTmw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/pretty-format": "4.1.0",
+        "convert-source-map": "^2.0.0",
+        "tinyrainbow": "^3.0.3"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      }
+    },
     "node_modules/@vue/compiler-core": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.5.30.tgz",
@@ -1824,6 +1980,16 @@
         "sprintf-js": "~1.0.2"
       }
     },
+    "node_modules/assertion-error": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
+      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      }
+    },
     "node_modules/asynckit": {
       "version": "0.4.0",
       "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
@@ -2065,6 +2231,16 @@
         }
       ]
     },
+    "node_modules/chai": {
+      "version": "6.2.2",
+      "resolved": "https://registry.npmjs.org/chai/-/chai-6.2.2.tgz",
+      "integrity": "sha512-NUPRluOfOiTKBKvWPtSD4PhFvWCqOi0BGStNWs57X9js7XGTprSmFoz5F0tWhR4WPjNeR9jXqdC7/UpSJTnlRg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      }
+    },
     "node_modules/chalk": {
       "version": "4.1.2",
       "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
@@ -2470,6 +2646,13 @@
         "node": ">= 0.4"
       }
     },
+    "node_modules/es-module-lexer": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-2.0.0.tgz",
+      "integrity": "sha512-5POEcUuZybH7IdmGsD8wlf0AI55wMecM9rVBTI/qEAy2c1kTOm3DjFYjrBdI2K3BaJjJYfYFeRtM0t9ssnRuxw==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/es-object-atoms": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
@@ -2815,6 +2998,16 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/expect-type": {
+      "version": "1.3.0",
+      "resolved": "https://registry.npmjs.org/expect-type/-/expect-type-1.3.0.tgz",
+      "integrity": "sha512-knvyeauYhqjOYvQ66MznSMs83wmHrCycNEN6Ao+2AeYEfxUIkuiVxdEa1qlGEPK+We3n0THiDciYSsCcgW/DoA==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=12.0.0"
+      }
+    },
     "node_modules/fast-deep-equal": {
       "version": "3.1.3",
       "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
@@ -4745,6 +4938,17 @@
       "integrity": "sha512-qXDmcVlZV4XRtKFzddidpfVP4oMSGhga+xdMc25mv8kaLUHtgzCDhUxkrN8exkGdTlLNaXj7CV3GtON7zuGZ+w==",
       "dev": true
     },
+    "node_modules/obug": {
+      "version": "2.1.1",
+      "resolved": "https://registry.npmjs.org/obug/-/obug-2.1.1.tgz",
+      "integrity": "sha512-uTqF9MuPraAQ+IsnPf366RG4cP9RtUi7MLO1N3KEc+wb0a6yKpeL0lmk2IB1jY5KHPAlTc6T/JRdC/YqxHNwkQ==",
+      "dev": true,
+      "funding": [
+        "https://github.com/sponsors/sxzz",
+        "https://opencollective.com/debug"
+      ],
+      "license": "MIT"
+    },
     "node_modules/once": {
       "version": "1.4.0",
       "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
@@ -4912,6 +5116,13 @@
       "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
       "dev": true
     },
+    "node_modules/pathe": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
+      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/picocolors": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
@@ -5288,6 +5499,13 @@
         "node": ">=8"
       }
     },
+    "node_modules/siginfo": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/siginfo/-/siginfo-2.0.0.tgz",
+      "integrity": "sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==",
+      "dev": true,
+      "license": "ISC"
+    },
     "node_modules/signal-exit": {
       "version": "3.0.7",
       "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
@@ -5365,6 +5583,20 @@
         "node": ">=8"
       }
     },
+    "node_modules/stackback": {
+      "version": "0.0.2",
+      "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
+      "integrity": "sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/std-env": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/std-env/-/std-env-4.0.0.tgz",
+      "integrity": "sha512-zUMPtQ/HBY3/50VbpkupYHbRroTRZJPRLvreamgErJVys0ceuzMkD44J/QjqhHjOzK42GQ3QZIeFG1OYfOtKqQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/string-length": {
       "version": "4.0.2",
       "resolved": "https://registry.npmjs.org/string-length/-/string-length-4.0.2.tgz",
@@ -5484,6 +5716,23 @@
       "integrity": "sha1-f17oI66AUgfACvLfSoTsP8+lcLQ=",
       "dev": true
     },
+    "node_modules/tinybench": {
+      "version": "2.9.0",
+      "resolved": "https://registry.npmjs.org/tinybench/-/tinybench-2.9.0.tgz",
+      "integrity": "sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/tinyexec": {
+      "version": "1.0.4",
+      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-1.0.4.tgz",
+      "integrity": "sha512-u9r3uZC0bdpGOXtlxUIdwf9pkmvhqJdrVCH9fapQtgy/OeTTMZ1nqH7agtvEfmGui6e1XxjcdrlxvxJvc3sMqw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      }
+    },
     "node_modules/tinyglobby": {
       "version": "0.2.15",
       "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.15.tgz",
@@ -5533,6 +5782,16 @@
         "url": "https://github.com/sponsors/jonschlinkert"
       }
     },
+    "node_modules/tinyrainbow": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/tinyrainbow/-/tinyrainbow-3.1.0.tgz",
+      "integrity": "sha512-Bf+ILmBgretUrdJxzXM0SgXLZ3XfiaUuOj/IKQHuTXip+05Xn+uyEYdVg0kYDipTBcLrCVyUzAPz7QmArb0mmw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.0.0"
+      }
+    },
     "node_modules/tmpl": {
       "version": "1.0.5",
       "resolved": "https://registry.npmjs.org/tmpl/-/tmpl-1.0.5.tgz",
@@ -5704,6 +5963,7 @@
       "integrity": "sha512-wt+Z2qIhfFt85uiyRt5LPU4oVEJBXj8hZNWKeqFG4gRG/0RaRGJ7njQCwzFVjO+v4+Ipmf5CY7VdmZRAYYBPHw==",
       "dev": true,
       "license": "MIT",
+      "peer": true,
       "dependencies": {
         "lightningcss": "^1.32.0",
         "picomatch": "^4.0.3",
@@ -5789,6 +6049,101 @@
         "url": "https://github.com/sponsors/jonschlinkert"
       }
     },
+    "node_modules/vitest": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/vitest/-/vitest-4.1.0.tgz",
+      "integrity": "sha512-YbDrMF9jM2Lqc++2530UourxZHmkKLxrs4+mYhEwqWS97WJ7wOYEkcr+QfRgJ3PW9wz3odRijLZjHEaRLTNbqw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@vitest/expect": "4.1.0",
+        "@vitest/mocker": "4.1.0",
+        "@vitest/pretty-format": "4.1.0",
+        "@vitest/runner": "4.1.0",
+        "@vitest/snapshot": "4.1.0",
+        "@vitest/spy": "4.1.0",
+        "@vitest/utils": "4.1.0",
+        "es-module-lexer": "^2.0.0",
+        "expect-type": "^1.3.0",
+        "magic-string": "^0.30.21",
+        "obug": "^2.1.1",
+        "pathe": "^2.0.3",
+        "picomatch": "^4.0.3",
+        "std-env": "^4.0.0-rc.1",
+        "tinybench": "^2.9.0",
+        "tinyexec": "^1.0.2",
+        "tinyglobby": "^0.2.15",
+        "tinyrainbow": "^3.0.3",
+        "vite": "^6.0.0 || ^7.0.0 || ^8.0.0-0",
+        "why-is-node-running": "^2.3.0"
+      },
+      "bin": {
+        "vitest": "vitest.mjs"
+      },
+      "engines": {
+        "node": "^20.0.0 || ^22.0.0 || >=24.0.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/vitest"
+      },
+      "peerDependencies": {
+        "@edge-runtime/vm": "*",
+        "@opentelemetry/api": "^1.9.0",
+        "@types/node": "^20.0.0 || ^22.0.0 || >=24.0.0",
+        "@vitest/browser-playwright": "4.1.0",
+        "@vitest/browser-preview": "4.1.0",
+        "@vitest/browser-webdriverio": "4.1.0",
+        "@vitest/ui": "4.1.0",
+        "happy-dom": "*",
+        "jsdom": "*",
+        "vite": "^6.0.0 || ^7.0.0 || ^8.0.0-0"
+      },
+      "peerDependenciesMeta": {
+        "@edge-runtime/vm": {
+          "optional": true
+        },
+        "@opentelemetry/api": {
+          "optional": true
+        },
+        "@types/node": {
+          "optional": true
+        },
+        "@vitest/browser-playwright": {
+          "optional": true
+        },
+        "@vitest/browser-preview": {
+          "optional": true
+        },
+        "@vitest/browser-webdriverio": {
+          "optional": true
+        },
+        "@vitest/ui": {
+          "optional": true
+        },
+        "happy-dom": {
+          "optional": true
+        },
+        "jsdom": {
+          "optional": true
+        },
+        "vite": {
+          "optional": false
+        }
+      }
+    },
+    "node_modules/vitest/node_modules/picomatch": {
+      "version": "4.0.3",
+      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
+      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/jonschlinkert"
+      }
+    },
     "node_modules/vue": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/vue/-/vue-3.5.30.tgz",
@@ -5891,6 +6246,23 @@
         "node": ">= 8"
       }
     },
+    "node_modules/why-is-node-running": {
+      "version": "2.3.0",
+      "resolved": "https://registry.npmjs.org/why-is-node-running/-/why-is-node-running-2.3.0.tgz",
+      "integrity": "sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "siginfo": "^2.0.0",
+        "stackback": "0.0.2"
+      },
+      "bin": {
+        "why-is-node-running": "cli.js"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/wrap-ansi": {
       "version": "7.0.0",
       "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
@@ -6998,6 +7370,12 @@
         "@sinonjs/commons": "^3.0.0"
       }
     },
+    "@standard-schema/spec": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
+      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
+      "dev": true
+    },
     "@tootallnate/once": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/@tootallnate/once/-/once-2.0.0.tgz",
@@ -7055,6 +7433,28 @@
         "@babel/types": "^7.20.7"
       }
     },
+    "@types/chai": {
+      "version": "5.2.3",
+      "resolved": "https://registry.npmjs.org/@types/chai/-/chai-5.2.3.tgz",
+      "integrity": "sha512-Mw558oeA9fFbv65/y4mHtXDs9bPnFMZAL/jxdPFUpOHHIXX91mcgEHbS5Lahr+pwZFR8A7GQleRWeI6cGFC2UA==",
+      "dev": true,
+      "requires": {
+        "@types/deep-eql": "*",
+        "assertion-error": "^2.0.1"
+      }
+    },
+    "@types/deep-eql": {
+      "version": "4.0.2",
+      "resolved": "https://registry.npmjs.org/@types/deep-eql/-/deep-eql-4.0.2.tgz",
+      "integrity": "sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==",
+      "dev": true
+    },
+    "@types/estree": {
+      "version": "1.0.8",
+      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.8.tgz",
+      "integrity": "sha512-dWHzHa2WqEXI/O1E9OjrocMTKJl2mSrEolh1Iomrv6U+JuNwaHXsXx9bLu5gG7BUWFIN0skIQJQ/L1rIex4X6w==",
+      "dev": true
+    },
     "@types/graceful-fs": {
       "version": "4.1.9",
       "resolved": "https://registry.npmjs.org/@types/graceful-fs/-/graceful-fs-4.1.9.tgz",
@@ -7159,6 +7559,90 @@
         "@rolldown/pluginutils": "1.0.0-rc.2"
       }
     },
+    "@vitest/expect": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/expect/-/expect-4.1.0.tgz",
+      "integrity": "sha512-EIxG7k4wlWweuCLG9Y5InKFwpMEOyrMb6ZJ1ihYu02LVj/bzUwn2VMU+13PinsjRW75XnITeFrQBMH5+dLvCDA==",
+      "dev": true,
+      "requires": {
+        "@standard-schema/spec": "^1.1.0",
+        "@types/chai": "^5.2.2",
+        "@vitest/spy": "4.1.0",
+        "@vitest/utils": "4.1.0",
+        "chai": "^6.2.2",
+        "tinyrainbow": "^3.0.3"
+      }
+    },
+    "@vitest/mocker": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/mocker/-/mocker-4.1.0.tgz",
+      "integrity": "sha512-evxREh+Hork43+Y4IOhTo+h5lGmVRyjqI739Rz4RlUPqwrkFFDF6EMvOOYjTx4E8Tl6gyCLRL8Mu7Ry12a13Tw==",
+      "dev": true,
+      "requires": {
+        "@vitest/spy": "4.1.0",
+        "estree-walker": "^3.0.3",
+        "magic-string": "^0.30.21"
+      },
+      "dependencies": {
+        "estree-walker": {
+          "version": "3.0.3",
+          "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
+          "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
+          "dev": true,
+          "requires": {
+            "@types/estree": "^1.0.0"
+          }
+        }
+      }
+    },
+    "@vitest/pretty-format": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/pretty-format/-/pretty-format-4.1.0.tgz",
+      "integrity": "sha512-3RZLZlh88Ib0J7NQTRATfc/3ZPOnSUn2uDBUoGNn5T36+bALixmzphN26OUD3LRXWkJu4H0s5vvUeqBiw+kS0A==",
+      "dev": true,
+      "requires": {
+        "tinyrainbow": "^3.0.3"
+      }
+    },
+    "@vitest/runner": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/runner/-/runner-4.1.0.tgz",
+      "integrity": "sha512-Duvx2OzQ7d6OjchL+trw+aSrb9idh7pnNfxrklo14p3zmNL4qPCDeIJAK+eBKYjkIwG96Bc6vYuxhqDXQOWpoQ==",
+      "dev": true,
+      "requires": {
+        "@vitest/utils": "4.1.0",
+        "pathe": "^2.0.3"
+      }
+    },
+    "@vitest/snapshot": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/snapshot/-/snapshot-4.1.0.tgz",
+      "integrity": "sha512-0Vy9euT1kgsnj1CHttwi9i9o+4rRLEaPRSOJ5gyv579GJkNpgJK+B4HSv/rAWixx2wdAFci1X4CEPjiu2bXIMg==",
+      "dev": true,
+      "requires": {
+        "@vitest/pretty-format": "4.1.0",
+        "@vitest/utils": "4.1.0",
+        "magic-string": "^0.30.21",
+        "pathe": "^2.0.3"
+      }
+    },
+    "@vitest/spy": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/spy/-/spy-4.1.0.tgz",
+      "integrity": "sha512-pz77k+PgNpyMDv2FV6qmk5ZVau6c3R8HC8v342T2xlFxQKTrSeYw9waIJG8KgV9fFwAtTu4ceRzMivPTH6wSxw==",
+      "dev": true
+    },
+    "@vitest/utils": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/@vitest/utils/-/utils-4.1.0.tgz",
+      "integrity": "sha512-XfPXT6a8TZY3dcGY8EdwsBulFCIw+BeeX0RZn2x/BtiY/75YGh8FeWGG8QISN/WhaqSrE2OrlDgtF8q5uhOTmw==",
+      "dev": true,
+      "requires": {
+        "@vitest/pretty-format": "4.1.0",
+        "convert-source-map": "^2.0.0",
+        "tinyrainbow": "^3.0.3"
+      }
+    },
     "@vue/compiler-core": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.5.30.tgz",
@@ -7372,6 +7856,12 @@
         "sprintf-js": "~1.0.2"
       }
     },
+    "assertion-error": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
+      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
+      "dev": true
+    },
     "asynckit": {
       "version": "0.4.0",
       "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
@@ -7544,6 +8034,12 @@
       "integrity": "sha512-LRAQHZ4yT1+f9LemSMeqdMpMxZcc4RMWdj4tiFe3G8tNkWK+E58g+/tzotb5cU6TbcVJLr4fySiAW7XmxQvZQA==",
       "dev": true
     },
+    "chai": {
+      "version": "6.2.2",
+      "resolved": "https://registry.npmjs.org/chai/-/chai-6.2.2.tgz",
+      "integrity": "sha512-NUPRluOfOiTKBKvWPtSD4PhFvWCqOi0BGStNWs57X9js7XGTprSmFoz5F0tWhR4WPjNeR9jXqdC7/UpSJTnlRg==",
+      "dev": true
+    },
     "chalk": {
       "version": "4.1.2",
       "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
@@ -7840,6 +8336,12 @@
       "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
       "dev": true
     },
+    "es-module-lexer": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-2.0.0.tgz",
+      "integrity": "sha512-5POEcUuZybH7IdmGsD8wlf0AI55wMecM9rVBTI/qEAy2c1kTOm3DjFYjrBdI2K3BaJjJYfYFeRtM0t9ssnRuxw==",
+      "dev": true
+    },
     "es-object-atoms": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
@@ -8082,6 +8584,12 @@
         "jest-util": "^29.7.0"
       }
     },
+    "expect-type": {
+      "version": "1.3.0",
+      "resolved": "https://registry.npmjs.org/expect-type/-/expect-type-1.3.0.tgz",
+      "integrity": "sha512-knvyeauYhqjOYvQ66MznSMs83wmHrCycNEN6Ao+2AeYEfxUIkuiVxdEa1qlGEPK+We3n0THiDciYSsCcgW/DoA==",
+      "dev": true
+    },
     "fast-deep-equal": {
       "version": "3.1.3",
       "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
@@ -9433,6 +9941,12 @@
       "integrity": "sha512-qXDmcVlZV4XRtKFzddidpfVP4oMSGhga+xdMc25mv8kaLUHtgzCDhUxkrN8exkGdTlLNaXj7CV3GtON7zuGZ+w==",
       "dev": true
     },
+    "obug": {
+      "version": "2.1.1",
+      "resolved": "https://registry.npmjs.org/obug/-/obug-2.1.1.tgz",
+      "integrity": "sha512-uTqF9MuPraAQ+IsnPf366RG4cP9RtUi7MLO1N3KEc+wb0a6yKpeL0lmk2IB1jY5KHPAlTc6T/JRdC/YqxHNwkQ==",
+      "dev": true
+    },
     "once": {
       "version": "1.4.0",
       "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
@@ -9554,6 +10068,12 @@
       "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
       "dev": true
     },
+    "pathe": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
+      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
+      "dev": true
+    },
     "picocolors": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
@@ -9800,6 +10320,12 @@
       "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
       "dev": true
     },
+    "siginfo": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/siginfo/-/siginfo-2.0.0.tgz",
+      "integrity": "sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==",
+      "dev": true
+    },
     "signal-exit": {
       "version": "3.0.7",
       "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
@@ -9863,6 +10389,18 @@
         }
       }
     },
+    "stackback": {
+      "version": "0.0.2",
+      "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
+      "integrity": "sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==",
+      "dev": true
+    },
+    "std-env": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/std-env/-/std-env-4.0.0.tgz",
+      "integrity": "sha512-zUMPtQ/HBY3/50VbpkupYHbRroTRZJPRLvreamgErJVys0ceuzMkD44J/QjqhHjOzK42GQ3QZIeFG1OYfOtKqQ==",
+      "dev": true
+    },
     "string-length": {
       "version": "4.0.2",
       "resolved": "https://registry.npmjs.org/string-length/-/string-length-4.0.2.tgz",
@@ -9949,6 +10487,18 @@
       "integrity": "sha1-f17oI66AUgfACvLfSoTsP8+lcLQ=",
       "dev": true
     },
+    "tinybench": {
+      "version": "2.9.0",
+      "resolved": "https://registry.npmjs.org/tinybench/-/tinybench-2.9.0.tgz",
+      "integrity": "sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==",
+      "dev": true
+    },
+    "tinyexec": {
+      "version": "1.0.4",
+      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-1.0.4.tgz",
+      "integrity": "sha512-u9r3uZC0bdpGOXtlxUIdwf9pkmvhqJdrVCH9fapQtgy/OeTTMZ1nqH7agtvEfmGui6e1XxjcdrlxvxJvc3sMqw==",
+      "dev": true
+    },
     "tinyglobby": {
       "version": "0.2.15",
       "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.15.tgz",
@@ -9975,6 +10525,12 @@
         }
       }
     },
+    "tinyrainbow": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/tinyrainbow/-/tinyrainbow-3.1.0.tgz",
+      "integrity": "sha512-Bf+ILmBgretUrdJxzXM0SgXLZ3XfiaUuOj/IKQHuTXip+05Xn+uyEYdVg0kYDipTBcLrCVyUzAPz7QmArb0mmw==",
+      "dev": true
+    },
     "tmpl": {
       "version": "1.0.5",
       "resolved": "https://registry.npmjs.org/tmpl/-/tmpl-1.0.5.tgz",
@@ -10096,6 +10652,7 @@
       "resolved": "https://registry.npmjs.org/vite/-/vite-8.0.1.tgz",
       "integrity": "sha512-wt+Z2qIhfFt85uiyRt5LPU4oVEJBXj8hZNWKeqFG4gRG/0RaRGJ7njQCwzFVjO+v4+Ipmf5CY7VdmZRAYYBPHw==",
       "dev": true,
+      "peer": true,
       "requires": {
         "fsevents": "~2.3.3",
         "lightningcss": "^1.32.0",
@@ -10113,6 +10670,42 @@
         }
       }
     },
+    "vitest": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/vitest/-/vitest-4.1.0.tgz",
+      "integrity": "sha512-YbDrMF9jM2Lqc++2530UourxZHmkKLxrs4+mYhEwqWS97WJ7wOYEkcr+QfRgJ3PW9wz3odRijLZjHEaRLTNbqw==",
+      "dev": true,
+      "requires": {
+        "@vitest/expect": "4.1.0",
+        "@vitest/mocker": "4.1.0",
+        "@vitest/pretty-format": "4.1.0",
+        "@vitest/runner": "4.1.0",
+        "@vitest/snapshot": "4.1.0",
+        "@vitest/spy": "4.1.0",
+        "@vitest/utils": "4.1.0",
+        "es-module-lexer": "^2.0.0",
+        "expect-type": "^1.3.0",
+        "magic-string": "^0.30.21",
+        "obug": "^2.1.1",
+        "pathe": "^2.0.3",
+        "picomatch": "^4.0.3",
+        "std-env": "^4.0.0-rc.1",
+        "tinybench": "^2.9.0",
+        "tinyexec": "^1.0.2",
+        "tinyglobby": "^0.2.15",
+        "tinyrainbow": "^3.0.3",
+        "vite": "^6.0.0 || ^7.0.0 || ^8.0.0-0",
+        "why-is-node-running": "^2.3.0"
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
     "vue": {
       "version": "3.5.30",
       "resolved": "https://registry.npmjs.org/vue/-/vue-3.5.30.tgz",
@@ -10185,6 +10778,16 @@
         "isexe": "^2.0.0"
       }
     },
+    "why-is-node-running": {
+      "version": "2.3.0",
+      "resolved": "https://registry.npmjs.org/why-is-node-running/-/why-is-node-running-2.3.0.tgz",
+      "integrity": "sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==",
+      "dev": true,
+      "requires": {
+        "siginfo": "^2.0.0",
+        "stackback": "0.0.2"
+      }
+    },
     "wrap-ansi": {
       "version": "7.0.0",
       "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
diff --git a/package.json b/package.json
index b34ed580..31ddd59a 100644
--- a/package.json
+++ b/package.json
@@ -6,6 +6,8 @@
   "scripts": {
     "test": "jest && eslint ./Sources/",
     "test:only": "jest",
+    "test:vitest": "vitest run",
+    "test:vitest:watch": "vitest",
     "build": "node scripts/build.mjs",
     "build:minify": "node scripts/build.mjs --minify",
     "deploy": "node scripts/build.mjs --minify --deploy",
@@ -33,6 +35,7 @@
     "eslint": "^8.57.0",
     "jest": "^29.7.0",
     "jest-environment-jsdom": "^29.7.0",
-    "vite": "^8.0.1"
+    "vite": "^8.0.1",
+    "vitest": "^4.1.0"
   }
 }
diff --git a/vite.config.js b/vite.config.js
index 3588963f..73e44915 100644
--- a/vite.config.js
+++ b/vite.config.js
@@ -4,6 +4,19 @@ import { defineConfig } from 'vite';
 export default defineConfig({
     root: 'Sources',
     // plugins: [vue()], // Enable in Section 06
+    test: {
+        globals: true,
+        environment: 'jsdom',
+        setupFiles: ['./vitest.setup.js'],
+        root: './',
+        include: ['Tests/**/*.test.js'],
+        pool: 'threads',
+        poolOptions: {
+            threads: {
+                singleThread: true,
+            },
+        },
+    },
     build: {
         outDir: '../dist',
         emptyOutDir: true,
diff --git a/vitest.setup.js b/vitest.setup.js
new file mode 100644
index 00000000..eeb4b8ad
--- /dev/null
+++ b/vitest.setup.js
@@ -0,0 +1,10 @@
+// Vitest setup file (replaces jest.setup.js for Vitest)
+//
+// The original jest.setup.js provided polyfills for:
+//   - globalThis.performance (from 'perf_hooks')
+//   - globalThis.TextEncoder (from 'util')
+//   - globalThis.TextDecoder (from 'util')
+//
+// In Vitest with jsdom environment on Node 22+, all three are
+// already globally available, so no polyfills are needed.
+// This file is kept as a placeholder for any future setup needs.
