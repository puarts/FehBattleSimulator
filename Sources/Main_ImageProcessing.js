/// @file
/// @brief シミュレーターの画像処理部分を切り出した実装です。

function setUnitsByStatusImages(files) {
    let self = g_app;
    switch (Number(self.vm.ocrSettingTarget)) {
        case OcrSettingTarget.SelectedTarget:
            {
                let unit = self.__getCurrentUnit();
                if (unit == null) {
                    self.writeErrorLine("ユニットが選択されていません");
                    return;
                }
                let file = files[0];
                const sourceCanvas = document.getElementById("croppedImage0");
                const binarizedCanvas = document.getElementById("binarizedImage0");
                setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, self.ocrCanvases[0]);
            }
            break;
        case OcrSettingTarget.AllEnemies:
            for (let i = 0; i < files.length && i < g_appData.enemyUnits.length; ++i) {
                let unit = g_appData.enemyUnits[i];
                let file = files[i];
                const sourceCanvas = document.getElementById("croppedImage" + i);
                const binarizedCanvas = document.getElementById("binarizedImage" + i);
                setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, self.ocrCanvases[i]);
            }
            break;
        case OcrSettingTarget.AllAllies:
            for (let i = 0; i < files.length && i < g_appData.allyUnits.length; ++i) {
                let unit = g_appData.allyUnits[i];
                let file = files[i];
                const sourceCanvas = document.getElementById("croppedImage" + i);
                const binarizedCanvas = document.getElementById("binarizedImage" + i);
                setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, self.ocrCanvases[i]);
            }
            break;
        case OcrSettingTarget.MapStructures:
            let file = files[0];
            self.setMapByImage(file);
            break;
    }
}

function setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, ocrCanvases) {
    let self = g_app;
    self.vm.ocrProgress = `画像の読み込みと2値化(${unit.id})..`;
    loadAndProcessImage(file, image => {
        const croppedWidth = image.width - self.vm.ocrCropX * 2;
        const croppedHeight = croppedWidth * (16.0 / 9.0);
        let scale = 1136.0 / croppedHeight; // テンプレート画像が640x1136から切り出したものを使ってるのでサイズを合わせる必要がある
        self.__drawCroppedImage(image, sourceCanvas,
            self.vm.ocrCropX, self.vm.ocrCropY, croppedWidth, croppedHeight, scale);

        let promise = Promise.resolve();

        // 文字認識用に2値化
        manipurateHsv(sourceCanvas, binarizedCanvas,
            (h, s, v) => { return s > 40 || v < 140; }, true);

        // const ocrInputCanvas = ocrCanvases[0];
        // const ocrInputCanvas1 = ocrCanvases[1];
        // const ocrInputCanvas2 = ocrCanvases[2];
        // const ocrInputCanvas3 = ocrCanvases[3];
        // const ocrInputCanvas4 = ocrCanvases[4];
        // const ocrInputCanvas5 = ocrCanvases[5];
        // const ocrInputCanvas6 = ocrCanvases[6];
        // const ocrInputCanvas7 = ocrCanvases[7];
        // const ocrInputCanvas8 = ocrCanvases[8];
        // const ocrInputCanvas9 = ocrCanvases[9];
        // const ocrInputCanvas10 = ocrCanvases[10];
        // const ocrInputCanvas11 = ocrCanvases[11];
        const ocrInputCanvas = document.getElementById("ocrInputImage0");
        const ocrInputCanvas1 = document.getElementById("ocrInputImage1");
        const ocrInputCanvas2 = document.getElementById("ocrInputImage2");
        const ocrInputCanvas3 = document.getElementById("ocrInputImage3");
        const ocrInputCanvas4 = document.getElementById("ocrInputImage4");
        const ocrInputCanvas5 = document.getElementById("ocrInputImage5");
        const ocrInputCanvas6 = document.getElementById("ocrInputImage6");
        const ocrInputCanvas7 = document.getElementById("ocrInputImage7");
        const ocrInputCanvas8 = document.getElementById("ocrInputImage8");
        const ocrInputCanvas9 = document.getElementById("ocrInputImage9");
        const ocrInputCanvas10 = document.getElementById("ocrInputImage10");
        const ocrInputCanvas11 = document.getElementById("ocrInputImage11");

        g_appData.ocrResult = "";
        // キャラ名抽出、祝福抽出
        promise = cropAndBinarizeImageAndOcr(
            ocrInputCanvas, binarizedCanvas,
            0.05, 0.435, 0.45, 0.105, -1,
            p => self.ocrProgress(p, `ユニット名抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                g_appData.ocrResult += "キャラ名: " + ocrResult.text + "\n";
                let filtered = convertOcrResultToArray(ocrResult.text);
                filtered = self.limitArrayLengthTo2WithLargerLengthString(filtered);
                if (filtered.length >= 2) {
                    let epithet = "";
                    for (let i = 0; i < filtered.length - 1; ++i) {
                        epithet += filtered[i];
                    }
                    let name = filtered[filtered.length - 1];
                    let result = g_app.findSimilarHeroNameInfo(name, epithet);
                    if (result != null) {
                        let info = result[0];
                        let heroIndex = g_appData.heroInfos.findIndexOfInfo(info.name)
                        g_appData.initializeByHeroInfo(unit, heroIndex, false);
                        selectItemById(unit.id);
                    }
                }
            });
        promise.then(() => {
            self.writeProgress(`祝福抽出(${unit.id})`);
            self.setUnitBlessingByImage(unit, sourceCanvas, ocrInputCanvas1);
            updateAllUi();
            self.clearOcrProgress();
        });
        promise = new Promise((resolve, reject) => resolve(promise));

        // 凸数抽出
        unit.merge = 0;
        promise = cropAndBinarizeImageAndOcr(
            ocrInputCanvas2, sourceCanvas,
            0.252, 0.577, 0.06, 0.038, 130,
            p => g_app.ocrProgress(p, `凸数抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                g_appData.ocrResult += "凸数: " + ocrResult.text + "\n";
                var filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = getMaxLengthElem(filtered);
                if (Number.isInteger(Number(partialName))) {
                    unit.merge = Number(partialName);
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                }
            },
            'eng',
            "0123456789"
        );
        promise = new Promise((resolve, reject) => resolve(promise));

        unit.dragonflower = 0;
        // 花凸数抽出
        promise = cropAndBinarizeImageAndOcr(
            ocrInputCanvas3, binarizedCanvas,
            0.541, 0.58, 0.06, 0.03, -1,
            p => g_app.ocrProgress(p, `花凸数抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                g_appData.ocrResult += "花凸数: " + ocrResult.text + "\n";
                var filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = getMaxLengthElem(filtered);
                let dragonflower = Number(partialName);
                if (Number.isInteger(dragonflower) && dragonflower > 0) {
                    unit.dragonflower = dragonflower;
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                }

                // アクセサリー未装備の時は花凸の位置がずれるのでもう一度OCR
                promise = cropAndBinarizeImageAndOcr(
                    ocrInputCanvas11, binarizedCanvas,
                    0.506, 0.58, 0.06, 0.03, -1,
                    p => self.ocrProgress(p, `花凸数抽出(${unit.id})`),
                    ocrResult => {
                        self.clearOcrProgress();
                        console.log(ocrResult);
                        g_appData.ocrResult += "花凸数: " + ocrResult.text + "\n";
                        var filtered = convertOcrResultToArray(ocrResult.text);
                        let partialName = getMaxLengthElem(filtered);
                        let dragonflower = Number(partialName);
                        if (Number.isInteger(dragonflower) && dragonflower > unit.dragonflower) {
                            unit.dragonflower = dragonflower;
                            g_appData.__updateStatusBySkillsAndMerges(unit);
                        }
                    },
                    'eng'
                    // ,"0123456789"
                );
                promise = new Promise((resolve, reject) => resolve(promise));
                return false;
            },
            'eng'
            // ,"0123456789"
        );
        promise = new Promise((resolve, reject) => resolve(promise));


        // 得意個体
        promise = cropAndPostProcessAndOcr(
            ocrInputCanvas4, sourceCanvas,
            0.14, 0.615, 0.10, 0.205,
            (srcCanvas) => {
                manipurateHsv(srcCanvas, srcCanvas,
                    (hue, saturation, brightness) => saturation < 50
                        || brightness < 160
                        || (hue < 20 || 30 < hue), true);
                let ctx = srcCanvas.getContext("2d");
                let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                return dst;
            },
            p => g_app.ocrProgress(p, `得意個体抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                unit.setIvHighStat(StatusType.None);
                console.log(ocrResult);
                g_appData.ocrResult += "得意: " + ocrResult.text + "\n";
                var filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = getMaxLengthElem(filtered);
                g_app.writeDebugLogLine(`partialName=${partialName}`);
                if (partialName == null || partialName == "") {
                    return;
                }
                let statusName = g_app.__findSimilarStatusName(partialName);
                if (statusName != null) {
                    unit.setIvHighStat(nameToStatusType(statusName));
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                }
            },
            'jpn',
            "HP攻撃速さ守備魔防");
        promise = new Promise((resolve, reject) => resolve(promise));

        // 苦手個体
        promise = cropAndPostProcessAndOcr(
            ocrInputCanvas5, sourceCanvas,
            0.14, 0.615, 0.10, 0.205,
            (srcCanvas) => {
                manipurateHsv(srcCanvas, srcCanvas,
                    (hue, saturation, brightness) => brightness < 100
                        || (hue < 120 || 160 < hue), true);
                let ctx = srcCanvas.getContext("2d");
                let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                return dst;
            },
            p => g_app.ocrProgress(p, `苦手個体抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                unit.setIvLowStat(StatusType.None);
                g_appData.ocrResult += "苦手: " + ocrResult.text + "\n";
                var filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = getMaxLengthElem(filtered);
                if (partialName == null || partialName == "") {
                    return;
                }
                let statusName = g_app.__findSimilarStatusName(partialName);
                if (statusName != null) {
                    unit.setIvLowStat(nameToStatusType(statusName));
                    g_appData.__updateStatusBySkillsAndMerges(unit);
                }
            },
            'jpn',
            "HP攻撃速さ守備魔防");
        promise = new Promise((resolve, reject) => resolve(promise));

        unit.clearSkills();

        // 武器抽出
        promise = cropAndPostProcessAndOcr(
            ocrInputCanvas6, sourceCanvas,
            0.575, 0.625, 0.32, 0.03,
            (srcCanvas) => {
                manipurateHsv(srcCanvas, srcCanvas,
                    (hue, saturation, brightness) => brightness < 140
                        || 110 < hue && hue < 160, true);
                let ctx = srcCanvas.getContext("2d");
                let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                return dst;
            },
            p => g_app.ocrProgress(p, `武器抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                g_appData.ocrResult += "武器名: " + ocrResult.text + "\n";
                let filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = combineText(filtered);
                console.log(partialName);

                // heroIndexChangedイベントによってデフォルトスキルが予約されてしまうのでスキルセットする直前で解消
                // todo: もっとまともな方法があれば
                unit.clearReservedSkills();
                unit.weapon = -1;

                if (partialName != null) {
                    let result = self.findSimilarNameSkill(partialName,
                        self.__enumerateElemOfArrays([
                            g_appData.weaponInfos]));
                    if (result != null) {
                        let skillInfo = result[0];
                        console.log(skillInfo.name);
                        let skillId = skillInfo.id;
                        if (skillInfo.name.startsWith("ファルシオン")) {
                            switch (unit.heroIndex) {
                                case 84: // マルス
                                    skillId = 47;
                                    break;
                                case 72: // ルキナ
                                case 24: // クロム
                                case 134: // 仮面マルス
                                    skillId = 48;
                                    break;
                                case 114: // アルム
                                    skillId = 49;
                                    break;
                                default:
                                    break;
                            }
                        }
                        unit.weapon = skillId;
                        g_appData.__updateUnitSkillInfo(unit);
                    }
                }
            },
            "jpn",
            // ホワイトリスト有効にするとスマホ版でtesseractが固まる
            self.vm.useWhitelistForOcr ? self.weaponSkillCharWhiteList : ""
        );
        promise = new Promise((resolve, reject) => resolve(promise));

        // 武器錬成抽出
        promise = cropAndPostProcessAndOcr(
            ocrInputCanvas7, sourceCanvas,
            0.575, 0.625, 0.32, 0.03,
            (srcCanvas) => {
                manipurateHsv(srcCanvas, srcCanvas,
                    (hue, saturation, brightness) => saturation < 40, true);
                let ctx = srcCanvas.getContext("2d");
                let dst = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
                return dst;
            },
            p => g_app.ocrProgress(p, `武器錬成抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                var filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = getMaxLengthElem(filtered);
                console.log(filtered);
                unit.weaponRefinement = WeaponRefinementType.None;
                if (partialName == null) {
                    // 武器錬成あり
                    self.setWeaponRefinementTypeByImage(unit, sourceCanvas, ocrInputCanvas8);
                }
            },
            "jpn",
            self.vm.useWhitelistForOcr ? self.weaponSkillCharWhiteList : ""
        );
        promise = new Promise((resolve, reject) => resolve(promise));

        // 武器、S以外のスキル名抽出
        promise = cropAndBinarizeImageAndOcr(
            ocrInputCanvas9, binarizedCanvas,
            0.575, 0.657, 0.32, 0.20,
            -1,
            p => g_app.ocrProgress(p, `スキル抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                g_appData.ocrResult += "スキル名: " + ocrResult.text + "\n";
                var filtered = convertOcrResultToArray(ocrResult.text);
                console.log(filtered);

                unit.support = -1;
                unit.special = -1;
                unit.passiveA = -1;
                unit.passiveB = -1;
                unit.passiveC = -1;
                let dict = {};
                for (let name of filtered) {
                    let skillInfo = null;
                    skillInfo = self.__findSkillInfoWithDict(name, unit, dict);
                    if (skillInfo == null) {
                        continue;
                    }
                    if (!dict[SkillType.Support]) {
                        if (skillInfo.type == SkillType.Support) {
                            dict[SkillType.Support] = skillInfo;
                            unit.support = skillInfo.id;
                            continue;
                        }
                    }

                    if (!dict[SkillType.Special]) {
                        if (skillInfo.type == SkillType.Special) {
                            dict[skillInfo.type] = skillInfo;
                            unit.special = skillInfo.id;
                            continue;
                        }
                    }

                    if (!dict[SkillType.PassiveA]) {
                        if (skillInfo.type == SkillType.PassiveA) {
                            dict[skillInfo.type] = skillInfo;
                            unit.passiveA = skillInfo.id;
                            continue;
                        }
                    }

                    if (!dict[SkillType.PassiveB]) {
                        if (skillInfo.type == SkillType.PassiveB) {
                            dict[skillInfo.type] = skillInfo;
                            unit.passiveB = skillInfo.id;
                            continue;
                        }
                    }

                    if (!dict[SkillType.PassiveC]) {
                        if (skillInfo.type == SkillType.PassiveC) {
                            dict[skillInfo.type] = skillInfo;
                            unit.passiveC = skillInfo.id;
                            continue;
                        }
                    }

                    // ここまで来た場合は見つからなかったか、複数スキルが同じ種類に判定されてしまったパターン
                }
            },
            "jpn",
            self.vm.useWhitelistForOcr ?
                self.supportSkillCharWhiteList +
                self.specialSkillCharWhiteList +
                self.passiveSkillCharWhiteList : "",
            self.passiveSkillCharBlackList,
        );
        promise = new Promise((resolve, reject) => resolve(promise));

        promise = cropAndBinarizeImageAndOcr(
            ocrInputCanvas10, binarizedCanvas,
            0.575, 0.855, 0.32, 0.03, -1,
            p => g_app.ocrProgress(p, `聖印抽出(${unit.id})`),
            ocrResult => {
                self.clearOcrProgress();
                console.log(ocrResult);
                g_appData.ocrResult += "聖印名: " + ocrResult.text + "\n";
                var filtered = convertOcrResultToArray(ocrResult.text);
                let partialName = getMaxLengthElem(filtered);
                console.log(filtered);

                if (partialName != null) {
                    let result = g_app.findSimilarNameSkill(partialName,
                        self.__enumerateElemOfArrays([
                            g_appData.passiveAInfos,
                            g_appData.passiveBInfos,
                            g_appData.passiveCInfos,
                            g_appData.passiveSInfos]));
                    if (result != null) {
                        let skillInfo = result[0];
                        console.log(skillInfo.name);
                        unit.passiveS = skillInfo.id;
                    }
                }
            },
            "jpn",
            self.vm.useWhitelistForOcr ?
                self.passiveSkillCharWhiteList : "",
            self.passiveSkillCharBlackList,
        );
        promise = new Promise((resolve, reject) => resolve(promise));
    });
}

