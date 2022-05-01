
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

    gainSummonerDuelsPhase() {
        switch (this.currentPhaseType) {
            case UnitGroupType.Ally:
                --this.restOfPhaseCounts[UnitGroupType.Ally];
                this.currentPhaseType = UnitGroupType.Enemy;
                break;
            case UnitGroupType.Enemy:
                --this.restOfPhaseCounts[UnitGroupType.Enemy];
                this.currentPhaseType = UnitGroupType.Ally;
                break;
        }
    }

    initializeRestOfPhaseCounts() {
        this.restOfPhaseCounts[UnitGroupType.Ally] = 6;
        this.restOfPhaseCounts[UnitGroupType.Enemy] = 6;
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
