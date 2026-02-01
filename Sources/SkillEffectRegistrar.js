class SkillEffectRegistrar {
    static buildSkill(skill, context) {
        context.skillId = skill.id;
        context.type = skill.type;
        for (let block of skill.blocks) {
            this.buildSkillBlock(block, context);
        }
    }
    static buildSkillBlock(block, context) {
        // trigger
        // target
        context.triggers = block.triggers;
        context.conditionNode = this.makeConditionNode(block.conditions, context);
        context.target = this.makeTargetNode(block.target, context);
        let effectNode;
        if (context.target instanceof UnitsNode) {
            effectNode = FOR_EACH_UNIT_NODE(
                context.target,
                context.effect,
            );
        }
        for (let effect of block.effects) {
            this.buildEffect(effect, context);
        }
    }
    static makeConditionNode(conditions, context) {
        return AND_NODE(...conditions.map(c => c.node));
    }
    static _makeConditionNode(condition, context) {
        switch (condition.type) {
            case 'WITHIN_RANGE':
                return LTE_NODE(
                    DISTANCE_BETWEEN_UNITS_NODE(
                        this.makeTargetNode(condition.target),
                        this.makeTargetNode(condition.center),
                    ),
                    NumberNode.makeNumberNodeFrom(condition.range),
                );
        }
        console.error('Unknown condition: %o', condition);
    }
    static makeTargetNode(target, context) {
        switch (target) {
            case 'TARGET':
                return TARGET_NODE;
            case 'UNIT':
                // TODO: コンテキストによって変化するUNIT_NODEを作成する
                return SKILL_OWNER_NODE;
            case 'FOE':
                return FOE_NODE;
            case 'ALL_ALLIES':
                return SKILL_OWNERS_ALLIES_ON_MAP_NODE;
        }
        switch (target.type) {
            case 'SET_OP':
                if (target.op === 'UNION') {
                    let condNodes = target.operands.map(t => this.makeTargetNode(t, context));
                    return UNITE_UNITS_NODE(...condNodes);
                }
                break;
            case 'FILTER': {
                let source = this.makeTargetNode(target.source, context);
                return FILTER_UNITS_NODE(source, this.makeConditionNode([target.condition], context))
            }
        }
    }
    static buildEffect(effect, context) {
        switch (effect.type) {
            case 'ACCELERATE_SPECIAL_TRIGGER':
                for (let trigger of effect.triggers) {
                    switch (trigger) {
                        case 'PASSIVE':
                            console.log('奥義発動カウント-1: 実装の必要なし');
                            break;
                    }
                }
                break;
            case 'GRANT_STATUS':
            default:
                console.error(`Unknown effect type: ${effect.type}`);
        }
    }

    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param {...any} skills
     */
    static registerSkillsDuringCombat(skillId, condNode, ...skills) {
        this._registerToHooks(skillId, condNode, skills, [
            AT_START_OF_COMBAT_HOOKS,
            WHEN_APPLIES_POTENT_EFFECTS_HOOKS,
            NON_STATS_SKILL_USING_STATS_HOOKS,
            STATS_SKILL_USING_STATS_HOOKS
        ]);
    }

    /**
     * @param {number|string} skillId
     * @param {BoolNode} condNode
     * @param {...any} skills
     */
    static registerSkillsForAlliesDuringCombat(skillId, condNode, ...skills) {
        this._registerToHooks(skillId, condNode, skills, [
            FOR_ALLIES_AT_START_OF_COMBAT_HOOKS,
            FOR_ALLIES_WHEN_APPLIES_POTENT_EFFECTS_HOOKS,
            FOR_ALLIES_NON_STATS_SKILL_USING_STATS_HOOKS,
            FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS
        ]);
    }

    /**
     * スキルを分類して指定されたフックに登録する内部メソッド
     * @private
     */
    static _registerToHooks(skillId, condNode, skills, hooks) {
        const categorized = {
            normal: [],
            potent: [],
            nonStatsUsingStats: [],
            statsUsingStats: []
        };

        for (const skill of skills) {
            const reqs = skill.getRequirements();
            if (reqs.size === 0) {
                categorized.normal.push(skill);
            } else if (reqs.has(SkillRequirement.FOLLOW_UP_COND_BEFORE_POTENT)) {
                categorized.potent.push(skill);
            } else if (reqs.has(SkillRequirement.STAT_AFTER_STAT)) {
                categorized.nonStatsUsingStats.push(skill);
            } else if (reqs.has(SkillRequirement.STAT)) {
                categorized.statsUsingStats.push(skill);
            } else {
                throw new Error(`Invalid skill: ${skill}`);
            }
        }

        const [hNormal, hPotent, hNonStats, hStat] = hooks;

        hNormal.addSkill(skillId, () => IF_NODE(condNode, ...categorized.normal));
        hPotent.addSkill(skillId, () => IF_NODE(condNode, ...categorized.potent));
        hNonStats.addSkill(skillId, () => IF_NODE(condNode, ...categorized.nonStatsUsingStats));
        hStat.addSkill(skillId, () => IF_NODE(condNode, ...categorized.statsUsingStats));
    }

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
        } else if (Array.isArray(skill)) {
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
        if (Array.isArray(skill)) {
            /** @type {Array<SkillEffectNode>} */
            let nodes = skill.slice(0, skill.length - 1);
            let lastElement = skill[skill.length - 1];
            /**
             * @type { [{ addSkill: (skillId: number, () => SkillEffectNode) => void }] }
             */
            let hooksArray = !(Array.isArray(lastElement)) ? [lastElement] : lastElement;
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