// ゴールデンマスター・網羅地図（全列挙スキル × 各1ケース）
//
// 目的: 全スキルenum（Weapon/Special/Support/PassiveA-X）を列挙し、
//       各スキルを攻撃側に1つ装備した最小戦闘を実行して、
//       「何件が例外なく生成でき／何件が落ちるか」を可視化する。
// これは正しさ検証ではなく、生成可否のマップ（未実装/データ欠落の発見）。
// 失敗があってもテスト自体は落とさず、Tests/golden/coverage-report.json に集計を出力する。

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'Tests', 'golden');

const SLOTS = [
    { name: 'weapon',   enumObj: Weapon,   apply: (b, id) => b.withWeapon(id) },
    { name: 'special',  enumObj: Special,  apply: (b, id) => b.withSpecial(id) },
    { name: 'support',  enumObj: Support,  apply: (b, id) => b.withSupport(id) },
    { name: 'passiveA', enumObj: PassiveA, apply: (b, id) => b.withPassiveA(id) },
    { name: 'passiveB', enumObj: PassiveB, apply: (b, id) => b.withPassiveB(id) },
    { name: 'passiveC', enumObj: PassiveC, apply: (b, id) => b.withPassiveC(id) },
    { name: 'passiveS', enumObj: PassiveS, apply: (b, id) => b.withPassiveS(id) },
    { name: 'passiveX', enumObj: PassiveX, apply: (b, id) => b.withPassiveX(id) },
];

function listSkills(slot) {
    const out = [];
    for (const [key, id] of Object.entries(slot.enumObj)) {
        if (typeof id !== 'number') continue;
        out.push({ key, id });
    }
    return out;
}

function tryGenerate(slot, id) {
    try {
        resetGlobalTestState();
        let b = UnitBuilder.createDummy(UnitGroupType.Ally);
        b = slot.apply(b, id);
        const attacker = b.build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy).build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        const snap = RegressionTestHelper.extractFullCombatSnapshot(result);
        const dmg = snap.combatSummary.atkUnit_normalAttackDamage;
        if (typeof dmg !== 'number' || Number.isNaN(dmg)) {
            return { ok: false, reason: 'non-numeric-damage' };
        }
        return { ok: true };
    } catch (e) {
        let msg = (e && e.message) ? e.message : String(e);
        msg = msg.split('\n')[0].slice(0, 200);
        return { ok: false, reason: msg };
    }
}

describe('Golden coverage map (全列挙スキル × 各1ケース)', () => {
    test('全スキルを列挙して最小戦闘の生成可否を集計する', () => {
        const perSlot = {};
        const failures = [];
        let total = 0;
        let ok = 0;

        for (const slot of SLOTS) {
            const skills = listSkills(slot);
            let sOk = 0;
            let sFail = 0;
            for (const { key, id } of skills) {
                const r = tryGenerate(slot, id);
                total++;
                if (r.ok) {
                    ok++;
                    sOk++;
                } else {
                    sFail++;
                    failures.push({ slot: slot.name, key, id, reason: r.reason });
                }
            }
            perSlot[slot.name] = { total: skills.length, ok: sOk, failed: sFail };
        }

        // 失敗理由の集計（多い順）
        const reasonCounts = {};
        for (const f of failures) {
            reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
        }
        const topFailureReasons = Object.entries(reasonCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([reason, count]) => ({ reason, count }));

        const report = {
            note: 'FehBattleSimulator JS engine の全列挙スキル網羅地図（生成可否のみ。正しさ検証ではない）',
            grandTotal: total,
            ok,
            failed: total - ok,
            okRatePercent: total ? Number((ok / total * 100).toFixed(1)) : 0,
            perSlot,
            topFailureReasons,
            failures,
        };

        fs.mkdirSync(OUT_DIR, { recursive: true });
        fs.writeFileSync(
            path.join(OUT_DIR, 'coverage-report.json'),
            JSON.stringify(report, null, 2), 'utf8');

        // コンソールにサマリを出す
        console.log(`[golden-coverage] total=${total} ok=${ok} failed=${total - ok} (${report.okRatePercent}%)`);
        for (const [name, s] of Object.entries(perSlot)) {
            console.log(`  ${name.padEnd(9)}: ${s.ok}/${s.total} ok, ${s.failed} failed`);
        }
        if (topFailureReasons.length > 0) {
            console.log('  -- top failure reasons --');
            for (const r of topFailureReasons.slice(0, 10)) {
                console.log(`     x${r.count}: ${r.reason}`);
            }
        }

        // 地図づくりなので失敗があっても落とさない。最低限の健全性のみ確認。
        expect(total).toBeGreaterThan(0);
    }, 300000);
});
