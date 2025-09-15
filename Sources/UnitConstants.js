const Hero = {
    HaloweenHector: 432,
    DuoEphraim: 443,
    ChristmasMarth: 462,
    NewYearAlfonse: 468,
    ValentineAlm: 484,
    SpringIdunn: 500,
    YoungPalla: 511,
    BridalMicaiah: 522,
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
    DuoAlear: 1214,
    DuoHeidrun: 1220,
    HarmonizedMarisa: 1230,
    DuoRhea: 1237,
    HarmonizedPlumeria: 1248,
    DuoCorrinM: 1259,
    DuoMarth: 1266,
    DuoJulia: 1276,
    DuoHapi: 1294,
    HarmonizedIngrid: 1309,
    HarmonizedFir: 1322,
    // Duoの場合はDUO_HERO_SETにも追加する
};

const DUO_HERO_SET = new Set([
    Hero.HaloweenHector,
    Hero.NewYearAlfonse,
    Hero.ValentineAlm,
    Hero.SpringIdunn,
    Hero.YoungPalla,
    Hero.BridalMicaiah,
    Hero.SummerByleth,
    Hero.DuoEphraim,
    Hero.DuoSigurd,
    Hero.DuoLyn,
    Hero.DuoAltina,
    Hero.DuoPeony,
    Hero.DuoLif,
    Hero.DuoEirika,
    Hero.DuoHilda,
    Hero.DuoHinoka,
    Hero.DuoSothis,
    Hero.DuoCorrin,
    Hero.DuoDagr,
    Hero.DuoChrom,
    Hero.DuoIke,
    Hero.DuoThorr,
    Hero.DuoNina,
    Hero.DuoDuma,
    Hero.DuoLaegijarn,
    Hero.DuoAskr,
    Hero.DuoElise,
    Hero.DuoMark,
    Hero.DuoShamir,
    Hero.DuoYmir,
    Hero.DuoKagero,
    Hero.DuoSanaki,
    Hero.DuoByleth,
    Hero.DuoSeidr,
    Hero.DuoLyon,
    Hero.DuoRobin,
    Hero.DuoSharena,
    Hero.DuoGullveig,
    Hero.DuoFjorm,
    Hero.DuoLucina,
    Hero.DuoAlear,
    Hero.DuoHeidrun,
    Hero.DuoRhea,
    Hero.DuoMarth,
    Hero.DuoJulia,
    Hero.DuoHapi,
]);

const RESET_DUO_OR_HARMONIZED_SKILL_AT_ODD_TURN_SET = new Set();
const RESET_DUO_OR_HARMONIZED_SKILL_EVERY_3_TURNS_SET = new Set();

const IvStateOptions = [
    { id: StatusType.None, text: "なし" },
    { id: StatusType.Hp, text: "HP" },
    { id: StatusType.Atk, text: "攻撃" },
    { id: StatusType.Spd, text: "速さ" },
    { id: StatusType.Def, text: "守備" },
    { id: StatusType.Res, text: "魔防" },
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
    SPlus: 4,
};

// TODO: なぜsummonerLevelOptionsと2つ存在するのか調査する
const SummonerLevelOptions = [
    { id: SummonerLevel.None, text: "なし" },
    { id: SummonerLevel.C, text: "C" },
    { id: SummonerLevel.B, text: "B" },
    { id: SummonerLevel.A, text: "A" },
    { id: SummonerLevel.S, text: "S" },
    { id: SummonerLevel.SPlus, text: "S+" },
];

const PartnerLevel = {
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
    SPlus: 4,
};

// つながり英雄が増えた場合以下に追加
const EntwinedType = {
    None: {id: -1, value: [0, 0, 0, 0], text: "なし"},
    Ash: {id: 0, value: [2, 0, 2, 0], text: "アシュ"},
};

const EntwinedOptions = [...Object.values(EntwinedType)];
const EntwinedValues = new Map(
    EntwinedOptions.map(type => [type.id, type.value])
);

const CombatResultType = {
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
    StatusEffectType.ShareSpoilsPlus,
    StatusEffectType.SpdShackle,
    StatusEffectType.ResShackle,
    StatusEffectType.DefShackle,
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

function sortPositiveStatusEffectTypes(types) {
    let getValue = k => POSITIVE_STATUS_EFFECT_ORDER_MAP.get(k) ?? Number.MAX_SAFE_INTEGER;
    return types.sort((a, b) => getValue(a) - getValue(b));
}

function sortNegativeStatusEffectTypes(types) {
    let getValue = k => NEGATIVE_STATUS_EFFECT_ORDER_MAP.get(k) ?? Number.MAX_SAFE_INTEGER;
    return types.sort((a, b) => getValue(a) - getValue(b));
}

function getPositiveStatusEffectTypesInOrder() {
    return sortPositiveStatusEffectTypes(getPositiveStatusEffectTypes());
}

function getNegativeStatusEffectTypesInOrder() {
    return sortNegativeStatusEffectTypes(getNegativeStatusEffectTypes());
}

/**
 * @type {Map<number, [string, string, string]>}
 */
const STATUS_EFFECT_INFO_MAP = new Map([
    [StatusEffectType.None, ["", "なし", "なし"]],
    [StatusEffectType.Panic, ["Panic.png", "パニック", "強化を+でなく-とする"]],
    [StatusEffectType.Gravity, ["MobilityDecreased.png", "グラビティ", "移動が最大1マスに制限される"]],
    [StatusEffectType.MobilityIncreased, ["MobilityIncreased.png", "移動+1", "移動+1"]],
    [StatusEffectType.EffectiveAgainstDragons, ["EffectiveAgainstDragons.png", "竜特効", ""]],
    [StatusEffectType.Isolation, ["Isolation.png", "補助不可", ""]],
    [StatusEffectType.AirOrders, ["AirOrders.png", "周囲2マスの味方の隣接マスに移動可能", "周囲2マスの味方の隣接マスに移動可能"]],
    [StatusEffectType.Guard, ["Guard.png", "キャンセル", "奥義発動カウント変動量-1"]],
    [StatusEffectType.BonusDoubler, ["BonusDoubler.png", "強化増幅", ""]],
    [StatusEffectType.CounterattacksDisrupted, ["CounterattacksDisrupted.png", "反撃不可", ""]],
    [StatusEffectType.ShieldArmor, ["NeutralizeEffectiveAgainstArmored.webp", "重装特効無効", ""]],
    [StatusEffectType.ShieldDragon, ["NeutralizeEffectiveAgainstDragon.webp", "竜特効無効", ""]],
    [StatusEffectType.TotalPenaltyDamage, ["Dominance.png", "敵弱化ダメージ+", ""]],
    [StatusEffectType.ResonantBlades, ["ResonanceBlades.png", "双界効果・刃", "戦闘中、攻速+4"]],
    [StatusEffectType.Desperation, ["Desperation.png", "攻め立て", ""]],
    [StatusEffectType.ResonantShield, ["ResonanceShields.png", "双界効果・盾", "戦闘中、守魔+4、最初の戦闘のみ敵は追撃不可"]],
    [StatusEffectType.Vantage, ["Vantage.png", "待ち伏せ", ""]],
    [StatusEffectType.DeepWounds, ["DeepWounds.png", "回復不可", ""]],
    [StatusEffectType.FallenStar, ["FallenStar.png", "落星", ""]],
    [StatusEffectType.FollowUpAttackPlus, ["GuaranteedFollowUps.png", "自分から攻撃時、絶対追撃", "自分から攻撃時、絶対追撃"]],
    [StatusEffectType.FollowUpAttackMinus, ["FoeCannotFollowUp.png", "追撃不可", "敵は追撃不可"]],
    [StatusEffectType.ShieldFlying, ["NeutralizeEffectiveAgainstFlying.png", "飛行特効無効", ""]],
    [StatusEffectType.Dodge, ["Dodge.png", "回避", ""]],
    [StatusEffectType.TriangleAttack, ["TriangleAttack.png", "トライアングルアタック", "2マスに「トライアングルアタック」2体なら2回攻撃"]],
    [StatusEffectType.NullPanic, ["NullPanic.png", "見切り・パニック", "「パニック」の「強化を-とする」無効"]],
    [StatusEffectType.Stall, ["Stall.png", "空転", "「移動+1」の時、移動が最大1マスに制限される"]],
    [StatusEffectType.TriangleAdept, ["TriangleAdept.png", "相性激化", ""]],
    [StatusEffectType.CancelAffinity, ["CancelAffinity.png", "相性相殺", ""]],
    [StatusEffectType.NullFollowUp, ["NullFollowUp.png", "見切り・追撃", "速さが敵より高いと、敵の絶対追撃と自分の追撃不可無効"]],
    [StatusEffectType.Pathfinder, ["Pathfinder.png", "天駆の道", ""]],
    [StatusEffectType.FalseStart, ["FalseStart.png", "ターン開始スキル不可", ""]],
    [StatusEffectType.NeutralizesFoesBonusesDuringCombat, ["NeutralizeFoeBonuses.png", "敵の強化の+を無効", ""]],
    [StatusEffectType.GrandStrategy, ["GrandStrategy.png", "神軍師の策", ""]],
    [StatusEffectType.CantoControl, ["CantoControl.png", "再移動制限", ""]],
    [StatusEffectType.EnGarde, ["EnGarde.webp", "戦闘外ダメージ無効", ""]],
    [StatusEffectType.SpecialCooldownChargePlusOnePerAttack, ["AccelerateSpecial.webp", "戦闘中、奥義発動カウント変動量+1", ""]],
    [StatusEffectType.Treachery, ["Treachery.webp", "強化ダメージ+", ""]],
    [StatusEffectType.WarpBubble, ["WarpBubble.webp", "敵ワープ抑制", "自分の周囲4マスに、敵はワープ移動不可"]],
    [StatusEffectType.Charge, ["Charge.webp", "突撃", ""]],
    [StatusEffectType.Exposure, ["Exposure.webp", "弱点露呈", "受けたダメージ+10"]],
    [StatusEffectType.Canto1, ["Canto1.webp", "再移動1", ""]],
    [StatusEffectType.FoePenaltyDoubler, ["FoePenaltyDoubler.webp", "敵弱化増幅", ""]],
    [StatusEffectType.Undefended, ["Undefended.webp", "護られ不可", ""]],
    [StatusEffectType.Feud, ["Feud.webp", "暗闘", ""]],
    [StatusEffectType.DualStrike, ["DualStrike.webp", "デュアルアタック", ""]],
    [StatusEffectType.UnitCannotBeSlowedByTerrain, ["UnitCannotBeSlowedByTerrain.webp", "自身が移動可能な地形を平地のように移動可能", ""]],
    [StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent, ["ReducesDamageFromAreaOfEffectSpecialsBy80Percent.webp", "受けた範囲奥義のダメージを80%軽減", ""]],
    [StatusEffectType.NeutralizesPenalties, ["NeutralizesPenalties.webp", "弱化無効", ""]],
    [StatusEffectType.RallySpectrum, ["RallySpectrum.webp", "七色の叫び", ""]],
    [StatusEffectType.Hexblade, ["Hexblade.webp", "魔刃", ""]],
    [StatusEffectType.Sabotage, ["Sabotage.webp", "混乱", "攻速守魔が減少、2マスの味方の弱化の最高値"]],
    [StatusEffectType.Discord, ["Discord.webp", "不和", ""]],
    [StatusEffectType.AssignDecoy, ["AssignDecoy.webp", "囮指名", ""]],
    [StatusEffectType.DeepStar, ["DeepStar.webp", "真落星", "攻撃と2回攻撃ダメージ80%軽減（最初の戦闘のみ）"]],
    [StatusEffectType.Ploy, ["Ploy.webp", "謀策", ""]],
    [StatusEffectType.Schism, ["Schism.webp", "連携阻害", ""]],
    [StatusEffectType.NeutralizeUnitSurvivesWith1HP, ["NeutralizeUnitSurvivesWith1HP.webp", "奥義以外の祈り無効", ""]],
    [StatusEffectType.TimesGate, ["TimesGate.webp", "時の門", ""]],
    [StatusEffectType.Incited, ["Incited.webp", "奮激", ""]],
    [StatusEffectType.ReducesDamageFromFirstAttackBy40Percent, ["ReduceFirstAttackDamage.webp", "自分から攻撃した時、最初に受けた攻撃のダメージを40%軽減", ""]],
    [StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent, ["ReduceReduceDamageByX.webp", "戦闘中、敵の奥義以外のスキルによる「ダメージを〇〇%軽減」を半分無効（無効にする数値は単数切り捨て）（範囲奥義を除く）", "敵の奥義以外の「ダメージを〇〇%軽減」半分無効"]],
    [StatusEffectType.TimesGrip, ["TimesGrip.webp", "時の陥穽", "戦闘中攻速守魔-4、味方の戦闘中で自分のスキル無効"]],
    [StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately, ["AfterStartOfTurnSkillsTriggerActionEndsImmediately.webp", "ターン開始後スキル発動後、即座に行動終了", "ターン開始スキル発動後、行動終了になる"]],
    [StatusEffectType.HushSpectrum, ["HushSpectrum.webp", "七色の囁き", "戦闘中攻速守魔-5、奥義発動カウント+1、敵は-1"]],
    [StatusEffectType.EssenceDrain, ["EssenceDrain.webp", "エーギル奪取", "戦闘後に敵の有利な状態を奪う、敵を撃破時10回復"]],
    [StatusEffectType.ShareSpoils, ["ShareSpoils.webp", "戦果移譲", ""]],
    [StatusEffectType.Frozen, ["Frozen.webp", "凍結", ""]],
    [StatusEffectType.Bonded, ["Bonded.webp", "縁", ""]],
    [StatusEffectType.Bulwark, ["Bulwark.webp", "防壁", ""]],
    [StatusEffectType.DivineNectar, ["DivineNectar.webp", "神獣の蜜", "戦闘開始時回復、回復不可無効、条件で被ダメージ減"]],
    [StatusEffectType.Paranoia, ["Paranoia.webp", "被害妄想", "HP99%以下で、攻撃+5、攻め立て・待ち伏せ可能"]],
    [StatusEffectType.Gallop, ["Gallop.webp", "迅走", "移動+2（同系統効果重複時、最大値適用）"]],
    [StatusEffectType.Anathema, ["Anathema.webp", "赤の呪い", "周囲3マスの敵の速守魔-4"]],
    [StatusEffectType.FutureWitness, ["FutureWitness.webp", "未来を知るもの", "再移動、攻速守魔+5、ダメージ-7、敵奥義発動妨害"]],
    [StatusEffectType.Dosage, ["Dosage.webp", "毒も薬に、薬も毒に", "敵から受ける「敵の有利状態の付与と解除」を無効"]],
    [StatusEffectType.Empathy, ["Empathy.webp", "多感", "自軍と敵軍の有利な状態と不利な状態の種類数で強化"]],
    [StatusEffectType.DivinelyInspiring, ["DivinelyInspiring.webp", "神竜の結束", "【神竜の結束】の味方数で強化、回復、奥義カウント減"]],
    [StatusEffectType.PreemptPulse, ["PreemptPulse.webp", "初撃の鼓動", "自分の最初の攻撃前に奥義-1"]],
    [StatusEffectType.IncreasesSpdDifferenceNecessaryForFoeToMakeAFollowUpAttackBy10DuringCombat, ["FoeSpdDifferenceIncrease.webp", "戦闘中、敵の追撃の速さ条件+10", "戦闘中、敵の追撃の速さ条件+10"]],
    [StatusEffectType.PotentFollow, ["PotentFollow.webp", "神速追撃", "条件を満たすと、追撃の直後に、さらに追撃が発動"]],
    [StatusEffectType.Salvage, ["Salvage.webp", "七難即滅", "【再移動（2）】発動可能、再移動制限を緩和する"]],
    [StatusEffectType.DraconicHex, ["DraconicHex.webp", "竜呪", "敵の攻速守魔-5、さらに5-敵各能力の弱化だけ減"]],
    [StatusEffectType.FireEmblem, ["FireEmblem.webp", "炎の紋章", "全移動種特効無効、攻速守魔+強化値、初撃ダメージ減"]],
    [StatusEffectType.FellSpirit, ["FellSpirit.webp", "邪竜気", "反撃不可を無効、奥義でのダメージ軽減を1戦闘2回に"]],
    [StatusEffectType.UnitMakesAGuaranteedFollowUpAttackDuringCombat, ["GuaranteedFollowUp.webp", "戦闘中、絶対追撃", "戦闘中、絶対追撃"]],
    [StatusEffectType.Imbue, ["Imbue.webp", "治癒", "回復不可半分無効、戦闘開始後に最大HPの40%回復"]],
    [StatusEffectType.Reflex, ["Reflex.webp", "反射", "初撃のダメージ-7、軽減値を次の攻撃のダメージに+"]],
    [StatusEffectType.ShareSpoilsPlus, ["ShareSpoilsPlus.webp", "戦果移譲・広域", ""]],
    [StatusEffectType.ForesightSnare, ["ForesightSnare.webp", "予知の罠", "「予知の罠」により、敵からの攻撃をキャンセルできる"]],
    [StatusEffectType.ProfsGuidance, ["ProfsGuidance.webp", "師の導き", "SP2倍、奥義で軽減2回可&戦闘後にカウント-1"]],
    [StatusEffectType.FringeBonus, ["FringeBonus.webp", "真強化増幅", "攻速守魔が上昇、自分と周囲の味方の強化が最も高い値"]],
    [StatusEffectType.MagicTwinSave, ["MagicTwinSave.webp", "護り手・魔・双", "魔法攻撃に「護り手」、奥義のダメージ軽減2回発動可"]],
    // [StatusEffectType.AtkShackle, ["AtkShackle.webp", "攻撃の枷", "攻撃が減少、自分の不利な状態異常の数+4（最大8）"]],
    [StatusEffectType.SpdShackle, ["SpdShackle.webp", "速さの枷", "速さが減少、自分の不利な状態異常の数+4（最大8）"]],
    [StatusEffectType.DefShackle, ["DefShackle.webp", "守備の枷", "守備が減少、自分の不利な状態異常の数+4（最大8）"]],
    [StatusEffectType.ResShackle, ["ResShackle.webp", "魔防の枷", "魔防が減少、自分の不利な状態異常の数+4（最大8）"]],
    [StatusEffectType.CreationPulse, ["CreationPulse.webp", "開闢の鼓動", "攻撃前に、奥義発動カウント-敵の不利な状態異常の数"]],
    [StatusEffectType.ChangeOfFate, ["ChangeOfFate.webp", "運命を変える!", ""]],
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
    if (typeof effect === "string") {
        effect = Number(effect) || -1;
    }
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
