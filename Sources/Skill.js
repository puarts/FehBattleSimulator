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
    WakakiKurohyoNoKen: 900, // 若き黒豹の槍
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
    GroomsWings: 1322, // 白鷺花嫁の翼
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

    // 2021年4月　武器錬成
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

    // 2021年5月　武器錬成
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
};

const Support = {
    None: -1,
    Reposition: 413,
    Smite: 414, // ぶちかまし
    Drawback: 415, // 引き寄せ
    Shove: 424, // 体当たり
    Swap: 416, // 入れ替え
    FutureVision: 433, // 未来を移す瞳
    Pivot: 422, // 回り込み
    ToChangeFate: 1152, // 運命を変える!

    Sing: 411, // 歌う
    Dance: 412, // 踊る
    GrayWaves: 789, // ユラリユルレリ
    GentleDream: 1061, // やさしいゆめ
    WhimsicalDream: 1362, // しろいゆめ
    SweetDreams: 1489, // あまいゆめ
    FrightfulDream: 1537, // こわいゆめ
    Play: 1135, // 奏でる

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
    RallyUpRes: 1154,
    RallyUpResPlus: 1153,
    RallyUpSpd: 1501, // 速さの大応援
    RallyUpSpdPlus: 1499, // 速さの大応援+

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
    Moonbow: 468,
    Luna: 467,
    Aether: 470,
    LunaFlash: 889,
    Glimmer: 462,
    Deadeye: 1481, // 狙撃
    Astra: 461,
    Bonfire: 455,
    Ignis: 450,
    Iceberg: 456,
    Glacies: 451,
    DraconicAura: 457,
    DragonFang: 452,
    Sirius: 956, // 天狼
    RupturedSky: 954, // 破天
    TwinBlades: 1043, // 双刃
    Taiyo: 493,
    Yuyo: 494,
    RegnalAstra: 465, // 剣姫の流星
    ImperialAstra: 1094, // 剣皇の流星
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
    AoNoTenku: 472, // 蒼の天空
    RadiantAether2: 1628, // 蒼の天空・承
    MayhemAether: 1309, // 暴の天空
    Hoshikage: 463, // 星影
    Fukuryu: 464, // 伏竜
    BlueFrame: 473, // ブルーフレイム
    SeidrShell: 1542, // 魔弾

    GrowingFlame: 485,
    GrowingLight: 486,
    GrowingWind: 487,
    GrowingThunder: 488,
    BlazingFlame: 481,
    BlazingLight: 482,
    BlazingWind: 483,
    BlazingThunder: 484,
    RisingFrame: 489, // 砕火
    RisingLight: 490,
    RisingWind: 491,
    RisingThunder: 492,
    GiftedMagic: 1582, // 天与の魔道

    NjorunsZeal: 1021, // ノヴァの聖戦士
    Galeforce: 496, // 疾風迅雷
    Miracle: 497, // 祈り

    Nagatate: 477, // 長盾
    Otate: 475, // 大盾
    Kotate: 479, // 小盾
    Seitate: 474, // 聖盾
    Seii: 478, // 聖衣
    Seikabuto: 476, // 聖兜
    KoriNoSeikyo: 480, // 氷の聖鏡
    IceMirror2: 1629, // 氷の聖鏡・承

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

    NegatingFang: 1469, // 反竜穿

    HolyKnightAura: 1702, // グランベルの聖騎士

    SublimeHeaven: 1752, // 覇天
};

const PassiveA = {
    None: -1,
    CloseCounter: 561, // 近距離反撃
    DistantCounter: 562, // 遠距離反撃
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
    SpdResBond1: 1333,
    SpdResBond2: 1334,
    SpdResBond3: 578,
    DefResBond1: 1335,
    DefResBond2: 1336,
    DefResBond3: 775,

    JaryuNoUroko: 585, // 邪竜の鱗
    DragonSkin2: 1754, // 邪竜の鱗・承
    Dragonscale: 1492, // 邪竜の大鱗

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
    OstiasCounter: 587, // オスティアの反撃

    // 防城戦
    AtkSpdBojosen3: 1473,
    AtkResBojosen3: 881,
    SpdDefBojosen3: 907,
    DefResBojosen3: 918,
    SpdResBojosen3: 962,
    AtkDefBojosen3: 1008,

    AtkDefKojosen3: 883, // 攻城戦
    AtkSpdKojosen3: 914,
    SpdResKojosen3: 925,

    // 連帯
    AtkDefUnity: 1450, // 攻撃守備の連帯
    AtkResUnity: 1575, // 攻撃魔防の連帯

    // 機先
    AtkSpdCatch4: 1647, // 攻撃速さの機先4
    AtkDefCatch4: 1703, // 攻撃守備の機先4
    DefResCatch4: 1761, // 守備魔防の機先4

    // 万全
    AtkSpdIdeal4: 1688, // 攻撃速さの万全4
    AtkDefIdeal4: 1705,
    AtkResIdeal4: 1723,
};

const PassiveB = {
    None: -1,
    QuickRiposte1: 1254, // 切り返し1
    QuickRiposte2: 1255, // 切り返し2
    QuickRiposte3: 599, // 切り返し3
    DragonWall3: 1621, // 竜鱗障壁3
    DragonsIre3: 1493, // 竜の逆鱗3
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
    ChillAtkSpd2: 1239, // 攻撃速さの封印2
    ChillSpdDef2: 1319, // 速さ守備の封印2
    ChillSpdRes2: 1371, // 速さ魔防の封印2
    ChillDefRes2: 1613, // 守備魔防の封印2

    BoldFighter3: 601, // 攻撃隊形3
    VengefulFighter3: 602, // 迎撃隊形3
    WaryFighter3: 600, // 守備隊形3
    SpecialFighter3: 603,// 奥義隊形3
    CraftFighter3: 1483, // 抑止隊形3
    SlickFighter3: 1497, // 正面隊形・自己3

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

    SealAtk1: 1455,
    SealAtk2: 1456,
    SealAtk3: 607,
    SealSpd1: 1457,
    SealSpd2: 1458,
    SealSpd3: 608,
    SealDef1: 1459,
    SealDef2: 1460,
    SealDef3: 609, // 守備封じ3
    SealRes1: 1461,
    SealRes2: 1462,
    SealRes3: 610, // 魔防封じ3
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
    SeimeiNoGofu3: 772, // 生命の護符

    ShisyaNoChojiriwo: 1114, // 死者の帳尻を
    YunesSasayaki: 976, // ユンヌの囁き
    SphiasSoul: 1076, // ソフィアの魂
    SDrink: 663, // Sドリンク
    BeokuNoKago: 656, // ベオクの加護

    TsuigekiTaikeiKisu3: 1009, // 追撃隊形・奇数3
    EvenFollowUp3: 1574, // 追撃隊形・偶数3

    HikariToYamito: 981, // 光と闇と

    GohoshiNoYorokobi1: 1252, // ご奉仕の喜び1
    GohoshiNoYorokobi2: 1253, // ご奉仕の喜び2
    GohoshiNoYorokobi3: 606, // ご奉仕の喜び3
    SeikishiNoKago: 657, // 聖騎士の加護
    Shishirenzan: 665, // 獅子連斬
    Bushido: 664, // 武士道
    Bushido2: 1693, // 武士道・承
    Recovering: 659, // リカバーリング
    TaiyoNoUdewa: 662, // 太陽の腕輪
    KyusyuTaikei3: 1072, // 急襲隊形3
    FuinNoTate: 666, // 封印の盾
    TeniNoKona: 661, // 転移の粉
    TsuigekiRing: 658, // 追撃リング
    TateNoKodo3: 634, // 盾の鼓動3
    AisyoSosatsu3: 626, // 相性相殺
    Sashitigae3: 598, // 差し違え3
    ShingunSoshi3: 593, // 進軍阻止3
    Surinuke3: 592, // すり抜け3
    Tenmakoku3: 1139, // 天馬行空3
    WyvernFlight3: 1529, // 飛竜行空3
    KodoNoHukanGusu3: 1136, // 鼓動の封緘・偶数3
    OddPulseTie3: 1321, // 鼓動の封緘・奇数3

    BeliefInLove: 1235, // 愛を信じますか?
    RagingStorm: 1303, // 狂嵐

    // 干渉
    AtkSpdSnag3: 1685, // 攻撃速さの干渉3
    AtkDefSnag3: 1587, // 攻撃守備の干渉3
    SpdResSnag3: 1367, // 速さ魔防の干渉3
    SpdDefSnag3: 1373, // 速さ守備の干渉3

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

    // 近影、遠影
    SpdDefNearTrace3: 1695, // 速さ守備の近影3
    AtkDefFarTrace3: 1715, // 攻撃守備の遠影3
    AtkResFarTrace3: 1746, // 攻撃魔防の遠影3
    SpdResFarTrace3: 1697, // 速さ魔防の遠影3

    // 怒涛
    FlowRefresh3: 1763, // 怒涛・再起3
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
    ThreatenAtkSpd3: 979,
    ThreatenAtkRes3: 1068,
    ThreatenAtkDef2: 1487,
    ThreatenAtkDef3: 1124,
    ThreatenAtkRes2: 1691,
    ThreatenSpdDef2: 1758,

    KodoNoGenen3: 909, // 鼓動の幻煙3

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
    SpdSmoke1: 1405,
    SpdSmoke2: 1406,
    SpdSmoke3: 728, // 速さの紫煙3
    DefSmoke1: 1407,
    DefSmoke2: 1408,
    DefSmoke3: 729, // 守備の紫煙3
    ResSmoke1: 1409,
    ResSmoke2: 1410,
    ResSmoke3: 730, // 魔防の紫煙3

    AtkPloy3: 722, // 攻撃の謀策3
    SpdPloy3: 723, // 速さの謀策3
    DefPloy3: 724, // 守備の謀策3
    ResPloy3: 725, // 魔防の謀策3

    HajimariNoKodo3: 957,

    // 信義
    AtkSpdOath3: 1077, // 攻撃速さの信義3
    AtkDefOath3: 1045,
    AtkResOath3: 982,
    DefResOath3: 1092,
    SpdDefOath3: 1233,
    SpdResOath3: 1602,

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

    // 奮起
    RouseAtkSpd3: 1510,
    RouseAtkDef3: 948,
    RouseDefRes3: 1036,
    RouseSpdRes3: 1127,
    RouseSpdDef3: 1157,
    RouseAtkRes3: 1314,

    SeiNoIbuki3: 668, // 生の息吹3
    HokoNoGogeki3: 732, // 歩行の剛撃3
    HokoNoJugeki3: 733, // 歩行の柔撃3
    HokoNoKokyu3: 921, // 歩行の呼吸3
    HokoNoMajin3: 961, // 歩行の魔刃3

    ArmoredStride3: 1304, // 重装の遊撃3

    // 牽制
    AtkSpdRein3: 1448, // 攻撃速さの牽制3
    AtkDefRein3: 1519, // 攻撃守備の牽制3
    AtkResRein3: 1490, // 攻撃魔防の牽制3
    SpdDefRein3: 1485, // 速さ守備の牽制3
    SpdResRein3: 1538, // 速さ魔防の牽制3

    OddTempest3: 1515, // 迅雷風烈・奇数3
    EvenTempest3: 1681, // 迅雷風烈・偶数3

    // 快癒
    OddRecovery1: 1580, // 快癒・奇数1
    OddRecovery2: 1579, // 快癒・奇数2
    OddRecovery3: 1570, // 快癒・奇数3
    EvenRecovery1: 1739, // 快癒・奇数1
    EvenRecovery2: 1740, // 快癒・奇数2
    EvenRecovery3: 1741, // 快癒・奇数3

    ArFarSave3: 1634, // 兜の護り手・遠間3
    DrNearSave3: 1636, // 盾の護り手・近間3
    AdNearSave3: 1667, // 鎧の護り手・近間3

    FatalSmoke3: 1631, // 不治の幻煙3

    // 脅嚇
    AtkSpdMenace: 1733, // 攻撃速さの脅嚇
    AtkDefMenace: 1708, // 攻撃守備の脅嚇
    AtkResMenace: 1710, // 攻撃魔防の脅嚇
    DefResMenace: 1728, // 守備魔防の脅嚇

    // 専用
    SeimeiNoKagayaki: 773,
    ChaosNamed: 868, // 我が名は混沌
    SurtrsMenace: 767, // 炎王の威嚇
    WithEveryone: 754, // みんなと一緒に
    SolitaryDream: 898, // ひとりぼっちのゆめ
    DivineFang: 915, // 神竜王の牙
    KyokoNoKisaku3: 726, // 恐慌の奇策3
    AirOrders3: 819, // 先導の伝令・天3
    GroundOrders3: 911, // 先導の伝令・地3
    Upheaval: 823, // メガクェイク
    VisionOfArcadia: 933, // 理想郷となるように
    OstiasPulse: 753, // オスティアの鼓動
    Jagan: 811, // 邪眼
    HitoNoKanouseiWo: 850, // 人の可能性を
    ImpenetrableDark: 1178, // 見通せぬ深き暗闇
    MilaNoHaguruma: 1352, // ミラの歯車
    InevitableDeath: 1420, // 死からは逃れられぬ
    WingsOfLight: 1622, // 光輝く翼
    OrdersRestraint: 1724, // 束縛、秩序、安定
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

/// 武器タイプが物理系の武器であるかを判定します。
function isPhysicalWeaponType(weaponType) {
    if (isWeaponTypeBeast(weaponType)) {
        return true;
    }
    if (isWeaponTypeDagger(weaponType)) {
        return true;
    }
    if (isWeaponTypeBow(weaponType)) {
        return true;
    }
    switch (weaponType) {
        case WeaponType.Sword:
        case WeaponType.Lance:
        case WeaponType.Axe:
            return true;
        default:
            return false;
    }
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

/// 自身、敵共に反撃不可になる武器であるかどうかを判定します。
function isFiresweepWeapon(weapon) {
    switch (weapon) {
        case Weapon.MiraiNoSeikishiNoYari:
        case Weapon.FiresweepSword:
        case Weapon.FiresweepSwordPlus:
        case Weapon.FiresweepLance:
        case Weapon.FiresweepLancePlus:
        case Weapon.FiresweepBow:
        case Weapon.FiresweepBowPlus:
        case Weapon.FiresweepAxePlus:
            return true;
        default:
            return false;
    }
}

/// 補助スキルの射程を取得します。
function getAssistRange(support) {
    switch (support) {
        case Support.None:
            return 0;
        case Support.Physic:
        case Support.PhysicPlus:
            return 2;
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
        case Support.Sacrifice: return 1;
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

/// 範囲奥義かどうかを判定します。
function isRangedAttackSpecial(special) {
    switch (special) {
        case Special.GrowingFlame:
        case Special.GrowingLight:
        case Special.GrowingWind:
        case Special.GrowingThunder:
        case Special.BlazingFlame:
        case Special.BlazingLight:
        case Special.BlazingWind:
        case Special.BlazingThunder:
        case Special.RisingFlame:
        case Special.RisingLight:
        case Special.RisingWind:
        case Special.RisingThunder:
        case Special.GiftedMagic:
            return true;
        default:
            return false;
    }
}

/// 防御系の奥義かどうかを判定します。
function isDefenseSpecial(special) {
    switch (special) {
        case Special.Nagatate:
        case Special.Otate:  // 大盾
        case Special.Kotate: // 小盾
        case Special.Seitate: // 聖盾
        case Special.Seii:  // 聖衣
        case Special.Seikabuto: // 聖兜
        case Special.KoriNoSeikyo:
        case Special.IceMirror2:
        case Special.NegatingFang:
            return true;
        default:
            return false;
    }
}

/// 戦闘中に発動する攻撃系の奥義かどうかを判定します。
function isNormalAttackSpecial(special) {
    switch (special) {
        case Special.Moonbow:
        case Special.Luna:
        case Special.Aether:
        case Special.LunaFlash:
        case Special.Glimmer:
        case Special.Deadeye:
        case Special.Astra:
        case Special.Bonfire:
        case Special.Ignis:
        case Special.Iceberg:
        case Special.Glacies:
        case Special.HolyKnightAura:
        case Special.DraconicAura:
        case Special.DragonFang:
        case Special.Sirius: // 天狼
        case Special.RupturedSky: // 破天
        case Special.TwinBlades: // 双刃
        case Special.Taiyo:
        case Special.Yuyo:
        case Special.RegnalAstra: // 剣姫の流星
        case Special.ImperialAstra: // 剣皇の流星
        case Special.OpenTheFuture: // 開世
        case Special.Fukusyu: // 復讐
        case Special.Kessyu: // 血讐
        case Special.Kagetsuki: // 影月
        case Special.Setsujoku: // 雪辱
        case Special.Hyouten: // 氷点
        case Special.Youkage: // 陽影
        case Special.Hotarubi: // 蛍火
        case Special.HonoNoMonsyo: // 炎の紋章
        case Special.HerosBlood:
        case Special.KuroNoGekko: // 黒の月光
        case Special.AoNoTenku: // 蒼の天空
        case Special.RadiantAether2: // 蒼の天空・承
        case Special.MayhemAether: // 暴の天空
        case Special.Hoshikage: // 星影
        case Special.Fukuryu: // 伏竜
        case Special.BlueFrame: // ブルーフレイム
        case Special.SeidrShell: // 魔弾
        case Special.RighteousWind:
        case Special.SublimeHeaven:
            return true;
        default:
            return false;
    }
}

/// 再行動補助スキルかどうかを判定します。
function isRefreshSupportSkill(skillId) {
    switch (skillId) {
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

/// 範囲奥義かどうかを判定します。
function isWeaponTypeBow(type) {
    return type == WeaponType.RedBow
        || type == WeaponType.BlueBow
        || type == WeaponType.GreenBow
        || type == WeaponType.ColorlessBow;
}

/// 武器タイプが暗器であるかを判定します。
function isWeaponTypeDagger(type) {
    return type == WeaponType.RedDagger
        || type == WeaponType.BlueDagger
        || type == WeaponType.GreenDagger
        || type == WeaponType.ColorlessDagger;
}

/// 武器タイプが魔法であるかを判定します。
function isWeaponTypeTome(type) {
    return type == WeaponType.RedTome
        || type == WeaponType.BlueTome
        || type == WeaponType.GreenTome
        || type == WeaponType.ColorlessTome;
}

/// 武器タイプが竜であるかを判定します。
function isWeaponTypeBreath(type) {
    return type == WeaponType.RedBreath
        || type == WeaponType.BlueBreath
        || type == WeaponType.GreenBreath
        || type == WeaponType.ColorlessBreath
        || type == WeaponType.Breath;
}

/// 武器タイプが獣であるかを判定します。
function isWeaponTypeBeast(type) {
    return type == WeaponType.RedBeast
        || type == WeaponType.BlueBeast
        || type == WeaponType.GreenBeast
        || type == WeaponType.ColorlessBeast
        || type == WeaponType.Beast;
}

/// 武器タイプが2距離射程の武器であるかを判定します。
function isRangedWeaponType(weaponType) {
    return isWeaponTypeDagger(weaponType)
        || isWeaponTypeTome(weaponType)
        || isWeaponTypeBow(weaponType)
        || weaponType == WeaponType.Staff;
}

/// 武器タイプが1距離射程の武器であるかを判定します。
function isMeleeWeaponType(weaponType) {
    return isWeaponTypeBreathOrBeast(weaponType)
        || weaponType == WeaponType.Sword
        || weaponType == WeaponType.Axe
        || weaponType == WeaponType.Lance;
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

function getColorFromWeaponType(weaponType) {
    switch (weaponType) {
        case WeaponType.Sword: return ColorType.Red;
        case WeaponType.RedTome: return ColorType.Red;
        case WeaponType.RedBreath: return ColorType.Red;
        case WeaponType.RedBeast: return ColorType.Red;
        case WeaponType.RedBow: return ColorType.Red;
        case WeaponType.RedDagger: return ColorType.Red;
        case WeaponType.Lance: return ColorType.Blue;
        case WeaponType.BlueTome: return ColorType.Blue;
        case WeaponType.BlueBreath: return ColorType.Blue;
        case WeaponType.BlueBeast: return ColorType.Blue;
        case WeaponType.BlueBow: return ColorType.Blue;
        case WeaponType.BlueDagger: return ColorType.Blue;
        case WeaponType.Axe: return ColorType.Green;
        case WeaponType.GreenTome: return ColorType.Green;
        case WeaponType.GreenBreath: return ColorType.Green;
        case WeaponType.GreenBeast: return ColorType.Green;
        case WeaponType.GreenBow: return ColorType.Green;
        case WeaponType.GreenDagger: return ColorType.Green;
        case WeaponType.Staff: return ColorType.Colorless;
        case WeaponType.ColorlessTome: return ColorType.Colorless;
        case WeaponType.ColorlessBreath: return ColorType.Colorless;
        case WeaponType.ColorlessBeast: return ColorType.Colorless;
        case WeaponType.ColorlessBow: return ColorType.Colorless;
        case WeaponType.ColorlessDagger: return ColorType.Colorless;
        default:
            throw new Error("Unexpected weapon type");
    }
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
function canRallyForcibly(skill) {
    switch (skill) {
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

/// テレポート効果を持つスキルであるかどうかを判定します。
function isTeleportationSkill(skillId) {
    switch (skillId) {
        case Weapon.FlowerLance:
        case Weapon.FujinYumi:
        case Weapon.Gurimowaru:
        case Weapon.ApotheosisSpear:
        case Weapon.AstralBreath:
        case Weapon.Noatun:
        case Weapon.HinokaNoKounagitou:
        case Weapon.IzunNoKajitsu:
        case PassiveB.TeniNoKona:
        case PassiveB.Kyuen2:
        case PassiveB.Kyuen3:
        case PassiveB.Ridatsu3:
        case PassiveB.KyokugiHiKo1:
        case PassiveB.KyokugiHiKo2:
        case PassiveB.KyokugiHiKo3:
        case PassiveB.HentaiHiko1:
        case PassiveB.HentaiHiko2:
        case PassiveB.HentaiHiko3:
        case PassiveC.SorakaranoSendo3:
        case PassiveC.HikonoSendo3:
            return true;
        default:
            return false;
    }
}

/// 天駆の道の効果を持つスキルかどうか
function hasPathfinderEffect(skillId) {
    switch (skillId) {
        case Weapon.Hrimfaxi:
        case Weapon.Skinfaxi:
            return true;
        default:
            return false;
    }
}

/// スキル情報です。ユニットの初期化等に使用します。
class SkillInfo {
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
        hasStatusWeaponRefinement
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
        this.sp = sp;
        this.canInherit = canInherit;
        this.inheritableWeaponTypes = inheritableWeaponTypes;
        this.inheritableMoveTypes = inheritableMoveTypes;
        this.hasSpecialWeaponRefinement = hasSpecialWeaponRefinement;
        this.hasStatusWeaponRefinement = hasStatusWeaponRefinement;

        this.type = SkillType.Weapon;
        this.weaponRefinementOptions = [];

        // 英雄情報から必要に応じて設定する
        this.releaseDateAsNumber = 0;
    }

    isDuel4() {
        return this.name.includes("死闘")
            && this.name.endsWith("4");
    }
    isDuel3() {
        return this.name.includes("死闘")
            && this.name.endsWith("3");
    }
}
