
class SkillDatabase {
    constructor() {
        this.weaponInfos = [];
        this.supportInfos = [];
        this.specialInfos = [];
        this.passiveAInfos = [];
        this.passiveBInfos = [];
        this.passiveCInfos = [];
        this.passiveSInfos = [];
        this.skillIdToInfoDict = {};
        this.skillNameToInfoDict = {};
    }

    registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs) {
        this.weaponInfos = weapons;
        this.supportInfos = supports;
        this.specialInfos = specials;
        this.passiveAInfos = passiveAs;
        this.passiveBInfos = passiveBs;
        this.passiveCInfos = passiveCs;
        this.passiveSInfos = passiveSs;

        this.__registerInfosToDict(weapons);
        this.__registerInfosToDict(supports);
        this.__registerInfosToDict(specials);
        this.__registerInfosToDict(passiveAs);
        this.__registerInfosToDict(passiveBs);
        this.__registerInfosToDict(passiveCs);
        this.__registerInfosToDict(passiveSs);
    }

    findSkillInfoByDict(id) {
        return this.skillIdToInfoDict[id];
    }

    findSkillInfoByName(name) {
        let result = this.skillNameToInfoDict[name];
        if (result) {
            return result;
        }
        return null;
    }

    updateUnitSkillInfo(unit) {
        unit.weaponInfo = this.findSkillInfoByDict(unit.weapon);
        unit.supportInfo = this.findSkillInfoByDict(unit.support);
        unit.specialInfo = this.findSkillInfoByDict(unit.special);
        unit.passiveAInfo = this.findSkillInfoByDict(unit.passiveA);
        unit.passiveBInfo = this.findSkillInfoByDict(unit.passiveB);
        unit.passiveCInfo = this.findSkillInfoByDict(unit.passiveC);
        unit.passiveSInfo = this.findSkillInfoByDict(unit.passiveS);
    }

    __registerInfosToDict(skillInfos) {
        for (let info of skillInfos) {
            this.skillIdToInfoDict[info.id] = info;
            this.skillNameToInfoDict[info.name] = info;
        }
    }
}
