/**
 * @file Unit.js — UnitCore / UnitBattle / UnitSkillEffect の facade。
 * 既存の import { Unit } from './Unit.js' が引き続き動作する後方互換レイヤー。
 */

// UnitCore: クラス定義・基本プロパティ・状態管理
export {
    Unit, AttackableUnitInfo, AttackEvaluationContext,
    AssistableUnitInfo, ActionContext, PrecombatContext, UnitUtil,
    isThief, calcArenaBaseStatusScore, calcArenaTotalSpScore, calcBuffAmount, canRefreshTo,
} from './UnitCore.js';

// UnitBattle: 戦闘関連メソッド（prototype 拡張、副作用 import）
import './UnitBattle.js';

// UnitSkillEffect: Layer 5 依存メソッド（init 関数パターン）
export { initUnitSkillEffects, calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor } from './UnitSkillEffect.js';
