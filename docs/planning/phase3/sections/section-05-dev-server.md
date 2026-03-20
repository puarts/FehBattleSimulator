Now I have enough context. Let me generate the section content.

# Section 05: Vite Dev Server 化

## 概要

Vite の開発サーバーを設定し、ローカル開発体験を改善する。現在の HTML には `loadScripts` / `createScriptElement` による動的スクリプト読み込みロジックがあり、ローカルかどうかを `typeof weaponInfos == 'undefined'` で判定している。これを Vite dev server + `import.meta.env` ベースの環境判定に置き換える。

## 前提条件（依存セクション）

- **section-02-vite-build** が完了していること: `vite.config.js` が存在し、`vite build` が動作し、8つの HTML が `<script type="module" src="./XxxMain.js">` でエントリポイントを読み込む状態であること。`root: 'Sources'` 設定済み。

## 現在の動作

### ローカル開発のデータ読み込みパターン

全8つのシミュレーター HTML に同じパターンが存在する。

```javascript
const isLocal = typeof weaponInfos == 'undefined';
if (isLocal) {
    additionalScripts = [
        "GlobalDefinitions_Debug.js",
        "Cell.js",
        // ... 30+ ファイル
        ...SKILL_EFFECT_FILES,
        ...SKILL_IMPL_FILES,
    ];
}
loadScripts(additionalScripts, () => {
    g_app.registerSkillOptions(weaponInfos, supportInfos, ...);
    g_app.registerHeroOptions(heroInfos, false);
    if (isLocal) {
        loadLazyImages();
    }
    // ...
});
```

- **ローカル**: `weaponInfos` 等のグローバル変数が未定義 → `Local.js` のファイルリストを使って全 JS ファイルを逐次読み込み（`createScriptElement` で import/export 行をフィルタ除去しながら）
- **本番**: 外部 CDN/サーバーから `weaponInfos`, `heroInfos` 等のデータが `<script>` タグで事前に読み込まれている。コードは `build.mjs` で結合済みの単一ファイル

### 関連ファイル

| ファイル | 役割 |
|---------|------|
| `Sources/Local.js` | `SKILL_EFFECT_FILES`, `SKILL_IMPL_FILES` のファイルリスト定義 |
| `Sources/*.html` (8ファイル) | `createScriptElement`, `loadScripts` 関数と isLocal 判定ロジック |
| `Sources/*Main.js` (8ファイル) | 各シミュレーターのエントリポイント |

8つの HTML ファイル:
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalculator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconLister.html`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClusterer.html`

8つのエントリポイント:
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilderMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalcMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculatorMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconListerMain.js`
- `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClustererMain.js`

## テスト計画

テストは手動確認とスクリプトベースの静的チェックの組み合わせで実施する。

### C.1 環境変数テスト

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DevServerEnv.test.js`

```javascript
// Test: .env.development ファイルが存在し、必要な環境変数キーを定義していること
// Test: .env.production ファイルが存在し、必要な環境変数キーを定義していること
// Test: データ読み込みロジックが import.meta.env.MODE に基づいて分岐すること（コード構造の検証）
// Test: 本番ビルド出力にローカル開発専用コードが含まれないこと（vite build 後の dist を検査）
```

具体的な検証項目:
- `import.meta.env.MODE === 'development'` が `vite` (dev server) 実行時に `true` を返すこと
- `.env.development` の環境変数が `import.meta.env.VITE_*` プレフィックスで参照可能であること
- 本番ビルドにローカル開発用のモックデータパスが含まれないこと

### C.2 HTML 整理テスト

ファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/DevServerHtml.test.js`

```javascript
// Test: 全8 HTML ファイルに loadScripts 関数が残っていないこと（grep ベース）
// Test: 全8 HTML ファイルに createScriptElement 関数が残っていないこと（grep ベース）
// Test: Local.js のファイルリストに依存するコード（SKILL_EFFECT_FILES, SKILL_IMPL_FILES の参照）が HTML 内に残っていないこと
// Test: 各 HTML に <script type="module" src="./XxxMain.js"> が存在すること
```

### C.3 Dev Server 起動テスト（手動）

- `npx vite` コマンドで dev server が起動すること
- ブラウザで各シミュレーター HTML にアクセスできること（8ページ全て）
- コンソールにモジュール読み込みエラーが出ないこと

### C.4 HMR テスト（手動）

- JS ファイルを変更後、ブラウザが自動リロード/更新されること

## 実装手順

### Step C.1: 環境変数ファイルの作成とデータ読み込み統一

**作成するファイル:**

1. `/Users/studio/Documents/GitHub/FehBattleSimulator/.env.development` -- ローカル開発用の環境変数
2. `/Users/studio/Documents/GitHub/FehBattleSimulator/.env.production` -- 本番用の環境変数

`.env.development` には `VITE_` プレフィックスで環境変数を定義する。Vite は `VITE_` プレフィックスの環境変数のみを `import.meta.env` に公開する。

```
VITE_DATA_SOURCE=local
```

`.env.production` には本番環境の設定を記述する。

```
VITE_DATA_SOURCE=remote
```

**データ読み込みロジックの統一:**

現在の `typeof weaponInfos == 'undefined'` による判定を、`import.meta.env.MODE` または `import.meta.env.VITE_DATA_SOURCE` による判定に変更する。この変更はエントリポイント (`*Main.js`) またはそれらが呼び出す初期化関数内で行う。

重要: Vite dev server では `<script type="module" src="./XxxMain.js">` が Vite のモジュール解決を使ってすべてのモジュールを自動的にロードする。つまり `loadScripts` によるファイルリスト管理は不要になる。

ただし、本番環境ではデータ（`weaponInfos`, `heroInfos` 等）が外部 CDN から `<script>` タグで読み込まれるという構造は維持する必要がある。`import.meta.env.MODE` で分岐し:

- `development`: データもローカルファイルから import する（もしくはローカルサーバーから fetch する）
- `production`: 既存と同様、外部 CDN の `<script>` タグで読み込まれたグローバル変数を参照する

### Step C.2: HTML の整理

**修正するファイル:** 8つの HTML ファイル全て

各 HTML から以下を削除する:

1. `createScriptElement` 関数の定義（約25行）
2. `loadScripts` 関数の定義（約15行）
3. `window.addEventListener('load', ...)` 内の isLocal 判定と条件分岐ロジック
4. `<script src="Local.js"></script>` タグ
5. `SKILL_EFFECT_FILES`, `SKILL_IMPL_FILES` への参照

代わりに、`<script type="module" src="./XxxMain.js">` がエントリポイントとして全ての初期化を担当する。各 `*Main.js` に初期化コード（`g_app.registerSkillOptions(...)` 等の呼び出し）を移動する。

現在 HTML 内に inline で記述されている初期化コードの例（`ArenaSimulator.html` 1488行目付近）:

```javascript
loadScripts(additionalScripts, () => {
    g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, ...);
    g_app.registerHeroOptions(heroInfos, false);
    initAetherRaidBoard(heroInfos);
    createDialogs();
    importUrl(location.search);
});
```

このロジックをエントリポイント JS ファイルに移動する。`ArenaSimulatorMain.js` の場合、export 文の手前にこの初期化処理を追加する形になる。

また、`loadLazyImages()` 関数は HTML 内に inline 定義されているユーティリティ。これは独立しているためそのまま HTML 内に残すか、別の JS ファイルに抽出する。

### Step C.3: Dev Server 設定

**修正するファイル:** `/Users/studio/Documents/GitHub/FehBattleSimulator/vite.config.js`

`vite.config.js` に dev server 固有の設定を追加する。`root: 'Sources'` が設定されているため、dev server は `Sources/` ディレクトリをルートとして提供する。

設定項目:
- **複数 HTML へのルーティング**: Vite のマルチページモード（`build.rollupOptions.input` に8つの HTML を設定済み）は dev server でも自動的にルーティングされる。`http://localhost:5173/ArenaSimulator.html` 等でアクセス可能
- **プロキシ設定**: 外部データ取得が必要な場合は `server.proxy` を設定。ただし、ローカル開発では静的データファイルをローカルに配置する方式を優先する
- **CORS 設定**: 外部 CDN からのスクリプト読み込みが dev server で問題を起こす場合、`server.cors: true` を設定

```javascript
// vite.config.js に追加する server セクションの概要
{
    server: {
        // デフォルトポートで十分だが、明示的に指定してもよい
        // port: 5173,
        // 外部 CDN のスクリプトとの互換性
        cors: true,
    }
}
```

### Step C.4: HMR（Hot Module Replacement）

Vite は HMR をデフォルトで提供する。`@vitejs/plugin-vue` プラグイン（section-01 で追加済み）により、Vue コンポーネントの HMR も自動的に動作する。

ただし、現在のプロジェクトは SFC（`.vue` ファイル）を使用していないため、Vue テンプレートの HMR は HTML 内テンプレートには適用されない。JS ファイルの変更時にはフルリロードが発生する（これは Vite のデフォルト動作で問題ない）。

特別な HMR 設定は不要。Vite のデフォルト動作で十分。

## StatusCalculator.html の特殊対応

`StatusCalculator.html` は他の7つのシミュレーターと異なるローカル判定パターンを使用している:

```javascript
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
```

これは `import.meta.env.MODE` への統一で自然に解消される。

## `.gitignore` への追加

`.env*.local` ファイル（ユーザー個別のオーバーライド）を `.gitignore` に追加する。`.env.development` と `.env.production` 自体はリポジトリにコミットする。

## 実装結果（実績）

### section-02 で完了済みの項目

以下の作業は section-02（Vite Build）で既に完了しており、本セクションでの変更は不要だった:

- **Step C.2**: 全8 HTML から `loadScripts`, `createScriptElement`, `Local.js` 参照の除去
- **Step C.2**: 初期化コード（`g_app.registerSkillOptions` 等）の `*Main.js` への移動
- **Step C.2**: 各 HTML に `<script type="module" src="./XxxMain.js">` の設定
- **StatusCalculator.html の特殊対応**: `isLocal` 判定パターンも section-02 で除去済み

### 本セクションで実施した作業

1. `.env.development`（`VITE_DATA_SOURCE=local`）と `.env.production`（`VITE_DATA_SOURCE=remote`）の作成
2. `vite.config.js` に `server: { cors: true }` を追加
3. `.gitignore` に `.env*.local` を追加
4. テスト作成: `Tests/DevServerEnv.test.js`（2テスト）、`Tests/DevServerHtml.test.js`（40テスト）

### 計画からの逸脱

- **import.meta.env 分岐は未実装**: section-02 で `*Main.js` が `SampleSkillInfos.js` / `SampleHeroInfos.js` から直接 import する設計になっており、dev/prod でデータソースを切り替える必要がない。`.env` ファイルは将来の拡張用に残す。
- **proxy/port 設定は省略**: デフォルト設定で十分なため。

### 作成・変更ファイル一覧

| ファイル | 操作 |
|---------|------|
| `.env.development` | 新規作成 |
| `.env.production` | 新規作成 |
| `.gitignore` | `.env*.local` 追加 |
| `vite.config.js` | `server.cors` 追加 |
| `Tests/DevServerEnv.test.js` | 新規作成（2テスト） |
| `Tests/DevServerHtml.test.js` | 新規作成（40テスト） |

## 完了条件

1. ~~`.env.development` と `.env.production` が作成されている~~ ✅
2. ~~全8 HTML から `loadScripts`, `createScriptElement`, `Local.js` 参照が除去されている~~ ✅（section-02で完了）
3. ~~各 HTML に `<script type="module" src="./XxxMain.js">` が設定されている~~ ✅（section-02で完了）
4. ~~初期化コード（`g_app.registerSkillOptions` 等）が `*Main.js` に移動されている~~ ✅（section-02で完了）
5. `npx vite` で dev server が起動し、全8シミュレーターにブラウザでアクセスできる — 手動確認
6. コンソールにモジュール解決エラーが出ないこと — 手動確認
7. ~~`vite build` が引き続き正常に動作する（既存機能の回帰なし）~~ ✅ テスト375件パス