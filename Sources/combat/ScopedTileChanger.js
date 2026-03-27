/* global setUnitToTile */

class ScopedTileChanger {
    /**
     * @param {Unit} atkUnit
     * @param {Tile} tileToAttack
     * @param {Function} tileChangedFunc=null
     */
    constructor(atkUnit, tileToAttack, tileChangedFunc = null) {
        this._origTile = atkUnit.placedTile;
        this._atkUnit = atkUnit;
        let isTileChanged = tileToAttack !== this._origTile;
        if (tileToAttack !== null && isTileChanged) {
            tileToAttack.setUnit(atkUnit);
            tileChangedFunc?.();
        }
    }

    dispose() {
        if (this._origTile !== this._atkUnit.placedTile) {
            // ユニットの位置を元に戻す
            setUnitToTile(this._atkUnit, this._origTile);
        }
    }
}
