

test('BeginningOfTurnSkillHandler_Simple', () => test_executeTest(() => {
    let log = "";
    let handler = new test_BeginningOfTurnSkillHandler();
    let heroDatabase = new test_HeroDatabase(
        heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
        passiveSInfos);

    let unit = heroDatabase.createUnit("アルフォンス");

    // 全ての英雄のターン開始時スキルを実行して例外が出ない事を確認する
    using(new ScopedStopwatch(x => log += `${heroDatabase.length}回のターン開始時スキル評価の時間: ${x} ms\n`), () => {
        unit.weaponRefinement = WeaponRefinementType.Special;
        for (let atkUnitInfo of heroDatabase.enumerateHeroInfos()) {
            heroDatabase.initUnit(unit, atkUnitInfo.name);
            handler.applySkillsForBeginningOfTurn(unit);
        }
    });

    return log;
}));
