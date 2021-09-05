
/// 全ての英雄情報を格納するデータベースです。
class HeroDatabase {
    constructor(heroInfos) {
        this._heroInfos = heroInfos;
        this._nameToInfoDict = {};
        for (let info of heroInfos) {
            this._nameToInfoDict[info.name] = info;
        }

        this._nameToIndexDict = {};
        for (let i = 0; i < this._heroInfos.length; ++i) {
            let info = this._heroInfos[i];
            this._nameToIndexDict[info.name] = i;
        }
    }

    get data() {
        return this._heroInfos;
    }

    get length() {
        return this._heroInfos.length;
    }

    get(index) {
        return this._heroInfos[index];
    }

    findIcon(name) {
        let info = this.findInfo(name);
        if (info == null) {
            return null;
        }
        return info.icon;
    }

    findInfo(name) {
        return this._nameToInfoDict[name];
    }

    findIndexOfInfo(name) {
        return this._nameToIndexDict[name];
    }
}
