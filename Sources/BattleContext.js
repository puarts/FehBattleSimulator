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
        this.damageReductionRatioOfFirstAttack = 0; // 最初の1撃だけ
        this.damageReductionRatioOfFirstAttacks = 0; // 連撃の場合は1,2回目の攻撃(3,4回目が対象外)
        this.damageReductionRatioOfConsecutiveAttacks = 0;
        this.damageReductionRatioOfFollowupAttack = 0;
        /**
         * フランなどのチェインガードによる回避効果
         * @type {[[Unit, Number]]}
         * */
        this.damageReductionRatiosByChainGuard = [];
        this.isChainGuardActivated = false;
        this.reductionRatiosOfDamageReductionRatioExceptSpecial = []; // 奥義以外のダメージ軽減効果の軽減率(シャールヴィ)
        this.reductionRatiosOfDamageReductionRatioExceptSpecialPerAttack = []; // 奥義以外のダメージ軽減効果の軽減率
        this.#reductionRatiosOfDamageReductionRatioExceptSpecialOnSpecialActivation = [];
        this.isEffectiveToOpponent = false;
        this.isEffectiveToOpponentForciblly = false; // スキルを無視して強制的に特効を付与します(ダメージ計算器用)
        this.attackCount = 1;
        this.counterattackCount = 1;
        this.canCounterattackToAllDistance = false;
        // 奥義発動カウント変動量
        this.cooldownCountForAttack = 1;
        this.cooldownCountForDefense = 1;

        // 戦闘中に奥義が発動されたかどうか
        this.isSpecialActivated = false;
        this.specialActivatedCount = 0;

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

        // 氷の聖鏡発動時などの軽減ダメージ保持用
        this.reducedDamageForNextAttack = 0;

        // 差し違え4などの軽減前ダメージの参照割合の保持用(最大値適用)
        this.reducedRatioForNextAttack = 0;

        // 差し違え4などの軽減前ダメージの割合加算
        this.additionalDamageOfNextAttackByDamageRatio = 0;

        // 次の自分の攻撃のダメージ加算
        this.additionalDamageOfNextAttack = 0;

        // 奥義発動後、自分の次の攻撃の効果(氷の聖鏡・承など)が発生するか
        this.nextAttackEffectAfterSpecialActivated = false;

        // 自分の次の攻撃のダメージに軽減をプラスする効果が発動するか
        this.nextAttackAddReducedDamageActivated = false;

        // 自分から攻撃したか
        this.initiatesCombat = false;

        // 追撃優先度
        this.followupAttackPriorityIncrement = 0;
        this.followupAttackPriorityDecrement = 0;

        // 戦闘前の範囲奥義で有効になるダメージ軽減率
        this.damageReductionRatioForPrecombat = 0;
        // 戦闘前の範囲奥義のダメージ軽減
        this.damageReductionForPrecombat = 0;

        // 戦闘中常に有効になるダメージ軽減率
        // @NOTE: ダメージ軽減無効を考慮する必要があるので基本this.multDamageReductionRatioメソッドで値を設定する
        this.damageReductionRatio = 0;

        // 防御系奥義によるダメージ軽減率
        this.damageReductionRatioBySpecial = 0;

        // 防御系でない奥義によるダメージ軽減率
        this.damageReductionRatiosByNonDefenderSpecial = [];

        // 次の敵の攻撃ダメージ軽減(奥義による軽減)
        this.damageReductionRatiosBySpecialOfNextAttack = [];

        // 奥義による攻撃でダメージを与えた時、次の敵の攻撃ダメージ軽減
        this.damageReductionRatiosOfNextAttackWhenSpecialActivated = [];

        // 戦闘中受けた攻撃ダメージを40%軽減(1戦闘1回のみ)(範囲奥義を除く)
        this.damageReductionRatiosWhenCondSatisfied = [];

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

        // 攻撃時の追加ダメージ
        // TODO: 戦闘前と戦闘中で変数を分ける
        this.additionalDamage = 0;

        // 最初の攻撃の追加ダメージ
        this.additionalDamageOfFirstAttack = 0;

        // 奥義発動時の追加ダメージ
        this.additionalDamageOfSpecial = 0;

        // 攻撃ごとに変化する可能性がある追加ダメージ
        this.additionalDamagePerAttack = 0;

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

        // 奥義以外の祈りが発動したかどうか
        this.isNonSpecialMiracleActivated = false;

        // 1マップで1回の奥義効果が発動したかどうか
        this.isOncePerMapSpecialActivated = false;

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
        this.isNonSpecialMiracleActivated = false;

        // 奥義による祈りが発動したかどうか
        this.isSpecialMiracleActivated = false;

        // 奥義以外の祈り(1マップ1回)
        this.canActivateNonSpecialOneTimePerMapMiracle = false;

        // 奥義以外の祈りが発動したかどうか(1マップ1回)
        this.isNonSpecialOneTimePerMapMiracleAcitivated = false;

        // 奥義以外の祈り+HP99回復
        this.canActivateNonSpecialMiracleAndHeal = false;

        // 奥義以外の祈り+HP99回復が発動したかどうか
        this.isNonSpecialMiracleAndHealAcitivated = false;

        // 奥義による祈り+HP99回復が発動したかどうか
        this.isSpecialMiracleAndHealAcitivated = false;

        // 奥義による祈りが発動したかどうか
        this.isSpecialMiracleAcitivated = false;

        // 奥義による祈りが発動したかどうか(1マップ1回)
        this.isSpecialOneTimePerMapMiracleAcitivated = false;

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
        this.neutralizedDebuffsWhileBeginningOfTurn = [false, false, false, false];

        // 戦闘開始後にNダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)
        this.damageAfterBeginningOfCombat = 0;

        this.#damagesAfterBeginningOfCombatNotStack = [0]; // 最大値を取る時のために番兵(0)を入れる

        // 奥義以外の祈り無効
        this.neutralizesNonSpecialMiracle = false;

        // 神速追撃
        this.potentRatios = [];

        // 神速追撃上書き
        this.potentOverwriteRatio = null;

        // 戦闘中に一度しか発動しない奥義のスキル効果が発動したか
        this.isOneTimeSpecialSkillEffectActivatedDuringCombat = false;

        // 瞬殺
        this.isBaneSpecial = false;

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
        // ステータス決定後のスキル効果
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs = [];
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
    }

    initContextPerAttack() {
        this.additionalDamagePerAttack = 0;
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
        this.additionalDamage = 0;
        this.additionalDamageOfSpecial = 0;
        this.damageReductionValue = 0;
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

    invalidateAllOwnDebuffs() {
        this.invalidatesOwnAtkDebuff = true;
        this.invalidatesOwnSpdDebuff = true;
        this.invalidatesOwnDefDebuff = true;
        this.invalidatesOwnResDebuff = true;
    }

    /**
     * @param {boolean} atk
     * @param {boolean} spd
     * @param {boolean} def
     * @param {boolean} res
     */
    invalidateDebuffs(atk, spd, def, res) {
        this.invalidatesOwnAtkDebuff = atk;
        this.invalidatesOwnSpdDebuff = spd;
        this.invalidatesOwnDefDebuff = def;
        this.invalidatesOwnResDebuff = res;
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

    // ダメージ軽減積
    static multDamageReductionRatio(sourceRatio, ratio, atkUnit) {
        return 1 - (1 - sourceRatio) * (1 - ratio);
    }

    // 奥義のダメージ軽減積
    static multDamageReductionRatioForSpecial(sourceRatio, ratio) {
        return 1 - (1 - sourceRatio) * (1 - ratio);
    }

    // ダメージ軽減積
    multDamageReductionRatio(ratio, atkUnit) {
        this.damageReductionRatio = BattleContext.multDamageReductionRatio(this.damageReductionRatio, ratio, atkUnit);
    }

    // 最初の攻撃のダメージ軽減積
    multDamageReductionRatioOfFirstAttack(ratio, atkUnit) {
        this.damageReductionRatioOfFirstAttack = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfFirstAttack, ratio, atkUnit);
    }

    // 最初の攻撃のダメージ軽減積
    multDamageReductionRatioOfFirstAttacks(ratio, atkUnit) {
        this.damageReductionRatioOfFirstAttacks = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfFirstAttacks, ratio, atkUnit);
    }

    // 連撃のダメージ軽減積
    multDamageReductionRatioOfConsecutiveAttacks(ratio, atkUnit) {
        this.damageReductionRatioOfConsecutiveAttacks = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfConsecutiveAttacks, ratio, atkUnit);
    }

    // 追撃のダメージ軽減積
    multDamageReductionRatioOfFollowupAttack(ratio, atkUnit) {
        this.damageReductionRatioOfFollowupAttack = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfFollowupAttack, ratio, atkUnit);
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

    neutralizesReducesCooldownCount() {
        this.applyInvalidationSkillEffectFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                enemyUnit.battleContext.reducesCooldownCount = false;
            }
        );
    }

    setNullFollowupAttack() {
        this.invalidatesAbsoluteFollowupAttack = true;
        this.invalidatesInvalidationOfFollowupAttack = true;
    }

    setSpdNullFollowupAttack(diff = 0) {
        this.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.isHigherSpdInCombat(enemyUnit, diff)) {
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
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

    setResDodge(percentage = 4, maxPercentage = 40) {
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
                defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
            }
        );
        // 攻撃ごとの固定ダメージに軽減した分を加算
        this.calcFixedAddDamagePerAttackFuncs.push((atkUnit, defUnit, isPrecombat) => {
            if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                let addDamage = atkUnit.battleContext.reducedDamageForNextAttack;
                atkUnit.battleContext.reducedDamageForNextAttack = 0;
                return addDamage;
            }
            return 0;
        });
    }

    setFoesPenaltyDoubler() {
        this.applySpurForUnitAfterCombatStatusFixedFuncs.push(
            (targetUnit, enemyUnit, calcPotentialDamage) => {
                enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
            }
        );
    }
}
