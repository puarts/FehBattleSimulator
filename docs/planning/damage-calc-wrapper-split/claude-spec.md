# DamageCalculatorWrapper.js 分割リファクタリング — 統合仕様

## 1. 背景と目的

`Sources/combat/DamageCalculatorWrapper.js` は 17,141行・約170メソッドの巨大クラスで、FEH Battle Simulatorの戦闘計算ロジックのほぼすべてを集約している。可読性・保守性の向上のため、責務ごとにファイルを分割する。

前回の `large-file-split` リファクタリングで PerformanceProfile（28行）と ScopedTileChanger（26行）を独立クラスとして抽出済み。今回は DamageCalculatorWrapper クラス本体のメソッド群を責務ごとに分離する。

## 2. 目標

- DamageCalculatorWrapper.js をコア + 5分割ファイルに分割（原則5,000行以下、単一巨大メソッドのみ例外可）
- **ロジック変更なし**（物理分割のみ。メソッドのリネームも行わない）
- 既存テスト全パスを維持
- ブラウザ・テスト（create_tests.sh）・Deploy.bat の3系統のロード順序を正しく更新

## 3. 対象ファイルの構造

### 3.1 メソッド構成

| カテゴリ | メソッド数 | 備考 |
|---------|----------|------|
| Public メソッド | 36 | 戦闘計算入口、事前計算、追撃判定、反撃判定、ユニット列挙、紋章管理等 |
| Private メソッド | 126+ | スキル効果辞書の初期化、戦闘前処理、護い手ロジック、ユーティリティ等 |
| Static メソッド | 12+ | ユーティリティ関数 |

### 3.2 `this` 参照

- 1,274箇所（うち30.8%がプライベートメソッド呼び出し）
- 内部結合度が非常に高い

### 3.3 辞書ベースのディスパッチ（Lines 1564-9400）

- ~6,800行が関数辞書のポピュレーションに費やされている
- `let self = this` でクロージャを捕捉するパターン
- 新スキル追加時に最も頻繁に編集される領域

### 3.4 `#` プライベートフィールド

以下の3メソッドが `#` 構文を使用しており、クラス定義内（コアファイル）に残す必要がある:
- `#initBattleContext`
- `#applySkillEffectsBeforePrecombatSpecial`
- `#calcFixedAddDamageForSkill`

## 4. 分割方式

### 4.1 基本方針: `definePrototypeMethods` ヘルパーによる Prototype 拡張

コアファイルのクラス定義直後に `definePrototypeMethods` 静的メソッドを定義し、各分割ファイルから non-enumerable でメソッドを追加する。

- メソッド本体の変更ゼロ → 回帰リスク最小
- `this` コンテキストは自動的にインスタンスを参照（特別な処理不要）
- 重複定義時に即座に Error をスロー → 転記ミスを検出
- class body 内と同じ non-enumerable → VM レベルで挙動同一

### 4.2 技術的注意点

- クラス定義ファイルがprototype拡張ファイルより先にロードされる必要あり（固定順序）
- `super` は使用不可（DamageCalculatorWrapperは継承していないので問題なし）
- `let self = this` クロージャは prototype メソッドとして呼ばれた時点で正しくバインドされる
- コードベース内にprototype拡張の前例はないが、技術的に安全
- 各分割ファイル冒頭にロード前提チェック（ガード）を追加

## 5. 分割計画

### 5.1 ファイル構成

コア + 5分割ファイル（命名規則: `DamageCalculatorWrapper_責務名.js`）

**コア残置の原則**: 入口メソッド、オーケストレーション、3つ以上の責務グループから横断的に呼ばれる共有ユーティリティ、`#` private メソッドをコアに残す。

| # | ファイル | 推定行数 | 内容 |
|---|--------|---------|------|
| 0 | `DamageCalculatorWrapper.js`（コア） | ~2,500 | クラス定義、コンストラクタ、public API入口、calcCombatResult、横断ユーティリティ、# private メソッド |
| 1a | `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` | ~1,000 | Atk/Def/Special辞書初期化 |
| 1b | `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` | ~6,900 | Unit辞書初期化（単一巨大メソッド、5,000行超の例外） |
| 2 | `DamageCalculatorWrapper_ApplySkillEffects.js` | ~3,000 | スキル効果適用本体 |
| 3 | `DamageCalculatorWrapper_Spur.js` | ~2,500 | Spur更新・適用・ヘルパー |
| 4 | `DamageCalculatorWrapper_FollowupAndCounter.js` | ~1,500 | 追撃/反撃判定、ダメージ軽減 |

### 5.2 分割優先順位

1. **最優先**: 辞書初期化（6,800行、新スキル追加時の編集頻度最高）
2. **次点**: Spur系（処理が分散しており集約の価値大）
3. 追撃・反撃判定
4. スキル効果適用

## 6. ロード順序の更新

3系統すべてで、DamageCalculatorWrapper.js の直後に分割ファイルを**固定順序**で追加:

```
combat/DamageCalculatorWrapper                            ← コア
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef  ← NEW
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit    ← NEW
combat/DamageCalculatorWrapper_ApplySkillEffects           ← NEW
combat/DamageCalculatorWrapper_Spur                        ← NEW
combat/DamageCalculatorWrapper_FollowupAndCounter           ← NEW
combat/BeginningOfTurnSkillHandler
```

更新対象は検索ベースで確定する（`grep -r "DamageCalculatorWrapper"` で全参照箇所を棚卸し）。

## 7. 制約

- **後方互換**: 外部から参照されるpublicメソッドのシグネチャは変更しない
- **ロジック変更なし**: メソッドのリネーム、シグネチャ変更、コード変更は行わない
- **`#` private はコアに残す**: JavaScript の `#` private フィールドはクラス定義外からアクセス不可
- **パース時依存**: JavaScriptのクラス定義はhoistされないため、ロード順序に注意
- **前回の分割との整合**: PerformanceProfile, ScopedTileChanger は既に分離済み
- **テスト**: `./run_tests.sh` で全テスト + ESLint パス

## 8. 成果物

- 分割後の新規ファイル群（`Sources/combat/` 配下、5ファイル）
- 縮小された DamageCalculatorWrapper.js（コア、~2,500行）
- ロード順序の更新（3系統）
- 検証テスト（DamageCalculatorWrapperSplit.test.js）
