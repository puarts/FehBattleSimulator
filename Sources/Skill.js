/// @file
/// @brief スキル情報の定義とそれに関連するクラス、関数等の定義です。

const ColorType = {
    Unknown: -1,
    Red: 0,
    Blue: 1,
    Green: 2,
    Colorless: 3,
};

const SkillType = {
    Weapon: 0,
    Support: 1,
    Special: 2,
    PassiveA: 3,
    PassiveB: 4,
    PassiveC: 5,
    PassiveS: 6,
    Captain: 7,
};

const WeaponType = {
    None: -1,
    Sword: 0,
    Lance: 1,
    Axe: 2,
    RedTome: 3,
    BlueTome: 4,
    GreenTome: 5,
    RedBow: 6,
    BlueBow: 7,
    GreenBow: 8,
    ColorlessBow: 9,
    RedDagger: 10,
    BlueDagger: 11,
    GreenDagger: 12,
    ColorlessDagger: 13,
    Staff: 14,
    RedBreath: 15,
    BlueBreath: 16,
    GreenBreath: 17,
    ColorlessBreath: 18,
    RedBeast: 19,
    BlueBeast: 20,
    GreenBeast: 21,
    ColorlessBeast: 22,
    ColorlessTome: 23,

    // グループ
    Breath: 24,
    Beast: 25,
    Tome: 26,
    Bow: 27,
    Dagger: 28,
    ExceptStaff: 29,
    All: 30,
};

const WeaponTypeAttackRangeDict = {};
WeaponTypeAttackRangeDict[WeaponType.Sword] = 1;
WeaponTypeAttackRangeDict[WeaponType.Lance] = 1;
WeaponTypeAttackRangeDict[WeaponType.Axe] = 1;
WeaponTypeAttackRangeDict[WeaponType.RedBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.BlueBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.GreenBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.ColorlessBreath] = 1;
WeaponTypeAttackRangeDict[WeaponType.RedBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.BlueBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.GreenBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.ColorlessBeast] = 1;
WeaponTypeAttackRangeDict[WeaponType.RedTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.BlueTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.GreenTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.ColorlessTome] = 2;
WeaponTypeAttackRangeDict[WeaponType.RedBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.BlueBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.GreenBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.ColorlessBow] = 2;
WeaponTypeAttackRangeDict[WeaponType.RedDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.BlueDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.GreenDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.ColorlessDagger] = 2;
WeaponTypeAttackRangeDict[WeaponType.Staff] = 2;
WeaponTypeAttackRangeDict[WeaponType.None] = 0;

/// 指定した武器種の射程を取得します。
function getAttackRangeOfWeaponType(weaponType) {
    return WeaponTypeAttackRangeDict[weaponType];
}

function getWeaponTypeOrder(weaponType) {
    let weaponTypes = [
        WeaponType.Sword,
        WeaponType.RedTome,
        WeaponType.RedBreath,
        WeaponType.RedBeast,
        WeaponType.RedBow,
        WeaponType.RedDagger,
        WeaponType.Lance,
        WeaponType.BlueTome,
        WeaponType.BlueBreath,
        WeaponType.BlueBeast,
        WeaponType.BlueBow,
        WeaponType.BlueDagger,
        WeaponType.Axe,
        WeaponType.GreenTome,
        WeaponType.GreenBreath,
        WeaponType.GreenBeast,
        WeaponType.GreenBow,
        WeaponType.GreenDagger,
        WeaponType.Staff,
        WeaponType.ColorlessTome,
        WeaponType.ColorlessBreath,
        WeaponType.ColorlessBeast,
        WeaponType.ColorlessBow,
        WeaponType.ColorlessDagger,
    ];
    let i = 0;
    for (let type of weaponTypes) {
        if (type == weaponType) {
            return i;
        }
        ++i;
    }
    return -1;
}

const WeaponRefinementType =
{
    None: -1,
    Hp5_Atk2: 0,
    Hp5_Spd3: 1,
    Hp5_Def4: 3,
    Hp5_Res4: 4,
    Hp2_Atk1: 5,
    Hp2_Spd2: 6,
    Hp2_Def3: 7,
    Hp2_Res3: 8,
    Special_Hp3: 9,
    Special: 10,
    WrathfulStaff: 11, // 神罰の杖
    DazzlingStaff: 12, // 幻惑の杖
};
function weaponRefinementTypeToString(type) {
    switch (type) {
        case WeaponRefinementType.None: return "-";
        case WeaponRefinementType.Hp5_Atk2: return "HP+5 攻撃+2";
        case WeaponRefinementType.Hp5_Spd3: return "HP+5 速さ+3";
        case WeaponRefinementType.Hp5_Def4: return "HP+5 守備+4";
        case WeaponRefinementType.Hp5_Res4: return "HP+5 魔防+4";
        case WeaponRefinementType.Hp2_Atk1: return "HP+2 攻撃+1";
        case WeaponRefinementType.Hp2_Spd2: return "HP+2 速さ+2";
        case WeaponRefinementType.Hp2_Def3: return "HP+2 守備+3";
        case WeaponRefinementType.Hp2_Res3: return "HP+2 魔防+3";
        case WeaponRefinementType.Special_Hp3: return "HP+3 特殊";
        case WeaponRefinementType.Special: return "特殊";
        case WeaponRefinementType.WrathfulStaff: return "神罰の杖";
        case WeaponRefinementType.DazzlingStaff: return "幻惑の杖";
    }
}

// パフォーマンスに影響しやすくて、辞書にアクセスしたくない時に使う値型
const NoneValue = -1;

const NoneOption = { id: NoneValue, text: "なし" };

const EffectiveType = {
    None: -1,
    Armor: 0,
    Infantry: 1,
    Cavalry: 2,
    Flying: 3,
    Dragon: 4,
    Beast: 5,
    Tome: 6,
    Sword: 7,
    Lance: 8,
    Axe: 9,
    ColorlessBow: 10,
}

const Weapon = {
    None: -1,

    SilverSwordPlus: 4, // 銀の剣+

    MerankoryPlus: 1016, // メランコリー+
    ReginRave: 1027, // レギンレイヴ
    TsubakiNoKinnagitou: 1030, // ツバキの金薙刀
    ByakuyaNoRyuuseki: 1031, // 白夜の竜石
    YumikishiNoMiekyu: 1032, // 弓騎士の名弓
    RyusatsuNoAnkiPlus: 1033, // 竜殺の暗器+
    KishisyogunNoHousou: 1035, // 騎士将軍の宝槍
    KurohyoNoYari: 1047, // 黒豹の槍
    MogyuNoKen: 1048, // 猛牛の剣
    SaizoNoBakuenshin: 1050, // サイゾウの爆炎針
    PieriNoSyousou: 1051, // ピエリの小槍
    DokuNoKen: 1060, // 毒の剣
    KachuNoYari: 1063, // 華冑の槍
    HimekishiNoYari: 1064, // 姫騎士の槍
    Tangurisuni: 1071, // タングリスニ
    AirisuNoSyo: 837, // アイリスの書
    LunaArc: 888, // 月光
    AstraBlade: 1018, // 流星
    DireThunder: 264, // ダイムサンダ
    Meisterschwert: 54, // マスターソード
    GinNoHokyu: 878, // 銀の宝弓
    MasterBow: 1020, // マスターボウ
    YushaNoYumiPlus: 185, // 勇者の弓+
    BraveAxe: 131, // 勇者の斧+
    BraveLance: 80,// 勇者の槍+
    BraveSword: 10,// 勇者の剣+
    Amite: 34, // アミーテ
    BerkutsLance: 94,
    BerkutsLancePlus: 95, // ベルクトの槍+
    FlowerOfJoy: 1058, // 幸福の花(ピアニー)
    Urvan: 145, // ウルヴァン

    SplashyBucketPlus: 818, // 神泉の風呂桶+
    RagnellAlondite: 1042, //ラグネル＆エタルド
    LightningBreath: 394, // 雷のブレス
    LightningBreathPlus: 399, // 雷のブレス+
    LightBreath: 393,
    LightBreathPlus: 398, // 光のブレス+
    Sogun: 214,
    RauaAuru: 236,
    RauaAuruPlus: 237,
    GurunAuru: 313,
    GurunAuruPlus: 314,
    BuraAuru: 268,
    BuraAuruPlus: 269, // ブラーアウル

    YoiyamiNoDanougi: 383,
    YoiyamiNoDanougiPlus: 384, // 宵闇の団扇+
    RyokuunNoMaiougi: 385,
    RyokuunNoMaiougiPlus: 386, // 緑雲の舞扇+
    SeitenNoMaiougi: 387, // 青天の舞扇
    SeitenNoMaiougiPlus: 388, // 青天の舞扇+

    Hlidskjalf: 350, // フリズスキャルヴ
    AversasNight: 254, // インバースの暗闇

    KatarinaNoSyo: 252,// カタリナの書
    Ora: 265, // オーラ
    KyomeiOra: 272, // 共鳴オーラ
    ButosaiNoGakuhu: 275,
    ButosaiNoGakuhuPlus: 276, // 舞踏祭の楽譜
    Seini: 279, // セイニー
    Ivarudhi: 284, // イーヴァルディ
    Naga: 309, // ナーガ
    ButosaiNoWa: 318,
    ButosaiNoWaPlus: 319, // 舞踏祭の輪+
    SeisyoNaga: 320, // 聖書ナーガ
    Blizard: 324, // ブリザード
    MuninNoMaran: 328, // ムニンの魔卵
    RaisenNoSyo: 329, // 雷旋の書
    Forusethi: 332, // フォルセティ
    Absorb: 334,
    AbsorbPlus: 341, // アブソーブ+
    Fear: 339,
    FearPlus: 342, // フィアー+
    Slow: 336,
    SlowPlus: 343, // スロウ+
    Gravity: 335, // グラビティ
    GravityPlus: 344, // グラビティ+
    Sekku: 353, // セック
    ButosaiNoSensu: 367,
    ButosaiNoSensuPlus: 368, // 舞踏祭の扇子
    Kagamimochi: 371, // 鏡餅
    KagamimochiPlus: 372, // 鏡餅+

    Death: 899,  // デス
    Pain: 338,
    PainPlus: 345, // ペイン+
    SeireiNoHogu: 788, // 清冷の法具
    WindsBrand: 327, // 深き印の風
    TemariPlus: 1084, // 手毬+

    GrimasTruth: 247, // 魔書ギムレー+

    FuginNoMaran: 289, // フギンの魔卵
    GunshinNoSyo: 290, // 軍神の書
    OrdinNoKokusyo: 296, //オーディンの黒書
    Arrow: 298, // アロー
    DawnSuzu: 253, // 暁天の神楽鈴
    Excalibur: 308, // エクスカリバー
    DarkExcalibur: 315, // 共鳴エクスカリバー
    Forblaze: 248, // フォルブレイズ
    FlameSiegmund: 109, // 炎槍ジークムント
    ChaosManifest: 866, // 負の力
    Missiletainn: 297,//魔書ミストルティン

    HanasKatana: 1049, // カザハナの麗刀
    Sinmara: 765, // シンモラ

    TenteiNoHado: 955,
    DivineMist: 409, // 神霧のブレス
    SnowsGrace: 1067, // 神祖の恵み
    RazingBreath: 897, // 断絶のブレス
    DivineBreath: 913, // 神竜王のブレス

    ShirasagiNoTsubasa: 806, // 白鷺の翼
    EtherealBreath: 996, // 異空のブレス
    Gjallarbru: 910, // ギャッラルブルー
    NewFoxkitFang: 1087, // 新年の妖狐娘の爪牙
    NewBrazenCatFang: 1089, // 新年の戦猫の爪牙
    AkaiAhiruPlus: 816,//赤いアヒル
    KenhimeNoKatana: 58,//剣姫の刀
    GigaExcalibur: 331, //ギガスカリバー

    GunshiNoFusho: 782, // 軍師の風書
    GunshiNoRaisyo: 781, // 軍師の雷書
    TharjasHex: 834, // サーリャの禁呪
    Blarblade: 260, // ブラーブレード
    BlarbladePlus: 261, // ブラーブレード+
    Gronnblade: 303, // グルンブレード
    GronnbladePlus: 304, // グルンブレード+ 
    Rauarblade: 229, // ラウアブレード
    RauarbladePlus: 230, // ラウアブレード+
    KeenGronnwolfPlus: 323, // グルンウルフ鍛+
    ArmorsmasherPlus: 40, // アーマーキラー鍛+

    Blarraven: 262,
    BlarravenPlus: 263, // ブラーレイヴン+
    Gronnraven: 305,
    GronnravenPlus: 306,
    Rauarraven: 231,
    RauarravenPlus: 232,

    Blarserpent: 287,
    BlarserpentPlus: 288, // ブラーサーペント+
    GronnserpentPlus: 851,
    RauarserpentPlus: 1025,

    AsahiNoKen: 7,
    AsahiNoKenPlus: 8, // 旭日の剣+
    SoukaiNoYari: 77,
    SoukaiNoYariPlus: 78, // 蒼海の槍+
    ShinryokuNoOno: 128,
    ShinryokuNoOnoPlus: 129, // 深緑の斧+

    Watou: 11,
    WatouPlus: 12, // 倭刀+
    Wabo: 110,
    WaboPlus: 111, // 倭鉾+
    BigSpoon: 159,
    BigSpoonPlus: 160,
    Wakon: 168,
    WakonPlus: 169, // 倭棍+
    TankyuPlus: 852, // 短弓+
    BabyCarrot: 375,
    BabyCarrotPlus: 376, // ベビーキャロット+

    MitteiNoAnki: 944, // 密偵の暗器
    YouheidanNoNakayari: 946, // 傭兵団の長槍
    KouketsuNoSensou: 949, // 高潔の戦槍
    BouryakuNoSenkyu: 951, // 謀略の戦弓
    Flykoogeru: 959, // フライクーゲル
    SyuryouNoEijin: 963, // 狩猟の鋭刃
    BerukaNoSatsufu: 966, // ベルカの殺斧
    KinsekiNoSyo: 968, // 金石の書
    SarieruNoOkama: 969, // サリエルの大鎌
    Veruzandhi: 984, // ヴェルザンディ
    GengakkiNoYumiPlus: 986, // 弦楽器の弓+
    KokkiNoKosou: 993, // 黒騎の孤槍
    Merikuru: 997, // メリクル
    MagetsuNoSaiki: 1002, // 魔月の祭器
    SyugosyaNoKyofu: 1011, // 守護者の巨斧
    Taiyo: 1014, // 太陽

    VezuruNoYoran: 1168, // ヴェズルの妖卵

    Sukurudo: 59, // スクルド
    CandyStaff: 351, // キャンディの杖
    CandyStaffPlus: 352, // キャンディの杖+
    Sekuvaveku: 1113, // セクヴァヴェク
    SyungeiNoKenPlus: 794, // 迎春の剣+
    RunaNoEiken: 965, // ルーナの鋭剣
    MaryuNoBreath: 856, // 魔竜のブレス
    GhostNoMadosyo: 321, // ゴーストの魔導書
    GhostNoMadosyoPlus: 322, // ゴーストの魔導書+
    MonstrousBow: 200, // 怪物の弓
    MonstrousBowPlus: 201, // 怪物の弓
    EnkyoriBougyoNoYumiPlus: 202, // 遠距離防御の弓+

    WingSword: 46, // ウイングソード
    Romfire: 112, // ロムファイア
    SyunsenAiraNoKen: 37, // 瞬閃アイラの剣

    KabochaNoOno: 174, // カボチャの斧
    KabochaNoOnoPlus: 175, // カボチャの斧+
    KoumoriNoYumi: 217,
    KoumoriNoYumiPlus: 218,
    KajuNoBottle: 390,
    KajuNoBottlePlus: 391,
    CancelNoKenPlus: 1054, // キャンセルの剣+
    CancelNoYariPlus: 1138, // キャンセルの槍+
    CancelNoOno: 1165,
    CancelNoOnoPlus: 1164, // キャンセルの斧+

    MaritaNoKen: 1052, // マリータの剣
    KyoufuArmars: 156, // 狂斧アルマーズ

    Urur: 146, // ウルズ
    WeirdingTome: 277, // 奇異ルーテの書
    TaguelFang: 847, // タグエルの爪牙
    FellBreath: 821, // 邪神のブレス
    BookOfShadows: 761, // 泡影の書
    NinissIceLance: 972, // 氷精ニニスの槍
    Ifingr: 998, // イーヴィングル
    Fimbulvetr: 1041, // フィンブル
    Mulagir: 199, // ミュルグレ

    Randgrior: 1151, // ランドグリーズ
    HadesuOmega: 1155, // ハデスΩ

    Mogprasir: 983, // メグスラシル
    LegionsAxe: 137, // ローローの斧
    LegionsAxePlus: 138,
    Panic: 337,
    PanicPlus: 346, // パニック+
    Scadi: 207, // スカディ
    FoxkitFang: 845, // 妖狐娘の爪牙
    BrazenCatFang: 870, // 剛なる戦猫の爪牙

    FiresweepSword: 42,
    FiresweepSwordPlus: 43,
    FiresweepLance: 88,
    FiresweepLancePlus: 89,
    FiresweepBow: 188,
    FiresweepBowPlus: 189, // 火薙ぎの弓+
    FiresweepAxePlus: 1024,

    Kadomatsu: 44,
    KadomatsuPlus: 45, // 門松
    Hamaya: 203,
    HamayaPlus: 204,
    Hagoita: 153,
    HagoitaPlus: 154,

    AkatsukiNoHikari: 974, // 暁の光
    KurokiChiNoTaiken: 41, // 黒き血の大剣

    MamoriNoKen: 55,
    MamoriNoKenPlus: 56,
    MamoriNoYariPlus: 854,
    MamoriNoOnoPlus: 1037, // 守りの斧+

    BariaNoKen: 62, // バリアの剣
    BariaNoKenPlus: 63,
    BariaNoYariPlus: 917,

    LarceisEdge: 1099, // ラクチェの流剣
    GeneiLod: 1108, // 幻影ロッド

    Durandal: 24, // デュランダル
    ArdentDurandal: 931, // 緋剣デュランダル
    FalchionAwakening: 48, // ファルシオン(覚醒)
    FalchionRefined: 47, // ファルシオン(紋章)
    FalcionEchoes: 49, // ファルシオン(Echoes)
    Balmung: 1093, // バルムンク
    ImbuedKoma: 1090, // 神宿りの独楽
    Ragnarok: 235, // ライナロック
    HokenSophia: 50,// 宝剣ソフィア
    Bashirikosu: 155, // バシリコス
    KageroNoGenwakushin: 1046, // カゲロウの眩惑針

    GaeBolg: 119, //ゲイボルグ
    BlazingDurandal: 33, // 烈剣デュランダル
    SyugosyaNoRekkyu: 1039, // 守護者の烈弓
    WagasaPlus: 798, // 和傘+
    KumadePlus: 796, // 熊手+
    KarasuOuNoHashizume: 812, // 鴉王の嘴爪
    ShinenNoBreath: 402, // 神炎のブレス
    TakaouNoHashizume: 804, // 鷹王の嘴爪

    MiraiNoSeikishiNoYari: 942, // 未来の聖騎士の槍
    ShiseiNaga: 980, // 至聖ナーガ
    Thirufingu: 23, // ティルフィング
    Sangurizuru: 970, // サングリズル

    Pesyukado: 373, // ペシュカド
    FerisiaNoKorizara: 374, // フェリシアの氷皿
    AnsatsuSyuriken: 377,
    AnsatsuSyurikenPlus: 378,//暗殺手裏剣+
    SyukuseiNoAnki: 379,
    SyukuseiNoAnkiPlus: 380, // 粛清の暗器+
    FurasukoPlus: 1003, // フラスコ+
    KabochaNoGyotoPlus: 1005, // カボチャの行灯+
    BikkuriBakoPlus: 1007, // びっくり箱+
    RosokuNoYumiPlus: 1010, // ロウソクの弓+
    HankoNoYari: 116, // 反攻の槍
    HankoNoYariPlus: 117, // 反攻の槍+
    HadoNoSenfu: 947, // 覇道の戦斧
    MagoNoTePlus: 814, // 孫の手+
    KizokutekinaYumi: 1013, // 貴族的な弓

    Seiju: 104,
    SeijuPlus: 105, // 聖樹+
    HandBell: 149,
    HandBellPlus: 150, // ハンドベル+
    PresentBukuro: 151,
    PresentBukuroPlus: 152, // プレゼント袋+
    Syokudai: 243,
    SyokudaiPlus: 244, // 燭台+

    ShirokiChiNoNaginata: 103, // 白き血の薙刀

    Arumazu: 134, // アルマーズ
    Marute: 118, // マルテ
    HuinNoKen: 18, // 封印の剣
    MoumokuNoYumi: 903, // 盲目の弓
    Puji: 1056, // プージ
    Forukuvangu: 15, // フォルクバング

    NinjinNoYari: 83, // ニンジンの槍
    NinjinNoYariPlus: 84,
    NinjinNoOno: 135,
    NinjinNoOnoPlus: 136, // ニンジンの斧
    AoNoTamago: 266,
    AoNoTamagoPlus: 267,// 青の卵
    MidoriNoTamago: 310,
    MidoriNoTamagoPlus: 311,// 緑の卵

    HigasaPlus: 945, // 日傘+
    TairyoNoYuPlus: 938, // 大漁の弓+
    KaigaraNoNaifuPlus: 934, // 貝殻のナイフ+

    Kasaburanka: 107,
    KasaburankaPlus: 108, // カサブランカ+
    Grathia: 205,
    GrathiaPlus: 206,
    AoNoPresentBukuro: 285,
    AoNoPresentBukuroPlus: 286,
    MidoriNoPresentBukuro: 325,
    MidoriNoPresentBukuroPlus: 326,
    YamaNoInjaNoSyo: 943, // 山の隠者の書

    FirstBite: 85,
    FirstBitePlus: 86, // ファーストバイト
    KyupittoNoYa: 190,
    KyupittoNoYaPlus: 191, // キューピットの矢
    SeinaruBuke: 270,
    SeinaruBukePlus: 271, // 聖なるブーケ

    SakanaWoTsuitaMori: 90, // 魚を突いた銛
    SakanaWoTsuitaMoriPlus: 91,
    SuikaWariNoKonbo: 139,
    SuikaWariNoKonboPlus: 140, // スイカ割りの棍棒
    KorigashiNoYumi: 194,
    KorigashiNoYumiPlus: 195, // 氷菓子の弓
    Kaigara: 365,
    KaigaraPlus: 366, // 貝殻

    KaigaraNoYari: 113,
    KiagaraNoYariPlus: 114,
    BeachFlag: 164,
    BeachFlagPlus: 165,
    YashiNoMiNoYumi: 210,
    YashiNoMiNoYumiPlus: 211,

    HuyumatsuriNoBootsPlus: 780, // 冬祭のブーツ+
    KiraboshiNoBreathPlus: 774, // 綺羅星のブレス+
    GinNoGobulettoPlus: 990, // 銀のゴブレット+

    NifuruNoHyoka: 330, // ニフルの氷花
    MusuperuNoEnka: 250, // ムスペルの炎花

    RirisuNoUkiwa: 141,
    RirisuNoUkiwaPlus: 142,
    TomatoNoHon: 238,
    TomatoNoHonPlus: 239,
    NettaigyoNoHon: 273,
    NettaigyoNoHonPlus: 274,
    HaibisukasuNoHon: 316,
    HaibisukasuNoHonPlus: 317,

    SakanaNoYumi: 212,
    SakanaNoYumiPlus: 213,
    NangokuJuice: 294,
    NangokuJuicePlus: 295,
    Hitode: 381,
    HitodePlus: 382,
    SoulCaty: 22,

    FuyumatsuriNoStickPlus: 1073, // 冬祭のステッキ+
    ChisanaSeijuPlus: 1065,
    SeirinNoKenPlus: 1069,

    SyukusaiNoOnoPlus: 824,
    AoNoHanakagoPlus: 826,
    MidoriNoHanakagoPlus: 828,
    SyukusaiNoKenPlus: 830,
    HanawaPlus: 831,

    UminiUkabuItaPlus: 922,
    NangokuNoKajitsuPlus: 924,
    SunahamaNoScopPlus: 928,
    SunahamaNoKuwaPlus: 930,

    HarorudoNoYufu: 1062,
    RebbekkaNoRyoukyu: 1103,

    SaladaSandPlus: 887,
    KorakuNoKazariYariPlus: 882,

    FlowerStandPlus: 904,
    CakeKnifePlus: 906,
    SyukuhaiNoBottlePlus: 908,
    SyukuhukuNoHanaNoYumiPlus: 912,
    KazahanaNoReitou: 1049, // カザハナの麗刀

    TetsuNoAnki: 354,
    DouNoAnki: 355,
    GinNoAnki: 356,
    GinNoAnkiPlus: 357,
    ShienNoAnki: 358,
    ShienNoAnkiPlus: 359,
    RogueDagger: 360, // 盗賊の暗器
    RogueDaggerPlus: 361,
    PoisonDagger: 362, // 秘毒の暗器
    PoisonDaggerPlus: 363,
    KittyPaddle: 369, // 猫の暗器
    KittyPaddlePlus: 370,
    DeathlyDagger: 364, // 死神の暗器

    MakenMistoruthin: 57,
    Mistoruthin: 17, // ミストルティン
    Misteruthin: 67, // ミステルトィン

    Candlelight: 340, // キャンドルサービス
    CandlelightPlus: 347, // キャンドル+
    FlashPlus: 758, // フラッシュ+
    Trilemma: 348,
    TrilemmaPlus: 349, // トリレンマ+

    AiNoCakeServa: 162, // 愛のケーキサーバ
    AiNoCakeServaPlus: 163,
    KiyorakanaBuke: 292,// 清らかなブーケ
    KiyorakanaBukePlus: 293,
    Byureisuto: 173, //ビューレイスト

    Otokureru: 133, // オートクレール
    MumeiNoIchimonNoKen: 52, // 無銘の一門の剣
    KieiWayuNoKen: 38, // 気鋭ワユの剣
    SyaniNoSeisou: 801, // シャニーの誓槍
    Toron: 877, // トローン
    IhoNoHIken: 1029, // 異邦の秘剣

    DevilAxe: 1132, // デビルアクス
    TenmaNoNinjinPlus: 857, // 天馬のニンジン
    TenteiNoKen: 953, //天帝の剣
    AnkokuNoKen: 891, // 暗黒の剣
    Vorufuberugu: 170, // ヴォルフベルグ
    Yatonokami: 19, // 夜刀神
    RyukenFalcion: 977, // 竜剣ファルシオン
    RaikenJikurinde: 68, // 雷剣ジークリンデ
    Jikurinde: 21, // ジークリンデ
    Reipia: 991, // レイピア
    AsameiNoTanken: 958, // アサメイの短剣
    FurederikuNoKenfu: 1012, // フレデリクの堅斧
    JokerNoSyokki: 1129, // ジョーカーの食器
    BukeNoSteckPlus: 1125, // ブーケのステッキ+
    AijouNoHanaNoYumiPlus: 1122, // 愛情の花の弓+
    Paruthia: 187, // パルティア
    TallHammer: 291, // トールハンマー
    RohyouNoKnife: 389, // 露氷のナイフ
    YoukoohNoTsumekiba: 843, // 妖狐王の爪牙
    JunaruSenekoNoTsumekiba: 869, // 柔なる戦猫の爪牙
    RauaFoxPlus: 960, // ラウアフォックス+
    KinranNoSyo: 967, // 金蘭の書
    GeneiFalcion: 1112, // 幻影ファルシオン
    HyosyoNoBreath: 1134, // 氷晶のブレス
    EishinNoAnki: 1140, // 影身の暗器
    ChichiNoSenjutsusyo: 1131, // 父の戦術書
    RazuwarudoNoMaiken: 1130, // ラズワルドの舞剣
    YujoNoHanaNoTsuePlus: 1128,// 友情の花の杖 
    AiNoSaiki: 1126, // 愛の祭器
    BaraNoYari: 1123, // 薔薇の槍
    GeneiFeather: 1110, // 幻影フェザー
    GeneiBattleAxe: 1106, // 幻影バトルアクス
    GeneiLongBow: 1104, // 幻影ロングボウ
    ThiamoNoAisou: 1102, // ティアモの愛槍
    KokukarasuNoSyo: 1101, // 黒鴉の書
    ShirejiaNoKaze: 1097, // シレジアの風
    ChisouGeiborugu: 1096, // 地槍ゲイボルグ
    KinunNoYumiPlus: 1085, // 金運の弓+
    TenseiAngel: 1075, // 天聖エンジェル
    AsuNoSEikishiNoKen: 941, // 明日の聖騎士の剣
    ZekkaiNoSoukyu: 940, // 絶海の蒼弓
    HaNoOugiPlus: 936, // 葉の扇+
    YonkaiNoSaiki: 926, // 四海の祭器
    ShintakuNoBreath: 920, // 神託のブレス
    TaguelChildFang: 916, // タグエルの子の爪牙
    FutsugyouNoYari: 902, // 払暁の槍
    WakakiMogyuNoYari: 901, // 若き猛牛の槍
    WakakiKurohyoNoKen: 900, // 若き黒豹の剣
    BoranNoBreath: 895, // 暴乱のブレス
    Kurimuhirudo: 893, // クリムヒルド
    Erudofurimuniru: 886, // エルドフリムニル
    MasyumaroNoTsuePlus: 884, // マシュマロの杖+
    Saferimuniru: 880, // セーフリムニル
    YukyuNoSyo: 879, // 悠久の書
    ShishiouNoTsumekiba: 874, // 獅子王の爪牙
    TrasenshiNoTsumekiba: 872, // 虎戦士の爪牙
    HaruNoYoukyuPlus: 865, // 春の妖弓
    FeruniruNoYouran: 863, // フェルニルの妖卵
    TamagoNoTsuePlus: 861, // 卵の杖+
    HisenNoNinjinYariPlus: 859, // 緋閃のニンジン槍+
    MaryuHuinNoKen: 848, // 魔竜封印の剣
    JinroMusumeNoTsumekiba: 841, // 人狼娘の爪牙
    JinroOuNoTsumekiba: 839, // 人狼王の爪牙
    ZeroNoGyakukyu: 838, // ゼロの虐弓
    GuradoNoSenfu: 836, // グラドの戦斧
    OboroNoShitsunagitou: 835, // オボロの漆薙刀
    ShinginNoSeiken: 833, // 真銀の聖剣
    HinataNoMoutou: 832, // ヒナタの猛刀
    KinchakubukuroPlus: 820, // 巾着袋+
    NorenPlus: 813, // のれん+
    OkamijoouNoKiba: 809, // 狼女王の牙
    BatoruNoGofu: 802, // バアトルの豪斧
    FurorinaNoSeisou: 800, // フロリーナの誓槍
    OgonNoTanken: 799, // 黄金の短剣
    Hyoushintou: 792, // 氷神刀
    TekiyaPlus: 791, // 鏑矢+
    ShirokiNoTansou: 787, // 白騎の短槍
    ShirokiNoTyokusou: 786, // 白騎の直槍
    ShirokiNoTyouken: 785, // 白騎の長剣
    AkaNoKen: 784, // 紅の剣
    KentoushiNoGoken: 783, // 剣闘士の剛剣
    RantanNoTsuePlus: 778, // ランタンの杖+
    GousouJikumunto: 776, // 業槍ジークムント
    Rifia: 771, // リフィア
    Gyorru: 769, // ギョッル
    Mafu: 768, // マフー
    Syurugu: 763, // シュルグ
    MugenNoSyo: 759, // 夢幻の書
    MizuNoHimatsu: 755, // 水の飛沫
    SeireiNoBreath: 410, // 精霊のブレス
    AnyaryuNoBreath: 408, // 暗夜竜のブレス
    ManatsuNoBreath: 407, // 真夏のブレス
    KiriNoBreath: 406, // 霧のブレス
    MizuNoBreathPlus: 405, // 水のブレス+
    MizuNoBreath: 404, // 水のブレス
    JaryuNoBreath: 403, // 邪竜のブレス
    YamiNoBreathPlus: 400, // 闇のブレス+
    YamiNoBreath: 395, // 闇のブレス
    IzunNoKajitsu: 251, // イズンの果実
    Roputous: 249, // ロプトウス
    Nagurufaru: 246, // ナグルファル
    Gureipuniru: 245, // グレイプニル
    Gurimowaru: 241, // グリモワール
    Faraflame: 240, // ファラフレイム
    Simuberin: 234, // シムベリン
    Buryunhirude: 233, // ブリュンヒルデ
    ShiningBowPlus: 216, // シャイニングボウ+
    ShiningBow: 215,
    ShikkyuMyurugure: 209, // 疾弓ミュルグレ
    SenhimeNoWakyu: 208, // 戦姫の和弓
    Nizuheggu: 198, // ニーズヘッグ
    KuraineNoYumiPlus: 193, // クライネの弓
    KuraineNoYumi: 192,
    FujinYumi: 186, // 風神弓
    AnkigoroshiNoYumiPlus: 183, // 暗器殺しの弓
    AnkigoroshiNoYumi: 182,
    SerujuNoKyoufu: 172, // セルジュの恐斧
    Garumu: 171, // ガルム
    YoheidanNoSenfu: 167, // 傭兵団の戦斧
    TenraiArumazu: 166, // 天雷アルマーズ
    KamiraNoEnfu: 161, // カミラの艶斧
    Noatun: 132, // ノーアトゥーン
    GiyuNoYari: 115, // 義勇の槍
    HinokaNoKounagitou: 106, // ヒノカの紅薙刀
    Geirusukeguru: 98, // ゲイルスケグル
    Vidofuniru: 97, // ヴィドフニル
    MasyouNoYari: 96, // 魔性の槍
    Jikumunt: 82, // ジークムント
    Fensariru: 81, // フェンサリル
    KokouNoKen: 66, // 孤高の剣
    Niu: 65, // ニーウ
    Revatein: 64, // レーヴァテイン
    ShinkenFalcion: 61, // 神剣ファルシオン
    OukeNoKen: 60, // 王家の剣
    HikariNoKen: 53, // 光の剣
    FukenFalcion: 51, // 封剣ファルシオン
    SeikenThirufingu: 36, // 聖剣ティルフィング
    Rigarublade: 28, // リガルブレイド
    Ekkezakkusu: 26, // エッケザックス

    Uchikudakumono: 1158, // 打ち砕くもの
    HigaimosoNoYumi: 1160, // 被害妄想の弓
    GrayNoHyouken: 1161, // グレイの飄剣
    SuyakuNoKen: 1162, // 雀躍の剣
    KokyousyaNoYari: 1163, // 古強者の槍

    HakutoshinNoNinjin: 1170, // 白兎神の人参
    OgonNoFolkPlus: 1171, // 黄金のフォーク+
    HarukazeNoBreath: 1173, // 春風のブレス
    NinjinhuNoSosyokuPlus: 1175, // 人参風の装飾+

    VoidTome: 1176, // 絶無の書
    SpendthriftBowPlus: 1179, // お大尽の弓+
    RinkahNoOnikanabo: 1180, // リンカの鬼金棒
    AstralBreath: 1183, // 星竜のブレス

    SatougashiNoAnki: 1187, // 砂糖菓子の暗器
    AokarasuNoSyo: 1185, // 蒼鴉の書
    RosenshiNoKofu: 1186, // 老戦士の古斧
    IagosTome: 1188, // マクベスの惑書

    FeatherSword: 1234, // フェザーソード
    WindsOfChange: 1236, // 予兆の風
    WhitedownSpear: 1238, // 白き飛翔の槍

    AkaiRyukishiNoOno: 1288, // 赤い竜騎士の斧

    SeijuNoKeshinHiko: 1299, // 成獣の化身・飛行

    Aymr: 1302, // アイムール
    ChaosRagnell: 1308, // 混沌ラグネル
    DarkScripture: 1311, // 暗黒の聖書
    BloodTome: 1313, // 魔王の血書
    BrutalBreath: 1315, // 獣乱のブレス
    KarenNoYumi: 1305, // 佳麗の弓
    RuneAxe: 1306, // ルーンアクス
    JukishiNoJuso: 1307, // 重騎士の重槍

    Gurgurant: 1317, // グルグラント
    BridesFang: 1318, // 狼花嫁の牙
    PledgedBladePlus: 1320, // 花嫁の護刀+
    GroomsWings: 1322, // 白鷺花婿の翼
    JoyfulVows: 1323, // 幸せの誓約
    HugeFanPlus: 1324, // 大きな扇子+
    DaichiBoshiNoBreath: 1350, // 大地母神のブレス
    ApotheosisSpear: 1356, // 裏の五連闘の宝槍
    Amatsu: 1358, // アマツ
    BarrierAxePlus: 1360, // バリアの斧+
    FlowerOfEase: 1361, // 微睡の花の剣
    LevinDagger: 1363, // サンダーダガー
    HewnLance: 1348, // ドニの朴槍
    SnipersBow: 1349, // 狙撃手の弓
    StalwartSword: 1347, // 忠臣の剣
    ExoticFruitJuice: 1366, // 楽園の果汁
    CoralBowPlus: 1368, // サンゴの弓+
    FloraGuidPlus: 1370, // 植物図鑑+
    SummerStrikers: 1372, // 一夏の神宝
    YashiNoKiNoTsuePlus: 1374, // ヤシの木の杖+
    VirtuousTyrfing: 1375, // 至聖ティルフィング
    StarpointLance: 1377, // 海角の星槍
    HiddenThornsPlus: 1379, // 花の髪飾り+
    MelonFloatPlus: 1381, // メロンフロート+
    ConchBouquetPlus: 1386, // ほら貝のブーケ+
    SunsPercussors: 1382, // 盛夏の神宝
    MeikiNoBreath: 1383, // 冥輝のブレス
    KurooujiNoYari: 1384, // 黒皇子の槍
    BenihimeNoOno: 1385, // 紅姫の斧
    KyupidNoYaPlus: 1388, // キューピットの矢+
    BladeOfShadow: 1390, // 影の英雄の剣
    SpearOfShadow: 1393, // 影の英雄の槍
    CaltropDaggerPlus: 1392, // 騎殺の暗器+
    HelsReaper: 1419, // 死鎌ヘル
    TomeOfOrder: 1436, // 魔道軍将の書
    SneeringAxe: 1437, // 笑面の斧
    SetsunasYumi: 1438, // セツナの緩弓
    SkyPirateClaw: 1423, // 天空の海賊の嘴爪
    HelmBowPlus: 1425, // 舵の弓+
    FlowingLancePlus: 1426, // 風見鶏の槍+
    GateAnchorAxe: 1427, // 波閉ざす錨の斧
    DeckSwabberPlus: 1429, // デッキブラシ+
    DarkSpikesT: 1445, // ダークスパイクT
    WindParthia: 1446, // 翠風パルティア
    MoonGradivus: 1449, // 蒼月グラディウス
    FlowerHauteclere: 1452, // 紅花オートクレール
    DanielMadeBow: 1447, // ダニエルの錬弓

    PrimordialBreath: 1468, // 神祖竜のブレス

    CourtlyMaskPlus: 1470, // 高貴な仮面+
    CourtlyFanPlus: 1472, // 高貴な扇+
    CourtlyBowPlus: 1474, // 高貴な弓+
    CourtlyCandlePlus: 1478, // 高貴な燭台+
    GiltGoblet: 1476, // 黄金のゴブレット

    // 絶望そして希望
    TalreganAxe: 1484, // ダルレカの激斧
    DoubleBow: 1480, // バルフレチェ
    SpiritedSpearPlus: 1482, // 士気旺盛の槍+
    BlarfoxPlus: 1479, // ブラーフォックス+
    FlameLance: 1486, // フレイムランス

    // プルメリア
    FlowerOfPlenty: 1488, // 豊潤の花

    // 竜たちの収穫祭
    MoonlessBreath: 1491, // 暁闇のブレス
    JokersWild: 1494, // 変身のカード
    BlackfireBreathPlus: 1496, // 黒夜のブレス+
    FrostfireBreath: 1498, // 蒼紅のブレス
    PaleBreathPlus: 1500, // 灰明のブレス+

    // 2020年10月錬成
    ObsessiveCurse: 1502, // 執念の呪
    EffiesLance: 1503, // エルフィの大槍

    // 2020年11月錬成
    EternalBreath: 1516, // 悠久のブレス
    ElisesStaff: 1517, // エリーゼの幼杖

    // 女神の僕たる者たち
    Thunderbrand: 1504, // 雷霆
    CaduceusStaff: 1505, // カドゥケウスの杖
    SpearOfAssal: 1508, // アッサルの槍
    SurvivalistBow: 1509, // 生存本能の弓

    DarkCreatorS: 1511, // 天帝の闇剣

    // 2020年10月末伝承ディミトリ
    Areadbhar: 1513, // アラドヴァル

    // 平常心の極意
    TwinStarAxe: 1518, // 業火の双斧

    // ベルンの王女
    InstantLancePlus: 1528, // 瞬撃の槍+
    TigerRoarAxe: 1526, // 虎の剛斧
    Aureola: 1530, // アーリアル

    // 2020年11月末 フレイヤ・スカビオサ
    NightmareHorn: 1539, // 悪夢の女王の角
    FlowerOfSorrow: 1536, // 不幸の花

    // 2020年12月第5部開幕記念
    TomeOfStorms: 1545, // 万雷の書
    ObsidianLance: 1543, // 黒曜の槍
    Lyngheior: 1541, // リュングヘイズ
    ReprisalAxePlus: 1547, // 反攻の斧+

    // 2020年12月武器錬成
    PurifyingBreath: 1567, // 天真のブレス
    ElenasStaff: 1566, // エルナの杖
    TomeOfFavors: 1565, // 寵愛の書

    // 聖なる夜の奇跡
    TannenbatonPlus: 1568, // 聖樹の杖+
    Hrist: 1571, // フリスト
    CandyCanePlus: 1572, // キャンディケイン+
    ReindeerBowPlus: 1576, // トナカイの弓+

    // 2020年12月末 伝承リリーナ
    StudiedForblaze: 1581, // 業炎フォルブレイズ

    // 2021年正月超英雄
    FirstDreamBow: 1583, // 甘い初夢の弓
    RenewedFang: 1585, // 賀正の人狼娘の爪牙
    RefreshedFang: 1586, // 賀正の妖狐王の爪牙
    BondOfTheAlfar: 1588, // 妖精姉妹の絆
    ResolvedFang: 1590, // 賀正の人狼王の爪牙

    // 2021年1月武器錬成
    ArdensBlade: 1591, // アーダンの固剣
    SpringtimeStaff: 1592, // 春陽の杖

    // 志を重ねて
    Grafcalibur: 1601, // グラフカリバー
    IndignantBow: 1603, // 義憤の強弓
    KiaStaff: 1605, // キアの杖
    Petrify: 1609, // ストーン

    // 熱砂の国の秘祭
    PlegianTorchPlus: 1610, // ペレジアの燭台+
    FellFlambeau: 1612, // 仄暗き邪竜の松明
    PlegianBowPlus: 1614, // ペレジアの弓+
    FellCandelabra: 1615, // 仄暗き邪痕の燭台
    PlegianAxePlus: 1618, // ペレジアの斧+

    // 2021年1月 神階セイロス
    AuroraBreath: 1620, // 極光のブレス

    // 王の愛は永遠に
    LoyalistAxe: 1635, // 護国の堅斧
    UnityBloomsPlus: 1633, // 平和の花+
    AmityBloomsPlus: 1624, // 共感の花+
    Thjalfi: 1627, // シャールヴィ
    PactBloomsPlus: 1626, // 約束の花+

    // 2021年2月 武器錬成
    SpySongBow: 1637, // 邪な曲弓
    Audhulma: 39, // アウドムラ

    // 命が刻むもの
    SilesseFrost: 1644, // シレジアの水晶
    SparkingTome: 1641, // 慕炎の書
    UnboundBlade: 1640, // 孤絶の剣
    UnboundBladePlus: 1639, // 孤絶の剣+

    // 2021年2月 伝承クロード
    Failnaught: 1646, // フェイルノート

    // フォドラの花種
    Luin: 1664, // ルーン
    SteadfastAxePlus: 1665, // 護衛の斧+
    SteadfastAxe: 1666, // 護衛の斧
    IcyFimbulvetr: 1668, // 氷槍フィンブル
    BansheeTheta: 1670, // バンシーθ

    // わがままな子兎
    LilacJadeBreath: 1676, // 紫翠のブレス
    SpringyBowPlus: 1673, // 春兎の弓+
    SpringyAxePlus: 1677, // 春兎の斧+
    SpringyLancePlus: 1674, // 春兎の槍+
    GullinkambiEgg: 1671, // グリンカムビの聖卵

    // 信頼という名の絆
    TomeOfReglay: 1689, // 銀の魔道軍将の書
    ReinBow: 1687, // 牽制の弓
    ReinBowPlus: 1686, // 牽制の弓+
    HotshotLance: 1684, // 凄腕の鋭槍

    // 幼き日の出会い
    LanceOfFrelia: 1694, // フレリアの宝槍
    StaffOfRausten: 1696, // ロストンの霊杖
    TomeOfGrado: 1698, // グラドの史書
    BladeOfRenais: 1699, // ルネスの礼剣
    BowOfFrelia: 1700, // フレリアの玉弓

    // 2021年4月 武器錬成
    Shamsir: 1682, // シャムシール
    FlowerLance: 1683, // スミアの花槍

    Skinfaxi: 1679, // スキンファクシ

    // 2021年4月 伝承シグルド
    HallowedTyrfing: 1701, // 聖裁ティルフィング

    // 暴雨の中を歩む者
    TwinCrestPower: 1704, // 双紋章の力
    VengefulLance: 1711, // 復讐鬼の槍
    TomeOfDespair: 1709, // 破滅の邪書
    AxeOfDespair: 1707, // 絶望の邪斧
    BereftLance: 1713, // 虚ろな槍

    // 2021年5月 武器錬成
    Ragnell: 27, // ラグネル
    Alondite: 35, // エタルド
    Raijinto: 20, // 雷神刀
    Siegfried: 25, // ジークフリート
    Gradivus: 87, // グラディウス

    // 愛と感謝の結婚式
    RoseQuartsBow: 1714, // 透き通る玻璃の弓
    ObservantStaffPlus: 1716, // 立会人の杖+
    LoveBouquetPlus: 1720, // 愛情のブーケ+
    WeddingBellAxe: 1718, // 幸せの鐘の斧
    LoveCandelabraPlus: 1721, // 結婚式の燭台+

    // 2021年5月 アスタルテ
    OrdersSentence: 1722, // 正の裁き

    // 第5部後半記念 新英雄＆ノート
    Hrimfaxi: 1731, // フリムファクシ
    Ladyblade: 1725, // レディソード
    HolyGradivus: 1727, // 聖槍グラディウス
    GronnfoxPlus: 1729, // グルンフォックス+
    BlarRabbitPlus: 1734, // ブラーラビット+

    // 極彩色の夏休み
    SunshadeStaff: 1736, // 夏陰の霊杖
    PeachyParfaitPlus: 1744, // フローズンパフェ+
    DivineSeaSpear: 1747, // 漁神の恵槍
    VictorfishPlus: 1742, // カツオ+
    SunflowerBowPlus: 1749, // 向日葵の弓+

    // 2021年6月 伝承ベレト
    ProfessorialText: 1751, // 師の導きの書

    // 2021年7月 武器錬成
    MaskingAxe: 1755, // 鉄面の斧
    Leiptr: 102, // レイプト
    StoutTomahawk: 147, // 剛斧トマホーク

    // あなたに夏の夢を
    BrightmareHorn: 1759, // 夏夜の悪夢の角
    RaydreamHorn: 1760, // 夏夜の夢の角
    TridentPlus: 1756, // トライデント+
    DolphinDiveAxe: 1762, // 波舞うイルカの斧
    ShellpointLancePlus: 1764, // 巻貝の槍+

    // 偽らざる明日へ＆ニフル
    SteadfastLancePlus: 1777, // 護衛の槍+
    SteadfastLance: 1778, // 護衛の槍
    FrostbiteBreath: 1772, // 絶氷のブレス
    FairFuryAxe: 1767, // 荒ぶる女子力の斧
    TigerSpirit: 1771, // 虎神・寅
    RauarRabbitPlus: 1775, // ラウアラビット+
    Ginnungagap: 1769, // ギンヌンガガプ

    // 2021年7月 神階英雄ウル
    HolyYewfelle: 1779, // 聖弓イチイバル

    // 恐るべき海賊たち
    SeaSearLance: 1790, // 炎海の灼槍
    CrossbonesClaw: 1784, // 凶兆の海賊の嘴爪
    EbonPirateClaw: 1785, // 射干玉の海賊の嘴爪
    MermaidBow: 1786, // 海泳ぐ人魚の弓
    HelmsmanAxePlus: 1783, // 操舵の斧+

    // 2021年8月 武器錬成
    PunishmentStaff: 1782, // 痛罵の杖
    LoyaltySpear: 1781, // 忠誠の槍

    // 2021年8月 希望の護り手たち
    // 男性
    GenesisFalchion: 1793, // 始祖ファルシオン
    ChargingHorn: 1802, // 突撃の角笛

    // 女性
    PhantasmTome: 1799, // 幻影の書
    BindingReginleif: 1796, // 絆槍レギンレイヴ

    // 大英雄線 ペレアス
    RauarLionPlus: 1806, // ラウアライオン+

    // 2021年8月 伝承ミカヤ
    NewDawn: 1820, // 明日の光

    // 聖戦士の末裔たち
    WhirlingGrace: 1830, // 流麗なる戦舞の聖器
    LuminousGracePlus: 1832, // 聖祭の光炎+
    DriftingGracePlus: 1833, // 聖祭の風光+
    BowOfTwelve: 1834, // 双聖戦士の聖弓

    // 2021年9月 武器錬成
    DuskDragonstone: 1829, // 暗夜の竜石
    StaffOfTwelvePlus: 1837, // 聖祭の杖+

    // 深淵を照らす灯火＆ムスペル
    HonorableBlade: 1839, // 義侠の戦刃
    AgneasArrow: 1842, // アグネアの矢
    DemonicTome: 1844, // 魔獣の書
    FlamelickBreath: 1846, // 絶炎のブレス
    InstantAxePlus: 1849, // 瞬撃の斧+

    // 2021年9月 神階英雄オッテル
    AutoLofnheior: 1852, // 機斧ロヴンヘイズ

    // 人と竜との収穫祭
    MoonstrikeBreath: 1856, // 誰彼のブレス
    WitchBreath: 1858, // 魔女のブレス
    LanternBreathPlus: 1859, // 提灯の竜石+
    EerieScripture: 1862, // 奇夜の福音
    SpiderPlushPlus: 1864, // クモのぬいぐるみ+

    // 2021年10月 武器錬成
    SoleilsShine: 1855, // ソレイユの陽剣
    Laevatein: 64, // レーヴァテイン

    // 新英雄＆開花フィヨルム
    KeenCoyoteBow: 1866, // 猛き狼の弓
    SpendyScimitar: 1868, // 安くない曲刀
    StoutLancePlus: 1869, // 堅固の槍+
    NiflsBite: 1871, // 絶氷ニフル
    UnboundAxePlus: 1873, // 孤絶の斧+
    InstantBowPlus: 1876, // 瞬撃の弓+

    // 2021年10月 伝承ファ
    DazzlingBreath: 1882, // 光輝のブレス

    // 隠密に任務遂行中・・・
    NabataKunai: 1885, // くの一の飛刀
    NinjaYumiPlus: 1888, // 忍の和弓+
    NinjaNaginataPlus: 1890, // 忍の薙刀+
    NinjutsuScrolls: 1892, // 双風忍法帳
    ShurikenCleaverPlus: 1895, // 忍の三叉斧+

    // 2021年11月 武器錬成
    KazesNeedle: 1881, // スズカゼの疾風針
    FangedBasilikos: 1880, // 狂牙バシリコス

    // 新英雄&開花レーギャルン
    FiremansHook: 1897, // 火消しの暗刃
    DamiellBow: 1899, // ディアメル家の宝弓
    UnboundLancePlus: 1901, // 孤絶の槍+
    FlameOfMuspell: 1903, // 絶炎ムスペル
    SteadfastSwordPlus: 1905, // 護衛の剣+
    SteadfastSword: 1906, // 護衛の剣
    InstantSwordPlus: 1907, // 瞬撃の剣+

    // 2021年11月 伝承エイトリ、神階トール
    GrimBrokkr: 1909, // 魔銃ブロック
    WarGodMjolnir: 1911, // 神槌ミョルニル

    // 第6部開幕記念 新英雄&アシュ
    HornOfOpening: 1921, // 開く者の角
    InviolableAxe: 1914, // 美僧の戦斧
    AncientRagnell: 1915, // 末流ラグネル
    LionessBlade: 1917, //  女傑の大剣
    SpiritedAxePlus: 1919, // 士気旺盛の斧+
    BlarLionPlus: 1924, // ブラーライオン+
    CarnageAmatsu: 1923, // 修羅アマツ

    // 冬祭りの使者は夢の中
    Dreamflake: 1927, // 白き夢のかけら
    SnowGlobePlus: 1929, // スノードーム+
    WinterRapierPlus: 1932, // 冬祭の突剣+
    SweetYuleLog: 1934, // 幸運ぶ冬の聖菓
    TannenbowPlus: 1936, // 聖樹の弓+

    // 2021年12月 伝承ベレス
    ProfessorialGuide: 1938, // 師の授けの書

    // 機械仕掛けの年明け
    NidavellirLots: 1940, // ニザヴェリルの箱
    NidavellirSprig: 1942, // ニザヴェリルの花
    SparklingFang: 1944, // 賀正の妹猫の爪牙
    JotnarBow: 1945, // 巨人姉妹の弓
    PolishedFang: 1946, // 賀正の銀虎の爪牙

    // 新英雄&開花ヨシュア
    RapidCrierBow: 1951, // 涙目の速射弓
    ViciousDaggerPlus: 1953, // 猛攻の暗器+
    QuickDaggerPlus: 1955, // 奥義発動の暗器+
    BladeOfJehanna: 1957, // ジャハナ王の砂刃

    // 2022年1月 武器錬成
    AncientCodex: 1949, // 古代魔道の稀書
    SwornLance: 1950, // 騎士の誓いの槍
    ArgentAura: 1959, // アルジローレ

    // 超英雄 幻の国の女王
    RoyalHatariFang: 1961, // 砂漠の狼女王の牙
    DrybladeLance: 1963, // 砂漠の剣姫の槍
    SerpentineStaffPlus: 1964, // 蛇の杖+
    DancingFlames: 1966, // 響き渡る合唱の祭器
    BoneCarverPlus: 1968, // 骨の暗器+

    // 2022年1月 神階エリミーヌ
    StaffOfTheSaint: 1976, // 聖女の杖

    // 超英雄 あなたがいるだけで
    GerberaAxe: 1990, // ガーベラの斧
    AchimenesFurl: 1992, // アキメネスの花冠
    PiercingTributePlus: 1978, // 感謝の花の槍+
    DestinysBow: 1980, // 運命変える絆弓
    StaffOfTributePlus: 1982, // 感謝の花の杖+

    // 2022年2月 武器錬成
    HurricaneDagger: 1989, // 疾風の暗器
    BowOfVerdane: 1988, // ヴェルダンの荒弓
    TomeOfReason: 1987, // 純理の書

    // 新英雄&開花イドゥン
    SellSpellTome: 1996, // 雇われ魔道士の書
    HvitrvulturePlus: 1998, // ヒータバルチャー+
    ArmorpinDaggerPlus: 2000, // 鎧殺の暗器+
    DewDragonstone: 2002, // 芽生えし心の竜石
    ReinAxe: 2005, // 牽制の斧
    ReinAxePlus: 2004, // 牽制の斧+

    // 2022年2月 伝承シーダ
    WingLeftedSpear: 2014, // 扶翼ウイングスピア

    // 超英雄 妹兎の願い
    BrightShellEgg: 2023, // 可憐に色づく飾り卵
    PastelPoleaxe: 2024, // 無邪気な白兎の斧
    CarrotTipBowPlus: 2026, // 春花の弓+
    MagicRabbits: 2028, // 二羽の魔兎の揺籃
    CarrotTipSpearPlus: 2030, // 春花の槍+

    // 2022年3月 武器錬成
    AzureLance: 2020, // 蒼穹の細槍
    QuickMulagir: 2021, // 颯弓ミュルグレ
    DotingStaff: 2022, // 慈母の霊杖

    // 新英雄&開花マリータ
    DiplomacyStaff: 2032, // 軍師の諫言の杖
    ReinSword: 2035, // 牽制の剣
    ReinSwordPlus: 2034, // 牽制の剣+
    AlliedLancePlus: 2036, // 共闘の槍+
    AscendingBlade: 2038, // 花開く心技の剣

    // 2022年3月 伝承ナンナ
    LandsSword: 2042, // 大地の剣

    // 超英雄 不思議な友達
    SharpWarSword: 2045, // 戦神の鋭剣
    AdroitWarTome: 2047, // 戦神の戦術書
    WindyWarTome: 2048, // 戦神の風書
    SturdyWarSword: 2049, // 戦神の剛なる鉄剣
    LargeWarAxe: 2051, // 戦神の大斧

    // 新英雄&開花イシュタル
    ThundererTome: 2052, // 怒雷の紫書
    GronnvulturePlus: 2054, // グルンバルチャー+
    ThundersMjolnir: 2059, // 雷神トールハンマー
    SpiritedSwordPlus: 2057, // 士気旺盛の剣+
    FieryBolganone: 2062, // 嘲謔ボルガノン

    // 2022年4月 神階メディウス
    ShadowBreath: 2065, //  暗黒地竜のブレス

    // 新英雄 (まつろわぬ魂たち)
    SilentPower: 2072, // 透魔竜の力
    EnvelopingBreath: 2074, // 茫漠のブレス
    HeadsmanGlitnir: 2075, // 死斧グリトニル
    RuinousFrost: 2077, // 滅亡の霜雪
    WildTigerFang: 2080, // 暴走の虎の爪牙

    // 2022年5月 武器錬成
    IcyMaltet: 2071, // 氷槍マルテ

    // 超英雄 百花繚乱の花嫁
    TrueLoveRoses: 2081, // 一途な想いの薔薇
    DragonBouquet: 2083, // 竜血継ぐ花嫁の花
    BridalOrchidPlus: 2085, // 花嫁のカトレア
    BlazingPolearms: 2087, // 紅炎の親子の聖斧
    BridalSunflowerPlus: 2090, // 花嫁の向日葵+

    // 2022年5月 伝承ミルラ
    GodlyBreath: 2095, // 竜神のブレス

    // 新英雄&開花英雄&レティシア
    NewHeightBow: 2104, // 友の風舞う翼弓
    JollyJadeLance: 2100, // お調子者の碧槍
    AlliedSwordPlus: 2102, // 共闘の剣+
    Kormt: 2063, // ケルムト
    MorphFimbulvetr: 2099, //  被造フィンブル
    VultureBladePlus: 2106, // 禿鷹の剣+
    VultureBlade: 2107, // 禿鷹の剣

    // 超英雄 級長たちの夏休み
    UnyieldingOar: 2112, // 蒼波薙ぐ剛力の櫂
    MoonlightDrop: 2114, // 純白の月の雫
    FrozenDelight: 2115, // 真夏の涼の氷菓子
    RegalSunshade: 2116, // 強靭なる烈女の大傘
    WhitecapBowPlus: 2120, // 白波の弓+

    // 2022年6月 伝承マークス
    EbonBolverk: 2122, // 黒斧ベルヴェルク

    // 超英雄 あの日の砂の城
    CaringConch: 2126, // 深き優しさの聖器
    ChilledBreath: 2129, // 夏氷のブレス
    CoralSaberPlus: 2131, // 珊瑚の剣+
    DivineWhimsy: 2133, // 戦神と戯神の気紛れ
    SeahouseAxePlus: 2134, // 竜の落とし子の斧+

    // 2022年7月 武器錬成
    HeartbeatLance: 2125, // 鎧好きの堅槍

    // 新英雄&開花英雄&ユーミル
    MilasTestament: 2136, // 大地母神の聖書
    TriEdgeLance: 2138, // 天馬姉妹の三角槍
    UpFrontBladePlus: 2140, // 正々堂々の剣+
    EverlivingBreath: 2142, // 永生のブレス
    StoutAxePlus: 2145, // 堅固の斧+
    VultureAxePlus: 2147, // 禿鷹の斧+
    VultureAxe: 2148, // 禿鷹の斧

    // 2022年7月 神階アスク
    IlluminatingHorn: 2149, // 絶光の角

    // 超英雄 危ないお宝対決
    LoftyLeaflet: 2152, // 気高き怪盗の予告状
    SoothingScent: 2163, // 影潜む密偵の香水瓶
    FloridKnifePlus: 2154, // 薔薇のナイフ+
    ShadowyQuill: 2156, // 双夜舞う怪盗の羽根
    FloridCanePlus: 2158, // 薔薇のステッキ+

    // 2022年8月 武器錬成
    WandererBlade: 2162, // 流浪の鋭剣

    // 2022年 総選挙
    InnerWellspring: 2166, // 内より溢れる魔力
    HolytideTyrfing: 2169, // 聖日ティルフィング
    RemoteBreath: 2172, // 悠遠のブレス
    Geirdriful: 2175, // ゲイルドリヴル
    BreakerLance: 2178, // 壊刃の戦槍

    // 2022年8月 伝承ディアドラ
    SpiritForestWrit: 2182, // 精霊の森の秘本

    // 超英雄 炎の祭りは甘くない
    // https://www.youtube.com/watch?v=h6jmLA7aQhw
    FirelightLance: 2189, // 炎と風舞う霊槍
    BreathOfFlame: 2192, // 炎祭のブレス
    FrameGunbaiPlus: 2194, // 炎の軍配+
    KindlingTaiko: 2196, // 原初の炎の太鼓
    FieryFang: 2188, // 炎虎の爪牙

    // 2022年9月 武器錬成
    TempestsClaw: 2187, // 黒疾風の爪斧

    // 魔器リーヴ(敵)
    // 英語表記
    // https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%BC%E3%83%AA%E3%83%A5%E3%83%BC%E3%82%BA%E3%83%8B%E3%83%AB
    ArcaneEljudnir: 2199, // 魔器エリューズニル

    // 新英雄＆開花英雄＆魔器リーヴ
    CrimsonBlades: 2201, // 朱傭兵の双剣
    WindGenesis: 2203, // 風呼びの根源
    FumingFreikugel: 2205, // 劫火フライクーゲル
    CrimsonWarAxe: 2208, // 朱傭兵の戦斧
    WarriorsSword: 2200, // 武人の鉄剣

    // 2022年9月 伝承ニニアン
    FaithfulBreath: 2209, // 神舞のブレス

    // 超英雄 神と竜との収穫祭
    MoonlightStone: 2211, // 月夜の魔女の竜石
    StarlightStone: 2213, // 星夜の魔術師の竜石
    SerenityBreathPlus: 2215, // 幽静のブレス+
    GhostlyLanterns: 2217, // 赤と青の奇なる鬼火
    SurpriseBreathPlus: 2220, // 一驚のブレス+

    // 新英雄＆開花英雄＆魔器ルフレ
    // https://www.youtube.com/watch?v=wc9QPu8FmaQ
    // https://www.youtube.com/watch?v=aPQ6_XG9Tek
    ArcaneGrima: 2224, // 魔器ギムレー
    BladeOfFavors: 2227, // 厚情の剛剣
    ReinLance: 2233, // 牽制の槍
    ReinLancePlus: 2232, // 牽制の槍+
    YmirEverliving: 2223, // 永生ユーミル
    GronnRabbitPlus: 2235, // グルンラビット+
    DefiersLancePlus: 2237, // 守備逆用の槍+

    // 神階ラルヴァ
    // https://www.youtube.com/watch?v=UFUWblZaLc8
    // https://www.youtube.com/watch?v=fjnDwCpDu_g
    RiteOfSouls: 2240, // 魂の秘儀

    // 超英雄 竜騎の忍たち
    // https://www.youtube.com/watch?v=VUff_9pScjA
    // https://www.youtube.com/watch?v=dUleRGz3uqs
    FloweryScroll: 2247, // 艶花忍法帳
    WyvernOno: 2249, // 愛竜への情の竜斧
    FlamefrostBow: 2251, // 炎と氷の王女の輝弓
    WyvernYumiPlus: 2253, // 竜忍の弓+
    WyvernKatanaPlus: 2255, // 竜忍の剣+

    // 2022年11月 武器錬成
    SnideBow: 2246, // 冷笑の遊弓
    LanceOfHeroics: 2245, // 正義の直槍

    // 特別召喚 新英雄&開花英雄&魔器ガングレト
    // https://www.youtube.com/watch?v=K3j2clDw45o
    // https://www.youtube.com/watch?v=Ag-JbZ0BVD8
    ArcaneDownfall: 2257, // 魔器・絶死ヘル
    CoyotesLance: 2262, // 草原の狼の白槍
    RespitePlus: 2265, // サンクチュアリ+
    AwokenBreath: 2258, // 目覚めし竜のブレス
    VultureLancePlus: 2267, // 禿鷹の槍+
    VultureLance: 2268, // 禿鷹の槍

    // 伝承神階英雄召喚 (ヴェロニカ＆エンブラ)
    // https://www.youtube.com/watch?v=d1I-I39AyEc
    // https://www.youtube.com/watch?v=OfeB6gGmV_8
    EnclosingDark: 2239, // 絶闇エンブラ
    EnclosingClaw: 2269, // 絶闇の翼爪

    // 第７部開幕記念（新英雄＆魔器英雄＆セイズ）
    // https://www.youtube.com/watch?v=wc39sRcMPxA
    // https://www.youtube.com/watch?v=knWaDA3MDZA
    ArcaneEclipse: 2274, // 魔器ルナイクリプス
    ProdigyPolearm: 2276, // 天才肌の薄薙刀
    AidPlus: 2278, // エイド+
    Seidr: 2280, // セイズ
    UnboundBowPlus: 2283, // 孤絶の弓+
    UnboundBow: 2284, // 孤絶の弓
    Aurgelmir: 2285, // アウルゲルミル

    // 2022年12月 武器錬成
    RetainersReport: 2286, // 参謀役の書

    // 超英雄（おねだり大作戦）
    // https://www.youtube.com/watch?v=JYEaDRQvPnc
    // https://www.youtube.com/watch?v=vflGqP434Yc
    SolemnAxe: 2288, // 荘厳なる祝福の聖斧
    SevenfoldGifts: 2290, // 皆への七つの贈り物
    PeppyBowPlus: 2291, // 聖夜の弓+
    InseverableSpear: 2293, // 母娘の静やかな祝福
    PeppyCanePlus: 2295, // 聖夜のステッキ+

    // 伝承英雄 (修羅の如き双刃 シェズ)
    AsuraBlades: 2297, // アスラの双刃

    // 超英雄（神々の新年）
    HeraldingHorn: 2300, // 新年を開く角
    FangOfFinality: 2302, // 旧年を閉ざす爪牙
};

const Support = {
    None: -1,
    Reposition: 413,
    Smite: 414, // ぶちかまし
    Drawback: 415, // 引き寄せ
    Shove: 424, // 体当たり
    Swap: 416, // 入れ替え
    FutureVision: 433, // 未来を移す瞳
    FutureVision2: 1948, // 未来を映す瞳・承
    FoulPlay: 1840, // トリック
    Pivot: 422, // 回り込み
    ToChangeFate: 1152, // 運命を変える!
    AFateChanged: 2176, // 運命は変わった!

    Sing: 411, // 歌う
    Dance: 412, // 踊る
    GrayWaves: 789, // ユラリユルレリ
    GrayWaves2: 2017, // ユラリユルレリ・承
    GentleDream: 1061, // やさしいゆめ
    WhimsicalDream: 1362, // しろいゆめ
    SweetDreams: 1489, // あまいゆめ
    FrightfulDream: 1537, // こわいゆめ
    Play: 1135, // 奏でる
    CallToFlame: 2079, // オイデ、ヒノコタチ
    DragonsDance: 2210, // 尊き竜の血を継ぐ娘

    RallyAttack: 418,
    RallySpeed: 417,
    RallyDefense: 419,
    RallyResistance: 420,
    RallyAtkSpd: 426,
    RallyAtkDef: 431,
    RallyAtkRes: 428,
    RallySpdDef: 429,
    RallySpdRes: 430,
    RallyDefRes: 427,

    // 大応援
    RallyUpAtk: 435,
    RallyUpAtkPlus: 436,
    RallyUpSpd: 1501, // 速さの大応援
    RallyUpSpdPlus: 1499, // 速さの大応援+
    RallyUpDef: 1894, // 守備の大応援
    RallyUpDefPlus: 1893, // 守備の大応援+
    RallyUpRes: 1154,
    RallyUpResPlus: 1153,

    // 2種応援
    RallyAtkDefPlus: 876,
    RallyAtkResPlus: 1066,
    RallySpdResPlus: 932,
    RallySpdDefPlus: 434,
    RallyAtkSpdPlus: 756,
    RallyDefResPlus: 1001,

    Physic: 437, // リブロー
    PhysicPlus: 438, // リブロー+

    Sacrifice: 432, // 癒しの手
    MaidensSolace: 1821, // 癒しの乙女
    Recover: 439, // リカバー
    RecoverPlus: 440, // リカバー+ 
    RestorePlus: 449, // レスト+
    HarshCommand: 423, // 一喝
    HarshCommandPlus: 905, // 一喝+

    ReciprocalAid: 425, // 相互援助
    ArdentSacrifice: 421, // 献身

    Heal: 447, // ライブ
    Reconcile: 446, // ヒール
    Rehabilitate: 441, // リバース
    RehabilitatePlus: 442, // リバース+
    Mend: 443, // リライブ

    Martyr: 444, // セインツ
    MartyrPlus: 445, // セインツ+
    Restore: 448, // レスト

    RescuePlus: 1506, // レスキュー+
    Rescue: 1512, // レスキュー
    ReturnPlus: 1606, // リターン+
    Return: 1607, // リターン
    NudgePlus: 1737, // プッシュ+
    Nudge: 1738, // プッシュ
};

const AssistType = {
    None: 0,
    Refresh: 1,
    Heal: 2,
    DonorHeal: 3,
    Restore: 4,
    Rally: 5,
    Move: 6,
};

const Special = {
    None: -1,
    Moonbow: 468, // 月虹
    Luna: 467, // 月光
    Aether: 470, // 天空
    LunaFlash: 889, // 月光閃
    LunarFlash2: 2160, // 月光閃・承
    Glimmer: 462, // 凶星
    Deadeye: 1481, // 狙撃
    Astra: 461, // 流星
    Bonfire: 455, // 緋炎
    Ignis: 450, // 華炎
    Iceberg: 456, // 氷蒼
    Glacies: 451, // 氷華
    CircletOfBalance: 2183, // 聖神と暗黒神の冠
    DraconicAura: 457, // 竜裂
    DragonFang: 452, // 竜穿
    Enclosure: 2272, // 閉界
    Sirius: 956, // 天狼
    SiriusPlus: 2186, // 天狼・神
    RupturedSky: 954, // 破天
    TwinBlades: 1043, // 双刃
    Taiyo: 493, // 太陽
    Yuyo: 494, // 夕陽
    RegnalAstra: 465, // 剣姫の流星
    ImperialAstra: 1094, // 剣皇の流星
    VitalAstra: 2039, // 心流星
    OpenTheFuture: 1091, // 開世
    Fukusyu: 453, // 復讐
    Kessyu: 454, // 血讐
    Kagetsuki: 469, // 影月
    Setsujoku: 458, // 雪辱
    Hyouten: 460, // 氷点
    Youkage: 495, // 陽影
    Hotarubi: 459, // 蛍火
    HonoNoMonsyo: 466, // 炎の紋章
    HerosBlood: 1232, // 英雄の血脈
    KuroNoGekko: 471, // 黒の月光
    Lethality: 1898, // 滅殺
    AoNoTenku: 472, // 蒼の天空
    RadiantAether2: 1628, // 蒼の天空・承
    MayhemAether: 1309, // 暴の天空
    Hoshikage: 463, // 星影
    Fukuryu: 464, // 伏竜
    BlueFrame: 473, // ブルーフレイム
    SeidrShell: 1542, // 魔弾
    BrutalShell: 1853, // 凶弾

    GrowingFlame: 485,
    GrowingLight: 486,
    GrowingWind: 487,
    GrowingThunder: 488,
    BlazingFlame: 481,
    BlazingLight: 482,
    BlazingWind: 483,
    BlazingThunder: 484,
    RisingFlame: 489, // 砕火
    RisingLight: 490,
    RisingWind: 491,
    RisingThunder: 492,
    GiftedMagic: 1582, // 天与の魔道

    NjorunsZeal: 1021, // ノヴァの聖戦士
    Galeforce: 496, // 疾風迅雷
    Miracle: 497, // 祈り
    LifeUnending: 1883, // 永遠を生きるもの

    Nagatate: 477, // 長盾
    Otate: 475, // 大盾
    Kotate: 479, // 小盾
    Seitate: 474, // 聖盾
    Seii: 478, // 聖衣
    Seikabuto: 476, // 聖兜
    IceMirror: 480, // 氷の聖鏡
    IceMirror2: 1629, // 氷の聖鏡・承
    GodlikeReflexes: 2190, // 神速回避

    ShippuNoSyukuhuku: 499, // 疾風の祝福
    DaichiNoSyukuhuku: 500, // 大地の祝福
    SeisuiNoSyukuhuku: 501, // 静水の祝福
    KindledFireBalm: 498, // 業火の祝福
    WindfireBalmPlus: 505, // 業火疾風の祝福+
    WindfireBalm: 504, // 業火疾風の祝福
    DelugeBalmPlus: 1507, // 疾風静水の祝福+
    DaichiSeisuiNoSyukuhuku: 506, // 大地静水の祝福
    DaichiSeisuiNoSyukuhukuPlus: 507, // 大地静水の祝福+
    GokaDaichiNoSyukuhukuPlus: 797, // 業火大地の祝福+
    GokaSeisuiNoSyukuhukuPlus: 1387, // 業火静水の祝福+
    Chiyu: 502, // 治癒
    Tensho: 503, // 天照
    RighteousWind: 1237, // 聖風
    ShiningEmblem: 1794, // 光炎の紋章

    NegatingFang: 1469, // 反竜穿

    HolyKnightAura: 1702, // グランベルの聖騎士

    SublimeHeaven: 1752, // 覇天
    DevinePulse: 2167, // 天刻の拍動

    RequiemDance: 1800, // 鎮魂の舞
};

const PassiveA = {
    None: -1,
    CloseCounter: 561, // 近距離反撃
    CloseReversal: 1803, // 近反・金剛の構え
    DistantFerocity: 2218, // 遠反・鬼神の構え
    DistantDart: 2050, // 遠反・飛燕の構え
    DistantReversal: 2301, // 遠反・金剛の構え
    DistantStance: 1884, // 遠反・明鏡の構え
    DistantCounter: 562, // 遠距離反撃
    DistantStorm: 2015, // 遠反・攻撃の渾身
    DistantPressure: 1795, // 遠反・速さの渾身
    CloseSalvo: 1981, // 近反・攻撃の渾身
    DeathBlow3: 528, // 鬼神の一撃3
    DeathBlow4: 529, // 鬼神の一撃4
    HienNoIchigeki1: 1149,
    HienNoIchigeki2: 1150,
    HienNoIchigeki3: 530,
    HienNoIchigeki4: 890,
    KongoNoIchigeki3: 531,
    MeikyoNoIchigeki3: 532,
    KishinHienNoIchigeki2: 533,
    KishinKongoNoIchigeki2: 534,
    KishinMeikyoNoIchigeki2: 535,
    HienKongoNoIchigeki2: 536,
    HienMeikyoNoIchigeki2: 537,
    KongoMeikyoNoIchigeki2: 538,
    KishinHienNoIchigeki3: 927,

    LifeAndDeath3: 527, // 死線3
    LifeAndDeath4: 1040, // 死線4
    Fury1: 1300,
    Fury2: 1301,
    Fury3: 526, // 獅子奮迅3
    Fury4: 825,
    DistantDef3: 564, // 遠距離防御3
    DistantDef4: 875, // 遠距離防御4
    CloseDef3: 563, // 近距離防御3
    CloseDef4: 1527, // 近距離防御4

    AtkSpdBond1: 1325,
    AtkSpdBond2: 1326,
    AtkSpdBond3: 574,
    AtkSpdBond4: 1019, // 攻撃速さの絆4
    AtkDefBond1: 1327,
    AtkDefBond2: 1328,
    AtkDefBond3: 575,
    AtkDefBond4: 1475,
    AtkResBond1: 1329,
    AtkResBond2: 1330,
    AtkResBond3: 576,
    AtkResBond4: 975, // 攻撃魔防の絆4
    SpdDefBond1: 1331,
    SpdDefBond2: 1332,
    SpdDefBond3: 577,
    SpdDefBond4: 1900, // 速さ守備の絆4
    SpdResBond1: 1333,
    SpdResBond2: 1334,
    SpdResBond3: 578,
    SpdResBond4: 1952, // 速さ魔防の絆4
    DefResBond1: 1335,
    DefResBond2: 1336,
    DefResBond3: 775,
    DefResBond4: 2033, // 守備魔防の絆4

    JaryuNoUroko: 585, // 邪竜の鱗
    DragonSkin2: 1754, // 邪竜の鱗・承
    Dragonscale: 1492, // 邪竜の大鱗
    Dragonhide: 2225, // 邪竜の重鱗

    // 密集
    AtkSpdForm3: 964,
    AtkDefForm3: 1055,
    AtkResForm3: 1495,
    SpdDefForm3: 992,
    SpdResForm3: 1137,
    DefResForm3: 1630,

    HeavyBlade1: 1256, // 剛剣1
    HeavyBlade2: 1257, // 剛剣2
    HeavyBlade3: 568, // 剛剣3
    HeavyBlade4: 1028, // 剛剣4
    FlashingBlade1: 1337, // 柔剣1
    FlashingBlade2: 1338, // 柔剣2
    FlashingBlade3: 569, // 柔剣3
    FlashingBlade4: 892, // 柔剣4


    AsherasChosen: 1044, // 女神の三雄

    // 構え
    KishinNoKamae3: 539,
    HienNoKamae3: 540,
    KongoNoKamae3: 541,
    MeikyoNoKamae3: 542,
    KishinHienNoKamae2: 543,
    KishinKongoNoKamae1: 1290,
    KishinKongoNoKamae2: 544,
    KishinMeikyoNoKamae2: 545,
    HienKongoNoKamae2: 546,
    HienMeikyoNoKamae1: 1119,
    HienMeikyoNoKamae2: 547,
    KongoMeikyoNoKamae2: 548,
    KongoNoKamae4: 766, // 金剛の構え4
    MeikyoNoKamae4: 894,
    KishinMeikyoNoKamae3: 1057,
    HienKongoNoKamae3: 1095,
    SwiftStance3: 1608,
    KishinKongoNoKamae3: 1174,
    KongoMeikyoNoKamae3: 1351,
    KishinHienNoKamae3: 1359,

    AishoGekika1: 1421,
    AishoGekika2: 1422,
    AishoGekika3: 560, // 相性激化3

    // 死闘
    AkaNoShitoHiko3: 582,
    MidoriNoShitoHoko3: 583,
    MuNoShitoHoko3: 584,
    AoNoShitoHiko3: 790,
    MidoriNoShitoHiko3: 864,
    AkaNoShitoHoko3: 929,
    AoNoShitoHoko3: 985,
    BDuelFlying4: 1645,
    RDuelInfantry4: 1642,
    BDuelInfantry4: 1669,
    CDuelCavalry4: 1717,

    HP1: 1115,
    HP2: 1116,
    HP3: 508,
    Atk3: 509,
    Spd3: 510,
    Def3: 511,
    Res1: 1117,
    Res2: 1118,
    Res3: 512,
    HpAtk2: 513,
    HpSpd2: 514,
    HpDef1: 1120,
    HpDef2: 515,
    HpRes2: 516,
    AtkSpd2: 517,
    AtkDef2: 518,
    AtkRes2: 519,
    SpdDef2: 520,
    SpdRes2: 521,
    DefRes2: 522,
    SyubiNoJosai3: 523, // 守備の城塞3
    MaboNoJosai3: 524, // 魔防の城塞3
    SyubiMaboNoJosai3: 525, // 守備魔防の城塞3

    // 孤軍
    AtkSpdSolo3: 580,
    AtkResSolo3: 581,
    AtkDefSolo3: 777,
    DefResSolo3: 822,
    SpdDefSolo3: 871,
    SpdResSolo3: 1098,
    AtkResSolo4: 1312,
    AtkSpdSolo4: 1316,
    AtkDefSolo4: 1428,
    SpdDefSolo4: 1831,
    SpdResSolo4: 1770,
    DefResSolo4: 1544,

    SvelNoTate: 565, // スヴェルの盾
    GuraniNoTate: 566, // グラ二の盾
    IotesShield: 567, // アイオテの盾

    AtkSpdPush3: 579, // 攻撃速さの渾身3
    AtkDefPush3: 862,
    AtkResPush3: 919,
    AtkResPush4: 1022, // 攻撃魔防の渾身4
    AtkSpdPush4: 971, // 攻撃速さの渾身4
    AtkDefPush4: 1177, // 攻撃守備の渾身4

    BrazenAtkSpd3: 556,
    BrazenAtkDef3: 557, // 攻撃守備の大覚醒3
    BrazenAtkRes3: 558,
    BrazenDefRes3: 559,
    BrazenSpdDef3: 995,
    BrazenSpdRes3: 1038,

    BrazenAtkSpd4: 939, // 大覚醒4

    KishinNoKokyu: 549, // 鬼神の呼吸
    KongoNoKokyu: 550, // 金剛の呼吸
    MeikyoNoKokyu: 551, // 明鏡の呼吸
    DartingBreath: 1310, // 飛燕の呼吸

    CloseFoil: 1181, // 金剛の反撃・近距離
    CloseWard: 1584, // 明鏡の反撃・近距離
    DistantFoil: 1182, // 金剛の反撃・遠距離
    DistantWard: 1088, // 明鏡の反撃・遠距離
    KishinKongoNoSyungeki: 805, // 鬼神金剛の瞬撃
    KishinMeikyoNoSyungeki: 923, // 鬼神明鏡の瞬撃
    SteadyImpact: 1424, // 飛燕金剛の瞬撃
    SwiftImpact: 1617, // 飛燕明鏡の瞬撃

    Kyokazohuku3: 849, // 強化増幅3

    YaibaNoSession3: 1111, // 刃のセッション
    TateNoSession3: 1107, // 盾のセッション

    HashinDanryuKen: 978, // 覇神断竜剣

    MadoNoYaiba3: 764, // 魔道の刃3

    DefiantAtk1: 1166,
    DefiantAtk2: 1167,
    DefiantAtk3: 552, // 攻撃の覚醒3
    DefiantSpd3: 553,
    DefiantDef3: 554,
    DefiantRes3: 555,

    SeimeiNoGoka3: 570, // 生命の業火
    SeimeiNoShippu3: 571,
    SeimeiNoDaichi3: 572,
    SeimeiNoSeisui3: 573,

    SacaNoOkite: 586, // サカの掟
    LawsOfSacae2: 1753, // サカの掟・承
    VerdictOfSacae: 2191, // 大いなるサカの掟
    OstiasCounter: 587, // オスティアの反撃
    Duality: 2241, // 魂の秘儀
    SwiftSlice: 2298, // 連閃

    // 防城戦
    AtkSpdBojosen3: 1473,
    AtkResBojosen3: 881,
    SpdDefBojosen3: 907,
    DefResBojosen3: 918,
    SpdResBojosen3: 962,
    AtkDefBojosen3: 1008,
    AtkSpdBojosen4: 1773,
    DefResBojosen4: 1847,

    // 攻城戦
    AtkDefKojosen3: 883,
    AtkSpdKojosen3: 914,
    SpdResKojosen3: 925,

    // 連帯
    AtkSpdUnity: 1801, // 攻撃速さの連帯
    AtkDefUnity: 1450, // 攻撃守備の連帯
    AtkResUnity: 1575, // 攻撃魔防の連帯
    DefResUnity: 2096, // 守備魔防の連帯

    // 機先
    AtkSpdCatch3: 1648, // 攻撃速さの機先3
    AtkDefCatch3: 1875, // 攻撃守備の機先3
    AtkSpdCatch4: 1647, // 攻撃速さの機先4
    AtkDefCatch4: 1703, // 攻撃守備の機先4
    AtkResCatch4: 1845, // 攻撃魔防の機先4
    SpdDefCatch4: 2101, // 速さ守備の機先4
    DefResCatch4: 1761, // 守備魔防の機先4

    // 万全
    AtkSpdIdeal3: 1926, // 攻撃速さの万全3
    AtkSpdIdeal4: 1688, // 攻撃速さの万全4
    AtkDefIdeal3: 2060, // 攻撃守備の万全3
    AtkDefIdeal4: 1705,
    AtkResIdeal3: 1960,
    AtkResIdeal4: 1723,
    SpdDefIdeal3: 2006, // 速さ守備の万全3
    SpdDefIdeal4: 1997, // 速さ守備の万全4
    DefResIdeal3: 1984, // 守備魔防の万全3
    DefResIdeal4: 1791, // 守備魔防の万全4

    // 迫撃
    SurgeSparrow: 1797, // 鬼神飛燕の迫撃
    SturdySurge: 1962, // 鬼神金剛の迫撃

    // 激突
    AtkSpdClash4: 2170, // 攻撃速さの激突4
    AtkDefClash4: 2207, // 攻撃守備の激突4

    // 秘奥
    AtkSpdFinish4: 2212, // 攻撃速さの秘奥4
    AtkResFinish4: 2173, // 攻撃魔防の秘奥4
    SpdResFinish4: 2259, // 速さ魔防の秘奥4
};

const PassiveB = {
    None: -1,
    QuickRiposte1: 1254, // 切り返し1
    QuickRiposte2: 1255, // 切り返し2
    QuickRiposte3: 599, // 切り返し3
    QuickRiposte4: 2264, // 切り返し4
    DragonWall3: 1621, // 竜鱗障壁3
    TrueDragonWall: 2078, // 真竜鱗障壁
    NewDivinity: 2174, // 新たなる神竜王
    DragonsIre3: 1493, // 竜の逆鱗3
    DragonsIre4: 2214, // 竜の逆鱗4
    DragonsWrath3: 1863, // 竜の魔鱗3
    DragonsWrath4: 2193, // 竜の魔鱗4
    Vantage3: 596, // 待ち伏せ3
    Desperation3: 597, // 攻め立て3
    Cancel1: 1286,//キャンセル1
    Cancel2: 1287,//キャンセル2
    Cancel3: 631,//キャンセル3
    Kyuen2: 1121, // 救援の行路2
    Kyuen3: 594, // 救援の行路3
    Ridatsu3: 595, // 離脱の行路3
    HentaiHiko1: 1443, // 編隊飛行1
    HentaiHiko2: 1444, // 編隊飛行2
    HentaiHiko3: 635, // 編隊飛行3
    KyokugiHiKo1: 1394, // 曲技飛行1
    KyokugiHiKo2: 1395, // 曲技飛行2
    KyokugiHiKo3: 636, // 曲技飛行3
    WrathfulStaff3: 632, // 神罰の杖3
    DazzlingStaff3: 633, // 幻惑の杖3
    ChillAtk1: 1339,
    ChillAtk2: 1340,
    ChillAtk3: 614, // 攻撃の封印3
    ChillSpd1: 1341,
    ChillSpd2: 1342,
    ChillSpd3: 615, // 速さの封印3
    ChillDef1: 1343,
    ChillDef2: 1344,
    ChillDef3: 616, // 守備の封印3
    ChillRes1: 1345,
    ChillRes2: 1346,
    ChillRes3: 617, // 魔防の封印3
    ChillAtkDef2: 1524, // 攻撃守備の封印2
    ChillAtkRes2: 1169, // 攻撃魔防の封印2
    ChillAtkRes3: 2281, // 攻撃魔防の封印3
    ChillAtkSpd2: 1239, // 攻撃速さの封印2
    ChillSpdDef2: 1319, // 速さ守備の封印2
    ChillSpdRes2: 1371, // 速さ魔防の封印2
    ChillDefRes2: 1613, // 守備魔防の封印2
    ChillDefRes3: 2157, // 守備魔防の封印3

    BoldFighter3: 601, // 攻撃隊形3
    VengefulFighter3: 602, // 迎撃隊形3
    WaryFighter3: 600, // 守備隊形3
    SpecialFighter3: 603,// 奥義隊形3
    SpecialFighter4: 2289,// 奥義隊形4
    CraftFighter3: 1483, // 抑止隊形3
    SlickFighter3: 1497, // 正面隊形・自己3
    WilyFighter3: 2003, //正面隊形・敵方3
    HardyFighter3: 1872, // 盾壁隊形3
    SavvyFighter3: 1991, // 慧眼隊形3

    MikiriTsuigeki3: 757, // 見切り・追撃効果3
    MikiriHangeki3: 810, // 見切り・反撃不可効果3

    KyokoNoWakuran3: 896, // 惑乱3

    BlazeDance1: 1278, // 業火の舞い1
    BlazeDance2: 1279, // 業火の舞い2
    BlazeDance3: 638, // 業火の舞い3
    GaleDance1: 1230, // 疾風の舞い1
    GaleDance2: 1231, // 疾風の舞い2
    GaleDance3: 639, // 疾風の舞い3
    EarthDance1: 1147, // 大地の舞い1
    EarthDance2: 1148, // 大地の舞い2
    EarthDance3: 640, // 大地の舞い3
    TorrentDance1: 1241, // 静水の舞い1
    TorrentDance2: 1242, // 静水の舞い2
    TorrentDance3: 762, // 静水の舞い3
    FirestormDance2: 641, // 業火疾風の舞い2
    CalderaDance1: 1240, // 業火大地の舞い1
    CalderaDance2: 987, // 業火大地の舞い2
    DelugeDance2: 644, // 疾風静水の舞い2
    FirefloodDance2: 642, // 業火静水の舞い2
    GeyserDance1: 1243, // 大地静水の舞い1
    GeyserDance2: 645, // 大地静水の舞い2
    RockslideDance2: 643, // 疾風大地の舞い2

    // 魅了
    AtkCantrip3: 1380, // 攻撃の魅了3
    SpdCantrip3: 1928, // 速さの魅了3
    DefCantrip3: 1471,
    ResCantrip3: 1589,

    AtkSpdLink2: 1133, // 攻撃速さの連携2
    AtkSpdLink3: 648, // 攻撃速さの連携3
    AtkResLink3: 760,
    AtkDefLink3: 649, // 攻撃守備の連携3
    SpdDefLink3: 860, // 速さ守備の連携3
    SpdResLink3: 650, // 速さ魔防の連携3
    DefResLink3: 651, // 守備魔防の連携3

    Swordbreaker3: 618, // 剣殺し3
    Lancebreaker3: 619,
    Axebreaker3: 620,
    Bowbreaker3: 621,
    Daggerbreaker3: 622,
    RedTomebreaker3: 623,
    BlueTomebreaker3: 624,
    GreenTomebreaker3: 625,

    LullAtkDef3: 950, // 攻撃守備の凪3
    LullAtkSpd3: 994, // 攻撃速さの凪3
    LullAtkRes3: 1109, // 攻撃魔防の凪3
    LullSpdDef3: 952, // 速さ守備の凪3
    LullSpdRes3: 1156,

    SabotageAtk3: 846, // 攻撃の混乱3
    SabotageSpd3: 1026, // 速さの混乱3
    SabotageDef3: 937, // 守備の混乱3
    SabotageRes3: 867, // 魔防の混乱3

    OgiNoRasen3: 654, // 奥義の螺旋3
    SpecialSpiral4: 2275, // 奥義の螺旋4

    SealAtk1: 1455,
    SealAtk2: 1456,
    SealAtk3: 607,
    SealSpd1: 1457,
    SealSpd2: 1458,
    SealSpd3: 608,
    SealSpd4: 2299, // 速さ封じ4
    SealDef1: 1459,
    SealDef2: 1460,
    SealDef3: 609, // 守備封じ3
    SealDef4: 2252, // 守備封じ4
    SealRes1: 1461,
    SealRes2: 1462,
    SealRes3: 610, // 魔防封じ3
    SealRes4: 2248, // 魔防封じ4
    SealAtkSpd1: 1463,
    SealAtkSpd2: 611, // 攻撃速さ封じ2
    SealAtkDef1: 1464,
    SealAtkDef2: 612,
    SealAtkRes2: 1604, // 攻撃魔防封じ2
    SealDefRes1: 1467,
    SealDefRes2: 613,
    SealSpdDef1: 1465,
    SealSpdDef2: 855,
    SealSpdRes1: 1466,
    SealSpdRes2: 1389, // 速さ魔防封じ2

    KoriNoHuin: 660, // 氷の封印
    ChillingSeal2: 1692, // 氷の封印・承
    ToketsuNoHuin: 770, // 凍結の封印
    FreezingSeal2: 1986, // 凍結の封印・承

    Ikari3: 637, // 怒り3
    Renewal1: 1258, // 回復1
    Renewal2: 1259, // 回復2
    Renewal3: 605, // 回復3

    AtkFeint3: 817, // 攻撃の共謀3
    SpdFeint3: 652,
    DefFeint3: 653,
    ResFeint3: 829,

    // 大共謀
    AtkSpdRuse3: 973,
    AtkDefRuse3: 1141,
    AtkResRuse3: 1546,
    DefResRuse3: 935,
    SpdResRuse3: 1004,
    SpdDefRuse3: 1105,

    KillingIntent: 999, // 死んでほしいの

    PoisonStrike3: 604,
    SacaesBlessing: 655,

    Kazenagi3: 629, // 風薙ぎ3
    Mizunagi3: 630, // 水薙ぎ3

    Velocity3: 2206, // 回避・拍節3
    Frenzy3: 1768, // 回避・攻め立て3
    Spurn3: 1391, // 回避・怒り3
    KaihiIchigekiridatsu3: 1053, // 回避・一撃離脱3
    KaihiTatakikomi3: 1100, // 回避・叩き込み3
    Kirikomi: 589, // 切り込み
    Tatakikomi: 588, // 叩き込み
    Hikikomi: 590, // 引き込み
    Ichigekiridatsu: 591, // 一撃離脱

    KyokaMukoKinkyori3: 646, // 強化無効・近距離3
    KyokaMukoEnkyori3: 647, // 強化無効・遠距離3

    Wanakaijo3: 858, // 罠解除3

    RunaBracelet: 667, // 月の腕輪
    LunarBrace2: 1947, // 月の腕輪・承
    SeimeiNoGofu3: 772, // 生命の護符
    MysticBoost4: 2234, // 生命の護符4

    ShisyaNoChojiriwo: 1114, // 死者の帳尻を
    YunesSasayaki: 976, // ユンヌの囁き
    SphiasSoul: 1076, // ソフィアの魂
    SDrink: 663, // Sドリンク
    BeokuNoKago: 656, // ベオクの加護

    TsuigekiTaikeiKisu3: 1009, // 追撃隊形・奇数3
    EvenFollowUp3: 1574, // 追撃隊形・偶数3

    HikariToYamito: 981, // 光と闇と
    LightAndDark2: 2185, // 光と闇と・承

    GohoshiNoYorokobi1: 1252, // ご奉仕の喜び1
    GohoshiNoYorokobi2: 1253, // ご奉仕の喜び2
    GohoshiNoYorokobi3: 606, // ご奉仕の喜び3
    SeikishiNoKago: 657, // 聖騎士の加護
    Shishirenzan: 665, // 獅子連斬
    Bushido: 664, // 武士道
    Bushido2: 1693, // 武士道・承
    Recovering: 659, // リカバーリング
    TaiyoNoUdewa: 662, // 太陽の腕輪
    SolarBrace2: 1827, // 太陽の腕輪・承
    KyusyuTaikei3: 1072, // 急襲隊形3
    FuinNoTate: 666, // 封印の盾
    BindingShield2: 1878, // 封印の盾・承
    TeniNoKona: 661, // 転移の粉
    TsuigekiRing: 658, // 追撃リング
    TateNoKodo3: 634, // 盾の鼓動3
    // @TODO: 相性相殺1, 2は効果が異なるので時間がある時に実装する
    AisyoSosatsu3: 626, // 相性相殺
    Sashitigae3: 598, // 差し違え3
    ShingunSoshi3: 593, // 進軍阻止3
    DetailedReport: 1804, // 異常なしであります
    Surinuke3: 592, // すり抜け3
    Tenmakoku3: 1139, // 天馬行空3
    WyvernFlight3: 1529, // 飛竜行空3
    KodoNoHukanGusu3: 1136, // 鼓動の封緘・偶数3
    OddPulseTie3: 1321, // 鼓動の封緘・奇数3

    BeliefInLove: 1235, // 愛を信じますか?
    FaithfulLoyalty: 2016, // 信じつづける誓い
    RagingStorm: 1303, // 狂嵐
    Chivalry: 2123, // 騎士道

    // 干渉
    AtkSpdSnag3: 1685, // 攻撃速さの干渉3
    AtkDefSnag3: 1587, // 攻撃守備の干渉3
    AtkResSnag3: 2153, // 攻撃魔坊の干渉3
    SpdResSnag3: 1367, // 速さ魔防の干渉3
    SpdDefSnag3: 1373, // 速さ守備の干渉3
    DefResSnag3: 1867, // 守備魔防の干渉3

    HolyWarsEnd: 1376, // 最後の聖戦
    GuardBearing3: 1378, // 警戒姿勢3
    DiveBomb3: 1430, // 空からの急襲3

    BlueLionRule: 1451, // 蒼き獅子王
    BlackEagleRule: 1453, // 黒鷲の覇王
    Atrocity: 1514, // 無惨
    BindingNecklace: 1540, // 束縛の首飾り
    FallenStar: 1651, // 落星
    SunTwinWing: 1680, // 双姫の陽翼
    MoonTwinWing: 1732, // 双姫の月翼
    ArmoredWall: 1706, // 覇鎧障壁
    MurderousLion: 1712, // 蒼き殺人鬼
    YngviAscendant: 1780, // ユングヴィの祖
    MoonlightBangle: 1798, // 華月の腕輪
    MoonlitBangleF: 2127, // 華月の腕輪・遠
    Prescience: 1822, // 未来を知る力
    DivineRecreation: 1910, // それは興味深いね
    HodrsZeal: 2043, // ヘズルの聖騎士
    AssuredRebirth: 2066, // 我が復活は成った

    // 近影、遠影
    AtkSpdNearTrace3: 2263, // 攻撃速さの近影3
    AtkDefNearTrace3: 1719, // 攻撃守備の近影3
    AtkResNearTrace3: 2143, // 攻撃魔防の近影3
    SpdDefNearTrace3: 1695, // 速さ守備の近影3
    SpdResNearTrace3: 2130, // 速さ魔防の近影3
    AtkSpdFarTrace3: 1843, // 攻撃速さの遠影3
    AtkDefFarTrace3: 1715, // 攻撃守備の遠影3
    AtkResFarTrace3: 1746, // 攻撃魔防の遠影3
    SpdDefFarTrace3: 2105, // 速さ魔防の遠影3
    SpdResFarTrace3: 1697, // 速さ魔防の遠影3

    // 怒涛
    FlowFlight3: 2025, // 怒涛・飛竜行空3
    FlowRefresh3: 1763, // 怒涛・再起3
    FlowGuard3: 1912, // 怒涛・キャンセル3
    FlowForce3: 2088, // 怒涛・不屈3
    FlowFeather3: 2139, // 怒涛・天馬行空3

    // 拍節
    AtkResTempo3: 2184, // 攻撃魔防の拍節3
    SpdDefTempo3: 2046, // 速さ守備の拍節3
    SpdResTempo3: 2204, // 速さ魔坊の拍節3

    // 防壁
    AtkDefBulwark3: 2150, // 攻撃守備の防壁3
    SpdDefBulwark3: 2202, // 速さ守備の防壁3
    SpdResBulwark3: 2260, // 速さ魔防の防壁3

    // 先制
    SpdPreempt3: 2168, // 速さの先制3

    // 絶対化身
    BeastAgility3: 2270, // 絶対化身・敏捷3
    BeastNTrace3: 2303, // 絶対化身・近影3
};

const PassiveC = {
    None: -1,
    SpurAtk1: 1268,
    SpurAtk2: 1269,
    SpurAtk3: 670,
    SpurSpd1: 1273,
    SpurSpd2: 1274,
    SpurSpd3: 671,
    SpurDef1: 1264,
    SpurDef2: 1265,
    SpurDef3: 672,
    SpurRes1: 1276,
    SpurRes2: 1277,
    SpurRes3: 673,
    SpurAtkSpd1: 1270,
    SpurAtkSpd2: 674,
    SpurAtkDef2: 675,
    SpurAtkRes1: 1271,
    SpurAtkRes2: 676,
    SpurSpdDef1: 1142,
    SpurSpdDef2: 677,
    SpurSpdRes2: 678,
    SpurDefRes1: 1266,
    SpurDefRes2: 679,
    DriveAtk1: 1267,
    DriveAtk2: 680,
    DriveSpd1: 1272,
    DriveSpd2: 681,
    DriveDef1: 1245,
    DriveDef2: 682,
    DriveRes1: 1275,
    DriveRes2: 683,
    JointDriveAtk: 1184, // 攻撃の相互大紋章
    JointDriveSpd: 1357, // 速さの相互大紋章
    JointDriveRes: 1454, // 魔防の相互大紋章
    JointDriveDef: 1805, // 守備の相互大紋章
    // 十字紋章
    CrossSpurAtk: 1941, // 攻撃の十字紋章
    CrossSpurRes: 1967, // 魔防の十字紋章

    GoadArmor: 686, // 重刃の紋章
    WardArmor: 687, // 重盾の紋章
    GoadCavalry: 688,
    WardCavalry: 689,
    GoadFliers: 690,
    WardFliers: 691,
    GoadDragons: 692,
    WardDragons: 693,
    GoadBeasts: 844,
    WardBeasts: 842,

    SavageBlow1: 1364, // 死の吐息1
    SavageBlow2: 1365, // 死の吐息2
    SavageBlow3: 669, // 死の吐息3

    CloseGuard1: 1353, // 近距離警戒1
    CloseGuard2: 1354, // 近距離警戒2
    CloseGuard3: 684, // 近距離警戒3
    DistantGuard1: 1355,
    DistantGuard2: 1143, // 遠距離警戒2
    DistantGuard3: 685, // 遠距離警戒3
    JointDistGuard: 1823, // 遠距離相互警戒

    SorakaranoSendo3: 735,
    HikonoSendo3: 736,

    ThreatenAtk1: 1413,
    ThreatenAtk2: 1414,
    ThreatenAtk3: 718, // 攻撃の威嚇3
    ThreatenSpd1: 1415,
    ThreatenSpd2: 1416,
    ThreatenSpd3: 719,
    ThreatenDef1: 1411,
    ThreatenDef2: 1412,
    ThreatenDef3: 720,
    ThreatenRes1: 1417,
    ThreatenRes2: 1418,
    ThreatenRes3: 721,
    ThreatenAtkSpd2: 1766,
    ThreatenAtkSpd3: 979,
    ThreatenAtkRes3: 1068,
    ThreatenAtkDef2: 1487,
    ThreatenAtkDef3: 1124,
    ThreatenAtkRes2: 1691,
    ThreatenSpdDef2: 1758,
    ThreatenDefRes2: 1851,

    KodoNoGenen3: 909, // 鼓動の幻煙3

    // 指揮
    AtkTactic1: 1291,
    AtkTactic2: 1292,
    AtkTactic3: 706, // 攻撃の指揮3
    SpdTactic1: 1293,
    SpdTactic2: 1294,
    SpdTactic3: 707,
    DefTactic1: 1295,
    DefTactic2: 1296,
    DefTactic3: 708,
    ResTactic1: 1297,
    ResTactic2: 1298,
    ResTactic3: 709,
    // 重視
    InfSpdTactic: 2177, // 速指揮・歩行重視

    ArmorMarch3: 734, // 重装の行軍3

    OddAtkWave3: 710, // 攻撃の波・奇数3
    OddSpdWave3: 711,
    OddDefWave3: 712,
    OddResWave3: 713,
    EvenAtkWave3: 714, // 攻撃の波・偶数3
    EvenSpdWave3: 715,
    EvenDefWave3: 716,
    EvenResWave3: 717,

    HoneAtk3: 694, // 攻撃の鼓舞3
    HoneSpd3: 695,
    HoneDef3: 696,
    HoneRes3: 697,
    HoneAtk4: 795, // 攻撃の鼓舞4
    HoneSpd4: 853,
    HoneRes4: 1059,
    HoneDef4: 1369,
    HoneArmor: 698, // 重刃の鼓舞
    FortifyArmor: 699,
    HoneCavalry: 700,
    FortifyCavalry: 701,
    HoneFlyier: 702,
    FortifyFlyier: 703,
    HoneDragons: 704,
    FortifyDragons: 705,
    HoneBeasts: 807,
    FortifyBeasts: 808,

    JointHoneAtk: 989, // 相互鼓舞
    JointHoneSpd: 793, // 相互鼓舞
    JointHoneDef: 1015, // 相互鼓舞
    JointHoneRes: 1477,

    HokoNoKodo3: 731, // 歩行の鼓動3

    AtkSmoke1: 1403,
    AtkSmoke2: 1404,
    AtkSmoke3: 727, // 攻撃の紫煙3
    AtkSmoke4: 2076, // 攻撃の紫煙4
    SpdSmoke1: 1405,
    SpdSmoke2: 1406,
    SpdSmoke3: 728, // 速さの紫煙3
    SpdSmoke4: 2073, // 速さの紫煙4
    DefSmoke1: 1407,
    DefSmoke2: 1408,
    DefSmoke3: 729, // 守備の紫煙3
    ResSmoke1: 1409,
    ResSmoke2: 1410,
    ResSmoke3: 730, // 魔防の紫煙3
    DefResSmoke3: 2164, // 守備魔防の紫煙3

    AtkPloy3: 722, // 攻撃の謀策3
    SpdPloy3: 723, // 速さの謀策3
    DefPloy3: 724, // 守備の謀策3
    ResPloy3: 725, // 魔防の謀策3

    HajimariNoKodo3: 957,

    // 信義
    AtkSpdOath3: 1077, // 攻撃速さの信義3
    AtkSpdOath4: 2128, // 攻撃速さの信義4
    AtkDefOath3: 1045,
    AtkResOath3: 982,
    AtkResOath4: 2242, // 攻撃魔防の信義4
    DefResOath3: 1092,
    SpdDefOath3: 1233,
    SpdResOath3: 1602,

    // 開放
    AtkOpening3: 779,
    SpdOpening3: 815, // 速さの開放3
    DefOpening3: 885,
    ResOpening3: 827,
    SpdDefGap3: 1522, // 速さ守備の大開放3
    SpdResGap3: 1034, // 速さ魔防の大開放3
    AtkResGap3: 1006,
    DefResGap3: 1070,
    AtkSpdGap3: 1086,
    AtkDefGap3: 1159,

    PanicSmoke3: 1000, // 恐慌の幻煙3
    PanicSmoke4: 2273, // 恐慌の幻煙4

    // 奮起
    RouseAtkSpd3: 1510,
    RouseAtkDef3: 948,
    RouseDefRes3: 1036,
    RouseSpdRes3: 1127,
    RouseSpdDef3: 1157,
    RouseAtkRes3: 1314,
    RouseAtkSpd4: 1904, // 攻撃速さの奮起4
    RouseAtkDef4: 1943, // 攻撃守備の奮起4
    RouseAtkRes4: 2111, // 攻撃魔防の奮起4
    RouseSpdDef4: 1916, // 速さ守備の奮起4

    SeiNoIbuki3: 668, // 生の息吹3
    HokoNoGogeki3: 732, // 歩行の剛撃3
    HokoNoJugeki3: 733, // 歩行の柔撃3
    HokoNoKokyu3: 921, // 歩行の呼吸3
    HokoNoMajin3: 961, // 歩行の魔刃3
    InfNullFollow3: 2137, // 歩行の見切り追撃3

    ArmoredStride3: 1304, // 重装の遊撃3

    // 牽制
    AtkSpdRein3: 1448, // 攻撃速さの牽制3
    AtkSpdHold: 2277, // 攻撃速さの大牽制
    AtkDefRein3: 1519, // 攻撃守備の牽制3
    AtkDefHold: 2250, // 攻撃守備の大牽制
    AtkResRein3: 1490, // 攻撃魔防の牽制3
    AtkResHold: 2084, // 攻撃魔防の大牽制
    SpdDefRein3: 1485, // 速さ守備の牽制3
    SpdDefHold: 2197, // 速さ守備の大牽制
    SpdResRein3: 1538, // 速さ魔防の牽制3
    SpdResHold: 2029, // 速さ魔防の大牽制
    DefResRein3: 1787, // 守備魔防の牽制3
    DefResHold: 2294, // 守備魔防の大牽制

    OddTempest3: 1515, // 迅雷風烈・奇数3
    EvenTempest3: 1681, // 迅雷風烈・偶数3

    // 快癒
    OddRecovery1: 1580, // 快癒・奇数1
    OddRecovery2: 1579, // 快癒・奇数2
    OddRecovery3: 1570, // 快癒・奇数3
    EvenRecovery1: 1739, // 快癒・奇数1
    EvenRecovery2: 1740, // 快癒・奇数2
    EvenRecovery3: 1741, // 快癒・奇数3

    // 護り手
    AdFarSave3: 1993, // 鎧の護り手・遠間3
    ArFarSave3: 1634, // 兜の護り手・遠間3
    DrFarSave3: 1931, // 盾の護り手・遠間3
    AsNearSave3: 2226, // 刃の護り手・近間3
    DrNearSave3: 1636, // 盾の護り手・近間3
    AdNearSave3: 1667, // 鎧の護り手・近間3
    ArNearSave3: 1857, // 兜の護り手・近間3

    FatalSmoke3: 1631, // 不治の幻煙3

    // 脅嚇
    AtkSpdMenace: 1733, // 攻撃速さの脅嚇
    AtkDefMenace: 1708, // 攻撃守備の脅嚇
    AtkResMenace: 1710, // 攻撃魔防の脅嚇
    SpdDefMenace: 2113, // 速さ守備の脅嚇
    SpdResMenace: 2056, // 速さ魔防の脅嚇
    DefResMenace: 1728, // 守備魔防の脅嚇

    StallPloy3: 1789, // 空転の奇策3

    // 暗闘
    RedFeud3: 1918, // 赤への暗闘3
    BlueFeud3: 2053, // 青への暗闘3
    GreenFeud3: 1958, // 緑への暗闘3
    CFeud3: 1935, // 無への暗闇3

    // 再移動制限
    CantoControl3: 2067, // 再移動制限3

    // 一斉突撃
    AssaultTroop3: 2117, // 一斉突撃3

    // 専用
    SeimeiNoKagayaki: 773, // 生命の輝き
    SparklingBoostPlus: 1985, // 生命の輝き・神
    ChaosNamed: 868, // 我が名は混沌
    ChaosNamedPlus: 2244, // 我が名は混沌・神
    SurtrsMenace: 767, // 炎王の威嚇
    SurtrsPortent: 1792, // 炎王の脅嚇
    WithEveryone: 754, // みんなと一緒に
    WithEveryone2: 1879, // みんなと一緒に・承
    SolitaryDream: 898, // ひとりぼっちのゆめ
    DivineFang: 915, // 神竜王の牙
    DivineFangPlus: 2161, // 神竜王の牙・神
    KyokoNoKisaku3: 726, // 恐慌の奇策3
    AirOrders3: 819, // 先導の伝令・天3
    GroundOrders3: 911, // 先導の伝令・地3
    Upheaval: 823, // メガクェイク
    UpheavalPlus: 2070, // メガクェイク・神
    WoefulUpheaval: 2219, // 試練メガクェイク
    VisionOfArcadia: 933, // 理想郷となるように
    VisionOfArcadia2: 2243, // 理想郷となる…・承
    OstiasPulse: 753, // オスティアの鼓動
    OstiasPulse2: 1828, // 盟主の鼓動・承
    Jagan: 811, // 邪眼
    HitoNoKanouseiWo: 850, // 人の可能性を
    HumanVirtue2: 2124, // 人の可能性を!・承
    ImpenetrableDark: 1178, // 見通せぬ深き暗闇
    MilaNoHaguruma: 1352, // ミラの歯車
    InevitableDeath: 1420, // 死からは逃れられぬ
    WingsOfLight: 1622, // 光輝く翼
    OrdersRestraint: 1724, // 束縛、秩序、安定
    DomainOfIce: 1774, // 絶氷結界
    DomainOfFlame: 1848, // 絶炎結界
    EverlivingDomain: 2144, // 永生結界
    Worldbreaker: 1913, // 神槌大地を穿つ
    OpeningRetainer: 1922, // 開神の眷属
    GoddessBearer: 1939, // 女神を宿せし者
    HolyGround: 1977, // 地上の最後の女神
    FaithInHumanity: 2089, // 人の可能性を信じる
    DarklingGuardian: 2097, // 闇の樹海の守護竜
    OpenedDomain: 2151, // みんなが繋がる世界
    HeirToLight: 2171, // 光をつぐもの
    AllTogether: 2261, // ずっとみんなと一緒
    Severance: 2271, // すべてが閉じた世界
    FutureFocused: 2282, // 共に未来を見つめて
};

const PassiveS = {
    None: -1,
    HardyBearing1: 1244,
    HardyBearing2: 1144,
    HardyBearing3: 1074, // 不動の姿勢
    OgiNoKodou: 1078, // 奥義の鼓動
    ArmoredBoots: 1083, // 重装のブーツ
    RengekiBogyoKenYariOno3: 1080, // 連撃防御・剣槍斧3
    RengekiBogyoYumiAnki3: 1081, // 連撃防御・弓暗器3
    RengekiBogyoMado3: 1082, // 連撃防御・魔道3
    HayasaNoKyosei1: 1434, // 速さの虚勢1
    HayasaNoKyosei2: 1435, // 速さの虚勢2
    HayasaNoKyosei3: 1079, // 速さの虚勢3
    MaboNoKyosei1: 1431, // 魔防の虚勢1
    MaboNoKyosei2: 1432, // 魔防の虚勢2
    MaboNoKyosei3: 1433, // 魔防の虚勢3
    GoeiNoGuzo: 1396, // 護衛の偶像
    TozokuNoGuzoRakurai: 1397, // 盗賊の偶像
    TozokuNoGuzoKobu: 1398,
    TozokuNoGuzoKogun: 1399,
    TozokuNoGuzoKusuri: 1400,
    TozokuNoGuzoOugi: 1401,
    TozokuNoGuzoOdori: 1402,
};

// 隊長スキル
const Captain = {
    None: -1,
    EarthRendering: 1971, // 震天動地
    SecretManeuver: 1972, // 竜跳虎臥
    AdroitCaptain: 1970, // 暗中飛躍
    Erosion: 1975, // 水滴石穿
    Eminence: 1974, // 天地万有
    QuickDraw: 1973, // 先手必勝
    Effulgence: 1995, // 光輝燦然
    Turmoil: 1994, // 疾風怒濤
    FlashOfSteel: 2019, // 紫電一閃
    RallyingCry: 2018, // 叱咤激励
    MassConfusion: 2044, // 空花乱墜
    StormOfBlows: 2098, // 雷轟電撃
    Dauntless: 2181, // 剛毅果断
};


const PhysicalWeaponTypeDict = {};
PhysicalWeaponTypeDict[WeaponType.Sword] = 0;
PhysicalWeaponTypeDict[WeaponType.Lance] = 0;
PhysicalWeaponTypeDict[WeaponType.Axe] = 0;
PhysicalWeaponTypeDict[WeaponType.RedBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.BlueBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.GreenBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.ColorlessBeast] = 0;
PhysicalWeaponTypeDict[WeaponType.RedBow] = 0;
PhysicalWeaponTypeDict[WeaponType.BlueBow] = 0;
PhysicalWeaponTypeDict[WeaponType.GreenBow] = 0;
PhysicalWeaponTypeDict[WeaponType.ColorlessBow] = 0;
PhysicalWeaponTypeDict[WeaponType.RedDagger] = 0;
PhysicalWeaponTypeDict[WeaponType.BlueDagger] = 0;
PhysicalWeaponTypeDict[WeaponType.GreenDagger] = 0;
PhysicalWeaponTypeDict[WeaponType.ColorlessDagger] = 0;

/// 武器タイプが物理系の武器であるかを判定します。
function isPhysicalWeaponType(weaponType) {
    return weaponType in PhysicalWeaponTypeDict;
}

/// 武器錬成タイプが特殊錬成であるかを判定します。
function isWeaponSpecialRefined(weaponRefinementType) {
    switch (weaponRefinementType) {
        case WeaponRefinementType.Special:
        case WeaponRefinementType.Special_Hp3:
            return true;
        default:
            return false;
    }
}

const FiresweepWeaponDict = {};
FiresweepWeaponDict[Weapon.SoleilsShine] = 0;
FiresweepWeaponDict[Weapon.MiraiNoSeikishiNoYari] = 0;
FiresweepWeaponDict[Weapon.FiresweepSword] = 0;
FiresweepWeaponDict[Weapon.FiresweepSwordPlus] = 0;
FiresweepWeaponDict[Weapon.FiresweepLance] = 0;
FiresweepWeaponDict[Weapon.FiresweepLancePlus] = 0;
FiresweepWeaponDict[Weapon.FiresweepBow] = 0;
FiresweepWeaponDict[Weapon.FiresweepBowPlus] = 0;
FiresweepWeaponDict[Weapon.FiresweepAxePlus] = 0;

/// 自身、敵共に反撃不可になる武器であるかどうかを判定します。
function isFiresweepWeapon(weapon) {
    return weapon in FiresweepWeaponDict;
}

/// 補助スキルの射程を取得します。
function getAssistRange(support) {
    switch (support) {
        case Support.None:
            return 0;
        case Support.Physic:
        case Support.PhysicPlus:
            return 2;
        case Support.FoulPlay:
            return 3;
        default: return 1;
    }
}

/// 補助スキルが大応援かどうかを判定します。
function isRallyUp(support) {
    switch (support) {
        case Support.RallyUpAtk:
        case Support.RallyUpAtkPlus:
        case Support.RallyUpSpd:
        case Support.RallyUpSpdPlus:
        case Support.RallyUpDef:
        case Support.RallyUpDefPlus:
        case Support.RallyUpRes:
        case Support.RallyUpResPlus:
            return true;
        default:
            return false;
    }
}

/// 応援スキルの攻撃の強化量を取得します。
function getAtkBuffAmount(support) {
    switch (support) {
        case Support.RallyAttack: return 4;
        case Support.RallyUpAtk: return 4;
        case Support.RallyUpAtkPlus: return 6;
        case Support.RallyAtkSpd: return 3;
        case Support.RallyAtkDef: return 3;
        case Support.RallyAtkRes: return 3;
        case Support.RallyAtkSpdPlus:
        case Support.RallyAtkDefPlus:
        case Support.RallyAtkResPlus:
            return 6;
        default: return 0;
    }
}
/// 応援スキルの速さの強化量を取得します。
function getSpdBuffAmount(support) {
    switch (support) {
        case Support.RallySpeed: return 4;
        case Support.RallyUpSpd: return 4;
        case Support.RallyUpSpdPlus: return 6;
        case Support.RallyAtkSpd: return 3;
        case Support.RallySpdDef: return 3;
        case Support.RallySpdRes: return 3;
        case Support.RallySpdResPlus:
        case Support.RallySpdDefPlus:
        case Support.RallyAtkSpdPlus:
            return 6;
        default: return 0;
    }
}
/// 応援スキルの守備の強化量を取得します。
function getDefBuffAmount(support) {
    switch (support) {
        case Support.RallyUpDef: return 4;
        case Support.RallyUpDefPlus: return 6;
        case Support.RallyDefense: return 4;
        case Support.RallySpdDef: return 3;
        case Support.RallyAtkDef: return 3;
        case Support.RallyDefRes: return 3;
        case Support.RallyAtkDefPlus:
        case Support.RallySpdDefPlus:
        case Support.RallyDefResPlus:
            return 6;
        default: return 0;
    }
}
/// 応援スキルの魔防の強化量を取得します。
function getResBuffAmount(support) {
    switch (support) {
        case Support.RallyUpRes: return 4;
        case Support.RallyUpResPlus: return 6;
        case Support.RallyResistance: return 4;
        case Support.RallyDefRes: return 3;
        case Support.RallySpdRes: return 3;
        case Support.RallyAtkRes: return 3;
        case Support.RallySpdResPlus:
        case Support.RallyDefResPlus:
        case Support.RallyAtkResPlus:
            return 6;
        default: return 0;
    }
}
/// 回復系の補助スキルの戦闘前補助実行可能な回復量を取得します。
/// https://vervefeh.github.io/FEH-AI/charts.html#chartF
function getPrecombatHealThreshold(support) {
    switch (support) {
        case Support.MaidensSolace:
        case Support.Sacrifice:
            return 1;
        case Support.Heal:
            return 5;
        case Support.Reconcile:
            return 7;
        case Support.Physic:
            return 8;
        case Support.PhysicPlus:
        case Support.Rehabilitate:
        case Support.RehabilitatePlus:
        case Support.Martyr:
        case Support.MartyrPlus:
        case Support.Recover:
        case Support.RecoverPlus:
        case Support.Restore:
        case Support.RestorePlus:
        case Support.Rescue:
        case Support.RescuePlus:
        case Support.Mend:
        case Support.Return:
        case Support.ReturnPlus:
        case Support.Nudge:
        case Support.NudgePlus:
            return 10;
        default:
            return -1;
    }
}

const RangedAttackSpecialDict = {};
RangedAttackSpecialDict[Special.GrowingFlame] = 0;
RangedAttackSpecialDict[Special.GrowingLight] = 0;
RangedAttackSpecialDict[Special.GrowingWind] = 0;
RangedAttackSpecialDict[Special.GrowingThunder] = 0;
RangedAttackSpecialDict[Special.BlazingFlame] = 0;
RangedAttackSpecialDict[Special.BlazingLight] = 0;
RangedAttackSpecialDict[Special.BlazingWind] = 0;
RangedAttackSpecialDict[Special.BlazingThunder] = 0;
RangedAttackSpecialDict[Special.RisingFlame] = 0;
RangedAttackSpecialDict[Special.RisingLight] = 0;
RangedAttackSpecialDict[Special.RisingWind] = 0;
RangedAttackSpecialDict[Special.RisingThunder] = 0;
RangedAttackSpecialDict[Special.GiftedMagic] = 0;

/// 範囲奥義かどうかを判定します。
function isRangedAttackSpecial(special) {
    return special in RangedAttackSpecialDict;
}

const RangedAttackSpecialDamageRateDict = {};
RangedAttackSpecialDamageRateDict[Special.GrowingFlame] = 1;
RangedAttackSpecialDamageRateDict[Special.GrowingLight] = 1;
RangedAttackSpecialDamageRateDict[Special.GrowingWind] = 1;
RangedAttackSpecialDamageRateDict[Special.GrowingThunder] = 1;
RangedAttackSpecialDamageRateDict[Special.BlazingFlame] = 1.5;
RangedAttackSpecialDamageRateDict[Special.BlazingLight] = 1.5;
RangedAttackSpecialDamageRateDict[Special.BlazingWind] = 1.5;
RangedAttackSpecialDamageRateDict[Special.BlazingThunder] = 1.5;
RangedAttackSpecialDamageRateDict[Special.RisingFlame] = 1;
RangedAttackSpecialDamageRateDict[Special.RisingLight] = 1;
RangedAttackSpecialDamageRateDict[Special.RisingWind] = 1;
RangedAttackSpecialDamageRateDict[Special.RisingThunder] = 1;
RangedAttackSpecialDamageRateDict[Special.GiftedMagic] = 0.8;

function getRangedAttackSpecialDamageRate(special) {
    let rate = RangedAttackSpecialDamageRateDict[special];
    if (rate) {
        return rate;
    }
    return 0;
}

const DefenseSpecialDict = {};
DefenseSpecialDict[Special.Nagatate] = 0;
DefenseSpecialDict[Special.Otate] = 0;  // 大盾
DefenseSpecialDict[Special.Kotate] = 0; // 小盾
DefenseSpecialDict[Special.Seitate] = 0; // 聖盾
DefenseSpecialDict[Special.Seii] = 0;  // 聖衣
DefenseSpecialDict[Special.Seikabuto] = 0; // 聖兜
DefenseSpecialDict[Special.IceMirror] = 0;
DefenseSpecialDict[Special.IceMirror2] = 0;
DefenseSpecialDict[Special.NegatingFang] = 0;
DefenseSpecialDict[Special.GodlikeReflexes] = 0;

/// 防御系の奥義かどうかを判定します。
function isDefenseSpecial(special) {
    return special in DefenseSpecialDict;
}

const NormalAttackSpecialDict = {};
NormalAttackSpecialDict[Special.Moonbow] = 0;
NormalAttackSpecialDict[Special.Luna] = 0;
NormalAttackSpecialDict[Special.Aether] = 0;
NormalAttackSpecialDict[Special.LunaFlash] = 0;
NormalAttackSpecialDict[Special.LunarFlash2] = 0;
NormalAttackSpecialDict[Special.Glimmer] = 0;
NormalAttackSpecialDict[Special.Deadeye] = 0;
NormalAttackSpecialDict[Special.Astra] = 0;
NormalAttackSpecialDict[Special.Bonfire] = 0;
NormalAttackSpecialDict[Special.Ignis] = 0;
NormalAttackSpecialDict[Special.Iceberg] = 0;
NormalAttackSpecialDict[Special.Glacies] = 0;
NormalAttackSpecialDict[Special.CircletOfBalance] = 0;
NormalAttackSpecialDict[Special.HolyKnightAura] = 0;
NormalAttackSpecialDict[Special.DraconicAura] = 0;
NormalAttackSpecialDict[Special.DragonFang] = 0;
NormalAttackSpecialDict[Special.Enclosure] = 0; // 閉界
NormalAttackSpecialDict[Special.Sirius] = 0; // 天狼
NormalAttackSpecialDict[Special.SiriusPlus] = 0; // 天狼
NormalAttackSpecialDict[Special.RupturedSky] = 0; // 破天
NormalAttackSpecialDict[Special.TwinBlades] = 0; // 双刃
NormalAttackSpecialDict[Special.Taiyo] = 0;
NormalAttackSpecialDict[Special.Yuyo] = 0;
NormalAttackSpecialDict[Special.RegnalAstra] = 0; // 剣姫の流星
NormalAttackSpecialDict[Special.ImperialAstra] = 0; // 剣皇の流星
NormalAttackSpecialDict[Special.VitalAstra] = 0; // 心流星
NormalAttackSpecialDict[Special.OpenTheFuture] = 0; // 開世
NormalAttackSpecialDict[Special.Fukusyu] = 0; // 復讐
NormalAttackSpecialDict[Special.Kessyu] = 0; // 血讐
NormalAttackSpecialDict[Special.Kagetsuki] = 0; // 影月
NormalAttackSpecialDict[Special.Setsujoku] = 0; // 雪辱
NormalAttackSpecialDict[Special.Hyouten] = 0; // 氷点
NormalAttackSpecialDict[Special.Youkage] = 0; // 陽影
NormalAttackSpecialDict[Special.Hotarubi] = 0; // 蛍火
NormalAttackSpecialDict[Special.ShiningEmblem] = 0; // 光炎の紋章
NormalAttackSpecialDict[Special.HonoNoMonsyo] = 0; // 炎の紋章
NormalAttackSpecialDict[Special.HerosBlood] = 0;
NormalAttackSpecialDict[Special.KuroNoGekko] = 0; // 黒の月光
NormalAttackSpecialDict[Special.Lethality] = 0; // 滅殺
NormalAttackSpecialDict[Special.AoNoTenku] = 0; // 蒼の天空
NormalAttackSpecialDict[Special.RadiantAether2] = 0; // 蒼の天空・承
NormalAttackSpecialDict[Special.MayhemAether] = 0; // 暴の天空
NormalAttackSpecialDict[Special.Hoshikage] = 0; // 星影
NormalAttackSpecialDict[Special.Fukuryu] = 0; // 伏竜
NormalAttackSpecialDict[Special.BlueFrame] = 0; // ブルーフレイム
NormalAttackSpecialDict[Special.SeidrShell] = 0; // 魔弾
NormalAttackSpecialDict[Special.BrutalShell] = 0; // 凶弾
NormalAttackSpecialDict[Special.RighteousWind] = 0;
NormalAttackSpecialDict[Special.SublimeHeaven] = 0;
NormalAttackSpecialDict[Special.DevinePulse] = 0;

/// 戦闘中に発動する攻撃系の奥義かどうかを判定します。
function isNormalAttackSpecial(special) {
    return special in NormalAttackSpecialDict;
}

/// 再行動補助スキルかどうかを判定します。
function isRefreshSupportSkill(skillId) {
    switch (skillId) {
        case Support.DragonsDance:
        case Support.CallToFlame:
        case Support.Sing:
        case Support.Dance:
        case Support.GrayWaves:
        case Support.GentleDream:
        case Support.WhimsicalDream:
        case Support.SweetDreams:
        case Support.FrightfulDream:
        case Support.Play:
            return true;
        default:
            return false;
    }
}

const BowWeaponTypeTable = {}
BowWeaponTypeTable[WeaponType.RedBow] = 0;
BowWeaponTypeTable[WeaponType.BlueBow] = 0;
BowWeaponTypeTable[WeaponType.GreenBow] = 0;
BowWeaponTypeTable[WeaponType.ColorlessBow] = 0;
BowWeaponTypeTable[WeaponType.Bow] = 0;

/// 武器タイプが弓であるかを判定します。
function isWeaponTypeBow(type) {
    return type in BowWeaponTypeTable;
}

const DaggerWeaponTypeTable = {}
DaggerWeaponTypeTable[WeaponType.RedDagger] = 0;
DaggerWeaponTypeTable[WeaponType.BlueDagger] = 0;
DaggerWeaponTypeTable[WeaponType.GreenDagger] = 0;
DaggerWeaponTypeTable[WeaponType.ColorlessDagger] = 0;
DaggerWeaponTypeTable[WeaponType.Dagger] = 0;

/// 武器タイプが暗器であるかを判定します。
function isWeaponTypeDagger(type) {
    return type in DaggerWeaponTypeTable;
}

const TomeWeaponTypeTable = {}
TomeWeaponTypeTable[WeaponType.RedTome] = 0;
TomeWeaponTypeTable[WeaponType.BlueTome] = 0;
TomeWeaponTypeTable[WeaponType.GreenTome] = 0;
TomeWeaponTypeTable[WeaponType.ColorlessTome] = 0;
TomeWeaponTypeTable[WeaponType.Tome] = 0;

/// 武器タイプが魔法であるかを判定します。
function isWeaponTypeTome(type) {
    return type in TomeWeaponTypeTable;
}

const BreathWeaponTypeTable = {}
BreathWeaponTypeTable[WeaponType.RedBreath] = 0;
BreathWeaponTypeTable[WeaponType.BlueBreath] = 0;
BreathWeaponTypeTable[WeaponType.GreenBreath] = 0;
BreathWeaponTypeTable[WeaponType.ColorlessBreath] = 0;
BreathWeaponTypeTable[WeaponType.Breath] = 0;

/// 武器タイプが竜であるかを判定します。
function isWeaponTypeBreath(type) {
    return type in BreathWeaponTypeTable;
}

const BeastWeaponTypeTable = {}
BeastWeaponTypeTable[WeaponType.RedBeast] = 0;
BeastWeaponTypeTable[WeaponType.BlueBeast] = 0;
BeastWeaponTypeTable[WeaponType.GreenBeast] = 0;
BeastWeaponTypeTable[WeaponType.ColorlessBeast] = 0;
BeastWeaponTypeTable[WeaponType.Beast] = 0;

/// 武器タイプが獣であるかを判定します。
function isWeaponTypeBeast(type) {
    return type in BeastWeaponTypeTable;
}

/// 武器タイプが2距離射程の武器であるかを判定します。
function isRangedWeaponType(weaponType) {
    return !isMeleeWeaponType(weaponType);
}

const MeleeWeaponTypeTable = {};
MeleeWeaponTypeTable[WeaponType.Sword] = 0;
MeleeWeaponTypeTable[WeaponType.Axe] = 0;
MeleeWeaponTypeTable[WeaponType.Lance] = 0;
MeleeWeaponTypeTable[WeaponType.RedBeast] = 0;
MeleeWeaponTypeTable[WeaponType.BlueBeast] = 0;
MeleeWeaponTypeTable[WeaponType.GreenBeast] = 0;
MeleeWeaponTypeTable[WeaponType.ColorlessBeast] = 0;
MeleeWeaponTypeTable[WeaponType.RedBreath] = 0;
MeleeWeaponTypeTable[WeaponType.BlueBreath] = 0;
MeleeWeaponTypeTable[WeaponType.GreenBreath] = 0;
MeleeWeaponTypeTable[WeaponType.ColorlessBreath] = 0;
MeleeWeaponTypeTable[WeaponType.Breath] = 0;
MeleeWeaponTypeTable[WeaponType.Beast] = 0;

/// 武器タイプが1距離射程の武器であるかを判定します。
function isMeleeWeaponType(weaponType) {
    return weaponType in MeleeWeaponTypeTable;
}

/// 武器タイプが竜、もしくは獣であるかを判定します。
function isWeaponTypeBreathOrBeast(type) {
    return isWeaponTypeBeast(type) || isWeaponTypeBreath(type);
}

/// 武器タイプが継承可能であるかを判定します。
function isInheritableWeaponType(targetType, types) {
    for (let type of types) {
        if (type == targetType) {
            return true;
        }
        switch (type) {
            case WeaponType.All:
                return true;
            case WeaponType.ExceptStaff:
                if (targetType != WeaponType.Staff) {
                    return true;
                }
                break;
            case WeaponType.Bow:
                if (isWeaponTypeBow(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Dagger:
                if (isWeaponTypeDagger(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Tome:
                if (isWeaponTypeTome(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Beast:
                if (isWeaponTypeBeast(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Breath:
                if (isWeaponTypeBreath(targetType)) {
                    return true;
                }
                break;
        }
    }
    return false;
}

const WeaponTypeToColorType = {};
WeaponTypeToColorType[WeaponType.Sword] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedTome] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedBreath] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedBeast] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedBow] = ColorType.Red;
WeaponTypeToColorType[WeaponType.RedDagger] = ColorType.Red;
WeaponTypeToColorType[WeaponType.Lance] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueTome] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueBreath] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueBeast] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueBow] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.BlueDagger] = ColorType.Blue;
WeaponTypeToColorType[WeaponType.Axe] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenTome] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenBreath] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenBeast] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenBow] = ColorType.Green;
WeaponTypeToColorType[WeaponType.GreenDagger] = ColorType.Green;
WeaponTypeToColorType[WeaponType.Staff] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessTome] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessBreath] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessBeast] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessBow] = ColorType.Colorless;
WeaponTypeToColorType[WeaponType.ColorlessDagger] = ColorType.Colorless;
function getColorFromWeaponType(weaponType) {
    return WeaponTypeToColorType[weaponType];
}

function stringToWeaponType(input) {
    switch (input) {
        case "剣": return WeaponType.Sword;
        case "槍": return WeaponType.Lance;
        case "斧": return WeaponType.Axe;
        case "無魔": return WeaponType.ColorlessTome;
        case "赤魔": return WeaponType.RedTome;
        case "青魔": return WeaponType.BlueTome;
        case "緑魔": return WeaponType.GreenTome;
        case "赤竜": return WeaponType.RedBreath;
        case "青竜": return WeaponType.BlueBreath;
        case "緑竜": return WeaponType.GreenBreath;
        case "無竜": return WeaponType.ColorlessBreath;
        case "杖": return WeaponType.Staff;
        case "暗器": return WeaponType.ColorlessDagger;
        case "赤暗器": return WeaponType.RedDagger;
        case "青暗器": return WeaponType.BlueDagger;
        case "緑暗器": return WeaponType.GreenDagger;
        case "弓": return WeaponType.ColorlessBow;
        case "赤弓": return WeaponType.RedBow;
        case "青弓": return WeaponType.BlueBow;
        case "緑弓": return WeaponType.GreenBow;
        case "赤獣": return WeaponType.RedBeast;
        case "青獣": return WeaponType.BlueBeast;
        case "緑獣": return WeaponType.GreenBeast;
        case "獣": return WeaponType.ColorlessBeast;
        default:
            return WeaponType.None;
    }
}

function weaponTypeToString(weaponType) {
    switch (weaponType) {
        case WeaponType.Sword: return "剣";
        case WeaponType.ColorlessTome: return "無魔";
        case WeaponType.RedTome: return "赤魔";
        case WeaponType.RedBreath: return "赤竜";
        case WeaponType.RedBeast: return "赤獣";
        case WeaponType.RedBow: return "赤弓";
        case WeaponType.RedDagger: return "赤暗器";
        case WeaponType.Lance: return "槍";
        case WeaponType.BlueTome: return "青魔";
        case WeaponType.BlueBreath: return "青竜";
        case WeaponType.BlueBeast: return "青獣";
        case WeaponType.BlueBow: return "青弓";
        case WeaponType.BlueDagger: return "青暗器";
        case WeaponType.Axe: return "斧";
        case WeaponType.GreenTome: return "緑魔";
        case WeaponType.GreenBreath: return "緑竜";
        case WeaponType.GreenBeast: return "緑獣";
        case WeaponType.GreenBow: return "緑弓";
        case WeaponType.GreenDagger: return "緑暗器";
        case WeaponType.Staff: return "杖";
        case WeaponType.ColorlessBreath: return "竜";
        case WeaponType.ColorlessBeast: return "獣";
        case WeaponType.ColorlessBow: return "弓";
        case WeaponType.ColorlessDagger: return "暗器";
        case WeaponType.Breath: return "竜石";
        case WeaponType.Beast: return "獣";
        default:
            return "不明";
    }
}

/// 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
function canRallyForcibly(skill, unit) {
    switch (skill) {
        case Weapon.RetainersReport:
            if (unit.isWeaponSpecialRefined) {
                return true;
            }
            break;
        case Support.Uchikudakumono:
        case PassiveB.AtkFeint3:
        case PassiveB.SpdFeint3:
        case PassiveB.DefFeint3:
        case PassiveB.ResFeint3:
        case PassiveB.AtkSpdRuse3:
        case PassiveB.AtkDefRuse3:
        case PassiveB.AtkResRuse3:
        case PassiveB.DefResRuse3:
        case PassiveB.SpdResRuse3:
        case PassiveB.SpdDefRuse3:
            return true;
        default:
            return false;
    }
}

/// 戦闘前に発動するスペシャルであるかどうかを判定します。
function isPrecombatSpecial(special) {
    return isRangedAttackSpecial(special);
}

// 二分探索したいだけで値はどうでもいいので0を入れておきます
const TeleportationSkillDict = {};
TeleportationSkillDict[Weapon.LanceOfHeroics] = 0;
TeleportationSkillDict[Weapon.FlowerLance] = 0;
TeleportationSkillDict[Weapon.FujinYumi] = 0;
TeleportationSkillDict[Weapon.Gurimowaru] = 0;
TeleportationSkillDict[Weapon.ApotheosisSpear] = 0;
TeleportationSkillDict[Weapon.AstralBreath] = 0;
TeleportationSkillDict[Weapon.Noatun] = 0;
TeleportationSkillDict[Weapon.HinokaNoKounagitou] = 0;
TeleportationSkillDict[Weapon.IzunNoKajitsu] = 0;
TeleportationSkillDict[PassiveB.TeniNoKona] = 0;
TeleportationSkillDict[PassiveB.Kyuen2] = 0;
TeleportationSkillDict[PassiveB.Kyuen3] = 0;
TeleportationSkillDict[PassiveB.Ridatsu3] = 0;
TeleportationSkillDict[PassiveB.KyokugiHiKo1] = 0;
TeleportationSkillDict[PassiveB.KyokugiHiKo2] = 0;
TeleportationSkillDict[PassiveB.KyokugiHiKo3] = 0;
TeleportationSkillDict[PassiveB.HentaiHiko1] = 0;
TeleportationSkillDict[PassiveB.HentaiHiko2] = 0;
TeleportationSkillDict[PassiveB.HentaiHiko3] = 0;
TeleportationSkillDict[PassiveC.SorakaranoSendo3] = 0;
TeleportationSkillDict[PassiveC.HikonoSendo3] = 0;
TeleportationSkillDict[PassiveC.OpeningRetainer] = 0;
TeleportationSkillDict[Weapon.SilentPower] = 0;
/// テレポート効果を持つスキルであるかどうかを判定します。
function isTeleportationSkill(skillId) {
    return skillId in TeleportationSkillDict;
}

/// 天駆の道の効果を持つスキルかどうか
function hasPathfinderEffect(skillId) {
    switch (skillId) {
        case Weapon.JotnarBow:
        case Weapon.Hrimfaxi:
        case Weapon.Skinfaxi:
        case Captain.Eminence:
            return true;
        default:
            return false;
    }
}

/// 「自分の最大HP-現HPの〇%を奥義ダメージに加算」の割合を0～1で返します。
function getSelfDamageDealtRateToAddSpecialDamage(skillId) {
    switch (skillId) {
        case Special.Fukusyu:
            return 0.5;
        case Special.Setsujoku:
        case Special.Kessyu:
            return 0.3;
        default:
            return 0;
    }
}

const TriangleAdeptDict = {};
TriangleAdeptDict[PassiveA.AishoGekika3] = 0;
TriangleAdeptDict[Weapon.AsahiNoKen] = 0;
TriangleAdeptDict[Weapon.AsahiNoKenPlus] = 0;
TriangleAdeptDict[Weapon.SoukaiNoYari] = 0;
TriangleAdeptDict[Weapon.SoukaiNoYariPlus] = 0;
TriangleAdeptDict[Weapon.ShinryokuNoOno] = 0;
TriangleAdeptDict[Weapon.ShinryokuNoOnoPlus] = 0;
TriangleAdeptDict[Weapon.WakakiMogyuNoYari] = 0;
TriangleAdeptDict[Weapon.WakakiKurohyoNoKen] = 0;
TriangleAdeptDict[Weapon.ShinginNoSeiken] = 0;
TriangleAdeptDict[Weapon.YoheidanNoSenfu] = 0;

/// 相性激化3の効果を標準で発動できるすきるかどうかを判定します。
function isTriangleAdeptSkill(skillId) {
    return skillId in TriangleAdeptDict;
}
const EvalSpdAddDict = {};
EvalSpdAddDict[PassiveS.HayasaNoKyosei1] = 5;
EvalSpdAddDict[PassiveS.HayasaNoKyosei2] = 8;
EvalSpdAddDict[PassiveS.HayasaNoKyosei3] = 10;
EvalSpdAddDict[Weapon.SharpWarSword] = 10;

/// 速さ比較時の速さ加算値を取得します。
function getEvalSpdAdd(unit) {
    let amount = 0;
    for (let skillId of unit.enumerateSkills()) {
        let value = EvalSpdAddDict[skillId];
        amount += value ? value : 0;
    }
    return amount;
}

const EvalResAddDict = {};
EvalResAddDict[PassiveS.MaboNoKyosei1] = 5;
EvalResAddDict[PassiveS.MaboNoKyosei2] = 8;
EvalResAddDict[PassiveS.MaboNoKyosei3] = 10;

/// 魔防比較時の速さ加算値を取得します。
function getEvalResAdd(passiveS) {
    let value = EvalResAddDict[passiveS];
    return value ? value : 0;
}

const WeaponTypesAddAtk2AfterTransform = {};
WeaponTypesAddAtk2AfterTransform[Weapon.FangOfFinality] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.HeraldingHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.EnclosingClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.FieryFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RoyalHatariFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.HornOfOpening] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.PolishedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.SparklingFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.EbonPirateClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.CrossbonesClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ResolvedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RefreshedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RenewedFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.RaydreamHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.BrightmareHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.NightmareHorn] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.BrazenCatFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TaguelFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TaguelChildFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.FoxkitFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.NewBrazenCatFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.NewFoxkitFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.KarasuOuNoHashizume] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TakaouNoHashizume] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.YoukoohNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.JunaruSenekoNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ShishiouNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TrasenshiNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.JinroMusumeNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.JinroOuNoTsumekiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.OkamijoouNoKiba] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.ShirasagiNoTsubasa] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.SeijuNoKeshinHiko] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.BridesFang] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.GroomsWings] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.SkyPirateClaw] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.TwinCrestPower] = 0;
WeaponTypesAddAtk2AfterTransform[Weapon.IlluminatingHorn] = 0;

function isWeaponTypeThatCanAddAtk2AfterTransform(weapon) {
    return weapon in WeaponTypesAddAtk2AfterTransform;
}

// 化身による共通の効果
// TODO 残りも実装する
const BeastCommonSkillType = {
    InfantryMelee: 0, // 初期の歩行近接
    InfantryMelee2: 1, // アシュ以降の歩行近接
    InfantryMelee2IfRefined: 2, // 錬成して次世代になる歩行近接
}
const BeastCommonSkillMap =
    new Map(
        [
            // 次世代歩行
            [Weapon.HeraldingHorn, BeastCommonSkillType.InfantryMelee2],
            [Weapon.FieryFang, BeastCommonSkillType.InfantryMelee2],
            [Weapon.WildTigerFang, BeastCommonSkillType.InfantryMelee2],
            [Weapon.RoyalHatariFang, BeastCommonSkillType.InfantryMelee2],
            [Weapon.PolishedFang, BeastCommonSkillType.InfantryMelee2],
            [Weapon.HornOfOpening, BeastCommonSkillType.InfantryMelee2],
            [Weapon.IlluminatingHorn, BeastCommonSkillType.InfantryMelee2],

            // 錬成すると次世代歩行
            [Weapon.JinroOuNoTsumekiba, BeastCommonSkillType.InfantryMelee2IfRefined],
            [Weapon.OkamijoouNoKiba, BeastCommonSkillType.InfantryMelee2IfRefined],
            [Weapon.JinroMusumeNoTsumekiba, BeastCommonSkillType.InfantryMelee2IfRefined],
            [Weapon.TrasenshiNoTsumekiba, BeastCommonSkillType.InfantryMelee2IfRefined],

            // 旧世代歩行
            [Weapon.RenewedFang, BeastCommonSkillType.InfantryMelee],
            [Weapon.BridesFang, BeastCommonSkillType.InfantryMelee],
            [Weapon.GroomsWings, BeastCommonSkillType.InfantryMelee],
        ]
    );

const AdvantageousAgainstColorlessWeaponTable = {};
AdvantageousAgainstColorlessWeaponTable[Weapon.EtherealBreath] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.KinsekiNoSyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.GunshiNoRaisyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.KokukarasuNoSyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.GunshiNoFusho] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Blarraven] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.BlarravenPlus] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Gronnraven] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.GronnravenPlus] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Rauarraven] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.RauarravenPlus] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.YukyuNoSyo] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.Nagurufaru] = 0;
AdvantageousAgainstColorlessWeaponTable[Weapon.TomeOfOrder] = 0;

function isAdvantageousForColorless(weapon) {
    return weapon in AdvantageousAgainstColorlessWeaponTable;
}

const FeudSkillTable = {};
FeudSkillTable[PassiveC.RedFeud3] = 0;
FeudSkillTable[PassiveC.BlueFeud3] = 0;
FeudSkillTable[PassiveC.GreenFeud3] = 0;
FeudSkillTable[PassiveC.CFeud3] = 0;

/**
 * 暗闇スキルであるかどうかを取得します。
 * @param  {number} skillId
 * @return {boolean}
 */
function isFeudSkill(skillId) {
    return skillId in FeudSkillTable;
}



const BreakerSkillToTargetWeaponTypeTable = {};
BreakerSkillToTargetWeaponTypeTable[PassiveB.Swordbreaker3] = WeaponType.Sword;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Lancebreaker3] = WeaponType.Lance;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Axebreaker3] = WeaponType.Axe;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Bowbreaker3] = WeaponType.ColorlessBow;
BreakerSkillToTargetWeaponTypeTable[PassiveB.Daggerbreaker3] = WeaponType.ColorlessDagger;
BreakerSkillToTargetWeaponTypeTable[PassiveB.RedTomebreaker3] = WeaponType.RedTome;
BreakerSkillToTargetWeaponTypeTable[PassiveB.BlueTomebreaker3] = WeaponType.BlueTome;
BreakerSkillToTargetWeaponTypeTable[PassiveB.GreenTomebreaker3] = WeaponType.GreenTome;

function getBreakerSkillTargetWeaponType(breakerSkillId) {
    return BreakerSkillToTargetWeaponTypeTable[breakerSkillId];
}

/**
 * 入力した連想配列の値をキーとすると連想配列を作ります。
 * @param  {Object} sourceDict
 */
function __createValueDict(sourceDict) {
    let valueDict = {};
    Object.values(sourceDict).forEach((value, index, array) => valueDict[value] = value);
    return valueDict;
}

const WeaponValueDict = __createValueDict(Weapon);
const SupportValueDict = __createValueDict(Support);
const SpecialValueDict = __createValueDict(Special);
const PassiveAValueDict = __createValueDict(PassiveA);
const PassiveBValueDict = __createValueDict(PassiveB);
const PassiveCValueDict = __createValueDict(PassiveC);
const PassiveSValueDict = __createValueDict(PassiveS);
const CaptainValueDict = __createValueDict(Captain);

/// スキル情報です。ユニットの初期化等に使用します。
class SkillInfo {
    /**
     * @param  {String} id
     * @param  {String} name
     * @param  {Number} might
     * @param  {Number} specialCount
     * @param  {Number} hp
     * @param  {Number} atk
     * @param  {Number} spd
     * @param  {Number} def
     * @param  {Number} res
     * @param  {} effectives
     * @param  {} invalidatedEffectives
     * @param  {Number} cooldownCount
     * @param  {Number} atkCount
     * @param  {Number} counteratkCount
     * @param  {Boolean} canCounterattackToAllDistance
     * @param  {Boolean} isSacredSealAvailable
     * @param  {Number} mightRefine
     * @param  {Boolean} disableCounterattack
     * @param  {Boolean} wrathfulStaff
     * @param  {} assistType
     * @param  {Boolean} isNoAdditionalImplRequired
     * @param  {Number} specialRefineHpAdd
     * @param  {} weaponType
     * @param  {Number} sp
     * @param  {Boolean} canInherit
     * @param  {} inheritableWeaponTypes
     * @param  {} inheritableMoveTypes
     * @param  {Boolean} hasSpecialWeaponRefinement
     * @param  {Boolean} hasStatusWeaponRefinement
     * @param  {String} iconName
     * @param  {SkillType} skillType
     */
    constructor(id, name, might, specialCount, hp, atk, spd, def, res,
        effectives,
        invalidatedEffectives,
        cooldownCount,
        atkCount,
        counteratkCount,
        canCounterattackToAllDistance,
        isSacredSealAvailable,
        mightRefine,
        disableCounterattack,
        wrathfulStaff,
        assistType,
        isNoAdditionalImplRequired,
        specialRefineHpAdd,
        weaponType,
        sp,
        canInherit,
        inheritableWeaponTypes,
        inheritableMoveTypes,
        hasSpecialWeaponRefinement,
        hasStatusWeaponRefinement,
        iconName,
        skillType
    ) {
        this.id = id;
        this.detailPageUrl = "https://puarts.com/?fehskill=" + id;
        this.name = name;
        this.might = might;
        this.mightRefine = mightRefine;
        this.specialCount = specialCount;
        this.hp = hp;
        this.atk = atk;
        this.spd = spd;
        this.def = def;
        this.res = res;
        this.effectives = effectives;
        this.invalidatedEffectives = invalidatedEffectives;
        this.cooldownCount = cooldownCount;
        this.attackCount = atkCount;
        this.counterattackCount = counteratkCount;
        this.canCounterattackToAllDistance = canCounterattackToAllDistance;
        this.isSacredSealAvailable = isSacredSealAvailable;
        this.disableCounterattack = disableCounterattack;
        this.wrathfulStaff = wrathfulStaff;
        this.assistType = assistType;
        this.isAdditionalImplRequired = !isNoAdditionalImplRequired;
        this.specialRefineHpAdd = specialRefineHpAdd;
        this.weaponType = weaponType;

        /** @type {number} */
        this.sp = sp;
        this.canInherit = canInherit;
        this.inheritableWeaponTypes = inheritableWeaponTypes;
        this.inheritableMoveTypes = inheritableMoveTypes;
        this.hasSpecialWeaponRefinement = hasSpecialWeaponRefinement;
        this.hasStatusWeaponRefinement = hasStatusWeaponRefinement;

        this.type = skillType;
        this.weaponRefinementOptions = [];

        /** @type {String} */
        this.iconPath = this.__getSkillIconPath(iconName);

        // 英雄情報から必要に応じて設定する
        this.releaseDateAsNumber = 0;
    }

    /**
     * @returns {boolean}
     */
    isDuel4() {
        return this.name.includes("死闘")
            && this.name.endsWith("4");
    }

    /**
     * @returns {boolean}
     */
    isDuel3() {
        return this.name.includes("死闘")
            && this.name.endsWith("3");
    }

    /**
     * @returns {String}
     */
    getDisplayName() {
        if (this.isImplemented()) {
            return this.name;
        }
        else {
            return "×" + this.name;
        }
    }

    /**
     * 実装済みのスキルならtrue、そうでなければfalseを返します。
     * @returns {boolean}
     */
    isImplemented() {
        if (!this.isAdditionalImplRequired) {
            return true;
        }
        switch (this.type) {
            case SkillType.Weapon: return this.id in WeaponValueDict;
            case SkillType.Support: return this.id in SupportValueDict;
            case SkillType.Special: return this.id in SpecialValueDict;
            case SkillType.PassiveA: return this.id in PassiveAValueDict;
            case SkillType.PassiveB: return this.id in PassiveBValueDict;
            case SkillType.PassiveC: return this.id in PassiveCValueDict;
            case SkillType.PassiveS: return this.id in PassiveSValueDict;
            case SkillType.Captain: return this.id in CaptainValueDict;
            default:
                throw new Error("Invalid skill type");
        }
    }

    __getSkillIconPath(iconName) {
        const iconRoot = g_siteRootPath + "blog/images/FehSkillIcons/";
        switch (this.type) {
            case SkillType.Weapon: return iconRoot + "Weapon.png";
            case SkillType.Support: return iconRoot + "Support.png";
            case SkillType.Special: return iconRoot + "Special.png";
            case SkillType.PassiveA: return iconRoot + "PassiveA/" + iconName;
            case SkillType.PassiveB: return iconRoot + "PassiveB/" + iconName;
            case SkillType.PassiveC: return iconRoot + "PassiveC/" + iconName;
            case SkillType.PassiveS: return iconRoot + "SacredSeal/" + iconName;
            case SkillType.Captain: return iconRoot + "Captain/" + iconName;
            default:
                return "";
        }
    }
}
