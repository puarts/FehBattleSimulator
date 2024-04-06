/// @file
/// @brief スキル情報の定義とそれに関連するクラス、関数等の定義です。

const WeaponTypeAttackRangeDict = {};
WeaponTypeAttackRangeDict[WeaponType.Sword] = 1;
WeaponTypeAttackRangeDict[WeaponType.Lance] = 1;
WeaponTypeAttackRangeDict[WeaponType.Axe] = 1;
WeaponTypeAttackRangeDict[WeaponType.RedBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.BlueBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.GreenBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.ColorlessBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.RedBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.BlueBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.GreenBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.ColorlessBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.RedTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.BlueTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.GreenTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.ColorlessTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.RedBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.BlueBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.GreenBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.ColorlessBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.RedDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.BlueDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.GreenDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.ColorlessDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.Staff] = 2;
WeaponTypeAttackRangeDict[WeaponType.None] = 0;

/// 指定した武器種の射程を取得します。
function getAttackRangeOfWeaponType(weaponType) {
    return WeaponTypeAttackRangeDict[weaponType];
}

function getWeaponTypeOrder(weaponType) {
    let weaponTypes = [
        WeaponType.Sword,
        WeaponType.RedTome,
        WeaponType.RedBreath,
        WeaponType.RedBeast,
        WeaponType.RedBow,
        WeaponType.RedDagger,
        WeaponType.Lance,
        WeaponType.BlueTome,
        WeaponType.BlueBreath,
        WeaponType.BlueBeast,
        WeaponType.BlueBow,
        WeaponType.BlueDagger,
        WeaponType.Axe,
        WeaponType.GreenTome,
        WeaponType.GreenBreath,
        WeaponType.GreenBeast,
        WeaponType.GreenBow,
        WeaponType.GreenDagger,
        WeaponType.Staff,
        WeaponType.ColorlessTome,
        WeaponType.ColorlessBreath,
        WeaponType.ColorlessBeast,
        WeaponType.ColorlessBow,
        WeaponType.ColorlessDagger,
    ];
    let i = 0;
    for (let type of weaponTypes) {
        if (type === weaponType) {
            return i;
        }
        ++i;
    }
    return -1;
}

// noinspection JSUnusedGlobalSymbols
function weaponRefinementTypeToString(type) {
    switch (type) {
        case WeaponRefinementType.None:
            return "-";
        case WeaponRefinementType.Hp5_Atk2:
            return "HP+5 攻撃+2";
        case WeaponRefinementType.Hp5_Spd3:
            return "HP+5 速さ+3";
        case WeaponRefinementType.Hp5_Def4:
            return "HP+5 守備+4";
        case WeaponRefinementType.Hp5_Res4:
            return "HP+5 魔防+4";
        case WeaponRefinementType.Hp2_Atk1:
            return "HP+2 攻撃+1";
        case WeaponRefinementType.Hp2_Spd2:
            return "HP+2 速さ+2";
        case WeaponRefinementType.Hp2_Def3:
            return "HP+2 守備+3";
        case WeaponRefinementType.Hp2_Res3:
            return "HP+2 魔防+3";
        case WeaponRefinementType.Special_Hp3:
            return "HP+3 特殊";
        case WeaponRefinementType.Special:
            return "特殊";
        case WeaponRefinementType.WrathfulStaff:
            return "神罰の杖";
        case WeaponRefinementType.DazzlingStaff:
            return "幻惑の杖";
    }
}

// スキルIDが被らないようにプレフィックスをつける
function getEmblemHeroSkillId(emblemHeroIndex) {
    return `e_${emblemHeroIndex}`;
}

const EmblemHeroSet = new Set(Object.values(EmblemHero));

const PhysicalWeaponTypeDict = {};
PhysicalWeaponTypeDict[WeaponType.Sword] = 0;
PhysicalWeaponTypeDict[WeaponType.Lance] = 0;
PhysicalWeaponTypeDict[WeaponType.Axe] = 0;
PhysicalWeaponTypeDict[WeaponType.RedBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.BlueBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.GreenBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.ColorlessBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.RedBow] = 0;
PhysicalWeaponTypeDict[WeaponType.BlueBow] = 0;
PhysicalWeaponTypeDict[WeaponType.GreenBow] = 0;
PhysicalWeaponTypeDict[WeaponType.ColorlessBow] = 0;
PhysicalWeaponTypeDict[WeaponType.RedDagger] = 0;
PhysicalWeaponTypeDict[WeaponType.BlueDagger] = 0;
PhysicalWeaponTypeDict[WeaponType.GreenDagger] = 0;
PhysicalWeaponTypeDict[WeaponType.ColorlessDagger] = 0;

/// 武器タイプが物理系の武器であるかを判定します。
function isPhysicalWeaponType(weaponType) {
    return weaponType in PhysicalWeaponTypeDict;
}

/// 武器錬成タイプが特殊錬成であるかを判定します。
function isWeaponSpecialRefined(weaponRefinementType) {
    switch (weaponRefinementType) {
        case WeaponRefinementType.Special:
        case WeaponRefinementType.Special_Hp3:
            return true;
        default:
            return false;
    }
}

const FiresweepWeaponDict = {};
FiresweepWeaponDict[Weapon.SoleilsShine] = 0;
FiresweepWeaponDict[Weapon.MiraiNoSeikishiNoYari] = 0;
FiresweepWeaponDict[Weapon.FiresweepSword] = 0;
FiresweepWeaponDict[Weapon.FiresweepSwordPlus] = 0;
FiresweepWeaponDict[Weapon.FiresweepLance] = 0;
FiresweepWeaponDict[Weapon.FiresweepLancePlus] = 0;
FiresweepWeaponDict[Weapon.FiresweepBow] = 0;
FiresweepWeaponDict[Weapon.FiresweepBowPlus] = 0;
FiresweepWeaponDict[Weapon.FiresweepAxePlus] = 0;

/// 自身、敵共に反撃不可になる武器であるかどうかを判定します。
function isFiresweepWeapon(weapon) {
    return weapon in FiresweepWeaponDict;
}

/// 補助スキルの射程を取得します。
function getAssistRange(support) {
    switch (support) {
        case Support.None:
            return 0;
        case Support.Physic:
        case Support.PhysicPlus:
            return 2;
        case Support.FoulPlay:
            return 3;
        default:
            return 1;
    }
}

/// 補助スキルが大応援かどうかを判定します。
function isRallyUp(support) {
    switch (support) {
        case Support.RallyUpSpd:
        case Support.RallyUpAtk:
        case Support.RallyUpAtkPlus:
        case Support.RallyUpSpdPlus:
        case Support.RallyUpDef:
        case Support.RallyUpDefPlus:
        case Support.RallyUpRes:
        case Support.RallyUpResPlus:
            return true;
        default:
            return false;
    }
}

/** @type {Map<number|string, [number, number, number, number]>} */
const RALLY_BUFF_AMOUNT_MAP = new Map();

/**
 * 応援スキルの攻撃の強化量を取得します。
 */
function getAtkBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[StatusIndex.Atk];
    }
    switch (support) {
        case Support.RallyAttack:
            return 4;
        case Support.RallyUpAtk:
            return 4;
        case Support.RallyUpAtkPlus:
            return 6;
        case Support.RallyAtkSpd:
            return 3;
        case Support.RallyAtkDef:
            return 3;
        case Support.RallyAtkRes:
            return 3;
        case Support.RallyAtkSpdPlus:
        case Support.RallyAtkDefPlus:
        case Support.RallyAtkResPlus:
            return 6;
        case Support.GoldSerpent:
            return Math.min(g_appData.globalBattleContext.currentTurn * 2, 8);
        default:
            return 0;
    }
}

/// 応援スキルの速さの強化量を取得します。
function getSpdBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[StatusIndex.Spd];
    }
    switch (support) {
        case Support.RallySpeed:
            return 4;
        case Support.RallyUpSpd:
            return 4;
        case Support.RallyUpSpdPlus:
            return 6;
        case Support.RallyAtkSpd:
            return 3;
        case Support.RallySpdDef:
            return 3;
        case Support.RallySpdRes:
            return 3;
        case Support.RallySpdResPlus:
        case Support.RallySpdDefPlus:
        case Support.RallyAtkSpdPlus:
            return 6;
        case Support.GoldSerpent:
            return Math.min(g_appData.globalBattleContext.currentTurn * 2, 8);
        default:
            return 0;
    }
}

/// 応援スキルの守備の強化量を取得します。
function getDefBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[StatusIndex.Def];
    }
    switch (support) {
        case Support.RallyUpDef:
            return 4;
        case Support.RallyUpDefPlus:
            return 6;
        case Support.RallyDefense:
            return 4;
        case Support.RallySpdDef:
            return 3;
        case Support.RallyAtkDef:
            return 3;
        case Support.RallyDefRes:
            return 3;
        case Support.RallyAtkDefPlus:
        case Support.RallySpdDefPlus:
        case Support.RallyDefResPlus:
            return 6;
        case Support.GoldSerpent:
            return Math.min(g_appData.globalBattleContext.currentTurn * 2, 8);
        default:
            return 0;
    }
}

/// 応援スキルの魔防の強化量を取得します。
function getResBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[StatusIndex.Res];
    }
    switch (support) {
        case Support.RallyUpRes:
            return 4;
        case Support.RallyUpResPlus:
            return 6;
        case Support.RallyResistance:
            return 4;
        case Support.RallyDefRes:
            return 3;
        case Support.RallySpdRes:
            return 3;
        case Support.RallyAtkRes:
            return 3;
        case Support.RallySpdResPlus:
        case Support.RallyDefResPlus:
        case Support.RallyAtkResPlus:
            return 6;
        case Support.GoldSerpent:
            return Math.min(g_appData.globalBattleContext.currentTurn * 2, 8);
        default:
            return 0;
    }
}

/** @type {Map<number, number>} */
const PRECOMBAT_HEAL_THRESHOLD_MAP = new Map();

/**
 * 回復系の補助スキルの戦闘前補助実行可能な回復量を取得します。
 * https://vervefeh.github.io/FEH-AI/charts.html#chartF
 */
function getPrecombatHealThreshold(support) {
    if (PRECOMBAT_HEAL_THRESHOLD_MAP.has(support)) {
        return PRECOMBAT_HEAL_THRESHOLD_MAP.get(support);
    }
    switch (support) {
        case Support.MaidensSolace:
        case Support.Sacrifice:
            return 1;
        case Support.Heal:
            return 5;
        case Support.Reconcile:
            return 7;
        case Support.Physic:
            return 8;
        case Support.PhysicPlus:
        case Support.Rehabilitate:
        case Support.RehabilitatePlus:
        case Support.Martyr:
        case Support.MartyrPlus:
        case Support.Recover:
        case Support.RecoverPlus:
        case Support.Restore:
        case Support.RestorePlus:
        case Support.Rescue:
        case Support.RescuePlus:
        case Support.Mend:
        case Support.Return:
        case Support.ReturnPlus:
        case Support.Nudge:
        case Support.NudgePlus:
            return 10;
        default:
            return -1;
    }
}

const RangedAttackSpecialDict = {};
RangedAttackSpecialDict[Special.GrowingFlame] = 0;
RangedAttackSpecialDict[Special.GrowingLight] = 0;
RangedAttackSpecialDict[Special.GrowingWind] = 0;
RangedAttackSpecialDict[Special.GrowingThunder] = 0;
RangedAttackSpecialDict[Special.BlazingFlame] = 0;
RangedAttackSpecialDict[Special.BlazingLight] = 0;
RangedAttackSpecialDict[Special.BlazingWind] = 0;
RangedAttackSpecialDict[Special.BlazingThunder] = 0;
RangedAttackSpecialDict[Special.RisingFlame] = 0;
RangedAttackSpecialDict[Special.RisingLight] = 0;
RangedAttackSpecialDict[Special.RisingWind] = 0;
RangedAttackSpecialDict[Special.RisingThunder] = 0;
RangedAttackSpecialDict[Special.GiftedMagic] = 0;

/// 範囲奥義かどうかを判定します。
function isRangedAttackSpecial(special) {
    return special in RangedAttackSpecialDict;
}

const RangedAttackSpecialDamageRateDict = {};
RangedAttackSpecialDamageRateDict[Special.GrowingFlame] = 1;
RangedAttackSpecialDamageRateDict[Special.GrowingLight] = 1;
RangedAttackSpecialDamageRateDict[Special.GrowingWind] = 1;
RangedAttackSpecialDamageRateDict[Special.GrowingThunder] = 1;
RangedAttackSpecialDamageRateDict[Special.BlazingFlame] = 1.5;
RangedAttackSpecialDamageRateDict[Special.BlazingLight] = 1.5;
RangedAttackSpecialDamageRateDict[Special.BlazingWind] = 1.5;
RangedAttackSpecialDamageRateDict[Special.BlazingThunder] = 1.5;
RangedAttackSpecialDamageRateDict[Special.RisingFlame] = 1;
RangedAttackSpecialDamageRateDict[Special.RisingLight] = 1;
RangedAttackSpecialDamageRateDict[Special.RisingWind] = 1;
RangedAttackSpecialDamageRateDict[Special.RisingThunder] = 1;
RangedAttackSpecialDamageRateDict[Special.GiftedMagic] = 0.8;

function getRangedAttackSpecialDamageRate(special) {
    let rate = RangedAttackSpecialDamageRateDict[special];
    if (rate) {
        return rate;
    }
    return 0;
}

const DefenseSpecialDict = {};
DefenseSpecialDict[Special.Nagatate] = 0;
DefenseSpecialDict[Special.Otate] = 0;  // 大盾
DefenseSpecialDict[Special.Kotate] = 0; // 小盾
DefenseSpecialDict[Special.Seitate] = 0; // 聖盾
DefenseSpecialDict[Special.Seii] = 0;  // 聖衣
DefenseSpecialDict[Special.Seikabuto] = 0; // 聖兜
DefenseSpecialDict[Special.IceMirror] = 0;
DefenseSpecialDict[Special.IceMirror2] = 0;
DefenseSpecialDict[Special.FrostbiteMirror] = 0;
DefenseSpecialDict[Special.NegatingFang] = 0;
DefenseSpecialDict[Special.GodlikeReflexes] = 0;
DefenseSpecialDict[Special.Miracle] = 0;

/// 防御系の奥義かどうかを判定します。
function isDefenseSpecial(special) {
    return special in DefenseSpecialDict;
}

const NormalAttackSpecialDict = {};
NormalAttackSpecialDict[Special.DragonBlast] = 0;
NormalAttackSpecialDict[Special.Flare] = 0;
NormalAttackSpecialDict[Special.Moonbow] = 0;
NormalAttackSpecialDict[Special.Luna] = 0;
NormalAttackSpecialDict[Special.Aether] = 0;
NormalAttackSpecialDict[Special.LunaFlash] = 0;
NormalAttackSpecialDict[Special.LunarFlash2] = 0;
NormalAttackSpecialDict[Special.Glimmer] = 0;
NormalAttackSpecialDict[Special.Deadeye] = 0;
NormalAttackSpecialDict[Special.Astra] = 0;
NormalAttackSpecialDict[Special.ArmoredBeacon] = 0;
NormalAttackSpecialDict[Special.ArmoredFloe] = 0;
NormalAttackSpecialDict[Special.Bonfire] = 0;
NormalAttackSpecialDict[Special.Ignis] = 0;
NormalAttackSpecialDict[Special.Iceberg] = 0;
NormalAttackSpecialDict[Special.Glacies] = 0;
NormalAttackSpecialDict[Special.CircletOfBalance] = 0;
NormalAttackSpecialDict[Special.HolyKnightAura] = 0;
NormalAttackSpecialDict[Special.ChivalricAura] = 0; // グランベルの騎士道
NormalAttackSpecialDict[Special.DraconicAura] = 0;
NormalAttackSpecialDict[Special.DragonFang] = 0;
NormalAttackSpecialDict[Special.Enclosure] = 0; // 閉界
NormalAttackSpecialDict[Special.Sirius] = 0; // 天狼
NormalAttackSpecialDict[Special.SiriusPlus] = 0; // 天狼
NormalAttackSpecialDict[Special.RupturedSky] = 0; // 破天
NormalAttackSpecialDict[Special.TwinBlades] = 0; // 双刃
NormalAttackSpecialDict[Special.Taiyo] = 0;
NormalAttackSpecialDict[Special.Yuyo] = 0;
NormalAttackSpecialDict[Special.RegnalAstra] = 0; // 剣姫の流星
NormalAttackSpecialDict[Special.ImperialAstra] = 0; // 剣皇の流星
NormalAttackSpecialDict[Special.VitalAstra] = 0; // 心流星
NormalAttackSpecialDict[Special.SupremeAstra] = 0; // 無双の流星
NormalAttackSpecialDict[Special.OpenTheFuture] = 0; // 開世
NormalAttackSpecialDict[Special.Fukusyu] = 0; // 復讐
NormalAttackSpecialDict[Special.Kessyu] = 0; // 血讐
NormalAttackSpecialDict[Special.Kagetsuki] = 0; // 影月
NormalAttackSpecialDict[Special.Setsujoku] = 0; // 雪辱
NormalAttackSpecialDict[Special.Hyouten] = 0; // 氷点
NormalAttackSpecialDict[Special.Youkage] = 0; // 陽影
NormalAttackSpecialDict[Special.Hotarubi] = 0; // 蛍火
NormalAttackSpecialDict[Special.ShiningEmblem] = 0; // 光炎の紋章
NormalAttackSpecialDict[Special.HonoNoMonsyo] = 0; // 炎の紋章
NormalAttackSpecialDict[Special.HerosBlood] = 0;
NormalAttackSpecialDict[Special.KuroNoGekko] = 0; // 黒の月光
NormalAttackSpecialDict[Special.Lethality] = 0; // 滅殺
NormalAttackSpecialDict[Special.AoNoTenku] = 0; // 蒼の天空
NormalAttackSpecialDict[Special.RadiantAether2] = 0; // 蒼の天空・承
NormalAttackSpecialDict[Special.MayhemAether] = 0; // 暴の天空
NormalAttackSpecialDict[Special.Hoshikage] = 0; // 星影
NormalAttackSpecialDict[Special.Fukuryu] = 0; // 伏竜
NormalAttackSpecialDict[Special.BlueFrame] = 0; // ブルーフレイム
NormalAttackSpecialDict[Special.SeidrShell] = 0; // 魔弾
NormalAttackSpecialDict[Special.BrutalShell] = 0; // 凶弾
NormalAttackSpecialDict[Special.RighteousWind] = 0;
NormalAttackSpecialDict[Special.SublimeHeaven] = 0;
NormalAttackSpecialDict[Special.DevinePulse] = 0;

/// 戦闘中に発動する攻撃系の奥義かどうかを判定します。
function isNormalAttackSpecial(special) {
    return special in NormalAttackSpecialDict;
}

/// 再行動補助スキルかどうかを判定します。
const refreshSupportSkillSet = new Set();

/**
 * 応援扱いの回復サポートスキルIDの集合
 */
const RALLY_HEAL_SKILL_SET = new Set();

function isRefreshSupportSkill(skillId) {
    if (refreshSupportSkillSet.has(skillId)) {
        return true;
    }
    switch (skillId) {
        case Support.DragonsDance:
        case Support.CallToFlame:
        case Support.Sing:
        case Support.Dance:
        case Support.GrayWaves:
        case Support.GentleDream:
        case Support.GentleDreamPlus:
        case Support.TenderDream:
        case Support.WhimsicalDream:
        case Support.SweetDreams:
        case Support.CloyingDreams:
        case Support.FrightfulDream:
        case Support.HarrowingDream:
        case Support.Play:
            return true;
        default:
            return false;
    }
}

/**
 * 応援扱いの回復サポートスキルかどうかを返す
 */
function isRallyHealSkill(skillId) {
    return RALLY_HEAL_SKILL_SET.has(skillId);
}

const BowWeaponTypeTable = {}
BowWeaponTypeTable[WeaponType.RedBow] = 0;
BowWeaponTypeTable[WeaponType.BlueBow] = 0;
BowWeaponTypeTable[WeaponType.GreenBow] = 0;
BowWeaponTypeTable[WeaponType.ColorlessBow] = 0;
BowWeaponTypeTable[WeaponType.Bow] = 0;

/// 武器タイプが弓であるかを判定します。
function isWeaponTypeBow(type) {
    return type in BowWeaponTypeTable;
}

const DaggerWeaponTypeTable = {}
DaggerWeaponTypeTable[WeaponType.RedDagger] = 0;
DaggerWeaponTypeTable[WeaponType.BlueDagger] = 0;
DaggerWeaponTypeTable[WeaponType.GreenDagger] = 0;
DaggerWeaponTypeTable[WeaponType.ColorlessDagger] = 0;
DaggerWeaponTypeTable[WeaponType.Dagger] = 0;

/// 武器タイプが暗器であるかを判定します。
function isWeaponTypeDagger(type) {
    return type in DaggerWeaponTypeTable;
}

const TomeWeaponTypeTable = {}
TomeWeaponTypeTable[WeaponType.RedTome] = 0;
TomeWeaponTypeTable[WeaponType.BlueTome] = 0;
TomeWeaponTypeTable[WeaponType.GreenTome] = 0;
TomeWeaponTypeTable[WeaponType.ColorlessTome] = 0;
TomeWeaponTypeTable[WeaponType.Tome] = 0;

/// 武器タイプが魔法であるかを判定します。
function isWeaponTypeTome(type) {
    return type in TomeWeaponTypeTable;
}

const BreathWeaponTypeTable = {}
BreathWeaponTypeTable[WeaponType.RedBreath] = 0;
BreathWeaponTypeTable[WeaponType.BlueBreath] = 0;
BreathWeaponTypeTable[WeaponType.GreenBreath] = 0;
BreathWeaponTypeTable[WeaponType.ColorlessBreath] = 0;
BreathWeaponTypeTable[WeaponType.Breath] = 0;

/// 武器タイプが竜であるかを判定します。
function isWeaponTypeBreath(type) {
    return type in BreathWeaponTypeTable;
}

const BeastWeaponTypeTable = {}
BeastWeaponTypeTable[WeaponType.RedBeast] = 0;
BeastWeaponTypeTable[WeaponType.BlueBeast] = 0;
BeastWeaponTypeTable[WeaponType.GreenBeast] = 0;
BeastWeaponTypeTable[WeaponType.ColorlessBeast] = 0;
BeastWeaponTypeTable[WeaponType.Beast] = 0;

/// 武器タイプが獣であるかを判定します。
function isWeaponTypeBeast(type) {
    return type in BeastWeaponTypeTable;
}

/// 武器タイプが2距離射程の武器であるかを判定します。
function isRangedWeaponType(weaponType) {
    return !isMeleeWeaponType(weaponType);
}

const MeleeWeaponTypeTable = {};
MeleeWeaponTypeTable[WeaponType.Sword] = 0;
MeleeWeaponTypeTable[WeaponType.Axe] = 0;
MeleeWeaponTypeTable[WeaponType.Lance] = 0;
MeleeWeaponTypeTable[WeaponType.RedBeast] = 0;
MeleeWeaponTypeTable[WeaponType.BlueBeast] = 0;
MeleeWeaponTypeTable[WeaponType.GreenBeast] = 0;
MeleeWeaponTypeTable[WeaponType.ColorlessBeast] = 0;
MeleeWeaponTypeTable[WeaponType.RedBreath] = 0;
MeleeWeaponTypeTable[WeaponType.BlueBreath] = 0;
MeleeWeaponTypeTable[WeaponType.GreenBreath] = 0;
MeleeWeaponTypeTable[WeaponType.ColorlessBreath] = 0;
MeleeWeaponTypeTable[WeaponType.Breath] = 0;
MeleeWeaponTypeTable[WeaponType.Beast] = 0;

/// 武器タイプが1距離射程の武器であるかを判定します。
function isMeleeWeaponType(weaponType) {
    return weaponType in MeleeWeaponTypeTable;
}

/// 武器タイプが竜、もしくは獣であるかを判定します。
function isWeaponTypeBreathOrBeast(type) {
    return isWeaponTypeBeast(type) || isWeaponTypeBreath(type);
}

/// 武器タイプが継承可能であるかを判定します。
function isInheritableWeaponType(targetType, types) {
    for (let type of types) {
        if (type === targetType) {
            return true;
        }
        switch (type) {
            case WeaponType.All:
                return true;
            case WeaponType.ExceptStaff:
                if (targetType !== WeaponType.Staff) {
                    return true;
                }
                break;
            case WeaponType.Bow:
                if (isWeaponTypeBow(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Dagger:
                if (isWeaponTypeDagger(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Tome:
                if (isWeaponTypeTome(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Beast:
                if (isWeaponTypeBeast(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Breath:
                if (isWeaponTypeBreath(targetType)) {
                    return true;
                }
                break;
        }
    }
    return false;
}

const WeaponTypeToColorType = {};
WeaponTypeToColorType[WeaponType.Sword] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedTome] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedBreath] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedBeast] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedBow] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedDagger] = ColorType.Red;
WeaponTypeToColorType[WeaponType.Lance] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueTome] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueBreath] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueBeast] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueBow] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueDagger] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.Axe] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenTome] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenBreath] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenBeast] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenBow] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenDagger] = ColorType.Green;
WeaponTypeToColorType[WeaponType.Staff] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessTome] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessBreath] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessBeast] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessBow] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessDagger] = ColorType.Colorless;

function getColorFromWeaponType(weaponType) {
    return WeaponTypeToColorType[weaponType];
}

function stringToWeaponType(input) {
    switch (input) {
        case "剣":
            return WeaponType.Sword;
        case "槍":
            return WeaponType.Lance;
        case "斧":
            return WeaponType.Axe;
        case "無魔":
            return WeaponType.ColorlessTome;
        case "赤魔":
            return WeaponType.RedTome;
        case "青魔":
            return WeaponType.BlueTome;
        case "緑魔":
            return WeaponType.GreenTome;
        case "赤竜":
            return WeaponType.RedBreath;
        case "青竜":
            return WeaponType.BlueBreath;
        case "緑竜":
            return WeaponType.GreenBreath;
        case "無竜":
            return WeaponType.ColorlessBreath;
        case "杖":
            return WeaponType.Staff;
        case "暗器":
            return WeaponType.ColorlessDagger;
        case "赤暗器":
            return WeaponType.RedDagger;
        case "青暗器":
            return WeaponType.BlueDagger;
        case "緑暗器":
            return WeaponType.GreenDagger;
        case "弓":
            return WeaponType.ColorlessBow;
        case "赤弓":
            return WeaponType.RedBow;
        case "青弓":
            return WeaponType.BlueBow;
        case "緑弓":
            return WeaponType.GreenBow;
        case "赤獣":
            return WeaponType.RedBeast;
        case "青獣":
            return WeaponType.BlueBeast;
        case "緑獣":
            return WeaponType.GreenBeast;
        case "獣":
            return WeaponType.ColorlessBeast;
        default:
            return WeaponType.None;
    }
}

function weaponTypeToString(weaponType) {
    switch (weaponType) {
        case WeaponType.Sword:
            return "剣";
        case WeaponType.ColorlessTome:
            return "無魔";
        case WeaponType.RedTome:
            return "赤魔";
        case WeaponType.RedBreath:
            return "赤竜";
        case WeaponType.RedBeast:
            return "赤獣";
        case WeaponType.RedBow:
            return "赤弓";
        case WeaponType.RedDagger:
            return "赤暗器";
        case WeaponType.Lance:
            return "槍";
        case WeaponType.BlueTome:
            return "青魔";
        case WeaponType.BlueBreath:
            return "青竜";
        case WeaponType.BlueBeast:
            return "青獣";
        case WeaponType.BlueBow:
            return "青弓";
        case WeaponType.BlueDagger:
            return "青暗器";
        case WeaponType.Axe:
            return "斧";
        case WeaponType.GreenTome:
            return "緑魔";
        case WeaponType.GreenBreath:
            return "緑竜";
        case WeaponType.GreenBeast:
            return "緑獣";
        case WeaponType.GreenBow:
            return "緑弓";
        case WeaponType.GreenDagger:
            return "緑暗器";
        case WeaponType.Staff:
            return "杖";
        case WeaponType.ColorlessBreath:
            return "竜";
        case WeaponType.ColorlessBeast:
            return "獣";
        case WeaponType.ColorlessBow:
            return "弓";
        case WeaponType.ColorlessDagger:
            return "暗器";
        case WeaponType.Breath:
            return "竜石";
        case WeaponType.Beast:
            return "獣";
        default:
            return "不明";
    }
}

function canRallyForciblyByPlayer(unit) {
    let skillId = unit.support;
    let funcMap = canRallyForciblyByPlayerFuncMap;
    if (funcMap.has(skillId)) {
        let func = funcMap.get(skillId);
        if (typeof func === "function") {
            let result = func.call(this, unit);
            if (result) {
                return true;
            }
        } else {
            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
        }
    }
    return false;
}

/// 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
function canRallyForcibly(skill, unit) {
    let skillId = skill;
    let funcMap = canRallyForciblyFuncMap;
    if (funcMap.has(skillId)) {
        let func = funcMap.get(skillId);
        if (typeof func === "function") {
            let result = func.call(this, unit);
            if (result) {
                return true;
            }
        } else {
            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
        }
    }
    switch (skill) {
        case Support.GoldSerpent:
            // TODO: 調査する
            return true;
        case Weapon.Heidr:
        case Weapon.GoldenCurse:
            return true;
        case Weapon.RetainersReport:
            if (unit.isWeaponSpecialRefined) {
                return true;
            }
            break;
        case PassiveB.AtkFeint3:
        case PassiveB.SpdFeint3:
        case PassiveB.DefFeint3:
        case PassiveB.ResFeint3:
        case PassiveB.AtkSpdRuse3:
        case PassiveB.AtkDefRuse3:
        case PassiveB.AtkResRuse3:
        case PassiveB.DefResRuse3:
        case PassiveB.SpdResRuse3:
        case PassiveB.SpdDefRuse3:
            return true;
        default:
            return false;
    }
}

function canRalliedForcibly(skillId, unit) {
    let funcMap = canRalliedForciblyFuncMap;
    if (funcMap.has(skillId)) {
        let func = funcMap.get(skillId);
        if (typeof func === "function") {
            let result = func.call(this, unit);
            if (result) {
                return true;
            }
        } else {
            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
        }
    }
    switch (skillId) {
        case Support.GoldSerpent:
            // TODO: 調査する
            return true;
        case Weapon.Heidr:
        case Weapon.GoldenCurse:
            return true;
        case Weapon.RetainersReport:
            if (unit.isWeaponSpecialRefined) {
                return true;
            }
            break;
        case PassiveB.AtkFeint3:
        case PassiveB.SpdFeint3:
        case PassiveB.DefFeint3:
        case PassiveB.ResFeint3:
        case PassiveB.AtkSpdRuse3:
        case PassiveB.AtkDefRuse3:
        case PassiveB.AtkResRuse3:
        case PassiveB.DefResRuse3:
        case PassiveB.SpdResRuse3:
        case PassiveB.SpdDefRuse3:
            return true;
        default:
            return false;
    }
}

/// 戦闘前に発動するスペシャルであるかどうかを判定します。
function isPrecombatSpecial(special) {
    return isRangedAttackSpecial(special);
}

// 二分探索したいだけで値はどうでもいいので0を入れておきます
const TeleportationSkillDict = {};
TeleportationSkillDict[PassiveC.TipTheScales] = 0;
TeleportationSkillDict[Weapon.LanceOfHeroics] = 0;
TeleportationSkillDict[Weapon.FlowerLance] = 0;
TeleportationSkillDict[Weapon.FujinYumi] = 0;
TeleportationSkillDict[Weapon.Gurimowaru] = 0;
TeleportationSkillDict[Weapon.ApotheosisSpear] = 0;
TeleportationSkillDict[Weapon.Noatun] = 0;
TeleportationSkillDict[Weapon.HinokaNoKounagitou] = 0;
TeleportationSkillDict[Weapon.IzunNoKajitsu] = 0;
TeleportationSkillDict[PassiveB.TeniNoKona] = 0;
TeleportationSkillDict[PassiveB.Kyuen2] = 0;
TeleportationSkillDict[PassiveB.Kyuen3] = 0;
TeleportationSkillDict[PassiveB.WingsOfMercy4] = 0;
TeleportationSkillDict[PassiveB.Ridatsu3] = 0;
TeleportationSkillDict[PassiveB.EscapeRoute4] = 0;
TeleportationSkillDict[PassiveB.KyokugiHiKo1] = 0;
TeleportationSkillDict[PassiveB.KyokugiHiKo2] = 0;
TeleportationSkillDict[PassiveB.KyokugiHiKo3] = 0;
TeleportationSkillDict[PassiveB.HentaiHiko1] = 0;
TeleportationSkillDict[PassiveB.HentaiHiko2] = 0;
TeleportationSkillDict[PassiveB.HentaiHiko3] = 0;
TeleportationSkillDict[PassiveC.SorakaranoSendo3] = 0;
TeleportationSkillDict[PassiveC.Guidance4] = 0;
TeleportationSkillDict[PassiveC.SoaringGuidance] = 0;
TeleportationSkillDict[PassiveC.HikonoSendo3] = 0;
TeleportationSkillDict[PassiveC.OpeningRetainer] = 0;
TeleportationSkillDict[Weapon.SilentPower] = 0;

/// テレポート効果を持つスキルであるかどうかを判定します。
function isTeleportationSkill(skillId) {
    return skillId in TeleportationSkillDict;
}

/// 天駆の道の効果を持つスキルかどうか
function hasPathfinderEffect(skillId) {
    let funcMap = hasPathfinderEffectFuncMap;
    if (funcMap.has(skillId)) {
        let func = funcMap.get(skillId);
        if (typeof func === "function") {
            if (func.call(this)) {
                return true;
            }
        } else {
            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
        }
    }
    switch (skillId) {
        case PassiveB.TwinSkyWing:
        case Weapon.JotnarBow:
        case Weapon.Hrimfaxi:
        case Captain.Eminence:
            return true;
        default:
            return false;
    }
}

/// 「自分の最大HP-現HPの〇%を奥義ダメージに加算」の割合を0～1で返します。
function getSelfDamageDealtRateToAddSpecialDamage(skillId) {
    switch (skillId) {
        case Special.Fukusyu:
            return 0.5;
        case Special.Setsujoku:
        case Special.Kessyu:
            return 0.3;
        default:
            return 0;
    }
}

const TriangleAdeptDict = {};
TriangleAdeptDict[PassiveA.AishoGekika3] = 0;
TriangleAdeptDict[Weapon.AsahiNoKen] = 0;
TriangleAdeptDict[Weapon.AsahiNoKenPlus] = 0;
TriangleAdeptDict[Weapon.SoukaiNoYari] = 0;
TriangleAdeptDict[Weapon.SoukaiNoYariPlus] = 0;
TriangleAdeptDict[Weapon.ShinryokuNoOno] = 0;
TriangleAdeptDict[Weapon.ShinryokuNoOnoPlus] = 0;
TriangleAdeptDict[Weapon.WakakiMogyuNoYari] = 0;
TriangleAdeptDict[Weapon.WakakiKurohyoNoKen] = 0;
TriangleAdeptDict[Weapon.ShinginNoSeiken] = 0;
TriangleAdeptDict[Weapon.YoheidanNoSenfu] = 0;

/// 相性激化3の効果を標準で発動できるすきるかどうかを判定します。
function isTriangleAdeptSkill(skillId) {
    return skillId in TriangleAdeptDict;
}

const EvalSpdAddDict = {};
EvalSpdAddDict[PassiveB.BindingNecklacePlus] = 7;
EvalSpdAddDict[PassiveS.HayasaNoKyosei1] = 5;
EvalSpdAddDict[PassiveS.HayasaNoKyosei2] = 8;
EvalSpdAddDict[PassiveS.HayasaNoKyosei3] = 10;
EvalSpdAddDict[PassiveB.Spurn4] = 7;
EvalSpdAddDict[PassiveB.CloseCall4] = 7;
EvalSpdAddDict[PassiveB.Repel4] = 7;
EvalSpdAddDict[PassiveB.BeastSense4] = 7;
EvalSpdAddDict[Weapon.SharpWarSword] = 10;

/// 速さ比較時の速さ加算値を取得します。
function getEvalSpdAdd(unit) {
    let amount = 0;
    for (let skillId of unit.enumerateSkills()) {
        let value = EvalSpdAddDict[skillId];
        amount += value ? value : 0;
        let funcMap = evalSpdAddFuncMap;
        if (funcMap.has(skillId)) {
            let func = funcMap.get(skillId);
            if (typeof func === "function") {
                amount += func.call(this, unit);
            } else {
                console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
            }
        }
        switch (skillId) {
            case Weapon.NewBrazenCatFang:
                if (unit.isWeaponSpecialRefined) {
                    amount += 10;
                }
                break;
        }
    }
    return amount;
}

const EvalResAddDict = {};
EvalResAddDict[PassiveS.MaboNoKyosei1] = 5;
EvalResAddDict[PassiveS.MaboNoKyosei2] = 8;
EvalResAddDict[PassiveS.MaboNoKyosei3] = 10;

/// 魔防比較時の速さ加算値を取得します。
function getEvalResAdd(passiveS) {
    let value = EvalResAddDict[passiveS];
    return value ? value : 0;
}

const WeaponTypesAddAtk2AfterTransform = {};
WeaponTypesAddAtk2AfterTransform[Weapon.DreamHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ArcaneNihility] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.Ravager] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.WaryRabbitFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.KeenRabbitFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.FangOfFinality] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.HeraldingHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.EnclosingClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.FieryFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RoyalHatariFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.HornOfOpening] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.PolishedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.SparklingFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.EbonPirateClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.CrossbonesClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ResolvedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RefreshedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RenewedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RaydreamHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.BrightmareHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.NightmareHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.BrazenCatFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TaguelFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TaguelChildFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.FoxkitFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.NewBrazenCatFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.NewFoxkitFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.KarasuOuNoHashizume] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TakaouNoHashizume] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.YoukoohNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.JunaruSenekoNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ShishiouNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TrasenshiNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.JinroMusumeNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.JinroOuNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.OkamijoouNoKiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ShirasagiNoTsubasa] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.SeijuNoKeshinHiko] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.GroomsWings] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.SkyPirateClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TwinCrestPower] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.IlluminatingHorn] = 0;

function isWeaponTypeThatCanAddAtk2AfterTransform(weapon) {
    return weapon in WeaponTypesAddAtk2AfterTransform;
}

// 化身による共通の効果
// TODO 残りも実装する
const BeastCommonSkillType = {
    Infantry: 0, // 初期の歩行近接
    Infantry2: 1, // アシュ以降の歩行近接
    Infantry2IfRefined: 2, // 錬成して次世代になる歩行近接
    Armor: 3,
    Cavalry: 4,
    Flying: 5,
    Cavalry2: 6, // TODO: 次世代騎馬なのか魔器だけなのか確認する
}

const BeastCommonSkillMap =
    new Map(
        [
            // 次世代歩行
            [Weapon.HeraldingHorn, BeastCommonSkillType.Infantry2],
            [Weapon.FieryFang, BeastCommonSkillType.Infantry2],
            [Weapon.WildTigerFang, BeastCommonSkillType.Infantry2],
            [Weapon.RoyalHatariFang, BeastCommonSkillType.Infantry2],
            [Weapon.PolishedFang, BeastCommonSkillType.Infantry2],
            [Weapon.HornOfOpening, BeastCommonSkillType.Infantry2],
            [Weapon.IlluminatingHorn, BeastCommonSkillType.Infantry2],

            // 錬成すると次世代歩行
            [Weapon.JinroOuNoTsumekiba, BeastCommonSkillType.Infantry2IfRefined],
            [Weapon.OkamijoouNoKiba, BeastCommonSkillType.Infantry2IfRefined],
            [Weapon.JinroMusumeNoTsumekiba, BeastCommonSkillType.Infantry2IfRefined],
            [Weapon.TrasenshiNoTsumekiba, BeastCommonSkillType.Infantry2IfRefined],

            // 旧世代歩行
            [Weapon.RenewedFang, BeastCommonSkillType.Infantry],
            [Weapon.GroomsWings, BeastCommonSkillType.Infantry],

            // 次世代騎馬
            [Weapon.ArcaneNihility, BeastCommonSkillType.Cavalry2],
            [Weapon.DreamHorn, BeastCommonSkillType.Cavalry2],

            // 騎馬
            [Weapon.WaryRabbitFang, BeastCommonSkillType.Cavalry],
            [Weapon.KeenRabbitFang, BeastCommonSkillType.Cavalry],
            [Weapon.SparklingFang, BeastCommonSkillType.Cavalry],
            [Weapon.RefreshedFang, BeastCommonSkillType.Cavalry],
            [Weapon.RaydreamHorn, BeastCommonSkillType.Cavalry],
            [Weapon.BrightmareHorn, BeastCommonSkillType.Cavalry],
            [Weapon.NightmareHorn, BeastCommonSkillType.Cavalry],
            [Weapon.BrazenCatFang, BeastCommonSkillType.Cavalry],
            [Weapon.NewBrazenCatFang, BeastCommonSkillType.Cavalry],
            [Weapon.NewFoxkitFang, BeastCommonSkillType.Cavalry],
            [Weapon.FoxkitFang, BeastCommonSkillType.Cavalry],
            [Weapon.TaguelFang, BeastCommonSkillType.Cavalry],
            [Weapon.TaguelChildFang, BeastCommonSkillType.Cavalry],
            [Weapon.YoukoohNoTsumekiba, BeastCommonSkillType.Cavalry],
            [Weapon.JunaruSenekoNoTsumekiba, BeastCommonSkillType.Cavalry],
        ]
    );

const AdvantageousAgainstColorlessWeaponTable = {};
AdvantageousAgainstColorlessWeaponTable[Weapon.EtherealBreath] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.KinsekiNoSyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.GunshiNoRaisyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.KokukarasuNoSyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.GunshiNoFusho] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Blarraven] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.BlarravenPlus] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Gronnraven] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.GronnravenPlus] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Rauarraven] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.RauarravenPlus] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.YukyuNoSyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Nagurufaru] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.TomeOfOrder] = 0;

function isAdvantageousForColorless(weapon) {
    return weapon in AdvantageousAgainstColorlessWeaponTable;
}

const BreakerSkillToTargetWeaponTypeTable = {};
BreakerSkillToTargetWeaponTypeTable[PassiveB.Swordbreaker3] = WeaponType.Sword;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Lancebreaker3] = WeaponType.Lance;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Axebreaker3] = WeaponType.Axe;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Bowbreaker3] = WeaponType.ColorlessBow;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Daggerbreaker3] = WeaponType.ColorlessDagger;
BreakerSkillToTargetWeaponTypeTable[PassiveB.RedTomebreaker3] = WeaponType.RedTome;
BreakerSkillToTargetWeaponTypeTable[PassiveB.BlueTomebreaker3] = WeaponType.BlueTome;
BreakerSkillToTargetWeaponTypeTable[PassiveB.GreenTomebreaker3] = WeaponType.GreenTome;

function getBreakerSkillTargetWeaponType(breakerSkillId) {
    return BreakerSkillToTargetWeaponTypeTable[breakerSkillId];
}

/**
 * 入力した連想配列の値をキーとすると連想配列を作ります。
 * @param  {Object} sourceDict
 */
function __createValueDict(sourceDict) {
    let valueDict = {};
    Object.values(sourceDict).forEach(value => valueDict[value] = value);
    return valueDict;
}

const WeaponValueDict = __createValueDict(Weapon);
const SupportValueDict = __createValueDict(Support);
const SpecialValueDict = __createValueDict(Special);
const PassiveAValueDict = __createValueDict(PassiveA);
const PassiveBValueDict = __createValueDict(PassiveB);
const PassiveCValueDict = __createValueDict(PassiveC);
const PassiveSValueDict = __createValueDict(PassiveS);
const PassiveXValueDict = __createValueDict(PassiveX);
const CaptainValueDict = __createValueDict(Captain);

const SaveSkills = new Set([
    PassiveC.WoefulUpheaval,
    PassiveC.WithEveryone2,
    PassiveC.AsFarSave3,
    PassiveC.AdFarSave3,
    PassiveC.ArFarSave3,
    PassiveC.DrFarSave3,
    PassiveC.AsNearSave3,
    PassiveC.ArNearSave3,
    PassiveC.AdNearSave3,
    PassiveC.DrNearSave3,
]);

/// スキル情報です。ユニットの初期化等に使用します。
class SkillInfo {
    /**
     * @param  {String} id
     * @param  {String} name
     * @param  {Number} might
     * @param  {Number} specialCount
     * @param  {Number} hp
     * @param  {Number} atk
     * @param  {Number} spd
     * @param  {Number} def
     * @param  {Number} res
     * @param  effectives
     * @param  invalidatedEffectives
     * @param  {Number} cooldownCount
     * @param  {Number} atkCount
     * @param  {Number} counteratkCount
     * @param  {Boolean} canCounterattackToAllDistance
     * @param  {Boolean} isSacredSealAvailable
     * @param  {Number} mightRefine
     * @param  {Boolean} disableCounterattack
     * @param  {Boolean} wrathfulStaff
     * @param  assistType
     * @param  {Boolean} isNoAdditionalImplRequired
     * @param  {Number} specialRefineHpAdd
     * @param  weaponType
     * @param  {Number} sp
     * @param  {Boolean} canInherit
     * @param  inheritableWeaponTypes
     * @param  inheritableMoveTypes
     * @param  {Boolean} hasSpecialWeaponRefinement
     * @param  {Boolean} hasStatusWeaponRefinement
     * @param  {String} iconName
     * @param  {SkillType} skillType
     */
    constructor(id, name, might, specialCount, hp, atk, spd, def, res,
                effectives,
                invalidatedEffectives,
                cooldownCount,
                atkCount,
                counteratkCount,
                canCounterattackToAllDistance,
                isSacredSealAvailable,
                mightRefine,
                disableCounterattack,
                wrathfulStaff,
                assistType,
                isNoAdditionalImplRequired,
                specialRefineHpAdd,
                weaponType,
                sp,
                canInherit,
                inheritableWeaponTypes,
                inheritableMoveTypes,
                hasSpecialWeaponRefinement,
                hasStatusWeaponRefinement,
                iconName,
                skillType
    ) {
        this.id = id;
        this.detailPageUrl = g_siteRootPath + "?fehskill=" + id;
        this.name = name;
        this.might = might;
        this.mightRefine = mightRefine;
        this.specialCount = specialCount;
        this.hp = hp;
        this.atk = atk;
        this.spd = spd;
        this.def = def;
        this.res = res;
        this.effectives = effectives ?? [];
        this.invalidatedEffectives = invalidatedEffectives;
        this.cooldownCount = cooldownCount;
        this.attackCount = atkCount;
        this.counterattackCount = counteratkCount;
        this.canCounterattackToAllDistance = canCounterattackToAllDistance;
        this.isSacredSealAvailable = isSacredSealAvailable;
        this.disableCounterattack = disableCounterattack;
        this.wrathfulStaff = wrathfulStaff;
        this.assistType = assistType;
        this.isAdditionalImplRequired = !isNoAdditionalImplRequired;
        this.specialRefineHpAdd = specialRefineHpAdd;
        this.weaponType = weaponType;

        /** @type {number} */
        this.sp = sp;
        this.canInherit = canInherit;
        this.inheritableWeaponTypes = inheritableWeaponTypes;
        this.inheritableMoveTypes = inheritableMoveTypes;
        this.hasSpecialWeaponRefinement = hasSpecialWeaponRefinement;
        this.hasStatusWeaponRefinement = hasStatusWeaponRefinement;

        this.type = skillType;
        this.weaponRefinementOptions = [];

        /** @type {String} */
        this.iconPath = this.__getSkillIconPath(iconName);

        // 英雄情報から必要に応じて設定する
        // noinspection JSUnusedGlobalSymbols
        this.releaseDateAsNumber = 0;
    }

    /**
     * @returns {boolean}
     */
    isDuel4() {
        return this.name.includes("死闘")
            && this.name.endsWith("4");
    }

    /**
     * @returns {boolean}
     */
    isDuel3() {
        return this.name.includes("死闘")
            && this.name.endsWith("3");
    }

    /**
     * @returns {String}
     */
    getDisplayName() {
        if (this.isImplemented()) {
            return this.name;
        } else {
            return "×" + this.name;
        }
    }

    /**
     * 実装済みのスキルならtrue、そうでなければfalseを返します。
     * @returns {boolean}
     */
    isImplemented() {
        if (!this.isAdditionalImplRequired) {
            return true;
        }
        switch (this.type) {
            case SkillType.Weapon:
                return this.id in WeaponValueDict;
            case SkillType.Support:
                return this.id in SupportValueDict;
            case SkillType.Special:
                return this.id in SpecialValueDict;
            case SkillType.PassiveA:
                return this.id in PassiveAValueDict;
            case SkillType.PassiveB:
                return this.id in PassiveBValueDict;
            case SkillType.PassiveC:
                return this.id in PassiveCValueDict;
            case SkillType.PassiveS:
                return this.id in PassiveSValueDict;
            case SkillType.PassiveX:
                return this.id in PassiveXValueDict;
            case SkillType.Captain:
                return this.id in CaptainValueDict;
            default:
                throw new Error("Invalid skill type");
        }
    }

    __getSkillIconPath(iconName) {
        const iconRoot = g_skillIconRootPath;
        switch (this.type) {
            case SkillType.Weapon:
                return iconRoot + "Weapon.png";
            case SkillType.Support:
                return iconRoot + "Support.png";
            case SkillType.Special:
                return iconRoot + "Special.png";
        }

        if (iconName === "" || iconName == null) {
            return iconRoot + "None.png";
        }

        switch (this.type) {
            case SkillType.PassiveA:
                return iconRoot + "PassiveA/" + iconName;
            case SkillType.PassiveB:
                return iconRoot + "PassiveB/" + iconName;
            case SkillType.PassiveC:
                return iconRoot + "PassiveC/" + iconName;
            case SkillType.PassiveS:
                return iconRoot + "SacredSeal/" + iconName;
            case SkillType.PassiveX:
                return iconRoot + "Attuned/" + iconName;
            case SkillType.Captain:
                return iconRoot + "Captain/" + iconName;
            default:
                return "";
        }
    }
}

class MathUtil {
    /**
     * 「最低min、最大max」した値を返す。
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static ensureMinMax(value, min, max) {
        let v = value;
        v = MathUtil.ensureMin(v, min);
        v = MathUtil.ensureMax(v, max);
        return v;
    }

    /**
     * 「最低min」した値を返す。
     * @param {number} value
     * @param {number} min
     * @returns {number}
     */
    static ensureMin(value, min) {
        return Math.max(value, min);
    }

    /**
     * 「最大max」した値を返す。
     * @param {number} value
     * @param {number} max
     * @returns {number}
     */
    static ensureMax(value, max) {
        return Math.min(value, max);
    }
}

class DebugUtil {
    static getSkillName(unit, info) {
        return `${unit.nameWithGroup}の${info.name}`;
    }
}

const count2Specials = [];
const inheritableCount2Specials = [];
const count3Specials = [];
const inheritableCount3Specials = [];
const count4Specials = [];
const inheritableCount4Specials = [];

// 補助時に奥義発動カウントを進めないスキル
const noEffectOnSpecialCooldownChargeOnSupportSkillSet = new Set();
{
    let skills = [
        Support.RescuePlus, Support.Rescue,
        Support.ReturnPlus, Support.Return,
        Support.NudgePlus, Support.Nudge,
    ];
    for (let skill of skills) {
        noEffectOnSpecialCooldownChargeOnSupportSkillSet.add(skill);
    }
}

const StatusIndex = {
    Atk: 0,
    Spd: 1,
    Def: 2,
    Res: 3,
}

// TODO: ここから下の内容を別ファイルに分ける
// FuncMap
// noinspection DuplicatedCode
/** @type {Map<number|string, (this: DamageCalculator, target: Unit, enemy: Unit, context: DamageCalcContext) => void>} */
const applySpecialDamageReductionPerAttackFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, potentialDamage: boolean) => void>} */
const applySkillEffectForUnitFuncMap = new Map();
const canActivateCantoFuncMap = new Map();
const calcMoveCountForCantoFuncMap = new Map();
const evalSpdAddFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, defUnit: Unit, atkUnit: Unit) => void>} */
const applyPrecombatDamageReductionRatioFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler, owner: Unit) => void>} */
const applySkillForBeginningOfTurnFuncMap = new Map();
const applyEnemySkillForBeginningOfTurnFuncMap = new Map();
const setOnetimeActionActivatedFuncMap = new Map();
const applySkillEffectFromAlliesFuncMap = new Map();
const applySkillEffectFromAlliesExcludedFromFeudFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, enemyAlly: Unit, potentialDamage: boolean) => void>} */
const updateUnitSpurFromEnemyAlliesFuncMap = new Map();
const applyRefreshFuncMap = new Map();
const applySkillEffectsPerCombatFuncMap = new Map();
const initApplySpecialSkillEffectFuncMap = new Map();
const applyDamageReductionRatiosWhenCondSatisfiedFuncMap = new Map();
// 応援後のスキル
const applySkillsAfterRallyForSupporterFuncMap = new Map();
const applySkillsAfterRallyForTargetUnitFuncMap = new Map();
// 移動補助スキル後(スキル使用者、被使用者両者入れ替えて呼び出される)
const applyMovementAssistSkillFuncMap = new Map();
// 2023年11月時点では片方にだけかかるスキルは存在しない
// const applyMovementAssistSkillForSupporterFuncMap = new Map();
// const applyMovementAssistSkillForTargetUnitFuncMap = new Map();
// サポートスキル後
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit, supportTile: Tile) => void>} */
const applySupportSkillForSupporterFuncMap = new Map();
const applySupportSkillForTargetUnitFuncMap = new Map();
/** @type {Map<number|string, (this: Window, u: Unit) => boolean>} */
const canRallyForciblyFuncMap = new Map();
/** @type {Map<number|string, (this: Window, u: Unit) => boolean>} */
const canRallyForciblyByPlayerFuncMap = new Map();
const canRalliedForciblyFuncMap = new Map();
/** @type {Map<number|string, (u: Unit) => Generator<Tile>>} */
const enumerateTeleportTilesForUnitFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, target: Unit, enemy: Unit) => void>} */
const applySkillEffectAfterCombatForUnitFuncMap = new Map();
const applySKillEffectForUnitAtBeginningOfCombatFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, ally: Unit, enemy: Unit, potentialDamage: boolean) => void>} */
const updateUnitSpurFromAlliesFuncMap = new Map();
const canActivateObstructToAdjacentTilesFuncMap = new Map();
const canActivateObstructToTilesIn2SpacesFuncMap = new Map();
// 切り込みなど移動スキル終了後に発動するスキル効果
const applySkillEffectAfterMovementSkillsActivatedFuncMap = new Map();
// 優先度の高い再行動スキルの評価
// noinspection DuplicatedCode
const applyHighPriorityAnotherActionSkillEffectFuncMap = new Map();
// thisはUnit
const applyEndActionSkillsFuncMap = new Map();
// thisはUnit
const applySkillsAfterCantoActivatedFuncMap = new Map();
const hasTransformSkillsFuncMap = new Map();
const getTargetUnitTileAfterMoveAssistFuncMap = new Map();
const findTileAfterMovementAssistFuncMap = new Map();
// thisはUnit
const resetMaxSpecialCountFuncMap = new Map();
const isAfflictorFuncMap = new Map();
const applyAfterEnemySkillsSkillForBeginningOfTurnFuncMap = new Map();
const applyDamageReductionRatioBySpecialFuncMap = new Map();
// TODO: リファクタリングする
const activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap = new Map();
const addSpecialDamageAfterDefenderSpecialActivatedFuncMap = new Map();
const applySkillEffectAfterSpecialActivatedFuncMap = new Map();
const enumerateRangedSpecialTilesFuncMap = new Map();
const applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap = new Map();
// thisはUnit
const canDisableAttackOrderSwapSkillFuncMap = new Map();
const calcFixedAddDamageFuncMap = new Map();
const applyHealSkillForBeginningOfTurnFuncMap = new Map();
const applyMovementSkillAfterCombatFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
const applySkillEffectRelatedToFollowupAttackPossibilityFuncMap = new Map();
const applyPotentSkillEffectFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculator, target: Unit, enemy: Unit, canActivateAttackerSpecial: boolean) => void>} */
const applySkillEffectsPerAttackFuncMap = new Map();
const applySkillEffectAfterSetAttackCountFuncMap = new Map();
const canActivateSaveSkillFuncMap = new Map();
const selectReferencingResOrDefFuncMap = new Map();
/** @type {Map<number|string, (this: BattleMap, target: Unit, ally: Unit) => Generator<Tile>>} */
const enumerateTeleportTilesForAllyFuncMap = new Map();
const applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap = new Map();
const hasPathfinderEffectFuncMap = new Map();
const applySkillEffectFromEnemyAlliesFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, attacker: Unit, attackTarget: Unit) => void>} */
const applyAttackSkillEffectAfterCombatFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit) => void>} */
const applySpecialSkillEffectWhenHealingFuncMap = new Map();
/** @type {Map<number|string, (this: any, supporter: Unit, target: Unit) => boolean>} */
const canAddStatusEffectByRallyFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit) => number>} */
const getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap = new Map();
/** @type {Map<number|string, (this: Window, supporter: Unit, target: Unit) => number>} */
const calcHealAmountFuncMap = new Map();