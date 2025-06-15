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
                .select2({ data: this.options })
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
                $(this.$el).select2({ data: options })
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

    Vue.component('flash-message', {
        props: ['flashMessages'],
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
    })
}

initVueComponents();

