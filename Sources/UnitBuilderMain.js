

class UnitBuilderMain extends BattleSimmulatorBase {
    constructor() {
        super({
            unitSelected: (event) => {
                let name = event.item.name;
                if (name == undefined) {
                    name = event.item.classList[0];
                }

                g_app.setCurrentUnit(name);
            }
        });
    }

    setCurrentUnit(id) {
        super.setCurrentUnit(id);

        let tabIndex = this.data.findIndexOfAllyUnit(id);
        changeCurrentUnitTab(tabIndex);
    }
}


let g_app = new UnitBuilderMain();
