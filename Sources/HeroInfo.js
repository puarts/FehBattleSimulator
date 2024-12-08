/**
 * @file
 * @brief HeroInfo クラスやそれに関連する関数や変数定義です。
 */

/// 英雄情報です。ユニットの初期化に使用します。
class HeroInfo {
    constructor(name, icon, moveType, weaponType, attackRange,
        hp, atk, spd, def, res,
        hpLv1, atkLv1, spdLv1, defLv1, resLv1,
        hpVar, atkVar, spdVar, defVar, resVar,
        weapon, support, special, passiveA, passiveB, passiveC, passiveX,
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
        passiveCs,
        passiveXs = [],
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
        this.passiveX = passiveX;
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
        this.passiveXOptions = [];
        this.weapons = weapons;
        this.supports = supports;
        this.specials = specials;
        this.passiveAs = passiveAs;
        this.passiveBs = passiveBs;
        this.passiveCs = passiveCs;
        this.passiveXs = passiveXs;
        this.isResplendent = resplendent;
        this.origin = origin;
        this.origins = origin?.split("|").filter(x => x !== '') ?? [];
        this.howToGet = howToGet;
        // noinspection JSUnusedGlobalSymbols
        this.releaseDate = releaseDate;
        this.releaseDateAsNumber = Number(releaseDate.replace(/-/g, ""));

        // 偶像スキルシミュレーター用
        // noinspection JSUnusedGlobalSymbols
        this.weaponOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.supportOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.specialOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.passiveAOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.passiveBOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.passiveCOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.passiveSOptionsForHallOfForms = [];
        // noinspection JSUnusedGlobalSymbols
        this.passiveXOptionsForHallOfForms = [];

        this.__updateLv1Statuses();

        this.bookVersion = this.__getBookVersion();
        BookVersions[this.bookVersion] = null;

        this.hpGrowthValue = this.hp - this.hpLv1;
        this.atkGrowthValue = this.atk - this.atkLv1;
        this.spdGrowthValue = this.spd - this.spdLv1;
        this.defGrowthValue = this.def - this.defLv1;
        this.resGrowthValue = this.res - this.resLv1;

        if (this.atkGrowthValue === 0) {
            // ステータス未入力
            this.hpGrowthValue = 35;
            this.atkGrowthValue = 35;
            this.spdGrowthValue = 35;
            this.defGrowthValue = 35;
            this.resGrowthValue = 35;
        }

        this.hpGrowthRate = this.getPureGrowthRate(this.hpGrowthValue, "hp");
        this.atkGrowthRate = this.getPureGrowthRate(this.atkGrowthValue, "atk");
        this.spdGrowthRate = this.getPureGrowthRate(this.spdGrowthValue, "spd");
        this.defGrowthRate = this.getPureGrowthRate(this.defGrowthValue, "def");
        this.resGrowthRate = this.getPureGrowthRate(this.resGrowthValue, "res");
    }

    /**
     * ダブル後衛ユニットを設定可能かどうか
     * @returns {Boolean}
     */
    get canHavePairUpUnit() {
        // 伝承ロイ以降の伝承英雄
        return isLegendarySeason(this.seasonType) && this.releaseDateAsNumber >= 20190227;
    }

    get totalStatus() {
        return this.hp + this.atk + this.spd + this.def + this.res;
    }

    // noinspection JSUnusedGlobalSymbols
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

    // noinspection JSUnusedGlobalSymbols
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

    // noinspection JSUnusedGlobalSymbols
    hasSkillInInitialSkill(skillId) {
        for (let id of this.weapons) {
            if (String(id) === String(skillId)) {
                return true;
            }
        }
        for (let id of this.supports) {
            if (String(id) === String(skillId)) {
                return true;
            }
        }
        return this.special === skillId
            || this.passiveA === skillId
            || this.passiveB === skillId
            || this.passiveC === skillId
            || this.passiveX === skillId;
    }

    get detailPageUrl() {
        return g_siteRootPath + "?fehhero=" + this.id;
    }

    get iconUrl() {
        return g_heroIconRootPath + this.icon;
    }

    getIconImgTagWithAnchor(size) {
        return `<a href='${this.detailPageUrl}' title='${this.name}' target='_blank'><img id='${this.id}' src='${this.iconUrl}' width='${size}px' alt='${this.name} ' /></a>`;
    }

    /**
     * @returns {string}
     */
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

    get maxDragonflower() {
        let releaseDate = this.releaseDateAsNumber;
        let i = 1;
        for (let year = 2024; year >= 2020; --year) {
            let date = year * 10000 + 812; // 8/12に総選挙がリリースされたことはないので12固定にしておく
            if (releaseDate > date) {
                return 5 * i;
            }

            ++i;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
                if (releaseDate < 20190220) {
                    // 第2世代と第3世代が境界
                    return 5 * (i + 1);
                } else {
                    return 5 * i;
                }
            case MoveType.Flying:
            case MoveType.Armor:
            case MoveType.Cavalry:
            default:
                return 5 * i;
        }
    }

    getPureGrowthRate(growthAmountOfStar5, statusName) {
        try {
            return getGrowthRateOfStar5(growthAmountOfStar5);
        } catch (e) {
            console.error(`${this.name} ${statusName}: ` + e.message, e.name);

            // ステータスが判明してないキャラの実装時にテストしやすいよう適当な値を返しておく
            return 0.8;
        }
    }

    getHpGrowthRate() {
        return getGrowthRateOfStar5(this.hpGrowthValue);
    }

    // noinspection JSUnusedGlobalSymbols
    calcHpOfSpecifiedLevel(level, rarity = 5, ivType = IvType.None) {
        let growthRate = this.getHpGrowthRate();
        switch (ivType) {
            case IvType.Asset:
                growthRate += 0.05;
                break;
            case IvType.Flaw:
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
            case UnitRarity.Star5:
                return this.hpLv1;
            case UnitRarity.Star4:
                return this.hpLv1ForStar4;
            case UnitRarity.Star3:
                return this.hpLv1ForStar3;
            case UnitRarity.Star2:
                return this.hpLv1ForStar2;
            case UnitRarity.Star1:
                return this.hpLv1ForStar1;
        }
    }

    getAtkLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5:
                return this.atkLv1;
            case UnitRarity.Star4:
                return this.atkLv1ForStar4;
            case UnitRarity.Star3:
                return this.atkLv1ForStar3;
            case UnitRarity.Star2:
                return this.atkLv1ForStar2;
            case UnitRarity.Star1:
                return this.atkLv1ForStar1;
        }
    }

    getSpdLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5:
                return this.spdLv1;
            case UnitRarity.Star4:
                return this.spdLv1ForStar4;
            case UnitRarity.Star3:
                return this.spdLv1ForStar3;
            case UnitRarity.Star2:
                return this.spdLv1ForStar2;
            case UnitRarity.Star1:
                return this.spdLv1ForStar1;
        }
    }

    getDefLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5:
                return this.defLv1;
            case UnitRarity.Star4:
                return this.defLv1ForStar4;
            case UnitRarity.Star3:
                return this.defLv1ForStar3;
            case UnitRarity.Star2:
                return this.defLv1ForStar2;
            case UnitRarity.Star1:
                return this.defLv1ForStar1;
        }
    }

    getResLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star5:
                return this.resLv1;
            case UnitRarity.Star4:
                return this.resLv1ForStar4;
            case UnitRarity.Star3:
                return this.resLv1ForStar3;
            case UnitRarity.Star2:
                return this.resLv1ForStar2;
            case UnitRarity.Star1:
                return this.resLv1ForStar1;
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
                case SkillType.PassiveX:
                    return this.passiveXs.includes(skillInfo.id);
            }
        }

        if (skillInfo.type === SkillType.Weapon) {
            return this.weaponType === weaponTypeToString(skillInfo.weaponType)
                || (this.weaponType.includes("暗器") > 0 && isWeaponTypeDagger(skillInfo.weaponType))
                || (this.weaponType.includes("弓") > 0 && isWeaponTypeBow(skillInfo.weaponType))
                || (this.weaponType.includes("竜") > 0 && isWeaponTypeBreath(skillInfo.weaponType))
                || (this.weaponType.includes("獣") > 0 && isWeaponTypeBeast(skillInfo.weaponType));
        }

        return isInheritableWeaponType(this.weaponTypeValue, skillInfo.inheritableWeaponTypes)
            && skillInfo.inheritableMoveTypes.includes(this.moveType);
    }

    isSkillOptionRegistered() {
        return this.weaponOptions.length > 0
            && this.supportOptions.length > 0
            && this.specialOptions.length > 0
            && this.passiveAOptions.length > 0
            && this.passiveBOptions.length > 0
            && this.passiveCOptions.length > 0
            && this.passiveSOptions.length > 0
            && this.passiveXOptions.length > 0
            ;
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
     * @param passiveAInfos
     * @param passiveBInfos
     * @param passiveCInfos
     * @param passiveSInfos
     */
    registerPassiveSOptions(passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos) {
        this.__registerInheritableSkills(this.passiveSOptions,
            [passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos],
            x => (x.isSacredSealAvailable || x.type === SkillType.PassiveS) && this.canEquipSkill(x));
    }

    registerPassiveXOptions(infos) {
        this.__registerInheritableSkills(this.passiveXOptions, [infos], x => this.canEquipSkill(x));
    }

    /**
     * @param  {Object[]} options
     * @param  {SkillInfo[][]} allInfos
     * @param canInheritFunc
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

    __getBookVersion() {
        if (this.epithet === "" || this.name.includes('敵')) {
            return -1;
        }

        let release_date = this.releaseDateAsNumber;
        if (release_date < 20171128) return 1;
        if (release_date < 20181211) return 2;
        if (release_date < 20191205) return 3;
        if (release_date < 20201208) return 4;
        if (release_date < 20211206) return 5;
        if (release_date < 20221201) return 6;
        if (release_date < 20231201) return 7;
        if (release_date < 20241201) return 8;
        if (release_date < 20251201) return 9;
        if (release_date < 20261201) return 10;
        if (release_date < 20271201) return 11;
        if (release_date < 20281201) return 12;
        if (release_date < 20291201) return 13;
        if (release_date < 20301201) return 14;
        if (release_date < 20311201) return 15;
        if (release_date < 20321201) return 16;
        if (release_date < 20331201) return 17;
        if (release_date < 20341201) return 18;
        if (release_date < 20351201) return 19;
        if (release_date < 20361201) return 20;
        if (release_date < 20371201) return 21;
        if (release_date < 20381201) return 22;
        if (release_date < 20391201) return 23;
        if (release_date < 20401201) return 24;
        if (release_date < 20411201) return 25;
        if (release_date < 20421201) return 26;
        if (release_date < 20431201) return 27;
        if (release_date < 20441201) return 28;
        if (release_date < 20451201) return 29;
        if (release_date < 20461201) return 30;
        if (release_date < 20471201) return 31;
        if (release_date < 20481201) return 32;
        if (release_date < 20491201) return 33;
        if (release_date < 20501201) return 34;
        return -1;
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
        let higherStatuses = [statusList[0], statusList[1]];

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
        for (let status of higherStatuses) {
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
