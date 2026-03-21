#!/usr/bin/env node
/**
 * Unit.js を UnitCore.js / UnitBattle.js / UnitSkillEffect.js に分割するスクリプト。
 * 使い方: node scripts/split-unit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const UNIT_JS = path.join(ROOT, 'Sources', 'Unit.js');
const src = fs.readFileSync(UNIT_JS, 'utf-8');
const lines = src.split('\n');

// ─── Layer 5 import line numbers (1-based) ───
const LAYER5_IMPORT_LINES = new Set([16, 17, 18]);

// ─── Category C method names (Layer 5 dependent) ───
const CATEGORY_C = new Set([
    'activateCantoIfPossible', 'addStatusEffect',
    'canActivatePass', 'canActivateObstructToAdjacentTiles',
    'canActivateObstructToTilesWithin2Spaces',
    'cannotMoveThroughSpacesWithin2SpacesOfUnit',
    'cannotMoveThroughSpacesWithin3SpacesOfUnit',
    'endActionBySkillEffect', 'endActionByStatusEffect', 'applyEndActionSkills',
    'getColorWhenDeterminingWeaponTriangle', 'attackRangeOnMap',
    '__getEvalStatsAdd',
    'enumerateActuallyAttackableUnitAndTiles',
    'hasPathfinderEffect', 'calcMoveCountForCanto',
    'grantsAnotherActionAfterCombat', 'grantsAnotherActionAfterCombatExceptOwnSkills',
    'grantsAnotherActionOnAssist',
    'deactivateStyleAfterAction', 'hasAvailableStyleButCannotActivate',
]);

// ─── Category B method names (Battle) ───
// NOTE: __createSnapshotImpl stays in A because it accesses private fields
const CATEGORY_B = new Set([
    'createSnapshotIfNull', 'createSnapshot', 'deleteSnapshot',
    'addAllSpur', 'addSpurs', 'addAtkSpdSpurs', 'addAtkDefSpurs', 'addAtkResSpurs',
    'addSpdDefSpurs', 'addSpdResSpurs', 'addDefResSpurs', 'addSpursWithoutAtk',
    'addSpursWithoutSpd', 'addSpursWithoutDef', 'addSpursWithoutRes',
    'getSpurs', 'spurs',
    'resetSpurs', 'copySpursToSnapshot',
    '__getBuffInCombat', 'getAtkBuffInCombat', 'getSpdBuffInCombat',
    'getResBuffInCombat', 'getDefBuffInCombat',
    'getBuffsInPreCombat', 'getBuffsInCombat', 'getBuffsEnemyDebuffsInCombat',
    '__getStatusInCombat', 'getStatusesInCombat', 'getEvalStatusesInCombat',
    'getHighestStatusInCombat',
    'getAtkInCombat', 'getSpdInCombat', 'getDefInCombat', 'getResInCombat',
    'getAtkDebuffInCombat', 'getSpdDebuffInCombat', 'getDefDebuffInCombat', 'getResDebuffInCombat',
    '__getAtkInCombatWithoutBuff', '__getSpdInCombatWithoutBuff',
    '__getDefInCombatWithoutBuff', '__getResInCombatWithoutBuff',
    'getEvalAtkInCombat', 'getEvalSpdInCombat', 'getEvalSpdInPrecombat',
    'getEvalAtkInPrecombat', 'getEvalDefInPrecombat', 'getEvalDefInCombat',
    'getEvalResInCombat', 'getEvalResInPrecombat',
    'getEvalResDiffInCombat', 'getEvalResDiffInPrecombat',
    'getSpdInPrecombatWithoutDebuff', 'getSpdInPrecombat',
    'getAtkInPrecombatWithoutDebuff', 'getAtkInPrecombat',
    'getStatusesInPrecombat', 'getEvalStatusesInPrecombat',
    'getDefInPrecombatWithoutDebuff', 'getDefInPrecombat', 'getDefDiffInCombat',
    'getResInPrecombatWithoutDebuff', 'getResInPrecombat',
    'isHigherOrEqualAtkInCombat', 'isLowerOrEqualDefInPrecombat',
    'isLowerOrEqualDefInCombat', 'isHigherOrEqualAtkInPrecombat',
    'isHigherDefInPrecombat', 'isHigherOrEqualDefInPrecombat',
    'isHigherResInPrecombat', 'isHigherOrEqualResInPrecombat',
    'isLowerResInPrecombat', 'isHigherResInCombat',
    'isHigherSpdInCombat', 'isHigherOrEqualSpdInCombat', 'isHigherOrEqualResInCombat',
    '__getEvalDefAdd', '__getEvalResAdd', '__getEvalAtkAdd', '__getEvalSpdAdd',
    'getTriangleAdeptAdditionalRatio', 'neutralizesSelfTriangleAdvantage',
    'reversesTriangleAdvantage', '__getBuffMultiply',
    'takeDamageInCombat', 'healInCombat', 'calculateReducedHealAmountInCombat', 'hasDeepWounds',
    'canCounterAttackToAllDistance', 'canInvalidateSpecifiedEffectiveAttack',
    'canInvalidateWrathfulStaff', 'canDisableAttackOrderSwapSkill',
    'initBattleContext', 'canActivatePrecombatSpecial', 'hasPrecombatSpecial',
    'getBuffTotalInPreCombat', 'getBuffTotalInCombat', 'getDebuffTotalInCombat',
    'getDebuffsInCombat', 'isBuffedInCombat',
]);

const C_STANDALONE = new Set(['calcHealAmount', 'isDebufferTier1', 'isDebufferTier2', 'isAfflictor']);
const B_STANDALONE = new Set(['calcBuffAmount']);

// ─── Method def regex ───
const METHOD_DEF_RE = /^    (?:(static)\s+)?(?:(get|set)\s+)?(\*\s*)?([#a-zA-Z_][\w]*)\s*\(/;
const STATIC_FIELD_RE = /^    static\s+([A-Z_a-z][\w]*)\s*=/;
const PRIVATE_FIELD_RE = /^    (#[\w]+)\s*=/;

// ─── Parse class ───
let classStart = -1, classEnd = -1;
for (let i = 0; i < lines.length; i++) {
    if (/^class Unit extends BattleMapElement \{/.test(lines[i])) { classStart = i; break; }
}
{ let d = 0; for (let i = classStart; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') d++; if (ch === '}') { d--; if (d === 0) { classEnd = i; break; } } }
    if (classEnd >= 0) break;
}}

// Parse members with brace-tracking
const members = [];
let i = classStart + 1;
while (i < classEnd) {
    const line = lines[i];
    const mMatch = line.match(METHOD_DEF_RE);
    const sfMatch = line.match(STATIC_FIELD_RE);
    const pfMatch = line.match(PRIVATE_FIELD_RE);

    if (!mMatch && !sfMatch && !pfMatch) { i++; continue; }

    let name, isStatic = false, accessor = null, isGenerator = false, type = 'method';
    if (mMatch) {
        isStatic = !!mMatch[1]; accessor = mMatch[2] || null;
        isGenerator = !!mMatch[3]; name = mMatch[4];
    } else if (sfMatch) { name = sfMatch[1]; isStatic = true; type = 'static-field'; }
    else { name = pfMatch[1]; type = 'private-field'; }

    const defStart = i;

    // Find end by brace tracking
    let endLine = i;
    if (type === 'private-field') {
        endLine = i; // single line
    } else {
        let d = 0, foundOpen = false;
        for (let k = i; k < classEnd; k++) {
            for (const ch of lines[k]) {
                if (ch === '{') { d++; foundOpen = true; }
                if (ch === '}') { d--; if (foundOpen && d === 0) { endLine = k; break; } }
            }
            if (foundOpen && d === 0) break;
            // Static field without braces
            if (!foundOpen && k === i && type === 'static-field' && lines[k].includes(';')) { endLine = k; break; }
        }
        // Static field with object literal
        if (!foundOpen && type === 'static-field') {
            let d2 = 0;
            for (let k = i; k < classEnd; k++) {
                for (const ch of lines[k]) { if (ch === '{') d2++; if (ch === '}') d2--; }
                endLine = k;
                if (d2 <= 0 && (lines[k].includes(';') || lines[k].trimEnd().endsWith('}'))) break;
            }
        }
    }

    members.push({ name, defStart, endLine, isStatic, accessor, isGenerator, type });
    i = endLine + 1;
}

// Parse standalone functions/classes
const standalones = [];
for (let i = 0; i < lines.length; i++) {
    if (i >= classStart && i <= classEnd) continue;
    const fMatch = lines[i].match(/^function\s+(\w+)/);
    const cMatch = lines[i].match(/^class\s+(\w+)/);
    if (!fMatch && !cMatch) continue;
    const name = (fMatch || cMatch)[1];
    let d = 0, endLine = i;
    for (let k = i; k < lines.length; k++) {
        for (const ch of lines[k]) { if (ch === '{') d++; if (ch === '}') { d--; if (d === 0) { endLine = k; break; } } }
        if (d === 0 && endLine > i) break;
    }
    standalones.push({ name, defStart: i, endLine, isClass: !!cMatch });
    i = endLine;
}

// Categorize
const catA = [], catB = [], catC = [];
for (const m of members) {
    if (CATEGORY_C.has(m.name)) catC.push(m);
    else if (CATEGORY_B.has(m.name)) catB.push(m);
    else catA.push(m);
}
const saA = [], saB = [], saC = [];
for (const s of standalones) {
    if (C_STANDALONE.has(s.name)) saC.push(s);
    else if (B_STANDALONE.has(s.name)) saB.push(s);
    else saA.push(s);
}

console.log(`Cat A: ${catA.length}, Cat B: ${catB.length}, Cat C: ${catC.length}`);

// ─── Helpers ───
// Get lines with leading JSDoc//// comments
function getMemberWithComment(m) {
    let commentStart = m.defStart;
    let j = m.defStart - 1;
    // Skip blank lines
    while (j > classStart && lines[j].trim() === '') j--;
    // Check for comment
    if (j > classStart) {
        const t = lines[j].trim();
        if (t.endsWith('*/')) {
            // Multi-line JSDoc: scan back to /**
            while (j > classStart && !lines[j].trim().startsWith('/**')) j--;
            commentStart = j;
        } else if (t.startsWith('///')) {
            // Single-line /// comments
            while (j > classStart && lines[j].trim().startsWith('///')) j--;
            commentStart = j + 1;
        }
    }
    return { commentStart, ...m };
}

function getStandaloneWithComment(s) {
    let commentStart = s.defStart;
    let j = s.defStart - 1;
    while (j >= 0 && lines[j].trim() === '') j--;
    if (j >= 0) {
        const t = lines[j].trim();
        if (t.endsWith('*/')) {
            while (j > 0 && !lines[j].trim().startsWith('/**')) j--;
            commentStart = j;
        } else if (t.startsWith('///')) {
            while (j > 0 && lines[j].trim().startsWith('///')) j--;
            commentStart = j + 1;
        }
    }
    return { commentStart, ...s };
}

/**
 * Convert class method to prototype assignment with correct indentation.
 * Body lines have 4-space class indent removed, then re-indented with 4 spaces.
 */
function toPrototype(m, cls = 'Unit') {
    const cm = getMemberWithComment(m);
    const commentLines = lines.slice(cm.commentStart, m.defStart);
    const defLine = lines[m.defStart];
    const bodyLines = lines.slice(m.defStart + 1, m.endLine); // exclude first { and last }
    const result = [];

    // Un-indent comments from class level
    for (const cl of commentLines) {
        result.push(cl.replace(/^    /, ''));
    }

    // Un-indent body from class level (remove 4 leading spaces)
    const unindentedBody = bodyLines.map(l => l.startsWith('        ') ? l.slice(4) : l.replace(/^    /, ''));

    if (m.accessor === 'get') {
        const match = defLine.match(/^\s*get\s+(\w+)\(\)\s*\{/);
        if (match) {
            result.push(`Object.defineProperty(${cls}.prototype, '${match[1]}', {`);
            result.push(`    get: function() {`);
            for (const bl of unindentedBody) result.push(bl);
            result.push(`    },`);
            result.push(`    configurable: true,`);
            result.push(`});`);
            return result;
        }
    } else if (m.accessor === 'set') {
        const match = defLine.match(/^\s*set\s+(\w+)\((\w+)\)\s*\{/);
        if (match) {
            result.push(`Object.defineProperty(${cls}.prototype, '${match[1]}', {`);
            result.push(`    set: function(${match[2]}) {`);
            for (const bl of unindentedBody) result.push(bl);
            result.push(`    },`);
            result.push(`    configurable: true,`);
            result.push(`});`);
            return result;
        }
    } else if (m.isGenerator) {
        const match = defLine.match(/^\s*\*\s*(\w+)\((.*?)\)\s*\{/);
        if (match) {
            result.push(`${cls}.prototype.${match[1]} = function*(${match[2]}) {`);
            for (const bl of unindentedBody) result.push(bl);
            result.push(`};`);
            return result;
        }
    } else {
        const match = defLine.match(/^\s*(\w+)\((.*?)\)\s*\{/);
        if (match) {
            result.push(`${cls}.prototype.${match[1]} = function(${match[2]}) {`);
            for (const bl of unindentedBody) result.push(bl);
            result.push(`};`);
            return result;
        }
    }

    console.warn(`WARN: Could not convert ${m.name}`);
    return lines.slice(m.defStart, m.endLine + 1);
}

// ─── Generate UnitCore.js ───
function genUnitCore() {
    const out = [];
    // Determine line ranges to skip (B/C standalone, export lines)
    const skipRanges = [...saB, ...saC].map(s => {
        const sc = getStandaloneWithComment(s);
        return [sc.commentStart, s.endLine];
    });
    const exportStart = lines.findIndex(l => /^export \{/.test(l));

    // Pre-class lines (imports + standalone functions)
    for (let i = 0; i < classStart; i++) {
        if (LAYER5_IMPORT_LINES.has(i + 1)) continue;
        if (skipRanges.some(([s, e]) => i >= s && i <= e)) continue;
        out.push(lines[i]);
    }

    // Class opening
    out.push(lines[classStart]);

    // Category A members (with comments)
    for (const m of catA) {
        const cm = getMemberWithComment(m);
        out.push('');
        for (let i = cm.commentStart; i <= m.endLine; i++) out.push(lines[i]);
    }

    // Add _addStatusEffectRaw helper for UnitSkillEffect.js
    out.push('');
    out.push('    /**');
    out.push('     * addStatusEffectの内部実装（#statusEffectsへの追加）。');
    out.push('     * @param {number} statusEffectType');
    out.push('     */');
    out.push('    _addStatusEffectRaw(statusEffectType) {');
    out.push('        if (!this.hasStatusEffect(statusEffectType)) {');
    out.push('            this.#statusEffects.push(statusEffectType);');
    out.push('        }');
    out.push('    }');

    out.push(lines[classEnd]); // }

    // Category A standalone (only those AFTER the class — pre-class ones are already included)
    for (const s of saA) {
        if (s.defStart < classStart) continue; // already in pre-class section
        const sc = getStandaloneWithComment(s);
        out.push('');
        for (let i = sc.commentStart; i <= s.endLine; i++) out.push(lines[i]);
    }

    out.push('');
    out.push("export { Unit, AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext, PrecombatContext, UnitUtil };");
    out.push("export { isThief, calcArenaBaseStatusScore, calcArenaTotalSpScore, canRefreshTo };");

    return out.join('\n');
}

// ─── Generate UnitBattle.js ───
function genUnitBattle() {
    const out = [];
    out.push("import { Unit } from './UnitCore.js';");
    out.push('');
    out.push('// ─── 戦闘関連メソッド（prototype 拡張） ───');
    out.push('// Layer 5 への依存なし。');
    out.push('');

    for (const m of catB) {
        out.push('');
        for (const l of toPrototype(m)) out.push(l);
    }

    for (const s of saB) {
        const sc = getStandaloneWithComment(s);
        out.push('');
        for (let i = sc.commentStart; i <= s.endLine; i++) out.push(lines[i]);
    }

    if (saB.length > 0) {
        out.push('');
        out.push(`export { ${saB.map(s => s.name).join(', ')} };`);
    }

    return out.join('\n');
}

// ─── Generate UnitSkillEffect.js ───
function genUnitSkillEffect() {
    const out = [];
    out.push("import { NodeEnv } from './SkillEffectEnv.js';");
    out.push("import { IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, IS_AFFLICTOR_HOOKS, CALC_HEAL_AMOUNT_HOOKS } from './SkillEffectHooks.js';");
    out.push("import { getSkillLogLevel } from './SkillEffect.js';");
    out.push("import { LoggerBase } from './Logger.js';");
    out.push("import { getSkillFunc } from './Skill.js';");
    out.push("import { applySkillsAfterCantoActivatedFuncMap, applyEndActionSkillsFuncMap } from './Skill.js';");
    out.push("import { isMeleeWeaponType } from './Skill.js';");
    out.push("import { calcMoveCountForCantoFuncMap } from './Skill.js';");
    out.push('');
    out.push('/**');
    out.push(' * Unit.prototype にスキル効果関連メソッドを追加する初期化関数。');
    out.push(' * エントリーポイントから明示的に呼び出す必要がある。');
    out.push(' * @param {typeof import("./UnitCore.js").Unit} UnitClass');
    out.push(' */');
    out.push('export function initUnitSkillEffects(UnitClass) {');

    for (const m of catC) {
        out.push('');
        const protoLines = toPrototype(m, 'UnitClass');

        // Special handling: addStatusEffect uses #statusEffects → use _addStatusEffectRaw
        const adjusted = protoLines.map(l => {
            if (m.name === 'addStatusEffect') {
                return l.replace('this.#statusEffects.push(statusEffectType)', 'this._addStatusEffectRaw(statusEffectType)');
            }
            return l;
        });

        for (const l of adjusted) {
            out.push(l === '' ? '' : '    ' + l);
        }
    }

    out.push('}');

    for (const s of saC) {
        const sc = getStandaloneWithComment(s);
        out.push('');
        for (let i = sc.commentStart; i <= s.endLine; i++) out.push(lines[i]);
    }

    out.push('');
    out.push(`export { ${saC.map(s => s.name).join(', ')} };`);

    return out.join('\n');
}

// ─── Write files ───
const coreStr = genUnitCore();
const battleStr = genUnitBattle();
const skillStr = genUnitSkillEffect();

fs.writeFileSync(path.join(ROOT, 'Sources', 'UnitCore.js'), coreStr);
fs.writeFileSync(path.join(ROOT, 'Sources', 'UnitBattle.js'), battleStr);
fs.writeFileSync(path.join(ROOT, 'Sources', 'UnitSkillEffect.js'), skillStr);

console.log(`\n✓ UnitCore.js: ${coreStr.split('\n').length} lines`);
console.log(`✓ UnitBattle.js: ${battleStr.split('\n').length} lines`);
console.log(`✓ UnitSkillEffect.js: ${skillStr.split('\n').length} lines`);

// Verify no Layer 5 refs in UnitCore.js
const coreL5 = coreStr.split('\n').filter((l, idx) => {
    if (l.trim().startsWith('*') || l.trim().startsWith('//')) return false; // skip comments
    return /\bNodeEnv\b/.test(l) || /\bgetSkillLogLevel\b/.test(l) ||
        /from\s+['"]\.\/SkillEffectEnv\.js/.test(l) ||
        /from\s+['"]\.\/SkillEffectHooks\.js/.test(l) ||
        /from\s+['"]\.\/SkillEffect\.js/.test(l);
});
if (coreL5.length > 0) {
    console.error('\n⚠ UnitCore.js has Layer 5 refs:');
    for (const l of coreL5) console.error('  ' + l.trim());
} else {
    console.log('✓ UnitCore.js has no Layer 5 references');
}

// Verify no Layer 5 refs in UnitBattle.js
const battleL5 = battleStr.split('\n').filter(l => {
    if (l.trim().startsWith('*') || l.trim().startsWith('//')) return false;
    return /\bNodeEnv\b/.test(l) || /\bgetSkillLogLevel\b/.test(l);
});
if (battleL5.length > 0) {
    console.error('⚠ UnitBattle.js has Layer 5 refs:');
    for (const l of battleL5) console.error('  ' + l.trim());
} else {
    console.log('✓ UnitBattle.js has no Layer 5 references');
}

// Verify no private field access outside UnitCore.js
const battlePrivate = battleStr.split('\n').filter(l => /#(hpAdd|statuses|statusEffects)/.test(l));
if (battlePrivate.length > 0) {
    console.error('⚠ UnitBattle.js has private field access:');
    for (const l of battlePrivate) console.error('  ' + l.trim());
} else {
    console.log('✓ UnitBattle.js has no private field access');
}

const skillPrivate = skillStr.split('\n').filter(l => /#(hpAdd|statuses|statusEffects)/.test(l));
if (skillPrivate.length > 0) {
    console.error('⚠ UnitSkillEffect.js has private field access:');
    for (const l of skillPrivate) console.error('  ' + l.trim());
} else {
    console.log('✓ UnitSkillEffect.js has no private field access');
}
