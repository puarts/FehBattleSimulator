/// @file
/// @brief DamageCalculator.html の実装に必要なクラスや関数等の定義です。

const DamageCalculatorMode = {
    Simple: 0,
    SpecialDamageGraph: 1,
    RoundRobin: 2,
};

const DamageCalcModeOptions = [
    { label: "与ダメージ計算", value: DamageCalculatorMode.Simple },
    { label: "奥義ダメージグラフ", value: DamageCalculatorMode.SpecialDamageGraph },
    { label: "総当たり", value: DamageCalculatorMode.RoundRobin },
];

const RoundRobinCombatMode = {
    Offense: 0,
    Defense: 1,
};

const RoundRobinCombatModeOptions = [
    { label: "殲滅力", value: RoundRobinCombatMode.Offense },
    { label: "耐久力", value: RoundRobinCombatMode.Defense },
];

const SpecialDamageGraphMode = {
    AllInheritableSpecials: 0,
    AllSpecials: 1,
    Count2Specials: 2,
    Count3Specials: 3,
    Count4Specials: 4,
};

const SpecialDamageGraphModeOptions = [
    { label: "全ての継承可能な奥義", value: SpecialDamageGraphMode.AllInheritableSpecials },
    { label: "全ての奥義", value: SpecialDamageGraphMode.AllSpecials },
    { label: "発動カウント2の奥義", value: SpecialDamageGraphMode.Count2Specials },
    { label: "発動カウント3の奥義", value: SpecialDamageGraphMode.Count3Specials },
    { label: "発動カウント4の奥義", value: SpecialDamageGraphMode.Count4Specials },
];

const TriangleAdeptType = {
    None: 0,
    Adept1: 1,
    Adept2: 2,
    Adept3: 3,
};

const TriangleAdvantageOptions = [
    { label: "なし", value: TriangleAdvantage.None },
    { label: "攻撃有利", value: TriangleAdvantage.Advantageous },
    { label: "攻撃不利", value: TriangleAdvantage.Disadvantageous },
];

const TriangleAdeptOptions = [
    { label: "なし", value: TriangleAdeptType.None },
    { label: "激化1", value: TriangleAdeptType.Adept1 },
    { label: "激化2", value: TriangleAdeptType.Adept2 },
    { label: "激化3", value: TriangleAdeptType.Adept3 },
];

const WeaponTypeOptions = [
    { text: "剣", id: WeaponType.Sword },
    { text: "槍", id: WeaponType.Lance },
    { text: "斧", id: WeaponType.Axe },
    { text: "杖", id: WeaponType.Staff },
    { text: "赤魔", id: WeaponType.RedTome },
    { text: "青魔", id: WeaponType.BlueTome },
    { text: "緑魔", id: WeaponType.GreenTome },
    { text: "無魔", id: WeaponType.ColorlessTome },
    { text: "赤弓", id: WeaponType.RedBow },
    { text: "青弓", id: WeaponType.BlueBow },
    { text: "緑弓", id: WeaponType.GreenBow },
    { text: "弓", id: WeaponType.ColorlessBow },
    { text: "赤暗器", id: WeaponType.RedDagger },
    { text: "青暗器", id: WeaponType.BlueDagger },
    { text: "緑暗器", id: WeaponType.GreenDagger },
    { text: "暗器", id: WeaponType.ColorlessDagger },
    { text: "赤竜", id: WeaponType.RedBreath },
    { text: "青竜", id: WeaponType.BlueBreath },
    { text: "緑竜", id: WeaponType.GreenBreath },
    { text: "無竜", id: WeaponType.ColorlessBreath },
    { text: "赤獣", id: WeaponType.RedBeast },
    { text: "青獣", id: WeaponType.BlueBeast },
    { text: "緑獣", id: WeaponType.GreenBeast },
    { text: "無獣", id: WeaponType.ColorlessBeast },
];
/**
 * @param  {string} name
 * @param  {UnitGroupType} groupId=UnitGroupType.Ally
 * @returns {Unit}
 */
function createDefaultUnit(name, groupId = UnitGroupType.Ally) {
    let unit = new Unit("", name, groupId);
    unit.placedTile = new Tile(0, 0);
    unit.maxHpWithSkills = 99;
    unit.hp = unit.maxHpWithSkills;
    unit.weapon = Weapon.SilverSwordPlus;
    unit.weaponType = WeaponType.Sword;
    unit.moveType = MoveType.Infantry;
    unit.atkWithSkills = 50;
    unit.spdWithSkills = 40;
    unit.defWithSkills = 30;
    unit.resWithSkills = 30;
    return unit;
}

class RoundRobinBattleResult {
    constructor(winCount, drawCount, unit) {
        this.winCount = winCount;
        this.drawCount = drawCount;
        /** @type {Unit} */
        this.unit = unit;
    }
}

class DamageCalcHeroDatabase extends HeroDatabase {
    /**
     * @param  {HeroInfo[]} inputHeroInfos
     * @param  {SkillInfo[]} weapons
     * @param  {SkillInfo[]} supports
     * @param  {SkillInfo[]} specials
     * @param  {SkillInfo[]} passiveAs
     * @param  {SkillInfo[]} passiveBs
     * @param  {SkillInfo[]} passiveCs
     * @param  {SkillInfo[]} passiveSs
     * @param  {SkillInfo[]} passiveXs
     */
    constructor(inputHeroInfos, weapons, supports, specials,
                passiveAs, passiveBs, passiveCs, passiveSs, passiveXs) {
        super(inputHeroInfos);
        this.skillDatabase = new SkillDatabase();
        this.skillDatabase.registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs);

        for (let i = 0; i < inputHeroInfos.length; ++i) {
            let heroInfo = inputHeroInfos[i];
            heroInfo.registerWeaponOptions(weapons);
            heroInfo.registerSupportOptions(supports);
            heroInfo.registerSpecialOptions(specials);
            heroInfo.registerPassiveAOptions(passiveAs);
            heroInfo.registerPassiveBOptions(passiveBs);
            heroInfo.registerPassiveCOptions(passiveCs);
            heroInfo.registerPassiveSOptions(passiveAs, passiveBs, passiveCs, passiveSs);
            heroInfo.registerPassiveXOptions(passiveXs);
        }
    }
    /**
     * @param  {String} heroName
     * @param  {UnitGroupType} groupId=UnitGroupType.Ally
     * @returns {Unit}
     */
    createUnit(name, heroName, groupId = UnitGroupType.Ally) {
        let unit = createDefaultUnit(name, groupId);
        this.initUnit(unit, heroName);
        return unit;
    }
    /**
     * @param  {Number} id
     * @returns {SkillInfo}
     */
    findSkillInfo(id) {
        return this.skillDatabase.findSkillInfoByDict(id);
    }

    initByHeroInfo(unit, heroName) {
        let heroInfo = this.findInfo(heroName);
        unit.initByHeroInfo(heroInfo);
    }

    updateUnitSkillInfo(unit) {
        this.skillDatabase.updateUnitSkillInfo(unit);
    }

    initUnitStatus(unit, initEditableAttrs = true) {
        this.skillDatabase.updateUnitSkillInfo(unit);
        if (unit.hasWeapon) {
            if (unit.weaponInfo.hasSpecialWeaponRefinement) {
                if (unit.weaponInfo.specialRefineHpAdd === 3) {
                    unit.weaponRefinement = WeaponRefinementType.Special_Hp3;
                }
                else {
                    unit.weaponRefinement = WeaponRefinementType.Special;
                }
            }
            else if (unit.weaponInfo.hasStatusWeaponRefinement) {
                if (unit.attackRange === 1) {
                    unit.weaponRefinement = WeaponRefinementType.Hp5_Atk2;
                }
                else {
                    unit.weaponRefinement = WeaponRefinementType.Hp2_Atk1;
                }
            }
        }

        unit.setMoveCountFromMoveType();
        if (!unit.heroInfo.isResplendent) {
            unit.isResplendent = false;
        }

        if (initEditableAttrs) {
            unit.level = 40;
            unit.merge = 0;
            unit.dragonflower = 0;
            unit.isBonusChar = false;
            unit.isResplendent = false;
        }

        unit.updateStatusBySkillsAndMerges(true);

        unit.resetMaxSpecialCount();
        unit.specialCount = unit.maxSpecialCount;
        unit.hp = unit.maxHpWithSkills;
    }

    /**
     * @param  {Unit} unit
     * @param  {string} heroName
     */
    initUnit(unit, heroName, initEditableAttrs = true) {
        this.initByHeroInfo(unit, heroName);

        unit.initializeSkillsToDefault();

        this.initUnitStatus(unit, initEditableAttrs);
    }
}

const MaxDragonFlower = -1;

const SkillSwappingMode = {
    IfNone: 0,
    IfCanEquip: 1,
    IfCanEquipExceptExclusiveSkill: 2,
    IfSpIsGreaterThanCurrentSkill: 3,
};

const SkillSwappingModeOptions = [
    { label: "なしの場合", value: SkillSwappingMode.IfNone },
    { label: "装備可能な場合", value: SkillSwappingMode.IfCanEquip },
    { label: "専用スキル以外", value: SkillSwappingMode.IfCanEquipExceptExclusiveSkill },
    { label: "このスキルよりSPが少ない場合", value: SkillSwappingMode.IfSpIsGreaterThanCurrentSkill },
];


class RoundRobinParam {
    constructor() {
        this.merge = 10;
        this.dragonflower = MaxDragonFlower;
        this.emblemHeroMerge = 10;
        this.special = Special.None;
        this.passiveA = PassiveA.None;
        this.passiveB = PassiveB.None;
        this.passiveC = PassiveC.None;
        this.passiveS = PassiveS.None;
        this.passiveX = PassiveX.None;

        this.special_skillSwappingMode = SkillSwappingMode.IfNone;
        this.passiveA_skillSwappingMode = SkillSwappingMode.IfNone;
        this.passiveB_skillSwappingMode = SkillSwappingMode.IfNone;
        this.passiveC_skillSwappingMode = SkillSwappingMode.IfNone;
        this.passiveS_skillSwappingMode = SkillSwappingMode.IfNone;
        this.passiveX_skillSwappingMode = SkillSwappingMode.IfNone;
    }
}

class BoolOption {
    constructor(id, defaultValue) {
        this.id = id;
        this.value = defaultValue;
    }
}

class DamageCalcData {
    constructor(heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
        passiveSInfos, passiveXInfos) {
        this.logger = new HtmlLogger();
        this.unitManager = new UnitManager();
        this.unitManager.units = [];
        this.map = new BattleMap("");
        this.battleContext = new GlobalBattleContext();

        /** @type {DamageCalculatorWrapper} */
        this.damageCalc = new DamageCalculatorWrapper(
            this.unitManager,
            this.map,
            this.battleContext,
            this.logger
        );
        this.beginningOfTurnSkillHandler = new BeginningOfTurnSkillHandler(
            this.unitManager,
            this.map,
            this.battleContext,
            this.logger,
            x => { }
        );
        this.heroDatabase = new DamageCalcHeroDatabase(
            heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
            passiveSInfos, passiveXInfos);

        this.mode = DamageCalculatorMode.RoundRobin;
        this.roundRobinParam = new RoundRobinParam();
        this.roundRobinCombatMode = RoundRobinCombatMode.Offense;
        this.roundRobinCombatCount = 1;
        this.specialGraphMode = SpecialDamageGraphMode.AllInheritableSpecials;
        this.attackerTriangleAdvantage = TriangleAdvantage.None;
        this.triangleAdeptType = TriangleAdeptType.None;


        /** @type {Unit} */
        this.atkUnit = createDefaultUnit("攻撃者");
        this.atkUnit.weaponInfo = weaponInfos[0];

        /** @type {Unit} */
        this.defUnit = createDefaultUnit("被攻撃者", UnitGroupType.Enemy);
        this.defUnit.weaponInfo = weaponInfos[0];
        this.basicDamageDealt = 0;
        this.actualDamageDealt = 0;
        this.additionalDamage = 0;
        this.multDamage = 1;
        this.log = "";

        this.targetBookVersions = [];
        this.enemyBookVersions = [];
        for (const key in BookVersions) {
            this.targetBookVersions.push(new BoolOption(key, true));
            this.enemyBookVersions.push(new BoolOption(key, true));
        }

        this.specialOptions = [];
        this.specialOptions.push({ id: -1, text: "なし" });
        for (let info of specialInfos) {
            if (isNormalAttackSpecial(info.id)) {
                this.specialOptions.push({ id: info.id, text: info.name });
            }
        }

        this.passiveAOptions = [];
        this.passiveAOptions.push({ id: -1, text: "なし" });
        for (let info of passiveAInfos) {
            if (info.canInherit) {
                this.passiveAOptions.push({ id: info.id, text: info.name });
            }
        }

        this.passiveBOptions = [];
        this.passiveBOptions.push({ id: -1, text: "なし" });
        for (let info of passiveBInfos) {
            if (info.canInherit) {
                this.passiveBOptions.push({ id: info.id, text: info.name });
            }
        }

        this.passiveCOptions = [];
        this.passiveCOptions.push({ id: -1, text: "なし" });
        for (let info of passiveCInfos) {
            if (info.canInherit) {
                this.passiveCOptions.push({ id: info.id, text: info.name });
            }
        }

        this.passiveSOptions = [];
        this.passiveSOptions.push({ id: -1, text: "なし" });
        for (let infos of [passiveSInfos, passiveAInfos, passiveBInfos, passiveCInfos]) {
            for (let info of infos) {
                if ((info.type === SkillType.PassiveS || info.isSacredSealAvailable) && info.canInherit) {
                    this.passiveSOptions.push({ id: info.id, text: info.name });
                }
            }
        }

        this.passiveXOptions = [];
        this.passiveXOptions.push({ id: -1, text: "なし" });
        for (let info of passiveXInfos) {
            if (info.canInherit) {
                this.passiveXOptions.push({ id: info.id, text: info.name });
            }
        }

        this.damageReductionPercentage = 0;
        this._graph = null;

        // 計算過程の表示用
        this.attackerTriangleAdvantageFactor = 0;
        this.effectivenessFactor = 1;
        this.defensiveTileFactor = 0;
        this.specialSufferMitRatio = 0;

        this.updateDamageDealt();
    }

    clearLog() {
        this.log = "";
    }

    updateDamageDealt() {
        this.__clearBattleContext();

        this.atkUnit.resWithSkills = this.atkUnit.defWithSkills;
        this.defUnit.resWithSkills = this.defUnit.defWithSkills;
        this.__applyTriangleAdeptToAtkUnit();

        this.atkUnit.saveCurrentHpAndSpecialCount();
        this.defUnit.saveCurrentHpAndSpecialCount();
        this.atkUnit.createSnapshot();
        this.defUnit.createSnapshot();

        this.atkUnit.battleContext.isThereAllyOnAdjacentTiles = true;

        this.defUnit.battleContext.addDamageReductionRatio(roundFloat(this.damageReductionPercentage * 0.01));
        this.atkUnit.tmpSpecialCount = 0;

        this.damageCalc.clearLog();
        // TODO: 引数を確認する(damage type, game mode)
        let result = this.damageCalc.calcCombatResult(this.atkUnit, this.defUnit, DamageType.EstimatedDamage, GameMode.AetherRaid);
        this.basicDamageDealt = result.atkUnit_normalAttackDamage;
        this.actualDamageDealt = result.damageHistory[0].damageDealt;
        this.additionalDamage = this.atkUnit.battleContext.getSpecialAddDamage()
            + this.atkUnit.battleContext.additionalDamage
            + this.atkUnit.battleContext.additionalDamageOfSpecial;
        this.multDamage = this.atkUnit.battleContext.specialMultDamage;

        this.log = this.damageCalc.log;

        // 計算式用のプロパティ設定
        this.effectivenessFactor = this.atkUnit.battleContext.isEffectiveToOpponentForciblly ? 1.5 : 1.0;
        this.defensiveTileFactor = this.defUnit.battleContext.isOnDefensiveTile ? 0.3 : 0;
        this.specialSufferMitRatio = this.atkUnit.battleContext.specialSufferPercentage * 0.01;
        this.attackerTriangleAdvantage = DamageCalculationUtility.calcAttackerTriangleAdvantage(this.atkUnit, this.defUnit);
        this.attackerTriangleAdvantageFactor = this.__getAttackerTriangleAdvantageFactor();
    }

    syncSettingsWithAttackerTriangleAdvantage() {
        this.atkUnit.weaponType = WeaponType.Sword;
        this.defUnit.weaponType = this.__getTriangleAdvantageWeaponTypeAgainstSword();
        this.attackerTriangleAdvantageFactor = this.__getAttackerTriangleAdvantageFactor();
        this.__applyTriangleAdeptToAtkUnit();
    }

    __clearBattleContext() {
        let isOnDefensiveTile = this.defUnit.battleContext.isOnDefensiveTile;
        this.atkUnit.battleContext.clear();
        this.defUnit.battleContext.clear();
        this.defUnit.battleContext.isOnDefensiveTile = isOnDefensiveTile;
    }

    __applyTriangleAdeptToAtkUnit() {
        switch (this.triangleAdeptType) {
            case TriangleAdeptType.None:
                this.atkUnit.passiveA = PassiveA.None;
                break;
            case TriangleAdeptType.Adept1:
                this.atkUnit.passiveA = PassiveA.AishoGekika1;
                break;
            case TriangleAdeptType.Adept2:
                this.atkUnit.passiveA = PassiveA.AishoGekika2;
                break;
            case TriangleAdeptType.Adept3:
                this.atkUnit.passiveA = PassiveA.AishoGekika3;
                break;
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }

    __getAttackerTriangleAdvantageFactor() {
        switch (this.attackerTriangleAdvantage) {
            case TriangleAdvantage.None: return 0;
            case TriangleAdvantage.Advantageous:
                switch (this.triangleAdeptType) {
                    case TriangleAdeptType.None: return 0.2;
                    case TriangleAdeptType.Adept1: return 0.3;
                    case TriangleAdeptType.Adept2: return 0.35;
                    case TriangleAdeptType.Adept3: return 0.4;
                    default:
                        throw new Error(`Invalid type ${type}`);
                }
            case TriangleAdvantage.Disadvantageous:
                switch (this.triangleAdeptType) {
                    case TriangleAdeptType.None: return -0.2;
                    case TriangleAdeptType.Adept1: return -0.3;
                    case TriangleAdeptType.Adept2: return -0.35;
                    case TriangleAdeptType.Adept3: return -0.4;
                    default:
                        throw new Error(`Invalid type ${type}`);
                }
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }

    __getTriangleAdvantageWeaponTypeAgainstSword() {
        switch (this.attackerTriangleAdvantage) {
            case TriangleAdvantage.None: return WeaponType.Sword;
            case TriangleAdvantage.Advantageous: return WeaponType.Axe;
            case TriangleAdvantage.Disadvantageous: return WeaponType.Lance;
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }


    updateDamageGraph() {
        let canvasId = "damageGraphCanvas";
        let ctx = document.getElementById(canvasId).getContext('2d');

        let xLabels = [];
        let specialToValuesDict = {};
        const mitStart = 10;
        const mitEnd = 80;
        const mitIncrement = 5;
        for (let mit = mitStart; mit <= mitEnd; mit += mitIncrement) {
            xLabels.push(mit);
        }

        let targetSpecials = this.__getSpecialsForCurrentGraphMode();

        // 元の状態を保存
        let atkUnitString = this.atkUnit.toString();
        let defUnitString = this.defUnit.toString();
        let defUnitDef = this.defUnit.defWithSkills;

        // ダメージ計算
        for (let special of targetSpecials) {
            this.atkUnit.special = special;
            let specialName = this.specialOptions.filter(x => x.id == special)[0].text;
            let values = [];
            for (let mit = mitStart; mit <= mitEnd; mit += mitIncrement) {
                this.defUnit.defWithSkills = mit;
                this.updateDamageDealt();
                values.push(this.actualDamageDealt);
            }
            specialToValuesDict[specialName] = values;
        }

        // 元に戻す
        this.atkUnit.fromString(atkUnitString);
        this.defUnit.fromString(defUnitString);
        this.defUnit.defWithSkills = defUnitDef;
        this.updateDamageDealt();

        let datasets = [];
        {
            const colors = Array.from(enumerateColors());
            let lineIndex = 0;
            let lineCount = Object.keys(specialToValuesDict).length;
            for (let special in specialToValuesDict) {
                let values = specialToValuesDict[special];
                const hue = lineIndex * (360 / (lineCount + 1));
                let color = colors[lineIndex];
                let bgColor = color.copy();
                bgColor.luminance += 30;

                datasets.push({
                    label: special,
                    data: values,
                    backgroundColor: bgColor.toString(),
                    borderColor: color.toString(),
                    borderWidth: 1,
                    fill: false,
                    lineTension: 0,
                });
                ++lineIndex;
            }
        }

        if (this._graph != null) {
            this._graph.destroy();
        }

        this._graph = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xLabels,
                datasets: datasets
            },
            options: {
                animation: {
                    duration: 0, // 一般的なアニメーションの時間
                },
                hover: {
                    animationDuration: 0, // アイテムのマウスオーバー時のアニメーションの長さ
                },
                responsiveAnimationDuration: 0, // サイズ変更後のアニメーションの長さ
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                        }
                    }]
                }
            }
        });
    }

    /**
     * @param {Unit} unit
     * @param  {Number} skillId
     * @returns {boolean}
     */
    __canEquip(unit, skillId) {
        let skillInfo = this.heroDatabase.findSkillInfo(skillId);
        return unit.canEquip(skillInfo);
    }
    /**
     * @param  {Unit} unit
     * @param  {SkillInfo} skillInfo
     */
    __canSwapSkill(unit, skillInfo, newSkillId, skillSwappingMode) {
        let newSkillInfo = this.heroDatabase.skillDatabase.findSkillInfoByDict(newSkillId);
        return newSkillId != NoneValue
            && (
                (skillSwappingMode === SkillSwappingMode.IfCanEquip)
                || (skillSwappingMode === SkillSwappingMode.IfNone && skillInfo == null)
                || (skillSwappingMode === SkillSwappingMode.IfCanEquipExceptExclusiveSkill && skillInfo != null && skillInfo.canInherit)
                || (skillSwappingMode === SkillSwappingMode.IfSpIsGreaterThanCurrentSkill && (skillInfo == null || skillInfo.sp < newSkillInfo.sp))
            )
            && this.__canEquip(unit, newSkillId);
    }

    /**
     * @param  {Tile} tile
     * @returns {Unit[]}
     */
    __createAllHeroUnits(groupId, tile, bookVersions) {
        let units = [];
        for (const heroInfo of this.heroDatabase.enumerateHeroInfos()) {
            if (!bookVersions.some(x => x == heroInfo.bookVersion)) {
                continue;
            }
            let name = heroInfo.name;
            let unit = new Unit("", name, groupId);
            tile.setUnit(unit);
            unit.initByHeroInfo(heroInfo);

            unit.level = 40;
            unit.merge = this.roundRobinParam.merge;
            unit.dragonflower = this.roundRobinParam.dragonflower == MaxDragonFlower ?
                heroInfo.maxDragonflower : this.roundRobinParam.dragonflower;
            unit.emblemHeroMerge = this.roundRobinParam.emblemHeroMerge;
            unit.isBonusChar = false;
            unit.isResplendent = heroInfo.isResplendent;
            if (!unit.isMythicHero) {
                unit.blessingEffects.push(BlessingType.Hp5_Atk3);
                unit.blessingEffects.push(BlessingType.Hp5_Spd4);
                unit.blessingEffects.push(BlessingType.Hp5_Def5);
                unit.blessingEffects.push(BlessingType.Hp5_Res5);
            }

            unit.initializeSkillsToDefault();

            this.heroDatabase.updateUnitSkillInfo(unit);
            if (this.__canSwapSkill(unit, unit.specialInfo, this.roundRobinParam.special,
                this.roundRobinParam.special_skillSwappingMode)) {
                unit.special = this.roundRobinParam.special;
            }
            if (this.__canSwapSkill(unit, unit.passiveAInfo, this.roundRobinParam.passiveA,
                this.roundRobinParam.passiveA_skillSwappingMode)) {
                unit.passiveA = this.roundRobinParam.passiveA;
            }
            if (this.__canSwapSkill(unit, unit.passiveBInfo, this.roundRobinParam.passiveB,
                this.roundRobinParam.passiveB_skillSwappingMode)) {
                unit.passiveB = this.roundRobinParam.passiveB;
            }
            if (this.__canSwapSkill(unit, unit.passiveCInfo, this.roundRobinParam.passiveC,
                this.roundRobinParam.passiveC_skillSwappingMode)) {
                unit.passiveC = this.roundRobinParam.passiveC;
            }
            if (this.__canSwapSkill(unit, unit.passiveSInfo, this.roundRobinParam.passiveS,
                this.roundRobinParam.passiveS_skillSwappingMode)) {
                unit.passiveS = this.roundRobinParam.passiveS;
            }
            if (this.__canSwapSkill(unit, unit.passiveXInfo, this.roundRobinParam.passiveX,
                this.roundRobinParam.passiveX_skillSwappingMode)) {
                unit.passiveX = this.roundRobinParam.passiveX;
            }
            this.heroDatabase.initUnitStatus(unit, false);

            units.push(unit);
        }
        return units;
    }
    /**
     * @param  {Tile} tile
     * @returns {Unit[]}
     */
    __createAllHeroUnitsForDefense(groupId, tile, bookVersions) {
        let units = [];
        for (let heroInfo of this.heroDatabase.enumerateHeroInfos()) {
            if (!bookVersions.some(x => x == heroInfo.bookVersion)) {
                continue;
            }

            let name = heroInfo.name;
            let unit = new Unit("", name, groupId);
            tile.setUnit(unit);
            unit.initByHeroInfo(heroInfo);

            unit.level = 40;
            unit.merge = this.roundRobinParam.merge;
            unit.dragonflower = this.roundRobinParam.dragonflower == MaxDragonFlower ?
                heroInfo.maxDragonflower : this.roundRobinParam.dragonflower;
            unit.emblemHeroMerge = this.roundRobinParam.emblemHeroMerge;
            unit.isBonusChar = false;
            unit.isResplendent = heroInfo.isResplendent;
            if (!unit.isMythicHero) {
                unit.blessingEffects.push(BlessingType.Hp5_Atk3);
                unit.blessingEffects.push(BlessingType.Hp5_Spd4);
                unit.blessingEffects.push(BlessingType.Hp5_Def5);
                unit.blessingEffects.push(BlessingType.Hp5_Res5);
            }

            unit.initializeSkillsToDefault();
            this.heroDatabase.initUnitStatus(unit, false);

            units.push(unit);
        }
        return units;
    }

    calcRoundRobin() {
        let atkUnits = this.__createAllHeroUnits(UnitGroupType.Ally, this.map.getTile(0, 2), this.targetBookVersions.filter(x => x.value).map(x => x.id));
        let defUnits = this.__createAllHeroUnitsForDefense(UnitGroupType.Enemy, this.map.getTile(0, 0), this.enemyBookVersions.filter(x => x.value).map(x => x.id));

        let atkAllyUnit = new Unit("", "atkAlly", UnitGroupType.Ally);
        atkAllyUnit.heroInfo = this.heroDatabase._heroInfos[0];
        this.map.getTile(2, 2).setUnit(atkAllyUnit);
        let defAllyUnit = new Unit("", "defAlly", UnitGroupType.Enemy);
        defAllyUnit.heroInfo = this.heroDatabase._heroInfos[0];
        this.map.getTile(2, 0).setUnit(defAllyUnit);
        this.unitManager.units = [atkAllyUnit, defAllyUnit];

        let calculator = this.damageCalc;
        let self = this;

        /** @type {RoundRobinBattleResult[]} */
        let results = [];
        let length = atkUnits.length;
        // length = 1;
        let startTime = Date.now();
        let logEnabled = self.logger.isLogEnabled;
        this.battleContext.currentTurn = 1;
        if (this.roundRobinCombatMode === RoundRobinCombatMode.Offense) {
            // console.profile();

            startProgressiveProcess(length,
                function (iter) {
                    let atkUnit = atkUnits[iter];
                    // atkUnit = atkUnits.filter(x => x.heroInfo.name === "伝承リリーナ")[0];
                    if (self.unitManager.units.length === 3) {
                        self.unitManager.units.pop();
                    }
                    self.unitManager.units.push(atkUnit);
                    self.logger.isLogEnabled = logEnabled;
                    self.logger.isLogEnabled = false;
                    self.beginningOfTurnSkillHandler.applySkillsForBeginningOfTurn(atkUnit);
                    self.beginningOfTurnSkillHandler.applyReservedState(atkUnit);
                    self.beginningOfTurnSkillHandler.applyHpSkillsForBeginningOfTurn(atkUnit);
                    atkUnit.applyReservedHp(true);
                    atkUnit.applyAtkBuff(6);
                    atkUnit.applySpdBuff(6);
                    atkUnit.applyDefBuff(6);
                    atkUnit.applyResBuff(6);
                    let winCount = 0;
                    let drawCount = 0;

                    for (let defUnit of defUnits) {
                        atkUnit.initBattleContext(true);
                        calculator.clearLog();
                        calculator.updateUnitSpur(atkUnit);
                        calculator.updateUnitSpur(defUnit);

                        for (let i = 0; i < self.roundRobinCombatCount; ++i) {
                            defUnit.initBattleContext(false);
                            let result = calculator.calcDamage(atkUnit, defUnit);
                        }
                        if (defUnit.restHp === 0) {
                            ++winCount;
                        }
                        else if (atkUnit.restHp !== 0) {
                            ++drawCount;
                        }
                    }
                    let roundRobinResult = new RoundRobinBattleResult(winCount, drawCount, atkUnit);
                    results.push(roundRobinResult);
                    self.logger.isLogEnabled = true;
                },
                function (iter, iterMax) {
                    let lastIndex = results.length - 1;
                    let unit = results[lastIndex].unit;
                    let result = results[lastIndex];
                    let winRate = Math.round(10000 * result.winCount / length) / 100;
                    let aliveRate = Math.round(10000 * (result.winCount + result.drawCount) / length) / 100;
                    self.logger.writeLog(`${iter} / ${iterMax}: ${unit.name} 勝率 ${result.winCount}/${defUnits.length}(${winRate}%), 生存率 ${result.winCount + result.drawCount}/${defUnits.length}(${aliveRate}%)`);
                    self.log = self.logger.log;
                },
                function () {
                    results.sort((a, b) => {
                        return b.winCount - a.winCount;
                    });
                    let resultHtml = "<table><tr><th>名前</th><th>率</th><th>移動マス数</th><th>射程</th></tr>";
                    for (let i = 0; i < results.length; ++i) {
                        let result = results[i];
                        let unit = results[i].unit;
                        let winRate = result.winCount / defUnits.length;
                        resultHtml += `<tr><td><a href="${unit.detailPageUrl}">${unit.heroInfo.name}</a></td><td>${winRate}</td><td>${unit.moveCount}</td><td>${unit.attackRange}</td></tr>`;
                        // self.logger.writeLog(`Move${unit.moveCount}_Range${unit.attackRange}&#009;${unit.heroInfo.name}&#009;${winRate}`);
                    }
                    resultHtml += "</table>";
                    self.logger.writeLog(resultHtml);
                    const endTime = Date.now();
                    let diffSec = (endTime - startTime) * 0.001;
                    self.logger.writeLog(`テスト完了(${diffSec} sec)--------------------`);
                    self.log = self.logger.log;
                    // console.profileEnd();

                });
        }
        else {
            startProgressiveProcess(length,
                function (iter) {
                    let defUnit = defUnits[iter];
                    // atkUnit = atkUnits.filter(x => x.heroInfo.name === "エルフィ")[0];
                    // console.log(atkUnit);
                    self.logger.isLogEnabled = logEnabled;
                    self.logger.isLogEnabled = false;
                    self.beginningOfTurnSkillHandler.applySkillsForBeginningOfTurn(defUnit);
                    self.beginningOfTurnSkillHandler.applyReservedState(defUnit);
                    self.beginningOfTurnSkillHandler.applyHpSkillsForBeginningOfTurn(defUnit);
                    defUnit.applyReservedHp(true);
                    defUnit.applyAtkBuff(6);
                    defUnit.applySpdBuff(6);
                    defUnit.applyDefBuff(6);
                    defUnit.applyResBuff(6);
                    let winCount = 0;
                    let drawCount = 0;
                    for (let atkUnit of atkUnits) {
                        defUnit.initBattleContext(false);
                        calculator.clearLog();
                        calculator.updateUnitSpur(atkUnit);
                        calculator.updateUnitSpur(defUnit);

                        for (let i = 0; i < self.roundRobinCombatCount; ++i) {
                            atkUnit.initBattleContext(true);
                            let result = calculator.calcDamage(atkUnit, defUnit);
                        }
                        if (atkUnit.restHp === 0) {
                            ++winCount;
                        }
                        else if (defUnit.restHp !== 0) {
                            ++drawCount;
                        }
                    }
                    let roundRobinResult = new RoundRobinBattleResult(winCount, drawCount, defUnit);
                    results.push(roundRobinResult);
                    self.logger.isLogEnabled = true;
                },
                function (iter, iterMax) {
                    let lastIndex = results.length - 1;
                    let unit = results[lastIndex].unit;
                    let result = results[lastIndex];
                    let winRate = Math.round(10000 * result.winCount / length) / 100;
                    let aliveRate = Math.round(10000 * (result.winCount + result.drawCount) / length) / 100;
                    self.logger.writeLog(`${iter} / ${iterMax}: ${unit.name} 勝率 ${result.winCount}/${defUnits.length}(${winRate}%), 生存率 ${result.winCount + result.drawCount}/${defUnits.length}(${aliveRate}%)`);
                    self.log = self.logger.log;
                },
                function () {
                    results.sort((a, b) => {
                        return (b.winCount + b.drawCount) - (a.winCount + a.drawCount);
                    });
                    let resultHtml = "<table><tr><th>名前</th><th>率</th><th>移動マス数</th><th>射程</th></tr>";
                    for (let i = 0; i < results.length; ++i) {
                        let result = results[i];
                        let unit = results[i].unit;
                        let winRate = result.winCount / defUnits.length;
                        const aliveRage = (result.winCount + result.drawCount) / defUnits.length;
                        resultHtml += `<tr><td><a href="${unit.detailPageUrl}">${unit.heroInfo.name}</a></td><td>${aliveRage}</td><td>${unit.moveCount}</td><td>${unit.attackRange}</td></tr>`;
                    }

                    self.logger.writeLog(resultHtml);

                    const endTime = Date.now();
                    let diffSec = (endTime - startTime) * 0.001;
                    self.logger.writeLog(`テスト完了(${diffSec} sec)--------------------`);
                    self.log = self.logger.log;
                });

        }
    }



    __getSpecialsForCurrentGraphMode() {
        switch (this.specialGraphMode) {
            case SpecialDamageGraphMode.AllInheritableSpecials:
                return this.__getInheritableCount2Specials()
                    .concat(this.__getInheritableCount3Specials())
                    .concat(this.__getInheritableCount4Specials());
            case SpecialDamageGraphMode.AllSpecials:
                return this.__getInheritableCount2Specials().concat(this.__getCount2Specials())
                    .concat(this.__getInheritableCount3Specials()).concat(this.__getCount3Specials())
                    .concat(this.__getInheritableCount4Specials()).concat(this.__getCount4Specials());
            case SpecialDamageGraphMode.Count2Specials:
                return this.__getInheritableCount2Specials().concat(this.__getCount2Specials());
            case SpecialDamageGraphMode.Count3Specials:
                return this.__getInheritableCount3Specials().concat(this.__getCount3Specials());
            case SpecialDamageGraphMode.Count4Specials:
                return this.__getInheritableCount4Specials().concat(this.__getCount4Specials());
        }
    }

    __getInheritableCount2Specials() {
        return [
            Special.Moonbow, // 月虹(守備魔防-30%)
            Special.Glimmer, // 凶星(1.5倍)
            Special.RupturedSky, // 破天(+攻撃20%)
        ].concat(INHERITABLE_COUNT2_SPECIALS);
    }


    __getCount2Specials() {
        return [
            Special.DevinePulse, // 天刻の拍動(速さの25%、次の自分の攻撃のダメージ+速さの20%)
            Special.SublimeHeaven, // 覇天(+攻撃25%、獣なら50%)
            // Special.HolyKnightAura, // グランベルの聖騎士(+攻撃25%)
            Special.Enclosure, // 閉界(攻撃+25%)
            Special.LunaFlash, // 月光閃(守備魔防-20%、+速さ20%)
            Special.LunarFlash2, // 月光閃・承(守備魔防-20%、+速さ20%)
            Special.ShiningEmblem, // 光炎の紋章(+速さ35%)
            Special.Sirius, // 天狼(+速さ30%)
            Special.SiriusPlus, // 天狼(+速さ35%)
            // Special.HerosBlood, // 英雄の血脈(+速さ30%)
            // Special.RighteousWind, // 聖風(+速さ30%)
            Special.RegnalAstra, // 剣姫の流星(+速さ40%)
            Special.VitalAstra, // 心流星(+速さ30%)
            Special.SupremeAstra, // 無双の流星(+速さ40%)
            // Special.ImperialAstra, // 剣皇の流星(+速さ40%)
            Special.TwinBlades, // 双刃(+魔防30%)
            Special.CircletOfBalance, // 聖神と暗黒神の冠(+魔坊40%)
        ].concat(COUNT2_SPECIALS);
    }
    __getInheritableCount3Specials() {
        return [
            Special.Deadeye, // 狙撃(2倍)
            Special.BlueFrame, // ブルーフレイム(+10 or +25)
            Special.DraconicAura, // 竜穿
            // Special.Iceberg, // 氷蒼(+魔防50%)
            Special.ArmoredBeacon, // 重装の聖炎(+守備40%)
            Special.ArmoredFloe, // 重装の聖氷(+魔防40%)
            Special.Bonfire, // 緋炎(+守備50%)
            Special.Luna, // 月光(守備魔防-50%)
        ].concat(INHERITABLE_COUNT3_SPECIALS);
    }
    __getCount3Specials() {
        return [
            Special.DragonBlast, // 神竜破
            Special.BrutalShell, // 凶弾
            Special.SeidrShell, // 魔弾(+15)
            // Special.OpenTheFuture, // 開世(+守備50%)
            Special.KuroNoGekko, // 黒の月光(守備魔防-80%)
            Special.LightlessLuna, // 漆黒の月光(守備魔防-80%)
        ].concat(COUNT3_SPECIALS);
    }
    __getInheritableCount4Specials() {
        return [
            // Special.Glacies, // 氷華(+魔防80%)
            Special.Ignis, // 華炎(+守備80%)
            Special.DragonFang, // 竜穿(+攻撃50%)
            Special.Astra, // 流星(2.5倍)
            Special.Lethality, // 滅殺(守備魔防-75%)
        ].concat(INHERITABLE_COUNT4_SPECIALS);
    }

    __getCount4Specials() {
        return [
            Special.Lethality, // 滅殺
        ].concat(COUNT4_SPECIALS);
    }

    __writeLog(message) {
        this.log += message;
    }
    __writeLogLine(message) {
        this.__writeLog(message + "<br/>");
    }
}

let g_damageCalcData = null;

let g_keyRepeatHandler = new KeyRepeatHandler();

function addMultipleEventListener(element, events, handler) {
    for (let e of events) {
        element.addEventListener(e, handler);
    }
}

function addKeyRepeatEvent(elem, changeValueFunc) {
    if (elem == null) {
        return;
    }
    addMultipleEventListener(elem, ['mousedown', 'mouseup', 'mouseleave'], (e) => {
        if (e.type == "mousedown") {
            g_keyRepeatHandler.startKeyRepeat(changeValueFunc);
        } else {
            g_keyRepeatHandler.stopKeyRepeat();
            g_damageCalcData.updateDamageDealt();
            if (g_damageCalcData.mode == DamageCalculatorMode.SpecialDamageGraph) {
                console.log("ダメージグラフ更新");
                g_damageCalcData.updateDamageGraph();
            }
        }
    });
}

function addKeyRepeatEventById(elemId, changeValueFunc) {
    let elem = document.getElementById(elemId);
    addKeyRepeatEvent(elem, changeValueFunc);
}

let g_damageCalcVm = null;

class HslColor {
    constructor(h, s, l) {
        this.hue = h;
        this.saturation = s;
        this.luminance = l;
    }

    copy() {
        return new HslColor(this.hue, this.saturation, this.luminance);
    }

    toString() {
        return `hsl(${this.hue}, ${this.saturation}%, ${this.luminance}%)`;
    }
}

function* enumerateColors() {
    const hueVariationCount = 8;
    const saturationOffset = 60;
    const luminanceOffset = 30;
    for (let lumIndex = 0; lumIndex < 2; ++lumIndex) {
        const luminance = 50 - lumIndex * luminanceOffset;
        for (let satIndex = 0; satIndex < 2; ++satIndex) {
            const saturation = 100 - satIndex * saturationOffset;
            for (let hueIndex = 0; hueIndex < hueVariationCount; ++hueIndex) {
                const hue = hueIndex * (360 / (hueVariationCount + 1));
                yield new HslColor(hue, saturation, luminance);
            }
        }
    }
}

function initDamageCalculator(heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
    passiveSInfos, passiveXInfos) {
    g_damageCalcData = new DamageCalcData(
        heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
        passiveSInfos, passiveXInfos);
    g_damageCalcVm = new Vue({
        el: "#damageCalc",
        data: g_damageCalcData,
        methods: {
            triangleAdvantageChanged: function () {
                g_damageCalcData.updateDamageDealt();
            },
            updateDamageResult: function () {
                console.log("ダメージ更新");
                g_damageCalcData.updateDamageDealt();
                if (g_damageCalcData.mode == DamageCalculatorMode.SpecialDamageGraph) {
                    console.log("ダメージグラフ更新");
                    g_damageCalcData.updateDamageGraph();
                }
            },
            updateDamageGraph: function () {
                g_damageCalcData.updateDamageGraph();
            },
            calcRoundRogin: function () {
                g_damageCalcData.calcRoundRobin();
            },
        }
    });
}
