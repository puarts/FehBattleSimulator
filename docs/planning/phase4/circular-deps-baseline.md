# 循環依存ベースライン

## 取得日
2026-03-21

## コマンド
```
npx madge --circular Sources/
```

## 結果
```
Processed 67 files (1.7s)
✔ No circular dependency found!
```

## 分析

madge は **現在のimport文** に基づいて依存グラフを構築する。Phase 2 で追加されたimport文は不完全であり（741件の不足importが存在）、本来存在する循環パスが検出されていない。

### 既知の循環パス（import追加後に顕在化する予定）

```
Logger.js -> Utilities.js -> Unit.js -> Skill.js -> SkillEffect.js -> SkillEffectCore.js -> Logger.js
```

### 既知の双方向参照（6組）

| File A | File B |
|--------|--------|
| Skill.js | SkillEffect.js |
| Skill.js | Unit.js |
| Unit.js | SkillEffect.js |
| Unit.js | SkillEffectHooks.js |
| SkillEffect.js | SkillEffectBattleContext.js |
| SkillEffectCore.js | CustomSkill.js |

これらの循環は、セクション2-6でimportを正しく追加する前に構造的に解消する。

## テストベースライン

- テスト総数: 500
- パス: 499（回帰テストのターゲット）
- 失敗: 1（DamageCalculator_HeroBattleTest — タイムアウト5秒超過。既存のflaky test、Phase 4の変更とは無関係）
- ESLint: パス

## 不足import検出ツール

`scripts/detect-missing-imports.js` を導入。現在の検出結果: 2081件 / 39ファイル（SkillImpl群を含む）。セクション8で使用する。
