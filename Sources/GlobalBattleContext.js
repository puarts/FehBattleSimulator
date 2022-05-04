
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
        // 戦闘でHP0になって退場になったユニットの数
        this.RemovedUnitCountsInCombat = {};
        this.RemovedUnitCountsInCombat[UnitGroupType.Ally] = 0;
        this.RemovedUnitCountsInCombat[UnitGroupType.Enemy] = 0;

        // シーズン設定
        this.isLightSeason = true;
        this.isAstraSeason = false;
        this.isFireSeason = false;
        this.isEarthSeason = false;
        this.isWindSeason = false;
        this.isWaterSeason = false;
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
        this.summonerDuelsKoScores[atkUnit.groupId] += 2;
        if (atkUnit.isCaptain) {
            this.summonerDuelsKoScores[atkUnit.groupId] += 1;
        }
        if (defUnit.isCaptain) {
            this.summonerDuelsKoScores[atkUnit.groupId] += 1;
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
}
