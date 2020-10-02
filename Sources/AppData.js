/// @file
/// @brief AppData クラスとそれに関連するクラスや関数等の定義です。

/// 全ての英雄情報を格納するデータベースです。
class HeroDataBase {
    constructor(heroInfos) {
        this._heroInfos = heroInfos;
        this._nameToInfoDict = {};
        for (let info of heroInfos) {
            this._nameToInfoDict[info.name] = info;
        }

        this._nameToIndexDict = {};
        for (let i = 0; i < this._heroInfos.length; ++i) {
            let info = this._heroInfos[i];
            this._nameToIndexDict[info.name] = i;
        }
    }

    get data() {
        return this._heroInfos;
    }

    get length() {
        return this._heroInfos.length;
    }

    get(index) {
        return this._heroInfos[index];
    }

    findIcon(name) {
        let info = this.findInfo(name);
        if (info == null) {
            return null;
        }
        return info.icon;
    }

    findInfo(name) {
        return this._nameToInfoDict[name];
    }

    findIndexOfInfo(name) {
        return this._nameToIndexDict[name];
    }
}


function createUnitViewModel(id, unitGroupType) {
    return new Unit(id, "", unitGroupType, MoveType.Infantry, "", 1);
}

function __registerSkillOptions(options, infos) {
    for (let info of infos) {
        options.push({ id: info.id, text: info.name });
    }
}
function __registerPassiveSOptions(options, infos) {
    for (let info of infos) {
        if (info.isSacredSealAvailable) {
            options.push({ id: info.id, text: info.name });
        }
    }
}
function __findSkillInfo(skillInfos, id) {
    for (let info of skillInfos) {
        if (info.id == id) {
            return info;
        }
    }

    return null;
}

const TabChar = "&emsp;&emsp;";
const g_idGenerator = new IdGenerator();
const g_deffenceStructureContainer = new StructureContainer('deffenceStructureContainer');
const g_offenceStructureContainer = new StructureContainer('offenceStructureContainer');

const OcrSettingTarget = {
    SelectedTarget: 0,
    AllEnemies: 1,
    AllAllies: 2,
    MapStructures: 3,
};

const SettingCompressMode = {
    None: 0,
    Utf16: 1,
    Base64: 2,
    Uri: 3,
};

const ItemType = {
    None: -1,
    RakuraiNoJufu: 0,
    KobuNoTsunobue: 1,
    KogunNoBoots: 2,
    Tokkoyaku: 3,
    OugiNoYaiba: 4,
    OdorikoNoVeru: 5,
};
function getItemTypeName(itemType) {
    switch (itemType) {
        case ItemType.RakuraiNoJufu: return "落雷の呪符";
        case ItemType.KobuNoTsunobue: return "鼓舞の角笛";
        case ItemType.KogunNoBoots: return "行軍のブーツ";
        case ItemType.Tokkoyaku: return "特効薬";
        case ItemType.OugiNoYaiba: return "奥義の刃";
        case ItemType.OdorikoNoVeru: return "踊り子のヴェール";
        default: return "不明なアイテム";
    }
}

const GameMode = {
    AetherRaid: 0,
    Arena: 1,
    AllegianceBattles: 2,
    ResonantBattles: 3,
    TempestTrials: 4,
};

// 選択モード
const SelectMode = {
    Normal: 0,
    Tile: 1, // タイル編集用
};
const SelectModeOptions = [
    { text: "通常", id: SelectMode.Normal },
    { text: "地形編集", id: SelectMode.Tile },
];

const MaxEnemyUnitCount = 12;
const MaxAllyUnitCount = 8;

/// シミュレーターの持つデータです。
class AppData {
    constructor() {
        this.gameVersion = 360;
        this.gameVersionOptions = [{ label: "3.6.0(2019/6のアプデ後)", value: 360 },];
        this.gameMode = GameMode.AetherRaid;
        this.gameModeOptions = [
            { label: "飛空城", value: GameMode.AetherRaid },
            { label: "闘技場", value: GameMode.Arena },
            // { label: "フレンドダブル", value: GameMode.AllegianceBattles },
            { label: "双界を越えて", value: GameMode.ResonantBattles },
            { label: "戦渦の連戦", value: GameMode.TempestTrials },
        ];
        this.mapKind = MapType.Izumi;
        this.mapKindOptions = [
            { label: "泉の城", value: MapType.Izumi },
            { label: "氷雪の城", value: MapType.Hyosetsu },
            { label: "廃墟の城", value: MapType.Haikyo },
            { label: "雪化粧の城", value: MapType.Yukigesho },
            { label: "砂漠の城", value: MapType.Sabaku },
            { label: "春風の城", value: MapType.Harukaze },
            { label: "木漏れ日の城", value: MapType.Komorebi },
            { label: "忘れられた城", value: MapType.Wasurerareta },
            { label: "夏草の城", value: MapType.Natsukusa },
            { label: "灼熱の城", value: MapType.Syakunetsu },
        ];
        this.aetherRaidMenuStyle = "";

        this.audioManager = new AudioManager();

        this.arenaScore = 0;
        this.primeArenaScore = 0;
        this.arenaScoreForEnemy = 0;
        this.primeArenaScoreForEnemy = 0;

        this.resonantBattleInterval = 1; // 双位

        this.resonantBattleItems = [];

        // シーズン設定
        this.isLightSeason = true;
        this.isAstraSeason = false;
        this.isFireSeason = false;
        this.isEarthSeason = false;
        this.isWindSeason = false;
        this.isWaterSeason = false;

        // シリアライズ設定
        this.settingCompressMode = SettingCompressMode.None;
        this.settingCompressModeOptions = [
            { id: SettingCompressMode.None, text: "未圧縮" },
            // { id: SettingCompressMode.Utf16, text: "UTF-16形式" },
            { id: SettingCompressMode.Base64, text: "Base64形式" },
            { id: SettingCompressMode.Uri, text: "URIで使用可能な形式" },
        ];
        this.exportSettingText = "";
        this.exportsEnemySettings = true;
        this.exportsAllySettings = true;
        this.exportsDefenceSettings = true;
        this.exportsOffenceSettings = true;
        this.exportsMapSettings = false;

        // 画像解析設定
        this.ocrProgress = "";
        this.ocrResult = "";
        this.ocrCropX = 0;
        this.ocrCropY = 0;
        this.ocrSettingTarget = OcrSettingTarget.AllEnemies;
        this.showOcrImage = false;
        this.debugTemplateIndex = -1;
        this.debugTemplateCount = 1;
        this.currentTemplateIndex = 0;
        this.corrThresholdRate = 0.85;
        this.ignoresUnitTileForAutoMapReplace = false;
        this.templateMatchMethod = 5;
        this.templateMatchMethodOptions = [
            { text: "TM_SQDIFF", id: 0 },
            { text: "TM_SQDIFF_NORMED", id: 1 },
            { text: "TM_CCORR", id: 2 },
            { text: "TM_CCORR_NORMED", id: 3 },
            { text: "TM_CCOEFF", id: 4 },
            { text: "TM_CCOEFF_NORMED", id: 5 },
        ];
        this.imageSizeShrinkDiv = 4;
        this.useWhitelistForOcr = false;

        // おまかせ設定
        this.limitsExamineRangeToMovableRange = false;
        this.limitsExamineRangeToThreatenedRange = false;
        this.limitsExamineRangeToNoTrapTiles = true;

        // ミョルニル査定計算設定
        this.mjolnirsStrikeTier = 1;
        this.mjolnirsStrikeMajorSeason = SeasonType.None;
        this.mjolnirsStrikeMinorSeason = SeasonType.None;
        this.mjolnirsStrikeSeasonOptions = [
            { id: SeasonType.None, text: "なし" },
            { id: SeasonType.Light, text: "光" },
            { id: SeasonType.Dark, text: "闇" },
            { id: SeasonType.Astra, text: "天" },
            { id: SeasonType.Anima, text: "理" },
        ];

        // その他の設定
        this.rbEnemySettingInputHp = 0;
        this.rbEnemySettingInputAtk = 0;
        this.rbEnemySettingInputSpd = 0;
        this.rbEnemySettingInputDef = 0;
        this.rbEnemySettingInputRes = 0;

        this.selectMode = SelectMode.Normal;

        this.durabilityTestAllyUnitId = "";
        this.durabilityTestEnemyUnitId = "";
        this.durabilityTestLog = "";
        this.durabilityTestChargesSpecialCount = false;
        this.durabilityTestDefaultSpecial = Special.None;
        this.durabilityTestCalcPotentialDamage = false;
        this.durabilityTestBattleCount = 1;

        this.aetherRaidDefensePreset = 0;
        this.aetherRaidDefensePresetDescription = "";
        this.resetCurrentAetherRaidDefensePreset();

        this.changesBgmRandomly = true;
        this.showMovableRangeWhenMovingUnit = true;
        this.currentTurn = 0;
        this.currentTurnType = UnitGroupType.Ally;

        this.isEnemyActionTriggered = true;
        this.isAutoLoadTurnSettingEnabled = false;
        this.simulatesEnemyActionOneByOne = true;
        this.isCommandUndoable = true;
        this.autoChangeDetail = true;
        this.currentItemIndex = -1;
        this.attackerUnitIndex = 6;
        this.attackTargetUnitIndex = 0;
        this.attackerInfo = "";
        this.attackTargetInfo = "";
        this.damageCalcLog = "";
        this.simpleLog = "";
        this.isPotentialDamageDetailEnabled = false;

        this.enableAllSkillOptions = false; // スキルを継承可能なものだけに制限しない
        this.disableLowRankSkillOptions = false; // 下位スキルを表示する

        this.showDetailLog = true;
        this.isDebugMenuEnabled = DebugModeDefault;
        this.debugMenuStyle = "";
        this.attackInfoTdStyle = "";
        this.units = [];
        for (let i = 0; i < MaxEnemyUnitCount; ++i) {
            this.units.push(createUnitViewModel("e" + i, UnitGroupType.Enemy));
        }
        for (let i = 0; i < MaxAllyUnitCount; ++i) {
            this.units.push(createUnitViewModel("a" + i, UnitGroupType.Ally));
        }
        this.enemyUnits = [];
        this.allyUnits = [];
        this.updateEnemyAndAllyUnits();

        this.heroOptions = [
            { id: -1, text: "なし" },
        ];
        this.ivStateOptions = [
            { id: StatusType.None, text: "なし" },
            { id: StatusType.Hp, text: "HP" },
            { id: StatusType.Atk, text: "攻撃" },
            { id: StatusType.Spd, text: "速さ" },
            { id: StatusType.Def, text: "守備" },
            { id: StatusType.Res, text: "魔防" },
        ];
        this.selectionOptions = [
            { id: -1, text: "未選択" },
            { id: 0, text: "敵A" },
            { id: 1, text: "敵B" },
            { id: 2, text: "敵C" },
            { id: 3, text: "敵D" },
            { id: 4, text: "敵E" },
            { id: 5, text: "敵F" },
            { id: 6, text: "味方A" },
            { id: 7, text: "味方B" },
            { id: 8, text: "味方C" },
            { id: 9, text: "味方D" },
            { id: 10, text: "味方E" },
        ];
        this.moveTypeOptions = [
            { id: MoveType.Infantry, text: "歩行" },
            { id: MoveType.Flying, text: "飛行" },
            { id: MoveType.Cavalry, text: "騎馬" },
            { id: MoveType.Armor, text: "重装" },
        ];

        this.blessingOptions = [
            { id: BlessingType.None, text: "なし" },
            { id: BlessingType.Hp5_Atk3, text: "HP+5、攻撃+3" },
            { id: BlessingType.Hp5_Spd4, text: "HP+5、速さ+4" },
            { id: BlessingType.Hp5_Def5, text: "HP+5、守備+5" },
            { id: BlessingType.Hp5_Res5, text: "HP+5、魔防+5" },
            { id: BlessingType.Hp3_Atk2, text: "HP+3、攻撃+2" },
            { id: BlessingType.Hp3_Spd3, text: "HP+3、速さ+3" },
            { id: BlessingType.Hp3_Def4, text: "HP+3、守備+4" },
            { id: BlessingType.Hp3_Res4, text: "HP+3、魔防+4" },
            { id: BlessingType.Hp3, text: "HP+3" },
        ];
        this.seasonOptions = [
            { id: SeasonType.None, text: "なし" },
            { id: SeasonType.Light, text: "光" },
            { id: SeasonType.Dark, text: "闇" },
            { id: SeasonType.Astra, text: "天" },
            { id: SeasonType.Anima, text: "理" },
            { id: SeasonType.Fire, text: "火" },
            { id: SeasonType.Water, text: "水" },
            { id: SeasonType.Wind, text: "風" },
            { id: SeasonType.Earth, text: "地" },
        ];
        this.weaponRefinementOptions = [
            { id: WeaponRefinementType.None, text: "錬成なし" },
            { id: WeaponRefinementType.Special, text: "特殊" },
            { id: WeaponRefinementType.Special_Hp3, text: "特殊、HP+3" },
            { id: WeaponRefinementType.Hp5_Atk2, text: "HP+5、攻撃+2" },
            { id: WeaponRefinementType.Hp5_Spd3, text: "HP+5、速さ+3" },
            { id: WeaponRefinementType.Hp5_Def4, text: "HP+5、守備+4" },
            { id: WeaponRefinementType.Hp5_Res4, text: "HP+5、魔防+4" },
            { id: WeaponRefinementType.Hp2_Atk1, text: "HP+2、攻撃+1" },
            { id: WeaponRefinementType.Hp2_Spd2, text: "HP+2、速さ+2" },
            { id: WeaponRefinementType.Hp2_Def3, text: "HP+2、守備+3" },
            { id: WeaponRefinementType.Hp2_Res3, text: "HP+2、魔防+3" },
            { id: WeaponRefinementType.WrathfulStaff, text: "神罰の杖" },
            { id: WeaponRefinementType.DazzlingStaff, text: "幻惑の杖" },
        ];
        this.summonerLevelOptions = [
            { id: SummonerLevel.None, text: "なし" },
            { id: SummonerLevel.C, text: "C" },
            { id: SummonerLevel.B, text: "B" },
            { id: SummonerLevel.A, text: "A" },
            { id: SummonerLevel.S, text: "S" },
        ];
        this.partnerLevelOptions = [
            { id: PartnerLevel.None, text: "なし" },
            { id: PartnerLevel.C, text: "C" },
            { id: PartnerLevel.B, text: "B" },
            { id: PartnerLevel.A, text: "A" },
            { id: PartnerLevel.S, text: "S" },
        ];
        this.weaponOptions = [
            { id: -1, text: "なし" }
        ];
        this.supportOptions = [
            { id: -1, text: "なし" }
        ];
        this.specialOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveAOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveBOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveCOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveSOptions = [
            { id: -1, text: "なし" }
        ];

        this.ornamentTypeOptions = [
        ];
        for (let i = 0; i < OrnamentSettings.length; ++i) {
            let setting = OrnamentSettings[i];
            this.ornamentTypeOptions.push({ id: i, text: setting.label });
        }

        this.templateImageFiles = [];

        this.templateBlessingImageFiles = [
            { id: SeasonType.Anima, fileName: "Blessing_Anima.png" },
            { id: SeasonType.Dark, fileName: "Blessing_Dark.png" },
            { id: SeasonType.Astra, fileName: "Blessing_Astra.png" },
            { id: SeasonType.Light, fileName: "Blessing_Light.png" },
            { id: SeasonType.Fire, fileName: "Blessing_Fire.png" },
            { id: SeasonType.Wind, fileName: "Blessing_Wind.png" },
            { id: SeasonType.Water, fileName: "Blessing_Water.png" },
            { id: SeasonType.Earth, fileName: "Blessing_Earth.png" },
        ];

        this.templateWeaponRefinementImageFiles = [
            { id: WeaponRefinementType.Hp5_Atk2, fileName: "WeaponRefine_Atk.png" },
            { id: WeaponRefinementType.Hp5_Spd3, fileName: "WeaponRefine_Spd.png" },
            { id: WeaponRefinementType.Hp5_Def4, fileName: "WeaponRefine_Def.png" },
            { id: WeaponRefinementType.Hp5_Res4, fileName: "WeaponRefine_Res.png" },
            { id: WeaponRefinementType.WrathfulStaff, fileName: "WeaponRefine_WrathfulStaff.png" },
            { id: WeaponRefinementType.DazzlingStaff, fileName: "WeaponRefine_DazzlingStaff.png" },
        ];

        this.mapImageFiles = AetherRaidMapImageFiles;
        this.arenaMapImageFiles = ArenaMapImageFiles;

        this.weaponCount = 0;
        this.weaponImplCount = 0;
        this.supportCount = 0;
        this.supportImplCount = 0;
        this.specialCount = 0;
        this.specialImplCount = 0;
        this.passiveACount = 0;
        this.passiveAImplCount = 0;
        this.passiveBCount = 0;
        this.passiveBImplCount = 0;
        this.passiveCCount = 0;
        this.passiveCImplCount = 0;
        this.passiveSCount = 0;
        this.passiveSImplCount = 0;
        this.commandQueuePerAction = new CommandQueue(100);
        this.commandQueue = new CommandQueue(100);

        this.heroInfos = null;
        this.weaponInfos = [];
        this.supportInfos = [];
        this.specialInfos = [];
        this.passiveAInfos = [];
        this.passiveBInfos = [];
        this.passiveCInfos = [];
        this.passiveSInfos = [];
        this.skillIdToInfoDict = {};

        {
            // 生成順を変えるとIDが変わってしまうので注意
            this.defenseStructureStorage = new Storage(g_idGenerator.generate());
            this.offenceStructureStorage = new Storage(g_idGenerator.generate());
            this.createStructures();
            this.map = new Map(g_idGenerator.generate(), this.mapKind, this.gameVersion);
        }

        this.addStructuresToSelectionOptions();
        this.registerTemplateImages();
        this.applyDebugMenuVisibility();
        this.updateTargetInfoTdStyle();
    }

    initHeroInfos(heroInfos) {
        this.heroInfos = new HeroDataBase(heroInfos);
    }

    __registerInfosToDict(skillInfos) {
        for (let info of skillInfos) {
            this.skillIdToInfoDict[info.id] = info;
        }
    }

    registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs) {
        this.weaponInfos = weapons;
        this.supportInfos = supports;
        this.specialInfos = specials;
        this.passiveAInfos = passiveAs;
        this.passiveBInfos = passiveBs;
        this.passiveCInfos = passiveCs;
        this.passiveSInfos = passiveSs;

        this.__registerInfosToDict(weapons);
        this.__registerInfosToDict(supports);
        this.__registerInfosToDict(specials);
        this.__registerInfosToDict(passiveAs);
        this.__registerInfosToDict(passiveBs);
        this.__registerInfosToDict(passiveCs);
        this.__registerInfosToDict(passiveSs);

        __registerSkillOptions(this.weaponOptions, weapons);
        __registerSkillOptions(this.supportOptions, supports);
        __registerSkillOptions(this.specialOptions, specials);
        __registerSkillOptions(this.passiveAOptions, passiveAs);
        __registerSkillOptions(this.passiveBOptions, passiveBs);
        __registerSkillOptions(this.passiveCOptions, passiveCs);
        __registerSkillOptions(this.passiveSOptions, passiveSs);
        __registerPassiveSOptions(this.passiveSOptions, passiveAs);
        __registerPassiveSOptions(this.passiveSOptions, passiveBs);
        __registerPassiveSOptions(this.passiveSOptions, passiveCs);
    }
    __updateUnitSkillInfo(unit) {
        unit.weaponInfo = this.__findSkillInfoByDict(unit.weapon);
        unit.supportInfo = this.__findSkillInfoByDict(unit.support);
        unit.specialInfo = this.__findSkillInfoByDict(unit.special);
        unit.passiveAInfo = this.__findSkillInfoByDict(unit.passiveA);
        unit.passiveBInfo = this.__findSkillInfoByDict(unit.passiveB);
        unit.passiveCInfo = this.__findSkillInfoByDict(unit.passiveC);
        unit.passiveSInfo = this.__findSkillInfoByDict(unit.passiveS);
    }

    __findSkillInfoByDict(id) {
        return this.skillIdToInfoDict[id];
    }

    __findWeaponInfo(id) {
        return this.__findSkillInfoByDict(id);
    }

    __findSupportInfo(id) {
        return this.__findSkillInfoByDict(id);
    }

    __findSpecialInfo(id) {
        return this.__findSkillInfoByDict(id);
    }

    __findPassiveAInfo(id) {
        return this.__findSkillInfoByDict(id);
    }
    __findPassiveBInfo(id) {
        return this.__findSkillInfoByDict(id);
    }
    __findPassiveCInfo(id) {
        return this.__findSkillInfoByDict(id);
    }
    __findPassiveSInfo(id) {
        return this.__findSkillInfoByDict(id);
    }
    __updateStatusByPassiveA(unit, skillId) {
        let skillInfo = this.__findSkillInfoByDict(skillId);
        if (skillInfo == null) {
            return;
        }
        unit.maxHpWithSkillsWithoutAdd += skillInfo.hp;
        unit.atkWithSkills += skillInfo.atk;
        unit.spdWithSkills += skillInfo.spd;
        unit.defWithSkills += skillInfo.def;
        unit.resWithSkills += skillInfo.res;
    }
    __showStatusToAttackerInfo() {
        let unit = this.currentUnit;
        if (unit == null) { return; }
        let info = "HP:" + unit.hp + "/" + unit.maxHpWithSkills + "(" + unit.hpPercentage + "%)<br/>"
            + "攻:" + unit.getAtkInPrecombat()
            + " 速:" + unit.getSpdInPrecombat()
            + " 守:" + unit.getDefInPrecombat()
            + " 魔:" + unit.getResInPrecombat();
        if (unit.groupId == UnitGroupType.Ally) {
            // this.attackerInfo = info;
        } else {
            // this.attackTargetInfo = info;
        }
    }
    __updateStatusBySkillsAndMergeForAllHeroes(updatesPureGrowthRate = false) {
        for (let unit of this.enumerateUnits()) {
            this.__updateStatusBySkillsAndMerges(unit, updatesPureGrowthRate);
        }
    }
    __updateStatusBySkillsAndMerges(unit, updatesPureGrowthRate = false) {
        this.__updateUnitSkillInfo(unit);

        unit.updateBaseStatus(updatesPureGrowthRate);

        unit.maxHpWithSkillsWithoutAdd = unit.hpLvN;
        unit.atkWithSkills = Math.floor(Number(unit.atkLvN) * Number(unit.atkMult) + Number(unit.atkAdd));
        unit.spdWithSkills = Math.floor(Number(unit.spdLvN) * Number(unit.spdMult) + Number(unit.spdAdd));
        unit.defWithSkills = Math.floor(Number(unit.defLvN) * Number(unit.defMult) + Number(unit.defAdd));
        unit.resWithSkills = Math.floor(Number(unit.resLvN) * Number(unit.resMult) + Number(unit.resAdd));

        // 個体値と限界突破によるステータス上昇
        unit.updateStatusByMergeAndDragonFlower();

        // 祝福効果
        {
            unit.clearBlessingEffects();
            for (let ally of this.enumerateUnitsInTheSameGroup(unit, false)) {
                if (!this.isBlessingEffectEnabled(unit, ally)) {
                    continue;
                }
                let heroInfo = this.heroInfos.get(ally.heroIndex);
                unit.addBlessingEffect(heroInfo.blessingType);
            }

            unit.updateStatusByBlessing();
        }

        // 武器錬成
        unit.updateStatusByWeaponRefinement();

        // 召喚士との絆
        unit.updateStatusBySummonerLevel();

        unit.updateStatusByWeapon();

        if (unit.passiveA != PassiveA.None) {
            this.__updateStatusByPassiveA(unit, unit.passiveA);
        }
        if (unit.passiveS != PassiveS.None) {
            this.__updateStatusByPassiveA(unit, unit.passiveS);
        }
        switch (unit.weapon) {
            case Weapon.Mistoruthin:
                if (unit.isWeaponSpecialRefined) {
                    unit.atkWithSkills += 3;
                    unit.spdWithSkills += 3;
                    unit.defWithSkills += 3;
                    unit.resWithSkills += 3;
                }
                break;
            case Weapon.KokouNoKen:
            case Weapon.Bashirikosu:
                if (unit.isWeaponSpecialRefined) {
                    unit.spdWithSkills += 5;
                    unit.atkWithSkills += 5;
                    unit.defWithSkills -= 5;
                    unit.resWithSkills -= 5;
                }
                break;
            case Weapon.Yatonokami:
                if (unit.weaponRefinement != WeaponRefinementType.None) {
                    unit.atkWithSkills += 2;
                    unit.spdWithSkills += 2;
                    unit.defWithSkills += 2;
                    unit.resWithSkills += 2;
                }
                break;
            case Weapon.BatoruNoGofu:
            case Weapon.HinataNoMoutou:
                if (unit.isWeaponSpecialRefined) {
                    unit.atkWithSkills += 3;
                    unit.spdWithSkills += 3;
                    unit.defWithSkills += 3;
                    unit.resWithSkills += 3;
                }
                break;
        }

        // 化身によるステータス変化
        if (unit.isTransformed) {
            switch (unit.weapon) {
                case Weapon.BrazenCatFang:
                case Weapon.TaguelFang:
                case Weapon.TaguelChildFang:
                case Weapon.FoxkitFang:
                case Weapon.NewBrazenCatFang:
                case Weapon.NewFoxkitFang:
                case Weapon.KarasuOuNoHashizume:
                case Weapon.TakaouNoHashizume:
                case Weapon.YoukoohNoTsumekiba:
                case Weapon.JunaruSenekoNoTsumekiba:
                case Weapon.ShishiouNoTsumekiba:
                case Weapon.TrasenshiNoTsumekiba:
                case Weapon.JinroMusumeNoTsumekiba:
                case Weapon.JinroOuNoTsumekiba:
                case Weapon.OkamijoouNoKiba:
                case Weapon.ShirasagiNoTsubasa:
                case Weapon.SeijuNoKeshinHiko:
                case Weapon.BridesFang:
                case Weapon.GroomsWings:
                case Weapon.SkyPirateClaw:
                    unit.atkWithSkills += 2;
                    break;
            }
        }

        // 砦レベル差
        {
            let offenceFortlessLevel = Number(this.findOffenceFortress().level);
            let defenceFortlessLevel = Number(this.findDefenseFortress().level);
            let fortressLevelDiff = offenceFortlessLevel - defenceFortlessLevel;
            if (fortressLevelDiff < 0) {
                if (unit.groupId == UnitGroupType.Enemy) {
                    let diff = Math.abs(fortressLevelDiff);
                    unit.atkWithSkills += 4 * diff;
                    unit.spdWithSkills += 4 * diff;
                    unit.defWithSkills += 4 * diff;
                    unit.resWithSkills += 4 * diff;
                }
            }
            else if (fortressLevelDiff > 0) {
                if (unit.groupId == UnitGroupType.Ally) {
                    let diff = Math.abs(fortressLevelDiff);
                    unit.atkWithSkills += 4 * diff;
                    unit.spdWithSkills += 4 * diff;
                    unit.defWithSkills += 4 * diff;
                    unit.resWithSkills += 4 * diff;
                }
            }
        }

        // ボナキャラ補正
        if (unit.isBonusChar) {
            unit.maxHpWithSkillsWithoutAdd += 10;
            unit.atkWithSkills += 4;
            unit.spdWithSkills += 4;
            unit.defWithSkills += 4;
            unit.resWithSkills += 4;
        }

        // 神装
        if (unit.isResplendent) {
            unit.maxHpWithSkillsWithoutAdd += 2;
            unit.atkWithSkills += 2;
            unit.spdWithSkills += 2;
            unit.defWithSkills += 2;
            unit.resWithSkills += 2;
        }

        if (this.gameMode == GameMode.Arena) {
            this.updateArenaScore(unit);
        }
        this.__showStatusToAttackerInfo();
    }

    initializeByHeroInfo(unit, heroIndex, initEditableAttrs = true) {
        if (heroIndex < 0) {
            unit.heroIndex = heroIndex;
            unit.icon = g_siteRootPath + "images/dummy.png";
        }

        let heroInfo = this.heroInfos.get(heroIndex);
        if (heroInfo == null) {
            console.log("heroInfo was not found:" + heroIndex);
            return;
        }

        if (unit.heroIndex != heroIndex) {
            unit.heroIndex = heroIndex;
        }

        unit.initByHeroInfo(heroInfo);

        if (this.gameMode != GameMode.ResonantBattles
            || unit.groupId == UnitGroupType.Ally) {
            // 双界の敵以外は成長率を操作することはないのでリセット
            unit.updatePureGrowthRate();
            unit.resetStatusAdd();
            unit.resetStatusMult();
        }

        if (initEditableAttrs) {
            unit.level = 40;
            unit.merge = 0;
            unit.dragonflower = 0;
            unit.initializeSkillsToDefault();
            unit.setMoveCountFromMoveType();
            unit.reserveCurrentSkills();
            unit.isBonusChar = false;
            if (!unit.heroInfo.isResplendent) {
                unit.isResplendent = false;
            }
            unit.updatePureGrowthRate();
        }
        this.__updateStatusBySkillsAndMerges(unit, false);
        unit.resetMaxSpecialCount();
        if (initEditableAttrs) {
            unit.specialCount = unit.maxSpecialCount;
            unit.hp = unit.maxHpWithSkills;
        }
    }

    getDurabilityTestAlly() {
        return this.findUnitById(this.durabilityTestAllyUnitId);
    }
    getDurabilityTestEnemy() {
        return this.findUnitById(this.durabilityTestEnemyUnitId);
    }

    hasItem(itemType) {
        for (let item of this.resonantBattleItems) {
            if (item == itemType) {
                return true;
            }
        }
        return false;
    }

    clearItems() {
        this.resonantBattleItems = [];
    }

    removeItem(itemType) {
        var index = this.__findIndexOfBattleItem(itemType);
        if (index >= 0) {
            this.resonantBattleItems.splice(index, 1);
        }
    }

    __findIndexOfBattleItem(item) {
        for (let i = 0; i < this.resonantBattleItems.length; ++i) {
            if (this.resonantBattleItems[i] == item) {
                return i;
            }
        }
        return -1;
    }

    getResonantBattlesEnemyLevelForAdvanced() {
        switch (Number(this.resonantBattleInterval)) {
            case 1:
            case 2:
                return 40;
            case 3:
            case 4:
                return 41;
            case 5:
            case 6:
                return 42;
            case 7:
            case 8:
                return 43;
            default:
                return 35 + Number(this.resonantBattleInterval);
        }
    }

    isBlessingEffectEnabled(targetUnit, providerUnit) {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                {
                    if (targetUnit.grantedBlessing == SeasonType.None && targetUnit.providableBlessingSeason == SeasonType.None) {
                        // 祝福付与なし、かつ伝承英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason == SeasonType.None) {
                        return false;
                    }

                    if (isMythicSeasonType(targetUnit.providableBlessingSeason)) {
                        // 神階英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用者の祝福がシーズンに合わない
                        return false;
                    }

                    if (targetUnit.grantedBlessing == providerUnit.providableBlessingSeason) {
                        // 祝福が一致した
                        return true;
                    }

                    if (!isMythicSeasonType(providerUnit.providableBlessingSeason)) {
                        // 適用者が伝承英雄、かつ、対象も伝承英雄
                        return false;
                    }

                    let isSeasonLegendaryUnit = this.examinesIsCurrentSeason(targetUnit.providableBlessingSeason);
                    if (isSeasonLegendaryUnit) {
                        return true;
                    }

                    return false;
                }
            case GameMode.Arena:
                {
                    if (targetUnit.grantedBlessing == SeasonType.None
                        && targetUnit.providableBlessingSeason == SeasonType.None) {
                        // 祝福付与なし、かつ神階英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason == SeasonType.None
                        || isMythicSeasonType(providerUnit.providableBlessingSeason)
                    ) {
                        return false;
                    }

                    if (isLegendarySeasonType(targetUnit.providableBlessingSeason)) {
                        // 対象が伝承英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用者の祝福がシーズンに合わない
                        return false;
                    }

                    if (targetUnit.grantedBlessing == providerUnit.providableBlessingSeason) {
                        // 祝福が一致した
                        return true;
                    }

                    let isSeasonMythicUnit = this.examinesIsCurrentSeason(targetUnit.providableBlessingSeason);
                    if (isSeasonMythicUnit) {
                        return true;
                    }

                    return false;
                }
                break;
            case GameMode.ResonantBattles:
                {
                    if (targetUnit.grantedBlessing == SeasonType.None
                        && targetUnit.providableBlessingSeason == SeasonType.None) {
                        // 祝福付与なし、かつ神階英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason == SeasonType.None
                        || isMythicSeasonType(providerUnit.providableBlessingSeason)
                    ) {
                        return false;
                    }

                    if (isLegendarySeasonType(targetUnit.providableBlessingSeason)) {
                        // 対象が伝承英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用者の祝福がシーズンに合わない
                        return false;
                    }

                    if (targetUnit.grantedBlessing == providerUnit.providableBlessingSeason) {
                        // 祝福が一致した
                        return true;
                    }

                    return false;
                }
            default:
                return false;
        }
    }

    __calcPrimeArenaScore(units) {
        let score = 0;
        for (let unit of units) {
            score += unit.arenaScore;
        }

        return score / units.length;
    }

    __calcArenaScore(units) {
        let score = 0;
        let bressingCount = 0;
        for (let unit of units) {
            score += unit.arenaScore;
            for (let ally of units) {
                if (ally == unit) {
                    continue;
                }
                if (this.isBlessingEffectEnabled(unit, ally)) {
                    ++bressingCount;
                }
            }
        }

        score = Math.floor(score / units.length) * 2 + bressingCount * 2;
        let tier = Number(this.mjolnirsStrikeTier);
        if (tier <= 5) {
            score += 0;
        }
        else if (tier <= 10) {
            score += 8;
        }
        else if (tier <= 14) {
            score += 16;
        }
        else if (tier <= 17) {
            score += 48;
        }
        else if (tier <= 20) {
            score += 68;
        }
        else if (tier == 21) {
            score += 88;
        }
        return score;
    }

    updateArenaScoreOfUnit(unit) {
        unit.updateArenaScore(this.mjolnirsStrikeMajorSeason, this.mjolnirsStrikeMinorSeason);
    }

    updateArenaScoreOfParties() {
        this.arenaScore = this.__calcArenaScore(this.allyUnits);
        this.primeArenaScore = this.__calcPrimeArenaScore(this.allyUnits);
        this.arenaScoreForEnemy = this.__calcArenaScore(this.enemyUnits);
        this.primeArenaScoreForEnemy = this.__calcPrimeArenaScore(this.enemyUnits);
    }
    updateArenaScore(unit) {
        this.updateArenaScoreOfUnit(unit);
        this.updateArenaScoreOfParties();
    }

    updateEnemyAndAllyUnits() {
        let enemyCount = this.getEnemyCount();
        this.enemyUnits = [];
        for (let i = 0; i < enemyCount; ++i) {
            let unit = this.units[i];
            unit.slotOrder = i;
            this.enemyUnits.push(unit);
        }
        let allyOffset = MaxEnemyUnitCount;
        let allyEnd = allyOffset + this.getAllyCount();
        this.allyUnits = [];
        for (let i = allyOffset; i < allyEnd; ++i) {
            let unit = this.units[i];
            unit.slotOrder = i - allyOffset;
            this.allyUnits.push(unit);
        }
    }

    examinesEnemyActionTriggered(unit) {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                return this.isEnemyActionTriggered;
            case GameMode.ResonantBattles:
                if (unit.groupId == UnitGroupType.Ally) {
                    return true;
                }
                if (isThief(unit)) {
                    return true;
                }
                return unit.isEnemyActionTriggered;
            case GameMode.Arena:
            case GameMode.TempestTrials:
            default:
                return true;
        }
    }

    updateTargetInfoTdStyle() {
        let width = (this.map.cellWidth * 6) / 2 + 10;
        this.attackInfoTdStyle = `width: ${width}px;font-size:8px;color:white;`;
    }

    updateExportText() {
        this.exportSettingText = exportSettingsAsString(
            this.exportsAllySettings,
            this.exportsEnemySettings,
            this.exportsOffenceSettings,
            this.exportsDefenceSettings,
            this.exportsMapSettings);
    }

    decompressSettingAutomatically(inputText) {
        let decompressed = LZString.decompressFromUTF16(inputText);
        if (decompressed != null) {
            return decompressed;
        }
        decompressed = LZString.decompressFromBase64(inputText);
        if (decompressed != null) {
            return decompressed;
        }
        decompressed = LZString.decompressFromEncodedURIComponent(inputText);
        if (decompressed != null) {
            return decompressed;
        }
        return inputText;
    }

    decompressSetting(inputText) {
        switch (this.settingCompressMode) {
            case SettingCompressMode.Utf16:
                return LZString.decompressFromUTF16(inputText);
            case SettingCompressMode.Base64:
                return LZString.decompressFromBase64(inputText);
            case SettingCompressMode.Uri:
                return LZString.decompressFromEncodedURIComponent(inputText);
            case SettingCompressMode.None:
            default:
                return inputText;
        }
    }

    compressSetting(inputText) {
        switch (this.settingCompressMode) {
            case SettingCompressMode.Utf16:
                return LZString.compressToUTF16(inputText);
            case SettingCompressMode.Base64:
                return LZString.compressToBase64(inputText);
            case SettingCompressMode.Uri:
                return LZString.compressToEncodedURIComponent(inputText);
            case SettingCompressMode.None:
            default:
                return inputText;
        }
    }

    getSelectedItems() {
        let items = [];
        for (let item of this.enumerateSelectedItems()) {
            items.push(item);
        }
        return items;
    }

    *enumerateSelectedItems(predicatorFunc = null) {
        for (let item of this.enumerateItems()) {
            if (predicatorFunc != null && predicatorFunc(item)) {
                if (item.isSelected) {
                    yield item;
                }
            }
        }
    }

    get isSupportActivationDisabled() {
        return this.currentTurn == 0;
    }

    get maxTurn() {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                {
                    let add = 0;
                    if (this.examinesIsCurrentSeason(SeasonType.Light)) {
                        for (let unit of this.allyUnits) {
                            if (unit.passiveC == PassiveC.MilaNoHaguruma) {
                                ++add;
                            }
                        }
                    }
                    return 7 + add;
                }
            case GameMode.ResonantBattles: return 20;
            case GameMode.Arena: return 20;
            case GameMode.TempestTrials: return 20;
        }
    }

    getLabelOfMap(mapType) {
        for (let option of this.mapKindOptions) {
            if (option.value == mapType) {
                return option.label;
            }
        }
        for (let option of ArenaMapKindOptions) {
            if (option.value == mapType) {
                return option.label;
            }
        }
        return "";
    }

    getDefenceStructures(predicator) {
        let result = [];
        for (let st of this.defenseStructureStorage.objs) {
            if (predicator(st)) {
                result.push(st);
            }
        }
        return result;
    }

    registerTemplateImages() {
        for (let st of this.defenseStructureStorage.objs) {
            if (st instanceof FalseBoltTrap || st instanceof FalseHeavyTrap || st instanceof Ornament) {
                continue;
            }
            this.templateImageFiles.push(st.iconFileName);
        }
        for (let setting of OrnamentSettings) {
            this.templateImageFiles.push(setting.icon);
        }
    }

    isSelected(id) {
        let item = this.findItemById(id);
        if (item == null) {
            return false;
        }
        return item.isSelected;
    }

    selectAddCurrentItem() {
        let currentItem = this.currentItem;
        for (let item of this.enumerateItems()) {
            if (item == currentItem) {
                item.isSelected = true;
                break;
            }
        }
        this.setAttackerAndAttackTargetInfo();
    }

    selectCurrentItem() {
        let currentItem = this.currentItem;
        for (let item of this.enumerateItems()) {
            if (item == currentItem) {
                item.isSelected = true;
            }
            else {
                item.isSelected = false;
            }
        }

        this.setAttackerAndAttackTargetInfo();
    }

    clearCurrentItemSelection() {
        this.currentItemIndex = -1;
    }

    setAttackerAndAttackTargetInfo() {
        let currentUnit = this.currentUnit;
        if (currentUnit != null) {
            if (currentUnit.groupId == UnitGroupType.Ally) {
                this.attackerUnitIndex = this.currentItemIndex;
            }
            else {
                this.attackTargetUnitIndex = this.currentItemIndex;
            }
        }
    }

    examinesIsCurrentSeason(season) {
        for (let currentSeason of this.enumerateCurrentSeasons()) {
            if (season == currentSeason) {
                return true;
            }
        }
        return false;
    }

    *enumerateCurrentSeasons() {
        if (this.isLightSeason) {
            yield SeasonType.Light;
            yield SeasonType.Dark;
        }
        if (this.isAstraSeason) {
            yield SeasonType.Astra;
            yield SeasonType.Anima;
        }
        if (this.isFireSeason) {
            yield SeasonType.Fire;
        }
        if (this.isWaterSeason) {
            yield SeasonType.Water;
        }
        if (this.isEarthSeason) {
            yield SeasonType.Earth;
        }
        if (this.isWindSeason) {
            yield SeasonType.Wind;
        }
    }

    battileItemsToString() {
        if (this.resonantBattleItems.length == 0) {
            return String(ItemType.None);
        }
        let result = "";
        for (let item of this.resonantBattleItems) {
            result += item + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }

    setBattleItemsFromString(value) {
        this.resonantBattleItems = [];
        if (value == null || value == undefined) {
            return;
        }
        if (Number(value) == ItemType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited == "") { continue; }
            let item = Number(splited);
            if (Number.isInteger(item)) {
                this.resonantBattleItems.push(item);
            }
        }
    }

    perTurnStatusToString() {
        return this.currentTurnType
            + ValueDelimiter + boolToInt(this.isEnemyActionTriggered)
            + ValueDelimiter + this.currentTurn
            + ValueDelimiter + this.battileItemsToString()
            ;
    }

    turnWideStatusToString() {
        return this.mapKind
            + ValueDelimiter + boolToInt(this.isLightSeason)
            + ValueDelimiter + boolToInt(this.isAstraSeason)
            + ValueDelimiter + boolToInt(this.isFireSeason)
            + ValueDelimiter + boolToInt(this.isWaterSeason)
            + ValueDelimiter + boolToInt(this.isWindSeason)
            + ValueDelimiter + boolToInt(this.isEarthSeason)
            + ValueDelimiter + this.settingCompressMode
            + ValueDelimiter + this.gameMode
            + ValueDelimiter + this.resonantBattleInterval
            ;
    }

    fromPerTurnStatusString(value) {
        var splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.currentTurnType = Number(splited[i]); ++i; }
        this.isEnemyActionTriggered = intToBool(Number(splited[i])); ++i;
        if (Number.isInteger(Number(splited[i]))) { this.currentTurn = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.setBattleItemsFromString(splited[i]); ++i; }
    }

    fromTurnWideStatusString(value) {
        var splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.mapKind = Number(splited[i]); ++i; }
        this.isLightSeason = intToBool(Number(splited[i])); ++i;
        this.isAstraSeason = intToBool(Number(splited[i])); ++i;
        this.isFireSeason = intToBool(Number(splited[i])); ++i;
        this.isWaterSeason = intToBool(Number(splited[i])); ++i;
        this.isWindSeason = intToBool(Number(splited[i])); ++i;
        this.isEarthSeason = intToBool(Number(splited[i])); ++i;
        if (Number.isInteger(Number(splited[i]))) { this.settingCompressMode = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.gameMode = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resonantBattleInterval = Number(splited[i]); ++i; }


        this.setPropertiesForCurrentGameMode();
        this.updateEnemyAndAllyUnits();
    }

    setPropertiesForCurrentGameMode() {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                this.map.isBackgroundImageEnabled = true;
                this.showAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            case GameMode.Arena:
                this.map.isBackgroundImageEnabled = true;
                this.hideAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            case GameMode.ResonantBattles:
                this.map.isBackgroundImageEnabled = false;
                this.hideAetherRaidManu();
                this.map.setMapSizeToLarge();
                break;
            case GameMode.TempestTrials:
                this.map.isBackgroundImageEnabled = false;
                this.hideAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            default:
                break;
        }
    }

    sortUnitsBySlotOrder() {
        this.enemyUnits.sort(function (a, b) {
            return a.slotOrder - b.slotOrder;
        });
        this.allyUnits.sort(function (a, b) {
            return a.slotOrder - b.slotOrder;
        });
    }

    resetCurrentAetherRaidDefensePreset() {
        if (this.isAstraSeason) {
            this.aetherRaidDefensePreset = AetherRaidDefensePresetOptions_AnimaSeason[0].id;
        }
        else {
            this.aetherRaidDefensePreset = AetherRaidDefensePresetOptions_DarkSeason[0].id;
        }

        this.updateAetherRaidDefensePresetDescription();
    }

    updateAetherRaidDefensePresetDescription() {
        let preset = findAetherRaidDefensePreset(this.aetherRaidDefensePreset);
        if (preset == null) {
            return;
        }

        this.aetherRaidDefensePresetDescription = preset.getProviderHtml();
    }

    get currentUnit() {
        if (this.currentItemIndex < 0 || this.units.length <= this.currentItemIndex) {
            return null;
        }

        return this.units[this.currentItemIndex];
    }

    get currentStructure() {
        let item = this.currentItem;
        if (item instanceof StructureBase) {
            return item;
        }
        return null;
    }

    get currentItem() {
        return this.findItem(this.currentItemIndex);
    }

    hideAetherRaidManu() {
        this.aetherRaidMenuStyle = "display:none;";
    }
    showAetherRaidManu() {
        this.aetherRaidMenuStyle = "";
    }

    hideDebugMenu() {
        this.debugMenuStyle = "display:none;";
        // this.debugMenuStyle = "visibility: collapse;";
    }
    showDebugMenu() {
        this.debugMenuStyle = "";
    }
    applyDebugMenuVisibility() {
        if (this.isDebugMenuEnabled) {
            this.showDebugMenu();
        }
        else {
            this.hideDebugMenu();
        }
    }

    findDefenseFortress() {
        for (let st of this.defenseStructureStorage.objs) {
            if (st instanceof DefFortress) {
                return st;
            }
        }
        return null;
    }

    findOffenceFortress() {
        for (let st of this.offenceStructureStorage.objs) {
            if (st instanceof OfFortress) {
                return st;
            }
        }
        return null;
    }

    createStructures() {
        this.registerDefenceStructure(new DefFortress(g_idGenerator.generate()));
        this.registerDefenceStructure(new AetherFountain(g_idGenerator.generate()));
        this.registerDefenceStructure(new AetherAmphorae(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefBoltTower(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefTacticsRoom(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefHealingTower(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefPanicManor(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefCatapult(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefInfantrySchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefArmorSchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefCavalrySchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefFlierSchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new FalseBoltTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new BoltTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new FalseHeavyTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new HeavyTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfFortress(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfBoltTower(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfTacticsRoom(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfHealingTower(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfPanicManor(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfCatapult(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfInfantrySchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfArmorSchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfCavalrySchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfFlierSchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new ExcapeLadder(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfBrightShrine(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfDarkShrine(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefBrightShrine(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefDarkShrine(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfHiyokuNoHisyo(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefHiyokuNoTorikago(g_idGenerator.generate()));
        // this.registerDefenceStructure(new BoltTrap(g_idGenerator.generate()));
        // this.registerDefenceStructure(new HeavyTrap(g_idGenerator.generate()));
    }

    registerDefenceStructure(structure) {
        this.defenseStructureStorage.register(structure);
        g_deffenceStructureContainer.addStructure(structure);
    }
    registerOffenceStructure(structure) {
        this.offenceStructureStorage.register(structure);
        g_offenceStructureContainer.addStructure(structure);
    }

    addStructuresToSelectionOptions() {
        for (let structure of this.offenceStructureStorage.objs) {
            let newId = this.selectionOptions[this.selectionOptions.length - 1].id + 1;
            this.selectionOptions.push({ id: newId, text: "攻撃施設" + structure.id });
        }
        for (let structure of this.defenseStructureStorage.objs) {
            let newId = this.selectionOptions[this.selectionOptions.length - 1].id + 1;
            this.selectionOptions.push({ id: newId, text: "防衛施設" + structure.id });
        }
    }

    findItem(itemIndex) {
        let index = 0;
        for (let i = 0; i < this.units.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.units[i];
            }
        }
        for (let i = 0; i < this.offenceStructureStorage.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.offenceStructureStorage.objs[i];
            }
        }
        for (let i = 0; i < this.defenseStructureStorage.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.defenseStructureStorage.objs[i];
            }
        }
        for (let i = 0; i < this.map._tiles.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.map._tiles[i];
            }
        }
        return null;
    }

    findUnitById(id) {
        for (let unit of this.enumerateUnits()) {
            if (unit.id == id) {
                return unit;
            }
        }
        return null;
    }

    findItemById(id) {
        for (let item of this.enumerateItems()) {
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }

    *enumerateUnits() {
        for (let unit of this.enumerateEnemyUnits()) {
            yield unit;
        }
        for (let unit of this.enumerateAllyUnits()) {
            yield unit;
        }
    }

    enumerateAllEnemyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Enemy, 1000);
    }
    enumerateAllAllyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Ally, 1000);
    }

    enumerateAllyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Ally, this.getAllyCount());
    }

    enumerateEnemyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Enemy, this.getEnemyCount());
    }

    * enumerateUnitsInSpecifiedGroup(groupId) {
        switch (groupId) {
            case UnitGroupType.Enemy:
                for (let unit of this.enumerateEnemyUnits()) {
                    yield unit;
                }
                break;
            case UnitGroupType.Ally:
                for (let unit of this.enumerateAllyUnits()) {
                    yield unit;
                }
                break;
        }
    }
    * enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetUnit.groupId)) {
            if (withTargetUnit || unit != targetUnit) {
                yield unit;
            }
        }
    }

    findEnemyUnitBySlotOrder(slotOrder) {
        for (let unit of this.enumerateEnemyUnits()) {
            if (unit.slotOrder == slotOrder) {
                return unit;
            }
        }
        return null;
    }

    *__enumerateUnitsForSpecifiedGroup(groupId, groupUnitMaxCount) {
        let maxCount = groupUnitMaxCount;
        let count = 0;
        for (let unit of this.units) {
            if (unit.groupId != groupId) {
                continue;
            }

            yield unit;
            ++count;
            if (count == maxCount) {
                return;
            }
        }
    }

    getEnemyCount() {
        switch (this.gameMode) {
            case GameMode.AetherRaid: return 6;
            case GameMode.Arena: return 4;
            case GameMode.ResonantBattles: return 12;
            case GameMode.TempestTrials: return 6;
        }
    }
    getAllyCount() {
        switch (this.gameMode) {
            case GameMode.AetherRaid: return 5;
            case GameMode.Arena: return 4;
            case GameMode.ResonantBattles: return 4;
            case GameMode.TempestTrials: return 4;
        }
    }

    *enumerateItems() {
        for (let unit of this.enumerateUnits()) {
            yield unit;
        }
        for (let st of this.offenceStructureStorage.objs) {
            yield st;
        }
        for (let st of this.defenseStructureStorage.objs) {
            yield st;
        }
    }

    findIndexOfItem(id) {
        let index = 0;
        for (let i = 0; i < this.units.length; ++i, ++index) {
            let unit = this.units[i];
            if (unit.id == id) {
                return index;
            }
        }
        for (let i = 0; i < this.offenceStructureStorage.length; ++i, ++index) {
            let st = this.offenceStructureStorage.objs[i];
            if (st.id == id) {
                return index;
            }
        }
        for (let i = 0; i < this.defenseStructureStorage.length; ++i, ++index) {
            let st = this.defenseStructureStorage.objs[i];
            if (st.id == id) {
                return index;
            }
        }
        for (let i = 0; i < this.map._tiles.length; ++i, ++index) {
            let tile = this.map._tiles[i];
            if (tile.id == id) {
                return index;
            }
        }
        return -1;
    }

    clearReservedSkillsForAllUnits() {
        for (let unit of this.units) {
            unit.clearReservedSkills();
        }
    }
}
