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
            fallbackValue: {type: [Number, String], default: -1, required: false},
            isDebugMode: {type: Boolean, default: false, required: false},
        },

        mounted() {
            $(this.$el)
                .select2({data: this.options})
                .val(this.value)
                .trigger('change')
                .on('change', (event) => {
                    const raw = event.target.value;
                    const parsed = parseInt(raw, 10);
                    let newVar = isNaN(parsed) ? raw : parsed;
                    if (newVar === 0 || newVar) {
                        this.$emit('input', newVar);
                    }
                });
        },

        methods: {
            applyInvalidValueClass(hasCurrent) {
                // 不正値表示用にスタイルを付与（任意）
                const container = $(this.$el).next('.select2-container');
                if (!hasCurrent) {
                    container.addClass('invalid-value');
                } else {
                    container.removeClass('invalid-value');
                }
            },
        },

        watch: {
            value(newVal, oldVal) {
                // console.log(`select2: value changed: ${oldVal} -> ${newVal}`);
                // 1. 現在の UI 側 select2 の値を取得
                const uiVal = $(this.$el).val();
                // console.log(`select2: UI val = ${uiVal}, prop newVal = ${newVal}`);

                // 2. UI とプロップが異なる場合のみ反映して change を起こす
                if (String(uiVal) !== String(newVal)) {
                    // console.log('update with new value: ' + newVal);
                    $(this.$el)
                        .val(newVal)
                        .trigger('change');
                }
                if (this.isDebugMode) {
                    const hasCurrent = this.options.some(opt => String(opt.id) === String(this.value));
                    this.applyInvalidValueClass(hasCurrent);
                }
            },

            options(newOptions, oldOptions) {
                // まず、現在の this.value が newOptions に含まれているかチェック
                const hasCurrent = newOptions.some(opt => String(opt.id) === String(this.value));
                // デバッグモードならオプションにない値が含まれても元の値を保持する
                // その際に警告を表示する
                // そうでない場合は元の値に-1をセットする
                if (this.isDebugMode) {
                    let effectiveOptions = newOptions.slice();

                    if (!hasCurrent) {
                        // 「不正な値」用のダミーオプションを作成
                        effectiveOptions.push({
                            id:    this.value,
                            text:  `（不正な値: ${this.value}）`,
                            disabled: true
                        });
                    }
                    // select2 を再初期化し、必ず currentValue を選択
                    $(this.$el)
                        .empty()
                        .select2({ data: effectiveOptions })
                        .val(this.value)
                        .trigger('change');

                    // 不正値表示用にスタイルを付与（任意）
                    this.applyInvalidValueClass(hasCurrent);
                } else {
                    // オプションにない要素は -1（fallbackValue 使用）
                    const selectedValue = hasCurrent ? this.value : this.fallbackValue;
                    $(this.$el)
                        .empty()
                        .select2({data: newOptions})
                        .val(selectedValue)
                        .trigger('change');
                }
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
            <div v-for="(msg, index) in flashMessages"
                 :key="index"
                 class="flash-message"
                 :class="[ { closable: !msg.autoClose, static: !msg.autoClose }, 'flash-' + (msg.type || 'info') ]"
            >
              {{ msg.text }}
              <span
                  v-if="!msg.autoClose"
                  class="close-btn"
                  @click.stop="removeFlash(index)"
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
                    :is-debug-mode="vm.isDebugMenuEnabled"
                    @input="vm.initCustomSkillArgs(index);vm.customSkillChanged();"
                    class="custom-skill"
                ></select2>
                <!-- 引数 -->
                <span 
                    v-for="(argNode, argIndex) in CustomSkill.Arg.FUNC_ID_TO_NODES.getValues(funcId)"
                    :key="'for-arg-' + funcId + '-' + argNode + '-' + argIndex"
                >
                    <!-- br -->
                    <br
                        v-if="argNode === CustomSkill.Arg.Node.BR"
                    />
                    <!-- + -->
                    <span
                        v-if="argNode === CustomSkill.Arg.Node.PLUS"
                        class="normal"
                    >
                      &plus;
                    </span>
                    <!-- x -->
                    <span
                        v-if="argNode === CustomSkill.Arg.Node.MULT"
                        class="normal"
                    >
                      &times;
                    </span>
                    <!-- 文字列 -->
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.STRING"
                        class="normal"
                        v-html="CustomSkill.Arg.StringNodeToStrings.get(argNode)"
                    >
                    </span>

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
                            class="custom-skill-num-args"
                        />
                    </span>

                    <!-- パーセント -->
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.PERCENTAGE"
                    >
                        <input
                            type="number"
                            min="0"
                            step="10"
                            inputmode="numeric"
                            pattern="(?:0|[1-9]\\d*)"
                            placeholder="0以上の整数"
                            v-model.number="unit.customSkills[index][1][argNode]"
                            @input="vm.customSkillChanged"
                            class="custom-skill-num-args"
                        >
                        </input>
                        <span class="normal">%</span>
                    </span>

                    <!-- カテゴリー -->
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.ID"
                    >
                          <select2
                              :options="CustomSkill.Arg.NODE_TO_OPTIONS.getValues(argNode)"
                              v-model="unit.getCustomSkillArgs(index)[argNode]"
                              @input="v => vm.customSkillChanged(unit, v)"
                              class="custom-skill-args"
                              style="width: 220px"
                          ></select2>
                    </span>
                    <span
                        v-if="CustomSkill.Arg.getNodeType(argNode) === CustomSkill.Arg.NodeType.IDS"
                    >
                        <span class="normal"
                              style="display: inline-block; vertical-align: middle;" 
                        >
                            <div
                                v-for="(v, i) in unit.getCustomSkillArgs(index)[argNode]"
                                :key="'ids-' + unit.id + '-' + funcId + '-' + index + '-' + i"
                                class="skill-arg-row"
                            >
                                <select2
                                  :options="CustomSkill.Arg.NODE_TO_OPTIONS.getValues(argNode)"
                                  @input="v => {vm.customSkillArgsArrayChanged(unit.getCustomSkillArgs(index)[argNode], i, v);}"
                                  :value="unit.getCustomSkillArgs(index)[argNode][i]"
                                  class="custom-skill-args"
                                >
                                </select2>
                            </div>
                        </span>
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
                    :value="unit.weapon"
                    :is-debug-mode="vm.isDebugMenuEnabled"
                    @input="v => vm.weaponChanged(unit, v)"
                    @options-changed="vm.initSkills"
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
                    :value="unit.support"
                    :is-debug-mode="vm.isDebugMenuEnabled"
                    @input="v => vm.supportChanged(unit, v)"
                    @options-changed="vm.initSkills"
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
                    :value="unit.special"
                    :is-debug-mode="vm.isDebugMenuEnabled"
                    @input="v => vm.specialChanged(unit, v)"
                    @options-changed="vm.initSkills"
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
                 :key="'passive-' + slot"
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
                    :value="unit['passive' + slot]"
                    :is-debug-mode="vm.isDebugMenuEnabled"
                    @input="v => vm.passiveSlotChanged(unit, v, slot)"
                    @options-changed="vm.initSkills"
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
                <select2 :options="vm.captainOptions" 
                         v-model="unit.captain"
                         :is-debug-mode="vm.isDebugMenuEnabled"
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
                         :is-debug-mode="vm.isDebugMenuEnabled"
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
                 :key="'custom-skills-' + unit.id + '-' + index + '-' + String(funcId)"
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
        props: {
            testMethod: {type: Function, required: false},
            getApp: {type: Function, required: true},
            getAttacker: {type: Function, required: true},
            getCurrentUnit: {type: Function, required: true},
        },
        methods: {
            canDisplayDuoButton: function () {
                return this.getAttacker()?.isDuoAllyHero && !this.getAttacker()?.hasAvailableStyle();
            },
            canDisplayHarmonicButton: function () {
                return this.getAttacker()?.isHarmonicAllyHero && !this.getAttacker()?.hasAvailableStyle();
            },
            duoOrHarmonizedSkillButtonStyle(type) {
                const enabled = this.canActivateDuoSkillOrHarmonizedSkill();
                const fileName = enabled
                    ? `Activate${type}Skill.png`
                    : `Activate${type}Skill_Disabled.png`;
                return {
                    backgroundImage: `url(/AetherRaidTacticsBoard/images/${fileName})`
                };
            },
            onDuoOrHarmonizedSkillClick() {
                if (this.canActivateDuoSkillOrHarmonizedSkill()) {
                    this.getApp().activateDuoOrHarmonizedSkill(this.getAttacker());
                }
            },
            canActivateDuoSkillOrHarmonizedSkill: function () {
                return this.getApp().canActivateDuoSkillOrHarmonizedSkill(this.getAttacker());
            },
            canActivateStyle: function () {
                return this.getCurrentUnit()?.canActivateStyle();
            },
            canDeactivateStyle: function () {
                return this.getCurrentUnit()?.canDeactivateStyle();
            },
        },
        template: `
            <span>
                <input
                    v-if="canDisplayDuoButton()"
                    type="button"
                    :style="duoOrHarmonizedSkillButtonStyle('Duo')"
                    :class="canActivateDuoSkillOrHarmonizedSkill() ? 'fehButton' : 'fehButtonDisabled'"
                    :disabled="!canActivateDuoSkillOrHarmonizedSkill()"
                    @click="onDuoOrHarmonizedSkillClick()"
                />

                <input
                    v-if="canDisplayHarmonicButton()"
                    type="button"
                    :style="duoOrHarmonizedSkillButtonStyle('Harmonized')"
                    :class="canActivateDuoSkillOrHarmonizedSkill() ? 'fehButton' : 'fehButtonDisabled'"
                    :disabled="!canActivateDuoSkillOrHarmonizedSkill()"
                    @click="onDuoOrHarmonizedSkillClick()"
                />

                <input
                    v-if="canActivateStyle() || canDeactivateStyle()"
                    type="button"
                    class="fehButton map-control-button"
                    :class="canActivateStyle()
                      ? 'map-activate-style-button'
                      : 'map-deactivate-style-button'"
                    @click="canActivateStyle()
                      ? getApp().activateStyleSkill(getCurrentUnit())
                      : getApp().deactivateStyleSkill(getCurrentUnit())"
                />
                <span v-if="getCurrentUnit()?.hasAvailableStyleButCannotActivate()">
                    <input type="button"
                           disabled
                           class="fehButtonDisabled map-control-button map-activate-style-button"
                    >
                </span>
            </span>
        `,
    });

    Vue.component('ControlButtons', {
        name: 'ControlButtons',
        props: {
            getApp: {type: Function, required: true},
            getAttacker: {type: Function, required: true},
            getCurrentUnit: {type: Function, required: true},
            map: {type: Map, required: true},
            updateMap: {type: Function, required: true},
            endTurn: {type: Function, required: true},
            saveSettings: {type: Function, required: true},
            globalBattleContext: {type: GlobalBattleContext, required: true},
            showSettingDialog: {type: Function, required: true},
            showImportDialog: {type: Function, required: true},
            showExportDialog: {type: Function, required: true},
            audioManager: {type: AudioManager, required: true},
            bgmEnabledChanged: {type: Function, required: true},
            loadLazyImages: {type: Function, required: true},
        },
        methods: {},
        mounted() {
            this.loadLazyImages();
        },
        template: `
            <div class="control-panel">
                <upper-buttons
                        :get-app="getApp"
                        :get-attacker="getAttacker"
                        :get-current-unit="getCurrentUnit"
                        :map="map"
                        :update-map="updateMap"
                        :end-turn="endTurn"
                        :save-settings="saveSettings"
                        :global-battle-context="globalBattleContext"
                        :show-setting-dialog="showSettingDialog"
                        :show-import-dialog="showImportDialog"
                        :show-export-dialog="showExportDialog"
                        :audio-manager="audioManager"
                        :bgm-enabled-changed="bgmEnabledChanged"
                        :load-lazy-images="loadLazyImages"
                >
                </upper-buttons>
                <lower-buttons
                        :get-app="getApp"
                        :get-attacker="getAttacker"
                        :get-current-unit="getCurrentUnit"
                        :map="map"
                        :update-map="updateMap"
                        :save-settings="saveSettings"
                        :global-battle-context="globalBattleContext"
                        :show-setting-dialog="showSettingDialog"
                        :show-import-dialog="showImportDialog"
                        :show-export-dialog="showExportDialog"
                        :audio-manager="audioManager"
                        :bgm-enabled-changed="bgmEnabledChanged"
                        :load-lazy-images="loadLazyImages"
                >
                </lower-buttons>
            </div>
        `,
    });

    Vue.component('UpperButtons', {
        name: 'UpperButtons',
        props: {
            getApp: {type: Function, required: true},
            getAttacker: {type: Function, required: true},
            getCurrentUnit: {type: Function, required: true},
            map: {type: Map, required: true},
            endTurn: {type: Function, required: true},
            globalBattleContext: {type: GlobalBattleContext, required: true},
            loadLazyImages: {type: Function, required: true},
        },
        methods: {},
        mounted() {
            this.loadLazyImages();
        },
        template: `
            <div class="control-row">
                <span v-if="map.showEnemyAttackRange == true">
                    <input type="button"
                        style="background-image: url(/AetherRaidTacticsBoard/images/DangerAreaEnabled.png) "
                        class="fehButton imageButton"
                        @click="map.switchEnemyAttackRange();updateMap();">
                </span>
                <span v-if="map.showEnemyAttackRange == false">
                    <input type="button"
                        style="background-image: url(/AetherRaidTacticsBoard/images/DangerAreaDisabled.png) "
                        class="fehButton imageButton"
                        @click="map.switchEnemyAttackRange();updateMap();">
                </span>

                <input type="button" style="background-image: url(/images/dummy.png) "
                    class="lazy fehButton imageButton"
                    data-src="/AetherRaidTacticsBoard/images/SaveState.png"
                    @click="getApp?.().clearSimpleLog();saveSettings();">
                <input type="button" style="background-image: url(/images/dummy.png) "
                    class="lazy fehButton imageButton"
                    data-src="/AetherRaidTacticsBoard/images/LoadState.png"
                    @click="getApp?.().clearSimpleLog();loadSettings();">

                <span
                    v-if="globalBattleContext.currentTurn > 0 && globalBattleContext.currentPhaseType == UnitGroupType.Ally">
                    <input type="button"
                        style="background-image: url(/AetherRaidTacticsBoard/images/AutoPlay.png) "
                        class="fehButton imageButton"
                        @click="getApp?.().clearLog(); getApp?.().simulateAllyAction();">
                </span>
                <span
                    class="control-row-5"
                    v-if="globalBattleContext.currentTurn > 0 && globalBattleContext.currentPhaseType == UnitGroupType.Ally">
                    <input type="button"
                        style="background-image: url(/AetherRaidTacticsBoard/images/EndTurn.png)"
                        class="fehButton imageButton" @click="endTurn">
                </span>

                <span
                    class="control-row-5"
                    v-if="globalBattleContext.currentTurn > 0 && globalBattleContext.currentPhaseType == UnitGroupType.Enemy">
                    <input type="button"
                        style="background-image: url(/AetherRaidTacticsBoard/images/SimulateEnemyAction.png)"
                        class="fehButton imageButton"
                        @click="getApp?.().clearLog(); getApp?.().simulateEnemyAction();">
                </span>
            </div>
        `,
    });

    Vue.component('LowerButtons', {
        name: 'LowerButtons',
        props: {
            getApp: {type: Function, required: true},
            getAttacker: {type: Function, required: true},
            getCurrentUnit: {type: Function, required: true},
            showSettingDialog: {type: Function, required: true},
            showImportDialog: {type: Function, required: true},
            showExportDialog: {type: Function, required: true},
            audioManager: {type: AudioManager, required: true},
            bgmEnabledChanged: {type: Function, required: true},
            loadLazyImages: {type: Function, required: true},
        },
        methods: {
        },
        mounted() {
            this.loadLazyImages();
        },
        template: `
            <div class="control-row">
                <input type="button" style="background-image: url(/images/dummy.png) "
                    class="lazy fehButton imageButton"
                    data-src="/AetherRaidTacticsBoard/images/Settings.png"
                    @click="showSettingDialog();">
                <input type="button" style="background-image: url(/images/dummy.png) "
                    class="lazy fehButton imageButton"
                    data-src="/AetherRaidTacticsBoard/images/ImportSettings.png"
                    @click="showImportDialog();">
                <input type="button" style="background-image: url(/images/dummy.png) "
                    class="lazy fehButton imageButton"
                    data-src="/AetherRaidTacticsBoard/images/ExportSettings.png"
                    @click="showExportDialog();">
                <input type="checkbox" id="enableSound" class="fehButton"
                    v-model="audioManager.isBgmEnabled" @change="bgmEnabledChanged">
                <label for="enableSound" class="fehButton"
                    style="background-image: url('/AetherRaidTacticsBoard/images/EnableSound.png')"></label>

                <map-button
                        :get-app="getApp"
                        :get-attacker="getAttacker"
                        :get-current-unit="getCurrentUnit"
                >
                </map-button>
            </div>
        `
    })

    Vue.component('MapButtonInUnitTab', {
        name: 'MapButtonInUnitTab',
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
    });

    Vue.component('DebugSettings', {
        name: 'DebugSettings',
        props: {
            isDebugMenuEnabled: {type: Boolean, required: true},
            isDevelopmentMode: {type: Boolean, required: true}
        },
        template: `
            <div style="float:right">
              <input
                :id="debugId"
                type="checkbox"
                :checked="isDebugMenuEnabled"
                @change="$emit('is-debug-changed', $event.target.checked)"
              />
              <label class="normal" :for="debugId">
                デバッグモード有効(開発者用)
              </label>

              <input
                :id="devId"
                type="checkbox"
                :checked="isDevelopmentMode"
                @change="$emit('is-dev-mode-changed', $event.target.checked)"
              />
              <label class="normal" :for="devId">
                開発モード有効(開発者用)
              </label>
            </div>
        `,
        computed: {
            // ラベルの for 属性と input の id の衝突を避けるために乱数を付与
            debugId() {
                return 'debugMenuEnabled-' + this._uid;
            },
            devId() {
                return 'isDevelopmentMode-' + this._uid;
            }
        }
    });

    Vue.component('SimulationControls', {
        props: {
            getApp: {type: Function, required: true},
            isEnemyActionTriggered: Boolean,
            simulatesEnemyActionOneByOne: Boolean,
            isIconOverlayDisabled: Boolean,
            isTrapIconOverlayDisabled: Boolean,
            isAetherRaid: Boolean,
            isResonant: Boolean,
            showFlash: Function,
        },
        methods: {
            onIconOverlayChange() {
                this.$emit('icon-overlay-disabled-changed');
            },
            onHealHp() {
                this.$emit('heal-hp-full');
            },
            onResetPlacement() {
                this.$emit('reset-placement');
            },
            openAetherRaidDialog() {
                this.$emit('open-aether-raid-dialog');
            },
            openItemDialog() {
                this.$emit('open-item-dialog');
            },
            openDurabilityTestDialog() {
                this.$emit('open-durability-test');
            },
            openEditMapDialog() {
                this.$emit('open-edit-map');
            },
            onCookieSettingChange(event) {
                const isChecked = event.target.checked;
                LocalStorageUtil.setBoolean('uses-cookie-for-storing-settings', isChecked);
                if (isChecked) {
                    this.showFlash('状態の保存先をCookie（旧設定）に変更しました。カスタムスキルを設定していると状態が保存されない場合があります。', 'warning', false);
                } else {
                    this.showFlash('状態の保存先をローカルストレージ（新設定）に変更しました', 'info', true);
                }
            },
        },
        template: `
            <div>
              <input type="checkbox" id="isEnemyActionTriggered"
                     :checked="isEnemyActionTriggered"
                     @change="$emit('update:isEnemyActionTriggered', $event.target.checked)">
              <label for="isEnemyActionTriggered" class="normal">敵の行動制限解除</label>

              <input type="checkbox" id="simulatesEnemyActionOneByOne"
                     :checked="simulatesEnemyActionOneByOne"
                     @change="$emit('update:simulatesEnemyActionOneByOne', $event.target.checked)">
              <label for="simulatesEnemyActionOneByOne" class="normal">敵の行動再現を1行動ずつ行う</label>

              <input type="checkbox" id="isIconOverlayDisabled"
                     :checked="isIconOverlayDisabled"
                     @change="$emit('update:isIconOverlayDisabled', $event.target.checked); onIconOverlayChange()">
              <label for="isIconOverlayDisabled" class="normal">アイコン上の状態表示無効</label>

              <input type="checkbox" id="isTrapIconOverlayDisabled"
                     :checked="isTrapIconOverlayDisabled"
                     @change="$emit('update:isTrapIconOverlayDisabled', $event.target.checked); onIconOverlayChange()">
              <label for="isTrapIconOverlayDisabled" class="normal">罠のLV表示無効</label>

              <div>
                <input type="button" value="全員状態リセット" style="width:140px" class="buttonUi"
                       @click="onHealHp">
                <input type="button" value="配置リセット" style="width:140px" class="buttonUi"
                       @click="onResetPlacement">
                <input v-if="isAetherRaid" type="button" value="模擬戦..." style="width:140px"
                       class="buttonUi" @click="openAetherRaidDialog">
                <input v-if="isResonant" type="button" value="アイテム..."
                       style="width:140px" class="buttonUi" @click="openItemDialog">
                <input v-if="isAetherRaid" type="button" value="耐久/殲滅力テスト..."
                       style="width:140px" class="buttonUi" @click="openDurabilityTestDialog">
                <input type="button" value="マップ編集..." style="width:140px" class="buttonUi"
                       @click="openEditMapDialog">
                <input type="button" value="保存状態リセット" style="width:140px" class="buttonUi"
                       @click="LocalStorageUtil.removeKey('settings');
                               showFlash('保存されている状態をリセットしました', 'success', true);"
                >
                <br/>
                <span style="width: 140px">
                    <input type="checkbox" 
                           class="buttonUi"
                           id="uses-cookie-for-storing-settings"
                           :checked="LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false)"
                           @change="onCookieSettingChange"
                    >
                    <label for="uses-cookie-for-storing-settings" class="normal">状態の保存先にCookieを使う（旧設定）</label>
                </span>
              </div>
            </div>
        `
    });

    Vue.component('debug-buttons', {
        props: {
            getApp: {type: Function, required: true},
            resetUnitRandom: { type: Function, required: true },
            activateAllUnit: { type: Function, required: true },
            resetUnitForTesting: { type: Function, required: true },
            openAutoClearDialog: { type: Function, required: true },
        },
        template: `
            <div>
              <input
                type="button"
                value="敵の動きを1ターンシミュレート"
                class="buttonUi debug-button"
                @click="getApp?.().simulateEnemiesForCurrentTurn();"
              />
              <input
                type="button"
                value="キャラをランダム設定"
                class="buttonUi debug-button"
                @click="resetUnitRandom"
              />
              <input
                type="button"
                value="全員行動可能に"
                class="buttonUi debug-button"
                @click="activateAllUnit"
              />
              <input
                type="button"
                value="キャラをテスト用に設定"
                class="buttonUi debug-button"
                @click="resetUnitForTesting"
              />
              <input
                type="button"
                value="お助けツール(開発中)..."
                class="buttonUi debug-button"
                @click="openAutoClearDialog"
              />
              <input
                type="button"
                value="全アイテム情報出力"
                class="buttonUi debug-button"
                @click="getApp?.().logAllItemInfos();"
              />
            </div>
          `
    });

    Vue.component('log-panel', {
        props: {
            getApp: { type: Function, required: true },
            simulatorLogLevel: { type: Number, required: true },
            simulatorLogLevelOption: { type: Array, required: true },
            saveSimulatorLogLevel: { type: Function, required: true },
            skillLogLevel: { type: Number, required: true },
            skillLogLevelOption: { type: Array, required: true },
            saveSkillLogLevel: { type: Function, required: true },
            copyDebugLogToClipboard: { type: Function, required: true },
        },
        methods: {
            clearLog() {
                if (this.getApp) {
                    this.getApp().clearLog();
                }
            },
            onSimulatorLogLevelChange(e) {
                const value = Number(e.target.value);
                this.$emit('update:simulatorLogLevel', value);
                this.saveSimulatorLogLevel(value);
            },
            onSkillLogLevelChange(e) {
                const value = Number(e.target.value);
                this.$emit('update:skillLogLevel', value);
                this.saveSkillLogLevel(value);
            }
        },
        template: `
            <div>
              <label for="simulatorLogLevel" style="font-size:12px"><b>ログレベル</b></label>
              <select id="simulatorLogLevel"
                      :value="simulatorLogLevel"
                      @change="onSimulatorLogLevelChange">
                <option v-for="option in simulatorLogLevelOption" :key="option.value" :value="option.value">
                  {{ option.text }}
                </option>
              </select>
              <input type="button" @click="clearLog" value="クリア" style="font-size: 8px;" />
              <input type="button" @click="copyDebugLogToClipboard" value="コピー" style="font-size: 8px;" />

              <label for="skillLogLevel" style="font-size:12px"><b>スキル効果ログレベル</b></label>
              <select id="skillLogLevel"
                      :value="skillLogLevel"
                      @change="onSkillLogLevelChange">
                <option v-for="option in skillLogLevelOption" :key="option.value" :value="option.value">
                  {{ option.text }}
                </option>
              </select>
            </div>
        `
    });
}

initVueComponents();
