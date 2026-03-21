/// @file
/// @brief シミュレーターのメインコードです。

import { openDialogById, closeDialogById, initSimDialog } from './DialogUtil.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BattleSimulatorBase, createMap, loadSettings } from './BattleSimulatorBase.js';
import { ScopedStopwatch, using_ } from './Utilities.js';
import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
import { heroInfos } from './SampleHeroInfos.js';
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

/// シミュレーター本体です。
class AetherRaidSimulator extends BattleSimulatorBase {
    constructor() {
        super();
    }
}

let g_app = new AetherRaidSimulator();

function initAetherRaidBoard(
    heroInfos
) {
    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("マップの初期化: " + time + " ms")), () => {
        createMap();

        // 全ユニットをアルフォンスで初期化(名前が変わらない事があるので一旦コメントアウト)
        // let defaultHeroIndex = 18;
        // g_app.resetUnits(defaultHeroIndex);
    });

    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("保存状態の復元: " + time + " ms")), () => {
        // g_app.resetUnitsForTesting();
        loadSettings();
    });
}

// Initialization
window.g_app = g_app;
window.openDialogById = openDialogById;
window.closeDialogById = closeDialogById;
window.initSimDialog = initSimDialog;
g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
g_app.registerHeroOptions(heroInfos, false);
initAetherRaidBoard(heroInfos);
if (typeof window.createDialogs === 'function') window.createDialogs();
if (typeof window.importUrl === 'function') window.importUrl(location.search);

export { AetherRaidSimulator, g_app, initAetherRaidBoard };
