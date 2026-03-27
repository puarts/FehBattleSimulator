# Phase 5: SkillEffect DSLモジュール群のESM import完全化

## 概要

SkillEffect DSLモジュール群の暗黙依存を解消し、`vitest.setup.js`の連結方式を廃止して全テストファイルがESM importのみで動作する状態を実現する。

<!-- PROJECT_CONFIG
runtime: node
test_command: npm run test:only
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-investigation
section-02-merge-unit
section-03-merge-field
section-04-post-merge-verify
section-05-unexported-symbols
section-06-battlecontext-imports
section-07-hooks-registrar-imports
section-08-aliases-imports
section-09-skillimpl-imports
section-10-remaining-imports
section-11-test-esm
END_MANIFEST -->
