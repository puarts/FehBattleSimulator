// Sources/StatusConstants.js
// Layer 1: ステータス関連定数

/**
 * @enum {number}
 */
const StatusEffectType = {
    None: -1,
    Panic: 0, // 強化反転
    Gravity: 1, // 移動制限
    MobilityIncreased: 2, // 移動値加算
    CounterattacksDisrupted: 3, // 反撃不可付与
    TriangleAdept: 4, // 相性激化
    Guard: 5, // キャンセル
    AirOrders: 6, // 曲技付与(周囲2マスの味方の隣接マスに移動可能, UnitCanMoveToASpaceAdjacentToAnyAllyWithin2Spaces)
    EffectiveAgainstDragons: 7, // 竜特効付与
    Isolation: 8, // 補助不可
    BonusDoubler: 9, // 強化増幅
    ShieldArmor: 10, // 重装特効無効
    TotalPenaltyDamage: 11, // 敵弱化ダメージ+(Dominance)
    ResonantBlades: 12, // 双界効果・刃
    Desperation: 13, // 攻め立て
    ResonantShield: 14, // 双界効果・盾
    Vantage: 15, // 待ち伏せ
    DeepWounds: 16, // 回復不可
    FallenStar: 17, // 落星
    ShieldFlying: 18, // 飛行特効無効
    FollowUpAttackMinus: 19, // 追撃不可
    Dodge: 20, // 回避
    TriangleAttack: 21, // トライアングルアタック
    FollowUpAttackPlus: 22, // 自分から攻撃した時、絶対追撃
    NullPanic: 23, // 見切り・パニック
    Stall: 24, // 空転
    CancelAffinity: 25, // 相性相殺
    NullFollowUp: 26, // 見切り・追撃
    Pathfinder: 27, // 天駆の道
    FalseStart: 28, // ターン開始スキル不可
    NeutralizesFoesBonusesDuringCombat: 29, // 敵の強化の+を無効
    GrandStrategy: 30, // 神軍師の策
    CantoControl: 31, // 再移動制限
    EnGarde: 32, // 戦闘外ダメージ無効
    SpecialCooldownChargePlusOnePerAttack: 33, // 戦闘中、奥義発動カウント変動量+1
    Treachery: 34, // 強化ダメージ+
    WarpBubble: 35, // 敵ワープ抑制
    Charge: 36, // 突撃
    Exposure: 37, // 弱点露呈
    ShieldDragon: 38, // 竜特効
    Canto1: 39, // 再移動(1)
    FoePenaltyDoubler: 40, // 敵弱化増幅
    Undefended: 41, // 護られ不可
    Feud: 42, // 暗闘
    DualStrike: 43, // デュアルアタック
    UnitCannotBeSlowedByTerrain: 44, // 自身が移動可能な地形を平地のように移動可能
    ReduceDamageFromAreaOfEffectSpecialsBy80Percent: 45, // 受けた範囲奥義のダメージを80%軽減
    NeutralizesPenalties: 46, // 弱化を無効
    Hexblade: 47, // 魔刃
    Sabotage: 48, // 混乱
    Discord: 49, // 不和
    AssignDecoy: 50, // 囮指名
    RallySpectrum: 51, // 七色の叫び
    DeepStar: 52, // 真落星
    Ploy: 53, // 謀策
    Schism: 54, // 連携阻害
    NeutralizeUnitSurvivesWith1HP: 55, // 奥義以外の祈り無効
    TimesGate: 56, // 時の門
    Incited: 57, // 奮激
    ReducesDamageFromFirstAttackBy40Percent: 58, // 自分から攻撃した時、最初に受けた攻撃のダメージを40%軽減
    ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent: 59, // 「ダメージを〇〇%軽減」を半分無効
    TimesGrip: 60, // 時の陥穽
    AfterStartOfTurnSkillsTriggerActionEndsImmediately: 61, // ターン開始後スキル発動後、即座に行動終了
    HushSpectrum: 62, // 七色の囁き
    EssenceDrain: 63, // エーギル奪取
    ShareSpoils: 64, // 戦果移譲
    Frozen: 65, // 凍結
    Bonded: 66, // 縁
    Bulwark: 67, // 防壁
    DivineNectar: 68, // 神獣の蜜
    Paranoia: 69, // 被害妄想
    Gallop: 70, // 迅走
    Anathema: 71, // 赤の呪い
    FutureWitness: 72, // 未来を知るもの
    Dosage: 73, // 毒も薬に、薬も毒に
    Empathy: 74, // 多感
    DivinelyInspiring: 75, // 神竜の結束
    PreemptPulse: 76, // 初撃の鼓動
    IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat: 77, // 戦闘中、敵の追撃の速さ条件+10
    PotentFollow: 78, // 神速追撃
    Salvage: 79, // 七難即滅
    DraconicHex: 80, // 竜呪
    FireEmblem: 81, // 炎の紋章
    FellSpirit: 82, // 邪竜気
    UnitMakesAGuaranteedFollowUpAttackDuringCombat: 83, // 戦闘中、絶対追撃
    Imbue: 84, // 治癒
    Reflex: 85, // 反射
    ShareSpoilsPlus: 86, // 戦果移譲・広域
    ForesightSnare: 87, // 予知の罠
    ProfsGuidance: 88, // 師の導き
    FringeBonus: 89, // 真強化増幅
    MagicTwinSave: 90, // 護り手・魔・双
    SpdShackle: 91, // 速さの枷
    ResShackle: 92, // 魔防の枷
    CreationPulse: 93, // 開闢の鼓動
    ChangeOfFate: 94, // 運命を変える
    DefShackle: 95, // 守備の枷
    Range2Style: 96, // スタイル・射程2
    AssignDecoyTwin: 97, // 囮指名・双
    RadiantHero: 98, // 蒼炎の勇者
    TrueCharge: 99, // 真突撃
    AtkLiberate: 100, // 攻撃の解放
    ResLiberate: 101, // 魔防の解放
    TrulyIncited: 102, // 真奮激
    SpdLiberate: 103, // 速さの解放
    Coax: 104, // おねだり
    PhysicalTwinSave: 105, // 護り手・理・双
    // 1. STATUS_EFFECT_INFO_MAPに画像パスと名前、表記を登録する
    // 2. 不利なステータス異常の場合はNEGATIVE_STATUS_EFFECT_SETに登録すること
    // 3. POSITIVE_STATUS_EFFECT_ARRAYまたはNEGATIVE_STATUS_EFFECT_ARRAYに登録すること
};

const POSITIVE_STATUS_EFFECT_ARRAY = [
// 双界効果・刃
    StatusEffectType.ResonantBlades,
// 双界効果・盾
    StatusEffectType.ResonantShield,
    // TODO: 正しい順序に修正する
    StatusEffectType.AtkLiberate,
    StatusEffectType.SpdLiberate,
    StatusEffectType.ResLiberate,
// 七色の叫び
    StatusEffectType.RallySpectrum,
    // 奮激
    StatusEffectType.Incited,
    // 真奮激
    StatusEffectType.TrulyIncited,
// 強化増幅
    StatusEffectType.BonusDoubler,
    // 真強化増幅
    StatusEffectType.FringeBonus,
    // 敵弱化増幅
    StatusEffectType.FoePenaltyDoubler,
// 神軍師の策
    StatusEffectType.GrandStrategy,
// 未来を知るもの
    StatusEffectType.FutureWitness,
// 毒も薬に、薬も毒に
    StatusEffectType.Dosage,
// 多感
    StatusEffectType.Empathy,
// 神竜の結束
    StatusEffectType.DivinelyInspiring,
    // 七難即滅
    StatusEffectType.Salvage,
// 赤の呪い
    StatusEffectType.Anathema,
    // 竜呪
    StatusEffectType.DraconicHex,
    // 炎の紋章
    StatusEffectType.FireEmblem,
    // 邪竜気
    StatusEffectType.FellSpirit,
    // 師の導き
    StatusEffectType.ProfsGuidance,
    // 運命を変える!
    StatusEffectType.ChangeOfFate,
    // 蒼炎の勇者
    StatusEffectType.RadiantHero,
// 強化ダメージ+
    StatusEffectType.Treachery,
// 敵弱化ダメージ+
    StatusEffectType.TotalPenaltyDamage,
// 受けた範囲奥義のダメージを80％軽減
    StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent,
// 回避
    StatusEffectType.Dodge,
// 自分から攻撃した時、最初に受けた攻撃のダメージを40％軽減
    StatusEffectType.ReducesDamageFromFirstAttackBy40Percent,
// 落星
    StatusEffectType.FallenStar,
// 真落星
    StatusEffectType.DeepStar,
    // 反射
    StatusEffectType.Reflex,
// 敵の強化の+を無効
    StatusEffectType.NeutralizesFoesBonusesDuringCombat,
// 弱化を無効
    StatusEffectType.NeutralizesPenalties,
// 戦闘外ダメージ無効
    StatusEffectType.EnGarde,
// 見切り・パニック
    StatusEffectType.NullPanic,
// 見切り・追撃効果
    StatusEffectType.NullFollowUp,
// 敵の奥義以外のスキルによる「ダメージを〇〇％軽減」を半分無効
    StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent,
// 敵ワープ抑制
    StatusEffectType.WarpBubble,
// 神獣の蜜
    StatusEffectType.DivineNectar,
    // 治癒
    StatusEffectType.Imbue,
// 竜特効
    StatusEffectType.EffectiveAgainstDragons,
// 竜特効無効
    StatusEffectType.ShieldDragon,
// 重装特効無効
    StatusEffectType.ShieldArmor,
// 飛行特効無効
    StatusEffectType.ShieldFlying,
// 移動+1
    StatusEffectType.MobilityIncreased,
// 迅走
    StatusEffectType.Gallop,
    // 突撃
    StatusEffectType.Charge,
    // 真突撃
    StatusEffectType.TrueCharge,
// 天駆の道
    StatusEffectType.Pathfinder,
// 再移動(1)
    StatusEffectType.Canto1,
// 自分が移動可能な地形を平地のように移動可能
    StatusEffectType.UnitCannotBeSlowedByTerrain,
// 周囲2マス以内の味方の隣接マスに移動可能
    StatusEffectType.AirOrders,
// 時の門
    StatusEffectType.TimesGate,
// 魔刃
    StatusEffectType.Hexblade,
// 戦闘中、奥義発動カウント変動量+1
    StatusEffectType.SpecialCooldownChargePlusOnePerAttack,
// 初撃の鼓動
    StatusEffectType.PreemptPulse,
    // 開闢の鼓動
    StatusEffectType.CreationPulse,
// 自分から攻撃時、絶対追撃
    StatusEffectType.FollowUpAttackPlus,
    // 戦闘中、絶対追撃
    StatusEffectType.UnitMakesAGuaranteedFollowUpAttackDuringCombat,
    // 追撃不可
    StatusEffectType.FollowUpAttackMinus,
// 戦闘中、敵の追撃の速さ条件+10
    StatusEffectType.IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat,
// 神速追撃
    StatusEffectType.PotentFollow,
// 攻め立て
    StatusEffectType.Desperation,
// 待ちぶせ
    StatusEffectType.Vantage,
// 被害妄想
    StatusEffectType.Paranoia,
// 防壁
    StatusEffectType.Bulwark,
    // 囮指名
    StatusEffectType.AssignDecoy,
    // 囮指名・双
    StatusEffectType.AssignDecoyTwin,
    // 護り手・魔・双
    StatusEffectType.MagicTwinSave,
    // 護り手・理・双
    StatusEffectType.PhysicalTwinSave,
// 相性相殺
    StatusEffectType.CancelAffinity,
// トライアングルアタック
    StatusEffectType.TriangleAttack,
// デュアルアタック
    StatusEffectType.DualStrike,
// エーギル奪取
    StatusEffectType.EssenceDrain,
// 縁
    StatusEffectType.Bonded,
    // おねだり
    // TODO: 確認する
    StatusEffectType.Coax,
    // 予知の罠
    StatusEffectType.ForesightSnare,
    // スタイル・射程2
    StatusEffectType.Range2Style,
];
const POSITIVE_STATUS_EFFECT_ORDER_MAP = new Map();
POSITIVE_STATUS_EFFECT_ARRAY.forEach((v, i) => POSITIVE_STATUS_EFFECT_ORDER_MAP.set(v, i));

/**
 * 不利なステータスの解除される順番
 * @type {(number)[]}
 */
const NEGATIVE_STATUS_EFFECT_ARRAY = [
    StatusEffectType.Panic,
    StatusEffectType.Exposure,
    StatusEffectType.Sabotage,
    StatusEffectType.Discord,
    // StatusEffectType.AtkShackle,
    StatusEffectType.SpdShackle,
    StatusEffectType.DefShackle,
    StatusEffectType.ResShackle,
    StatusEffectType.HushSpectrum,
    StatusEffectType.ShareSpoils,
    StatusEffectType.ShareSpoilsPlus,
    StatusEffectType.FalseStart,
    StatusEffectType.CounterattacksDisrupted,
    StatusEffectType.Isolation,
    StatusEffectType.DeepWounds,
    StatusEffectType.NeutralizeUnitSurvivesWith1HP,
    StatusEffectType.Undefended,
    StatusEffectType.Feud,
    StatusEffectType.Ploy,
    StatusEffectType.Schism,
    StatusEffectType.TimesGrip,
    StatusEffectType.Gravity,
    StatusEffectType.Stall,
    StatusEffectType.CantoControl,
    StatusEffectType.Guard,
    StatusEffectType.Frozen,
    StatusEffectType.TriangleAdept,
    StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately,
];
const NEGATIVE_STATUS_EFFECT_ORDER_MAP = new Map();
NEGATIVE_STATUS_EFFECT_ARRAY.forEach((v, i) => NEGATIVE_STATUS_EFFECT_ORDER_MAP.set(v, i));

const StatusIndex = Object.freeze({
    NONE: -1,
    ATK: 0,
    SPD: 1,
    DEF: 2,
    RES: 3,
});

/**
 * @enum {[boolean, boolean, boolean, boolean]}
 */
const StatFlags = Object.freeze({
    NONE: [false, false, false, false],
    ATK: [true, false, false, false],
    SPD: [false, true, false, false],
    DEF: [false, false, true, false],
    RES: [false, false, false, true],
    ATK_SPD: [true, true, false, false],
    ATK_DEF: [true, false, true, false],
    ATK_RES: [true, false, false, true],
    SPD_DEF: [false, true, true, false],
    SPD_RES: [false, true, false, true],
    DEF_RES: [false, false, true, true],
    ATK_SPD_DEF: [true, true, true, false],
    ATK_SPD_RES: [true, true, false, true],
    ATK_DEF_RES: [true, false, true, true],
    SPD_DEF_RES: [false, true, true, true],
    ALL: [true, true, true, true],
});

function getStatusName(index) {
    if (index === StatusIndex.NONE) {
        return "ー";
    }
    return ["攻撃", "速さ", "守備", "魔防"][index];
}

const GameMode = {
    AetherRaid: 0,
    Arena: 1,
    AllegianceBattles: 2,
    ResonantBattles: 3,
    TempestTrials: 4,
    PawnsOfLoki: 5,
    SummonerDuels: 6, // 英雄決闘
};

export { StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ORDER_MAP, NEGATIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ORDER_MAP, StatusIndex, StatFlags, getStatusName, GameMode };
