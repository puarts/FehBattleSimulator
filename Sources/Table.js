/// @file
/// @brief Table クラスとそれに関連するクラスや関数等の定義です。

function getCellId(x, y) {
    return `${x}_${y}`;
}

function getPositionFromCellId(cellId) {
    let xy = cellId.split('_');
    let x = Number(xy[0]);
    let y = Number(xy[1]);
    return [x, y];
}

function updateCellBgColor(posX, posY, bgColor, boderColor = null) {
    let cellId = getCellId(posX, posY);
    let cell = document.getElementById(cellId);
    if (cell != null) {
        if (cell.style.backgroundColor != bgColor) {
            cell.style.backgroundColor = bgColor;
            if (boderColor != null) {
                cell.style.boderColor = boderColor;
            }
        }
    }
}

class BackgroundImageInfo {
    constructor(url, postionStyle = "left top", sizeStyle = "contain", repeats = false) {
        this.url = url;
        this.positionStyle = postionStyle;
        this.sizeStyle = sizeStyle;
        this.repeats = repeats;
    }

    toStyle() {
        let repeat = this.repeats ? "repeat" : "no-repeat";
        return `url(${this.url}) ${this.positionStyle} / ${this.sizeStyle} ${repeat}`;
    }
}

/// HTMLのテーブルを構築するためのクラスです。
class Table {
    constructor(columnCount, rowCount) {
        this._columnCount = 0;
        this._rowCount = 0;
        /** @type {Cell[]} */
        this._cells = [];
        this.resize(columnCount, rowCount);
        this._onDropEvent = null;
        this._onDragOverEvent = null;
        this.onDragEndEvent = null;
        this._cellVerticalAlign = null;
        this._tableElem = null;
        /** @type {BackgroundImageInfo[]} */
        this.backgroundImages = [];
    }

    resize(columnCount, rowCount) {
        if (columnCount == this._columnCount && rowCount == this._rowCount) {
            return;
        }

        let oldCount = this._columnCount * this._rowCount;
        this._columnCount = columnCount;
        this._rowCount = rowCount;
        let newCount = columnCount * rowCount;
        let diff = newCount - oldCount;
        for (let i = 0; i < diff; ++i) {
            this._cells.push(new Cell());
        }
    }

    addHeaderRow(cellTexts) {
        let y = this._rowCount;
        this.resize(this._columnCount, this._rowCount + 1);
        for (let x = 0; x < this._columnCount; ++x) {
            let cell = this.getCell(x, y);
            cell.type = CellType.Header;
            cell.innerText = cellTexts[x];
        }
    }

    addRow(cellTexts) {
        let y = this._rowCount;
        this.resize(this._columnCount, this._rowCount + 1);
        for (let x = 0; x < this._columnCount; ++x) {
            let cell = this.getCell(x, y);
            cell.innerText = cellTexts[x];
        }
    }

    set cellVerticalAlign(value) {
        this._cellVerticalAlign = value;
    }

    get columnCount() {
        return this._columnCount;
    }

    get rowCount() {
        return this._rowCount;
    }
    /**
     * @param  {number} x
     * @param  {number} y
     * @returns {Cell}
     */
    getCell(x, y) {
        return this._cells[y * this._columnCount + x];
    }
    setCellInnerText(text, x, y) {
        this._cells[y * this._columnCount + x].innerText = text;
    }
    setCellType(type, x, y) {
        this._cells[y * this._columnCount + x].type = type;
    }

    get onDropEvent() {
        return this._onDropEvent;
    }

    get onDragOverEvent() {
        return this._onDragOverEvent;
    }

    set onDropEvent(value) {
        this._onDropEvent = value;
    }

    set onDragOverEvent(value) {
        this._onDragOverEvent = value;
    }

    updateTableElement() {
        if (this._tableElem == null) {
            this._tableElem = document.createElement("table");
            this._tableElem.setAttribute("border", "0");
        }

        {
            let style = "";
            if (this.backgroundImages.length > 0) {
                let bgStyle = this.backgroundImages.map(x => x.toStyle()).join(",");
                style += `background:${bgStyle};`;
            }

            // style += `background-image:${this.backgroundImage};`;
            // style += "background-size: contain;";
            // style += "border-collapse: separate;";
            style += "border-collapse: collapse;";
            style += "border-spacing: 0px;";
            style += "border-style:none;";
            this._tableElem.setAttribute("style", style);
        }

        this._updateTableElemSize();

        for (let y = 0; y < this._rowCount; ++y) {
            let trElem = this._tableElem.children[y];
            for (let x = 0; x < this._columnCount; ++x) {
                let cellElem = trElem.children[x];
                let cell = this.getCell(x, y);
                cellElem.setAttribute("class", 'droppable-elem');
                let style = "";
                style += `border-style: ${cell.borderStyle};`;
                style += "border-width: " + cell.borderWidth + ";";
                style += "border-color:" + cell.borderColor + ";";
                style += "background-color:" + cell.bgColor + ";";
                style += "color:" + cell.fontColor + ";";
                if (this._cellVerticalAlign != null) {
                    style += "vertical-align:" + this._cellVerticalAlign + ";";
                }
                cellElem.setAttribute("style", style);
                cellElem.setAttribute("id", getCellId(x, y));

                if (this._onDragOverEvent != null) {
                    cellElem.setAttribute("ondragover", this._onDragOverEvent);
                }
                if (this._onDropEvent != null) {
                    cellElem.setAttribute("ondrop", this._onDropEvent);
                }
                if (this.onDragEndEvent != null) {
                    cellElem.setAttribute("ondragend", this.onDragEndEvent);
                }
                cellElem.setAttribute("onmousedown", 'onItemSelected(event);');

                cellElem.innerHTML = cell.innerText;
            }
        }

        return this._tableElem;
    }

    _updateTableElemSize() {
        let diffRowCount = this._rowCount - this._tableElem.childElementCount;
        if (diffRowCount > 0) {
            for (let i = 0; i < diffRowCount; ++i) {
                let trElem = document.createElement("tr");
                this._tableElem.appendChild(trElem);
            }
        }
        else if (diffRowCount < 0) {
            let removeElems = [];
            for (let i = this._tableElem.childElementCount - 1; i >= this._rowCount; --i) {
                let childElem = this._tableElem.children[i];
                removeElems.push(childElem);
            }
            for (let elem of removeElems) {
                this._tableElem.removeChild(elem);
            }
        }

        for (let y = 0; y < this._rowCount; ++y) {
            let trElem = this._tableElem.children[y];
            let diffColumnCount = this._columnCount - trElem.childElementCount;
            if (diffColumnCount > 0) {
                for (let x = 0; x < diffColumnCount; ++x) {
                    let cell = this.getCell(x, y);
                    let cellElemName = cell.getHtmlTagName();
                    let cellElem = document.createElement(cellElemName);
                    trElem.appendChild(cellElem);
                }
            }
            else if (diffColumnCount < 0) {
                let removeElems = [];
                for (let x = trElem.childElementCount - 1; x >= this._columnCount; --x) {
                    let childElem = trElem.children[x];
                    removeElems.push(childElem);
                }
                for (let elem of removeElems) {
                    trElem.removeChild(elem);
                }
            }
        }

        for (let y = 0; y < this._rowCount; ++y) {
            let trElem = this._tableElem.children[y];
            for (let x = 0; x < this._columnCount; ++x) {
                let cellElem = trElem.children[x];
                let cell = this.getCell(x, y);
                let cellElemName = cell.getHtmlTagName();

                if (cellElem.tagName != cellElemName) {
                    let nextElem = cellElem.nextSibling;
                    trElem.removeChild(cellElem);
                    cellElem = document.createElement(cellElemName);

                    trElem.insertBefore(cellElem, nextElem);
                }
            }
        }
    }


    toHtml() {
        let html = "<table border='0' style='border-collapse: separate;border-width: 0px;' >";
        for (let y = 0; y < this._rowCount; ++y) {
            html += "<tr>";
            for (let x = 0; x < this._columnCount; ++x) {
                let index = y * this._columnCount + x;
                let cell = this._cells[index];
                let cellElemName = "td";
                switch (cell.type) {
                    case CellType.Header:
                        cellElemName = "th";
                        break;
                    case CellType.Normal:
                        cellElemName = "td";
                        break;
                    default:
                        break;
                }
                html += "<" + cellElemName + " class='droppable-elem' style='";
                html += "border-style: solid;";
                html += "border-width: " + cell.borderWidth + ";";
                html += "border-color:" + cell.borderColor + ";";
                html += "background-color:" + cell.bgColor + ";";
                html += "color:" + cell.fontColor + ";";
                if (this._cellVerticalAlign != null) {
                    html += "vertical-align:" + this._cellVerticalAlign + ";";
                }
                html += "' ";
                html += "id='" + x + "_" + y + "' ";
                if (this._onDragOverEvent != null) {
                    html += "ondragover='" + this._onDragOverEvent + "' ";
                }
                if (this._onDropEvent != null) {
                    html += "ondrop='" + this._onDropEvent + "' ";
                }
                html += ">" + cell.innerText + "</" + cellElemName + ">";
            }
            html += "</tr>";
        }
        html += "</table>";
        return html;
    }
}