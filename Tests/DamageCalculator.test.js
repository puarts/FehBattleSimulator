describe('Test feud skills', () => {
  beforeEach(() => {
    // _  0  1  2
    // 0    da
    // 1 au
    // 2 aa
    heroDatabase = g_testHeroDatabase;

    // 暗闘を持たせるアタッカー
    atkUnit = heroDatabase.createUnit("アルフォンス");
    atkUnit.atkWithSkills = 40;
    atkUnit.passiveA = PassiveA.None;
    atkUnit.placedTile.posX = 0;
    atkUnit.placedTile.posY = 1;

    // アタッカーへのバフ役(攻撃の紋章)
    atkAllyUnit = heroDatabase.createUnit("アルフォンス");
    atkAllyUnit.placedTile.posX = 0;
    atkAllyUnit.placedTile.posY = 2;

    // 攻撃対象へのバフ役(守備の紋章)
    defAllyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
    defAllyUnit.placedTile.posX = 1;
    defAllyUnit.placedTile.posY = 0;

    calclator = new test_DamageCalculator();
    calclator.isLogEnabled = false;
    g_appData = calclator.unitManager;
  });

  describe('Test disable skills from other enemies', () => {
    beforeEach(() => {
      // _  0  1  2
      // 0 du da
      // 1 au
      // 2 aa

      // 攻撃対象を設定
      defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
      defUnit.defWithSkills = 30;
      defUnit.spdWithSkills = 0;
      defUnit.placedTile.posX = 0;
      defUnit.placedTile.posY = 0;

      // 敵のバフ役に守備の紋章をセット
      defAllyUnit.passiveC = PassiveC.SpurDef3;

      calclator.unitManager.units = [atkUnit, atkAllyUnit, defUnit, defAllyUnit];
    });

    test('Test without disable skills', () => {
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      // 攻撃の紋章3
      expect(atkUnit.atkSpur).toBe(4);
      expect(atkUnit.atkWithSkills).toBe(40);

      // 守備の紋章3
      expect(defUnit.defSpur).toBe(4);
      expect(defUnit.defWithSkills).toBe(30);

      expect(result.atkUnit_normalAttackDamage).toBe((40 + 4) - (30 + 4));
    });

    test('Test ImpenetrableDark', () => {
      atkUnit.passiveC = PassiveC.ImpenetrableDark;

      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      // 攻撃の紋章3
      expect(atkUnit.atkSpur).toBe(4);
      expect(atkUnit.atkWithSkills).toBe(40);

      // 守備の紋章3が無効化
      expect(defUnit.defSpur).toBe(0);
      expect(defUnit.defWithSkills).toBe(30);

      expect(result.atkUnit_normalAttackDamage).toBe((40 + 4) - (30));
    });

    test('Test RedFeud3', () => {
      atkUnit.passiveC = PassiveC.RedFeud3;

      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      // 攻撃の紋章3
      expect(atkUnit.atkSpur).toBe(4);
      expect(atkUnit.atkWithSkills).toBe(40);

      // 守備の紋章3が無効化、かつ、暗闇で守備-4、
      expect(defUnit.defSpur).toBe(0 - 4);
      expect(defUnit.defWithSkills).toBe(30);

      expect(result.atkUnit_normalAttackDamage).toBe((40 + 4) - (30 - 4));
    });

    test('Test Queensblade', () => {
      atkUnit.weapon = Weapon.Queensblade;

      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      // Queensbladeのバフ
      expect(atkUnit.atkSpur).toBe(5);
      expect(atkUnit.spdSpur).toBe(5);
      expect(atkUnit.defSpur).toBe(5);
      expect(atkUnit.resSpur).toBe(5);
      expect(atkUnit.atkWithSkills).toBe(40);

      // 守備の紋章3が無効化
      expect(defUnit.defSpur).toBe(0);
      expect(defUnit.defWithSkills).toBe(30);

      let additionalDamage = Math.trunc((atkUnit.spdWithSkills + 5) * 0.2);
      expect(result.atkUnit_normalAttackDamage).toBe((40 + 5 + additionalDamage) - (30));
    });

    test('Test does not disable enemy skills', () => {
      atkUnit.passiveC = PassiveC.ImpenetrableDark;
      defUnit.passiveC = PassiveC.AtkSpdRein3;
      heroDatabase.updateUnitSkillInfo(defUnit);

      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      // 攻撃の紋章3とdefUnitの攻撃速さの牽制3
      expect(atkUnit.atkSpur).toBe(4 - 4);
      expect(atkUnit.spdSpur).toBe(-4);
      expect(atkUnit.atkWithSkills).toBe(40);

      // 守備の紋章3が無効化
      expect(defUnit.defSpur).toBe(0);
      expect(defUnit.defWithSkills).toBe(30);

      expect(result.atkUnit_normalAttackDamage).toBe((40 + 4 - 4) - (30));
    });
  });

  describe('Test disable skills from particular color', () => {
    beforeEach(() => {
      // _  0  1  2
      // 0 du da
      // 1 au da2
      // 2 aa
      calclator.isLogEnabled = false;
      // 攻撃対象に直接の暗闘対象ではない白のリフを設定
      defUnit = heroDatabase.createUnit("リフ", UnitGroupType.Enemy);
      defUnit.defWithSkills = 30;
      defUnit.spdWithSkills = 0;
      defUnit.placedTile.posX = 0;
      defUnit.placedTile.posY = 0;

      // 周囲の敵のバフ役に赤への暗闘の対象外の青のシャロンを設定
      defAllyUnit2 = heroDatabase.createUnit("シャロン", UnitGroupType.Enemy);
      defAllyUnit2.placedTile.posX = 1;
      defAllyUnit2.placedTile.posY = 1;

      // 敵のバフ役に牽制を持たせる
      defAllyUnit.passiveC = PassiveC.AtkSpdRein3;
      defAllyUnit2.passiveC = PassiveC.AtkSpdRein3;

      calclator.unitManager.units = [atkUnit, atkAllyUnit, defUnit, defAllyUnit, defAllyUnit2];
    });

    test('Test without disable skills', () => {
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);
      // 攻撃の紋章3、牽制x2
      expect(atkUnit.atkSpur).toBe(4 - 4 - 4);
      expect(atkUnit.spdSpur).toBe(- 4 - 4);
      expect(atkUnit.atkWithSkills).toBe(40);
      expect(atkUnit.spdWithSkills).toBe(27);

      // 攻撃対象にかかるバフがないこと
      expect(defUnit.defSpur).toBe(0);
      expect(defUnit.defWithSkills).toBe(30);

      // 暗闘効果が入らないこと
      expect(atkUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat).toBe(false);
      expect(atkUnit.battleContext.disablesSkillsFromRedEnemyAlliesInCombat).toBe(false);
      expect(atkUnit.battleContext.disablesSkillsFromBlueEnemyAlliesInCombat).toBe(false);
      expect(atkUnit.battleContext.disablesSkillsFromGreenEnemyAlliesInCombat).toBe(false);
      expect(result.atkUnit_normalAttackDamage).toBe(6);
    });

    test('Test RedFeud3', () => {
      atkUnit.passiveC = PassiveC.RedFeud3;
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      // 赤の敵アルフォンスからの牽制だけ無効になること
      // 攻撃の紋章3、牽制x1
      expect(atkUnit.atkSpur).toBe(4 - 4);
      expect(atkUnit.spdSpur).toBe(-4);
      expect(atkUnit.atkWithSkills).toBe(40);
      expect(atkUnit.spdWithSkills).toBe(27);

      // 攻撃対象にかかるバフがないこと
      expect(defUnit.defSpur).toBe(0);
      expect(defUnit.defWithSkills).toBe(30);

      // 赤の暗闘効果だけが入ること
      expect(atkUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat).toBe(false);
      expect(atkUnit.battleContext.disablesSkillsFromRedEnemyAlliesInCombat).toBe(true);
      expect(atkUnit.battleContext.disablesSkillsFromBlueEnemyAlliesInCombat).toBe(false);
      expect(atkUnit.battleContext.disablesSkillsFromGreenEnemyAlliesInCombat).toBe(false);

      expect(result.atkUnit_normalAttackDamage).toBe(10);
    });
  });

  describe('Test does not invalidate after combat ally skills', () => {
    beforeEach(() => {
      // _  0  1  2
      // 0 du da
      // 1 au
      // 2 aa

      // 攻撃対象を設定
      defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
      defUnit.defWithSkills = 30;
      defUnit.spdWithSkills = 0;
      defUnit.placedTile.posX = 0;
      defUnit.placedTile.posY = 0;

      calclator.unitManager.units = [atkUnit, atkAllyUnit, defUnit, defAllyUnit];
    });
    test('Test heal after combat', () => {
      // 幸福の良書
      defAllyUnit.weapon = Weapon.JoyousTome;
      atkUnit.passiveC = PassiveC.ImpenetrableDark;

      expect(defUnit.hp).toBe(45);
      calclator.updateAllUnitSpur();
      let result = calclator.calcDamage(atkUnit, defUnit);

      expect(atkUnit.atkSpur).toBe(4);
      expect(atkUnit.atkWithSkills).toBe(40);

      // 攻撃対象にかかるバフがないこと
      expect(defUnit.defSpur).toBe(0);
      expect(defUnit.defWithSkills).toBe(30);
      expect(result.atkUnit_normalAttackDamage).toBe(40 - 30 + 4);
      expect(result.atkUnit_totalAttackCount).toBe(2);
      expect(defUnit.hp).toBe(45 - 14 * 2);
      expect(defUnit.battleContext.healedHpAfterCombat).toBe(7);
    });
  });
});

// 無効系スキル
describe('Test invalidation skills', () => {
  beforeEach(() => {
    // _  0  1  2
    // 0 du
    // 1 au
    // 2 
    heroDatabase = g_testHeroDatabase;

    atkUnit = heroDatabase.createUnit("アルフォンス");
    atkUnit.atkWithSkills = 40;
    // 飛燕の一撃で速さを5以上差をつける
    atkUnit.passiveA = PassiveA.HienNoIchigeki3;
    atkUnit.placedTile.posX = 0;
    atkUnit.placedTile.posY = 1;

    defUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
    defUnit.atkWithSkills = 40;
    // 剣殺しで絶対追撃をつける
    defUnit.passiveB = PassiveB.Swordbreaker3;
    defUnit.placedTile.posX = 0;
    defUnit.placedTile.posY = 0;

    calclator = new test_DamageCalculator();
    calclator.isLogEnabled = false;

    calclator.unitManager.units = [atkUnit, atkAllyUnit, defUnit, defAllyUnit];
  });

  // 追撃操作無効
  describe('Test invalidates invalidation of followup attack', () => {
    // 絶対追撃
    test('Test followup attack', () => {
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_spd - result.defUnit_spd).toBe(6);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(2); // 剣殺しでの追撃
    });

    // 絶対追撃無効
    test('Test invalidates followup effect', () => {
      atkUnit.weapon = Weapon.TenteiNoKen;
      heroDatabase.updateUnitSkillInfo(atkUnit); // 奥義を変えた場合は奥義カウントをセットするために必要
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_spd - result.defUnit_spd).toBe(6);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(1); // 剣殺しでの絶対追撃を無効
    });
  });

  // 奥義カウント変動量操作無効
  describe('Test invalidates special cooldown charge fluctuation', () => {
    beforeEach(() => {
      defUnit.special = Special.Aether;
      heroDatabase.updateUnitSkillInfo(defUnit);
      defUnit.specialCount = defUnit.maxSpecialCount;
    });

    // 通常
    test('Test special cooldown charge = 1', () => {
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(2);
      expect(result.atkUnit_specialCount).toBe(0);
      expect(result.defUnit_specialCount).toBe(2);
    });

    // キャンセル
    test('Test inflicts special cooldown charge - 1 by Guard', () => {
      atkUnit.passiveB = PassiveB.Cancel3;
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(2);
      expect(result.atkUnit_specialCount).toBe(0);
      expect(result.defUnit_specialCount).toBe(5);
    });

    // 呼吸
    test('Test grants special cooldown charge + 1 perattack by Breath', () => {
      defUnit.passiveA = PassiveA.DartingBreath;
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(2);
      expect(result.atkUnit_specialCount).toBe(0);
      expect(result.defUnit_specialCount).toBe(0);
    });

    // 拍節
    test('Test Tempo invalidates Guard', () => {
      atkUnit.passiveB = PassiveB.Cancel3;
      defUnit.passiveB = PassiveB.AtkResTempo3;
      // 剣殺しが外れるので飛燕の構えと切り返しをつけ他のテストと攻撃回数を合わせる
      defUnit.passiveA = PassiveA.HienNoKamae3;
      defUnit.passiveS = PassiveB.QuickRiposte3;
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(2);
      expect(result.atkUnit_specialCount).toBe(0);
      expect(result.defUnit_specialCount).toBe(2);
    });
    test('Test Tempo invalidates Breath', () => {
      atkUnit.passiveB = PassiveB.AtkResTempo3;
      defUnit.passiveA = PassiveA.DartingBreath;
      let result = test_calcDamage(atkUnit, defUnit, false);
      expect(result.atkUnit_totalAttackCount).toBe(1);
      expect(result.defUnit_totalAttackCount).toBe(2);
      expect(result.atkUnit_specialCount).toBe(0);
      expect(result.defUnit_specialCount).toBe(2);
    });
  });
});

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
  // 錬成などで武器が変わることがあるので銀の斧に固定する
  // 銀の斧
  saverUnit.weapon = 122;

  let calclator = new test_DamageCalculator();
  calclator.isLogEnabled = false;
  calclator.unitManager.units = [atkUnit, defUnit, saverUnit];

  // 錬成などで値が変わることがあるので固定する
  atkUnit.atkWithSkills = 51;
  saverUnit.defWithSkills = 45;
  let result = calclator.calcDamage(atkUnit, defUnit);

  let atackerAtk = (atkUnit.atkWithSkills + 6) + Math.floor((atkUnit.atkWithSkills + 6) * 0.2);
  let saverDef = saverUnit.defWithSkills + 4 + 6;
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

  /** @type {Unit} */
  let atkUnit = null;
  /** @type {Unit} */
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
  using_(new ScopedStopwatch(x => log += `${heroDatabase.length}回の戦闘の時間: ${x} ms\n`), () => {
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

      atkUnit.hp = atkUnit.maxHpWithSkills;
      defUnit.hp = defUnit.maxHpWithSkills;
      calclator.calcDamage(defUnit, atkUnit, false);
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

/// 加算ダメージテスト
describe('Test for additional damage calculation', () => {
  /** @type {Unit} */
  let atkUnit;
  /** @type {Unit} */
  let defUnit;
  beforeEach(() => {
    atkUnit = test_createDefaultUnit();
    atkUnit.atkWithSkills = 0;
    atkUnit.spdWithSkills = 0;
    atkUnit.special = Special.BlazingFlame;
    atkUnit.specialCount = 0;
    atkUnit.maxHpWithSkills = 99;
    atkUnit.healFull();

    defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
    defUnit.weapon = Weapon.None;
    defUnit.maxHpWithSkills = 99;
    defUnit.healFull();
    defUnit.spdWithSkills = 0;
  });

  test('HeartbrokerBow', () => {
    atkUnit.weapon = Weapon.HeartbrokerBow; // 全ステ+5、速さの15%加算
    atkUnit.spdWithSkills = 45;

    defUnit.defWithSkills = 5;

    let result = test_calcDamage(atkUnit, defUnit, false);

    // trunc(45 * 0.15) = 6 になるはず
    expect(result.preCombatDamage).toBe(6);

    // trunc((45 + 5) * 0.15) = 7 になるはず
    expect(result.atkUnit_normalAttackDamage).toBe(7);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.damageHistory[0].damageDealt).toBe(7);
    expect(result.damageHistory[1].damageDealt).toBe(7);
  });

  test('FreebladesEdge', () => {
    atkUnit.weapon = Weapon.FreebladesEdge; // 全ステ+8、守備の15%加算、絶対追撃
    atkUnit.weaponRefinement = WeaponRefinementType.Special_Hp3;
    atkUnit.defWithSkills = 42;

    defUnit.defWithSkills = 8;

    let result = test_calcDamage(atkUnit, defUnit, false);

    // trunc(42 * 0.15) = 6 になるはず
    expect(result.preCombatDamage).toBe(6);

    // trunc((42 + 8) * 0.15) = 7 になるはず
    expect(result.atkUnit_normalAttackDamage).toBe(7);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.damageHistory[0].damageDealt).toBe(7);
    expect(result.damageHistory[1].damageDealt).toBe(7);
  });

  test('Aymr', () => {
    atkUnit.weapon = Weapon.Aymr; // 敵の攻撃、守備-11、攻撃の15%加算
    atkUnit.weaponRefinement = WeaponRefinementType.Special_Hp3;
    atkUnit.atkWithSkills = 50;
    atkUnit.spdWithSkills = 5;

    defUnit.defWithSkills = 50;
    defUnit.spdWithSkills = 0;

    let result = test_calcDamage(atkUnit, defUnit, false);

    // trunc(50 * 0.15) = 7 になるはず
    expect(result.preCombatDamage).toBe(7);

    // 11 + trunc(50 * 0.15) = 18 になるはず
    expect(result.atkUnit_normalAttackDamage).toBe(18);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.damageHistory[0].damageDealt).toBe(18);
    expect(result.damageHistory[1].damageDealt).toBe(18);
  });


  test('HadoNoSenfu', () => {
    atkUnit.weapon = Weapon.HadoNoSenfu; // 全ステ+8、攻撃の10%加算、絶対追撃
    atkUnit.weaponRefinement = WeaponRefinementType.Special_Hp3;
    atkUnit.atkWithSkills = 42;
    atkUnit.spdWithSkills = 0;

    defUnit.defWithSkills = 50;
    defUnit.spdWithSkills = 8;

    let result = test_calcDamage(atkUnit, defUnit, false);

    // trunc(42 * 0.10) = 4 になるはず
    expect(result.preCombatDamage).toBe(4);

    // trunc(50 * 0.10) = 5 になるはず
    expect(result.atkUnit_normalAttackDamage).toBe(5);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.damageHistory[0].damageDealt).toBe(5);
    expect(result.damageHistory[1].damageDealt).toBe(5);
  });

  test('HurricaneDagger', () => {
    atkUnit.weapon = Weapon.HurricaneDagger; // 攻撃、速さ+10、速さが敵より高ければダメージ5加算
    atkUnit.weaponRefinement = WeaponRefinementType.Special_Hp3;
    atkUnit.atkWithSkills = 0;
    atkUnit.spdWithSkills = 1;

    defUnit.defWithSkills = 10;
    defUnit.spdWithSkills = 0;

    let result = test_calcDamage(atkUnit, defUnit, false);

    expect(result.preCombatDamage).toBe(5);

    expect(result.atkUnit_normalAttackDamage).toBe(5);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.damageHistory[0].damageDealt).toBe(5);
    expect(result.damageHistory[1].damageDealt).toBe(5);
  });

  test('FathersSonAxe', () => {
    // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、敵の攻撃、守備-5、自分が与えるダメージ+戦闘開始時の自分のHPの15%(戦闘前奥義も含む)、戦闘後、自分は、7回復
    atkUnit.weapon = Weapon.FathersSonAxe;
    atkUnit.weaponRefinement = WeaponRefinementType.Special_Hp3;
    const weaponInfo = new SkillInfo();
    weaponInfo.attackCount = 2;
    atkUnit.weaponInfo = weaponInfo;

    atkUnit.atkWithSkills = 0;
    atkUnit.spdWithSkills = 5;
    atkUnit.specialCount = 0;

    defUnit.defWithSkills = 5;
    defUnit.spdWithSkills = 0;

    let result = test_calcDamage(atkUnit, defUnit, true);

    // trunc(99 * 0.15) = 14
    expect(result.preCombatDamage).toBe(14);
    expect(result.atkUnit_normalAttackDamage).toBe(14);
    expect(result.atkUnit_totalAttackCount).toBe(4);
    expect(result.damageHistory[0].damageDealt).toBe(14);
    expect(result.damageHistory[1].damageDealt).toBe(14);
    expect(result.damageHistory[2].damageDealt).toBe(14);
    expect(result.damageHistory[3].damageDealt).toBe(14);
  });

  test('Misteruthin', () => {
    atkAllyUnit = test_createDefaultUnit();
    atkAllyUnit.placedTile.posX = 0;
    atkAllyUnit.placedTile.posY = 2;

    atkUnit.weapon = Weapon.Misteruthin; // 攻撃、速さ+10、奥義発動時、ダメージ+自分のHP減少量(最大30)
    atkUnit.weaponRefinement = WeaponRefinementType.Special_Hp3;
    atkUnit.atkWithSkills = 0;
    atkUnit.spdWithSkills = 0;
    atkUnit.specialCount = 0;
    atkUnit.maxSpecialCount = 2;
    atkUnit.special = Special.Glimmer;
    atkUnit.takeDamage(40);

    defUnit.defWithSkills = 10;
    defUnit.spdWithSkills = 5;

    let result = test_calcDamageWithUnits(atkUnit, defUnit, [atkAllyUnit], false);

    expect(result.preCombatDamage).toBe(0);
    expect(result.atkUnit_normalAttackDamage).toBe(0);
    expect(result.atkUnit_totalAttackCount).toBe(2);
    expect(result.damageHistory[0].damageDealt).toBe(30);
    expect(result.damageHistory[1].damageDealt).toBe(0);
  });

  test('PoeticJustice', () => {
    atkUnit.weaponType = WeaponType.Staff;
    atkUnit.passiveB = PassiveB.PoeticJustice; // 敵の速さ-4、敵の攻撃の15%加算
    atkUnit.passiveBInfo = new SkillInfo();
    atkUnit.passiveBInfo.wrathfulStaff = true;
    atkUnit.atkWithSkills = 0;
    atkUnit.spdWithSkills = 5;

    defUnit.atkWithSkills = 50;
    defUnit.spdWithSkills = 0;
    defUnit.resWithSkills = 0;

    {
      const result = test_calcDamage(atkUnit, defUnit, false);

      expect(atkUnit.battleContext.canActivateWrathfulStaff()).toBe(true);

      // trunc(50 * 0.15) = 7 になるはず
      expect(result.atkUnit_normalAttackDamage).toBe(7);
      expect(result.atkUnit_totalAttackCount).toBe(2);
      expect(result.damageHistory[0].damageDealt).toBe(7);
      expect(result.damageHistory[1].damageDealt).toBe(7);
    }

    // 「杖は他の武器同様のダメージ計算になる」が無効化された場合は、加算後に杖のダメージ計算が適用
    {
      defUnit.passiveB = PassiveB.SeimeiNoGofu3;

      const result = test_calcDamage(atkUnit, defUnit, false);

      expect(atkUnit.battleContext.canActivateWrathfulStaff()).toBe(false);
      expect(result.atkUnit_normalAttackDamage).toBe(3);
      expect(result.atkUnit_totalAttackCount).toBe(2);
      expect(result.damageHistory[0].damageDealt).toBe(3);
      expect(result.damageHistory[1].damageDealt).toBe(3);
    }
  });
});


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
/// ダメージ軽減を半分無効にするスキルのテスト
describe('Test to reduce the percentage of foe\'s non-Special "reduce damage by X%" skills', () => {
  beforeEach(() => {
    atkUnit = test_createDefaultUnit();
    defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
    atkUnit.atkWithSkills = 40;
    atkUnit.passiveB = PassiveB.MagNullFollow; // ダメージ軽減を半分無効
    defUnit.defWithSkills = 30;
    defUnit.weapon = Weapon.None;
    defUnit.passiveB = PassiveB.Spurn3;
    defUnit.addStatusEffect(StatusEffectType.Dodge);
    atkUnit.spdWithSkills = defUnit.spdWithSkills - 20; // 確実に回避が出るようにする
  });

  test('Test to reduce 50%', () => {
    let result = test_calcDamage(atkUnit, defUnit, false);

    // 回避が重複してるので40%軽減、そこに軽減値を50%軽減する効果が入ると最終的に36%軽減になるはず
    let reductionRatio = 0.4 * 0.5;
    let actualReductionRatio = roundFloat(1 - (1 - reductionRatio) * (1 - reductionRatio));
    expect(actualReductionRatio).toBe(0.36);
    expect(atkUnit.atkWithSkills).toBe(40);
    expect(defUnit.defWithSkills).toBe(30);
    expect(result.atkUnit_normalAttackDamage).toBe(10);
    expect(defUnit.currentDamage).toBe(7);
    expect(defUnit.currentDamage).toBe(result.atkUnit_normalAttackDamage - Math.trunc(result.atkUnit_normalAttackDamage * actualReductionRatio));
  });

  test('Test to reduce 50% x 2', () => {
    atkUnit.passiveS = PassiveB.MagNullFollow; // ダメージ軽減を半分無効をもう一つ追加
    let result = test_calcDamage(atkUnit, defUnit, false);

    // 回避が重複してるので40%軽減、そこに軽減値を50%軽減する効果が2回入ると最終的に19%軽減になるはず
    let reductionRatio = 0.4 * 0.5 * 0.5;
    let actualReductionRatio = roundFloat(1 - (1 - reductionRatio) * (1 - reductionRatio));
    expect(actualReductionRatio).toBe(0.19);
    expect(result.atkUnit_normalAttackDamage).toBe(10);
    expect(defUnit.currentDamage).toBe(9);
    expect(defUnit.currentDamage).toBe(result.atkUnit_normalAttackDamage - Math.trunc(result.atkUnit_normalAttackDamage * actualReductionRatio));
  });
});

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
    expect(atkUnit.battleContext.hasSpecialActivated).toBe(true);
    expect(result.preCombatDamage).toBe(1);
  }
}));

describe('Test great talent', () => {
  beforeEach(() => {
    heroDatabase = g_testHeroDatabase;

    atkUnit = heroDatabase.createUnit("アルフォンス");
    atkUnit.atkWithSkills = 40;
    atkUnit.setGreatTalent(STATUS_INDEX.Atk, 6);
    atkUnit.passiveA = PassiveA.None;
    atkUnit.placedTile.posX = 0;
    atkUnit.placedTile.posY = 1;

    defAllyUnit = heroDatabase.createUnit("アルフォンス", UnitGroupType.Enemy);
    defUnit.defWithSkills = 30;
    defUnit.setGreatTalent(STATUS_INDEX.Def, 4);
    defAllyUnit.placedTile.posX = 1;
    defAllyUnit.placedTile.posY = 0;

    calclator = new test_DamageCalculator();
    calclator.isLogEnabled = false;
    g_appData = calclator.unitManager;
  });

  test('Test great talent applied', () => {
    calclator.updateAllUnitSpur();
    let result = calclator.calcDamage(atkUnit, defUnit);

    expect(atkUnit.atkWithSkills).toBe(40);
    expect(atkUnit.getAtkInPrecombat()).toBe(40 + 6);
    expect(atkUnit.getAtkInCombat(defUnit)).toBe(40 + 6);
    expect(defUnit.defWithSkills).toBe(30);
    expect(defUnit.getDefInPrecombat()).toBe(30 + 4);
    expect(defUnit.getDefInCombat(atkUnit)).toBe(30 + 4);
    expect(result.atkUnit_normalAttackDamage).toBe(40 + 6 - 30 - 4);
  });
});

test('DamageCalculator_CreateSnapshot', () => test_executeTest(() => {
  let atkUnit = test_createDefaultUnit();
  atkUnit.restHp = atkUnit.maxHpWithSkills;
  let snapshot = atkUnit.createSnapshot();
  atkUnit.restHp = 1;
  expect(atkUnit.restHp).toBe(1);
  expect(snapshot.restHp).toBe(40);
}));
