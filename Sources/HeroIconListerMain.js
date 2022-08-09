/**
 * @param  {HeroInfo} a
 * @param  {HeroInfo} b
 */
function compareHeroInfoWeaponType(a, b) {
    return a.weaponTypeValue - b.weaponTypeValue;
}

class AppData {
    constructor() {
        /** @type {HeroInfo[]} */
        this.heroInfos = [];
        /** @type {HeroInfo[]} */
        this.filteredHeroInfos = [];

        this.nameQuery = "";
        this.needsFullMatching = false;
    }

    applyFilter() {
        this.filteredHeroInfos = [];
        const nameQueries = this.nameQuery.split(' ').filter(function (el) {
            return el != "" && el != null;
        });
        for (const info of this.heroInfos) {
            if (this.__isMatched(info.name, nameQueries, this.needsFullMatching)) {
                this.filteredHeroInfos.push(info);
            }
        }

        this.filteredHeroInfos = this.filteredHeroInfos.sort(compareHeroInfoWeaponType);
    }

    __isMatched(name, queries, needsFullMatching) {
        if (queries.length === 0) {
            return true;
        }

        if (needsFullMatching) {
            for (const query of queries) {
                if (name === query) {
                    return true;
                }
            }
        }
        else {
            for (const query of queries) {
                if (name.includes(query)) {
                    return true;
                }
            }
        }
        return false;
    }
}

const g_appData = new AppData();

const g_app = new Vue({
    el: "#app",
    data: g_appData
});


function init(heroInfos) {
    g_appData.heroInfos = heroInfos;
    g_appData.applyFilter();
}
