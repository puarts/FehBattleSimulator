/// @file
/// @brief Vueのcomponentの定義です。

function initVueComponents() {
    const DelayTimeForUnitAndStructureComponent = 0;
    Vue.component('unit-detail', function (resolve, reject) {
        setTimeout(function () {
            // resolve コールバックにコンポーネント定義を渡します
            resolve({
                props: ['value'],
                template: "#unit-detail-template"
            })
        }, DelayTimeForUnitAndStructureComponent)
    });

    Vue.component('structure-detail', function (resolve, reject) {
        setTimeout(function () {
            resolve({
                props: ['value'],
                template: "#structure-detail-template"
            })
        }, DelayTimeForUnitAndStructureComponent)
    });

    Vue.component('tile-detail', function (resolve, reject) {
        setTimeout(function () {
            resolve({
                props: ['value'],
                template: "#tile-detail-template"
            })
        }, DelayTimeForUnitAndStructureComponent)
    });

    Vue.component('status-label', function (resolve, reject) {
        setTimeout(function () {
            resolve({
                props: ['statusType', 'unit'],
                template: "#status-label-template"
            })
        }, DelayTimeForUnitAndStructureComponent)
    });

    Vue.component('select2_unwatch', {
        template: '<select></select>',
        props: {
            options: Array,
            value: Number,
        },

        mounted: function () {
            $(this.$el)
                // init select2
                .select2({data: this.options})
                .val(this.value)
                .on('change', (event) =>
                    this.$emit('input', parseInt(event.target.value, 10))
                )
                .trigger('change')
        },
        watch: {
            value: function (value) {
                // update value
                $(this.$el)
                    .val(value)
                // .trigger('change')
            },
            options: function (options) {
                // update options
                $(this.$el).select2({data: options})
                // .trigger('change')
            }
        },
        destroyed: function () {
            $(this.$el).off().select2('destroy')
        }
    });


    function extractUnitAndSkillType(elemName) {
        let unit = null;
        let skillType = null;
        if (elemName != null || elemName !== "") {
            let split = elemName.split("-");
            if (split.length === 2) {
                let unitId = split[0];
                skillType = split[1];
                unit = g_appData.findItemById(unitId);
            }
        }
        return [unit, skillType];
    }

    // select2 を使うためのVueコンポーネント
    Vue.component('select2', {
        template: '<select></select>',

        props: {
            options: {
                type: Array,
                required: true,
            },
            value: {
                type: [Number, String],
                required: false,
            },
        },

        mounted() {
            $(this.$el)
                .select2({data: this.options})
                .val(this.value)
                .trigger('change')
                .on('change', (event) => {
                    const raw = event.target.value;
                    const parsed = parseInt(raw, 10);
                    this.$emit('input', isNaN(parsed) ? raw : parsed);
                });
        },

        watch: {
            value(newVal, oldVal) {
                // 外部から value が変更されたときに select2 に反映
                if (String(oldVal) !== String(newVal)) {
                    $(this.$el).val(newVal).trigger('change');
                }
            },

            options(newOptions) {
                // options が変更されたら再初期化
                $(this.$el)
                    .empty()
                    .select2({data: newOptions})
                    .val(this.value)
                    .trigger('change');
            },
        },

        beforeDestroy() {
            // select2 インスタンスのクリーンアップ
            $(this.$el).off().select2('destroy');
        }
    });

    Vue.component('FlashMessage', {
        name: 'FlashMessage',
        props: [
            'flashMessages',
            'removeFlash'
        ],
        template: `
          <div class="flash-container">
            <div v-for="(msg, index) in this.flashMessages"
                 :key="index"
                 class="flash-message"
                 :class="[ { closable: !msg.autoClose, static: !msg.autoClose }, 'flash-' + (msg.type || 'info') ]"
            >
              {{ msg.text }}
              <span
                  v-if="!msg.autoClose"
                  class="close-btn"
                  @click.stop="this.removeFlash(index)"
              >
                        ✖
                        </span>
            </div>
          </div>
        `,
    });

    Vue.component('SkillToggle', {
        name: 'SkillToggle',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            vm: {required: true},
            skills: {type: Array, required: true},
            index: {type: Number, required: true},
            skillType: {type: String, required: false},
        },
        template: `
          <i class="skill-toggle-header"
             :class="['fa-solid',
                        skills[index][2] ? 'fa-toggle-on' : 'fa-toggle-off',
                        skills[index][2] ? 'icon-green' : 'icon-red']"
             :title="!skills[index][2] ? '有効' : '無効'"
             @click="onToggle"
          ></i>
        `,
        methods: {
            onToggle() {
                // まずは外部ロジック（vm.isSkillEnabledChanged）を呼び出す
                this.vm.isSkillEnabledChanged(this.index, this.skillType);

                // もしリアクティブ更新が効かない場合…
                this.$forceUpdate();
            }
        }
    });

    Vue.component('SkillActions', {
        name: 'SkillAction',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            vm: {required: true},
            skills: {type: Array, required: true},
            index: {type: Number, required: true},
            initValue: {type: Array, required: true},
        },
        template: `
          <div>
            <!-- 削除ボタン -->
            <button class="icon-button-small icon-red align-middle"
                    @click="skills.splice(index, 1);vm.passiveChanged();"
                    :disabled="skills.length === 1">
              <i class="fa-solid fa-trash-can"
                 title="削除"
                 :class="{ 'icon-disabled': skills.length === 1 }"></i>
            </button>

            <!-- 下に追加ボタン -->
            <button type="button"
                    @click="skills.splice(index + 1, 0, initValue);
                                vm.passiveChanged()"
                    class="icon-button-small add-button icon-green align-middle"
                    title="下に追加">
              <i class="fa-solid fa-square-plus"></i>
            </button>
          </div>
        `
    });

    Vue.component('CustomSkillForm', {
        name: 'CustomSkillForm',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            vm: {required: true},
            skills: {type: Array, required: true},
            funcId: {type: String, required: true},
            index: {type: Number, required: true},
        },
        template: `
          <span class="skill-select">
                <!-- カスタムスキル関数 -->
                <select2
                    :options="CustomSkill.OPTIONS"
                    v-model="unit.customSkills[index][0]"
                    @input="vm.customSkillChanged"
                    class="custom-skill"
                ></select2>
                <!-- 引数 -->
                <span v-for="argNode in CustomSkill.Arg.NODES_BY_FUNC_ID.getValues(funcId)">
                    <!-- 数値 -->
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.NON_NEGATIVE_INTEGER"
                    >
                        <input
                            type="number"
                            min="0"
                            step="1"
                            inputmode="numeric"
                            pattern="(?:0|[1-9]=\\d*)"
                            placeholder="0以上の整数"
                            v-model.number="unit.customSkills[index][1][argNode]"
                            @input="vm.customSkillChanged"
                            class="custom-skill-args"
                        />
                    </span>

                    <!-- パーセント -->
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.PERCENTAGE"
                    >
                        <input
                            type="number"
                            min="0"
                            step="1"
                            inputmode="numeric"
                            pattern="(?:0|[1-9]\\d*)"
                            placeholder="0以上の整数"
                            v-model.number="unit.customSkills[index][1][argNode]"
                            @input="vm.customSkillChanged"
                            class="custom-skill-args"
                        >
                        </input>
                        %
                    </span>

                    <!-- カテゴリー -->
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.ID"
                    >
                          <select2
                              :options="CustomSkill.Arg.OPTIONS_BY_NODE.getValues(argNode)"
                              v-model="unit.customSkills[index][1][argNode]"
                              @input="vm.customSkillChanged"
                              class="custom-skill-args"
                          ></select2>
                    </span>
                </span>
            </span>
        `
    })

    Vue.component('SkillForm', {
        name: 'SkillForm',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            vm: {required: true},
            g_imageRootPath: {type: String, required: true},
            g_appData: {required: true},
            isSummonerDuels: {type: Boolean, default: false},
        },
        template: `
          <div class="skill-grid">
            <!-- 武器 -->
            <div class="skill-row weapon-skill-row">
              <div class="skill-icon">
                <img class="weaponIcon"/>
              </div>

              <div class="skill-content">
                <select2
                    :options="vm.enableAllSkillOptions ?
                                vm.weaponOptions : (unit.heroInfo && unit.heroInfo.weaponOptions)"
                    :name="unit.id + '-weapon'"
                    v-model="unit.weapon"
                    @input="vm.weaponChanged"
                    class="skill">
                </select2>
              </div>

              <div>
                <a v-bind:href="unit.weaponInfo.detailPageUrl" target="_blank"
                   v-if="unit.weaponInfo != null">
                  <img class="urlJumpIcon" v-bind:src="g_imageRootPath + 'UrlJump.png'"/>
                </a>
              </div>

              <div>
                <select v-model="unit.weaponRefinement"
                        @change="vm.weaponOptionChanged"
                        v-if="(vm.enableAllSkillOptions ? 
                                g_appData.weaponRefinementOptions : 
                                (unit.weaponInfo?.weaponRefinementOptions || [])).length > 1">
                  <option
                      v-for="op in (vm.enableAllSkillOptions ? g_appData.weaponRefinementOptions : (unit.weaponInfo?.weaponRefinementOptions || []))"
                      :key="op.id"
                      :value="op.id">
                    {{ op.text }}
                  </option>
                </select>
              </div>

              <div>
                        <span class="debugInfo" v-bind:style="vm.debugMenuStyle">
                            ({{ unit.weapon }}) {{ unit.heroInfo != null ? unit.heroInfo.weaponOptions.length : 0 }},
                          {{ g_appData.weaponImplCount }}/{{ g_appData.weaponCount }}
                          ({{ Math.floor(100 * g_appData.weaponImplCount / g_appData.weaponCount, 2) }}%)
                        </span>
              </div>
            </div>

            <!-- サポート -->
            <div class="skill-row support-skill-row">
              <div class="skill-icon"><img class="supportIcon"/>
              </div>

              <div class="skill-content">
                <select2
                    class="skill"
                    v-model="unit.support"
                    @input="vm.supportChanged"
                    :options="vm.enableAllSkillOptions
                              ? vm.supportOptions
                              : (unit.heroInfo ? unit.heroInfo.supportOptions : [])"
                    :name="!vm.enableAllSkillOptions && unit.heroInfo
                              ? unit.id + '-support'
                              : null"
                />
              </div>

              <div>
                <a v-bind:href="unit.supportInfo.detailPageUrl" target="_blank" v-if="unit.supportInfo != null">
                  <img class="urlJumpIcon" v-bind:src="g_imageRootPath + 'UrlJump.png'"/>
                </a>
              </div>

              <div>
                        <span class="debugInfo" v-bind:style="vm.debugMenuStyle">
                          ({{ unit.support }}) {{ unit.heroInfo != null ? unit.heroInfo.supportOptions.length : 0 }},
                          {{ g_appData.supportImplCount }}/{{ g_appData.supportCount }}(
                          {{ Math.floor(100 * g_appData.supportImplCount / g_appData.supportCount, 2) }}%)
                        </span>
              </div>
            </div>

            <!-- 奥義 -->
            <div class="skill-row special-skill-row">
              <div class="skill-icon">
                <img :src="EngagedSpecialIcon[unit.emblemHeroIndex]"/>
              </div>

              <div class="skill-content">
                <select2
                    class="skill"
                    v-model="unit.special"
                    @input="vm.specialChanged"
                    :options="vm.enableAllSkillOptions
                                ? vm.specialOptions
                                : (unit.heroInfo ? unit.heroInfo.specialOptions : [])"
                    :name="!vm.enableAllSkillOptions && unit.heroInfo
                                ? unit.id + '-special'
                                : null"
                />
              </div>

              <div>
                <a :href="unit['specialInfo'].detailPageUrl" target="_blank" v-if="unit['specialInfo'] != null">
                  <img class="urlJumpIcon" :src="g_imageRootPath + 'UrlJump.png'"/>
                </a>
              </div>

              <div>
                        <span v-if="unit['special'] >= 0">
                            <input
                                name="currentUnitSpecial"
                                type="number"
                                min="0"
                                :max="unit['maxSpecialCount']"
                                v-model="unit['specialCount']"
                                class="numeric"
                                @input="vm.specialCountChanged"
                            /> / {{ unit['maxSpecialCount'] }}
                        </span>
              </div>

              <div>
                        <span class="debugInfo" :style="vm.debugMenuStyle">
                            ({{ unit['special'] }})
                          {{ unit.heroInfo != null ? unit.heroInfo['specialOptions'].length : 0 }},
                          {{ g_appData['specialImplCount'] }}/{{ g_appData['specialCount'] }}
                          ({{ Math.floor(100 * g_appData['specialImplCount'] / g_appData['specialCount']) }}%)
                        </span>
              </div>
            </div>

            <!-- パッシブスキル -->
            <div v-for="slot in ['A', 'B', 'C', 'S', 'X']"
                 :key="slot"
                 class="skill-row"
                 :class="{
                                'passive-s-skill-row': slot === 'S',
                                'passive-x-skill-row': slot === 'X',
                                'passive-skill-row': slot !== 'S' && slot !== 'X'
                             }"
            >
              <div class="skill-icon">
                <img v-if="unit['passive' + slot + 'Info'] != null" :src="unit['passive' + slot + 'Info'].iconPath"/>
                <img v-else :src="g_imageRootPath + 'None.png'"/>
                <img :src="g_imageRootPath + slot + (slot === 'X' ? '.webp' : '.png')"
                     class="skillTypeText"
                />
              </div>

              <div class="skill-content">
                <select2
                    :options="vm.enableAllSkillOptions
                                ? vm['passive' + slot + 'Options']
                                : (unit.heroInfo ? unit.heroInfo['passive' + slot + 'Options'] : [])"
                    :name="!vm.enableAllSkillOptions && unit.heroInfo
                                ? unit.id + '-passive' + slot
                                : null"
                    v-model="unit['passive' + slot]"
                    @input="vm['passive' + slot + 'Changed']"
                    class="skill"
                />
              </div>

              <div>
                <a :href="unit['passive' + slot + 'Info'].detailPageUrl" target="_blank"
                   v-if="unit['passive' + slot + 'Info'] != null">
                  <img class="urlJumpIcon" :src="g_imageRootPath + 'UrlJump.png'"/>
                </a>
              </div>

              <div>
                        <span class="debugInfo" :style="vm.debugMenuStyle">
                            ({{ unit['passive' + slot] }})
                          {{ unit.heroInfo != null ? unit.heroInfo['passive' + slot + 'Options'].length : 0 }},
                          {{ g_appData['passive' + slot + 'ImplCount'] }}/{{ g_appData['passive' + slot + 'Count'] }}
                          (
                          {{ Math.floor(100 * g_appData['passive' + slot + 'ImplCount'] / g_appData['passive' + slot + 'Count']) }}
                          %)
                        </span>
              </div>
            </div>

            <!-- 隊長 -->
            <div v-if="isSummonerDuels" class="skill-row passive-skill-row">
              <div class="skill-icon">
                <img v-if="unit.captainInfo != null" v-bind:src="unit.captainInfo.iconPath"/>
                <img v-else v-bind:src="g_imageRootPath + 'UnknownCaptainSkill.webp'"/>
                <span class="skillTypeText" style="font-size:10px">隊長</span>
              </div>
              <div class="skill-content">
                <select2 :options="vm.captainOptions" v-model="unit.captain"
                         @input="vm.captainChanged"
                         class="skill">
                </select2>
              </div>
              <div>
                <a v-bind:href="unit.captainInfo.detailPageUrl" target="_blank" v-if="unit.captainInfo != null">
                  <img class="urlJumpIcon" v-bind:src="g_imageRootPath + 'UrlJump.png'"/></a>
                <span class="debugInfo" v-bind:style="vm.debugMenuStyle">
                            ({{ unit.captain }})
                        </span>
              </div>
            </div>

            <!-- 追加スキル -->
            <div v-for="([skillId, _args, isEnabled], index) of unit.additionalPassives"
                 :key="'additional-passives-' + unit.id + '-' + index + '-' + String(skillId)"
                 class="skill-row additional-skill-row"
            >
              <div class="skill-icon">
                <skill-toggle
                    v-model="unit"
                    :vm="vm"
                    :skills="unit.additionalPassives"
                    :index="index"
                    :skill-type="'additional'"
                >
                </skill-toggle>
              </div>

              <div class="skill-content">
                <select2 :options="vm.additionalPassiveOptions"
                         v-model="unit.additionalPassives[index][0]"
                         @input="vm.additionalSkillChanged" class="skill">
                </select2>
              </div>

              <div>
                <a v-bind:href="unit.additionalPassiveInfos[index].detailPageUrl"
                   target="_blank"
                   v-if="unit.additionalPassiveInfos[index] != null">
                  <img class="urlJumpIcon" v-bind:src="g_imageRootPath + 'UrlJump.png'"/>
                </a>
              </div>

              <div class="skill-actions">
                <skill-actions
                    v-model="unit"
                    :vm="vm"
                    :skills="unit.additionalPassives"
                    :index="index"
                    :init-value="Unit.getInitAdditionalPassives()[0]"
                >
                </skill-actions>
              </div>

              <div>
                        <span class="debugInfo" v-bind:style="vm.debugMenuStyle">
                            ({{ unit.additionalPassives[index][0] }})
                        </span>
              </div>
            </div>

            <!-- カスタムスキル -->
            <div v-for="([funcId, args, isEnabled], index) of unit.customSkills"
                 :key="'additional-passives-' + unit.id + '-' + index + '-' + String(funcId)"
                 class="skill-row custom-skill-row"
            >
              <div class="skill-icon">
                <skill-toggle
                    v-model="unit"
                    :vm="vm"
                    :skills="unit.customSkills"
                    :index="index"
                    :skill-type="'custom'"
                >
                </skill-toggle>
              </div>

              <div class="skill-content custom-skill-name">
                <custom-skill-form
                    v-model="unit"
                    :vm="vm"
                    :skills="unit.customSkills"
                    :func-id="funcId"
                    :index="index"
                    :skill-type="'custom'"
                >
                </custom-skill-form>
              </div>

              <div class="skill-actions">
                <skill-actions
                    v-model="unit"
                    :vm="vm"
                    :skills="unit.customSkills"
                    :index="index"
                    :init-value="Unit.getInitCustomSkills()[0]"
                >
                </skill-actions>
              </div>
            </div>
          </div>
        `
    });

    Vue.component('SkillActionArea', {
        name: 'SkillActionArea',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            g_app: {required: true},
            g_appData: {required: true},
        },
        template: `
          <div>
            <span style="font-size:12px">×がついているスキルは未実装
            (未実装数 {{ g_appData.totalSkillCount - g_appData.totalImplementedSkillCount }})
            </span>
            <br/>
            <input type="button" value="初期スキル装備"
                   @click="unit.clearReservedSkills();unit.initializeSkillsToDefault();">
            <input type="button" value="全て外す" @click="unit.clearReservedSkills();unit.clearSkills();">
            <input v-if="g_appData.isDebugMenuEnabled" type="button" value="未実装スキルをログ表示"
                   @click="g_app.outputSkillsNotImplemented();">

            <button
                type="button"
                @click="unit.initAdditionalPassives();g_app.vm.passiveChanged()"
            >
              追加スキルを初期化
            </button>
            <button
                type="button"
                @click="unit.initCustomSkills();g_app.vm.passiveChanged()"
            >
              カスタムスキルを初期化
            </button>
          </div>
        `
    });

    Vue.component('MapButton', {
        name: 'MapButton',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            g_app: {required: true},
        },
        template: `
          <div style="padding:5px">
            <span v-if="unit.isDuoAllyHero && g_app.canActivateDuoSkillOrHarmonizedSkill(unit)">
                <input type="button"
                       style="background-image: url(/AetherRaidTacticsBoard/images/ActivateDuoSkill.png)"
                       class="fehButton"
                       @click="g_app.activateDuoOrHarmonizedSkill(unit);">
            </span>
            <span v-if="unit.isDuoAllyHero && !g_app.canActivateDuoSkillOrHarmonizedSkill(unit)">
                <input type="button" v-if="unit.isDuoAllyHero " disabled
                       style=" background-image: url(/AetherRaidTacticsBoard/images/ActivateDuoSkill_Disabled.png)"
                       class="fehButtonDisabled">
            </span>

            <span v-if="unit.isHarmonicAllyHero && g_app.canActivateDuoSkillOrHarmonizedSkill(unit)">
                <input type="button"
                       style="background-image: url(/AetherRaidTacticsBoard/images/ActivateHarmonizedSkill.png)"
                       class="fehButton"
                       @click="g_app.activateDuoOrHarmonizedSkill(unit);">
            </span>
            <span v-if="unit.isHarmonicAllyHero && !g_app.canActivateDuoSkillOrHarmonizedSkill(unit)">
                <input type="button" v-if="unit.isHarmonicAllyHero" disabled
                       style=" background-image: url(/AetherRaidTacticsBoard/images/ActivateHarmonizedSkill_Disabled.png)"
                       class="fehButtonDisabled">
            </span>

            <span v-if="unit.canActivateStyle()">
                <input type="button"
                       class="fehButton map-control-button map-activate-style-button"
                       @click="g_app.activateStyleSkill(unit);">
            </span>
            <span v-if="unit.canDeactivateStyle()">
                <input type="button"
                       class="fehButton map-control-button map-deactivate-style-button"
                       @click="g_app.deactivateStyleSkill(unit);">
            </span>
            <span v-if="unit.hasAvailableStyleButCannotActivate()">
                <input type="button"
                       disabled
                       class="fehButtonDisabled map-control-button map-activate-style-button"
                >
            </span>
          </div>
        `
    });

    Vue.component('ArenaScore', {
        name: 'ArenaScore',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            g_appData: {required: true},
        },
        template: `
          <fieldset v-if="g_appData.gameMode == GameMode.Arena"  style="font-size:12px;">
            <legend>闘技場スコア</legend>

            <span>スコア: {{unit.arenaScore*2}}({{unit.arenaScore}})</span><br/>
            <span style="color:#555">
                        計算式: (150 + {{unit.rarityScore}} + {{unit.levelScore}} + ({{unit.rating}} / 5) + ({{unit.totalSp}} / 100) + ({{unit.merge}} * 2)) * 2<br/>
                        総合値: {{unit.rating}}<br/>
                        合計SP: {{unit.totalSp}}({{unit.weaponSp}}+{{unit.supportSp}}+{{unit.specialSp}}+{{unit.passiveASp}}+{{unit.passiveBSp}}+{{unit.passiveCSp}}+{{unit.passiveSSp}})</span><br/>
            <input type="button" @click="g_app.setUnitToMaxArenaScore(unit)" value="最大スコアに設定"></input>
          </fieldset>
        `
    });

    Vue.component('UnitDebug', {
        name: 'UnitDebug',
        model: {
            prop: 'unit',
        },
        props: {
            unit: {type: Unit, required: true},
            g_appData: {required: true},
        },
        template: `
          <span v-bind:style="g_app.vm.debugMenuStyle">
            pos=({{ unit.posX }}, {{ unit.posY }})
            <br/>
            skills={{ unit.weapon }},{{ unit.support }},{{ unit.special }},
            {{ unit.passiveA }},{{ unit.passiveB }},{{ unit.passiveC }},{{ unit.passiveS }},{{ unit.passiveX }}
            <br/>
            additionalPassives={{ unit.additionalPassives }}
            <br/>
            customSkills={{ unit.customSkills }}
            <br/>
            enumerateSkills={{ Array.from(unit.enumerateSkills()) }}
            <br/>
            reservedSkills={{ unit.reservedWeapon }},{{ unit.reservedSupport }},{{ unit.reservedSpecial }},
            {{ unit.reservedPassiveA }},{{ unit.reservedPassiveB }},{{ unit.reservedPassiveC }},
            {{ unit.reservedPassiveS }},{{ unit.reservedPassiveX }}
            <br/>
            movementOrder={{ unit.movementOrder }}
            <br/>
            chaseTargetTile={{ unit.chaseTargetTileToString() }}

            <span v-if="unit.heroInfo != null">
                <table>
                    <tr>
                        <th></th>
                        <th>HP</th>
                        <th>攻</th>
                        <th>速</th>
                        <th>守</th>
                        <th>魔</th>
                    </tr>
                    <tr>
                        <th>★5</th>
                        <td>{{ unit.heroInfo.hpLv1 }}</td>
                        <td>{{ unit.heroInfo.atkLv1 }}</td>
                        <td>{{ unit.heroInfo.spdLv1 }}</td>
                        <td>{{ unit.heroInfo.defLv1 }}</td>
                        <td>{{ unit.heroInfo.resLv1 }}</td>
                    </tr>
                    <tr>
                        <th>★4</th>
                        <td>{{ unit.heroInfo.hpLv1ForStar4 }}</td>
                        <td>{{ unit.heroInfo.atkLv1ForStar4 }}</td>
                        <td>{{ unit.heroInfo.spdLv1ForStar4 }}</td>
                        <td>{{ unit.heroInfo.defLv1ForStar4 }}</td>
                        <td>{{ unit.heroInfo.resLv1ForStar4 }}</td>
                    </tr>
                    <tr>
                        <th>★3</th>
                        <td>{{ unit.heroInfo.hpLv1ForStar3 }}</td>
                        <td>{{ unit.heroInfo.atkLv1ForStar3 }}</td>
                        <td>{{ unit.heroInfo.spdLv1ForStar3 }}</td>
                        <td>{{ unit.heroInfo.defLv1ForStar3 }}</td>
                        <td>{{ unit.heroInfo.resLv1ForStar3 }}</td>
                    </tr>
                    <tr>
                        <th>★2</th>
                        <td>{{ unit.heroInfo.hpLv1ForStar2 }}</td>
                        <td>{{ unit.heroInfo.atkLv1ForStar2 }}</td>
                        <td>{{ unit.heroInfo.spdLv1ForStar2 }}</td>
                        <td>{{ unit.heroInfo.defLv1ForStar2 }}</td>
                        <td>{{ unit.heroInfo.resLv1ForStar2 }}</td>
                    </tr>
                    <tr>
                        <th>★1</th>
                        <td>{{ unit.heroInfo.hpLv1ForStar1 }}</td>
                        <td>{{ unit.heroInfo.atkLv1ForStar1 }}</td>
                        <td>{{ unit.heroInfo.spdLv1ForStar1 }}</td>
                        <td>{{ unit.heroInfo.defLv1ForStar1 }}</td>
                        <td>{{ unit.heroInfo.resLv1ForStar1 }}</td>
                    </tr>
                </table>
            </span>
        </span>
        `
    })
}

initVueComponents();
