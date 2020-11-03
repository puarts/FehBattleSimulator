#pragma once

#include "Define.h"

namespace FehBattleSimulatorLib
{
    enum class Weapon
    {
        None = -1,

        MerankoryPlus = 1016, // メランコリー+
        ReginRave = 1027, // レギンレイヴ
        TsubakiNoKinnagitou = 1030, // ツバキの金薙刀
        ByakuyaNoRyuuseki = 1031, // 白夜の竜石
        YumikishiNoMiekyu = 1032, // 弓騎士の名弓
        RyusatsuNoAnkiPlus = 1033, // 竜殺の暗器+
        KishisyogunNoHousou = 1035, // 騎士将軍の宝槍
        KurohyoNoYari = 1047, // 黒豹の槍
        MogyuNoKen = 1048, // 猛牛の剣
        SaizoNoBakuenshin = 1050, // サイゾウの爆炎針
        PieriNoSyousou = 1051, // ピエリの小槍
        DokuNoKen = 1060, // 毒の剣
        KachuNoYari = 1063, // 華冑の槍
        HimekishiNoYari = 1064, // 姫騎士の槍
        Tangurisuni = 1071, // タングリスニ
        AirisuNoSyo = 837, // アイリスの書
        LunaArc = 888, // 月光
        AstraBlade = 1018, // 流星
        DireThunder = 264, // ダイムサンダ
        Meisterschwert = 54, // マスターソード
        GinNoHokyu = 878, // 銀の宝弓
        MasterBow = 1020, // マスターボウ
        YushaNoYumiPlus = 185, // 勇者の弓+
        BraveAxe = 131, // 勇者の斧+
        BraveLance = 80,// 勇者の槍+
        BraveSword = 10,// 勇者の剣+
        Amite = 34, // アミーテ
        BerkutsLance = 94,
        BerkutsLancePlus = 95, // ベルクトの槍+
        FlowerOfJoy = 1058, // 幸福の花(ピアニー)
        Urvan = 145, // ウルヴァン

        SplashyBucketPlus = 818, // 神泉の風呂桶+
        RagnellAlondite = 1042, //ラグネル＆エタルド
        LightningBreath = 394, // 雷のブレス
        LightningBreathPlus = 399, // 雷のブレス+
        LightBreath = 393,
        LightBreathPlus = 398, // 光のブレス+
        Sogun = 214,
        RauaAuru = 236,
        RauaAuruPlus = 237,
        GurunAuru = 313,
        GurunAuruPlus = 314,
        BuraAuru = 268,
        BuraAuruPlus = 269, // ブラーアウル

        YoiyamiNoDanougi = 383,
        YoiyamiNoDanougiPlus = 384, // 宵闇の団扇+
        RyokuunNoMaiougi = 385,
        RyokuunNoMaiougiPlus = 386, // 緑雲の舞扇+
        SeitenNoMaiougi = 387, // 青天の舞扇
        SeitenNoMaiougiPlus = 388, // 青天の舞扇+

        Hlidskjalf = 350, // フリズスキャルヴ
        AversasNight = 254, // インバースの暗闇

        KatarinaNoSyo = 252,// カタリナの書
        Ora = 265, // オーラ
        KyomeiOra = 272, // 共鳴オーラ
        ButosaiNoGakuhu = 275,
        ButosaiNoGakuhuPlus = 276, // 舞踏祭の楽譜
        Seini = 279, // セイニー
        Ivarudhi = 284, // イーヴァルディ
        Naga = 309, // ナーガ
        ButosaiNoWa = 318,
        ButosaiNoWaPlus = 319, // 舞踏祭の輪+
        SeisyoNaga = 320, // 聖書ナーガ
        Blizard = 324, // ブリザード
        MuninNoMaran = 328, // ムニンの魔卵
        RaisenNoSyo = 329, // 雷旋の書
        Forusethi = 332, // フォルセティ
        Absorb = 334,
        AbsorbPlus = 341, // アブソーブ+
        Fear = 339,
        FearPlus = 342, // フィアー+
        Slow = 336,
        SlowPlus = 343, // スロウ+
        Gravity = 335, // グラヴィティ
        GravityPlus = 344, // グラヴィティ+
        Sekku = 353, // セック
        ButosaiNoSensu = 367,
        ButosaiNoSensuPlus = 368, // 舞踏祭の扇子
        Kagamimochi = 371, // 鏡餅
        KagamimochiPlus = 372, // 鏡餅+

        Death = 899,  // デス
        Pain = 338,
        PainPlus = 345, // ペイン+
        SeireiNoHogu = 788, // 清冷の法具
        WindsBrand = 327, // 深き印の風
        TemariPlus = 1084, // 手毬+

        RauorbladePlus = 247, // 魔書ギムレー+

        FuginNoMaran = 289, // フギンの魔卵
        GunshinNoSyo = 290, // 軍神の書
        OrdinNoKokusyo = 296, //オーディンの黒書
        Arrow = 298, // アロー
        DawnSuzu = 253, // 暁天の神楽鈴
        Excalibur = 308, // エクスカリバー
        DarkExcalibur = 315, // 共鳴エクスカリバー
        Forblaze = 248, // フォルブレイズ
        FlameSiegmund = 109, // 炎槍ジークムント
        ChaosManifest = 866, // 負の力
        Missiletainn = 297,//魔書ミストルティン

        HanasKatana = 1049, // カザハナの麗刀
        Sinmara = 765, // シンモラ

        TenteiNoHado = 955,
        DivineMist = 409, // 神霧のブレス
        SnowsGrace = 1067, // 神祖の恵み
        RazingBreath = 897, // 断絶のブレス
        DivineBreath = 913, // 神竜王のブレス

        ShirasagiNoTsubasa = 806, // 白鷺の翼
        EtherealBreath = 996, // 異空のブレス
        Gjallarbru = 910, // ギャッラルブルー
        NewFoxkitFang = 1087, // 新年の妖狐娘の爪牙
        NewBrazenCatFang = 1089, // 新年の戦猫の爪牙
        AkaiAhiruPlus = 816,//赤いアヒル
        KenhimeNoKatana = 58,//剣姫の刀
        GigaExcalibur = 331, //ギガエクスカリバー

        GunshiNoFusho = 782, // 軍師の風書
        GunshiNoRaisyo = 781, // 軍師の雷書
        TharjasHex = 834, // サーリャの禁呪
        Blarblade = 260, // ブラーブレード
        BlarbladePlus = 261, // ブラーブレード+
        Gronnblade = 303, // グルンブレード
        GronnbladePlus = 304, // グルンブレード+ 
        Rauarblade = 229, // ラウアブレード
        RauarbladePlus = 230, // ラウアブレード+
        KeenGronnwolfPlus = 323, // グルンウルフ鍛+
        ArmorsmasherPlus = 40, // アーマーキラー鍛+

        Blarraven = 262,
        BlarravenPlus = 263, // ブラーレイヴン+
        Gronnraven = 305,
        GronnravenPlus = 306,
        Rauarraven = 231,
        RauarravenPlus = 232,

        Blarserpent = 287,
        BlarserpentPlus = 288, // ブラーサーペント+
        GronnserpentPlus = 851,
        RauarserpentPlus = 1025,

        AsahiNoKen = 7,
        AsahiNoKenPlus = 8, // 旭日の剣+
        SoukaiNoYari = 77,
        SoukaiNoYariPlus = 78, // 蒼海の槍+
        ShinryokuNoOno = 128,
        ShinryokuNoOnoPlus = 129, // 深緑の斧+

        Watou = 11,
        WatouPlus = 12, // 倭刀+
        Wabo = 110,
        WaboPlus = 111, // 倭鉾+
        BigSpoon = 159,
        BigSpoonPlus = 160,
        Wakon = 168,
        WakonPlus = 169, // 倭棍+
        TankyuPlus = 852, // 短弓+
        BabyCarrot = 375,
        BabyCarrotPlus = 376, // ベビーキャロット+

        MitteiNoAnki = 944, // 密偵の暗器
        YouheidanNoNakayari = 946, // 傭兵団の長槍
        KouketsuNoSensou = 949, // 高潔の戦槍
        BouryakuNoSenkyu = 951, // 謀略の戦弓
        Flykoogeru = 959, // フライクーゲル
        SyuryouNoEijin = 963, // 狩猟の鋭刃
        BerukaNoSatsufu = 966, // ベルカの殺斧
        KinsekiNoSyo = 968, // 金石の書
        SarieruNoOkama = 969, // サリエルの大鎌
        Veruzandhi = 984, // ヴェルザンディ
        GengakkiNoYumiPlus = 986, // 弦楽器の弓+
        KokkiNoKosou = 993, // 黒騎の孤槍
        Merikuru = 997, // メリクル
        MagetsuNoSaiki = 1002, // 魔月の祭器
        SyugosyaNoKyofu = 1011, // 守護者の巨斧
        Taiyo = 1014, // 太陽

        VezuruNoYoran = 1168, // ヴェズルの妖卵

        Sukurudo = 59, // スクルド
        CandyStaff = 351, // キャンディの杖
        CandyStaffPlus = 352, // キャンディの杖+
        Sekuvaveku = 1113, // セクヴァヴェク
        SyungeiNoKenPlus = 794, // 迎春の剣+
        RunaNoEiken = 965, // ルーナの鋭剣
        MaryuNoBreath = 856, // 魔竜のブレス
        GhostNoMadosyo = 321, // ゴーストの魔導書
        GhostNoMadosyoPlus = 322, // ゴーストの魔導書+
        MonstrousBow = 200, // 怪物の弓
        MonstrousBowPlus = 201, // 怪物の弓
        EnkyoriBougyoNoYumiPlus = 202, // 遠距離防御の弓+

        WingSword = 46, // ウイングソード
        Romfire = 112, // ロムファイア
        SyunsenAiraNoKen = 37, // 瞬閃アイラの剣

        KabochaNoOno = 174, // カボチャの斧
        KabochaNoOnoPlus = 175, // カボチャの斧+
        KoumoriNoYumi = 217,
        KoumoriNoYumiPlus = 218,
        KajuNoBottle = 390,
        KajuNoBottlePlus = 391,
        CancelNoKenPlus = 1054, // キャンセルの剣+
        CancelNoYariPlus = 1138, // キャンセルの槍+
        CancelNoOno = 1165,
        CancelNoOnoPlus = 1164, // キャンセルの斧+

        MaritaNoKen = 1052, // マリータの剣
        KyoufuArmars = 156, // 狂斧アルマーズ

        Urur = 146, // ウルズ
        WeirdingTome = 277, // 奇異ルーテの書
        TaguelFang = 847, // タグエルの爪牙
        FellBreath = 821, // 邪神のブレス
        BookOfShadows = 761, // 泡影の書
        NinissIceLance = 972, // 氷精ニニスの槍
        Ifingr = 998, // イーヴィングル
        Fimbulvetr = 1041, // フィンブル
        Mulagir = 199, // ミュルグレ

        Randgrior = 1151, // ランドグリーズ
        HadesuOmega = 1155, // ハデスΩ

        Mogprasir = 983, // メグスラシル
        LegionsAxe = 137, // ローローの斧
        LegionsAxePlus = 138,
        Panic = 337,
        PanicPlus = 346, // パニック+
        Scadi = 207, // スカディ
        FoxkitFang = 845, // 妖狐娘の爪牙
        BrazenCatFang = 870, // 剛なる戦猫の爪牙

        FiresweepSword = 42,
        FiresweepSwordPlus = 43,
        FiresweepLance = 88,
        FiresweepLancePlus = 89,
        FiresweepBow = 188,
        FiresweepBowPlus = 189, // 火薙ぎの弓+
        FiresweepAxePlus = 1024,

        Kadomatsu = 44,
        KadomatsuPlus = 45, // 門松
        Hamaya = 203,
        HamayaPlus = 204,
        Hagoita = 153,
        HagoitaPlus = 154,

        AkatsukiNoHikari = 974, // 暁の光
        KurokiChiNoTaiken = 41, // 黒き血の大剣

        MamoriNoKen = 55,
        MamoriNoKenPlus = 56,
        MamoriNoYariPlus = 854,
        MamoriNoOnoPlus = 1037, // 守りの斧+

        BariaNoKen = 62, // バリアの剣
        BariaNoKenPlus = 63,
        BariaNoYariPlus = 917,

        LarceisEdge = 1099, // ラクチェの流剣
        GeneiLod = 1108, // 幻影ロッド

        Durandal = 24, // デュランダル
        ArdentDurandal = 931, // 緋剣デュランダル
        FalchionAwakening = 48, // ファルシオン(覚醒)
        FalchionRefined = 47, // ファルシオン(紋章)
        FalcionEchoes = 49, // ファルシオン(Echoes)
        Balmung = 1093, // バルムンク
        ImbuedKoma = 1090, // 神宿りの独楽
        Ragnarok = 235, // ライナロック
        HokenSophia = 50,// 宝剣ソフィア
        Bashirikosu = 155, // バシリコス
        KageroNoGenwakushin = 1046, // カゲロウの眩惑針

        GaeBolg = 119, //ゲイボルグ
        BlazingDurandal = 33, // 烈剣デュランダル
        SyugosyaNoRekkyu = 1039, // 守護者の烈弓
        WagasaPlus = 798, // 和傘+
        KumadePlus = 796, // 熊手+
        KarasuOuNoHashizume = 812, // 鴉王の嘴爪
        ShinenNoBreath = 402, // 神炎のブレス
        TakaouNoHashizume = 804, // 鷹王の嘴爪

        MiraiNoSeikishiNoYari = 942, // 未来の聖騎士の槍
        ShiseiNaga = 980, // 至聖ナーガ
        Thirufingu = 23, // ティルフィング
        Sangurizuru = 970, // サングリズル

        Pesyukado = 373, // ペシュカド
        FerisiaNoKorizara = 374, // フェリシアの氷皿
        AnsatsuSyuriken = 377,
        AnsatsuSyurikenPlus = 378,//暗殺手裏剣+
        SyukuseiNoAnki = 379,
        SyukuseiNoAnkiPlus = 380, // 粛清の暗器+
        FurasukoPlus = 1003, // フラスコ+
        KabochaNoGyotoPlus = 1005, // カボチャの行灯+
        BikkuriBakoPlus = 1007, // びっくり箱+
        RosokuNoYumiPlus = 1010, // ロウソクの弓+
        HankoNoYari = 116, // 反攻の槍
        HankoNoYariPlus = 117, // 反攻の槍+
        HadoNoSenfu = 947, // 覇道の戦斧
        MagoNoTePlus = 814, // 孫の手+
        KizokutekinaYumi = 1013, // 貴族的な弓

        Seiju = 104,
        SeijuPlus = 105, // 聖樹+
        HandBell = 149,
        HandBellPlus = 150, // ハンドベル+
        PresentBukuro = 151,
        PresentBukuroPlus = 152, // プレゼント袋+
        Syokudai = 243,
        SyokudaiPlus = 244, // 燭台+

        ShirokiChiNoNaginata = 103, // 白き血の薙刀

        Arumazu = 134, // アルマーズ
        Marute = 118, // マルテ
        HuinNoKen = 18, // 封印の剣
        MoumokuNoYumi = 903, // 盲目の弓
        Puji = 1056, // プージ
        Forukuvangu = 15, // フォルクバング

        NinjinNoYari = 83, // ニンジンの槍
        NinjinNoYariPlus = 84,
        NinjinNoOno = 135,
        NinjinNoOnoPlus = 136, // ニンジンの斧
        AoNoTamago = 266,
        AoNoTamagoPlus = 267,// 青の卵
        MidoriNoTamago = 310,
        MidoriNoTamagoPlus = 311,// 緑の卵

        HigasaPlus = 945, // 日傘+
        TairyoNoYuPlus = 938, // 大漁の弓+
        KaigaraNoNaifuPlus = 934, // 貝殻のナイフ+

        Kasaburanka = 107,
        KasaburankaPlus = 108, // カサブランカ+
        Grathia = 205,
        GrathiaPlus = 206,
        AoNoPresentBukuro = 285,
        AoNoPresentBukuroPlus = 286,
        MidoriNoPresentBukuro = 325,
        MidoriNoPresentBukuroPlus = 326,
        YamaNoInjaNoSyo = 943, // 山の隠者の書

        FirstBite = 85,
        FirstBitePlus = 86, // ファーストバイト
        KyupittoNoYa = 190,
        KyupittoNoYaPlus = 191, // キューピットの矢
        SeinaruBuke = 270,
        SeinaruBukePlus = 271, // 聖なるブーケ

        SakanaWoTsuitaMori = 90, // 魚を突いた銛
        SakanaWoTsuitaMoriPlus = 91,
        SuikaWariNoKonbo = 139,
        SuikaWariNoKonboPlus = 140, // スイカ割りの棍棒
        KorigashiNoYumi = 194,
        KorigashiNoYumiPlus = 195, // 氷菓子の弓
        Kaigara = 365,
        KaigaraPlus = 366, // 貝殻

        KaigaraNoYari = 113,
        KiagaraNoYariPlus = 114,
        BeachFlag = 164,
        BeachFlagPlus = 165,
        YashiNoMiNoYumi = 210,
        YashiNoMiNoYumiPlus = 211,

        HuyumatsuriNoBootsPlus = 780, // 冬祭のブーツ+
        KiraboshiNoBreathPlus = 774, // 綺羅星のブレス+
        GinNoGobulettoPlus = 990, // 銀のゴブレット+

        NifuruNoHyoka = 330, // ニフルの氷花
        MusuperuNoEnka = 250, // ムスペルの炎花

        RirisuNoUkiwa = 141,
        RirisuNoUkiwaPlus = 142,
        TomatoNoHon = 238,
        TomatoNoHonPlus = 239,
        NettaigyoNoHon = 273,
        NettaigyoNoHonPlus = 274,
        HaibisukasuNoHon = 316,
        HaibisukasuNoHonPlus = 317,

        SakanaNoYumi = 212,
        SakanaNoYumiPlus = 213,
        NangokuJuice = 294,
        NangokuJuicePlus = 295,
        Hitode = 381,
        HitodePlus = 382,
        SoulCaty = 22,

        FuyumatsuriNoStickPlus = 1073, // 冬祭のステッキ+
        ChisanaSeijuPlus = 1065,
        SeirinNoKenPlus = 1069,

        SyukusaiNoOnoPlus = 824,
        AoNoHanakagoPlus = 826,
        MidoriNoHanakagoPlus = 828,
        SyukusaiNoKenPlus = 830,
        HanawaPlus = 831,

        UminiUkabuItaPlus = 922,
        NangokuNoKajitsuPlus = 924,
        SunahamaNoScopPlus = 928,
        SunahamaNoKuwaPlus = 930,

        HarorudoNoYufu = 1062,
        RebbekkaNoRyoukyu = 1103,

        SaladaSandPlus = 887,
        KorakuNoKazariYariPlus = 882,

        FlowerStandPlus = 904,
        CakeKnifePlus = 906,
        SyukuhaiNoBottlePlus = 908,
        SyukuhukuNoHanaNoYumiPlus = 912,
        KazahanaNoReitou = 1049, // カザハナの麗刀

        TetsuNoAnki = 354,
        DouNoAnki = 355,
        GinNoAnki = 356,
        GinNoAnkiPlus = 357,
        ShienNoAnki = 358,
        ShienNoAnkiPlus = 359,
        RogueDagger = 360, // 盗賊の暗器
        RogueDaggerPlus = 361,
        PoisonDagger = 362, // 秘毒の暗器
        PoisonDaggerPlus = 363,
        KittyPaddle = 369, // 猫の暗器
        KittyPaddlePlus = 370,
        DeathlyDagger = 364, // 死神の暗器

        MakenMistoruthin = 57,
        Mistoruthin = 17, // ミストルティン
        Misteruthin = 67, // ミステルトィン

        Candlelight = 340, // キャンドルサービス
        CandlelightPlus = 347, // キャンドル+
        FlashPlus = 758, // フラッシュ+
        Trilemma = 348,
        TrilemmaPlus = 349, // トリレンマ+

        AiNoCakeServa = 162, // 愛のケーキサーバ
        AiNoCakeServaPlus = 163,
        KiyorakanaBuke = 292,// 清らかなブーケ
        KiyorakanaBukePlus = 293,
        Byureisuto = 173, //ビューレイスト

        Otokureru = 133, // オートクレール
        MumeiNoIchimonNoKen = 52, // 無銘の一門の剣
        KieiWayuNoKen = 38, // 気鋭ワユの剣
        SyaniNoSeisou = 801, // シャニーの誓槍
        Toron = 877, // トローン
        IhoNoHIken = 1029, // 異邦の秘剣

        DevilAxe = 1132, // デビルアクス
        TenmaNoNinjinPlus = 857, // 天馬のニンジン
        TenteiNoKen = 953, //天帝の剣
        AnkokuNoKen = 891, // 暗黒の剣
        Vorufuberugu = 170, // ヴォルフベルグ
        Yatonokami = 19, // 夜刀神
        RyukenFalcion = 977, // 竜剣ファルシオン
        RaikenJikurinde = 68, // 雷剣ジークリンデ
        Jikurinde = 21, // ジークリンデ
        Reipia = 991, // レイピア
        AsameiNoTanken = 958, // アサメイの短剣
        FurederikuNoKenfu = 1012, // フレデリクの堅斧
        JokerNoSyokki = 1129, // ジョーカーの食器
        BukeNoSteckPlus = 1125, // ブーケのステッキ+
        AijouNoHanaNoYumiPlus = 1122, // 愛情の花の弓+
        Paruthia = 187, // パルティア
        TallHammer = 291, // トールハンマー
        RohyouNoKnife = 389, // 露氷のナイフ
        YoukoohNoTsumekiba = 843, // 妖狐王の爪牙
        JunaruSenekoNoTsumekiba = 869, // 柔なる戦猫の爪牙
        RauaFoxPlus = 960, // ラウアフォックス+
        KinranNoSyo = 967, // 金蘭の書
        GeneiFalcion = 1112, // 幻影ファルシオン
        HyosyoNoBreath = 1134, // 氷晶のブレス
        EishinNoAnki = 1140, // 影身の暗器
        ChichiNoSenjutsusyo = 1131, // 父の戦術書
        RazuwarudoNoMaiken = 1130, // ラズワルドの舞剣
        YujoNoHanaNoTsuePlus = 1128,// 友情の花の杖 
        AiNoSaiki = 1126, // 愛の祭器
        BaraNoYari = 1123, // 薔薇の槍
        GeneiFeather = 1110, // 幻影フェザー
        GeneiBattleAxe = 1106, // 幻影バトルアクス
        GeneiLongBow = 1104, // 幻影ロングボウ
        ThiamoNoAisou = 1102, // ティアモの愛槍
        KokukarasuNoSyo = 1101, // 黒鴉の書
        ShirejiaNoKaze = 1097, // シレジアの風
        ChisouGeiborugu = 1096, // 地槍ゲイボルグ
        KinunNoYumiPlus = 1085, // 金運の弓+
        TenseiAngel = 1075, // 天聖エンジェル
        AsuNoSEikishiNoKen = 941, // 明日の聖騎士の剣
        ZekkaiNoSoukyu = 940, // 絶海の蒼弓
        HaNoOugiPlus = 936, // 葉の扇+
        YonkaiNoSaiki = 926, // 四海の祭器
        ShintakuNoBreath = 920, // 神託のブレス
        TaguelChildFang = 916, // タグエルの子の爪牙
        FutsugyouNoYari = 902, // 払暁の槍
        WakakiMogyuNoYari = 901, // 若き猛牛の槍
        WakakiKurohyoNoKen = 900, // 若き黒豹の槍
        BoranNoBreath = 895, // 暴乱のブレス
        Kurimuhirudo = 893, // クリムヒルド
        Erudofurimuniru = 886, // エルドフリムニル
        MasyumaroNoTsuePlus = 884, // マシュマロの杖+
        Saferimuniru = 880, // セーフリムニル
        YukyuNoSyo = 879, // 悠久の書
        ShishiouNoTsumekiba = 874, // 獅子王の爪牙
        TrasenshiNoTsumekiba = 872, // 虎戦士の爪牙
        HaruNoYoukyuPlus = 865, // 春の妖弓
        FeruniruNoYouran = 863, // フェルニルの妖卵
        TamagoNoTsuePlus = 861, // 卵の杖+
        HisenNoNinjinYariPlus = 859, // 緋閃のニンジン槍+
        MaryuHuinNoKen = 848, // 魔竜封印の剣
        JinroMusumeNoTsumekiba = 841, // 人狼娘の爪牙
        JinroOuNoTsumekiba = 839, // 人狼王の爪牙
        ZeroNoGyakukyu = 838, // ゼロの虐弓
        GuradoNoSenfu = 836, // グラドの戦斧
        OboroNoShitsunagitou = 835, // オボロの漆薙刀
        ShinginNoSeiken = 833, // 真銀の聖剣
        HinataNoMoutou = 832, // ヒナタの猛刀
        KinchakubukuroPlus = 820, // 巾着袋+
        NorenPlus = 813, // のれん+
        OkamijoouNoKiba = 809, // 狼女王の牙
        BatoruNoGofu = 802, // バアトルの豪斧
        FurorinaNoSeisou = 800, // フロリーナの誓槍
        OgonNoTanken = 799, // 黄金の短剣
        Hyoushintou = 792, // 氷神刀
        TekiyaPlus = 791, // 鏑矢+
        ShirokiNoTansou = 787, // 白騎の短槍
        ShirokiNoTyokusou = 786, // 白騎の直槍
        ShirokiNoTyouken = 785, // 白騎の長剣
        AkaNoKen = 784, // 紅の剣
        KentoushiNoGoken = 783, // 剣闘士の剛剣
        RantanNoTsuePlus = 778, // ランタンの杖+
        GousouJikumunto = 776, // 業槍ジークムント
        Rifia = 771, // リフィア
        Gyorru = 769, // ギョッル
        Mafu = 768, // マフー
        Syurugu = 763, // シュルグ
        MugenNoSyo = 759, // 夢幻の書
        MizuNoHimatsu = 755, // 水の飛沫
        SeireiNoBreath = 410, // 精霊のブレス
        AnyaryuNoBreath = 408, // 暗夜竜のブレス
        ManatsuNoBreath = 407, // 真夏のブレス
        KiriNoBreath = 406, // 霧のブレス
        MizuNoBreathPlus = 405, // 水のブレス+
        MizuNoBreath = 404, // 水のブレス
        JaryuNoBreath = 403, // 邪竜のブレス
        YamiNoBreathPlus = 400, // 闇のブレス+
        YamiNoBreath = 395, // 闇のブレス
        IzunNoKajitsu = 251, // イズンの果実
        Roputous = 249, // ロプトウス
        Nagurufaru = 246, // ナグルファル
        Gureipuniru = 245, // グレイプニル
        Gurimowaru = 241, // グリモワール
        Faraflame = 240, // ファラフレイム
        Simuberin = 234, // シムベリン
        Buryunhirude = 233, // ブリュンヒルデ
        ShiningBowPlus = 216, // シャイニングボウ+
        ShiningBow = 215,
        ShikkyuMyurugure = 209, // 疾弓ミュルグレ
        SenhimeNoWakyu = 208, // 戦姫の和弓
        Nizuheggu = 198, // ニーズヘッグ
        KuraineNoYumiPlus = 193, // クライネの弓
        KuraineNoYumi = 192,
        FujinYumi = 186, // 風神弓
        AnkigoroshiNoYumiPlus = 183, // 暗器殺しの弓
        AnkigoroshiNoYumi = 182,
        SerujuNoKyoufu = 172, // セルジュの恐斧
        Garumu = 171, // ガルム
        YoheidanNoSenfu = 167, // 傭兵団の戦斧
        TenraiArumazu = 166, // 天雷アルマーズ
        KamiraNoEnfu = 161, // カミラの艶斧
        Noatun = 132, // ノーアトゥーン
        GiyuNoYari = 115, // 義勇の槍
        HinokaNoKounagitou = 106, // ヒノカの紅薙刀
        Geirusukeguru = 98, // ゲイルスケグル
        Vidofuniru = 97, // ヴィドフニル
        MasyouNoYari = 96, // 魔性の槍
        Jikumunt = 82, // ジークムント
        Fensariru = 81, // フェンサリル
        KokouNoKen = 66, // 孤高の剣
        Niu = 65, // ニーウ
        Revatein = 64, // レーヴァテイン
        ShinkenFalcion = 61, // 神剣ファルシオン
        OukeNoKen = 60, // 王家の剣
        HikariNoKen = 53, // 光の剣
        FukenFalcion = 51, // 封剣ファルシオン
        SeikenThirufingu = 36, // 聖剣ティルフィング
        Rigarublade = 28, // リガルブレイド
        Ekkezakkusu = 26, // エッケザックス

        Uchikudakumono = 1158, // 打ち砕くもの
        HigaimosoNoYumi = 1160, // 被害妄想の弓
        GrayNoHyouken = 1161, // グレイの飄剣
        SuyakuNoKen = 1162, // 雀躍の剣
        KokyousyaNoYari = 1163, // 古強者の槍

        HakutoshinNoNinjin = 1170, // 白兎神の人参
        OgonNoFolkPlus = 1171, // 黄金のフォーク+
        HarukazeNoBreath = 1173, // 春風のブレス
        NinjinhuNoSosyokuPlus = 1175, // 人参風の装飾+

        VoidTome = 1176, // 絶無の書
        SpendthriftBowPlus = 1179, // お大尽の弓+
        RinkahNoOnikanabo = 1180, // リンカの鬼金棒
        AstralBreath = 1183, // 星竜のブレス

        SatougashiNoAnki = 1187, // 砂糖菓子の暗器
        AokarasuNoSyo = 1185, // 蒼鴉の書
        RosenshiNoKofu = 1186, // 老戦士の古斧
        IagosTome = 1188, // マクベスの惑書

        FeatherSword = 1234, // フェザーソード
        WindsOfChange = 1236, // 予兆の風
        WhitedownSpear = 1238, // 白き飛翔の槍

        AkaiRyukishiNoOno = 1288, // 赤い竜騎士の斧

        SeijuNoKeshinHiko = 1299, // 成獣の化身・飛行

        Aymr = 1302, // アイムール
        ChaosRagnell = 1308, // 混沌ラグネル
        DarkScripture = 1311, // 暗黒の聖書
        BloodTome = 1313, // 魔王の血書
        BrutalBreath = 1315, // 獣乱のブレス
        KarenNoYumi = 1305, // 佳麗の弓
        RuneAxe = 1306, // ルーンアクス
        JukishiNoJuso = 1307, // 重騎士の重槍

        Gurgurant = 1317, // グルグラント
        BridesFang = 1318, // 狼花嫁の牙
        PledgedBladePlus = 1320, // 花嫁の護刀+
        GroomsWings = 1322, // 白鷺花嫁の翼
        JoyfulVows = 1323, // 幸せの誓約
        HugeFanPlus = 1324, // 大きな扇子+
        DaichiBoshiNoBreath = 1350, // 大地母神のブレス
        ApotheosisSpear = 1356, // 裏の五連闘の宝槍
        Amatsu = 1358, // アマツ
        BarrierAxePlus = 1360, // バリアの斧+
        FlowerOfEase = 1361, // 微睡の花の剣
        LevinDagger = 1363, // サンダーダガー
        HewnLance = 1348, // ドニの朴槍
        SnipersBow = 1349, // 狙撃手の弓
        StalwartSword = 1347, // 忠臣の剣
        ExoticFruitJuice = 1366, // 楽園の果汁
        CoralBowPlus = 1368, // サンゴの弓+
        FloraGuidPlus = 1370, // 植物図鑑+
        SummerStrikers = 1372, // 一夏の神宝
        YashiNoKiNoTsuePlus = 1374, // ヤシの木の杖+
        VirtuousTyrfing = 1375, // 至聖ティルフィング
        StarpointLance = 1377, // 海角の星槍
        HiddenThornsPlus = 1379, // 花の髪飾り+
        MelonFloatPlus = 1381, // メロンフロート+
        ConchBouquetPlus = 1386, // ほら貝のブーケ+
        SunsPercussors = 1382, // 盛夏の神宝
        MeikiNoBreath = 1383, // 冥輝のブレス
        KurooujiNoYari = 1384, // 黒皇子の槍
        BenihimeNoOno = 1385, // 紅姫の斧
        KyupidNoYaPlus = 1388, // キューピットの矢+
        BladeOfShadow = 1390, // 影の英雄の剣
        SpearOfShadow = 1393, // 影の英雄の槍
        CaltropDaggerPlus = 1392, // 騎殺の暗器+
        HelsReaper = 1419, // 死鎌ヘル
        TomeOfOrder = 1436, // 魔道軍将の書
        SneeringAxe = 1437, // 笑面の斧
        SetsunasYumi = 1438, // セツナの緩弓
        SkyPirateClaw = 1423, // 天空の海賊の嘴爪
        HelmBowPlus = 1425, // 舵の弓+
        FlowingLancePlus = 1426, // 風見鶏の槍+
        GateAnchorAxe = 1427, // 波閉ざす錨の斧
        DeckSwabberPlus = 1429, // デッキブラシ+
        DarkSpikesT = 1445, // ダークスパイクT
        WindParthia = 1446, // 翠風パルティア
        MoonGradivus = 1449, // 蒼月グラディウス
        FlowerHauteclere = 1452, // 紅花オートクレール
        DanielMadeBow = 1447, // ダニエルの錬弓

        PrimordialBreath = 1468, // 神祖竜のブレス

        CourtlyMaskPlus = 1470, // 高貴な仮面+
        CourtlyFanPlus = 1472, // 高貴な扇+
        CourtlyBowPlus = 1474, // 高貴な弓+
        CourtlyCandlePlus = 1478, // 高貴な燭台+
        GiltGoblet = 1476, // 黄金のゴブレット

        // 絶望そして希望
        TalreganAxe = 1484, // ダルレカの激斧
        DoubleBow = 1480, // バルフレチェ
        SpiritedSpearPlus = 1482, // 士気旺盛の槍+
        BlarfoxPlus = 1479, // ブラーフォックス+
        FlameLance = 1486, // フレイムランス

        // プルメリア
        FlowerOfPlenty = 1488, // 豊潤の花

        // 竜たちの収穫祭
        MoonlessBreath = 1491, // 暁闇のブレス
        JokersWild = 1494, // 変身のカード
        BlackfireBreathPlus = 1496, // 黒夜のブレス+
        FrostfireBreath = 1498, // 蒼紅のブレス
        PaleBreathPlus = 1500, // 灰明のブレス+

        // 2020年10月錬成
        ObsessiveCurse = 1502, // 執念の呪
        EffiesLance = 1503, // エルフィの大槍

        // 女神の僕たる者たち
        Thunderbrand = 1504, // 雷霆
        CaduceusStaff = 1505, // カドゥケウスの杖
        SpearOfAssal = 1508, // アッサルの槍
        SurvivalistBow = 1509, // 生存本能の弓

        DarkCreatorS = 1511, // 天帝の闇剣

        // 2020年10月末伝承ディミトリ
        Areadbhar = 1513, // アラドヴァル
    };

    enum class PassiveB
    {
        None = -1,
        QuickRiposte1 = 1254, // 切り返し1
        QuickRiposte2 = 1255, // 切り返し2
        QuickRiposte3 = 599, // 切り返し3
        DragonsIre3 = 1493, // 竜の逆鱗3
        Vantage3 = 596, // 待ち伏せ3
        Desperation3 = 597, // 攻め立て3
        Cancel1 = 1286,//キャンセル1
        Cancel2 = 1287,//キャンセル2
        Cancel3 = 631,//キャンセル3
        Kyuen2 = 1121, // 救援の行路2
        Kyuen3 = 594, // 救援の行路3
        Ridatsu3 = 595, // 離脱の行路3
        HentaiHiko1 = 1443, // 編隊飛行1
        HentaiHiko2 = 1444, // 編隊飛行2
        HentaiHiko3 = 635, // 編隊飛行3
        KyokugiHiKo1 = 1394, // 曲技飛行1
        KyokugiHiKo2 = 1395, // 曲技飛行2
        KyokugiHiKo3 = 636, // 曲技飛行3
        WrathfulStaff3 = 632, // 神罰の杖3
        DazzlingStaff3 = 633, // 幻惑の杖3
        ChillAtk1 = 1339,
        ChillAtk2 = 1340,
        ChillAtk3 = 614, // 攻撃の封印3
        ChillSpd1 = 1341,
        ChillSpd2 = 1342,
        ChillSpd3 = 615, // 速さの封印3
        ChillDef1 = 1343,
        ChillDef2 = 1344,
        ChillDef3 = 616, // 守備の封印3
        ChillRes1 = 1345,
        ChillRes2 = 1346,
        ChillRes3 = 617, // 魔防の封印3
        ChillAtkRes2 = 1169, // 攻撃魔防の封印2
        ChillAtkSpd2 = 1239, // 攻撃速さの封印2
        ChillSpdDef2 = 1319, // 速さ守備の封印2
        ChillSpdRes2 = 1371, // 速さ魔防の封印2

        BoldFighter3 = 601, // 攻撃隊形3
        VengefulFighter3 = 602, // 迎撃隊形3
        WaryFighter3 = 600, // 守備隊形3
        SpecialFighter3 = 603,// 奥義隊形3
        CraftFighter3 = 1483, // 抑止隊形3
        SlickFighter3 = 1497, // 正面隊形・自己3

        MikiriTsuigeki3 = 757, // 見切り・追撃効果3
        MikiriHangeki3 = 810, // 見切り・反撃不可効果3

        KyokoNoWakuran3 = 896, // 惑乱3

        BlazeDance1 = 1278, // 業火の舞い1
        BlazeDance2 = 1279, // 業火の舞い2
        BlazeDance3 = 638, // 業火の舞い3
        GaleDance1 = 1230, // 疾風の舞い1
        GaleDance2 = 1231, // 疾風の舞い2
        GaleDance3 = 639, // 疾風の舞い3
        EarthDance1 = 1147, // 大地の舞い1
        EarthDance2 = 1148, // 大地の舞い2
        EarthDance3 = 640, // 大地の舞い3
        TorrentDance1 = 1241, // 静水の舞い1
        TorrentDance2 = 1242, // 静水の舞い2
        TorrentDance3 = 762, // 静水の舞い3
        FirestormDance2 = 641, // 業火疾風の舞い2
        CalderaDance1 = 1240, // 業火大地の舞い1
        CalderaDance2 = 987, // 業火大地の舞い2
        DelugeDance2 = 644, // 疾風静水の舞い2
        FirefloodDance2 = 642, // 業火静水の舞い2
        GeyserDance1 = 1243, // 大地静水の舞い1
        GeyserDance2 = 645, // 大地静水の舞い2
        RockslideDance2 = 643, // 疾風大地の舞い2

        // 魅了
        AtkCantrip3 = 1380, // 攻撃の魅了3
        DefCantrip3 = 1471,

        AtkSpdLink2 = 1133, // 攻撃速さの連携2
        AtkSpdLink3 = 648, // 攻撃速さの連携3
        AtkResLink3 = 760,
        AtkDefLink3 = 649, // 攻撃守備の連携3
        SpdDefLink3 = 860, // 速さ守備の連携3
        SpdResLink3 = 650, // 速さ魔防の連携3
        DefResLink3 = 651, // 守備魔防の連携3

        Swordbreaker3 = 618, // 剣殺し3
        Lancebreaker3 = 619,
        Axebreaker3 = 620,
        Bowbreaker3 = 621,
        Daggerbreaker3 = 622,
        RedTomebreaker3 = 623,
        BlueTomebreaker3 = 624,
        GreenTomebreaker3 = 625,

        LullAtkDef3 = 950, // 攻撃守備の凪3
        LullAtkSpd3 = 994, // 攻撃速さの凪3
        LullAtkRes3 = 1109, // 攻撃魔防の凪3
        LullSpdDef3 = 952, // 速さ守備の凪3
        LullSpdRes3 = 1156,

        SabotageAtk3 = 846, // 攻撃の混乱3
        SabotageSpd3 = 1026, // 速さの混乱3
        SabotageDef3 = 937, // 守備の混乱3
        SabotageRes3 = 867, // 魔防の混乱3

        OgiNoRasen3 = 654, // 奥義の螺旋3

        SealAtk1 = 1455,
        SealAtk2 = 1456,
        SealAtk3 = 607,
        SealSpd1 = 1457,
        SealSpd2 = 1458,
        SealSpd3 = 608,
        SealDef1 = 1459,
        SealDef2 = 1460,
        SealDef3 = 609, // 守備封じ3
        SealRes1 = 1461,
        SealRes2 = 1462,
        SealRes3 = 610, // 魔防封じ3
        SealAtkSpd1 = 1463,
        SealAtkSpd2 = 611, // 攻撃速さ封じ2
        SealAtkDef1 = 1464,
        SealAtkDef2 = 612,
        SealDefRes1 = 1467,
        SealDefRes2 = 613,
        SealSpdDef1 = 1465,
        SealSpdDef2 = 855,
        SealSpdRes1 = 1466,
        SealSpdRes2 = 1389, // 速さ魔防封じ2

        KoriNoHuin = 660, // 氷の封印
        ToketsuNoHuin = 770, // 凍結の封印

        Ikari3 = 637, // 怒り3
        Renewal1 = 1258, // 回復1
        Renewal2 = 1259, // 回復2
        Renewal3 = 605, // 回復3

        AtkFeint3 = 817, // 攻撃の共謀3
        SpdFeint3 = 652,
        DefFeint3 = 653,
        ResFeint3 = 829,

        AtkSpdRuse3 = 973, // 攻撃速さの大共謀3
        DefResRuse3 = 935,
        SpdResRuse3 = 1004,
        SpdDefRuse3 = 1105,
        AtkDefRuse3 = 1141,
        KillingIntent = 999, // 死んでほしいの

        PoisonStrike3 = 604,
        SacaesBlessing = 655,

        Kazenagi3 = 629, // 風薙ぎ3
        Mizunagi3 = 630, // 水薙ぎ3

        Spurn3 = 1391, // 回避・怒り3
        KaihiIchigekiridatsu3 = 1053, // 回避・一撃離脱3
        KaihiTatakikomi3 = 1100, // 回避・叩き込み3
        Kirikomi = 589, // 切り込み
        Tatakikomi = 588, // 叩き込み
        Hikikomi = 590, // 引き込み
        Ichigekiridatsu = 591, // 一撃離脱

        KyokaMukoKinkyori3 = 646, // 強化無効・近距離3
        KyokaMukoEnkyori3 = 647, // 強化無効・遠距離3

        Wanakaijo3 = 858, // 罠解除3

        RunaBracelet = 667, // 月の腕輪
        SeimeiNoGofu3 = 772, // 生命の護符

        ShisyaNoChojiriwo = 1114, // 死者の帳尻を
        YunesSasayaki = 976, // ユンヌの囁き
        SphiasSoul = 1076, // ソフィアの魂
        SDrink = 663, // Sドリンク
        BeokuNoKago = 656, // ベオクの加護

        TsuigekiTaikeiKisu3 = 1009, // 追撃隊形・奇数3
        HikariToYamito = 981, // 光と闇と

        GohoshiNoYorokobi1 = 1252, // ご奉仕の喜び1
        GohoshiNoYorokobi2 = 1253, // ご奉仕の喜び2
        GohoshiNoYorokobi3 = 606, // ご奉仕の喜び3
        SeikishiNoKago = 657, // 聖騎士の加護
        Shishirenzan = 665, // 獅子連斬
        Bushido = 664, // 武士道
        Recovering = 659, // リカバーリング
        TaiyoNoUdewa = 662, // 太陽の腕輪
        KyusyuTaikei3 = 1072, // 急襲隊形3
        FuinNoTate = 666, // 封印の盾
        TeniNoKona = 661, // 転移の粉
        TsuigekiRing = 658, // 追撃リング
        TateNoKodo3 = 634, // 盾の鼓動3
        AisyoSosatsu3 = 626, // 相性相殺
        Sashitigae3 = 598, // 差し違え3
        ShingunSoshi3 = 593, // 進軍阻止3
        Surinuke3 = 592, // すり抜け3
        Tenmakoku3 = 1139, // 天馬行空3
        KodoNoHukanGusu3 = 1136, // 鼓動の封緘・偶数3
        OddPulseTie3 = 1321, // 鼓動の封緘・奇数3

        BeliefInLove = 1235, // 愛を信じますか?
        RagingStorm = 1303, // 狂嵐
        SpdResSnag3 = 1367, // 速さ魔防の干渉3
        SpdDefSnag3 = 1373, // 速さ守備の干渉3
        HolyWarsEnd = 1376, // 最後の聖戦
        GuardBearing3 = 1378, // 警戒姿勢3
        DiveBomb3 = 1430, // 空からの急襲3

        BlueLionRule = 1451, // 蒼き獅子王
        BlackEagleRule = 1453, // 黒鷲の覇王

        Atrocity = 1514, // 無惨
    };

    enum class PassiveS
    {
        None = -1,
        HardyBearing1 = 1244,
        HardyBearing2 = 1144,
        HardyBearing3 = 1074, // 不動の姿勢
        OgiNoKodou = 1078, // 奥義の鼓動
        ArmoredBoots = 1083, // 重装のブーツ
        RengekiBogyoKenYariOno3 = 1080, // 連撃防御・剣槍斧3
        RengekiBogyoYumiAnki3 = 1081, // 連撃防御・弓暗器3
        RengekiBogyoMado3 = 1082, // 連撃防御・魔道3
        HayasaNoKyosei1 = 1434, // 速さの虚勢1
        HayasaNoKyosei2 = 1435, // 速さの虚勢2
        HayasaNoKyosei3 = 1079, // 速さの虚勢3
        MaboNoKyosei1 = 1431, // 魔防の虚勢1
        MaboNoKyosei2 = 1432, // 魔防の虚勢2
        MaboNoKyosei3 = 1433, // 魔防の虚勢3
        GoeiNoGuzo = 1396, // 護衛の偶像
        TozokuNoGuzoRakurai = 1397, // 盗賊の偶像
        TozokuNoGuzoKobu = 1398,
        TozokuNoGuzoKogun = 1399,
        TozokuNoGuzoKusuri = 1400,
        TozokuNoGuzoOugi = 1401,
        TozokuNoGuzoOdori = 1402,
    };
}