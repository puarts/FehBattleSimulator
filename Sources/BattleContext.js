/// ダメージ計算時のコンテキストです。 DamageCalculator でこのコンテキストに設定された値が使用されます。
class BattleContext {
    // 戦闘開始後にNダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)
    // 他の「戦闘開始後、敵にNダメージ」の効果とは重複せず最大値適用
    #damagesAfterBeginningOfCombatNotStack = [0];
    // 奥義発動時の「奥義ダメージに加算」の加算ダメージ
    #specialAddDamage = 0;
    // 攻撃のたびに変化する可能性のある奥義発動時の「奥義ダメージに加算」の加算ダメージ
    #specialAddDamagePerAttack = 0;
    // 回復不可無効
    #nullInvalidatesHealRatios = [];
    // 戦闘開始後ダメージの後の回復量
    #healAmountsAfterAfterBeginningOfCombatSkills = [0]; // 番兵
    // 戦闘中、奥義発動時、敵の奥義以外のスキルによる「ダメージを〇〇％軽減」をN％無効（最大100%、無効にする数値は端数切捨て）（範囲奥義を除く）
    #reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation = [];
    /**
     * ダメージ軽減
     * @type {Number[]}
     */
    #damageReductionRatios = [];
    /**
     * 最初に受けた攻撃のダメージ軽減
     * @type {Number[]}
     */
    #damageReductionRatiosOfFirstAttack = [];
    /**
     * 最初に受けた攻撃と2回攻撃のダメージ軽減
     * @type {Number[]}
     */
    #damageReductionRatiosOfFirstAttacks = [];
    /**
     * 最初に受けた攻撃と2回攻撃の奥義扱いによるダメージ軽減(大盾などの奥義軽減とはおそらく異なる(連盾などで複製発動しない、守備奥義無効でも軽減される))
     * @type {Number[]}
     */
    #damageReductionRatiosOfFirstAttacksBySpecial = [];
    /**
     * 連撃のダメージ軽減
     * @type {Number[]}
     */
    #damageReductionRatiosOfConsecutiveAttacks = [];
    /**
     * 追撃のダメージ軽減
     * @type {Number[]}
     */
    #damageReductionRatiosOfFollowupAttack = [];
    /**
     * チェインガードのダメージ軽減
     * @type {Number[]}
     */
    #damageReductionRatiosByChainGuard = [];

    /**
     * 軽減回数増加(最大値適用)
     */
    #additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount = 0;

    constructor() {
        this.initContext();
    }

    initContext() {
        this.maxHpWithSkills = 0;
        this.hpBeforeCombat = 0;
        this.restHp = 0;
        this.specialCount = 0;
        this.canFollowupAttackWithoutPotent = false;
        this.canCounterattack = false;
        this.isVantageActivatable = false; // 待ち伏せが発動可能か(敵の戦闘順入替スキル無関係の有効無効)
        this.isVantageActivated = false; // 待ち伏せが実際に発動するか(敵の戦闘順入替スキルを加味した有効無効)
        this.isDesperationActivatable = false; // 攻め立てが発動条件を満たすか
        this.isDesperationActivated = false; // 攻め立てが実際に発動するか(これはisDesperationActivatableから設定されるので直接設定しない)
        this.isDefDesperationActivatable = false; // 受け攻め立ての発動条件を満たすか
        this.isDefDesperationActivated = false; // 最後の聖戦のように攻め立て受け側バージョン
        this.damageReductionRatiosByChainGuard = [];
        this.isChainGuardActivated = false;
        this.reductionRatiosOfDamageReductionRatioExceptSpecial = []; // 奥義以外のダメージ軽減効果の軽減率(シャールヴィ)
        this.reductionRatiosOfDamageReductionRatioExceptSpecialPerAttack = []; // 奥義以外のダメージ軽減効果の軽減率
        this.#reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation = [];
        this.#damageReductionRatiosOfFirstAttack = [];
        this.#damageReductionRatiosOfFirstAttacks = [];
        this.#damageReductionRatiosOfFirstAttacksBySpecial = [];
        this.#damageReductionRatiosOfConsecutiveAttacks = [];
        this.#damageReductionRatiosOfFollowupAttack = [];
        this.#damageReductionRatiosByChainGuard = [];
        this.isEffectiveToOpponent = false;
        this.isEffectiveToOpponentForciblly = false; // スキルを無視して強制的に特効を付与します(ダメージ計算器用)
        this.attackCount = 1;
        this.counterattackCount = 1;
        this.canCounterattackToAllDistance = false;
        // 奥義発動カウント変動量
        this.cooldownCountForAttack = 1;
        this.cooldownCountForDefense = 1;

        // 戦闘中に奥義が発動されたかどうか
        this.hasSpecialActivated = false;
        this.specialActivatedCount = 0;
        this.isPreCombatSpecialActivated = false;

        // 自身の奥義発動カウント変動量を+1
        this.increaseCooldownCountForAttack = false;
        this.increaseCooldownCountForDefense = false;

        // 敵の奥義発動カウント変動量を-1
        this.reducesCooldownCount = false;

        // 自身の発動カウント変動量-1を無効
        this.invalidatesReduceCooldownCount = false;

        // 敵の発動カウント変動量+1を無効
        this.invalidatesIncreaseCooldownCount = false;

        // 守備魔防の低い方を参照を無効化
        this.invalidatesReferenceLowerMit = false;

        // 回復を無効化されている状態
        this.hasDeepWounds = false;

        // [回復不可]を無効にする割合
        this.#nullInvalidatesHealRatios = [];

        // 戦闘開始後ダメージの後の回復量
        this.#healAmountsAfterAfterBeginningOfCombatSkills = [0];

        // 戦闘後回復
        this.healedHpAfterCombat = 0;

        // 戦闘後ダメージ
        this.damageAfterCombat = 0;

        // 強化無効
        // unit invalidate foe's bonus
        this.invalidatesAtkBuff = false;
        this.invalidatesSpdBuff = false;
        this.invalidatesDefBuff = false;
        this.invalidatesResBuff = false;

        // 強化反転
        this.isAtkBonusReversal = false;
        this.isSpdBonusReversal = false;
        this.isDefBonusReversal = false;
        this.isResBonusReversal = false;

        // 神罰の杖
        this.wrathfulStaff = false;
        this.isNeutralizedWrathfulStaff = false;

        // 戦闘中自身の弱化を無効化
        this.invalidatesOwnAtkDebuff = false;
        this.invalidatesOwnSpdDebuff = false;
        this.invalidatesOwnDefDebuff = false;
        this.invalidatesOwnResDebuff = false;

        // 守備魔防の低い方でダメージ計算
        this.refersMinOfDefOrRes = false;

        // true なら戦闘時に守備、falseなら魔防を参照します。
        this.refersRes = false;

        // true なら奥義発動時に守備、falseなら魔防を参照します。
        this.refersResForSpecial = false;

        // 奥義発動時守備魔防の低い方を参照
        this.refersLowerDefOrResWhenSpecial = false;

        // 氷の聖鏡発動時などの軽減ダメージ保持用
        this.reducedDamageForNextAttack = 0;

        // 差し違え4などの軽減前ダメージの参照割合の保持用(最大値適用)
        this.reducedRatioForNextAttack = 0;

        // 差し違え4などの軽減前ダメージの割合加算
        this.additionalDamageOfNextAttackByDamageRatio = 0;

        // 次の自分の攻撃のダメージ加算
        this.additionalDamageOfNextAttack = 0;

        this.canAddDamageReductionToNextAttackFromEnemiesFirstAttack = false;
        this.canAddDamageReductionToNextAttackAfterSpecial = false;
        this.nextAttackMinAdditionAfterSpecial = Number.MIN_SAFE_INTEGER;

        // 奥義発動後、自分の次の攻撃の効果(氷の聖鏡・承など)が発生しているか
        this.isNextAttackEffectAfterSpecialActivating = false;

        // 自分の次の攻撃のダメージに軽減をプラスする効果が発動しているか
        this.isNextAttackAddReducedDamageActivating = false;

        // 自分から攻撃したか
        this.initiatesCombat = false;

        // 追撃優先度
        this.followupAttackPriorityIncrement = 0;
        this.followupAttackPriorityDecrement = 0;

        // TODO: 軽減無効が来た時は配列に入れるように修正する
        // 戦闘前の範囲奥義で有効になるダメージ軽減率
        this.damageReductionRatioForPrecombat = 0;
        // 戦闘前の範囲奥義のダメージ軽減
        this.damageReductionForPrecombat = 0;

        // 戦闘中常に有効になるダメージ軽減率
        // @NOTE: ダメージ軽減無効を考慮する必要があるので基本this.multDamageReductionRatioメソッドで値を設定する
        this.damageReductionRatio = 0;
        this.#damageReductionRatios = [];

        // 防御系奥義によるダメージ軽減率
        this.damageReductionRatioBySpecial = 0;

        // 防御系でない奥義によるダメージ軽減率
        this.damageReductionRatiosByNonDefenderSpecial = [];

        // 次の敵の攻撃ダメージ軽減(奥義による軽減)
        this.damageReductionRatiosBySpecialOfNextAttack = [];

        // 奥義による攻撃でダメージを与えた時、次の敵の攻撃ダメージ軽減
        this.damageReductionRatiosOfNextAttackWhenSpecialActivated = [];

        // 戦闘中受けた攻撃ダメージを40%軽減(1戦闘N回のみ)(範囲奥義を除く)
        this.nTimesDamageReductionRatiosByNonDefenderSpecial = [];
        this.nTimesDamageReductionRatiosByNonDefenderSpecialCount = 0;
        // 軽減回数増加(最大値適用)
        this.#additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount = 0;

        this.nTimesDamageReductionRatiosByEngageSpecial = [];
        this.nTimesDamageReductionRatiosByEngageSpecialCount = 0;
        // this.additionalNTimesDamageReductionRatiosByEngageSpecialCount = 0;

        // 戦闘中に変化する可能性のある奥義扱いのダメージ軽減
        this.damageReductionRatiosBySpecialPerAttack = [];

        // 護り手が発動しているかどうか
        this.isSaviorActivated = false;

        // 最初の攻撃前の奥義発動カウント減少値(減少値を正の値で保持する)
        this.specialCountReductionBeforeFirstAttack = 0;

        // 最初の追撃前の奥義発動カウント減少値(減少値を正の値で保持する)
        this.specialCountReductionBeforeFollowupAttack = 0;

        // 攻撃ごとに変化する可能性がある最初の攻撃前の奥義発動カウント減少値(減少値を正の値で保持する)
        this.specialCountReductionBeforeFirstAttackPerAttack = 0;

        // 最初の攻撃前の奥義発動カウント増加値
        this.specialCountIncreaseBeforeFirstAttack = 0;

        // 最初の追撃前の奥義発動カウント増加値
        this.specialCountIncreaseBeforeFollowupAttack = 0;

        // 敵の最初の攻撃前の奥義発動カウント減少値
        this.specialCountReductionBeforeFirstAttackByEnemy = 0;
        
        // 敵の最初の追撃前の奥義発動カウント減少値
        this.specialCountReductionBeforeFirstFollowUpAttackByEnemy = 0;

        // 敵の最初の2回攻撃の2撃目前の奥義発動カウント減少値(Shield Fighterなど)
        this.specialCountReductionBeforeSecondFirstAttacksByEnemy = 0;

        this.specialCountReductionAfterFirstSpecial = 0;

        // 攻撃時の追加ダメージ
        // TODO: 戦闘前と戦闘中で変数を分ける
        this.additionalDamage = 0;

        this.additionalDamageInPrecombat = 0;

        // 最初の攻撃の追加ダメージ
        this.additionalDamageOfFirstAttack = 0;

        // 奥義発動時の追加ダメージ
        this.additionalDamageOfSpecial = 0;

        // 攻撃ごとに変化する可能性がある追加ダメージ
        this.additionalDamagePerAttack = 0;

        // 戦闘中攻撃ごとに変化する可能性がある奥義発動時の追加ダメージ
        this.additionalDamageOfSpecialPerAttackInCombat = 0;

        // 固定ダメージ軽減
        this.damageReductionValue = 0;

        // 追撃の固定ダメージ軽減
        this.damageReductionValueOfFollowupAttack = 0;

        // 攻撃ごとに変化する可能性がある固定ダメージ軽減
        this.damageReductionValuePerAttack = 0;

        // 最初に受けた攻撃の固定ダメージ軽減(2回攻撃は最初の連撃どちらも対象)
        // 最初に受けた攻撃と2回攻撃のダメージ-N(最初に受けた攻撃と2回攻撃:通常の攻撃は、1回目の攻撃のみ「2回攻撃」は、1～2回目の攻撃)
        // Nの符号に注意。Nは自然数（ダメージ-5ならN=5）
        this.damageReductionValueOfFirstAttacks = 0;

        // 敵の奥義による攻撃のダメージ-N(範囲奥義を除く)
        this.damageReductionValueOfSpecialAttack = 0;

        // ダメージ軽減の奥義(大盾など。祈りは含まない)
        this.canDamageReductionSpecialTriggerTwice = false;
        // 奥義でのダメージ軽減後のダメージ減算
        this.damageReductionValueAfterSpecialTriggerTwice = 0;

        // 攻撃ごとに変化する可能性がある敵の奥義による攻撃のダメージ-N(範囲奥義を除く)
        this.damageReductionValueOfSpecialAttackPerAttack = 0;

        // 奥義以外のスキルによる「ダメージを〇〇%軽減」を無効
        this.invalidatesDamageReductionExceptSpecial = false;
        this.invalidatesDamageReductionExceptSpecialForNextAttack = false;
        // 追撃時、奥義以外のスキルによる「ダメージを〇〇%軽減」を無効
        this.invalidatesDamageReductionExceptSpecialForFollowupAttack = false;

        // 敵から攻撃を受ける際に発動する奥義発動時、自分の次の攻撃は、敵の奥義以外のスキルによる「ダメージを○○%軽減」を無効(その戦闘中のみ)
        this.invalidatesDamageReductionExceptSpecialForNextAttackAfterDefenderSpecial = false;

        // 奥義以外のスキルによる「ダメージを〇〇%軽減」を無効(奥義発動時)
        this.invalidatesDamageReductionExceptSpecialOnSpecialActivation = false;
        this.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack = false;

        // 敵は反撃不可
        this.invalidatesCounterattack = false;

        // 反撃不可を無効
        this.nullCounterDisrupt = false;

        // 自分の攻撃でダメージを与えた時のHP回復量
        this.healedHpByAttack = 0;

        // 自分の攻撃でダメージを与えた時のHP回復量
        this.healedHpByAttackPerAttack = 0;

        // 自分の追撃でダメージを与えた時、N回復(与えたダメージが0でも効果は発動)
        this.healedHpByFollowupAttack = 0;

        // 追撃不可を無効
        this.invalidatesInvalidationOfFollowupAttack = false;

        // 絶対追撃を無効
        this.invalidatesAbsoluteFollowupAttack = false;

        // 無属性に対して有利
        this.isAdvantageForColorless = false;

        // ダメージ加算する「攻撃-守備」の割合
        this.rateOfAtkMinusDefForAdditionalDamage = 0;

        // 奥義発動時の「敵の守備、魔防-〇%扱い」のパーセンテージ
        this.specialSufferPercentage = 0;

        // 奥義発動時の「与えるダメージ〇倍」の倍率
        this.specialMultDamage = 1;

        this.#specialAddDamage = 0;

        this.#specialAddDamagePerAttack = 0;

        // 奥義発動時の「与えたダメージの〇%自分を回復」のパーセンテージ(1.0が100%)
        this.specialDamageRatioToHeal = 0;

        // 奥義発動時の「自分の最大HPの〇%回復」のパーセンテージ
        this.maxHpRatioToHealBySpecial = 0;

        // 奥義発動時の「自分の最大HPの〇%回復」のパーセンテージ
        this.maxHpRatioToHealBySpecialPerAttack = 0;

        // 奥義による攻撃でダメージを与えた時、N回復(与えたダメージが0でも効果は発動)
        this.healedHpAfterAttackSpecialInCombat = 0;

        // 与えたダメージの〇%自分を回復
        this.damageRatioToHeal = 0;

        // 範囲奥義のダメージ倍率
        this.precombatSpecialDamageMult = 0;

        // 「自分の最大HP-現HPの〇%を奥義ダメージに加算」の割合
        this.selfDamageDealtRateToAddSpecialDamage = 0;

        // 防御床にいるかどうか
        this.isOnDefensiveTile = false;

        // 戦闘中の「攻撃奥義」が発動できないかどうか
        this.preventedAttackerSpecial = false;

        // 「敵から攻撃を受ける際に発動する奥義」が発動できないかどうか
        this.preventedDefenderSpecial = false;
        this.preventedDefenderSpecialPerAttack = false;

        // 1マップで1回の奥義効果が発動したかどうか
        this.hasOncePerMapSpecialActivated = false;

        // 武器スキルの条件を満たしたかどうか(__init__applySkillEffectForUnitFuncDictで判定することを想定)
        this.weaponSkillCondSatisfied = false;

        // 奥義スキルの条件を満たしたかどうか(__init__applySkillEffectForUnitFuncDictで判定することを想定)
        this.specialSkillCondSatisfied = false;

        // Aスキルの条件を満たしたかどうか(__init__applySkillEffectForUnitFuncDictで判定することを想定)
        this.passiveASkillCondSatisfied = false;

        // Bスキルの条件を満たしたかどうか(__init__applySkillEffectForUnitFuncDictで判定することを想定)
        this.passiveBSkillCondSatisfied = false;

        // 奥義以外の祈りのHP条件(canActivateNonSpecialMiracleとセットで使用する)
        this.nonSpecialMiracleHpPercentageThreshold = Number.MAX_SAFE_INTEGER;

        // 奥義以外の祈り
        this.canActivateNonSpecialMiracle = false;

        // 奥義以外の祈りが発動したかどうか
        this.hasNonSpecialMiracleActivated = false;

        // 奥義による祈りが発動したかどうか
        this.hasSpecialMiracleActivated = false;

        // 奥義以外の祈り(1マップ1回)
        this.canActivateNonSpecialOneTimePerMapMiracle = false;

        // 奥義以外の祈りが発動したかどうか(1マップ1回)
        this.hasNonSpecialOneTimePerMapMiracleAcitivated = false;

        // 奥義以外の祈り+HP99回復
        this.canActivateNonSpecialMiracleAndHeal = false;

        // 奥義以外の祈り+HP99回復が発動したかどうか
        this.hasNonSpecialMiracleAndHealAcitivated = false;

        // 奥義による祈り+HP99回復が発動したかどうか
        this.hasSpecialMiracleAndHealActivated = false;

        // 奥義による祈りが発動したかどうか(1マップ1回)
        this.hasSpecialOneTimePerMapMiracleAcitivated = false;

        // 範囲奥義を発動できない
        this.cannotTriggerPrecombatSpecial = false;

        // 防御地形の効果を無効
        this.invalidatesDefensiveTerrainEffect = false;

        // 支援効果を無効
        this.invalidatesSupportEffect = false;

        // 歌う・踊るを使用したどうか
        this.isRefreshActivated = false;

        // 暗闘
        this.disablesSkillsFromEnemyAlliesInCombat = false;
        // 特定の色の味方からスキル効果が受けられない
        this.disablesSkillsFromRedEnemyAlliesInCombat = false;
        this.disablesSkillsFromBlueEnemyAlliesInCombat = false;
        this.disablesSkillsFromGreenEnemyAlliesInCombat = false;
        this.disablesSkillsFromColorlessEnemyAlliesInCombat = false;

        // 条件判定のための値を使い回すための値
        // 1攻撃の中で使い回す想定で1ターン1回の行動が行われたかなどを保存するべきフラグには使用しない
        this.condValueMap = new Map();

        // 追撃の速さ条件
        this.additionalSpdDifferenceNecessaryForFollowupAttack = 0;

        // ターン開始時付与不利な状態異常を無効化
        this.neutralizesAnyPenaltyWhileBeginningOfTurn = false;

        // ターン開始時付与に無効化されるステータス
        this.neutralizedStatusEffectSetWhileBeginningOfTurn = new Set();

        // ターン開始時付与に無効化されるステータス
        this.neutralizedDebuffFlagsWhileBeginningOfTurn = [false, false, false, false];

        // 戦闘開始後にNダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)
        this.damageAfterBeginningOfCombat = 0;

        this.#damagesAfterBeginningOfCombatNotStack = [0]; // 最大値を取る時のために番兵(0)を入れる

        // 相手の奥義以外の祈り無効
        this.neutralizesNonSpecialMiracle = false;

        // 奥義以外の祈りが無効化されているかどうか
        this.isNonSpecialMiracleNeutralized = false;

        // 神速追撃
        this.potentRatios = [];

        // 神速追撃上書き
        this._potentOverwriteRatio = null;
        this._potentOverwriteRatioPerAttack = null;

        // 戦闘中に一度しか発動しない奥義のスキル効果が発動したか
        this.isOneTimeSpecialSkillEffectActivatedDuringCombat = false;

        // 瞬殺
        this.isBaneSpecial = false;

        // 自分の戦闘順序入れ替えスキル(待ち伏せ、攻め立てなど)を無効
        this.canUnitDisableSkillsThatChangeAttackPriority = false;

        // 奥義の際に攻撃の代わりに他のステータスを利用
        this.statIndexInsteadOfAtkWhenSpecial = STATUS_INDEX.None;
        this.ratioForUsingAnotherStatWhenSpecial = 0;

        // 奥義によるダメージを与えた敵の数
        this.damageCountOfSpecialAtTheSameTime = 0;

        //
        // フック関数
        // 固定ダメージ
        this.calcFixedAddDamageFuncs = [];
        // 戦闘中ダメージ軽減
        this.getDamageReductionRatioFuncs = [];
        // 奥義以外の祈り
        this.canActivateNonSpecialMiracleFuncs = [];
        // 奥義以外の祈り(1マップ1回)
        this.canActivateNonSpecialOneTimePerMapMiracleFuncs = [];
        // 無効スキル
        this.applyInvalidationSkillEffectFuncs = [];
        // 攻撃ごとのダメージ加算
        this.calcFixedAddDamagePerAttackFuncs = [];
        // 軽減分のダメージを次の攻撃に加算
        this.addReducedDamageForNextAttackFuncs = [];
        // ステータス決定後の戦闘中バフ
        this.applySpurForUnitAfterCombatStatusFixedFuncs = [];
        /** @type {SkillEffectNode[]} */
        this.applySpurForUnitAfterCombatStatusFixedNodes = [];
        // ステータス決定後のスキル効果
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs = [];
        /** @type {SkillEffectNode[]} */
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedNodes = [];
        // 2回攻撃
        this.setAttackCountFuncs = [];
        // 戦闘後
        this.applySkillEffectAfterCombatForUnitFuncs = [];
        // ステータスに関連するスキル効果
        this.applySkillEffectRelatedToEnemyStatusEffectsFuncs = [];
        // 攻撃していれば戦闘後に発生するスキル効果
        this.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs = [];
        // 周囲の味方からのスキル効果
        this.applySkillEffectFromAlliesFuncs = [];
        // 周囲の敵からのスキル効果[周囲2マスの敵は、戦闘中...]
        this.applySkillEffectFromEnemyAlliesFuncs = [];
        // 攻撃を行った時、戦闘後
        this.applyAttackSkillEffectAfterCombatFuncs = [];

        // 攻撃ごとのスキル効果
        /** @type {SkillEffectNode[]} */
        this.applySkillEffectPerAttackNodes = [];
    }

    initContextPerAttack() {
        this.additionalDamagePerAttack = 0;
        this.additionalDamageOfSpecialPerAttackInCombat = 0;
        this.additionalDamageOfSpecialPerAttack = 0;
        this.healedHpByAttackPerAttack = 0;
        this.preventedDefenderSpecialPerAttack = false;
        this.invalidatesDamageReductionExceptSpecialOnSpecialActivationPerAttack = false;
        this.maxHpRatioToHealBySpecialPerAttack = 0;
        this.specialCountReductionBeforeFirstAttackPerAttack = 0;
        this.damageReductionValuePerAttack = 0;
        this.damageReductionValueOfSpecialAttackPerAttack = 0;
        this.#specialAddDamagePerAttack = 0;
        this.damageReductionRatiosBySpecialPerAttack = [];
        this.reductionRatiosOfDamageReductionRatioExceptSpecialPerAttack = [];
        this._potentOverwriteRatioPerAttack = null;
    }

    invalidateFollowupAttackSkills() {
        this.invalidatesAbsoluteFollowupAttack = true;
        this.invalidatesInvalidationOfFollowupAttack = true;
    }

    invalidateCooldownCountSkills() {
        this.invalidatesIncreaseCooldownCount = true;
        this.invalidatesReduceCooldownCount = true;
    }

    increaseCooldownCountForBoth() {
        this.increaseCooldownCountForAttack = true;
        this.increaseCooldownCountForDefense = true;
    }

    clearPrecombatState() {
        // 戦闘前奥義と戦闘中の両方で参照する設定だけ戦闘前奥義発動後に再評価が必要なのでクリアする
        this.damageReductionRatio = 0;
        this.#damageReductionRatios = [];
        this.additionalDamage = 0;
        this.additionalDamageOfSpecial = 0;
        this.additionalDamageInPrecombat = 0;
        this.damageReductionValue = 0;
        // TODO: renameを検討
        this.damageReductionForPrecombat = 0;
    }

    clear() {
        this.clearPrecombatState();
        this.initContext();
    }

    /// 戦闘のダメージ計算時の残りHPです。
    get restHpPercentage() {
        if (this.restHp === this.maxHpWithSkills) {
            return 100;
        }
        return 100 * this.restHp / this.maxHpWithSkills;
    }

    get isRestHpFull() {
        return this.restHp === this.maxHpWithSkills;
    }

    invalidateAllBuffs() {
        this.invalidatesAtkBuff = true;
        this.invalidatesSpdBuff = true;
        this.invalidatesDefBuff = true;
        this.invalidatesResBuff = true;
    }

    setAllBonusReversal() {
        this.isAtkBonusReversal = true;
        this.isSpdBonusReversal = true;
        this.isDefBonusReversal = true;
        this.isResBonusReversal = true;
    }

    setBonusReversals(atk, spd, def, res) {
        this.isAtkBonusReversal |= atk;
        this.isSpdBonusReversal |= spd;
        this.isDefBonusReversal |= def;
        this.isResBonusReversal |= res;
    }

    invalidateBuffs(atk, spd, def, res) {
        this.invalidatesAtkBuff = atk;
        this.invalidatesSpdBuff = spd;
        this.invalidatesDefBuff = def;
        this.invalidatesResBuff = res;
    }

    /**
     * @returns {[boolean, boolean, boolean, boolean]}
     */
    getBuffInvalidations() {
        return [
            this.invalidatesAtkBuff,
            this.invalidatesSpdBuff,
            this.invalidatesDefBuff,
            this.invalidatesResBuff,
        ];
    }

    /**
     * @param {boolean} atk
     * @param {boolean} spd
     * @param {boolean} def
     * @param {boolean} res
     */
    invalidateOwnDebuffs(atk, spd, def, res) {
        this.invalidatesOwnAtkDebuff |= atk;
        this.invalidatesOwnSpdDebuff |= spd;
        this.invalidatesOwnDefDebuff |= def;
        this.invalidatesOwnResDebuff |= res;
    }

    invalidateAllOwnDebuffs() {
        this.invalidatesOwnAtkDebuff = true;
        this.invalidatesOwnSpdDebuff = true;
        this.invalidatesOwnDefDebuff = true;
        this.invalidatesOwnResDebuff = true;
    }

    /**
     * @returns {[boolean, boolean, boolean, boolean]}
     */
    getDebuffInvalidations() {
        return [
            this.invalidatesOwnAtkDebuff,
            this.invalidatesOwnSpdDebuff,
            this.invalidatesOwnDefDebuff,
            this.invalidatesOwnResDebuff,
        ];
    }

    // 奥義のダメージ軽減積
    static multDamageReductionRatioForSpecial(sourceRatio, ratio) {
        return 1 - (1 - sourceRatio) * (1 - ratio);
    }

    // TODO: 置き換える
    // 最初の攻撃のダメージ軽減積
    multDamageReductionRatioOfFirstAttack(ratio, atkUnit) {
        this.addDamageReductionRatioOfFirstAttack(ratio);
    }

    // TODO: 置き換える
    // 最初の攻撃のダメージ軽減積
    multDamageReductionRatioOfFirstAttacks(ratio, atkUnit) {
        this.addDamageReductionRatioOfFirstAttacks(ratio);
    }

    // TODO: 置き換える
    // 連撃のダメージ軽減積
    multDamageReductionRatioOfConsecutiveAttacks(ratio, atkUnit) {
        this.addDamageReductionRatioOfConsecutiveAttacks(ratio);
    }

    // TODO: 置き換える
    // 追撃のダメージ軽減積
    multDamageReductionRatioOfFollowupAttack(ratio, atkUnit) {
        this.addDamageReductionRatioOfFollowupAttack(ratio);
    }

    // 範囲奥義のダメージ軽減積
    multDamageReductionRatioOfPrecombatSpecial(ratio) {
        this.damageReductionRatioForPrecombat = BattleContext.multDamageReductionRatioForSpecial(
            this.damageReductionRatioForPrecombat, ratio);
    }

    addDamageAfterBeginningOfCombatNotStack(damage) {
        this.#damagesAfterBeginningOfCombatNotStack.push(damage);
    }

    getDamagesAfterBeginningOfCombatNotStack() {
        return this.#damagesAfterBeginningOfCombatNotStack.slice(1);
    }

    getMaxDamageAfterBeginningOfCombat() {
        return Math.max(this.damageAfterBeginningOfCombat, ...this.#damagesAfterBeginningOfCombatNotStack);
    }

    // 自分から攻撃したかを考慮して2回攻撃可能かを判定する
    isTwiceAttackActivating() {
        return this.initiatesCombat ? this.attackCount === 2 : this.counterattackCount === 2;
    }

    canPotentFollowupAttack() {
        return this.potentRatios.length > 0;
    }

    canFollowupAttackIncludingPotent() {
        return this.canFollowupAttackWithoutPotent || this.canPotentFollowupAttack();
    }

    addSpecialAddDamage(damage) {
        this.#specialAddDamage += damage;
    }

    addSpecialAddDamagePerAttack(damage) {
        this.#specialAddDamagePerAttack += damage;
    }

    getSpecialAddDamage() {
        return this.#specialAddDamage;
    }

    getSpecialAddDamagePerAttack() {
        return this.#specialAddDamagePerAttack;
    }

    getSpecialCountChangeAmountBeforeFirstAttack() {
        let increase = this.specialCountIncreaseBeforeFirstAttack;
        let reduction =
            this.specialCountReductionBeforeFirstAttack +
            this.specialCountReductionBeforeFirstAttackPerAttack;
        return increase - reduction;
    }

    getSpecialCountChangeAmountBeforeFirstAttackByEnemy() {
        let increase = 0;
        let reduction = this.specialCountReductionBeforeFirstAttackByEnemy;
        return increase - reduction;
    }

    getSpecialCountChangeAmountBeforeFirstFollowUpAttackByEnemy() {
        let increase = 0;
        let reduction = this.specialCountReductionBeforeFirstFollowUpAttackByEnemy;
        return increase - reduction;
    }

    getSpecialCountReductionBeforeFollowupAttack() {
        let increase = this.specialCountIncreaseBeforeFollowupAttack;
        let reduction = this.specialCountReductionBeforeFollowupAttack;
        return increase - reduction;
    }

    isChangedSpecialCountBeforeFirstAttack() {
        return this.specialCountIncreaseBeforeFirstAttack !== 0 ||
            this.specialCountReductionBeforeFirstAttack !== 0 ||
            this.specialCountReductionBeforeFirstAttackPerAttack !== 0;
    }

    isChangedSpecialCountBeforeFirstAttackByEnemy() {
        return this.specialCountReductionBeforeFirstAttackByEnemy !== 0;
    }

    isChangedSpecialCountBeforeFollowupAttack() {
        return this.specialCountReductionBeforeFollowupAttack !== 0;
    }

    getAttackCount(isCounterAttack) {
        return isCounterAttack ? this.counterattackCount : this.attackCount;
    }

    /**
     * 反撃可能かが決定しないといけないのでapplySkillEffectRelatedToFollowupAttackPossibilityFuncMapなどから呼び出す。
     * @returns {boolean}
     */
    canAttackInCombat() {
        return this.initiatesCombat ? true : this.canCounterattack;
    }

    setDamageReductionRatio(ratio) {
        this.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
            return ratio;
        });
    }

    setAttacksTwice() {
        this.setAttackCountFuncs.push(
            (targetUnit, enemyUnit) => {
                // 攻撃時
                targetUnit.battleContext.attackCount = 2;
                // 攻撃を受けた時
                targetUnit.battleContext.counterattackCount = 2;
            }
        );
    }

    updateAttackCount(count) {
        this.attackCount = Math.max(this.attackCount, count);
    }

    updateCounterattackCount(count) {
        this.counterattackCount = Math.max(this.counterattackCount, count);
    }

    isTriggeringAttackTwice() {
        if (this.initiatesCombat) {
            return this.attackCount === 2;
        } else {
            return this.counterattackCount === 2;
        }
    }

    neutralizesReducesCooldownCount() {
        this.applyInvalidationSkillEffectFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                enemyUnit.battleContext.reducesCooldownCount = false;
            }
        );
    }

    setNullFollowupAttack(isAttacking = true, isAttacked = true) {
        this.invalidatesInvalidationOfFollowupAttack = isAttacking;
        this.invalidatesAbsoluteFollowupAttack = isAttacked;
    }

    setSpdNullFollowupAttack(diff = 0, isAttacking = true, isAttacked = true) {
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.isHigherSpdInCombat(enemyUnit, diff)) {
                    this.setNullFollowupAttack(isAttacking, isAttacked);
                }
            }
        );
    }

    addFixedDamageByOwnStatusInCombat(statusIndex, ratio) {
        this.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
            if (isPrecombat) return;
            let statuses = atkUnit.getStatusesInCombat(defUnit);
            atkUnit.battleContext.additionalDamage += Math.trunc(statuses[statusIndex] * ratio);
        });
    }

    addFixedDamageByEnemyStatusInCombat(statusIndex, ratio) {
        this.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
            if (isPrecombat) return;
            let statuses = defUnit.getStatusesInCombat(atkUnit);
            atkUnit.battleContext.additionalDamage += Math.trunc(statuses[statusIndex] * ratio);
        });
    }

    setTempo() {
        this.applyInvalidationSkillEffectFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                enemyUnit.battleContext.reducesCooldownCount = false;
            }
        );
    }

    /**
     * @param {Unit} enemyUnit
     * @param {number} ratio
     */
    reduceAndAddDamage(enemyUnit, ratio) {
        // 最初に受けた攻撃のダメージを軽減
        this.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
        this.addReducedDamageForNextAttack();
    }

    addDamageByStatus(statusFlags, ratio) {
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                let status = targetUnit.getHighestStatusInCombat(enemyUnit, statusFlags);
                this.additionalDamage += Math.trunc(status * ratio);
            }
        );
    }

    reduceDamageByStatus(statusFlags, ratio) {
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                let status = targetUnit.getHighestStatusInCombat(enemyUnit, statusFlags);
                this.damageReductionValue += Math.trunc(status * ratio);
            }
        );
    }

    // 竜眼
    setSpecialCountIncreaseBeforeFirstAttack(amount = 1, resDiff = 5) {
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.isHigherOrEqualResInCombat(enemyUnit, resDiff) &&
                    enemyUnit.hasNormalAttackSpecial()) {
                    // 敵の最初の「攻撃前」に敵の奥義発動カウント＋1、
                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                }
            }
        );
    }

    setDodgeInCombat(percentage = 4, maxPercentage = 40) {
        this.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
            return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, percentage, maxPercentage);
        });
    }

    setResDodgeInCombat(percentage = 4, maxPercentage = 40) {
        this.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
            return DamageCalculationUtility.getResDodgeDamageReductionRatio(atkUnit, defUnit, percentage, maxPercentage);
        });
    }

    addNullInvalidatesHealRatios(ratio) {
        this.#nullInvalidatesHealRatios.push(ratio)
    }

    calculateReducedHealAmount(reducedHeal) {
        // 回復量を減らされた分に対して回復不可無効の割合を乗算していく
        for (let ratio of this.#nullInvalidatesHealRatios) {
            let invalidationAmount = Math.trunc(reducedHeal * ratio);
            reducedHeal -= invalidationAmount;
        }
        return reducedHeal;
    }

    addHealAmountAfterAfterBeginningOfCombatSkills(heal) {
        this.#healAmountsAfterAfterBeginningOfCombatSkills.push(heal);
    }

    get maxHealAmountAfterAfterBeginningOfCombatSkills() {
        return Math.max(...this.#healAmountsAfterAfterBeginningOfCombatSkills);
    }

    get reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation() {
        return this.#reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation;
    }

    addReductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation(ratio) {
        this.#reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation.push(ratio);
    }

    addDamageReductionValueOfFirstAttacks(statusIndex, ratio) {
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                let statuses = targetUnit.getStatusesInCombat(enemyUnit);
                targetUnit.battleContext.damageReductionValueOfFirstAttacks += Math.trunc(statuses[statusIndex] * ratio);
            }
        );
    }

    addReducedDamageForNextAttack() {
        // ダメージ軽減分を保存
        this.addReducedDamageForNextAttackFuncs.push(
            (defUnit, atkUnit, damage, currentDamage, activatesDefenderSpecial, context) => {
                if (!context.isFirstAttack(atkUnit)) return;
                defUnit.battleContext.isNextAttackAddReducedDamageActivating = true;
                defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
            }
        );
        // 攻撃ごとの固定ダメージに軽減した分を加算
        this.calcFixedAddDamagePerAttackFuncs.push((atkUnit, defUnit, isPrecombat) => {
            if (atkUnit.battleContext.isNextAttackAddReducedDamageActivating) {
                atkUnit.battleContext.isNextAttackAddReducedDamageActivating = false;
                let addDamage = atkUnit.battleContext.reducedDamageForNextAttack;
                atkUnit.battleContext.reducedDamageForNextAttack = 0;
                return addDamage;
            }
            return 0;
        });
    }

    applyFoesPenaltyDoubler() {
        this.applySpurForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
            }
        );
    }

    addDamageReductionRatio(ratio) {
        this.#damageReductionRatios.push(ratio);
    }

    getDamageReductionRatios() {
        return this.#damageReductionRatios;
    }

    addDamageReductionRatioOfFirstAttack(ratio) {
        this.#damageReductionRatiosOfFirstAttack.push(ratio);
    }

    getDamageReductionRatiosOfFirstAttack() {
        return this.#damageReductionRatiosOfFirstAttack;
    }

    addDamageReductionRatioOfFirstAttacks(ratio) {
        this.#damageReductionRatiosOfFirstAttacks.push(ratio);
    }

    getDamageReductionRatiosOfFirstAttacks() {
        return this.#damageReductionRatiosOfFirstAttacks;
    }

    addDamageReductionRatioOfFirstAttacksBySpecial(ratio) {
        this.#damageReductionRatiosOfFirstAttacksBySpecial.push(ratio);
    }

    getDamageReductionRatiosOfFirstAttacksBySpecial() {
        return this.#damageReductionRatiosOfFirstAttacksBySpecial;
    }

    addDamageReductionRatioOfConsecutiveAttacks(ratio) {
        this.#damageReductionRatiosOfConsecutiveAttacks.push(ratio);
    }

    getDamageReductionRatiosOfConsecutiveAttacks() {
        return this.#damageReductionRatiosOfConsecutiveAttacks;
    }

    addDamageReductionRatioOfFollowupAttack(ratio) {
        this.#damageReductionRatiosOfFollowupAttack.push(ratio);
    }

    getDamageReductionRatiosOfFollowupAttack() {
        return this.#damageReductionRatiosOfFollowupAttack;
    }

    addDamageReductionRatioByChainGuard(ratio) {
        this.#damageReductionRatiosByChainGuard.push(ratio);
    }

    getDamageReductionRatiosByChainGuard() {
        return this.#damageReductionRatiosByChainGuard;
    }

    get additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount() {
        return this.#additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount;
    }

    addAdditionalNTimesDamageReductionRatiosByNonDefenderSpecialCount(value) {
        this.#additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount =
            Math.max(this.#additionalNTimesDamageReductionRatiosByNonDefenderSpecialCount, value);
    }

    overwritesPotentRatio() {
        return this._potentOverwriteRatio !== null || this._potentOverwriteRatioPerAttack !== null;
    }

    getMaxPotentOverwriteRatio() {
        return Math.max(this._potentOverwriteRatio, this._potentOverwriteRatioPerAttack);
    }

    set potentOverwriteRatio(value) {
        this._potentOverwriteRatio = value;
    }

    set potentOverwriteRatioPerAttack(value) {
        this._potentOverwriteRatioPerAttack = value;
    }

    hasAnyNonSpecialMiracleActivated() {
        return this.hasNonSpecialMiracleActivated
            || this.hasNonSpecialOneTimePerMapMiracleAcitivated
            || this.hasNonSpecialMiracleAndHealAcitivated;
    }

    /**
     * 神罰が発動できるか(無効も考慮)
     * @returns {boolean}
     */
    canActivateWrathfulStaff() {
        if (this.isNeutralizedWrathfulStaff) return false;
        return this.wrathfulStaff;
    }

    getMaxPotentRatio() {
        return ArrayUtil.max(this.potentRatios);
    }
}
