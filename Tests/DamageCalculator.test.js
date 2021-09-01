
function test_createDefaultUnit(groupId = UnitGroupType.Ally) {
  let unit = new Unit("", "テストユニット", groupId);
  unit.placedTile = new Tile(0, 0);
  unit.maxHpWithSkills = 40;
  unit.hp = unit.maxHpWithSkills;
  unit.weapon = Weapon.SilverSwordPlus;
  unit.weaponType = WeaponType.Sword;
  unit.moveType = MoveType.Infantry;
  unit.atkWithSkills = 40;
  unit.spdWithSkills = 40;
  unit.defWithSkills = 30;
  unit.resWithSkills = 30;
  unit.createSnapshot();
  unit.saveCurrentHpAndSpecialCount();
  return unit;
}

/// テスト用のダメージ計算機です。
class test_DamageCalculator {
  constructor() {
    this.damageCalc = new DamageCalculatorWrapper();
    this.isLogEnabled = false;
  }

  __examinesCanCounterattackBasically(atkUnit, defUnit) {
    if (!defUnit.hasWeapon) {
      return false;
    }

    if (defUnit.battleContext.canCounterattackToAllDistance) {
      return true;
    }

    return atkUnit.attackRange == defUnit.attackRange;
  }

  __applyDamageReduction(atkUnit, defUnit) {
    // テスト用に一部スキルのみ実装しておく
    switch (defUnit.passiveB) {
      case PassiveB.Spurn3:
        {
          let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
          if (ratio > 0) {
            defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
          }
        }
        break;
    }

    if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
      let ratio = DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
      if (ratio > 0) {
        defUnit.battleContext.multDamageReductionRatio(ratio, atkUnit);
      }
    }

    switch (defUnit.special) {
      case Special.Otate:
        // この判定だと本当はダメだけどテスト用なので許容
        if (atkUnit.attackRange == 1) {
          defUnit.battleContext.damageReductionRatioBySpecial = 0.5;
        }
        break;
    }
  }

  calcDamage(atkUnit, defUnit) {
    this.__applyDamageReduction(atkUnit, defUnit);
    this.__applyDamageReduction(defUnit, atkUnit);

    let result = this.damageCalc.calcCombatResult(atkUnit, defUnit, false);
    if (this.isLogEnabled) {
      console.log(this.damageCalc.rawLog);
    }
    this.damageCalc.clearLog();
    atkUnit.hp = atkUnit.restHp;
    defUnit.hp = defUnit.restHp;
    return result;
  }
}

function test_calcDamage(atkUnit, defUnit, isLogEnabled = false) {
  let calclator = new test_DamageCalculator();
  calclator.isLogEnabled = isLogEnabled;
  return calclator.calcDamage(atkUnit, defUnit);
}

test('DamageCalculatorFollowupAttackTest', () => {
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
    let result = test_calcDamage(atkUnit, defUnit, true);
    expect(result.atkUnit_totalAttackCount).toBe(1);
    expect(result.defUnit_totalAttackCount).toBe(0);
  }
});

/// 奥義によるダメージ軽減テストです。
test('DamageCalculatorSpecialDamageReductionTest', () => {
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
});

/// ダメージ軽減テストです。
test('DamageCalculatorDamageReductionTest', () => {
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
});

/// 復讐のダメージ計算テストです。
test('DamageCalculatorVengeanceTest', () => {
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
});

/// シンプルなダメージ計算テストです。
test('DamageCalculatorSimple', () => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 30;
  defUnit.spdWithSkills = atkUnit.spdWithSkills - 5;

  let result = test_calcDamage(atkUnit, defUnit);

  expect(result.atkUnit_normalAttackDamage).toBe(10);
  expect(result.atkUnit_totalAttackCount).toBe(2);
});