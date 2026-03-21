Now I have all the context needed. Let me produce the section content.

# Section 2: Logger.js の遅延初期化（Lazy Getter パターン）

## 概要

`Logger.js` の static フィールド初期化子 `LOG_LEVEL_MAP` が、モジュール評価時に `ObjectUtil.makeMapFromObj()` を即時呼び出している。これが循環 import 時に TDZ（Temporal Dead Zone）エラーを引き起こす根本原因である。この初期化を lazy getter パターンに変更し、Logger 関連の循環依存パスを解消する。

## 背景

### 現在の循環パス

```
Logger.js → Utilities.js → Unit.js → Skill.js → SkillEffect.js → SkillEffectCore.js → Logger.js
```

**注意**: 現時点では `Utilities.js` 自体は import 文を持っていない（不足 import が未追加の状態）。しかし Phase 4 のセクション 8 で 741 件の不足 import を追加する際、`Utilities.js` が上位レイヤーのモジュールを import するようになると上記の循環パスが顕在化する。この問題を先行して解消しておく。

### 問題のコード（`Sources/Logger.js` 23行目）

```javascript
static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LogLevel);
```

この行はクラス定義の評価時（モジュールロード時）に即座に実行される。循環 import の状況では `ObjectUtil` が TDZ にあるため `ReferenceError` が発生する。

### `ObjectUtil.makeMapFromObj` の実装（`Sources/Utilities.js` 29-31行目）

```javascript
static makeMapFromObj(object) {
    return new Map(Object.entries(object).map(([text, value]) => [value, text]));
}
```

value をキー、text（プロパティ名）を値にした Map を返す単純な変換関数である。

## 依存関係

- **前提**: セクション 1（tooling-baseline）が完了していること。madge が利用可能であること。
- **後続**: セクション 6（remaining-cycles）がこのセクションの完了に依存する。

## テスト（先に作成）

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/LoggerLazyInit.test.js`

以下の 4 つのテストケースを作成する。

### テスト 1: LOG_LEVEL_MAP が正しい Map を返す

`LoggerBase.LOG_LEVEL_MAP` にアクセスしたとき、`LogLevel` の全エントリが value→name の Map として返されることを検証する。具体的には `MAP.get(1)` が `'OFF'`、`MAP.get(13)` が `'ALL'` など、キーと値のマッピングが従来と一致することを確認する。

### テスト 2: 複数回アクセスでキャッシュが効く

`LoggerBase.LOG_LEVEL_MAP` に 2 回アクセスし、返される Map インスタンスが同一（`===`）であることを検証する。lazy getter が初回のみ Map を生成し、以後はキャッシュされたインスタンスを返すことの確認。

### テスト 3: ログ出力メソッドが正常動作する

`SimpleLogger` インスタンスを生成し、`isLogEnabled = true`、`logLevel = LoggerBase.LogLevel.ALL` に設定した上で `writeLog('test')` を呼び出し、`.log` プロパティに `'test'` が含まれることを検証する。遅延初期化変更がログ出力の動作を壊していないことの回帰テスト。

### テスト 4: madge で Logger 関連の循環パスが消えている

`madge --circular Sources/` を実行し、出力に `Logger.js` を含むパスが存在しないことを検証する。このテストは CI 環境での自動検証としても機能する。ただし、madge の実行が重い場合はスキップ可能なマーカーを付与する。

## 実装手順

### 修正対象ファイル

`/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Logger.js`

### 手順 1: import 文の削除

ファイル 1 行目の以下の import を削除する。

```javascript
import { ObjectUtil } from './Utilities.js';
```

`ObjectUtil.makeMapFromObj` の実装は単純であり（`new Map(Object.entries(object).map(([text, value]) => [value, text]))`）、Logger.js 内にインライン化することで `Utilities.js` への依存を完全に除去する。

### 手順 2: static フィールドを lazy getter に変更

`LoggerBase` クラスの 23 行目を削除し、以下の lazy getter パターンに置き換える。

変更前:
```javascript
static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LogLevel);
```

変更後: static getter を定義し、初回アクセス時に Map を生成してプロパティに直接キャッシュする。2 回目以降のアクセスでは getter が呼ばれず、キャッシュされた値が直接返される。

パターンとしては、getter 内で `Object.defineProperty(this, 'LOG_LEVEL_MAP', { value: map, ... })` を使ってプロパティをオーバーライドする手法を用いる。これにより getter のオーバーヘッドが初回のみとなる。

Map の生成ロジックは `ObjectUtil.makeMapFromObj` と同等の処理をインラインで記述する:
```javascript
new Map(Object.entries(this.LogLevel).map(([text, value]) => [value, text]))
```

### 手順 3: 他に ObjectUtil への依存がないか確認

`Logger.js` 内で `ObjectUtil` を参照している箇所が 23 行目以外にないことを確認する。現在の実装では 1 行目の import と 23 行目の使用のみであるため、これで `Utilities.js` への依存が完全に除去される。

### 手順 4: テスト実行と循環依存チェック

1. `npm run test:only` で既存テスト 500 件が全パスすることを確認する
2. `npx madge --circular Sources/` で Logger 関連の循環パスが消えていることを確認する

## 成功条件（実績）

- ✅ `Logger.js` が `Utilities.js` を import していない（import文を完全削除）
- ✅ `LoggerBase.LOG_LEVEL_MAP` が従来と同じ Map を返す（テスト確認済み）
- ✅ `LoggerBase.LOG_LEVEL_MAP` への複数アクセスが同一インスタンスを返す（テスト確認済み）
- ✅ `SimpleLogger` のログメソッドが正常に動作する（テスト確認済み）
- ✅ 既存テスト 503/504 パス（1件は既存のタイムアウト）
- ⚠️ madgeでは循環未検出（import未追加のため）

## 計画からの差異

- コードレビューにより `Object.defineProperty(this, ...)` の `this` を `LoggerBase` にハードコード（サブクラスからのアクセス時の安全性向上）
- テストファイル: `Tests/LoggerLazyInit.test.js`（4テスト）

## 注意事項

- `Utilities.js` のゲーム固有部分の分離（`GameUtilities.js` の作成）はセクション 6 のスコープである。このセクションでは Logger.js 側の変更のみを行う。
- `ConsoleLogger` クラスの `BLACK_BG_STYLES` / `WHITE_BG_STYLES` は `LoggerBase.LogLevel` を参照しているが、これらは static フィールドの通常の初期化であり、同一ファイル内の値を参照しているだけなので TDZ 問題は発生しない。変更不要。