
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
    this.damageCalc = new DamageCalculator();
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

  calcDamage(atkUnit, defUnit) {
    defUnit.battleContext.canCounterattack = this.__examinesCanCounterattackBasically(atkUnit, defUnit);
    atkUnit.battleContext.canFollowupAttack = this.damageCalc.examinesCanFollowupAttack(atkUnit, defUnit);
    defUnit.battleContext.canFollowupAttack = !atkUnit.battleContext.canFollowupAttack;

    let result = this.damageCalc.calc(atkUnit, defUnit);
    if (this.isLogEnabled) {
      console.log(this.damageCalc.rawLog);
    }
    this.damageCalc.clearLog();
    return result;
  }
}

function test_calcDamage(atkUnit, defUnit, isLogEnabled = false) {
  let calclator = new test_DamageCalculator();
  calclator.isLogEnabled = isLogEnabled;
  return calclator.calcDamage(atkUnit, defUnit);
}


/// 復讐のダメージ計算テストです。
test('DamageCalculatorVengeanceTest', () => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.special = Special.Fukusyu;
  atkUnit.specialCount = 2;

  defUnit.atkWithSkills = 51;
  defUnit.spdWithSkills = atkUnit.spdWithSkills - 5;

  let result = test_calcDamage(atkUnit, defUnit, true);

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