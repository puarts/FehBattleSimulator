/// @file
/// @brief TurnSetting クラスとそれに関連するクラスや関数等の定義です。

/// シリアライズ可能なシミュレーターの設定です。
class TurnSetting {
    constructor(turn) {
        this._turn = turn;
        this._app = null;
        this._structures = [];
        this._units = [];
        this._deserializedStructures = [];
        this._tiles = [];
    }
    setAppData(appData) {
        this._app = appData;
    }
    get serialId() {
        return TurnSettingCookiePrefix + this._turn;
    }
    pushUnit(setting) {
        this._units.push(setting);
    }
    pushStructure(setting) {
        this._structures.push(setting);
    }
    pushTile(tile) {
        this._tiles.push(tile);
    }
    /**
     * @param  {String} serialId
     * @returns {Unit}
     */
    __findUnit(serialId) {
        for (let i = 0; i < this._units.length; ++i) {
            let unit = this._units[i];
            if (unit.serialId == serialId) {
                return unit;
            }
        }
        return null;
    }
    __findStructure(serialId) {
        for (let i = 0; i < this._structures.length; ++i) {
            let structure = this._structures[i];
            if (structure.serialId == serialId) {
                return structure;
            }
        }
        return null;
    }
    __findTile(serialId) {
        for (let i = 0; i < this._tiles.length; ++i) {
            let target = this._tiles[i];
            if (target.serialId == serialId) {
                return target;
            }
        }
        return null;
    }

    isDeserialized(structure) {
        for (let st of this._deserializedStructures) {
            if (st == structure) {
                return true;
            }
        }
        return false;
    }

    perTurnStatusToString() {
        return this.__toString(x => x.perTurnStatusToString());
    }

    turnWideStatusToString() {
        return this.__toString(x => x.turnWideStatusToString());
    }

    toString() {
        return this.__toString(x => x.toString());
    }

    __toString(toStringFunc) {
        let result = "";
        if (this._app != null) {
            result += "map" + NameValueDelimiter + toStringFunc(this._app) + ElemDelimiter;
        }
        for (let i = 0; i < this._units.length; ++i) {
            let unit = this._units[i];
            result += unit.serialId + NameValueDelimiter + toStringFunc(unit) + ElemDelimiter;
        }
        for (let i = 0; i < this._structures.length; ++i) {
            let structure = this._structures[i];
            result += structure.serialId + NameValueDelimiter + toStringFunc(structure) + ElemDelimiter;
        }
        for (let i = 0; i < this._tiles.length; ++i) {
            let tile = this._tiles[i];
            let serialized = toStringFunc(tile);
            if (serialized != "") {
                result += tile.serialId + NameValueDelimiter + serialized + ElemDelimiter;
            }
        }
        return result;
    }

    fromPerTurnStatusString(source) {
        if (!source) {
            return;
        }
        let elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromPerTurnStatusString(v));
    }

    fromTurnWideStatusString(source) {
        let elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromTurnWideStatusString(v));
    }

    fromString(source) {
        let elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromString(v));
    }

    __fromString(elemTexts, fromStringFunc) {
        this._deserializedStructures = []
        for (let i = 0; i < elemTexts.length; ++i) {
            let elemText = elemTexts[i];
            let splited = elemText.split(NameValueDelimiter);
            let serialId = splited[0];
            let value = splited[1];
            if (serialId == "map") {
                if (this._app != null) {
                    fromStringFunc(this._app, value);
                }
            }
            else if (serialId.startsWith(UnitCookiePrefix)) {
                let unit = this.__findUnit(serialId);
                if (unit != null) {
                    fromStringFunc(unit, value);
                    unit.createSnapshot();
                    unit.reserveCurrentSkills();
                }
            }
            else if (serialId.startsWith(StructureCookiePrefix)) {
                let structure = this.__findStructure(serialId);
                if (structure != null) {
                    // console.log(serialId + "=" + value);
                    fromStringFunc(structure, value);
                    // console.log("   " + structure.posX + ", " + structure.posY);
                    this._deserializedStructures.push(structure);
                }
            }
            else if (serialId.startsWith(TileCookiePrefix)) {
                let tile = this.__findTile(serialId);
                if (tile != null) {
                    fromStringFunc(tile, value);
                }
            }
        }
    }
}
