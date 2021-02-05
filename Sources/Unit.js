/**
 * @file
 * @brief Unit クラスやそれに関連する関数や変数定義です。
 */

const UnitRarity = {
    Star1: 1,
    Star2: 2,
    Star3: 3,
    Star4: 4,
    Star5: 5,
};

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
};

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
};

function isThiefIndex(heroIndex) {
    return heroIndex == Hero.Thief
        || heroIndex == Hero.RedThief
        || heroIndex == Hero.BlueThief
        || heroIndex == Hero.GreenThief;
}

function isThief(unit) {
    return isThiefIndex(unit.heroIndex);
}


const MoveType = {
    Infantry: 0,
    Flying: 1,
    Cavalry: 2,
    Armor: 3,
};

const IvType = {
    None: 0,
    Asset: 1, // 得意
    Flow: 2, // 不得意
}

const StatusType = {
    None: -1,
    Hp: 0,
    Atk: 1,
    Spd: 2,
    Def: 3,
    Res: 4,
};

const IvStateOptions = [
    { id: StatusType.None, text: "なし" },
    { id: StatusType.Hp, text: "HP" },
    { id: StatusType.Atk, text: "攻撃" },
    { id: StatusType.Spd, text: "速さ" },
    { id: StatusType.Def, text: "守備" },
    { id: StatusType.Res, text: "魔防" },
];

function statusTypeToString(type) {
    switch (type) {
        case StatusType.Hp: return "HP";
        case StatusType.Atk: return "攻撃";
        case StatusType.Spd: return "速さ";
        case StatusType.Def: return "守備";
        case StatusType.Res: return "魔防";
        case StatusType.None:
        default:
            return "-";
    }
}

function nameToStatusType(statusName) {
    if (statusName == "HP") {
        return StatusType.Hp;
    } else if (statusName == "攻撃") {
        return StatusType.Atk;
    } else if (statusName == "速さ") {
        return StatusType.Spd;
    } else if (statusName == "守備") {
        return StatusType.Def;
    } else if (statusName == "魔防") {
        return StatusType.Res;
    } else {
        return StatusType.None;
    }
}


const UnitGroupType = {
    Ally: 0,
    Enemy: 1,
};

const SummonerLevel =
{
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
};

function summonerLevelToString(level) {
    switch (level) {
        case SummonerLevel.C: return "C";
        case SummonerLevel.B: return "B";
        case SummonerLevel.A: return "A";
        case SummonerLevel.S: return "S";
        case SummonerLevel.None:
        default:
            return "-";
    }
}

const SummonerLevelOptions = [
    { id: SummonerLevel.None, text: "なし" },
    { id: SummonerLevel.C, text: "C" },
    { id: SummonerLevel.B, text: "B" },
    { id: SummonerLevel.A, text: "A" },
    { id: SummonerLevel.S, text: "S" },
];

const PartnerLevel =
{
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
};


const BlessingType =
{
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
    AirOrders: 6, // 曲技付与
    EffectiveAgainstDragons: 7, // 竜特効付与
    Isolation: 8, // 補助不可
    BonusDoubler: 9, // 強化増幅
    SieldDragonArmor: 10, // 竜特効、重装特効無効
    TotalPenaltyDamage: 11, // 敵弱化ダメージ+
    ResonantBlades: 12, // 双界効果・刃
    Desperation: 13, // 攻め立て
    ResonantShield: 14, // 双界効果・盾
    Vantage: 15, // 待ち伏せ
};

/// シーズンが光、闇、天、理のいずれかであるかを判定します。
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

/// シーズンが火、地、水、風のいずれかであるかを判定します。
function isLegendarySeasonType(season) {
    return season != SeasonType.None && !isMythicSeasonType(season);
}

function moveTypeToString(moveType) {
    switch (moveType) {
        case MoveType.Infantry: return "歩行";
        case MoveType.Flying: return "飛行";
        case MoveType.Cavalry: return "騎馬";
        case MoveType.Armor: return "重装";
        default: return "不明";
    }
}

function colorTypeToString(colorType) {
    switch (colorType) {
        case ColorType.Red: return "赤";
        case ColorType.Blue: return "青";
        case ColorType.Green: return "緑";
        case ColorType.Colorless: return "無";
        default: return "不明";
    }
}

/// ステータス効果が不利なステータス効果であるかどうかを判定します。
function isNegativeStatusEffect(type) {
    switch (type) {
        case StatusEffectType.Panic:
        case StatusEffectType.Gravity:
        case StatusEffectType.CounterattacksDisrupted:
        case StatusEffectType.TriangleAdept:
        case StatusEffectType.Guard:
        case StatusEffectType.Isolation:
            return true;
        default:
            return false;
    }
}

/// ステータス効果が有利なステータス効果であるかどうかを判定します。
function isPositiveStatusEffect(type) {
    return !isNegativeStatusEffect(type);
}

function statusEffectTypeToIconFilePath(value) {
    switch (value) {
        case StatusEffectType.Panic: return g_imageRootPath + "Penalty_Panic.png";
        case StatusEffectType.Gravity: return g_imageRootPath + "MovementRestriction.png";
        case StatusEffectType.MobilityIncreased: return g_imageRootPath + "MovementUp.png";
        case StatusEffectType.EffectiveAgainstDragons:
            return g_imageRootPath + "StatusEffect_EffectiveAgainstDragons.png";
        case StatusEffectType.Isolation:
            return g_imageRootPath + "StatusEffect_Isolation.png";
        case StatusEffectType.AirOrders:
            return g_imageRootPath + "StatusEffect_AirOrders.png";
        case StatusEffectType.Guard:
            return g_imageRootPath + "StatusEffect_Guard.png";
        case StatusEffectType.BonusDoubler:
            return g_imageRootPath + "StatusEffect_BonusDoubler.png";
        case StatusEffectType.CounterattacksDisrupted:
            return g_imageRootPath + "StatusEffect_CounterattacksDisrupted.png";
        case StatusEffectType.SieldDragonArmor:
            return g_imageRootPath + "StatusEffect_SieldDragonArmor.png";
        case StatusEffectType.TotalPenaltyDamage:
            return g_imageRootPath + "TotalPenaltyDamage.png";
        case StatusEffectType.ResonantBlades:
            return g_imageRootPath + "StatusEffect_ResonantBlades.png";
        case StatusEffectType.Desperation:
            return g_imageRootPath + "Desperation.png";
        case StatusEffectType.ResonantShield:
            return g_imageRootPath + "StatusEffect_ResonantShield.png";
        case StatusEffectType.Vantage:
            return g_imageRootPath + "StatusEffect_Vantage.png";
        default: return "";
    }
}


function combatResultToString(result) {
    switch (result) {
        case CombatResult.Win: return "Win";
        case CombatResult.Draw: return "Draw";
        case CombatResult.Loss: return "Loss";
        default: return "Unknown";
    }
}

function groupIdToString(groupId) {
    switch (groupId) {
        case UnitGroupType.Ally: return "味方";
        case UnitGroupType.Enemy: return "敵";
        default: return "";
    }
}

/// 純粋成長率(%)から★5成長値を取得します。
function getGrowthAmountOfStar5FromPureGrowthRate(growthRateAsPercentage) {
    switch (growthRateAsPercentage) {
        case 20: return 8;
        case 25: return 10;
        case 30: return 13;
        case 35: return 15;
        case 40: return 17;
        case 45: return 19;
        case 50: return 22;
        case 55: return 24;
        case 60: return 26;
        case 65: return 28;
        case 70: return 30;
        case 75: return 33;
        case 80: return 35;
        case 85: return 37;
        case 90: return 39;
        default: return -1;
    }
}

/// ☆5の成長量から純粋成長率を計算します。
function getGrowthRateOfStar5Impl(growthAmount) {
    switch (growthAmount) {
        case 8: return 0.2;
        case 10: return 0.25;
        case 13: return 0.30;
        case 15: return 0.35;
        case 17: return 0.40;
        case 19: return 0.45;
        case 22: return 0.50;
        case 24: return 0.55;
        case 26: return 0.60;
        case 28: return 0.65;
        case 30: return 0.70;
        case 33: return 0.75;
        case 35: return 0.80;
        case 37: return 0.85;
        case 39: return 0.90;
        default:
            return -1;
    }
}
function getGrowthRateOfStar5(growthAmount) {
    let rate = getGrowthRateOfStar5Impl(growthAmount);
    if (rate < 0) {
        throw new Error("Invalid growth amount " + growthAmount);
    }
    return rate;
}

function calcAppliedGrowthRate(growthRate, rarity) {
    // let rate = growthRate * (0.79 + (0.07 * this.rarity));
    let rate = Math.floor(100 * growthRate * (0.79 + (0.07 * rarity))) * 0.01;
    return rate;
}

function calcGrowthValue(growthRate, rarity, level) {
    let rate = calcAppliedGrowthRate(growthRate, rarity);
    return Math.floor((level - 1) * rate);
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

/// 値が同じ場合の優先度を取得します。
function __getStatusRankValue(statusType) {
    switch (statusType) {
        case StatusType.Hp: return 4;
        case StatusType.Atk: return 3;
        case StatusType.Spd: return 2;
        case StatusType.Def: return 1;
        case StatusType.Res: return 0;
    }
}


/// 英雄情報です。ユニットの初期化に使用します。
class HeroInfo {
    constructor(name, icon, moveType, weaponType, attackRange,
        hp, atk, spd, def, res,
        hpLv1, atkLv1, spdLv1, defLv1, resLv1,
        hpVar, atkVar, spdVar, defVar, resVar,
        weapon, support, special, passiveA, passiveB, passiveC,
        seasonType,
        blessingType,
        epithet,
        pureName,
        duelScore,
        weapons,
        supports,
        id,
        resplendent,
        origin,
        howToGet,
        releaseDate
    ) {
        this.id = id;
        this.seasonType = seasonType;
        this.blessingType = blessingType;
        this.hp = hp;
        this.atk = atk;
        this.spd = spd;
        this.def = def;
        this.res = res;
        this._name = name;
        this._icon = icon;
        this._moveType = moveType;
        this._attackRange = attackRange;
        this.weapon = weapon;
        this.weaponTypeValue = stringToWeaponType(weaponType);
        this.weaponType = weaponType;
        this.support = support;
        this.special = special;
        this.passiveA = passiveA;
        this.passiveB = passiveB;
        this.passiveC = passiveC;
        this.hpLv1 = Number(hpLv1);
        this.atkLv1 = Number(atkLv1);
        this.spdLv1 = Number(spdLv1);
        this.defLv1 = Number(defLv1);
        this.resLv1 = Number(resLv1);
        this.hpLv1ForStar4 = 0;
        this.hpLv1ForStar3 = 0;
        this.hpLv1ForStar2 = 0;
        this.hpLv1ForStar1 = 0;
        this.atkLv1ForStar4 = 0;
        this.atkLv1ForStar3 = 0;
        this.atkLv1ForStar2 = 0;
        this.atkLv1ForStar1 = 0;
        this.spdLv1ForStar4 = 0;
        this.spdLv1ForStar3 = 0;
        this.spdLv1ForStar2 = 0;
        this.spdLv1ForStar1 = 0;
        this.defLv1ForStar4 = 0;
        this.defLv1ForStar3 = 0;
        this.defLv1ForStar2 = 0;
        this.defLv1ForStar1 = 0;
        this.resLv1ForStar4 = 0;
        this.resLv1ForStar3 = 0;
        this.resLv1ForStar2 = 0;
        this.resLv1ForStar1 = 0;

        this.hpIncrement = Number(hpVar.split('/')[1]);
        this.hpDecrement = Number(hpVar.split('/')[0]);
        this.atkIncrement = Number(atkVar.split('/')[1]);
        this.atkDecrement = Number(atkVar.split('/')[0]);
        this.spdIncrement = Number(spdVar.split('/')[1]);
        this.spdDecrement = Number(spdVar.split('/')[0]);
        this.defIncrement = Number(defVar.split('/')[1]);
        this.defDecrement = Number(defVar.split('/')[0]);
        this.resIncrement = Number(resVar.split('/')[1]);
        this.resDecrement = Number(resVar.split('/')[0]);

        this.epithet = epithet;
        this.pureName = pureName;
        this.duelScore = duelScore;

        this.weaponOptions = [];
        this.supportOptions = [];
        this.specialOptions = [];
        this.passiveAOptions = [];
        this.passiveBOptions = [];
        this.passiveCOptions = [];
        this.passiveSOptions = [];
        this.weapons = weapons;
        this.supports = supports;
        this.isResplendent = resplendent;
        this.origin = origin;
        this.howToGet = howToGet;
        this.releaseDate = releaseDate;
        this.releaseDateAsNumber = dateStrToNumber(releaseDate);

        // 偶像スキルシミュレーター用
        this.weaponOptionsForHallOfForms = [];
        this.supportOptionsForHallOfForms = [];
        this.specialOptionsForHallOfForms = [];
        this.passiveAOptionsForHallOfForms = [];
        this.passiveBOptionsForHallOfForms = [];
        this.passiveCOptionsForHallOfForms = [];
        this.passiveSOptionsForHallOfForms = [];

        this.__updateLv1Statuses();
    }

    get totalGrowthValue() {
        return this.hpGrowthValue + this.atkGrowthValue + this.spdGrowthValue + this.defGrowthValue +
            this.resGrowthValue;
    }

    getStatusTotalOfLv40() {
        return Number(this.hp) +
            Number(this.atk) +
            Number(this.spd) +
            Number(this.def) +
            Number(this.res);
    }
    getStatusTotalOfLv1() {
        return Number(this.hpLv1) +
            Number(this.atkLv1) +
            Number(this.spdLv1) +
            Number(this.defLv1) +
            Number(this.resLv1);
    }

    canEquipRefreshSkill() {
        for (let option of this.supportOptions) {
            if (isRefreshSupportSkill(option.id)) {
                return true;
            }
        }
        return false;
    }

    hasSkillInInitialSkill(skillId) {
        for (let id of this.weapons) {
            if (id == skillId) {
                return true;
            }
        }
        for (let id of this.supports) {
            if (id == skillId) {
                return true;
            }
        }
        return this.special == skillId
            || this.passiveA == skillId
            || this.passiveB == skillId
            || this.passiveC == skillId;
    }

    get detailPageUrl() {
        return "https://puarts.com/?fehhero=" + this.id;
    }

    get iconUrl() {
        return g_siteRootPath + "blog/images/FehHeroThumbs/" + this.icon;
    }

    getIconImgTag(size) {
        return `<img id='${this.id}' src='${this.iconUrl}' width='${size}px' />`;
    }
    getIconImgTagWithAnchor(size) {
        return `<a href='${this.detailPageUrl}' target='_blank'><img id='${this.id}' src='${this.iconUrl}' width='${size}px' /></a>`;
    }

    get name() {
        return this._name;
    }
    get icon() {
        return this._icon;
    }
    get attackRange() {
        return this._attackRange;
    }
    get moveType() {
        return this._moveType;
    }

    get hpGrowthValue() {
        return this.hp - this.hpLv1;
    }
    get atkGrowthValue() {
        return this.atk - this.atkLv1;
    }
    get spdGrowthValue() {
        return this.spd - this.spdLv1;
    }
    get defGrowthValue() {
        return this.def - this.defLv1;
    }
    get resGrowthValue() {
        return this.res - this.resLv1;
    }

    get maxDragonflower() {
        let releaseDate = this.releaseDateAsNumber;
        if (releaseDate > 20200817) {
            return 5;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
                if (releaseDate < 20190101) {
                    // リリース日で二分探索したところ、獣登場の2019年が境界だった
                    return 15;
                }
                else {
                    return 10;
                }
            case MoveType.Flying:
            case MoveType.Armor:
            case MoveType.Cavalry:
            default:
                return 10;
        }
    }

    getHpGrowthRate() {
        return getGrowthRateOfStar5(this.hpGrowthValue);
    }

    calcHpOfSpecifiedLevel(level, rarity = 5, ivType = IvType.None) {
        let growthRate = this.getHpGrowthRate();
        switch (ivType) {
            case IvType.Asset:
                growthRate += 0.05;
                break;
            case IvType.Flow:
                growthRate -= 0.05;
                break;
            case IvType.None:
            default:
                break;
        }
        return this.getHpLv1(rarity) + calcGrowthValue(growthRate, rarity, level);
    }

    getHpLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.hpLv1ForStar1;
            case UnitRarity.Star2: return this.hpLv1ForStar2;
            case UnitRarity.Star3: return this.hpLv1ForStar3;
            case UnitRarity.Star4: return this.hpLv1ForStar4;
            case UnitRarity.Star5: return this.hpLv1;
        }
    }
    getAtkLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.atkLv1ForStar1;
            case UnitRarity.Star2: return this.atkLv1ForStar2;
            case UnitRarity.Star3: return this.atkLv1ForStar3;
            case UnitRarity.Star4: return this.atkLv1ForStar4;
            case UnitRarity.Star5: return this.atkLv1;
        }
    }
    getSpdLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.spdLv1ForStar1;
            case UnitRarity.Star2: return this.spdLv1ForStar2;
            case UnitRarity.Star3: return this.spdLv1ForStar3;
            case UnitRarity.Star4: return this.spdLv1ForStar4;
            case UnitRarity.Star5: return this.spdLv1;
        }
    }
    getDefLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.defLv1ForStar1;
            case UnitRarity.Star2: return this.defLv1ForStar2;
            case UnitRarity.Star3: return this.defLv1ForStar3;
            case UnitRarity.Star4: return this.defLv1ForStar4;
            case UnitRarity.Star5: return this.defLv1;
        }
    }
    getResLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.resLv1ForStar1;
            case UnitRarity.Star2: return this.resLv1ForStar2;
            case UnitRarity.Star3: return this.resLv1ForStar3;
            case UnitRarity.Star4: return this.resLv1ForStar4;
            case UnitRarity.Star5: return this.resLv1;
        }
    }

    __updateLv1Statuses() {
        // ★5のLV1ステータスから他のレアリティのLV1ステータスを以下のロジックから逆算して推定
        // (正しく推定できない場合もあるかもしれない)
        // ☆2になると、HP以外の最も高い2つのステータスが1つずつ増加します
        // ☆3になると、HPと残りの2つのHP以外のステータスが1つずつ増加します
        // ☆4になると、HP以外の最も高い2つのステータスが1つずつ増加します
        // ☆5になると、HPと残りの2つのHP以外のステータスが1つずつ増加します

        this.hpLv1ForStar4 = this.hpLv1 - 1;
        this.hpLv1ForStar3 = this.hpLv1ForStar4;
        this.hpLv1ForStar2 = this.hpLv1ForStar3 - 1;
        this.hpLv1ForStar1 = this.hpLv1ForStar2;

        var statusList = [
            { type: StatusType.Atk, value: this.atkLv1 },
            { type: StatusType.Spd, value: this.spdLv1 },
            { type: StatusType.Def, value: this.defLv1 },
            { type: StatusType.Res, value: this.resLv1 },
        ];

        statusList.sort((a, b) => {
            let bPriority = b.value + __getStatusRankValue(b.type) * 0.1;
            let aPriority = a.value + __getStatusRankValue(a.type) * 0.1;
            return bPriority - aPriority;
        });

        let lowerStatuses = [statusList[2], statusList[3]];
        let heigherStatuses = [statusList[0], statusList[1]];

        for (let status of lowerStatuses) {
            switch (status.type) {
                case StatusType.Atk:
                    this.atkLv1ForStar4 = this.atkLv1 - 1;
                    this.atkLv1ForStar3 = this.atkLv1ForStar4;
                    this.atkLv1ForStar2 = this.atkLv1ForStar3 - 1;
                    this.atkLv1ForStar1 = this.atkLv1ForStar2;
                    break;
                case StatusType.Spd:
                    this.spdLv1ForStar4 = this.spdLv1 - 1;
                    this.spdLv1ForStar3 = this.spdLv1ForStar4;
                    this.spdLv1ForStar2 = this.spdLv1ForStar3 - 1;
                    this.spdLv1ForStar1 = this.spdLv1ForStar2;
                    break;
                case StatusType.Def:
                    this.defLv1ForStar4 = this.defLv1 - 1;
                    this.defLv1ForStar3 = this.defLv1ForStar4;
                    this.defLv1ForStar2 = this.defLv1ForStar3 - 1;
                    this.defLv1ForStar1 = this.defLv1ForStar2;
                    break;
                case StatusType.Res:
                    this.resLv1ForStar4 = this.resLv1 - 1;
                    this.resLv1ForStar3 = this.resLv1ForStar4;
                    this.resLv1ForStar2 = this.resLv1ForStar3 - 1;
                    this.resLv1ForStar1 = this.resLv1ForStar2;
                    break;
            }
        }
        for (let status of heigherStatuses) {
            switch (status.type) {
                case StatusType.Atk:
                    this.atkLv1ForStar4 = this.atkLv1;
                    this.atkLv1ForStar3 = this.atkLv1ForStar4 - 1;
                    this.atkLv1ForStar2 = this.atkLv1ForStar3;
                    this.atkLv1ForStar1 = this.atkLv1ForStar2 - 1;
                    break;
                case StatusType.Spd:
                    this.spdLv1ForStar4 = this.spdLv1;
                    this.spdLv1ForStar3 = this.spdLv1ForStar4 - 1;
                    this.spdLv1ForStar2 = this.spdLv1ForStar3;
                    this.spdLv1ForStar1 = this.spdLv1ForStar2 - 1;
                    break;
                case StatusType.Def:
                    this.defLv1ForStar4 = this.defLv1;
                    this.defLv1ForStar3 = this.defLv1ForStar4 - 1;
                    this.defLv1ForStar2 = this.defLv1ForStar3;
                    this.defLv1ForStar1 = this.defLv1ForStar2 - 1;
                    break;
                case StatusType.Res:
                    this.resLv1ForStar4 = this.resLv1;
                    this.resLv1ForStar3 = this.resLv1ForStar4 - 1;
                    this.resLv1ForStar2 = this.resLv1ForStar3;
                    this.resLv1ForStar1 = this.resLv1ForStar2 - 1;
                    break;
            }
        }
    }
}


/// ダメージ計算時のコンテキストです。 DamageCalculator でこのコンテキストに設定された値が使用されます。
class BattleContext {
    constructor() {
        this.hpBeforeCombat = 0;
        this.canFollowupAttack = false;
        this.canCounterattack = false;
        this.isVantageActivated = false; // 待ち伏せ
        this.isDesperationActivated = false; // 攻め立て
        this.isDefDesperationActivated = false; // 最後の聖戦のように攻め立て受け側バージョン
        this.damageReductionRatioOfFirstAttack = 0;
        this.damageReductionRatioOfConsecutiveAttacks = 0;
        this.damageReductionRatioOfFollowupAttack = 0;
        this.isEffectiveToOpponent = false;
        this.attackCount = 1;
        this.counterattackCount = 1;
        this.canCounterattackToAllDistance = false;
        // 奥義発動カウント変動量
        this.cooldownCountForAttack = 1;
        this.cooldownCountForDefense = 1;

        // 戦闘中に奥義が発動されたかどうか
        this.isSpecialActivated = false;

        // 発動カウント変動量を+1
        this.increaseCooldownCountForAttack = false;
        this.increaseCooldownCountForDefense = false;

        // 発動カウント変動量を-1
        this.reducesCooldownCount = false;

        // // 自身の発動カウント変動量-1を無効
        // this.invalidatesReduceCooldownCount = false;

        // // 敵の発動カウント変動量+1を無効
        // this.invalidatesIncreaseCooldownCount = false;

        // 守備魔防の低い方を参照を無効化
        this.invalidatesReferenceLowerMit = false;

        // 強化無効
        this.invalidatesAtkBuff = false;
        this.invalidatesSpdBuff = false;
        this.invalidatesDefBuff = false;
        this.invalidatesResBuff = false;

        // 神罰の杖
        this.wrathfulStaff = false;

        // 戦闘中自身の弱化を無効化
        this.invalidatesOwnAtkDebuff = false;
        this.invalidatesOwnSpdDebuff = false;
        this.invalidatesOwnDefDebuff = false;
        this.invalidatesOwnResDebuff = false;

        // 守備魔防の低い方でダメージ計算
        this.refersMinOfDefOrRes = false;

        // 氷の聖鏡で軽減したダメージ保持用
        this.reducedDamageBySpecial = 0;

        // 自分から攻撃したか
        this.initiatesCombat = false;

        // 2マス以内に味方がいるか
        this.isThereAnyUnitIn2Spaces = false;

        // 追撃優先度
        this.followupAttackPriority = 0;

        // 戦闘中常に有効になるダメージ軽減率
        this.damageReductionRatio = 0;
    }

    increaseCooldownCountForBoth() {
        this.increaseCooldownCountForAttack = true;
        this.increaseCooldownCountForDefense = true;
    }

    clear() {
        this.canFollowupAttack = false;
        this.canCounterattack = false;
        this.isVantageActivated = false; // 待ち伏せ
        this.isDesperationActivated = false; // 攻め立て
        this.damageReductionRatioOfFirstAttack = 0;
        this.damageReductionRatioOfConsecutiveAttacks = 0;
        this.damageReductionRatioOfFollowupAttack = 0;
        this.isEffectiveToOpponent = false;
        this.attackCount = 1;
        this.counterattackCount = 1;
        this.canCounterattackToAllDistance = false;
        // 奥義発動カウント
        this.cooldownCountForAttack = 1;
        this.cooldownCountForDefense = 1;

        this.isSpecialActivated = false;

        this.increaseCooldownCountForAttack = false;
        this.increaseCooldownCountForDefense = false;
        this.reducesCooldownCount = false;

        // 守備魔防の低い方を参照を無効化
        this.invalidatesReferenceLowerMit = false;

        // 強化無効
        this.invalidatesAtkBuff = false;
        this.invalidatesSpdBuff = false;
        this.invalidatesDefBuff = false;
        this.invalidatesResBuff = false;

        // 神罰の杖
        this.wrathfulStaff = false;

        this.invalidatesOwnAtkDebuff = false;
        this.invalidatesOwnSpdDebuff = false;
        this.invalidatesOwnDefDebuff = false;
        this.invalidatesOwnResDebuff = false;

        this.refersMinOfDefOrRes = false;
        this.reducedDamageBySpecial = 0;

        // // 自身の発動カウント変動量-1を無効
        // this.invalidatesReduceCooldownCount = false;

        // // 敵の発動カウント変動量+1を無効
        // this.invalidatesIncreaseCooldownCount = false;

        this.initiatesCombat = false;
        this.isThereAnyUnitIn2Spaces = false;
        this.followupAttackPriority = 0;
        this.damageReductionRatio = 0;
    }

    invalidateAllBuffs() {
        this.invalidatesAtkBuff = true;
        this.invalidatesSpdBuff = true;
        this.invalidatesDefBuff = true;
        this.invalidatesResBuff = true;
    }

    invalidateAllOwnDebuffs() {
        this.invalidatesOwnAtkDebuff = true;
        this.invalidatesOwnSpdDebuff = true;
        this.invalidatesOwnDefDebuff = true;
        this.invalidatesOwnResDebuff = true;
    }

    multDamageReductionRatio(damageReductionRatio) {
        let damageRatio = 1.0 - this.damageReductionRatio;
        damageRatio *= (1.0 - damageReductionRatio);
        this.damageReductionRatio = Math.trunc((1.0 - damageRatio) * 100 + 0.5) * 0.01;
    }
}

/// 攻撃可能なユニット情報です。
class AttackableUnitInfo {
    constructor(targetUnit) {
        this.targetUnit = targetUnit;
        this.tiles = [];
        this.bestTileToAttack = null;
    }

    toString() {
        var result = this.targetUnit.getNameWithGroup() + ": ";
        for (let tile of this.tiles) {
            result += "(" + tile.posX + "," + tile.posY + ")";
        }
        return result;
    }
}

/// 攻撃の優先度評価に使用するコンテキストです。
class AttackEvaluationContext {
    constructor() {
        this.damageRatio = 0;
        this.combatResult = CombatResult.Draw;
        this.isDebufferTier1 = false;
        this.isDebufferTier2 = false;
        this.isAfflictor = false;
        this.isSpecialChargeIncreased = false;
        this.movementRange = 0;

        this.attackPriority = 0;
        this.attackTargetPriorty = 0;
    }

    calcAttackTargetPriority(attackTarget) {
        let specialChargeIncreasedPriority = 0;
        if (this.isSpecialChargeIncreased) {
            specialChargeIncreasedPriority = 1;
        }

        let debufferTier1Priority = 0;
        if (this.isDebufferTier1) {
            debufferTier1Priority = 1;
        }
        let debufferTier2Priority = 0;
        if (this.isDebufferTier2) {
            debufferTier2Priority = 1;
        }

        this.attackTargetPriorty =
            this.combatResult * 1000000 +
            debufferTier1Priority * 500000 +
            debufferTier2Priority * 250000 +
            this.damageRatio * 100 +
            specialChargeIncreasedPriority * 10 +
            attackTarget.slotOrder;
    }

    calcAttackPriority(attacker) {
        let specialChargeIncreasedPriority = 0;
        if (this.isSpecialChargeIncreased) {
            specialChargeIncreasedPriority = 1;
        }
        let debuffPriority1 = 0;
        let debuffPriority2 = 0;
        if (this.isDebufferTier1) {
            debuffPriority1 = 1;
        } else if (this.isDebufferTier2) {
            debuffPriority2 = 1;
        }
        let afflictorPriority = 0;
        if (this.isAfflictor) {
            afflictorPriority = 1;
        }
        this.movementRange = attacker.moveCount;

        this.attackPriority =
            this.combatResult * 1000000 +
            debuffPriority1 * 500000 +
            debuffPriority2 * 250000 +
            afflictorPriority * 100000 +
            this.damageRatio * 100 +
            this.movementRange * 20 +
            specialChargeIncreasedPriority * 10 +
            attacker.slotOrder;
    }
}

/// 補助行動の優先度を計算するためのクラスです。
class AssistableUnitInfo {
    constructor(targetUnit) {
        this.targetUnit = targetUnit;
        this.assistableTiles = [];

        this.hasThreatenedByEnemyStatus = targetUnit.actionContext.hasThreatenedByEnemyStatus;
        this.hasThreatensEnemyStatus = targetUnit.actionContext.hasThreatensEnemyStatus;
        this.amountOfStatsActuallyBuffed = 0;
        this.amountHealed = 0;
        this.distanceFromClosestEnemy = targetUnit.distanceFromClosestEnemy;
        this.visibleStatTotal = targetUnit.getVisibleStatusTotal();
        this.slotOrder = targetUnit.slotOrder;
        this.isTeleportationRequired = false;
        this.requiredMovementCount = 0;
        this.numOfOtherEligibleTargetsBuffed = 0;
        this.isIntendedAndLowestSlot = false;

        this.assistTargetPriority = 0;
        this.rallyUpTargetPriority = 0;

        this.bestTileToAssist = null;
        this.hasStatAndNonstatDebuff = 0;
    }

    calcAssistTargetPriority(assistUnit, isPrecombat = true) {
        switch (assistUnit.supportInfo.assistType) {
            case AssistType.Refresh:
                this.assistTargetPriority = this.__calcRefreshTargetPriority();
                break;
            case AssistType.Heal:
                this.assistTargetPriority = this.__calcHealTargetPriority(assistUnit);
                break;
            case AssistType.Rally:
                this.assistTargetPriority = this.__calcRallyTargetPriority(assistUnit, isPrecombat);
                break;
            case AssistType.Move:
                this.assistTargetPriority = this.__calcMovementTargetPriority(assistUnit);
                break;
            case AssistType.Restore:
                this.assistTargetPriority = this.__calcRestoreTargetPriority(assistUnit);
                break;
        }
    }

    __calcRestoreTargetPriority(assistUnit) {
        let nagativeEffectPriority = 0;
        let amountHealedPriority = 0;
        let visibleStatTotalPriority = 0;
        if (!this.targetUnit.hasNegativeStatusEffect()) {
            nagativeEffectPriority = 1;
            amountHealedPriority = this.amountHealed;
            visibleStatTotalPriority = this.visibleStatTotal;
        }

        return nagativeEffectPriority * 1000000
            + amountHealedPriority * 10000
            + visibleStatTotalPriority * 10
            + this.targetUnit.slotOrder;
    }

    __calcMovementTargetPriority(assistUnit) {
        this.requiredMovementCount = this.bestTileToAssist.calculateUnitMovementCountToThisTile(assistUnit);

        let assistedWithTeleportSkillPriority = 0;
        if (this.isTeleportationRequired) {
            assistedWithTeleportSkillPriority = 1;
        }

        return assistedWithTeleportSkillPriority * 1000000
            + this.visibleStatTotal * 500
            - this.requiredMovementCount * 10
            + this.slotOrder;
    }

    __calcHealTargetPriority(assistUnit) {
        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
        return this.amountHealed * 1000000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }

    __calcRefreshTargetPriority() {
        let hasThreatensEnemyStatusPriority = 0;
        if (this.hasThreatensEnemyStatus) {
            hasThreatensEnemyStatusPriority = 1;
        }
        return hasThreatensEnemyStatusPriority * 1000000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }
    __calcRallyTargetPriority(assistUnit, isPrecombat) {
        this.hasStatAndNonstatDebuff = 0;
        if (assistUnit.support == Support.HarshCommandPlus) {
            // 一喝+は弱化と状態異常の両方が付与されてるユニットが最優先
            if (this.targetUnit.hasStatDebuff() && this.targetUnit.hasNonstatDebuff()) {
                this.hasStatAndNonstatDebuff = 1;
            }
        }

        this.amountOfStatsActuallyBuffed = 0;
        if (isPrecombat) {
            if (!isRallyUp(assistUnit.support)) {
                this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
            }
        }
        else {
            this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
        }

        return this.hasStatAndNonstatDebuff * 1000000
            + this.amountOfStatsActuallyBuffed * 300000
            - this.distanceFromClosestEnemy * 3000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }
}

/// 敵の動き計算時のコンテキスト
class ActionContext {
    constructor() {
        // 補助のコンテキスト
        this.assistPriority = 0;
        this.assistableUnitInfos = [];
        this.hasThreatenedByEnemyStatus = false;
        this.hasThreatensEnemyStatus = false;
        this.bestTileToAssist = null;
        this.bestTargetToAssist = null;
        this.isBlocker = false;

        // 攻撃者選択のコンテキスト
        this.attackableUnitInfos = [];
        this.bestTargetToAttack = null;
        this.attackEvalContexts = {}; // key=target unit, value=AttackEvaluationContext
        this.bestAttacker = null;

        // その他(オリジナルAI用)
        this.attackableTiles = [];

        // 移動のコンテキスト
        this.movePriority = 0;
    }

    clear() {
        this.assistPriority = 0;
        this.assistableUnitInfos = [];
        this.hasThreatensEnemyStatus = false;
        this.hasThreatenedByEnemyStatus = false;
        this.hasThreatensEnemyStatus = false;
        this.bestTileToAssist = null;
        this.bestTargetToAssist = null;
        this.isBlocker = false;

        this.attackableUnitInfos = [];
        this.bestTargetToAttack = null;
        this.attackEvalContexts = {};
        this.bestAttacker = null;
        this.attackableTiles = [];

        this.movePriority = 0;
    }
    findAssistableUnitInfo(unit) {
        for (let info of this.assistableUnitInfos) {
            if (info.targetUnit == unit) {
                return info;
            }
        }
        return null;
    }
    findAttackableUnitInfo(unit) {
        for (let info of this.attackableUnitInfos) {
            if (info.targetUnit == unit) {
                return info;
            }
        }
        return null;
    }

    removeAttackableUnitInfosWhereBestTileIsEmpty() {
        var result = this.attackableUnitInfos.filter(function (item) {
            return item.bestTileToAttack != null;
        });
        this.attackableUnitInfos = result;
    }
}

const NotReserved = -2;

/// ユニットのインスタンス
class Unit {
    constructor(id = "", name = "", unitGroupType = UnitGroupType.Ally, moveType = MoveType.Infantry, icon = "", attackRange = 1) {
        this._id = id;
        this._name = name;
        this._groupId = unitGroupType;
        this._moveType = moveType;
        this._hp = 1;
        this._maxHp = 1;
        this._atk = 50;
        this._spd = 40;
        this._def = 30;
        this._res = 30;
        this._posX = 0;
        this._posY = 0;
        this._attackRange = attackRange;
        this._placedTile = null;
        this._moveCount = 1;
        this.moveCountAtBeginningOfTurn = 1;
        this.heroInfo = null;

        this.level = 40;
        this.rarity = UnitRarity.Star5;

        this.battleContext = new BattleContext();
        this.actionContext = new ActionContext();

        this.slotOrder = 0;

        this.weaponRefinement = WeaponRefinementType.None;
        this.summonerLevel = SummonerLevel.None; // 絆レベル
        this.merge = 0; // 限界突破数
        this.dragonflower = 0; // 神竜の花
        this.blessingEffects = [];
        this.blessing1 = BlessingType.None;
        this.blessing2 = BlessingType.None;
        this.blessing3 = BlessingType.None;
        this.blessing4 = BlessingType.None;
        this.blessing5 = BlessingType.None;
        this.grantedBlessing = SeasonType.None; // 付与された祝福
        this.providableBlessingSeason = SeasonType.None; // 付与できる祝福
        this.hpLv1 = 0;
        this.atkLv1 = 0;
        this.spdLv1 = 0;
        this.defLv1 = 0;
        this.resLv1 = 0;
        this.hpLvN = 0;
        this.atkLvN = 0;
        this.spdLvN = 0;
        this.defLvN = 0;
        this.resLvN = 0;
        this.hpIncrement = 0;
        this.hpDecrement = 0;
        this.atkIncrement = 0;
        this.atkDecrement = 0;
        this.spdIncrement = 0;
        this.spdDecrement = 0;
        this.defIncrement = 0;
        this.defDecrement = 0;
        this.resIncrement = 0;
        this.resDecrement = 0;

        this.ivHighStat = StatusType.None;
        this.ivLowStat = StatusType.None;

        this.restHp = 1; // ダメージ計算で使うHP
        this.reservedHp = 0;

        this.tmpSpecialCount = 0; // ダメージ計算で使う奥義カウント
        this.weaponType = '';
        this.specialCount = 0;
        this.maxSpecialCount = 0;

        this._maxHpWithSkills = 0;
        this.hpAdd = 0;
        this.hpMult = 1.0;
        this._atkBuff = 0; this._atkDebuff = 0; this.atkSpur = 0; this.atkAdd = 0; this.atkMult = 1.0; this.atkWithSkills = 0;
        this._spdBuff = 0; this._spdDebuff = 0; this.spdSpur = 0; this.spdAdd = 0; this.spdMult = 1.0; this.spdWithSkills = 0;
        this._defBuff = 0; this._defDebuff = 0; this.defSpur = 0; this.defAdd = 0; this.defMult = 1.0; this.defWithSkills = 0;
        this._resBuff = 0; this._resDebuff = 0; this.resSpur = 0; this.resAdd = 0; this.resMult = 1.0; this.resWithSkills = 0;
        this.weapon = -1;
        this.support = -1;
        this.special = -1;
        this.passiveA = -1;
        this.passiveB = -1;
        this.passiveC = -1;
        this.passiveS = -1;
        this.deffensiveTile = false; // 防御床
        this.setMoveCountFromMoveType();

        this.hpGrowthValue = 0;
        this.atkGrowthValue = 0;
        this.spdGrowthValue = 0;
        this.defGrowthValue = 0;
        this.resGrowthValue = 0;

        this.hpGrowthRate = 0.0;
        this.atkGrowthRate = 0.0;
        this.spdGrowthRate = 0.0;
        this.resGrowthRate = 0.0;
        this.defGrowthRate = 0.0;

        this.hpAppliedGrowthRate = 0.0;
        this.atkAppliedGrowthRate = 0.0;
        this.spdAppliedGrowthRate = 0.0;
        this.resAppliedGrowthRate = 0.0;
        this.defAppliedGrowthRate = 0.0;


        this.isActionDone = false;
        this.isBonusChar = false;

        this.statusEffects = [];
        this.bonuses = [];

        this.perTurnStatuses = [];
        this.distanceFromClosestEnemy = -1;

        this.weaponInfo = null;
        this.supportInfo = null;
        this.specialInfo = null;
        this.passiveAInfo = null;
        this.passiveBInfo = null;
        this.passiveCInfo = null;
        this.passiveSInfo = null;

        this.partnerHeroIndex = 0;
        this.partnerLevel = PartnerLevel.None; // 支援レベル

        this.isTransformed = false; // 化身
        this.isResplendent = false; // 神装化

        this.isEnemyActionTriggered = false; // 敵AIが行動開始したかどうか

        this.movementOrder = 0;

        // 双界で護衛が初期位置に戻るのに必要
        this.initPosX = 0;
        this.initPosY = 0;

        // 迅雷やノヴァの聖戦士が発動したかを記録しておく
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;

        // 比翼スキルを使用したか
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;

        // Unitの情報を記録しておく用
        this.snapshot = null;

        this.isSelected = false;
        this.blessingCount = 2;

        // 査定計算用
        this.arenaScore = 0;
        this.totalSp = 0;
        this.rating = 0;
        this.rarityScore = 0;
        this.levelScore = 0;
        this.weaponSp = 0;
        this.specialSp = 0;
        this.supportSp = 0;
        this.passiveASp = 0;
        this.passiveBSp = 0;
        this.passiveCSp = 0;
        this.passiveSSp = 0;

        // 攻撃可能なタイル
        this.movableTiles = [];
        this.attackableTiles = [];
        this.assistableTiles = [];

        // シリアライズする時に一時的に使用
        this.ownerType = 0;
        this.heroIndex = 0;

        // select2でオプションが変わった時に値がリセットされるので一時保存しておく用
        this.reservedWeapon = NotReserved;
        this.reservedSupport = NotReserved;
        this.reservedSpecial = NotReserved;
        this.reservedPassiveA = NotReserved;
        this.reservedPassiveB = NotReserved;
        this.reservedPassiveC = NotReserved;
        this.reservedPassiveS = NotReserved;

        this.chaseTargetTile = null;

        this.moveCountForCanto = 0; // 再移動の移動マス数
        this.isCantoActivatedInCurrentTurn = false; // 現在ターンで再移動が1度でも発動したかどうか

        // ロキの盤上遊戯で一時的に限界突破を変える必要があるので、元の限界突破数を記録する用
        this.originalMerge = 0;
        this.originalDragonflower = 0;

        this.warFundsCost; // ロキの盤上遊戯で購入に必要な軍資金

        this.originalTile = null; // 護り手のように一時的に移動する際に元の位置を記録しておく用
    }

    saveCurrentHpAndSpecialCount() {
        this.restHp = this.hp;
        this.tmpSpecialCount = this.specialCount;
    }

    applyRestHpAndTemporarySpecialCount() {
        this.hp = this.restHp;
        this.specialCount = this.tmpSpecialCount;
    }

    saveOriginalTile() {
        this.originalTile = this.placedTile;
    }

    restoreOriginalTile() {
        this.originalTile.setUnit(this);
        this.originalTile = null;
    }

    canActivateCanto() {
        if (!this.isActionDone || this.isCantoActivatedInCurrentTurn) {
            return false;
        }

        return this.__calcMoveCountForCanto() > 0;
    }

    /// 再移動が発動可能なら発動します。
    activateCantoIfPossible() {
        if (!this.isActionDone || this.isCantoActivatedInCurrentTurn) {
            return;
        }

        this.moveCountForCanto = this.__calcMoveCountForCanto();

        if (this.moveCountForCanto > 0) {
            this.isActionDone = false;
            this.isCantoActivatedInCurrentTurn = true;
        }
    }

    __calcMoveCountForCanto() {
        let moveCountForCanto = 0;
        for (let skillId of this.enumerateSkills()) {
            // 同系統効果複数時、最大値適用
            switch (skillId) {
                case Weapon.Lyngheior:
                    moveCountForCanto = Math.max(moveCountForCanto, 3);
                    break;
            }
        }
        return moveCountForCanto;
    }

    /// 再移動の発動を終了します。
    deactivateCanto() {
        this.moveCountForCanto = 0;
    }

    /// 再移動が発動しているとき、trueを返します。
    isCantoActivated() {
        return this.moveCountForCanto > 0;
    }

    chaseTargetTileToString() {
        if (this.chaseTargetTile == null) {
            return "null";
        }
        return this.chaseTargetTile.positionToString();
    }

    __calcAppliedGrowthRate(growthRate) {
        return calcAppliedGrowthRate(growthRate, this.rarity);
    }

    __calcGrowthValue(growthRate) {
        let rate = this.__calcAppliedGrowthRate(growthRate);
        return Math.floor((this.level - 1) * rate);
    }

    getGrowthRate(growthAmount, statusName) {
        try {
            return getGrowthRateOfStar5(growthAmount);
        }
        catch (e) {
            console.error(`${this.name} ${statusName}: ` + e.message, e.name);
            return -1;
        }
    }

    clearReservedSkills() {
        this.reservedWeapon = NotReserved;
        this.reservedSupport = NotReserved;
        this.reservedSpecial = NotReserved;
        this.reservedPassiveA = NotReserved;
        this.reservedPassiveB = NotReserved;
        this.reservedPassiveC = NotReserved;
        this.reservedPassiveS = NotReserved;
    }

    reserveCurrentSkills() {
        this.reservedWeapon = this.weapon;
        this.reservedSupport = this.support;
        this.reservedSpecial = this.special;
        this.reservedPassiveA = this.passiveA;
        this.reservedPassiveB = this.passiveB;
        this.reservedPassiveC = this.passiveC;
        this.reservedPassiveS = this.passiveS;
    }

    restoreReservedSkills() {
        this.restoreReservedWeapon();
        this.restoreReservedSupport();
        this.restoreReservedSpecial();
        this.restoreReservedPassiveA();
        this.restoreReservedPassiveB();
        this.restoreReservedPassiveC();
        this.restoreReservedPassiveS();
    }

    hasReservedWeapon() {
        return this.reservedWeapon != NotReserved;
    }
    restoreReservedWeapon() {
        if (this.reservedWeapon != NotReserved) {
            this.weapon = this.reservedWeapon;
            this.reservedWeapon = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedSupport() {
        return this.reservedSupport != NotReserved;
    }
    restoreReservedSupport() {
        if (this.reservedSupport != NotReserved) {
            this.support = this.reservedSupport;
            this.reservedSupport = NotReserved;
            return true;
        }
    }
    hasReservedSpecial() {
        return this.reservedSpecial != NotReserved;
    }
    restoreReservedSpecial() {
        if (this.reservedSpecial != NotReserved) {
            this.special = this.reservedSpecial;
            this.reservedSpecial = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveA() {
        return this.reservedPassiveA != NotReserved;
    }
    restoreReservedPassiveA() {
        if (this.reservedPassiveA != NotReserved) {
            this.passiveA = this.reservedPassiveA;
            this.reservedPassiveA = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveB() {
        return this.reservedPassiveB != NotReserved;
    }
    restoreReservedPassiveB() {
        if (this.reservedPassiveB != NotReserved) {
            this.passiveB = this.reservedPassiveB;
            this.reservedPassiveB = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveC() {
        return this.reservedPassiveC != NotReserved;
    }
    restoreReservedPassiveC() {
        if (this.reservedPassiveC != NotReserved) {
            this.passiveC = this.reservedPassiveC;
            this.reservedPassiveC = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveS() {
        return this.reservedPassiveS != NotReserved;
    }
    restoreReservedPassiveS() {
        if (this.reservedPassiveS != NotReserved) {
            this.passiveS = this.reservedPassiveS;
            this.reservedPassiveS = NotReserved;
            return true;
        }
        return false;
    }

    // 攻撃可能なユニット
    *enumerateAttackableUnits() {
        for (let tile of this.attackableTiles) {
            if (tile.placedUnit != null && tile.placedUnit.groupId != this.groupId) {
                yield tile.placedUnit;
            }
        }
    }

    get atkBuff() {
        return Number(this._atkBuff);
    }
    set atkBuff(value) {
        this._atkBuff = Number(value);
    }
    get spdBuff() {
        return Number(this._spdBuff);
    }
    set spdBuff(value) {
        this._spdBuff = Number(value);
    }
    get defBuff() {
        return Number(this._defBuff);
    }
    set defBuff(value) {
        this._defBuff = Number(value);
    }
    get resBuff() {
        return Number(this._resBuff);
    }
    set resBuff(value) {
        this._resBuff = Number(value);
    }


    get atkDebuff() {
        return Number(this._atkDebuff);
    }
    set atkDebuff(value) {
        this._atkDebuff = Number(value);
    }
    get spdDebuff() {
        return Number(this._spdDebuff);
    }
    set spdDebuff(value) {
        this._spdDebuff = Number(value);
    }
    get defDebuff() {
        return Number(this._defDebuff);
    }
    set defDebuff(value) {
        this._defDebuff = Number(value);
    }
    get resDebuff() {
        return Number(this._resDebuff);
    }
    set resDebuff(value) {
        this._resDebuff = Number(value);
    }

    clearSkills() {
        this.weapon = -1;
        this.weaponRefinement = WeaponRefinementType.None;
        this.support = -1;
        this.special = -1;
        this.passiveA = -1;
        this.passiveB = -1;
        this.passiveC = -1;
        this.passiveS = -1;
        this.weaponInfo = null;
        this.supportInfo = null;
        this.specialInfo = null;
        this.passiveAInfo = null;
        this.passiveBInfo = null;
        this.passiveCInfo = null;
        this.passiveSInfo = null;
    }

    resetStatusAdd() {
        this.hpAdd = 0;
        this.atkAdd = 0;
        this.spdAdd = 0;
        this.defAdd = 0;
        this.resAdd = 0;
    }

    resetStatusMult() {
        this.hpMult = 1.0;
        this.atkMult = 1.0;
        this.spdMult = 1.0;
        this.defMult = 1.0;
        this.resMult = 1.0;
    }

    resetStatusAdjustment() {
        this.resetStatusAdd();
        this.resetStatusMult();
    }

    get maxHpWithSkills() {
        let result = Math.floor(Number(this._maxHpWithSkills) * Number(this.hpMult) + Number(this.hpAdd));
        return Math.min(result, 99);
    }

    set maxHpWithSkillsWithoutAdd(value) {
        this._maxHpWithSkills = Math.min(value, 99);
    }

    get maxHpWithSkillsWithoutAdd() {
        return Number(this._maxHpWithSkills);
    }

    set maxHpWithSkills(value) {
        this._maxHpWithSkills = Math.min(value, 99);
        if (this.hp > this.maxHpWithSkills) {
            this.hp = this.maxHpWithSkills;
        }
    }

    clearBlessingEffects() {
        this.blessingEffects = [];
    }
    addBlessingEffect(blessingEffect) {
        this.blessingEffects.push(blessingEffect);
    }
    __syncBlessingEffects() {
        this.blessing1 = BlessingType.None;
        this.blessing2 = BlessingType.None;
        this.blessing3 = BlessingType.None;
        this.blessing4 = BlessingType.None;
        this.blessing5 = BlessingType.None;
        if (this.blessingEffects.length > 0) {
            this.blessing1 = this.blessingEffects[0];
        }
        if (this.blessingEffects.length > 1) {
            this.blessing2 = this.blessingEffects[1];
        }
        if (this.blessingEffects.length > 2) {
            this.blessing3 = this.blessingEffects[2];
        }
        if (this.blessingEffects.length > 3) {
            this.blessing4 = this.blessingEffects[3];
        }
        if (this.blessingEffects.length > 4) {
            this.blessing5 = this.blessingEffects[4];
        }
    }

    turnWideStatusToString() {
        return this.heroIndex
            + ValueDelimiter + this.weapon
            + ValueDelimiter + this.support
            + ValueDelimiter + this.special
            + ValueDelimiter + this.passiveA
            + ValueDelimiter + this.passiveB
            + ValueDelimiter + this.passiveC
            + ValueDelimiter + this.passiveS
            + ValueDelimiter + this.blessing1
            + ValueDelimiter + this.blessing2
            + ValueDelimiter + this.blessing3
            + ValueDelimiter + this.merge
            + ValueDelimiter + this.dragonflower
            + ValueDelimiter + this.ivHighStat
            + ValueDelimiter + this.ivLowStat
            + ValueDelimiter + this.summonerLevel
            + ValueDelimiter + boolToInt(this.isBonusChar)
            + ValueDelimiter + this.weaponRefinement
            + ValueDelimiter + this.partnerHeroIndex
            + ValueDelimiter + this.partnerLevel
            + ValueDelimiter + this.slotOrder
            + ValueDelimiter + this.blessing4
            + ValueDelimiter + this.hpAdd
            + ValueDelimiter + this.atkAdd
            + ValueDelimiter + this.spdAdd
            + ValueDelimiter + this.defAdd
            + ValueDelimiter + this.resAdd
            + ValueDelimiter + this.blessing5
            + ValueDelimiter + this.grantedBlessing
            + ValueDelimiter + boolToInt(this.isResplendent)
            + ValueDelimiter + this.level
            + ValueDelimiter + this.rarity
            + ValueDelimiter + this.initPosX
            + ValueDelimiter + this.initPosY
            + ValueDelimiter + this.hpMult
            + ValueDelimiter + this.atkMult
            + ValueDelimiter + this.spdMult
            + ValueDelimiter + this.defMult
            + ValueDelimiter + this.resMult
            + ValueDelimiter + this.defGrowthRate
            + ValueDelimiter + this.resGrowthRate
            ;
    }

    perTurnStatusToString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + boolToInt(this.isActionDone)
            + ValueDelimiter + this.hp
            + ValueDelimiter + this.atkBuff
            + ValueDelimiter + this.spdBuff
            + ValueDelimiter + this.defBuff
            + ValueDelimiter + this.resBuff
            + ValueDelimiter + this.atkDebuff
            + ValueDelimiter + this.spdDebuff
            + ValueDelimiter + this.defDebuff
            + ValueDelimiter + this.resDebuff
            + ValueDelimiter + this.moveCount
            + ValueDelimiter + this.specialCount
            + ValueDelimiter + this.statusEffectsToString()
            + ValueDelimiter + boolToInt(this.isTransformed)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForSpecial)
            + ValueDelimiter + boolToInt(this.isDuoOrHarmonicSkillActivatedInThisTurn)
            + ValueDelimiter + this.duoOrHarmonizedSkillActivationCount
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForSupport)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForPassiveB)
            + ValueDelimiter + this.moveCountAtBeginningOfTurn
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForWeapon)
            + ValueDelimiter + boolToInt(this.isEnemyActionTriggered)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForShieldEffect)
            + ValueDelimiter + this.perTurnStatusesToString()
            + ValueDelimiter + this.distanceFromClosestEnemy
            + ValueDelimiter + this.movementOrder
            + ValueDelimiter + this.moveCountForCanto
            + ValueDelimiter + boolToInt(this.isCantoActivatedInCurrentTurn)
            ;
    }


    fromTurnWideStatusString(value) {
        let splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.heroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weapon = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.support = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.special = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveA = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveB = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveC = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveS = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing1 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing2 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing3 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.merge = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.dragonflower = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivHighStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivLowStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.summonerLevel = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isBonusChar = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weaponRefinement = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.partnerHeroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.partnerLevel = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.slotOrder = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing4 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.hpAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing5 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.grantedBlessing = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isResplendent = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.level = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.rarity = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosY = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.hpMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.atkMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.spdMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.defMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.resMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.defGrowthRate = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.resGrowthRate = Number(splited[i]); ++i; }
    }

    fromPerTurnStatusString(value) {
        let splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.ownerType = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posY = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isActionDone = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.hp = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this._moveCount = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.specialCount = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.setStatusEffectsFromString(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isTransformed = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForSpecial = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isDuoOrHarmonicSkillActivatedInThisTurn = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.duoOrHarmonizedSkillActivationCount = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForSupport = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForPassiveB = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.moveCountAtBeginningOfTurn = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForWeapon = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isEnemyActionTriggered = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForShieldEffect = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.setPerTurnStatusesFromString(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.distanceFromClosestEnemy = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.movementOrder = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.moveCountForCanto = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isCantoActivatedInCurrentTurn = intToBool(Number(splited[i])); ++i; }
    }


    toString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + this.heroIndex
            + ValueDelimiter + this.weapon
            + ValueDelimiter + this.support
            + ValueDelimiter + this.special
            + ValueDelimiter + this.passiveA
            + ValueDelimiter + this.passiveB
            + ValueDelimiter + this.passiveC
            + ValueDelimiter + this.passiveS
            + ValueDelimiter + this.blessing1
            + ValueDelimiter + this.blessing2
            + ValueDelimiter + this.blessing3
            + ValueDelimiter + this.merge
            + ValueDelimiter + this.dragonflower
            + ValueDelimiter + this.ivHighStat
            + ValueDelimiter + this.ivLowStat
            + ValueDelimiter + this.summonerLevel
            + ValueDelimiter + boolToInt(this.isBonusChar)
            + ValueDelimiter + this.weaponRefinement
            + ValueDelimiter + boolToInt(this.isActionDone)
            + ValueDelimiter + this.hp
            + ValueDelimiter + this.atkBuff
            + ValueDelimiter + this.spdBuff
            + ValueDelimiter + this.defBuff
            + ValueDelimiter + this.resBuff
            + ValueDelimiter + this.atkDebuff
            + ValueDelimiter + this.spdDebuff
            + ValueDelimiter + this.defDebuff
            + ValueDelimiter + this.resDebuff
            + ValueDelimiter + this.moveCount
            + ValueDelimiter + this.specialCount
            + ValueDelimiter + this.statusEffectsToString()
            + ValueDelimiter + this.partnerHeroIndex
            + ValueDelimiter + this.partnerLevel
            + ValueDelimiter + boolToInt(this.isTransformed)
            + ValueDelimiter + this.slotOrder
            + ValueDelimiter + boolToInt(this.isResplendent)
            + ValueDelimiter + this.moveCountAtBeginningOfTurn
            + ValueDelimiter + this.level
            + ValueDelimiter + this.rarity
            + ValueDelimiter + this.initPosX
            + ValueDelimiter + this.initPosY
            ;
    }

    fromString(value) {
        let splited = value.split(ValueDelimiter);

        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.ownerType = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posY = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.heroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weapon = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.support = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.special = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveA = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveB = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveC = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveS = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing1 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing2 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing3 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.merge = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.dragonflower = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivHighStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivLowStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.summonerLevel = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isBonusChar = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weaponRefinement = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isActionDone = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.hp = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this._moveCount = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.specialCount = Number(splited[i]); ++i; }
        this.setStatusEffectsFromString(splited[i]); ++i;
        if (Number.isInteger(Number(splited[i]))) { this.partnerHeroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.partnerLevel = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isTransformed = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.slotOrder = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isResplendent = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.moveCountAtBeginningOfTurn = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.level = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.rarity = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosY = Number(splited[i]); ++i; }
    }

    // 応援を強制的に実行可能かどうか
    canRallyForcibly() {
        for (let skillId of this.enumerateSkills()) {
            if (canRallyForcibly(skillId)) {
                return true;
            }
        }
        return false;
    }

    get canGrantBlessing() {
        return !this.isLegendaryHero && !this.isMythicHero;
    }

    get isLegendaryHero() {
        return this.providableBlessingSeason != SeasonType.None
            && !isMythicSeasonType(this.providableBlessingSeason);
    }

    get isMythicHero() {
        return isMythicSeasonType(this.providableBlessingSeason);
    }

    get debuffTotal() {
        return this.atkDebuffTotal + this.spdDebuffTotal + this.defDebuffTotal + this.resDebuffTotal;
    }

    get atkDebuffTotal() {
        if (this.battleContext.invalidatesOwnAtkDebuff) {
            return 0;
        }

        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return this.atkDebuff - this.atkBuff;
        }
        return this.atkDebuff;
    }
    get spdDebuffTotal() {
        if (this.battleContext.invalidatesOwnSpdDebuff) {
            return 0;
        }

        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return this.spdDebuff - this.spdBuff;
        }
        return this.spdDebuff;
    }
    get defDebuffTotal() {
        if (this.battleContext.invalidatesOwnDefDebuff) {
            return 0;
        }

        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return this.defDebuff - this.defBuff;
        }
        return this.defDebuff;
    }
    get resDebuffTotal() {
        if (this.battleContext.invalidatesOwnResDebuff) {
            return 0;
        }

        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return this.resDebuff - this.resBuff;
        }
        return this.resDebuff;
    }

    isMeleeWeaponType() {
        return isMeleeWeaponType(this.weaponType);
    }

    isRangedWeaponType() {
        return isRangedWeaponType(this.weaponType);
    }

    addBlessing() {
        if (this.blessingCount == 5) {
            return;
        }
        ++this.blessingCount;
    }

    removeBlessing() {
        if (this.blessingCount == 1) {
            return;
        }
        --this.blessingCount;
    }

    createSnapshot() {
        this.snapshot = new Unit();
        this.snapshot._id = this._id;
        this.snapshot.maxSpecialCount = this.maxSpecialCount;
        this.snapshot._maxHp = this._maxHp;
        this.snapshot.hpAdd = this.hpAdd;
        this.snapshot.hpMult = this.hpMult;
        this.snapshot.restHp = this.restHp;
        this.snapshot.tmpSpecialCount = this.tmpSpecialCount;
        this.snapshot._atk = this._atk;
        this.snapshot._spd = this._spd;
        this.snapshot._def = this._def;
        this.snapshot._res = this._res;
        this.snapshot._maxHpWithSkills = this._maxHpWithSkills;
        this.snapshot.atkWithSkills = this.atkWithSkills;
        this.snapshot.spdWithSkills = this.spdWithSkills;
        this.snapshot.defWithSkills = this.defWithSkills;
        this.snapshot.resWithSkills = this.resWithSkills;
        this.snapshot.weaponRefinement = this.weaponRefinement;
        this.snapshot.warFundsCost = this.warFundsCost;
        this.snapshot.level = this.level;
        this.snapshot.heroInfo = this.heroInfo;
        this.snapshot.weaponInfo = this.weaponInfo;
        this.snapshot.supportInfo = this.supportInfo;
        this.snapshot.specialInfo = this.specialInfo;
        this.snapshot.passiveAInfo = this.passiveAInfo;
        this.snapshot.passiveBInfo = this.passiveBInfo;
        this.snapshot.passiveCInfo = this.passiveCInfo;
        this.snapshot.passiveSInfo = this.passiveSInfo;
        this.snapshot.fromString(this.toString());
        return this.snapshot;
    }
    deleteSnapshot() {
        this.snapshot = null;
    }

    perTurnStatusesToString() {
        if (this.perTurnStatuses.length == 0) {
            return String(PerTurnStatusType.None);
        }
        let result = "";
        for (let elem of this.perTurnStatuses) {
            result += elem + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }
    setPerTurnStatusesFromString(value) {
        this.perTurnStatuses = [];
        if (value == null || value == undefined) {
            return;
        }
        if (Number(value) == PerTurnStatusType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited == "") { continue; }
            let status = Number(splited);
            if (Number.isInteger(status)) {
                this.addPerTurnStatus(status);
            }
        }
    }

    statusEffectsToString() {
        if (this.statusEffects.length == 0) {
            return String(StatusEffectType.None);
        }
        let result = "";
        for (let statusEffect of this.statusEffects) {
            result += statusEffect + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }
    setStatusEffectsFromString(value) {
        this.statusEffects = [];
        if (value == null || value == undefined) {
            return;
        }
        if (Number(value) == StatusEffectType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited == "") { continue; }
            let statusEffect = Number(splited);
            if (Number.isInteger(statusEffect)) {
                this.addStatusEffect(statusEffect);
            }
        }
    }
    addAllSpur(amount) {
        this.atkSpur += amount;
        this.spdSpur += amount;
        this.defSpur += amount;
        this.resSpur += amount;
    }

    get isHarmonicHero() {
        return this.heroInfo != null
            && (
                this.heroIndex == Hero.SummerMia
                || this.heroIndex == Hero.PirateVeronica
                || this.heroIndex == Hero.HaloweenTiki
            );
    }

    get isDuoHero() {
        return this.heroInfo != null
            && (this.heroIndex == Hero.HaloweenHector
                || this.heroIndex == Hero.DuoEphraim
                || this.heroIndex == Hero.ChristmasMarth
                || this.heroIndex == Hero.NewYearAlfonse
                || this.heroIndex == Hero.ValentineAlm
                || this.heroIndex == Hero.SpringIdunn
                || this.heroIndex == Hero.YoungPalla
                || this.heroIndex == Hero.BridalMicaiah
                || this.heroIndex == Hero.SummerByleth
                || this.heroIndex == Hero.DuoSigurd
                || this.heroIndex == Hero.DuoLyn
                || this.heroIndex == Hero.DuoAltina
                || this.heroIndex == Hero.DuoPeony
                || this.heroIndex == Hero.PlegianDorothea
            );
    }

    get hasWeapon() {
        return this.weapon != Weapon.None;
    }

    get hasSpecial() {
        return this.special != Special.None;
    }

    get isSpecialCharged() {
        return this.hasSpecial && this.specialCount == 0;
    }

    isAdvantageForColorless(enemyUnit) {
        if (this.weapon == Weapon.BloodTome) {
            return isRangedWeaponType(enemyUnit.weaponType) && enemyUnit.color == ColorType.Colorless;
        }
        return this.weapon == Weapon.EtherealBreath
            || this.weapon == Weapon.KinsekiNoSyo
            || this.weapon == Weapon.GunshiNoRaisyo
            || this.weapon == Weapon.KokukarasuNoSyo
            || this.weapon == Weapon.GunshiNoFusho
            || this.weapon == Weapon.Blarraven
            || this.weapon == Weapon.BlarravenPlus
            || this.weapon == Weapon.Gronnraven
            || this.weapon == Weapon.GronnravenPlus
            || this.weapon == Weapon.Rauarraven
            || this.weapon == Weapon.RauarravenPlus
            || this.weapon == Weapon.YukyuNoSyo
            || this.weapon == Weapon.Nagurufaru
            || this.weapon == Weapon.TomeOfOrder
            ;
    }

    getBuffTotalInCombat(enemyUnit) {
        return this.getAtkBuffInCombat(enemyUnit)
            + this.getSpdBuffInCombat(enemyUnit)
            + this.getDefBuffInCombat(enemyUnit)
            + this.getResBuffInCombat(enemyUnit);
    }

    getDebuffTotalInCombat() {
        return this.getAtkDebuffInCombat()
            + this.getSpdDebuffInCombat()
            + this.getDefDebuffInCombat()
            + this.getResDebuffInCombat();
    }

    get buffTotal() {
        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return 0;
        }
        return this.atkBuff + this.spdBuff + this.defBuff + this.resBuff;
    }

    get debuffTotal() {
        return this.atkDebuffTotal + this.spdDebuffTotal + this.defDebuffTotal + this.resDebuffTotal;
    }

    isWeaponEffectiveAgainst(type) {
        if (this.weaponInfo != null) {
            for (let effective of this.weaponInfo.effectives) {
                if (effective == type) {
                    return true;
                }
            }
        }
        return false;
    }

    hasEffective(type) {
        if (this.isWeaponEffectiveAgainst(type)) {
            return true;
        }

        if (type == EffectiveType.Dragon) {
            if (this.hasStatusEffect(StatusEffectType.EffectiveAgainstDragons)) {
                return true;
            }
        }
        return false;
    }

    calculateDistanceToUnit(unit) {
        if (this.placedTile == null || unit.placedTile == null) {
            return CanNotReachTile;
        }
        return this.placedTile.calculateDistanceToUnit(unit);
    }

    clearNegativeStatusEffects() {
        this.statusEffects = this.getPositiveStatusEffects();
    }
    clearPositiveStatusEffects() {
        this.statusEffects = this.getNegativeStatusEffects();
    }

    // 弱化以外の状態異常が付与されているか
    hasNonstatDebuff() {
        for (let effect of this.statusEffects) {
            if (isNegativeStatusEffect(effect)) {
                return true;
            }
        }
        return false;
    }

    // 弱化が付与されているか
    hasStatDebuff() {
        if ((!this.battleContext.invalidatesOwnAtkDebuff && this.atkDebuff < 0)
            || (!this.battleContext.invalidatesOwnSpdDebuff && this.spdDebuff < 0)
            || (!this.battleContext.invalidatesOwnResDebuff && this.resDebuff < 0)
            || (!this.battleContext.invalidatesOwnDefDebuff && this.defDebuff < 0)
        ) {
            return true;
        }
    }

    // 状態異常が付与されているか
    hasNegativeStatusEffect() {
        return this.hasNonstatDebuff() || this.hasStatDebuff();
    }

    hasPositiveStatusEffect(enemyUnit = null) {
        for (let effect of this.statusEffects) {
            if (isPositiveStatusEffect(effect)) {
                return true;
            }
        }

        if (enemyUnit != null) {
            if ((!enemyUnit.battleContext.invalidatesAtkBuff && this.atkBuff > 0)
                || (!enemyUnit.battleContext.invalidatesSpdBuff && this.spdBuff > 0)
                || (!enemyUnit.battleContext.invalidatesResBuff && this.resBuff > 0)
                || (!enemyUnit.battleContext.invalidatesDefBuff && this.defBuff > 0)
            ) {
                return true;
            }
        }

        return false;
    }

    getPositiveStatusEffects() {
        let result = [];
        for (let effect of this.statusEffects) {
            if (isPositiveStatusEffect(effect)) {
                result.push(effect);
            }
        }
        return result;
    }

    getNegativeStatusEffects() {
        let result = [];
        for (let effect of this.statusEffects) {
            if (isNegativeStatusEffect(effect)) {
                result.push(effect);
            }
        }
        return result;
    }

    addStatusEffect(statusEffectType) {
        if (this.hasStatusEffect(statusEffectType)) {
            return;
        }
        this.statusEffects.push(statusEffectType);
    }

    clearPerTurnStatuses() {
        this.perTurnStatuses = [];
    }

    hasPassStatus() {
        return this.hasPerTurnStatus(PerTurnStatusType.Pass);
    }

    addPerTurnStatus(value) {
        if (this.hasPerTurnStatus(value)) {
            return;
        }
        this.perTurnStatuses.push(value);
    }

    get hasAnyStatusEffect() {
        return this.statusEffects.length > 0;
    }

    hasPerTurnStatus(value) {
        for (let elem of this.perTurnStatuses) {
            if (elem == value) {
                return true;
            }
        }
        return false;
    }

    hasStatusEffect(statusEffectType) {
        for (let statusEffect of this.statusEffects) {
            if (statusEffect == statusEffectType) {
                return true;
            }
        }
        return false;
    }

    isNextTo(unit) {
        let dist = Math.abs(this.posX - unit.posX) + Math.abs(this.posY - unit.posY);
        return dist == 1;
    }

    getActualAttackRange(attackTargetUnit) {
        if (this.isCantoActivated()) {
            return 0;
        }

        let dist = calcDistance(this.posX, this.posY, attackTargetUnit.posX, attackTargetUnit.posY);
        return dist;
    }

    canActivatePass() {
        return (this.passiveB == PassiveB.Surinuke3 && this.hpPercentage >= 25)
            || (this.weapon == Weapon.FujinYumi && !this.isWeaponRefined && this.hpPercentage >= 50);
    }

    get isOnMap() {
        return this.placedTile != null;
    }

    get isBuffed() {
        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return false;
        }
        return this.atkBuff > 0 ||
            this.spdBuff > 0 ||
            this.defBuff > 0 ||
            this.resBuff > 0;
    }

    get isDebuffed() {
        return this.atkDebuff < 0 ||
            this.spdDebuff < 0 ||
            this.defDebuff < 0 ||
            this.resDebuff < 0;
    }

    get isSpecialCountMax() {
        return this.specialCount == this.maxSpecialCount;
    }

    setSpecialCountToMax() {
        this.specialCount = this.maxSpecialCount;
    }

    resetAllState() {
        this.hp = this.maxHpWithSkills;
        this.specialCount = this.maxSpecialCount;
        this.isActionDone = false;
        this.isTransformed = false;
        this.setMoveCountFromMoveType();
        this.resetBuffs();
        this.resetDebuffs();
        this.statusEffects = [];
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;
        this.initPosX = this.posX;
        this.initPosY = this.posY;
        if (this.groupId == UnitGroupType.Enemy) {
            this.isEnemyActionTriggered = false;
        }
        else {
            this.isEnemyActionTriggered = true;
        }
    }

    canDisableEnemySpursFromAlly() {
        return this.passiveC == PassiveC.ImpenetrableDark;
    }

    resetSpurs() {
        this.atkSpur = 0;
        this.spdSpur = 0;
        this.defSpur = 0;
        this.resSpur = 0;
    }

    resetBuffs() {
        this.atkBuff = 0;
        this.spdBuff = 0;
        this.defBuff = 0;
        this.resBuff = 0;
    }

    resetDebuffs() {
        this.atkDebuff = 0;
        this.spdDebuff = 0;
        this.defDebuff = 0;
        this.resDebuff = 0;
    }

    resetOneTimeActionActivationStates() {
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;
        this.isCantoActivatedInCurrentTurn = false;
    }

    isOnInitPos() {
        return this.posX == this.initPosX && this.posY == this.initPosY;
    }

    beginAction() {
        if (!this.isActionDone) {
            return;
        }

        this.isActionDone = false;
        this.resetBuffs();
        this.setMoveCountFromMoveType();
        this.clearPositiveStatusEffects();
    }

    // 行動終了状態にする
    endAction() {
        if (this.isActionDone) {
            return;
        }

        this.isActionDone = true;
        if (this.isMovementRestricted) {
            this.setMoveCountFromMoveType();
        }
        this.resetDebuffs();
        this.clearNegativeStatusEffects();
    }

    applyAllBuff(amount) {
        this.applyAtkBuff(amount);
        this.applySpdBuff(amount);
        this.applyDefBuff(amount);
        this.applyResBuff(amount);
    }
    applyAllDebuff(amount) {
        this.applyAtkDebuff(amount);
        this.applySpdDebuff(amount);
        this.applyDefDebuff(amount);
        this.applyResDebuff(amount);
    }

    applyDebuffForHighestStatus(amount, fromSnapshot = false) {
        for (let status of this.__getHighestStatuses(fromSnapshot)) {
            switch (status) {
                case StatusType.Atk: this.applyAtkDebuff(amount); break;
                case StatusType.Spd: this.applySpdDebuff(amount); break;
                case StatusType.Def: this.applyDefDebuff(amount); break;
                case StatusType.Res: this.applyResDebuff(amount); break;
            }
        }
    }

    __getHighestStatuses(fromSnapshot = false) {
        let maxStatuses = [StatusType.Atk];
        let unit = this;
        if (fromSnapshot) {
            unit = this.snapshot;
        }
        let maxValue = unit.getAtkInPrecombat() - 15; // 攻撃は-15して比較
        {
            let value = unit.getSpdInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Spd];
                maxValue = value;
            }
            else if (value == maxValue) {
                maxStatuses.push(StatusType.Spd);
            }
        }
        {
            let value = unit.getDefInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Def];
                maxValue = value;
            }
            else if (value == maxValue) {
                maxStatuses.push(StatusType.Def);
            }
        }
        {
            let value = unit.getResInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Res];
                maxValue = value;
            }
            else if (value == maxValue) {
                maxStatuses.push(StatusType.Res);
            }
        }
        return maxStatuses;
    }

    applyAtkBuff(buffAmount) {
        if (this.atkBuff < buffAmount) {
            this.atkBuff = buffAmount;
            return true;
        }
        return false;
    }

    applySpdBuff(buffAmount) {
        if (this.spdBuff < buffAmount) {
            this.spdBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyDefBuff(buffAmount) {
        if (this.defBuff < buffAmount) {
            this.defBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyResBuff(buffAmount) {
        if (this.resBuff < buffAmount) {
            this.resBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyAtkDebuff(amount) {
        if (this.atkDebuff > amount) {
            this.atkDebuff = amount;
            return true;
        }
        return false;
    }

    applySpdDebuff(amount) {
        if (this.spdDebuff > amount) {
            this.spdDebuff = amount;
            return true;
        }
        return false;
    }

    applyDefDebuff(amount) {
        if (this.defDebuff > amount) {
            this.defDebuff = amount;
            return true;
        }
        return false;
    }

    applyResDebuff(amount) {
        if (this.resDebuff > amount) {
            this.resDebuff = amount;
            return true;
        }
        return false;
    }

    modifySpecialCount() {
        if (this.specialCount > Number(this.maxSpecialCount)) {
            this.specialCount = Number(this.maxSpecialCount);
        }
        else if (Number(this.specialCount) < 0) {
            this.specialCount = 0;
        }
    }

    increaseSpecialCount(amount) {
        this.specialCount = Number(this.specialCount) + amount;
        if (this.specialCount > Number(this.maxSpecialCount)) {
            this.specialCount = Number(this.maxSpecialCount);
        }
    }
    reduceSpecialCount(amount) {
        this.specialCount = Number(this.specialCount) - amount;
        if (Number(this.specialCount) < 0) {
            this.specialCount = 0;
        }
    }
    reduceSpecialCountToZero() {
        this.specialCount = 0;
    }

    get currentDamage() {
        return this.maxHpWithSkills - this.hp;
    }

    initReservedHp() {
        this.reservedHp = Number(this.hp);
    }

    applyReservedHp(leavesOneHp) {
        this.hp = this.reservedHp;
        this.modifyHp(leavesOneHp);
    }

    reserveTakeDamage(damageAmount) {
        this.reservedHp = this.reservedHp - damageAmount;
    }

    reserveHeal(healAmount) {
        this.reservedHp = this.reservedHp + healAmount;
    }

    modifyHp(leavesOneHp = false) {
        if (this.hp > this.maxHpWithSkills) {
            this.hp = this.maxHpWithSkills;
        }
        else if (this.hp <= 0) {
            if (leavesOneHp) {
                this.hp = 1;
            }
            else {
                this.hp = 0;
            }
        }
    }

    takeDamage(damageAmount, leavesOneHp = false) {
        if (this.isDead) {
            return;
        }
        let hp = this.hp - damageAmount;
        if (hp < 1) {
            if (leavesOneHp) {
                hp = 1;
            } else {
                hp = 0;
            }
        }
        this.hp = hp;
    }

    heal(healAmount) {
        let damage = this.maxHpWithSkills - this.hp;
        let hp = this.hp + healAmount;
        if (hp > this.maxHpWithSkills) {
            hp = this.maxHpWithSkills;
        }
        this.hp = hp;
        return Math.min(damage, healAmount);
    }

    get isAlive() {
        return this.hp > 0;
    }

    get isDead() {
        return this.hp == 0;
    }

    get serialId() {
        return UnitCookiePrefix + this.id;
    }

    get hasRefreshAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Refresh;
    }
    get hasHealAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Heal;
    }
    get hasDonorHealAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.DonorHeal;
    }
    get hasRestoreAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Restore;
    }
    get hasRallyAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Rally;
    }
    get hasMoveAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Move;
    }

    get isWeaponEquipped() {
        return this.weapon != Weapon.None;
    }

    get isWeaponSpecialRefined() {
        return this.weaponRefinement == WeaponRefinementType.Special
            || this.weaponRefinement == WeaponRefinementType.Special_Hp3;
    }
    get isWeaponRefined() {
        return this.weaponRefinement != WeaponRefinementType.None;
    }

    get maxDragonflower() {
        if (this.heroInfo == null) {
            return 0;
        }

        return this.heroInfo.maxDragonflower;
    }

    get hpPercentage() {
        if (this.hp >= this.maxHpWithSkills) {
            return 100;
        }
        return Math.round((100 * this.hp / this.maxHpWithSkills) * 100) / 100;
    }

    /// 戦闘のダメージ計算時の残りHPです。戦闘のダメージ計算のみで使用できます。
    get restHpPercentage() {
        if (this.restHp >= this.maxHpWithSkills) {
            return 100;
        }
        return Math.round((100 * this.restHp / this.maxHpWithSkills) * 100) / 100;
    }
    get isRestHpFull() {
        return this.restHp >= this.maxHpWithSkills;
    }
    get hasPanic() {
        return this.hasStatusEffect(StatusEffectType.Panic);
    }

    getNormalMoveCount() {
        switch (this.passiveS) {
            case PassiveS.GoeiNoGuzo:
            case PassiveS.TozokuNoGuzoRakurai:
            case PassiveS.TozokuNoGuzoKobu:
            case PassiveS.TozokuNoGuzoKogun:
            case PassiveS.TozokuNoGuzoKusuri:
            case PassiveS.TozokuNoGuzoOugi:
            case PassiveS.TozokuNoGuzoOdori:
                return 1;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
            case MoveType.Flying:
                return 2;
            case MoveType.Armor:
                return 1;
            case MoveType.Cavalry:
                return 3;
            default:
                return 1;
        }
    }

    setMoveCountFromMoveType() {
        this._moveCount = this.getNormalMoveCount();
    }

    get isMovementRestricted() {
        return this.moveCount < this.getNormalMoveCount();
    }

    get isMobilityIncreased() {
        return this.moveCount > this.getNormalMoveCount();
    }

    getNameWithGroup() {
        return this.name + "(" + groupIdToString(this.groupId) + ")";
    }

    get color() {
        switch (this.weaponType) {
            case WeaponType.Sword:
            case WeaponType.RedTome:
            case WeaponType.RedBreath:
            case WeaponType.RedBeast:
            case WeaponType.RedBow:
            case WeaponType.RedDagger:
                return ColorType.Red;
            case WeaponType.Lance:
            case WeaponType.BlueTome:
            case WeaponType.BlueBreath:
            case WeaponType.BlueBeast:
            case WeaponType.BlueBow:
            case WeaponType.BlueDagger:
                return ColorType.Blue;
            case WeaponType.Axe:
            case WeaponType.GreenTome:
            case WeaponType.GreenBreath:
            case WeaponType.GreenBeast:
            case WeaponType.GreenBow:
            case WeaponType.GreenDagger:
                return ColorType.Green;
            case WeaponType.Staff:
            case WeaponType.ColorlessTome:
            case WeaponType.ColorlessBreath:
            case WeaponType.ColorlessBeast:
            case WeaponType.ColorlessBow:
            case WeaponType.ColorlessDagger:
                return ColorType.Colorless;
            default:
                return ColorType.Unknown;
        }
    }

    get moveCount() {
        if (this.isCantoActivated()) {
            return this.moveCountForCanto;
        }
        if (this.hasStatusEffect(StatusEffectType.Gravity)) {
            return 1;
        }
        if (this.hasStatusEffect(StatusEffectType.MobilityIncreased)) {
            return this.getNormalMoveCount() + 1;
        }
        if (this.isTransformed
            && this.moveType == MoveType.Flying
            && isWeaponTypeBeast(this.weaponType)
        ) {
            return 3;
        }

        return this._moveCount;
    }

    set moveCount(value) {
        this._moveCount = value;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get hp() {
        return this._hp;
    }

    setHpInValidRange(value, leavesOneHp = true) {
        this._hp = value;
        if (this._hp > this.maxHpWithSkills) {
            this._hp = this.maxHpWithSkills;
        }
        if (value <= 0) {
            if (leavesOneHp) {
                this._hp = 1;
            } else {
                this._hp = 0;
            }
        }
    }

    set hp(value) {
        this._hp = value;
    }

    get maxHp() {
        return this._maxHp;
    }

    get isFullHp() {
        return this.hp == this.maxHpWithSkills;
    }

    set maxHp(value) {
        this._maxHp = value;
    }

    get atk() {
        return this._atk;
    }

    set atk(value) {
        this._atk = value;
    }

    get spd() {
        return this._spd;
    }

    set spd(value) {
        this._spd = value;
    }

    get def() {
        return this._def;
    }

    set def(value) {
        this._def = value;
    }

    get res() {
        return this._res;
    }

    set res(value) {
        this._res = value;
    }

    get icon() {
        if (this.heroInfo == null) {
            return "";
        }
        return this.heroInfo.iconUrl;
    }

    get attackRange() {
        if (this.isCantoActivated()) {
            return 0;
        }

        if (this.weapon == Weapon.None) {
            return 0;
        }
        return this._attackRange;
    }
    set attackRange(value) {
        this._attackRange = value;
    }

    get enemyGroupId() {
        if (this.groupId == UnitGroupType.Ally) {
            return UnitGroupType.Enemy;
        }
        return UnitGroupType.Ally;
    }

    get groupId() {
        return this._groupId;
    }
    get moveType() {
        return this._moveType;
    }
    set moveType(value) {
        this._moveType = value;
    }

    get posX() {
        if (this.placedTile != null) {
            return this.placedTile.posX;
        }
        return this._posX;
    }
    set posX(value) {
        this._posX = value;
    }

    get posY() {
        if (this.placedTile != null) {
            return this.placedTile.posY;
        }
        return this._posY;
    }
    set posY(value) {
        this._posY = value;
    }

    get placedTile() {
        return this._placedTile;
    }
    set placedTile(value) {
        this._placedTile = value;
    }

    /// 装備中の武器名を取得します。
    getWeaponName() {
        if (this.weaponInfo == null) {
            return "‐";
        }
        return this.weaponInfo.name;
    }
    /// 装備中のAスキル名を取得します。
    getPassiveAName() {
        if (this.passiveAInfo == null) {
            return "‐";
        }
        return this.passiveAInfo.name;
    }
    /// 装備中の聖印名を取得します。
    getPassiveSName() {
        if (this.passiveSInfo == null) {
            return "‐";
        }
        return this.passiveSInfo.name;
    }

    getVisibleStatusTotal() {
        return this.getAtkInPrecombat()
            + this.getSpdInPrecombat()
            + this.getDefInPrecombat()
            + this.getResInPrecombat();
    }

    setPos(x, y) {
        this.posX = x;
        this.posY = y;
    }

    getTriangleAdeptAdditionalRatio() {
        if (this.passiveA == PassiveA.AishoGekika3
            || this.weapon == Weapon.AsahiNoKen
            || this.weapon == Weapon.AsahiNoKenPlus
            || this.weapon == Weapon.SoukaiNoYari
            || this.weapon == Weapon.SoukaiNoYariPlus
            || this.weapon == Weapon.ShinryokuNoOno
            || this.weapon == Weapon.ShinryokuNoOnoPlus
            || this.weapon == Weapon.WakakiMogyuNoYari
            || this.weapon == Weapon.WakakiKurohyoNoKen
            || this.weapon == Weapon.ShinginNoSeiken
            || this.weapon == Weapon.YoheidanNoSenfu
            || (this.weapon == Weapon.Forukuvangu && this.isWeaponSpecialRefined)
            || (this.weapon == Weapon.TomeOfOrder && this.isWeaponSpecialRefined)
        ) {
            return 0.2;
        }
        else if (this.passiveA == PassiveA.AishoGekika2) {
            return 0.15;
        } else if (this.passiveA == PassiveA.AishoGekika1) {
            return 0.1;
        }
        return 0;
    }

    hasTriangleAdeptSkill() {
        return this.passiveA == PassiveA.AishoGekika3
            || this.passiveA == PassiveA.AishoGekika2
            || this.passiveA == PassiveA.AishoGekika1
            || this.weapon == Weapon.AsahiNoKen
            || this.weapon == Weapon.AsahiNoKenPlus
            || this.weapon == Weapon.SoukaiNoYari
            || this.weapon == Weapon.SoukaiNoYariPlus
            || this.weapon == Weapon.ShinryokuNoOno
            || this.weapon == Weapon.ShinryokuNoOnoPlus
            || this.weapon == Weapon.WakakiMogyuNoYari
            || this.weapon == Weapon.WakakiKurohyoNoKen
            || this.weapon == Weapon.ShinginNoSeiken
            || this.weapon == Weapon.YoheidanNoSenfu
            || (this.weapon == Weapon.Forukuvangu && this.isWeaponSpecialRefined)
            || (this.weapon == Weapon.TomeOfOrder && this.isWeaponSpecialRefined)
            ;
    }

    __getBuffMultiply() {
        if (this.hasStatusEffect(StatusEffectType.Panic)) {
            return -1;
        }
        return 1;
    }
    getSpdInPrecombatWithoutDebuff() {
        return Number(this.spdWithSkills) + Number(this.spdBuff) * this.__getBuffMultiply();
    }
    getSpdInPrecombat() {
        return Math.min(99, this.getSpdInPrecombatWithoutDebuff() + Number(this.spdDebuff));
    }
    getEvalSpdInCombat(enemyUnit = null) {
        let val = this.getSpdInCombat(enemyUnit) + this.__getEvalSpdAdd();
        return val;
    }
    getEvalSpdInPrecombat() {
        let val = this.getSpdInPrecombat() + this.__getEvalSpdAdd();
        return val;
    }
    __getEvalSpdAdd() {
        switch (this.passiveS) {
            case PassiveS.HayasaNoKyosei1:
                return 5;
            case PassiveS.HayasaNoKyosei2:
                return 8;
            case PassiveS.HayasaNoKyosei3:
                return 10;
            default:
                return 0;
        }
    }

    getAtkInPrecombatWithoutDebuff() {
        return Number(this.atkWithSkills) + Number(this.atkBuff) * this.__getBuffMultiply();
    }
    getAtkInPrecombat() {
        return Math.min(99, this.getAtkInPrecombatWithoutDebuff() + Number(this.atkDebuff));
    }

    __getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
        let buffMult = this.__getBuffMultiply();
        let buff = 0;
        if (getInvalidatesFunc()) {
            if (buffMult < 0) {
                buff = getBuffFunc() * buffMult;
            }
        }
        else {
            buff = getBuffFunc() * buffMult;
        }

        if (buff < 0 && getInvalidateOwnDebuffFunc()) {
            return 0;
        }

        return buff;
    }

    getAtkBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesAtkBuff,
            () => Number(this.atkBuff),
            () => this.battleContext.invalidatesOwnAtkDebuff
        );
    }
    getSpdBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesSpdBuff,
            () => Number(this.spdBuff),
            () => this.battleContext.invalidatesOwnSpdDebuff
        );
    }
    getResBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesResBuff,
            () => Number(this.resBuff),
            () => this.battleContext.invalidatesOwnResDebuff
        );
    }
    getDefBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesDefBuff,
            () => Number(this.defBuff),
            () => this.battleContext.invalidatesOwnDefDebuff
        );
    }

    __getStatusInCombat(getInvalidatesFunc, getStatusWithoutBuffFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
        let statusWithoutBuff = getStatusWithoutBuffFunc();
        let buff = this.__getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc);
        let total = statusWithoutBuff + buff;
        return total;
    }

    getAtkInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesAtkBuff,
            () => this.__getAtkInCombatWithoutBuff(),
            () => Number(this.atkBuff),
            () => this.battleContext.invalidatesOwnAtkDebuff
        );
    }
    getSpdInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesSpdBuff,
            () => this.__getSpdInCombatWithoutBuff(),
            () => Number(this.spdBuff),
            () => this.battleContext.invalidatesOwnSpdDebuff
        );
    }
    getDefInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesDefBuff,
            () => this.__getDefInCombatWithoutBuff(),
            () => Number(this.defBuff),
            () => this.battleContext.invalidatesOwnDefDebuff
        );
    }

    getResInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesResBuff,
            () => this.__getResInCombatWithoutBuff(),
            () => Number(this.resBuff),
            () => this.battleContext.invalidatesOwnResDebuff
        );
    }
    getAtkDebuffInCombat() {
        return this.battleContext.invalidatesOwnAtkDebuff ? 0 : Number(this.atkDebuff);
    }
    getSpdDebuffInCombat() {
        return this.battleContext.invalidatesOwnSpdDebuff ? 0 : Number(this.spdDebuff);
    }
    getDefDebuffInCombat() {
        return this.battleContext.invalidatesOwnDefDebuff ? 0 : Number(this.defDebuff);
    }
    getResDebuffInCombat() {
        return this.battleContext.invalidatesOwnResDebuff ? 0 : Number(this.resDebuff);
    }

    __getAtkInCombatWithoutBuff() {
        return (Number(this.atkWithSkills) + this.getAtkDebuffInCombat() + Number(this.atkSpur));
    }
    __getSpdInCombatWithoutBuff() {
        return (Number(this.spdWithSkills) + this.getSpdDebuffInCombat() + Number(this.spdSpur));
    }
    __getDefInCombatWithoutBuff() {
        return (Number(this.defWithSkills) + this.getDefDebuffInCombat() + Number(this.defSpur));
    }
    __getResInCombatWithoutBuff() {
        return (Number(this.resWithSkills) + this.getResDebuffInCombat() + Number(this.resSpur));
    }

    getEvalDefInPrecombat() {
        return this.getDefInPrecombat() + this.__getEvalDefAdd();
    }
    getEvalDefInCombat(enemyUnit = null) {
        let val = this.getDefInCombat(enemyUnit) + this.__getEvalDefAdd();
        return val;
    }

    getDefInPrecombatWithoutDebuff() {
        var mit = Number(this.defWithSkills);
        var mitBuff = Number(this.defBuff) * this.__getBuffMultiply();
        return mit + mitBuff;
    }
    getDefInPrecombat() {
        return Math.min(99, this.getDefInPrecombatWithoutDebuff() + Number(this.defDebuff));
    }
    getResInPrecombatWithoutDebuff() {
        var mit = Number(this.resWithSkills);
        var mitBuff = Number(this.resBuff) * this.__getBuffMultiply();
        return mit + mitBuff;
    }
    getResInPrecombat() {
        return Math.min(99, this.getResInPrecombatWithoutDebuff() + Number(this.resDebuff));
    }
    getEvalResInCombat(enemyUnit = null) {
        let val = this.getResInCombat(enemyUnit) + this.__getEvalResAdd();
        return val;
    }
    getEvalResInPrecombat() {
        let val = this.getResInPrecombat() + this.__getEvalResAdd();
        return val;
    }
    __getEvalDefAdd() {
        switch (this.passiveS) {
            default:
                return 0;
        }
    }
    __getEvalResAdd() {
        switch (this.passiveS) {
            case PassiveS.MaboNoKyosei1:
                return 5;
            case PassiveS.MaboNoKyosei2:
                return 8;
            case PassiveS.MaboNoKyosei3:
                return 10;
            default:
                return 0;
        }
    }

    hasSkill(skillId) {
        for (let id of this.enumerateSkills()) {
            if (id == skillId) {
                return true;
            }
        }
        return false;
    }

    hasPassiveSkill(skillId) {
        for (let id of this.enumeratePassiveSkills()) {
            if (id == skillId) {
                return true;
            }
        }
        return false;
    }

    isPhysicalAttacker() {
        switch (this.weaponType) {
            case WeaponType.Sword:
            case WeaponType.RedBeast:
            case WeaponType.RedBow:
            case WeaponType.RedDagger:
            case WeaponType.Lance:
            case WeaponType.BlueBeast:
            case WeaponType.BlueBow:
            case WeaponType.BlueDagger:
            case WeaponType.Axe:
            case WeaponType.GreenBeast:
            case WeaponType.GreenBow:
            case WeaponType.GreenDagger:
            case WeaponType.ColorlessBeast:
            case WeaponType.ColorlessBow:
            case WeaponType.ColorlessDagger:
                return true;
            default:
                return false;
        }
    }

    updateStatusByWeaponRefinement() {
        switch (this.weaponRefinement) {
            case WeaponRefinementType.Special_Hp3: this._maxHpWithSkills += 3; break;
            case WeaponRefinementType.Hp5_Atk2: this._maxHpWithSkills += 5; this.atkWithSkills += 2; break;
            case WeaponRefinementType.Hp5_Spd3: this._maxHpWithSkills += 5; this.spdWithSkills += 3; break;
            case WeaponRefinementType.Hp5_Def4: this._maxHpWithSkills += 5; this.defWithSkills += 4; break;
            case WeaponRefinementType.Hp5_Res4: this._maxHpWithSkills += 5; this.resWithSkills += 4; break;
            case WeaponRefinementType.Hp2_Atk1: this._maxHpWithSkills += 2; this.atkWithSkills += 1; break;
            case WeaponRefinementType.Hp2_Spd2: this._maxHpWithSkills += 2; this.spdWithSkills += 2; break;
            case WeaponRefinementType.Hp2_Def3: this._maxHpWithSkills += 2; this.defWithSkills += 3; break;
            case WeaponRefinementType.Hp2_Res3: this._maxHpWithSkills += 2; this.resWithSkills += 3; break;
            default: break;
        }
    }

    updateStatusBySummonerLevel() {
        switch (this.summonerLevel) {
            case SummonerLevel.C:
                this._maxHpWithSkills += 3;
                this.resWithSkills += 2;
                break;
            case SummonerLevel.B:
                this._maxHpWithSkills += 4;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                break;
            case SummonerLevel.A:
                this._maxHpWithSkills += 4;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                this.spdWithSkills += 2;
                break;
            case SummonerLevel.S:
                this._maxHpWithSkills += 5;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                this.spdWithSkills += 2;
                this.atkWithSkills += 2;
                break;
            default:
                break;
        }
    }

    updateStatusByBlessing() {
        this.__syncBlessingEffects();
        this.__updateStatusByBlessing(this.blessing1);
        this.__updateStatusByBlessing(this.blessing2);
        this.__updateStatusByBlessing(this.blessing3);
        this.__updateStatusByBlessing(this.blessing4);
        this.__updateStatusByBlessing(this.blessing5);
    }

    __updateStatusByBlessing(blessing) {
        switch (blessing) {
            case BlessingType.Hp5_Atk3: this._maxHpWithSkills += 5; this.atkWithSkills += 3; break;
            case BlessingType.Hp5_Spd4: this._maxHpWithSkills += 5; this.spdWithSkills += 4; break;
            case BlessingType.Hp5_Def5: this._maxHpWithSkills += 5; this.defWithSkills += 5; break;
            case BlessingType.Hp5_Res5: this._maxHpWithSkills += 5; this.resWithSkills += 5; break;
            case BlessingType.Hp3_Atk2: this._maxHpWithSkills += 3; this.atkWithSkills += 2; break;
            case BlessingType.Hp3_Spd3: this._maxHpWithSkills += 3; this.spdWithSkills += 3; break;
            case BlessingType.Hp3_Def4: this._maxHpWithSkills += 3; this.defWithSkills += 4; break;
            case BlessingType.Hp3_Res4: this._maxHpWithSkills += 3; this.resWithSkills += 4; break;
            case BlessingType.Hp3: this._maxHpWithSkills += 3; break;
            default: break;
        }
    }

    setIvHighStat(value, updatesPureGrowthRate = true) {
        if (this.ivHighStat == value) {
            return;
        }
        this.ivHighStat = value;
        this.updateBaseStatus(updatesPureGrowthRate);
    }
    setIvLowStat(value, updatesPureGrowthRate = true) {
        if (this.ivLowStat == value) {
            return;
        }
        this.ivLowStat = value;
        this.updateBaseStatus(updatesPureGrowthRate);
    }

    updateBaseStatus(updatesPureGrowthRate = true) {
        if (this.heroInfo == null) {
            throw new Error("heroInfo must not be null.");
        }

        var hpLv1IvChange = 0;
        var atkLv1IvChange = 0;
        var spdLv1IvChange = 0;
        var defLv1IvChange = 0;
        var resLv1IvChange = 0;
        switch (this.ivHighStat) {
            case StatusType.None: break;
            case StatusType.Hp: hpLv1IvChange = 1; break;
            case StatusType.Atk: atkLv1IvChange = 1; break;
            case StatusType.Spd: spdLv1IvChange = 1; break;
            case StatusType.Def: defLv1IvChange = 1; break;
            case StatusType.Res: resLv1IvChange = 1; break;
        }

        if (this.merge == 0) {
            switch (this.ivLowStat) {
                case StatusType.None: break;
                case StatusType.Hp: hpLv1IvChange = -1; break;
                case StatusType.Atk: atkLv1IvChange = -1; break;
                case StatusType.Spd: spdLv1IvChange = -1; break;
                case StatusType.Def: defLv1IvChange = -1; break;
                case StatusType.Res: resLv1IvChange = -1; break;
            }
        }

        this.hpLv1 = this.heroInfo.getHpLv1(this.rarity) + hpLv1IvChange;
        this.atkLv1 = this.heroInfo.getAtkLv1(this.rarity) + atkLv1IvChange;
        this.spdLv1 = this.heroInfo.getSpdLv1(this.rarity) + spdLv1IvChange;
        this.defLv1 = this.heroInfo.getDefLv1(this.rarity) + defLv1IvChange;
        this.resLv1 = this.heroInfo.getResLv1(this.rarity) + resLv1IvChange;

        this.__updateGrowth(updatesPureGrowthRate);
    }

    updatePureGrowthRate() {
        this.hpGrowthValue = this.heroInfo.hp - this.heroInfo.hpLv1;
        this.atkGrowthValue = this.heroInfo.atk - this.heroInfo.atkLv1;
        this.spdGrowthValue = this.heroInfo.spd - this.heroInfo.spdLv1;
        this.defGrowthValue = this.heroInfo.def - this.heroInfo.defLv1;
        this.resGrowthValue = this.heroInfo.res - this.heroInfo.resLv1;

        if (this.atkGrowthValue == 0) {
            // ステータス未入力
            this.hpGrowthValue = 35;
            this.atkGrowthValue = 35;
            this.spdGrowthValue = 35;
            this.defGrowthValue = 35;
            this.resGrowthValue = 35;
        }

        this.hpGrowthRate = this.getGrowthRate(this.hpGrowthValue, "hp");
        this.atkGrowthRate = this.getGrowthRate(this.atkGrowthValue, "atk");
        this.spdGrowthRate = this.getGrowthRate(this.spdGrowthValue, "spd");
        this.defGrowthRate = this.getGrowthRate(this.defGrowthValue, "def");
        this.resGrowthRate = this.getGrowthRate(this.resGrowthValue, "res");

        switch (this.ivHighStat) {
            case StatusType.None: break;
            case StatusType.Hp: this.hpGrowthRate += 0.05; break;
            case StatusType.Atk: this.atkGrowthRate += 0.05; break;
            case StatusType.Spd: this.spdGrowthRate += 0.05; break;
            case StatusType.Def: this.defGrowthRate += 0.05; break;
            case StatusType.Res: this.resGrowthRate += 0.05; break;
        }

        if (this.merge == 0) {
            switch (this.ivLowStat) {
                case StatusType.None: break;
                case StatusType.Hp: this.hpGrowthRate -= 0.05; break;
                case StatusType.Atk: this.atkGrowthRate -= 0.05; break;
                case StatusType.Spd: this.spdGrowthRate -= 0.05; break;
                case StatusType.Def: this.defGrowthRate -= 0.05; break;
                case StatusType.Res: this.resGrowthRate -= 0.05; break;
            }
        }
    }

    __updateGrowth(updatesPureGrowthRate = true) {
        if (updatesPureGrowthRate) {
            this.updatePureGrowthRate();
        }

        this.hpAppliedGrowthRate = this.__calcAppliedGrowthRate(this.hpGrowthRate);
        this.atkAppliedGrowthRate = this.__calcAppliedGrowthRate(this.atkGrowthRate);
        this.spdAppliedGrowthRate = this.__calcAppliedGrowthRate(this.spdGrowthRate);
        this.defAppliedGrowthRate = this.__calcAppliedGrowthRate(this.defGrowthRate);
        this.resAppliedGrowthRate = this.__calcAppliedGrowthRate(this.resGrowthRate);

        this.hpLvN = this.hpLv1 + this.__calcGrowthValue(this.hpGrowthRate);
        this.atkLvN = this.atkLv1 + this.__calcGrowthValue(this.atkGrowthRate);
        this.spdLvN = this.spdLv1 + this.__calcGrowthValue(this.spdGrowthRate);
        this.defLvN = this.defLv1 + this.__calcGrowthValue(this.defGrowthRate);
        this.resLvN = this.resLv1 + this.__calcGrowthValue(this.resGrowthRate);
    }

    /// 入力した成長率に対して、得意ステータスの上昇値を取得します。
    calcAssetStatusIncrement(growthRate) {
        return this.__calcGrowthValue(growthRate + 0.05) - this.__calcGrowthValue(growthRate) + 1;
    }

    /// 入力した成長率に対して、不得意ステータスの減少値を取得します。
    calcFlowStatusDecrement(growthRate) {
        return this.__calcGrowthValue(growthRate - 0.05) - this.__calcGrowthValue(growthRate) - 1;
    }

    updateStatusByMergeAndDragonFlower() {
        // todo: 本来はキャラ毎の個体値上昇値を参照
        var hpLv1IvChange = 0;
        var atkLv1IvChange = 0;
        var spdLv1IvChange = 0;
        var defLv1IvChange = 0;
        var resLv1IvChange = 0;
        switch (this.ivHighStat) {
            case StatusType.None: break;
            case StatusType.Hp: hpLv1IvChange = 1; break;
            case StatusType.Atk: atkLv1IvChange = 1; break;
            case StatusType.Spd: spdLv1IvChange = 1; break;
            case StatusType.Def: defLv1IvChange = 1; break;
            case StatusType.Res: resLv1IvChange = 1; break;
        }

        switch (this.ivLowStat) {
            case StatusType.None: break;
            case StatusType.Hp: hpLv1IvChange = -1; break;
            case StatusType.Atk: atkLv1IvChange = -1; break;
            case StatusType.Spd: spdLv1IvChange = -1; break;
            case StatusType.Def: defLv1IvChange = -1; break;
            case StatusType.Res: resLv1IvChange = -1; break;
        }

        // 限界突破によるステータス上昇
        if (this.merge > 0 || this.dragonflower > 0) {
            var statusList = [
                { type: StatusType.Hp, value: this.heroInfo.hpLv1 + hpLv1IvChange },
                { type: StatusType.Atk, value: this.heroInfo.atkLv1 + atkLv1IvChange },
                { type: StatusType.Spd, value: this.heroInfo.spdLv1 + spdLv1IvChange },
                { type: StatusType.Def, value: this.heroInfo.defLv1 + defLv1IvChange },
                { type: StatusType.Res, value: this.heroInfo.resLv1 + resLv1IvChange },
            ];
            statusList.sort((a, b) => {
                return b.value - a.value;
            });
            var updateStatus = (statItr) => {
                var statIndex = statItr % 5;
                switch (statusList[statIndex].type) {
                    case StatusType.Hp: this._maxHpWithSkills += 1; break;
                    case StatusType.Atk: this.atkWithSkills += 1; break;
                    case StatusType.Spd: this.spdWithSkills += 1; break;
                    case StatusType.Def: this.defWithSkills += 1; break;
                    case StatusType.Res: this.resWithSkills += 1; break;
                }
            };

            if (this.merge > 0 && this.ivHighStat == StatusType.None) {
                // 基準値で限界突破済み
                updateStatus(0);
                updateStatus(1);
                updateStatus(2);
            }

            // 限界突破
            for (let mergeItr = 0, statItr = 0; mergeItr < this.merge; ++mergeItr) {
                updateStatus(statItr);
                statItr += 1;
                updateStatus(statItr);
                statItr += 1;
            }

            // 神竜の花
            for (let i = 0; i < this.dragonflower; ++i) {
                updateStatus(i);
            }
        }
    }

    *enumerateSkills() {
        if (this.weapon != null) { yield this.weapon; }
        if (this.support != null) { yield this.support; }
        if (this.special != null) { yield this.special; }
        if (this.passiveA != null) { yield this.passiveA; }
        if (this.passiveB != null) { yield this.passiveB; }
        if (this.passiveC != null) { yield this.passiveC; }
        if (this.passiveS != null) { yield this.passiveS; }
    }

    *enumeratePassiveSkills() {
        if (this.passiveA != null) { yield this.passiveA; }
        if (this.passiveB != null) { yield this.passiveB; }
        if (this.passiveC != null) { yield this.passiveC; }
        if (this.passiveS != null) { yield this.passiveS; }
    }

    hasDagger7Effect() {
        switch (this.weapon) {
            case Weapon.Pesyukado:
            case Weapon.SaizoNoBakuenshin:
                return false;
            default:
                return !this.hasDagger6Effect()
                    && !this.hasDagger5Effect()
                    && !this.hasDagger4Effect()
                    && !this.hasDagger3Effect()
                    && this.weapon != Weapon.PoisonDaggerPlus
                    && this.weapon != Weapon.PoisonDagger
                    && this.weapon != Weapon.DeathlyDagger
                    && isWeaponTypeDagger(this.weaponType);
        }
    }
    hasDagger6Effect() {
        switch (this.weapon) {
            case Weapon.ShienNoAnkiPlus:
            case Weapon.MitteiNoAnki:
                return true;
            default: return false;
        }
    }
    hasDagger5Effect() {
        switch (this.weapon) {
            case Weapon.GinNoAnki:
            case Weapon.RogueDaggerPlus:
            case Weapon.SyukuseiNoAnki:
            case Weapon.YoiyamiNoDanougi:
            case Weapon.RyokuunNoMaiougi:
            case Weapon.SeitenNoMaiougi:
            case Weapon.AnsatsuSyuriken:
            case Weapon.Kagamimochi:
            case Weapon.ButosaiNoSensu:
                return true;
            default: return false;
        }
    }
    hasDagger4Effect() {
        switch (this.weapon) {
            case Weapon.ShienNoAnki:
                return true;
            default: return false;
        }
    }
    hasDagger3Effect() {
        switch (this.weapon) {
            case Weapon.TetsuNoAnki:
            case Weapon.DouNoAnki:
            case Weapon.RogueDagger:
                return true;
            default: return false;
        }
    }

    __hasDuelSkill() {
        if (this.passiveAInfo == null) {
            return false;
        }

        return this.passiveAInfo.name.includes("死闘");
    }

    get totalPureGrowthRate() {
        return Number(this.hpGrowthRate)
            + Number(this.atkGrowthRate)
            + Number(this.spdGrowthRate)
            + Number(this.defGrowthRate)
            + Number(this.resGrowthRate);
    }

    updateArenaScore(majorSeason = SeasonType.None, minorSeason = SeasonType.None) {
        if (this.heroIndex < 0) {
            this.weaponSp = 0;
            this.supportSp = 0;
            this.specialSp = 0;
            this.passiveASp = 0;
            this.passiveBSp = 0;
            this.passiveCSp = 0;
            this.passiveSSp = 0;
            this.totalSp = 0;
            this.arenaScore = this.__calcArenaScore(0, 0, 0, 0);
            return;
        }

        let totalSp = 0;
        let weaponSp = 0;
        if (this.weaponInfo != null) {
            weaponSp = this.weaponInfo.sp;
            if (weaponSp == 300 && this.isWeaponRefined) {
                weaponSp += 50;
            }
            totalSp += weaponSp;
        }
        let specialSp = 0;
        if (this.specialInfo != null) {
            specialSp = this.specialInfo.sp;
            totalSp += this.specialInfo.sp;
        }
        let supportSp = 0;
        if (this.supportInfo != null) {
            supportSp = this.supportInfo.sp;
            totalSp += this.supportInfo.sp;
        }
        let passiveASp = 0;
        if (this.passiveAInfo != null) {
            passiveASp = this.passiveAInfo.sp;
            totalSp += this.passiveAInfo.sp;
        }
        let passiveBSp = 0;
        if (this.passiveBInfo != null) {
            passiveBSp = this.passiveBInfo.sp;
            totalSp += this.passiveBInfo.sp;
        }
        let passiveCSp = 0;
        if (this.passiveCInfo != null) {
            passiveCSp = this.passiveCInfo.sp;
            totalSp += this.passiveCInfo.sp;
        }
        let passiveSSp = 0;
        if (this.passiveSInfo != null) {
            passiveSSp = this.passiveSInfo.sp;
            totalSp += this.passiveSInfo.sp;
        }

        let rating = this.heroInfo.getStatusTotalOfLv40();

        this.weaponSp = weaponSp;
        this.supportSp = supportSp;
        this.specialSp = specialSp;
        this.passiveASp = passiveASp;
        this.passiveBSp = passiveBSp;
        this.passiveCSp = passiveCSp;
        this.passiveSSp = passiveSSp;

        if (rating < this.heroInfo.duelScore) {
            rating = this.heroInfo.duelScore;
        }
        if (rating < 170 && this.__hasDuelSkill()) {
            rating = 170;
        }

        this.totalSp = totalSp;

        let merge = Number(this.merge);
        if (majorSeason != SeasonType.None && this.providableBlessingSeason == majorSeason) {
            merge += 10;
        }
        else if (minorSeason != SeasonType.None && this.providableBlessingSeason == minorSeason) {
            merge += 5;
        }

        let score = this.__calcArenaScore(rating, totalSp, merge, 5);
        this.arenaScore = score;
    }

    __calcArenaScore(rating, totalSp, rebirthCount, rarity = 5) {
        let base = 150;
        let rarityBase = rarity * 2 + 45;
        let levelScore = 0;
        switch (rarity) {
            case 5:
                levelScore = Math.floor(this.level * 2.33);
                break;
            case 4:
                levelScore = Math.floor(this.level * 2.15);
                break;
            case 3:
                levelScore = Math.floor(this.level * 2.03);
                break;
            case 2:
                levelScore = Math.floor(this.level * 1.87);
                break;
            case 1:
                levelScore = Math.floor(this.level * 1.74);
                break;
        }
        this.rarityScore = rarityBase;
        this.levelScore = levelScore;

        let baseStatusTotal = rating;
        if (rebirthCount >= 1) {
            baseStatusTotal += 3;
        }
        this.rating = baseStatusTotal;
        return base + levelScore + rarityBase + Math.floor(baseStatusTotal / 5) + Math.floor((totalSp) / 100) + (rebirthCount * 2);
    }

    initializeSkillsToDefault() {
        let heroInfo = this.heroInfo;
        this.weapon = heroInfo.weapon;
        this.weaponRefinement = WeaponRefinementType.None;
        this.support = heroInfo.support;
        this.special = heroInfo.special;
        this.passiveA = heroInfo.passiveA;
        this.passiveB = heroInfo.passiveB;
        this.passiveC = heroInfo.passiveC;
        // this.passiveS = PassiveS.None;
    }

    hasMovementAssist() {
        if (this.supportInfo == null) {
            return false;
        }

        return this.supportInfo.assistType == AssistType.Move;
    }

    setGrantedBlessingIfPossible(value) {
        if (this.providableBlessingSeason != SeasonType.None) {
            this.grantedBlessing = value;
        }
    }

    get detailPageUrl() {
        if (this.heroInfo == null) {
            return "";
        }
        return this.heroInfo.detailPageUrl;
    }

    /// データベースの英雄情報からユニットを初期化します。
    initByHeroInfo(heroInfo) {
        let isHeroInfoChanged = this.heroInf != heroInfo;
        if (!isHeroInfoChanged) {
            return;
        }

        this.heroInfo = heroInfo;
        this.providableBlessingSeason = heroInfo.seasonType;
        if (this.providableBlessingSeason != SeasonType.None) {
            this.grantedBlessing = SeasonType.None;
        }

        this.name = heroInfo.name;

        this.weaponType = stringToWeaponType(heroInfo.weaponType);
        this.attackRange = heroInfo.attackRange;
        this.moveType = heroInfo.moveType;
        this.maxHp = heroInfo.hp;
        this.atk = heroInfo.atk;
        this.spd = heroInfo.spd;
        this.def = heroInfo.def;
        this.res = heroInfo.res;
        if (heroInfo.atk == 0) {
            // まだDBにステータスが定義されていないので適当に割り当て
            if (heroInfo.hp == 0) {
                this.maxHp = 40;
            }
            this.atk = 40;
            this.spd = 40;
            this.def = 30;
            this.res = 30;
        }

        this.hpLv1 = heroInfo.hpLv1;
        this.atkLv1 = heroInfo.atkLv1;
        this.spdLv1 = heroInfo.spdLv1;
        this.defLv1 = heroInfo.defLv1;
        this.resLv1 = heroInfo.resLv1;
        this.hpIncrement = heroInfo.hpIncrement;
        this.atkIncrement = heroInfo.atkIncrement;
        this.spdIncrement = heroInfo.spdIncrement;
        this.defIncrement = heroInfo.defIncrement;
        this.resIncrement = heroInfo.resIncrement;
        this.hpDecrement = heroInfo.hpDecrement;
        this.atkDecrement = heroInfo.atkDecrement;
        this.spdDecrement = heroInfo.spdDecrement;
        this.defDecrement = heroInfo.defDecrement;
        this.resDecrement = heroInfo.resDecrement;

        // this.updatePureGrowthRate();
    }

    updateStatusByWeapon() {
        if (this.weapon != Weapon.None) {
            let weaponInfo = this.weaponInfo;
            if (weaponInfo != null) {
                if (this.weaponRefinement != WeaponRefinementType.None) {
                    this.atkWithSkills += weaponInfo.mightRefine;
                } else {
                    this.atkWithSkills += weaponInfo.might;
                }
                this.atkWithSkills += weaponInfo.atk;
                this.spdWithSkills += weaponInfo.spd;
                this.defWithSkills += weaponInfo.def;
                this.resWithSkills += weaponInfo.res;
            }

            switch (this.weapon) {
                case Weapon.MasyouNoYari:
                    if (this.isWeaponRefined) {
                        // 武器錬成なしの時に攻速は+2されてる
                        this.atkWithSkills += 1;
                        this.spdWithSkills += 1;
                        this.defWithSkills += 3;
                        this.resWithSkills += 3;
                    }
                    break;
            }
        }
    }

    resetMaxSpecialCount() {
        if (this.special == Special.None) {
            this.maxSpecialCount = 0;
            this.specialCount = 0;
            return;
        }

        if (this.specialInfo == null) {
            console.error("special ID " + this.special + " was not found.");
            return;
        }

        let specialCountMax = this.specialInfo.specialCount;
        if (this.weaponInfo != null) {
            specialCountMax += this.weaponInfo.cooldownCount;
        }

        this.maxSpecialCount = specialCountMax;
        if (this.specialCount > this.maxSpecialCount) {
            this.specialCount = this.maxSpecialCount;
        }
    }

    /// テレポート系スキルを所持していたり、状態が付与されていて、テレポートが可能な状態かどうかを判定します。
    canTeleport() {
        if (this.hasStatusEffect(StatusEffectType.AirOrders)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (isTeleportationSkill(skillId)) {
                return true;
            }
        }
        return false;
    }

    __canExecuteHarshCommand(targetUnit) {
        if (!targetUnit.isDebuffed) {
            return false;
        }
        if (targetUnit.atkDebuff < 0 && -targetUnit.atkDebuff > (targetUnit.atkBuff)) { return true; }
        if (targetUnit.spdDebuff < 0 && -targetUnit.spdDebuff > (targetUnit.spdBuff)) { return true; }
        if (targetUnit.defDebuff < 0 && -targetUnit.defDebuff > (targetUnit.defBuff)) { return true; }
        if (targetUnit.resDebuff < 0 && -targetUnit.resDebuff > (targetUnit.resBuff)) { return true; }
        return false;
    }

    /// 応援や一喝を実行可能かどうかを返します。
    canRallyTo(targetUnit, buffAmountThreshold) {
        let assistUnit = this;
        switch (assistUnit.support) {
            case Support.HarshCommandPlus:
                if (targetUnit.hasNegativeStatusEffect()) {
                    return true;
                }
                return this.__canExecuteHarshCommand(targetUnit);
            case Support.HarshCommand:
                return this.__canExecuteHarshCommand(targetUnit);
            default:
                if ((getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff) >= buffAmountThreshold) { return true; }
                if ((getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff) >= buffAmountThreshold) { return true; }
                if ((getDefBuffAmount(assistUnit.support) - targetUnit.defBuff) >= buffAmountThreshold) { return true; }
                if ((getResBuffAmount(assistUnit.support) - targetUnit.resBuff) >= buffAmountThreshold) { return true; }
                return false;
        }
    }

    /// 実際に補助可能なユニットとタイルを列挙します。
    *enumerateActuallyAssistableUnitAndTiles() {
        for (let unit of this.enumerateAssistableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist == this.assistRange) {
                    yield [unit, tile];
                }
            }
        }
    }

    /// 実際に破壊可能な配置物とタイルを列挙します。
    *enumerateActuallyBreakableStructureAndTiles() {
        for (let structure of this.enumerateBreakableStructures()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistance(structure.placedTile);
                if (dist == this.attackRange) {
                    yield [structure, tile];
                }
            }
        }
    }

    /// 実際に攻撃可能なユニットとタイルを列挙します。
    *enumerateActuallyAttackableUnitAndTiles() {
        for (let unit of this.enumerateAttackableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist == this.attackRange) {
                    yield [unit, tile];
                }
            }
        }
    }

    /// 補助可能なユニットを列挙します。
    *enumerateAssistableUnits() {
        for (let tile of this.assistableTiles) {
            let unit = tile.placedUnit;
            if (unit === this) continue;
            if (unit != null && unit.groupId == this.groupId) {
                if (unit.hasStatusEffect(StatusEffectType.Isolation)) {
                    continue;
                }

                yield unit;
            }
        }
    }

    /// 攻撃可能なユニットを列挙します。
    *enumerateAttackableUnits() {
        for (let tile of this.attackableTiles) {
            if (tile.placedUnit != null && tile.placedUnit.groupId != this.groupId) {
                yield tile.placedUnit;
            }
        }
    }

    /// 攻撃可能な壊せる壁や施設を列挙します。
    *enumerateBreakableStructures() {
        for (let tile of this.attackableTiles) {
            if (tile.obj != null && this.canBreak(tile.obj)) {
                yield tile.obj;
            }
        }
    }

    /// 移動可能なマスを列挙します。
    *enumerateMovableTiles(ignoresTileUnitPlaced = true) {
        for (let tile of this.movableTiles) {
            if (ignoresTileUnitPlaced || (tile.placedUnit == null || tile.placedUnit == this)) {
                yield tile;
            }
        }
    }

    /// ユニットが破壊可能な配置物であるかどうかを判定します。
    canBreak(structure) {
        return structure instanceof BreakableWall
            || (structure.isBreakable
                && (
                    (this.groupId == UnitGroupType.Ally && structure instanceof DefenceStructureBase)
                    || (this.groupId == UnitGroupType.Enemy && structure instanceof OffenceStructureBase)
                ));
    }

    /// 補助スキルの射程です。
    get assistRange() {
        return getAssistRange(this.support);
    }

    /// 補助スキルを所持していればtrue、そうでなければfalseを返します。
    get hasSupport() {
        return this.support != Support.None;
    }
}

/// ユニットが待ち伏せや攻め立てなどの攻撃順変更効果を無効化できるかどうかを判定します。
function canDisableAttackOrderSwapSkill(unit, restHpPercentage) {
    for (let skillId of unit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.StudiedForblaze:
                if (restHpPercentage >= 25) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing1:
                if (restHpPercentage == 100) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing2:
                if (restHpPercentage >= 50) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing3:
            case Weapon.DawnSuzu:
            case Weapon.YoiyamiNoDanougi:
            case Weapon.YoiyamiNoDanougiPlus:
            case Weapon.SeitenNoMaiougi:
            case Weapon.SeitenNoMaiougiPlus:
            case Weapon.RyokuunNoMaiougi:
            case Weapon.RyokuunNoMaiougiPlus:
            case Weapon.RyusatsuNoAnkiPlus:
            case Weapon.CaltropDaggerPlus:
                return true;
        }
    }
    return false;
}

function calcBuffAmount(assistUnit, targetUnit) {
    let totalBuffAmount = 0;
    switch (assistUnit.support) {
        case Support.HarshCommand:
            {
                if (!targetUnit.hasPanic) {
                    totalBuffAmount += targetUnit.atkDebuff;
                    totalBuffAmount += targetUnit.spdDebuff;
                    totalBuffAmount += targetUnit.defDebuff;
                    totalBuffAmount += targetUnit.resDebuff;
                }
            }
            break;
        case Support.HarshCommandPlus:
            {
                totalBuffAmount += targetUnit.atkDebuff;
                totalBuffAmount += targetUnit.spdDebuff;
                totalBuffAmount += targetUnit.defDebuff;
                totalBuffAmount += targetUnit.resDebuff;
            }
            break;
        default:
            {
                let buffAmount = getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
                buffAmount = getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
                buffAmount = getDefBuffAmount(assistUnit.support) - targetUnit.defBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
                buffAmount = getResBuffAmount(assistUnit.support) - targetUnit.resBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
            }
            break;
    }
    return totalBuffAmount;
}

/// @brief 回復補助の回復量を取得します。
/// @param {Unit} assistUnit 補助者のユニット
/// @param {Unit} targetUnit 補助対象のユニット
function calcHealAmount(assistUnit, targetUnit) {
    let healAmount = 0;
    switch (assistUnit.support) {
        case Support.Heal:
            healAmount = 5;
            break;
        case Support.Reconcile:
            healAmount = 7;
            break;
        case Support.Physic:
            healAmount = 8;
            break;
        case Support.Mend:
            healAmount = 10;
            break;
        case Support.Recover:
            healAmount = 15;
            break;
        case Support.Martyr:
            healAmount = assistUnit.currentDamage + 7;
            break;
        case Support.MartyrPlus:
            healAmount = assistUnit.currentDamage + Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 7) { healAmount += 7; }
            break;
        case Support.Rehabilitate:
            {
                let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
                if (targetUnit.hp <= halfHp) {
                    healAmount += (halfHp - targetUnit.hp) * 2;
                }
                healAmount += 7;
            }
            break;
        case Support.RehabilitatePlus:
            {
                healAmount += Math.floor(assistUnit.getAtkInPrecombat() * 0.5) - 10;
                if (healAmount < 7) { healAmount = 7; }

                let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
                if (targetUnit.hp <= halfHp) {
                    healAmount += (halfHp - targetUnit.hp) * 2;
                }
                healAmount += 7;
            }
            break;
        case Support.PhysicPlus:
        case Support.RestorePlus:
        case Support.RescuePlus:
        case Support.ReturnPlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 8) { healAmount = 8; }
            break;
        case Support.Restore:
        case Support.Rescue:
        case Support.Return:
            healAmount = 8;
            break;
        case Support.RecoverPlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5) + 10;
            if (healAmount < 15) { healAmount = 15; }
            break;
        default:
            return 0;
    }
    if (targetUnit.currentDamage < healAmount) {
        return targetUnit.currentDamage;
    }
    return healAmount;
}

/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier1(attackUnit, targetUnit) {
    return attackUnit.weapon == Weapon.Hlidskjalf;
}

/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier2(attackUnit, targetUnit) {
    for (let skillId of attackUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.RogueDagger:
            case Weapon.RogueDaggerPlus:
                if (attackUnit.weaponRefinement == WeaponRefinementType.None) {
                    return true;
                }
                break;
            case Weapon.PoisonDagger:
            case Weapon.PoisonDaggerPlus:
                if (targetUnit.moveType == MoveType.Infantry) {
                    return true;
                }
                break;
            case Weapon.KittyPaddle:
            case Weapon.KittyPaddlePlus:
                if (isWeaponTypeTome(targetUnit.weapon)) {
                    return true;
                }
                break;
            case PassiveB.SealDef3:
            case PassiveB.SealRes3:
            case PassiveB.SealAtkDef2:
            case PassiveB.SealAtkRes2:
            case PassiveB.SealDefRes2:
            case PassiveB.SealSpdDef2:
                return true;
        }
    }
    return false;
}

/// ユニットがアフリクターであるかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartH
function isAfflictor(attackUnit, lossesInCombat) {
    for (let skillId of attackUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.Pain:
            case Weapon.PainPlus:
            case Weapon.Panic:
            case Weapon.PanicPlus:
            case Weapon.FlashPlus:
            // case Weapon.Candlelight:
            // case Weapon.CandlelightPlus:
            case Weapon.LegionsAxe:
            case Weapon.LegionsAxePlus:
            case Weapon.MonstrousBow:
            case Weapon.MonstrousBowPlus:
            case Weapon.DeathlyDagger:
                return true;
            case PassiveC.PanicSmoke3:
            case PassiveB.PoisonStrike3:
                if (lossesInCombat) {
                    return false;
                }
                return true;
            case Weapon.GhostNoMadosyoPlus:
                if (attackUnit.isWeaponRefined) {
                    return true;
                }
                return false;
        }
    }
    return false;
}

function canRefereshTo(targetUnit) {
    return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
}
