const Hero = {
    HaloweenHector: 432,
    DuoEphraim: 443,
    ChristmasMarth: 462,
    NewYearAlfonse: 468,
    ValentineAlm: 484,
    SpringIdunn: 500,
    YoungPalla: 511,
    BridalMicaiah: 522,
    Mila: 524,
    SummerMia: 534,
    Thief: 547,
    RedThief: 548,
    BlueThief: 549,
    GreenThief: 550,
    SummerByleth: 540,
    PirateVeronica: 555,
    DuoSigurd: 566,
    HaloweenTiki: 577,
    DuoLyn: 588,
    DuoAltina: 609,
    DuoPeony: 615,
    PlegianDorothea: 625,
    DuoLif: 631,
    HarmonizedMyrrh: 648,
    DuoEirika: 659,
    HarmonizedCatria: 670,
    DuoHilda: 682,
    HarmonizedCaeda: 688,
    DuoHinoka: 700,
    HarmonizedLeif: 711,
    DuoSothis: 723,
    DuoCorrin: 735,
    HarmonizedLysithea: 754,
    DuoDagr: 760,
    HarmonizedAzura: 770,
    DuoChrom: 776,
    HarmonizedSonya: 787,
    DuoIke: 798,
    HarmonizedRoy: 816,
    HarmonizedEdelgard: 830,
    DuoThorr: 836,
    DuoNina: 847,
    HarmonizedTana: 860,
    DuoDuma: 873,
    DuoLaegijarn: 887,
    HarmonizedCordelia: 908,
    DuoAskr: 914,
    HarmonizedLinde: 919,
    DuoElise: 932,
    HarmonizedKarla: 944,
    DuoMark: 955,
    HarmonizedTiki: 971,
    DuoShamir: 984,
    DuoYmir: 990,
    HarmonizedAyra: 1005,
    DuoKagero: 1016,
    HarmonizedAnna: 1029,
    DuoSanaki: 1042,
    DuoByleth: 1062,
    DuoSeidr: 1068,
    HarmonizedIgrene: 1079,
    DuoLyon: 1086,
    HarmonizedChloe: 1097,
    DuoRobin: 1109,
};

const IvStateOptions = [
    {id: StatusType.None, text: "なし"},
    {id: StatusType.Hp, text: "HP"},
    {id: StatusType.Atk, text: "攻撃"},
    {id: StatusType.Spd, text: "速さ"},
    {id: StatusType.Def, text: "守備"},
    {id: StatusType.Res, text: "魔防"},
];

const UnitGroupType = {
    Ally: 0,
    Enemy: 1,
};

const SummonerLevel = {
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
};

const SummonerLevelOptions = [
    {id: SummonerLevel.None, text: "なし"},
    {id: SummonerLevel.C, text: "C"},
    {id: SummonerLevel.B, text: "B"},
    {id: SummonerLevel.A, text: "A"},
    {id: SummonerLevel.S, text: "S"},
];

const PartnerLevel = {
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
};


const CombatResult = {
    Win: 2,
    Draw: 1,
    Loss: 0,
};

const PerTurnStatusType = {
    None: -1,
    Pass: 0,
    ThreatensEnemy: 1,
    ThreatenedByEnemy: 2,
};

const StatusEffectType = {
    None: -1,
    Panic: 0, // 強化反転
    Gravity: 1, // 移動制限
    MobilityIncreased: 2, // 移動値加算
    CounterattacksDisrupted: 3, // 反撃不可付与
    TriangleAdept: 4, // 激化付与
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
};

const NotReserved = -2;

///
/// Functions
///

function isThiefIndex(heroIndex) {
    return heroIndex === Hero.Thief ||
        heroIndex === Hero.RedThief ||
        heroIndex === Hero.BlueThief ||
        heroIndex === Hero.GreenThief;
}

function summonerLevelToString(level) {
    switch (level) {
        case SummonerLevel.C:
            return "C";
        case SummonerLevel.B:
            return "B";
        case SummonerLevel.A:
            return "A";
        case SummonerLevel.S:
            return "S";
        case SummonerLevel.None:
        default:
            return "-";
    }
}

const NEGATIVE_STATUS_EFFECT_SET = new Set([
    StatusEffectType.Panic,
    StatusEffectType.Gravity,
    StatusEffectType.CounterattacksDisrupted,
    StatusEffectType.TriangleAdept,
    StatusEffectType.Guard,
    StatusEffectType.Isolation,
    StatusEffectType.DeepWounds,
    StatusEffectType.Stall,
    StatusEffectType.FalseStart,
    StatusEffectType.CantoControl,
    StatusEffectType.Exposure,
    StatusEffectType.Undefended,
    StatusEffectType.Feud,
    StatusEffectType.Sabotage,
    StatusEffectType.Discord,
    StatusEffectType.Ploy,
    StatusEffectType.Schism,
    StatusEffectType.NeutralizeUnitSurvivesWith1HP,
    StatusEffectType.TimesGrip,
    StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately,
    StatusEffectType.HushSpectrum,
]);

/// ステータス効果が不利なステータス効果であるかどうかを判定します。
function isNegativeStatusEffect(type) {
    return NEGATIVE_STATUS_EFFECT_SET.has(type);
}

/// ステータス効果が有利なステータス効果であるかどうかを判定します。
function isPositiveStatusEffect(type) {
    return !isNegativeStatusEffect(type);
}

const STATUS_EFFECT_FILE_NAME_MAP = new Map([
    [StatusEffectType.Panic, "Panic.png"],
    [StatusEffectType.Gravity, "MobilityDecreased.png"],
    [StatusEffectType.MobilityIncreased, "MobilityIncreased.png"],
    [StatusEffectType.EffectiveAgainstDragons, "EffectiveAgainstDragons.png"],
    [StatusEffectType.Isolation, "Isolation.png"],
    [StatusEffectType.AirOrders, "AirOrders.png"],
    [StatusEffectType.Guard, "Guard.png"],
    [StatusEffectType.BonusDoubler, "BonusDoubler.png"],
    [StatusEffectType.CounterattacksDisrupted, "CounterattacksDisrupted.png"],
    [StatusEffectType.ShieldArmor, "NeutralizeEffectiveAgainstArmored.png"],
    [StatusEffectType.ShieldDragon, "NeutralizeEffectiveAgainstDragon.png"],
    [StatusEffectType.TotalPenaltyDamage, "Dominance.png"],
    [StatusEffectType.ResonantBlades, "ResonanceBlades.png"],
    [StatusEffectType.Desperation, "Desperation.png"],
    [StatusEffectType.ResonantShield, "ResonanceShields.png"],
    [StatusEffectType.Vantage, "Vantage.png"],
    [StatusEffectType.DeepWounds, "DeepWounds.png"],
    [StatusEffectType.FallenStar, "FallenStar.png"],
    [StatusEffectType.FollowUpAttackPlus, "GuaranteedFollowUps.png"],
    [StatusEffectType.FollowUpAttackMinus, "FoeCannotFollowUp.png"],
    [StatusEffectType.ShieldFlying, "NeutralizeEffectiveAgainstFlying.png"],
    [StatusEffectType.Dodge, "Dodge.png"],
    [StatusEffectType.TriangleAttack, "TriangleAttack.png"],
    [StatusEffectType.NullPanic, "NullPanic.png"],
    [StatusEffectType.Stall, "Stall.png"],
    [StatusEffectType.TriangleAdept, "TriangleAdept.png"],
    [StatusEffectType.CancelAffinity, "CancelAffinity.png"],
    [StatusEffectType.NullFollowUp, "NullFollowUp.png"],
    [StatusEffectType.Pathfinder, "Pathfinder.png"],
    [StatusEffectType.FalseStart, "FalseStart.png"],
    [StatusEffectType.NeutralizesFoesBonusesDuringCombat, "NeutralizeFoeBonuses.png"],
    [StatusEffectType.GrandStrategy, "GrandStrategy.png"],
    [StatusEffectType.CantoControl, "CantoControl.png"],
    [StatusEffectType.EnGarde, "EnGarde.webp"],
    [StatusEffectType.SpecialCooldownChargePlusOnePerAttack, "AccelerateSpecial.webp"],
    [StatusEffectType.Treachery, "Treachery.webp"],
    [StatusEffectType.WarpBubble, "WarpBubble.webp"],
    [StatusEffectType.Charge, "Charge.webp"],
    [StatusEffectType.Exposure, "Exposure.webp"],
    [StatusEffectType.Canto1, "Canto1.webp"],
    [StatusEffectType.FoePenaltyDoubler, "FoePenaltyDoubler.webp"],
    [StatusEffectType.Undefended, "Undefended.webp"],
    [StatusEffectType.Feud, "Feud.webp"],
    [StatusEffectType.DualStrike, "DualStrike.webp"],
    [StatusEffectType.UnitCannotBeSlowedByTerrain, "UnitCannotBeSlowedByTerrain.webp"],
    [StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent, "ReducesDamageFromAreaOfEffectSpecialsBy80Percent.webp"],
    [StatusEffectType.NeutralizesPenalties, "NeutralizesPenalties.webp"],
    [StatusEffectType.RallySpectrum, "RallySpectrum.webp"],
    [StatusEffectType.Hexblade, "Hexblade.webp"],
    [StatusEffectType.Sabotage, "Sabotage.webp"],
    [StatusEffectType.Discord, "Discord.webp"],
    [StatusEffectType.AssignDecoy, "AssignDecoy.webp"],
    [StatusEffectType.DeepStar, "DeepStar.png"],
    [StatusEffectType.Ploy, "Ploy.webp"],
    [StatusEffectType.Schism, "Schism.png"],
    [StatusEffectType.NeutralizeUnitSurvivesWith1HP, "NeutralizeUnitSurvivesWith1HP.webp"],
    [StatusEffectType.TimesGate, "TimesGate.webp"],
    [StatusEffectType.ReducesDamageFromFirstAttackBy40Percent, "ReduceFirstAttackDamage.webp"],
    [StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent, "ReduceReduceDamageByX.webp"],
    [StatusEffectType.TimesGrip, "TimesGrip.webp"],
    [StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately, "AfterStartOfTurnSkillsTriggerActionEndsImmediately.webp"],
    [StatusEffectType.HushSpectrum, "HushSpectrum.webp"],
]);

function statusEffectTypeToIconFilePath(value) {
    // ステータスアイコン一覧
    // https://feheroes.fandom.com/wiki/Category:Status_effect_icons
    // ステータス
    // https://feheroes.fandom.com/wiki/Status_effects
    return STATUS_EFFECT_FILE_NAME_MAP.has(value) ?
        `${g_imageRootPath}StatusEffect_${(STATUS_EFFECT_FILE_NAME_MAP.get(value))}` :
        "";
}

function getStatusEffectName(effect) {
    for (let name in StatusEffectType) {
        if (StatusEffectType[name] === effect) {
            return name;
        }
    }
    return "";
}

function combatResultToString(result) {
    switch (result) {
        case CombatResult.Win:
            return "Win";
        case CombatResult.Draw:
            return "Draw";
        case CombatResult.Loss:
            return "Loss";
        default:
            return "Unknown";
    }
}

function groupIdToString(groupId) {
    switch (groupId) {
        case UnitGroupType.Ally:
            return "味方";
        case UnitGroupType.Enemy:
            return "敵";
        default:
            return "";
    }
}
