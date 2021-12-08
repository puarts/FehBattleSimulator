const g_testHeroDatabase = new test_HeroDatabase(
  heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
  passiveSInfos);

test('DamageCalculator_FeudTest', () => test_executeTest(() => {
  let heroDatabase = g_testHeroDatabase;
  let atkUnit = heroDatabase.createUnit("アルフォンス");
  atkUnit.atkWithSkills = 40;
  atkUnit.passiveA = PassiveA.None;
  atkUnit.placedTile.posX = 0;
  atkUnit.placedTile.posY = 1;

  let atkAllyUnit = heroDatabase.createUnit("アルフォンス");
  atkUnit.placedTile.posX = 0;
  atkUnit.placedTile.posY = 2;

  let calclator = new test_DamageCalculator();
  calclator.isLogEnabled = false;

  let enemyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
  enemyUnit.placedTile.posX = 1;
  enemyUnit.placedTile.posY = 0;

  // 周囲の敵の全てのスキルを無効にするテスト
  {
    let defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
    enemyUnit.passiveC = PassiveC.SpurDef3;
    defUnit.defWithSkills = 30;
    defUnit.spdWithSkills = 0;
    defUnit.placedTile.posX = 0;
    defUnit.placedTile.posY = 0;

    calclator.unitManager.units = [atkUnit, atkAllyUnit, defUnit, enemyUnit];

    // 暗闇なしでテスト
    {
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);
      expect(result.atkUnit_normalAttackDamage).toBe(10);
    }

    // 暗闇で守備-4、かつ、守備の紋章3が無効化
    atkUnit.passiveC = PassiveC.RedFeud3;
    {
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);
      expect(result.atkUnit_normalAttackDamage).toBe(18);
    }
  }

  // 周囲の特定の色の敵の効果だけを無効にするテスト
  {
    calclator.isLogEnabled = false;
    let defUnit = heroDatabase.createUnit("リフ", UnitGroupType.Enemy);
    let enemyUnit2 = heroDatabase.createUnit("シャロン", UnitGroupType.Enemy);
    enemyUnit2.placedTile.posX = 1;
    enemyUnit2.placedTile.posY = 1;

    enemyUnit.passiveC = PassiveC.AtkSpdRein3;
    enemyUnit2.passiveC = PassiveC.AtkSpdRein3;
    defUnit.defWithSkills = 30;
    defUnit.spdWithSkills = 0;
    defUnit.placedTile.posX = 0;
    defUnit.placedTile.posY = 0;

    calclator.unitManager.units = [atkUnit, atkAllyUnit, defUnit, enemyUnit, enemyUnit2];

    atkUnit.passiveC = PassiveC.None;

    // 暗闇なしでテスト
    {
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);
      expect(result.atkUnit_normalAttackDamage).toBe(6);
    }

    // 攻撃速さの牽制3の片方だけが無効化
    atkUnit.passiveC = PassiveC.RedFeud3;
    {
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);
      expect(result.atkUnit_normalAttackDamage).toBe(10);
    }
  }
}));

/// 無属性有利のテスト
test('DamageCalculator_ColorlessAdvantageousTest', () => test_executeTest(() => {
  let heroDatabase = g_testHeroDatabase;
  let atkUnit = heroDatabase.createUnit("闇リオン");
  atkUnit.atkWithSkills = 40;

  // 対無属性
  {
    let defUnit = heroDatabase.createUnit("クロード", UnitGroupType.Enemy);
    defUnit.resWithSkills = 30;
    defUnit.spdWithSkills = 0;

    let result = test_calcDamage(atkUnit, defUnit, false);

    expect(result.atkUnit_normalAttackDamage).toBe(18);
    expect(result.atkUnit_totalAttackCount).toBe(2);
  }

  // 無属性以外の相性なし
  {
    let defUnit = heroDatabase.createUnit("マリク", UnitGroupType.Enemy);
    defUnit.resWithSkills = 30;
    defUnit.spdWithSkills = 0;

    let result = test_calcDamage(atkUnit, defUnit, false);

    expect(result.atkUnit_normalAttackDamage).toBe(10);
    expect(result.atkUnit_totalAttackCount).toBe(2);
  }

}));

/// 護り手のテストです。
test('DamageCalculator_SaverSkillTest', () => test_executeTest(() => {
  let heroDatabase = g_testHeroDatabase;

  let atkUnit = heroDatabase.createUnit("アルフォンス");
  let defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
  let saverUnit = heroDatabase.createUnit("ドゥドゥー", UnitGroupType.Enemy);
  atkUnit.placedTile.posX = 0;
  atkUnit.placedTile.posY = 1;

  defUnit.placedTile.posX = 0;
  defUnit.placedTile.posY = 0;
  saverUnit.placedTile.posX = 1;
  saverUnit.placedTile.posY = 0;

  let calclator = new test_DamageCalculator();
  calclator.isLogEnabled = false;
  calclator.unitManager.units = [atkUnit, defUnit, saverUnit];

  let result = calclator.calcDamage(atkUnit, defUnit);

  let atackerAtk = (atkUnit.atkWithSkills + 6) + Math.floor((atkUnit.atkWithSkills + 6) * 0.2);
  let saverDef = saverUnit.defWithSkills + 4 + 5 + 6;
  expect(result.atkUnit_normalAttackDamage).toBe(atackerAtk - saverDef);
  expect(result.atkUnit_totalAttackCount).toBe(2);

  if (calclator.isLogEnabled) {
    console.log(calclator.damageCalc.log);
  }
  calclator.damageCalc.clearLog();
}));

test('DamageCalculator_HeroBattleTest', () => test_executeTest(() => {
  let log = "";
  let heroDatabase = g_testHeroDatabase;

  // アルフォンスのデフォルト状態の戦闘結果がGUI上と同じ計算結果になる事を確認
  let atkUnit = null;
  let defUnit = null;
  {
    atkUnit = heroDatabase.createUnit("アルフォンス");
    defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_normalAttackDamage).toBe(25);
    expect(result.atkUnit_totalAttackCount).toBe(1);
  }
  let atkAllyUnit = new Unit("", "atkAlly", UnitGroupType.Ally);
  let defAllyUnit = new Unit("", "defAlly", UnitGroupType.Enemy);

  // 全ての英雄で戦闘を行って例外が出ない事を確認する
  using(new ScopedStopwatch(x => log += `${heroDatabase.length}回の戦闘の時間: ${x} ms\n`), () => {
    let calclator = new test_DamageCalculator();
    calclator.map.getTile(0, 2).setUnit(atkUnit);
    calclator.map.getTile(0, 0).setUnit(defUnit);
    calclator.map.getTile(2, 2).setUnit(atkAllyUnit);
    calclator.map.getTile(2, 0).setUnit(defAllyUnit);
    calclator.unitManager.units = [atkUnit, defUnit, atkAllyUnit, defAllyUnit];
    calclator.isLogEnabled = false;
    // calclator.disableProfile();

    atkUnit.weaponRefinement = WeaponRefinementType.Special;
    defUnit.weaponRefinement = WeaponRefinementType.Special;
    for (let atkUnitInfo of heroDatabase.enumerateHeroInfos()) {
      heroDatabase.initUnit(atkUnit, atkUnitInfo.name);

      let defUnitInfo = atkUnitInfo;
      heroDatabase.initUnit(defUnit, defUnitInfo.name);
      calclator.calcDamage(atkUnit, defUnit, false);
    }

    log += calclator.getProfileLog();
  });
  return log;
}));

/// 守備、魔防低い方を参照するテスト
test('DamageCalculator_ReferencingMinOfDefOrResTest', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.weaponType = WeaponType.Breath;
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 20;
  defUnit.resWithSkills = 30;
  {
    defUnit.weaponType = WeaponType.ColorlessDagger;
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_normalAttackDamage).toBe(20);
  }
  {
    defUnit.weaponType = WeaponType.Sword;
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_normalAttackDamage).toBe(10);
  }
}));

test('DamageCalculator_DebuffBladeTest', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 46;
  defUnit.applyAllDebuff(-6);
  {
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_normalAttackDamage).toBe(0);
  }

  {
    atkUnit.weapon = Weapon.Blizard;
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_normalAttackDamage).toBe(6 * 4);
  }
}));

test('DamageCalculator_FollowupAttackTest', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  {
    atkUnit.spdWithSkills = 40;
    defUnit.spdWithSkills = 35;
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.defUnit_totalAttackCount).toBe(1);
  }
  {
    atkUnit.spdWithSkills = 40;
    defUnit.spdWithSkills = 36;
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_totalAttackCount).toBe(1);
    expect(result.defUnit_totalAttackCount).toBe(1);
  }

  {
    defUnit.weaponType = WeaponType.RedTome;
    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(result.atkUnit_totalAttackCount).toBe(1);
    expect(result.defUnit_totalAttackCount).toBe(0);
  }
}));

/// 奥義によるダメージ軽減テストです。
test('DamageCalculator_SpecialDamageReductionTest', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.posX = 1; // 奥義発動時の射程計算に必要
  defUnit.weapon = Weapon.None;
  defUnit.special = Special.Otate;
  defUnit.specialCount = 0;
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 30;

  let result = test_calcDamage(atkUnit, defUnit, false);

  expect(result.atkUnit_normalAttackDamage).toBe(10);
  expect(result.atkUnit_totalAttackCount).toBe(1);
  let actualReductionRatio = 0.5;
  expect(defUnit.currentDamage).toBe(
    result.atkUnit_normalAttackDamage - Math.trunc(result.atkUnit_normalAttackDamage * actualReductionRatio));
}));

/// ダメージ軽減テストです。
test('DamageCalculator_DamageReductionTest', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial = 0.5;
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 30;
  defUnit.weapon = Weapon.None;
  defUnit.passiveB = PassiveB.Spurn3;
  defUnit.addStatusEffect(StatusEffectType.Dodge);
  atkUnit.spdWithSkills = defUnit.spdWithSkills - 10;

  let result = test_calcDamage(atkUnit, defUnit, false);

  // 回避が重複してるので40%軽減、そこに軽減値を50%軽減する効果が入ると最終的に36%軽減になるはず
  let reductionRatio = 0.4 * atkUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial;
  let actualReductionRatio = roundFloat(1 - (1 - reductionRatio) * (1 - reductionRatio));
  expect(actualReductionRatio).toBe(0.36);
  expect(defUnit.currentDamage).toBe(result.atkUnit_normalAttackDamage - Math.trunc(result.atkUnit_normalAttackDamage * actualReductionRatio));
}));

/// 復讐のダメージ計算テストです。
test('DamageCalculator_VengeanceTest', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.special = Special.Fukusyu;
  atkUnit.battleContext.selfDamageDealtRateToAddSpecialDamage = getSelfDamageDealtRateToAddSpecialDamage(atkUnit.special);
  atkUnit.specialCount = 2;

  defUnit.atkWithSkills = 51;
  defUnit.spdWithSkills = atkUnit.spdWithSkills - 5;

  let result = test_calcDamage(atkUnit, defUnit, false);

  expect(result.atkUnit_normalAttackDamage).toBe(10);
  expect(result.atkUnit_totalAttackCount).toBe(2);
  expect(result.defUnit_normalAttackDamage).toBe(21);
  expect(result.defUnit_totalAttackCount).toBe(1);

  let specialDamage = Math.trunc(result.defUnit_normalAttackDamage * result.defUnit_totalAttackCount * 0.5);
  let normalAttackDamage = result.atkUnit_normalAttackDamage * result.atkUnit_totalAttackCount;
  let actualDamageDealt = defUnit.maxHpWithSkills - defUnit.restHp;
  expect(actualDamageDealt - normalAttackDamage).toBe(specialDamage);
}));

/// シンプルなダメージ計算テストです。
test('DamageCalculator_Simple', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 30;
  defUnit.spdWithSkills = atkUnit.spdWithSkills - 5;
  {
    let result = test_calcDamage(atkUnit, defUnit, false);

    expect(result.atkUnit_normalAttackDamage).toBe(10);
    expect(result.atkUnit_totalAttackCount).toBe(2);
  }

  // 色相性のテスト
  {
    atkUnit.weaponType = WeaponType.Sword;
    defUnit.weaponType = WeaponType.Axe;
    let result = test_calcDamage(atkUnit, defUnit, false);

    expect(result.atkUnit_normalAttackDamage).toBe(18);
    expect(result.atkUnit_totalAttackCount).toBe(2);
  }

}));

test('DamageCalculator_RangedSpecial', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.special = Special.BlazingFlame;
  atkUnit.maxSpecialCount = 4;
  atkUnit.specialCount = 0;
  atkUnit.atkWithSkills = 40;

  defUnit.passiveB = PassiveB.Vantage3;
  defUnit.defWithSkills = 30;
  defUnit.resWithSkills = 39;

  // 範囲奥義も守備魔防の低い方を参照することをテスト
  atkUnit.weaponType = WeaponType.RedBreath;
  defUnit.weaponType = WeaponType.ColorlessDagger;
  defUnit.passiveA = PassiveA.CloseCounter;

  {
    let result = test_calcDamage(atkUnit, defUnit, false);

    // 待ち伏せが発動して攻撃を受けた側から攻撃するはず
    expect(result.damageHistory[0].attackUnit).toBe(defUnit);

    expect(defUnit.currentDamage).toBe(25);
    expect(result.preCombatDamage).toBe(15);
    expect(result.atkUnit_normalAttackDamage).toBe(10);
    expect(result.atkUnit_totalAttackCount).toBe(1);
  }

  // 生命の護符の効果で戦闘前奥義発動時に「敵の守備か魔防の低い方でダメージ計算」を無効化できるかテスト
  {
    defUnit.passiveS = PassiveB.SeimeiNoGofu3;
    atkUnit.specialCount = 0;
    atkUnit.healFull();
    defUnit.healFull();

    let result = test_calcDamage(atkUnit, defUnit, false);
    expect(atkUnit.battleContext.isSpecialActivated).toBe(true);
    expect(result.preCombatDamage).toBe(1);
  }
}));

test('DamageCalculator_CreateSnapshot', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  atkUnit.restHp = atkUnit.maxHpWithSkills;
  let snapshot = atkUnit.createSnapshot();
  atkUnit.restHp = 1;
  expect(atkUnit.restHp).toBe(1);
  expect(snapshot.restHp).toBe(40);
}));
