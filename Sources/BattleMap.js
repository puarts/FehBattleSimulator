/// @file
/// @brief BattleMap クラスとそれに関連するクラスや関数等の定義です。

const MapType_ArenaOffset = 50;
const MapType_ResonantBattlesOffset = MapType_ArenaOffset + 100;
const MapType_TempestTrialsOffset = MapType_ResonantBattlesOffset + 1000;
const MapType_SummonerDuelsOffset = MapType_TempestTrialsOffset + 2000;
const MapType = {
    None: -1,

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
    DreamCastle: 10,
    NightmareCastle: 11,

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
    TempestTrials_ShinmaiNinjaNoHatsuNinmu: MapType_TempestTrialsOffset + 2,

    // 英雄決闘
    SummonersDuel_Default: MapType_SummonerDuelsOffset + 0, // マップ作成用の更地
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR005
    SummonersDuel_EnclosedRuins: MapType_SummonerDuelsOffset + 1, // 崩れた壁に囲まれた地
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR004
    SummonersDuel_MountainPass: MapType_SummonerDuelsOffset + 2, // 山間の道
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR013
    SummonersDuel_Bridges: MapType_SummonerDuelsOffset + 3, // 東西の端の橋
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR014
    SummonersDuel_ShiftingSands: MapType_SummonerDuelsOffset + 4, // 蛇行する砂漠
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR006
    SummonersDuel_DesertTrees: MapType_SummonerDuelsOffset + 5, // 樹々生い茂る砂漠
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR001
    SummonersDuel_1: MapType_SummonerDuelsOffset + 6,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR002
    SummonersDuel_2: MapType_SummonerDuelsOffset + 7,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR003
    SummonersDuel_3: MapType_SummonerDuelsOffset + 8,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR007
    SummonersDuel_7: MapType_SummonerDuelsOffset + 9,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR008
    SummonersDuel_8: MapType_SummonerDuelsOffset + 10,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR009
    SummonersDuel_9: MapType_SummonerDuelsOffset + 11,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR010
    SummonersDuel_10: MapType_SummonerDuelsOffset + 12,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR011
    SummonersDuel_11: MapType_SummonerDuelsOffset + 13,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR012
    SummonersDuel_12: MapType_SummonerDuelsOffset + 14,
};

const SummonerDuelsMapKindOptions = [
    { label: "更地(マップ作成用)", value: MapType.SummonersDuel_Default },
    { label: "崩れた壁に囲まれた地", value: MapType.SummonersDuel_EnclosedRuins },
    { label: "山間の道", value: MapType.SummonersDuel_MountainPass },
    { label: "東西の端の橋", value: MapType.SummonersDuel_Bridges },
    { label: "蛇行する砂漠", value: MapType.SummonersDuel_ShiftingSands },
    { label: "樹々生い茂る砂漠", value: MapType.SummonersDuel_DesertTrees },
    { label: "01", value: MapType.SummonersDuel_1 },
    { label: "02", value: MapType.SummonersDuel_2 },
    { label: "03", value: MapType.SummonersDuel_3 },
    { label: "07", value: MapType.SummonersDuel_7 },
    { label: "08", value: MapType.SummonersDuel_8 },
    { label: "09", value: MapType.SummonersDuel_9 },
    { label: "10", value: MapType.SummonersDuel_10 },
    { label: "11", value: MapType.SummonersDuel_11 },
    { label: "12", value: MapType.SummonersDuel_12 },
];


function isAetherRaidMap(type) {
    return type >= 0 && type < MapType_ArenaOffset;
}

function isArenaMap(type) {
    return type >= MapType_ArenaOffset && type < MapType_ResonantBattlesOffset;
}

function isResonantBattlesMap(type) {
    return type >= MapType_ResonantBattlesOffset && type < MapType_TempestTrialsOffset;
}

function isTempestTrialsMap(type) {
    return type >= MapType_TempestTrialsOffset && type < MapType_SummonerDuelsOffset;
}

function isSummonerDuelsMap(type) {
    return type >= MapType_SummonerDuelsOffset;
}


/**
 * @param  {MapType} type
 */
function getBreakableObjCountOfCurrentMapType(type) {
    switch (type) {
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
        case MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu: return 0;
        default:
            return 0;
    }
}

const DefaultResonantBattleMap = MapType.ResonantBattles_8;
const DefaultTempestTrialsMap = MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu;
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
    { id: MapType.DreamCastle, fileName: "DreamCastle.png" },
    { id: MapType.NightmareCastle, fileName: "NightmareCastle.png" },
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
    { label: "新米忍者の初任務(2020/11/07～)", value: MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu },
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

function getMapBackgroundImageInfos(mapType) {
    return Array.from(enumerateMapBackgroundImageInfos(mapType));
}

const g_summonerDuelsMapRoot = g_corsImageRootPath + "Maps/SummonerDuels/";

/**
 * @param  {MapType} mapType
 * @returns {String[]}
 */
function* enumerateMapBackgroundImageInfos(mapType) {
    if (isSummonerDuelsMap(mapType)) {
        const cornerSize = `${(100 * 2 / 8).toFixed()}% ${(100 * 2 / 10).toFixed()}%`;
        yield new BackgroundImageInfo(
            g_summonerDuelsMapRoot + "SummonerDuels_Corner1.png",
            `left top`, cornerSize
        );
        yield new BackgroundImageInfo(
            g_summonerDuelsMapRoot + "SummonerDuels_Corner2.png",
            `right bottom`, cornerSize
        );
        yield new BackgroundImageInfo(
            g_summonerDuelsMapRoot + "SummonerDuels_PointArea.png",
            `center`,
            `${(100 * 6 / 8).toFixed()}% ${(100 * 4 / 10).toFixed()}%`
        );
    }

    yield new BackgroundImageInfo(getMapBackgroundImage(mapType));

    if (isSummonerDuelsMap(mapType)) {
        yield new BackgroundImageInfo(g_summonerDuelsMapRoot + "Rival_Domains_Wave.webp");
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
        case MapType.DreamCastle: return root + "DreamCastle.png";
        case MapType.NightmareCastle: return root + "NightmareCastle.png";
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
        case MapType.SummonersDuel_1: return g_summonerDuelsMapRoot + "Map_ZR001.png";
        case MapType.SummonersDuel_2: return g_summonerDuelsMapRoot + "Map_ZR002.webp";
        case MapType.SummonersDuel_EnclosedRuins: return g_summonerDuelsMapRoot + "Map_ZR005.webp";
        case MapType.SummonersDuel_MountainPass: return g_summonerDuelsMapRoot + "Map_ZR004.webp";
        case MapType.SummonersDuel_Bridges: return g_summonerDuelsMapRoot + "Map_ZR013.webp";
        case MapType.SummonersDuel_ShiftingSands: return g_summonerDuelsMapRoot + "Map_ZR014.webp";
        case MapType.SummonersDuel_DesertTrees: return g_summonerDuelsMapRoot + "Map_ZR006.webp";
        case MapType.SummonersDuel_3: return g_summonerDuelsMapRoot + "Map_ZR003.webp";
        case MapType.SummonersDuel_7: return g_summonerDuelsMapRoot + "Map_ZR007.webp";
        case MapType.SummonersDuel_8: return g_summonerDuelsMapRoot + "Map_ZR008.webp";
        case MapType.SummonersDuel_9: return g_summonerDuelsMapRoot + "Map_ZR009.webp";
        case MapType.SummonersDuel_10: return g_summonerDuelsMapRoot + "Map_ZR010.webp";
        case MapType.SummonersDuel_11: return g_summonerDuelsMapRoot + "Map_ZR011.webp";
        case MapType.SummonersDuel_12: return g_summonerDuelsMapRoot + "Map_ZR012.webp";
        default:
            throw new Error("Unknown map type " + mapKind);
    }
}

/// 戦闘マップを表すクラスです。
class BattleMap {
    constructor(id, idGenerator = null) {
        this._type = -1;
        this._id = id;
        this._height = 0;
        this._width = 0;
        /** @type {Tile[]} */
        this._tiles = [];
        /** @type {Unit[]} */
        this._units = [];
        this._breakableWalls = [];
        this._breakableWalls.push(new BreakableWall(idGenerator == null ? "" : idGenerator.generate()));
        this._breakableWalls.push(new BreakableWall(idGenerator == null ? "" : idGenerator.generate()));
        this._breakableWalls.push(new BreakableWall(idGenerator == null ? "" : idGenerator.generate()));

        this._walls = [];
        this._walls.push(new Wall(idGenerator == null ? "" : idGenerator.generate()));
        this._walls.push(new Wall(idGenerator == null ? "" : idGenerator.generate()));

        // id の互換を維持するためにここから追加
        for (let i = this._breakableWalls.length; i < 16; ++i) {
            this._breakableWalls.push(new BreakableWall(idGenerator == null ? "" : idGenerator.generate()));
        }

        for (let i = this._walls.length; i < 32; ++i) {
            this._walls.push(new Wall(idGenerator == null ? "" : idGenerator.generate()));
        }

        this._showEnemyAttackRange = false;
        this._showAllyAttackRange = false;
        this._showClosestDistanceToEnemy = false;
        /** @type {Table} */
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

        this.sourceCode = "";

        // 拡張枠のユニットかどうかを判定する関数
        this.isExpansionUnitFunc = null;
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
        // for (let i = 0; i < elemTexts.length; ++i) {
        //     let elemText = elemTexts[i];
        //     let splited = elemText.split(NameValueDelimiter);
        //     let serialId = splited[0];
        //     let value = splited[1];
        // }
    }

    /// すべてのタイルのスナップショットを作成します。スナップショットはNPCの動きの判定に使用します。
    createTileSnapshots() {
        for (let tile of this._tiles) {
            tile.createSnapshot();
        }
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
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let tile = new Tile(x, y);
                tile.tilePriority = x + (this._height - (y + 1)) * this._width;
                this._tiles.push(tile);
            }
        }

        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let tile = this.getTile(x, y);
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

    setMapSizeToPawnsOfLoki() {
        this.setMapSize(4, 5);
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
        this._showClosestDistanceToEnemy = value;
    }

    get showEnemyAttackRange() {
        return this._showEnemyAttackRange;
    }
    set showEnemyAttackRange(value) {
        this._showEnemyAttackRange = value;
    }

    get showAllyAttackRange() {
        return this._showAllyAttackRange;
    }
    set showAllyAttackRange(value) {
        this._showAllyAttackRange = value;
    }

    __clearTiles() {
        for (let i = 0; i < this._tiles.length; ++i) {
            let tile = this._tiles[i];
            tile.type = TileType.Normal;
            if (tile.obj != null) {
                if (tile.obj instanceof BreakableWall || tile.obj instanceof Wall) {
                    tile.setObj(null);
                }
            }
        }
    }

    updateSourceCode() {
        let result = "// マップのセットアップ\n";
        result += this.__createSourceCodeForWallPlacement();
        result += this.__createSourceCodeForBreakableWallPlacement();
        for (let key of Object.keys(TileType)) {
            if (TileType[key] == TileType.Normal) {
                continue;
            }
            result += this.__createSourceCodeForTileTypeSetting(key, TileType[key]);
        }
        result += "if (withUnits) {\n";
        result += this.__createSourceCodeForUnitPlacement(UnitGroupType.Enemy);
        result += this.__createSourceCodeForUnitPlacement(UnitGroupType.Ally);
        result += "}\n";
        result += "// 敵軍のセットアップ\n"
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
            case UnitGroupType.Enemy: return `map.__placeElemyUnitsByPosYX([${elems}]);\n`;
            case UnitGroupType.Ally: return `map.__placeAllyUnitsByPosYX([${elems}]);\n`;
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
        return `map.__placeWallsByPosYX([${elems}]);\n`;
    }
    __createSourceCodeForBreakableWallPlacement() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.obj instanceof BreakableWall)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `map.__placeBreakableWallsByPosYX([${elems}], BreakableWallIconType.Wall);\n`;
    }
    __createSourceCodeForTileTypeSetting(tileTypeText, tileType) {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.type == tileType)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `map.__setTileTypesByPosYX([${elems}],TileType.${tileTypeText});\n`;
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
        let tile = this.findTileUnitPlaced(unit.id);
        if (tile != null) {
            let enumeratedUnits = [unit];
            for (let neighborTile of this.__enumerateNeighboringTiles(tile, distance)) {
                let neighborUnit = neighborTile.placedUnit;
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
            for (let i = 0; i < tile.neighbors.length; ++i) {
                let neighbor = tile.neighbors[i];
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
        for (let i = 0; i < this._walls.length; ++i) {
            let obj = this._walls[i];
            yield obj;
        }
    }

    *enumerateBreakableWalls() {
        for (let i = 0; i < this._breakableWalls.length; ++i) {
            let obj = this._breakableWalls[i];
            yield obj;
        }
    }

    *enumerateBreakableStructureTiles(groupId) {
        for (let block of this.enumerateBreakableStructures(groupId)) {
            if (block.placedTile != null) {
                yield block.placedTile;
            }
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
        for (let i = 0; i < getBreakableObjCountOfCurrentMapType(this._type); ++i) {
            let obj = this._breakableWalls[i];
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
        for (let i = 0; i < this._walls.length; ++i) {
            if (this._walls[i].id == objId) {
                return this._walls[i];
            }
        }
        return null;
    }

    findBreakbleWallById(objId) {
        for (let i = 0; i < this._breakableWalls.length; ++i) {
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
    /**
     * @param  {Number} x
     * @param  {Number} y
     * @returns {Tile}
     */
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
        let targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return false;
        }
        if (targetTile.isEmpty()) {
            this.removeObj(obj);
            targetTile.setObj(obj);
            return true;
        }
        else {
            let destObj = targetTile.obj;
            let srcTile = this.findTileObjPlaced(obj.id);
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
        let targetTile = this.findNeighborObjEmptyTile(x, y);
        if (targetTile == null) {
            return false;
        }

        this.removeObj(obj);
        targetTile.setObj(obj);
        return true;
    }
    placeObjToEmptyTile(obj) {
        let emptyTile;
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
        for (let y = offsetY; y < height; ++y) {
            for (let x = offsetX; x < width; ++x) {
                let tile = this.getTile(x, y);
                if (tile.isObjPlacable()) {
                    return tile;
                }
            }
        }
        return null;
    }
    findNeighborObjEmptyTile(x, y) {
        let targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }

        if (targetTile.isObjPlacable()) {
            return targetTile;
        }

        for (let i = 0; i < targetTile.neighbors.length; ++i) {
            let tile = targetTile.neighbors[i];
            if (tile.isObjPlacable()) {
                return tile;
            }
        }

        return null;
    }
    findNeighborUnitEmptyTile(x, y) {
        let targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        if (targetTile.isUnitPlacable()) {
            return targetTile;
        }

        for (let i = 0; i < targetTile.neighbors.length; ++i) {
            let tile = targetTile.neighbors[i];
            if (tile.isUnitPlacable()) {
                return tile;
            }
        }

        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                if (neighborNeighbor.isUnitPlacable()) {
                    return neighborNeighbor;
                }
            }
        }

        // 2回でもダメだったケースがあったので3回辿る
        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                for (let neighborNeighborNeighbor of neighborNeighbor.neighbors) {
                    if (neighborNeighborNeighbor.isUnitPlacable()) {
                        return neighborNeighborNeighbor;
                    }
                }
            }
        }

        return null;
    }
    removeObj(obj) {
        let tile = this.findTileObjPlaced(obj.id);
        if (tile != null) {
            // console.log(obj.id + " was removed");
            tile.setObj(null);
        }
        else {
            // console.log(obj.id + " was not found");
        }
    }

    findTileObjPlaced(objId) {
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
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
        let text = "";
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                if (tile.obj != null) {
                    text += tile.obj.id + "|";
                }
            }
        }
        return text;
    }
    /**
     * @param  {Function} predicatorFunc=null
     * @returns {Tile[]}
     */
    *enumerateTiles(predicatorFunc = null) {
        for (let tile of this._tiles) {
            if (predicatorFunc == null || predicatorFunc(tile)) {
                yield tile;
            }
        }
    }
    /**
     * @returns {Tile[]}
     */
    enumerateSelectedTiles() {
        return this.enumerateTiles(x => x.isSelected);
    }

    /**
     * @returns {Tile[]}
     */
    *enumerateTilesInSpecifiedDistanceFrom(targetTile, targetDistance) {
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                let distance = tile.calculateDistance(targetTile);
                if (distance == targetDistance) {
                    yield tile;
                }
            }
        }
    }
    /**
     * @param  {Tile} targetTile
     * @param  {Number} targetDistance
     * @returns {Tile[]}
     */
    *enumerateTilesWithinSpecifiedDistance(targetTile, targetDistance) {
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                let distance = tile.calculateDistance(targetTile);
                if (distance <= targetDistance) {
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
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
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

        let tile = this.findNeighborUnitEmptyTile(x, y);
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
        let targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        return targetTile.placedUnit;
    }

    moveUnitForcibly(unit, x, y) {
        let currentTile = unit.placedTile;
        if (currentTile == null) {
            return false;
        }

        try {
            let targetTile = this.getTile(x, y);
            if (targetTile == null) {
                return false;
            }

            if (targetTile.placedUnit != null) {
                // スワップ
                let posX = currentTile.placedUnit.posX;
                let posY = currentTile.placedUnit.posY;
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
        let currentTile = this.findTileUnitPlaced(unit.id);
        if (currentTile != null) {
            currentTile.placedUnit = null;
        }

        this.__removeUnit(unit);
    }

    __removeUnit(unit) {
        unit.placedTile = null;
        unit.setPos(-1, -1);
        let unitIndex = this.__findUnitIndex(unit);
        if (unitIndex >= 0) {
            this._units.splice(unitIndex, 1);
        }
    }

    __findUnitIndex(unit) {
        for (let i = 0; i < this._units.length; ++i) {
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
        let charCode = "A".charCodeAt(0) + x;
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
        moveUnit,
        targetUnitTile,
        additionalEvalTiles,
        evalsAttackableTiles = false,
        movableTiles = null,
        ignoresUnits = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true,
    ) {
        let nearestTiles = [];
        let minDist = CanNotReachTile;
        if (evalsAttackableTiles) {
            minDist = this.getMinDistToAttackableTile(moveUnit.placedTile, moveUnit, targetUnitTile);
        }
        else {
            minDist = targetUnitTile.calculateUnitMovementCountToThisTile(
                moveUnit, moveUnit.placedTile, -1, ignoresUnits, isUnitIgnoredFunc, isPathfinderEnabled);
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
                dist = targetUnitTile.calculateUnitMovementCountToThisTile(
                    moveUnit, movableTile, -1, ignoresUnits, isUnitIgnoredFunc, isPathfinderEnabled);
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
            case Special.RisingFlame:
            case Special.BlazingFlame:
                for (let x = targetTile.posX - 2; x <= targetTile.posX + 2; ++x) {
                    yield this.getTile(x, targetTile.posY);
                }
                break;
            case Special.GrowingFlame:
                for (let tile of this.__enumerateRangedSpecialTiles(targetTile, Special.RisingFlame)) {
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
            case Special.GiftedMagic:
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
            unit,
            unit.moveCount,
            ignoresUnits, includesUnitPlacedTile, ignoresTeleportTile, unitPlacedTile)
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
            unit,
            unit.moveCountAtBeginningOfTurn,
            ignoresUnits, includesUnitPlacedTile, ignoresTeleportTile, unitPlacedTile)
        ) {
            yield tile;
        }
    }

    *__enumerateTeleportTiles(
        unit
    ) {
        if (unit.hasStatusEffect(StatusEffectType.AirOrders)) {
            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                    yield tile;
                }
            }
        }

        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.MagicRabbits:
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        for (let tile of this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2)) {
                            yield tile;
                        }
                    }
                    break;
                case Weapon.TomeOfFavors:
                    if (unit.isWeaponSpecialRefined) {
                        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                            if (isWeaponTypeBeast(ally.weaponType)
                                && ally.heroInfo.canEquipRefreshSkill()
                            ) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case Weapon.FujinYumi:
                    if (unit.isWeaponSpecialRefined) {
                        if (unit.hpPercentage >= 50) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case Weapon.NabataKunai:
                case Weapon.LanceOfFrelia:
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        for (let tile of this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2)) {
                            yield tile;
                        }
                    }
                    break;
                case Weapon.Gurimowaru:
                    if (unit.isWeaponRefined) {
                        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            for (let tile of this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2)) {
                                yield tile;
                            }
                        }
                    }
                    else {
                        if (unit.hpPercentage >= 50) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
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
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case PassiveB.Kyuen2:
                case PassiveB.Kyuen3:
                case Weapon.FlowerLance:
                    for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                        let threshold = 0;
                        switch (skillId) {
                            case PassiveB.Kyuen2:
                                threshold = 40;
                                break;
                            case PassiveB.Kyuen3:
                                threshold = 50;
                                break;
                            case Weapon.FlowerLance:
                                threshold = 80;
                                break;
                        }
                        if (ally.hpPercentage <= threshold) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                yield tile;
                            }
                        }
                    }
                    break;
                case Weapon.AstralBreath:
                    for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                        if (unit.partnerHeroIndex == ally.heroIndex) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
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
                                    yield tile;
                                }
                            }
                        }

                        if (unit.isWeaponSpecialRefined) {
                            if (unit.hpPercentage >= 50) {
                                for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
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
                    case PassiveC.OpeningRetainer:
                        for (let tile of this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2)) {
                            yield tile;
                        }
                        break;
                    case Weapon.HinokaNoKounagitou:
                        if (ally.isWeaponSpecialRefined) {
                            if (unit.moveType == MoveType.Infantry || unit.moveType == MoveType.Flying) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                        break;
                    case Weapon.IzunNoKajitsu:
                        if (!ally.isWeaponSpecialRefined) {
                            if (ally.hpPercentage >= 50) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        } else {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 2, false, true)) {
                                yield tile;
                            }
                        }
                        break;
                    case PassiveC.SorakaranoSendo3:
                        // 空からの先導
                        if (unit.moveType == MoveType.Armor
                            || unit.moveType == MoveType.Infantry) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                yield tile;
                            }
                        }
                        break;
                    case PassiveC.HikonoSendo3:
                        if (unit.moveType == MoveType.Flying) {
                            // 飛行の先導
                            if (ally.hasPassiveSkill(PassiveC.HikonoSendo3)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                        break;
                }
            }
        }
    }

    /**
     * @param  {Tile} fromTile
     * @param  {Unit} unit
     * @param  {Number} distance
     * @returns {Tile[]}
     */
    *__enumeratePlacableTilesWithinSpecifiedSpaces(fromTile, unit, distance) {
        for (let tile of this.enumerateTilesWithinSpecifiedDistance(fromTile, distance)) {
            if (tile.isUnitPlacableForUnit(unit)) {
                yield tile;
            }
        }
    }

    __canWarp(targetTile, warpUnit) {
        for (let tile of this.enumerateTilesWithinSpecifiedDistance(targetTile, 4)) {
            if (tile.isEnemyUnitAvailable(warpUnit)
                && tile.placedUnit.passiveB == PassiveB.DetailedReport) {
                return false;
            }
        }
        return true;
    }

    *__enumerateAllMovableTilesImpl(
        unit,
        moveCount,
        ignoresUnits,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        let startTile = unit.placedTile;
        if (unitPlacedTile != null) {
            startTile = unitPlacedTile;
        }

        for (let tile of startTile.getMovableNeighborTiles(unit, moveCount, ignoresUnits)) {
            yield tile;
        }

        if (!ignoresTeleportTile) {
            for (let tile of this.__enumerateTeleportTiles(unit)) {
                if (!this.__canWarp(tile, unit)) {
                    continue;
                }

                if (unit.isCantoActivated()) {
                    if (tile.calculateDistanceToUnit(unit) <= unit.moveCountForCanto) {
                        yield tile;
                    }
                }
                else {
                    yield tile;
                }
            }
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
        const enumerated = {};
        for (let tile of this.__enumerateAllMovableTilesImpl(unit, moveCount, ignoresUnits, ignoresTeleportTile, unitPlacedTile)) {
            if (tile.positionToString() in enumerated) {
                continue;
            }
            enumerated[tile.positionToString()] = tile;
            if (!includesUnitPlacedTile
                && tile.placedUnit != unit
                && !tile.isUnitPlacable()) {
                continue;
            }
            yield tile;
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

        let doneTiles = [];
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

    updateMovableAndAttackableTilesForUnit(unit) {
        unit.movableTiles = [];
        unit.attackableTiles = [];
        unit.assistableTiles = [];

        // ユニットの移動可能範囲、攻撃可能範囲を更新
        for (let tile of this.enumerateMovableTiles(unit, false)) {
            if (unit.movableTiles.includes(tile)) {
                continue;
            }

            unit.movableTiles.push(tile);
            if (unit.hasWeapon) {
                for (let attackableTile of this.enumerateTilesInSpecifiedDistanceFrom(tile, unit.attackRange)) {
                    if (!unit.attackableTiles.includes(attackableTile)) {
                        unit.attackableTiles.push(attackableTile);
                    }
                }
            }
            if (unit.hasSupport) {
                for (let assistableTile of this.enumerateTilesInSpecifiedDistanceFrom(tile, unit.assistRange)) {
                    if (!unit.assistableTiles.includes(assistableTile)) {
                        unit.assistableTiles.push(assistableTile);
                    }
                }
            }
        }
    }

    updateMovableAndAttackableTilesForAllUnits() {
        for (let unit of this._units) {
            this.updateMovableAndAttackableTilesForUnit(unit);
        }
    }

    /// タイルの状態を更新します。
    updateTiles(updatesEnemyThreat = true) {
        this.updateMovableAndAttackableTilesForAllUnits();

        // 各タイルの初期化
        for (let tile of this._tiles) {
            tile.resetDangerLevel();
            tile.closestDistanceToEnemy = -1;
            tile.isMovableForAlly = false;
            tile.isMovableForEnemy = false;
            tile.isAttackableForAlly = false;
            tile.isAttackableForEnemy = false;
            tile.threateningEnemies = [];
            tile.threateningAllies = [];
        }

        for (let unit of this._units) {
            if (unit.groupId == UnitGroupType.Enemy) {
                for (let tile of unit.movableTiles) {
                    tile.isMovableForEnemy = true;
                }
                for (let tile of unit.attackableTiles) {
                    tile.isAttackableForEnemy = true;
                }
            } else {
                for (let tile of unit.movableTiles) {
                    tile.isMovableForAlly = true;
                }
                for (let tile of unit.attackableTiles) {
                    tile.isAttackableForAlly = true;
                }
            }
        }

        // 危険度等を更新
        if (updatesEnemyThreat) {
            for (let unit of this._units) {
                this.__setEnemyThreat(unit);
            }
        }
    }

    /// マップを Table に変換します。
    toTable() {
        let isMapHeaderEnabled = this.isHeaderEnabled;
        if (isMapHeaderEnabled) {
            this.cellOffsetX = 1;
            this.cellOffsetY = 0;
        }

        let tableWidth = this._width + this.cellOffsetX;
        let tableHeight = this._height + this.cellOffsetY;

        if (this._table == null) {
            this._table = new Table(tableWidth, tableHeight);
        }
        else {
            this._table.resize(tableWidth, tableHeight);
        }
        let table = this._table;

        if (this.isBackgroundImageEnabled) {
            try {
                table.backgroundImages = getMapBackgroundImageInfos(this._type);
            } catch (error) {
                // 画像が見つからない場合はエラー出しつつ無視
                console.error(error);
            }
        }
        else {
            table.backgroundImages = [];
        }

        // マップをテーブル化
        let cellWidth = this.cellWidth;
        let cellHeight = this.cellHeight;
        {
            // テーブルセルの初期化
            for (let y = 0; y < this._height; ++y) {
                for (let x = 0; x < this._width; ++x) {
                    let cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                    let fontColor = "#fff";
                    let tileText = this.getTileLabel(x, y);
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
                        let index = y * this._width + x;
                        let tile = this._tiles[index];
                        cell.bgColor = tileTypeToColor(tile.type);
                        cell.borderStyle = "solid";
                    }
                }
            }

            // 施設などの配置
            for (let y = 0; y < this._height; ++y) {
                if (isMapHeaderEnabled) {
                    let cell = table.getCell(0, y);
                    cell.type = CellType.Header;
                    cell.innerText = this.getTileLabelY(y);
                    cell.borderWidth = "0px";
                }
                for (let x = 0; x < this._width; ++x) {
                    let index = y * this._width + x;
                    let tile = this._tiles[index];
                    let obj = tile.obj;

                    let tileText = "";
                    // let tileText = this.getTileLabel(x, y);
                    if (!this.isBackgroundImageEnabled) {
                        let tileThumb = tileTypeToThumb(tile.type, this._type);
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

                    let showTilePriority = false;
                    if (showTilePriority) {
                        tileText += tile.tilePriority;
                    }

                    let cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                    cell.innerText = tileText;
                    if (obj != null) {
                        this.__putStructureIconToCell(cell, obj);
                    }
                }
            }

            if (isMapHeaderEnabled) {
                {
                    let cell = table.getCell(0, this._height);
                    cell.borderWidth = "0px";
                }
                for (let x = 0; x < this._width; ++x) {
                    let cell = table.getCell(x + this.cellOffsetX, this._height);
                    cell.type = CellType.Header;
                    cell.innerText = this.getTileLabelX(x);
                    cell.borderWidth = "0px";
                }
            }
        }

        // 各ユニットの処理
        for (let unit of this._units) {
            // console.log(unit);
            let tile = unit.placedTile;
            let cell = table.getCell(tile.posX + this.cellOffsetX, tile.posY + this.cellOffsetY);
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
                    let closestDistance = tile.closestDistanceToEnemy;
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

    /**
     * @param  {Unit} targetUnit
     * @param  {Number} spaces
     * @returns {Unit[]}
     */
    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit)) {
            let dist = Math.abs(unit.posX - targetUnit.posX) + Math.abs(unit.posY - targetUnit.posY);
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
                let shadowCss = this.__getShadowCss();
                if (structure.hasLevel) {
                    cell.innerText += "<span style='position:absolute;bottom:0;right:0;font-size:10px;" + shadowCss + ";'>"
                    cell.innerText += "LV." + structure.level;
                    cell.innerText += "</span>";
                }
            }
        }
    }

    __putUnitIconToCell(cell, unit) {
        let style = "";
        let color = "#bbeeff";
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
            let shadowCss = this.__getShadowCss();
            if (this.isExpansionUnitFunc != null && this.isExpansionUnitFunc(unit)) {
                cell.innerText += "<span style='position:absolute;bottom:0;right:0;'><img src='"
                    + g_imageRootPath + "ExpansionUnit.png" + "' style='width:15px' ></span>";
            }

            cell.innerText += "<span style='font-size:10px;color:" + color + ";position:absolute;bottom:0;left:0;" + shadowCss + ";'>"
                + unit.hp + "</span>";
            if (unit.maxSpecialCount > 0) {
                let specialCount = unit.specialCount;
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
