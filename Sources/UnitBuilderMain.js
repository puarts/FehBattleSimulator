

class UnitBuilderMain extends BattleSimmulatorBase {
    constructor() {
        super({
            unitSelected: (event) => {
                let name = event.item.name;
                if (name == undefined) {
                    name = event.item.classList[0];
                }

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
    if (url == "" || url == null) {
        loadSettings();
        return;
    }
    console.log(url);
    let splited = url.split("s=");
    if (splited.length != 2) {
        console.log(`invalid url "${url}"`);
        loadSettings();
        return;
    }

    let settingText = splited[1];
    let decompressed = LZString.decompressFromEncodedURIComponent(settingText);
    let unit = g_appData.currentUnit;
    unit.fromTurnWideStatusString(decompressed);
    g_appData.initializeByHeroInfo(unit, unit.heroIndex, false);
    unit.fromTurnWideStatusString(decompressed);
    g_appData.__updateUnitSkillInfo(unit);
    g_appData.__updateStatusBySkillsAndMerges(unit, true);
    // unit.fromTurnWideStatusString(decompressed);
    // g_appData.__updateStatusBySkillsAndMerges(unit, true);

    g_app.setCurrentUnit(unit.id);
}

function updateUrl() {
    let unit = g_appData.currentUnit;
    if (unit == null) {
        unit = g_appData.allyUnits[0];
        g_app.setCurrentUnit(unit.id);
    }
    let settingText = unit.turnWideStatusToString();
    g_appData.exportSettingUrl = "https://puarts.com/?pid=1736&s=" + LZString.compressToEncodedURIComponent(settingText);
    let textarea = $("#urlTextArea")[0];
    textarea.textContent = settingText;
}

function resetUnit(unit) {
    unit.rarity = 5;
    unit.merge = 0;
    unit.dragonflower = 0;
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
    using(new ScopedStopwatch(time => g_app.writeDebugLogLine("初期化: " + time + " ms")), () => {
        let unit = g_appData.allyUnits[0];
        g_app.setCurrentUnit(unit.id);
        g_appData.isDebugMenuEnabled = false;
        g_appData.applyDebugMenuVisibility();

        let elem = document.getElementById("initMessage");
        elem.textContent = "";
        importUrl(location.search);
        updateUrl();
        g_appData.setGameMode(GameMode.Arena);
        g_app.setCurrentUnit(unit.id);
        unit.updateArenaScore();
    });
}
