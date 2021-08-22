
test('DamageCalculatorSimple', () => {
  let damageCalc = new DamageCalculator();
  let atkUnit = new Unit();
  let defUnit = new Unit();
  atkUnit.placedTile = new Tile(0, 0);
  defUnit.placedTile = new Tile(0, 0);
  let result = damageCalc.calc(atkUnit, defUnit);
  console.log(result);
  // expect(value).toBe(3);
});