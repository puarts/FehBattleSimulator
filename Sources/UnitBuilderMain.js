

class UnitBuilderMain extends BattleSimulatorBase {
    constructor() {
        super({
            unitSelected: (event) => {
                let name = event.currentTarget.id;
                this.setCurrentUnit(name);
            },
            loadTeamMaxScore: () => {
                for (let unit of this.data.enumerateAllyUnits()) {
                    this.setUnitToMaxArenaScore(unit);

                    console.log(`${unit.id}: maxSpecialCount = ${unit.maxSpecialCount}`);
                }
            },
        });
    }

    setCurrentUnit(id) {
        super.setCurrentUnit(id);

        let tabIndex = this.data.findIndexOfAllyUnit(id);
        changeCurrentUnitTab(tabIndex);
    }

    setFromSetting(settingText) {
        const settings = Array.from(settingText.split(ElemDelimiter).filter(x => x != ""));
        if (settings.length == 0) {
            return;
        }

        this.data.fromTurnWideStatusString(settings[0]);
        for (let i = 0; i + 1 < settings.length && i < this.data.allyUnits.length; ++i) {
            const unitSetting = settings[i + 1];
            const unit = this.data.allyUnits[i];
            this.writeDebugLogLine(`${unit.id}: ` + unitSetting);
            unit.fromTurnWideStatusString(unitSetting);
            this.data.initializeByHeroInfo(unit, unit.heroIndex, false);
            this.data.__updateStatusBySkillsAndMerges(unit, true);
            this.data.updateArenaScore(unit);
        }

        this.data.updateArenaScoreOfParties();
    }

    getCurrentSetting() {
        let settingText = "";
        const appSetting = this.data.turnWideStatusToString();
        // this.writeDebugLogLine(`app: ` + appSetting);
        settingText += appSetting + ElemDelimiter;
        for (let unit of g_appData.allyUnits) {
            const unitSetting = unit.turnWideStatusToString();
            // this.writeDebugLogLine(`${unit.getNameWithGroup()}: ` + unitSetting);
            settingText += unitSetting + ElemDelimiter;
        }

        settingText.trimEnd(ElemDelimiter);
        return settingText;
    }
}


let g_app = new UnitBuilderMain();


function toSignedStr(value) {
    return value <= 0 ? value : "+" + value;
}
function copyDebugLogToClipboard() {
    selectText("debugLogPanel");
    document.execCommand("copy");
}

function copyUrl() {
    var textarea = $("#urlTextArea")[0];
    textarea.select();
    textarea.setSelectionRange(0, 99999); /*For mobile devices*/
    document.execCommand("copy");
}

function importUrl(url) {
    console.log("url:" + url);
    if (url === "" || url == null) {
        loadSettings();
        return;
    }
    console.log(url);
    let splited = url.split("s=");
    if (splited.length !== 2) {
        console.log(`invalid url "${url}"`);
        loadSettings();
        return;
    }

    g_app.writeDebugLogLine(`■URLから設定をインポート`);
    let settingText = splited[1];
    let decompressed = LZString.decompressFromEncodedURIComponent(settingText);
    g_app.setFromSetting(decompressed);
}

function updateUrl() {
    // g_app.writeDebugLogLine(`■URLの更新`);
    let settingText = g_app.getCurrentSetting();
    g_appData.exportSettingUrl = g_explicitSiteRootPath + "?pid=1736&s=" + LZString.compressToEncodedURIComponent(settingText) + "#app";
    let textarea = $("#urlTextArea")[0];
    textarea.textContent = settingText;
}

function resetUnit(unit) {
    unit.rarity = 5;
    unit.merge = 0;
    unit.dragonflower = 0;
    unit.emblemHeroMerge = 0;
    unit.ascendedAsset = StatusType.None;
    unit.ivHighStat = StatusType.None;
    unit.ivLowStat = StatusType.None;
    unit.isBonusChar = false;
    unit.isResplendent = false;
    unit.clearBlessingEffects();
    unit.summonerLevel = SummonerLevel.None;
    updateStatus(unit);
}

function updateStatus(unit) {
    g_appData.__updateStatusBySkillsAndMerges(unit, true, false);
    unit.updateArenaScore();
    updateUrl();
}

function initUnitBuilder() {
    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("初期化: " + time + " ms")), () => {
        g_appData.setGameMode(GameMode.Arena);
        g_appData.isPairUpBoostsEnabled = true;
        let unit = g_appData.allyUnits[0];
        g_app.setCurrentUnit(unit.id);
        g_appData.isDebugMenuEnabled = false;
        g_appData.applyDebugMenuVisibility();
        importUrl(location.search);
        g_appData.setGameMode(GameMode.Arena);
        g_app.setCurrentUnit(unit.id);
        g_appData.updateArenaScoreForAll();
        updateUrl();
    });
}