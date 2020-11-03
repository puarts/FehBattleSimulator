#pragma once

#include "Define.h"

namespace FehBattleSimulatorLib
{
    enum class Weapon
    {
        None = -1,

        MerankoryPlus = 1016, // �������R���[+
        ReginRave = 1027, // ���M�����C��
        TsubakiNoKinnagitou = 1030, // �c�o�L�̋��㓁
        ByakuyaNoRyuuseki = 1031, // ����̗���
        YumikishiNoMiekyu = 1032, // �|�R�m�̖��|
        RyusatsuNoAnkiPlus = 1033, // ���E�̈Ê�+
        KishisyogunNoHousou = 1035, // �R�m���R�̕�
        KurohyoNoYari = 1047, // ���^�̑�
        MogyuNoKen = 1048, // �ҋ��̌�
        SaizoNoBakuenshin = 1050, // �T�C�]�E�̔����j
        PieriNoSyousou = 1051, // �s�G���̏���
        DokuNoKen = 1060, // �ł̌�
        KachuNoYari = 1063, // �ؙh�̑�
        HimekishiNoYari = 1064, // �P�R�m�̑�
        Tangurisuni = 1071, // �^���O���X�j
        AirisuNoSyo = 837, // �A�C���X�̏�
        LunaArc = 888, // ����
        AstraBlade = 1018, // ����
        DireThunder = 264, // �_�C���T���_
        Meisterschwert = 54, // �}�X�^�[�\�[�h
        GinNoHokyu = 878, // ��̕�|
        MasterBow = 1020, // �}�X�^�[�{�E
        YushaNoYumiPlus = 185, // �E�҂̋|+
        BraveAxe = 131, // �E�҂̕�+
        BraveLance = 80,// �E�҂̑�+
        BraveSword = 10,// �E�҂̌�+
        Amite = 34, // �A�~�[�e
        BerkutsLance = 94,
        BerkutsLancePlus = 95, // �x���N�g�̑�+
        FlowerOfJoy = 1058, // �K���̉�(�s�A�j�[)
        Urvan = 145, // �E�����@��

        SplashyBucketPlus = 818, // �_��̕��C��+
        RagnellAlondite = 1042, //���O�l�����G�^���h
        LightningBreath = 394, // ���̃u���X
        LightningBreathPlus = 399, // ���̃u���X+
        LightBreath = 393,
        LightBreathPlus = 398, // ���̃u���X+
        Sogun = 214,
        RauaAuru = 236,
        RauaAuruPlus = 237,
        GurunAuru = 313,
        GurunAuruPlus = 314,
        BuraAuru = 268,
        BuraAuruPlus = 269, // �u���[�A�E��

        YoiyamiNoDanougi = 383,
        YoiyamiNoDanougiPlus = 384, // ���ł̒c��+
        RyokuunNoMaiougi = 385,
        RyokuunNoMaiougiPlus = 386, // �Ή_�̕���+
        SeitenNoMaiougi = 387, // �V�̕���
        SeitenNoMaiougiPlus = 388, // �V�̕���+

        Hlidskjalf = 350, // �t���Y�X�L������
        AversasNight = 254, // �C���o�[�X�̈È�

        KatarinaNoSyo = 252,// �J�^���i�̏�
        Ora = 265, // �I�[��
        KyomeiOra = 272, // ���I�[��
        ButosaiNoGakuhu = 275,
        ButosaiNoGakuhuPlus = 276, // �����Ղ̊y��
        Seini = 279, // �Z�C�j�[
        Ivarudhi = 284, // �C�[���@���f�B
        Naga = 309, // �i�[�K
        ButosaiNoWa = 318,
        ButosaiNoWaPlus = 319, // �����Ղ̗�+
        SeisyoNaga = 320, // �����i�[�K
        Blizard = 324, // �u���U�[�h
        MuninNoMaran = 328, // ���j���̖���
        RaisenNoSyo = 329, // �����̏�
        Forusethi = 332, // �t�H���Z�e�B
        Absorb = 334,
        AbsorbPlus = 341, // �A�u�\�[�u+
        Fear = 339,
        FearPlus = 342, // �t�B�A�[+
        Slow = 336,
        SlowPlus = 343, // �X���E+
        Gravity = 335, // �O�����B�e�B
        GravityPlus = 344, // �O�����B�e�B+
        Sekku = 353, // �Z�b�N
        ButosaiNoSensu = 367,
        ButosaiNoSensuPlus = 368, // �����Ղ̐�q
        Kagamimochi = 371, // ����
        KagamimochiPlus = 372, // ����+

        Death = 899,  // �f�X
        Pain = 338,
        PainPlus = 345, // �y�C��+
        SeireiNoHogu = 788, // ����̖@��
        WindsBrand = 327, // �[����̕�
        TemariPlus = 1084, // ��{+

        RauorbladePlus = 247, // �����M�����[+

        FuginNoMaran = 289, // �t�M���̖���
        GunshinNoSyo = 290, // �R�_�̏�
        OrdinNoKokusyo = 296, //�I�[�f�B���̍���
        Arrow = 298, // �A���[
        DawnSuzu = 253, // �œV�̐_�y��
        Excalibur = 308, // �G�N�X�J���o�[
        DarkExcalibur = 315, // ���G�N�X�J���o�[
        Forblaze = 248, // �t�H���u���C�Y
        FlameSiegmund = 109, // �����W�[�N�����g
        ChaosManifest = 866, // ���̗�
        Missiletainn = 297,//�����~�X�g���e�B��

        HanasKatana = 1049, // �J�U�n�i�̗퓁
        Sinmara = 765, // �V������

        TenteiNoHado = 955,
        DivineMist = 409, // �_���̃u���X
        SnowsGrace = 1067, // �_�c�̌b��
        RazingBreath = 897, // �f��̃u���X
        DivineBreath = 913, // �_�����̃u���X

        ShirasagiNoTsubasa = 806, // ����̗�
        EtherealBreath = 996, // �ً�̃u���X
        Gjallarbru = 910, // �M���b�����u���[
        NewFoxkitFang = 1087, // �V�N�̗d�ϖ��̒܉�
        NewBrazenCatFang = 1089, // �V�N�̐�L�̒܉�
        AkaiAhiruPlus = 816,//�Ԃ��A�q��
        KenhimeNoKatana = 58,//���P�̓�
        GigaExcalibur = 331, //�M�K�G�N�X�J���o�[

        GunshiNoFusho = 782, // �R�t�̕���
        GunshiNoRaisyo = 781, // �R�t�̗���
        TharjasHex = 834, // �T�[�����̋֎�
        Blarblade = 260, // �u���[�u���[�h
        BlarbladePlus = 261, // �u���[�u���[�h+
        Gronnblade = 303, // �O�����u���[�h
        GronnbladePlus = 304, // �O�����u���[�h+ 
        Rauarblade = 229, // ���E�A�u���[�h
        RauarbladePlus = 230, // ���E�A�u���[�h+
        KeenGronnwolfPlus = 323, // �O�����E���t�b+
        ArmorsmasherPlus = 40, // �A�[�}�[�L���[�b+

        Blarraven = 262,
        BlarravenPlus = 263, // �u���[���C����+
        Gronnraven = 305,
        GronnravenPlus = 306,
        Rauarraven = 231,
        RauarravenPlus = 232,

        Blarserpent = 287,
        BlarserpentPlus = 288, // �u���[�T�[�y���g+
        GronnserpentPlus = 851,
        RauarserpentPlus = 1025,

        AsahiNoKen = 7,
        AsahiNoKenPlus = 8, // �����̌�+
        SoukaiNoYari = 77,
        SoukaiNoYariPlus = 78, // ���C�̑�+
        ShinryokuNoOno = 128,
        ShinryokuNoOnoPlus = 129, // �[�΂̕�+

        Watou = 11,
        WatouPlus = 12, // �`��+
        Wabo = 110,
        WaboPlus = 111, // �`�g+
        BigSpoon = 159,
        BigSpoonPlus = 160,
        Wakon = 168,
        WakonPlus = 169, // �`��+
        TankyuPlus = 852, // �Z�|+
        BabyCarrot = 375,
        BabyCarrotPlus = 376, // �x�r�[�L�����b�g+

        MitteiNoAnki = 944, // ����̈Ê�
        YouheidanNoNakayari = 946, // �b���c�̒���
        KouketsuNoSensou = 949, // �����̐푄
        BouryakuNoSenkyu = 951, // �d���̐�|
        Flykoogeru = 959, // �t���C�N�[�Q��
        SyuryouNoEijin = 963, // ��̉s�n
        BerukaNoSatsufu = 966, // �x���J�̎E��
        KinsekiNoSyo = 968, // ���΂̏�
        SarieruNoOkama = 969, // �T���G���̑劙
        Veruzandhi = 984, // ���F���U���f�B
        GengakkiNoYumiPlus = 986, // ���y��̋|+
        KokkiNoKosou = 993, // ���R�̌Ǒ�
        Merikuru = 997, // �����N��
        MagetsuNoSaiki = 1002, // �����̍Պ�
        SyugosyaNoKyofu = 1011, // ���҂̋���
        Taiyo = 1014, // ���z

        VezuruNoYoran = 1168, // ���F�Y���̗d��

        Sukurudo = 59, // �X�N���h
        CandyStaff = 351, // �L�����f�B�̏�
        CandyStaffPlus = 352, // �L�����f�B�̏�+
        Sekuvaveku = 1113, // �Z�N���@���F�N
        SyungeiNoKenPlus = 794, // �}�t�̌�+
        RunaNoEiken = 965, // ���[�i�̉s��
        MaryuNoBreath = 856, // �����̃u���X
        GhostNoMadosyo = 321, // �S�[�X�g�̖�����
        GhostNoMadosyoPlus = 322, // �S�[�X�g�̖�����+
        MonstrousBow = 200, // �����̋|
        MonstrousBowPlus = 201, // �����̋|
        EnkyoriBougyoNoYumiPlus = 202, // �������h��̋|+

        WingSword = 46, // �E�C���O�\�[�h
        Romfire = 112, // �����t�@�C�A
        SyunsenAiraNoKen = 37, // �u�M�A�C���̌�

        KabochaNoOno = 174, // �J�{�`���̕�
        KabochaNoOnoPlus = 175, // �J�{�`���̕�+
        KoumoriNoYumi = 217,
        KoumoriNoYumiPlus = 218,
        KajuNoBottle = 390,
        KajuNoBottlePlus = 391,
        CancelNoKenPlus = 1054, // �L�����Z���̌�+
        CancelNoYariPlus = 1138, // �L�����Z���̑�+
        CancelNoOno = 1165,
        CancelNoOnoPlus = 1164, // �L�����Z���̕�+

        MaritaNoKen = 1052, // �}���[�^�̌�
        KyoufuArmars = 156, // �����A���}�[�Y

        Urur = 146, // �E���Y
        WeirdingTome = 277, // ��ك��[�e�̏�
        TaguelFang = 847, // �^�O�G���̒܉�
        FellBreath = 821, // �א_�̃u���X
        BookOfShadows = 761, // �A�e�̏�
        NinissIceLance = 972, // �X���j�j�X�̑�
        Ifingr = 998, // �C�[���B���O��
        Fimbulvetr = 1041, // �t�B���u��
        Mulagir = 199, // �~�����O��

        Randgrior = 1151, // �����h�O���[�Y
        HadesuOmega = 1155, // �n�f�X��

        Mogprasir = 983, // ���O�X���V��
        LegionsAxe = 137, // ���[���[�̕�
        LegionsAxePlus = 138,
        Panic = 337,
        PanicPlus = 346, // �p�j�b�N+
        Scadi = 207, // �X�J�f�B
        FoxkitFang = 845, // �d�ϖ��̒܉�
        BrazenCatFang = 870, // ���Ȃ��L�̒܉�

        FiresweepSword = 42,
        FiresweepSwordPlus = 43,
        FiresweepLance = 88,
        FiresweepLancePlus = 89,
        FiresweepBow = 188,
        FiresweepBowPlus = 189, // �Γガ�̋|+
        FiresweepAxePlus = 1024,

        Kadomatsu = 44,
        KadomatsuPlus = 45, // �叼
        Hamaya = 203,
        HamayaPlus = 204,
        Hagoita = 153,
        HagoitaPlus = 154,

        AkatsukiNoHikari = 974, // �ł̌�
        KurokiChiNoTaiken = 41, // �������̑匕

        MamoriNoKen = 55,
        MamoriNoKenPlus = 56,
        MamoriNoYariPlus = 854,
        MamoriNoOnoPlus = 1037, // ���̕�+

        BariaNoKen = 62, // �o���A�̌�
        BariaNoKenPlus = 63,
        BariaNoYariPlus = 917,

        LarceisEdge = 1099, // ���N�`�F�̗���
        GeneiLod = 1108, // ���e���b�h

        Durandal = 24, // �f�������_��
        ArdentDurandal = 931, // �ꌕ�f�������_��
        FalchionAwakening = 48, // �t�@���V�I��(�o��)
        FalchionRefined = 47, // �t�@���V�I��(���)
        FalcionEchoes = 49, // �t�@���V�I��(Echoes)
        Balmung = 1093, // �o�������N
        ImbuedKoma = 1090, // �_�h��̓Ɗy
        Ragnarok = 235, // ���C�i���b�N
        HokenSophia = 50,// �󌕃\�t�B�A
        Bashirikosu = 155, // �o�V���R�X
        KageroNoGenwakushin = 1046, // �J�Q���E��Ῐf�j

        GaeBolg = 119, //�Q�C�{���O
        BlazingDurandal = 33, // �󌕃f�������_��
        SyugosyaNoRekkyu = 1039, // ���҂̗�|
        WagasaPlus = 798, // �a�P+
        KumadePlus = 796, // �F��+
        KarasuOuNoHashizume = 812, // �뉤�̚{��
        ShinenNoBreath = 402, // �_���̃u���X
        TakaouNoHashizume = 804, // �鉤�̚{��

        MiraiNoSeikishiNoYari = 942, // �����̐��R�m�̑�
        ShiseiNaga = 980, // �����i�[�K
        Thirufingu = 23, // �e�B���t�B���O
        Sangurizuru = 970, // �T���O���Y��

        Pesyukado = 373, // �y�V���J�h
        FerisiaNoKorizara = 374, // �t�F���V�A�̕X�M
        AnsatsuSyuriken = 377,
        AnsatsuSyurikenPlus = 378,//�ÎE�藠��+
        SyukuseiNoAnki = 379,
        SyukuseiNoAnkiPlus = 380, // �l���̈Ê�+
        FurasukoPlus = 1003, // �t���X�R+
        KabochaNoGyotoPlus = 1005, // �J�{�`���̍s��+
        BikkuriBakoPlus = 1007, // �т����蔠+
        RosokuNoYumiPlus = 1010, // ���E�\�N�̋|+
        HankoNoYari = 116, // ���U�̑�
        HankoNoYariPlus = 117, // ���U�̑�+
        HadoNoSenfu = 947, // �e���̐핀
        MagoNoTePlus = 814, // ���̎�+
        KizokutekinaYumi = 1013, // �M���I�ȋ|

        Seiju = 104,
        SeijuPlus = 105, // ����+
        HandBell = 149,
        HandBellPlus = 150, // �n���h�x��+
        PresentBukuro = 151,
        PresentBukuroPlus = 152, // �v���[���g��+
        Syokudai = 243,
        SyokudaiPlus = 244, // �C��+

        ShirokiChiNoNaginata = 103, // �������̓㓁

        Arumazu = 134, // �A���}�[�Y
        Marute = 118, // �}���e
        HuinNoKen = 18, // ����̌�
        MoumokuNoYumi = 903, // �Ӗڂ̋|
        Puji = 1056, // �v�[�W
        Forukuvangu = 15, // �t�H���N�o���O

        NinjinNoYari = 83, // �j���W���̑�
        NinjinNoYariPlus = 84,
        NinjinNoOno = 135,
        NinjinNoOnoPlus = 136, // �j���W���̕�
        AoNoTamago = 266,
        AoNoTamagoPlus = 267,// �̗�
        MidoriNoTamago = 310,
        MidoriNoTamagoPlus = 311,// �΂̗�

        HigasaPlus = 945, // ���P+
        TairyoNoYuPlus = 938, // �務�̋|+
        KaigaraNoNaifuPlus = 934, // �L�k�̃i�C�t+

        Kasaburanka = 107,
        KasaburankaPlus = 108, // �J�T�u�����J+
        Grathia = 205,
        GrathiaPlus = 206,
        AoNoPresentBukuro = 285,
        AoNoPresentBukuroPlus = 286,
        MidoriNoPresentBukuro = 325,
        MidoriNoPresentBukuroPlus = 326,
        YamaNoInjaNoSyo = 943, // �R�̉B�҂̏�

        FirstBite = 85,
        FirstBitePlus = 86, // �t�@�[�X�g�o�C�g
        KyupittoNoYa = 190,
        KyupittoNoYaPlus = 191, // �L���[�s�b�g�̖�
        SeinaruBuke = 270,
        SeinaruBukePlus = 271, // ���Ȃ�u�[�P

        SakanaWoTsuitaMori = 90, // ����˂�����
        SakanaWoTsuitaMoriPlus = 91,
        SuikaWariNoKonbo = 139,
        SuikaWariNoKonboPlus = 140, // �X�C�J����̞��_
        KorigashiNoYumi = 194,
        KorigashiNoYumiPlus = 195, // �X�َq�̋|
        Kaigara = 365,
        KaigaraPlus = 366, // �L�k

        KaigaraNoYari = 113,
        KiagaraNoYariPlus = 114,
        BeachFlag = 164,
        BeachFlagPlus = 165,
        YashiNoMiNoYumi = 210,
        YashiNoMiNoYumiPlus = 211,

        HuyumatsuriNoBootsPlus = 780, // �~�Ղ̃u�[�c+
        KiraboshiNoBreathPlus = 774, // �Y�����̃u���X+
        GinNoGobulettoPlus = 990, // ��̃S�u���b�g+

        NifuruNoHyoka = 330, // �j�t���̕X��
        MusuperuNoEnka = 250, // ���X�y���̉���

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

        FuyumatsuriNoStickPlus = 1073, // �~�Ղ̃X�e�b�L+
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
        KazahanaNoReitou = 1049, // �J�U�n�i�̗퓁

        TetsuNoAnki = 354,
        DouNoAnki = 355,
        GinNoAnki = 356,
        GinNoAnkiPlus = 357,
        ShienNoAnki = 358,
        ShienNoAnkiPlus = 359,
        RogueDagger = 360, // �����̈Ê�
        RogueDaggerPlus = 361,
        PoisonDagger = 362, // ��ł̈Ê�
        PoisonDaggerPlus = 363,
        KittyPaddle = 369, // �L�̈Ê�
        KittyPaddlePlus = 370,
        DeathlyDagger = 364, // ���_�̈Ê�

        MakenMistoruthin = 57,
        Mistoruthin = 17, // �~�X�g���e�B��
        Misteruthin = 67, // �~�X�e���g�B��

        Candlelight = 340, // �L�����h���T�[�r�X
        CandlelightPlus = 347, // �L�����h��+
        FlashPlus = 758, // �t���b�V��+
        Trilemma = 348,
        TrilemmaPlus = 349, // �g�������}+

        AiNoCakeServa = 162, // ���̃P�[�L�T�[�o
        AiNoCakeServaPlus = 163,
        KiyorakanaBuke = 292,// ���炩�ȃu�[�P
        KiyorakanaBukePlus = 293,
        Byureisuto = 173, //�r���[���C�X�g

        Otokureru = 133, // �I�[�g�N���[��
        MumeiNoIchimonNoKen = 52, // �����̈��̌�
        KieiWayuNoKen = 38, // �C�s�����̌�
        SyaniNoSeisou = 801, // �V���j�[�̐���
        Toron = 877, // �g���[��
        IhoNoHIken = 1029, // �ٖM�̔錕

        DevilAxe = 1132, // �f�r���A�N�X
        TenmaNoNinjinPlus = 857, // �V�n�̃j���W��
        TenteiNoKen = 953, //�V��̌�
        AnkokuNoKen = 891, // �Í��̌�
        Vorufuberugu = 170, // ���H���t�x���O
        Yatonokami = 19, // �铁�_
        RyukenFalcion = 977, // �����t�@���V�I��
        RaikenJikurinde = 68, // �����W�[�N�����f
        Jikurinde = 21, // �W�[�N�����f
        Reipia = 991, // ���C�s�A
        AsameiNoTanken = 958, // �A�T���C�̒Z��
        FurederikuNoKenfu = 1012, // �t���f���N�̌���
        JokerNoSyokki = 1129, // �W���[�J�[�̐H��
        BukeNoSteckPlus = 1125, // �u�[�P�̃X�e�b�L+
        AijouNoHanaNoYumiPlus = 1122, // ����̉Ԃ̋|+
        Paruthia = 187, // �p���e�B�A
        TallHammer = 291, // �g�[���n���}�[
        RohyouNoKnife = 389, // �I�X�̃i�C�t
        YoukoohNoTsumekiba = 843, // �d�ω��̒܉�
        JunaruSenekoNoTsumekiba = 869, // �_�Ȃ��L�̒܉�
        RauaFoxPlus = 960, // ���E�A�t�H�b�N�X+
        KinranNoSyo = 967, // �����̏�
        GeneiFalcion = 1112, // ���e�t�@���V�I��
        HyosyoNoBreath = 1134, // �X���̃u���X
        EishinNoAnki = 1140, // �e�g�̈Ê�
        ChichiNoSenjutsusyo = 1131, // ���̐�p��
        RazuwarudoNoMaiken = 1130, // ���Y�����h�̕���
        YujoNoHanaNoTsuePlus = 1128,// �F��̉Ԃ̏� 
        AiNoSaiki = 1126, // ���̍Պ�
        BaraNoYari = 1123, // �K�N�̑�
        GeneiFeather = 1110, // ���e�t�F�U�[
        GeneiBattleAxe = 1106, // ���e�o�g���A�N�X
        GeneiLongBow = 1104, // ���e�����O�{�E
        ThiamoNoAisou = 1102, // �e�B�A���̈���
        KokukarasuNoSyo = 1101, // ����̏�
        ShirejiaNoKaze = 1097, // �V���W�A�̕�
        ChisouGeiborugu = 1096, // �n���Q�C�{���O
        KinunNoYumiPlus = 1085, // ���^�̋|+
        TenseiAngel = 1075, // �V���G���W�F��
        AsuNoSEikishiNoKen = 941, // �����̐��R�m�̌�
        ZekkaiNoSoukyu = 940, // ��C�̑��|
        HaNoOugiPlus = 936, // �t�̐�+
        YonkaiNoSaiki = 926, // �l�C�̍Պ�
        ShintakuNoBreath = 920, // �_���̃u���X
        TaguelChildFang = 916, // �^�O�G���̎q�̒܉�
        FutsugyouNoYari = 902, // ���ł̑�
        WakakiMogyuNoYari = 901, // �Ⴋ�ҋ��̑�
        WakakiKurohyoNoKen = 900, // �Ⴋ���^�̑�
        BoranNoBreath = 895, // �\���̃u���X
        Kurimuhirudo = 893, // �N�����q���h
        Erudofurimuniru = 886, // �G���h�t�����j��
        MasyumaroNoTsuePlus = 884, // �}�V���}���̏�+
        Saferimuniru = 880, // �Z�[�t�����j��
        YukyuNoSyo = 879, // �I�v�̏�
        ShishiouNoTsumekiba = 874, // ���q���̒܉�
        TrasenshiNoTsumekiba = 872, // �Ր�m�̒܉�
        HaruNoYoukyuPlus = 865, // �t�̗d�|
        FeruniruNoYouran = 863, // �t�F���j���̗d��
        TamagoNoTsuePlus = 861, // ���̏�+
        HisenNoNinjinYariPlus = 859, // ��M�̃j���W����+
        MaryuHuinNoKen = 848, // ��������̌�
        JinroMusumeNoTsumekiba = 841, // �l�T���̒܉�
        JinroOuNoTsumekiba = 839, // �l�T���̒܉�
        ZeroNoGyakukyu = 838, // �[���̋s�|
        GuradoNoSenfu = 836, // �O���h�̐핀
        OboroNoShitsunagitou = 835, // �I�{���̎��㓁
        ShinginNoSeiken = 833, // �^��̐���
        HinataNoMoutou = 832, // �q�i�^�̖ғ�
        KinchakubukuroPlus = 820, // �В���+
        NorenPlus = 813, // �̂��+
        OkamijoouNoKiba = 809, // �T�����̉�
        BatoruNoGofu = 802, // �o�A�g���̍���
        FurorinaNoSeisou = 800, // �t�����[�i�̐���
        OgonNoTanken = 799, // �����̒Z��
        Hyoushintou = 792, // �X�_��
        TekiyaPlus = 791, // �L��+
        ShirokiNoTansou = 787, // ���R�̒Z��
        ShirokiNoTyokusou = 786, // ���R�̒���
        ShirokiNoTyouken = 785, // ���R�̒���
        AkaNoKen = 784, // �g�̌�
        KentoushiNoGoken = 783, // �����m�̍���
        RantanNoTsuePlus = 778, // �����^���̏�+
        GousouJikumunto = 776, // �Ƒ��W�[�N�����g
        Rifia = 771, // ���t�B�A
        Gyorru = 769, // �M���b��
        Mafu = 768, // �}�t�[
        Syurugu = 763, // �V�����O
        MugenNoSyo = 759, // �����̏�
        MizuNoHimatsu = 755, // ���̔�
        SeireiNoBreath = 410, // ����̃u���X
        AnyaryuNoBreath = 408, // �Ö闳�̃u���X
        ManatsuNoBreath = 407, // �^�Ẵu���X
        KiriNoBreath = 406, // ���̃u���X
        MizuNoBreathPlus = 405, // ���̃u���X+
        MizuNoBreath = 404, // ���̃u���X
        JaryuNoBreath = 403, // �ח��̃u���X
        YamiNoBreathPlus = 400, // �ł̃u���X+
        YamiNoBreath = 395, // �ł̃u���X
        IzunNoKajitsu = 251, // �C�Y���̉ʎ�
        Roputous = 249, // ���v�g�E�X
        Nagurufaru = 246, // �i�O���t�@��
        Gureipuniru = 245, // �O���C�v�j��
        Gurimowaru = 241, // �O�������[��
        Faraflame = 240, // �t�@���t���C��
        Simuberin = 234, // �V���x����
        Buryunhirude = 233, // �u�������q���f
        ShiningBowPlus = 216, // �V���C�j���O�{�E+
        ShiningBow = 215,
        ShikkyuMyurugure = 209, // ���|�~�����O��
        SenhimeNoWakyu = 208, // ��P�̘a�|
        Nizuheggu = 198, // �j�[�Y�w�b�O
        KuraineNoYumiPlus = 193, // �N���C�l�̋|
        KuraineNoYumi = 192,
        FujinYumi = 186, // ���_�|
        AnkigoroshiNoYumiPlus = 183, // �Ê�E���̋|
        AnkigoroshiNoYumi = 182,
        SerujuNoKyoufu = 172, // �Z���W���̋���
        Garumu = 171, // �K����
        YoheidanNoSenfu = 167, // �b���c�̐핀
        TenraiArumazu = 166, // �V���A���}�[�Y
        KamiraNoEnfu = 161, // �J�~���̉���
        Noatun = 132, // �m�[�A�g�D�[��
        GiyuNoYari = 115, // �`�E�̑�
        HinokaNoKounagitou = 106, // �q�m�J�̍g�㓁
        Geirusukeguru = 98, // �Q�C���X�P�O��
        Vidofuniru = 97, // ���B�h�t�j��
        MasyouNoYari = 96, // �����̑�
        Jikumunt = 82, // �W�[�N�����g
        Fensariru = 81, // �t�F���T����
        KokouNoKen = 66, // �Ǎ��̌�
        Niu = 65, // �j�[�E
        Revatein = 64, // ���[���@�e�C��
        ShinkenFalcion = 61, // �_���t�@���V�I��
        OukeNoKen = 60, // ���Ƃ̌�
        HikariNoKen = 53, // ���̌�
        FukenFalcion = 51, // �����t�@���V�I��
        SeikenThirufingu = 36, // �����e�B���t�B���O
        Rigarublade = 28, // ���K���u���C�h
        Ekkezakkusu = 26, // �G�b�P�U�b�N�X

        Uchikudakumono = 1158, // �ł��ӂ�����
        HigaimosoNoYumi = 1160, // ��Q�ϑz�̋|
        GrayNoHyouken = 1161, // �O���C���G��
        SuyakuNoKen = 1162, // ����̌�
        KokyousyaNoYari = 1163, // �Ë��҂̑�

        HakutoshinNoNinjin = 1170, // ���e�_�̐l�Q
        OgonNoFolkPlus = 1171, // �����̃t�H�[�N+
        HarukazeNoBreath = 1173, // �t���̃u���X
        NinjinhuNoSosyokuPlus = 1175, // �l�Q���̑���+

        VoidTome = 1176, // �△�̏�
        SpendthriftBowPlus = 1179, // ����s�̋|+
        RinkahNoOnikanabo = 1180, // �����J�̋S���_
        AstralBreath = 1183, // �����̃u���X

        SatougashiNoAnki = 1187, // �����َq�̈Ê�
        AokarasuNoSyo = 1185, // ����̏�
        RosenshiNoKofu = 1186, // �V��m�̌Õ�
        IagosTome = 1188, // �}�N�x�X�̘f��

        FeatherSword = 1234, // �t�F�U�[�\�[�h
        WindsOfChange = 1236, // �\���̕�
        WhitedownSpear = 1238, // �������Ă̑�

        AkaiRyukishiNoOno = 1288, // �Ԃ����R�m�̕�

        SeijuNoKeshinHiko = 1299, // ���b�̉��g�E��s

        Aymr = 1302, // �A�C���[��
        ChaosRagnell = 1308, // ���׃��O�l��
        DarkScripture = 1311, // �Í��̐���
        BloodTome = 1313, // �����̌���
        BrutalBreath = 1315, // �b���̃u���X
        KarenNoYumi = 1305, // ����̋|
        RuneAxe = 1306, // ���[���A�N�X
        JukishiNoJuso = 1307, // �d�R�m�̏d��

        Gurgurant = 1317, // �O���O�����g
        BridesFang = 1318, // �T�ԉł̉�
        PledgedBladePlus = 1320, // �ԉł̌쓁+
        GroomsWings = 1322, // ����ԉł̗�
        JoyfulVows = 1323, // �K���̐���
        HugeFanPlus = 1324, // �傫�Ȑ�q+
        DaichiBoshiNoBreath = 1350, // ��n��_�̃u���X
        ApotheosisSpear = 1356, // ���̌ܘA���̕�
        Amatsu = 1358, // �A�}�c
        BarrierAxePlus = 1360, // �o���A�̕�+
        FlowerOfEase = 1361, // �����̉Ԃ̌�
        LevinDagger = 1363, // �T���_�[�_�K�[
        HewnLance = 1348, // �h�j�̖p��
        SnipersBow = 1349, // �_����̋|
        StalwartSword = 1347, // ���b�̌�
        ExoticFruitJuice = 1366, // �y���̉ʏ`
        CoralBowPlus = 1368, // �T���S�̋|+
        FloraGuidPlus = 1370, // �A���}��+
        SummerStrikers = 1372, // ��Ă̐_��
        YashiNoKiNoTsuePlus = 1374, // ���V�̖؂̏�+
        VirtuousTyrfing = 1375, // �����e�B���t�B���O
        StarpointLance = 1377, // �C�p�̐���
        HiddenThornsPlus = 1379, // �Ԃ̔�����+
        MelonFloatPlus = 1381, // �������t���[�g+
        ConchBouquetPlus = 1386, // �ق�L�̃u�[�P+
        SunsPercussors = 1382, // ���Ă̐_��
        MeikiNoBreath = 1383, // ���P�̃u���X
        KurooujiNoYari = 1384, // ���c�q�̑�
        BenihimeNoOno = 1385, // �g�P�̕�
        KyupidNoYaPlus = 1388, // �L���[�s�b�g�̖�+
        BladeOfShadow = 1390, // �e�̉p�Y�̌�
        SpearOfShadow = 1393, // �e�̉p�Y�̑�
        CaltropDaggerPlus = 1392, // �R�E�̈Ê�+
        HelsReaper = 1419, // �����w��
        TomeOfOrder = 1436, // �����R���̏�
        SneeringAxe = 1437, // �Ζʂ̕�
        SetsunasYumi = 1438, // �Z�c�i�̊ɋ|
        SkyPirateClaw = 1423, // �V��̊C���̚{��
        HelmBowPlus = 1425, // �ǂ̋|+
        FlowingLancePlus = 1426, // �����{�̑�+
        GateAnchorAxe = 1427, // �g�����d�̕�
        DeckSwabberPlus = 1429, // �f�b�L�u���V+
        DarkSpikesT = 1445, // �_�[�N�X�p�C�NT
        WindParthia = 1446, // �����p���e�B�A
        MoonGradivus = 1449, // �����O���f�B�E�X
        FlowerHauteclere = 1452, // �g�ԃI�[�g�N���[��
        DanielMadeBow = 1447, // �_�j�G���̘B�|

        PrimordialBreath = 1468, // �_�c���̃u���X

        CourtlyMaskPlus = 1470, // ���M�ȉ���+
        CourtlyFanPlus = 1472, // ���M�Ȑ�+
        CourtlyBowPlus = 1474, // ���M�ȋ|+
        CourtlyCandlePlus = 1478, // ���M�ȐC��+
        GiltGoblet = 1476, // �����̃S�u���b�g

        // ��]�����Ċ�]
        TalreganAxe = 1484, // �_�����J�̌���
        DoubleBow = 1480, // �o���t���`�F
        SpiritedSpearPlus = 1482, // �m�C�����̑�+
        BlarfoxPlus = 1479, // �u���[�t�H�b�N�X+
        FlameLance = 1486, // �t���C�������X

        // �v�������A
        FlowerOfPlenty = 1488, // �L���̉�

        // �������̎��n��
        MoonlessBreath = 1491, // �ňł̃u���X
        JokersWild = 1494, // �ϐg�̃J�[�h
        BlackfireBreathPlus = 1496, // ����̃u���X+
        FrostfireBreath = 1498, // ���g�̃u���X
        PaleBreathPlus = 1500, // �D���̃u���X+

        // 2020�N10���B��
        ObsessiveCurse = 1502, // ���O�̎�
        EffiesLance = 1503, // �G���t�B�̑呄

        // ���_�̖l����҂���
        Thunderbrand = 1504, // ���
        CaduceusStaff = 1505, // �J�h�D�P�E�X�̏�
        SpearOfAssal = 1508, // �A�b�T���̑�
        SurvivalistBow = 1509, // �����{�\�̋|

        DarkCreatorS = 1511, // �V��̈Ō�

        // 2020�N10�����`���f�B�~�g��
        Areadbhar = 1513, // �A���h���@��
    };

    enum class PassiveB
    {
        None = -1,
        QuickRiposte1 = 1254, // �؂�Ԃ�1
        QuickRiposte2 = 1255, // �؂�Ԃ�2
        QuickRiposte3 = 599, // �؂�Ԃ�3
        DragonsIre3 = 1493, // ���̋t��3
        Vantage3 = 596, // �҂�����3
        Desperation3 = 597, // �U�ߗ���3
        Cancel1 = 1286,//�L�����Z��1
        Cancel2 = 1287,//�L�����Z��2
        Cancel3 = 631,//�L�����Z��3
        Kyuen2 = 1121, // �~���̍s�H2
        Kyuen3 = 594, // �~���̍s�H3
        Ridatsu3 = 595, // ���E�̍s�H3
        HentaiHiko1 = 1443, // �ґ���s1
        HentaiHiko2 = 1444, // �ґ���s2
        HentaiHiko3 = 635, // �ґ���s3
        KyokugiHiKo1 = 1394, // �ȋZ��s1
        KyokugiHiKo2 = 1395, // �ȋZ��s2
        KyokugiHiKo3 = 636, // �ȋZ��s3
        WrathfulStaff3 = 632, // �_���̏�3
        DazzlingStaff3 = 633, // ���f�̏�3
        ChillAtk1 = 1339,
        ChillAtk2 = 1340,
        ChillAtk3 = 614, // �U���̕���3
        ChillSpd1 = 1341,
        ChillSpd2 = 1342,
        ChillSpd3 = 615, // �����̕���3
        ChillDef1 = 1343,
        ChillDef2 = 1344,
        ChillDef3 = 616, // ����̕���3
        ChillRes1 = 1345,
        ChillRes2 = 1346,
        ChillRes3 = 617, // ���h�̕���3
        ChillAtkRes2 = 1169, // �U�����h�̕���2
        ChillAtkSpd2 = 1239, // �U�������̕���2
        ChillSpdDef2 = 1319, // ��������̕���2
        ChillSpdRes2 = 1371, // �������h�̕���2

        BoldFighter3 = 601, // �U�����`3
        VengefulFighter3 = 602, // �}�����`3
        WaryFighter3 = 600, // ������`3
        SpecialFighter3 = 603,// ���`���`3
        CraftFighter3 = 1483, // �}�~���`3
        SlickFighter3 = 1497, // ���ʑ��`�E����3

        MikiriTsuigeki3 = 757, // ���؂�E�ǌ�����3
        MikiriHangeki3 = 810, // ���؂�E�����s����3

        KyokoNoWakuran3 = 896, // �f��3

        BlazeDance1 = 1278, // �Ɖ΂̕���1
        BlazeDance2 = 1279, // �Ɖ΂̕���2
        BlazeDance3 = 638, // �Ɖ΂̕���3
        GaleDance1 = 1230, // �����̕���1
        GaleDance2 = 1231, // �����̕���2
        GaleDance3 = 639, // �����̕���3
        EarthDance1 = 1147, // ��n�̕���1
        EarthDance2 = 1148, // ��n�̕���2
        EarthDance3 = 640, // ��n�̕���3
        TorrentDance1 = 1241, // �Ð��̕���1
        TorrentDance2 = 1242, // �Ð��̕���2
        TorrentDance3 = 762, // �Ð��̕���3
        FirestormDance2 = 641, // �ƉΎ����̕���2
        CalderaDance1 = 1240, // �ƉΑ�n�̕���1
        CalderaDance2 = 987, // �ƉΑ�n�̕���2
        DelugeDance2 = 644, // �����Ð��̕���2
        FirefloodDance2 = 642, // �ƉΐÐ��̕���2
        GeyserDance1 = 1243, // ��n�Ð��̕���1
        GeyserDance2 = 645, // ��n�Ð��̕���2
        RockslideDance2 = 643, // ������n�̕���2

        // ����
        AtkCantrip3 = 1380, // �U���̖���3
        DefCantrip3 = 1471,

        AtkSpdLink2 = 1133, // �U�������̘A�g2
        AtkSpdLink3 = 648, // �U�������̘A�g3
        AtkResLink3 = 760,
        AtkDefLink3 = 649, // �U������̘A�g3
        SpdDefLink3 = 860, // ��������̘A�g3
        SpdResLink3 = 650, // �������h�̘A�g3
        DefResLink3 = 651, // ������h�̘A�g3

        Swordbreaker3 = 618, // ���E��3
        Lancebreaker3 = 619,
        Axebreaker3 = 620,
        Bowbreaker3 = 621,
        Daggerbreaker3 = 622,
        RedTomebreaker3 = 623,
        BlueTomebreaker3 = 624,
        GreenTomebreaker3 = 625,

        LullAtkDef3 = 950, // �U������̓�3
        LullAtkSpd3 = 994, // �U�������̓�3
        LullAtkRes3 = 1109, // �U�����h�̓�3
        LullSpdDef3 = 952, // ��������̓�3
        LullSpdRes3 = 1156,

        SabotageAtk3 = 846, // �U���̍���3
        SabotageSpd3 = 1026, // �����̍���3
        SabotageDef3 = 937, // ����̍���3
        SabotageRes3 = 867, // ���h�̍���3

        OgiNoRasen3 = 654, // ���`�̗���3

        SealAtk1 = 1455,
        SealAtk2 = 1456,
        SealAtk3 = 607,
        SealSpd1 = 1457,
        SealSpd2 = 1458,
        SealSpd3 = 608,
        SealDef1 = 1459,
        SealDef2 = 1460,
        SealDef3 = 609, // �������3
        SealRes1 = 1461,
        SealRes2 = 1462,
        SealRes3 = 610, // ���h����3
        SealAtkSpd1 = 1463,
        SealAtkSpd2 = 611, // �U����������2
        SealAtkDef1 = 1464,
        SealAtkDef2 = 612,
        SealDefRes1 = 1467,
        SealDefRes2 = 613,
        SealSpdDef1 = 1465,
        SealSpdDef2 = 855,
        SealSpdRes1 = 1466,
        SealSpdRes2 = 1389, // �������h����2

        KoriNoHuin = 660, // �X�̕���
        ToketsuNoHuin = 770, // �����̕���

        Ikari3 = 637, // �{��3
        Renewal1 = 1258, // ��1
        Renewal2 = 1259, // ��2
        Renewal3 = 605, // ��3

        AtkFeint3 = 817, // �U���̋��d3
        SpdFeint3 = 652,
        DefFeint3 = 653,
        ResFeint3 = 829,

        AtkSpdRuse3 = 973, // �U�������̑勤�d3
        DefResRuse3 = 935,
        SpdResRuse3 = 1004,
        SpdDefRuse3 = 1105,
        AtkDefRuse3 = 1141,
        KillingIntent = 999, // ����łق�����

        PoisonStrike3 = 604,
        SacaesBlessing = 655,

        Kazenagi3 = 629, // ���ガ3
        Mizunagi3 = 630, // ���ガ3

        Spurn3 = 1391, // ����E�{��3
        KaihiIchigekiridatsu3 = 1053, // ����E�ꌂ���E3
        KaihiTatakikomi3 = 1100, // ����E�@������3
        Kirikomi = 589, // �؂荞��
        Tatakikomi = 588, // �@������
        Hikikomi = 590, // ��������
        Ichigekiridatsu = 591, // �ꌂ���E

        KyokaMukoKinkyori3 = 646, // ���������E�ߋ���3
        KyokaMukoEnkyori3 = 647, // ���������E������3

        Wanakaijo3 = 858, // 㩉���3

        RunaBracelet = 667, // ���̘r��
        SeimeiNoGofu3 = 772, // �����̌아

        ShisyaNoChojiriwo = 1114, // ���҂̒��K��
        YunesSasayaki = 976, // �����k�̚���
        SphiasSoul = 1076, // �\�t�B�A�̍�
        SDrink = 663, // S�h�����N
        BeokuNoKago = 656, // �x�I�N�̉���

        TsuigekiTaikeiKisu3 = 1009, // �ǌ����`�E�3
        HikariToYamito = 981, // ���ƈł�

        GohoshiNoYorokobi1 = 1252, // ����d�̊��1
        GohoshiNoYorokobi2 = 1253, // ����d�̊��2
        GohoshiNoYorokobi3 = 606, // ����d�̊��3
        SeikishiNoKago = 657, // ���R�m�̉���
        Shishirenzan = 665, // ���q�A�a
        Bushido = 664, // ���m��
        Recovering = 659, // ���J�o�[�����O
        TaiyoNoUdewa = 662, // ���z�̘r��
        KyusyuTaikei3 = 1072, // �}�P���`3
        FuinNoTate = 666, // ����̏�
        TeniNoKona = 661, // �]�ڂ̕�
        TsuigekiRing = 658, // �ǌ������O
        TateNoKodo3 = 634, // ���̌ۓ�3
        AisyoSosatsu3 = 626, // �������E
        Sashitigae3 = 598, // �����Ⴆ3
        ShingunSoshi3 = 593, // �i�R�j�~3
        Surinuke3 = 592, // ���蔲��3
        Tenmakoku3 = 1139, // �V�n�s��3
        KodoNoHukanGusu3 = 1136, // �ۓ��̕��g�E����3
        OddPulseTie3 = 1321, // �ۓ��̕��g�E�3

        BeliefInLove = 1235, // ����M���܂���?
        RagingStorm = 1303, // ����
        SpdResSnag3 = 1367, // �������h�̊���3
        SpdDefSnag3 = 1373, // ��������̊���3
        HolyWarsEnd = 1376, // �Ō�̐���
        GuardBearing3 = 1378, // �x���p��3
        DiveBomb3 = 1430, // �󂩂�̋}�P3

        BlueLionRule = 1451, // �������q��
        BlackEagleRule = 1453, // ���h�̔e��

        Atrocity = 1514, // ���S
    };

    enum class PassiveS
    {
        None = -1,
        HardyBearing1 = 1244,
        HardyBearing2 = 1144,
        HardyBearing3 = 1074, // �s���̎p��
        OgiNoKodou = 1078, // ���`�̌ۓ�
        ArmoredBoots = 1083, // �d���̃u�[�c
        RengekiBogyoKenYariOno3 = 1080, // �A���h��E������3
        RengekiBogyoYumiAnki3 = 1081, // �A���h��E�|�Ê�3
        RengekiBogyoMado3 = 1082, // �A���h��E����3
        HayasaNoKyosei1 = 1434, // �����̋���1
        HayasaNoKyosei2 = 1435, // �����̋���2
        HayasaNoKyosei3 = 1079, // �����̋���3
        MaboNoKyosei1 = 1431, // ���h�̋���1
        MaboNoKyosei2 = 1432, // ���h�̋���2
        MaboNoKyosei3 = 1433, // ���h�̋���3
        GoeiNoGuzo = 1396, // ��q�̋���
        TozokuNoGuzoRakurai = 1397, // �����̋���
        TozokuNoGuzoKobu = 1398,
        TozokuNoGuzoKogun = 1399,
        TozokuNoGuzoKusuri = 1400,
        TozokuNoGuzoOugi = 1401,
        TozokuNoGuzoOdori = 1402,
    };
}