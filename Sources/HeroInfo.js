/**
 * @file
 * @brief HeroInfo クラスやそれに関連する関数や変数定義です。
 */

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

const IvType = {
    None: 0,
    Asset: 1, // 得意
    Flow: 2, // 不得意
}

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

/// ☆5の成長量から純粋成長率を計算します。
function getGrowthRateOfStar5(growthAmount) {
    let growthRate = GrowthRateOfStar5[growthAmount];
    if (growthRate) {
        return growthRate;
    }

    throw new Error("Invalid growth amount " + growthAmount);
}

function calcAppliedGrowthRate(growthRate, rarity) {
    // let rate = growthRate * (0.79 + (0.07 * this.rarity));
    let rate = Math.floor(100 * growthRate * (0.79 + (0.07 * rarity))) * 0.01;
    return rate;
}

const AppliedGrowthRateCoef = {};
AppliedGrowthRateCoef[5] = (0.79 + (0.07 * 5)) * 100;
AppliedGrowthRateCoef[4] = (0.79 + (0.07 * 4)) * 100;
AppliedGrowthRateCoef[3] = (0.79 + (0.07 * 3)) * 100;
AppliedGrowthRateCoef[2] = (0.79 + (0.07 * 2)) * 100;
AppliedGrowthRateCoef[1] = (0.79 + (0.07 * 1)) * 100;
function calcAppliedGrowthRate_Optimized(growthRate, rarity) {
    // let rate = growthRate * (0.79 + (0.07 * this.rarity));
    let rate = Math.floor(growthRate * AppliedGrowthRateCoef[rarity]) * 0.01;
    return rate;
}


function calcGrowthValue(growthRate, rarity, level) {
    let rate = calcAppliedGrowthRate(growthRate, rarity);
    return Math.floor((level - 1) * rate);
}

const StatusRankTable = [];
StatusRankTable[StatusType.Hp] = 4;
StatusRankTable[StatusType.Atk] = 3;
StatusRankTable[StatusType.Spd] = 2;
StatusRankTable[StatusType.Def] = 1;
StatusRankTable[StatusType.Res] = 0;

/// 値が同じ場合の優先度を取得します。
function __getStatusRankValue(statusType) {
    return StatusRankTable[statusType];
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
        pureNames,
        duelScore,
        weapons,
        supports,
        id,
        resplendent,
        origin,
        howToGet,
        releaseDate,
        specials,
        passiveAs,
        passiveBs,
        passiveCs
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
        this.pureNames = pureNames;
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
        this.specials = specials;
        this.passiveAs = passiveAs;
        this.passiveBs = passiveBs;
        this.passiveCs = passiveCs;
        this.isResplendent = resplendent;
        this.origin = origin;
        this.howToGet = howToGet;
        this.releaseDate = releaseDate;
        this.releaseDateAsNumber = Number(releaseDate.replace(/-/g, ""));

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
        return "https://puarts.com/blog/images/FehHeroThumbs/" + this.icon;
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
        if (releaseDate > 20210816) {
            return 5;
        }

        if (releaseDate > 20200817) {
            return 10;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
                if (releaseDate < 20190101) {
                    // リリース日で二分探索したところ、獣登場の2019年が境界だった
                    return 20;
                }
                else {
                    return 15;
                }
            case MoveType.Flying:
            case MoveType.Armor:
            case MoveType.Cavalry:
            default:
                return 15;
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
            case UnitRarity.Star5: return this.hpLv1;
            case UnitRarity.Star4: return this.hpLv1ForStar4;
            case UnitRarity.Star3: return this.hpLv1ForStar3;
            case UnitRarity.Star2: return this.hpLv1ForStar2;
            case UnitRarity.Star1: return this.hpLv1ForStar1;
        }
    }
    getAtkLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5: return this.atkLv1;
            case UnitRarity.Star4: return this.atkLv1ForStar4;
            case UnitRarity.Star3: return this.atkLv1ForStar3;
            case UnitRarity.Star2: return this.atkLv1ForStar2;
            case UnitRarity.Star1: return this.atkLv1ForStar1;
        }
    }
    getSpdLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5: return this.spdLv1;
            case UnitRarity.Star4: return this.spdLv1ForStar4;
            case UnitRarity.Star3: return this.spdLv1ForStar3;
            case UnitRarity.Star2: return this.spdLv1ForStar2;
            case UnitRarity.Star1: return this.spdLv1ForStar1;
        }
    }
    getDefLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5: return this.defLv1;
            case UnitRarity.Star4: return this.defLv1ForStar4;
            case UnitRarity.Star3: return this.defLv1ForStar3;
            case UnitRarity.Star2: return this.defLv1ForStar2;
            case UnitRarity.Star1: return this.defLv1ForStar1;
        }
    }
    getResLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5: return this.resLv1;
            case UnitRarity.Star4: return this.resLv1ForStar4;
            case UnitRarity.Star3: return this.resLv1ForStar3;
            case UnitRarity.Star2: return this.resLv1ForStar2;
            case UnitRarity.Star1: return this.resLv1ForStar1;
        }
    }

    /**
     * @param  {SkillInfo} skillInfo
     */
    canEquipSkill(skillInfo) {
        if (!skillInfo.canInherit) {
            switch (skillInfo.type) {
                case SkillType.Weapon:
                    return this.weapons.includes(skillInfo.id);
                case SkillType.Support:
                    return this.supports.includes(skillInfo.id);
                case SkillType.Special:
                    return this.specials.includes(skillInfo.id);
                case SkillType.PassiveA:
                    return this.passiveAs.includes(skillInfo.id);
                case SkillType.PassiveB:
                    return this.passiveBs.includes(skillInfo.id);
                case SkillType.PassiveC:
                    return this.passiveCs.includes(skillInfo.id);
            }
        }

        if (skillInfo.type === SkillType.Weapon) {
            return this.weaponType == weaponTypeToString(skillInfo.weaponType)
                || (this.weaponType.includes("暗器") > 0 && isWeaponTypeDagger(skillInfo.weaponType))
                || (this.weaponType.includes("弓") > 0 && isWeaponTypeBow(skillInfo.weaponType))
                || (this.weaponType.includes("竜") > 0 && isWeaponTypeBreath(skillInfo.weaponType))
                || (this.weaponType.includes("獣") > 0 && isWeaponTypeBeast(skillInfo.weaponType));
        }

        return isInheritableWeaponType(this.weaponTypeValue, skillInfo.inheritableWeaponTypes)
            && skillInfo.inheritableMoveTypes.includes(this.moveType);
    }

    /**
     * @param  {SkillInfo[]} infos
     */
    registerWeaponOptions(infos) {
        this.__registerInheritableSkills(this.weaponOptions, [infos], x => this.canEquipSkill(x));
    }

    /**
     * @param  {SkillInfo[]} infos
     */
    registerSupportOptions(infos) {
        this.__registerInheritableSkills(this.supportOptions, [infos], x => this.canEquipSkill(x));
    }
    /**
     * @param  {SkillInfo[]} infos
     */
    registerSpecialOptions(infos) {
        this.__registerInheritableSkills(this.specialOptions, [infos], x => this.canEquipSkill(x));
    }
    /**
     * @param  {SkillInfo[]} infos
     */
    registerPassiveAOptions(infos) {
        this.__registerInheritableSkills(this.passiveAOptions, [infos], x => this.canEquipSkill(x));
    }
    /**
     * @param  {SkillInfo[]} infos
     */
    registerPassiveBOptions(infos) {
        this.__registerInheritableSkills(this.passiveBOptions, [infos], x => this.canEquipSkill(x));
    }
    /**
     * @param  {SkillInfo[]} infos
     */
    registerPassiveCOptions(infos) {
        this.__registerInheritableSkills(this.passiveCOptions, [infos], x => this.canEquipSkill(x));
    }

    /**
     * @param  {SkillInfo[]} infos
     */
    registerPassiveSOptions(passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos) {
        this.__registerInheritableSkills(this.passiveSOptions,
            [passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos],
            x => (x.isSacredSealAvailable || x.type == SkillType.PassiveS) && this.canEquipSkill(x));
    }

    /**
     * @param  {Object[]} options
     * @param  {SkillInfo[][]} allInfos
     */
    __registerInheritableSkills(options, allInfos, canInheritFunc) {
        options.push(NoneOption);
        for (let infos of allInfos) {
            for (let info of infos) {
                if (canInheritFunc(info)) {
                    options.push({ id: info.id, text: info.getDisplayName() });
                }
            }
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

        let statusList = [
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
