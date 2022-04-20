/// @file
/// @brief ステータス計算器のメインコードです。

let unit = new Unit();

let vm = new Vue({
    el: "#app",
    data: {
        /** @member {Unit} */
        value: unit,
        isWeaponEnabled: false,
        totalSp: 0,
    },
    methods: {
        reset() {
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
            this.isWeaponEnabled = false;
            updateStatus();
        },
        maximaizeMergeAndDragonflower: function () {
            unit.maximizeMergeAndDragonflower();
            updateStatus();
        },
        maximaizeMerge: function () {
            unit.maximizeMerge();
            updateStatus();
        },
        maximaizeDragonflower: function () {
            unit.maximizeDragonflower();
            updateStatus();
        },
        resetMerge: function () {
            unit.merge = 0;
            unit.updateStatusByMergeAndDragonFlower();
            updateStatus();
        },
        resetDragonflower: function () {
            unit.dragonflower = 0;
            unit.updateStatusByMergeAndDragonFlower();
            updateStatus();
        },
    }
});


function updateStatus() {
    unit.updateBaseStatus();

    unit.maxHpWithSkillsWithoutAdd = unit.hpLvN;
    unit.atkWithSkills = Number(unit.atkLvN) + Number(unit.atkAdd);
    unit.spdWithSkills = Number(unit.spdLvN) + Number(unit.spdAdd);
    unit.defWithSkills = Number(unit.defLvN) + Number(unit.defAdd);
    unit.resWithSkills = Number(unit.resLvN) + Number(unit.resAdd);

    // 個体値と限界突破によるステータス上昇
    unit.updateStatusByMergeAndDragonFlower();

    if (vm.isWeaponEnabled) {
        unit.updateStatusByWeapon();

        // 武器錬成
        unit.updateStatusByWeaponRefinement();
    }

    // 召喚士との絆
    unit.updateStatusBySummonerLevel();

    // ボナキャラ補正
    if (unit.isBonusChar) {
        unit.maxHpWithSkillsWithoutAdd += 10;
        unit.atkWithSkills += 4;
        unit.spdWithSkills += 4;
        unit.defWithSkills += 4;
        unit.resWithSkills += 4;
    }

    // 神装
    if (unit.isResplendent) {
        unit.maxHpWithSkillsWithoutAdd += 2;
        unit.atkWithSkills += 2;
        unit.spdWithSkills += 2;
        unit.defWithSkills += 2;
        unit.resWithSkills += 2;
    }

    // 祝福効果
    unit.__updateStatusByBlessing(unit.blessing1);
    unit.__updateStatusByBlessing(unit.blessing2);
    unit.__updateStatusByBlessing(unit.blessing3);
    unit.__updateStatusByBlessing(unit.blessing4);
    unit.__updateStatusByBlessing(unit.blessing5);
    unit.__updateStatusByBlessing(unit.blessing6);

    unit.arenaScore = unit.calcArenaScore(vm.totalSp);
}


function __findSkillInfo(skillInfos, id) {
    for (let info of skillInfos) {
        if (info.id == id) {
            return info;
        }
    }

    return null;
}

function init(heroInfo, skillInfos, totalSp) {
    unit.name = "hoge";
    unit.initByHeroInfo(heroInfo);
    unit.initializeSkillsToDefault();
    unit.weaponInfo = __findSkillInfo(skillInfos, unit.weapon);
    vm.totalSp = totalSp;
    updateStatus();
}
