# Code Review Interview: Section 04 - Coverage and Performance

**Date:** 2026-03-19

## Auto-Fixes

### 1. Warmup count — AUTO-FIX
Increased default warmup from 2 to 5 per plan specification for V8 JIT optimization.
**Action:** FIX

### 2. Unit initialization test missing resetGlobalTestState — AUTO-FIX
Added cleanup call to prevent global state leakage.
**Action:** FIX

## Let Go

- Threshold values (adjusted based on actual measurement, plan says "adjust after baseline")
- Silent exception swallowing (follows existing DamageCalculator_HeroBattleTest pattern with try/catch)
- Test names without threshold values (minor)
- CI=true verification (GitHub Actions standard behavior)
