import { StatusEffectType } from '../Sources/StatusConstants.js';

describe('getRequirements tests', () => {
    test('IF node with stat comparison should return STAT requirement', () => {
        // UNIT.spd.sgt(FOE.spd) の部分をテスト
        const condNode = UNIT.spd.sgt(FOE.spd);
        const requirements = condNode.getRequirements();

        // console.log('condNode type:', condNode.constructor.name);
        // console.log('condNode._children:', condNode._children?.map(c => c?.constructor?.name));
        // console.log('condNode requirements:', requirements);
        // console.log('condNode._children[0] requirements:', condNode._children?.[0]?.getRequirements());
        // console.log('condNode._children[1] requirements:', condNode._children?.[1]?.getRequirements());

        // UNIT.spdの構造を確認
        const unitSpd = UNIT.spd;
        // console.log('UNIT.spd type:', unitSpd.constructor.name);
        // console.log('UNIT.spd requirements:', unitSpd.getRequirements());
        // console.log('UNIT.spd._children:', unitSpd._children?.map(c => c?.constructor?.name));
        // console.log('UNIT.spd._condNode:', unitSpd._condNode?.constructor?.name);
        // console.log('UNIT.spd._children[0] type:', unitSpd._children?.[0]?.constructor?.name);
        // console.log('UNIT.spd._children[0] has getRequirement:', typeof unitSpd._children?.[0]?.getRequirement);
        // console.log('UNIT.spd._children[0].getRequirement():', unitSpd._children?.[0]?.getRequirement());
        // console.log('UNIT.spd._children[0] has getRequirements:', typeof unitSpd._children?.[0]?.getRequirements);
        // console.log('UNIT.spd._children[0].getRequirements():', unitSpd._children?.[0]?.getRequirements());

        expect(requirements.has(SkillRequirement.STAT)).toBe(true);
    });

    test('IF node with or condition should return STAT requirement', () => {
        // UNIT.spd.sgt(FOE.spd).or(...) の部分をテスト
        const condNode = UNIT.spd.sgt(FOE.spd).or(UNIT.isAdjacentTo(ALLIES.withStatus(StatusEffectType.Coax)).not());
        const requirements = condNode.getRequirements();

        // console.log('condNode with or requirements:', requirements);
        expect(requirements.has(SkillRequirement.STAT)).toBe(true);
    });

    test('IF node with full condition should return STAT requirement', () => {
        // 実際の問題のコード
        const ifNode = IF(
            UNIT.spd.sgt(FOE.spd).or(UNIT.isAdjacentTo(ALLIES.withStatus(StatusEffectType.Coax)).not()),
            UNIT.do(ATTACKS_TWICE).duringCombat(),
        );
        const requirements = ifNode.getRequirements();

        // console.log('IF node requirements:', requirements);
        // console.log('IF node structure:', JSON.stringify({
        //     condNode: ifNode._condNode?.constructor?.name,
        //     children: ifNode._children?.map(c => c?.constructor?.name)
        // }, null, 2));

        expect(requirements.has(SkillRequirement.STAT)).toBe(true);
    });
});
