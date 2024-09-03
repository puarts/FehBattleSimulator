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
    K0013: 12,
    K0014: 13,
    K0015: 14,
    K0016: 15,
    K0017: 16,
    K0018: 17,

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
    Arena_36: MapType_ArenaOffset + 35,
    Arena_37: MapType_ArenaOffset + 36,
    Arena_38: MapType_ArenaOffset + 37,
    Arena_39: MapType_ArenaOffset + 38,
    Arena_40: MapType_ArenaOffset + 39,
    Arena_41: MapType_ArenaOffset + 40,
    Arena_42: MapType_ArenaOffset + 41,
    Arena_43: MapType_ArenaOffset + 42,
    Arena_44: MapType_ArenaOffset + 43,
    Arena_45: MapType_ArenaOffset + 44,
    Arena_46: MapType_ArenaOffset + 45,
    Arena_47: MapType_ArenaOffset + 46,
    Arena_48: MapType_ArenaOffset + 47,
    Arena_49: MapType_ArenaOffset + 48,
    Arena_50: MapType_ArenaOffset + 49,
    Arena_51: MapType_ArenaOffset + 50,
    Arena_52: MapType_ArenaOffset + 51,
    Arena_53: MapType_ArenaOffset + 52,
    Arena_54: MapType_ArenaOffset + 53,
    Arena_55: MapType_ArenaOffset + 54,
    Arena_56: MapType_ArenaOffset + 55,
    Arena_57: MapType_ArenaOffset + 56,
    Arena_58: MapType_ArenaOffset + 57,
    Arena_59: MapType_ArenaOffset + 58,
    Arena_60: MapType_ArenaOffset + 59,
    Arena_61: MapType_ArenaOffset + 60,
    Arena_62: MapType_ArenaOffset + 61,
    Arena_63: MapType_ArenaOffset + 62,
    Arena_64: MapType_ArenaOffset + 63,
    Arena_65: MapType_ArenaOffset + 64,
    Arena_66: MapType_ArenaOffset + 65,
    Arena_67: MapType_ArenaOffset + 66,
    Arena_68: MapType_ArenaOffset + 67,
    Arena_69: MapType_ArenaOffset + 68,
    Arena_70: MapType_ArenaOffset + 69,
    Arena_71: MapType_ArenaOffset + 70,
    Arena_72: MapType_ArenaOffset + 71,
    Arena_73: MapType_ArenaOffset + 72,
    Arena_74: MapType_ArenaOffset + 73,
    Arena_75: MapType_ArenaOffset + 74,

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
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR001
    SummonersDuel_1: MapType_SummonerDuelsOffset + 1,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR002
    SummonersDuel_2: MapType_SummonerDuelsOffset + 2,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR003
    SummonersDuel_3: MapType_SummonerDuelsOffset + 3,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR004
    SummonersDuel_4: MapType_SummonerDuelsOffset + 4, // 東西の端の橋
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR005
    SummonersDuel_5: MapType_SummonerDuelsOffset + 5, // 崩れた壁に囲まれた地
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR006
    SummonersDuel_6: MapType_SummonerDuelsOffset + 6, // 樹々生い茂る砂漠
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR007
    SummonersDuel_7: MapType_SummonerDuelsOffset + 7,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR008
    SummonersDuel_8: MapType_SummonerDuelsOffset + 8,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR009
    SummonersDuel_9: MapType_SummonerDuelsOffset + 9,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR010
    SummonersDuel_10: MapType_SummonerDuelsOffset + 10,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR011
    SummonersDuel_11: MapType_SummonerDuelsOffset + 11,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR012
    SummonersDuel_12: MapType_SummonerDuelsOffset + 12,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR013
    SummonersDuel_13: MapType_SummonerDuelsOffset + 13, // 山間の道
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR014
    SummonersDuel_14: MapType_SummonerDuelsOffset + 14, // 蛇行する砂漠
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR015
    SummonersDuel_15: MapType_SummonerDuelsOffset + 15,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR016
    SummonersDuel_16: MapType_SummonerDuelsOffset + 16,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR017
    SummonersDuel_17: MapType_SummonerDuelsOffset + 17,
    // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR018
    SummonersDuel_18: MapType_SummonerDuelsOffset + 18,
};

const SummonerDuelsMapKindOptions = [
    { label: "更地(マップ作成用)", value: MapType.SummonersDuel_Default },
    { label: "細く長い川", value: MapType.SummonersDuel_1 },
    { label: "並ぶ樹と壁", value: MapType.SummonersDuel_2 },
    { label: "壁に囲まれた地", value: MapType.SummonersDuel_3 },
    { label: "東西の端の橋", value: MapType.SummonersDuel_4 },
    { label: "崩れた壁に囲まれた地", value: MapType.SummonersDuel_5 },
    { label: "樹々生い茂る砂漠", value: MapType.SummonersDuel_6 },
    { label: "斜めに伸びた床", value: MapType.SummonersDuel_7 },
    { label: "小さな部屋", value: MapType.SummonersDuel_8 },
    { label: "細く短い迂回路", value: MapType.SummonersDuel_9 },
    { label: "四つの部屋", value: MapType.SummonersDuel_10 },
    { label: "広大な草原", value: MapType.SummonersDuel_11 },
    { label: "水没した床", value: MapType.SummonersDuel_12 },
    { label: "山間の道", value: MapType.SummonersDuel_13 },
    { label: "蛇行する砂漠", value: MapType.SummonersDuel_14 },
    { label: "中央庭園", value: MapType.SummonersDuel_15 },
    { label: "行く手阻む巨壁", value: MapType.SummonersDuel_16 },
    { label: "埋められない溝", value: MapType.SummonersDuel_17 },
    { label: "そびえ立つ山林", value: MapType.SummonersDuel_18 },
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
        case MapType.K0013:
        case MapType.K0017:
            return 4;
        case MapType.K0015:
            return 2;
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


function initializeImageFileList(sourceDict, destArray) {
    for (let key in sourceDict) {
        let value = sourceDict[key];
        destArray.push({
            id: key,
            fileName: value
        });
    }
}

const AetherRaidMapImageFilePaths = {}
AetherRaidMapImageFilePaths[MapType.Haikyo] = "Haikyo.png";
AetherRaidMapImageFilePaths[MapType.Harukaze] = "Harukaze.png";
AetherRaidMapImageFilePaths[MapType.Hyosetsu] = "Hyosetsu.png";
AetherRaidMapImageFilePaths[MapType.Izumi] = "Izumi.png";
AetherRaidMapImageFilePaths[MapType.Komorebi] = "Komorebi.png";
AetherRaidMapImageFilePaths[MapType.Natsukusa] = "Natsukusa.png";
AetherRaidMapImageFilePaths[MapType.Sabaku] = "Sabaku.png";
AetherRaidMapImageFilePaths[MapType.Syakunetsu] = "Syakunetsu.png";
AetherRaidMapImageFilePaths[MapType.Wasurerareta] = "Wasurerareta.png";
AetherRaidMapImageFilePaths[MapType.Yukigesho] = "Yukigesyo.png";
AetherRaidMapImageFilePaths[MapType.DreamCastle] = "DreamCastle.png";
AetherRaidMapImageFilePaths[MapType.NightmareCastle] = "NightmareCastle.png";
AetherRaidMapImageFilePaths[MapType.K0013] = "K0013.png";
AetherRaidMapImageFilePaths[MapType.K0014] = "K0014.png";
AetherRaidMapImageFilePaths[MapType.K0015] = "K0015.png";
AetherRaidMapImageFilePaths[MapType.K0016] = "K0016.png";
AetherRaidMapImageFilePaths[MapType.K0017] = "K0017.png";
AetherRaidMapImageFilePaths[MapType.K0018] = "K0018.png";

const AetherRaidMapImageFiles = [];
initializeImageFileList(AetherRaidMapImageFilePaths, AetherRaidMapImageFiles);

const g_summonerDuelsMapRelativeRoot = "SummonerDuels/";
const SummonerDuelsImageFilePaths = {};
SummonerDuelsImageFilePaths[MapType.SummonersDuel_Default] = g_summonerDuelsMapRelativeRoot + "Default.png";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_1] = g_summonerDuelsMapRelativeRoot + "Map_ZR001.png";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_2] = g_summonerDuelsMapRelativeRoot + "Map_ZR002.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_5] = g_summonerDuelsMapRelativeRoot + "Map_ZR005.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_13] = g_summonerDuelsMapRelativeRoot + "Map_ZR013.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_4] = g_summonerDuelsMapRelativeRoot + "Map_ZR004.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_14] = g_summonerDuelsMapRelativeRoot + "Map_ZR014.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_6] = g_summonerDuelsMapRelativeRoot + "Map_ZR006.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_3] = g_summonerDuelsMapRelativeRoot + "Map_ZR003.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_7] = g_summonerDuelsMapRelativeRoot + "Map_ZR007.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_8] = g_summonerDuelsMapRelativeRoot + "Map_ZR008.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_9] = g_summonerDuelsMapRelativeRoot + "Map_ZR009.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_10] = g_summonerDuelsMapRelativeRoot + "Map_ZR010.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_11] = g_summonerDuelsMapRelativeRoot + "Map_ZR011.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_12] = g_summonerDuelsMapRelativeRoot + "Map_ZR012.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_15] = g_summonerDuelsMapRelativeRoot + "Map_ZR015.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_16] = g_summonerDuelsMapRelativeRoot + "Map_ZR016.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_17] = g_summonerDuelsMapRelativeRoot + "Map_ZR017.webp";
SummonerDuelsImageFilePaths[MapType.SummonersDuel_18] = g_summonerDuelsMapRelativeRoot + "Map_ZR018.webp";

const SummonerDuelsImageFiles = [];
initializeImageFileList(SummonerDuelsImageFilePaths, SummonerDuelsImageFiles);


const g_arenaMapRelativeRoot = "Arena/";
const ArenaMapImageFilePaths = {};
ArenaMapImageFilePaths[MapType.Arena_1] = g_arenaMapRelativeRoot + "Arena_1.jpg";
ArenaMapImageFilePaths[MapType.Arena_2] = g_arenaMapRelativeRoot + "Arena_2.png";
ArenaMapImageFilePaths[MapType.Arena_3] = g_arenaMapRelativeRoot + "Arena_3.jpg";
ArenaMapImageFilePaths[MapType.Arena_4] = g_arenaMapRelativeRoot + "Arena_4.png";
ArenaMapImageFilePaths[MapType.Arena_5] = g_arenaMapRelativeRoot + "Arena_5.jpg";
ArenaMapImageFilePaths[MapType.Arena_6] = g_arenaMapRelativeRoot + "Arena_6.png";
ArenaMapImageFilePaths[MapType.Arena_7] = g_arenaMapRelativeRoot + "Arena_7.png";
ArenaMapImageFilePaths[MapType.Arena_8] = g_arenaMapRelativeRoot + "Arena_8.png";
ArenaMapImageFilePaths[MapType.Arena_9] = g_arenaMapRelativeRoot + "Arena_9.png";
ArenaMapImageFilePaths[MapType.Arena_10] = g_arenaMapRelativeRoot + "Arena_10.png";
ArenaMapImageFilePaths[MapType.Arena_11] = g_arenaMapRelativeRoot + "Arena_11.png";
ArenaMapImageFilePaths[MapType.Arena_12] = g_arenaMapRelativeRoot + "Arena_12.png";
ArenaMapImageFilePaths[MapType.Arena_13] = g_arenaMapRelativeRoot + "Arena_13.png";
ArenaMapImageFilePaths[MapType.Arena_14] = g_arenaMapRelativeRoot + "Arena_14.png";
ArenaMapImageFilePaths[MapType.Arena_15] = g_arenaMapRelativeRoot + "Arena_15.png";
ArenaMapImageFilePaths[MapType.Arena_16] = g_arenaMapRelativeRoot + "Arena_16.png";
ArenaMapImageFilePaths[MapType.Arena_17] = g_arenaMapRelativeRoot + "Arena_17.png";
ArenaMapImageFilePaths[MapType.Arena_18] = g_arenaMapRelativeRoot + "Arena_18.png";
ArenaMapImageFilePaths[MapType.Arena_19] = g_arenaMapRelativeRoot + "Arena_19.png";
ArenaMapImageFilePaths[MapType.Arena_20] = g_arenaMapRelativeRoot + "Arena_20.png";
ArenaMapImageFilePaths[MapType.Arena_21] = g_arenaMapRelativeRoot + "Arena_21.png";
ArenaMapImageFilePaths[MapType.Arena_22] = g_arenaMapRelativeRoot + "Arena_22.png";
ArenaMapImageFilePaths[MapType.Arena_23] = g_arenaMapRelativeRoot + "Arena_23.png";
ArenaMapImageFilePaths[MapType.Arena_24] = g_arenaMapRelativeRoot + "Arena_24.png";
ArenaMapImageFilePaths[MapType.Arena_25] = g_arenaMapRelativeRoot + "Arena_25.png";
ArenaMapImageFilePaths[MapType.Arena_26] = g_arenaMapRelativeRoot + "Arena_26.jpg";
ArenaMapImageFilePaths[MapType.Arena_27] = g_arenaMapRelativeRoot + "Arena_27.jpg";
ArenaMapImageFilePaths[MapType.Arena_28] = g_arenaMapRelativeRoot + "Arena_28.jpg";
ArenaMapImageFilePaths[MapType.Arena_29] = g_arenaMapRelativeRoot + "Arena_29.jpg";
ArenaMapImageFilePaths[MapType.Arena_30] = g_arenaMapRelativeRoot + "Arena_30.png";
ArenaMapImageFilePaths[MapType.Arena_31] = g_arenaMapRelativeRoot + "Arena_31.png";
ArenaMapImageFilePaths[MapType.Arena_32] = g_arenaMapRelativeRoot + "Arena_32.png";
ArenaMapImageFilePaths[MapType.Arena_33] = g_arenaMapRelativeRoot + "Arena_33.png";
ArenaMapImageFilePaths[MapType.Arena_34] = g_arenaMapRelativeRoot + "Arena_34.png";
ArenaMapImageFilePaths[MapType.Arena_35] = g_arenaMapRelativeRoot + "Arena_35.png";
ArenaMapImageFilePaths[MapType.Arena_36] = g_arenaMapRelativeRoot + "Map_Z0036.png";
ArenaMapImageFilePaths[MapType.Arena_37] = g_arenaMapRelativeRoot + "Map_Z0037.png";
ArenaMapImageFilePaths[MapType.Arena_38] = g_arenaMapRelativeRoot + "Map_Z0038.png";
ArenaMapImageFilePaths[MapType.Arena_39] = g_arenaMapRelativeRoot + "Map_Z0039.png";
ArenaMapImageFilePaths[MapType.Arena_40] = g_arenaMapRelativeRoot + "Map_Z0040.png";
ArenaMapImageFilePaths[MapType.Arena_41] = g_arenaMapRelativeRoot + "Map_Z0041.png";
ArenaMapImageFilePaths[MapType.Arena_42] = g_arenaMapRelativeRoot + "Map_Z0042.png";
ArenaMapImageFilePaths[MapType.Arena_43] = g_arenaMapRelativeRoot + "Map_Z0043.png";
ArenaMapImageFilePaths[MapType.Arena_44] = g_arenaMapRelativeRoot + "Map_Z0044.png";
ArenaMapImageFilePaths[MapType.Arena_45] = g_arenaMapRelativeRoot + "Map_Z0045.png";
ArenaMapImageFilePaths[MapType.Arena_46] = g_arenaMapRelativeRoot + "Arena_46.png";
ArenaMapImageFilePaths[MapType.Arena_47] = g_arenaMapRelativeRoot + "Arena_47.png";
ArenaMapImageFilePaths[MapType.Arena_48] = g_arenaMapRelativeRoot + "Arena_48.png";
ArenaMapImageFilePaths[MapType.Arena_49] = g_arenaMapRelativeRoot + "Arena_49.png";
ArenaMapImageFilePaths[MapType.Arena_50] = g_arenaMapRelativeRoot + "Arena_50.png";
ArenaMapImageFilePaths[MapType.Arena_51] = g_arenaMapRelativeRoot + "Map_Z0051.png";
ArenaMapImageFilePaths[MapType.Arena_52] = g_arenaMapRelativeRoot + "Map_Z0052.png";
ArenaMapImageFilePaths[MapType.Arena_53] = g_arenaMapRelativeRoot + "Map_Z0053.png";
ArenaMapImageFilePaths[MapType.Arena_54] = g_arenaMapRelativeRoot + "Map_Z0054.png";
ArenaMapImageFilePaths[MapType.Arena_55] = g_arenaMapRelativeRoot + "Map_Z0055.png";
ArenaMapImageFilePaths[MapType.Arena_56] = g_arenaMapRelativeRoot + "Map_Z0056.png";
ArenaMapImageFilePaths[MapType.Arena_57] = g_arenaMapRelativeRoot + "Map_Z0057.png";
ArenaMapImageFilePaths[MapType.Arena_58] = g_arenaMapRelativeRoot + "Map_Z0058.png";
ArenaMapImageFilePaths[MapType.Arena_59] = g_arenaMapRelativeRoot + "Map_Z0059.png";
ArenaMapImageFilePaths[MapType.Arena_60] = g_arenaMapRelativeRoot + "Map_Z0060.png";
ArenaMapImageFilePaths[MapType.Arena_61] = g_arenaMapRelativeRoot + "Map_Z0061.png";
ArenaMapImageFilePaths[MapType.Arena_62] = g_arenaMapRelativeRoot + "Map_Z0062.png";
ArenaMapImageFilePaths[MapType.Arena_63] = g_arenaMapRelativeRoot + "Map_Z0063.png";
ArenaMapImageFilePaths[MapType.Arena_64] = g_arenaMapRelativeRoot + "Map_Z0064.png";
ArenaMapImageFilePaths[MapType.Arena_65] = g_arenaMapRelativeRoot + "Map_Z0065.png";
ArenaMapImageFilePaths[MapType.Arena_66] = g_arenaMapRelativeRoot + "Map_Z0066.png";
ArenaMapImageFilePaths[MapType.Arena_67] = g_arenaMapRelativeRoot + "Map_Z0067.png";
ArenaMapImageFilePaths[MapType.Arena_68] = g_arenaMapRelativeRoot + "Map_Z0068.png";
ArenaMapImageFilePaths[MapType.Arena_69] = g_arenaMapRelativeRoot + "Map_Z0069.png";
ArenaMapImageFilePaths[MapType.Arena_70] = g_arenaMapRelativeRoot + "Map_Z0070.png";
ArenaMapImageFilePaths[MapType.Arena_71] = g_arenaMapRelativeRoot + "Map_Z0071.png";
ArenaMapImageFilePaths[MapType.Arena_72] = g_arenaMapRelativeRoot + "Map_Z0072.png";
ArenaMapImageFilePaths[MapType.Arena_73] = g_arenaMapRelativeRoot + "Map_Z0073.png";
ArenaMapImageFilePaths[MapType.Arena_74] = g_arenaMapRelativeRoot + "Map_Z0074.png";
ArenaMapImageFilePaths[MapType.Arena_75] = g_arenaMapRelativeRoot + "Map_Z0075.png";

const ArenaMapImageFiles = [];
initializeImageFileList(ArenaMapImageFilePaths, ArenaMapImageFiles);


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

const ArenaMapKindOptions = [];
{
    let i = 1;
    for (let key in ArenaMapImageFilePaths) {
        ArenaMapKindOptions.push({
            label: `マップ${i}`,
            value: Number(key)
        });
        ++i;
    }
}

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
const g_arenaMapRoot = g_corsImageRootPath + "Maps/" + g_arenaMapRelativeRoot;

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
    }

    yield new BackgroundImageInfo(getMapBackgroundImage(mapType));

    if (isSummonerDuelsMap(mapType)) {
        yield new BackgroundImageInfo(g_summonerDuelsMapRoot + "Rival_Domains_Wave.webp");
    }
}

function getMapBackgroundImage(mapKind) {
    if (isAetherRaidMap(mapKind)) {
        return g_imageRootPath + "TableBackground/" + AetherRaidMapImageFilePaths[mapKind];
    }
    else if (isArenaMap(mapKind)) {
        return g_corsImageRootPath + "Maps/" + ArenaMapImageFilePaths[mapKind];
    }
    else if (isSummonerDuelsMap(mapKind)) {
        return g_corsImageRootPath + "Maps/" + SummonerDuelsImageFilePaths[mapKind];
    }
    else {
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
        /** @type {BreakableWall[]} */
        this._breakableWalls = [];
        this._breakableWalls.push(new BreakableWall(idGenerator == null ? "" : idGenerator.generate()));
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
        this.isBlockImageEnabled = false;

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
        result += `map.isBlockImageEnabled = ${this.isBlockImageEnabled ? "true" : "false"};\n`;
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
        result += "\n";
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
    /**
     * 壁が配置されてるタイルを Wall タイプのタイルに変換します。
     * @param  {Number[][]} positions
     */
    __convertTilesPlacedWallToWallTileTypeByPosYx(positions) {
        let i = 0;
        for (let pos of positions) {
            let posX = pos[1];
            let posY = pos[0];
            let tile = this.getTile(posX, posY);
            let oldObj = tile.obj;
            if (oldObj instanceof Wall) {
                tile.setObj(null);
                tile.type = TileType.Wall;
            }
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

    /**
     * @param {number} groupId
     * @returns {Generator<Tile>}
     */
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
    /**
     * @param  {Unit} unit
     * @param  {Number} areaOffset
     */
    isUnitOnSummonerDuelsPointArea(unit, areaOffset) {
        return 0 < unit.posX && unit.posX < this.width - 1
            && 2 + areaOffset < unit.posY && unit.posY < this.height - 1 - (1 + areaOffset);
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
    placeObjToEmptyTile(obj, ignoresUnit = true) {
        let emptyTile;
        if (obj instanceof OffenceStructureBase) {
            emptyTile = this.__findEmptyTileOfOffenceStructure(ignoresUnit);
        }
        else {
            emptyTile = this.__findEmptyTileOfDiffenceStructure(ignoresUnit);
        }
        this.removeObj(obj);
        emptyTile.setObj(obj);
    }

    __findEmptyTileOfOffenceStructure(ignoresUnit = true) {
        return this.__findEmptyTile(0, 7, this._width, this._height, ignoresUnit);
    }

    __findEmptyTileOfDiffenceStructure(ignoresUnit = true) {
        return this.__findEmptyTile(0, 0, this._width, this._height - 1, ignoresUnit);
    }

    __findEmptyTile(offsetX, offsetY, width, height, ignoresUnit = true) {
        for (let y = offsetY; y < height; ++y) {
            for (let x = offsetX; x < width; ++x) {
                let tile = this.getTile(x, y);
                if (tile.isObjPlacable() && (ignoresUnit || tile.placedUnit == null)) {
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
    findNeighborUnitEmptyTile(x, y, unit) {
        let targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        if (targetTile.isUnitPlacable(unit)) {
            return targetTile;
        }

        for (let i = 0; i < targetTile.neighbors.length; ++i) {
            let tile = targetTile.neighbors[i];
            if (tile.isUnitPlacable(unit)) {
                return tile;
            }
        }

        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                if (neighborNeighbor.isUnitPlacable(unit)) {
                    return neighborNeighbor;
                }
            }
        }

        // 2回でもダメだったケースがあったので3回辿る
        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                for (let neighborNeighborNeighbor of neighborNeighbor.neighbors) {
                    if (neighborNeighborNeighbor.isUnitPlacable(unit)) {
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
     * @param  {function(Tile): boolean} predicatorFunc=null
     * @returns {Generator<Tile>}
     */
    *enumerateTiles(predicatorFunc = null) {
        for (let tile of this._tiles) {
            if (predicatorFunc == null || predicatorFunc(tile)) {
                yield tile;
            }
        }
    }

    /**
     * @returns {Generator<Tile>}
     */
    enumerateSelectedTiles() {
        return this.enumerateTiles(x => x.isSelected);
    }

    /**
     * @returns {Generator<Tile>}
     */
    *enumerateTilesInSpecifiedDistanceFrom(targetTile, targetDistance) {
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                let distance = tile.calculateDistance(targetTile);
                if (distance === targetDistance) {
                    yield tile;
                }
            }
        }
    }

    /**
     * @param {Tile} targetTile
     * @param {Number} targetDistance
     * @returns {Generator<Tile>}
     */
    * enumerateTilesWithinSpecifiedDistance(targetTile, targetDistance) {
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

    /**
     * nxn以内のタイルを列挙。
     * @param  {Tile} targetTile
     * @param  {Number} n
     * @returns {Tile[]}
     */
    *enumerateTilesInSquare(targetTile, n) {
        let tx = targetTile.posX;
        let ty = targetTile.posY;
        let m = Math.trunc(n / 2);
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                if (tile.isInRange(tx - m, tx + m, ty - m, ty + m)) {
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

        let tile = this.findNeighborUnitEmptyTile(x, y, unit);
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
        if (unit.posX === x && unit.posY === y) {
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
            if (!tile.isMovableTileForMoveType(MoveType.Flying, groupId)) {
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

    /**
     * @param {Tile} targetTile
     * @param {number} special
     * @returns {Generator<Tile>}
     */
    * __enumerateRangedSpecialTiles(targetTile, special) {
        yield* getSkillFunc(special, enumerateRangedSpecialTilesFuncMap)?.call(this, targetTile) ?? [];
        switch (special) {
            case Special.RisingFlame:
            case Special.BlazingFlame:
                for (let x = targetTile.posX - 2; x <= targetTile.posX + 2; ++x) {
                    yield this.getTile(x, targetTile.posY);
                }
                break;
            case Special.GrowingFlame:
                yield* this.__enumerateRangedSpecialTiles(targetTile, Special.RisingFlame);
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
                yield* this.__enumerateRangedSpecialTiles(targetTile, Special.RisingLight);
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

    /**
     * @param {Unit} unit
     * @returns {Iterable<Tile>}
     * @private
     */
    * __enumerateTeleportTiles(unit) {
        if (unit.hasStatusEffect(StatusEffectType.AirOrders)) {
            yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
        }

        if (unit.hasStatusEffect(StatusEffectType.Charge)) {
            for (let tile of unit.placedTile.getMovableNeighborTiles(unit, 3, false, true)) {
                let diffX = Math.abs(tile.posX - unit.posX);
                let diffY = Math.abs(tile.posY - unit.posY);
                if ((tile.posX === unit.posX && 2 <= diffY && diffY <= 3) ||
                    (tile.posY === unit.posY && 2 <= diffX && diffX <= 3)) {
                    yield tile;
                }
            }
        }

        // 味方を自身の周囲にワープさせるスキル
        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
            // ステータス: 時の門
            if (ally.hasStatusEffect(StatusEffectType.TimesGate)) {
                if (unit.distance(ally) <= 4) {
                    yield* ally.placedTile.getMovableNeighborTiles(ally, 1, false, true);
                }
            }
            for (let skillId of ally.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.NewHeightBow:
                        if (ally.hpPercentage <= 60) {
                            yield* ally.placedTile.getMovableNeighborTiles(ally, 1, false, true);
                        }
                        break;
                }
            }
        }

        let env = new BattleMapEnv(this, unit);
        env.setName('ワープ').setLogLevel(g_appData?.skillLogLevel ?? NodeEnv.LOG_LEVEL.OFF);
        yield* UNIT_CAN_MOVE_TO_A_SPACE_HOOKS.evaluateWithUnit(unit, env).flat(1);

        for (let skillId of unit.enumerateSkills()) {
            yield* getSkillFunc(skillId, enumerateTeleportTilesForUnitFuncMap)?.call(this, unit) ?? [];
            yield* this.#enumerateTeleportTilesForUnit(skillId, unit);
        }

        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
            for (let skillId of ally.enumerateSkills()) {
                yield* getSkillFunc(skillId, enumerateTeleportTilesForAllyFuncMap)?.call(this, unit, ally) ?? [];
            }
        }

        // 周囲2マス以内の味方は、自身の周囲Nマス以内に移動可能
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
            for (let skillId of ally.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HeartOfCrimea:
                    case Weapon.NewHeightBow:
                    case PassiveC.OpeningRetainer:
                        yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2);
                        break;
                    case Weapon.HinokaNoKounagitou:
                        if (ally.isWeaponSpecialRefined) {
                            if (unit.moveType === MoveType.Infantry || unit.moveType === MoveType.Flying) {
                                yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
                            }
                        }
                        break;
                    case Weapon.IzunNoKajitsu:
                        if (!ally.isWeaponSpecialRefined) {
                            if (ally.hpPercentage >= 50) {
                                yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2);
                            }
                        } else {
                            yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2);
                        }
                        break;
                    case PassiveC.SorakaranoSendo3:
                        // 空からの先導
                        if (unit.moveType === MoveType.Armor || unit.moveType === MoveType.Infantry) {
                            yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
                        }
                        break;
                    case PassiveC.HikonoSendo3:
                        if (unit.moveType === MoveType.Flying) {
                            // 飛行の先導
                            if (ally.hasPassiveSkill(PassiveC.HikonoSendo3)) {
                                yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
                            }
                        }
                        break;
                }
            }
        }
    }

    * #enumerateTeleportTilesForUnit(skillId, unit) {
        switch (skillId) {
            case PassiveB.AerialManeuvers:
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit); // 2, 2
                break;
            case PassiveC.InevitableDeathPlus: {
                yield* this.enumerateNearestTileForEachEnemyWithinSpecificSpaces(unit, 4);
            }
                break;
            case PassiveC.TipTheScales: {
                let allyCondFunc = ally => ally.hasStatusEffect(StatusEffectType.RallySpectrum);
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(
                    unit, 5, 1, allyCondFunc
                );
            }
                break;
            case Weapon.DivineDraught:
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(
                    unit, 3, 2, ally => ally.isPartner(unit)
                );
                break;
            case PassiveB.SoaringWings:
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit);
                break;
            case PassiveB.DazzlingShift:
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
                break;
            case Weapon.AstraBlade:
            case Weapon.Death:
                if (unit.isWeaponSpecialRefined) {
                    yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit);
                }
                break;
            case Weapon.SilentPower:
                for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                    if (unit.partnerHeroIndex === ally.heroIndex) {
                        yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2);
                    }
                }
                break;
            case Weapon.MagicRabbits:
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit);
                break;
            case Weapon.TomeOfFavors:
                if (unit.isWeaponSpecialRefined) {
                    for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                        if (isWeaponTypeBeast(ally.weaponType) && ally.heroInfo.canEquipRefreshSkill()) {
                            yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
                        }
                    }
                }
                break;
            case Weapon.FujinYumi:
                if (unit.isWeaponSpecialRefined) {
                    if (unit.hpPercentage >= 50) {
                        yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
                    }
                }
                break;
            case Weapon.NabataKunai:
            case Weapon.LanceOfFrelia:
                yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit);
                break;
            case Weapon.Gurimowaru:
                if (unit.isWeaponRefined) {
                    yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit);
                } else {
                    if (unit.hpPercentage >= 50) {
                        yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
                    }
                }
                break;
            case PassiveB.TeniNoKona: {
                let threshold = 50;
                if (skillId === PassiveB.TeniNoKona) {
                    threshold = 80;
                }
                if (unit.hpPercentage >= threshold) {
                    yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
                }
            }
                break;
            case PassiveB.WingsOfMercy4:
                for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 3)) {
                        if (ally.hpPercentage <= 99) {
                            for (let tile of this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 1)) {
                                yield tile;
                            }
                        }
                    }
                    if (ally.hpPercentage <= 60) {
                        yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, 2);
                    }
                }
                break;
            case PassiveB.Kyuen2:
            case PassiveB.Kyuen3:
            case Weapon.FlowerLance:
            case Weapon.LanceOfHeroics:
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
                        case Weapon.LanceOfHeroics:
                            threshold = 80;
                            break;
                    }
                    if (ally.hpPercentage <= threshold) {
                        yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
                    }
                }
                break;
            case Weapon.Noatun: {
                let threshold = 50;
                if (!unit.isWeaponRefined) {
                    threshold = 40;
                }

                if (unit.hpPercentage <= threshold) {
                    yield* this.__enumerateEscapeRoute(unit);
                }

                if (unit.isWeaponSpecialRefined) {
                    if (unit.hpPercentage >= 50) {
                        yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
                    }
                }
            }
                break;
            case PassiveB.Ridatsu3:
                if (unit.hpPercentage <= 50) {
                    yield* this.__enumerateEscapeRoute(unit);
                }
                break;
            case PassiveB.EscapeRoute4:
                if (unit.hpPercentage <= 60) {
                    yield* this.__enumerateEscapeRoute(unit);
                }
                if (unit.hpPercentage <= 99) {
                    yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 3, 1);
                }
                break;
            case PassiveB.KyokugiHiKo1:
            case PassiveB.KyokugiHiKo2:
            case PassiveB.KyokugiHiKo3:
                if (skillId === PassiveB.KyokugiHiKo3 ||
                    skillId === PassiveB.KyokugiHiKo2 && unit.hpPercentage >= 50 ||
                    skillId === PassiveB.KyokugiHiKo1 && unit.isFullHp) {
                    let allyCondFunc = ally =>
                        [MoveType.Armor, MoveType.Infantry, MoveType.Cavalry].includes(ally.moveType);
                    yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(
                        unit, 2, 1, allyCondFunc
                    );
                }
                break;
            case PassiveB.HentaiHiko1:
            case PassiveB.HentaiHiko2:
            case PassiveB.HentaiHiko3:
                if (skillId === PassiveB.HentaiHiko3 ||
                    skillId === PassiveB.HentaiHiko2 && unit.hpPercentage >= 50 ||
                    skillId === PassiveB.HentaiHiko1 && unit.isFullHp) {
                    yield* this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(
                        unit, 2, 1, ally => ally.moveType === MoveType.Flying
                    );
                }
                break;
        }
    }

    * enumerateNearestTileForEachEnemyWithinSpecificSpaces(unit, spaces, distance = 1) {
        for (let enemyUnit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(unit, spaces)) {
            // 一番近いマスを求める
            let nearestTiles = [];
            let minDistance = Number.MAX_SAFE_INTEGER;
            for (let tile of this.enumerateTilesWithinSpecifiedDistance(enemyUnit.placedTile, distance)) {
                let distance = unit.placedTile.calculateDistance(tile);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestTiles = [tile];
                } else if (distance === minDistance) {
                    nearestTiles.push(tile);
                }
            }
            // そのマスが移動可能ならばワープ先に追加する
            for (let tile of nearestTiles) {
                if (tile.isUnitPlacableForUnit(unit)) {
                    yield tile;
                }
            }
        }
    }

    * __enumerateEscapeRoute(unit) {
        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
            yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
        }
    }

    // 周囲nマス以内の味方の、周囲mマス以内に移動可能
    * __enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(
        unit,
        allyDistance = 2,
        placeableDistance = 2,
        allyCondFunc = _ => true) {
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, allyDistance)) {
            if (allyCondFunc(ally)) {
                yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(ally.placedTile, unit, placeableDistance);
            }
        }
    }

    /**
     * @param  {Tile} fromTile
     * @param  {Unit} unit
     * @param  {Number} distance
     * @returns {Generator<Tile>}
     */
    *__enumeratePlacableTilesWithinSpecifiedSpaces(fromTile, unit, distance) {
        for (let tile of this.enumerateTilesWithinSpecifiedDistance(fromTile, distance)) {
            if (tile.isUnitPlacableForUnit(unit)) {
                yield tile;
            }
        }
    }

    __canWarp(targetTile, warpUnit) {
        if (warpUnit.canActivatePass()) return true;
        if (targetTile.divineVein === DivineVeinType.Green &&
            targetTile.divineVeinGroup !== warpUnit.groupId) {
            return false;
        }
        for (let tile of this.enumerateTiles()) {
            if (tile.existsEnemyUnit(warpUnit)) {
                let enemyUnit = tile.placedUnit;
                for (let skillId of enemyUnit.enumerateSkills()) {
                    let canWarp = getSkillFunc(skillId, canWarpFuncMap)?.call(this, targetTile, warpUnit, enemyUnit) ?? true;
                    if (!canWarp) {
                        return false;
                    }
                }
            }
        }
        for (let tile of this.enumerateTilesWithinSpecifiedDistance(targetTile, 4)) {
            if (tile.existsEnemyUnit(warpUnit)) {
                let enemyUnit = tile.placedUnit;
                if (enemyUnit.passiveB === PassiveB.DetailedReport ||
                    enemyUnit.hasStatusEffect(StatusEffectType.WarpBubble)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @param unit
     * @param moveCount
     * @param ignoresUnits
     * @param ignoresTeleportTile
     * @param unitPlacedTile
     * @returns {Generator<Tile>}
     * @private
     */
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
            let isOnGreenTile =
                startTile.divineVein === DivineVeinType.Green &&
                startTile.divineVeinGroup !== unit.groupId;
            let cannotWarpFromHere = isOnGreenTile && !unit.canActivatePass();
            if (!cannotWarpFromHere) {
                for (let tile of this.__enumerateTeleportTiles(unit)) {
                    if (!this.__canWarp(tile, unit)) {
                        continue;
                    }

                    if (unit.isCantoActivated()) {
                        if (tile.calculateDistanceToUnit(unit) <= unit.moveCountForCanto) {
                            yield tile;
                        }
                    } else {
                        yield tile;
                    }
                }
                // ワープ再移動のタイルを生成
                if (unit.isCantoActivated()) {
                    yield* this.enumerateWarpCantoTiles(unit);
                }
            }
        }
    }

    * enumerateWarpCantoTiles(unit) {
        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.ShadowyQuill:
                    for (let tile of this.enumerateTiles()) {
                        if (tile.posX === unit.fromPosX &&
                            tile.posY === unit.fromPosY) {
                            if (this.__canWarp(tile, unit)) {
                                yield tile;
                            }
                        }
                    }
                    break;
                case Weapon.SoothingScent:
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                            if (this.__canWarp(tile, unit)) {
                                yield tile;
                            }
                        }
                    }
                    break;
                case Weapon.LoftyLeaflet:
                    for (let tile of this.enumerateTiles(tile => tile.isUnitPlacableForUnit(unit))) {
                        // 現在位置のタイルは含まれないのでunit.pos<X, Y>, tile.pos<X, Y>が共に等しい場合の判定は不要
                        if (Math.abs(unit.posX - tile.posX) <= 1 &&
                            Math.abs(unit.posY - tile.posY) <= 1) {
                            if (this.__canWarp(tile, unit)) {
                                yield tile;
                            }
                        }
                    }
                    break;
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
                && tile.placedUnit !== unit
                && !tile.isUnitPlacable(unit)) {
                continue;
            }
            if (tile.hasEnemyBreakableDivineVein(unit.groupId)) {
                continue;
            }
            yield tile;
        }
    }

    applyReservedDivineVein() {
        for (let tile of this.enumerateTiles()) {
            if (tile.reservedDivineVeinSet.size === 1) {
                let [divineVein] = tile.reservedDivineVeinSet;
                tile.divineVein = divineVein;
                tile.divineVeinGroup = tile.reservedDivineVeinGroup;
            }
            // 重複して天脈が付与されると元々の天脈も消滅する
            if (tile.reservedDivineVeinSet.size >= 2) {
                tile.divineVein = DivineVeinType.None;
                tile.divineVeinGroup = null;
            }
            tile.reservedDivineVeinSet.clear();
            tile.reservedDivineVeinGroup = null;
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
                if (targetTile.posX === tile.posX && targetTile.posY === tile.posY) {
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
        unit.teleportOnlyTiles = [];

        let tilesWithoutTeleport = new Set(this.enumerateMovableTiles(unit, false, true, true));
        // ユニットの移動可能範囲、攻撃可能範囲を更新
        for (let tile of this.enumerateMovableTiles(unit, false)) {
            if (unit.movableTiles.includes(tile)) {
                continue;
            }

            unit.movableTiles.push(tile);
            if (!tilesWithoutTeleport.has(tile)) {
                unit.teleportOnlyTiles.push(tile);
            }
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
            if (unit.groupId === UnitGroupType.Enemy) {
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

    /**
     * マップを Table に変換します。
     * @param  {UnitGroupType} currentPhaseType
     */
    toTable(currentPhaseType) {
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
                            || (!(obj instanceof Wall) || this.isBlockImageEnabled);
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

        const shadowCss = this.__getShadowCss();
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                let cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                this.setCellStyle(tile, cell);

                let unit = tile.placedUnit;
                if (unit) {
                    this.__putUnitIconToCell(cell, unit, currentPhaseType);
                    if (unit.groupId === UnitGroupType.Enemy) {
                        // 敵への最短距離を表示
                        if (this.showClosestDistanceToEnemy) {
                            tile.closestDistanceToEnemy = tile.calculateDistanceToClosestEnemyTile(unit);
                        }
                    }
                }

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
                if (tile.divineVein !== DivineVeinType.None) {
                    let divineString = "";
                    divineString = DIVINE_VEIN_STRINGS[tile.divineVein];
                    let divineColor = divineVeinColor(tile.divineVeinGroup);
                    additionalInnerText += `<span style='color:${divineColor};font-size:12px;${shadowCss};'><b>${divineString}</b></span>`;
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

                cell.innerText += "<div style='position:absolute;top:0;left:0;pointer-events: none;'>" + additionalInnerText + "</div>";

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
            // cell.borderColor = "#f0f";
            cell.bgColor = "#eee0ee" + alpha;
        }

        // 天脈
        // 味方の天脈、敵の天脈で処理を分ける
        if (tile.hasDivineVein()) {
            const alpha = "40";
            cell.borderStyle = "solid";
            if (tile.divineVeinGroup !== null && tile.divineVeinGroup === UnitGroupType.Ally) {
                cell.bgColor = "#00bbff" + alpha;
            } else {
                cell.bgColor = "#ff8800" + alpha;
            }

            if (tile.hasBreakableDivineVein() ||
                g_appData.showDivineVeinImageWithoutBreakable === true) {
                let divineVeinTag = getDivineVeinTag(tile.divineVein);
                divineVeinTag.style.position = 'absolute';
                divineVeinTag.style.botttom = '0';
                divineVeinTag.style.left = '0';
                divineVeinTag.style.height = '40px';
                divineVeinTag.style.width = '40px';
                divineVeinTag.style.pointerEvents = 'none';

                cell.innerText += divineVeinTag.outerHTML;
            }
        }
    }

    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit)) {
            let dist = Math.abs(unit.posX - targetUnit.posX) + Math.abs(unit.posY - targetUnit.posY);
            if (dist <= spaces) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        let groupId = targetUnit.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            let dist = Math.abs(unit.posX - targetUnit.posX) + Math.abs(unit.posY - targetUnit.posY);
            if (dist <= spaces) {
                yield unit;
            }
        }
    }

    /**
     * @param {Unit} targetUnit
     * @returns {Generator<Unit>}
     */
    * enumerateUnitsInTheSameGroup(targetUnit) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetUnit.groupId)) {
            if (unit !== targetUnit) {
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
    /**
     * @param  {Cell} cell
     * @param  {Unit} unit
     * @param  {UnitGroupType} currentPhaseType
     */
    __putUnitIconToCell(cell, unit, currentPhaseType) {
        let style = "";
        let hpColor = "#bbeeff";
        {
            // 残りHPで枠線を変える
            if (unit.hpPercentage <= 50) {
                hpColor = "#ff0000";
            } else if (unit.hpPercentage <= 75) {
                hpColor = "#ffbb00";
            }
            if (hpColor !== "") {
                //style = "border: 2px " + color + " solid;border-radius: 50px 50px 50px 50px / 50px 50px 50px 50px;";
            }
        }

        if (unit.isActionDone || currentPhaseType !== unit.groupId) {
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
                cell.innerText += "<span style='position:absolute;bottom:0;right:0;pointer-events: none;'><img src='"
                    + g_imageRootPath + "ExpansionUnit.png" + "' style='width:15px' ></span>";
            }

            let unitColor = unit.groupId === UnitGroupType.Ally ? "#00cccc" : "#ff3333";
            let maxHpWidth = 20;
            let currentHpWidth = Math.round(unit.hpPercentage / 100.0 * maxHpWidth);
            cell.innerText +=
                `<span style='font-size:10px;color:${hpColor};position:absolute;bottom:0;left:0;${shadowCss};pointer-events: none'>${unit.hp}</span>` +
                `<span style='width:${maxHpWidth}px;height:2px;background-color:#000000;border:1px solid #000000;position:absolute;bottom:0;left:12px;pointer-events: none'></span>` +
                `<span style='width:${currentHpWidth}px;height:2px;background-color:${unitColor};border:1px solid #000000;position:absolute;bottom:0;left:12px;pointer-events: none'></span>`;
            if (unit.maxSpecialCount > 0) {
                let specialCount = unit.specialCount;
                if (unit.specialCount === 0) {
                    specialCount = "<img src='" + g_imageRootPath + "Special.png" + "' style='width:12px;height:12px'>";
                }
                cell.innerText += "<span style='font-size:10px;color:#ffbbee;position:absolute;bottom:12px;left:0;" + shadowCss + ";pointer-events: none;'>"
                    + specialCount + "</span>";
            }

            // 隊長マーク
            if (unit.isCaptain) {
                const captainIcon = g_imageRootPath + "CaptainIcon.webp";
                cell.innerText += `<span style='position:absolute;top:0;right:0;${shadowCss};pointer-events: none;'><img src='${captainIcon}' style='height:11px;'></span>`;
            }

            // バフ、デバフ
            if (unit.isBuffed || unit.isDebuffed) {
                cell.innerText += "<span style='position:absolute;bottom:0;right:0;" + shadowCss + ";pointer-events: none;'>"
                if (unit.isBuffed) {
                    cell.innerText += "<img src='" + g_imageRootPath + "BuffIcon.png" + "' style='height:12px'>";
                }
                if (unit.isDebuffed) {
                    cell.innerText += "<img src='" + g_imageRootPath + "DebuffIcon.png" + "' style='height:12px'>";
                }
                cell.innerText += "</span>";
            }

            // 状態異常
            if (unit.hasAnyStatusEffect) {
                cell.innerText += "<span style='position:absolute;top:0;right:0;" + shadowCss + ";pointer-events: none;'>"
                let getStatusImgTag = e => {
                    if (typeof e === "undefined") {
                        return "";
                    }
                    return `<img src='${statusEffectTypeToIconFilePath(e)}' style='height:11px' alt="">`;
                };
                // 付与されているステータスの数が7以上のときは省略表示にする
                if (unit.countStatusEffects() >= 7) {
                    let pes = unit.getPositiveStatusEffects();
                    let nes = unit.getNegativeStatusEffects();
                    let getStatusHtml = (imgTag, es) => {
                        switch (es.length) {
                            case 0: return "";
                            case 1: return imgTag;
                            default:
                                return imgTag + es.length;
                        }
                    };
                    let positiveHtml = getStatusHtml(getStatusImgTag(pes[0]), pes);
                    let negativeHtml = getStatusHtml(getStatusImgTag(nes[0]), nes);
                    let statusCounts = `${positiveHtml}${negativeHtml}`;
                    let statusColor = "#ffffff";
                    cell.innerText += `<span style='font-size:10px;color:${statusColor};bottom:0;left:0;${shadowCss};pointer-events: none'>${statusCounts}</span>`;
                } else {
                    for (let statusEffect of unit.getStatusEffects()) {
                        cell.innerText += getStatusImgTag(statusEffect);
                    }
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
        return `<img style='position:absolute;bottom:0;left:0;${additionalStyle}' class='draggable-elem' id='${id}' src='${imagePath}' width='${this.cellWidth}px' draggable='true' ondragstart='f_dragstart(event)' />`;
    }
}
