/// @file
/// @brief Cell クラスとそれに関連するクラスや関数等の定義です。

const CellType = {
    Normal: 0,
    Header: 1,
};

/// Table クラスのセルを表すクラスです。
class Cell {
    constructor() {
        this.setToDefault();
    }
    setToDefault() {
        this._type = CellType.Normal;
        this._innerText = '';
        this._bgColor = "#ffffff";
        this._fontColor = "#000000";
        this._borderColor = "#aaaaaa";
        this._borderWidth = "1px";
        this.borderStyle = "solid";
    }
    get innerText() {
        return this._innerText;
    }
    set innerText(value) {
        this._innerText = value;
    }
    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
    }
    get bgColor() {
        return this._bgColor;
    }
    set bgColor(value) {
        this._bgColor = value;
    }
    get fontColor() {
        return this._fontColor;
    }
    set fontColor(value) {
        this._fontColor = value;
    }
    get borderColor() {
        return this._borderColor;
    }
    set borderColor(value) {
        this._borderColor = value;
    }
    get borderWidth() {
        return this._borderWidth;
    }
    set borderWidth(value) {
        this._borderWidth = value;
    }

    getHtmlTagName() {
        switch (this.type) {
            case CellType.Header:
                return "th";
            case CellType.Normal:
                return "td";
            default:
                return "td";
        }
    }
}
