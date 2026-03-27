# Section 05 Code Review Interview

## Finding 1: Deploy.bat encoding change (Shift-JIS → UTF-8)
**Decision**: Restore to Shift-JIS
**Action**: Restored original file from git HEAD and re-applied path changes using Edit tool to preserve encoding.

## Finding 2: DamageCalculator.html AudioManager.js duplication
**Decision**: Keep as-is (pre-existing, out of scope for this refactoring)

## Auto-fixes applied:
- UnitBuilder line in Deploy.bat: removed spurious space before "Structures" (`, Structures` → `,map\Structures`)
