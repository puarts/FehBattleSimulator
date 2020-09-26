const TileType = {
    Normal: 0,
    Forest: 1,
    Flier: 2,
    Trench: 3,
    Wall: 4,
    DefensiveTile: 5,
    DefensiveTrench: 6,
    DefensiveForest: 7,
};

function tileTypeToString(type) {
    switch (type) {
        case TileType.Normal: return "通常";
        case TileType.Forest: return "森";
        case TileType.Flier: return "飛行";
        case TileType.Trench: return "溝";
        case TileType.Wall: return "壁";
        case TileType.DefensiveTile: return "防御地形";
        case TileType.DefensiveTrench: return "溝+防御地形";
        case TileType.DefensiveForest: return "森+防御地形";
        default:
            return "不明";
    }
}
let TileTypeOptions = [];
for (let key in TileType) {
    let id = TileType[key];
    if (id == TileType.Wall) {
        continue;
    }
    TileTypeOptions.push({
        id: id,
        text: tileTypeToString(id)
    });
}

const MapType_ArenaOffset = 50;
const MapType_ResonantBattlesOffset = MapType_ArenaOffset + 100;
const MapType_TempestTrialsOffset = MapType_ResonantBattlesOffset + 1000;
const MapType = {
    // 飛空城
    Izumi: 0,
    Hyosetsu: 1,
    Haikyo: 2,
    Yukigesho: 3,
    Sabaku: 4,
    Harukaze: 5,
    Komorebi: 6,
    Wasurerareta: 7,
    Natsukusa: 8,
    Syakunetsu: 9,

    // 闘技場
    // https://feheroes.gamepedia.com/List_of_Arena_maps
    Arena_1: MapType_ArenaOffset + 0,
    Arena_2: MapType_ArenaOffset + 1,
    Arena_3: MapType_ArenaOffset + 2,
    Arena_4: MapType_ArenaOffset + 3,
    Arena_5: MapType_ArenaOffset + 4,
    Arena_6: MapType_ArenaOffset + 5,
    Arena_7: MapType_ArenaOffset + 6,
    Arena_8: MapType_ArenaOffset + 7,
    Arena_9: MapType_ArenaOffset + 8,
    Arena_10: MapType_ArenaOffset + 9,

    Arena_11: MapType_ArenaOffset + 10,
    Arena_12: MapType_ArenaOffset + 11,
    Arena_13: MapType_ArenaOffset + 12,
    Arena_14: MapType_ArenaOffset + 13,
    Arena_15: MapType_ArenaOffset + 14,
    Arena_16: MapType_ArenaOffset + 15,
    Arena_17: MapType_ArenaOffset + 16,
    Arena_18: MapType_ArenaOffset + 17,
    Arena_19: MapType_ArenaOffset + 18,
    Arena_20: MapType_ArenaOffset + 19,

    Arena_21: MapType_ArenaOffset + 20,
    Arena_22: MapType_ArenaOffset + 21,
    Arena_23: MapType_ArenaOffset + 22,
    Arena_24: MapType_ArenaOffset + 23,
    Arena_25: MapType_ArenaOffset + 24,

    Arena_26: MapType_ArenaOffset + 25,
    Arena_27: MapType_ArenaOffset + 26,
    Arena_28: MapType_ArenaOffset + 27,
    Arena_29: MapType_ArenaOffset + 28,
    Arena_30: MapType_ArenaOffset + 29,

    Arena_31: MapType_ArenaOffset + 30,
    Arena_32: MapType_ArenaOffset + 31,
    Arena_33: MapType_ArenaOffset + 32,
    Arena_34: MapType_ArenaOffset + 33,
    Arena_35: MapType_ArenaOffset + 34,
    Arena_46: MapType_ArenaOffset + 45,
    Arena_47: MapType_ArenaOffset + 46,
    Arena_48: MapType_ArenaOffset + 47,
    Arena_49: MapType_ArenaOffset + 48,
    Arena_50: MapType_ArenaOffset + 49,

    // 双界
    ResonantBattles_Default: MapType_ResonantBattlesOffset + 0,
    ResonantBattles_1: MapType_ResonantBattlesOffset + 1,
    ResonantBattles_2: MapType_ResonantBattlesOffset + 2,
    ResonantBattles_3: MapType_ResonantBattlesOffset + 3,
    ResonantBattles_4: MapType_ResonantBattlesOffset + 4,
    ResonantBattles_5: MapType_ResonantBattlesOffset + 5,
    ResonantBattles_6: MapType_ResonantBattlesOffset + 6,
    ResonantBattles_7: MapType_ResonantBattlesOffset + 7,
    ResonantBattles_8: MapType_ResonantBattlesOffset + 8,

    // 戦渦の連戦
    TempestTrials_KojoNoTakaraSagashi: MapType_TempestTrialsOffset + 0,
    TempestTrials_ButosaiNoKyodai: MapType_TempestTrialsOffset + 1,
};
const DefaultResonantBattleMap = MapType.ResonantBattles_8;
const DefaultTempestTrialsMap = MapType.TempestTrials_ButosaiNoKyodai;
const AetherRaidMapImageFiles = [
    { id: MapType.Haikyo, fileName: "Haikyo.png" },
    { id: MapType.Harukaze, fileName: "Harukaze.png" },
    { id: MapType.Hyosetsu, fileName: "Hyosetsu.png" },
    { id: MapType.Izumi, fileName: "Izumi.png" },
    { id: MapType.Komorebi, fileName: "Komorebi.png" },
    { id: MapType.Natsukusa, fileName: "Natsukusa.png" },
    { id: MapType.Sabaku, fileName: "Sabaku.png" },
    { id: MapType.Syakunetsu, fileName: "Syakunetsu.png" },
    { id: MapType.Wasurerareta, fileName: "Wasurerareta.png" },
    { id: MapType.Yukigesho, fileName: "Yukigesyo.png" },
];
const ArenaMapImageFiles = [
    { id: MapType.Arena_1, fileName: "Arena_1.jpg" },
    { id: MapType.Arena_2, fileName: "Arena_2.png" },
    { id: MapType.Arena_3, fileName: "Arena_3.jpg" },
    { id: MapType.Arena_4, fileName: "Arena_4.png" },
    { id: MapType.Arena_5, fileName: "Arena_5.jpg" },
    { id: MapType.Arena_6, fileName: "Arena_6.png" },
    { id: MapType.Arena_7, fileName: "Arena_7.png" },
    { id: MapType.Arena_8, fileName: "Arena_8.png" },
    { id: MapType.Arena_9, fileName: "Arena_9.png" },
    { id: MapType.Arena_10, fileName: "Arena_10.png" },
    { id: MapType.Arena_11, fileName: "Arena_11.png" },
    { id: MapType.Arena_12, fileName: "Arena_12.png" },
    { id: MapType.Arena_13, fileName: "Arena_13.png" },
    { id: MapType.Arena_14, fileName: "Arena_14.png" },
    { id: MapType.Arena_15, fileName: "Arena_15.png" },
    { id: MapType.Arena_16, fileName: "Arena_16.png" },
    { id: MapType.Arena_17, fileName: "Arena_17.png" },
    { id: MapType.Arena_18, fileName: "Arena_18.png" },
    { id: MapType.Arena_19, fileName: "Arena_19.png" },
    { id: MapType.Arena_20, fileName: "Arena_20.png" },
    { id: MapType.Arena_21, fileName: "Arena_21.png" },
    { id: MapType.Arena_22, fileName: "Arena_22.png" },
    { id: MapType.Arena_23, fileName: "Arena_23.png" },
    { id: MapType.Arena_24, fileName: "Arena_24.png" },
    { id: MapType.Arena_25, fileName: "Arena_25.png" },
    { id: MapType.Arena_26, fileName: "Arena_26.jpg" },
    { id: MapType.Arena_27, fileName: "Arena_27.jpg" },
    { id: MapType.Arena_28, fileName: "Arena_28.jpg" },
    { id: MapType.Arena_29, fileName: "Arena_29.jpg" },
    { id: MapType.Arena_30, fileName: "Arena_30.png" },
    { id: MapType.Arena_31, fileName: "Arena_31.png" },
    { id: MapType.Arena_32, fileName: "Arena_32.png" },
    { id: MapType.Arena_33, fileName: "Arena_33.png" },
    { id: MapType.Arena_34, fileName: "Arena_34.png" },
    { id: MapType.Arena_35, fileName: "Arena_35.png" },
    { id: MapType.Arena_46, fileName: "Arena_46.png" },
    { id: MapType.Arena_47, fileName: "Arena_47.png" },
    { id: MapType.Arena_48, fileName: "Arena_48.png" },
    { id: MapType.Arena_49, fileName: "Arena_49.png" },
    { id: MapType.Arena_50, fileName: "Arena_50.png" },
];

const ResonantBattlesMapKindOptions = [
    { label: "更地", value: MapType.ResonantBattles_Default },
    { label: "2020/7/21～", value: MapType.ResonantBattles_1 },
    { label: "2020/7/28～", value: MapType.ResonantBattles_2 },
    { label: "2020/8/4～", value: MapType.ResonantBattles_3 },
    { label: "2020/8/11～", value: MapType.ResonantBattles_4 },
    { label: "2020/8/18～", value: MapType.ResonantBattles_5 },
    { label: "2020/8/25～", value: MapType.ResonantBattles_6 },
    { label: "2020/9/1～", value: MapType.ResonantBattles_7 },
    { label: "2020/9/8～", value: MapType.ResonantBattles_8 },
];

const TempestTrialsMapKindOptions = [
    { label: "皇女の宝探し(2020/8/8～)", value: MapType.TempestTrials_KojoNoTakaraSagashi },
    { label: "舞踏祭の兄妹(2020/9/8～)", value: MapType.TempestTrials_ButosaiNoKyodai },
];

const ArenaMapKindOptions = [
    { label: "マップ1", value: MapType.Arena_1 },
    { label: "マップ2", value: MapType.Arena_2 },
    { label: "マップ3", value: MapType.Arena_3 },
    { label: "マップ4", value: MapType.Arena_4 },
    { label: "マップ5", value: MapType.Arena_5 },
    { label: "マップ6", value: MapType.Arena_6 },
    { label: "マップ7", value: MapType.Arena_7 },
    { label: "マップ8", value: MapType.Arena_8 },
    { label: "マップ9", value: MapType.Arena_9 },
    { label: "マップ10", value: MapType.Arena_10 },
    { label: "マップ11", value: MapType.Arena_11 },
    { label: "マップ12", value: MapType.Arena_12 },
    { label: "マップ13", value: MapType.Arena_13 },
    { label: "マップ14", value: MapType.Arena_14 },
    { label: "マップ15", value: MapType.Arena_15 },
    { label: "マップ16", value: MapType.Arena_16 },
    { label: "マップ17", value: MapType.Arena_17 },
    { label: "マップ18", value: MapType.Arena_18 },
    { label: "マップ19", value: MapType.Arena_19 },
    { label: "マップ20", value: MapType.Arena_20 },
    { label: "マップ21", value: MapType.Arena_21 },
    { label: "マップ22", value: MapType.Arena_22 },
    { label: "マップ23", value: MapType.Arena_23 },
    { label: "マップ24", value: MapType.Arena_24 },
    { label: "マップ25", value: MapType.Arena_25 },
    { label: "マップ26", value: MapType.Arena_26 },
    { label: "マップ27", value: MapType.Arena_27 },
    { label: "マップ28", value: MapType.Arena_28 },
    { label: "マップ29", value: MapType.Arena_29 },
    { label: "マップ30", value: MapType.Arena_30 },
    { label: "マップ31", value: MapType.Arena_31 },
    { label: "マップ32", value: MapType.Arena_32 },
    { label: "マップ33", value: MapType.Arena_33 },
    { label: "マップ34", value: MapType.Arena_34 },
    { label: "マップ35", value: MapType.Arena_35 },
    { label: "マップ46", value: MapType.Arena_46 },
    { label: "マップ47", value: MapType.Arena_47 },
    { label: "マップ48", value: MapType.Arena_48 },
    { label: "マップ49", value: MapType.Arena_49 },
    { label: "マップ50", value: MapType.Arena_50 },
];

const ArenaMapRotation = [
    // 1
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 2
    [
        { label: "マップ1", value: MapType.Arena_11 },
        { label: "マップ2", value: MapType.Arena_12 },
        { label: "マップ3", value: MapType.Arena_13 },
        { label: "マップ4", value: MapType.Arena_14 },
        { label: "マップ5", value: MapType.Arena_15 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 3
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_21 },
        { label: "マップ7", value: MapType.Arena_22 },
        { label: "マップ8", value: MapType.Arena_23 },
        { label: "マップ9", value: MapType.Arena_24 },
        { label: "マップ10", value: MapType.Arena_25 },
    ],
    // 4
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 5
    [
        { label: "マップ1", value: MapType.Arena_21 },
        { label: "マップ2", value: MapType.Arena_22 },
        { label: "マップ3", value: MapType.Arena_23 },
        { label: "マップ4", value: MapType.Arena_24 },
        { label: "マップ5", value: MapType.Arena_25 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 6
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_11 },
        { label: "マップ7", value: MapType.Arena_12 },
        { label: "マップ8", value: MapType.Arena_13 },
        { label: "マップ9", value: MapType.Arena_14 },
        { label: "マップ10", value: MapType.Arena_15 },
    ],
    // 7
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 8
    [
        { label: "マップ1", value: MapType.Arena_21 },
        { label: "マップ2", value: MapType.Arena_22 },
        { label: "マップ3", value: MapType.Arena_23 },
        { label: "マップ4", value: MapType.Arena_24 },
        { label: "マップ5", value: MapType.Arena_25 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 9
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_11 },
        { label: "マップ7", value: MapType.Arena_12 },
        { label: "マップ8", value: MapType.Arena_13 },
        { label: "マップ9", value: MapType.Arena_14 },
        { label: "マップ10", value: MapType.Arena_15 },
    ],
    // 10
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 11
    [
        { label: "マップ1", value: MapType.Arena_11 },
        { label: "マップ2", value: MapType.Arena_12 },
        { label: "マップ3", value: MapType.Arena_13 },
        { label: "マップ4", value: MapType.Arena_14 },
        { label: "マップ5", value: MapType.Arena_15 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 12
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_21 },
        { label: "マップ7", value: MapType.Arena_22 },
        { label: "マップ8", value: MapType.Arena_23 },
        { label: "マップ9", value: MapType.Arena_24 },
        { label: "マップ10", value: MapType.Arena_25 },
    ],
];



function tileTypeToThumb(tileType, mapType) {
    switch (tileType) {
        case TileType.Wall: return g_imageRootPath + 'Wall.jpg';
        case TileType.Trench: return g_imageRootPath + 'Trench.png';
        case TileType.DefensiveForest: return g_imageRootPath + 'DefensiveForest.png';
        case TileType.DefensiveTrench: return g_imageRootPath + 'DefensiveTrench.jpg';
        case TileType.Forest: return g_imageRootPath + 'Forest.png';
        case TileType.DefensiveTile: return g_imageRootPath + 'DefensiveTile.png';
        case TileType.Flier:
            switch (mapType) {
                case MapType.Sabaku:
                case MapType.Arena_5:
                case MapType.Arena_9:
                case MapType.Arena_12:
                case MapType.Arena_15:
                case MapType.Arena_20:
                case MapType.Arena_27:
                case MapType.Arena_28:
                case MapType.Arena_29:
                    return g_imageRootPath + 'Mountain.png';
                case MapType.Syakunetsu:
                case MapType.Arena_4:
                case MapType.Arena_10:
                case MapType.Arena_11:
                    return g_imageRootPath + 'Lava.png';
                case MapType.Izumi:
                    return g_imageRootPath + 'Pond.png';
                case MapType.Arena_22:
                    return g_imageRootPath + 'Cliff.png';
                default:
                    return g_imageRootPath + 'Flier.png';
            }
        default:
            return null;
    }
}

const CanNotReachTile = 1000000;
const ObstructTile = 10000; // 進軍阻止
const DefaultTileColor = "#eee";
const SelectedTileColor = "#ffffff99";

function tileTypeToColor(type) {
    switch (type) {
        case TileType.Forest: return '#9c9';
        case TileType.Flier: return DefaultTileColor;
        case TileType.DefensiveTrench: return '#eee';
        case TileType.DefensiveTile: return '#ffc';
        case TileType.Trench:
            return DefaultTileColor;
        case TileType.Wall:
        case TileType.Normal:
        default:
            return DefaultTileColor;
    }
}

function getMapBackgroundImage(mapKind) {
    const root = g_imageRootPath + "TableBackground/";
    const arenaRoot = g_imageRootPath + "Maps/";
    switch (mapKind) {
        case MapType.Izumi: return root + "Izumi.png";
        case MapType.Haikyo: return root + "Haikyo.png";
        case MapType.Harukaze: return root + "Harukaze.png";
        case MapType.Hyosetsu: return root + "Hyosetsu.png";
        case MapType.Komorebi: return root + "Komorebi.png";
        case MapType.Natsukusa: return root + "Natsukusa.png";
        case MapType.Sabaku: return root + "Sabaku.png";
        case MapType.Syakunetsu: return root + "Syakunetsu.png";
        case MapType.Wasurerareta: return root + "Wasurerareta.png";
        case MapType.Yukigesho: return root + "Yukigesyo.png";
        case MapType.Arena_1: return arenaRoot + "Arena_1.jpg";
        case MapType.Arena_2: return arenaRoot + "Arena_2.png";
        case MapType.Arena_3: return arenaRoot + "Arena_3.jpg";
        case MapType.Arena_4: return arenaRoot + "Arena_4.png";
        case MapType.Arena_5: return arenaRoot + "Arena_5.jpg";
        case MapType.Arena_6: return arenaRoot + "Arena_6.png";
        case MapType.Arena_7: return arenaRoot + "Arena_7.png";
        case MapType.Arena_8: return arenaRoot + "Arena_8.png";
        case MapType.Arena_9: return arenaRoot + "Arena_9.png";
        case MapType.Arena_10: return arenaRoot + "Arena_10.png";
        case MapType.Arena_11: return arenaRoot + "Arena_11.png";
        case MapType.Arena_12: return arenaRoot + "Arena_12.png";
        case MapType.Arena_13: return arenaRoot + "Arena_13.png";
        case MapType.Arena_14: return arenaRoot + "Arena_14.png";
        case MapType.Arena_15: return arenaRoot + "Arena_15.png";
        case MapType.Arena_16: return arenaRoot + "Arena_16.png";
        case MapType.Arena_17: return arenaRoot + "Arena_17.png";
        case MapType.Arena_18: return arenaRoot + "Arena_18.png";
        case MapType.Arena_19: return arenaRoot + "Arena_19.png";
        case MapType.Arena_20: return arenaRoot + "Arena_20.png";
        case MapType.Arena_21: return arenaRoot + "Arena_21.png";
        case MapType.Arena_22: return arenaRoot + "Arena_22.png";
        case MapType.Arena_23: return arenaRoot + "Arena_23.png";
        case MapType.Arena_24: return arenaRoot + "Arena_24.png";
        case MapType.Arena_25: return arenaRoot + "Arena_25.png";
        case MapType.Arena_26: return arenaRoot + "Arena_26.jpg";
        case MapType.Arena_27: return arenaRoot + "Arena_27.jpg";
        case MapType.Arena_28: return arenaRoot + "Arena_28.jpg";
        case MapType.Arena_29: return arenaRoot + "Arena_29.jpg";
        case MapType.Arena_30: return arenaRoot + "Arena_30.png";
        case MapType.Arena_31: return arenaRoot + "Arena_31.png";
        case MapType.Arena_32: return arenaRoot + "Arena_32.png";
        case MapType.Arena_33: return arenaRoot + "Arena_33.png";
        case MapType.Arena_34: return arenaRoot + "Arena_34.png";
        case MapType.Arena_35: return arenaRoot + "Arena_35.png";
        case MapType.Arena_46: return arenaRoot + "Arena_46.png";
        case MapType.Arena_47: return arenaRoot + "Arena_47.png";
        case MapType.Arena_48: return arenaRoot + "Arena_48.png";
        case MapType.Arena_49: return arenaRoot + "Arena_49.png";
        case MapType.Arena_50: return arenaRoot + "Arena_50.png";
        default:
            throw new Error("Unknown map type " + mapKind);
    }
}

class TilePriorityContext {
    constructor(tile, unit) {
        this.unit = unit;
        this.tile = tile;
        this.isDefensiveTile = tile.isDefensiveTile;
        this.isTeleportationRequired = tile.examinesIsTeleportationRequiredForThisTile(unit);
        this.tileType = tile.type;
        this.requiredMovementCount = tile.calculateUnitMovementCountToThisTile(unit);
        this.tilePriority = tile.tilePriority;
        this.distanceFromDiagonal = 0;
        this.isPivotRequired = false;

        // ブロック破壊可能なタイル
        this.attackableTileContexts = [];
        this.bestTileToBreakBlock = null;

        this.priorityToAssist = 0;
        this.priorityToMove = 0;
        this.priorityToBreakBlock = 0;
        this.priorityOfTargetBlock = 0;
        this.priorityToAttack = 0;
    }

    get enemyThreat() {
        return this.tile.getEnemyThreatFor(this.unit.groupId);
    }

    __calcMinDiaglonalDist(targetTile, mapWidth, mapHeight) {
        let origX = targetTile.posX;
        let origY = targetTile.posY;
        let minDiagonalDist = 1000;
        for (let x = origX, y = origY; x < mapWidth && y < mapHeight; ++x, ++y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x < mapWidth && y >= 0; ++x, --y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x >= 0 && y < mapHeight; --x, ++y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x >= 0 && y >= 0; --x, --y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        return minDiagonalDist;
    }

    calcPriorityToAssist(assistUnit) {
        if (assistUnit.supportInfo == null) {
            return;
        }

        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        if (assistUnit.support == Support.Pivot) {
            this.priorityToAssist =
                defensiveTileWeight * 10000000
                - this.enemyThreat * 1000000
                + this.tilePriority;
        }
        else if (assistUnit.supportInfo.assistType == AssistType.Move) {
            let teleportationRequirementWeight = 0;
            let requiredMovementCount = this.requiredMovementCount;
            if (this.isTeleportationRequired) {
                teleportationRequirementWeight = 1;
                requiredMovementCount = 0;
            }
            this.priorityToAssist =
                defensiveTileWeight * 100000
                - this.enemyThreat * 10000
                + teleportationRequirementWeight * 5000
                - requiredMovementCount * 50
                + this.tilePriority;
        }
        else {
            let teleportationRequirementWeight = 0;
            let requiredMovementCount = this.requiredMovementCount;
            if (this.isTeleportationRequired) {
                teleportationRequirementWeight = 1;
                requiredMovementCount = 0;
            }
            let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);
            this.priorityToAssist =
                defensiveTileWeight * 1000000
                - this.enemyThreat * 110000
                + teleportationRequirementWeight * 50000
                + tileTypeWeight * 5000
                - requiredMovementCount * 50
                + this.tilePriority;
        }
    }

    calcPriorityToBreakBlock() {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }
        this.priorityToBreakBlock =
            defensiveTileWeight * 10000000
            - this.enemyThreat * 1000000
            + teleportationRequirementWeight * 500000
            + tileTypeWeight * 1000
            - requiredMovementCount * 50
            + this.tilePriority;
    }

    calcPriorityToMove(moveUnit, chaseTargetTile, mapWidth, mapHeight) {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(moveUnit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) { teleportationRequirementWeight = 1; requiredMovementCount = 0; }

        this.distanceFromDiagonal = this.__calcMinDiaglonalDist(chaseTargetTile, mapWidth, mapHeight);

        this.priorityToMove =
            defensiveTileWeight * 10000000
            - this.enemyThreat * 1000000
            + teleportationRequirementWeight * 500000
            - pivotRequiredPriority * 100000
            - this.distanceFromDiagonal * 5000
            + tileTypeWeight * 1000
            - requiredMovementCount * 50
            + this.tilePriority;
    }

    calcPriorityToAttack() {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }
        let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);

        this.priorityToAttack =
            defensiveTileWeight * 1000000
            - this.enemyThreat * 100000
            + teleportationRequirementWeight * 5000
            + tileTypeWeight * 1000
            - requiredMovementCount * 50
            + this.tilePriority;
    }

    __getTileTypePriority(unit, type) {
        switch (type) {
            case TileType.DefensiveForest:
            case TileType.Forest:
                return 2;
            case TileType.Flier:
                return 3;
            case TileType.DefensiveTrench:
            case TileType.Trench:
                if (unit.moveType == MoveType.Cavalry) {
                    return 1;
                }
                else {
                    return 0;
                }
            case TileType.Wall: return 0;
            case TileType.DefensiveTile: return 0;
            case TileType.Normal: return 0;
            default: return 0;
        }
    }
}

function setUnitToTile(unit, tile) {
    if (unit.placedTile != null) {
        unit.placedTile.placedUnit = null;
    }
    unit.placedTile = tile;
    if (tile != null) {
        tile.placedUnit = unit;
        unit.setPos(tile.posX, tile.posY);
    }
    else {
        unit.setPos(-1, -1);
    }
}

/// マップを構成するタイルです。
class Tile {
    constructor(px, py) {
        this.posX = px;
        this.posY = py;
        this._type = TileType.Normal;
        this._obj = null;
        this._moveWeights = [];
        this._moveWeights[MoveType.Infantry] = 1;
        this._moveWeights[MoveType.Flying] = 1;
        this._moveWeights[MoveType.Armor] = 1;
        this._moveWeights[MoveType.Cavalry] = 1;
        this._neighbors = [];
        this._placedUnit = null;
        this._tempData = null;
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
        this._closestDistanceToEnemy = 0;
        this.tilePriority;

        this.isMovableForAlly = false;
        this.isMovableForEnemy = false;
        this.isAttackableForAlly = false;
        this.isAttackableForEnemy = false;

        this.threateningEnemies = [];
        this.threateningAllies = [];

        this.overridesCell = false;
        this.borderColor = "#000000";
        this.borderWidth = "1px";
        this.overrideText = "";
    }

    perTurnStatusToString() {
        return "";
    }

    turnWideStatusToString() {
        return this._type + "";
    }

    fromPerTurnStatusString(value) {
    }

    fromTurnWideStatusString(value) {
        var splited = value.split(ValueDelimiter);
        var i = 0;
        if (Number.isInteger(Number(splited[i]))) { this._type = Number(splited[i]); ++i; }
    }

    get serialId() {
        return TileCookiePrefix + this.id;
    }

    get id() {
        return `${this.posX}_${this.posY}`;
    }

    get isStructurePlacable() {
        return !(this.type != TileType.Normal || this.obj instanceof BreakableWall || this.obj instanceof Wall);
    }

    isTreantenedBySpecifiedUnit(unit) {
        return this.threateningAllies.includes(unit) || this.threateningEnemies.includes(unit);
    }

    get isThreatenedByAlly() {
        return this._dangerLevel > 0;
    }
    get isThreatenedByEnemy() {
        return this._allyDangerLevel > 0;
    }

    overrideCell(text, borderWidth, borderColor) {
        this.overridesCell = true;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
        this.overrideText = text;
    }

    resetOverriddenCell() {
        this.overridesCell = false;
        this.borderColor = "#000000";
        this.borderWidth = "1px";
        this.overrideText = "";
    }

    get isDefensiveTile() {
        return this.type == TileType.DefensiveTile || this.type == TileType.DefensiveTrench || this.type == TileType.DefensiveForest;
    }


    positionToString() {
        return "(" + this.posX + ", " + this.posY + ")";
    }

    get closestDistanceToEnemy() {
        return this._closestDistanceToEnemy;
    }

    set closestDistanceToEnemy(value) {
        this._closestDistanceToEnemy = value;
    }

    getEnemyThreatFor(groupId) {
        switch (groupId) {
            case UnitGroupType.Enemy: return this.dangerLevel;
            case UnitGroupType.Ally: return this.allyDangerLevel;
            default:
                throw new Error("unexpected group id" + groupId);
        }
    }

    get dangerLevel() {
        return this._dangerLevel;
    }

    get allyDangerLevel() {
        return this._allyDangerLevel;
    }

    resetDangerLevel() {
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
    }

    increaseDangerLevel() {
        ++this._dangerLevel;
    }

    increaseAllyDangerLevel() {
        ++this._allyDangerLevel;
    }

    setObj(obj) {
        if (obj == null && this.obj != null) {
            this.obj.setPos(-1, -1);
        }

        this.obj = obj;

        if (this.obj != null) {
            this.obj.setPos(this.posX, this.posY);
        }
    }

    setUnit(unit) {
        setUnitToTile(unit, this);
    }


    isEmpty() {
        return this.isObjPlacable() && this.isUnitPlacable();
    }

    isObjPlacable() {
        return this._type == TileType.Normal && this._obj == null;
    }

    isObjPlaceableByNature() {
        return this._type == TileType.Normal && !(this._obj instanceof Wall);
    }

    isUnitPlacable() {
        return this.isMovableTile()
            && this._placedUnit == null
            && isMovableForUnit(this._obj);
    }
    isUnitPlacableForUnit(unit) {
        return this.isMovableTileForUnit(unit)
            && this._placedUnit == null
            && isMovableForUnit(this._obj);
    }

    isMovableTile() {
        return (this._type != TileType.Wall);
    }

    isMovableTileForUnit(unit) {
        return this.isMovableTileForMoveType(unit.moveType);
    }

    isMovableTileForMoveType(moveType) {
        return this._moveWeights[moveType] != CanNotReachTile
            && (this._obj == null || this._obj instanceof TrapBase || this._obj instanceof BreakableWall);
    }

    get tempData() {
        return this._tempData;
    }
    set tempData(value) {
        this._tempData = value;
    }

    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
        switch (value) {
            case TileType.Normal:
            case TileType.DefensiveTile:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                break;
            case TileType.Trench:
            case TileType.DefensiveTrench:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                this._moveWeights[MoveType.Cavalry] = 3;
                break;
            case TileType.Flier:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = CanNotReachTile;
                }
                this._moveWeights[MoveType.Flying] = 1;
                break;
            case TileType.Forest:
            case TileType.DefensiveForest:
                this._moveWeights[MoveType.Cavalry] = CanNotReachTile;
                this._moveWeights[MoveType.Flying] = 1;
                this._moveWeights[MoveType.Armor] = 1;
                this._moveWeights[MoveType.Infantry] = 2;
                break;
            case TileType.Wall:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = CanNotReachTile;
                }
                break;
            default:
                break;
        }
    }

    __isForestType() {
        return this._type == TileType.Forest || this._type == TileType.DefensiveForest;
    }

    __getTileMoveWeight(unit) {
        if (this.__isForestType() && unit.moveType == MoveType.Infantry && unit.moveCount == 1) {
            // 歩行に1マス移動制限がかかっている場合は森地形のウェイトは通常地形と同じ
            return 1;
        }

        return this._moveWeights[unit.moveType];
    }

    get obj() {
        return this._obj;
    }
    set obj(value) {
        if (this._obj != null) {
            this._obj.placedTile = null;
        }
        this._obj = value;
        if (this._obj != null) {
            this._obj.placedTile = this;
        }
    }

    get objType() {
        if (this._obj == null) {
            return ObjType.None;
        }
        return this._obj.type;
    }

    get placedUnit() {
        return this._placedUnit;
    }
    set placedUnit(value) {
        this._placedUnit = value;
    }

    get neighbors() {
        return this._neighbors;
    }

    addNeighbor(cell) {
        this._neighbors.push(cell);
    }

    get moveWeights() {
        return this._moveWeights;
    }

    examinesIsTeleportationRequiredForThisTile(unit) {
        for (let neighborTile of unit.placedTile.getMovableNeighborTiles(unit, unit.moveCount, false)) {
            if (neighborTile == this) {
                return false;
            }
        }
        return true;
    }

    calculateDistanceTo(posX, posY) {
        return Math.abs(this.posX - posX) + Math.abs(this.posY - posY);
    }

    calculateDistance(targetTile) {
        return this.calculateDistanceTo(targetTile.posX, targetTile.posY);
    }

    calculateDistanceToUnit(unit) {
        return this.calculateDistance(unit.placedTile);
    }

    calculateDistanceToClosestEnemyTile(moveUnit) {
        let alreadyTraced = [this];
        let maxDepth = this.__getMaxDepth();
        let ignoresBreakableWalls = moveUnit.hasWeapon;
        return this._calculateDistanceToClosestTile(
            alreadyTraced, this.placedUnit, maxDepth,
            tile => {
                return tile._placedUnit != null
                    && tile._placedUnit.groupId != this.placedUnit.groupId;
            },
            neighbors => {
            },
            true,
            ignoresBreakableWalls
        );
    }

    calculateUnitMovementCountToThisTile(moveUnit, fromTile = null, inputMaxDepth = -1, ignoresUnits = true, isUnitIgnoredFunc = null) {
        if (fromTile == null) {
            fromTile = moveUnit.placedTile;
        }

        if (fromTile == this) {
            return 0;
        }

        let ignoresBreakableWalls = moveUnit.hasWeapon;
        let alreadyTraced = [fromTile];

        let maxDepth = inputMaxDepth;
        if (maxDepth < 0) {
            maxDepth = this.__getMaxDepth();
        }
        maxDepth = Math.min(this.__getMaxDepth(), maxDepth);
        return fromTile._calculateDistanceToClosestTile(
            alreadyTraced, moveUnit, maxDepth,
            tile => {
                return tile == this;
            },
            neighbors => {
                // 遅くなってしまった
                // let thisTile = this;
                // neighbors.sort(function (a, b) {
                //     return a.calculateDistance(thisTile) - b.calculateDistance(thisTile);
                // });
            },
            ignoresUnits,
            ignoresBreakableWalls,
            isUnitIgnoredFunc
        );
    }

    __getMaxDepth() {
        // 最大深度が大きいと処理時間に影響するので現実的にありそうな最大にしておく
        return ((8 - 1) + (6 - 1)) + 4;
    }

    _calculateDistanceToClosestTile(
        alreadyTraced,
        moveUnit,
        maxDepth,
        isTargetTileFunc,
        sortNeighborsFunc,
        ignoresUnits = true,
        ignoresBreakableWalls = true,
        isUnitIgnoredFunc = null,
        currentDepth = 0,
        currentDistance = 0,
        closestDistance = CanNotReachTile
    ) {
        let neighbors = this._neighbors;
        sortNeighborsFunc(neighbors);
        for (let neighborTile of neighbors) {
            if (alreadyTraced.includes(neighborTile)) {
                continue;
            }
            alreadyTraced.push(neighborTile);

            let weight = neighborTile.getMoveWeight(moveUnit, ignoresUnits, ignoresBreakableWalls, isUnitIgnoredFunc);
            if (weight >= CanNotReachTile) {
                // 通行不可
                continue;
            }

            let isObstructTile = weight == ObstructTile;
            if (isObstructTile) {
                // 進軍阻止
                weight = 1;
            }

            let nextDistance = currentDistance + weight;
            if (nextDistance >= closestDistance || nextDistance > maxDepth) {
                // これ以上評価の必要なし
                continue;
            }

            if (isTargetTileFunc(neighborTile)) {
                // 目的のタイルが見つかった
                if (nextDistance < closestDistance) {
                    closestDistance = nextDistance;
                }
                continue;
            }

            if (isObstructTile) {
                continue;
            }

            let nextAlreadyTraced = alreadyTraced.slice(0, alreadyTraced.length);
            let distance = neighborTile._calculateDistanceToClosestTile(
                nextAlreadyTraced, moveUnit, maxDepth, isTargetTileFunc, sortNeighborsFunc, ignoresUnits, ignoresBreakableWalls, isUnitIgnoredFunc,
                currentDepth + 1, nextDistance, closestDistance);

            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    getAttackableNeighborTiles(unit, maxDepth,) {
        var result = [];
        this.getNeighborTilesImpl(result, unit, maxDepth, true, false, true);
        return result;
    }
    getMovableNeighborTiles(unit, maxDepth, ignoresUnits = false, ignoreWeightsExceptCanNotReach = false) {
        var result = [];
        result.push(this);
        this.getNeighborTilesImpl(result, unit, maxDepth, false, ignoreWeightsExceptCanNotReach, ignoresUnits);
        return result;
    }
    getNeighborTilesImpl(result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits, currentDepth = 0) {
        for (var neighborIndex = 0; neighborIndex < this._neighbors.length; ++neighborIndex) {
            var neighborTile = this._neighbors[neighborIndex];
            var weight = 1;
            if (ignoreWeights == false) {
                weight = neighborTile.getMoveWeight(unit, ignoresUnits, false);
            }

            let isObstructTile = weight == ObstructTile;
            if (isObstructTile) {
                // 進軍阻止
                weight = 1;
            }

            if (ignoreWeightsExceptCanNotReach) {
                if (weight != CanNotReachTile) {
                    weight = 1;
                }
            }

            var nextDepth = currentDepth + weight;
            if (nextDepth > maxDepth) {
                continue;
            }

            result.push(neighborTile);
            if (isObstructTile) {
                continue;
            }

            neighborTile.getNeighborTilesImpl(result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits, nextDepth);
        }
    }


    getMoveWeight(unit, ignoresUnits, ignoresBreakableWalls = false, isUnitIgnoredFunc = null) {
        if (this._placedUnit != null && isUnitIgnoredFunc != null && !isUnitIgnoredFunc(this._placedUnit)) {
            // タイルのユニットを無視しないので障害物扱い
            return CanNotReachTile;
        }

        if (!ignoresUnits) {
            if (!unit.canActivatePass()) {
                if (this._placedUnit != null && unit.groupId != this._placedUnit.groupId) {
                    // 敵ユニットだったらオブジェクトと同じ扱い
                    return CanNotReachTile;
                }
                // 隣接マスに進軍阻止持ちがいるか確認
                for (let tile of this.neighbors) {
                    if (tile.placedUnit != null
                        && tile._placedUnit.groupId != unit.groupId
                        && (
                            (tile.placedUnit.passiveB == PassiveB.ShingunSoshi3 && tile.placedUnit.hpPercentage >= 50)
                            || (tile.placedUnit.passiveS == PassiveS.GoeiNoGuzo && unit.attackRange == 2)
                        )
                    ) {
                        return ObstructTile;
                    }
                }
            }
        }

        var weight = this.__getTileMoveWeight(unit);
        if (weight != CanNotReachTile) {
            if (unit.weapon == Weapon.FujinYumi && unit.isWeaponRefined && unit.hpPercentage >= 50) {
                weight = 1;
            }
        }
        if (this._obj == null) {
            return weight;
        }

        if (this._obj instanceof TrapBase) {
            return weight;
        }

        if (ignoresBreakableWalls) {
            if (!this._obj.isBreakable) {
                return CanNotReachTile;
            }

            if (this._obj instanceof BreakableWall) {
                return weight;
            }

            if (unit.groupId == UnitGroupType.Ally) {
                if (this._obj instanceof DefenceStructureBase) {
                    return weight;
                }
            }
            else {
                if (this._obj instanceof OffenceStructureBase) {
                    return weight;
                }
            }
        }

        return CanNotReachTile;
    }
}

/// マップです。
class Map {
    constructor(id, mapKind, gameVersion) {
        this._gameVersion = 0;
        this._type = -1;
        this._id = id;
        this._height = 0;
        this._width = 0;
        this._tiles = [];
        this._units = [];
        this._breakableWalls = [];
        this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));
        this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));
        this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));

        this._walls = [];
        this._walls.push(new Wall(g_idGenerator.generate()));
        this._walls.push(new Wall(g_idGenerator.generate()));

        // id の互換を維持するためにここから追加
        for (let i = this._breakableWalls.length; i < 16; ++i) {
            this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));
        }

        for (let i = this._walls.length; i < 16; ++i) {
            this._walls.push(new Wall(g_idGenerator.generate()));
        }

        this._showEnemyAttackRange = false;
        this._showAllyAttackRange = false;
        this._showClosestDistanceToEnemy = false;
        this._ignoresUnits = false;
        this._table = null;
        this.cellOffsetX = 0;
        this.cellOffsetY = 0;
        this.cellWidth = 38;
        this.cellHeight = 38;
        this.isHeaderEnabled = false;
        this.isIconOverlayDisabled = false;
        this.isTrapIconOverlayDisabled = false;

        this.isBackgroundImageEnabled = true;

        this.setMapSizeToNormal();

        this.changeMapKind(mapKind, gameVersion);

        this.sourceCode = "";
    }

    perTurnStatusToString() {
        return "";
    }

    turnWideStatusToString() {
        let result = "";
        // for (let tile of this._tiles) {
        //     result += tile.serialId + NameValueDelimiter + tile.turnWideStatusToString() + ElemDelimiter;
        // }
        return result;
    }

    fromPerTurnStatusString(value) {
    }

    fromTurnWideStatusString(elemTexts) {
        // for (var i = 0; i < elemTexts.length; ++i) {
        //     var elemText = elemTexts[i];
        //     var splited = elemText.split(NameValueDelimiter);
        //     var serialId = splited[0];
        //     var value = splited[1];
        // }
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    setMapSize(width, height) {
        if (this._width == width && this._height == height) {
            return;
        }

        this._width = width;
        this._height = height;

        this._tiles = [];
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var tile = new Tile(x, y);
                tile.tilePriority = x + (this._height - (y + 1)) * this._width;
                this._tiles.push(tile);
            }
        }

        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var tile = this.getTile(x, y);
                if (x + 1 < this._width) {
                    tile.addNeighbor(this.getTile(x + 1, y));
                }
                if (x - 1 >= 0) {
                    tile.addNeighbor(this.getTile(x - 1, y));
                }
                if (y + 1 < this._height) {
                    tile.addNeighbor(this.getTile(x, y + 1));
                }
                if (y - 1 >= 0) {
                    tile.addNeighbor(this.getTile(x, y - 1));
                }
            }
        }
    }

    setMapSizeToNormal() {
        this.setMapSize(6, 8);
    }
    setMapSizeToLarge() {
        this.setMapSize(8, 10);
    }

    resetOverriddenTiles() {
        for (let tile of this._tiles) {
            tile.resetOverriddenCell();
        }
    }

    getPosFromCellId(cellId) {
        let xy = getPositionFromCellId(cellId);
        let x = Number(xy[0]) - this.cellOffsetX;
        let y = Number(xy[1]) - this.cellOffsetY;
        return [x, y];
    }

    get id() {
        return this._id;
    }

    get showClosestDistanceToEnemy() {
        return this._showClosestDistanceToEnemy;
    }
    set showClosestDistanceToEnemy(value) {
        return this._showClosestDistanceToEnemy = value;
    }

    get showEnemyAttackRange() {
        return this._showEnemyAttackRange;
    }
    set showEnemyAttackRange(value) {
        return this._showEnemyAttackRange = value;
    }

    get showAllyAttackRange() {
        return this._showAllyAttackRange;
    }
    set showAllyAttackRange(value) {
        return this._showAllyAttackRange = value;
    }

    get ignoresBreakableWallAndUnits() {
        return this._ignoresUnits;
    }
    set ignoresBreakableWallAndUnits(value) {
        this._ignoresUnits = value;
    }

    switchIgnoresUnits() {
        this._ignoresUnits = !this._ignoresUnits;
    }

    get breakableObjCountOfCurrentMapType() {
        switch (this._type) {
            case MapType.Izumi: // 泉の城
            case MapType.Hyosetsu: // 氷雪の城
            case MapType.Sabaku: // 砂漠の城
            case MapType.Komorebi: // 木漏れ日の城
            case MapType.Wasurerareta: // 忘れられた城
            case MapType.Natsukusa: // 夏草の城
            case MapType.Syakunetsu: // 灼熱の城
            case MapType.Yukigesho: // 雪化粧の城
                return 1;
            case MapType.Haikyo: // 廃墟の城
                return 3;
            case MapType.Harukaze: // 春風の城
                return 3;
            case MapType.Arena_3:
                return 14;
            case MapType.Arena_7:
                return 2;
            case MapType.Arena_10:
                return 2;
            case MapType.Arena_12:
                return 12;
            case MapType.Arena_13:
                return 8;
            case MapType.Arena_16:
                return 2;
            case MapType.Arena_17:
                return 4;
            case MapType.Arena_18:
                return 4;
            case MapType.Arena_19:
                return 4;
            case MapType.Arena_21:
                return 8;
            case MapType.Arena_26:
                return 12;
            case MapType.Arena_29:
                return 8;
            case MapType.Arena_31: return 4;
            case MapType.Arena_33: return 8;
            case MapType.Arena_34: return 2;
            case MapType.Arena_46: return 8;
            case MapType.Arena_48: return 7;
            case MapType.Arena_49: return 4;
            case MapType.Arena_50: return 7;
            case MapType.ResonantBattles_Default:
                return 8;
            case MapType.ResonantBattles_1:
                return 6;
            case MapType.ResonantBattles_2:
                return 9;
            case MapType.ResonantBattles_3:
            case MapType.ResonantBattles_4:
                return 0;
            case MapType.ResonantBattles_5: return 5;
            case MapType.ResonantBattles_6: return 4;
            case MapType.ResonantBattles_7: return 5;
            case MapType.ResonantBattles_8: return 3;
            case MapType.TempestTrials_KojoNoTakaraSagashi: return 1;
            case MapType.TempestTrials_ButosaiNoKyodai: return 0;
            default:
                return 0;
        }
    }

    changeMapKind(mapKind, gameVersion) {
        if (this._type == mapKind && this._gameVersion == gameVersion) {
            return;
        }

        this._type = mapKind;
        this._gameVersion = gameVersion;
        this.resetPlacement();
    }

    resetPlacement(withUnits = false) {
        for (var i = 0; i < this._tiles.length; ++i) {
            var tile = this._tiles[i];
            tile.type = TileType.Normal;
            if (tile.obj != null) {
                if (tile.obj instanceof BreakableWall || tile.obj instanceof Wall) {
                    tile.setObj(null);
                }
            }
        }
        switch (this._type) {
            case MapType.Izumi: // 泉の城
                {
                    this.setTileType(0, 4, TileType.Flier);
                    this.setTileType(5, 2, TileType.Flier);
                }
                break;
            case MapType.Hyosetsu: // 氷雪の城
                {
                    this.setTileType(1, 2, TileType.Forest);
                    this.setTileType(4, 4, TileType.Forest);
                    this.setTileType(3, 5, TileType.Forest);
                }
                break;
            case MapType.Haikyo: // 廃墟の城
                {
                    if (this._gameVersion == 360) {
                        this.__placeObjForcibly(this._walls[0], 2, 4);
                        this.__placeObjForcibly(this._breakableWalls[0], 1, 4);
                    }
                    else {
                        this.__placeObjForcibly(this._walls[1], 1, 4);
                        this.__placeObjForcibly(this._breakableWalls[0], 2, 4);
                    }
                    this.__placeObjForcibly(this._breakableWalls[1], 4, 4);
                    this.__placeObjForcibly(this._breakableWalls[2], 0, 2);
                    this.__setBreakableWallIconType(BreakableWallIconType.Wall);
                }
                break;
            case MapType.Yukigesho: // 雪化粧の城
                {
                    if (this._gameVersion == 360) {
                        this.__placeObjForcibly(this._breakableWalls[0], 0, 4);
                    }
                    else {
                        this.__placeObjForcibly(this._walls[0], 0, 4);
                    }
                    this.setTileType(1, 3, TileType.DefensiveTrench);
                    this.setTileType(2, 5, TileType.Forest);
                    this.setTileType(5, 2, TileType.DefensiveTrench);
                    this.__setBreakableWallIconType(BreakableWallIconType.Wall);
                }
                break;
            case MapType.Sabaku: // 砂漠の城
                {
                    this.setTileType(2, 2, TileType.Flier);
                    this.setTileType(2, 5, TileType.Flier);
                    this.setTileType(3, 5, TileType.Flier);
                }
                break;
            case MapType.Harukaze: // 春風の城
                {
                    this.__placeObjForcibly(this._walls[0], 2, 5);
                    if (this._gameVersion == 360) {
                        this.__placeObjForcibly(this._breakableWalls[2], 5, 5);
                    }
                    else {
                        this.__placeObjForcibly(this._walls[1], 5, 5);
                    }

                    this.__placeObjForcibly(this._breakableWalls[0], 0, 2);
                    this.__placeObjForcibly(this._breakableWalls[1], 3, 2);
                    this.__setBreakableWallIconType(BreakableWallIconType.Wall);
                }
                break;
            case MapType.Komorebi: // 木漏れ日の城
                {
                    this.setTileType(1, 4, TileType.Trench);
                    this.setTileType(2, 4, TileType.Forest);
                    this.setTileType(3, 2, TileType.Trench);
                    this.setTileType(4, 2, TileType.Trench);
                }
                break;
            case MapType.Wasurerareta: // 忘れられた城
                {
                    this.setTileType(1, 2, TileType.DefensiveTile);
                    this.setTileType(2, 2, TileType.DefensiveTile);
                    this.setTileType(1, 3, TileType.Forest);
                    this.__placeObjForcibly(this._walls[0], 5, 4);
                }
                break;
            case MapType.Natsukusa: // 夏草の城
                {
                    this.setTileType(3, 2, TileType.Forest);
                    this.setTileType(4, 2, TileType.Forest);
                    this.setTileType(4, 5, TileType.Forest);
                }
                break;
            case MapType.Syakunetsu: // 灼熱の城
                {
                    this.setTileType(5, 2, TileType.Flier);
                    this.setTileType(2, 4, TileType.Flier);
                    this.setTileType(2, 5, TileType.Flier);
                }
                break;
            case MapType.Arena_1:
                this.setTileType(0, 0, TileType.Forest);
                this.setTileType(0, 4, TileType.Forest);
                this.setTileType(0, 7, TileType.Forest);
                this.setTileType(1, 2, TileType.Forest);
                this.setTileType(2, 4, TileType.Forest);
                this.setTileType(2, 5, TileType.Forest);
                this.setTileType(2, 7, TileType.Forest);
                this.setTileType(3, 0, TileType.Forest);
                this.setTileType(3, 2, TileType.Forest);
                this.setTileType(3, 3, TileType.Forest);
                this.setTileType(4, 0, TileType.Forest);
                this.setTileType(4, 5, TileType.Forest);
                this.setTileType(5, 2, TileType.Forest);
                this.setTileType(5, 4, TileType.Forest);
                this.setTileType(5, 7, TileType.Forest);

                if (withUnits) {
                    this.__placeEnemyUnitBySlotIfExists(0, 1, 1);
                    this.__placeEnemyUnitBySlotIfExists(1, 2, 1);
                    this.__placeEnemyUnitBySlotIfExists(2, 3, 1);
                    this.__placeEnemyUnitBySlotIfExists(3, 4, 1);

                    this.__placeAllyUnitBySlotIfExists(0, 1, 6);
                    this.__placeAllyUnitBySlotIfExists(1, 2, 6);
                    this.__placeAllyUnitBySlotIfExists(2, 3, 6);
                    this.__placeAllyUnitBySlotIfExists(3, 4, 6);
                }

                break;
            case MapType.Arena_2:
                this.setTileType(0, 1, TileType.Flier);
                this.setTileType(0, 2, TileType.Flier);
                this.setTileType(0, 3, TileType.Forest);
                this.setTileType(0, 5, TileType.Flier);
                this.setTileType(0, 6, TileType.Flier);
                this.setTileType(0, 7, TileType.Flier);
                this.setTileType(2, 1, TileType.Flier);
                this.setTileType(2, 2, TileType.Flier);
                this.setTileType(2, 4, TileType.Forest);
                this.setTileType(2, 5, TileType.Flier);
                this.setTileType(2, 6, TileType.Flier);
                this.setTileType(4, 0, TileType.Forest);
                this.setTileType(4, 1, TileType.Flier);
                this.setTileType(4, 2, TileType.Flier);
                this.setTileType(4, 3, TileType.Forest);
                this.setTileType(4, 5, TileType.Flier);
                this.setTileType(4, 6, TileType.Flier);
                this.setTileType(5, 0, TileType.Flier);
                this.setTileType(5, 1, TileType.Flier);
                this.setTileType(5, 2, TileType.Flier);
                this.setTileType(5, 3, TileType.Forest);
                this.setTileType(5, 5, TileType.Flier);
                this.setTileType(5, 6, TileType.Flier);
                this.setTileType(5, 7, TileType.Forest);

                if (withUnits) {
                    this.__placeEnemyUnitBySlotIfExists(0, 0, 0);
                    this.__placeEnemyUnitBySlotIfExists(1, 1, 0);
                    this.__placeEnemyUnitBySlotIfExists(2, 2, 0);
                    this.__placeEnemyUnitBySlotIfExists(3, 3, 0);

                    this.__placeAllyUnitBySlotIfExists(0, 1, 7);
                    this.__placeAllyUnitBySlotIfExists(1, 2, 7);
                    this.__placeAllyUnitBySlotIfExists(2, 3, 7);
                    this.__placeAllyUnitBySlotIfExists(3, 4, 7);
                }
                break;
            case MapType.Arena_3:
                this.__placeBreakableWalls([
                    [0, 2], [2, 2], [5, 2],
                    [0, 3], [2, 3], [3, 3], [5, 3],
                    [0, 4], [2, 4], [3, 4], [5, 4],
                    [0, 5], [3, 5], [5, 5],
                ], BreakableWallIconType.Wall3);
                if (withUnits) {
                    this.__placeElemyUnits([[1, 7], [2, 7], [3, 7], [4, 7]]);
                    this.__placeAllyUnits([[1, 0], [2, 0], [3, 0], [4, 0]]);
                }
                break;
            case MapType.Arena_4:
                this.__setTileTypes([
                    [1, 0], [2, 0], [4, 0], [5, 0],
                    [0, 2], [1, 2], [3, 2], [4, 2],
                    [1, 4], [2, 4], [4, 4], [5, 4],
                    [0, 6], [1, 6], [3, 6], [4, 6],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnits([[1, 1], [2, 1], [3, 1], [4, 1]]);
                    this.__placeAllyUnits([[0, 7], [1, 7], [4, 7], [5, 7]]);
                }
                break;
            case MapType.Arena_5:
                this.__setTileTypes([
                    [3, 1],
                    [2, 2], [3, 2],
                    [2, 3], [3, 3],
                    [2, 4], [3, 4],
                    [2, 5], [3, 5],
                    [2, 6],
                ], TileType.Flier);
                this.__setTileTypes([
                    [4, 1],
                    [2, 1],
                    [4, 4],
                    [1, 5],
                    [3, 6],
                    [5, 7],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnits([[5, 1], [5, 2], [5, 5], [5, 6]]);
                    this.__placeAllyUnits([[0, 0], [0, 1], [0, 6], [0, 7]]);
                }
                break;
            case MapType.Arena_6:
                this.__setTileTypes([
                    [2, 3], [3, 3],
                    [2, 4], [3, 4],
                ], TileType.Flier);
                this.__setTileTypes([
                    [0, 0], [0, 7],
                    [1, 3],
                    [2, 5],
                    [3, 2], [3, 7],
                    [4, 0],
                    [5, 0], [5, 7],
                ], TileType.Forest);
                this.__setTileTypes([
                    [0, 2], [1, 2], [5, 2],
                    [4, 4],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeAllyUnits([[2, 0], [3, 0], [2, 1], [3, 1]]);
                    this.__placeElemyUnits([[1, 6], [2, 6], [3, 6], [4, 6]]);
                }
                break;
            case MapType.Arena_7:
                this.__placeWalls([
                    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
                    [0, 1], [1, 1],
                    [0, 6], [2, 6], [5, 6],
                ]);
                this.__placeBreakableWalls([
                    [5, 3], [0, 4],
                ], BreakableWallIconType.Wall2);
                this.__setTileTypes([
                    [1, 3],
                    [4, 2],
                    [1, 4],
                ], TileType.Flier);
                this.__setTileTypes([
                    [2, 3], [3, 3],
                    [2, 4], [4, 4],
                    [3, 5], [4, 5],
                ], TileType.Trench);
                this.__setTileTypes([
                    [4, 3],
                    [3, 4],
                    [2, 5],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnits([[2, 1], [3, 1], [4, 1], [5, 1]]);
                    this.__placeAllyUnits([[1, 7], [2, 7], [3, 7], [4, 7]]);
                }
                break;
            case MapType.Arena_8:
                this.__setTileTypesByPosYX([
                    [1, 4],
                    [2, 1],
                    [3, 3], [3, 4],
                    [5, 1], [5, 3],
                    [6, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 3],
                    [4, 1],
                    [5, 0], [5, 4], [5, 5],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_9:
                this.__setTileTypesByPosYX([
                    [0, 3],
                    [2, 4],
                    [5, 1],
                    [7, 2],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 1],
                    [6, 4],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [3, 2], [4, 3],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [0, 5],
                    [2, 1], [2, 2],
                    [5, 3], [5, 4],
                    [7, 0],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [3, 3],
                    [4, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnits([[0, 1], [0, 2], [0, 5], [0, 6]]);
                    this.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_10:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 1], [1, 4],
                    [3, 0], [3, 5],
                    [5, 0], [5, 3], [5, 4],
                    [6, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [4, 2],
                    [4, 3],
                ], TileType.Trench);
                this.__placeBreakableWallsByPosYX([
                    [3, 1], [3, 2],
                ], BreakableWallIconType.Wall2);
                this.__setTileTypesByPosYX([
                    [5, 1],
                    [6, 1], [6, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 3], [0, 4], [1, 5], [2, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 1], [7, 2]]);
                }
                break;
            case MapType.Arena_11:
                this.__setTileTypesByPosYX([
                    [0, 2], [0, 3],
                    [1, 2], [1, 3],
                    [3, 0], [3, 1], [3, 4], [3, 5],
                    [5, 1], [5, 4],
                    [7, 2], [7, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 0], [2, 1], [2, 4], [2, 5],
                    [4, 0], [4, 1], [4, 4], [4, 5],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[1, 0], [1, 1], [1, 4], [1, 5]]);
                    this.__placeElemyUnitsByPosYX([[6, 0], [6, 1], [6, 4], [6, 5]]);
                }
                break;
            case MapType.Arena_12:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5],
                    [7, 0], [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 2],
                    [2, 3], [2, 4],
                    [3, 1], [3, 2],
                    [4, 3], [4, 4],
                    [5, 1], [5, 2],
                    [6, 3], [6, 4],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [1, 3], [1, 4],
                    [2, 1], [2, 2],
                    [3, 3], [3, 4],
                    [4, 1], [4, 2],
                    [5, 3], [5, 4],
                    [6, 1], [6, 2],
                ], BreakableWallIconType.Wall3);

                if (withUnits) {
                    this.__placeAllyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeElemyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_13:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1],
                    [1, 0],
                    [2, 0], [2, 1],
                    [3, 0], [3, 1], [3, 4], [3, 5],
                    [4, 0], [4, 5],
                    [5, 5],
                    [6, 0], [6, 5],
                    [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
                ], TileType.Flier);
                this.__placeBreakableWallsByPosYX([
                    [2, 2], [2, 3], [2, 4], [2, 5],
                    [4, 1], [4, 2], [4, 3], [4, 4],
                ], BreakableWallIconType.Box);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[5, 1], [5, 2], [6, 1], [6, 2]]);
                }
                break;
            case MapType.Arena_14:
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 4],
                    [2, 0], [2, 2], [2, 3], [2, 5],
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                    [5, 0], [5, 2], [5, 3], [5, 5],
                    [6, 1], [6, 4],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 4],
                    [5, 1], [5, 4],
                ], TileType.DefensiveForest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_15:
                this.__setTileTypesByPosYX([
                    [3, 3], [3, 4],
                    [4, 1], [4, 2],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [3, 1], [4, 4],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [0, 0], [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 2],
                    [2, 2], [2, 3],
                    [5, 2], [5, 3],
                    [6, 3], [6, 4],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[1, 4], [1, 5], [2, 4], [2, 5]]);
                    this.__placeElemyUnitsByPosYX([[5, 0], [5, 1], [6, 0], [6, 1]]);
                }
                break;
            case MapType.Arena_16:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 5],
                    [6, 0], [6, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 3],
                    [5, 2], [5, 3],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [3, 2], [4, 5],
                ], BreakableWallIconType.Wall3);
                this.__placeWallsByPosYX([
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                ]);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_17:
                this.__setTileTypesByPosYX([
                    [2, 4], [4, 1],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 4], [2, 3], [2, 5], [3, 4],
                    [3, 1], [4, 0], [4, 2], [5, 1],
                ], TileType.Trench);
                this.__placeBreakableWallsByPosYX([
                    [2, 0], [2, 2],
                    [4, 3], [4, 5],
                ], BreakableWallIconType.Wall2);
                this.__placeWallsByPosYX([
                    [0, 0], [5, 4],
                    [6, 1], [7, 5],
                ]);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[6, 2], [6, 3], [7, 2], [7, 3]]);
                }
                break;
            case MapType.Arena_18:
                this.__placeBreakableWallsByPosYX([
                    [2, 2], [2, 4],
                    [3, 1], [3, 3], [3, 5],
                ], BreakableWallIconType.Wall2);
                this.__placeWallsByPosYX([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                ]);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 2], [1, 4], [1, 5],
                    [2, 1], [2, 5],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [3, 2], [3, 4], [4, 3],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [5, 2], [6, 4], [7, 0],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 3],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_19:
                this.__placeBreakableWallsByPosYX([
                    [3, 2], [3, 3], [4, 2], [4, 3],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [0, 3], [0, 4], [0, 5],
                    [1, 5],
                    [2, 3],
                    [3, 4],
                    [4, 1],
                    [5, 2],
                    [6, 0],
                    [7, 0], [7, 1], [7, 2],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 2], [3, 1], [4, 4], [5, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [2, 0], [5, 5],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [1, 0], [1, 2], [2, 1]]);
                    this.__placeAllyUnitsByPosYX([[5, 4], [6, 3], [6, 5], [7, 4]]);
                }
                break;
            case MapType.Arena_20:
                this.__setTileTypesByPosYX([
                    [0, 0], [1, 0],
                    [3, 2],
                    [4, 5],
                    [5, 2],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 2], [1, 3],
                    [7, 2], [7, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 4],
                    [4, 1], [4, 3],
                    [6, 4],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 0], [7, 1]]);
                }
                break;
            case MapType.Arena_21:
                this.__placeBreakableWalls([
                    [1, 2], [1, 3], [1, 4], [1, 5],
                    [4, 2], [4, 3], [4, 4], [4, 5],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 5],
                    [3, 0], [3, 3],
                    [4, 2], [4, 5],
                    [5, 0], [5, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_22:
                this.__setTileTypesByPosYX([
                    [0, 1], [0, 5],
                    [3, 3],
                    [4, 1], [4, 5],
                    [6, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 2], [1, 4],
                    [3, 0], [3, 2], [3, 4],
                    [5, 0], [5, 2], [5, 4],
                    [7, 0], [7, 2], [7, 4],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 4], [0, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 1], [6, 2], [6, 4], [6, 5]]);
                }
                break;
            case MapType.Arena_23:
                this.__setTileTypesByPosYX([
                    [0, 2], [0, 3],
                    [2, 1], [2, 2], [2, 3], [2, 4],
                    [5, 1], [5, 2], [5, 3], [5, 4],
                    [7, 2], [7, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [3, 2], [3, 3],
                    [4, 2], [4, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_24:
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 2],
                    [3, 0], [3, 1], [3, 3], [3, 4],
                    [4, 1], [4, 4],
                    [5, 2], [5, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 5],
                    [2, 3],
                    [4, 2], [4, 5],
                    [5, 4],
                    [6, 1],
                ], TileType.DefensiveForest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_25:
                this.__setTileTypesByPosYX([
                    [3, 2], [3, 3],
                    [4, 2], [4, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 4],
                    [5, 1], [5, 4],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 3],
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                    [5, 2], [5, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_26:
                this.__placeBreakableWallsByPosYX([
                    [2, 1], [2, 3], [2, 5],
                    [3, 0], [3, 2], [3, 4],
                    [4, 1], [4, 3], [4, 5],
                    [5, 0], [5, 2], [5, 4],
                ], BreakableWallIconType.Wall2);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;

            case MapType.Arena_27:
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 2],
                    [5, 3], [5, 4],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 3],
                    [2, 4],
                    [3, 4],
                    [4, 1],
                    [5, 1],
                    [7, 2],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_28:
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 4],
                    [4, 3],
                    [5, 1], [5, 5],
                    [6, 0],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 0], [1, 2], [1, 3], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_29:
                this.__placeWallsByPosYX([
                    [0, 1], [0, 4],
                    [2, 1], [2, 4],
                    [5, 1], [5, 4],
                    [7, 1], [7, 4],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 1], [1, 4],
                    [2, 3],
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                    [5, 2],
                    [6, 1], [6, 4],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5],
                    [3, 2],
                    [7, 0], [7, 3],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeAllyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeElemyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_30:
                this.__placeWallsByPosYX([
                    [3, 0], [3, 2], [3, 4],
                    [7, 0], [7, 2], [7, 4],
                ]);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 3], [1, 5],
                    [5, 1], [5, 3], [5, 5],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [6, 2], [6, 3]]);
                }
                break;
            case MapType.Arena_31:
                this.__placeWallsByPosYX([
                    [7, 2],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [3, 3],
                    [4, 0, 2], [4, 1],
                    [7, 3],
                ], BreakableWallIconType.Wall3);

                this.__setTileTypesByPosYX([
                    [2, 4],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 3], [0, 4],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 5],
                    [1, 5],
                    [3, 2], [4, 2],
                    [5, 0],
                    [6, 0], [6, 1],
                    [7, 0], [7, 1],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[5, 5], [6, 4], [6, 5], [7, 4]]);
                    this.__placeAllyUnitsByPosYX([[1, 0], [1, 1], [2, 0], [2, 1]]);
                }
                break;
            case MapType.Arena_32:
                this.__placeWallsByPosYX([
                    [3, 2], [4, 2],
                ]);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5], [2, 3], [3, 3], [4, 3],
                    [7, 0], [7, 1], [7, 4], [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 1], [0, 3], [0, 4],
                    [1, 0],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [5, 2],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [5, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [7, 2], [7, 3],
                ], TileType.DefensiveTrench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[2, 5], [3, 4], [4, 4], [5, 5]]);
                    this.__placeAllyUnitsByPosYX([[2, 0], [3, 1], [4, 1], [5, 0]]);
                }
                break;
            case MapType.Arena_33:
                this.__placeWallsByPosYX([
                    [0, 0], [5, 5],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 0],
                    [4, 5], [5, 3], [5, 4],
                    [6, 2], [6, 5],
                    [7, 0], [7, 5],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [4, 2],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 3],
                    [4, 4],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [5, 0],
                ], TileType.DefensiveTrench);

                this.__setTileTypesByPosYX([
                    [2, 2], [2, 5], [3, 1], [3, 2], [3, 5],
                    [4, 1],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [1, 1], [1, 4]]);
                    this.__placeAllyUnitsByPosYX([[6, 1], [6, 3], [7, 2], [7, 4]]);
                }
                break;
            case MapType.Arena_34:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 2],
                    [1, 0], [1, 1],
                    [2, 0], [2, 1], [2, 2],
                    [3, 0], [3, 1],
                    [4, 0],
                    [5, 0], [5, 1],
                    [6, 0],
                    [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 3], [1, 2],
                    [3, 4], [3, 5],
                    [6, 4], [6, 5],
                    [7, 3], [7, 4],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [4, 1],
                    [7, 0],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [4, 2, 2], [4, 3],
                ], BreakableWallIconType.Wall3);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[5, 4], [6, 2], [6, 3], [7, 2]]);
                }
                break;
            case MapType.Arena_35:
                this.__setTileTypesByPosYX([
                    [0, 2], [0, 3], [0, 4], [0, 5],
                    [2, 2], [2, 3],
                    [3, 0], [3, 2], [3, 3],
                    [4, 0], [4, 2],
                    [5, 2], [5, 3], [5, 4],
                    [7, 2], [7, 3], [7, 4], [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 0],
                    [0, 1],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [3, 1],
                    [4, 1], [4, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 4], [1, 5], [2, 4], [2, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 0], [7, 1]]);
                }
                break;
            case MapType.Arena_46:
                this.__setTileTypesByPosYX([
                    [3, 1], [3, 2], [3, 4],
                    [4, 1], [4, 3], [4, 4],
                ], TileType.Flier);
                this.__placeWallsByPosYX([
                    [2, 3],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [0, 2], [0, 3],
                    [2, 2],
                    [3, 3],
                    [4, 2],
                    [6, 3],
                    [7, 2], [7, 3, 2],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [0, 0],
                    [0, 5],
                    [5, 3],
                    [7, 0],
                    [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 3],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [5, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 5], [2, 5], [5, 5], [6, 5]]);
                    this.__placeAllyUnitsByPosYX([[1, 0], [2, 0], [5, 0], [6, 0]]);
                }
                break;
            case MapType.Arena_47:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 2], [0, 4], [0, 5],
                    [1, 0],
                    [2, 3], [2, 4],
                    [4, 0], [4, 2], [4, 3],
                    [6, 2], [6, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 3],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [2, 2], [4, 4], [5, 3],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [1, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [3, 4],
                    [7, 2],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 5], [2, 5], [5, 5], [6, 5]]);
                    this.__placeAllyUnitsByPosYX([[2, 0], [3, 0], [6, 0], [7, 0]]);
                }
                break;
            case MapType.Arena_48:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 3], [1, 5],
                    [6, 0], [6, 3], [6, 5],
                ], TileType.Flier);
                this.__placeWallsByPosYX([
                    [4, 0], [4, 3], [4, 5],
                    [5, 0],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [2, 0], [2, 1],
                    [3, 0], [3, 1], [3, 2], [3, 5],
                    [5, 3],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [3, 3],
                    [4, 1], [4, 2],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [4, 4],
                ], TileType.DefensiveTrench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                    this.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                }
                break;
            case MapType.Arena_49:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 3], [1, 4],
                    [2, 4],
                    [5, 1],
                    [6, 1], [6, 2], [6, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5],
                    [2, 0],
                    [3, 0],
                    [4, 5],
                    [5, 5],
                    [7, 0], [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [3, 3],
                    [4, 2],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [3, 1], [3, 2],
                    [4, 3], [4, 4],
                ], BreakableWallIconType.Wall3);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                    this.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                }
                break;
            case MapType.Arena_50:
                this.__placeWallsByPosYX([
                    [0, 0], [0, 1], [0, 5],
                    [1, 1], [1, 4], [1, 5],
                    [3, 0],
                    [5, 0], [5, 5],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [0, 4, 2],
                    [1, 0],
                    [3, 2, 2], [3, 3], [3, 5],
                    [5, 1], [5, 3],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [6, 0], [6, 5],
                    [7, 0], [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [3, 1], [3, 4],
                    [5, 2],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [4, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [1, 2], [1, 3]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.ResonantBattles_Default:
                break;
            case MapType.ResonantBattles_1:
                this.__placeWallsByPosYX([
                    [0, 1], [0, 2], [3, 4],
                    [5, 7],
                    [6, 6],
                    [7, 1],
                    [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 4],
                    [2, 3],
                    [3, 3],
                    [6, 7],
                    [7, 0], [7, 6],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [1, 6],
                    [2, 0],
                    [4, 7],
                    [5, 2],
                    [6, 4],
                    [7, 3],
                    [8, 7],
                    [9, 0],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 1], [2, 4], [3, 0], [3, 2], [3, 5],
                        [4, 2], [4, 4], [4, 7],
                        [5, 0], [5, 6],
                        [6, 1], [6, 5],
                    ]);
                }
                break;
            case MapType.ResonantBattles_2:
                this.__placeWallsByPosYX([
                    [0, 3], [0, 4],
                    [3, 2], [3, 5],
                    [6, 3], [6, 4],
                    [9, 0], [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 1], [1, 7],
                    [2, 5],
                    [6, 1], [6, 5], [6, 7],
                    [7, 0], [7, 2], [7, 6],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [3, 1],
                    [3, 7],
                    [4, 0],
                    [4, 6],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 1], [2, 4],
                        [3, 0], [3, 4], [3, 7],
                        [4, 2], [4, 3], [4, 5],
                        [5, 0], [5, 6], [5, 7],
                        [6, 2],
                    ]);
                }
                break;
            case MapType.ResonantBattles_3:
                this.__placeWallsByPosYX([
                    [9, 7],
                ]);

                this.__setTileTypesByPosYX([
                    [0, 0], [0, 4], [0, 7],
                    [1, 3], [1, 4], [1, 7],
                    [2, 3],
                    [4, 4],
                    [5, 4],
                    [6, 0], [6, 3], [6, 4],
                    [7, 0], [7, 1], [7, 7],
                    [8, 0], [8, 6], [8, 7],
                    [9, 0], [9, 6],
                ], TileType.Flier);

                this.__setTileTypesByPosYX([
                    [0, 2], [0, 6],
                    [3, 0],
                    [5, 7],
                    [7, 3],
                    [9, 1],
                ], TileType.Forest);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 0], [2, 1], [2, 7],
                        [3, 3], [3, 4], [3, 5], [3, 6],
                        [4, 2],
                        [5, 0], [5, 3], [5, 6],
                        [6, 7],
                    ]);
                }
                break;
            case MapType.ResonantBattles_4:
                this.__placeWallsByPosYX([
                    [0, 2], [0, 3],
                    [2, 5],
                    [3, 7],
                    [6, 6],
                    [8, 0],
                    [9, 7]
                ]);
                this.__setTileTypesByPosYX([
                    [4, 3],
                    [6, 1],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [4, 2],
                    [4, 6],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 4], [1, 7],
                    [2, 7],
                    [3, 3],
                    [4, 5],
                    [5, 1],
                    [6, 4],
                    [7, 6],
                    [8, 2]
                ], TileType.Forest);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 2], [2, 3],
                        [3, 5], [3, 6],
                        [4, 0], [4, 1], [4, 4],
                        [5, 3], [5, 5], [5, 6], [5, 7],
                        [6, 3],
                    ]);
                }
                break;
            case MapType.ResonantBattles_5:
                this.__placeWallsByPosYX([
                    [0, 1], [0, 2], [0, 6],
                    [1, 4], [1, 5],
                    [2, 2],
                    [3, 7],
                    [4, 2],
                    [5, 0],
                    [6, 3],
                    [7, 1], [7, 2],
                    [9, 0], [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [2, 5],
                    [4, 5],
                    [5, 5],
                    [6, 4],
                    [8, 1],
                ], BreakableWallIconType.Wall);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 6],
                        [3, 1],
                        [3, 2], [3, 4],
                        [3, 5], [4, 0], [4, 4],
                        [5, 2], [5, 3], [5, 6], [5, 7],
                        [6, 1],
                    ]);
                }
                break;
            case MapType.ResonantBattles_6:
                this.__placeWallsByPosYX([
                    [4, 3], [4, 4],
                    [9, 0], [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [7, 1], [7, 3], [7, 4], [7, 6],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [0, 3],
                    [2, 7],
                    [5, 0],
                    [8, 7],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [5, 2],
                    [5, 5],
                ], TileType.Trench);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 3],
                        [2, 4],
                        [3, 0], [3, 1],
                        [3, 5], [3, 6], [4, 2],
                        [5, 4], [5, 7], [6, 0], [6, 7],
                        [7, 2],
                    ]);
                }
                break;
            case MapType.ResonantBattles_7:
                this.__placeWallsByPosYX([
                    [0, 2], [4, 5],
                    [5, 2], [8, 0],
                    [9, 7]
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 3], [1, 5],
                    [4, 0], [6, 6],
                    [8, 1],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [2, 0],
                    [2, 7],
                    [7, 4],
                    [7, 7],
                ], TileType.Flier);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 2],
                        [2, 5],
                        [3, 0], [3, 2],
                        [3, 5], [3, 7], [4, 4],
                        [5, 3], [5, 7], [6, 0], [6, 5],
                        [7, 1],
                    ]);
                }
                break;
            case MapType.ResonantBattles_8:
                this.__placeWallsByPosYX([[0, 2], [0, 3], [0, 4], [0, 5], [9, 0], [9, 7],]);
                this.__placeBreakableWallsByPosYX([[1, 4], [7, 7], [8, 2],], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([[4, 3], [4, 4], [5, 3], [5, 4],], TileType.Flier);
                this.__setTileTypesByPosYX([[3, 2], [4, 7], [5, 0], [6, 6], [7, 1],], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[2, 3], [2, 5], [3, 0], [3, 1], [3, 5], [4, 7], [5, 1], [5, 2], [5, 6], [6, 4], [7, 0], [7, 6],]);
                }
                break;
            case MapType.TempestTrials_KojoNoTakaraSagashi:
                this.__placeWallsByPosYX([
                    [1, 0], [1, 1],
                    [3, 4],
                    [4, 0],
                    [7, 5],
                ]);

                this.__placeBreakableWallsByPosYX([
                    [6, 2],
                ], BreakableWallIconType.Box);

                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
                    [1, 3], [1, 4],
                    [3, 3],
                    [5, 3],
                    [7, 0], [7, 3],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[2, 0], [2, 1], [2, 2], [3, 1]]);
                    this.__placeElemyUnitsByPosYX([[2, 5], [5, 5], [6, 4], [7, 2], [7, 4]]);
                }
                break;
            case MapType.TempestTrials_ButosaiNoKyodai:
                this.__placeWallsByPosYX([
                    [6, 0], [6, 1],
                    [7, 0], [7, 1],
                ]);

                this.__setTileTypesByPosYX([
                    [0, 0],
                    [1, 0], [1, 5],
                    [2, 5],
                    [3, 1],
                    [4, 4],
                    [6, 4],
                ], TileType.Forest);

                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[0, 2], [0, 3], [1, 2], [1, 3]]);
                    this.__placeElemyUnitsByPosYX([[3, 0], [3, 5], [5, 0], [5, 5], [7, 2]]);
                }
                break;
            default:
                throw new Error("unexpected map kind " + this._type);
        }

        if (withUnits) {
            if (MapType_ResonantBattlesOffset <= this._type && this._type < MapType_TempestTrialsOffset) {
                // 双界の味方配置はどのマップも同じ
                this.__placeAllyUnitsByPosYX([[9, 2], [9, 3], [9, 4], [9, 5]]);
            }
        }
    }

    updateSourceCode() {
        let result = "// マップのセットアップ\n";
        result += this.__createSourceCodeForWallPlacement();
        result += this.__createSourceCodeForBreakableWallPlacement();
        result += this.__createSourceCodeForTileTypeSetting("Flier", TileType.Flier);
        result += this.__createSourceCodeForTileTypeSetting("Forest", TileType.Forest);
        result += "if (withUnits) {\n";
        result += this.__createSourceCodeForUnitPlacement(UnitGroupType.Enemy);
        result += "}\n";
        result += "// 敵のセットアップ\n"
        result += this.__createSourceCodeForEnemyUnitSetup();
        this.sourceCode = result;
    }
    __createSourceCodeForEnemyUnitSetup() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.placedUnit != null && x.placedUnit.groupId == UnitGroupType.Enemy)) {
            let unit = tile.placedUnit;
            elems += `[${unit.heroIndex},`;
            elems += `[${unit.weapon},${unit.weaponRefinement},${unit.support},${unit.special},${unit.passiveA},${unit.passiveB},${unit.passiveC},${unit.passiveS}],`;
            elems += `[${unit.hpAdd},${unit.atkAdd},${unit.spdAdd},${unit.defAdd},${unit.resAdd}],`;
            elems += `[${unit.hpGrowthRate},${unit.defGrowthRate},${unit.resGrowthRate}]],\n`;
        }
        if (elems == "") {
            return "";
        }
        return `heroInfos = [${elems}];`;
    }
    __createSourceCodeForUnitPlacement(groupType) {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.placedUnit != null && x.placedUnit.groupId == groupType)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        switch (groupType) {
            case UnitGroupType.Enemy: return `this.__placeElemyUnitsByPosYX([${elems}]);\n`;
            case UnitGroupType.Ally: return `this.__placeAllyUnitsByPosYX([${elems}]);\n`;
            default:
                throw new Error("invalid group type");
        }
    }
    __createSourceCodeForWallPlacement() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.obj instanceof Wall)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `this.__placeWallsByPosYX([${elems}]);\n`;
    }
    __createSourceCodeForBreakableWallPlacement() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.obj instanceof BreakableWall)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `this.__placeBreakableWallsByPosYX([${elems}], BreakableWallIconType.Wall);\n`;
    }
    __createSourceCodeForTileTypeSetting(tileTypeText, tileType) {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.type == tileType)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `this.__setTileTypesByPosYX([${elems}],TileType.${tileTypeText});\n`;
    }

    __setTileTypesByPosYX(positions, tileType) {
        for (let pos of positions) {
            this.setTileType(pos[1], pos[0], tileType);
        }
    }
    __setTileTypes(positions, tileType) {
        for (let pos of positions) {
            this.setTileType(pos[0], pos[1], tileType);
        }
    }
    __placeBreakableWalls(positions, type = BreakableWallIconType.Wall) {
        this.__placeBreakableWallsImpl(positions, 0, 1, type);
    }
    __placeBreakableWallsImpl(positions, xIndex, yIndex, type = BreakableWallIconType.Wall) {
        let i = 0;
        for (let pos of positions) {
            let wall = this._breakableWalls[i];
            wall.iconType = type;
            this.__placeObjForcibly(wall, pos[xIndex], pos[yIndex]);
            if (pos.length == 3) {
                let breakCount = pos[2];
                wall.breakCount = breakCount;
            } else {
                wall.breakCount = 1;
            }
            ++i;
        }
    }
    __setBreakableWallIconType(type) {
        for (let wall of this._breakableWalls) {
            wall.iconType = type;
        }
    }
    getBreakableWall(index) {
        if (index >= this._breakableWalls.length) {
            return null;
        }
        return this._breakableWalls[index];
    }
    getWall(index) {
        if (index >= this._walls.length) {
            return null;
        }
        return this._walls[index];
    }
    countWallsOnMap() {
        return this.countObjs(x => x instanceof Wall);
    }
    countBreakableWallsOnMap() {
        return this.countObjs(x => x instanceof BreakableWall);
    }
    __placeWalls(positions) {
        let i = 0;
        for (let pos of positions) {
            this.__placeObjForcibly(this._walls[i], pos[0], pos[1]);
            ++i;
        }
    }
    __placeBreakableWallsByPosYX(positions, type = BreakableWallIconType.Wall) {
        this.__placeBreakableWallsImpl(positions, 1, 0, type);
    }
    __placeWallsByPosYX(positions) {
        let i = 0;
        for (let pos of positions) {
            this.__placeObjForcibly(this._walls[i], pos[1], pos[0]);
            ++i;
        }
    }
    __placeElemyUnits(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeEnemyUnitBySlotIfExists(slot, pos[0], pos[1]);
            ++slot;
        }
    }
    __placeElemyUnitsByPosYX(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeEnemyUnitBySlotIfExists(slot, pos[1], pos[0]);
            ++slot;
        }
        this.__removeUnitsForGreaterSlotOrder(UnitGroupType.Enemy, positions.length - 1);
    }
    __placeAllyUnits(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeAllyUnitBySlotIfExists(slot, pos[0], pos[1]);
            ++slot;
        }
    }
    __placeAllyUnitsByPosYX(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeAllyUnitBySlotIfExists(slot, pos[1], pos[0]);
            ++slot;
        }
        this.__removeUnitsForGreaterSlotOrder(UnitGroupType.Ally, positions.length - 1);
    }
    __placeEnemyUnitBySlotIfExists(slotOrder, px, py) {
        let unit = this.__getEnemyUnit(slotOrder);
        if (unit == null) {
            return;
        }
        this.placeUnitForcibly(unit, px, py);
    }
    __placeAllyUnitBySlotIfExists(slotOrder, px, py) {
        let unit = this.__getAllyUnit(slotOrder);
        if (unit == null) {
            return;
        }
        this.placeUnitForcibly(unit, px, py);
    }
    __getEnemyUnit(slot) {
        return this.__getUnit(UnitGroupType.Enemy, slot);
    }
    __getAllyUnit(slot) {
        return this.__getUnit(UnitGroupType.Ally, slot);
    }
    __getUnit(groupId, slotOrder) {
        for (let unit of this._units) {
            if (unit.groupId == groupId && unit.slotOrder == slotOrder) {
                return unit;
            }
        }
        return null;
    }

    __removeUnitsForGreaterSlotOrder(groupId, slotOrderThreshold) {
        let removeTargets = [];
        for (let unit of this._units) {
            if (unit.groupId == groupId && unit.slotOrder > slotOrderThreshold) {
                removeTargets.push(unit);
            }
        }
        for (let unit of removeTargets) {
            this.removeUnit(unit);
        }
    }

    __placeObjForcibly(obj, posX, posY) {
        let tile = this.getTile(posX, posY);
        let oldObj = tile.obj;
        tile.setObj(null);
        this.placeObj(obj, posX, posY);
        if (oldObj != null) {
            this.placeObj(oldObj, posX, posY);
        }
    }

    // 指定ユニットの近くのユニットを列挙します。
    // distance: 近くと判定するユニットからのタイル数
    *enumerateNeighboringUnits(unit, distance) {
        var tile = this.findTileUnitPlaced(unit.id);
        if (tile != null) {
            var enumeratedUnits = [unit];
            for (let neighborTile of this.__enumerateNeighboringTiles(tile, distance)) {
                var neighborUnit = neighborTile.placedUnit;
                if (neighborUnit == null) {
                    continue;
                }
                if (enumeratedUnits.includes(neighborUnit)) {
                    continue;
                }

                yield neighborUnit;
                enumeratedUnits.push(neighborUnit);
            }
        }
    }

    *__enumerateNeighboringTiles(tile, distance) {
        if (distance > 0) {
            for (var i = 0; i < tile.neighbors.length; ++i) {
                var neighbor = tile.neighbors[i];
                yield neighbor;
                for (let neighborNeighbor of this.__enumerateNeighboringTiles(neighbor, distance - 1)) {
                    yield neighborNeighbor;
                }
            }
        }
    }

    *enumerateWallsOnMap() {
        for (let obj of this.enumerateObjs(x => x instanceof Wall)) {
            yield obj;
        }
    }

    *enumerateWalls() {
        for (var i = 0; i < this._walls.length; ++i) {
            var obj = this._walls[i];
            yield obj;
        }
    }

    *enumerateBreakableWalls() {
        for (var i = 0; i < this._breakableWalls.length; ++i) {
            var obj = this._breakableWalls[i];
            yield obj;
        }
    }

    *enumerateBreakableStructures(groupId) {
        for (let obj of this.enumerateBreakableWallsOfCurrentMapType()) {
            if (obj.isOnMap) {
                yield obj;
            }
        }
        switch (groupId) {
            case UnitGroupType.Ally:
                for (let obj of this.enumerateObjs(x => x instanceof DefenceStructureBase && x.isBreakable)) {
                    yield obj;
                }
                break;
            case UnitGroupType.Enemy:
                for (let obj of this.enumerateObjs(x => x instanceof OffenceStructureBase && x.isBreakable)) {
                    yield obj;
                }
                break;
            default:
                throw new Error("unexpected UnitGroupType " + groupId);
        }
    }

    countObjs(predicatorFunc) {
        let count = 0;
        for (let tile of this._tiles) {
            if (tile.obj == null) {
                continue;
            }
            if (predicatorFunc(tile.obj)) {
                ++count;
            }
        }
        return count;
    }

    *enumerateObjs(predicatorFunc) {
        for (let tile of this._tiles) {
            if (tile.obj == null) {
                continue;
            }
            if (predicatorFunc(tile.obj)) {
                yield tile.obj;
            }
        }
    }

    *enumerateBreakableWallsOfCurrentMapType() {
        for (var i = 0; i < this.breakableObjCountOfCurrentMapType; ++i) {
            var obj = this._breakableWalls[i];
            yield obj;
        }
    }

    findWallOrBreakableWallById(id) {
        let wall = this.findBreakbleWallById(id);
        if (wall != null) {
            return wall;
        }
        return this.findWallById(id);
    }

    findWallById(objId) {
        for (var i = 0; i < this._walls.length; ++i) {
            if (this._walls[i].id == objId) {
                return this._walls[i];
            }
        }
        return null;
    }

    findBreakbleWallById(objId) {
        for (var i = 0; i < this._breakableWalls.length; ++i) {
            if (this._breakableWalls[i].id == objId) {
                return this._breakableWalls[i];
            }
        }
        return null;
    }

    switchClosestDistanceToEnemy() {
        this._showClosestDistanceToEnemy = !this._showClosestDistanceToEnemy;
    }

    switchAllyAttackRange() {
        this._showAllyAttackRange = !this._showAllyAttackRange;
    }

    switchEnemyAttackRange() {
        this._showEnemyAttackRange = !this._showEnemyAttackRange;
    }

    getTile(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            // throw new Error("invalid index: x = " + x + ", y = " + y);
            return null;
        }
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            // throw new Error("tile index out of range: x = " + x + ", y = " + y);
            return null;
        }
        return this._tiles[y * this._width + x];
    }

    setTileType(x, y, type) {
        this.getTile(x, y).type = type;
    }

    exchangeObj(obj, x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return false;
        }
        if (targetTile.isEmpty()) {
            this.removeObj(obj);
            targetTile.setObj(obj);
            return true;
        }
        else {
            var destObj = targetTile.obj;
            var srcTile = this.findTileObjPlaced(obj.id);
            if (srcTile == null) {
                // 交換できない
                return false;
            }

            srcTile.setObj(destObj);

            this.removeObj(obj);
            targetTile.setObj(obj);
            return true;
        }
    }

    placeObj(obj, x, y) {
        var targetTile = this.findNeighborObjEmptyTile(x, y);
        if (targetTile == null) {
            return false;
        }

        this.removeObj(obj);
        targetTile.setObj(obj);
        return true;
    }
    placeObjToEmptyTile(obj) {
        var emptyTile;
        if (obj instanceof OffenceStructureBase) {
            emptyTile = this.__findEmptyTileOfOffenceStructure();
        }
        else {
            emptyTile = this.__findEmptyTileOfDiffenceStructure();
        }
        this.removeObj(obj);
        emptyTile.setObj(obj);
    }

    __findEmptyTileOfOffenceStructure() {
        return this.__findEmptyTile(0, 7, this._width, this._height);
    }

    __findEmptyTileOfDiffenceStructure() {
        return this.__findEmptyTile(0, 0, this._width, this._height - 1);
    }

    __findEmptyTile(offsetX, offsetY, width, height) {
        for (var y = offsetY; y < height; ++y) {
            for (var x = offsetX; x < width; ++x) {
                var tile = this.getTile(x, y);
                if (tile.isObjPlacable()) {
                    return tile;
                }
            }
        }
        return null;
    }
    findNeighborObjEmptyTile(x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }

        if (targetTile.isObjPlacable()) {
            return targetTile;
        }

        for (var i = 0; i < targetTile.neighbors.length; ++i) {
            var tile = targetTile.neighbors[i];
            if (tile.isObjPlacable()) {
                return tile;
            }
        }

        return null;
    }
    findNeighborUnitEmptyTile(x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        if (targetTile.isUnitPlacable()) {
            return targetTile;
        }

        for (var i = 0; i < targetTile.neighbors.length; ++i) {
            var tile = targetTile.neighbors[i];
            if (tile.isUnitPlacable()) {
                return tile;
            }
        }

        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                if (neighborNeighbor.isUnitPlacable()) {
                    return tile;
                }
            }
        }

        // 2回でもダメだったケースがあったので3回辿る
        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                for (let neighborNeighborNeighbor of neighborNeighbor.neighbors) {
                    if (neighborNeighborNeighbor.isUnitPlacable()) {
                        return tile;
                    }
                }
            }
        }

        return null;
    }
    removeObj(obj) {
        var tile = this.findTileObjPlaced(obj.id);
        if (tile != null) {
            // console.log(obj.id + " was removed");
            tile.setObj(null);
        }
        else {
            // console.log(obj.id + " was not found");
        }
    }

    findTileObjPlaced(objId) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                if (tile.obj != null) {
                    if (tile.obj.id == objId) {
                        return tile;
                    }
                }
            }
        }
        return null;
    }

    getTileObjsAsString() {
        var text = "";
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                if (tile.obj != null) {
                    text += tile.obj.id + "|";
                }
            }
        }
        return text;
    }

    *enumerateTiles(predicatorFunc = null) {
        for (let tile of this._tiles) {
            if (predicatorFunc == null || predicatorFunc(tile)) {
                yield tile;
            }
        }
    }

    *enumerateTilesInSpecifiedDistanceFrom(targetTile, targetDistance) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                var distance = tile.calculateDistance(targetTile);
                if (distance == targetDistance) {
                    yield tile;
                }
            }
        }
    }

    *enumerateAttackableTiles(attackerUnit, targetUnitTile) {
        for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(targetUnitTile, attackerUnit.attackRange)) {
            if (tile.isMovableTileForUnit(attackerUnit)) {
                yield tile;
            }
        }
    }

    isUnitAvailable(unit) {
        return this.findTileUnitPlaced(unit.id) != null;
    }

    isObjAvailable(obj) {
        return this.findTileObjPlaced(obj.id) != null;
    }

    findTileUnitPlaced(unitId) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                if (tile.placedUnit != null) {
                    if (tile.placedUnit.id == unitId) {
                        return tile;
                    }
                }
            }
        }
        return null;
    }

    placeUnit(unit, x, y) {
        if ((unit.posX == x) && (unit.posY == y)) {
            return;
        }

        // console.log("x = " + x + ", y = " + y);

        var tile = this.findNeighborUnitEmptyTile(x, y);
        if (tile == null) {
            console.error("could not find empty tile near the tile: (" + x + ", " + y + ")");
            return;
        }

        tile.setUnit(unit);

        if (!this.__isUnitAlreadyAdded(unit)) {
            this._units.push(unit);
        }
    }

    __isUnitAlreadyAdded(unit) {
        for (let u of this._units) {
            if (unit == u) {
                return true;
            }
        }
        return false;
    }

    getUnitOnTile(x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        return targetTile.placedUnit;
    }

    moveUnitForcibly(unit, x, y) {
        var currentTile = unit.placedTile;
        if (currentTile == null) {
            return false;
        }

        try {
            var targetTile = this.getTile(x, y);
            if (targetTile == null) {
                return false;
            }

            if (targetTile.placedUnit != null) {
                // スワップ
                var posX = currentTile.placedUnit.posX;
                var posY = currentTile.placedUnit.posY;
                currentTile.placedUnit = targetTile.placedUnit;
                currentTile.placedUnit.placedTile = currentTile;
                currentTile.placedUnit.setPos(posX, posY);
            }
            else {
                currentTile.placedUnit = null;
            }

            targetTile.placedUnit = unit;
            unit.placedTile = targetTile;
            unit.setPos(x, y);
        }
        catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    placeUnitForcibly(unit, x, y) {
        this.placeUnit(unit, x, y);
        this.moveUnitForcibly(unit, x, y);
    }

    moveUnit(unit, x, y) {
        if ((unit.posX == x) && (unit.posY == y)) {
            return;
        }

        this.moveUnitForcibly(unit, x, y);
    }
    removeUnit(unit) {
        var currentTile = this.findTileUnitPlaced(unit.id);
        if (currentTile != null) {
            currentTile.placedUnit = null;
        }

        this.__removeUnit(unit);
    }

    __removeUnit(unit) {
        unit.placedTile = null;
        unit.setPos(-1, -1);
        var unitIndex = this.__findUnitIndex(unit);
        if (unitIndex >= 0) {
            this._units.splice(unitIndex, 1);
        }
    }

    __findUnitIndex(unit) {
        for (var i = 0; i < this._units.length; ++i) {
            if (this._units[i] == unit) {
                return i;
            }
        }
        return -1;
    }

    getTileLabel(x, y) {
        return this.getTileLabelX(x) + this.getTileLabelY(y);
    }

    getTileLabelY(y) {
        return this._height - y;
    }

    getTileLabelX(x) {
        var charCode = "A".charCodeAt(0) + x;
        return String.fromCharCode(charCode);
    }

    getMinDistToAttackableTile(moveStartTile, moveUnit, targetUnitTile) {
        let dist = CanNotReachTile;
        for (let tile of this.enumerateAttackableTiles(moveUnit, targetUnitTile)) {
            let distLocal = tile.calculateUnitMovementCountToThisTile(moveUnit, moveStartTile, dist);
            // console.log("attackable tile: " + tile.positionToString() + ": distLocal=" + dist);
            if (distLocal < 0) {
                continue;
            }
            if (distLocal < dist) {
                dist = distLocal;
            }
        }
        return dist;
    }

    getNearestMovableTiles(
        moveUnit, targetUnitTile, additionalEvalTiles, evalsAttackableTiles = false, movableTiles = null,
        ignoresUnits = true,
        isUnitIgnoredFunc = null,
    ) {
        let nearestTiles = [];
        let minDist = CanNotReachTile;
        if (evalsAttackableTiles) {
            minDist = this.getMinDistToAttackableTile(moveUnit.placedTile, moveUnit, targetUnitTile);
        }
        else {
            minDist = targetUnitTile.calculateUnitMovementCountToThisTile(moveUnit, moveUnit.placedTile, -1, ignoresUnits, isUnitIgnoredFunc);
        }
        // console.log(moveUnit.getNameWithGroup() + "のもっとも近い移動可能なタイルを調査: 現在のマスからの距離=" + minDist);
        let evalTiles = [];
        if (movableTiles != null) {
            for (let tile of movableTiles) {
                evalTiles.push(tile);
            }
        }
        else {
            for (let tile of this.enumerateMovableTiles(moveUnit, false, false, false)) {
                evalTiles.push(tile);
            }
        }
        for (let tile of additionalEvalTiles) {
            evalTiles.push(tile);
        }
        for (let movableTile of evalTiles) {
            // 自身のタイルも含めるべき(例外があれば考える)
            // if (movableTile == moveUnit.placedTile) {
            //     continue;
            // }

            // console.log(movableTile.positionToString() + "の距離を評価");
            let dist = CanNotReachTile;
            if (evalsAttackableTiles) {
                dist = this.getMinDistToAttackableTile(movableTile, moveUnit, targetUnitTile);
            } else {
                dist = targetUnitTile.calculateUnitMovementCountToThisTile(moveUnit, movableTile, -1, ignoresUnits, isUnitIgnoredFunc);
            }
            if (dist < 0) {
                continue;
            }

            // console.log(`dist=${dist}, minDist=${minDist}`);
            if (dist < minDist) {
                // console.log("もっとも近いタイルを更新");
                minDist = dist;
                nearestTiles = [movableTile];
            }
            else if (dist == minDist) {
                // console.log("もっとも近いタイルに追加");
                nearestTiles.push(movableTile);
            }
        }

        // console.log(nearestTiles);
        return nearestTiles;
    }

    calculateDistance(moveUnit, targetUnit) {
        let dist = 1000;

        for (let tile of targetUnit.placedTile.neighbors) {
            if (!tile.isMovableTileForUnit(moveUnit)) {
                continue;
            }

            let distLocal = tile.calculateUnitMovementCountToThisTile(moveUnit);
            if (distLocal < 0) {
                continue;
            }
            if (distLocal < dist) {
                dist = distLocal;
            }
        }
        if (dist == 1000) {
            return -1;
        }
        return dist;
    }

    calculateTurnRange(unit, targetUnit) {
        if (!unit.isOnMap || !targetUnit.isOnMap) {
            return -1;
        }

        let minDist = this.getMinDistToAttackableTile(unit.placedTile, unit, targetUnit);
        if (minDist == CanNotReachTile) {
            return -1;
        }

        minDist = minDist + 1;

        let turnRange = Math.ceil(minDist / parseFloat(unit.moveCount));
        return turnRange;
    }

    *enumeratePlaceableSafeTilesNextToThreatenedTiles(unit) {
        for (let tile of this.enumerateSafeTilesNextToThreatenedTiles(unit.groupId)) {
            if (!tile.isUnitPlacableForUnit(unit) || tile.placedUnit != null) {
                continue;
            }

            yield tile;
        }
    }
    enumerateSafeTilesNextToThreatenedTiles(groupId) {
        return this.enumerateTiles(tile => {
            if (!tile.isMovableTileForMoveType(MoveType.Flying)) {
                return false;
            }
            if (tile.getEnemyThreatFor(groupId) > 0) {
                return false;
            }
            for (let x of tile.neighbors) {
                if (x.getEnemyThreatFor(groupId) > 0) {
                    return true;
                }
            }
        });
    }

    * enumerateRangedSpecialTiles(targetTile, special) {
        for (let tile of this.__enumerateRangedSpecialTiles(targetTile, special)) {
            if (tile != null) {
                yield tile;
            }
        }
    }

    * __enumerateRangedSpecialTiles(targetTile, special) {
        switch (special) {
            case Special.RisingFrame:
            case Special.BlazingFlame:
                for (let x = targetTile.posX - 2; x <= targetTile.posX + 2; ++x) {
                    yield this.getTile(x, targetTile.posY);
                }
                break;
            case Special.GrowingFlame:
                for (let tile of this.__enumerateRangedSpecialTiles(targetTile, Special.RisingFrame)) {
                    yield tile;
                }
                for (let x = targetTile.posX - 1; x <= targetTile.posX + 1; x += 2) {
                    for (let y = targetTile.posY - 1; y <= targetTile.posY + 1; y += 2) {
                        yield this.getTile(x, y);
                    }
                }
                break;
            case Special.RisingLight:
            case Special.BlazingLight:
                yield targetTile;
                for (let x = targetTile.posX - 1; x <= targetTile.posX + 1; x += 2) {
                    for (let y = targetTile.posY - 1; y <= targetTile.posY + 1; y += 2) {
                        yield this.getTile(x, y);
                    }
                }
                break;
            case Special.GrowingLight:
                for (let tile of this.__enumerateRangedSpecialTiles(targetTile, Special.RisingLight)) {
                    yield tile;
                }
                yield this.getTile(targetTile.posX - 2, targetTile.posY);
                yield this.getTile(targetTile.posX + 2, targetTile.posY);
                yield this.getTile(targetTile.posX, targetTile.posY - 2);
                yield this.getTile(targetTile.posX, targetTile.posY + 2);
                break;
            case Special.RisingWind:
            case Special.BlazingWind:
                yield targetTile;
                yield this.getTile(targetTile.posX - 1, targetTile.posY);
                yield this.getTile(targetTile.posX + 1, targetTile.posY);
                yield this.getTile(targetTile.posX, targetTile.posY - 1);
                yield this.getTile(targetTile.posX, targetTile.posY + 1);
                break;
            case Special.GrowingWind:
                for (let x = targetTile.posX - 1; x <= targetTile.posX + 1; ++x) {
                    for (let y = targetTile.posY - 1; y <= targetTile.posY + 1; ++y) {
                        yield this.getTile(x, y);
                    }
                }
                break;
            case Special.RisingThunder:
            case Special.BlazingThunder:
                for (let y = targetTile.posY - 2; y <= targetTile.posY + 2; ++y) {
                    yield this.getTile(targetTile.posX, y);
                }
                break;
            case Special.GrowingThunder:
                for (let y = targetTile.posY - 3; y <= targetTile.posY + 3; ++y) {
                    yield this.getTile(targetTile.posX, y);
                }
                yield this.getTile(targetTile.posX - 1, targetTile.posY);
                yield this.getTile(targetTile.posX + 1, targetTile.posY);
                break;
        }
    }

    * enumerateMovableTiles(unit, ignoresUnits,
        includesUnitPlacedTile = true,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        for (let tile of this.enumerateMovableTilesImpl(
            unit, unit.moveCount, ignoresUnits, includesUnitPlacedTile, ignoresTeleportTile, unitPlacedTile)
        ) {
            yield tile;
        }
    }

    * enumerateMovableTilesForEnemyThreat(unit, ignoresUnits,
        includesUnitPlacedTile = true,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        for (let tile of this.enumerateMovableTilesImpl(
            unit, unit.moveCountAtBeginningOfTurn, ignoresUnits, includesUnitPlacedTile, ignoresTeleportTile, unitPlacedTile)
        ) {
            yield tile;
        }
    }

    * enumerateMovableTilesImpl(
        unit,
        moveCount,
        ignoresUnits,
        includesUnitPlacedTile = true,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        let startTile = unit.placedTile;
        if (unitPlacedTile != null) {
            startTile = unitPlacedTile;
        }

        const enumerated = {};
        for (let neighborTile of startTile.getMovableNeighborTiles(unit, moveCount, ignoresUnits)) {
            if (neighborTile.positionToString() in enumerated) {
                continue;
            }
            enumerated[neighborTile.positionToString()] = neighborTile;
            if (!includesUnitPlacedTile
                && neighborTile.placedUnit != unit
                && !neighborTile.isUnitPlacable()) {
                continue;
            }
            yield neighborTile;
        }

        if (!ignoresTeleportTile) {
            if (unit.hasStatusEffect(StatusEffectType.AirOrders)) {
                for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                        if (tile.positionToString() in enumerated) {
                            continue;
                        }
                        enumerated[tile.positionToString()] = tile;
                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                            continue;
                        }
                        yield tile;
                    }
                }
            }

            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.FujinYumi:
                        if (unit.isWeaponSpecialRefined) {
                            if (unit.hpPercentage >= 50) {
                                for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.Gurimowaru:
                    case PassiveB.TeniNoKona:
                    case Weapon.ApotheosisSpear:
                        {
                            let threshold = 50;
                            if (skillId == PassiveB.TeniNoKona) {
                                threshold = 80;
                            }
                            else if (skillId == Weapon.ApotheosisSpear) {
                                threshold = 0;
                            }
                            if (unit.hpPercentage >= threshold) {
                                for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }
                        }
                        break;
                    case PassiveB.Kyuen2:
                    case PassiveB.Kyuen3:
                        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                            let thoreshold = 50;
                            if (skillId == PassiveB.Kyuen2) {
                                thoreshold = 40;
                            }
                            if (ally.hpPercentage <= thoreshold) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    if (tile.positionToString() in enumerated) {
                                        continue;
                                    }
                                    enumerated[tile.positionToString()] = tile;
                                    if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                        continue;
                                    }
                                    yield tile;
                                }
                            }
                        }
                        break;
                    case Weapon.AstralBreath:
                        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                            if (unit.partnerHeroIndex == ally.heroIndex) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    if (tile.positionToString() in enumerated) {
                                        continue;
                                    }
                                    enumerated[tile.positionToString()] = tile;
                                    if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                        continue;
                                    }
                                    yield tile;
                                }
                            }
                        }
                        break;
                    case Weapon.Noatun:
                        {
                            let threshold = 50;
                            if (!unit.isWeaponRefined) {
                                threshold = 40;
                            }

                            if (unit.hpPercentage <= threshold) {
                                for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }

                            if (unit.isWeaponSpecialRefined) {
                                if (unit.hpPercentage >= 50) {
                                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                        for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                            if (tile.positionToString() in enumerated) {
                                                continue;
                                            }
                                            enumerated[tile.positionToString()] = tile;
                                            if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                                continue;
                                            }
                                            yield tile;
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case PassiveB.Ridatsu3:
                        {
                            let threshold = 50;
                            if (unit.hpPercentage <= threshold) {
                                for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }
                        }
                        break;

                    case PassiveB.KyokugiHiKo1:
                    case PassiveB.KyokugiHiKo2:
                    case PassiveB.KyokugiHiKo3:
                        {
                            if (skillId == PassiveB.KyokugiHiKo3
                                || (skillId == PassiveB.KyokugiHiKo2 && unit.hpPercentage >= 50)
                                || (skillId == PassiveB.KyokugiHiKo1 && unit.isFullHp)
                            ) {
                                for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                    if (ally.moveType == MoveType.Armor
                                        || ally.moveType == MoveType.Infantry
                                        || ally.moveType == MoveType.Cavalry) {
                                        for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                            if (tile.positionToString() in enumerated) {
                                                continue;
                                            }
                                            enumerated[tile.positionToString()] = tile;
                                            if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                                continue;
                                            }
                                            yield tile;
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case PassiveB.HentaiHiko1:
                    case PassiveB.HentaiHiko2:
                    case PassiveB.HentaiHiko3:
                        if (skillId == PassiveB.HentaiHiko3
                            || (skillId == PassiveB.HentaiHiko2 && unit.hpPercentage >= 50)
                            || (skillId == PassiveB.HentaiHiko1 && unit.isFullHp)
                        ) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                if (ally.moveType == MoveType.Flying) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }
                        }

                        break;
                }
            }

            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.HinokaNoKounagitou:
                            if (ally.isWeaponSpecialRefined) {
                                if (unit.moveType == MoveType.Infantry || unit.moveType == MoveType.Flying) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }
                            break;
                        case Weapon.IzunNoKajitsu:
                            if (ally.hpPercentage >= 50) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    if (tile.positionToString() in enumerated) {
                                        continue;
                                    }
                                    enumerated[tile.positionToString()] = tile;
                                    if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                        continue;
                                    }
                                    yield tile;
                                }
                            }
                            break;
                        case PassiveC.SorakaranoSendo3:
                            // 空からの先導
                            if (unit.moveType == MoveType.Armor
                                || unit.moveType == MoveType.Infantry) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    if (tile.positionToString() in enumerated) {
                                        continue;
                                    }
                                    enumerated[tile.positionToString()] = tile;
                                    if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                        continue;
                                    }
                                    yield tile;
                                }
                            }
                            break;
                        case PassiveC.HikonoSendo3:
                            if (unit.moveType == MoveType.Flying) {
                                // 飛行の先導
                                if (ally.hasPassiveSkill(PassiveC.HikonoSendo3)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        if (tile.positionToString() in enumerated) {
                                            continue;
                                        }
                                        enumerated[tile.positionToString()] = tile;
                                        if (!includesUnitPlacedTile && !tile.isUnitPlacable()) {
                                            continue;
                                        }
                                        yield tile;
                                    }
                                }
                            }
                            break;
                    }
                }
            }
        }
    }

    examinesCanAttack(attackerUnit, attackTargetUnit, ignoresTeleportTile,
        moveTile = null, // 指定した場合は、指定タイルに移動した前提で評価します
        ignoreTileFunc = null,
        includesUnitPlacedTile = true
    ) {
        let doneTiles = [];
        console.log("movable tiles:");
        for (let neighborTile of this.enumerateMovableTiles(attackerUnit, false, includesUnitPlacedTile, ignoresTeleportTile, moveTile)) {
            if (ignoreTileFunc != null && ignoreTileFunc(neighborTile)) {
                continue;
            }
            for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(neighborTile, attackerUnit.attackRange)) {
                if (doneTiles.includes(tile)) {
                    continue;
                }
                doneTiles.push(tile);

                let targetTile = attackTargetUnit.placedTile;
                if (targetTile.posX == tile.posX && targetTile.posY == tile.posY) {
                    return true;
                }
            }
        }
        return false;
    }

    __setEnemyThreat(unit) {
        if (!unit.hasWeapon) {
            return;
        }

        var doneTiles = [];
        for (let neighborTile of this.enumerateMovableTilesForEnemyThreat(unit, true, true, true)) {
            for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(neighborTile, unit.attackRange)) {
                if (doneTiles.includes(tile)) {
                    continue;
                }

                doneTiles.push(tile);
                switch (unit.groupId) {
                    case UnitGroupType.Ally:
                        if (!tile.threateningAllies.includes(unit)) {
                            tile.threateningAllies.push(unit);
                        }
                        tile.increaseDangerLevel();
                        break;
                    case UnitGroupType.Enemy:
                        if (!tile.threateningEnemies.includes(unit)) {
                            tile.threateningEnemies.push(unit);
                        }
                        tile.increaseAllyDangerLevel();
                        break;
                }
            }
        }
    }

    __setAttackableCell(unit) {
        if (!unit.hasWeapon) {
            return;
        }

        for (let neighborTile of this.enumerateMovableTiles(unit, false, true, false)) {
            for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(neighborTile, unit.attackRange)) {
                if (!unit.attackableTiles.includes(tile)) {
                    unit.attackableTiles.push(tile);
                }
            }
        }
    }

    toTable() {
        let isMapHeaderEnabled = this.isHeaderEnabled;
        if (isMapHeaderEnabled) {
            this.cellOffsetX = 1;
            this.cellOffsetY = 0;
        }

        var tableWidth = this._width + this.cellOffsetX;
        var tableHeight = this._height + this.cellOffsetY;

        if (this._table == null) {
            this._table = new Table(tableWidth, tableHeight);
        }
        else {
            this._table.resize(tableWidth, tableHeight);
        }
        var table = this._table;

        if (this.isBackgroundImageEnabled) {
            table.backgroundImage = `url(${getMapBackgroundImage(this._type)})`;
        }
        else {
            table.backgroundImage = "none";
        }

        // マップをテーブル化
        let cellWidth = this.cellWidth;
        let cellHeight = this.cellHeight;
        {
            // マップセルの初期化
            for (var y = 0; y < this._height; ++y) {
                for (var x = 0; x < this._width; ++x) {
                    var index = y * this._width + x;
                    var tile = this._tiles[index];
                    tile.resetDangerLevel();
                    tile.closestDistanceToEnemy = -1;
                    tile.isMovableForAlly = false;
                    tile.isMovableForEnemy = false;
                    tile.isAttackableForAlly = false;
                    tile.isAttackableForEnemy = false;
                    tile.threateningEnemies = [];
                    tile.threateningAllies = [];


                    var cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                    var fontColor = "#fff";
                    var tileText = this.getTileLabel(x, y);
                    cell.setToDefault();
                    cell.fontColor = fontColor;
                    cell.innerText = tileText;
                    cell.borderWidth = "1px";
                    // cell.borderColor = "transparent";
                    if (this.isBackgroundImageEnabled) {
                        cell.borderStyle = "none";
                        cell.bgColor = "transparent";
                    }
                    else {
                        cell.bgColor = tileTypeToColor(tile.type);
                        cell.borderStyle = "solid";
                    }
                }
            }

            // 施設などの配置
            for (var y = 0; y < this._height; ++y) {
                if (isMapHeaderEnabled) {
                    var cell = table.getCell(0, y);
                    cell.type = CellType.Header;
                    cell.innerText = this.getTileLabelY(y);
                    cell.borderWidth = "0px";
                }
                for (var x = 0; x < this._width; ++x) {
                    var index = y * this._width + x;
                    var tile = this._tiles[index];
                    var obj = tile.obj;

                    var tileText = "";
                    // var tileText = this.getTileLabel(x, y);
                    if (!this.isBackgroundImageEnabled) {
                        var tileThumb = tileTypeToThumb(tile.type, this._type);
                        if (tileThumb != null) {
                            // なんかwidthを+2しないと合わなかった
                            let thumbWidth = cellWidth + 2;
                            tileText += "<img style='position:absolute;bottom:0;left:0;' src='" + tileThumb + "' width='" + thumbWidth + "px' />";
                        }
                    }

                    if (obj != null) {
                        let drawsObj = !this.isBackgroundImageEnabled
                            || !(obj instanceof Wall);
                        if (drawsObj) {
                            tileText += "<img style='position:absolute;bottom:0;left:0;' class='draggable-elem' id='" + tile.obj.id + "' src='" + obj.icon + "' width='" + cellWidth + "px' draggable='true' ondragstart='f_dragstart(event)' />";
                        }
                    }

                    var showTilePriority = false;
                    if (showTilePriority) {
                        tileText += tile.tilePriority;
                    }

                    var cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                    cell.innerText = tileText;
                    if (obj != null) {
                        this.__putStructureIconToCell(cell, obj);
                    }
                }
            }

            if (isMapHeaderEnabled) {
                {
                    var cell = table.getCell(0, this._height);
                    cell.borderWidth = "0px";
                }
                for (var x = 0; x < this._width; ++x) {
                    var cell = table.getCell(x + this.cellOffsetX, this._height);
                    cell.type = CellType.Header;
                    cell.innerText = this.getTileLabelX(x);
                    cell.borderWidth = "0px";
                }
            }
        }


        // 危険エリアの表示
        for (var unitIndex = 0; unitIndex < this._units.length; ++unitIndex) {
            var unit = this._units[unitIndex];
            unit.movableTiles = [];
            unit.attackableTiles = [];
            this.__setEnemyThreat(unit);
            this.__setAttackableCell(unit);
        }

        // 各ユニットの処理
        for (var unitIndex = 0; unitIndex < this._units.length; ++unitIndex) {
            var unit = this._units[unitIndex];
            // console.log(unit);
            var tile = unit.placedTile;
            var cell = table.getCell(tile.posX + this.cellOffsetX, tile.posY + this.cellOffsetY);
            switch (unit.groupId) {
                case UnitGroupType.Enemy:
                    {
                        this.__putUnitIconToCell(cell, unit);
                        // 敵への最短距離を表示
                        if (this.showClosestDistanceToEnemy) {
                            tile.closestDistanceToEnemy = tile.calculateDistanceToClosestEnemyTile(unit);
                        }
                    }
                    break;
                case UnitGroupType.Ally:
                    {
                        this.__putUnitIconToCell(cell, unit);
                    }
                    break;
            }

            // 敵の移動可能範囲を表示
            if (unit.groupId == UnitGroupType.Enemy) {
                for (let tile of this.enumerateMovableTiles(unit, this._ignoresUnits)) {
                    if (unit.movableTiles.includes(tile)) {
                        continue;
                    }

                    unit.movableTiles.push(tile);
                    tile.isMovableForEnemy = true;
                    if (unit.hasWeapon) {
                        for (let attackableTile of this.enumerateTilesInSpecifiedDistanceFrom(tile, unit.attackRange)) {
                            attackableTile.isAttackableForEnemy = true;
                        }
                    }
                }
            }

            // 味方の移動可能範囲を表示
            if (unit.groupId == UnitGroupType.Ally) {
                for (let tile of this.enumerateMovableTiles(unit, this._ignoresUnits)) {
                    if (unit.movableTiles.includes(tile)) {
                        continue;
                    }

                    unit.movableTiles.push(tile);
                    tile.isMovableForAlly = true;
                    if (unit.hasWeapon) {
                        for (let attackableTile of this.enumerateTilesInSpecifiedDistanceFrom(tile, unit.attackRange)) {
                            attackableTile.isAttackableForAlly = true;
                        }
                    }
                }
            }
        }

        const shadowCss = this.__getShadowCss();
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                let cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                this.setCellStyle(tile, cell);

                let additionalInnerText = "";
                let isBorderEnabled = false;
                if (this._showAllyAttackRange && tile.dangerLevel > 0) {
                    isBorderEnabled = true;
                    // 危険度の表示
                    additionalInnerText += "<span style='color:#0bf;font-size:12px;" + shadowCss + ";'><b>" + tile.dangerLevel + "</b></span>";
                }
                if (this._showEnemyAttackRange && tile.allyDangerLevel > 0) {
                    isBorderEnabled = true;
                    // 危険度の表示
                    additionalInnerText += "<span style='color:#f80;font-size:12px;" + shadowCss + ";'><b>" + tile.allyDangerLevel + "</b></span>";
                }

                if (tile.closestDistanceToEnemy > 0) {
                    // 敵への最短距離の表示
                    var closestDistance = tile.closestDistanceToEnemy;
                    if (tile.closestDistanceToEnemy > 100) {
                        // たどり着けない
                        closestDistance = "∞";
                    }
                    additionalInnerText += "<span style='color:#fff;font-size:12px;" + shadowCss + ";'><b>" + closestDistance + "</b></span>";
                }

                if (tile.overridesCell) {
                    cell.borderColor = tile.borderColor;
                    cell.borderWidth = tile.borderWidth;
                    additionalInnerText += tile.overrideText;
                }

                cell.innerText += "<div style='position:absolute;top:0;left:0;'>" + additionalInnerText + "</div>";

                let thisCellWidth = Number(cellWidth);
                let thisCellHeight = Number(cellHeight);
                if (!isBorderEnabled) {
                    thisCellWidth += 2;
                    thisCellHeight += 2;
                }

                // セルの中身を div で囲む
                cell.innerText = "<div class='cell-root' style='position:relative;width:" + thisCellWidth + "px;height:" + thisCellHeight + "px;'>" + cell.innerText + "</div>";
            }
        }

        table.onDragOverEvent = "f_dragover(event)";
        table.onDropEvent = "f_drop(event)";
        table.onDragEndEvent = "table_dragend(event)";

        return table;
    }

    setCellStyle(tile, cell) {
        const allyMovableTileColor = "#2ae";
        const enemyMovableTileColor = "#e88";
        const attackRangeBorderWidth = 1;
        if (this.isBackgroundImageEnabled) {
            cell.bgColor = "transparent";
        }
        else {
            cell.bgColor = tileTypeToColor(tile.type);
        }
        if (this.showAllyAttackRange) {
            const alpha = "40";
            if (tile.isAttackableForAlly) {
                cell.borderStyle = "solid";
                cell.borderColor = "#08f";
                cell.bgColor = "#dde0ee" + alpha;
            }
            if (tile.isMovableForAlly) {
                // cell.borderColor = allyMovableTileColor;
                // cell.bgColor = "#cbd6ee" + alpha;
            }
            cell.borderWidth = attackRangeBorderWidth + "px";
        }
        if (this.showEnemyAttackRange) {
            const alpha = "40";
            if (tile.isAttackableForEnemy) {
                cell.borderStyle = "solid";
                // cell.borderColor = "#e92";
                // cell.bgColor = "#eeccc5";
                cell.borderColor = "#f00";
                cell.bgColor = "#ff8888" + alpha;
            }
            if (tile.isMovableForEnemy) {
                // cell.borderColor = enemyMovableTileColor;
                // cell.bgColor = "#ebb";
                // cell.borderColor = "#f00";
                // cell.bgColor = "#ff8888" + alpha;
                // cell.borderColor = "transparent";
            }
            cell.borderWidth = attackRangeBorderWidth + "px";
        }

        if (this._showEnemyAttackRange && this._showAllyAttackRange && tile.dangerLevel > 0 && tile.allyDangerLevel > 0) {
            const alpha = "90";
            cell.borderColor = "#f0f";
            cell.bgColor = "#eee0ee" + alpha;
        }
    }


    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit)) {
            var dist = Math.abs(unit.posX - targetUnit.posX) + Math.abs(unit.posY - targetUnit.posY);
            if (dist <= spaces) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInTheSameGroup(targetUnit) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetUnit.groupId)) {
            if (unit != targetUnit) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInSpecifiedGroup(groupId) {
        for (let unit of this._units) {
            if (unit.groupId == groupId) {
                yield unit;
            }
        }
    }

    __putStructureIconToCell(cell, structure) {
        if (structure.isSelected) {
            cell.bgColor = SelectedTileColor;
        }
        if (!this.isIconOverlayDisabled) {
            if (!this.isTrapIconOverlayDisabled || !(structure instanceof TrapBase)) {
                var shadowCss = this.__getShadowCss();
                if (structure.hasLevel) {
                    cell.innerText += "<span style='position:absolute;bottom:0;right:0;font-size:10px;" + shadowCss + ";'>"
                    cell.innerText += "LV." + structure.level;
                    cell.innerText += "</span>";
                }
            }
        }
    }

    __putUnitIconToCell(cell, unit) {
        var style = "";
        var color = "#bbeeff";
        {
            // 残りHPで枠線を変える
            if (unit.hpPercentage <= 50) {
                color = "#ff0000";
            } else if (unit.hpPercentage <= 75) {
                color = "#ffbb00";
            }
            if (color != "") {
                //style = "border: 2px " + color + " solid;border-radius: 50px 50px 50px 50px / 50px 50px 50px 50px;";
            }
        }

        if (unit.isActionDone) {
            style += "filter:grayscale(100%);filter:brightness(70%);";
        }

        if (unit.isSelected) {
            // style += "border: 1px #ffffff solid;border-radius: 50px 50px 50px 50px / 50px 50px 50px 50px;";
            // style += "filter:grayscale(0%);filter:brightness(120%);";
            cell.bgColor = SelectedTileColor;
            // cell.borderColor = "#ff0000";
        }

        // console.log("unit.id = " + unit.id + ", unit.icon = " + unit.icon);
        if (cell.innerText.includes("<img")) {
            cell.innerText += this.toImgElem(unit.id, unit.icon, style);
        }
        else {
            cell.innerText = this.toImgElem(unit.id, unit.icon, style);
        }

        if (!this.isIconOverlayDisabled) {
            var shadowCss = this.__getShadowCss();
            cell.innerText += "<span style='font-size:10px;color:" + color + ";position:absolute;bottom:0;left:0;" + shadowCss + ";'>"
                + unit.hp + "</span>";
            if (unit.maxSpecialCount > 0) {
                var specialCount = unit.specialCount;
                if (unit.specialCount == 0) {
                    specialCount = "<img src='" + g_imageRootPath + "Special.png" + "' style='width:12px;height:12px'>";
                }
                cell.innerText += "<span style='font-size:10px;color:#ffbbee;position:absolute;bottom:12px;left:0;" + shadowCss + ";'>"
                    + specialCount + "</span>";
            }

            // バフ、デバフ
            {
                cell.innerText += "<span style='position:absolute;bottom:0;right:0;" + shadowCss + ";'>"
                if (unit.isBuffed) {
                    cell.innerText += "<img src='" + g_imageRootPath + "BuffIcon.png" + "' style='height:12px'>";
                }
                if (unit.isDebuffed) {
                    cell.innerText += "<img src='" + g_imageRootPath + "DebuffIcon.png" + "' style='height:12px'>";
                }
                cell.innerText += "</span>";
            }

            // 状態異常
            {
                cell.innerText += "<span style='position:absolute;top:0;right:0;" + shadowCss + ";'>"
                for (let statusEffect of unit.statusEffects) {
                    cell.innerText += "<img src='" + statusEffectTypeToIconFilePath(statusEffect) + "' style='height:11px'>";
                }

                // todo: 暫定対処
                if (!unit.hasStatusEffect(StatusEffectType.MobilityIncreased) && unit.moveCount > unit.getNormalMoveCount()) {
                    cell.innerText += "<img src='" + statusEffectTypeToIconFilePath(StatusEffectType.MobilityIncreased) + "' style='height:11px'>";
                }
                cell.innerText += "</span>";
            }
        }
    }

    __getShadowCss() {
        const shadowColor = "#444";
        const shadowCss = "text-shadow: "
            + shadowColor + " 1px 1px 0px, " + shadowColor + " -1px 1px 0px,"
            + shadowColor + " 1px -1px 0px, " + shadowColor + " -1px -1px 0px,"
            + shadowColor + " 0px 1px 0px, " + shadowColor + " 0px -1px 0px,"
            + shadowColor + " -1px 0px 0px, " + shadowColor + " 1px 0px 0px";
        return shadowCss;
    }

    toImgElem(id, imagePath, additionalStyle) {
        return "<img style='position:absolute;bottom:0;left:0;" + additionalStyle + "' class='draggable-elem' id='" + id + "' src='" + imagePath + "' width='" + this.cellWidth + "px' draggable='true' ondragstart='f_dragstart(event)' />";
    }
}
