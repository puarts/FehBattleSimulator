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
    [StatusEffectType.EssenceDrain, "EssenceDrain.webp"],
    [StatusEffectType.ShareSpoils, "ShareSpoils.webp"],
    [StatusEffectType.Frozen, "Frozen.webp"],
    [StatusEffectType.Bonded, "Bonded.webp"],
    [StatusEffectType.DivineNectar, "DivineNectar.webp"],
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
