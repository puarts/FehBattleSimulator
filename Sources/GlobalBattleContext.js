
class GlobalBattleContext {
    constructor() {
        this.currentTurn = 0;
        this.isCombatOccuredInCurrentTurn = false; // 現在のターンで戦闘が発生したかどうか
    }

    get isOddTurn() {
        return this.currentTurn % 2 === 1;
    }

    get isEvenTurn() {
        return this.currentTurn % 2 === 0;
    }
}
