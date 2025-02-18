const UnitRarity = {
    Star1: 1,
    Star2: 2,
    Star3: 3,
    Star4: 4,
    Star5: 5,
};

const StatusType = {
    None: -1,
    Hp: 0,
    Atk: 1,
    Spd: 2,
    Def: 3,
    Res: 4,
};

const MoveType = {
    Infantry: 0,
    Flying: 1,
    Cavalry: 2,
    Armor: 3,
};

function moveTypeIconPath(moveType) {
    switch (moveType) {
        case MoveType.Infantry:
            return `${g_heroIconRootPath}Icon_Move_Infantry.png`;
        case MoveType.Flying:
            return `${g_heroIconRootPath}Icon_Move_Flying.png`;
        case MoveType.Cavalry:
            return `${g_heroIconRootPath}Icon_Move_Cavalry.png`;
        case MoveType.Armor:
            return `${g_heroIconRootPath}Icon_Move_Armored.png`;
    }
    throw new Error(
        `moveTypeIconPath: invalid moveType ${moveType}`
    )
}

const SeasonType = {
    None: -1,
    Light: 0,
    Dark: 1,
    Astra: 2,
    Anima: 3,
    Fire: 4,
    Water: 5,
    Wind: 6,
    Earth: 7,
    Chaos: 8,
};

const IvType = {
    None: 0,
    Asset: 1, // 得意
    Flaw: 2, // 不得意
}

const BookVersions = {};

const BlessingType = {
    None: -1,
    Hp5_Atk3: 0,
    Hp5_Spd4: 1,
    Hp5_Def5: 2,
    Hp5_Res5: 3,
    Hp3_Atk2: 4,
    Hp3_Spd3: 5,
    Hp3_Def4: 6,
    Hp3_Res4: 7,
    Hp3: 8,
};

// noinspection JSUnusedGlobalSymbols
const BlessingTypeOptions = [
    {id: BlessingType.None, text: "なし"},
    {id: BlessingType.Hp5_Atk3, text: "HP+5 攻撃+3"},
    {id: BlessingType.Hp5_Spd4, text: "HP+5 速さ+4"},
    {id: BlessingType.Hp5_Def5, text: "HP+5 守備+5"},
    {id: BlessingType.Hp5_Res5, text: "HP+5 魔防+5"},
    {id: BlessingType.Hp3_Atk2, text: "HP+3 攻撃+2"},
    {id: BlessingType.Hp3_Spd3, text: "HP+3 速さ+3"},
    {id: BlessingType.Hp3_Def4, text: "HP+3 守備+4"},
    {id: BlessingType.Hp3_Res4, text: "HP+3 魔防+4"},
    {id: BlessingType.Hp3, text: "HP+3"},
];

const GrowthRateOfStar5 = {};
GrowthRateOfStar5[8] = 0.2;
GrowthRateOfStar5[10] = 0.25;
GrowthRateOfStar5[13] = 0.30;
GrowthRateOfStar5[15] = 0.35;
GrowthRateOfStar5[17] = 0.40;
GrowthRateOfStar5[19] = 0.45;
GrowthRateOfStar5[22] = 0.50;
GrowthRateOfStar5[24] = 0.55;
GrowthRateOfStar5[26] = 0.60;
GrowthRateOfStar5[28] = 0.65;
GrowthRateOfStar5[30] = 0.70;
GrowthRateOfStar5[33] = 0.75;
GrowthRateOfStar5[35] = 0.80;
GrowthRateOfStar5[37] = 0.85;
GrowthRateOfStar5[39] = 0.90;

const StatusRankTable = [];
StatusRankTable[StatusType.Hp] = 4;
StatusRankTable[StatusType.Atk] = 3;
StatusRankTable[StatusType.Spd] = 2;
StatusRankTable[StatusType.Def] = 1;
StatusRankTable[StatusType.Res] = 0;

// noinspection JSUnusedGlobalSymbols
/**
 * @param  {number} seasonType
 */
// HTMLから使用
function getSeasonTypeName(seasonType) {
    for (const [key, value] of Object.entries(SeasonType)) {
        if (value === seasonType) {
            return key;
        }
    }
    throw new Error(`invalid seasonType ${seasonType}`);
}

/**
 * @param  {SeasonType} seasonType
 */
function isLegendarySeason(seasonType) {
    switch (seasonType) {
        case SeasonType.Fire:
        case SeasonType.Earth:
        case SeasonType.Water:
        case SeasonType.Wind:
            return true;
        default:
            return false;
    }
}

/**
 * 攻撃側のシーズン（光天）であるかどうか
 * @param seasonType
 * @returns {boolean}
 */
function isAetherRaidAllySeason(seasonType) {
    return seasonType === SeasonType.Light || seasonType === SeasonType.Astra;
}

/**
 * 防衛側のシーズン（闇理）であるかどうか
 * @param seasonType
 * @returns {boolean}
 */
function isAetherRaidEnemySeason(seasonType) {
    return seasonType === SeasonType.Dark || seasonType === SeasonType.Anima;
}

/// ☆5の成長量から純粋成長率を計算します。
function getGrowthRateOfStar5(growthAmount) {
    let growthRate = GrowthRateOfStar5[growthAmount];
    if (growthRate) {
        return growthRate;
    }

    // throw new Error("Invalid growth amount " + growthAmount);
    return 0;
}

// noinspection JSUnusedGlobalSymbols
function calcAppliedGrowthRate(growthRate, rarity) {
    // let rate = growthRate * (0.79 + (0.07 * this.rarity));
    return Math.floor(100 * growthRate * (0.79 + (0.07 * rarity))) * 0.01;
}

/**
 * @param  {Number} growthRate
 * @param  {Number} rarity
 */
function calcAppliedGrowthRate_Optimized(growthRate, rarity) {
    let appliedGrowthRateCoef = (0.79 + (0.07 * rarity)) * 100;
    return Math.floor(growthRate * appliedGrowthRateCoef) * 0.01;
}

/**
 * @param  {Number} growthRate
 * @param  {Number} rarity
 * @param  {Number} level
 */
function calcGrowthValue(growthRate, rarity, level) {
    let rate = calcAppliedGrowthRate_Optimized(growthRate, rarity);
    return Math.floor((level - 1) * rate);
}

// noinspection JSUnusedGlobalSymbols
/**
 * @param  {Number} statusLv1
 * @param  {Number} growthRate
 * @param  {Number} rarity
 * @param  {Number} level
 */
// どこからも使用されていない
function calcStatusLvN(statusLv1, growthRate, rarity, level) {
    return statusLv1 + calcGrowthValue(growthRate, rarity, level);
}

/// 値が同じ場合の優先度を取得します。
function __getStatusRankValue(statusType) {
    return StatusRankTable[statusType];
}

/// 純粋成長率(%)から★5成長値を取得します。
// noinspection JSUnusedGlobalSymbols
function getGrowthAmountOfStar5FromPureGrowthRate(growthRateAsPercentage) {
    switch (growthRateAsPercentage) {
        case 20:
            return 8;
        case 25:
            return 10;
        case 30:
            return 13;
        case 35:
            return 15;
        case 40:
            return 17;
        case 45:
            return 19;
        case 50:
            return 22;
        case 55:
            return 24;
        case 60:
            return 26;
        case 65:
            return 28;
        case 70:
            return 30;
        case 75:
            return 33;
        case 80:
            return 35;
        case 85:
            return 37;
        case 90:
            return 39;
        default:
            return -1;
    }
}

// 成長値から苦手ステータスのLv40の変動値を取得します。
function getFlowStatus(growthValue) {
    switch (growthValue) {
        case 1:
        case 5:
        case 10:
            return -4;
        default:
            return -3;
    }
}

/// 成長値から得意ステータスのLv40の変動値を取得します。
function getAssetStatus(growthValue) {
    switch (growthValue) {
        case 2:
        case 6:
        case 11:
            return 4;
        default:
            return 3;
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * @params {number} type
 * @returns {String}
 */
// HTML側で使用
function statusTypeToShortString(type) {
    switch (type) {
        case StatusType.Hp:
            return "HP";
        case StatusType.Atk:
            return "攻";
        case StatusType.Spd:
            return "速";
        case StatusType.Def:
            return "守";
        case StatusType.Res:
            return "魔";
        case StatusType.None:
        default:
            return "-";
    }
}

function statusTypeToString(type) {
    switch (type) {
        case StatusType.Hp:
            return "HP";
        case StatusType.Atk:
            return "攻撃";
        case StatusType.Spd:
            return "速さ";
        case StatusType.Def:
            return "守備";
        case StatusType.Res:
            return "魔防";
        case StatusType.None:
        default:
            return "-";
    }
}

/**
 * @param {String} statusName
 * @returns {number}
 */
function nameToStatusType(statusName) {
    if (statusName === "HP") {
        return StatusType.Hp;
    } else if (statusName === "攻撃") {
        return StatusType.Atk;
    } else if (statusName === "速さ") {
        return StatusType.Spd;
    } else if (statusName === "守備") {
        return StatusType.Def;
    } else if (statusName === "魔防") {
        return StatusType.Res;
    } else {
        return StatusType.None;
    }
}

function statusIndexStr(index) {
    switch (index) {
        case STATUS_INDEX.Atk:
            return "攻撃";
        case STATUS_INDEX.Spd:
            return "速さ";
        case STATUS_INDEX.Def:
            return "守備";
        case STATUS_INDEX.Res:
            return "魔防";
        default:
            return "-";
    }
}

/**
 * シーズンが光、闇、天、理のいずれかであるかを判定します。
 * @param {number} season
 * @returns {boolean}
 */
function isMythicSeasonType(season) {
    switch (season) {
        case SeasonType.Light:
        case SeasonType.Dark:
        case SeasonType.Astra:
        case SeasonType.Anima:
            return true;
        default:
            return false;
    }
}

function isOffenseMythicSeasonType(season) {
    switch (season) {
        case SeasonType.Light:
        case SeasonType.Astra:
            return true;
        default:
            return false;
    }
}

function isDefenseMythicSeasonType(season) {
    switch (season) {
        case SeasonType.Dark:
        case SeasonType.Anima:
            return true;
        default:
            return false;
    }
}

/**
 * シーズンが火、地、水、風のいずれかであるかを判定します。
 * @param {number} season
 * @returns {boolean}
 */
function isLegendarySeasonType(season) {
    return season !== SeasonType.None && !isMythicSeasonType(season);
}
