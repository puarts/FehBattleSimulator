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

    __findUnit(serialId) {
        for (var i = 0; i < this._units.length; ++i) {
            var unit = this._units[i];
            if (unit.serialId == serialId) {
                return unit;
            }
        }
        return null;
    }
    __findStructure(serialId) {
        for (var i = 0; i < this._structures.length; ++i) {
            var structure = this._structures[i];
            if (structure.serialId == serialId) {
                return structure;
            }
        }
        return null;
    }
    __findTile(serialId) {
        for (var i = 0; i < this._tiles.length; ++i) {
            var target = this._tiles[i];
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
        var result = "";
        if (this._app != null) {
            result += "map" + NameValueDelimiter + toStringFunc(this._app) + ElemDelimiter;
        }
        for (var i = 0; i < this._units.length; ++i) {
            var unit = this._units[i];
            result += unit.serialId + NameValueDelimiter + toStringFunc(unit) + ElemDelimiter;
        }
        for (var i = 0; i < this._structures.length; ++i) {
            var structure = this._structures[i];
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
        var elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromPerTurnStatusString(v));
    }

    fromTurnWideStatusString(source) {
        var elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromTurnWideStatusString(v));
    }

    fromString(source) {
        var elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromString(v));
    }

    __fromString(elemTexts, fromStringFunc) {
        this._deserializedStructures = []
        for (var i = 0; i < elemTexts.length; ++i) {
            var elemText = elemTexts[i];
            var splited = elemText.split(NameValueDelimiter);
            var serialId = splited[0];
            var value = splited[1];
            if (serialId == "map") {
                if (this._app != null) {
                    fromStringFunc(this._app, value);
                }
            }
            else if (serialId.startsWith(UnitCookiePrefix)) {
                var unit = this.__findUnit(serialId);
                if (unit != null) {
                    fromStringFunc(unit, value);
                    unit.createSnapshot();
                    unit.reserveCurrentSkills();
                }
            }
            else if (serialId.startsWith(StructureCookiePrefix)) {
                var structure = this.__findStructure(serialId);
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
