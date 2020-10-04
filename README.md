# FehBattleSimulator

## 概要
FEH(ファイアーエムブレムヒーローズ)の飛空城、闘技場、戦渦の連戦、双界を越えてのバトルをシミュレートできるツールである[飛空城シミュレーター](https://puarts.com/?pid=1469)のソースコードです。

## スキル実装の追加方法
### スキルの実装手順
1. 追加スキルが SampleSkilInfos.js 内に存在しない場合、https://puarts.com/?pid=1469 のソースに定義されている weaponInfos 等の変数を SampleSkilInfos.js や SampleHeroInfos.js にコピーする
    - https://puarts.com/?pid=1469 にも存在しない場合はデータベースに登録されていないので puarts にデータベース登録を依頼する
1. Skill.js内に定義されている辞書 Weapon、Support、Special、PassiveA、PassiveB、PassiveC、PassiveS のうち、適切な辞書に追加スキルのIDを追加する
    - スキルIDはシミュレーターを起動してデバッグモードを有効にすると、スキル選択ボックスの隣に表示される
    - これらの辞書に登録すると未実装スキル名の先頭に付与される×印が消える
1. 「スキル実装箇所のヒント」の項目を参考に、Main.js、DamageCalculator.js、Map.jsの中の必要な個所に追加スキルの実装を行う

### スキル実装箇所のヒント

* 追加予定のスキルと同じ効果のスキルが既に存在すれば、そのスキル効果と同様に実装する
  * 同様の効果のスキルが既に存在するかは https://puarts.com/?pid=1329 で調べられる
* ほとんどのスキル効果は Main.js 内に実装されている
  * 戦闘中に発動するスキル効果は AetherRaidTacticsBoard.calcDamage()
    * ほとんどは calcDamage() 内で呼んでいる AetherRaidTacticsBoard.\_\_applySkillEffectForUnit() に実装されている
  * 戦闘後に発動するスキル効果は AetherRaidTacticsBoard.updateDamageCalculation()
  * ターン開始時のスキル効果は AetherRaidTacticsBoard.\_\_applySkillForBeginningOfTurn()
  * 攻撃の紋章など、戦闘中の無条件強化/弱化効果は AetherRaidTacticsBoard.\_\_updateUnitSpur()
  * 補助スキルは AetherRaidTacticsBoard.applySupportSkill()
* ダメージ軽減などダメージ計算に関わる一部のスキル効果は DamageCalculator.js 内に実装されている
* 救援の行路など、マップ上の移動範囲を変更するスキル効果は Map.js の Map.enumerateMovableTilesImpl() に実装されている
* 応援や回復補助などの応援量、回復量やAIの行動条件に影響するデバフスキルの判定関数などが Unit.js や Skill.js に定義されている

### 自動実装されるスキル効果
無条件で発動する以下のスキル効果はデータベースの情報から自動追加されるので、個別に対応する必要はありません。
* ステータス変更(攻撃+3などの効果)
* 奥義発動カウント-1
* 特効
* 特効無効
* 神罰の杖効果
* 遠距離反撃、近距離反撃
* 2回攻撃(反撃時も含む)
* 反撃不可
* 【暗器(7)】効果
* ブレスの「守備か魔防の低い方でダメージ計算」
