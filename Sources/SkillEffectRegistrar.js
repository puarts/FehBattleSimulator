class SkillEffectRegistrar {
    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param skills
     */
    static registerSkills(skillId, condNode, ...skills) {
        for (let skill of skills) {
            this._addSkill(skillId, condNode, skill);
        }
    }

    static registerSkillsForAllies(skillId, pred, statsNodes, nonStatsNode) {
        FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(statsNodes)),
        ));
        FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
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
     */
    static _addSkill(skillId, condNode, skill) {
        if (skill instanceof Array) {
            /** @type {Array<SkillEffectNode>} */
            let nodes = skill.slice(0, skill.length - 1);
            /**
             * @type {{ addSkill: (skillId: number, () => SkillEffectNode) => void }} unit
             */
            let hooks = skill[skill.length - 1];
            hooks.addSkill(skillId, () => IF_NODE(condNode, SKILL_EFFECT_NODE(...nodes)));
        } else if (skill instanceof SkillEffectNode) {
            AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => IF_NODE(condNode, skill));
        }
    }

    static setIncludingAoe(skillId, skill) {
        AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => skill);
        BEFORE_AOE_SPECIAL_HOOKS.addSkill(skillId, () => skill);
    }

    static nonStatsUsingStats(skillId, skill) {
        WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS.addSkill(skillId, () => skill);
    }

    static setForAlliesStats(skillId, skill) {
        FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, () => skill);
    }
}