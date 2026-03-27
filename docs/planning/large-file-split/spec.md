# 巨大ファイル分割リファクタリング — Spec

## 背景

ESM移行計画の一環として、巨大ファイルを責務ごとに分割する。
Section 05（ディレクトリ再編）、Section 06（BattleSimulatorBaseの一部分離）が完了済みで、
本作業はその続きとなるsection-07相当の作業を発展させたもの。

現在のブランチ: `refactor/large-file-splits`（section-05/06完了後の状態）

## 目的

1. **機能ドメイン別の責務分離** — 各ファイルが単一の責務を持つようにする
2. **将来のESM移行を妨げない粒度に整理する** — import/export導入時にそのまま使える単位にしておく
3. **保守性の向上** — 巨大ファイルを管理可能なサイズに縮小する

## 対象スコープ

### Phase A: DamageCalculatorWrapper.js の独立クラス抽出

場所: `Sources/combat/DamageCalculatorWrapper.js`（17,193行）

含まれるクラス・責務:
- `PerformanceProfile` — 汎用プロファイリングユーティリティ（ダメージ計算と無関係）
- `ScopedTileChanger` — タイル操作のスコープ管理ユーティリティ
- `DamageCalculatorWrapper` — 巨大クラス本体（スキル効果適用ロジック群）
  - staticメソッド群（`__applyIdealEffect`, `__applyBonusDoubler`, `canActivateBreakerSkill`等）
  - インスタンスメソッド群（`this`に密結合、分割困難）

**抽出方針**: `PerformanceProfile`・`ScopedTileChanger`の独立クラス抽出のみ行う。staticメソッド群は全て内部呼び出しのみで外部再利用性がなく、分離メリットが薄いため対象外とする。インスタンスメソッド群は`this`に密結合しており、無理な分割は行わない。

既存のsection-07計画書あり: `docs/planning/esm-migration/sections/section-07-large-file-splits.md`（Step 1-3が該当）

### Phase B: Unit.js のトップレベル関数・補助クラス抽出

場所: `Sources/unit/Unit.js`（7,424行）

抽出候補:
- `AttackableUnitInfo` — 攻撃可能ユニット情報クラス
- `AttackEvaluationContext` — 攻撃優先度評価コンテキストクラス
- `AssistableUnitInfo` — アシスト対象評価コンテキストクラス
- `ActionContext` — AI意思決定コンテキストクラス
- `PrecombatContext` — 戦闘前コンテキスト（BattleContext.jsへ再配置）
- Unit.js末尾のユーティリティ関数群（`calcBuffAmount`, `calcHealAmount`, `isDebufferTier1/2`, `isAfflictor`, `canRefreshTo`, `UnitUtil`）

極小トップレベル関数（`isThief`, `calcArenaBaseStatusScore`等）はUnit.jsに残す。

**抽出方針**: トップレベル関数・独立クラス・純ユーティリティの抽出に限定する。Unitクラス本体の大規模な再分割は行わない。

## 対象外

### BattleSimulatorBase.js
Section 06でStep 1（MapOperations/SettingsPersistence抽出）のみ実施し、意図的に止めた経緯がある。高リスク領域であり、本specに混ぜるとスコープが肥大化するため除外する。追加の抽出が必要な場合は別specとして計画する。

### SkillEffect.js
Section-07元計画ではSkillEffect.js（9,632行）のMixin・クエリノード分離を含んでいたが、本specでは除外する。理由:
- SkillEffect.js は既に `SkillEffectCore.js`, `SkillEffectEnv.js`, `SkillEffectField.js`, `SkillEffectUnit.js`, `SkillEffectBattleContext.js`, `SkillEffectHooks.js`, `SkillEffectRegistrar.js`, `SkillEffectAliases.js` に一部分割済み
- Unit.js は未着手の新規対象であり、DamageCalculatorWrapperと合わせて先に整理する方が実務上の優先度が高い
- SkillEffect.js の分割は必要に応じて後続specで計画する

### SkillImpl系ファイル
日付ベース分割方式を維持するため対象外。

## 制約

- **後方互換性を維持** — 既存のセーブデータ・URLパラメータを壊さない
- **グローバルスコープ前提** — 現時点ではESM（import/export）は導入しない。ファイル分割のみ行う
- **テスト結合方式** — `create_tests.sh`でファイルを結合してJest実行する方式を維持。新規ファイルは`SOURCE_FILE_NAMES`に追加が必要
- **Deploy.bat** — 本番用結合JSの結合リストも更新が必要
- **HTMLファイルのloadScripts** — 抽出したファイルがブラウザで直接読み込まれる場合は、loadScripts配列も更新する
- **ロード順序** — グローバルスコープのため、依存先が先にロードされる順序を守る
- **無理に分割しない** — `this`に密結合なインスタンスメソッド群は無理に外部に出さない。クラス本体の大規模再分割は行わない

## 既存の計画書

section-07の計画書（`docs/planning/esm-migration/sections/section-07-large-file-splits.md`）が
DamageCalculatorWrapperとSkillEffect.jsの分割をカバーしている。
本specではDamageCalculatorWrapperのStep 1-3を参考にしつつ、Unit.jsを新たに加えた構成とする。

## 成功基準

- **回帰なし** — 全テスト（`./run_tests.sh`）がパス、ESLintエラーなし
- **責務境界が明確** — 抽出された各ファイルが単一の責務・関心事を持つ
- **ロード順序維持** — グローバルスコープでの依存関係が正しく保たれる
- **ブラウザ動作確認** — Phase Aは `DamageCalculator.html`・`ArenaSimulator.html`、Phase Bは必要に応じて `UnitBuilder.html` も確認
- **git bisect可能** — 各抽出を独立したコミットとし、問題発生時に特定可能にする
