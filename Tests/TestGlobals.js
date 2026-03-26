import { heroInfos } from '../Sources/SampleHeroInfos.js';
import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveSInfos, passiveXInfos } from '../Sources/SampleSkillInfos.js';
import { test_HeroDatabase, setTestHeroDatabase } from '../Sources/TestUtilities.js';
import { UnitManager } from '../Sources/UnitManager.js';
import { Unit } from '../Sources/Unit.js';
import { initUnitSkillEffects } from '../Sources/UnitSkillEffect.js';
// SkillImpl*のスキル登録をESMモジュールのSkillEffectRegistrarに実行
import '../Sources/SkillImpl.js';
import '../Sources/SkillImpl202408.js';
import '../Sources/SkillImpl202501.js';
import '../Sources/SkillImpl202601.js';

// ESM版UnitクラスにinitUnitSkillEffectsでプロトタイプメソッドを追加
// Note: ESMではimport宣言は全てホイスティングされるため、
// SkillImpl*のimportはこの行より先に評価される
initUnitSkillEffects(Unit);

const g_testHeroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos,
    passiveSInfos, passiveXInfos);
setTestHeroDatabase(g_testHeroDatabase);

class test_UnitManager extends UnitManager {
    constructor() {
        super();
    }

    * enumerateUnitsInSpecifiedGroup(groupId) {
        for (let unit of this.enumerateUnits()) {
            if (unit.groupId == groupId) {
                yield unit;
            }
        }
    }
}

export { g_testHeroDatabase, test_UnitManager };
