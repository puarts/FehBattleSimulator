
test('BeginningOfTurnSkillHandler_StudiedForblaze', () => test_executeTest(() => {
    let handler = new test_BeginningOfTurnSkillHandler();
    handler.battleContext.currentTurn = 1;
    let unit = g_testHeroDatabase.createUnit("伝承リリーナ");
    expect(unit.specialCount).toBe(1);
    handler.applySkillsForBeginningOfTurn(unit);
    expect(unit.specialCount).toBe(0);
}));

test('BeginningOfTurnSkillHandler_Simple', () => test_executeTest(() => {
    let log = "";
    let handler = new test_BeginningOfTurnSkillHandler();
    let unit = g_testHeroDatabase.createUnit("アルフォンス");
    let allyUnit = g_testHeroDatabase.createUnit("アルフォンス");
    let enemyUnit = g_testHeroDatabase.createUnit("アルフォンス");
    let enemyAllyUnit = g_testHeroDatabase.createUnit("アルフォンス");
    handler.map.getTile(0, 2).setUnit(unit);
    handler.map.getTile(0, 0).setUnit(allyUnit);
    handler.map.getTile(2, 2).setUnit(enemyUnit);
    handler.map.getTile(2, 0).setUnit(enemyAllyUnit);
    handler.unitManager.units = [unit, unit, enemyUnit, enemyAllyUnit];

    // 全ての英雄のターン開始時スキルを実行して例外が出ない事を確認する
    using_(new ScopedStopwatch(x => log += `${g_testHeroDatabase.length}回のターン開始時スキル評価の時間: ${x} ms\n`), () => {
        unit.weaponRefinement = WeaponRefinementType.Special;
        for (let atkUnitInfo of g_testHeroDatabase.enumerateHeroInfos()) {
            g_testHeroDatabase.initUnit(unit, atkUnitInfo.name);
            handler.applySkillsForBeginningOfTurn(unit);
        }
    });

    return log;
}));
