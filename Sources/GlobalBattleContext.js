
class GlobalBattleContext {
    constructor() {
        this.currentTurn = 0;

        // 現在の手番
        this.currentPhase = 0;
        this.currentPhaseType = UnitGroupType.Ally;

        /** @type {{UnitGroupType,number}} */
        this.restOfPhaseCounts = {};
        this.restOfPhaseCounts[UnitGroupType.Ally] = 0;
        this.restOfPhaseCounts[UnitGroupType.Enemy] = 0;
        this.isAllyPhaseEnded = false;
        this.isEnemyPhaseEnded = false;

        // 英雄決闘の得点エリアのオフセット
        this.summonerDuelsPointAreaOffset = 0;

        // 英雄決闘の特典
        this.summonerDuelsKoScores = {};
        this.summonerDuelsKoScores[UnitGroupType.Ally] = 0;
        this.summonerDuelsKoScores[UnitGroupType.Enemy] = 0;
        this.summonerDuelsCaptureScores = {};
        this.summonerDuelsCaptureScores[UnitGroupType.Ally] = 0;
        this.summonerDuelsCaptureScores[UnitGroupType.Enemy] = 0;

        this.isCombatOccuredInCurrentTurn = false; // 現在のターンで戦闘が発生したかどうか

        // 現在のターンで補助の際の再行動が発動したかどうか
        this.isAnotherActionByAssistActivatedInCurrentTurn = [false, false];
        this.reservedIsAnotherActionByAssistActivatedInCurrentTurn = [false, false];

        // 戦闘でHP0になって退場になったユニットの数
        this.removedUnitCountsInCombat = {};
        this.removedUnitCountsInCombat[UnitGroupType.Ally] = 0;
        this.removedUnitCountsInCombat[UnitGroupType.Enemy] = 0;

        // 現在ターン（敵味方別）で戦闘でHP0になって退場になったユニットの数
        this.removedUnitCountInCombatInCurrentTurnsPhase = {};
        this.removedUnitCountInCombatInCurrentTurnsPhase[UnitGroupType.Ally] = 0;
        this.removedUnitCountInCombatInCurrentTurnsPhase[UnitGroupType.Enemy] = 0;

        // シーズン設定
        this.isLightSeason = true;
        this.isAstraSeason = false;
        this.isFireSeason = false;
        this.isEarthSeason = false;
        this.isWindSeason = false;
        this.isWaterSeason = false;

        // isLightSeasonとisAstraSeasonから判定できるので保存はしない一時変数
        this.isChaosSeason = false;

        // 奥義以外の祈りが発動した回数
        this.miracleAndHealWithoutSpecialActivationCount = {};
        this.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Ally] = 0;
        this.miracleAndHealWithoutSpecialActivationCount[UnitGroupType.Enemy] = 0;
        // 現在ターンで祈りが発動した回数
        this.miracleWithoutSpecialActivationCountInCurrentTurn = {};
        this.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Ally] = 0;
        this.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Enemy] = 0;

        this.oncePerTurnSkillsForTheEntireMapInCurrentTurn = {
            [UnitGroupType.Ally]: new Set(),
            [UnitGroupType.Enemy]: new Set(),
        }

        // 現在ターンで行われた戦闘の回数
        // 自軍・敵軍は別カウントなのでこの変数1つで管理する
        this.numOfCombatOnCurrentTurn = 0;
    }

    moveSummonerDuelsPointAreaOffset(groupType) {
        if (groupType == UnitGroupType.Ally) {
            ++this.summonerDuelsPointAreaOffset;
        }
        else {
            --this.summonerDuelsPointAreaOffset;
        }
    }
    /**
     * @param  {Number} beginTurn
     * @param  {Number} endTurn
     * @returns {Boolean}
     */
    isCurrentTurnIn(beginTurn, endTurn) {
        return beginTurn <= this.currentTurn && this.currentTurn <= endTurn;
    }

    get isOddTurn() {
        return this.currentTurn % 2 === 1;
    }

    get isEvenTurn() {
        return this.currentTurn % 2 === 0;
    }

    get isFirstTurn() {
        return this.currentTurn === 1;
    }

    get isSummonerDuelsTurnEnded() {
        return this.isAllyPhaseEnded && this.isEnemyPhaseEnded;
    }
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     */
    addSummonerDuelsKoScore(atkUnit, defUnit) {
        let winner = defUnit.isDead ? atkUnit : atkUnit.isDead ? defUnit : null;
        if (winner == null) {
            return;
        }

        let looser = winner == atkUnit ? defUnit : atkUnit;
        this.summonerDuelsKoScores[winner.groupId] += 2;
        if (winner.isCaptain) {
            this.summonerDuelsKoScores[winner.groupId] += 1;
        }
        if (looser.isCaptain) {
            this.summonerDuelsKoScores[winner.groupId] += 1;
        }
    }

    /**
     * @param  {Unit[]} allyUnitsOnPointArea
     * @param  {Unit[]} enemyUnitsOnPointArea
     */
    addSummonerDuelsCaptureScore(allyUnitsOnPointArea, enemyUnitsOnPointArea) {
        let allyEvalCount = allyUnitsOnPointArea.length + this.__getCaptureScoreEvalCount(allyUnitsOnPointArea);
        let enemyEvalCount = enemyUnitsOnPointArea.length + this.__getCaptureScoreEvalCount(enemyUnitsOnPointArea);
        if (allyEvalCount >= enemyEvalCount + 2) {
            this.summonerDuelsCaptureScores[UnitGroupType.Ally] += 2;
        }
        else if (enemyEvalCount >= allyEvalCount + 2) {
            this.summonerDuelsCaptureScores[UnitGroupType.Enemy] += 2;
        }
    }

    /**
     * @param  {Unit[]} unitsOnPointArea
     */
    __getCaptureScoreEvalCount(unitsOnPointArea) {
        let captainUnit = unitsOnPointArea.find(x => x.isCaptain);
        return unitsOnPointArea.length + (captainUnit != null && captainUnit.getCaptainSkill() == Captain.Turmoil ? 1 : 0);
    }

    endSummonerDuelsTurn() {
        if (this.currentPhaseType == UnitGroupType.Ally) {
            this.isAllyPhaseEnded = true;
            this.currentPhaseType = UnitGroupType.Enemy;
        }
        else {
            this.isEnemyPhaseEnded = true;
            this.currentPhaseType = UnitGroupType.Ally;
        }
    }

    gainSummonerDuelsPhase(endsTurnOfCurrentPhase = false) {
        switch (this.currentPhaseType) {
            case UnitGroupType.Ally:
                if (endsTurnOfCurrentPhase) {
                    this.isAllyPhaseEnded = true;
                }
                else {
                    --this.restOfPhaseCounts[UnitGroupType.Ally];
                    if (this.restOfPhaseCounts[UnitGroupType.Ally] == 0) {
                        this.isAllyPhaseEnded = true;
                    }
                }
                if (!this.isEnemyPhaseEnded) {
                    this.currentPhaseType = UnitGroupType.Enemy;
                }
                break;
            case UnitGroupType.Enemy:
                if (endsTurnOfCurrentPhase) {
                    this.isEnemyPhaseEnded = true;
                }
                else {
                    --this.restOfPhaseCounts[UnitGroupType.Enemy];
                    if (this.restOfPhaseCounts[UnitGroupType.Enemy] == 0) {
                        this.isEnemyPhaseEnded = true;
                    }
                }
                if (!this.isAllyPhaseEnded) {
                    this.currentPhaseType = UnitGroupType.Ally;
                }
                break;
        }
    }
    /**
     * @param  {Number} allyCaptainSkill
     * @param  {Number} enemyCaptainSkill
     */
    initializeSummonerDuelsTurnContext(allyCaptainSkill, enemyCaptainSkill) {
        if (this.currentTurn == 1) {
            this.currentPhaseType = UnitGroupType.Ally;
        }
        else {
            this.currentPhaseType = this.__getNextFirstPhaseType(allyCaptainSkill, enemyCaptainSkill);
        }
        this.restOfPhaseCounts[UnitGroupType.Ally] = 6;
        this.restOfPhaseCounts[UnitGroupType.Enemy] = 6;
        if (this.currentTurn === 2 || this.currentTurn === 4) {
            if (allyCaptainSkill == Captain.QuickDraw) {
                --this.restOfPhaseCounts[UnitGroupType.Enemy];
            }
            if (enemyCaptainSkill == Captain.QuickDraw) {
                --this.restOfPhaseCounts[UnitGroupType.Ally];
            }
        }
        this.isAllyPhaseEnded = false;
        this.isEnemyPhaseEnded = false;
    }

    __getNextFirstPhaseType(allyCaptainSkill, enemyCaptainSkill) {
        if (allyCaptainSkill == Captain.QuickDraw && enemyCaptainSkill != Captain.QuickDraw) {
            return UnitGroupType.Ally;
        }
        if (allyCaptainSkill != Captain.QuickDraw && enemyCaptainSkill == Captain.QuickDraw) {
            return UnitGroupType.Enemy;
        }
        if (this.restOfPhaseCounts[UnitGroupType.Ally] > this.restOfPhaseCounts[UnitGroupType.Enemy]) {
            return UnitGroupType.Ally;
        }
        else if (this.restOfPhaseCounts[UnitGroupType.Ally] < this.restOfPhaseCounts[UnitGroupType.Enemy]) {
            return UnitGroupType.Enemy;
        }
        else {
            return this.currentPhaseType == UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
        }
    }

    *enumerateCurrentSeasons() {
        if (this.isChaosSeason) {
            yield SeasonType.Chaos;
        }
        if (this.isLightSeason) {
            yield SeasonType.Light;
            yield SeasonType.Dark;
        }
        if (this.isAstraSeason) {
            yield SeasonType.Astra;
            yield SeasonType.Anima;
        }
        if (this.isFireSeason) {
            yield SeasonType.Fire;
        }
        if (this.isWaterSeason) {
            yield SeasonType.Water;
        }
        if (this.isEarthSeason) {
            yield SeasonType.Earth;
        }
        if (this.isWindSeason) {
            yield SeasonType.Wind;
        }
    }

    setChaosSeasonFromCurrentSeasons() {
        this.isChaosSeason = !this.isLightSeason && !this.isAstraSeason;
    }

    applyReservedStateForSupportSkills(group) {
        if (this.reservedIsAnotherActionByAssistActivatedInCurrentTurn[group]) {
            this.isAnotherActionByAssistActivatedInCurrentTurn[group] = true;
            this.reservedIsAnotherActionByAssistActivatedInCurrentTurn[group] = false;
        }
    }

    incrementRemovedUnitCount(groupId) {
        this.removedUnitCountsInCombat[groupId]++;
        this.removedUnitCountInCombatInCurrentTurnsPhase[groupId]++;
    }

    initContextInCurrentTurnsPhase(groupId) {
        this.isAnotherActionByAssistActivatedInCurrentTurn[groupId] = false;
        this.numOfCombatOnCurrentTurn = 0;
        this.removedUnitCountInCombatInCurrentTurnsPhase[groupId] = 0;
    }

    initContextInCurrentTurn() {
        this.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Ally] = 0;
        this.miracleWithoutSpecialActivationCountInCurrentTurn[UnitGroupType.Enemy] = 0;
        this.oncePerTurnSkillsForTheEntireMapInCurrentTurn = {
            [UnitGroupType.Ally]: new Set(),
            [UnitGroupType.Enemy]: new Set(),
        }
    }

    isMiracleWithoutSpecialActivatedInCurrentTurn(groupId) {
        return this.miracleWithoutSpecialActivationCountInCurrentTurn[groupId] >= 1;
    }
}
