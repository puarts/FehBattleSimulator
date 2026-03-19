# Section 07 Interview Transcript

## User Decision: Add key missing tests

User chose to add important tests only, not full plan coverage.

### Items to add:
1. Distant Counter test (CombatFlow.test.js)
2. Improve Miracle test assertion
3. Remove duplicated basic damage tests from CombatFlow (already in DamageReduction)

### Auto-fixes:
- Remove duplicated "Damage equals" and "No damage" tests from CombatFlow.test.js basic section
- Improve Miracle test to better verify survival

### Let go:
- Guard3 vs Guard4 (both work)
- Attack order verification for Vantage/Desperation (not easily testable with current API)
- Canto, Beginning-of-turn Pulse (complex setup, low priority)
- Full damage reduction percentage/piercing tests (requires complex skill setup)
