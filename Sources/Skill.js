/**
 * @file
 * @brief スキル情報の定義とそれに関連するクラス、関数等の定義です。
 */

const WEAPON_TYPE_ATTACK_RANGE_MAP = new Map([
    [WeaponType.Sword, 1],
    [WeaponType.Lance, 1],
    [WeaponType.Axe, 1],
    [WeaponType.RedBreath, 1],
    [WeaponType.BlueBreath, 1],
    [WeaponType.GreenBreath, 1],
    [WeaponType.ColorlessBreath, 1],
    [WeaponType.RedBeast, 1],
    [WeaponType.BlueBeast, 1],
    [WeaponType.GreenBeast, 1],
    [WeaponType.ColorlessBeast, 1],
    [WeaponType.RedTome, 2],
    [WeaponType.BlueTome, 2],
    [WeaponType.GreenTome, 2],
    [WeaponType.ColorlessTome, 2],
    [WeaponType.RedBow, 2],
    [WeaponType.BlueBow, 2],
    [WeaponType.GreenBow, 2],
    [WeaponType.ColorlessBow, 2],
    [WeaponType.RedDagger, 2],
    [WeaponType.BlueDagger, 2],
    [WeaponType.GreenDagger, 2],
    [WeaponType.ColorlessDagger, 2],
    [WeaponType.Staff, 2],
    [WeaponType.None, 0],
]);

/**
 * 指定した武器種の射程を取得します。
 */
function getAttackRangeOfWeaponType(weaponType) {
    return WEAPON_TYPE_ATTACK_RANGE_MAP.get(weaponType);
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
    return weaponTypes.findIndex(type => type === weaponType);
}

const TYPE_TO_STRING_MAP = new Map([
    [WeaponRefinementType.None, "-"],
    [WeaponRefinementType.Hp5_Atk2, "HP+5 攻撃+2"],
    [WeaponRefinementType.Hp5_Spd3, "HP+5 速さ+3"],
    [WeaponRefinementType.Hp5_Def4, "HP+5 守備+4"],
    [WeaponRefinementType.Hp5_Res4, "HP+5 魔防+4"],
    [WeaponRefinementType.Hp2_Atk1, "HP+2 攻撃+1"],
    [WeaponRefinementType.Hp2_Spd2, "HP+2 速さ+2"],
    [WeaponRefinementType.Hp2_Def3, "HP+2 守備+3"],
    [WeaponRefinementType.Hp2_Res3, "HP+2 魔防+3"],
    [WeaponRefinementType.Special_Hp3, "HP+3 特殊"],
    [WeaponRefinementType.Special, "特殊"],
    [WeaponRefinementType.WrathfulStaff, "神罰の杖"],
    [WeaponRefinementType.DazzlingStaff, "幻惑の杖"],
]);

// noinspection JSUnusedGlobalSymbols
function weaponRefinementTypeToString(type) {
    return TYPE_TO_STRING_MAP.get(type) || "-";
}

/**
 * スキルIDが被らないようにする
 * @param {number} emblemHeroIndex
 * @returns {string}
 */
function getEmblemHeroSkillId(emblemHeroIndex) {
    return `e_${emblemHeroIndex}`;
}

/**
 * @param {number|string} id
 * @returns {string}
 */
function getNormalSkillId(id) {
    return `n_${id}`;
}

/**
 * @param {number|string} id
 * @returns {string}
 */
function getRefinementSkillId(id) {
    return `r_${id}`;
}

/**
 * @param {number|string} id
 * @returns {string}
 */
function getSpecialRefinementSkillId(id) {
    return `sr_${id}`;
}

/**
 * @param {number|string} id
 * @returns {[string, string, string]}
 */
function getRefinementSkillIds(id) {
    return [
        getNormalSkillId(id),
        getRefinementSkillId(id),
        getSpecialRefinementSkillId(id)
    ];
}

function getStatusEffectSkillId(id) {
    return `se_${id}`;
}

const EMBLEM_HERO_SET = new Set(Object.values(EmblemHero));

const PHYSICAL_WEAPON_TYPE_SET = new Set([
    WeaponType.Sword,
    WeaponType.Lance,
    WeaponType.Axe,
    WeaponType.RedBeast,
    WeaponType.BlueBeast,
    WeaponType.GreenBeast,
    WeaponType.ColorlessBeast,
    WeaponType.RedBow,
    WeaponType.BlueBow,
    WeaponType.GreenBow,
    WeaponType.ColorlessBow,
    WeaponType.RedDagger,
    WeaponType.BlueDagger,
    WeaponType.GreenDagger,
    WeaponType.ColorlessDagger,
]);

/**
 * 武器タイプが物理系の武器であるかを判定します。
 */
function isPhysicalWeaponType(weaponType) {
    return PHYSICAL_WEAPON_TYPE_SET.has(weaponType);
}

/**
 * 武器錬成タイプが特殊錬成であるかを判定します。
 */
function isWeaponSpecialRefined(weaponRefinementType) {
    return weaponRefinementType === WeaponRefinementType.Special
        || weaponRefinementType === WeaponRefinementType.Special_Hp3;
}

const FIRESWEEP_WEAPON_SET = new Set([
    Weapon.SoleilsShine,
    Weapon.MiraiNoSeikishiNoYari,
    Weapon.FiresweepSword,
    Weapon.FiresweepSwordPlus,
    Weapon.FiresweepLance,
    Weapon.FiresweepLancePlus,
    Weapon.FiresweepBow,
    Weapon.FiresweepBowPlus,
    Weapon.FiresweepAxePlus,
]);

/**
 * 自身、敵共に反撃不可になる武器であるかどうかを判定します。
 */
function isFiresweepWeapon(weapon) {
    return weapon in FIRESWEEP_WEAPON_SET;
}

/**
 * @type {Map<number|string, number>}
 */
const ASSIST_RANGE_MAP = new Map();

/**
 * 補助スキルの射程を取得します。
 */
function getAssistRange(support) {
    if (ASSIST_RANGE_MAP.has(support)) {
        return ASSIST_RANGE_MAP.get(support);
    }
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

const RALLY_UP_SET = new Set([
    Support.RallyUpSpd,
    Support.RallyUpAtk,
    Support.RallyUpAtkPlus,
    Support.RallyUpSpdPlus,
    Support.RallyUpDef,
    Support.RallyUpDefPlus,
    Support.RallyUpRes,
    Support.RallyUpResPlus,
]);

/**
 * 補助スキルが大応援かどうかを判定します。
 */
function isRallyUp(support) {
    return RALLY_UP_SET.has(support);
}

/** @type {Map<number|string, [number, number, number, number]>} */
const RALLY_BUFF_AMOUNT_MAP = new Map();

/**
 * 応援スキルの攻撃の強化量を取得します。
 */
function getAtkBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[STATUS_INDEX.Atk];
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

/**
 * 応援スキルの速さの強化量を取得します。
 */
function getSpdBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[STATUS_INDEX.Spd];
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

/**
 * 応援スキルの守備の強化量を取得します。
 */
function getDefBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[STATUS_INDEX.Def];
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

/**
 * 応援スキルの魔防の強化量を取得します。
 */
function getResBuffAmount(support) {
    if (RALLY_BUFF_AMOUNT_MAP.has(support)) {
        return RALLY_BUFF_AMOUNT_MAP.get(support)[STATUS_INDEX.Res];
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

const RANGED_ATTACK_SPECIAL_SET = new Set([
    Special.GrowingFlame,
    Special.GrowingLight,
    Special.GrowingWind,
    Special.GrowingThunder,
    Special.BlazingFlame,
    Special.BlazingLight,
    Special.BlazingWind,
    Special.BlazingThunder,
    Special.RisingFlame,
    Special.RisingLight,
    Special.RisingWind,
    Special.RisingThunder,
    Special.GiftedMagic,
]);

/**
 * 範囲奥義かどうかを判定します。
 */
function isRangedAttackSpecial(special) {
    return RANGED_ATTACK_SPECIAL_SET.has(special);
}

const RANGED_ATTACK_SPECIAL_DAMAGE_RATE_MAP = new Map([
    [Special.GrowingFlame, 1],
    [Special.GrowingLight, 1],
    [Special.GrowingWind, 1],
    [Special.GrowingThunder, 1],
    [Special.BlazingFlame, 1.5],
    [Special.BlazingLight, 1.5],
    [Special.BlazingWind, 1.5],
    [Special.BlazingThunder, 1.5],
    [Special.RisingFlame, 1],
    [Special.RisingLight, 1],
    [Special.RisingWind, 1],
    [Special.RisingThunder, 1],
    [Special.GiftedMagic, 0.8],
]);

function getRangedAttackSpecialDamageRate(special) {
    return RANGED_ATTACK_SPECIAL_DAMAGE_RATE_MAP.get(special) || 0;
}

const DEFENSE_SPECIAL_SET = new Set([
    Special.Nagatate,
    Special.Otate,  // 大盾
    Special.Kotate, // 小盾
    Special.Seitate, // 聖盾
    Special.Seii,  // 聖衣
    Special.Seikabuto, // 聖兜
    Special.IceMirror,
    Special.IceMirror2,
    Special.FrostbiteMirror,
    Special.NegatingFang,
    Special.GodlikeReflexes,
    Special.Miracle,
]);

const MIRACLE_AND_HEAL_SPECIAL_SET = new Set([
    Special.LifeUnending,
]);

/**
 * 防御系の奥義かどうかを判定します。
 */
function isDefenseSpecial(special) {
    return DEFENSE_SPECIAL_SET.has(special);
}

const NORMAL_ATTACK_SPECIAL_SET = new Set([
    Special.DragonBlast,
    Special.Moonbow,
    Special.Luna,
    Special.Aether,
    Special.LunaFlash,
    Special.LunarFlash2,
    Special.Glimmer,
    Special.Deadeye,
    Special.Astra,
    Special.ArmoredBeacon,
    Special.ArmoredFloe,
    Special.Bonfire,
    Special.Ignis,
    Special.Iceberg,
    Special.Glacies,
    Special.CircletOfBalance,
    Special.HolyKnightAura,
    Special.ChivalricAura, // グランベルの騎士道
    Special.DraconicAura,
    Special.DragonFang,
    Special.Enclosure, // 閉界
    Special.Sirius, // 天狼
    Special.SiriusPlus, // 天狼
    Special.RupturedSky, // 破天
    Special.TwinBlades, // 双刃
    Special.Taiyo,
    Special.Yuyo,
    Special.RegnalAstra, // 剣姫の流星
    Special.ImperialAstra, // 剣皇の流星
    Special.VitalAstra, // 心流星
    Special.SupremeAstra, // 無双の流星
    Special.OpenTheFuture, // 開世
    Special.Fukusyu, // 復讐
    Special.Kessyu, // 血讐
    Special.Kagetsuki, // 影月
    Special.Setsujoku, // 雪辱
    Special.Hyouten, // 氷点
    Special.Youkage, // 陽影
    Special.Hotarubi, // 蛍火
    Special.ShiningEmblem, // 光炎の紋章
    Special.HonoNoMonsyo, // 炎の紋章
    Special.HerosBlood,
    Special.KuroNoGekko, // 黒の月光
    Special.Lethality, // 滅殺
    Special.AoNoTenku, // 蒼の天空
    Special.RadiantAether2, // 蒼の天空・承
    Special.MayhemAether, // 暴の天空
    Special.Hoshikage, // 星影
    Special.Fukuryu, // 伏竜
    Special.BlueFrame, // ブルーフレイム
    Special.SeidrShell, // 魔弾
    Special.BrutalShell, // 凶弾
    Special.RighteousWind,
    Special.SublimeHeaven,
    Special.DevinePulse,
]);

/// 戦闘中に発動する攻撃系の奥義かどうかを判定します。
function isNormalAttackSpecial(special) {
    return NORMAL_ATTACK_SPECIAL_SET.has(special);
}

/**
 * 再行動補助スキルかどうかを判定します。
 */
const REFRESH_SUPPORT_SKILL_SET = new Set([
    Support.DragonsDance,
    Support.CallToFlame,
    Support.Sing,
    Support.Dance,
    Support.GrayWaves,
    Support.GentleDream,
    Support.GentleDreamPlus,
    Support.TenderDream,
    Support.WhimsicalDream,
    Support.SweetDreams,
    Support.CloyingDreams,
    Support.FrightfulDream,
    Support.HarrowingDream,
    Support.Play,
]);

function isRefreshSupportSkill(skillId) {
    return REFRESH_SUPPORT_SKILL_SET.has(skillId);
}

/**
 * 応援扱いの回復サポートスキルIDの集合
 */
const RALLY_HEAL_SKILL_SET = new Set();

/**
 * 応援扱いの回復サポートスキルかどうかを返す
 */
function isRallyHealSkill(skillId) {
    return RALLY_HEAL_SKILL_SET.has(skillId);
}

const BOW_WEAPON_TYPE_SET = new Set([
    WeaponType.RedBow,
    WeaponType.BlueBow,
    WeaponType.GreenBow,
    WeaponType.ColorlessBow,
    WeaponType.Bow,
]);

/**
 * 武器タイプが弓であるかを判定します。
 */
function isWeaponTypeBow(type) {
    return BOW_WEAPON_TYPE_SET.has(type);
}

const DAGGER_WEAPON_TYPE_SET = new Set([
    WeaponType.RedDagger,
    WeaponType.BlueDagger,
    WeaponType.GreenDagger,
    WeaponType.ColorlessDagger,
    WeaponType.Dagger,
]);

/**
 * 武器タイプが暗器であるかを判定します。
 */
function isWeaponTypeDagger(type) {
    return DAGGER_WEAPON_TYPE_SET.has(type);
}

const TOME_WEAPON_TYPE_SET = new Set([
    WeaponType.RedTome,
    WeaponType.BlueTome,
    WeaponType.GreenTome,
    WeaponType.ColorlessTome,
    WeaponType.Tome,
]);

/**
 * 武器タイプが魔法であるかを判定します。
 */
function isWeaponTypeTome(type) {
    return TOME_WEAPON_TYPE_SET.has(type);
}

const BREATH_WEAPON_TYPE_SET = new Set([
    WeaponType.RedBreath,
    WeaponType.BlueBreath,
    WeaponType.GreenBreath,
    WeaponType.ColorlessBreath,
    WeaponType.Breath,
]);

/**
 * 武器タイプが竜であるかを判定します。
 */
function isWeaponTypeBreath(type) {
    return BREATH_WEAPON_TYPE_SET.has(type);
}

const BEAST_WEAPON_TYPE_SET = new Set([
    WeaponType.RedBeast,
    WeaponType.BlueBeast,
    WeaponType.GreenBeast,
    WeaponType.ColorlessBeast,
    WeaponType.Beast,
]);

/**
 * 武器タイプが獣であるかを判定します。
 */
function isWeaponTypeBeast(type) {
    return BEAST_WEAPON_TYPE_SET.has(type);
}

/**
 * 武器タイプが2距離射程の武器であるかを判定します。
 */
function isRangedWeaponType(weaponType) {
    return !isMeleeWeaponType(weaponType);
}

const MELEE_WEAPON_TYPE_SET = new Set([
    WeaponType.Sword,
    WeaponType.Axe,
    WeaponType.Lance,
    WeaponType.RedBeast,
    WeaponType.BlueBeast,
    WeaponType.GreenBeast,
    WeaponType.ColorlessBeast,
    WeaponType.RedBreath,
    WeaponType.BlueBreath,
    WeaponType.GreenBreath,
    WeaponType.ColorlessBreath,
    WeaponType.Breath,
    WeaponType.Beast,
]);

/**
 * 武器タイプが1距離射程の武器であるかを判定します。
 */
function isMeleeWeaponType(weaponType) {
    return MELEE_WEAPON_TYPE_SET.has(weaponType);
}

/**
 * 武器タイプが竜、もしくは獣であるかを判定します。
 */
function isWeaponTypeBreathOrBeast(type) {
    return isWeaponTypeBeast(type)
        || isWeaponTypeBreath(type);
}

/**
 * 武器タイプが継承可能であるかを判定します。
 */
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

const WEAPON_TYPE_TO_COLOR_MAP = new Map([
    [WeaponType.Sword, ColorType.Red],
    [WeaponType.RedTome, ColorType.Red],
    [WeaponType.RedBreath, ColorType.Red],
    [WeaponType.RedBeast, ColorType.Red],
    [WeaponType.RedBow, ColorType.Red],
    [WeaponType.RedDagger, ColorType.Red],
    [WeaponType.Lance, ColorType.Blue],
    [WeaponType.BlueTome, ColorType.Blue],
    [WeaponType.BlueBreath, ColorType.Blue],
    [WeaponType.BlueBeast, ColorType.Blue],
    [WeaponType.BlueBow, ColorType.Blue],
    [WeaponType.BlueDagger, ColorType.Blue],
    [WeaponType.Axe, ColorType.Green],
    [WeaponType.GreenTome, ColorType.Green],
    [WeaponType.GreenBreath, ColorType.Green],
    [WeaponType.GreenBeast, ColorType.Green],
    [WeaponType.GreenBow, ColorType.Green],
    [WeaponType.GreenDagger, ColorType.Green],
    [WeaponType.Staff, ColorType.Colorless],
    [WeaponType.ColorlessTome, ColorType.Colorless],
    [WeaponType.ColorlessBreath, ColorType.Colorless],
    [WeaponType.ColorlessBeast, ColorType.Colorless],
    [WeaponType.ColorlessBow, ColorType.Colorless],
    [WeaponType.ColorlessDagger, ColorType.Colorless],
]);

function getColorFromWeaponType(weaponType) {
    return WEAPON_TYPE_TO_COLOR_MAP.get(weaponType);
}

const STRING_TO_WEAPON_TYPE_MAP = new Map([
    ["剣", WeaponType.Sword],
    ["槍", WeaponType.Lance],
    ["斧", WeaponType.Axe],
    ["無魔", WeaponType.ColorlessTome],
    ["赤魔", WeaponType.RedTome],
    ["青魔", WeaponType.BlueTome],
    ["緑魔", WeaponType.GreenTome],
    ["赤竜", WeaponType.RedBreath],
    ["青竜", WeaponType.BlueBreath],
    ["緑竜", WeaponType.GreenBreath],
    ["無竜", WeaponType.ColorlessBreath],
    ["杖", WeaponType.Staff],
    ["暗器", WeaponType.ColorlessDagger],
    ["赤暗器", WeaponType.RedDagger],
    ["青暗器", WeaponType.BlueDagger],
    ["緑暗器", WeaponType.GreenDagger],
    ["弓", WeaponType.ColorlessBow],
    ["赤弓", WeaponType.RedBow],
    ["青弓", WeaponType.BlueBow],
    ["緑弓", WeaponType.GreenBow],
    ["赤獣", WeaponType.RedBeast],
    ["青獣", WeaponType.BlueBeast],
    ["緑獣", WeaponType.GreenBeast],
    ["獣", WeaponType.ColorlessBeast],
]);

const WEAPON_TYPE_TO_STRING_MAP =
    new Map([...STRING_TO_WEAPON_TYPE_MAP.entries()].map(([key, value]) => [value, key]));

function stringToWeaponType(input) {
    return STRING_TO_WEAPON_TYPE_MAP.get(input) ?? WeaponType.None;
}

function weaponTypeToString(weaponType) {
    return WEAPON_TYPE_TO_STRING_MAP.get(weaponType) ?? "不明";
}

function canRallyForciblyByPlayer(unit) {
    return getSkillFunc(unit.support, canRallyForciblyByPlayerFuncMap)?.call(this, unit) ?? false;
}

/**
 * @type {Set<number|string>}
 */
SWAP_ASSIST_SET = new Set();

CAN_MOVE_THROUGH_FOES_SPACE_SKILL_SET = new Set();

/**
 * 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
 */
function canRallyForcibly(skill, unit) {
    let func = getSkillFunc(skill, canRallyForciblyFuncMap);
    if (func?.call(this, unit) ?? false) {
        return true;
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
        case Weapon.EverlivingBreath:
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
    if (getSkillFunc(skillId, canRalliedForciblyFuncMap)?.call(this, unit) ?? false) {
        return true;
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

/**
 * 戦闘前に発動するスペシャルであるかどうかを判定します。
 */
function isPrecombatSpecial(special) {
    return isRangedAttackSpecial(special);
}

const TELEPORTATION_SKILL_SET = new Set([
    PassiveC.TipTheScales,
    Weapon.LanceOfHeroics,
    Weapon.FlowerLance,
    Weapon.FujinYumi,
    Weapon.Gurimowaru,
    Weapon.Noatun,
    Weapon.HinokaNoKounagitou,
    Weapon.IzunNoKajitsu,
    PassiveB.TeniNoKona,
    PassiveB.Kyuen2,
    PassiveB.Kyuen3,
    PassiveB.WingsOfMercy4,
    PassiveB.Ridatsu3,
    PassiveB.EscapeRoute4,
    PassiveB.KyokugiHiKo1,
    PassiveB.KyokugiHiKo2,
    PassiveB.KyokugiHiKo3,
    PassiveB.HentaiHiko1,
    PassiveB.HentaiHiko2,
    PassiveB.HentaiHiko3,
    PassiveC.SorakaranoSendo3,
    PassiveC.HikonoSendo3,
    PassiveC.OpeningRetainer,
    Weapon.SilentPower,
]);

/**
 * テレポート効果を持つスキルであるかどうかを判定します。
 */
function isTeleportationSkill(skillId) {
    return TELEPORTATION_SKILL_SET.has(skillId);
}

PATHFINDER_SKILL_SET = new Set([
    PassiveB.TwinSkyWing,
    Weapon.JotnarBow,
    Captain.Eminence,
]);

/**
 * 天駆の道の効果を持つスキルかどうか
 */
function hasPathfinderEffect(skillId) {
    if (getSkillFunc(skillId, hasPathfinderEffectFuncMap)?.call(this) ?? false) {
        return true;
    }
    return PATHFINDER_SKILL_SET.has(skillId);
}

/**
 * 「自分の最大HP-現HPの〇%を奥義ダメージに加算」の割合を0～1で返します。
 */
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

const TRIANGLE_ADEPT_SET = new Set([
    PassiveA.AishoGekika3,
    Weapon.AsahiNoKen,
    Weapon.AsahiNoKenPlus,
    Weapon.SoukaiNoYari,
    Weapon.SoukaiNoYariPlus,
    Weapon.ShinryokuNoOno,
    Weapon.ShinryokuNoOnoPlus,
    Weapon.WakakiMogyuNoYari,
    Weapon.WakakiKurohyoNoKen,
    Weapon.ShinginNoSeiken,
    Weapon.YoheidanNoSenfu,
]);

/**
 * 相性激化3の効果を標準で発動できるすきるかどうかを判定します。
 */
function isTriangleAdeptSkill(skillId) {
    return TRIANGLE_ADEPT_SET.has(skillId);
}

const EVAL_SPD_ADD_MAP = new Map([
    [PassiveB.BindingNecklacePlus, 7],
    [PassiveS.HayasaNoKyosei1, 5],
    [PassiveS.HayasaNoKyosei2, 8],
    [PassiveS.HayasaNoKyosei3, 10],
    [PassiveB.Spurn4, 7],
    [PassiveB.CloseCall4, 7],
    [PassiveB.Repel4, 7],
    [PassiveB.BeastSense4, 7],
    [Weapon.SharpWarSword, 10],
]);

/**
 * 速さ比較時の速さ加算値を取得します。
 */
function getEvalSpdAdd(unit) {
    let amount = 0;
    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit);
    let stats = AT_COMPARING_STATS_HOOKS.evaluateStatsSumWithUnit(unit, env);
    amount += stats[STATUS_INDEX.Spd];
    for (let skillId of unit.enumerateSkills()) {
        amount += EVAL_SPD_ADD_MAP.get(skillId) ?? 0;
        amount += getSkillFunc(skillId, evalSpdAddFuncMap)?.call(this, unit) ?? 0;
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

const EVAL_RES_ADD_MAP = new Map([
    [PassiveS.MaboNoKyosei1, 5],
    [PassiveS.MaboNoKyosei2, 8],
    [PassiveS.MaboNoKyosei3, 10],
]);

/**
 * 魔防比較時の速さ加算値を取得します。
 */
function getEvalResAdd(unit) {
    let value = 0;
    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit);
    let stats = AT_COMPARING_STATS_HOOKS.evaluateStatsSumWithUnit(unit, env);
    value += stats[STATUS_INDEX.Res];
    for (let skillId of unit.enumerateSkills()) {
        value += EVAL_RES_ADD_MAP.get(skillId) ?? 0;
        value += getSkillFunc(skillId, evalResAddFuncMap)?.call(this, unit) ?? 0;
    }
    return value;
}

const WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET = new Set([
    Weapon.DreamHorn,
    Weapon.ArcaneNihility,
    Weapon.Ravager,
    Weapon.WaryRabbitFang,
    Weapon.KeenRabbitFang,
    Weapon.FangOfFinality,
    Weapon.HeraldingHorn,
    Weapon.EnclosingClaw,
    Weapon.FieryFang,
    Weapon.RoyalHatariFang,
    Weapon.HornOfOpening,
    Weapon.PolishedFang,
    Weapon.SparklingFang,
    Weapon.EbonPirateClaw,
    Weapon.CrossbonesClaw,
    Weapon.RefreshedFang,
    Weapon.RenewedFang,
    Weapon.RaydreamHorn,
    Weapon.BrightmareHorn,
    Weapon.NightmareHorn,
    Weapon.BrazenCatFang,
    Weapon.TaguelFang,
    Weapon.TaguelChildFang,
    Weapon.FoxkitFang,
    Weapon.NewBrazenCatFang,
    Weapon.NewFoxkitFang,
    Weapon.KarasuOuNoHashizume,
    Weapon.TakaouNoHashizume,
    Weapon.YoukoohNoTsumekiba,
    Weapon.JunaruSenekoNoTsumekiba,
    Weapon.ShishiouNoTsumekiba,
    Weapon.TrasenshiNoTsumekiba,
    Weapon.JinroMusumeNoTsumekiba,
    Weapon.JinroOuNoTsumekiba,
    Weapon.OkamijoouNoKiba,
    Weapon.ShirasagiNoTsubasa,
    Weapon.SeijuNoKeshinHiko,
    Weapon.GroomsWings,
    Weapon.TwinCrestPower,
    Weapon.IlluminatingHorn,
]);

function isWeaponTypeThatCanAddAtk2AfterTransform(weapon) {
    return WEAPON_TYPES_ADD_ATK2_AFTER_TRANSFORM_SET.has(weapon);
}

/**
 * 化身による共通の効果
 * TODO 残りも実装する
 */
const BeastCommonSkillType = {
    Infantry: 0, // 初期の歩行近接
    Infantry2: 1, // アシュ以降の歩行近接
    Infantry2IfRefined: 2, // 錬成して次世代になる歩行近接
    Armor: 3,
    Cavalry: 4,
    Flying: 5,
    Cavalry2: 6, // TODO: 次世代騎馬なのか魔器だけなのか確認する
}

/**
 * @type {Map<number|string, number>}
 */
const BEAST_COMMON_SKILL_MAP = new Map([
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
]);

const ADVANTAGEOUS_AGAINST_COLORLESS_WEAPON_SET = new Set([
    Weapon.EtherealBreath,
    Weapon.KinsekiNoSyo,
    Weapon.GunshiNoRaisyo,
    Weapon.KokukarasuNoSyo,
    Weapon.GunshiNoFusho,
    Weapon.Blarraven,
    Weapon.BlarravenPlus,
    Weapon.Gronnraven,
    Weapon.GronnravenPlus,
    Weapon.Rauarraven,
    Weapon.RauarravenPlus,
    Weapon.YukyuNoSyo,
    Weapon.Nagurufaru,
    Weapon.TomeOfOrder,
]);

function isAdvantageousForColorless(weapon) {
    return ADVANTAGEOUS_AGAINST_COLORLESS_WEAPON_SET.has(weapon);
}

const BREAKER_SKILL_TO_TARGET_WEAPON_TYPE_MAP = new Map([
    [PassiveB.Swordbreaker3, WeaponType.Sword],
    [PassiveB.Lancebreaker3, WeaponType.Lance],
    [PassiveB.Axebreaker3, WeaponType.Axe],
    [PassiveB.Bowbreaker3, WeaponType.ColorlessBow],
    [PassiveB.Daggerbreaker3, WeaponType.ColorlessDagger],
    [PassiveB.RedTomebreaker3, WeaponType.RedTome],
    [PassiveB.BlueTomebreaker3, WeaponType.BlueTome],
    [PassiveB.GreenTomebreaker3, WeaponType.GreenTome],
]);

function getBreakerSkillTargetWeaponType(breakerSkillId) {
    return BREAKER_SKILL_TO_TARGET_WEAPON_TYPE_MAP.get(breakerSkillId);
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

const WEAPON_VALUE_DICT = __createValueDict(Weapon);
const SUPPORT_VALUE_DICT = __createValueDict(Support);
const SPECIAL_VALUE_DICT = __createValueDict(Special);
const PASSIVE_A_VALUE_DICT = __createValueDict(PassiveA);
const PASSIVE_B_VALUE_DICT = __createValueDict(PassiveB);
const PASSIVE_C_VALUE_DICT = __createValueDict(PassiveC);
const PASSIVE_S_VALUE_DICT = __createValueDict(PassiveS);
const PASSIVE_X_VALUE_DICT = __createValueDict(PassiveX);
const CAPTAIN_VALUE_DICT = __createValueDict(Captain);

const SAVE_SKILL_SET = new Set([
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

/**
 * 無条件で近距離からの護り手を発動できる
 * @type {Set<number|string>}
 */
const CAN_SAVE_FROM_MELEE_SKILL_SET = new Set();

/**
 * 無条件で遠距離からの護り手を発動できる
 * @type {Set<number|string>}
 */
const CAN_SAVE_FROM_RANGED_SKILL_SET = new Set();

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
    // STATUS_EFFECT_INFO_MAPに画像パスと名前、表記を登録する
    // 不利なステータス異常の場合はNEGATIVE_STATUS_EFFECT_SETに登録すること
    // POSITIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ARRAYに登録すること
};

const POSITIVE_STATUS_EFFECT_ARRAY = [
// 双界効果・刃
    StatusEffectType.ResonantBlades,
// 双界効果・盾
    StatusEffectType.ResonantShield,
// 七色の叫び
    StatusEffectType.RallySpectrum,
// 奮激
    StatusEffectType.Incited,
// 強化増幅
    StatusEffectType.BonusDoubler,
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
// 自分から攻撃時、絶対追撃
    StatusEffectType.FollowUpAttackPlus,
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
    StatusEffectType.HushSpectrum,
    StatusEffectType.ShareSpoils,
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
    StatusEffectType.Guard,
    StatusEffectType.Frozen,
    StatusEffectType.TriangleAdept,
    StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately,
];
const NEGATIVE_STATUS_EFFECT_ORDER_MAP = new Map();
NEGATIVE_STATUS_EFFECT_ARRAY.forEach((v, i) => NEGATIVE_STATUS_EFFECT_ORDER_MAP.set(v, i));

/**
 * スキル情報です。ユニットの初期化等に使用します。
 */
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
        if (typeof g_appData !== 'undefined') {
            if (g_appData.isDebugMenuEnabled) {
                this.hasSpecialWeaponRefinement = true;
                this.hasStatusWeaponRefinement = true;
            }
            if (g_appData.isDevelopmentMode) {
                this.isSacredSealAvailable = true;
            }
        }

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
                return this.id in WEAPON_VALUE_DICT;
            case SkillType.Support:
                return this.id in SUPPORT_VALUE_DICT;
            case SkillType.Special:
                return this.id in SPECIAL_VALUE_DICT;
            case SkillType.PassiveA:
                return this.id in PASSIVE_A_VALUE_DICT;
            case SkillType.PassiveB:
                return this.id in PASSIVE_B_VALUE_DICT;
            case SkillType.PassiveC:
                return this.id in PASSIVE_C_VALUE_DICT;
            case SkillType.PassiveS:
                return this.id in PASSIVE_S_VALUE_DICT;
            case SkillType.PassiveX:
                return this.id in PASSIVE_X_VALUE_DICT;
            case SkillType.Captain:
                return this.id in CAPTAIN_VALUE_DICT;
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

const COUNT2_SPECIALS = [];
const INHERITABLE_COUNT2_SPECIALS = [];
const COUNT3_SPECIALS = [];
const INHERITABLE_COUNT3_SPECIALS = [];
const COUNT4_SPECIALS = [];
const INHERITABLE_COUNT4_SPECIALS = [];

/**
 * 補助時に奥義発動カウントを進めないスキル
 */
const NO_EFFECT_ON_SPECIAL_COOLDOWN_CHARGE_ON_SUPPORT_SKILL_SET = new Set([
    Support.RescuePlus,
    Support.Rescue,
    Support.ReturnPlus,
    Support.Return,
    Support.NudgePlus,
    Support.Nudge,
]);

const DISARM_TRAP_SKILL_SET = new Set([
    PassiveB.Wanakaijo3,
    PassiveB.DisarmTrap4,
]);

const DISARM_HEX_TRAP_SKILL_SET = new Set([
    PassiveB.DisarmTrap4,
]);

const STATUS_INDEX = {
    None: -1,
    Atk: 0,
    Spd: 1,
    Def: 2,
    Res: 3,
}

function getStatusName(index) {
    if (index === STATUS_INDEX.None) {
        return "ー";
    }
    return ["攻撃", "速さ", "守備", "魔防"][index];
}

// TODO: リファクタリングする(適切な場所に移動する。引数の型を確定する)
/**
 * enemiesのスキルを奪取する
 * @param {Generator<Unit>|Unit[]} enemies
 * @param {Unit} targetUnit
 * @param {Generator<Unit>|Unit[]} targetAllies
 * @param logger
 */
function stealBonusEffects(enemies, targetUnit, targetAllies, logger = null) {
    let statusSet = new Set();
    let enemyArray = Array.from(enemies);

    let hasDosage = enemyArray.some(u => u.hasStatusEffect(StatusEffectType.Dosage));
    if (hasDosage) {
        logger?.writeDebugLog(`${targetUnit.nameWithGroup}からの奪取を無効`);
        logger?.writeDebugLog(`${targetUnit.nameWithGroup}の強化を解除`);
        targetUnit.getPositiveStatusEffects().forEach(e => targetUnit.reservedStatusEffectSetToNeutralize.add(e));
        targetUnit.reservedBuffFlagsToNeutralize = [true, true, true, true];
        return;
    }

    enemyArray.forEach(enemy => enemy.getPositiveStatusEffects().forEach(e => {
        logger?.writeDebugLog(`${enemy.nameWithGroup}から${getStatusEffectName(e)}を解除`);
        statusSet.add(e);
    }));
    for (let targetAlly of targetAllies) {
        // ステータス
        for (let statusEffect of statusSet) {
            targetAlly.reserveToAddStatusEffect(statusEffect);
        }
        // 強化
        enemyArray.forEach(enemy => {
            let buffs = enemy.getBuffs(false);
            targetAlly.reserveToApplyBuffs(...buffs);
            if (buffs.some(i => i > 0)) {
                logger?.writeDebugLog(`${enemy.nameWithGroup} → ${targetAlly.nameWithGroup}へ強化${buffs}を付与`);
            }
        });
    }
    // ステータス解除予約
    for (let enemy of enemyArray) {
        // 現在付与されているステータスについて解除予約する（このターン予約分は解除できない）
        enemy.getPositiveStatusEffects().forEach(e => enemy.reservedStatusEffectSetToNeutralize.add(e));
        enemy.reservedBuffFlagsToNeutralize = [true, true, true, true];
    }
}

// TODO: ここから下の内容を別ファイルに分ける

/**
 * @template {F | undefined} F
 * @param {number|string} skillId
 * @param {Map<number|string, F>} funcMap
 * @returns {F}
 */
function getSkillFunc(skillId, funcMap) {
    // 錬成先が登録されている場合
    if (funcMap.has(getRefinementSkillId(skillId)) ||
        funcMap.has(getSpecialRefinementSkillId(skillId))) {
        if (funcMap.has(getNormalSkillId(skillId))) {
            return undefined;
        }
    }
    if (funcMap.has(skillId)) {
        let func = funcMap.get(skillId);
        if (typeof func === "function") {
            return func;
        } else {
            console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
        }
    }
    return undefined;
}

// FuncMap
/** @type {Map<number|string, (this: DamageCalculator, target: Unit, enemy: Unit, context: DamageCalcContext) => void>} */
const applySpecialDamageReductionPerAttackFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, potentialDamage: boolean) => void>} */
const applySkillEffectForUnitFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, unit: Unit) => boolean>} */
const canActivateCantoFuncMap = new Map();
/** @type {Map<number|string, (this: Unit) => number>} */
const calcMoveCountForCantoFuncMap = new Map();
/** @type {Map<number|string, (this: Window, owner: Unit) => number>} */
const evalSpdAddFuncMap = new Map();
/** @type {Map<number|string, (this: Window, owner: Unit) => number>} */
const evalResAddFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, defUnit: Unit, atkUnit: Unit) => void>} */
const applyPrecombatDamageReductionRatioFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler, owner: Unit) => void>} */
const applySkillForBeginningOfTurnFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler, owner: Unit) => void>} */
const applyEnemySkillForBeginningOfTurnFuncMap = new Map();
/** @type {Map<number|string, (this: Unit) => void>} */
const setOnetimeActionActivatedFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, ally: Unit, potentialDamage: boolean) => void>} */
const applySkillEffectFromAlliesFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, ally: Unit, potentialDamage: boolean) => void>} */
const applySkillEffectFromAlliesExcludedFromFeudFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, enemyAlly: Unit, potentialDamage: boolean) => void>} */
const updateUnitSpurFromEnemyAlliesFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit) => void>} */
const applyRefreshFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculator, target: Unit, enemy: Unit, context: DamageCalcContext) => void>} */
const applySkillEffectsPerCombatFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculator, atkUnit: Unit, defUnit: Unit) => void>} */
const applyNTimesDamageReductionRatiosByNonDefenderSpecialFuncMap = new Map();
// 応援後のスキル
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit) => void>} */
const applySkillsAfterRallyForSupporterFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit) => void>} */
const applySkillsAfterRallyForTargetUnitFuncMap = new Map();
/**
 * 移動補助スキル後(スキル使用者、被使用者両者入れ替えて呼び出される)
 * @type {Map<number|string, (this: BattleSimulatorBase, skillOwner: Unit, ally: Unit) => void>}
 */
const applyMovementAssistSkillFuncMap = new Map();
// 2023年11月時点では片方にだけかかるスキルは存在しない => 2024年総選挙ルフレ(女で実装)
// const applyMovementAssistSkillForSupporterFuncMap = new Map();
// const applyMovementAssistSkillForTargetUnitFuncMap = new Map();
// サポートスキル後
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit, supportTile: Tile) => void>} */
const applySupportSkillForSupporterFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit, supportTile: Tile) => void>} */
const applySupportSkillForTargetUnitFuncMap = new Map();
/** @type {Map<number|string, (this: Window, u: Unit) => boolean>} */
const canRallyForciblyFuncMap = new Map();
/** @type {Map<number|string, (this: Window, u: Unit) => boolean>} */
const canRallyForciblyByPlayerFuncMap = new Map();
/** @type {Map<number|string, (this: Window, u: Unit) => boolean>} */
const canRalliedForciblyFuncMap = new Map();
/** @type {Map<number|string, (u: Unit) => Generator<Tile>>} */
const enumerateTeleportTilesForUnitFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, target: Unit, enemy: Unit) => void>} */
const applySkillEffectAfterCombatForUnitFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, potentialDamage: boolean) => void>} */
const applySKillEffectForUnitAtBeginningOfCombatFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, ally: Unit, enemy: Unit, potentialDamage: boolean) => void>} */
const updateUnitSpurFromAlliesFuncMap = new Map();
/** @type {Map<number|string, (this: Unit, moveUnit: Unit) => boolean>} */
const canActivateObstructToAdjacentTilesFuncMap = new Map();
/** @type {Map<number|string, (this: Unit, moveUnit: Unit) => boolean>} */
const canActivateObstructToTilesIn2SpacesFuncMap = new Map();
// 切り込みなど移動スキル終了後に発動するスキル効果
/** @type {Map<number|string, (this: Unit, atkUnit: Unit, defUnit: Unit, tileToAttack: Tile) => void>} */
const applySkillEffectAfterMovementSkillsActivatedFuncMap = new Map();
// 優先度の高い再行動スキルの評価
/** @type {Map<number|string, (this: Unit, atkUnit: Unit, defUnit: Unit, tileToAttack: Tile) => void>} */
const applyHighPriorityAnotherActionSkillEffectFuncMap = new Map();
/** @type {Map<number|string, (this: Unit) => void>} */
const applyEndActionSkillsFuncMap = new Map();
/** @type {Map<number|string, (this: Unit) => void>} */
const applySkillsAfterCantoActivatedFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler) => boolean>} */
const hasTransformSkillsFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, assistUnit: Unit, target: Unit, assitTile: Tile) => MovementAssistResult>} */
const getTargetUnitTileAfterMoveAssistFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, assistUnit: Unit, target: Unit, tile: Tile) => void>} */
const findTileAfterMovementAssistFuncMap = new Map();
/** @type {Map<number|string, (this: Unit) => number>} */
const resetMaxSpecialCountFuncMap = new Map();
/** @type {Map<number|string, (this: Window, attackUnit: Unit, lossesInCombat: boolean, result: DamageCalcResult) => boolean>} */
const isAfflictorFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler, owner: Unit) => void>} */
const applySkillAfterSkillsForBeginningOfTurnFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler, owner: Unit) => void>} */
const applySkillAfterEnemySkillsForBeginningOfTurnFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, defUnit: Unit, atkUnit: Unit, attackRange: number) => void>} */
const applyDamageReductionRatioBySpecialFuncMap = new Map();
// TODO: リファクタリングする
/** @type {Map<number|string, (this: DamageCalculator, defUnit: Unit, atkUnit: Unit) => void>} */
const activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculator, atkUnit: Unit, defUnit: Unit) => number>} */
const addSpecialDamageAfterDefenderSpecialActivatedFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculator, target: Unit, enemy: Unit, context: DamageCalcContext) => void>} */
const applySkillEffectAfterSpecialActivatedFuncMap = new Map();
/** @type {Map<number|string, (this: BattleMap, targetTile: Tile) => Generator<Tile>>} */
const enumerateRangedSpecialTilesFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, attacker: Unit, target: Unit, attackCount: number) => void>} */
const applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap = new Map();
/** @type {Map<number|string, (this: Unit, restHpPercentage: number, defUnit: Unit) => boolean>} */
const canDisableAttackOrderSwapSkillFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, atkUnit: Unit, defUnit: Unit, isPrecombat: boolean) => void>} */
const calcFixedAddDamageFuncMap = new Map();
/** @type {Map<number|string, (this: BeginningOfTurnSkillHandler, owner: Unit) => void>} */
const applyHealSkillForBeginningOfTurnFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, atkUnit: Unit, attackTarget: Unit, executesTrap: boolean) => boolean>} */
const applyMovementSkillAfterCombatFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
const applySkillEffectRelatedToFollowupAttackPossibilityFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
const applyPotentSkillEffectFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculator, target: Unit, enemy: Unit, canActivateAttackerSpecial: boolean, context: DamageCalcContext) => void>} */
const applySkillEffectsPerAttackFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
const applySkillEffectAfterSetAttackCountFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, atkUnit: Unit, ally: Unit) => boolean>} */
const canActivateSaveSkillFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, atkUnit: Unit, defUnit: Unit) => void>} */
const selectReferencingResOrDefFuncMap = new Map();
/** @type {Map<number|string, (this: BattleMap, target: Unit, ally: Unit) => Generator<Tile>>} */
const enumerateTeleportTilesForAllyFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, attacker: Unit, target: Unit) => void>} */
const applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap = new Map();
/** @type {Map<number|string, (this: Window) => boolean>} */
const hasPathfinderEffectFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, enemyAlly: Unit, potentialDamage: boolean) => void>} */
const applySkillEffectFromEnemyAlliesFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, attacker: Unit, attackTarget: Unit) => void>} */
const applyAttackSkillEffectAfterCombatFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit, target: Unit) => void>} */
const applySpecialSkillEffectWhenHealingFuncMap = new Map();
// TODO: リファクタリングする
/** @type {Map<number|string, (this: any, supporter: Unit, target: Unit) => boolean>} */
const canAddStatusEffectByRallyFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase, supporter: Unit) => number>} */
const getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap = new Map();
/** @type {Map<number|string, (this: Window, supporter: Unit, target: Unit) => number>} */
const calcHealAmountFuncMap = new Map();
/** @type {Map<number|string, (this: PostCombatSkillHander, skillOwner: Unit, combatUnit: Unit) => void>} */
const applyPostCombatAllySkillFuncMap = new Map();
/** @type {Map<number|string, (this: BattleMap, tile: Tile, warpUnit: Unit, enemyUnit: Unit) => void>} */
const canWarpFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
applySkillEffectsAfterAfterBeginningOfCombatFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit, ally: Unit, potentialDamage: boolean) => void>} */
applySkillEffectsAfterAfterBeginningOfCombatFromAlliesFuncMap = new Map();
/** @type {Map<number|string, (this: BattleSimulatorBase) => boolean>} */
const hasDivineVeinSkillsWhenActionDoneFuncMap = new Map();
/** @type {Map<number|string, (this: DamageCalculatorWrapper, target: Unit, enemy: Unit) => void>} */
const applySkillEffectForUnitAfterCombatStatusFixedFuncMap = new Map();
