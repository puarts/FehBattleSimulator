
/// 全ての英雄情報を格納するデータベースです。
class HeroDatabase {
    /**
     * @param {HeroInfo[]} heroInfos
     */
    constructor(heroInfos) {
        /** @type {HeroInfo[]} */
        this._heroInfos = heroInfos;

        /** @type {HeroInfo[]} */
        this.heroInfosWithoutEnemy = Array.from(heroInfos.filter(x => !x.name.includes("敵")));

        /** @type {{String, HeroInfo}} */
        this._nameToInfoDict = {};
        for (let info of heroInfos) {
            this._nameToInfoDict[info.name] = info;
        }

        /** @type {{String, Number}} */
        this._nameToIndexDict = {};
        for (let i = 0; i < this._heroInfos.length; ++i) {
            let info = this._heroInfos[i];
            this._nameToIndexDict[info.name] = i;
        }

        /** @type {Map<Number, HeroInfo>} */
        this._idToInfoDict = new Map();
        /** @type {Map<Number, Number>} */
        this._idToIndexDict = new Map();
        for (let i = 0; i < this._heroInfos.length; ++i) {
            let info = this._heroInfos[i];
            this._idToInfoDict.set(info.id, info);
            this._idToIndexDict.set(info.id, i);
        }
    }

    /**
     * @returns {HeroInfo[]}
     */
    get data() {
        return this._heroInfos;
    }

    /**
     * @returns {Number}
     */
    get length() {
        return this._heroInfos.length;
    }

    /**
     * @param  {Number} index
     * @returns {HeroInfo}
     */
    getHeroInfo(index) {
        return this._heroInfos[index];
    }

    /**
     * @returns {HeroInfo[]}
     */
    enumerateHeroInfos() {
        return this._heroInfos;
    }

    /**
     * @param  {String} name
     * @returns {String}
     */
    findIcon(name) {
        let info = this.findInfo(name);
        if (info == null) {
            return null;
        }
        return info.icon;
    }

    /**
     * @param  {String} name
     * @returns {HeroInfo}
     */
    findInfo(name) {
        return this._nameToInfoDict[name];
    }

    /**
     * @param  {String} name
     * @returns {Number}
     */
    findIndexOfInfo(name) {
        return this._nameToIndexDict[name];
    }

    /**
     * @param {Number} heroId
     * @returns {HeroInfo}
     */
    getHeroInfoByHeroId(heroId) {
        return this._idToInfoDict.get(heroId);
    }

    /**
     * @param {Number} heroId
     * @returns {Number}
     */
    getHeroIndexByHeroId(heroId) {
        return this._idToIndexDict.get(heroId);
    }
}
