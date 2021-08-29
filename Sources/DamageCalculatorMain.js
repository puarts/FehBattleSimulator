
const DamageCalcMode = {
    Simple: 0,
    SpecialDamageGraph: 1,
};

const DamageCalcModeOptions = [
    { label: "与ダメージ計算", value: DamageCalcMode.Simple },
    { label: "奥義ダメージグラフ", value: DamageCalcMode.SpecialDamageGraph },
];

const SpecialDamageGraphMode = {
    AllSpecials: 0,
    Count2Specials: 1,
    Count3Specials: 2,
    Count4Specials: 3,
};

const SpecialDamageGraphModeOptions = [
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

class DamageCalcData {
    constructor() {
        this.damageCalc = new DamageCalculatorWrapper();
        this.mode = DamageCalcMode.Simple;
        this.specialGraphMode = SpecialDamageGraphMode.Count2Specials;
        this.attackerTriangleAdvantage = TriangleAdvantage.None;
        this.triangleAdeptType = TriangleAdeptType.None;
        this.atkUnit = createDefaultUnit("攻撃者");
        this.defUnit = createDefaultUnit("被攻撃者", UnitGroupType.Enemy);
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

        this.atkUnit.saveCurrentHpAndSpecialCount();
        this.defUnit.saveCurrentHpAndSpecialCount();
        this.atkUnit.createSnapshot();
        this.defUnit.createSnapshot();

        this.defUnit.battleContext.damageReductionRatio = roundFloat(this.damageReductionPercentage * 0.01);
        this.atkUnit.tmpSpecialCount = 0;

        this.damageCalc.clearLog();
        let result = this.damageCalc.calcCombatResult(this.atkUnit, this.defUnit);
        console.log(result);
        this.basicDamageDealt = result.atkUnit_specialAttackDamage;
        this.actualDamageDealt = result.damageHistory[0].damageDealt;
        this.log = this.damageCalc.log;


        this.effectivenessFactor = this.atkUnit.battleContext.isEffectiveToOpponent ? 1.5 : 1.0;
        this.defensiveTileFactor = this.defUnit.battleContext.isOnDefensiveTile ? 0.3 : 0;
        this.specialSufferMitRatio = this.atkUnit.battleContext.specialSufferPercentage * 0.01;
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
                this.defUnit.resWithSkills = mit;
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

        if (this._graph == null) {
            this._graph = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: xLabels,
                    datasets: datasets
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }
        else {
            this._graph.data.labels = xLabels;
            this._graph.data.datasets = datasets;
            this._graph.update();
        }
    }


    __getSpecialsForCurrentGraphMode() {
        switch (this.specialGraphMode) {
            case SpecialDamageGraphMode.AllSpecials:
                return this.__getCount2Specials()
                    .concat(this.__getCount3Specials())
                    .concat(this.__getCount4Specials());
            case SpecialDamageGraphMode.Count2Specials:
                return this.__getCount2Specials();
            case SpecialDamageGraphMode.Count3Specials:
                return this.__getCount3Specials();
            case SpecialDamageGraphMode.Count4Specials:
                return this.__getCount4Specials();
        }
    }


    __getCount2Specials() {
        return [
            Special.Moonbow, // 月虹(守備魔防-30%)
            Special.Glimmer, // 凶星(1.5倍)
            Special.RupturedSky, // 破天(+攻撃20%)
            Special.SublimeHeaven, // 覇天(+攻撃25%、獣なら50%)
            // Special.HolyKnightAura, // 覇天と同じ(+攻撃25%)
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

    __getCount3Specials() {
        return [
            Special.SeidrShell, // 魔弾(+15)
            Special.Deadeye, // 狙撃(2倍)
            // Special.OpenTheFuture, // 開世(+守備50%)
            Special.BlueFrame, // ブルーフレイム(+10 or +25)
            Special.KuroNoGekko, // 黒の月光(守備魔防-80%)
            Special.DraconicAura, // 竜穿
            Special.Iceberg, // 氷蒼(+魔防50%)
            Special.Bonfire, // 緋炎(+守備50%)
            Special.Luna, // 月光(守備魔防-50%)
        ];
    }

    __getCount4Specials() {
        return [
            Special.Glacies, // 氷華(+魔防80%)
            Special.Ignis, // 華炎(+守備80%)
            Special.DragonFang, // 竜穿(+攻撃50%)
            Special.Astra, // 流星(2.5倍)
        ];
    }

    writeLog(message) {
        this.log += message;
    }
    writeLogLine(message) {
        this.writeLog(message + "<br/>");
    }
}

const g_damageCalcData = new DamageCalcData();

let g_keyRepeatTimeoutId;
function startKeyRepeat(incrementFunc, speed = 250) {
    incrementFunc();
    g_keyRepeatTimeoutId = setTimeout(() => {
        startKeyRepeat(incrementFunc, speed * 0.9);
    }, speed);
}

function stopKeyRepeat() {
    clearTimeout(g_keyRepeatTimeoutId);
}

function addMultipleEventListener(element, events, handler) {
    for (let e of events) {
        element.addEventListener(e, handler);
    }
}

function addKeepChangingSettingEvent(elem, changeSettingFunc) {
    addMultipleEventListener(elem, ['mousedown', 'mouseup', 'mouseleave'], (e) => {
        if (e.type == "mousedown") {
            startKeyRepeat(changeSettingFunc);
        } else {
            stopKeyRepeat();
            g_damageCalcData.updateDamageDealt();
        }
    });
}

function addKeepChangingSettingEventById(elemId, changeSettingFunc) {
    let elem = document.getElementById(elemId);
    addKeepChangingSettingEvent(elem, changeSettingFunc);
}

const g_damageCalcVm = new Vue({
    el: "#damageCalc",
    data: g_damageCalcData,
    methods: {
        triangleAdvantageChanged: function () {
            console.log("3すくみ変更");
            g_damageCalcData.syncSettingsWithAttackerTriangleAdvantage();
            g_damageCalcData.updateDamageDealt();
        },
        updateDamageResult: function () {
            console.log("ダメージ更新");
            g_damageCalcData.updateDamageDealt();
        },
        updateDamageGraph: function () {
            g_damageCalcData.updateDamageGraph();
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

// function getInheritableSpecials() {

// }

