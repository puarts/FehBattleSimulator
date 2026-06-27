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

const DEFAULT_STATS = { hp: 50, atk: 50, spd: 50, def: 50, res: 50 };

// 機械可読・再現可能なシナリオspecを組み立てる（生成と検証で同一）。
function buildSpec(scn) {
    const skills = {};
    skills[scn.kind] = scn.skillId;
    return {
        attacker: { group: 'ally', stats: { ...DEFAULT_STATS }, skills },
        defender: { group: 'enemy', stats: { ...DEFAULT_STATS }, skills: {} },
        allies: [],
        foes: [],
        turn: 1,
    };
}

function runScenario(scn) {
    const spec = buildSpec(scn);
    const output = GoldenScenario.run(spec);
    return { spec, output };
}

describe('Golden Master corpus generation (vertical slice)', () => {
    beforeEach(() => resetGlobalTestState());

    const corpus = [];

    for (const scn of GOLDEN_SCENARIOS) {
        test(`generate + determinism: ${scn.label}`, () => {
            const run1 = runScenario(scn);
            resetGlobalTestState();
            const run2 = runScenario(scn);

            // 決定論性: 同入力 → 完全一致
            expect(run2.output).toEqual(run1.output);

            // 構造の健全性
            expect(run1.output.combatSummary).toBeDefined();
            expect(Array.isArray(run1.output.strikes)).toBe(true);
            expect(typeof run1.output.combatSummary.atkUnit_normalAttackDamage).toBe('number');

            corpus.push({
                label: scn.label,
                skillId: scn.skillId,
                name: goldenSkillName(scn.skillId),
                category: scn.kind,
                description: scn.desc,
                input: run1.spec,
                output: run1.output,
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
