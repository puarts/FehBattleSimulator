/**
 * @param  {HeroInfo} a
 * @param  {HeroInfo} b
 */
function compareHeroInfoWeaponType(a, b) {
    return a.weaponTypeValue - b.weaponTypeValue;
}

class AppData extends HeroDatabase {
    constructor(heroInfos) {
        super(heroInfos);
        /** @type {HeroInfo[]} */
        this.heroInfos = [];
        /** @type {HeroInfo[]} */
        this.filteredHeroInfos = [];

        /** @type {number} */
        this.iconSize = 40;

        this.bgColor = "#000000";
        this.bgOpacity = 0;
        this.bgColorWithAlpha = "#00000000";

        this.nameQuery = "";
        this.needsFullMatching = false;
    }

    updateBgColor() {
        let alpha = Number(this.bgOpacity);
        let padd = "";
        if (alpha < 16) {
            padd = "0";
        }
        this.bgColorWithAlpha = this.bgColor + padd + alpha.toString(16);
        console.log(this.bgColorWithAlpha);
    }

    applyFilter() {
        this.filteredHeroInfos = [];
        const nameQueries = this.__getNameQueries();
        if (this.needsFullMatching) {
            // 完全一致の時は指定された名前順にアイコンを列挙
            for (const query of nameQueries) {
                if (query in this._nameToInfoDict) {
                    const info = this._nameToInfoDict[query];
                    this.filteredHeroInfos.push(info);
                }
            }
        }
        else {
            for (const info of this.heroInfos) {
                if (this.__isMatched(info.name, nameQueries)) {
                    this.filteredHeroInfos.push(info);
                }
            }
            this.filteredHeroInfos = this.filteredHeroInfos.sort(compareHeroInfoWeaponType);
        }
    }


    __getNameQueries() {
        return this.nameQuery.split(' ').filter(function (el) {
            return el != "" && el != null;
        });
    }

    __isMatched(name, queries) {
        if (queries.length === 0) {
            return true;
        }

        for (const query of queries) {
            if (name.includes(query)) {
                return true;
            }
        }
        return false;
    }
}

let g_appData = null;


function init(heroInfos) {
    g_appData = new AppData(heroInfos);
    const vm = new Vue({
        el: "#app",
        data: g_appData
    });
    g_appData.heroInfos = heroInfos;
    g_appData.applyFilter();
}
