/// @file
/// @brief シミュレーターの画像処理部分を切り出した実装です。

function drawImage(canvas, imageData, scale) {
    const tempCanvas = document.getElementById("tempCanvas");
    let tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);

    let ctx = canvas.getContext("2d");
    canvas.width = imageData.width * scale;
    canvas.height = imageData.height * scale;
    ctx.drawImage(tempCanvas, 0, 0,
        imageData.width, imageData.height,
        0, 0, canvas.width, canvas.height);
}

/// シミュレーターの画像処理の実装を持つクラスです。
class ImageProcessor {
    showOcrSettingSourceImage(files) {
        let image = new Image();
        let reader = new FileReader();
        reader.onload = function (evt) {
            image.onload = function () {
                let scaledWidth = 200;
                let scale = scaledWidth / image.width;
                // scale = 1;
                let imageData = null;
                {
                    const canvas = document.getElementById("ocrSettingSourceCanvas");
                    {
                        let ctx = canvas.getContext("2d");
                        canvas.width = image.width;
                        canvas.height = image.height;
                        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
                        imageData = ctx.getImageData(0, 0, image.width, image.height);

                        drawImage(canvas, imageData, scale);
                    }
                    if (g_app.cropper != null) {
                        g_app.cropper.destroy();
                    }
                    let croppedHeight = canvas.width * (16.0 / 9.0);
                    let croppedWidth = canvas.width;
                    if (croppedHeight > canvas.height) {
                        // 横幅が広すぎるケース
                        croppedHeight = canvas.height;
                        croppedWidth = canvas.height * (9.0 / 16.0);
                    }
                    g_app.cropper = new Cropper(canvas, {
                        aspectRatio: 9 / 16,
                        movable: false,
                        scalable: false,
                        zoomable: false,
                        autoCrop: true,
                        data: {
                            height: canvas.height,
                            // width: croppedWidth, // widthを設定すると画像が横長の時に中央でなくなる
                            x: (canvas.width - croppedWidth) / 2,
                            y: (canvas.height - croppedHeight) / 2,
                        },
                        crop: function (event) {
                            g_appData.ocrCropX = event.detail.x / scale;
                            g_appData.ocrCropY = event.detail.y / scale;
                            const croppedCanvas = document.getElementById("ocrSettingCroppedCanvas");
                            {
                                let ctx = croppedCanvas.getContext("2d");
                                croppedCanvas.width = croppedWidth;
                                croppedCanvas.height = croppedHeight;
                                ctx.drawImage(image,
                                    event.detail.x / scale, event.detail.y / scale, event.detail.width / scale, event.detail.height / scale,
                                    0, 0, croppedCanvas.width, croppedCanvas.height
                                );
                            }
                        }
                    });
                }
            }

            image.src = evt.target.result;
        }

        let file = files[0]
        reader.readAsDataURL(file);
    }

    setUnitsByStatusImages(files) {
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
                    this.setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, self.ocrCanvases[0]);
                }
                break;
            case OcrSettingTarget.AllEnemies:
                for (let i = 0; i < files.length && i < g_appData.enemyUnits.length; ++i) {
                    let unit = g_appData.enemyUnits[i];
                    let file = files[i];
                    const sourceCanvas = document.getElementById("croppedImage" + i);
                    const binarizedCanvas = document.getElementById("binarizedImage" + i);
                    this.setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, self.ocrCanvases[i]);
                }
                break;
            case OcrSettingTarget.AllAllies:
                for (let i = 0; i < files.length && i < g_appData.allyUnits.length; ++i) {
                    let unit = g_appData.allyUnits[i];
                    let file = files[i];
                    const sourceCanvas = document.getElementById("croppedImage" + i);
                    const binarizedCanvas = document.getElementById("binarizedImage" + i);
                    this.setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, self.ocrCanvases[i]);
                }
                break;
            case OcrSettingTarget.MapStructures:
                {
                    let file = files[0];
                    this.setMapByImage(file);
                }
                break;
        }
    }

    __drawCroppedImage(image, croppedCanvas, cropX, cropY, cropWidth, cropHeight, scale = 1) {
        let ctx = croppedCanvas.getContext("2d");
        croppedCanvas.width = cropWidth * scale;
        croppedCanvas.height = cropHeight * scale;
        ctx.drawImage(image,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, croppedCanvas.width, croppedCanvas.height
        );
    }

    __calcAbsDiffOfImages(croppedCanvas, mapImageFile) {
        let self = g_app;
        let imreadMode = cv.IMREAD_COLOR; // cv.IMREAD_GRAYSCALE
        let src1 = cv.imread(croppedCanvas, imreadMode);
        let src2 = cv.imread(mapImageFile.fileName, imreadMode);
        let shrinkDiv = Number(self.vm.imageSizeShrinkDiv);
        cv.resize(src1, src1, new cv.Size(src1.cols / shrinkDiv, src1.rows / shrinkDiv), 0, 0, cv.INTER_AREA);
        cv.resize(src2, src2, new cv.Size(src1.cols, src1.rows), 0, 0, cv.INTER_AREA);

        let dst = new cv.Mat();
        cv.absdiff(src1, src2, dst);
        cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
        let sum = 0;
        let channels = 1;
        // console.log(`dst.rows = ${dst.rows}, dst.cols = ${dst.cols}, dst.channels = ${dst.channels()}, dst.type = ${matTypeToString(dst)}`);
        for (let y = 0; y < dst.rows; y++) {
            for (let x = 0; x < dst.cols; x++) {
                for (let c = 0; c < channels; ++c) {
                    sum += dst.ucharPtr(y, x)[c];
                }
            }
        }

        src1.delete();
        src2.delete();
        dst.delete();
        self.writeSimpleLogLine(`入力画像と${mapImageFile.fileName}の差の絶対値総和は${sum}`);
        return sum;
    }
    __getTemplateMatchMethod() {
        let self = g_app;
        switch (self.vm.templateMatchMethod) {
            case 0: return cv.TM_SQDIFF;
            case 1: return cv.TM_SQDIFF_NORMED;
            case 2: return cv.TM_CCORR;
            case 3: return cv.TM_CCORR_NORMED;
            case 4: return cv.TM_CCOEFF;
            case 5: return cv.TM_CCOEFF_NORMED;
            default: return cv.TM_CCOEFF;
        }
    }


    __templateMatch(templateIndex, croppedCanvas, matchedPoints) {
        let self = g_app;
        const templateMatchingOutputCanvas = document.getElementById("templateMatchingOutputImage");
        self.vm.currentTemplateIndex = templateIndex;
        let templateImageFileName = self.vm.templateImageFiles[templateIndex];
        self.writeSimpleLogLine(`${templateImageFileName}を画像から抽出...`);
        let structure = self.__findStructureByIconFileName(templateImageFileName);
        if (structure == null) {
            // アイコンに該当する施設が存在しない
            return;
        }

        let imgId = templateImageFileName;
        let src = cv.imread(croppedCanvas);
        let templ = cv.imread(imgId);
        let mask = new cv.Mat();
        let dst = new cv.Mat();
        let method = this.__getTemplateMatchMethod();

        if (!(method == cv.TM_SQDIFF || method == cv.TM_CCORR_NORMED)) {
            mask = new cv.Mat();
        }
        cv.matchTemplate(
            src,
            templ,
            dst,
            method,
            mask);
        let result = cv.minMaxLoc(dst, new cv.Mat());

        let maxCorrPoint;
        let valueMult = 1;
        if (method == cv.TM_SQDIFF
            || method == cv.TM_SQDIFF_NORMED
        ) {
            // 不等号が揃うように-1を乗算
            valueMult = -1;
            maxCorrPoint = result.minLoc;
        }
        else {
            maxCorrPoint = result.maxLoc;
        }

        let color = new cv.Scalar(255, 0, 0, 255);

        let maxCorrValue = dst.floatAt(maxCorrPoint.y, maxCorrPoint.x) * valueMult;
        self.writeSimpleLogLine(`最大相関値=${maxCorrValue}`);

        const mapWidth = g_appData.map.width;
        const mapHeight = g_appData.map.height - 2;
        const unitWidth = croppedCanvas.width / mapWidth;
        const unitHeight = croppedCanvas.height / mapHeight;
        const halfUnitWidth = unitWidth / 2;
        const halfUnitHeight = unitHeight / 2;

        let threshold = maxCorrValue * self.vm.corrThresholdRate;
        if (method == cv.TM_SQDIFF
            || method == cv.TM_SQDIFF_NORMED
        ) {
            // 適当
            threshold = maxCorrValue * 2;
        }
        let matchedPointsForThisTemplate = {};
        for (let y = 0; y < dst.rows; ++y) {
            for (let x = 0; x < dst.cols; ++x) {
                let value = dst.floatAt(y, x) * valueMult;
                if (Number(value) >= Number(threshold)) {
                    let mapPosX = Math.floor((x + halfUnitWidth) / unitWidth);
                    let mapPosY = Math.floor((y + halfUnitHeight) / unitHeight);
                    let tile = g_appData.map.getTile(mapPosX, mapPosY);
                    if (tile == null || !tile.isStructurePlacable) {
                        continue;
                    }
                    if (self.vm.ignoresUnitTileForAutoMapReplace && tile.placedUnit != null) {
                        continue;
                    }

                    let key = mapPosX + "-" + mapPosY;

                    if (matchedPointsForThisTemplate[key] && matchedPointsForThisTemplate[key][2] > value) {
                        continue;
                    }
                    matchedPointsForThisTemplate[key] = [mapPosX, mapPosY, value, structure, templateImageFileName];
                }
            }
        }

        let matchedCount = Object.keys(matchedPointsForThisTemplate).length;

        self.writeSimpleLogLine(imgId + `に似ているマスが${matchedCount}個見つかりました。`);
        let matchCountThreshold = 1;
        if (structure instanceof TrapBase) {
            // トラップは2つある場合があるのと誤判定しやすいので4にしておく
            matchCountThreshold = 4;
        }

        if (matchedCount <= matchCountThreshold) {
            self.writeSimpleLogLine(`${templateImageFileName}が画像内に見つかりました。`);
            // 辞書を更新
            for (let key in matchedPointsForThisTemplate) {
                let point = matchedPointsForThisTemplate[key];
                if (matchedPoints[key] && matchedPoints[key][2] > point[2]) {
                    continue;
                }

                if (matchedPoints[key]) {
                    self.writeSimpleLogLine(`${matchedPoints[key][3].iconFileName}(${matchedPoints[key][2]})より${point[3].iconFileName}(${point[2]})の相関値が高いので上書きします。`);
                }
                matchedPoints[key] = point;
            }

            for (let pointKey in matchedPoints) {
                let point = matchedPoints[pointKey];

                let posX = point[0];
                let posY = point[1];
                self.writeSimpleLogLine(`(${posX}, ${posY})`);

                let startPoint = new cv.Point(posX * unitWidth, posY * unitHeight);
                let endPoint = new cv.Point(startPoint.x + templ.cols, startPoint.y + templ.rows);
                cv.rectangle(src, startPoint, endPoint, color, 2, cv.LINE_8, 0);

                let targetTile = g_appData.map.getTile(posX, posY);
                if (targetTile != null && targetTile.obj != null) {
                    moveToDefault(targetTile.obj);
                }

                let thisTileStructure = point[3];
                moveStructureToMap(thisTileStructure, posX, posY);
            }
            cv.imshow(templateMatchingOutputCanvas, src);
        }
        else {
            self.writeSimpleLogLine(`${templateImageFileName}は画像内にないと判定されました。`);
        }
        src.delete();
        dst.delete();
        mask.delete();
    }

    __getSortedMatchedPoints(matchedPoints, predicatorFunc) {
        let sortedPoints = [];
        for (let pointKey in matchedPoints) {
            let point = matchedPoints[pointKey];
            let st = point[3];
            if (predicatorFunc(st)) {
                sortedPoints.push(point);
            }
        }
        sortedPoints.sort((a, b) => {
            return b[2] - a[2];
        });
        return sortedPoints;
    }

    setWeaponRefinementTypeByImage(unit, sourceCanvas, canvas) {
        let self = g_app;
        if (!unit.hasWeapon) {
            return;
        }

        let offsetPercentageX = 0.510;
        let offsetPercentageY = 0.619;
        let widthPercentage = 0.07;
        let heightPercentage = 0.04;
        cropCanvas(sourceCanvas, canvas,
            offsetPercentageX,
            offsetPercentageY,
            widthPercentage,
            heightPercentage
        );
        let src = cv.imread(canvas);
        let mask = new cv.Mat();
        let dst = new cv.Mat();
        let method = cv.TM_CCOEFF_NORMED;
        let values = [];
        for (let imageFile of self.vm.templateWeaponRefinementImageFiles) {
            let templ = cv.imread(imageFile.fileName);
            cv.matchTemplate(
                src,
                templ,
                dst,
                method,
                mask);
            templ.delete();
            let result = cv.minMaxLoc(dst, new cv.Mat());
            let maxCorrPoint = result.maxLoc;
            let maxCorrValue = dst.floatAt(maxCorrPoint.y, maxCorrPoint.x);
            console.log(`${imageFile.fileName}: ` + "maxCorrValue = " + maxCorrValue);
            let threshold = 0.8;
            if (maxCorrValue > threshold) {
                values.push([imageFile.id, maxCorrValue]);
                cv.imshow(canvas, src);
            }
        }

        src.delete();
        dst.delete();
        mask.delete();

        values.sort((a, b) => {
            return b[1] - a[1];
        });

        let bestOne = WeaponRefinementType.None;
        if (values.length == 0) {
            bestOne = WeaponRefinementType.Special;
            if (unit.weaponInfo.specialRefineHpAdd == 3) {
                bestOne = WeaponRefinementType.Special_Hp3;
            }
        }
        else {
            bestOne = values[0][0];
            switch (bestOne) {
                case WeaponRefinementType.Hp5_Atk2:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Atk1;
                    }
                    break;
                case WeaponRefinementType.Hp5_Spd3:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Spd2;
                    }
                    break;
                case WeaponRefinementType.Hp5_Def4:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Def3;
                    }
                    break;
                case WeaponRefinementType.Hp5_Res4:
                    if (unit.isRangedWeaponType()) {
                        bestOne = WeaponRefinementType.Hp2_Res3;
                    }
                    break;
            }
        }
        unit.weaponRefinement = bestOne;
        g_appData.__updateStatusBySkillsAndMerges(unit);
    }

    setUnitBlessingByImage(unit, sourceCanvas, canvas) {
        let self = g_app;
        if (!unit.canGrantBlessing) {
            return;
        }
        self.writeDebugLogLine(`sourceCanvas.width = ${sourceCanvas.width}, sourceCanvas.height = ${sourceCanvas.height}`);

        // 祝福の判定
        let offsetPercentageX = 0.8;
        let offsetPercentageY = 0.45;
        let widthPercentage = 0.2;
        let heightPercentage = 0.12;
        cropCanvas(sourceCanvas, canvas,
            offsetPercentageX,
            offsetPercentageY,
            widthPercentage,
            heightPercentage
        );
        let src = cv.imread(canvas);
        let mask = new cv.Mat();
        let dst = new cv.Mat();
        let method = cv.TM_CCOEFF_NORMED;
        let values = [];
        for (let imageFile of self.vm.templateBlessingImageFiles) {
            let templ = cv.imread(imageFile.fileName);
            cv.matchTemplate(
                src,
                templ,
                dst,
                method,
                mask);
            templ.delete();
            let result = cv.minMaxLoc(dst, new cv.Mat());
            let maxCorrPoint = result.maxLoc;
            let maxCorrValue = dst.floatAt(maxCorrPoint.y, maxCorrPoint.x);
            self.writeDebugLogLine(`${imageFile.fileName}: ` + "maxCorrValue = " + maxCorrValue);
            let threshold = 0.5;
            if (maxCorrValue > threshold) {
                values.push([imageFile.id, maxCorrValue]);
                cv.imshow(canvas, src);
            }
        }
        src.delete();
        dst.delete();
        mask.delete();

        if (values.length == 0) {
            return;
        }

        values.sort((a, b) => {
            return b[1] - a[1];
        });

        let bestBlessing = values[0][0];
        unit.grantedBlessing = bestBlessing;
        self.writeDebugLogLine("bestBlessing=" + bestBlessing);
        g_appData.__updateStatusBySkillsAndMerges(unit);
    }

    __updateStructureInstanceOfSortedMatchedPoints(sortedTargetMatchedPoints, predicateFunc, postSetFunc) {
        let structures = g_appData.getDefenceStructures(x => predicateFunc(x));
        for (let i = 0; i < sortedTargetMatchedPoints.length; ++i) {
            console.log(`[${i}]` + sortedTargetMatchedPoints[i][4] + ": value = " + sortedTargetMatchedPoints[i][2]);
            if (i < structures.length) {
                let structure = structures[i];
                sortedTargetMatchedPoints[i][3] = structure;
                postSetFunc(structure, sortedTargetMatchedPoints[i]);
            }
            else {
                sortedTargetMatchedPoints[i][3] = null;
            }
        }
    }

    setMapByImage(file) {
        let self = g_app;
        let processor = this;
        loadAndProcessImage(file, image => {
            const croppedCanvas = document.getElementById("croppedImage");
            let croppedWidth = image.width - self.vm.ocrCropX * 2;
            let croppedHeight = croppedWidth * (16.0 / 9.0);
            let croppedPointY = self.vm.ocrCropY + croppedHeight * 0.15;
            let scale = 1136.0 / croppedHeight; // テンプレート画像が640x1136から切り出したものを使ってるのでサイズを合わせる必要がある

            // 飛空城マップの場合はオフェンスのマスは切り取る
            let cropHeightRatio = 0.28;
            if (g_appData.gameMode == GameMode.Arena) {
                // 闘技場の場合はマップ全体が残るよう切り取る
                cropHeightRatio = cropHeightRatio / 3.0;
            }

            const topCropHeightRatio = 0.15;
            processor.__drawCroppedImage(image, croppedCanvas,
                self.vm.ocrCropX, croppedPointY,
                croppedWidth, croppedHeight - croppedHeight * topCropHeightRatio - croppedHeight * cropHeightRatio,
                scale);

            self.clearSimpleLog();

            for (let st of self.vm.defenseStructureStorage.objs) {
                moveToDefault(st);
            }

            if (g_appData.gameMode == GameMode.Arena) {
                let minSum = Number.MAX_VALUE;
                let minMapType = MapType.Arena_1;

                let iterMax = 0
                iterMax += self.vm.arenaMapImageFiles.length;
                startProgressiveProcess(iterMax,
                    (iter) => {
                        // 地形タイプ判別
                        let mapImageFile = self.vm.arenaMapImageFiles[iter];
                        let sum = processor.__calcAbsDiffOfImages(croppedCanvas, mapImageFile);
                        if (sum < minSum) {
                            minSum = sum;
                            minMapType = mapImageFile.id;
                        }
                    },
                    (iter, iterMax) => {
                        $("#progress").progressbar({
                            value: iter,
                            max: iterMax,
                        });
                    },
                    () => {
                        $("#progress").progressbar({ disabled: true });
                        self.writeSimpleLogLine(`地形は${g_appData.getLabelOfMap(minMapType)}`);
                        g_app.vm.mapKind = minMapType;
                        changeMap();
                        resetPlacement();
                    });
            }
            else {
                let minSum = Number.MAX_VALUE;
                let minMapType = MapType.Izumi;

                let iterMax = self.vm.templateImageFiles.length;
                self.vm.debugTemplateIndex = Number(self.vm.debugTemplateIndex);
                if (self.vm.debugTemplateIndex >= 0) {
                    iterMax = self.vm.debugTemplateCount;
                }

                let isDebugModeEnabled = self.vm.debugTemplateIndex >= 0;

                if (!isDebugModeEnabled) {
                    iterMax += self.vm.mapImageFiles.length;
                }

                let matchedPoints = {};
                startProgressiveProcess(iterMax,
                    (iter) => {
                        if (!isDebugModeEnabled && iter < self.vm.mapImageFiles.length) {
                            // 地形タイプ判別
                            let mapImageFile = self.vm.mapImageFiles[iter];
                            let sum = processor.__calcAbsDiffOfImages(croppedCanvas, mapImageFile);
                            if (sum < minSum) {
                                minSum = sum;
                                minMapType = mapImageFile.id;
                            }
                        }
                        else {
                            let templateIndex = iter - self.vm.mapImageFiles.length;
                            if (isDebugModeEnabled) {
                                templateIndex = self.vm.debugTemplateIndex + iter;
                            }
                            processor.__templateMatch(templateIndex, croppedCanvas, matchedPoints);
                        }
                    },
                    (iter, iterMax) => {
                        $("#progress").progressbar({
                            value: iter,
                            max: iterMax,
                        });

                        if (iter == self.vm.mapImageFiles.length) {
                            self.writeSimpleLogLine(`地形は${g_appData.getLabelOfMap(minMapType)}`);
                            g_app.vm.mapKind = minMapType;
                            changeMap();
                        }

                        if (iter >= self.vm.mapImageFiles.length) {
                            updateAllUi();
                        }
                    },
                    () => {
                        $("#progress").progressbar({ disabled: true });

                        // トラップは2つあるので片方のインスタンスを本物トラップに置き換える
                        let boltTrapPoints = processor.__getSortedMatchedPoints(matchedPoints, st => st instanceof FalseBoltTrap);
                        processor.__updateStructureInstanceOfSortedMatchedPoints(boltTrapPoints,
                            x => x instanceof FalseBoltTrap || x instanceof BoltTrap,
                            (st, point) => { });
                        let heavyTrapPoints = processor.__getSortedMatchedPoints(matchedPoints, st => st instanceof FalseHeavyTrap);
                        processor.__updateStructureInstanceOfSortedMatchedPoints(heavyTrapPoints,
                            x => x instanceof FalseHeavyTrap || x instanceof HeavyTrap,
                            (st, point) => { });

                        let ornamentPoints = processor.__getSortedMatchedPoints(matchedPoints, st => st instanceof Ornament);
                        processor.__updateStructureInstanceOfSortedMatchedPoints(ornamentPoints,
                            x => x instanceof Ornament,
                            (st, point) => {
                                st.ornamentTypeIndex = findOrnamentTypeIndexByIcon(point[4]);
                                st.setIconByOrnamentTypeIndex();
                            });

                        for (let pointKey in matchedPoints) {
                            let point = matchedPoints[pointKey];
                            if (point[3] == null) {
                                continue;
                            }

                            let posX = point[0];
                            let posY = point[1];

                            let targetTile = g_appData.map.getTile(posX, posY);
                            if (targetTile != null && targetTile.obj != null) {
                                moveToDefault(targetTile.obj);
                            }

                            let thisTileStructure = point[3];
                            moveStructureToMap(thisTileStructure, posX, posY);
                        }

                        updateAllUi();
                    });
            }
        });
    }
    /**
     * @param  {Unit} unit
     * @param  {Blob} file
     * @param  {Canvas} sourceCanvas
     * @param  {Canvas} binarizedCanvas
     * @param  {Canvas[]} ocrCanvases
     */
    setUnitByImage(unit, file, sourceCanvas, binarizedCanvas, ocrCanvases) {
        let app = g_app;
        let self = this;
        app.vm.ocrProgress = `画像の読み込み(${unit.id})..`;
        loadAndProcessImage(file, image => {
            const croppedWidth = image.width - app.vm.ocrCropX * 2;
            const croppedHeight = croppedWidth * (16.0 / 9.0);
            let scale = 1136.0 / croppedHeight; // テンプレート画像が640x1136から切り出したものを使ってるのでサイズを合わせる必要がある
            self.__drawCroppedImage(image, sourceCanvas,
                app.vm.ocrCropX, app.vm.ocrCropY, croppedWidth, croppedHeight, scale);

            // 文字認識用に2値化
            app.vm.ocrProgress = `画像の2値化(${unit.id})..`;
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
            cropAndBinarizeImageAndOcr(
                ocrInputCanvas, binarizedCanvas,
                0.05, 0.435, 0.45, 0.105, -1,
                p => app.ocrProgress(p, `ユニット名抽出(${unit.id})`),
                ocrResult => {
                    app.clearOcrProgress();
                    console.log(ocrResult);
                    self.extractHeroName(unit, ocrResult);
                }).then(() => {
                    app.writeProgress(`祝福抽出(${unit.id})`);
                    self.setUnitBlessingByImage(unit, sourceCanvas, ocrInputCanvas1);
                    updateAllUi();
                    app.clearOcrProgress();
                }).then(() => {
                    // 凸数抽出
                    unit.merge = 0;
                    cropAndBinarizeImageAndOcr(
                        ocrInputCanvas2, sourceCanvas,
                        0.252, 0.577, 0.06, 0.038, 130,
                        p => g_app.ocrProgress(p, `凸数抽出(${unit.id})`),
                        ocrResult => {
                            app.clearOcrProgress();
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
                    ).then(() => {
                        unit.dragonflower = 0;
                        // 花凸数抽出
                        cropAndBinarizeImageAndOcr(
                            ocrInputCanvas3, binarizedCanvas,
                            0.541, 0.58, 0.06, 0.03, -1,
                            p => g_app.ocrProgress(p, `花凸数抽出(${unit.id})`),
                            ocrResult => {
                                app.clearOcrProgress();
                                console.log(ocrResult);
                                g_appData.ocrResult += "花凸数: " + ocrResult.text + "\n";
                                var filtered = convertOcrResultToArray(ocrResult.text);
                                let partialName = getMaxLengthElem(filtered);
                                let dragonflower = Number(partialName);
                                if (Number.isInteger(dragonflower) && dragonflower > 0) {
                                    unit.dragonflower = dragonflower;
                                    g_appData.__updateStatusBySkillsAndMerges(unit);
                                }
                            },
                            'eng'
                            // ,"0123456789"
                        ).then(() => {
                            // アクセサリー未装備の時は花凸の位置がずれるのでもう一度OCR
                            cropAndBinarizeImageAndOcr(
                                ocrInputCanvas11, binarizedCanvas,
                                0.506, 0.58, 0.06, 0.03, -1,
                                p => app.ocrProgress(p, `花凸数抽出(${unit.id})`),
                                ocrResult => {
                                    app.clearOcrProgress();
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
                            ).then(() => {
                                // 得意個体
                                cropAndPostProcessAndOcr(
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
                                        self.extractAsset(unit, ocrResult);
                                    },
                                    'jpn',
                                    "HP攻撃速さ守備魔防"
                                ).then(() => {
                                    // 苦手個体
                                    cropAndPostProcessAndOcr(
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
                                            self.extractFlaw(unit, ocrResult);
                                        },
                                        'jpn',
                                        "HP攻撃速さ守備魔防"
                                    ).then(() => {
                                        unit.clearSkills();

                                        // 武器抽出
                                        cropAndPostProcessAndOcr(
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
                                                self.extractWeapon(unit, ocrResult);
                                            },
                                            "jpn",
                                            // ホワイトリスト有効にするとスマホ版でtesseractが固まる
                                            app.vm.useWhitelistForOcr ? app.weaponSkillCharWhiteList : ""
                                        ).then(() => {
                                            // 武器錬成抽出
                                            cropAndPostProcessAndOcr(
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
                                                    app.clearOcrProgress();
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
                                                app.vm.useWhitelistForOcr ? app.weaponSkillCharWhiteList : ""
                                            ).then(() => {
                                                // 武器、S以外のスキル名抽出
                                                cropAndBinarizeImageAndOcr(
                                                    ocrInputCanvas9, binarizedCanvas,
                                                    0.575, 0.657, 0.32, 0.20,
                                                    -1,
                                                    p => g_app.ocrProgress(p, `スキル抽出(${unit.id})`),
                                                    ocrResult => {
                                                        self.extractSkills(unit, ocrResult);
                                                    },
                                                    "jpn",
                                                    app.vm.useWhitelistForOcr ?
                                                        app.supportSkillCharWhiteList +
                                                        app.specialSkillCharWhiteList +
                                                        app.passiveSkillCharWhiteList : "",
                                                    app.passiveSkillCharBlackList,
                                                ).then(() => {
                                                    cropAndBinarizeImageAndOcr(
                                                        ocrInputCanvas10, binarizedCanvas,
                                                        0.575, 0.855, 0.32, 0.03, -1,
                                                        p => g_app.ocrProgress(p, `聖印抽出(${unit.id})`),
                                                        ocrResult => {
                                                            self.extractSacredSeal(unit, ocrResult);
                                                        },
                                                        "jpn",
                                                        app.vm.useWhitelistForOcr ?
                                                            app.passiveSkillCharWhiteList : "",
                                                        app.passiveSkillCharBlackList,
                                                    ).then(() => {
                                                        // 最後にスキル情報を同期
                                                        g_appData.__updateUnitSkillInfo(unit);
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
        });
    }

    extractFlaw(unit, ocrResult) {
        let app = g_app;
        app.clearOcrProgress();
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
    }
    /**
     * @param  {Unit} unit
     * @param  {any} ocrResult
     */
    extractAsset(unit, ocrResult) {
        let app = g_app;
        app.clearOcrProgress();
        unit.setIvHighStat(StatusType.None);
        unit.ascendedAsset = StatusType.None;
        console.log(ocrResult);
        /** @type {String} */
        g_appData.ocrResult += "得意: " + ocrResult.text + "\n";
        let filtered = convertOcrResultToArray(ocrResult.text);
        let names = getMaxLengthElem2(filtered);
        let isAssetFound = false;
        for (let partialName of names) {
            g_app.writeDebugLogLine(`partialName=${partialName}`);
            if (partialName == null || partialName == "") {
                continue;
            }
            let statusName = g_app.__findSimilarStatusName(partialName);
            if (statusName != null) {
                if (isAssetFound) {
                    // 2つ目は開花得意とする
                    unit.ascendedAsset = nameToStatusType(statusName);
                }
                else {
                    unit.setIvHighStat(nameToStatusType(statusName));
                    isAssetFound = true;
                }
            }
        }

        if (isAssetFound) {
            g_appData.__updateStatusBySkillsAndMerges(unit);
        }
    }

    extractSacredSeal(unit, ocrResult) {
        let app = g_app;
        app.clearOcrProgress();
        console.log(ocrResult);
        g_appData.ocrResult += "聖印名: " + ocrResult.text + "\n";
        var filtered = convertOcrResultToArray(ocrResult.text);
        let partialName = getMaxLengthElem(filtered);
        console.log(filtered);

        if (partialName != null) {
            let result = g_app.findSimilarNameSkill(partialName,
                app.__enumerateElemOfArrays([
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
    }

    extractSkills(unit, ocrResult) {
        let app = g_app;
        app.clearOcrProgress();
        console.log(ocrResult);
        g_appData.ocrResult += "スキル名: " + ocrResult.text + "\n";
        let filtered = convertOcrResultToArray(ocrResult.text);
        console.log(filtered);

        unit.support = -1;
        unit.special = -1;
        unit.passiveA = -1;
        unit.passiveB = -1;
        unit.passiveC = -1;
        let dict = {};
        for (let name of filtered) {
            let skillInfo = null;
            skillInfo = app.__findSkillInfoWithDict(name, unit, dict);
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
    }

    extractWeapon(unit, ocrResult) {
        let self = g_app;
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
    }

    extractHeroName(unit, ocrResult) {
        g_appData.ocrResult += "キャラ名: " + ocrResult.text + "\n";
        let filtered = convertOcrResultToArray(ocrResult.text);
        filtered = g_app.limitArrayLengthTo2WithLargerLengthString(filtered);
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
    }
}
