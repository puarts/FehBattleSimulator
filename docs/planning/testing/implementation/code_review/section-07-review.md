# Section 07 Code Review: Combat Logic Tests

## Missing Plan Requirements

### 1. DamageReduction.test.js misnamed
The file tests basic damage calculation and buffs/debuffs, not percentage-based damage reduction, fixed reduction, stacking, or piercing. The plan's damage reduction mechanics are absent.

### 2. StatusEffect.test.js gaps
Missing: Feud skills, Style effects, Cancel status. Deep Wounds test is trivial (only checks addStatusEffect/hasStatusEffect, no healing prevention validation).

### 3. CombatFlow.test.js gaps
Missing: Distant Counter, post-combat healing, Canto.

### 4. SpecialCount.test.js gaps
Missing: Beginning-of-turn Pulse test.

### 5. All FEH edge cases omitted
AoE+Vantage, Desperation HP timing, Phantom Spd, Triangle Adept, Cancel Affinity — none implemented.

## Test Quality Issues

### 6. Miracle test makes weak assertions
Only checks defUnit_totalAttackCount=1 (surviving defender counters), but doesn't directly verify Miracle activation or HP=1.

### 7. Vantage/Desperation tests don't verify attack ORDER
They check attack counts but not that the ORDER changed (Vantage = defender first, Desperation = double-before-counter).

### 8. Deep Wounds test trivial
Only `addStatusEffect`/`hasStatusEffect` check, no combat healing prevention.

### 9. Duplicated tests across files
Basic damage calc and buff/debuff tests appear in multiple files.

### 10. Test count gap
~35 tests vs plan estimate of ~105.

## Positive Notes
- create_tests.sh already registered
- Structural pattern correct (beforeEach, createDummy, BattleScenarioBuilder)
- Follow-up boundary tests (4 vs 5 spd diff) well done
- Guaranteed vs Prevention interaction covered
