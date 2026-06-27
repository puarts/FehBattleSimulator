// ゴールデンマスター・刺激バッテリー（条件を発動させる本コーパス生成）
//
// 課題: 各スキルの発動条件(HP閾値/周囲の味方/自分から攻撃/敵ステータス等)は
//       スキルごとに異なり、手で書くのは非現実的。
// 方針: 標準化した「変種(variant)」のバッテリーを全スキルに一律に当て、
//       条件の on/off を機械的に揺さぶる。各変種は決定論的な spec。
//
// スコープ: 環境変数 GOLDEN_BATTERY_SCOPE
//   - 'demo' (既定): 既知7スキル。変種ごとに出力が変わることの実証用。
//   - 'all'        : 全列挙スキル。本コーパス生成用（件数が多い）。
// 出力: Tests/golden/battery-<scope>/ 配下に corpus.json と統計。

const fs = require('fs');
const path = require('path');

const SCOPE = process.env.GOLDEN_BATTERY_SCOPE || 'demo';
const OUT_DIR = path.join(process.cwd(), 'Tests', 'golden', `battery-${SCOPE}`);

function skillName(id) {
    const info = g_testHeroDatabase.skillDatabase.findSkillInfoByDict(id);
    return info ? info.name : `Unknown(${id})`;
}

const gbStats = (o = {}) => ({ hp: 50, atk: 50, spd: 50, def: 50, res: 50, ...o });
function plain(group) { return { group, stats: gbStats(), skills: {} }; }
function subj(slot, id, group = 'ally', extra = {}) {
    const skills = {};
    skills[slot] = id;
    return { group, stats: gbStats(extra.stats), skills, ...extra.unit };
}

// 標準化した刺激バッテリー。subject=スキルを持つユニット。
const VARIANTS = [
    // 自分から攻撃・両者全快・味方なし（基準）
    { name: 'init_baseline', make: (slot, id) => ({
        attacker: subj(slot, id), defender: plain('enemy'), allies: [], foes: [], turn: 1 }) },
    // 自分から攻撃・低HP（HP閾値/攻め立て等を揺さぶる）
    { name: 'init_lowhp', make: (slot, id) => ({
        attacker: { ...subj(slot, id), hpPercent: 20 }, defender: plain('enemy'), allies: [], foes: [], turn: 3 }) },
    // 自分から攻撃・味方2体隣接（「周囲N以内に味方」条件を揺さぶる）
    { name: 'init_with_allies', make: (slot, id) => ({
        attacker: subj(slot, id), defender: plain('enemy'), allies: [plain('ally'), plain('ally')], foes: [], turn: 1 }) },
    // 敵から攻撃される側（防御・敵ターン系の効果を揺さぶる）
    { name: 'defend', make: (slot, id) => ({
        attacker: plain('ally'), defender: subj(slot, id, 'enemy'), allies: [], foes: [], turn: 2 }) },
    // 自分から攻撃・高ステータスの敵（軽減/「敵の攻撃が高い時」等を揺さぶる）
    { name: 'vs_strong_foe', make: (slot, id) => ({
        attacker: subj(slot, id), defender: { group: 'enemy', stats: gbStats({ atk: 60, hp: 99 }), skills: {} },
        allies: [], foes: [], turn: 1 }) },
];

const DEMO_SKILLS = [
    { label: 'weapon_ChosenLance', slot: 'weapon', id: Weapon.ChosenLance },
    { label: 'weapon_HeroicMaltet', slot: 'weapon', id: Weapon.HeroicMaltet },
    { label: 'passiveA_SwiftSpecter', slot: 'passiveA', id: PassiveA.SwiftSpecter },
    { label: 'passiveB_WildAtHeart', slot: 'passiveB', id: PassiveB.WildAtHeart },
    { label: 'passiveC_SpdResFaith', slot: 'passiveC', id: PassiveC.SpdResFaith },
    { label: 'special_ArmoredFlare', slot: 'special', id: Special.ArmoredFlare },
    { label: 'special_FrozenMirror', slot: 'special', id: Special.FrozenMirror },
];

const ALL_SLOTS = [
    { slot: 'weapon', enumObj: Weapon }, { slot: 'special', enumObj: Special },
    { slot: 'support', enumObj: Support }, { slot: 'passiveA', enumObj: PassiveA },
    { slot: 'passiveB', enumObj: PassiveB }, { slot: 'passiveC', enumObj: PassiveC },
    { slot: 'passiveS', enumObj: PassiveS }, { slot: 'passiveX', enumObj: PassiveX },
];

function targetSkills() {
    if (SCOPE === 'all') {
        const out = [];
        for (const s of ALL_SLOTS) {
            for (const [key, id] of Object.entries(s.enumObj)) {
                if (typeof id !== 'number') continue;
                out.push({ label: `${s.slot}_${key}`, slot: s.slot, id });
            }
        }
        return out;
    }
    return DEMO_SKILLS;
}

describe(`Golden battery corpus (scope=${SCOPE})`, () => {
    beforeEach(() => resetGlobalTestState());

    const skills = targetSkills();
    const corpus = [];
    let okCount = 0;
    let failCount = 0;
    const failures = [];

    test(`全 ${skills.length} スキル × ${VARIANTS.length} 変種を生成する`, () => {
        for (const sk of skills) {
            for (const variant of VARIANTS) {
                try {
                    const spec = variant.make(sk.slot, sk.id);
                    const output = GoldenScenario.run(spec);
                    corpus.push({
                        label: sk.label, skillId: sk.id, name: skillName(sk.id),
                        category: sk.slot, variant: variant.name,
                        input: spec, output,
                    });
                    okCount++;
                } catch (e) {
                    failCount++;
                    failures.push({ label: sk.label, id: sk.id, variant: variant.name,
                        reason: (e && e.message ? e.message : String(e)).split('\n')[0].slice(0, 160) });
                }
            }
        }
        console.log(`[golden-battery:${SCOPE}] skills=${skills.length} variants=${VARIANTS.length} `
            + `vectors=${corpus.length} ok=${okCount} failed=${failCount}`);
        expect(corpus.length).toBeGreaterThan(0);
    }, 600000);

    // デモ時のみ: 変種ごとに出力が実際に変わる（=条件が発動している）ことを示す。
    if (SCOPE === 'demo') {
        test('変種により出力が変化する（SwiftSpecter の攻撃回数/ステータス）', () => {
            const byVariant = {};
            for (const variant of VARIANTS) {
                const spec = variant.make('passiveA', PassiveA.SwiftSpecter);
                const out = GoldenScenario.run(spec);
                byVariant[variant.name] = {
                    atkCount: out.combatSummary.atkUnit_totalAttackCount,
                    atkUnit_atk: out.combatSummary.atkUnit_atk,
                    atkUnit_spd: out.combatSummary.atkUnit_spd,
                };
            }
            console.log('[SwiftSpecter variants] ' + JSON.stringify(byVariant));
            // 少なくとも2通り以上の異なる結果が出る（条件 on/off が効いている）。
            const sigs = new Set(Object.values(byVariant).map(v => JSON.stringify(v)));
            expect(sigs.size).toBeGreaterThan(1);
        });
    }

    afterAll(() => {
        if (corpus.length === 0) return;
        fs.mkdirSync(OUT_DIR, { recursive: true });
        fs.writeFileSync(path.join(OUT_DIR, 'corpus.json'),
            JSON.stringify({
                version: 1, scope: SCOPE,
                variants: VARIANTS.map(v => v.name),
                skillCount: skills.length, vectorCount: corpus.length,
                ok: okCount, failed: failCount, failures,
                vectors: corpus,
            }, null, 2), 'utf8');
    });
});
