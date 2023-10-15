
class SkillDatabase {
    constructor() {
        this.weaponInfos = [];
        this.supportInfos = [];
        this.specialInfos = [];
        this.passiveAInfos = [];
        this.passiveBInfos = [];
        this.passiveCInfos = [];
        this.passiveSInfos = [];
        this.passiveXInfos = [];
        this.captainInfos = [];
        this.skillIdToInfoDict = {};
        this.skillNameToInfoDict = {};
    }

    registerSkillOptions(
        weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs, passiveXs, captains = []
    ) {
        this.weaponInfos = weapons;
        this.supportInfos = supports;
        this.specialInfos = specials;
        this.passiveAInfos = passiveAs;
        this.passiveBInfos = passiveBs;
        this.passiveCInfos = passiveCs;
        this.passiveSInfos = passiveSs;
        this.passiveXInfos = passiveXs;
        this.captainInfos = captains;

        // type は事前に設定されてないので登録時に同期
        for (let info of this.supportInfos) {
            info.type = SkillType.Support;
        }
        for (let info of this.specialInfos) {
            info.type = SkillType.Special;
        }
        for (let info of this.passiveAInfos) {
            info.type = SkillType.PassiveA;
        }
        for (let info of this.passiveBInfos) {
            info.type = SkillType.PassiveB;
        }
        for (let info of this.passiveCInfos) {
            info.type = SkillType.PassiveC;
        }
        for (let info of this.passiveSInfos) {
            info.type = SkillType.PassiveS;
        }
        for (let info of this.passiveXInfos) {
            info.type = SkillType.PassiveX;
        }
        for (let info of this.captainInfos) {
            info.type = SkillType.Captain;
        }

        this.__registerInfosToDict(weapons);
        this.__registerInfosToDict(supports);
        this.__registerInfosToDict(specials);
        this.__registerInfosToDict(passiveAs);
        this.__registerInfosToDict(passiveBs);
        this.__registerInfosToDict(passiveCs);
        this.__registerInfosToDict(passiveSs);
        this.__registerInfosToDict(passiveXs);
        this.__registerInfosToDict(captains);
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
    /**
     * @param  {Unit} unit
     */
    updateUnitSkillInfo(unit) {
        unit.weaponInfo = this.findSkillInfoByDict(unit.weapon);
        unit.supportInfo = this.findSkillInfoByDict(unit.support);
        unit.specialInfo = this.findSkillInfoByDict(unit.special);
        unit.passiveAInfo = this.findSkillInfoByDict(unit.passiveA);
        unit.passiveBInfo = this.findSkillInfoByDict(unit.passiveB);
        unit.passiveCInfo = this.findSkillInfoByDict(unit.passiveC);
        unit.passiveSInfo = this.findSkillInfoByDict(unit.passiveS);
        unit.passiveXInfo = this.findSkillInfoByDict(unit.passiveX);
        unit.captainInfo = this.findSkillInfoByDict(unit.captain);
    }

    __registerInfosToDict(skillInfos) {
        for (let info of skillInfos) {
            this.skillIdToInfoDict[info.id] = info;
            this.skillNameToInfoDict[info.name] = info;
        }
    }
}
