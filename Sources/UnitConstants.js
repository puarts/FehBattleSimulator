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
    DuoSharena: 1125,
    DuoGullveig: 1136,
    HarmonizedGoldmary: 1143,
    HarmonizedNephenee: 1157,
    DuoFjorm: 1169,
    HarmonizedNagi: 1181,
    DuoLucina: 1193,
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
    StatusEffectType.ShareSpoils,
    StatusEffectType.Frozen,
]);

/// ステータス効果が不利なステータス効果であるかどうかを判定します。
function isNegativeStatusEffect(type) {
    return NEGATIVE_STATUS_EFFECT_SET.has(type);
}

/// ステータス効果が有利なステータス効果であるかどうかを判定します。
function isPositiveStatusEffect(type) {
    return type >= 0 && !isNegativeStatusEffect(type);
}

function getPositiveStatusEffectTypes() {
    return Object.values(StatusEffectType).filter(value => value >= 0 && isPositiveStatusEffect(value));
}

function getNegativeStatusEffectTypes() {
    return Object.values(StatusEffectType).filter(value => value >= 0 && isNegativeStatusEffect(value));
}

/**
 * @type {Map<number, [string, string, string]>}
 */
const STATUS_EFFECT_INFO_MAP = new Map([
    [StatusEffectType.Panic, ["Panic.png", "パニック", "パニック"]],
    [StatusEffectType.Gravity, ["MobilityDecreased.png", "グラビティ", "グラビティ"]],
    [StatusEffectType.MobilityIncreased, ["MobilityIncreased.png", "移動+1", "移動+1"]],
    [StatusEffectType.EffectiveAgainstDragons, ["EffectiveAgainstDragons.png", "竜特効", "竜特効"]],
    [StatusEffectType.Isolation, ["Isolation.png", "補助不可", "補助不可"]],
    [StatusEffectType.AirOrders, ["AirOrders.png", "周囲2マスの味方の隣接マスに移動可能", "周囲2マスの味方の隣接マスに移動可能"]],
    [StatusEffectType.Guard, ["Guard.png", "キャンセル", "キャンセル"]],
    [StatusEffectType.BonusDoubler, ["BonusDoubler.png", "強化増幅", "強化増幅"]],
    [StatusEffectType.CounterattacksDisrupted, ["CounterattacksDisrupted.png", "反撃不可", "反撃不可"]],
    [StatusEffectType.ShieldArmor, ["NeutralizeEffectiveAgainstArmored.webp", "重装特効無効", "重装特効無効"]],
    [StatusEffectType.ShieldDragon, ["NeutralizeEffectiveAgainstDragon.webp", "竜特効無効", "竜特効無効"]],
    [StatusEffectType.TotalPenaltyDamage, ["Dominance.png", "敵弱化ダメージ+", "敵弱化ダメージ+"]],
    [StatusEffectType.ResonantBlades, ["ResonanceBlades.png", "双界効果・刃", "双界効果・刃"]],
    [StatusEffectType.Desperation, ["Desperation.png", "攻め立て", "攻め立て"]],
    [StatusEffectType.ResonantShield, ["ResonanceShields.png", "双界効果・盾", "双界効果・盾"]],
    [StatusEffectType.Vantage, ["Vantage.png", "待ち伏せ", "待ち伏せ"]],
    [StatusEffectType.DeepWounds, ["DeepWounds.png", "回復不可", "回復不可"]],
    [StatusEffectType.FallenStar, ["FallenStar.png", "落星", "落星"]],
    [StatusEffectType.FollowUpAttackPlus, ["GuaranteedFollowUps.png", "絶対追撃", "攻撃時絶対追撃"]],
    [StatusEffectType.FollowUpAttackMinus, ["FoeCannotFollowUp.png", "追撃不可", "追撃不可"]],
    [StatusEffectType.ShieldFlying, ["NeutralizeEffectiveAgainstFlying.png", "飛行特効無効", "飛行特効無効"]],
    [StatusEffectType.Dodge, ["Dodge.png", "回避", "回避"]],
    [StatusEffectType.TriangleAttack, ["TriangleAttack.png", "2マスに「トライアングルアタック」2体なら2回攻撃", "2マスに「トライアングルアタック」2体なら2回攻撃"]],
    [StatusEffectType.NullPanic, ["NullPanic.png", "見切り・パニック", "見切り・パニック"]],
    [StatusEffectType.Stall, ["Stall.png", "空転", "空転"]],
    [StatusEffectType.TriangleAdept, ["TriangleAdept.png", "相性激化", "相性激化"]],
    [StatusEffectType.CancelAffinity, ["CancelAffinity.png", "相性相殺", "相性相殺"]],
    [StatusEffectType.NullFollowUp, ["NullFollowUp.png", "見切り・追撃", "速さが勝っている時見切り・追撃"]],
    [StatusEffectType.Pathfinder, ["Pathfinder.png", "天駆の道", "天駆の道"]],
    [StatusEffectType.FalseStart, ["FalseStart.png", "ターン開始スキル不可", "ターン開始スキル不可"]],
    [StatusEffectType.NeutralizesFoesBonusesDuringCombat, ["NeutralizeFoeBonuses.png", "敵の強化の+を無効", "敵の強化の+を無効"]],
    [StatusEffectType.GrandStrategy, ["GrandStrategy.png", "神軍師の策", "神軍師の策"]],
    [StatusEffectType.CantoControl, ["CantoControl.png", "再移動制限", "再移動制限"]],
    [StatusEffectType.EnGarde, ["EnGarde.webp", "戦闘外ダメージ無効", "戦闘外ダメージ無効"]],
    [StatusEffectType.SpecialCooldownChargePlusOnePerAttack, ["AccelerateSpecial.webp", "戦闘中、奥義発動カウント変動量+1", "戦闘中、奥義発動カウント変動量+1"]],
    [StatusEffectType.Treachery, ["Treachery.webp", "強化ダメージ+", "強化ダメージ+"]],
    [StatusEffectType.WarpBubble, ["WarpBubble.webp", "敵ワープ抑制", "敵ワープ抑制"]],
    [StatusEffectType.Charge, ["Charge.webp", "突撃", "突撃"]],
    [StatusEffectType.Exposure, ["Exposure.webp", "弱点露呈", "弱点露呈"]],
    [StatusEffectType.Canto1, ["Canto1.webp", "再移動1", "再移動1"]],
    [StatusEffectType.FoePenaltyDoubler, ["FoePenaltyDoubler.webp", "敵弱化増幅", "敵弱化増幅"]],
    [StatusEffectType.Undefended, ["Undefended.webp", "護られ不可", "護られ不可"]],
    [StatusEffectType.Feud, ["Feud.webp", "暗闘", "暗闘"]],
    [StatusEffectType.DualStrike, ["DualStrike.webp", "デュアルアタック", "デュアルアタック"]],
    [StatusEffectType.UnitCannotBeSlowedByTerrain, ["UnitCannotBeSlowedByTerrain.webp", "自身が移動可能な地形を平地のように移動可能", "自身が移動可能な地形を平地のように移動可能"]],
    [StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent, ["ReducesDamageFromAreaOfEffectSpecialsBy80Percent.webp", "受けた範囲奥義のダメージを80%軽減", "受けた範囲奥義のダメージを80%軽減"]],
    [StatusEffectType.NeutralizesPenalties, ["NeutralizesPenalties.webp", "弱化無効", "弱化無効"]],
    [StatusEffectType.RallySpectrum, ["RallySpectrum.webp", "七色の叫び", "七色の叫び"]],
    [StatusEffectType.Hexblade, ["Hexblade.webp", "魔刃", "魔刃"]],
    [StatusEffectType.Sabotage, ["Sabotage.webp", "混乱", "混乱"]],
    [StatusEffectType.Discord, ["Discord.webp", "不和", "不和"]],
    [StatusEffectType.AssignDecoy, ["AssignDecoy.webp", "囮指名", "囮指名"]],
    [StatusEffectType.DeepStar, ["DeepStar.webp", "真落星", "真落星"]],
    [StatusEffectType.Ploy, ["Ploy.webp", "謀策", "謀策"]],
    [StatusEffectType.Schism, ["Schism.webp", "連携阻害", "連携阻害"]],
    [StatusEffectType.NeutralizeUnitSurvivesWith1HP, ["NeutralizeUnitSurvivesWith1HP.webp", "奥義以外の祈り無効", "奥義以外の祈り無効"]],
    [StatusEffectType.TimesGate, ["TimesGate.webp", "時の門", "時の門"]],
    [StatusEffectType.Incited, ["Incited.webp", "時の門", "時の門"]],
    [StatusEffectType.ReducesDamageFromFirstAttackBy40Percent, ["ReduceFirstAttackDamage.webp", "自分から攻撃した時、最初に受けた攻撃のダメージを40%軽減", "自分から攻撃した時、最初に受けた攻撃のダメージを40%軽減"]],
    [StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent, ["ReduceReduceDamageByX.webp", "「ダメージを〇〇%軽減」を半分無効", "「ダメージを〇〇%軽減」を半分無効"]],
    [StatusEffectType.TimesGrip, ["TimesGrip.webp", "時の陥穽", "時の陥穽"]],
    [StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately, ["AfterStartOfTurnSkillsTriggerActionEndsImmediately.webp", "ターン開始後スキル発動後、即座に行動終了", "ターン開始後スキル発動後、即座に行動終了"]],
    [StatusEffectType.HushSpectrum, ["HushSpectrum.webp", "七色の囁き", "七色の囁き"]],
    [StatusEffectType.EssenceDrain, ["EssenceDrain.webp", "エーギル奪取", "エーギル奪取"]],
    [StatusEffectType.ShareSpoils, ["ShareSpoils.webp", "戦果移譲", "戦果移譲"]],
    [StatusEffectType.Frozen, ["Frozen.webp", "凍結", "凍結"]],
    [StatusEffectType.Bonded, ["Bonded.webp", "縁", "縁"]],
    [StatusEffectType.Bulwark, ["Bulwark.webp", "防壁", "防壁"]],
    [StatusEffectType.DivineNectar, ["DivineNectar.webp", "神獣の蜜", "神獣の蜜"]],
    [StatusEffectType.Paranoia, ["Paranoia.webp", "被害妄想", "被害妄想"]],
    [StatusEffectType.Gallop, ["Gallop.webp", "迅走", "迅走"]],
    [StatusEffectType.Anathema, ["Anathema.webp", "赤の呪い", "赤の呪い"]],
    [StatusEffectType.FutureWitness, ["FutureWitness.webp", "未来を知るもの", "未来を知るもの"]],
    [StatusEffectType.Dosage, ["Dosage.webp", "毒も薬に、薬も毒に", "毒も薬に、薬も毒に"]],
    [StatusEffectType.Empathy, ["Empathy.webp", "多感", "多感"]],
]);

function statusEffectTypeToIconFilePath(value) {
    // ステータスアイコン一覧
    // https://feheroes.fandom.com/wiki/Category:Status_effect_icons
    // ステータス
    // https://feheroes.fandom.com/wiki/Status_effects
    return STATUS_EFFECT_INFO_MAP.has(value) ?
        `${g_imageRootPath}StatusEffect_${(STATUS_EFFECT_INFO_MAP.get(value)[0])}` :
        "";
}

function getStatusEffectName(effect) {
    if (STATUS_EFFECT_INFO_MAP.has(effect)) {
        return STATUS_EFFECT_INFO_MAP.get(effect)[1];
    }
    for (let name in StatusEffectType) {
        if (StatusEffectType[name] === effect) {
            return name;
        }
    }
    return "";
}

function getStatusDescription(effect) {
    if (STATUS_EFFECT_INFO_MAP.has(effect)) {
        return STATUS_EFFECT_INFO_MAP.get(effect)[2];
    }
    return getStatusEffectName(effect);
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
