I have sufficient context. Now let me produce the section content.

# Section 05: Stage D -- 情報クラス・データベースのESM化

## 概要

Stage D では、情報クラスとデータベースファイル（HeroInfo, SkillDatabase, HeroDatabase, SampleSkillInfos, SampleHeroInfos）に `import`/`export` 文を追加して ESM 化する。これらのファイルはゲームの英雄情報やスキル情報を管理するデータ層であり、Stage B（定数・列挙型）と Stage C（データ構造）に依存する。

## 依存関係

- **前提セクション**: section-03-stage-b-constants（SkillConstants, HeroInfoConstants, UnitConstants のESM化完了）、section-04-stage-c-data（Skill 等のESM化完了）
- **後続セクション**: section-07-stage-f-core, section-08-stage-g-skill-impl, section-09-stage-h-combat がこのセクションの完了に依存する
- section-01-build-filter で実装された import/export 除去フィルタが動作していることが前提

## 対象ファイル

| ファイル | パス | 定義するシンボル | 依存先 |
|---------|------|-----------------|-------|
| HeroInfo.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroInfo.js` | `HeroInfo` クラス | Skill, SkillConstants, HeroInfoConstants, UnitConstants, GlobalDefinitions |
| SkillDatabase.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillDatabase.js` | `SkillDatabase` クラス | Skill (SkillInfo, SkillType), SkillConstants |
| HeroDatabase.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroDatabase.js` | `HeroDatabase` クラス | HeroInfo |
| SampleSkillInfos.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SampleSkillInfos.js` | `weaponInfos`, `supportInfos`, `specialInfos`, 他スキルデータ配列群 | Skill (SkillInfo), SkillConstants (WeaponType, MoveType, EffectiveType, AssistType, SkillType) |
| SampleHeroInfos.js | `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SampleHeroInfos.js` | `heroInfos` 配列 | HeroInfo, HeroInfoConstants (MoveType, SeasonType, BlessingType) |

## テスト（実装前に確認）

以下のテストは既存のスモークテストとして `Tests/SmokeTest.test.js` に存在する。Stage D の変換後、これらが全てパスし続けることを確認する。

```
# Test: HeroInfo.js -- HeroInfo が定義されている（スモークテスト既存）
# Test: SkillDatabase.js -- SkillDatabase が定義されている（スモークテスト既存）
# Test: HeroDatabase.js -- HeroDatabase が定義されている（スモークテスト既存）
# Test: SampleSkillInfos.js -- スキルデータが読み込まれている（スモークテスト既存）
# Test: SampleHeroInfos.js -- ヒーローデータが読み込まれている（スモークテスト既存）
```

具体的には、既存のスモークテスト内の以下のアサーションがパスすること:
- `expect(HeroInfo).toBeDefined()` -- コアクラスの存在確認テスト内
- `expect(HeroDatabase).toBeDefined()` -- コアクラスの存在確認テスト内
- `expect(SkillDatabase).toBeDefined()` -- コアクラスの存在確認テスト内
- `g_testHeroDatabase.enumerateHeroInfos()` の結果が500件以上 -- 英雄データベーステスト
- `g_testHeroDatabase.skillDatabase.weaponInfos.length` が100件以上 -- スキルデータベーステスト

変換後に `./run_tests.sh` を実行し、全305テスト + スモークテストがパスすることを確認する。

## 実装手順

各ファイルについて共通の変換手順を適用する:

1. ファイル内で使用している他ファイルの定義を特定
2. ファイル先頭に `import { ... } from '...'` を追加
3. ファイル末尾に `export { ... };` を追加
4. `./run_tests.sh` で全テストパスを確認

### コーディング規約（重要）

- import 文と export 文は必ず **1行で記述する**。複数行にまたがる記述は禁止（結合時のフィルタが行単位で動作するため）
- export は末尾まとめ `export { ... };` に統一。インライン export（`export class` 等）は禁止
- バレルファイルは作らない。各ファイルから直接 import する

### ファイル別の変換詳細

#### 1. HeroInfo.js

HeroInfo.js は `HeroInfo` クラス1つを定義する664行のファイル。

**依存の特定**: HeroInfo コンストラクタ内で以下の外部シンボルを使用している:
- `stringToWeaponType`, `weaponTypeToString`, `isWeaponTypeDagger`, `isWeaponTypeBow`, `isWeaponTypeBreath`, `isWeaponTypeBeast`, `isInheritableWeaponType`, `isRefreshSupportSkill` -- SkillConstants.js から
- `SkillType`, `WeaponType` -- SkillConstants.js から
- `StatusType`, `MoveType`, `SeasonType`, `BlessingType`, `isLegendarySeason`, `UnitRarity` -- HeroInfoConstants.js から
- `BookVersions`, `NoneOption` -- GlobalDefinitions.js or UnitConstants.js から
- `SkillInfo` -- Skill.js から（型参照のみ、canEquipSkill 内でプロパティアクセス）
- `g_siteRootPath`, `g_heroIconRootPath` -- GlobalDefinitions.js から

**追加する import 文** (ファイル先頭): 使用している外部シンボルを全て列挙する。具体的なシンボルリストはファイルの実際の依存を精査して決定する。

**追加する export 文** (ファイル末尾):
```javascript
export { HeroInfo };
```

#### 2. SkillDatabase.js

SkillDatabase.js は `SkillDatabase` クラス1つを定義する104行のファイル。

**依存の特定**:
- `SkillType` -- SkillConstants.js から（`registerSkillOptions` メソッド内で使用）

**追加する import 文** (ファイル先頭): SkillType を SkillConstants.js から import。

**追加する export 文** (ファイル末尾):
```javascript
export { SkillDatabase };
```

#### 3. HeroDatabase.js

HeroDatabase.js は `HeroDatabase` クラス1つを定義する110行のファイル。

**依存の特定**:
- `HeroInfo` -- HeroInfo.js から（JSDoc 型参照のみ。実行時の依存はコンストラクタ引数として `HeroInfo[]` を受け取るだけで、HeroInfo のシンボル自体を直接参照しない可能性が高い）

実際にファイル内で `HeroInfo` をコード上で参照しているか確認し、参照がある場合のみ import を追加する。JSDoc のみの場合は import 不要（結合モードでは問題にならない）。

**追加する export 文** (ファイル末尾):
```javascript
export { HeroDatabase };
```

#### 4. SampleSkillInfos.js

SampleSkillInfos.js は大量のスキルデータ配列（`const weaponInfos`, `const supportInfos`, `const specialInfos`, 他）を定義する巨大なデータファイル。

**依存の特定**:
- `SkillInfo` -- Skill.js から（全データ行で `new SkillInfo(...)` を呼び出す）
- `WeaponType`, `MoveType`, `SkillType` -- SkillConstants.js から
- `EffectiveType`, `AssistType` -- SkillConstants.js から

**追加する import 文** (ファイル先頭): 上記シンボルを各ファイルから import。

**追加する export 文** (ファイル末尾): ファイル内で定義されている全ての `const` 配列を export する。具体的な配列名はファイル内の `const` 宣言を全て列挙して決定する（`weaponInfos`, `supportInfos`, `specialInfos`, `passiveAInfos`, `passiveBInfos`, `passiveCInfos`, `passiveSInfos`, `passiveXInfos`, `captainInfos` 等が予想される）。

#### 5. SampleHeroInfos.js

SampleHeroInfos.js は `const heroInfos` 配列を定義する巨大なデータファイル。

**依存の特定**:
- `HeroInfo` -- HeroInfo.js から（全データ行で `new HeroInfo(...)` を呼び出す）
- `MoveType`, `SeasonType`, `BlessingType` -- HeroInfoConstants.js から

**追加する import 文** (ファイル先頭): 上記シンボルを各ファイルから import。

**追加する export 文** (ファイル末尾):
```javascript
export { heroInfos };
```

### 変換順序

ファイル間の依存関係に基づき、以下の順序で変換する:

1. **HeroInfo.js** -- Stage C の Skill.js と Stage B の定数に依存するのみ
2. **SkillDatabase.js** -- SkillConstants に依存するのみ
3. **HeroDatabase.js** -- HeroInfo に依存
4. **SampleSkillInfos.js** -- Skill, SkillConstants に依存
5. **SampleHeroInfos.js** -- HeroInfo, HeroInfoConstants に依存

各ファイルの変換後に `./run_tests.sh` を実行して回帰がないことを確認する。

## 注意事項

- SampleSkillInfos.js と SampleHeroInfos.js は非常に大きなファイル（数千行のデータ）。import 文はファイル先頭、export 文はファイル末尾に追加するだけで、データ行の変更は不要。
- HeroInfo.js は多くの外部関数（`stringToWeaponType` 等のユーティリティ関数）に依存している。これらの関数が Stage B（SkillConstants.js）で既に export されていることを確認してから import を追加する。export されていない場合は、先に Stage B のファイルに追加する必要がある。
- `create_tests.sh` の `SOURCE_FILE_NAMES` 配列内での順序: HeroInfo は SkillConstants, Skill, HeroInfoConstants, UnitConstants より後に配置されている（既存の順序で問題ない）。新規ファイルの追加はないため `SOURCE_FILE_NAMES` の変更は不要。
- `BookVersions` や `NoneOption` などのグローバル変数が GlobalDefinitions.js で定義されているか、または他のファイルで定義されているかを確認する必要がある。これらの定義元ファイルが Stage A または Stage B で既に export されていることを前提とする。

## 完了基準

1. 5つの対象ファイル全てに `import`/`export` 文が追加されている
2. `./run_tests.sh` で全テストがパスする
3. `npm run build` でビルド出力が正常に生成される（import/export 行が除去された状態で、変換前と同等の出力）
4. 各ファイルの依存関係が import 文で明示的に宣言されている

## 実装結果

### 計画との差異
- **HeroInfo.js**: 計画では `stringToWeaponType` 等を SkillConstants.js から import とあったが、実際にはこれらの関数は Skill.js で定義・export されているため Skill.js から import した。`WeaponType`, `SeasonType`, `BlessingType` は HeroInfo.js 内で直接参照されていないため import を省略。`BookVersions` は HeroInfoConstants.js で export 済み、`NoneOption` は SkillConstants.js で export 済みであることを確認。
- **HeroDatabase.js**: 計画通り、`HeroInfo` は JSDoc のみで runtime 参照なしのため import 不要。export のみ追加。
- **SampleSkillInfos.js**: `EffectiveType` は計画に記載がなかったが、データ行で使用されているため SkillConstants.js から import を追加。

### テスト結果
- `./run_tests.sh`: 310テスト全パス
- `npm run build`: 正常完了（エラーなし）

### 追加・変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| Sources/HeroInfo.js | import 4行 + export 1行追加 |
| Sources/SkillDatabase.js | import 1行 + export 1行追加 |
| Sources/HeroDatabase.js | export 1行追加 |
| Sources/SampleSkillInfos.js | import 3行 + export 1行追加 |
| Sources/SampleHeroInfos.js | import 2行 + export 1行追加 |