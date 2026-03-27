import { Query, IterUtil } from './Utilities.js';
import { g_imageRootPath, g_siteRootPath } from './GlobalDefinitions.js';
import { EngagedSpecialIcon } from './SkillConstants.js';
import { UnitGroupType, getStatusEffectName, statusEffectTypeToIconFilePath } from './UnitConstants.js';
import { DivineVeinType } from './Tile.js';

// Game-specific utility functions moved from Utilities.js (Layer 0 → Layer 3+)

/**
 * @param  {Number} number
 */
function getIncHtml(number) {
    if (number < 0) {
        return `<span style="color: #ffaaaa">${number}</span>`
    } else if (number > 0) {
        return `<span style="color: #00eeee">+${number}</span>`
    }
    return `+${number}`;
}

/**
 * @returns {HTMLImageElement}
 */
function getSpecialChargedImgTag() {
    let imgTag = document.createElement('img');
    imgTag.src = `${g_imageRootPath}Special.png`;
    return imgTag;
}

/**
 * @param {number} divineVein
 * @returns {HTMLElement}
 */
function getDivineVeinTag(divineVein) {
    if (divineVein === DivineVeinType.None) {
        return document.createElement('div');
    }
    let imgTag = document.createElement('img');
    let path = getDivineVeinImgPath(divineVein);
    if (path) {
        imgTag.src = path;
    }
    return imgTag;
}

/**
 * @param {number} divineVein
 * @returns {string|null}
 */
function getDivineVeinImgPath(divineVein) {
    if (divineVein === DivineVeinType.None) return null;
    return [
        '',
        'DivineVein_Stone.webp',
        'DivineVein_Flame.webp',
        'DivineVein_Green.webp',
        'DivineVein_Haze.webp',
        'DivineVein_Water.jpg',
        'DivineVein_Ice.webp',
        'DivineVein_Icicle.webp',
        'DivineVein_Vert.webp',
    ].map(img => `${g_imageRootPath}${img}`)[divineVein] ?? null;
}

/**
 * @param {number} divineVein
 * @returns {string|null}
 */
function getDivineVeinPath(divineVein) {
    if (divineVein === DivineVeinType.None) return null;
    return [
        0, // None
        56, // Stone
        55, // Flame
        65, // Green
        67, // Haze
        75, // Water
        80, // Ice
    ].map(img => `${g_siteRootPath}?fehse=${img}`)[divineVein];
}

function getDivineVeinTitle(divineVein) {
    return [
        // None
        '',
        // Stone
        '付与されたマスに入る者は以下の効果を受ける。\n味方は受けた範囲奥義のダメージを50%軽減(巨影の範囲奥義を除く)。\n味方は戦闘中、守備、魔防+6、敵の奥義による攻撃のダメージ-10(範囲奥義を除く)(付与マスに既に天脈がある場合、それを上書きする)(同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Flame
        '付与されたマスに入る者は以下の効果を受ける。\n射程2の敵は、移動しづらくなる(移動する際、移動をさらに+1消費する。敵の移動タイプの基本移動力を超えて消費しない。「自分が移動可能な地形を平地のように移動可能」の効果はこの影響を受けない)。\n敵は敵軍ターン開始時に7ダメージ(ダメージ後のHPは最低1)。\n敵は戦闘開始後に7ダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)(付与マスに既に天脈がある場合、それを上書きする)(同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Green
        '付与されたマスに入る者は以下の効果を受ける\n敵はこのマスから、および、このマスへのスキル効果によるワープ移動不可(すり抜けを持つ敵には無効)(制圧戦の拠点等の地形効果によるワープ移動は可)\n敵は戦闘中、奥義発動カウント変動量-1 (同系統効果複数時、最大値適用)(付与マスに既に天脈がある場合、それを上書きする) (同じタイミングに異なる複数の天脈の付与が 発生した場合、天脈は消滅する)',
        // Haze
        '付与されたマスに入る者は以下の効果を受ける\n敵は戦闘中、攻撃、速さ、守備、魔防-5、強化の+が無効になる(無効になるのは、鼓舞や応援等の効果)(付与マスに既に天脈がある場合、それを上書きする)(同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Water
        '付与されたマスに入る者は以下の効果を受ける 射程2の敵は、移動しづらくなる(移動する際、移動をさらに+1消費する。 敵の移動タイプの基本移動力を超えて消費しない。「自分が移動可能な地形を平地のように移動可能」の効果はこの影響を受けない)\n敵は戦闘中、速さ-5、奥義以外のスキルによる 「ダメージを○○%軽減」を半分無効 (無効にする数値は端数切捨て) (範囲奥義を除く)(付与マスに既に天脈がある場合、それを上書きする) (同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Ice
        '付与されたマスは以下の状態になる\n敵軍は進入不可、破壊可能(HP1)\n自軍は進入、および、待機可能\n【天脈・氷】上に自軍がいる場合は 【天新・氷】の破壊より自軍への攻撃が優先される (付与マスに既に天脈がある場合、それを上書きする) (同じタイミングに異なる複数の天脈の付与が 発生した場合、天顔は消滅する) (ロキの上遊戯では付与されない)',
    ][divineVein] ?? '';
}

function getSkillIconDivTag(unit) {
    let div = document.createElement('div');
    if (unit == null) {
        return div;
    }
    let html = '';

    // 補助
    {
        let imgTag = document.createElement('img');
        imgTag.src = `${g_imageRootPath}Support.png`;
        if (!unit.hasSupport) {
            imgTag.classList.add('summary-icon-grey');
        } else {
            imgTag.title = unit.supportInfo?.name;
        }
        html += `<div style="position: relative">${imgTag.outerHTML}</div>`;
    }

    // 奥義
    {
        let imgTag = document.createElement('img');
        if (unit.hasEmblemHero()) {
            imgTag.src = EngagedSpecialIcon[unit.emblemHeroIndex];
        } else {
            imgTag.src = `${g_imageRootPath}Special.png`;
        }
        if (!unit.hasSpecial) {
            imgTag.classList.add('summary-icon-grey');
        } else {
            imgTag.title = unit.specialInfo?.name;
        }
        html += `<div style="position: relative">${imgTag.outerHTML}</div>`;
    }

    // パッシブ
    let infos = [
        unit.passiveAInfo, unit.passiveBInfo, unit.passiveCInfo,
        unit.passiveSInfo, unit.passiveXInfo,
    ];
    let skillTypes = [
        'A.png', 'B.png', 'C.png',
        'S.png', 'X.webp',
    ];
    infos.forEach((info, index) => {
        let icon = document.createElement('img');
        let title = 'スキルなし';
        if (info) {
            icon.src = info.iconPath;
            title = infos[index]?.name;
        } else {
            icon.src = `${g_imageRootPath}None.png`;
        }
        let skillType = `<img src="${g_imageRootPath}${skillTypes[index]}" class="skill-type"/>`;
        html += `<div title="${title}" style="position: relative">${icon.outerHTML}${skillType}</div>`;
    });

    div.innerHTML = html;
    return div;
}

/**
 * @param statusEffect
 * @returns {string}
 */
function getStatsEffectImgTagStr(statusEffect) {
    return getStatsEffectImgTag(statusEffect).outerHTML;
}

function getStatsEffectImgTag(statusEffect) {
    const img = document.createElement("img");

    img.src = statusEffectTypeToIconFilePath(statusEffect);
    img.title = getStatusEffectName(statusEffect);
    img.alt = getStatusEffectName(statusEffect);

    return img;
}


class HtmlLogUtil {
    /**
     * @param {Unit} unit
     * @returns {string}
     */
    static groupNameSpan(unit) {
        let isAlly = unit.groupId === UnitGroupType.Ally;
        let groupClass = isAlly ? "log-ally" : "log-enemy";
        let groupName = isAlly ? "自" : "敵";
        return `<span class="${groupClass}">${groupName}</span>`
    }

    static damageSpan(damage) {
        return `<span class="log-damage">${damage}</span>`;
    }

    static specialSpan(text) {
        return `<span class="log-special-str">${text}</span>`;
    }
}

/**
 * ユニット操作専用のクエリクラス
 * @extends {Query<Unit>}
 * @template {Unit} T
 * @implements {Iterable<Unit>}
 */
class UnitQuery extends Query {
    /**
     * @param {Iterable<Unit>} iterable
     */
    constructor(iterable) {
        // 親クラスの期待する Iterable<any> 等に一時的に見せかける
        super(/** @type {Iterable<any>} */ iterable);
    }

    /**
     * 特定のユニットからの距離で絞り込む
     * @param {Unit} center
     * @param {number} spaces
     * @returns {this}
     */
    within(center, spaces) {
        return this.filter(u => center.distance(u) <= spaces);
    }

    /**
     * @return {this}
     */
    onMap() {
        return this.filter(u => u.isOnMap);
    }

    /**
     * 味方ユニットのみを絞り込む
     * @param {Unit} unit
     * @return {this}
     */
    sameGroup(unit) {
        return this.filter(u => u.isSameGroup(unit) && u !== unit);
    }

    /**
     * 味方ユニットのみを絞り込む（自分含む）
     * @param {Unit} unit
     * @return {this}
     */
    andSameGroup(unit) {
        return this.filter(u => u.isSameGroup(unit));
    }

    /**
     * 敵ユニットのみを絞り込む
     * @param {Unit} unit
     * @return {this}
     */
    differentGroup(unit) {
        return this.filter(u => u.isDifferentGroup(unit));
    }

    /**
     * 支援ユニットのみを絞り込む
     * @param {Unit} unit
     * @return {this}
     */
    supportPartners(unit) {
        return this.filter(u => unit.isPartner(u));
    }

    /**
     * @param {Unit} unit
     * @param {number} spaces
     * @param {boolean} includingUnit
     * @return {this}
     */
    withinSpacesOf(unit, spaces, includingUnit = false) {
        if (includingUnit) {
            return this.filter(u => u.distance(unit) <= spaces);
        } else {
            return this.filter(u => u.distance(unit) <= spaces && u !== unit);
        }
    }

    /**
     * 指定したユニットを中心として、指定した行数（幅）の範囲内にいるユニットを絞り込む
     * 例: rows=3 の場合、中心±1行（合計3行）が対象
     * @param {Unit} unit 中心となるユニット
     * @param {number} totalRows 行数の幅（通常は奇数: 1, 3, 5...）
     * @param {boolean} [includingUnit=false] 中心ユニット自身を含めるか
     * @return {this}
     */
    withinRowsOf(unit, totalRows, includingUnit = false) {
        // "3列"なら中心からの距離は1、"5列"なら2になる
        const distance = Math.floor((totalRows - 1) / 2);

        if (includingUnit) {
            return this.filter(u => Math.abs(u.posY - unit.posY) <= distance);
        } else {
            return this.filter(u => Math.abs(u.posY - unit.posY) <= distance && u !== unit);
        }
    }

    /**
     * 指定したユニットを中心として、指定した列数（幅）の範囲内にいるユニットを絞り込む
     * 例: cols=3 の場合、中心±1列（合計3列）が対象
     * @param {Unit} unit
     * @param {number} totalCols 列数の幅
     * @param {boolean} [includingUnit=false]
     * @return {this}
     */
    withinColumnsOf(unit, totalCols, includingUnit = false) {
        // "3列"なら中心からの距離は1
        const distance = Math.floor((totalCols - 1) / 2);

        if (includingUnit) {
            return this.filter(u => Math.abs(u.posX - unit.posX) <= distance);
        } else {
            return this.filter(u => Math.abs(u.posX - unit.posX) <= distance && u !== unit);
        }
    }

    /**
     * 指定したユニットを中心として、縦または横の指定範囲内（十字範囲）にいるユニットを絞り込む
     * @param {Unit} unit 中心となるユニット
     * @param {number} rowRange 縦方向（行）の幅（例: 3なら上下±1マス）
     * @param {number} colRange 横方向（列）の幅（例: 5なら左右±2マス）
     * @param {boolean} [includingUnit=false] 中心ユニット自身を含めるか
     * @return {this}
     */
    withinRowsOrColumnsOf(unit, rowRange, colRange, includingUnit = false) {
        // それぞれの方向の「中心からの距離」を計算
        const rowDistance = Math.floor((rowRange - 1) / 2);
        const colDistance = Math.floor((colRange - 1) / 2);

        return this.filter(u => {
            // 1. まず自分自身を除外するかどうかの判定
            if (!includingUnit && u === unit) {
                return false;
            }

            // 2. 縦方向の判定（Y座標の差が rowDistance 以内）
            // もしくは、横方向の判定（X座標の差が colDistance 以内）
            const isWithinRow = Math.abs(u.posY - unit.posY) <= rowDistance;
            const isWithinCol = Math.abs(u.posX - unit.posX) <= colDistance;

            // 十字範囲なので「または(OR)」で結合
            return isWithinRow || isWithinCol;
        });
    }

    /**
     * 指定した比較関数でソートする（※即時評価されるため注意）
     * @param {function(Unit, Unit): number} compareFn
     * @returns {this}
     */
    sortBy(compareFn) {
        return this._wrap([...this._it].sort(compareFn));
    }

    /**
     * @param {Unit} unit
     * @return {UnitQuery}
     * @template {Unit} T
     */
    closestFrom(unit) {
        return this._wrap(IterUtil.minElements(this.toArray(), u => u.distance(unit)));
    }

    /**
     * 現在のクエリに含まれるユニット情報をコンソールに出力する
     * @param {string} label - ログの先頭に付けるラベル（識別用）
     * @returns {this}
     */
    printNames(label = '[UnitQuery]') {
        return this.peek((unit, index) => {
            console.log(`${label} index:${index}`, unit.getNameWithGroupAndPos());
        });
    }
}

/**
 * タイル（地形）操作専用のクエリクラス
 * @extends {Query<Tile>}
 */
class TileQuery extends Query {
    /**
     * @param {Unit} unit
     * @return {TileQuery}
     */
    canMoveTo(unit) {
        return this.filter(tile => tile.isUnitPlaceable(unit));
    }

    /**
     * @param {Unit} unit
     * @return {TileQuery}
     */
    inCantoRangeIfCanto(unit) {
        if (!unit.isCantoActivating) {
            return this;
        }
        return this.filter(tile => tile.calculateDistanceToUnit(unit) <= unit.moveCountForCanto);
    }
}

export { getIncHtml, getSpecialChargedImgTag, getDivineVeinTag, getDivineVeinImgPath, getDivineVeinPath, getDivineVeinTitle, getSkillIconDivTag, getStatsEffectImgTagStr, getStatsEffectImgTag, HtmlLogUtil, UnitQuery, TileQuery };
