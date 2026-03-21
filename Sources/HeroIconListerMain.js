import { createApp } from 'vue';
import { HeroDatabase } from './HeroDatabase.js';
import { heroInfos as sampleHeroInfos } from './SampleHeroInfos.js';

// Side-effect imports for skill registration
import './SkillEffectCore.js';
import './SkillEffectEnv.js';
import './SkillEffect.js';
import './SkillEffectField.js';
import './SkillEffectUnit.js';
import './SkillEffectBattleContext.js';
import './SkillEffectHooks.js';
import './SkillEffectRegistrar.js';
import './SkillEffectAliases.js';
import './CustomSkill.js';
import './SkillImpl.js';
import './SkillImpl202408.js';
import './SkillImpl202501.js';
import './SkillImpl202601.js';
import { initUnitSkillEffects } from './UnitSkillEffect.js';
import { Unit } from './Unit.js';
initUnitSkillEffects(Unit);

class AppData extends HeroDatabase {
    constructor(heroInfos) {
        super(heroInfos);
        /** @type {HeroInfo[]} */
        this.heroInfos = [];
        /** @type {HeroInfo[]} */
        this.filteredHeroInfos = [];

        /** @type {number} */
        this.iconSize = 40;

        this.bgColor = "#ffffff";
        this.bgOpacity = 255;
        this.bgColorWithAlpha = "#00000000";
        this.updateBgColor();

        this.nameQuery = "";
        this.needsFullMatching = false;
        this.showsAllDefault = false;
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
        if (nameQueries.length == 0 && !this.showsAllDefault) {
            return;
        }

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
            this.filteredHeroInfos = this.filteredHeroInfos.sort((a, b) => a.weaponTypeValue - b.weaponTypeValue);
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
    const app = createApp({
        data() { return g_appData; }
    });
    const vm = app.mount('#app');
    g_appData.heroInfos = heroInfos;
    g_appData.applyFilter();
}

// Initialization (type="module" is deferred, so DOM is ready)
const resolvedHeroInfos = window.heroInfos || sampleHeroInfos;
init(resolvedHeroInfos);

export { AppData, g_appData, init };
