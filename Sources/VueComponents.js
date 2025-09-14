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
            this.initSelect2(this.options, this.value);
        },

        methods: {
            resetData(options, value) {
                $(this.$el)
                    .empty()
                    .select2({
                        data: options,
                        matcher: this.matchMultiWords
                    })
                    .val(value)
                    .trigger('change')
            },
            initSelect2(options, value) {
                this.resetData(options, value);
                $(this.$el)
                    .on('change', event => {
                        const raw = event.target.value;
                        const parsed = parseInt(raw, 10);
                        const newVar = isNaN(parsed) ? raw : parsed;
                        if (newVar === 0 || newVar) {
                            this.$emit('input', newVar);
                        }
                    });
            },
            applyInvalidValueClass(hasCurrent) {
                // 不正値表示用にスタイルを付与（任意）
                const container = $(this.$el).next('.select2-container');
                if (!hasCurrent) {
                    container.addClass('invalid-value');
                } else {
                    container.removeClass('invalid-value');
                }
            },
            matchMultiWords(params, data) {
                if ($.trim(params.term) === '') return data;
                if (typeof data.text === 'undefined') return null;

                // 全角スペースを半角スペースに変換して分割
                const keywords = params.term.replace(/\u3000/g, ' ').toLowerCase().split(/\s+/);
                const text = data.text.toLowerCase();

                const isMatch = keywords.every(word => text.includes(word));
                return isMatch ? $.extend({}, data, true) : null;
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
                            id: this.value,
                            text: `（不正な値: ${this.value}）`,
                            disabled: true
                        });
                    }
                    this.resetData(effectiveOptions, this.value);

                    // 不正値表示用にスタイルを付与（任意）
                    this.applyInvalidValueClass(hasCurrent);
                } else {
                    // オプションにない要素は -1（fallbackValue 使用）
                    const selectedValue = hasCurrent ? this.value : this.fallbackValue;
                    this.resetData(newOptions, selectedValue);
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
                                @input="e => vm.specialCountChanged(unit, Number(e.target.value))"
                            /> 
                            <span>
                                / {{ unit['maxSpecialCount'] }}
                            </span>
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
            showFlash: {type: Function, required: true},
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
                        :show-flash="showFlash"
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
            showFlash: {type: Function, required: true},
        },
        methods: {
            onSaveSettings() {
                let app = this.getApp();
                if (app) {
                    app.clearSimpleLog();
                    saveSettings();
                    let toCookie = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
                    if (toCookie) {
                        this.showFlash('設定を保存しました', 'warning', true);
                    } else {
                        this.showFlash('設定を保存しました', 'success', true);
                    }
                }
            },
            onLoadSettings() {
                let app = this.getApp();
                if (app) {
                    app.clearSimpleLog();
                    loadSettings();
                    let fromCookies = LocalStorageUtil.getBoolean('uses-cookie-for-storing-settings', false);
                    if (fromCookies) {
                        this.showFlash('設定を読み込みました', 'warning', true);
                    } else {
                        this.showFlash('設定を読み込みました', 'success', true);
                    }
                }
            },
        },
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
                    @click="onSaveSettings">
                <input type="button" style="background-image: url(/images/dummy.png) "
                    class="lazy fehButton imageButton"
                    data-src="/AetherRaidTacticsBoard/images/LoadState.png"
                    @click="onLoadSettings">

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
        methods: {},
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
        methods: {
            getSkillButtonStyle(unit) {
                const canActivate = this.g_app.canActivateDuoSkillOrHarmonizedSkill(unit);
                const base = unit.isDuoAllyHero ? 'DuoSkill' : 'HarmonizedSkill';
                const suffix = canActivate ? '' : '_Disabled';
                return {
                    backgroundImage: `url(/AetherRaidTacticsBoard/images/Activate${base}${suffix}.png)`
                };
            }
        },
        template: `
          <div style="padding:5px">
            <span v-if="unit.isDuoAllyHero || unit.isHarmonicAllyHero">
              <input
                type="button"
                :disabled="!g_app.canActivateDuoSkillOrHarmonizedSkill(unit)"
                :style="getSkillButtonStyle(unit)"
                :class="g_app.canActivateDuoSkillOrHarmonizedSkill(unit) ? 'fehButton' : 'fehButtonDisabled'"
                @click="g_app.canActivateDuoSkillOrHarmonizedSkill(unit) && g_app.activateDuoOrHarmonizedSkill(unit)"
              />
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
            openTeamFormationDialog() {
                this.$emit('open-team-formation-dialog');
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
            resetUnitRandom: {type: Function, required: true},
            activateAllUnit: {type: Function, required: true},
            resetUnitForTesting: {type: Function, required: true},
            openAutoClearDialog: {type: Function, required: true},
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
            getApp: {type: Function, required: true},
            simulatorLogLevel: {type: Number, required: true},
            simulatorLogLevelOption: {type: Array, required: true},
            saveSimulatorLogLevel: {type: Function, required: true},
            skillLogLevel: {type: Number, required: true},
            skillLogLevelOption: {type: Array, required: true},
            saveSkillLogLevel: {type: Function, required: true},
            copyDebugLogToClipboard: {type: Function, required: true},
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

    Vue.component('EditableTable', {
        model: {
            prop: 'rows',
            event: 'update:rows'
        },
        props: {
            rows: {type: Array, required: true},
            storageKey: {type: String, required: true},
        },
        data() {
            return {
                isEditing: false,
                draggedIndex: null,
                downloadFileName: 'data',
                uploadAndReplaceId: 'uploadAndReplaceId',
                uploadId: 'uploadId',
                confirmDeleteItem: true,
                filterText: '',
            };
        },
        methods: {
            downloadTableData() {
                const blob = new Blob([JSON.stringify(this.rows)], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${this.downloadFileName}.json`;
                a.click();
                URL.revokeObjectURL(url);
            },
            uploadTableData(replace = false) {
                let elementId = replace ? this.uploadAndReplaceId : this.uploadId;
                const fileInput = document.getElementById(elementId);

                // ファイルが選択されていない場合は処理を終了
                if (fileInput.files.length === 0) {
                    alert("ファイルを選択してください");
                    return;
                }

                // 選択されたファイルを取得
                const file = fileInput.files[0];

                // FileReaderを使ってファイルを読み込む
                const reader = new FileReader();
                reader.onload = event => {
                    // ファイルの内容を取得
                    let results = JSON.parse(event.target.result);
                    if (replace) {
                        this.$set(this, 'rows', results);
                    } else {
                        results.forEach(x => {
                            this.rows.push(x);
                        })
                    }
                    LocalStorageUtil.setJson(this.storageKey, this.rows);
                    this.$emit('update:rows', this.rows);
                    fileInput.value = ''
                };

                // ファイルの読み込み（テキストファイルとして読み込む）
                reader.readAsText(file);
            },
            selectUploadFile(replace = false) {
                if (replace) {
                    if (confirm('現在保存されているユニットが全て上書きされます。アップロードしますか？')) {
                        document.getElementById(this.uploadAndReplaceId).click();
                    }
                } else {
                    document.getElementById(this.uploadId).click();
                }
            },
            deleteItem(index) {
                if (this.confirmDeleteItem) {
                    if (!confirm("削除しますか？")) {
                        return false;
                    }
                }
                this.rows.splice(index, 1);
                this.$emit('update:rows', this.rows);
                LocalStorageUtil.setJson(this.storageKey, this.rows);
                return true;
            },
            saveTable() {
                LocalStorageUtil.setJson(this.storageKey, this.rows);
            },
            filteredItems() {
                const keywords = this.filterText
                    .trim()
                    .replace(/\u3000/g, ' ') // 全角スペースを半角に変換
                    .split(/\s+/);       // 空白で分割

                return this.rows
                    .map((item, index) => ({item, originalIndex: index}))
                    .filter(({item}) =>
                        keywords.every(keyword => item.name.includes(keyword))
                    );
            },
            isFiltering() {
                return this.filterText && this.filterText.trim() !== '';
            },
            resetFilter() {
                this.filterText = '';
            },
            onItemDragStart(index) {
                this.draggedIndex = index;
            },
            onItemDrop(index) {
                if (this.draggedIndex !== null &&
                    this.draggedIndex !== index) {
                    const draggedItem = this.rows[this.draggedIndex];
                    this.rows.splice(this.draggedIndex, 1);
                    this.rows.splice(index, 0, draggedItem);
                    this.draggedIndex = null;
                    this.$emit('update:rows', this.rows);
                    this.saveTable();
                }
            },
            onEditModeChanged() {
                if (!this.isEditing) {
                    this.saveTable();
                }
            },
            startEditing() {
                this.isEditing = true;
            },
            endEditingAndSave() {
                this.isEditing = false;
                this.saveTable();
            },
        },
        template: `
          <div>
            <div class="action-container">
              <span class="editable-table-icon">
                <input
                  type="checkbox"
                  id="toggleEdit"
                  v-model="isEditing"
                  style="display: none;"
                  @change="onEditModeChanged"
                >
                <label for="toggleEdit" class="button icon-button-small">
                  <i
                    class="fa-solid"
                    :class="isEditing ? ['fa-save', 'save-button'] : ['fa-edit', 'upload-button']"
                    :title="isEditing ? '保存' : '編集'"
                  ></i>
                </label>
              </span>
              <span class="editable-table-icon">
                <button class="icon-button-small download-button" 
                        @click="downloadTableData">
                  <i class="fa-solid fa-download" title="ダウンロード"></i>
                </button>
              </span>
              <span class="editable-table-icon">
                <input type="file" 
                       :id="uploadId" 
                       style="display: none;" 
                       @change="uploadTableData(false);"/>
                <button class="icon-button-small upload-button" 
                        @click="selectUploadFile(false);">
                  <i class="fa-solid fa-upload" title="アップロード（追加）"></i>
                </button>
              </span>
              <span class="editable-table-icon">
                <input type="file" 
                       :id="uploadAndReplaceId" 
                       style="display: none;" 
                       @change="uploadTableData(true);"/>
                <button class="icon-button-small upload-and-replace-button" 
                        @click="selectUploadFile(true);">
                  <i class="fa-solid fa-upload" title="アップロード（置き換え）"></i>
                </button>
              </span>
              <div class="action-item-right">
                <input id="confirmDeleteItem" 
                       type="checkbox" 
                       v-model="confirmDeleteItem"
                >
                <label for="confirmDeleteItem">削除確認</label>
              </div>
            </div>

            <span>
              <input type="text" class="box-common name-filter" v-model="filterText" placeholder="名前で絞り込み" />
              <button type="reset"
                      class="icon-button load-button" 
                      @click="resetFilter">
                <i class="fa fa-eraser" aria-hidden="true"></i>
              </button>
            </span>
            <table class="unit-dialog">
              <thead>
                <slot name="table-head">
                </slot>
              </thead>
              <tbody>
                <tr v-for="({ item, originalIndex }, index) in filteredItems()" :key="originalIndex"
                    :draggable="!isFiltering()"
                    @dragstart="!isFiltering() && onItemDragStart(originalIndex)"
                    @dragover.prevent
                    @drop="!isFiltering() && onItemDrop(originalIndex)"
                    :style="{ cursor: isFiltering() ? 'not-allowed' : '' }"
                >
                  <slot 
                    name="table-body" 
                    :item="item" 
                    :original-index="originalIndex"
                    :index="index"
                    :start-editing="startEditing"
                    :end-editing-and-save="endEditingAndSave"
                    :is-editing="isEditing"
                    :delete-item="deleteItem"
                  >
                  </slot>
                </tr>
              </tbody>
            </table>
          </div>
        `,
    });

    Vue.component('UnitStorageDialog', {
        props: {
            getAppData: {type: Function, required: true},
            weaponTypeIconPath: {type: Function, required: true},
            moveTypeIconPath: {type: Function, required: true},
            showFlash: {type: Function, required: true},
        },
        data() {
            return {
                rows: [],
                unitName: '',
                storageKey: 'savedUnitList',
                saveUnitInputId: 'saveUnitInputId',
            };
        },
        methods: {
            setUnitName(name) {
                this.unitName = name;
            },
            saveUnit() {
                const currentUnit = this.getAppData().currentUnit;
                if (currentUnit == null) {
                    return;
                }
                const name = document.getElementById(this.saveUnitInputId).value;
                this.rows.push({
                    name: name,
                    weaponType: currentUnit.weaponType,
                    moveType: currentUnit.moveType,
                    data: currentUnit.turnWideStatusToString()
                });
                LocalStorageUtil.setJson(this.storageKey, this.rows);
                this.$emit('update:rows', this.rows);
                this.showFlash(`${name}を保存しました`, 'success', true);
            },
            saveUnitAt(originalIndex) {
                const currentUnit = this.getAppData().currentUnit;
                if (currentUnit == null) {
                    return false;
                }
                const name = document.getElementById(this.saveUnitInputId).value;
                const savedUnit = this.rows[originalIndex];
                const result = window.confirm(`${savedUnit.name}を${name}で上書きして良いですか？`);
                if (result) {
                    Vue.set(this.rows, originalIndex, {
                        name: name,
                        weaponType: currentUnit.weaponType,
                        moveType: currentUnit.moveType,
                        data: currentUnit.turnWideStatusToString()
                    });
                    LocalStorageUtil.setJson(this.storageKey, this.rows);
                    return true;
                }
                return false;
            },
            restoreUnit() {
                this.getAppData().restoreUnit();
                this.showFlash('ユニットを復元しました', 'success', true);
            },
            showDeleteMessage(deleted = true) {
                if (deleted) {
                    this.showFlash('ユニットの設定を削除しました', 'success', true);
                } else {
                    this.showFlash('削除をキャンセルしました', 'success', true);
                }
            },
        },
        created() {
            this.rows = LocalStorageUtil.getJson(this.storageKey, []);
        },
        template: `
          <div>
            <div class="input-box box-common">
              <input class="text-input" 
                     type="text" 
                     :id="saveUnitInputId" 
                     placeholder="名前を入力"
                     :value="unitName"
                     @keydown.enter="saveUnit"
                     aria-label="ユニット名">
              <button class="save-box-button" @click="saveUnit">
                <i class="fa-solid fa-save" title="保存"></i>
              </button>
            </div>

            <div class="action-container">
              <button class="icon-button load-button" @click="restoreUnit">
                <i class="fa-solid fa-rotate-left" title="元に戻す"></i>
              </button>
            </div>

            <h3>保存ユニット一覧</h3>

            <editable-table v-model="rows" 
                            :storage-key="storageKey"
            >
              <template slot="table-head">
                <tr>
                  <th class="col-type"></th>
                  <th>名前</th>
                  <th class="col-load"></th>
                  <th class="col-save"></th>
                  <th class="col-delete"></th>
                </tr>
              </template>
              
              <template 
                slot="table-body" 
                slot-scope="{ item, originalIndex, index, isEditing, startEditing, endEditingAndSave, deleteItem }"
              >
                <td>
                  <img class="unit-dialog-icon" :src="weaponTypeIconPath(item.weaponType)" alt="武器種">
                  <img class="unit-dialog-icon" :src="moveTypeIconPath(item.moveType)" alt="移動タイプ">
                </td>
                <td>
                  <span 
                    v-if="!isEditing"
                    @dblclick="startEditing"
                  >
                    {{ item.name }}
                  </span>
                  <input v-else class="edit-input" v-model="item.name" type="text"
                         @keydown.enter="endEditingAndSave" />
                </td>
                <td class="col-load">
                  <button 
                    class="icon-button load-button" 
                    @click="getAppData().loadUnit(item); showFlash('設定を読み込みました', 'success', true)"
                  >
                    <i class="fa-solid fa-book-open" title="読み込む"></i>
                  </button>
                </td>
                <td class="col-save">
                  <button class="icon-button save-button"
                          @click="saveUnitAt(originalIndex)
                                  ? showFlash('上書き保存しました', 'success', true)
                                  : showFlash('キャンセルしました', 'success', true)">
                    <i class="fa-solid fa-save" title="上書き保存"></i>
                  </button>
                </td>
                <td class="col-delete">
                  <button class="icon-button delete-button" 
                          @click="showDeleteMessage(deleteItem(originalIndex));">
                    <i class="fa-solid fa-trash-can" title="削除"></i>
                  </button>
                </td>
              </template>
            </editable-table>
          </div>
        `
    });
    Vue.component('damage-calc-result', {
        props: {
            combatResult: {
                type: CombatResult,
                required: true,
                default: null,
            },
            onClosed: {
                type: Function,
                required: false,
                default: () => {
                },
            },
        },
        computed: {
            hasResult: vm => !!vm.combatResult,
            atkName: vm => vm.combatResult?.atkUnit?.name || '',
            defName: vm => vm.combatResult?.defUnit?.name || '',
            precombatDamage: vm => vm.combatResult?.preCombatDamage ?? 0,
            attackResults: vm => vm.combatResult?.attackResults?.filter(ar => !ar.isAlreadyDead) ?? []
        },
        template: `
            <div class="damage-calc-result">
              <!-- 閉じるボタン -->
              <button class="pop-close-btn" @click="onClosed">×</button>

              <div v-if="hasResult">
                <div class="summary">
                  <div>{{ atkName }} vs {{ defName }}</div>
                  <div>戦闘前ダメージ: {{ precombatDamage }}</div>
                </div>

                <div class="attacks-result" v-if="attackResults">
                  <div v-for="(attackResult, ai) in attackResults" :key="ai">
                    <attack-calc-result 
                      :combat-result="combatResult"
                      :attack-result="attackResult"
                    />
                  </div>
                </div>
              </div>

              <div v-else>結果はまだありません。</div>
            </div>
        `,
    });
    Vue.component('attack-calc-result', {
        props: {
            combatResult: {type: CombatResult, required: true},
            attackResult: {type: AttackResult, required: true},
        },
        computed: {
            strikes: vm => vm.attackResult?.strikeResults ?? [],
            hasStrikes: vm => vm.strikes.length > 0,
            attackTypeLabel() {
                const parts = [];
                if (this.attackResult?.isPotentFollowupAttack) parts.push('神速');
                if (this.attackResult?.isFollowupAttack) parts.push('追撃');
                parts.push(this.attackResult?.isCounterattack ? '反撃' : '攻撃');
                return parts.join('');
            },
            currentAtkHpStr: vm => `HP: ${vm.attackResult.atkRestHp}/${vm.attackResult.atkMaxHp}`,
            currentDefHpStr: vm => `HP: ${vm.attackResult.defRestHp}/${vm.attackResult.defMaxHp}`,
            atkName: vm => vm.attackResult?.atkUnit?.name || '',
            defName: vm => vm.attackResult?.defUnit?.name || '',
        },
        template: `
          <div class="attack-result">
            <div>
              <span :class="attackResult.atkUnit.groupId === UnitGroupType.Ally ? 'ally-value' : 'enemy-value'" >
                {{ attackTypeLabel }}： {{ atkName }} ({{ currentAtkHpStr }}) → {{ defName }} ({{ currentDefHpStr }})
              </span>
            </div>

            <div class="strikes-result" v-if="hasStrikes">
              <div v-for="(strikeResult, si) in strikes" :key="si">
                <strike-calc-result
                  :combat-result="combatResult"
                  :attack-result="attackResult"
                  :strike-result="strikeResult"
                />
              </div>
            </div>

            <div>
              合計ダメージ: {{ attackResult?.totalDamage }}
            </div>
          </div>
        `
    });

    Vue.component('strike-calc-result', {
        props: {
            combatResult: {type: CombatResult, required: true, default: null,},
            attackResult: {type: AttackResult, required: true, default: null,},
            strikeResult: {type: StrikeResult, required: true, default: null,},
        },
        components: {
            ValueLabel: {template: `<span class="damage-result-label"><slot/></span>`},
            AttackValue: {template: `<span class="attack-value"><slot/></span>`},
            DefenseValue: {template: `<span class="defense-value"><slot/></span>`},
            ReflexValue: {template: `<span class="reflex-value"><slot/></span>`},
        },
        computed: {
            isSpecialAttack: vm => vm.strikeResult?.isAttackerSpecialActive || false,
            damageBeforeAdditional: vm => vm.attackResult.getDamageBeforeAdditionalDamage(vm.isSpecialAttack),
            atk: vm => vm.attackResult.getFinalAtk(vm.isSpecialAttack),
            mit: vm => vm.attackResult.getFinalMit(vm.isSpecialAttack),
            additionalDamageOfAttack: vm => vm.attackResult.getTotalAdditionalDamage(vm.isSpecialAttack),
            additionalDamageOfStrike: vm => vm.strikeResult.getAdditionalDamage(),
            damageRatio: vm => vm.roundTo(vm.strikeResult.damageRatio),
            damageReductionRatio: vm => vm.roundTo(vm.strikeResult.damageReductionRatio),
            damageMinusWithReductionConsidered(vm) {
                const {damageReductionRatios, damageReductionValue, damageRatio} = vm.strikeResult;
                return damageReductionRatios.length > 0
                    ? Math.trunc(damageReductionValue / damageRatio)
                    : damageReductionValue;
            },
            reflexValue: vm => vm.strikeResult.reducedDamageIncludingMiracle,
            normalOrSpecialLabel: vm => vm.isSpecialAttack ? '奥義' : '通常',
            defenderSpecialLabel: vm => vm.strikeResult.isDefenderSpecialActive ? '守備奥義' : '',
            selfDamageReductionRatios: vm => (vm.strikeResult?.selfDamageReductionRatios?.length ?
                vm.strikeResult.selfDamageReductionRatios : [1]),
        },
        methods: {
            roundTo(n, digits = 6) {
                let factor = Math.pow(10, digits);
                return Math.round(n * factor) / factor;
            },
        },
        template: `
          <div class="strike-result">
            <div>
              {{ strikeResult.currentStrikeCount }}撃目
              (
              <span :class="{ 'log-special': strikeResult.isAttackerSpecialActive }">
                {{ normalOrSpecialLabel }}
              </span>
              <span v-if="strikeResult.isDefenderSpecialActive">
                、 <span class="log-special">{{ defenderSpecialLabel }}</span>
              </span>
              )
            </div>

            <div>
              {{ damageBeforeAdditional }}
              =
              {{ atk }} <value-label>(攻撃)</value-label>
              <span v-if="strikeResult.isAttackerSpecialActive">
                + {{ attackResult.specialAddDamage }} <value-label>(奥義ダメージ)</value-label>
              </span>
              - {{ mit }} <value-label>(防御)</value-label>
            </div>

            <div>
              <attack-value>{{ strikeResult.getDamage() }}</attack-value>
              = 
              {{ damageBeforeAdditional }}
              + {{ additionalDamageOfAttack }} <value-label>(ダメージ+)</value-label>
              + {{ additionalDamageOfStrike }} <value-label>(反射など、この攻撃でのダメージ+)</value-label>
            </div>

            <div>
              <defense-value>{{ strikeResult.reducedDamage }}</defense-value> <value-label>(ダメージ減少値)</value-label>
              =
              {{ strikeResult.getDamage() }}
              &times; {{ damageReductionRatio }} ({{ strikeResult.damageReductionRatios }})
              <value-label>(ダメージ軽減率)</value-label>
              + {{ strikeResult.damageReductionValue }}
              <value-label>(ダメージ-)(ダメージ+換算{{ damageMinusWithReductionConsidered }})</value-label>
            </div>

            <div>
              {{ strikeResult.damageAfterReductionValue }} 
              = 
              {{ strikeResult.getDamage() }} <value-label>(ダメージ)</value-label>
              - {{ strikeResult.reducedDamage }} <value-label>(ダメージ減少値)</value-label>
            </div>

            <div>
              <reflex-value>{{ reflexValue }}</reflex-value> <value-label>(反射対象軽減値)</value-label>
            </div>

            <div>
              <attack-value>{{ strikeResult.actualDamage }}</attack-value> <value-label>(実際のダメージ)</value-label>
              =
              {{ strikeResult.damageAfterReductionValue }} 
              &times; {{ selfDamageReductionRatios }} <value-label>(神速など自分へのダメージ軽減)</value-label>
              <span v-if="strikeResult.isMiracleActivated">[祈り発動]</span>
            </div>
          </div>
        `
    });
}

initVueComponents();
