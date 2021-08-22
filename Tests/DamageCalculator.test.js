
function createTestUnit() {
  let unit = new Unit();
  unit.placedTile = new Tile(0, 0);
  return unit;
}

test('DamageCalculatorSimple', () => {
  let damageCalc = new DamageCalculator();
  let atkUnit = createTestUnit();
  let defUnit = createTestUnit();
  atkUnit.atkWithSkills = 40;
  atkUnit.spdWithSkills = 30;
  defUnit.resWithSkills = 30;
  defUnit.defWithSkills = 30;
  defUnit.spdWithSkills = 30;
  let result = damageCalc.calc(atkUnit, defUnit);
  console.log(damageCalc.rawLog);
  expect(result.atkUnit_normalAttackDamage).toBe(10);
});