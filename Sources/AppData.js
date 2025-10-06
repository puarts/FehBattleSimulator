/// @file
/// @brief AppData クラスとそれに関連するクラスや関数等の定義です。

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


// 選択モード
const SelectMode = {
    Normal: 0,
    Tile: 1, // タイル編集用
};
const SelectModeOptions = [
    { text: "通常", id: SelectMode.Normal },
    { text: "地形編集", id: SelectMode.Tile },
];

const PawnsOfLokiDifficality = {
    Begginer: 0,
    Intermediate: 1,
    Advanced: 2,
};

const PawnsOfLokiDifficalityOptions = [
    { text: "初級", id: PawnsOfLokiDifficality.Begginer },
    { text: "中級", id: PawnsOfLokiDifficality.Intermediate },
    { text: "上級", id: PawnsOfLokiDifficality.Advanced },
];

function getPawnsOfLokiDifficalityScore(difficality) {
    switch (difficality) {
        case PawnsOfLokiDifficality.Begginer: return 215;
        case PawnsOfLokiDifficality.Intermediate: return 315;
        case PawnsOfLokiDifficality.Advanced: return 415;
        default: throw new Error("unexpected defficality");
    }
}


/// シミュレーターの持つデータです。
class AppData extends UnitManager {
    constructor() {
        super();
        this.gameMode = GameMode.AetherRaid;
        this.gameModeOptions = [
            { label: "飛空城", value: GameMode.AetherRaid },
            { label: "闘技場", value: GameMode.Arena },
            // { label: "フレンドダブル", value: GameMode.AllegianceBattles },
            { label: "双界を越えて", value: GameMode.ResonantBattles },
            { label: "戦渦の連戦", value: GameMode.TempestTrials },
            { label: "ロキの盤上遊戯", value: GameMode.PawnsOfLoki },
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
            { label: "夢の国の城", value: MapType.DreamCastle },
            { label: "悪夢の国の城", value: MapType.NightmareCastle },
            { label: "死の国の城", value: MapType.K0013 },
            { label: "小人の国の城", value: MapType.K0014 },
            { label: "巨人の国の城", value: MapType.K0015 },
            { label: "開かれし国の城", value: MapType.K0016 },
            { label: "閉ざされし国の城", value: MapType.K0017 },
            { label: "光の国の城", value: MapType.K0018 },
        ];
        this.aetherRaidMenuStyle = "";

        this.settings = new SettingManager(this);
        this.audioManager = new AudioManager();

        /** @type {GlobalBattleContext} */
        this.globalBattleContext = new GlobalBattleContext();

        // 査定
        this.arenaScore = 0;
        this.primeArenaScore = 0;
        this.arenaScoreForEnemy = 0;
        this.primeArenaScoreForEnemy = 0;

        this.aetherRaidDefenseLiftLoss = 0; // 飛空城防衛失敗レート

        // 双界
        this.resonantBattleInterval = 1; // 双位
        this.resonantBattleItems = [];

        // シリアライズ設定
        this.settingCompressMode = SettingCompressMode.None;
        this.settingCompressModeOptions = [
            { id: SettingCompressMode.None, text: "未圧縮" },
            // { id: SettingCompressMode.Utf16, text: "UTF-16形式" },
            { id: SettingCompressMode.Base64, text: "Base64形式" },
            { id: SettingCompressMode.Uri, text: "URIで使用可能な形式" },
        ];
        this.exportSettingText = "";
        this.exportSettingUrl = "";
        this.exportsEnemySettings = true;
        this.exportsAllySettings = true;
        this.exportsDefenceSettings = true;
        this.exportsOffenceSettings = true;
        this.exportsMapSettings = true;

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

        // 偶像の天楼のスキルシミュレーター用
        this.hallOfFormsSkillSimWeapon = Weapon.None;
        this.hallOfFormsSkillSimSupport = Support.None;
        this.hallOfFormsSkillSimSpecial = Special.None;
        this.hallOfFormsSkillSimPassiveA = PassiveA.None;
        this.hallOfFormsSkillSimPassiveB = PassiveB.None;
        this.hallOfFormsSkillSimPassiveC = PassiveC.None;
        this.hallOfFormsSkillSimPassiveS = PassiveS.None;
        this.hallOfFormsSkillSimPassiveX = PassiveX.None;

        // ロキの盤上遊戯の設定
        this.pawnsOfLokiTotalScore = 0;
        this.pawnsOfLokiDifficality = PawnsOfLokiDifficality.Advanced;
        this.pawnsOfLokiMaxWeaponTypeBonusA = 0;
        this.pawnsOfLokiMaxWeaponTypeBonusB = 0;
        this.pawnsOfLokiMaxMoveTypeBonus = 0;
        this.pawnsOfLokiMaxMoveTypePairBonus = 0;
        this.pawnsOfLokiTurnCount = 12;
        this.pawnsOfLokiWarFunds = 0;
        this.pawnsOfLokiRank = 10;
        this.pawnsOfLokiMaxComboPatternCount = 0;

        // その他の設定

        this.rbEnemySettingInputHp = 0;
        this.rbEnemySettingInputAtk = 0;
        this.rbEnemySettingInputSpd = 0;
        this.rbEnemySettingInputDef = 0;
        this.rbEnemySettingInputRes = 0;

        this.selectMode = SelectMode.Normal;

        // 耐久、殲滅力テスト
        this.durabilityTestAllyUnitId = "";
        this.durabilityTestEnemyUnitId = "";
        this.durabilityTestLog = "結果がここに表示されます";
        this.durabilityTestChargesSpecialCount = false;
        this.durabilityTestDefaultSpecial = Special.None;
        this.durabilityTestCalcPotentialDamage = false;
        this.durabilityTestBattleCount = 1;
        this.durabilityTestIsAllyUnitOffence = false;
        this.durabilityTestHealsHpFull = true;
        this.durabilityTestLogDamageCalcDetailIfLose = false;
        this.durabilityTestIsLogEnabled = true;
        this.durabilityTestEquipAllDistCounter = false;
        this.durabilityTestAppliesSkillsForBeginningOfTurn = false;

        // 飛空城防衛、攻撃プリセット
        this.aetherRaidDefensePreset = 0;
        this.aetherRaidDefensePresetDescription = "";
        this.resetCurrentAetherRaidDefensePreset();
        this.aetherRaidOffensePresetIndex = 0;

        // その他
        this.changesBgmRandomly = true;
        this.showMovableRangeWhenMovingUnit = true;
        this.showDivineVeinImageWithoutBreakable = true;
        this.changeEnemyIceColor = LocalStorageUtil.getBoolean('change_enemy_ice_color', false);
        this.divineVeinOpacities =
            Object.fromEntries(
                Object.values(DivineVeinType)
                    .filter(v => v !== DivineVeinType.None)      // None を除外
                    .map(v => [v, 1])                            // 各キーを 1 で初期化
            );
        this.enableDivineVeinTransparency = false;

        this.isEnemyActionTriggered = true;
        this.isAutoLoadTurnSettingEnabled = false;
        this.simulatesEnemyActionOneByOne = true;
        this.isCommandUndoable = true;
        this.autoChangeDetail = true;
        this.currentItemIndex = -1;
        this.attackerUnitIndex = 6;
        this.attackTargetUnitIndex = 0;
        this.attackerUnitId = null;
        this.attackTargetUnitId = null;
        this.attackerInfo = "";
        this.attackTargetInfo = "";
        this.damageCalcLog = "";
        this.simpleLog = "";
        this.isPotentialDamageDetailEnabled = false;

        this.enableAllSkillOptions = false; // スキルを継承可能なものだけに制限しない
        this.disableLowRankSkillOptions = false; // 下位スキルを表示する

        this.simulatorLogLevel = LocalStorageUtil.getNumber('simulatorLogLevel', LoggerBase.LogLevel.INFO);
        this.simulatorLogLevelOption = ObjectUtil.makeOptionFromObj(LoggerBase.LogLevel);

        this.damageCalcLogger = new HtmlLogger();
        this.damageCalcLogger.logLevel = this.simulatorLogLevel;
        this.beginningOfTurnSkillHanderLogger = new HtmlLogger();
        this.beginningOfTurnSkillHanderLogger.logLevel = this.simulatorLogLevel;

        this.isDebugMenuEnabled = LocalStorageUtil.getBoolean('isDebugMenuEnabled', DebugModeDefault);
        this.isDevelopmentMode = LocalStorageUtil.getNumber('isDevelopmentMode', 0) === 1;
        this.debugMenuStyle = "";
        this.attackInfoTdStyle = "";
        this.isSummonerDualCalcEnabled = false;

        this.skillLogLevel = LocalStorageUtil.getNumber('skillLogLevel', LoggerBase.LogLevel.OFF);
        this.skillLogLevelOption = ObjectUtil.makeOptionFromObj(LoggerBase.LogLevel);

        this.showsSkillLogs = LocalStorageUtil.getBoolean('showsSkillLogs');
        this.damageCalcDetailLevel = LocalStorageUtil.getNumber('damageCalcDetailLevel', DetailLevel.NORMAL);

        /**
         * ダブル補正が有効かどうか
         * @type {Boolean}
         */
        this.isPairUpBoostsEnabled = false;

        this.isDisplayingMapMessage = false;

        /**
         * ユニットコピー用の一時変数
         * @type {String}
         */
        this.copiedUnitString = "";
        this.originalUnitStringForLoading = "";

        /** @type {Unit[]} */
        this.enemyUnits = [];
        /** @type {Unit[]} */
        this.allyUnits = [];
        this.updateEnemyAndAllyUnits();

        this.durabilityTestAllyUnitId = this.allyUnits[0].id;
        this.durabilityTestEnemyUnitId = this.enemyUnits[0].id;

        this.heroOptions = [
            { id: -1, text: "なし" },
        ];
        this.emblemHeroOptions = [
            { id: EmblemHero.None, text: "なし" },
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
        this.summonerLevelOptions = [...SummonerLevelOptions];
        this.partnerLevelOptions = [
            { id: PartnerLevel.None, text: "なし" },
            { id: PartnerLevel.C, text: "C" },
            { id: PartnerLevel.B, text: "B" },
            { id: PartnerLevel.A, text: "A" },
            { id: PartnerLevel.S, text: "S" },
            { id: PartnerLevel.SPlus, text: "S+" },
        ];
        this.entwinedOptions = [...EntwinedOptions];
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
        this.passiveXOptions = [
            { id: -1, text: "なし" }
        ];
        this.captainOptions = [
            { id: -1, text: "なし" }
        ];
        this.additionalPassiveOptions = [
            {id: -2, text: "-- 追加スキルを選択 --", disabled: true},
            {id: -1, text: "なし"}
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

        this.templateEngageSpecialIconFiles =
            Object.entries(EngagedSpecialIcon).map(([key, value]) => {
                return {id: key, fileName: value.split('/').pop()};
            }).filter(x => Number(x.id) !== EmblemHero.None);

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
        this.passiveXCount = 0;
        this.passiveXImplCount = 0;
        this.commandQueuePerAction = new CommandQueue(100);
        this.commandQueue = new CommandQueue(100);

        /** @type {HeroDatabase} */
        this.heroInfos = null;
        this.skillDatabase = new SkillDatabase();

        {
            // 生成順を変えるとIDが変わってしまうので注意
            /** @type {ObjectStorage} */
            this.defenseStructureStorage = new ObjectStorage(g_idGenerator.generate());

            /** @type {ObjectStorage} */
            this.offenceStructureStorage = new ObjectStorage(g_idGenerator.generate());
            this.createStructures();

            /** @type {BattleMap} */
            this.map = new BattleMap(g_idGenerator.generate(), g_idGenerator);
            this.map.isExpansionUnitFunc = x => {
                return this.isSpecialSlotUnit(x);
            };
            this.syncMapKind();
        }

        this.flashMessages = [];
        /** @type {CombatResult|null} */
        this.combatResult = null;

        this.addStructuresToSelectionOptions();
        this.registerTemplateImages();
        this.applyDebugMenuVisibility();
        this.updateTargetInfoTdStyle();
    }

    loadUnit(unitObj) {
        const currentUnit = this.currentUnit;
        if (currentUnit == null || unitObj.data === "") {
            return;
        }
        this.currentUnit.fromTurnWideStatusString(unitObj.data);
        this.initializeByHeroInfo(currentUnit, currentUnit.heroIndex, false, true);
        // this.currentUnit.reserveCurrentSkills();
        // this.currentUnit.restoreReservedSkills();
        this.updateSlotOrders();
    }
    storeUnit() {
        const currentUnit = this.currentUnit;
        if (currentUnit == null) {
            return;
        }
        const editTargetUnit = currentUnit.isEditingPairUpUnit ? currentUnit.pairUpUnit : currentUnit;
        this.originalUnitStringForLoading = editTargetUnit.turnWideStatusToString();
    }
    restoreUnit() {
        const currentUnit = this.currentUnit;
        if (currentUnit == null || this.originalUnitStringForLoading === "") {
            return;
        }
        this.currentUnit.fromTurnWideStatusString(this.originalUnitStringForLoading);
        this.initializeByHeroInfo(currentUnit, currentUnit.heroIndex, false, true);
        this.currentUnit.reserveCurrentSkills();
        this.currentUnit.restoreReservedSkills();
        this.updateSlotOrders();
    }
    copyCurrentUnit() {
        const currentUnit = this.currentUnit;
        if (currentUnit == null) {
            return;
        }
        const editTargetUnit = currentUnit.isEditingPairUpUnit ? currentUnit.pairUpUnit : currentUnit;
        this.copiedUnitString = editTargetUnit.turnWideStatusToString();
    }
    pasteToCurrentUnit() {
        const currentUnit = this.currentUnit;
        if (currentUnit == null || this.copiedUnitString === "") {
            return;
        }

        this.currentUnit.fromTurnWideStatusString(this.copiedUnitString);
        this.initializeByHeroInfo(currentUnit, currentUnit.heroIndex, false, true);
        this.currentUnit.reserveCurrentSkills();
        this.updateSlotOrders();
    }

    resetBattleMapPlacement(withUnits = false) {
        resetBattleMapPlacement(this.map, this.map._type, withUnits);
    }

    setMapKind(mapKind) {
        this.mapKind = mapKind;
        changeMapKind(this.map, mapKind);
    }

    syncMapKind() {
        this.setMapKind(this.mapKind);
    }

    setAllSeasonEnabled() {
        this.globalBattleContext.isLightSeason = true;
        this.globalBattleContext.isAstraSeason = true;
        this.globalBattleContext.isFireSeason = true;
        this.globalBattleContext.isEarthSeason = true;
        this.globalBattleContext.isWindSeason = true;
        this.globalBattleContext.isWaterSeason = true;
    }

    findAllyCaptain() {
        return this.allyUnits.find(x => x.isCaptain);
    }
    findEnemyCaptain() {
        return this.enemyUnits.find(x => x.isCaptain);
    }

    getEnemyExpansionUnitOnMap() {
        if (this.gameMode !== GameMode.AetherRaid) {
            return null;
        }

        let lastSlotIndex = this.enemyUnits.length - 2;
        for (let unit of this.enemyUnits) {
            if (unit.isOnMap && unit.slotOrder === lastSlotIndex) {
                return unit;
            }
        }

        return null;
    }

    getReinforcementSlotUnit(groupType) {
        if (this.gameMode !== GameMode.AetherRaid) {
            return null;
        }

        let units = groupType === UnitGroupType.Ally ? this.allyUnits : this.enemyUnits;
        for (let unit of units) {
            if (this.isReinforcementSlotUnit(unit)) {
                return unit;
            }
        }

        return null;
    }

    getReinforcementSlotUnitOnTrash(groupType) {
        if (this.gameMode !== GameMode.AetherRaid) {
            return null;
        }

        let units = groupType === UnitGroupType.Ally ? this.allyUnits : this.enemyUnits;
        for (let unit of units) {
            if (!unit.isOnMap && this.isReinforcementSlotUnit(unit)) {
                return unit;
            }
        }

        return null;
    }

    isSpecialSlotUnit(unit) {
        if (this.gameMode !== GameMode.AetherRaid) {
            return false;
        }

        let slot = unit.groupId === UnitGroupType.Enemy ?
            this.enemyUnits.length - 2 :
            this.allyUnits.length - 2;
        return unit.slotOrder === slot;
    }

    isReinforcementSlotUnit(unit) {
        if (this.gameMode !== GameMode.AetherRaid) {
            return false;
        }

        let slot = unit.groupId === UnitGroupType.Enemy ?
            this.enemyUnits.length - 1 :
            this.allyUnits.length - 1;
        return unit.slotOrder === slot;
    }

    setPawnsOfLokiTurnCountByRank() {
        this.pawnsOfLokiTurnCount = this.__getPawnsOfLokiTurnCountOfRank();
    }

    __getPawnsOfLokiTurnCountOfRank() {
        switch (this.pawnsOfLokiRank) {
            case 1:
            case 2: // 不明
            case 3: // 不明
                return 9;
            case 4:
            case 5:
            case 6:
                return 10;
            case 7: // 不明
            case 8:
                return 11;
            case 9:
            case 10:
                return 12;

        }
    }

    getPawnsOfLokiDifficalityScore() {
        return getPawnsOfLokiDifficalityScore(this.pawnsOfLokiDifficality);
    }
    get totalSkillCount() {
        return this.weaponCount
            + this.supportCount
            + this.specialCount
            + this.passiveACount
            + this.passiveBCount
            + this.passiveCCount
            + this.passiveSCount
            + this.passiveXCount;
    }
    get totalImplementedSkillCount() {
        return this.weaponImplCount
            + this.supportImplCount
            + this.specialImplCount
            + this.passiveAImplCount
            + this.passiveBImplCount
            + this.passiveCImplCount
            + this.passiveSImplCount
            + this.passiveXImplCount;
    }
    /**
     * @param  {HeroInfo[]} heroInfos
     * @param  {Boolean} registersSkillOption=true
     */
    initHeroInfos(
        heroInfos,
        registersSkillOption = true
    ) {
        this.heroInfos = new HeroDatabase(heroInfos);
        for (let i = 0; i < heroInfos.length; ++i) {
            let heroInfo = heroInfos[i];
            this.heroOptions.push({ id: i, text: heroInfo.name });
            if (EMBLEM_HERO_SET.has(i)) {
                this.emblemHeroOptions.push({ id: i, text: heroInfo.name });
            }
            if (registersSkillOption) {
                this.registerSkillInfos(heroInfo);
            }
        }
        if (this.isDevelopmentMode) {
            this.emblemHeroOptions.push({ id: EmblemHero.Debug, text: "紋章士デバッグ" });
        }
    }
    /**
     * @param  {HeroInfo} heroInfo
     */
    registerSkillInfos(heroInfo) {
        if (heroInfo.isSkillOptionRegistered()) {
            return;
        }

        heroInfo.registerWeaponOptions(this.weaponInfos);
        heroInfo.registerSupportOptions(this.supportInfos);
        heroInfo.registerSpecialOptions(this.specialInfos);
        heroInfo.registerPassiveAOptions(this.passiveAInfos);
        heroInfo.registerPassiveBOptions(this.passiveBInfos);
        heroInfo.registerPassiveCOptions(this.passiveCInfos);
        heroInfo.registerPassiveSOptions(this.passiveAInfos, this.passiveBInfos, this.passiveCInfos, this.passiveSInfos);
        heroInfo.registerPassiveXOptions(this.passiveXInfos);
    }

    registerSkillOptions(
        weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs, captainSkills = []
    ) {
        this.skillDatabase.registerSkillOptions(
            weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs, captainSkills);

        __registerSkillOptions(this.weaponOptions, weapons);
        __registerSkillOptions(this.supportOptions, supports);
        __registerSkillOptions(this.specialOptions, specials);
        __registerSkillOptions(this.passiveAOptions, passiveAs);
        __registerSkillOptions(this.passiveBOptions, passiveBs);
        __registerSkillOptions(this.passiveCOptions, passiveCs);
        __registerSkillOptions(this.passiveSOptions, passiveSs);
        __registerSkillOptions(this.passiveXOptions, passiveXs);
        __registerSkillOptions(this.captainOptions, captainSkills);
        __registerPassiveSOptions(this.passiveSOptions, passiveAs);
        __registerPassiveSOptions(this.passiveSOptions, passiveBs);
        __registerPassiveSOptions(this.passiveSOptions, passiveCs);
        __registerSkillOptions(this.additionalPassiveOptions, weapons);
        __registerSkillOptions(this.additionalPassiveOptions, specials);
        __registerSkillOptions(this.additionalPassiveOptions, passiveAs);
        __registerSkillOptions(this.additionalPassiveOptions, passiveBs);
        __registerSkillOptions(this.additionalPassiveOptions, passiveCs);
        __registerSkillOptions(this.additionalPassiveOptions, passiveSs);
        __registerSkillOptions(this.additionalPassiveOptions, passiveXs);
        __registerSkillOptions(this.additionalPassiveOptions, captainSkills);
    }
    /**
     * @param  {Unit} unit
     */
    __updateUnitSkillInfo(unit) {
        this.skillDatabase.updateUnitSkillInfo(unit);
    }
    /**
     * @param  {} id
     * @returns {SkillInfo}
     */
    findSkillInfoByDict(id) {
        return this.skillDatabase.findSkillInfoByDict(id);
    }
    findSkillInfoByName(name) {
        return this.skillDatabase.findSkillInfoByName(name);
    }

    get weaponInfos() {
        return this.skillDatabase.weaponInfos;
    }
    get supportInfos() {
        return this.skillDatabase.supportInfos;
    }
    get specialInfos() {
        return this.skillDatabase.specialInfos;
    }
    get passiveAInfos() {
        return this.skillDatabase.passiveAInfos;
    }
    get passiveBInfos() {
        return this.skillDatabase.passiveBInfos;
    }
    get passiveCInfos() {
        return this.skillDatabase.passiveCInfos;
    }
    get passiveSInfos() {
        return this.skillDatabase.passiveSInfos;
    }
    get passiveXInfos() {
        return this.skillDatabase.passiveXInfos;
    }
    get captainInfos() {
        return this.skillDatabase.captainInfos;
    }

    __findWeaponInfo(id) {
        return this.findSkillInfoByDict(id);
    }

    __findSupportInfo(id) {
        return this.findSkillInfoByDict(id);
    }

    __findSpecialInfo(id) {
        return this.findSkillInfoByDict(id);
    }

    __findPassiveAInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveBInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveCInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveSInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveXInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __showStatusToAttackerInfo() {
        function getInfo(unit) {
            if (!unit) {
                return '';
            }

            // Divine vein
            let tag = getSpecialChargedImgTag();
            tag.classList.add('summary-grid-item', 'summary-label');
            let divineVein = unit.placedTile?.divineVein ?? DivineVeinType.None;
            let divineVeinGroup = unit.placedTile?.divineVeinGroup ?? null;
            let divineVeinTurns = unit.placedTile?.divineVeinTurns ?? 0;
            let turns = '';
            if (divineVeinGroup !== null && unit.placedTile?.hasDivineVein()) {
                let bgClass = `summary-divine-vein-bg-${divineVeinGroup === UnitGroupType.Ally ? 'ally' : 'enemy'}`;
                turns = `<span class="summary-divine-vein-turn ${bgClass}">&nbsp;${divineVeinTurns}&nbsp;</span>`;
            }

            // Skill icons
            let skillIconsDivTag = getSkillIconDivTag(unit);
            skillIconsDivTag.classList.add('summary-icons');

            // Status effects
            let maxDisplaySize = 5;

            let positiveStatusEffects = unit.getPositiveStatusEffects();
            let positiveTags =
                positiveStatusEffects.slice(0, maxDisplaySize).reduce((acc, val) => acc + getStatsEffectImgTagStr(val), '');

            let negativeStatusEffects = unit.getNegativeStatusEffectsOrderedByNeutralizationPriority();
            let negativeTags =
                negativeStatusEffects.slice(0, maxDisplaySize).reduce((acc, val) => acc + getStatsEffectImgTagStr(val), '');

            let info = `<div class="summary-grid-container summary-text-shadow">
                <div class="summary-grid-item summary-label divine-vein">
                    <a href="${getDivineVeinPath(divineVein)}" title="${getDivineVeinTitle(divineVein)}" target="_blank" class="summary-icon-big">
                        ${getDivineVeinTag(divineVein).outerHTML}
                    </a>
                    ${turns}
                </div>
                <div class="summary-grid-item summary-label hp">
                  ${statsLabel(unit, StatusType.Hp)}&nbsp;&nbsp;<span class="summary-figure">${unit.hp} / ${unit.maxHpWithSkills} (${Math.trunc(unit.restHpPercentageAtBeginningOfTurn)}%)</span>
                </div>
                <div class="summary-grid-item summary-label atk">
                  ${statsLabel(unit, StatusType.Atk)}&nbsp;<span class="summary-figure">${statString(unit, StatusIndex.ATK)}</span>
                </div>
                <div class="summary-grid-item summary-label spd">
                  ${statsLabel(unit, StatusType.Spd)}&nbsp;<span class="summary-figure">${statString(unit, StatusIndex.SPD)}</span>
                </div>
                <div class="summary-grid-item summary-label def">
                  ${statsLabel(unit, StatusType.Def)}&nbsp;<span class="summary-figure">${statString(unit, StatusIndex.DEF)}</span>
                </div>
                <div class="summary-grid-item summary-label res">
                  ${statsLabel(unit, StatusType.Res)}&nbsp;<span class="summary-figure">${statString(unit, StatusIndex.RES)}</span>
                </div>
                <div class="summary-grid-item summary-label level">
                    LV.${unit.level}
                </div>
                <div class="summary-grid-item icons">
                    ${skillIconsDivTag.outerHTML}
                </div>
                <div class="summary-grid-item summary-label positive">
                    <span class="status-effect">【有利】${positiveStatusEffects.length}個:&nbsp;</span>
                    ${positiveTags}${positiveStatusEffects.length > maxDisplaySize ? '...' : ''}
                </div>
                <div class="summary-grid-item summary-label negative">
                    <span class="status-effect">【不利】${negativeStatusEffects.length}個:&nbsp;</span>
                    ${negativeTags}${negativeStatusEffects.length > maxDisplaySize ? '...' : ''}
                </div>
            </div>`;
            return info;
        }

        function statsLabel(unit, statusType) {
            let labels = ['HP', '攻', '速', '守', '魔'];
            let fontClass = '';
            if (unit.isAsset(statusType)) {
                fontClass = 'summary-positive-stats';
            } else if (unit.isFlaw(statusType)) {
                fontClass = 'summary-negative-stats';
            }
            return `<span class="${fontClass}">${labels[statusType]}</span>`;
        }

        function statString(unit, index) {
            let status = unit.getStatusesInPrecombat()[index];
            // 表示領域が少ないので非表示
            // let statusWithSkills = unit.getStatusesWithSkills()[index];
            let greatTalent = unit.getGreatTalents()[index];
            let buff = unit.getBuffs(true)[index];
            let debuff = unit.getDebuffs()[index];
            // return `<span style="font-weight: bolder">${status}</span>:<span style="color: white">${statusWithSkills}+${greatTalent}</span>${getIncHtml(buff)}${getIncHtml(debuff)}`;
            let isPositive = buff + debuff > 0;
            let isNegative = buff + debuff < 0;
            let figureClass = '';
            if (isPositive) {
                figureClass = 'summary-positive-stats';
            } else if (isNegative) {
                figureClass = 'summary-negative-stats';
            }
            return `<span>
            <span class="${figureClass}" style="font-weight: bolder">${status}</span> <span class="buff-or-debuff">(<span style="color: white">+${greatTalent}</span>${getIncHtml(buff)}${getIncHtml(debuff)})</span>
            </span>`;
        }

        this.attackerInfo = getInfo(this.attackerUnit);
        this.attackTargetInfo = getInfo(this.attackTargetUnit);
        return [this.attackTargetInfo, this.attackTargetInfo];
    }

    __updateStatusBySkillsAndMergeForAllHeroes(updatesPureGrowthRate = false) {
        for (let unit of this.enumerateUnits()) {
            if (unit.heroInfo == null) {
                this.initializeByHeroInfo(unit, unit.heroIndex);
            }
            this.__updateStatusBySkillsAndMerges(unit, updatesPureGrowthRate);
        }
    }

    /**
     * @param  {Unit} unit
     * @param  {boolean} updatesPureGrowthRate=false
     * @param  {boolean} updateBlessingEffects=true
     * @param  {boolean} withPairUpUnit
     */
    __updateStatusBySkillsAndMerges(
        unit,
        updatesPureGrowthRate = false,
        updateBlessingEffects = true,
        withPairUpUnit = true
    ) {
        if (withPairUpUnit && unit.hasPairUpUnit) {
            this.__updateStatusBySkillsAndMerges(unit.pairUpUnit, updatesPureGrowthRate, updateBlessingEffects, false);
        }

        this.skillDatabase.updateUnitSkillInfo(unit);

        // 祝福効果の更新
        if (updateBlessingEffects) {
            unit.clearBlessingEffects();
            for (let ally of this.enumerateUnitsInTheSameGroup(unit, false)) {
                // 増援枠にいる神階は神階補正を与えない
                if (this.isReinforcementSlotUnit(ally)) {
                    continue;
                }
                if (!this.isBlessingEffectEnabled(unit, ally)) {
                    continue;
                }
                let heroInfo = ally.heroInfo;
                if (heroInfo == null) {
                    continue;
                }
                unit.addBlessingEffect(heroInfo.blessingType);
            }
        }

        let canApplyPairUpBoost = unit.hasPairUpUnit
            && (this.gameMode != GameMode.SummonerDuels || this.examinesIsCurrentSeason(unit.providableBlessingSeason));
        unit.updateStatusBySkillsAndMerges(updatesPureGrowthRate, updateBlessingEffects,
            this.isPairUpBoostsEnabled && canApplyPairUpBoost);

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

        switch (this.gameMode) {
            case GameMode.Arena:
                this.updateArenaScore(unit);
                break;
            case GameMode.AetherRaid:
                this.updateAetherRaidDefenseLiftLoss(unit);
                break;
        }

        this.__showStatusToAttackerInfo();
    }
    /**
     * @param  {Unit} unit
     * @param  {Number} heroIndex
     * @param  {Boolean} initEditableAttrs=true
     * @param  {Boolean} withPairUpUnit=true
     */
    initializeByHeroInfo(unit, heroIndex, initEditableAttrs = true, withPairUpUnit = true) {
        unit.heroIndex = heroIndex;
        if (heroIndex == -1) {
            unit.setToNone();
            return;
        }

        let heroInfo = this.heroInfos.getHeroInfo(heroIndex);
        if (heroInfo == null) {
            console.log("heroInfo was not found:" + heroIndex);
            return;
        }

        this.registerSkillInfos(heroInfo);

        if (heroInfo == unit.heroInfo) {
            // ユニットのコピーペースト時に再初期化でリセットされてしまうのを防ぐために
            // 同じ情報だったらスキップするようにしたが、もし何か他の処理で都合が悪ければ、
            // 強制更新フラグを引数で渡せるようにする
            return;
        }

        unit.initByHeroInfo(heroInfo);

        if (this.gameMode != GameMode.ResonantBattles
            || unit.groupId == UnitGroupType.Ally) {
            // 双界の敵以外は成長率を操作することはないのでリセット
            unit.updatePureGrowthRate();
            unit.resetStatusMult();
            if (initEditableAttrs) {
                unit.resetStatusAdd();
            }
        }

        // 神装英雄じゃない場合は神装補正をリセット
        if (!unit.heroInfo.isResplendent) {
            unit.isResplendent = false;
        }

        if (initEditableAttrs) {
            unit.level = 40;
            unit.merge = 0;
            unit.dragonflower = 0;
            unit.initializeSkillsToDefault();
            unit.setMoveCountFromMoveType();
            unit.reserveCurrentSkills();
            unit.isResplendent = false;
            unit.isBonusChar = false;
            unit.updatePureGrowthRate();
        }
        this.__updateStatusBySkillsAndMerges(unit, false);
        unit.resetMaxSpecialCount();
        if (initEditableAttrs) {
            unit.specialCount = unit.maxSpecialCount;
            unit.hp = unit.maxHpWithSkills;
        }

        if (withPairUpUnit && unit.canHavePairUpUnit && unit.pairUpUnit != null) {
            this.initializeByHeroInfo(unit.pairUpUnit, unit.pairUpUnit.heroIndex, initEditableAttrs, false);
        }

        if (!unit.additionalPassives || !(unit.additionalPassives instanceof Array)) {
            unit.initAdditionalPassives();
        }

        if (!unit.customSkills || !(unit.customSkills instanceof Array)) {
            unit.initCustomSkills();
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
        let index = this.__findIndexOfBattleItem(itemType);
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
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} providerUnit
     */
    isBlessingEffectEnabled(targetUnit, providerUnit) {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                {
                    if (this.isReinforcementSlotUnit(targetUnit)) {
                        // 増援は神階でも補正を受ける
                        return this.examinesIsCurrentSeason(targetUnit.grantedBlessing) ||
                            this.examinesIsCurrentSeason(targetUnit.providableBlessingSeason);
                    }
                    if (targetUnit.grantedBlessing === SeasonType.None &&
                        targetUnit.providableBlessingSeason === SeasonType.None) {
                        // 祝福付与なし、かつ伝承英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason === SeasonType.None) {
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

                    if (targetUnit.grantedBlessing === providerUnit.providableBlessingSeason) {
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
            case GameMode.SummonerDuels:
                {
                    if (providerUnit.providableBlessingSeason == SeasonType.None
                        || isMythicSeasonType(providerUnit.providableBlessingSeason)
                    ) {
                        // 適用元が伝承効果を持たない
                        return false;
                    }

                    if (isLegendarySeasonType(targetUnit.providableBlessingSeason)) {
                        // 対象が伝承英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用元の祝福がシーズンに合わない
                        return false;
                    }

                    if (isMythicSeasonType(targetUnit.providableBlessingSeason)) {
                        // 神階英雄はシーズンが合ってる場合だけ適用される
                        let isSeasonMythicUnit = this.examinesIsCurrentSeason(targetUnit.providableBlessingSeason);
                        return isSeasonMythicUnit;
                    }
                    else {
                        // 英雄決闘は祝福の有無に関係なく伝承効果が適用されるので適用者の祝福の判定不要
                        return true;
                    }
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

        score = (Math.floor(score / units.length) + bressingCount) * 2;
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

    *enumerateCurrentSeasonDefenseMythicUnits(groupId) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (!this.isSpecialSlotUnit(unit)
                && unit.isDefenseMythicHero
                && this.examinesIsCurrentSeason(unit.providableBlessingSeason)) {
                yield unit;
            }
        }
    }

    __calcAetherRaidDefenseLiftLoss() {
        let liftLoss = -100;
        let defenseProviders = Array.from(this.enumerateCurrentSeasonDefenseMythicUnits(UnitGroupType.Enemy));
        let providerCount = defenseProviders.length;
        if (providerCount == 0) {
            return liftLoss;
        }

        let bonusMythicUnitAvailable = defenseProviders.some(x => x.isBonusChar);
        if (bonusMythicUnitAvailable) {
            liftLoss += 20;
        }

        let totalMerge = defenseProviders.reduce(
            (accumulator, unit) => accumulator + Number(unit.merge),
            0
        );
        liftLoss += totalMerge;

        // 神階英雄数(最大2体)x祝福付与英雄数x5
        if (providerCount > 2) {
            providerCount = 2;
        }

        let provider = defenseProviders[0];
        let bressingEffectedUnitCount = 0;
        for (let unit of this.enemyUnits.filter(x => !defenseProviders.some(y => y == x))) {
            if (this.isSpecialSlotUnit(unit)) {
                continue;
            }

            if (!this.isBlessingEffectEnabled(unit, provider)) {
                continue;
            }

            ++bressingEffectedUnitCount;
        }

        liftLoss += providerCount * bressingEffectedUnitCount * 5;

        return liftLoss;
    }

    updateAetherRaidDefenseLiftLoss() {
        this.aetherRaidDefenseLiftLoss = this.__calcAetherRaidDefenseLiftLoss();
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

    updateArenaScoreForAll() {
        for (let unit of this.allyUnits) {
            this.updateArenaScore(unit);
        }
        for (let unit of this.enemyUnits) {
            this.updateArenaScore(unit);
        }
        this.updateArenaScoreOfParties();
    }

    updateEnemyAndAllyUnits() {
        let enemyCount = this.getEnemyCount();
        let allyCount = this.getAllyCount();
        this.updateEnemyAndAllyUnitCount(enemyCount, allyCount);
    }
    updateSlotOrders() {
        for (let i = 0; i < this.enemyUnits.length; ++i) {
            let unit = this.enemyUnits[i];
            unit.slotOrder = i;
        }
        for (let i = 0; i < this.allyUnits.length; ++i) {
            let unit = this.allyUnits[i];
            unit.slotOrder = i;
        }
    }
    updateEnemyAndAllyUnitCount(enemyCount, allyCount) {
        this.enemyUnits = [];
        for (let i = 0; i < enemyCount; ++i) {
            let unit = this.units[i];
            this.enemyUnits.push(unit);
        }
        let allyOffset = MaxEnemyUnitCount;
        let allyEnd = allyOffset + allyCount;
        this.allyUnits = [];
        for (let i = allyOffset; i < allyEnd; ++i) {
            let unit = this.units[i];
            this.allyUnits.push(unit);
        }

        this.updateSlotOrders();
    }

    examinesEnemyActionTriggered(unit) {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                return this.isEnemyActionTriggered;
            case GameMode.ResonantBattles:
                if (unit.groupId === UnitGroupType.Ally) {
                    return true;
                }
                if (isThief(unit)) {
                    return true;
                }
                return unit.isEnemyActionTriggered;
            case GameMode.Arena:
            case GameMode.TempestTrials:
            case GameMode.PawnsOfLoki:
            default:
                return true;
        }
    }

    updateTargetInfoTdStyle() {
        let width = (this.map.cellWidth * 6) / 2 + 10;
        this.attackInfoTdStyle = `width: ${width}px;font-size:8px;color:white;`;
    }

    updateExportText() {
        let settingText = this.getUncompressedSettingsAsString(
            this.exportsAllySettings,
            this.exportsEnemySettings,
            this.exportsOffenceSettings,
            this.exportsDefenceSettings,
            this.exportsMapSettings);

        this.exportSettingText = this.compressSetting(settingText);

        // #main-content とかがURLに含まれてると不正なURLになってしまうので、とりあえず決め打ちにしておく
        // let location = window.location.href;
        // let split = location.split("s=");
        // if (split.length > 1) {
        //     location = split[0];
        //     let compressed = LZString.compressToEncodedURIComponent(settingText);
        //     this.exportSettingUrl = location + "s=" + compressed;
        // }
        // else {
        //     let prefix = location.includes("?") ? "&" : "?";
        //     this.exportSettingUrl = location + prefix + "s=" + LZString.compressToEncodedURIComponent(settingText);
        // }
        this.exportSettingUrl = g_explicitSiteRootPath + "?pid=1469&s=" + LZString.compressToEncodedURIComponent(settingText);
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
        return this.decompressSettingByCompressMode(inputText, this.settingCompressMode);
    }

    decompressSettingByCompressMode(inputText, compressMode) {
        switch (compressMode) {
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

    getUncompressedSettingsAsString(
        loadsAllies = true,
        loadsEnemies = true,
        loadsOffenceStructures = true,
        loadsDefenseStructures = true,
        exportsMapSettings = true,
    ) {
        let dict = this.settings.convertCurrentSettingsToDict(loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures, exportsMapSettings);
        let result = "";
        for (let key in dict) {
            let settingText = dict[key];
            result += key + "=" + settingText + ";";
        }

        return result;
    }

    exportSettingsAsString(
        loadsAllies = true,
        loadsEnemies = true,
        loadsOffenceStructures = true,
        loadsDefenseStructures = true,
        exportsMapSettings = false,
    ) {
        let result = this.getUncompressedSettingsAsString(
            loadsAllies,
            loadsEnemies,
            loadsOffenceStructures,
            loadsDefenseStructures,
            exportsMapSettings
        );

        return this.compressSetting(result);
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
        return this.globalBattleContext.currentTurn === 0;
    }

    get maxTurn() {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                {
                    let add = 0;
                    if (this.examinesIsCurrentSeason(SeasonType.Light)) {
                        for (let unit of this.allyUnits) {
                            if (unit.passiveC === PassiveC.MilaNoHaguruma ||
                                unit.passiveC === PassiveC.MilasTurnwheel2) {
                                ++add;
                            }
                        }
                    }
                    return 7 + add;
                }
            case GameMode.ResonantBattles: return 20;
            case GameMode.Arena: return 20;
            case GameMode.TempestTrials: return 20;
            case GameMode.PawnsOfLoki:
                // todo: 本当は盤位で最大値が決まる。盤位1は9ターン、盤位4は10ターンだったが法則は不明
                return 20;
            case GameMode.SummonerDuels:
                return 5;
            default:
                throw new Error("invalid gameMode");
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

    getOffenseStructures(predicator = null) {
        let result = [];
        for (let st of this.offenceStructureStorage.objs) {
            if (predicator) {
                if (predicator(st)) {
                    result.push(st);
                }
            } else {
                result.push(st);
            }
        }
        return result;
    }

    registerTemplateImages() {
        for (let st of this.defenseStructureStorage.objs) {
            if (st instanceof FalseHexTrap || st instanceof FalseBoltTrap || st instanceof FalseHeavyTrap || st instanceof Ornament) {
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

    selectCurrentItem(button, isDoubleClick) {
        let currentItem = this.currentItem;
        for (let item of this.enumerateItems()) {
            let selected = item === currentItem;
            if (item.isSelected && selected && button !== 2 && !isDoubleClick) {
                item.isSelected = false;
            } else {
                item.isSelected = selected;
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
            if (currentUnit.groupId === UnitGroupType.Ally) {
                this.attackerUnitIndex = this.currentItemIndex;
                this.attackerUnitId = currentUnit.id;
            } else {
                this.attackTargetUnitIndex = this.currentItemIndex;
                this.attackTargetUnitId = currentUnit.id;
            }
        }
    }

    examinesIsCurrentSeason(season) {
        for (let currentSeason of this.enumerateCurrentSeasons()) {
            if (season === currentSeason) {
                return true;
            }
        }
        return false;
    }

    enumerateCurrentSeasons() {
        return this.globalBattleContext.enumerateCurrentSeasons();
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
        if (value == null) {
            return;
        }
        if (Number(value) === ItemType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited === "") { continue; }
            let item = Number(splited);
            if (Number.isInteger(item)) {
                this.resonantBattleItems.push(item);
            }
        }
    }

    get isCombatOccuredInCurrentTurn() {
        return this.globalBattleContext.isCombatOccuredInCurrentTurn;
    }

    get currentTurn() {
        return this.globalBattleContext.currentTurn;
    }

    set isCombatOccuredInCurrentTurn(value) {
        this.globalBattleContext.isCombatOccuredInCurrentTurn = value;
    }

    set currentTurn(value) {
        this.globalBattleContext.currentTurn = value;
    }


    perTurnStatusToString() {
        const context = this.globalBattleContext;
        return [
            context.currentPhaseType,
            boolToInt(this.isEnemyActionTriggered),
            this.currentTurn,
            this.battileItemsToString(),
            boolToInt(this.isCombatOccuredInCurrentTurn),
            context.removedUnitCountsInCombat[UnitGroupType.Ally],
            context.removedUnitCountsInCombat[UnitGroupType.Enemy],
            context.restOfPhaseCounts[UnitGroupType.Ally],
            context.restOfPhaseCounts[UnitGroupType.Enemy],
            boolToInt(context.isAllyPhaseEnded),
            boolToInt(context.isEnemyPhaseEnded),
            context.summonerDuelsPointAreaOffset,
            context.summonerDuelsKoScores[UnitGroupType.Ally],
            context.summonerDuelsKoScores[UnitGroupType.Enemy],
            context.summonerDuelsCaptureScores[UnitGroupType.Ally],
            context.summonerDuelsCaptureScores[UnitGroupType.Enemy],
            context.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Ally],
            context.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Enemy],
            context.isAnotherActionByAssistActivatedInCurrentTurn[UnitGroupType.Ally],
            context.isAnotherActionByAssistActivatedInCurrentTurn[UnitGroupType.Enemy],
            context.numOfCombatOnCurrentTurn,
            context.removedUnitCountInCombatInCurrentTurnsPhase[UnitGroupType.Ally],
            context.removedUnitCountInCombatInCurrentTurnsPhase[UnitGroupType.Enemy],
            context.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Ally],
            context.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Enemy],
            Base62Util.encodeSet(context.oncePerTurnSkillsForTheEntireMapInCurrentTurn[UnitGroupType.Ally]),
            Base62Util.encodeSet(context.oncePerTurnSkillsForTheEntireMapInCurrentTurn[UnitGroupType.Enemy])
        ].join(ValueDelimiter);
    }

    turnWideStatusToString() {
        return [
            this.mapKind,
            boolToInt(this.globalBattleContext.isLightSeason),
            boolToInt(this.globalBattleContext.isAstraSeason),
            boolToInt(this.globalBattleContext.isFireSeason),
            boolToInt(this.globalBattleContext.isWaterSeason),
            boolToInt(this.globalBattleContext.isWindSeason),
            boolToInt(this.globalBattleContext.isEarthSeason),
            this.settingCompressMode,
            this.gameMode,
            this.resonantBattleInterval
        ].join(ValueDelimiter);
    }

    fromPerTurnStatusString(value) {
        if (!value) return;
        const context = this.globalBattleContext;
        const handlers = [
            v => {
                if (Number.isInteger(+v)) context.currentPhaseType = +v
            },
            v => {
                this.isEnemyActionTriggered = intToBool(+v)
            },
            v => {
                if (Number.isInteger(+v)) this.currentTurn = +v
            },
            v => {
                this.setBattleItemsFromString(v)
            },
            v => {
                this.isCombatOccuredInCurrentTurn = intToBool(+v)
            },
            v => {
                context.removedUnitCountsInCombat[UnitGroupType.Ally] = +v
            },
            v => {
                context.removedUnitCountsInCombat[UnitGroupType.Enemy] = +v
            },
            v => {
                context.restOfPhaseCounts[UnitGroupType.Ally] = +v
            },
            v => {
                context.restOfPhaseCounts[UnitGroupType.Enemy] = +v
            },
            v => {
                context.isAllyPhaseEnded = intToBool(+v)
            },
            v => {
                context.isEnemyPhaseEnded = intToBool(+v)
            },
            v => {
                context.summonerDuelsPointAreaOffset = +v
            },
            v => {
                context.summonerDuelsKoScores[UnitGroupType.Ally] = +v
            },
            v => {
                context.summonerDuelsKoScores[UnitGroupType.Enemy] = +v
            },
            v => {
                context.summonerDuelsCaptureScores[UnitGroupType.Ally] = +v
            },
            v => {
                context.summonerDuelsCaptureScores[UnitGroupType.Enemy] = +v
            },
            v => {
                context.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Ally] = +v
            },
            v => {
                context.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Enemy] = +v
            },
            v => {
                context.isAnotherActionByAssistActivatedInCurrentTurn[UnitGroupType.Ally] = intToBool(+v)
            },
            v => {
                context.isAnotherActionByAssistActivatedInCurrentTurn[UnitGroupType.Enemy] = intToBool(+v)
            },
            v => {
                context.numOfCombatOnCurrentTurn = +v
            },
            v => {
                context.removedUnitCountInCombatInCurrentTurnsPhase[UnitGroupType.Ally] = +v
            },
            v => {
                context.removedUnitCountInCombatInCurrentTurnsPhase[UnitGroupType.Enemy] = +v
            },
            v => {
                context.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Ally] = +v
            },
            v => {
                context.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Enemy] = +v
            },
            v => {
                context.oncePerTurnSkillsForTheEntireMapInCurrentTurn[UnitGroupType.Ally] = Base62Util.decodeSet(v)
            },
            v => {
                context.oncePerTurnSkillsForTheEntireMapInCurrentTurn[UnitGroupType.Enemy] = Base62Util.decodeSet(v)
            }
        ];
        const parts = value.split(ValueDelimiter);
        handlers.forEach((handler, index) => {
            const v = parts[index];
            if (v !== undefined) handler(v);
        });
    }

    fromTurnWideStatusString(value) {
        if (!value) return;
        const ctx = this.globalBattleContext;
        const handlers = [
            v => {
                this.mapKind = +v
            },
            v => {
                ctx.isLightSeason = intToBool(+v)
            },
            v => {
                ctx.isAstraSeason = intToBool(+v)
            },
            v => {
                ctx.isFireSeason = intToBool(+v)
            },
            v => {
                ctx.isWaterSeason = intToBool(+v)
            },
            v => {
                ctx.isWindSeason = intToBool(+v)
            },
            v => {
                ctx.isEarthSeason = intToBool(+v)
            },
            v => {
                this.settingCompressMode = +v
            },
            v => {
                this.gameMode = +v
            },
            v => {
                this.resonantBattleInterval = +v
            }
        ];
        const parts = value.split(ValueDelimiter);
        handlers.forEach((handler, idx) => {
            const v = parts[idx];
            if (v !== undefined) handler(v);
        });
    }

    setGameMode(gameMode) {
        if (this.gameMode == gameMode) {
            return;
        }

        this.gameMode = gameMode;
        this.setPropertiesForCurrentGameMode();
        this.updateEnemyAndAllyUnits();
    }

    setPropertiesForCurrentGameMode() {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                this.map.isBackgroundImageEnabled = true;
                this.map.isBlockImageEnabled = false;
                this.showAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            case GameMode.Arena:
                this.map.isBackgroundImageEnabled = true;
                this.hideAetherRaidManu();
                this.map.setMapSizeToNormal();
                if (!isArenaMap(this.mapKind)) {
                    this.setMapKind(MapType.Arena_1);
                }
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
            case GameMode.PawnsOfLoki:
                this.map.isBackgroundImageEnabled = false;
                this.hideAetherRaidManu();
                this.map.setMapSizeToPawnsOfLoki();
                break;
            case GameMode.SummonerDuels:
                this.map.isBackgroundImageEnabled = true;
                this.map.isBlockImageEnabled = true;
                this.hideAetherRaidManu();
                this.map.setMapSizeToLarge();
                if (!isSummonerDuelsMap(this.mapKind)) {
                    this.setMapKind(MapType.SummonersDuel_1);
                }
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
        if (this.globalBattleContext.isAstraSeason) {
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
    /**
     * @returns {Unit}
     */
    get currentUnit() {
        if (this.currentItemIndex < 0) {
            return null;
        }

        if (this.currentItemIndex < this.enemyUnits.length) {
            return this.enemyUnits[this.currentItemIndex];
        }

        if (this.currentItemIndex < (MaxEnemyUnitCount + this.allyUnits.length)) {
            return this.allyUnits[this.currentItemIndex - MaxEnemyUnitCount];
        }
        return null;
    }

    get attackerUnit() {
        for (let unit of this.allyUnits) {
            if (unit.id === this.attackerUnitId) {
                return unit;
            }
        }
        return null;
    }

    get attackTargetUnit() {
        for (let unit of this.enemyUnits) {
            if (unit.id === this.attackTargetUnitId) {
                return unit;
            }
        }
        return null;
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
        LocalStorageUtil.setBoolean('isDebugMenuEnabled', this.isDebugMenuEnabled);
        if (this.isDebugMenuEnabled) {
            this.showDebugMenu();
        } else {
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
        this.registerOffenceStructure(new SafetyFence(g_idGenerator.generate()));
        this.registerDefenceStructure(new FalseHexTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new HexTrap(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfCallingCircle(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefCallingCircle(g_idGenerator.generate()));
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
        for (let i = 0; i < this.enemyUnits.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.enemyUnits[i];
            }
        }
        index = MaxEnemyUnitCount;
        for (let i = 0; i < this.allyUnits.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.allyUnits[i];
            }
        }
        index = MaxEnemyUnitCount + MaxAllyUnitCount;
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
            if (unit.id === id) {
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

    /**
     * @returns {Generator<Unit>}
     */
    * enumerateUnits() {
        for (let unit of this.enumerateEnemyUnits()) {
            yield unit;
        }
        for (let unit of this.enumerateAllyUnits()) {
            yield unit;
        }
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateAllEnemyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Enemy, 1000);
    }
    /**
     * @returns {Generator<Unit>}
     */
    enumerateAllAllyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Ally, 1000);
    }
    /**
     * @returns {Generator<Unit>}
     */
    enumerateAllyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Ally, this.allyUnits.length);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateEnemyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Enemy, this.enemyUnits.length);
    }

    getDuplicateEmblemHeroUnits(units) {
        const unitsWithEmblemHero = units.filter(u => u.hasEmblemHero());
        const seen = new Set();
        const duplicates = new Set();

        // 重複している ID を Set に格納
        for (const u of unitsWithEmblemHero) {
            if (seen.has(u.emblemHeroIndex)) {
                duplicates.add(u.emblemHeroIndex);
            }
            seen.add(u.emblemHeroIndex);
        }

        // 重複 ID を持つユニットだけ返す
        return unitsWithEmblemHero.filter(u => duplicates.has(u.emblemHeroIndex));
    }

    /**
     * 味方チーム内で「重複した Emblem Hero」を持つユニットの配列を返す
     * @returns {Unit[]} 重複した Emblem Hero を持つユニットの配列
     */
    getDuplicateAllyEmblemHeroUnits() {
        return this.getDuplicateEmblemHeroUnits(Array.from(this.enumerateAllyUnits()));
    }

    /**
     * 敵チーム内で「重複した Emblem Hero」を持つユニットの配列を返す
     * @returns {Unit[]} 重複した Emblem Hero を持つユニットの配列
     */
    getDuplicateEnemyEmblemHeroUnits() {
        return this.getDuplicateEmblemHeroUnits(Array.from(this.enumerateEnemyUnits()));
    }

    hasDuplicateEmblemHero(units) {
        const emblemIndexes = units
            .filter(u => u.hasEmblemHero())
            .map(u => u.emblemHeroIndex);

        return new Set(emblemIndexes).size !== emblemIndexes.length;
    }

    hasDuplicateEmblemHeroInAllyTeam() {
        return this.hasDuplicateEmblemHero(Array.from(this.enumerateAllyUnits()));
    }

    hasDuplicateEmblemHeroInEnemyTeam() {
        return this.hasDuplicateEmblemHero(Array.from(this.enumerateEnemyUnits()));
    }

    /**
     * @returns {Generator<Unit>}
     */
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

    get totalComboBonus() {
        return this.pawnsOfLokiMaxWeaponTypeBonusA
            + this.pawnsOfLokiMaxWeaponTypeBonusB
            + this.pawnsOfLokiMaxMoveTypeBonus
            + this.pawnsOfLokiMaxMoveTypePairBonus;
    }


    getEnemyCount() {
        switch (this.gameMode) {
            case GameMode.AetherRaid: return 8;
            case GameMode.Arena: return 4;
            case GameMode.ResonantBattles: return 12;
            case GameMode.TempestTrials: return 6;
            case GameMode.PawnsOfLoki: return 8;
            case GameMode.SummonerDuels: return 5;
        }
    }
    getAllyCount() {
        switch (this.gameMode) {
            case GameMode.AetherRaid: return 7;
            case GameMode.Arena: return 4;
            case GameMode.ResonantBattles: return 4;
            case GameMode.TempestTrials: return 4;
            case GameMode.PawnsOfLoki: return 8 + 4 + 5; // 戦闘枠+補助枠+ショップ
            case GameMode.SummonerDuels: return 5;
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
        for (let tile of this.map.enumerateTiles()) {
            yield tile;
        }
    }

    findIndexOfAllyUnit(id) {
        for (let i = 0; i < this.allyUnits.length; ++i) {
            let unit = this.allyUnits[i];
            if (unit.id == id) {
                return i;
            }
        }
        return -1;
    }

    findIndexOfItem(id) {
        let index = 0;
        for (let i = 0; i < this.enemyUnits.length; ++i, ++index) {
            let unit = this.enemyUnits[i];
            if (unit.id == id) {
                return index;
            }
        }
        index = MaxEnemyUnitCount;
        for (let i = 0; i < this.allyUnits.length; ++i, ++index) {
            let unit = this.allyUnits[i];
            if (unit.id == id) {
                return index;
            }
        }

        index = MaxEnemyUnitCount + MaxAllyUnitCount;
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

    saveShowsSkills(value) {
        this.showsSkillLogs = value;
        LocalStorageUtil.setBoolean('showsSkillLogs', this.showsSkillLogs);
    }

    saveDamageCalcDetailLevel(value) {
        this.damageCalcDetailLevel = value;
        LocalStorageUtil.setNumber('damageCalcDetailLevel', this.damageCalcDetailLevel);
    }
}

const g_appData = new AppData();
