---
name: fetch-status-icon
description: FEH Wikiからステータス効果のアイコン画像を取得し、プロジェクトに保存します。
argument-hint: "<StatusEffectType名> (例: PhysicalTwinSave)"
---

# ステータス効果アイコン取得

FEH Wiki (feheroes.fandom.com) から StatusEffectType のアイコン画像を取得し、プロジェクトの画像ディレクトリに保存する。

## 引数

- `<StatusEffectType名>`: StatusEffectType の定数名（例: `PhysicalTwinSave`, `MagicTwinSave`）
- 省略時はユーザーに確認する

## 手順

### Step 1: UnitConstants.js の登録確認

`Sources/UnitConstants.js` の `STATUS_EFFECT_INFO_MAP` に対象エントリがあるか確認する。

```
[StatusEffectType.Xxx, ["Xxx.webp", "日本語名", "説明"]]
```

- エントリがなければ「STATUS_EFFECT_INFO_MAP に未登録です。先に登録してください。」と表示して終了
- `info[0]`（例: `PhysicalTwinSave.webp`）からファイル名を取得 → `StatusEffect_${info[0]}`

### Step 2: Wiki上のファイル名を特定

Wiki側のファイル名はプロジェクト内のファイル名と異なる命名規則（スペース区切り + `.png`）。

Fandom API でファイルを検索する:

```
https://feheroes.fandom.com/api.php?action=query&list=allimages&aiprefix=Status_Effect_<検索プレフィックス>&ailimit=50&format=json
```

- `<検索プレフィックス>`: StatusEffectType名の先頭数文字（例: `PhysicalTwinSave` → `P`）
- WebFetch ツールで取得し、対象のファイル名を特定する
- ファイル名の対応規則: `PhysicalTwinSave` → `Status_Effect_Physical_Twin_Save.png`（PascalCase → Snake_Case + `.png`）

### Step 3: 画像URLを取得

```
https://feheroes.fandom.com/api.php?action=query&titles=File:<Wiki上のファイル名>&prop=imageinfo&iiprop=url&format=json
```

WebFetch で取得し、`imageinfo[0].url` から画像の直リンクを抽出する。

### Step 4: ダウンロードと保存

```bash
curl -sL "<画像URL>" -o images/AetherRaidTacticsBoard/images/StatusEffect_<info[0]>
```

- 保存先: `images/AetherRaidTacticsBoard/images/StatusEffect_<info[0]>`
- Wiki は `.png` 拡張子でも実際には WebP 形式で配信するため、そのまま `.webp` で保存して問題ない

### Step 5: 検証

```bash
file images/AetherRaidTacticsBoard/images/StatusEffect_<info[0]>
```

- `RIFF (little-endian) data, Web/P image` と表示されれば成功
- 既存ファイル（例: `StatusEffect_MagicTwinSave.webp`）とフォーマット・サイズ感を比較する

### 完了メッセージ

保存したファイルパスとサイズを表示する。
