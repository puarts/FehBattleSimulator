if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    __init__applySkillEffectForAtkUnitFuncDict() {
        let self = this;
        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantBowPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantSwordPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantLancePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.InstantAxePlus] = func;
        }
        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 5;
                atkUnit.spdSpur += 5;
                atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.CourtlyFanPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.ViciousDaggerPlus] = func;
        }
        self._applySkillEffectForAtkUnitFuncDict[Weapon.BenihimeNoOno] = (atkUnit, defUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                if (defUnit.battleContext.restHpPercentage === 100) {
                    atkUnit.atkSpur += 5;
                    atkUnit.defSpur += 5;
                    atkUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KurooujiNoYari] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage === 100) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HewnLance] = (atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveB.BeliefInLove] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage === 100) {
                defUnit.atkSpur -= 5;
                defUnit.defSpur -= 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.SatougashiNoAnki] = (atkUnit) => {
            atkUnit.spdSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KokyousyaNoYari] = (atkUnit, defUnit) => {
            if (defUnit.battleContext.restHpPercentage >= 70) {
                atkUnit.atkSpur += 5;
                atkUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KinranNoSyo] = (atkUnit) => {
            atkUnit.atkSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.RohyouNoKnife] = (atkUnit, defUnit) => {
            if (defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) {
                atkUnit.defSpur += 20;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Paruthia] = (atkUnit, defUnit) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.resSpur += 4;
            }
            else {
                if (isWeaponTypeTome(defUnit.weaponType)) {
                    atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, defUnit);
                }
                if (atkUnit.isWeaponSpecialRefined) {
                    if (defUnit.isRangedWeaponType()) {
                        atkUnit.atkSpur += 6;
                    }
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Yatonokami] = (atkUnit) => {
            if (atkUnit.weaponRefinement === WeaponRefinementType.None) {
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.KageroNoGenwakushin] = (atkUnit, defUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, defUnit);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Sangurizuru] = (atkUnit) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.atkSpur += 3;
                atkUnit.spdSpur += 3;
            } else {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.atkSpur += 6;
                    atkUnit.spdSpur += 6;
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.GeneiFalcion] = (atkUnit) => {
            {
                let count = self.__countAlliesActionDone(atkUnit);
                let amount = Math.min(7, count * 2 + 3);
                if (atkUnit.isWeaponRefined) {
                    amount = Math.min(10, count * 3 + 4);
                }
                atkUnit.atkSpur += amount;
                atkUnit.spdSpur += amount;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.YaibaNoSession3] = (atkUnit, defUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = self.__countAlliesActionDone(atkUnit);
                let amount = Math.min(9, count * 3 + 3);
                atkUnit.atkSpur += amount;
                atkUnit.spdSpur += amount;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.SteadyImpact] = (atkUnit) => {
            atkUnit.spdSpur += 7;
            atkUnit.defSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.SwiftImpact] = (atkUnit) => {
            atkUnit.spdSpur += 7;
            atkUnit.resSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinKongoNoSyungeki] = (atkUnit) => {
            atkUnit.atkSpur += 6;
            atkUnit.defSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinMeikyoNoSyungeki] = (atkUnit) => {
            atkUnit.atkSpur += 6;
            atkUnit.resSpur += 10;
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.BlazingDurandal] = (atkUnit) => {
            atkUnit.battleContext.increaseCooldownCountForBoth();
            atkUnit.battleContext.reducesCooldownCount = true;
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.spdSpur += 7;
                atkUnit.defSpur += 10;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.NinissIceLance] = (atkUnit) => {
            if (!atkUnit.isWeaponRefined) {
                atkUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Forblaze] = (atkUnit) => {
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.HanasKatana] = (atkUnit) => {
            if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.Durandal] = (atkUnit) => {
            atkUnit.atkSpur += 6;
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 4;
                atkUnit.spdSpur += 4;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.FurederikuNoKenfu] = (atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 6;
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[Weapon.JokerNoSyokki] = (atkUnit, defUnit) => {
            defUnit.addAllSpur(-4);
            if (atkUnit.isWeaponSpecialRefined) {
                let isActivated = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 3, false)) {
                    if (!unit.isFullHp) {
                        isActivated = true;
                        break;
                    }
                }
                if (isActivated) {
                    atkUnit.addAllSpur(4);
                }
            }
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.DeathBlow3] = (atkUnit) => {
            atkUnit.atkSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.DeathBlow4] = (atkUnit) => {
            atkUnit.atkSpur += 8;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki1] = (atkUnit) => {
            atkUnit.spdSpur += 2;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki2] = (atkUnit) => {
            atkUnit.spdSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki3] = (atkUnit) => {
            atkUnit.spdSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienNoIchigeki4] = (atkUnit) => {
            atkUnit.spdSpur += 9;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KongoNoIchigeki3] = (atkUnit) => {
            atkUnit.defSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.MeikyoNoIchigeki3] = (atkUnit) => {
            atkUnit.resSpur += 6;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinHienNoIchigeki3] = (atkUnit) => {
            atkUnit.atkSpur += 6; atkUnit.spdSpur += 7;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinKongoNoIchigeki2] = (atkUnit) => {
            atkUnit.atkSpur += 4; atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinMeikyoNoIchigeki2] = (atkUnit) => {
            atkUnit.atkSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienKongoNoIchigeki2] = (atkUnit) => {
            atkUnit.spdSpur += 4; atkUnit.defSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.HienMeikyoNoIchigeki2] = (atkUnit) => {
            atkUnit.spdSpur += 4; atkUnit.resSpur += 4;
        };
        self._applySkillEffectForAtkUnitFuncDict[PassiveA.KongoMeikyoNoIchigeki2] = (atkUnit) => {
            atkUnit.defSpur += 4; atkUnit.resSpur += 4;
        };
        {
            let func = (atkUnit, defUnit) => {
                defUnit.addAllSpur(-4);
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.HelmsmanAxePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.RauaFoxPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BlarfoxPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.GronnfoxPlus] = func;
        }

        {
            let func = (atkUnit) => {
                atkUnit.addAllSpur(2);
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.KaigaraNoYari] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.KiagaraNoYariPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BeachFlag] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BeachFlagPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.YashiNoMiNoYumi] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.YashiNoMiNoYumiPlus] = func;
        }

        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 4;
                atkUnit.defSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.AijouNoHanaNoYumiPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.BukeNoSteckPlus] = func;
        }

        {
            let func = (atkUnit) => {
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.spdSpur += 6;
                }
            };

            self._applySkillEffectForAtkUnitFuncDict[Weapon.Toron] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.MiraiNoSeikishiNoYari] = func;
        }

        {
            let func = (atkUnit) => {
                atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.KurokiChiNoTaiken] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.FlowerStandPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.CakeKnifePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.SyukuhaiNoBottlePlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.SyukuhukuNoHanaNoYumiPlus] = func;
            self._applySkillEffectForAtkUnitFuncDict[PassiveA.KishinHienNoIchigeki2] = func;
        }

        {
            let func = (atkUnit) => {
                if (atkUnit.isWeaponSpecialRefined) {
                    atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
                }
            };
            self._applySkillEffectForAtkUnitFuncDict[Weapon.Amite] = func;
            self._applySkillEffectForAtkUnitFuncDict[Weapon.KazahanaNoReitou] = func;
        }
    },

    __init__applySkillEffectForDefUnitFuncDict() {
        let self = this;
        self._applySkillEffectForDefUnitFuncDict[Weapon.Kurimuhirudo] = (defUnit) => {
            if (!defUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                    defUnit.battleContext.canCounterattackToAllDistance = true;
                }
            } else {
                if (self.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                    defUnit.battleContext.canCounterattackToAllDistance = true;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.OgonNoTanken] = (defUnit) => {
            if (defUnit.isSpecialCharged) {
                defUnit.battleContext.canCounterattackToAllDistance = true;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BenihimeNoOno] = (defUnit, atkUnit) => {
            if (atkUnit.isWeaponSpecialRefined) {
                atkUnit.atkSpur += 5;
                atkUnit.defSpur += 5;
                atkUnit.battleContext.increaseCooldownCountForBoth();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.KurooujiNoYari] = (defUnit) => {
            defUnit.atkSpur += 5;
            defUnit.defSpur += 5;
            defUnit.resSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveB.GuardBearing3] = (defUnit, atkUnit) => {
            if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                defUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, atkUnit);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.StalwartSword] = (defUnit, atkUnit) => {
            atkUnit.atkSpur -= 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveB.BeliefInLove] = (defUnit, atkUnit) => {
            atkUnit.atkSpur -= 5;
            atkUnit.defSpur -= 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantWard] = (defUnit, atkUnit) => {
            if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                defUnit.atkSpur += 5;
                defUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseWard] = (defUnit, atkUnit) => {
            if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                defUnit.atkSpur += 5;
                defUnit.resSpur += 5;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.KokyousyaNoYari] = (defUnit) => {
            defUnit.atkSpur += 5;
            defUnit.resSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Vidofuniru] = (defUnit, atkUnit) => {
            if (!defUnit.isWeaponRefined) {
                if (atkUnit.weaponType === WeaponType.Sword
                    || atkUnit.weaponType === WeaponType.Lance
                    || atkUnit.weaponType === WeaponType.Axe
                ) {
                    defUnit.defSpur += 7;
                }
            } else {
                if (atkUnit.weaponType === WeaponType.Sword
                    || atkUnit.weaponType === WeaponType.Lance
                    || atkUnit.weaponType === WeaponType.Axe
                    || isWeaponTypeBreath(atkUnit.weaponType)
                    || isWeaponTypeBeast(atkUnit.weaponType)
                ) {
                    defUnit.defSpur += 7;
                    defUnit.ResSpur += 7;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Naga] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.defSpur += 4;
                defUnit.resSpur += 4;
            }
            else {
                defUnit.defSpur += 2;
                defUnit.resSpur += 2;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ManatsuNoBreath] = (defUnit) => {
            defUnit.battleContext.increaseCooldownCountForDefense = true;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.FurorinaNoSeisou] = (defUnit, atkUnit) => {
            if (atkUnit.weaponType === WeaponType.Sword
                || atkUnit.weaponType === WeaponType.Lance
                || atkUnit.weaponType === WeaponType.Axe
                || isWeaponTypeBreathOrBeast(atkUnit.weaponType)
            ) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.HinataNoMoutou] = (defUnit) => {
            defUnit.atkSpur += 4;
            defUnit.defSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.OboroNoShitsunagitou] = (defUnit, atkUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.isMeleeWeaponType()) {
                    defUnit.resSpur += 6;
                    defUnit.defSpur += 6;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.YukyuNoSyo] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.resSpur += 4;
                defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.FutsugyouNoYari] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.atkSpur += 4;
                defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ByakuyaNoRyuuseki] = (defUnit, atkUnit) => {
            if (!atkUnit.isBuffed) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.GeneiFalcion] = (defUnit) => {
            {
                let count = self.__countEnemiesActionDone(defUnit);
                let amount = Math.max(3, 7 - count * 2);
                if (defUnit.isWeaponRefined) {
                    amount = Math.max(4, 10 - count * 3);
                    defUnit.battleContext.healedHpAfterCombat += 7;
                }
                defUnit.defSpur += amount;
                defUnit.resSpur += amount;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.TateNoSession3] = (defUnit, atkUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = self.__countEnemiesActionDone(defUnit);
                let amount = Math.max(3, 9 - count * 3);
                defUnit.defSpur += amount;
                defUnit.resSpur += amount;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DartingBreath] = (defUnit) => {
            defUnit.spdSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinNoKokyu] = (defUnit) => {
            defUnit.atkSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKokyu] = (defUnit) => {
            defUnit.defSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKokyu] = (defUnit) => {
            defUnit.resSpur += 4;
            defUnit.battleContext.increaseCooldownCountForBoth();
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BerkutsLance] = (defUnit) => {
            defUnit.resSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.BerkutsLancePlus] = (defUnit) => {
            if (defUnit.weaponRefinement === WeaponRefinementType.None) {
                defUnit.resSpur += 4;
            } else {
                defUnit.resSpur += 7;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.Ekkezakkusu] = (defUnit, atkUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDef4] = (defUnit, atkUnit) => {
            if (atkUnit.isRangedWeaponType()) {
                defUnit.defSpur += 8;
                defUnit.resSpur += 8;
                defUnit.battleContext.invalidateAllBuffs();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseDef4] = (defUnit, atkUnit) => {
            if (atkUnit.isMeleeWeaponType()) {
                defUnit.defSpur += 8;
                defUnit.resSpur += 8;
                defUnit.battleContext.invalidateAllBuffs();
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseDef3] = (defUnit, atkUnit) => {
            if (atkUnit.isMeleeWeaponType()) {
                defUnit.defSpur += 6;
                defUnit.resSpur += 6;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.MoumokuNoYumi] = (defUnit, atkUnit) => {
            if (atkUnit.isRangedWeaponType()) {
                defUnit.addAllSpur(4);
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.HuinNoKen] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.defSpur += 4;
                defUnit.resSpur += 4;
            }
            else {
                defUnit.defSpur += 2;
                defUnit.resSpur += 2;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.ShirokiChiNoNaginata] = (defUnit) => {
            defUnit.atkSpur += 4;
            defUnit.defSpur += 4;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae1] = (defUnit) => {
            defUnit.atkSpur += 2; defUnit.defSpur += 2;
        };
        self._applySkillEffectForDefUnitFuncDict[Weapon.GiyuNoYari] = (defUnit) => {
            if (defUnit.isWeaponSpecialRefined) {
                defUnit.spdSpur += 4; defUnit.defSpur += 4;
            }
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKamae4] = (defUnit) => {
            defUnit.defSpur += 8;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKamae4] = (defUnit) => {
            defUnit.resSpur += 8;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinMeikyoNoKamae3] = (defUnit) => {
            defUnit.atkSpur += 6;
            defUnit.resSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienKongoNoKamae3] = (defUnit) => {
            defUnit.spdSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.SwiftStance3] = (defUnit) => {
            defUnit.spdSpur += 6;
            defUnit.resSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae3] = (defUnit) => {
            defUnit.atkSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinHienNoKamae3] = (defUnit) => {
            defUnit.atkSpur += 6;
            defUnit.spdSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoMeikyoNoKamae3] = (defUnit) => {
            defUnit.resSpur += 6;
            defUnit.defSpur += 6;
            defUnit.battleContext.reducesCooldownCount = true;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.SacaNoOkite] = (defUnit) => {
            if (self.__countAlliesWithinSpecifiedSpaces(defUnit, 2, () => true) >= 2) {
                defUnit.addAllSpur(4);
            }
        };
        {
            let func = (defUnit, atkUnit) => {
                if (isPhysicalWeaponType(atkUnit.weaponType)) {
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                }
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantFoil] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseFoil] = func;
        }

        {
            let func = (defUnit, atkUnit) => {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.Blarserpent] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BlarserpentPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.GronnserpentPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.RauarserpentPlus] = func;
        }

        {
            let func = (defUnit, atkUnit) => {
                if (atkUnit.isRangedWeaponType()) {
                    defUnit.defSpur += 6;
                    defUnit.resSpur += 6;
                }
            };


            self._applySkillEffectForDefUnitFuncDict[Weapon.EnkyoriBougyoNoYumiPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDef3] = func;
        }

        {
            let func = (defUnit) => {
                defUnit.addAllSpur(2);
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.Seiju] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.SeijuPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HandBell] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HandBellPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.PresentBukuro] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.PresentBukuroPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.Syokudai] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.SyokudaiPlus] = func;
        }
        {
            let func = (defUnit) => {
                defUnit.defSpur += 7;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoKen] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoKenPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MamoriNoOnoPlus] = func;
        }
        {
            let func = (defUnit) => {
                defUnit.resSpur += 7;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoKen] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoKenPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BariaNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.BarrierAxePlus] = func;
        }
        {
            let func = (defUnit) => {
                defUnit.atkSpur += 6;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.HankoNoYari] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.HankoNoYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.ReprisalAxePlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinNoKamae3] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienNoKamae3] = (defUnit) => {
            defUnit.spdSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoNoKamae3] = (defUnit) => {
            defUnit.defSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.MeikyoNoKamae3] = (defUnit) => {
            defUnit.resSpur += 6;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinHienNoKamae2] = (defUnit) => {
            defUnit.atkSpur += 4; defUnit.spdSpur += 4;
        };

        {
            let func = (defUnit) => {
                defUnit.atkSpur += 4; defUnit.defSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.OstiasCounter] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.KorakuNoKazariYariPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinKongoNoKamae2] = func;
        }

        {
            let func = (defUnit) => {
                defUnit.atkSpur += 4; defUnit.resSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[Weapon.SaladaSandPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KishinMeikyoNoKamae2] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienKongoNoKamae2] = (defUnit) => { defUnit.spdSpur += 4; defUnit.defSpur += 4; };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienMeikyoNoKamae1] = (defUnit) => { defUnit.spdSpur += 2; defUnit.resSpur += 2; };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.HienMeikyoNoKamae2] = (defUnit) => { defUnit.spdSpur += 4; defUnit.resSpur += 4; };

        {
            let func = (defUnit) => {
                defUnit.defSpur += 4; defUnit.resSpur += 4;
            };
            self._applySkillEffectForDefUnitFuncDict[PassiveA.JaryuNoUroko] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MizuNoBreath] = func;
            self._applySkillEffectForDefUnitFuncDict[Weapon.MizuNoBreathPlus] = func;
            self._applySkillEffectForDefUnitFuncDict[PassiveA.KongoMeikyoNoKamae2] = func;
        }

        self._applySkillEffectForDefUnitFuncDict[PassiveA.CloseReversal] = (defUnit) => {
            defUnit.defSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantFerocity] = (defUnit) => {
            defUnit.atkSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantDart] = (defUnit) => {
            defUnit.spdSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantReversal] = (defUnit) => {
            defUnit.defSpur += 5;
        };
        self._applySkillEffectForDefUnitFuncDict[PassiveA.DistantStance] = (defUnit) => {
            defUnit.resSpur += 5;
        };
    },

    __init__applySpecialSkillEffect() {
        this._applySpecialSkillEffectFuncDict[Special.Taiyo] = (targetUnit) => {
            targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
        };
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
            };
            this._applySpecialSkillEffectFuncDict[Special.Youkage] = func;
            this._applySpecialSkillEffectFuncDict[Special.Yuyo] = func;
        }
        {
            let func = (targetUnit) => {
                // 月虹
                targetUnit.battleContext.specialSufferPercentage = 30;
            };

            this._applySpecialSkillEffectFuncDict[Special.Kagetsuki] = func;
            this._applySpecialSkillEffectFuncDict[Special.Moonbow] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Luna] = (targetUnit) => {
            // 月光
            targetUnit.battleContext.specialSufferPercentage = 50;
        };
        this._applySpecialSkillEffectFuncDict[Special.KuroNoGekko] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 80;
        };
        this._applySpecialSkillEffectFuncDict[Special.Lethality] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 75;
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };
        {
            let func = (targetUnit) => {
                // 天空
                targetUnit.battleContext.specialSufferPercentage = 50;
                targetUnit.battleContext.specialDamageRatioToHeal = 0.5;
            };
            this._applySpecialSkillEffectFuncDict[Special.Aether] = func;
            this._applySpecialSkillEffectFuncDict[Special.AoNoTenku] = func;
            this._applySpecialSkillEffectFuncDict[Special.RadiantAether2] = func;
            this._applySpecialSkillEffectFuncDict[Special.MayhemAether] = func;
        }


        this._applySpecialSkillEffectFuncDict[Special.LunaFlash] = (targetUnit, enemyUnit) => {
            {
                // 月光閃
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.2));
                targetUnit.battleContext.specialSufferPercentage = 20;
            }
        };

        this._applySpecialSkillEffectFuncDict[Special.LunarFlash2] = (targetUnit, enemyUnit) => {
            {
                // 月光閃・承
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.2));
                targetUnit.battleContext.specialSufferPercentage = 20;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };

        {
            let func = (targetUnit) => {
                // 凶星
                targetUnit.battleContext.specialMultDamage = 1.5;
            };
            this._applySpecialSkillEffectFuncDict[Special.Hoshikage] = func;
            this._applySpecialSkillEffectFuncDict[Special.Glimmer] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Deadeye] = (targetUnit) => {
            targetUnit.battleContext.specialMultDamage = 2;
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };
        this._applySpecialSkillEffectFuncDict[Special.Astra] = (targetUnit) => {
            // 流星
            targetUnit.battleContext.specialMultDamage = 2.5;
        };

        this._applySpecialSkillEffectFuncDict[Special.DragonBlast] = (targetUnit, enemyUnit) => {
            // 神竜破
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.5));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ArmoredFloe] = (targetUnit, enemyUnit) => {
            // 重装の聖氷
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.4));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ArmoredBeacon] = (targetUnit, enemyUnit) => {
            // 重装の聖炎
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.4));
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 緋炎
                {
                    let totalDef = targetUnit.getDefInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.5));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Hotarubi] = func;
            this._applySpecialSkillEffectFuncDict[Special.Bonfire] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Ignis] = (targetUnit, enemyUnit) => {
            // 華炎
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.8));
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 氷蒼
                {
                    let totalRes = targetUnit.getResInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.5));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Hyouten] = func;
            this._applySpecialSkillEffectFuncDict[Special.Iceberg] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.Glacies] = (targetUnit, enemyUnit) => {
            // 氷華
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.8));
            }
        };

        this._applySpecialSkillEffectFuncDict[Special.CircletOfBalance] = (targetUnit, enemyUnit) => {
            // 聖神と暗黒神の冠
            let totalRes = targetUnit.getResInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.4));
            targetUnit.battleContext.canActivateNonSpecialOneTimePerMapMiracleFuncs.push((defUnit, atkUnit) => {
                let isSpecialCharged = defUnit.isSpecialCharged || atkUnit.isSpecialCharged;
                let hasSpecialActivated = defUnit.battleContext.hasSpecialActivated || atkUnit.battleContext.hasSpecialActivated;
                let condA = isSpecialCharged || hasSpecialActivated;
                let condB = defUnit.battleContext.initiatesCombat || isRangedWeaponType(atkUnit.weaponType);
                // 1回発動したかどうかはコンテキストかユニットの両方を見る必要がある
                // ユニットが保持する値はリアルタイムに保持されずにDamageTypeがActualDamageの時に戦闘後にユニットにコピーされる
                let hasOncePerMapSpecialActivated =
                    defUnit.hasOncePerMapSpecialActivated ||
                    defUnit.battleContext.hasOncePerMapSpecialActivated;
                let condSatisfied = condA || condB;
                return condSatisfied && !hasOncePerMapSpecialActivated;
            });
        }

        this._applySpecialSkillEffectFuncDict[Special.HolyKnightAura] = (targetUnit, enemyUnit) => {
            // グランベルの聖騎士
            {
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.25));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ChivalricAura] = (targetUnit, enemyUnit) => {
            // グランベルの騎士道
            {
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.25));
            }
        };

        {
            let func = (targetUnit, enemyUnit) => {
                // 竜裂
                {
                    let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.3));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.Fukuryu] = func;
            this._applySpecialSkillEffectFuncDict[Special.DraconicAura] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.DragonFang] = (targetUnit, enemyUnit) => {
            {
                // 竜穿
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.5));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.Enclosure] = (targetUnit, enemyUnit) => {
            {
                // 閉界
                let totalAtk = targetUnit.getAtkInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalAtk * 0.25));
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.ShiningEmblem] = (targetUnit, enemyUnit) => {
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.35));
            }
        };
        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.HonoNoMonsyo] = func;
            this._applySpecialSkillEffectFuncDict[Special.HerosBlood] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.RighteousWind] = (targetUnit, enemyUnit) => {
            // 聖風
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.Sirius] = (targetUnit, enemyUnit) => {
            // 天狼
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
                targetUnit.battleContext.specialDamageRatioToHeal = 0.3;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.SiriusPlus] = (targetUnit, enemyUnit) => {
            // 天狼+
            {
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.35));
                targetUnit.battleContext.specialDamageRatioToHeal = 0.35;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.TwinBlades] = (targetUnit, enemyUnit) => {
            // 双刃
            {
                let totalRes = targetUnit.getResInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.4));
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.RupturedSky] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeBeast(enemyUnit.weaponType) || isWeaponTypeBreath(enemyUnit.weaponType)) {
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.4));
            }
            else {
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(enemyUnit.getAtkInCombat(targetUnit) * 0.2));
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.SublimeHeaven] = (targetUnit, enemyUnit) => {
            let isDragonOrBeast = isWeaponTypeBreath(enemyUnit.weaponType) || isWeaponTypeBeast(enemyUnit.weaponType);
            let ratio = isDragonOrBeast ? 0.5 : 0.25;
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * ratio));
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        };

        this._applySpecialSkillEffectFuncDict[Special.DevinePulse] = (targetUnit, enemyUnit) => {
            {
                // 天刻の拍動
                let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.25));
            }
        }

        this._applySpecialSkillEffectFuncDict[Special.VitalAstra] = (targetUnit, enemyUnit) => {
            let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.3));
        };
        {
            let func = (targetUnit, enemyUnit) => {
                {
                    let totalSpd = targetUnit.getSpdInCombat(enemyUnit);
                    targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalSpd * 0.4));
                }
            };
            this._applySpecialSkillEffectFuncDict[Special.RegnalAstra] = func;
            this._applySpecialSkillEffectFuncDict[Special.ImperialAstra] = func;
            this._applySpecialSkillEffectFuncDict[Special.SupremeAstra] = func;
        }

        this._applySpecialSkillEffectFuncDict[Special.OpenTheFuture] = (targetUnit, enemyUnit) => {
            {
                let totalDef = targetUnit.getDefInCombat(enemyUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalDef * 0.5));
                targetUnit.battleContext.specialDamageRatioToHeal = 0.25;
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.BlueFrame] = (targetUnit) => {
            targetUnit.battleContext.addSpecialAddDamage(10);
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.addSpecialAddDamage(15);
            }
        };
        this._applySpecialSkillEffectFuncDict[Special.BrutalShell] = (targetUnit) => {
            targetUnit.battleContext.specialSufferPercentage = 50;
        }
        this._applySpecialSkillEffectFuncDict[Special.SeidrShell] = (targetUnit) => {
            targetUnit.battleContext.addSpecialAddDamage(15);
        };
    },
});
