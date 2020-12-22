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
