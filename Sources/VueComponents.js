/// @file
/// @brief Vueのcomponentの定義です。

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
    if (elemName != null || elemName != "") {
        let splited = elemName.split("-");
        if (splited.length == 2) {
            unitId = splited[0];
            skillType = splited[1];
            unit = g_appData.findItemById(unitId);
        }
    }
    return [unit, skillType];
}

// select2 を使うためのVueコンポーネント
Vue.component('select2', {
    template: '<select><slot></slot></select>',
    props: {
        options: Array,
        value: Number,
    },

    mounted: function () {
        $(this.$el)
            // init select2
            .select2({ data: this.options })
            .val(this.value)
            .trigger('change')
            .on('change', (event) =>
                this.$emit('input', parseInt(event.target.value, 10))
            )
    },
    watch: {
        value: function (val) {
            let extractResult = extractUnitAndSkillType(this.$el.name);
            let unit = extractResult[0];
            let skillType = extractResult[1];
            if (unit == null) {
                // スキル以外の場合
                $(this.$el).val(val).trigger('change');
                return;
            }

            if (skillType == "weapon") {
                if (!unit.hasReservedWeapon()) {
                    // 普通にUIからスキルが変更された場合
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    // キャラが変更されてスキルオプションが変わったことにより初期値に戻った場合、
                    // 予約していたスキル情報で上書きする
                    unit.restoreReservedWeapon();
                    console.log("restore weapon for " + unit.getNameWithGroup());
                }
            }
            else if (skillType == "support") {
                if (!unit.hasReservedSupport()) {
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    unit.restoreReservedSupport();
                    console.log("restore support for " + unit.getNameWithGroup());
                }
            }
            else if (skillType == "special") {
                if (!unit.hasReservedSpecial()) {
                    // 普通にUIからスキルが変更された場合
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    unit.restoreReservedSpecial();
                    console.log("restore special for " + unit.getNameWithGroup());
                }
            }
            else if (skillType == "passiveA") {
                if (!unit.hasReservedPassiveA()) {
                    // 普通にUIからスキルが変更された場合
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    unit.restoreReservedPassiveA();
                    console.log("restore passiveA for " + unit.getNameWithGroup());
                }
            }
            else if (skillType == "passiveB") {
                if (!unit.hasReservedPassiveB()) {
                    // 普通にUIからスキルが変更された場合
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    unit.restoreReservedPassiveB();
                    console.log("restore passiveB for " + unit.getNameWithGroup());
                }
            }
            else if (skillType == "passiveC") {
                if (!unit.hasReservedPassiveC()) {
                    // 普通にUIからスキルが変更された場合
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    unit.restoreReservedPassiveC();
                    console.log("restore passiveC for " + unit.getNameWithGroup());
                }
            }
            else if (skillType == "passiveS") {
                if (!unit.hasReservedPassiveS()) {
                    // 普通にUIからスキルが変更された場合
                    $(this.$el).val(val).trigger('change');
                }
                else if (val == -1) {
                    unit.restoreReservedPassiveS();
                    console.log("restore passiveS for " + unit.getNameWithGroup());
                }
            }
        },
        // update options
        options: function (options) {
            let value = this.value;
            $(this.$el)
                .empty()
                .select2({ data: options })
                .val(value)
                .trigger('change');
        }
    },
    destroyed: function () {
        $(this.$el).off().select2('destroy')
    },
});
