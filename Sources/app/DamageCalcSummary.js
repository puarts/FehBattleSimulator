/// @file
/// @brief ダメージ計算サマリーのHTML生成を切り出した実装です。

class DamageCalcSummary {
    /**
     * @param  {Unit} unit
     * @param  {Unit} enemyUnit
     * @param  {Unit} originalEnemyUnit
     * @param  {Number} preCombatDamage
     * @param damageToEnemyAfterBeginningOfCombat
     * @param  {Number} damage
     * @param  {Number} attackCount
     * @param  {Number} atk
     * @param  {Number} spd
     * @param  {Number} def
     * @param  {Number} res
     * @param  {Tile} tile
     * @param  {boolean} isAlly
     * @param  {GlobalBattleContext} globalBattleContext
     * @param  {boolean} isDebugMenuEnabled
     */
    createDamageCalcSummaryHtml(unit, enemyUnit, originalEnemyUnit,
        preCombatDamage, damageToEnemyAfterBeginningOfCombat, damage, attackCount,
        atk, spd, def, res, tile, isAlly, globalBattleContext, isDebugMenuEnabled) {
        // ダメージに関するサマリー
        let html = this.createDamageSummaryHtml(unit, originalEnemyUnit, preCombatDamage, damageToEnemyAfterBeginningOfCombat, damage, attackCount, tile, isAlly, globalBattleContext);
        // ステータスやバフに関するサマリー
        html += this.createStatusSummaryHtml(unit, atk, spd, def, res, isDebugMenuEnabled);

        return `<div class="summary-damage-figure summary-text-shadow">${html}</div>`;
    }

    createDamageSummaryHtml(unit, originalEnemyUnit, preCombatDamage, damageToEnemyAfterBeginningOfCombat, damage, attackCount, tile, isAllyArea, globalBattleContext) {
        let divineHtml = '';
        // 天脈
        if (tile.hasDivineVein()) {
            divineHtml = this.#getDivineVeinSummaryHtml(tile, isAllyArea);
        }
        // HPリザルト
        let restHpHtml = unit.restHp === 0 ?
            `<span style='color:#ffaaaa'>${unit.restHp}</span>` :
            unit.restHp;
        let html = `${divineHtml}HP: ${unit.hp} → ${restHpHtml}`
        if (originalEnemyUnit.hasStatusEffect(StatusEffectType.ForesightSnare) &&
            globalBattleContext.numOfCombatOnCurrentTurn === 0) {
            let tag = getStatsEffectImgTag(StatusEffectType.ForesightSnare);
            tag.style.width = '1.5em';
            tag.style.height = '1.5em';
            html += ' ' + tag.outerHTML;
        }
        html += `<br/>`;

        // 奥義カウント、ダメージ表示
        let special = '';
        if (unit.special === Special.None) {
            special = '';
        } else if (unit.specialCount === 0) {
            let tag = getSpecialChargedImgTag();
            tag.classList.add('summary-icon');
            special = tag.outerHTML;
        } else {
            special = `${unit.specialCount}`;
        }
        let specialHtml = `<span style="color: pink;">${special}&nbsp;&nbsp;&nbsp;</span>`;
        let damageHtml;
        if (attackCount > 0) {
            let precombatHtml = preCombatDamage > 0 ? `${preCombatDamage}+` : "";
            let afterBeginningOfCombatHtml = damageToEnemyAfterBeginningOfCombat > 0 ? `${damageToEnemyAfterBeginningOfCombat}+` : "";
            // 特効は緑表示にする
            let combatHtml = unit.battleContext.isEffectiveToOpponent ?
                `<span style='color:#00FF00'>${damage}</span>` :
                `${damage}`;
            if (attackCount > 1) {
                combatHtml += `×${attackCount}`;
            }
            damageHtml = `${precombatHtml}${afterBeginningOfCombatHtml}${combatHtml}`;
        } else {
            let afterBeginningOfCombatHtml = damageToEnemyAfterBeginningOfCombat > 0 ? `${damageToEnemyAfterBeginningOfCombat}+` : "";
            damageHtml = `${afterBeginningOfCombatHtml}-`;
        }
        html += `${specialHtml}&nbsp;${damageHtml}<br/>`;
        return html;
    }

    #getDivineVeinSummaryHtml(tile, isAllyArea) {
        let html = '';
        let isAllyDivineVein = tile.divineVeinGroup === UnitGroupType.Ally;
        let team = isAllyArea ? 'ally' : 'enemy';
        html += `<div class="summary-divine-vein-${team}-area">`;

        let divineVein = tile.divineVein;

        let bgClass = isAllyDivineVein ? 'summary-divine-vein-bg-ally' : 'summary-divine-vein-bg-enemy';
        let turn = `<span class="summary-divine-vein-turn ${bgClass}">&nbsp;${tile.divineVeinTurns}&nbsp;</span> `;

        let divineVeinImgTag = getDivineVeinTag(divineVein);
        divineVeinImgTag.classList.add('summary-icon-big');
        let img = divineVeinImgTag.outerHTML;

        if (isAllyArea) {
            html += img;
            html += turn;
        } else {
            html += turn;
            html += img;
        }
        html += '</div>';
        return html;
    }

    createStatusSummaryHtml(unit, atk, spd, def, res, isDebugMenuEnabled) {
        let html = "";
        // 増加分、実際の戦闘中ステータス、紋章バフ表示
        let snapshot = unit.snapshot;
        let names = ['攻', '速', '防', '魔'];
        names = names.map(n => `<span class="summary-damage-label">${n}</span>`);
        let actualStatuses = [atk, spd, def, res];
        let statusHtml = actualStatuses.map((v, i) => `${names[i]}${v}`).join("&nbsp;");
        if (snapshot != null) {
            // 増加分
            let displayStatuses = unit.getStatusesInPrecombat();
            let toIncHtml = (v, i) => `${names[i]}${getIncHtml(v - displayStatuses[i])}`;
            let incHtml = actualStatuses.map(toIncHtml).join("&nbsp;");
            html += `${incHtml}<br/>`;

            if (isDebugMenuEnabled) {
                html += `<hr>`;
            }

            // 戦闘中ステータス
            html += `${statusHtml}<br/>`;

            // 紋章バフ
            let spurs = snapshot.getSpurs();
            let toSpurHtml = (v, i) => `${names[i]}${getIncHtml(v)}`;
            let spurHtml = spurs.map(toSpurHtml).join("&nbsp;");
            if (isDebugMenuEnabled) {
                html += `${spurHtml}`;
            }
        } else {
            let zeroIncHtml = [0, 0, 0, 0].map((v, i) => `${names[i]}${v}`).join(", ");
            html += zeroIncHtml + '<br/>';
            if (isDebugMenuEnabled) {
                html += `<hr>`;
            }
            html += `${statusHtml}<br/>`;
            if (isDebugMenuEnabled) {
                html += zeroIncHtml;
            }
        }
        return html;
    }
}
