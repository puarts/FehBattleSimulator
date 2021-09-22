const g_heroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
    passiveSInfos);

test('BeginningOfTurnSkillHandler_StudiedForblaze', () => test_executeTest(() => {
    let handler = new test_BeginningOfTurnSkillHandler();
    handler.battleContext.currentTurn = 1;
    let unit = g_heroDatabase.createUnit("伝承リリーナ");
    expect(unit.specialCount).toBe(1);
    handler.applySkillsForBeginningOfTurn(unit);
    expect(unit.specialCount).toBe(0);
}));

test('BeginningOfTurnSkillHandler_Simple', () => test_executeTest(() => {
    let log = "";
    let handler = new test_BeginningOfTurnSkillHandler();
    let unit = g_heroDatabase.createUnit("アルフォンス");

    // 全ての英雄のターン開始時スキルを実行して例外が出ない事を確認する
    using(new ScopedStopwatch(x => log += `${g_heroDatabase.length}回のターン開始時スキル評価の時間: ${x} ms\n`), () => {
        unit.weaponRefinement = WeaponRefinementType.Special;
        for (let atkUnitInfo of g_heroDatabase.enumerateHeroInfos()) {
            g_heroDatabase.initUnit(unit, atkUnitInfo.name);
            handler.applySkillsForBeginningOfTurn(unit);
        }
    });

    return log;
}));
