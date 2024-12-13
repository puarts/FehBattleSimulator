/// @file
/// @brief マップ上の配置物を表すクラスとそれに関連する関数等の定義です。

const ObjType = {
    None: 0,
    BreakableWall: 1,
    Trap: 2,
};

const OrnamentSettings = [
    { label: "フェーの石像", icon: "FehStatue.png" },
    { label: "フェーの鏡餅", icon: "FehKagamiMochi.png" },
    { label: "2周年のアーチ", icon: "AnniversaryArch.png" },
    { label: "2周年のケーキ", icon: "AnniversaryCake.png" },
    { label: "白銀の王座", icon: "SilverThrone.png" },
    { label: "銅の王座", icon: "BronzeThrone.png" },
    { label: "黄金の王座", icon: "GoldenThrone.png" },
    { label: "あったか暖炉", icon: "Fireplace.png" },
    { label: "雪だるま", icon: "SnowFamily.png" },
    { label: "歓びの花壇", icon: "FlowerBed.png" },
    { label: "ハートの花飾り", icon: "HeartGarland.png" },
    { label: "レトロな街灯", icon: "Streetlamp.png" },
    { label: "武器屋", icon: "WeaponShop.png" },
    { label: "温泉", icon: "HotSprings.png" },
    { label: "宿屋", icon: "Inn.png" },
    { label: "アクセサリー屋", icon: "AccessoryShop.png" },
    { label: "翼竜の彫刻柱", icon: "DragonStatue.png" },
    { label: "鉄製の柵", icon: "IronFence.png" },
    { label: "みんなの本棚", icon: "Bookshelf.png" },
    { label: "絆の語らい", icon: "WordOfBonding.png" },
    { label: "絆の彩り", icon: "SightOfBonding.png" },
    { label: "絆の響き", icon: "SoundOfBonding.png" },
    { label: "音楽堂", icon: "ConcertHall.png" },
    { label: "金鹿の学級旗", icon: "GoldenDeerFlag.png" },
    { label: "青獅子の学級旗", icon: "BlueLionFlag.png" },
    { label: "黒鷲の学級旗", icon: "BlackEagleFlag.png" },
    { label: "畑", icon: "Hatake.png" },
    { label: "食堂", icon: "Syokudo.png" },
    { label: "魔女の窯", icon: "MajoNoKama.png" },
    { label: "かぼちゃのランタン", icon: "KabochaNoRantan.png" },
    { label: "オバケの棺", icon: "ObakeNoHitsugi.png" },
    { label: "年始の門飾り", icon: "NenshiNoKadokazari.png" },
    { label: "赤い灯籠", icon: "AkaiToro.png" },
    { label: "年始のお祝いゲート", icon: "NenshiNoOiwaiGate.png" },
    { label: "3周年カップケーキ", icon: "AnniversaryCupCake.png" },
    { label: "ニザヴェリルの歯車塊", icon: "NisavellirGear.png" },
    { label: "ニザヴェリルの鏡", icon: "NisavellirMirror.png" },
    { label: "グリンブルスティの像", icon: "GullinburstiStatue.png" },
    { label: "アシュの石像", icon: "Structure_Ash_Statue.png" },
    { label: "エルムの石像", icon: "Structure_Elm_Statue.png" },
    { label: "エンブラ帝国旗", icon: "Structure_Flag_of_Embla.png" },
];

function findOrnamentTypeIndexByIcon(icon) {
    for (let i = 0; i < OrnamentSettings.length; ++i) {
        let setting = OrnamentSettings[i];
        if (setting.icon === icon) {
            return i;
        }
    }
    return -1;
}

/**
 * 配置物の基底クラスです。
 * 画像は以下を参照
 * https://feheroes.fandom.com/wiki/Category:Structure_sprites
 */
class StructureBase extends BattleMapElement {
    constructor(id) {
        super();
        this._id = id;
        this.level = 1;
        this.placedTile = null;

        // シリアライズする時に一時的に使用
        this.ownerType = 0;
    }

    get isOnMap() {
        return this.placedTile != null;
    }

    get id() {
        return this._id;
    }

    get name() {
        return "不明";
    }

    get description() {
        return "";
    }

    get hasLevel() {
        return true;
    }

    get isRequired() {
        return false;
    }

    get icon() {
        return g_imageRootPath + this.iconFileName;
    }

    get iconFileName() {
        return "";
    }

    get isExecutable() {
        return true;
    }

    get isBreakable() {
        return true;
    }

    setPos(x, y) {
        this.posX = x;
        this.posY = y;
    }

    get serialId() {
        return StructureCookiePrefix + this.id;
    }

    get amount() {
        let level = Number(this.level);
        if (level <= 9) {
            return level * 5 + 5;
        } else {
            return 9 * 5 + 5 + (level - 9) * 2;
        }
    }

    perTurnStatusToString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY;
    }

    turnWideStatusToString() {
        return this.level;
    }

    fromPerTurnStatusString(value) {
        this.__fromPerTurnStatusStringImpl(value);
    }
    __fromPerTurnStatusStringImpl(value) {
        if (value == null) {
            console.trace("undefined な値が入力されました");
            return [[], 0];
        }

        let values = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this.ownerType = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posY = Number(values[i]); ++i; }
        return [values, i];
    }

    fromTurnWideStatusString(value) {
        let values = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this.level = Number(values[i]); ++i; }
    }

    toString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + this.level;
    }

    fromString(value) {
        let values = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this.ownerType = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posY = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.level = Number(values[i]); ++i; }
    }
}

/// 攻撃施設の基底クラスです。
class OffenceStructureBase extends StructureBase {
    constructor(id) {
        super(id);
    }
}

/// 防衛施設の基底クラスです。
class DefenceStructureBase extends StructureBase {
    constructor(id) {
        super(id);
    }
}

class DefFortress extends DefenceStructureBase {
    constructor(id) {
        super(id);
        this.level = 5;
    }
    get iconFileName() {
        return "Fortress_Red.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "防衛砦";
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class OfFortress extends OffenceStructureBase {
    constructor(id) {
        super(id);
        this.level = 5;
    }
    get iconFileName() {
        return "Fortress.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "攻撃砦";
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class DefBoltTower extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTower_Red.png";
    }
    get name() {
        return "防衛・雷の塔";
    }
    get description() {
        return `3ターン開始時、この設備を中心とした縦7×3マスにいる敵に${this.amount}ダメージ`;
    }
}

class OfBoltTower extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTower.png";
    }
    get name() {
        return "攻撃・雷の塔";
    }
    get description() {
        return `3ターン開始時、この設備を中心とした縦3列にいる敵に${this.amount}ダメージ`;
    }
}

/// 脱出の縄梯子を表すクラスです。
class ExcapeLadder extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }

    get iconFileName() {
        return "EscapeLadder.png";
    }
    get name() {
        return "攻撃・脱出の縄梯子";
    }
    get isExecutable() {
        return false;
    }
    get hasLevel() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

/// エナジーの水瓶を表すクラスです。
class AetherAmphorae extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "AetherAmphorae.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "エナジーの水瓶";
    }
    get isExecutable() {
        return false;
    }
    get hasLevel() {
        return false;
    }
}
/// エナジーの泉を表すクラスです。
class AetherFountain extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "AetherFountain.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "エナジーの泉";
    }
    get isExecutable() {
        return false;
    }
    get hasLevel() {
        return false;
    }
}

class SafetyFence extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "SafetyFence.png";
    }
    get name() {
        return "攻撃・安全柵";
    }
    get description() {
        let value = Number(this.level);
        return `${this.amount}ターン目まで、防衛部隊のターン開始時スキル発動後に、攻撃部隊全員が危険範囲外か、本設備を下段とした縦2×横7マスにいる時、防衛部隊全員を行動終了`;
    }
    get amount() {
        return Number(this.level);
    }
}

class DefArmorSchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "ArmorSchool_Red.png";
    }
    get name() {
        return "防衛・対重装訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵重装の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class OfArmorSchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "ArmorSchool.png";
    }
    get name() {
        return "攻撃・対重装訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵重装の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class DefCatapult extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "Catapult_Red.png";
    }
    get name() {
        return "防衛・投石機";
    }
}

class OfCatapult extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "Catapult.png";
    }
    get name() {
        return "攻撃・投石機";
    }
}

class DefCavalrySchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "CavalrySchool_Red.png";
    }
    get name() {
        return "防衛・対騎馬訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵騎馬の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class OfCavalrySchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "CavalrySchool.png";
    }
    get name() {
        return "攻撃・対騎馬訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵騎馬の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class DefFlierSchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "FlierSchool_Red.png";
    }
    get name() {
        return "防衛・対飛行訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵飛行の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class OfFlierSchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "FlierSchool.png";
    }
    get name() {
        return "攻撃・対飛行訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵飛行の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class DefHealingTower extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HealingTower_Red.png";
    }
    get name() {
        return "防衛・回復の塔";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦5×横5マスにいる味方を${this.amount}回復`;
    }
}

class OfHealingTower extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HealingTower.png";
    }
    get name() {
        return "攻撃・回復の塔";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3×横5マスにいる味方を${this.amount}回復`;
    }
}

class DefInfantrySchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "InfantrySchool_Red.png";
    }
    get name() {
        return "防衛・対歩行訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵歩行の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class OfInfantrySchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "InfantrySchool.png";
    }
    get name() {
        return "攻撃・対歩行訓練所";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいる敵歩行の攻撃、速さ、守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class Ornament extends DefenceStructureBase {
    constructor(id) {
        super(id);
        this.ornamentTypeIndex = 0;
        this._icon = "";
        this.setIconByOrnamentTypeIndex();
    }
    get iconFileName() {
        return this._icon;
    }
    set iconFileName(value) {
        this._icon = value;
    }
    get name() {
        return "装飾・交流設備";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    setIconByOrnamentTypeIndex() {
        this._icon = OrnamentSettings[this.ornamentTypeIndex].icon;
    }
}

class DefPanicManor extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "PanicManor_Red.png";
    }
    get name() {
        return "防衛・恐慌の館";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦7×横3マスにいるHP${this.amount}以下の敵の強化を+ではなく-とする(敵の次回行動終了まで)`;
    }
    get amount() {
        return super.amount + 30;
    }
}

class OfPanicManor extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "PanicManor.png";
    }
    get name() {
        return "攻撃・恐慌の館";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦3列にいるHP${this.amount}以下の敵の強化を+ではなく-とする(敵の次回行動終了まで)`;
    }
    get amount() {
        return super.amount + 30;
    }
}

class DefTacticsRoom extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "TacticsRoom_Red.png";
    }
    get name() {
        return "防衛・軍師の作戦室";
    }
    get description() {
        return `ターン開始時、この設備を中心とした縦7×3マスにいるHP${this.amount}以下の弓、暗器、魔法、杖の敵の移動を最大1マスに制限(敵の次回行動終了まで)`;
    }
    get amount() {
        return super.amount + 30;
    }
}

class OfTacticsRoom extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "TacticsRoom.png";
    }
    get name() {
        return "攻撃・軍師の作戦室";
    }
    get description() {
        return `ターン開始時、この設備と同じ縦列にいるHP${this.amount}以下の弓、暗器、魔法、杖の敵の移動を最大1マスに制限(敵の次回行動終了まで)`;
    }
    get amount() {
        return super.amount + 30;
    }
}

class DefBrightShrine extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BrightShrine_Red.png";
    }
    get name() {
        return "防衛・白の封印祠";
    }
    get description() {
        return `ターン開始時、敵軍内で最も攻撃+速さの合計値が高い敵の攻撃、速さ-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class OfBrightShrine extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BrightShrine.png";
    }
    get name() {
        return "攻撃・白の封印祠";
    }
    get description() {
        return `ターン開始時、敵軍内で最も攻撃+速さの合計値が高い敵の攻撃、速さ-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class DefDarkShrine extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "DarkShrine_Red.png";
    }
    get name() {
        return "防衛・黒の封印祠";
    }
    get description() {
        return `ターン開始時、敵軍内で最も守備+魔防の合計値が高い敵の守備、魔防-${this.amount}(敵の次回行動終了まで)`;
    }
    get amount() {
        return -Number(this.level) - 1;
    }
}

class OfDarkShrine extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "DarkShrine.png";
    }
    get name() {
        return "攻撃・黒の封印祠";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、敵軍内で最も守備+魔防の合計値が高い敵の守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}


class OfHiyokuNoHisyo extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HiyokuNoHisyo.png";
    }
    get name() {
        return "比翼の飛翔";
    }
    get description() {
        return `1～${this.amount}ターン目の間に最初に使用した比翼スキルを、もう一度だけ使用可能な状態にする ※ただし同ターンは使用不可`;
    }
    get amount() {
        return Number(this.level) + 2;
    }
}

class DefHiyokuNoTorikago extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HiyokuNoTorikago.png";
    }
    get name() {
        return "比翼の鳥籠";
    }
    get description() {
        return `防衛部隊に比翼英雄がいる時、1～${this.amount}ターン目の間、敵は比翼スキルを使用できない`;
    }
    get amount() {
        return Number(this.level) + 2;
    }
}

class TileTypeStructureBase extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get name() {
        return "床";
    }
}

/// 罠の基底クラスです。
class TrapBase extends TileTypeStructureBase {
    constructor(id) {
        super(id);
    }

    // noinspection JSCheckFunctionSignatures
    get name() {
        return "罠";
    }
}

class FalseHexTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HexTrap.png";
    }
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "偽・停止の魔法罠";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class HexTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HexTrap.png";
    }
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "停止の魔法罠";
    }
    get isBreakable() {
        return false;
    }
    get description() {
        return `設置したマスで敵が移動終了したとき、その敵がHP${this.amount}以下なら、攻撃や補助スキルをキャンセルし、行動済みにする(魔法罠は、罠解除で解除できない)`;
    }
    get amount() {
        return super.amount + 30;
    }
}

class FalseBoltTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTrap.png";
    }
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "偽・落雷の罠";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class BoltTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTrap.png";
    }
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "落雷の罠";
    }
    get isBreakable() {
        return false;
    }
    get description() {
        return `設置したマスで敵が移動終了したとき、その敵と周囲3マスにいる敵味方に${this.amount}ダメージ(敵の攻撃や補助スキルはキャンセルされる)`;
    }
    get amount() {
        return Number(this.level) * 10;
    }
}

class FalseHeavyTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HeavyTrap.png";
    }
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "偽・重圧の罠";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class HeavyTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HeavyTrap.png";
    }
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "重圧の罠";
    }
    get isBreakable() {
        return false;
    }
    get description() {
        return `設置したマスで敵が移動終了したとき、その敵と周囲2マスにいるHP${this.amount}以下の敵味方の移動を最大1マスに制限(敵の次回行動終了まで)(敵の攻撃や補助スキルはキャンセルされる)`;
    }
    get amount() {
        return super.amount + 30;
    }
}

class OfCallingCircle extends TileTypeStructureBase {
    static getIcon() {
        return `${g_debugImageRootPath}CallingCircle.webp`;
    }

    // noinspection JSCheckFunctionSignatures
    get name() {
        return "攻撃・転移の魔法陣";
    }

    get description() {
        return "3ターン目、増援が登場する。このターン、増援は行動後に再行動可能（1回のみ）。この設備は、攻撃部隊に「増援枠」の神階効果を持つ神階英雄が必要。※詳細は、「飛空城　攻撃部隊編成」のヘルプに記載";
    }

    get icon() {
        return `${g_debugImageRootPath}${this.iconFileName}`;
    }

    get iconFileName() {
        return "CallingCircle.webp";
    }

    get isBreakable() {
        return false;
    }
}

class DefCallingCircle extends TileTypeStructureBase {
    // noinspection JSCheckFunctionSignatures
    get name() {
        return "防衛・転移の魔法陣";
    }

    get description() {
        return "3ターン目、増援が登場する。この設備は、攻撃部隊に「増援枠」の神階効果を持つ神階英雄が必要。※詳細は、「飛空城　攻撃部隊編成」のヘルプに記載";
    }

    get icon() {
        return `${g_debugImageRootPath}${this.iconFileName}`;
    }

    get iconFileName() {
        return "CallingCircle_Red.webp";
    }

    get isBreakable() {
        return false;
    }
}

class Wall extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "Wall.jpg";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get name() {
        return "壁";
    }
    get isBreakable() {
        return false;
    }
}

const BreakableWallIconType = {
    Wall: 0,
    Box: 1,
    Wall2: 2,
    Wall3: 3,
};

class BreakableWall extends DefenceStructureBase {
    constructor(id) {
        super(id);
        this.breakCount = 1;
        this.iconType = BreakableWallIconType.Wall;
    }
    get name() {
        return "壊せる壁";
    }

    get iconFileName() {
        switch (this.iconType) {
            case BreakableWallIconType.Box: return "BreakableBox.png";
            case BreakableWallIconType.Wall2: return "BreakableWall_1.png";
            case BreakableWallIconType.Wall3: return "BreakableWall_2.png";
            case BreakableWallIconType.Wall:
            default:
                return "BreakableWall.png";
        }
    }

    get isBroken() {
        return this.breakCount === 0;
    }
    get type() {
        return ObjType.BreakableWall;
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }

    perTurnStatusToString() {
        return super.perTurnStatusToString()
            + ValueDelimiter + this.breakCount;
    }

    fromPerTurnStatusString(value) {
        if (!value) {
            return;
        }
        let result = super.__fromPerTurnStatusStringImpl(value);
        let splited = result[0];
        let i = result[1];
        if (Number.isInteger(Number(splited[i]))) { this.breakCount = Number(splited[i]); ++i; }
    }

    break() {
        if (this.isBroken) {
            return;
        }

        --this.breakCount;
    }

    reset(breakCount = 1) {
        this.breakCount = breakCount;
    }
}

// TODO: 引数にユニットもしくはグループを追加する(天脈・氷のため)
/// ユニットが通行可能な配置物であるかどうかを判定します。
function isMovableForUnit(structure) {
    if (structure == null) {
        return true;
    }

    return structure instanceof TileTypeStructureBase;
}
