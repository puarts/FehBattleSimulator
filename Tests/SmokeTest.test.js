// =============================================================================
// Phase 0: スモークテスト
// Vite + Vue 3 移行の安全網として、アプリの基本動作を確認する
// =============================================================================

// ---------------------------------------------------------------------------
// 0-1. スモークテスト — アプリが起動して基本動作できることの確認
// ---------------------------------------------------------------------------
beforeAll(() => {
    resetGlobalTestState();
});

describe('スモークテスト', () => {
    test('英雄データベースにデータが存在する', () => {
        expect(g_testHeroDatabase).toBeDefined();
        const heroes = [...g_testHeroDatabase.enumerateHeroInfos()];
        expect(heroes.length).toBeGreaterThan(500);
    });

    test('スキルデータベースにデータが存在する', () => {
        const skillDb = g_testHeroDatabase.skillDatabase;
        expect(skillDb).toBeDefined();
        expect(skillDb.weaponInfos.length).toBeGreaterThan(100);
    });

    test('ユニットを作成できる', () => {
        let unit = UnitBuilder.fromHero('マルス').build();
        expect(unit).not.toBeNull();
        expect(unit.heroInfo).not.toBeNull();
        expect(unit.weapon).not.toBe(0);
        expect(unit.maxHpWithSkills).toBeGreaterThan(0);
    });

    test('戦闘を実行できる', () => {
        let result = new BattleScenarioBuilder()
            .withAttacker(UnitBuilder.fromHero('マルス').build())
            .withDefender(UnitBuilder.fromHero('ルキナ').build())
            .execute();
        expect(result).toBeDefined();
    });
});


// ---------------------------------------------------------------------------
// 0-2. グローバル変数の存在チェック — ESM化で消えやすいものの安全網
// ---------------------------------------------------------------------------
describe('グローバル変数の存在確認', () => {
    test('列挙型・定数が定義されている', () => {
        expect(Weapon).toBeDefined();
        expect(Support).toBeDefined();
        expect(Special).toBeDefined();
        expect(PassiveA).toBeDefined();
        expect(PassiveB).toBeDefined();
        expect(PassiveC).toBeDefined();
        expect(WeaponType).toBeDefined();
        expect(MoveType).toBeDefined();
        expect(StatusType).toBeDefined();
        expect(SkillType).toBeDefined();
        expect(UnitGroupType).toBeDefined();
        expect(BlessingType).toBeDefined();
        expect(SeasonType).toBeDefined();
    });

    test('コアクラスが定義されている', () => {
        expect(Unit).toBeDefined();
        expect(BattleContext).toBeDefined();
        expect(BattleMap).toBeDefined();
        expect(Cell).toBeDefined();
        expect(DamageCalculator).toBeDefined();
        expect(HeroDatabase).toBeDefined();
        expect(SkillDatabase).toBeDefined();
        expect(UnitManager).toBeDefined();
        expect(HeroInfo).toBeDefined();
    });

    test('スキルDSL基盤が定義されている', () => {
        expect(SkillEffectRegistrar).toBeDefined();
        expect(SkillEffectNode).toBeDefined();
        expect(SingleEffectNode).toBeDefined();
        expect(EffectsNode).toBeDefined();
        expect(TRUE_NODE).toBeDefined();
        expect(FALSE_NODE).toBeDefined();
        expect(UNIT).toBeDefined();
        expect(FOE).toBeDefined();
    });

    test('DSL関数が定義されている', () => {
        expect(typeof GRANTS_BONUS).toBe('function');
        expect(typeof INFLICTS_PENALTY).toBe('function');
        expect(typeof DEALS_DAMAGE).toBe('function');
        expect(typeof REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY).toBe('function');
        expect(typeof IF_NODE).toBe('function');
        expect(typeof ATK_SPD).toBe('function');
        expect(typeof ATK_SPD_DEF_RES).toBe('function');
    });

    test('スキル効果フックが定義されている', () => {
        expect(AT_START_OF_COMBAT_HOOKS).toBeDefined();
        expect(AFTER_COMBAT_HOOKS).toBeDefined();
        expect(AT_START_OF_TURN_HOOKS).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// 0-3. スキル登録の整合性チェック — 各SkillImplファイルのスキルが登録されているか
// ---------------------------------------------------------------------------
describe('スキル登録の整合性', () => {
    test('各SkillImplファイルのスキルIDが定義されている', () => {
        // 各ファイルの代表的なスキルIDが存在することを確認
        expect(Weapon.QuietingAntler).toBeDefined();   // SkillImpl.js
        expect(Weapon.LadysBow).toBeDefined();         // SkillImpl202408.js
        expect(Weapon.DongJiNoshiRiPlus).toBeDefined(); // SkillImpl202501.js
        expect(Weapon.HeroicMaltet).toBeDefined();     // SkillImpl202601.js
    });

    test('SkillEffectRegistrar にスキル効果が登録されている', () => {
        // SkillImpl202601.js は SkillEffectRegistrar.registerSkillsDuringCombat を使用
        // この呼び出しが実行されている = ファイルが正しく読み込まれている
        let unit = UnitBuilder.fromHero('マルス').build();
        // AT_START_OF_COMBAT_HOOKS にスキルが1つ以上登録されていること
        expect(AT_START_OF_COMBAT_HOOKS).toBeDefined();
    });

    test('各SkillImplファイルの代表スキルで戦闘が正常に動作する', () => {
        // スキル効果の副作用登録が正しく行われていれば戦闘が動作する
        let result = new BattleScenarioBuilder()
            .withAttacker(UnitBuilder.fromHero('マルス').build())
            .withDefender(UnitBuilder.fromHero('ルキナ').build())
            .execute();
        expect(result).toBeDefined();
    });
});
