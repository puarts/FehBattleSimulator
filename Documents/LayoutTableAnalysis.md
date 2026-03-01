# レイアウト目的のテーブル使用箇所 調査レポート

## 概要

HTMLファイルで`<table>`をレイアウト目的で使用している箇所を洗い出し、CSS Gridへの置き換え可否を検討した結果をまとめる。

- **レイアウトテーブル**: 約17箇所（主要ファイル6つ + サンプル1つ）
- **データテーブル**: 約6箇所（正当な使用、変更不要）

---

## 1. レイアウト目的のテーブル一覧

### 1.1 ArenaSimulator.html（SummonerDuelsSimulator.html も同構造）

| ID | 行 | 用途 | 構造 | 内容 |
|----|------|------|------|------|
| A | 73 | ページ全体の2カラムレイアウト | `<table><tr><td width=450>...<td>` | 左:マップ+設定, 右:チーム編成 |
| B | 76-120 | フォームのラベル/値配置 | 2列 x 2行 | 「地形:」「シーズン:」のラベル+入力 |
| C | 121-350 | メインバトルUI全体 | 多行, colspan使用 | 構造物、マップ、コントロール類を縦に並べる |
| D | 138-185 | マップ表示エリア | ネスト, 1列 | 攻撃情報+battle-mapコンポーネントの縦並び |
| E | 142-176 | 戦闘比較情報 | 2列 x 2行 | 攻撃側 vs 防御側の名前・情報を左右に配置 |
| F | 188-307 | 右サイドバー | 1列 x 4行 | 退避エリア、ログ、ターン操作、Undo/Redo |
| G | 211-255 | ターン操作ボタン | 3列 x 1行 | [戻る][ターン表示][進む] の水平配置 |
| H | 362-448 | チーム編成表示 | 2列 x 2行 | 「攻撃編成」「防衛編成」ラベル+アイコン列 |

**特徴**: すべて `border-style: none` / `border-width: 0px` が指定されており、明確にレイアウト目的。最大4段ネスト。

### 1.2 StatusCalculator.html

| ID | 行 | 用途 | 構造 | 内容 |
|----|------|------|------|------|
| I | 19 | 外枠コンテナ | 1列 | 設定パネル全体を包むだけ |
| J | 22-79 | 英雄設定フォーム | rowspan使用, 2列 | アイコン(rowspan=2) + レアリティ/LV/限界突破/花 |

### 1.3 UnitBuilder.html

| ID | 行 | 用途 | 構造 | 内容 |
|----|------|------|------|------|
| K | 418-516 | ページ全体の縦レイアウト | 1列 x 多行 | セーブ/ロード→シーズン→チーム編成→詳細 を縦に並べる |
| L | 431-475 | シーズン設定 | 1列 x 1行 | シーズンチェックボックスを包むだけ |
| M | 493-513 | チーム編成表示 | 2列 x 1行 | 「編成」ラベル+ユニットアイコン列 |
| N | 639-686 | 英雄ヘッダー | rowspan使用, 2列 | アイコン(rowspan=2) + レアリティ/LV設定 |
| O | 689-875 | ステータス・設定一覧 | 3列 x 多行 | HP/攻撃/速さ/守備/魔防のラベル+値+差分 |
| P | 878+ | スキル設定 | 3列 x 多行 | スキルアイコン+ドロップダウン+リンク |

### 1.4 ArenaSimulator.html（OCR設定）

| ID | 行 | 用途 | 構造 | 内容 |
|----|------|------|------|------|
| Q | 652-665 | OCRプレビュー | 2列(th+td) | 「元画像」「調整後」の2つのcanvasを横に並べる |

---

## 2. データ表示目的のテーブル（置き換え不要）

| ファイル | 行 | 理由 |
|----------|------|------|
| StatusCalculator.html | 157 | `<thead>`/`<tbody>`あり。HP/攻撃/速さ/守備/魔防/総合のステータス比較 |
| ArenaSimulator.html | 936-951 | 壁/壊せる壁のカウント表示（小さなデータ表） |
| ArenaSimulator.html | 964-995 | 双界の敵のHP/攻/速/守/魔の入力フォーム（データ対応表） |
| DamageCalculatorMain.js | 808, 878 | JS動的生成。`<th>`付きの戦闘結果ランキング表 |
| samples/edit-table.html | 21-39 | 正しいデータテーブル（デモ用） |
| Documents/Api/html/*.html | 全体 | Doxygen自動生成のAPIドキュメント |

---

## 3. CSS Grid への置き換え検討

### 3.1 容易に置き換え可能（推奨）

| ID | 対象 | Grid/Flexbox置き換え案 | 難易度 |
|----|------|----------------------|--------|
| B | フォーム ラベル/値 (ArenaSimulator:76-120) | `grid-template-columns: auto 1fr` | 低 |
| G | ターン操作ボタン (ArenaSimulator:211-255) | `grid-template-columns: auto 1fr auto` またはFlexbox | 低 |
| H | チーム編成 (ArenaSimulator:362-448) | `grid-template-columns: auto 1fr` で2行 | 低 |
| I | 外枠コンテナ (StatusCalculator:19) | `display: block` で十分（tableが不要） | 低 |
| K | ページ縦レイアウト (UnitBuilder:418) | `display: flex; flex-direction: column` で十分 | 低 |
| L | シーズン設定 (UnitBuilder:431) | テーブル自体が不要（divで十分） | 低 |
| M | チーム編成 (UnitBuilder:493) | `grid-template-columns: auto 1fr` | 低 |
| Q | OCRプレビュー (ArenaSimulator:652-665) | `grid-template-columns: 1fr 1fr` | 低 |

### 3.2 中程度の難易度で置き換え可能

| ID | 対象 | Grid置き換え案 | 注意点 |
|----|------|--------------|--------|
| A | ページ全体 (ArenaSimulator:73) | `grid-template-columns: 450px auto` | 内部のネストテーブルも同時に移行が必要 |
| E | 戦闘比較情報 (ArenaSimulator:142-176) | `grid-template-columns: 1fr 1fr` で2行 | `border-collapse:initial` 等のスタイル再現 |
| F | 右サイドバー (ArenaSimulator:188-307) | `display: flex; flex-direction: column` | 子要素の幅制御に注意 |
| J | 英雄設定フォーム (StatusCalculator:22-79) | `grid-template-columns: auto 1fr` + `grid-row: span 2` | rowspan→grid-rowへの変換 |
| N | 英雄ヘッダー (UnitBuilder:639-686) | 同上: `grid-row: span 2` | rowspan変換 |

### 3.3 大規模で慎重な対応が必要

| ID | 対象 | Grid置き換え案 | 注意点 |
|----|------|--------------|--------|
| C+D | メインバトルUI (ArenaSimulator:121-350) | ページ全体のGrid設計が必要 | colspanが多用、4段ネスト、条件付き表示(v-bind:style)あり。一括リファクタリングが必要 |
| O | ステータス一覧 (UnitBuilder:689-875) | `grid-template-columns: auto auto auto` | 行数が多い(HP/攻撃/速さ/守備/魔防/合計+設定項目)。見た目はデータ表に近いがラベル/値ペアの繰り返し |
| P | スキル設定 (UnitBuilder:878+) | `grid-template-columns: auto 1fr auto` | 行数が多く、各行の構造がやや異なる |

---

## 4. 推奨方針

### 4.1 段階的な移行

1. **Phase 1: 低難易度の8箇所（B, G, H, I, K, L, M, Q）**
   - 単純な2カラムフォームや縦並びのラッパーテーブル
   - ほぼ機械的にGrid/Flexboxに変換可能
   - レイアウト崩れのリスクが低い

2. **Phase 2: rowspan使用箇所（J, N）と中難易度（A, E, F）**
   - rowspanは`grid-row: span 2`で対応可能
   - 周辺の要素との位置関係のテストが必要

3. **Phase 3: メインバトルUI（C+D+F）**
   - ArenaSimulator.htmlとSummonerDuelsSimulator.htmlで共通構造
   - 2ファイル同時に変更する必要がある
   - **内側から外側へ段階的に**移行するのが安全

4. **Phase 4: UnitBuilderのステータス/スキルテーブル（O, P）**
   - 「データ表示」に近い構造
   - semanticには`<dl>`(定義リスト)やGridが適切
   - 現状で視覚的に問題がないなら優先度は低い

### 4.2 置き換えないもの

- `StatusCalculator.html:157` のステータス比較表（正当なデータテーブル）
- `ArenaSimulator.html:964-995` のステータス入力表（データ対応）
- JS動的生成のランキング表（DamageCalculatorMain.js）
- API文書（Doxygen自動生成）
