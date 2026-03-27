# Usage Guide — Phase 5: 連結方式廃止とESM完全移行

## Quick Start

Phase 5 の実装により、テスト基盤が `vm.runInThisContext` 連結実行方式から完全なESM importに移行されました。

### テスト実行

```bash
# 全テスト実行
npm run test:only

# 個別テスト実行（ESM importで直接動作）
npx vitest run Tests/DamageCalculator.test.js
npx vitest run Tests/SkillEffect.test.js

# ウォッチモード
npm run test:watch
```

### 変更点の要約

| Before (連結方式) | After (ESM) |
|---|---|
| `vitest.setup.js` が45ファイルを `vm.runInThisContext` で連結 | 各テストが ESM `import` で直接依存解決 |
| `filterImportExport()` で import/export 文をストリップ | 不要（ESM native） |
| グローバルスコープに全シンボル展開 | 明示的な named import |
| 暗黙依存が隠蔽される | import 不足は即 ReferenceError |

## 新しいテストファイルの作成方法

```javascript
// Tests/NewFeature.test.js
import { describe, test, expect } from 'vitest';
import { SomeClass } from '../Sources/SomeModule.js';
import { g_testHeroDatabase } from './TestGlobals.js';
import { test_DamageCalculator } from './TestUtilities.js';

describe('NewFeature', () => {
    test('should work', () => {
        // テストコード
    });
});
```

- `vitest.setup.js` は不要（削除済み）
- `Tests/TestGlobals.js` から共通テスト基盤を import
- `Tests/TestUtilities.js` からテストユーティリティを import

## 退避ファイル

`Tests/legacy/filterImportExport.js` — 連結方式で使用していたフィルタ関数。将来の参照用に保存。本番コードからは使用されていない。

## 検証済みテスト結果

- 54 テストファイル / 650 テスト 全パス
- HeroBattleTest: 1391 回の全英雄戦闘テスト パス
- 循環依存なし
- `WARN: Non-TDZ ReferenceError` 警告なし
