# Section 05 Code Review Interview

## Finding: run_simple_test.sh and MergeTests.bat not updated (MEDIUM)
- **Decision**: User requested to update both files now, adding all split files from sections 02-05
- **Rationale**: "結合入口は都度同期" — keeping test entry points in sync avoids hard-to-diagnose "only broken in some environments" issues
- **Action**: Added `combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef`, `combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit`, `combat/DamageCalculatorWrapper_ApplySkillEffects`, `combat/DamageCalculatorWrapper_Spur`, `combat/DamageCalculatorWrapper_FollowupAndCounter` to both files in the correct load order

## Auto-fixes applied: None

## Other findings: All verified OK, no action needed
