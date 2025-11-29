class SkillEffectRegistrar {
    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param skills
     */
    static registerSelfTargetingSkills(skillId, condNode, ...skills) {
        for (let skill of skills) {
            this._addSkill(skillId, condNode, skill, AT_START_OF_COMBAT_HOOKS);
        }
    }

    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param skills
     */
    static registerForAllyTargetingSkills(skillId, condNode, ...skills) {
        for (let skill of skills) {
            this._addSkill(skillId, condNode, skill, FOR_ALLIES_AT_START_OF_COMBAT_HOOKS);
        }
    }

    static registerAllyTargetingBasicSkills(skillId, pred, statsNodes, nonStatsNode) {
        FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(statsNodes)),
        ));
        FOR_ALLIES_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(nonStatsNode)),
        ));
    }

    static registerFoeTargetingBasicSkills(skillId, pred, statsNodes, nonStatsNode) {
        FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(statsNodes)),
        ));
        FOR_FOES_AT_START_OF_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(nonStatsNode)),
        ));
    }

    static _toSkillEffectNode(skill) {
        if (skill instanceof SkillEffectNode) {
            return skill;
        } else if (skill instanceof Array) {
            return SKILL_EFFECT_NODE(...skill);
        } else {
            throw new Error("Invalid skill");
        }
    }

    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param {SkillEffectNode|[...SkillEffectNode, SkillEffectHooks]|null} skill
     * @param { SkillEffectHooks | { addSkill: (skillId: number, () => SkillEffectNode) => void } } defaultHooks
     */
    static _addSkill(skillId, condNode, skill, defaultHooks) {
        if (skill instanceof Array) {
            /** @type {Array<SkillEffectNode>} */
            let nodes = skill.slice(0, skill.length - 1);
            let lastElement = skill[skill.length - 1];
            /**
             * @type { [{ addSkill: (skillId: number, () => SkillEffectNode) => void }] }
             */
            let hooksArray = !(lastElement instanceof Array) ? [lastElement] : lastElement;
            for (let hooks of hooksArray) {
                if (typeof hooks.addSkill !== "function") {
                    throw new Error(`Invalid hooks: ${hooks}`);
                }
                hooks.addSkill(skillId, () => IF_NODE(condNode, SKILL_EFFECT_NODE(...nodes)));
            }
        } else if (skill instanceof SkillEffectNode) {
            defaultHooks.addSkill(skillId, () => IF_NODE(condNode, skill));
        }
    }
}