# Interview Transcript: DamageCalculatorWrapper.js 分割

## Q1: スキル効果辞書初期化（6,800行）の分割方針

**質問**: スキル効果辞書の初期化メソッド（lines 1564-9400、約6,800行）は `let self = this` でクロージャを作るパターンです。この部分の分割についてどう考えていますか？

**回答**: initメソッドごとに分割。コンストラクタからの呼び出しはそのまま維持。

## Q2: 分割後のファイル命名規則

**質問**: 分割後のファイル命名規則について希望はありますか？

**回答**: `DamageCalculatorWrapper_責務名.js` 形式。例: DamageCalculatorWrapper_SkillEffects.js, DamageCalculatorWrapper_Spur.js

## Q3: 分割方式（アーキテクチャ選択）

**質問**: Prototype拡張パターンを採用する場合、既存コードベースにはprototype拡張の前例がありません。分割方式について、どのアプローチが好ましいですか？

**回答**: ハイブリッド方式。
- 密結合なメソッド群 → Prototype拡張（`Object.assign(DamageCalculatorWrapper.prototype, {...})`）
- 独立性の高い責務 → ヘルパークラス委譲
- ただし、まずは全部prototype分割可能かを見て、依存が薄い塊だけヘルパークラス候補に格上げする順序

## Q4: 分割の優先度

**質問**: 分割の優先度について、特に頻繁に編集する領域や、分割による恩恵が大きいと感じる部分はありますか？

**回答**: 推奨順:
1. **最優先**: `__init__applySkillEffectFor...FuncDict` 系（6,800行、新スキル追加時の編集頻度最高、物理分割のみで進めやすい）
2. **次点**: `__applySpursFromAllies` / `__updateUnitSpur` 周辺（処理が分散していて追いづらい、保守性改善の体感大きい。ただし計算フロー横断の依存があり設計確認必要）
3. 追撃・反撃判定
4. 入口処理やユーティリティ

理由: 編集頻度が高い、分割後の見通し改善が大きい、比較的「塊」で移しやすい

## Q5: Spur系の依存関係の懸念

**質問**: Spur系について「計算フロー横断の依存」とのことですが、具体的にどの辺りが気になりますか？

**回答**: 両方（呼び出し元が複数箇所 + 内部で他領域のメソッドを使用）が気になる。
- `__applySpursFromAllies` は戦闘前準備・戦闘中更新・再計算など複数地点から呼ばれている可能性
- Spur計算は近接/距離判定、味方列挙、状態参照、スキル条件評価などを通じて他領域のhelperに触っている可能性
- 先に「きれいな責務」と決め打ちすると、実際には横断的ユーティリティ束だった、というズレが起きやすい

deep-planで確認したい観点:
1. `__applySpursFromAllies` と `__updateUnitSpur` 系の全呼び出し元
2. それらが呼ぶ内部メソッド一覧
3. `this` 経由で参照している状態
4. 追撃・反撃・スキル効果適用との直接依存の有無

## Q6: ヘルパークラス候補

**質問**: ハイブリッド方式で独立性の高い責務をヘルパークラスにする場合、Spur系以外にヘルパークラス候補として考えている領域はありますか？

**回答**: 分析結果で判断するが、事前の当たりとして:
- **条件付き候補**: Spur系（概念上まとまりやすいが実依存が重ければprototype分割に）
- **条件付き候補**: 追撃・反撃判定（入力と判定結果がはっきりしていればヘルパークラス化しやすい）
- **非候補寄り**: スキル効果辞書初期化、巨大なスキル効果適用本体（this/self依存が強い）

方針: まず全部prototype分割可能かを見る → 依存が薄い塊だけヘルパークラス候補に格上げ

## Q7: 分割後のファイル数

**質問**: 分割後のファイル数の目安はありますか？

**回答**: 4-5ファイル程度が上限目安。
- ESMではなくグローバル読込前提のため、ファイル増やしすぎるとロード順管理コスト増
- 責務境界が完全にきれいではないはず。細かく切りすぎると追いづらくなる
- まず少数の大きめな塊で安全に分けて、必要なら第2段階でさらに分割

想定ファイル構成:
- `DamageCalculatorWrapper_InitSkillEffectDict.js`
- `DamageCalculatorWrapper_ApplySkillEffects.js`
- `DamageCalculatorWrapper_Spur.js`
- `DamageCalculatorWrapper_FollowupAndCounter.js`
- 必要なら `DamageCalculatorWrapper_PrecombatOrCoreFlow.js`

## Q8: Init分割単位（Atk/Def）

**質問**: `__init__applySkillEffectForAtkUnitFuncDict` と `__init__applySkillEffectForDefUnitFuncDict` はそれぞれ別ファイルにしますか？

**回答**: Atk/Defペアで1ファイルが第一候補。
- Atk/Defの辞書初期化は役割が対になっており、読む側も対応を追いやすい
- 別ファイルにすると関連修正が分散して往復が増える
- ファイル数を増やしすぎない方がよい
- ただし片方だけ極端に大きいなら実測優先で再判断

ファイル名: `DamageCalculatorWrapper_InitSkillEffectDict.js`（必要なら後で `_Atk.js` / `_Def.js` に再分割）
