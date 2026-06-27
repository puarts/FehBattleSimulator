// ゴールデンマスター・コーパス生成（縦切り実証）
//
// 目的: 現行JSエンジンの戦闘挙動を「言語非依存のJSON（入力→期待出力）」として固定し、
//       将来の書き直し（Rust/WASM 等）の適合判定に使えるようにする。
// この段階では 5〜10 スキルでパイプライン全体（生成→JSON出力→決定論検証）を実証する。
//
// 生成物: Tests/golden/ 配下に
//   - <label>.json     … スキルごとのベクタ
//   - corpus.json      … 一括コーパス
//
// 注意: 戦闘コアは決定論的（乱数なし）なので、同入力なら毎回同じ出力になる。
//       各シナリオを2回実行して一致を検証することで、この前提を担保する。

const fs = require('fs');
const path = require('path');

const GOLDEN_DIR = path.join(process.cwd(), 'Tests', 'golden');

// 検証済み（既存 SkillRegression で実績のある）スキルをカテゴリ横断で選定。
const GOLDEN_SCENARIOS = [
    { label: 'weapon_ChosenLance', kind: 'weapon', skillId: Weapon.ChosenLance,
      desc: '無条件: Atk/Spd/Def/Res+15, +25ダメージ, 15軽減' },
    { label: 'weapon_HeroicMaltet', kind: 'weapon', skillId: Weapon.HeroicMaltet,
      desc: '複雑な武器スキル' },
    { label: 'passiveA_SwiftSpecter', kind: 'passiveA', skillId: PassiveA.SwiftSpecter,
      desc: 'HP>=25% 等の条件で Atk/Spd+9 ほか（条件成立側）' },
    { label: 'passiveB_WildAtHeart', kind: 'passiveB', skillId: PassiveB.WildAtHeart,
      desc: 'PassiveB スキル' },
    { label: 'passiveC_SpdResFaith', kind: 'passiveC', skillId: PassiveC.SpdResFaith,
      desc: 'PassiveC スキル' },
    { label: 'special_ArmoredFlare', kind: 'special', skillId: Special.ArmoredFlare,
      desc: '防御奥義・ダメージ軽減' },
    { label: 'special_FrozenMirror', kind: 'special', skillId: Special.FrozenMirror,
      desc: '複雑な奥義' },
];

function goldenSkillName(skillId) {
    const info = g_testHeroDatabase.skillDatabase.findSkillInfoByDict(skillId);
    return info ? info.name : `Unknown(${skillId})`;
}

function buildAttacker(scn) {
    let b = UnitBuilder.createDummy(UnitGroupType.Ally);
    switch (scn.kind) {
        case 'weapon': b = b.withWeapon(scn.skillId); break;
        case 'passiveA': b = b.withPassiveA(scn.skillId); break;
        case 'passiveB': b = b.withPassiveB(scn.skillId); break;
        case 'passiveC': b = b.withPassiveC(scn.skillId); break;
        case 'special': b = b.withSpecial(scn.skillId); break;
        default: throw new Error(`未対応の kind: ${scn.kind}`);
    }
    return b.build();
}

// 入力シナリオを宣言的に記述（再現に必要な情報のみ。言語非依存）。
function buildInputDescriptor(scn) {
    return {
        attacker: {
            base: 'dummy(Ally) hp50/atk50/spd50/def50/res50',
            equip: { slot: scn.kind, skillId: scn.skillId, name: goldenSkillName(scn.skillId) },
        },
        defender: { base: 'dummy(Enemy) hp50/atk50/spd50/def50/res50' },
        turn: 1,
        gameMode: 'default',
        placement: 'auto (attacker col0, defender at attack range)',
    };
}

function runScenario(scn) {
    const attacker = buildAttacker(scn);
    const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
    const result = new BattleScenarioBuilder()
        .withAttacker(attacker)
        .withDefender(defender)
        .execute();
    return RegressionTestHelper.extractFullCombatSnapshot(result);
}

describe('Golden Master corpus generation (vertical slice)', () => {
    beforeEach(() => resetGlobalTestState());

    const corpus = [];

    for (const scn of GOLDEN_SCENARIOS) {
        test(`generate + determinism: ${scn.label}`, () => {
            const out1 = runScenario(scn);
            resetGlobalTestState();
            const out2 = runScenario(scn);

            // 決定論性: 同入力 → 完全一致
            expect(out2).toEqual(out1);

            // 構造の健全性
            expect(out1.combatSummary).toBeDefined();
            expect(Array.isArray(out1.strikes)).toBe(true);
            expect(typeof out1.combatSummary.atkUnit_normalAttackDamage).toBe('number');

            corpus.push({
                label: scn.label,
                skillId: scn.skillId,
                name: goldenSkillName(scn.skillId),
                category: scn.kind,
                description: scn.desc,
                input: buildInputDescriptor(scn),
                output: out1,
            });
        });
    }

    afterAll(() => {
        if (corpus.length === 0) return;
        fs.mkdirSync(GOLDEN_DIR, { recursive: true });
        for (const v of corpus) {
            fs.writeFileSync(
                path.join(GOLDEN_DIR, `${v.label}.json`),
                JSON.stringify(v, null, 2), 'utf8');
        }
        fs.writeFileSync(
            path.join(GOLDEN_DIR, 'corpus.json'),
            JSON.stringify({
                version: 1,
                generatedFrom: 'FehBattleSimulator JS engine (golden master)',
                vectorCount: corpus.length,
                vectors: corpus,
            }, null, 2), 'utf8');
    });
});
