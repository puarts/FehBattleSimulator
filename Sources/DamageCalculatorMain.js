
const DamageCalcMode = {
    Simple: 0,
    SpecialDamageGraph: 1,
    RoundRobin: 2,
};

const DamageCalcModeOptions = [
    { label: "与ダメージ計算", value: DamageCalcMode.Simple },
    { label: "総当たり殲滅力", value: DamageCalcMode.RoundRobin },
    { label: "奥義ダメージグラフ", value: DamageCalcMode.SpecialDamageGraph },
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
    constructor(winCount, drawCount) {
        this.winCount = winCount;
        this.drawCount = drawCount;
    }
}

class DamageCalcHeroDatabase extends HeroDatabase {
    constructor(inputHeroInfos, weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs) {
        super(inputHeroInfos);
        this.skillDatabase = new SkillDatabase();
        this.skillDatabase.registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs);
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
     * @param  {Unit} unit
     * @param  {string} heroName
     */
    initUnit(unit, heroName, initEditableAttrs = true) {
        let heroInfo = this.findInfo(heroName);
        unit.initByHeroInfo(heroInfo);
        unit.initializeSkillsToDefault();
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
}

class DamageCalcData {
    constructor() {
        this.logger = new HtmlLogger();
        this.unitManager = new UnitManager();
        this.unitManager.units = [];
        this.map = new BattleMap("", MapType.None, 0);
        this.battleContext = new GlobalBattleContext();
        this.damageCalc = new DamageCalculatorWrapper(
            this.unitManager,
            this.map,
            this.battleContext,
            this.logger
        );
        this.heroDatabase = new DamageCalcHeroDatabase(
            heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
            passiveSInfos);

        this.mode = DamageCalcMode.RoundRobin;
        this.specialGraphMode = SpecialDamageGraphMode.AllInheritableSpecials;
        this.attackerTriangleAdvantage = TriangleAdvantage.None;
        this.triangleAdeptType = TriangleAdeptType.None;
        this.atkUnit = createDefaultUnit("攻撃者");
        this.atkUnit.weaponInfo = weaponInfos[0];
        this.defUnit = createDefaultUnit("被攻撃者", UnitGroupType.Enemy);
        this.defUnit.weaponInfo = weaponInfos[0];
        this.basicDamageDealt = 0;
        this.actualDamageDealt = 0;
        this.log = "";

        this.specialOptins = [];
        this.specialOptins.push({ id: -1, text: "なし" });
        for (let info of specialInfos) {
            if (isNormalAttackSpecial(info.id)) {
                this.specialOptins.push({ id: info.id, text: info.name });
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

        this.defUnit.battleContext.damageReductionRatio = roundFloat(this.damageReductionPercentage * 0.01);
        this.atkUnit.tmpSpecialCount = 0;

        this.damageCalc.clearLog();
        let result = this.damageCalc.calcCombatResult(this.atkUnit, this.defUnit);
        this.basicDamageDealt = result.atkUnit_specialAttackDamage;
        this.actualDamageDealt = result.damageHistory[0].damageDealt;
        this.log = this.damageCalc.log;

        // 計算式用のプロパティ設定
        this.effectivenessFactor = this.atkUnit.battleContext.isEffectiveToOpponent ? 1.5 : 1.0;
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
        let isEffectiveToOpponent = this.atkUnit.battleContext.isEffectiveToOpponent;
        let isOnDefensiveTile = this.defUnit.battleContext.isOnDefensiveTile;
        this.atkUnit.battleContext.clear();
        this.defUnit.battleContext.clear();
        this.atkUnit.battleContext.isEffectiveToOpponent = isEffectiveToOpponent;
        this.defUnit.battleContext.isOnDefensiveTile = isOnDefensiveTile;
    }

    __applyTriangleAdeptToAtkUnit() {
        switch (this.triangleAdeptType) {
            case TriangleAdeptType.None:
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
            let specialName = this.specialOptins.filter(x => x.id == special)[0].text;
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
     * @param  {Tile} tile
     * @returns {Unit[]}
     */
    __createAllHeroUnits(groupId, tile) {
        let units = [];
        for (let heroInfo of this.heroDatabase.enumerateHeroInfos()) {
            let name = heroInfo.name;
            let unit = new Unit("", name, groupId);
            unit.placedTile = tile;
            unit.level = 40;
            unit.merge = 10;
            unit.dragonflower = heroInfo.maxDragonflower;
            unit.isBonusChar = false;
            unit.isResplendent = heroInfo.isResplendent;
            unit.blessingEffects.push(BlessingType.Hp5_Atk3);
            unit.blessingEffects.push(BlessingType.Hp5_Spd4);
            unit.blessingEffects.push(BlessingType.Hp5_Def5);
            unit.blessingEffects.push(BlessingType.Hp5_Res5);
            this.heroDatabase.initUnit(unit, heroInfo.name, false);
            units.push(unit);
        }
        return units;
    }

    calcRoundRogin() {
        let atkUnits = this.__createAllHeroUnits(UnitGroupType.Ally, this.map.getTile(0, 2));
        let defUnits = this.__createAllHeroUnits(UnitGroupType.Enemy, this.map.getTile(0, 0));
        let heroDatabase = this.heroDatabase;
        let calclator = this.damageCalc;
        let self = this;
        let results = [];
        let length = heroDatabase.length;
        // length = 1;
        let startTime = Date.now();
        startProgressiveProcess(length,
            function (iter) {
                let atkUnit = atkUnits[iter];
                // atkUnit = atkUnits.filter(x => x.heroInfo.name === "エルフィ")[0];
                // console.log(atkUnit);
                self.logger.isLogEnabled = false;

                let winCount = 0;
                let drawCount = 0;
                for (let defUnit of defUnits) {
                    calclator.updateUnitSpur(atkUnit);
                    calclator.updateUnitSpur(defUnit);
                    let result = calclator.calcDamage(atkUnit, defUnit);
                    if (defUnit.restHp === 0) {
                        ++winCount;
                    }
                    else if (atkUnit.restHp !== 0) {
                        ++drawCount;
                    }
                }
                let roundRobinResult = new RoundRobinBattleResult(winCount, drawCount);
                results.push({ atkUnit: atkUnit, result: roundRobinResult });
                self.logger.isLogEnabled = true;
            },
            function (iter, iterMax) {
                let lastIndex = results.length - 1;
                let unit = results[lastIndex].atkUnit;
                let result = results[lastIndex].result;
                let winRate = Math.round(10000 * result.winCount / heroDatabase.length) / 100;
                let aliveRate = Math.round(10000 * (result.winCount + result.drawCount) / heroDatabase.length) / 100;
                self.logger.writeLog(`${iter} / ${iterMax}: ${unit.name} 勝率 ${result.winCount}/${defUnits.length}(${winRate}%), 生存率 ${result.winCount + result.drawCount}/${defUnits.length}(${aliveRate}%)`);
                self.log = self.logger.log;
            },
            function () {
                // self.damageCalc.isLogEnabled = true;
                // self.vm.durabilityTestIsLogEnabled = durabilityTestLogEnabled;
                results.sort((a, b) => {
                    return b.result.winCount - a.result.winCount;
                });
                for (let i = 0; i < results.length; ++i) {
                    let result = results[i].result;
                    let unit = results[i].atkUnit;
                    let winRate = result.winCount / defUnits.length;
                    console.log(`${unit.heroInfo.name}: ${winRate}`);
                    self.logger.writeLog(`${unit.heroInfo.name}\t${winRate}`);
                }
                const endTime = Date.now();
                let diffSec = (endTime - startTime) * 0.001;
                self.logger.writeLog(`テスト完了(${diffSec} sec)--------------------`);
                self.log = self.logger.log;


                // let originalDisableAllLogs = self.disableAllLogs;
                // self.disableAllLogs = true;
                // importSettingsFromString(serializedTurn);
                // $("#progress").progressbar({ disabled: true });
                // updateAllUi();
                // self.disableAllLogs = originalDisableAllLogs;
            });

        // this.__writeLogLine(log);
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
        ];
    }


    __getCount2Specials() {
        return [
            Special.SublimeHeaven, // 覇天(+攻撃25%、獣なら50%)
            // Special.HolyKnightAura, // グランベルの聖騎士(+攻撃25%)
            Special.LunaFlash, // 月光閃(守備魔防-20%、+速さ20%)
            Special.ShiningEmblem, // 光炎の紋章(+速さ35%)
            Special.Sirius, // 天狼(+速さ30%)
            // Special.HerosBlood, // 英雄の血脈(+速さ30%)
            // Special.RighteousWind, // 聖風(+速さ30%)
            Special.RegnalAstra, // 剣姫の流星(+速さ40%)
            // Special.ImperialAstra, // 剣皇の流星(+速さ40%)
            Special.TwinBlades, // 双刃(+魔防30%)
        ];
    }
    __getInheritableCount3Specials() {
        return [
            Special.Deadeye, // 狙撃(2倍)
            Special.BlueFrame, // ブルーフレイム(+10 or +25)
            Special.DraconicAura, // 竜穿
            // Special.Iceberg, // 氷蒼(+魔防50%)
            Special.Bonfire, // 緋炎(+守備50%)
            Special.Luna, // 月光(守備魔防-50%)
        ];
    }
    __getCount3Specials() {
        return [
            Special.SeidrShell, // 魔弾(+15)
            // Special.OpenTheFuture, // 開世(+守備50%)
            Special.KuroNoGekko, // 黒の月光(守備魔防-80%)
        ];
    }
    __getInheritableCount4Specials() {
        return [
            // Special.Glacies, // 氷華(+魔防80%)
            Special.Ignis, // 華炎(+守備80%)
            Special.DragonFang, // 竜穿(+攻撃50%)
            Special.Astra, // 流星(2.5倍)
        ];
    }

    __getCount4Specials() {
        return [
        ];
    }

    __writeLog(message) {
        this.log += message;
    }
    __writeLogLine(message) {
        this.__writeLog(message + "<br/>");
    }
}

const g_damageCalcData = new DamageCalcData();

let g_keyRepeatHandler = new KeyRepeatHandler();

function addMultipleEventListener(element, events, handler) {
    for (let e of events) {
        element.addEventListener(e, handler);
    }
}

function addKeyRepeatEvent(elem, changeValueFunc) {
    addMultipleEventListener(elem, ['mousedown', 'mouseup', 'mouseleave'], (e) => {
        if (e.type == "mousedown") {
            g_keyRepeatHandler.startKeyRepeat(changeValueFunc);
        } else {
            g_keyRepeatHandler.stopKeyRepeat();
            g_damageCalcData.updateDamageDealt();
            if (g_damageCalcData.mode == DamageCalcMode.SpecialDamageGraph) {
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

const g_damageCalcVm = new Vue({
    el: "#damageCalc",
    data: g_damageCalcData,
    methods: {
        triangleAdvantageChanged: function () {
            g_damageCalcData.updateDamageDealt();
        },
        updateDamageResult: function () {
            console.log("ダメージ更新");
            g_damageCalcData.updateDamageDealt();
            if (g_damageCalcData.mode == DamageCalcMode.SpecialDamageGraph) {
                console.log("ダメージグラフ更新");
                g_damageCalcData.updateDamageGraph();
            }
        },
        updateDamageGraph: function () {
            g_damageCalcData.updateDamageGraph();
        },
        calcRoundRogin: function () {
            g_damageCalcData.calcRoundRogin();
        },
    }
});

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
