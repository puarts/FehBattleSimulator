
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

    get isOddTurn() {
        return this.currentTurn % 2 === 1;
    }

    get isEvenTurn() {
        return this.currentTurn % 2 === 0;
    }

    get isSummonerDuelsTurnEnded() {
        return this.isAllyPhaseEnded && this.isEnemyPhaseEnded;
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

    initializeSummonerDuelsTurnContext() {
        if (this.currentTurn == 1) {
            this.currentPhaseType = UnitGroupType.Ally;
        }
        else {
            this.currentPhaseType = this.__getNextFirstPhaseType();
        }
        this.restOfPhaseCounts[UnitGroupType.Ally] = 6;
        this.restOfPhaseCounts[UnitGroupType.Enemy] = 6;
        this.isAllyPhaseEnded = false;
        this.isEnemyPhaseEnded = false;
    }

    __getNextFirstPhaseType() {
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
