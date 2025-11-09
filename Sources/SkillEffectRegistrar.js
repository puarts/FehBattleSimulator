class SkillEffectRegistrar {
    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param skills
     */
    static registerSelfTargetingSkills(skillId, condNode, ...skills) {
        for (let skill of skills) {
            this._addSkill(skillId, condNode, skill);
        }
    }

    static registerAllyTargetingBasicSkills(skillId, pred, statsNodes, nonStatsNode) {
        FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(statsNodes)),
        ));
        FOR_ALLIES_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(nonStatsNode)),
        ));
    }

    static registerFoeTargetingBasicSkills(skillId, pred, statsNodes, nonStatsNode) {
        FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.addSkill(skillId, NODE_FUNC(
            IF_NODE(pred, this._toSkillEffectNode(statsNodes)),
        ));
        FOR_FOES_INFLICTS_EFFECTS_HOOKS.addSkill(skillId, NODE_FUNC(
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
             * @type { { addSkill: (skillId: number, () => SkillEffectNode) => void } }
             */
            let hooks = skill[skill.length - 1];
            hooks.addSkill(skillId, () => IF_NODE(condNode, SKILL_EFFECT_NODE(...nodes)));
        } else if (skill instanceof SkillEffectNode) {
            AT_START_OF_COMBAT_HOOKS.addSkill(skillId, () => IF_NODE(condNode, skill));
        }
    }
}