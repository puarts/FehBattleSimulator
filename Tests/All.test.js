
const g_siteRootPath = "/";
const g_imageRootPath = g_siteRootPath + "AetherRaidTacticsBoard/images/";
const g_corsImageRootPath = g_imageRootPath;
const g_audioRootPath = g_siteRootPath + "AetherRaidTacticsBoard/audio/";
const TurnSettingCookiePrefix = "turn_";
const UnitCookiePrefix = "unit_";
const StructureCookiePrefix = "st_";
const TileCookiePrefix = "t_";
const TurnWideCookieId = "turnwide";
const NameValueDelimiter = '=';
const ElemDelimiter = ':';
const ValueDelimiter = '|';
const ArrayValueElemDelimiter = '+';
const DebugModeDefault = false;/// @file
/// @brief ユーティリティークラス、関数等の定義です。

class TreeNode {
    constructor(item) {
        this.item = item;
        this.branches = [];
    }
}

/// スタックを表すコンテナクラスです。
class Stack {
    constructor(maxLength) {
        this._maxLength = maxLength;
        this._array = [];
    }

    get length() {
        return this._array.length;
    }

    push(value) {
        if (this._array.length == this._maxLength) {
            this._array.shift();
        }
        this._array.push(value);
    }

    pop() {
        return this._array.pop();
    }

    clear() {
        this._array = [];
    }

    get data() {
        return this._array;
    }
}

/// キューを表すコンテナクラスです。
class Queue {
    constructor(maxLength) {
        this._maxLength = maxLength;
        this._array = [];
    }

    enqueue(value) {
        if (this._array.length == this._maxLength) {
            this._array.shift();
        }
        this._array.push(value);
    }

    dequeue() {
        if (this._array.length > 0) {
            return this._array.shift();
        }
        return null;
    }

    pop() {
        if (this._array.length > 0) {
            return this._array.pop();
        }
        return null;
    }

    clear() {
        this._array = [];
    }

    get topValue() {
        if (this.length == 0) {
            return null;
        }
        return this._array[0];
    }

    get lastValue() {
        if (this.length == 0) {
            return null;
        }

        return this._array[this._array.length - 1];
    }


    get length() {
        return this._array.length;
    }

    get data() {
        return this._array;
    }
}

/// クッキーの保存や読み込みを管理するクラスです。
class CookieWriter {
    constructor() {
        this.useCookieJs = false;
        this.domain = ".puarts.com"
    }

    delete(name) {
        if (this.useCookieJs) {
            $.removeCookie(name);
        }
        else {
            document.cookie = name + "=; max-age=0;";
        }
    }
    write(name, value) {
        if (this.useCookieJs) {
            $.cookie(name, value);
        } else {
            document.cookie = name + "=" + value;
        }
        // console.log("write:" + document.cookie);
    }
    read(name) {
        if (this.useCookieJs) {
            return $.cookie(name);
        }
        else {
            // console.log("read:" + document.cookie);
            if (document.cookie != "") {
                var settings = document.cookie.split(';');
                for (var settingIndex = 0; settingIndex < settings.length; ++settingIndex) {
                    let elemText = settings[settingIndex];
                    var keyValue = elemText.split('=');
                    if (keyValue.length < 2) {
                        // console.error("invalid cookie: " + settings[settingIndex]);
                        continue;
                    }
                    var settingName = keyValue[0].trim();
                    if (settingName != name) {
                        continue;
                    }
                    var settingValue = elemText.substring(keyValue[0].length + 1).trim();
                    return settingValue;
                }
            }
        }
        return null;
    }
}

/// キーボードの入力を管理するクラスです。
class KeyboardManager {
    constructor() {
        this.isShiftKeyPressing = false;
        this.isControlKeyPressing = false;
        let self = this;
        document.addEventListener('keydown', (event) => {
            const keyName = event.key;
            if (keyName == "Shift") {
                self.isShiftKeyPressing = true;
            } else if (keyName == "Control") {
                self.isControlKeyPressing = true;
            }
        }, false);

        document.addEventListener('keyup', (event) => {
            const keyName = event.key;
            if (keyName == "Shift") {
                self.isShiftKeyPressing = false;
            } else if (keyName == "Control") {
                self.isControlKeyPressing = false;
            }
        }, false);
    }
}

/// ユニークな ID を生成するクラスです。
class IdGenerator {
    constructor() {
        this._currentId = 0;
    }

    generate() {
        ++this._currentId;
        return this._currentId;
    }
}

/// オブジェクトを管理するストレージです。
class Storage {
    constructor(id) {
        this._id = id;
        this._objs = [];
    }

    get id() {
        return this._id;
    }

    clear() {
        this._objs = [];
    }

    get objs() {
        return this._objs;
    }

    get length() {
        return this._objs.length;
    }

    register(obj) {
        this._objs.push(obj);
    }

    isAvailable(obj) {
        return this.findById(obj.id) != null;
    }

    findById(id) {
        for (var i = 0; i < this._objs.length; ++i) {
            var obj = this._objs[i];
            if (obj.id == id) {
                return obj;
            }
        }
        return null;
    }

    *enumerateAllObjs() {
        for (var i = 0; i < this._objs.length; ++i) {
            var obj = this._objs[i];
            yield obj;
        }
    }

    *enumerateRequiredObjs() {
        for (var i = 0; i < this._objs.length; ++i) {
            var obj = this._objs[i];
            if (obj.isRequired) {
                yield obj;
            }
        }
    }
}

/// 配置物を管理するためのコンテナクラスです。
class StructureContainer {
    constructor(uiId) {
        this._uiId = uiId;
        this._structures = [];
    }

    clear() {
        this._structures = [];
    }

    addStructure(structure) {
        this._structures.push(structure);
    }

    removeStructure(structure) {
        var index = this._structures.indexOf(structure);
        if (index < 0) {
            return;
        }
        this._structures.splice(index, 1);
    }

    findStructure(id) {
        for (var i = 0; i < this._structures.length; ++i) {
            var structure = this._structures[i];
            if (structure.id == id) {
                return structure;
            }
        }
        return null;
    }

    isAvailable(id) {
        return this.findStructure(id) != null;
    }

    toHtml() {
        var html = "";
        for (var i = 0; i < this._structures.length; ++i) {
            var structure = this._structures[i];
            html += "<img id='" + structure.id + "' class='draggable-elem' src='" + structure.icon + "' width='32px' height='32px' draggable='true' ondragstart='f_dragstart(event)' />";
        }

        return html;
    }

    updateUi() {
        let elem = document.getElementById(this._uiId);
        if (elem == null) {
            return;
        }
        elem.innerHTML = this.toHtml();
    }
}

/// 区間内の処理時間を計測するためのユーティリティークラスです。
class ScopedStopwatch {
    constructor(logFunc) {
        this._logFunc = logFunc;
        this._startTime = Date.now();
    }

    dispose() {
        const endTime = Date.now();
        var diff = endTime - this._startTime;
        this._logFunc(diff);
    }
}

const CommandType = {
    Normal: 0,
    Begin: 1,
    End: 2,
};

/// Undo、Redoが可能なコマンドです。
class Command {
    constructor(id, label, doFunc, undoFunc, doUserData = null, undoUserData = null, type = CommandType.Normal) {
        this.id = id;
        this.label = label;
        this.doFunc = doFunc;
        this.undoFunc = undoFunc;
        this.doUserData = doUserData;
        this.undoUserData = undoUserData;
        this.type = type;
        this.metaData = null;
    }

    execute() {
        this.doFunc(this.doUserData);
    }

    undo() {
        this.undoFunc(this.undoUserData);
    }
}

/// Command の履歴を管理するクラスです。
class CommandQueue {
    constructor() {
        this.queue = new Queue(100);
        this.redoStack = new Stack(100);
        this.undoStack = new Stack(100);
    }

    get length() {
        return this.queue.length;
    }

    get isUndoable() {
        return this.undoStack.length > 0;
    }

    get isRedoable() {
        return this.redoStack.length > 0;
    }

    clear() {
        this.queue.clear();
        this.redoStack.clear();
        this.undoStack.clear();
    }

    enqueue(command) {
        this.queue.enqueue(command);
    }

    execute() {
        let command = this.queue.dequeue();
        if (command == null) {
            return;
        }
        command.execute();
        this.redoStack.clear();
        this.undoStack.push(command);
    }

    executeAll() {
        while (this.queue.length > 0) {
            this.execute();
        }
    }

    undoAll() {
        let undoCount = this.undoStack.length;
        for (let i = 0; i < undoCount; ++i) {
            this.undo();
        }
    }

    undo() {
        this.__undoRedoImpl(
            function (command) { command.undo(); },
            this.undoStack, this.redoStack,
            CommandType.End, CommandType.Begin);
    }

    redo() {
        this.__undoRedoImpl(
            function (command) { command.execute(); },
            this.redoStack, this.undoStack,
            CommandType.Begin, CommandType.End);
    }

    __undoRedoImpl(execFunc, sourceStack, destStack, beginCommand, endCommand) {
        let command = sourceStack.pop();
        if (command == null) {
            return;
        }

        execFunc(command);
        destStack.push(command);
        if (command.type == beginCommand) {
            do {
                command = sourceStack.pop();
                if (command == null) {
                    return;
                }
                execFunc(command);
                destStack.push(command);
            } while (command.type != endCommand);
        }
    }
}

/// 現在のスレッドを指定時間の間、スピンループでスリープします。
function sleep(waitMilliseconds) {
    var startMilliseconds = new Date();
    while (new Date() - startMilliseconds < waitMilliseconds);
}

/// 新しいスレッドで処理を開始します。
function startProgressiveProcess(
    iterMax, // 繰り返し回数
    mainProcess, // メイン処理
    showProgress, // 進捗表示処理
    onProcessFinished = null, // 終了処理,
    waitMilliseconds = 0,
    breakLoopFunc = null,
) {
    if (iterMax == 0) {
        return;
    }

    let iter = 0;
    let endProcess = false;
    setTimeout(function tmp() {
        if (iter > 0 && waitMilliseconds > 0) {
            // 処理の実行間隔を制御
            sleep(waitMilliseconds);
        }
        mainProcess(iter);
        ++iter;
        showProgress(iter, iterMax);

        let breakLoop = true;
        if (breakLoopFunc != null) {
            breakLoop = breakLoopFunc();
        }
        else {
            breakLoop = iter >= iterMax;
        }

        if (!breakLoop) {
            setTimeout(tmp, 0);
        }
        else if (!endProcess) {
            if (onProcessFinished != null) {
                onProcessFinished();
            }
            endProcess = true;
        }
    }, 0);
}

/// 一定区間で破棄するインスタンスの区間を指定します。
function using(disposable, func) {
    const result = func();
    disposable.dispose();
    return result;
}

function getFirstElementByTagName(elements, targetTagName) {
    for (var i = 0; i < elements.length; ++i) {
        var elem = elements[i];
        if (elem.tagName == targetTagName) {
            return elem;
        }
    }

    return null;
}

function distinct(array) {
    return array.filter((elem, index, self) => self.indexOf(elem) === index);
}

function distinctStr(str) {
    let array = Array.from(str);
    return distinct(array).join('');
}

function toBoolean(text) {
    return text.toLowerCase() === 'true';
}

function calcDistance(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

function boolToInt(value) {
    if (value) {
        return 1;
    } else {
        return 0;
    }
}

function intToBool(value) {
    if (value == 0) {
        return false;
    } else {
        return true;
    }
}

function calcSimilarity(s1, s2) {
    return levenshtein(adjustChars(s1), adjustChars(s2));
}

function adjustChars(s1) {
    // 日本語で区別が難しい単語は同じ単語とみなして類似度を計算する
    const replaceChars = {
        '十': '+',
        '口': 'ロ',
        '二': 'ニ',
        '工': 'エ',
        '力': 'カ',
        'ヵ': 'カ',
        '夕': 'タ',
        '卜': 'ト',
        'ぁ': 'あ',
        'ぃ': 'い',
        'ぅ': 'う',
        'ぇ': 'え',
        'ぉ': 'お',
        'ァ': 'ア',
        'ィ': 'イ',
        'ゥ': 'ウ',
        'ェ': 'エ',
        'ォ': 'オ',
        // 'ソ': 'ン',
        // 'ツ': 'シ',
        '璧': '壁',
        '廣': '魔',
        '麿': '魔',
        '臼': '白',
        '糞': '翼',
        '眉': '盾',
        '蛹': '踊',
        '縁': '緑',
        '圓': '風',
    };
    let replacedS1 = s1;
    for (let key in replaceChars) {
        let replaceChar = replaceChars[key];
        replacedS1 = replacedS1.replace(key, replaceChar);
    }
    return replacedS1;
}

function levenshtein(s1, s2) {
    // http://kevin.vanzonneveld.net
    // +            original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
    // +            bugfixed by: Onno Marsman
    // +             revised by: Andrea Giammarchi (http://webreflection.blogspot.com)
    // + reimplemented by: Brett Zamir (http://brett-zamir.me)
    // + reimplemented by: Alexander M Beedie
    // *                example 1: levenshtein('Kevin van Zonneveld', 'Kevin van Sommeveld');
    // *                returns 1: 3

    if (s1 == s2) {
        return 0;
    }

    var s1_len = s1.length;
    var s2_len = s2.length;
    if (s1_len === 0) {
        return s2_len;
    }
    if (s2_len === 0) {
        return s1_len;
    }

    // BEGIN STATIC
    var split = false;
    try {
        split = !('0')[0];
    } catch (e) {
        split = true; // Earlier IE may not support access by string index
    }
    // END STATIC
    if (split) {
        s1 = s1.split('');
        s2 = s2.split('');
    }

    var v0 = new Array(s1_len + 1);
    var v1 = new Array(s1_len + 1);

    var s1_idx = 0, s2_idx = 0, cost = 0;
    for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
        v0[s1_idx] = s1_idx;
    }
    var char_s1 = '', char_s2 = '';
    for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
        v1[0] = s2_idx;
        char_s2 = s2[s2_idx - 1];

        for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
            char_s1 = s1[s1_idx];
            cost = (char_s1 == char_s2) ? 0 : 1;
            var m_min = v0[s1_idx + 1] + 1;
            var b = v1[s1_idx] + 1;
            var c = v0[s1_idx] + cost;
            if (b < m_min) {
                m_min = b;
            }
            if (c < m_min) {
                m_min = c;
            }
            v1[s1_idx + 1] = m_min;
        }
        var v_tmp = v0;
        v0 = v1;
        v1 = v_tmp;
    }
    return v0[s1_len];
}

function cropCanvas(
    sourceCanvas,
    croppedCanvas,
    offsetPercentageX,
    offsetPercentageY,
    widthPercentage,
    heightPercentage,
) {
    let ctx = croppedCanvas.getContext("2d");
    let sx = sourceCanvas.width * offsetPercentageX;
    let sy = sourceCanvas.height * offsetPercentageY;
    let sw = sourceCanvas.width * widthPercentage;
    let sh = sourceCanvas.height * heightPercentage;
    let dx = 0;
    let dy = 0;
    let dw = sw;
    let dh = sh;
    croppedCanvas.width = sw;
    croppedCanvas.height = sh;
    ctx.drawImage(
        sourceCanvas,
        sx, sy, sw, sh,
        dx, dy, dw, dh
    );
}

function manipurateHsv(
    srcCanvas, destCanvas,
    zeroValuePixelPredicator, binarize = true
) {
    let srcMat = cv.imread(srcCanvas);
    let hsvMat = new cv.Mat();
    cv.cvtColor(srcMat, hsvMat, cv.COLOR_BGR2HSV, 0);
    for (let y = 0; y < hsvMat.rows; ++y) {
        for (let x = 0; x < hsvMat.cols; ++x) {
            let hue = hsvMat.ucharPtr(y, x)[0];
            let saturation = hsvMat.ucharPtr(y, x)[1];
            let brightness = hsvMat.ucharPtr(y, x)[2];
            if (zeroValuePixelPredicator(hue, saturation, brightness)) {
                hsvMat.ucharPtr(y, x)[2] = 0;
            }
            else if (binarize) {
                hsvMat.ucharPtr(y, x)[1] = 0;
                hsvMat.ucharPtr(y, x)[2] = 255;
            }
        }
    }
    cv.cvtColor(hsvMat, srcMat, cv.COLOR_HSV2BGR);
    cv.imshow(destCanvas, srcMat);
    srcMat.delete();
    hsvMat.delete();
}

function cropAndPostProcessAndOcr(
    destCanvas,
    srcImageOrCanvas,
    offsetPercentageX,
    offsetPercentageY,
    widthPercentage,
    heightPercentage,
    postProcessFunc,
    ocrProgressFunc,
    ocrResultFunc,
    ocrLang = "jpn",
    whitelist = "",
    blacklist = "",
) {
    cropCanvas(
        srcImageOrCanvas,
        destCanvas,
        offsetPercentageX,
        offsetPercentageY,
        widthPercentage,
        heightPercentage);

    let dst = postProcessFunc(destCanvas);

    // let newCanvas = document.createElement("canvas");
    // let newCanvasCtx = newCanvas.getContext("2d");
    // newCanvasCtx.putImageData(dst, 0, 0);

    return executeTesseractRecognize(
        dst,
        // newCanvas,
        ocrProgressFunc,
        ocrResultFunc,
        ocrLang,
        whitelist,
        blacklist);
}

function executeTesseractRecognize(
    source,
    ocrProgressFunc,
    ocrResultFunc,
    ocrLang = "jpn",
    whitelist = "",
    blacklist = ""
) {
    return Tesseract
        .recognize(source, {
            lang: ocrLang,
            tessedit_pageseg_mode: "RAW_LINE",
            tessedit_char_whitelist: whitelist,
            tessedit_char_blacklist: blacklist,
        })
        .progress(ocrProgressFunc)
        .then(ocrResultFunc);

    // return Tesseract.recognize(
    //     source,
    //     ocrLang,
    //     {
    //         // logger: ocrProgressFunc, // v2ではここで指定
    //         lang: ocrLang,
    //         tessedit_pageseg_mode: "RAW_LINE",
    //         tessedit_char_whitelist: whitelist,
    //         // tessedit_char_blacklist: blacklist,
    //     })
    //     .progress(ocrProgressFunc) // v1ではここで指定
    //     .then((result) => {
    //         console.log(result);

    //         // v1
    //         ocrResultFunc(result);

    //         // v2 だとこっちになる
    //         // ocrResultFunc(result.data);
    //     });

    // const worker = Tesseract.createWorker({
    //     logger: ocrProgressFunc,
    // });

    // (async () => {
    //     await worker.load();
    //     await worker.loadLanguage(ocrLang);
    //     await worker.initialize(ocrLang);
    //     await worker.setParameters({
    //         tessedit_pageseg_mode: "RAW_LINE",
    //         tessedit_char_whitelist: whitelist,
    //     });
    //     console.log(source);
    //     const result = await worker.recognize(source);
    //     ocrResultFunc(result);
    //     await worker.terminate();
    // })();

    // return Tesseract
    //     .recognize(dst, {
    //         lang: ocrLang,
    //         tessedit_pageseg_mode: "RAW_LINE",
    //         tessedit_char_whitelist: whitelist,
    //         tessedit_char_blacklist: blacklist,
    //     })
    //     .progress(ocrProgressFunc)
    //     .then(ocrResultFunc);
    // await tesseractRecognize(dst, lang, { lang: ocrLang, tessedit_pageseg_mode: "RAW_LINE", tessedit_char_whitelist: whitelist });
}

function cropAndBinarizeImageAndOcr(
    destCanvas,
    srcImageOrCanvas,
    offsetPercentageX,
    offsetPercentageY,
    widthPercentage,
    heightPercentage,
    binarizeThreshold,
    ocrProgressFunc,
    ocrResultFunc,
    ocrLang = "jpn",
    whitelist = "",
    blacklist = ""
) {
    cropCanvas(
        srcImageOrCanvas,
        destCanvas,
        offsetPercentageX,
        offsetPercentageY,
        widthPercentage,
        heightPercentage);
    let ctx = destCanvas.getContext("2d");
    let src = ctx.getImageData(0, 0, destCanvas.width, destCanvas.height);
    let dst = null;
    if (binarizeThreshold < 0) {
        dst = src;
    } else {
        dst = ctx.createImageData(destCanvas.width, destCanvas.height);
        for (var i = 0; i < src.data.length; i = i + 4) {
            var y = ~~(0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2]);
            var ret = (y > binarizeThreshold) ? 255 : 0;
            dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = ret;
            dst.data[i + 3] = src.data[i + 3];
        }
        ctx.putImageData(dst, 0, 0);
    }

    // let newCanvas = document.createElement("canvas");
    // let newCanvasCtx = newCanvas.getContext("2d");
    // newCanvasCtx.putImageData(dst, 0, 0);
    return executeTesseractRecognize(
        dst,
        // newCanvas,
        ocrProgressFunc,
        ocrResultFunc,
        ocrLang,
        whitelist,
        blacklist);
}

async function tesseractRecognize(image, lang, options, ocrProgressFunc, ocrResultFunc) {
    const worker = createWorker({
        logger: ocrProgressFunc
    });
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    const result = await worker.recognize(image, options);
    ocrResultFunc(result);
    await worker.terminate();
}

function combineText(textArray) {
    let result = "";
    for (let i = 0; i < textArray.length; ++i) {
        result += textArray[i];
    }
    return result;
}

function convertOcrResultToArray(ocrResult) {
    let splited = ocrResult.split("\n");
    let filtered = splited.filter(function (el) {
        return el != "" && el != null;
    });
    for (let i = 0; i < filtered.length; ++i) {
        filtered[i] = filtered[i].replace(/ /g, '');
    }
    return filtered;
}

function getMaxLengthElem(elems) {
    let maxElem = null;
    let maxLength = 0;
    for (let elem of elems) {
        if (elem.length > maxLength) {
            maxElem = elem;
            maxLength = elem.length;
        }
    }
    return maxElem;
}

function getMaxLengthElem2(elems) {
    let maxElem = null;
    let maxLength = 0;
    let maxElem2 = null;
    let maxLength2 = 0;
    for (let elem of elems) {
        if (elem.length > maxLength) {
            maxElem2 = maxElem;
            maxLength2 = maxLength;
            maxElem = elem;
            maxLength = elem.length;
        } else if (elem.length > maxLength2) {
            maxElem2 = elem;
            maxLength2 = elem.length;
        }
    }
    return [maxElem, maxElem2];
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

function loadFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

function loadAndProcessImage(file, processFunc) {
    loadFile(file)
        .then((evt) => loadImage(evt.target.result)
            .then(image => {
                processFunc(image);
            }));
}

function matTypeToString(mat) {
    switch (mat.type()) {
        case cv.CV_8U: return "CV_8U";
        case cv.CV_8S: return "CV_8S";
        case cv.CV_16U: return "CV_16U";
        case cv.CV_16S: return "CV_16S";
        case cv.CV_32S: return "CV_32S";
        case cv.CV_32F: return "CV_32F";
        case cv.CV_64F: return "CV_64F";

        case cv.CV_8UC4: return "CV_8UC4";

        case cv.CV_8SC4: return "CV_8SC4";

        case cv.CV_16UC4: return "CV_16UC4";


        case cv.CV_16SC1: return "CV_16SC1";
        case cv.CV_16SC2: return "CV_16SC2";
        case cv.CV_16SC3: return "CV_16SC3";
        case cv.CV_16SC4: return "CV_16SC4";

        case cv.CV_32SC1: return "CV_32SC1";
        case cv.CV_32SC2: return "CV_32SC2";
        case cv.CV_32SC3: return "CV_32SC3";
        case cv.CV_32SC4: return "CV_32SC4";

        case cv.CV_32FC1: return "CV_32FC1";
        case cv.CV_32FC2: return "CV_32FC2";
        case cv.CV_32FC3: return "CV_32FC3";
        case cv.CV_32FC4: return "CV_32FC4";
        default: return mat.type();
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function selectText(containerid) {

    var node = document.getElementById(containerid);

    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNodeContents(node);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
}

function importJs(src, onloadFunc) {
    let element = document.createElement("script");
    element.type = "text/javascript";
    element.src = src;
    let headElement = document.getElementsByTagName('head')[0];
    headElement.appendChild(element);
    // document.body.appendChild(element);
    element.onload = onloadFunc;
}

function dateStrToNumber(dateStr) {
    let numStr = dateStr.replace(/-/g, "");
    return Number(numStr);
}/// @file
/// @brief スキル情報の定義とそれに関連するクラス、関数等の定義です。

const ColorType = {
    Unknown: -1,
    Red: 0,
    Blue: 1,
    Green: 2,
    Colorless: 3,
};

const SkillType = {
    Weapon: 0,
    Support: 1,
    Special: 2,
    PassiveA: 3,
    PassiveB: 4,
    PassiveC: 5,
    PassiveS: 6,
};

const WeaponType = {
    None: -1,
    Sword: 0,
    Lance: 1,
    Axe: 2,
    RedTome: 3,
    BlueTome: 4,
    GreenTome: 5,
    RedBow: 6,
    BlueBow: 7,
    GreenBow: 8,
    ColorlessBow: 9,
    RedDagger: 10,
    BlueDagger: 11,
    GreenDagger: 12,
    ColorlessDagger: 13,
    Staff: 14,
    RedBreath: 15,
    BlueBreath: 16,
    GreenBreath: 17,
    ColorlessBreath: 18,
    RedBeast: 19,
    BlueBeast: 20,
    GreenBeast: 21,
    ColorlessBeast: 22,
    ColorlessTome: 23,

    // グループ
    Breath: 24,
    Beast: 25,
    Tome: 26,
    Bow: 27,
    Dagger: 28,
    ExceptStaff: 29,
    All: 30,
};

function getWeaponTypeOrder(weaponType) {
    let weaponTypes = [
        WeaponType.Sword,
        WeaponType.RedTome,
        WeaponType.RedBreath,
        WeaponType.RedBeast,
        WeaponType.RedBow,
        WeaponType.RedDagger,
        WeaponType.Lance,
        WeaponType.BlueTome,
        WeaponType.BlueBreath,
        WeaponType.BlueBeast,
        WeaponType.BlueBow,
        WeaponType.BlueDagger,
        WeaponType.Axe,
        WeaponType.GreenTome,
        WeaponType.GreenBreath,
        WeaponType.GreenBeast,
        WeaponType.GreenBow,
        WeaponType.GreenDagger,
        WeaponType.Staff,
        WeaponType.ColorlessTome,
        WeaponType.ColorlessBreath,
        WeaponType.ColorlessBeast,
        WeaponType.ColorlessBow,
        WeaponType.ColorlessDagger,
    ];
    let i = 0;
    for (let type of weaponTypes) {
        if (type == weaponType) {
            return i;
        }
        ++i;
    }
    return -1;
}

const WeaponRefinementType =
{
    None: -1,
    Hp5_Atk2: 0,
    Hp5_Spd3: 1,
    Hp5_Def4: 3,
    Hp5_Res4: 4,
    Hp2_Atk1: 5,
    Hp2_Spd2: 6,
    Hp2_Def3: 7,
    Hp2_Res3: 8,
    Special_Hp3: 9,
    Special: 10,
    WrathfulStaff: 11, // 神罰の杖
    DazzlingStaff: 12, // 幻惑の杖
};
function weaponRefinementTypeToString(type) {
    switch (type) {
        case WeaponRefinementType.None: return "-";
        case WeaponRefinementType.Hp5_Atk2: return "HP+5 攻撃+2";
        case WeaponRefinementType.Hp5_Spd3: return "HP+5 速さ+3";
        case WeaponRefinementType.Hp5_Def4: return "HP+5 守備+4";
        case WeaponRefinementType.Hp5_Res4: return "HP+5 魔防+4";
        case WeaponRefinementType.Hp2_Atk1: return "HP+2 攻撃+1";
        case WeaponRefinementType.Hp2_Spd2: return "HP+2 速さ+2";
        case WeaponRefinementType.Hp2_Def3: return "HP+2 守備+3";
        case WeaponRefinementType.Hp2_Res3: return "HP+2 魔防+3";
        case WeaponRefinementType.Special_Hp3: return "HP+3 特殊";
        case WeaponRefinementType.Special: return "特殊";
        case WeaponRefinementType.WrathfulStaff: return "神罰の杖";
        case WeaponRefinementType.DazzlingStaff: return "幻惑の杖";
    }
}


const EffectiveType = {
    None: -1,
    Armor: 0,
    Infantry: 1,
    Cavalry: 2,
    Flying: 3,
    Dragon: 4,
    Beast: 5,
    Tome: 6,
    Sword: 7,
    Lance: 8,
    Axe: 9,
    ColorlessBow: 10,
}

const Weapon = {
    None: -1,

    SilverSwordPlus: 4, // 銀の剣+

    MerankoryPlus: 1016, // メランコリー+
    ReginRave: 1027, // レギンレイヴ
    TsubakiNoKinnagitou: 1030, // ツバキの金薙刀
    ByakuyaNoRyuuseki: 1031, // 白夜の竜石
    YumikishiNoMiekyu: 1032, // 弓騎士の名弓
    RyusatsuNoAnkiPlus: 1033, // 竜殺の暗器+
    KishisyogunNoHousou: 1035, // 騎士将軍の宝槍
    KurohyoNoYari: 1047, // 黒豹の槍
    MogyuNoKen: 1048, // 猛牛の剣
    SaizoNoBakuenshin: 1050, // サイゾウの爆炎針
    PieriNoSyousou: 1051, // ピエリの小槍
    DokuNoKen: 1060, // 毒の剣
    KachuNoYari: 1063, // 華冑の槍
    HimekishiNoYari: 1064, // 姫騎士の槍
    Tangurisuni: 1071, // タングリスニ
    AirisuNoSyo: 837, // アイリスの書
    LunaArc: 888, // 月光
    AstraBlade: 1018, // 流星
    DireThunder: 264, // ダイムサンダ
    Meisterschwert: 54, // マスターソード
    GinNoHokyu: 878, // 銀の宝弓
    MasterBow: 1020, // マスターボウ
    YushaNoYumiPlus: 185, // 勇者の弓+
    BraveAxe: 131, // 勇者の斧+
    BraveLance: 80,// 勇者の槍+
    BraveSword: 10,// 勇者の剣+
    Amite: 34, // アミーテ
    BerkutsLance: 94,
    BerkutsLancePlus: 95, // ベルクトの槍+
    FlowerOfJoy: 1058, // 幸福の花(ピアニー)
    Urvan: 145, // ウルヴァン

    SplashyBucketPlus: 818, // 神泉の風呂桶+
    RagnellAlondite: 1042, //ラグネル＆エタルド
    LightningBreath: 394, // 雷のブレス
    LightningBreathPlus: 399, // 雷のブレス+
    LightBreath: 393,
    LightBreathPlus: 398, // 光のブレス+
    Sogun: 214,
    RauaAuru: 236,
    RauaAuruPlus: 237,
    GurunAuru: 313,
    GurunAuruPlus: 314,
    BuraAuru: 268,
    BuraAuruPlus: 269, // ブラーアウル

    YoiyamiNoDanougi: 383,
    YoiyamiNoDanougiPlus: 384, // 宵闇の団扇+
    RyokuunNoMaiougi: 385,
    RyokuunNoMaiougiPlus: 386, // 緑雲の舞扇+
    SeitenNoMaiougi: 387, // 青天の舞扇
    SeitenNoMaiougiPlus: 388, // 青天の舞扇+

    Hlidskjalf: 350, // フリズスキャルヴ
    AversasNight: 254, // インバースの暗闇

    KatarinaNoSyo: 252,// カタリナの書
    Ora: 265, // オーラ
    KyomeiOra: 272, // 共鳴オーラ
    ButosaiNoGakuhu: 275,
    ButosaiNoGakuhuPlus: 276, // 舞踏祭の楽譜
    Seini: 279, // セイニー
    Ivarudhi: 284, // イーヴァルディ
    Naga: 309, // ナーガ
    ButosaiNoWa: 318,
    ButosaiNoWaPlus: 319, // 舞踏祭の輪+
    SeisyoNaga: 320, // 聖書ナーガ
    Blizard: 324, // ブリザード
    MuninNoMaran: 328, // ムニンの魔卵
    RaisenNoSyo: 329, // 雷旋の書
    Forusethi: 332, // フォルセティ
    Absorb: 334,
    AbsorbPlus: 341, // アブソーブ+
    Fear: 339,
    FearPlus: 342, // フィアー+
    Slow: 336,
    SlowPlus: 343, // スロウ+
    Gravity: 335, // グラビティ
    GravityPlus: 344, // グラビティ+
    Sekku: 353, // セック
    ButosaiNoSensu: 367,
    ButosaiNoSensuPlus: 368, // 舞踏祭の扇子
    Kagamimochi: 371, // 鏡餅
    KagamimochiPlus: 372, // 鏡餅+

    Death: 899,  // デス
    Pain: 338,
    PainPlus: 345, // ペイン+
    SeireiNoHogu: 788, // 清冷の法具
    WindsBrand: 327, // 深き印の風
    TemariPlus: 1084, // 手毬+

    GrimasTruth: 247, // 魔書ギムレー+

    FuginNoMaran: 289, // フギンの魔卵
    GunshinNoSyo: 290, // 軍神の書
    OrdinNoKokusyo: 296, //オーディンの黒書
    Arrow: 298, // アロー
    DawnSuzu: 253, // 暁天の神楽鈴
    Excalibur: 308, // エクスカリバー
    DarkExcalibur: 315, // 共鳴エクスカリバー
    Forblaze: 248, // フォルブレイズ
    FlameSiegmund: 109, // 炎槍ジークムント
    ChaosManifest: 866, // 負の力
    Missiletainn: 297,//魔書ミストルティン

    HanasKatana: 1049, // カザハナの麗刀
    Sinmara: 765, // シンモラ

    TenteiNoHado: 955,
    DivineMist: 409, // 神霧のブレス
    SnowsGrace: 1067, // 神祖の恵み
    RazingBreath: 897, // 断絶のブレス
    DivineBreath: 913, // 神竜王のブレス

    ShirasagiNoTsubasa: 806, // 白鷺の翼
    EtherealBreath: 996, // 異空のブレス
    Gjallarbru: 910, // ギャッラルブルー
    NewFoxkitFang: 1087, // 新年の妖狐娘の爪牙
    NewBrazenCatFang: 1089, // 新年の戦猫の爪牙
    AkaiAhiruPlus: 816,//赤いアヒル
    KenhimeNoKatana: 58,//剣姫の刀
    GigaExcalibur: 331, //ギガスカリバー

    GunshiNoFusho: 782, // 軍師の風書
    GunshiNoRaisyo: 781, // 軍師の雷書
    TharjasHex: 834, // サーリャの禁呪
    Blarblade: 260, // ブラーブレード
    BlarbladePlus: 261, // ブラーブレード+
    Gronnblade: 303, // グルンブレード
    GronnbladePlus: 304, // グルンブレード+ 
    Rauarblade: 229, // ラウアブレード
    RauarbladePlus: 230, // ラウアブレード+
    KeenGronnwolfPlus: 323, // グルンウルフ鍛+
    ArmorsmasherPlus: 40, // アーマーキラー鍛+

    Blarraven: 262,
    BlarravenPlus: 263, // ブラーレイヴン+
    Gronnraven: 305,
    GronnravenPlus: 306,
    Rauarraven: 231,
    RauarravenPlus: 232,

    Blarserpent: 287,
    BlarserpentPlus: 288, // ブラーサーペント+
    GronnserpentPlus: 851,
    RauarserpentPlus: 1025,

    AsahiNoKen: 7,
    AsahiNoKenPlus: 8, // 旭日の剣+
    SoukaiNoYari: 77,
    SoukaiNoYariPlus: 78, // 蒼海の槍+
    ShinryokuNoOno: 128,
    ShinryokuNoOnoPlus: 129, // 深緑の斧+

    Watou: 11,
    WatouPlus: 12, // 倭刀+
    Wabo: 110,
    WaboPlus: 111, // 倭鉾+
    BigSpoon: 159,
    BigSpoonPlus: 160,
    Wakon: 168,
    WakonPlus: 169, // 倭棍+
    TankyuPlus: 852, // 短弓+
    BabyCarrot: 375,
    BabyCarrotPlus: 376, // ベビーキャロット+

    MitteiNoAnki: 944, // 密偵の暗器
    YouheidanNoNakayari: 946, // 傭兵団の長槍
    KouketsuNoSensou: 949, // 高潔の戦槍
    BouryakuNoSenkyu: 951, // 謀略の戦弓
    Flykoogeru: 959, // フライクーゲル
    SyuryouNoEijin: 963, // 狩猟の鋭刃
    BerukaNoSatsufu: 966, // ベルカの殺斧
    KinsekiNoSyo: 968, // 金石の書
    SarieruNoOkama: 969, // サリエルの大鎌
    Veruzandhi: 984, // ヴェルザンディ
    GengakkiNoYumiPlus: 986, // 弦楽器の弓+
    KokkiNoKosou: 993, // 黒騎の孤槍
    Merikuru: 997, // メリクル
    MagetsuNoSaiki: 1002, // 魔月の祭器
    SyugosyaNoKyofu: 1011, // 守護者の巨斧
    Taiyo: 1014, // 太陽

    VezuruNoYoran: 1168, // ヴェズルの妖卵

    Sukurudo: 59, // スクルド
    CandyStaff: 351, // キャンディの杖
    CandyStaffPlus: 352, // キャンディの杖+
    Sekuvaveku: 1113, // セクヴァヴェク
    SyungeiNoKenPlus: 794, // 迎春の剣+
    RunaNoEiken: 965, // ルーナの鋭剣
    MaryuNoBreath: 856, // 魔竜のブレス
    GhostNoMadosyo: 321, // ゴーストの魔導書
    GhostNoMadosyoPlus: 322, // ゴーストの魔導書+
    MonstrousBow: 200, // 怪物の弓
    MonstrousBowPlus: 201, // 怪物の弓
    EnkyoriBougyoNoYumiPlus: 202, // 遠距離防御の弓+

    WingSword: 46, // ウイングソード
    Romfire: 112, // ロムファイア
    SyunsenAiraNoKen: 37, // 瞬閃アイラの剣

    KabochaNoOno: 174, // カボチャの斧
    KabochaNoOnoPlus: 175, // カボチャの斧+
    KoumoriNoYumi: 217,
    KoumoriNoYumiPlus: 218,
    KajuNoBottle: 390,
    KajuNoBottlePlus: 391,
    CancelNoKenPlus: 1054, // キャンセルの剣+
    CancelNoYariPlus: 1138, // キャンセルの槍+
    CancelNoOno: 1165,
    CancelNoOnoPlus: 1164, // キャンセルの斧+

    MaritaNoKen: 1052, // マリータの剣
    KyoufuArmars: 156, // 狂斧アルマーズ

    Urur: 146, // ウルズ
    WeirdingTome: 277, // 奇異ルーテの書
    TaguelFang: 847, // タグエルの爪牙
    FellBreath: 821, // 邪神のブレス
    BookOfShadows: 761, // 泡影の書
    NinissIceLance: 972, // 氷精ニニスの槍
    Ifingr: 998, // イーヴィングル
    Fimbulvetr: 1041, // フィンブル
    Mulagir: 199, // ミュルグレ

    Randgrior: 1151, // ランドグリーズ
    HadesuOmega: 1155, // ハデスΩ

    Mogprasir: 983, // メグスラシル
    LegionsAxe: 137, // ローローの斧
    LegionsAxePlus: 138,
    Panic: 337,
    PanicPlus: 346, // パニック+
    Scadi: 207, // スカディ
    FoxkitFang: 845, // 妖狐娘の爪牙
    BrazenCatFang: 870, // 剛なる戦猫の爪牙

    FiresweepSword: 42,
    FiresweepSwordPlus: 43,
    FiresweepLance: 88,
    FiresweepLancePlus: 89,
    FiresweepBow: 188,
    FiresweepBowPlus: 189, // 火薙ぎの弓+
    FiresweepAxePlus: 1024,

    Kadomatsu: 44,
    KadomatsuPlus: 45, // 門松
    Hamaya: 203,
    HamayaPlus: 204,
    Hagoita: 153,
    HagoitaPlus: 154,

    AkatsukiNoHikari: 974, // 暁の光
    KurokiChiNoTaiken: 41, // 黒き血の大剣

    MamoriNoKen: 55,
    MamoriNoKenPlus: 56,
    MamoriNoYariPlus: 854,
    MamoriNoOnoPlus: 1037, // 守りの斧+

    BariaNoKen: 62, // バリアの剣
    BariaNoKenPlus: 63,
    BariaNoYariPlus: 917,

    LarceisEdge: 1099, // ラクチェの流剣
    GeneiLod: 1108, // 幻影ロッド

    Durandal: 24, // デュランダル
    ArdentDurandal: 931, // 緋剣デュランダル
    FalchionAwakening: 48, // ファルシオン(覚醒)
    FalchionRefined: 47, // ファルシオン(紋章)
    FalcionEchoes: 49, // ファルシオン(Echoes)
    Balmung: 1093, // バルムンク
    ImbuedKoma: 1090, // 神宿りの独楽
    Ragnarok: 235, // ライナロック
    HokenSophia: 50,// 宝剣ソフィア
    Bashirikosu: 155, // バシリコス
    KageroNoGenwakushin: 1046, // カゲロウの眩惑針

    GaeBolg: 119, //ゲイボルグ
    BlazingDurandal: 33, // 烈剣デュランダル
    SyugosyaNoRekkyu: 1039, // 守護者の烈弓
    WagasaPlus: 798, // 和傘+
    KumadePlus: 796, // 熊手+
    KarasuOuNoHashizume: 812, // 鴉王の嘴爪
    ShinenNoBreath: 402, // 神炎のブレス
    TakaouNoHashizume: 804, // 鷹王の嘴爪

    MiraiNoSeikishiNoYari: 942, // 未来の聖騎士の槍
    ShiseiNaga: 980, // 至聖ナーガ
    Thirufingu: 23, // ティルフィング
    Sangurizuru: 970, // サングリズル

    Pesyukado: 373, // ペシュカド
    FerisiaNoKorizara: 374, // フェリシアの氷皿
    AnsatsuSyuriken: 377,
    AnsatsuSyurikenPlus: 378,//暗殺手裏剣+
    SyukuseiNoAnki: 379,
    SyukuseiNoAnkiPlus: 380, // 粛清の暗器+
    FurasukoPlus: 1003, // フラスコ+
    KabochaNoGyotoPlus: 1005, // カボチャの行灯+
    BikkuriBakoPlus: 1007, // びっくり箱+
    RosokuNoYumiPlus: 1010, // ロウソクの弓+
    HankoNoYari: 116, // 反攻の槍
    HankoNoYariPlus: 117, // 反攻の槍+
    HadoNoSenfu: 947, // 覇道の戦斧
    MagoNoTePlus: 814, // 孫の手+
    KizokutekinaYumi: 1013, // 貴族的な弓

    Seiju: 104,
    SeijuPlus: 105, // 聖樹+
    HandBell: 149,
    HandBellPlus: 150, // ハンドベル+
    PresentBukuro: 151,
    PresentBukuroPlus: 152, // プレゼント袋+
    Syokudai: 243,
    SyokudaiPlus: 244, // 燭台+

    ShirokiChiNoNaginata: 103, // 白き血の薙刀

    Arumazu: 134, // アルマーズ
    Marute: 118, // マルテ
    HuinNoKen: 18, // 封印の剣
    MoumokuNoYumi: 903, // 盲目の弓
    Puji: 1056, // プージ
    Forukuvangu: 15, // フォルクバング

    NinjinNoYari: 83, // ニンジンの槍
    NinjinNoYariPlus: 84,
    NinjinNoOno: 135,
    NinjinNoOnoPlus: 136, // ニンジンの斧
    AoNoTamago: 266,
    AoNoTamagoPlus: 267,// 青の卵
    MidoriNoTamago: 310,
    MidoriNoTamagoPlus: 311,// 緑の卵

    HigasaPlus: 945, // 日傘+
    TairyoNoYuPlus: 938, // 大漁の弓+
    KaigaraNoNaifuPlus: 934, // 貝殻のナイフ+

    Kasaburanka: 107,
    KasaburankaPlus: 108, // カサブランカ+
    Grathia: 205,
    GrathiaPlus: 206,
    AoNoPresentBukuro: 285,
    AoNoPresentBukuroPlus: 286,
    MidoriNoPresentBukuro: 325,
    MidoriNoPresentBukuroPlus: 326,
    YamaNoInjaNoSyo: 943, // 山の隠者の書

    FirstBite: 85,
    FirstBitePlus: 86, // ファーストバイト
    KyupittoNoYa: 190,
    KyupittoNoYaPlus: 191, // キューピットの矢
    SeinaruBuke: 270,
    SeinaruBukePlus: 271, // 聖なるブーケ

    SakanaWoTsuitaMori: 90, // 魚を突いた銛
    SakanaWoTsuitaMoriPlus: 91,
    SuikaWariNoKonbo: 139,
    SuikaWariNoKonboPlus: 140, // スイカ割りの棍棒
    KorigashiNoYumi: 194,
    KorigashiNoYumiPlus: 195, // 氷菓子の弓
    Kaigara: 365,
    KaigaraPlus: 366, // 貝殻

    KaigaraNoYari: 113,
    KiagaraNoYariPlus: 114,
    BeachFlag: 164,
    BeachFlagPlus: 165,
    YashiNoMiNoYumi: 210,
    YashiNoMiNoYumiPlus: 211,

    HuyumatsuriNoBootsPlus: 780, // 冬祭のブーツ+
    KiraboshiNoBreathPlus: 774, // 綺羅星のブレス+
    GinNoGobulettoPlus: 990, // 銀のゴブレット+

    NifuruNoHyoka: 330, // ニフルの氷花
    MusuperuNoEnka: 250, // ムスペルの炎花

    RirisuNoUkiwa: 141,
    RirisuNoUkiwaPlus: 142,
    TomatoNoHon: 238,
    TomatoNoHonPlus: 239,
    NettaigyoNoHon: 273,
    NettaigyoNoHonPlus: 274,
    HaibisukasuNoHon: 316,
    HaibisukasuNoHonPlus: 317,

    SakanaNoYumi: 212,
    SakanaNoYumiPlus: 213,
    NangokuJuice: 294,
    NangokuJuicePlus: 295,
    Hitode: 381,
    HitodePlus: 382,
    SoulCaty: 22,

    FuyumatsuriNoStickPlus: 1073, // 冬祭のステッキ+
    ChisanaSeijuPlus: 1065,
    SeirinNoKenPlus: 1069,

    SyukusaiNoOnoPlus: 824,
    AoNoHanakagoPlus: 826,
    MidoriNoHanakagoPlus: 828,
    SyukusaiNoKenPlus: 830,
    HanawaPlus: 831,

    UminiUkabuItaPlus: 922,
    NangokuNoKajitsuPlus: 924,
    SunahamaNoScopPlus: 928,
    SunahamaNoKuwaPlus: 930,

    HarorudoNoYufu: 1062,
    RebbekkaNoRyoukyu: 1103,

    SaladaSandPlus: 887,
    KorakuNoKazariYariPlus: 882,

    FlowerStandPlus: 904,
    CakeKnifePlus: 906,
    SyukuhaiNoBottlePlus: 908,
    SyukuhukuNoHanaNoYumiPlus: 912,
    KazahanaNoReitou: 1049, // カザハナの麗刀

    TetsuNoAnki: 354,
    DouNoAnki: 355,
    GinNoAnki: 356,
    GinNoAnkiPlus: 357,
    ShienNoAnki: 358,
    ShienNoAnkiPlus: 359,
    RogueDagger: 360, // 盗賊の暗器
    RogueDaggerPlus: 361,
    PoisonDagger: 362, // 秘毒の暗器
    PoisonDaggerPlus: 363,
    KittyPaddle: 369, // 猫の暗器
    KittyPaddlePlus: 370,
    DeathlyDagger: 364, // 死神の暗器

    MakenMistoruthin: 57,
    Mistoruthin: 17, // ミストルティン
    Misteruthin: 67, // ミステルトィン

    Candlelight: 340, // キャンドルサービス
    CandlelightPlus: 347, // キャンドル+
    FlashPlus: 758, // フラッシュ+
    Trilemma: 348,
    TrilemmaPlus: 349, // トリレンマ+

    AiNoCakeServa: 162, // 愛のケーキサーバ
    AiNoCakeServaPlus: 163,
    KiyorakanaBuke: 292,// 清らかなブーケ
    KiyorakanaBukePlus: 293,
    Byureisuto: 173, //ビューレイスト

    Otokureru: 133, // オートクレール
    MumeiNoIchimonNoKen: 52, // 無銘の一門の剣
    KieiWayuNoKen: 38, // 気鋭ワユの剣
    SyaniNoSeisou: 801, // シャニーの誓槍
    Toron: 877, // トローン
    IhoNoHIken: 1029, // 異邦の秘剣

    DevilAxe: 1132, // デビルアクス
    TenmaNoNinjinPlus: 857, // 天馬のニンジン
    TenteiNoKen: 953, //天帝の剣
    AnkokuNoKen: 891, // 暗黒の剣
    Vorufuberugu: 170, // ヴォルフベルグ
    Yatonokami: 19, // 夜刀神
    RyukenFalcion: 977, // 竜剣ファルシオン
    RaikenJikurinde: 68, // 雷剣ジークリンデ
    Jikurinde: 21, // ジークリンデ
    Reipia: 991, // レイピア
    AsameiNoTanken: 958, // アサメイの短剣
    FurederikuNoKenfu: 1012, // フレデリクの堅斧
    JokerNoSyokki: 1129, // ジョーカーの食器
    BukeNoSteckPlus: 1125, // ブーケのステッキ+
    AijouNoHanaNoYumiPlus: 1122, // 愛情の花の弓+
    Paruthia: 187, // パルティア
    TallHammer: 291, // トールハンマー
    RohyouNoKnife: 389, // 露氷のナイフ
    YoukoohNoTsumekiba: 843, // 妖狐王の爪牙
    JunaruSenekoNoTsumekiba: 869, // 柔なる戦猫の爪牙
    RauaFoxPlus: 960, // ラウアフォックス+
    KinranNoSyo: 967, // 金蘭の書
    GeneiFalcion: 1112, // 幻影ファルシオン
    HyosyoNoBreath: 1134, // 氷晶のブレス
    EishinNoAnki: 1140, // 影身の暗器
    ChichiNoSenjutsusyo: 1131, // 父の戦術書
    RazuwarudoNoMaiken: 1130, // ラズワルドの舞剣
    YujoNoHanaNoTsuePlus: 1128,// 友情の花の杖 
    AiNoSaiki: 1126, // 愛の祭器
    BaraNoYari: 1123, // 薔薇の槍
    GeneiFeather: 1110, // 幻影フェザー
    GeneiBattleAxe: 1106, // 幻影バトルアクス
    GeneiLongBow: 1104, // 幻影ロングボウ
    ThiamoNoAisou: 1102, // ティアモの愛槍
    KokukarasuNoSyo: 1101, // 黒鴉の書
    ShirejiaNoKaze: 1097, // シレジアの風
    ChisouGeiborugu: 1096, // 地槍ゲイボルグ
    KinunNoYumiPlus: 1085, // 金運の弓+
    TenseiAngel: 1075, // 天聖エンジェル
    AsuNoSEikishiNoKen: 941, // 明日の聖騎士の剣
    ZekkaiNoSoukyu: 940, // 絶海の蒼弓
    HaNoOugiPlus: 936, // 葉の扇+
    YonkaiNoSaiki: 926, // 四海の祭器
    ShintakuNoBreath: 920, // 神託のブレス
    TaguelChildFang: 916, // タグエルの子の爪牙
    FutsugyouNoYari: 902, // 払暁の槍
    WakakiMogyuNoYari: 901, // 若き猛牛の槍
    WakakiKurohyoNoKen: 900, // 若き黒豹の槍
    BoranNoBreath: 895, // 暴乱のブレス
    Kurimuhirudo: 893, // クリムヒルド
    Erudofurimuniru: 886, // エルドフリムニル
    MasyumaroNoTsuePlus: 884, // マシュマロの杖+
    Saferimuniru: 880, // セーフリムニル
    YukyuNoSyo: 879, // 悠久の書
    ShishiouNoTsumekiba: 874, // 獅子王の爪牙
    TrasenshiNoTsumekiba: 872, // 虎戦士の爪牙
    HaruNoYoukyuPlus: 865, // 春の妖弓
    FeruniruNoYouran: 863, // フェルニルの妖卵
    TamagoNoTsuePlus: 861, // 卵の杖+
    HisenNoNinjinYariPlus: 859, // 緋閃のニンジン槍+
    MaryuHuinNoKen: 848, // 魔竜封印の剣
    JinroMusumeNoTsumekiba: 841, // 人狼娘の爪牙
    JinroOuNoTsumekiba: 839, // 人狼王の爪牙
    ZeroNoGyakukyu: 838, // ゼロの虐弓
    GuradoNoSenfu: 836, // グラドの戦斧
    OboroNoShitsunagitou: 835, // オボロの漆薙刀
    ShinginNoSeiken: 833, // 真銀の聖剣
    HinataNoMoutou: 832, // ヒナタの猛刀
    KinchakubukuroPlus: 820, // 巾着袋+
    NorenPlus: 813, // のれん+
    OkamijoouNoKiba: 809, // 狼女王の牙
    BatoruNoGofu: 802, // バアトルの豪斧
    FurorinaNoSeisou: 800, // フロリーナの誓槍
    OgonNoTanken: 799, // 黄金の短剣
    Hyoushintou: 792, // 氷神刀
    TekiyaPlus: 791, // 鏑矢+
    ShirokiNoTansou: 787, // 白騎の短槍
    ShirokiNoTyokusou: 786, // 白騎の直槍
    ShirokiNoTyouken: 785, // 白騎の長剣
    AkaNoKen: 784, // 紅の剣
    KentoushiNoGoken: 783, // 剣闘士の剛剣
    RantanNoTsuePlus: 778, // ランタンの杖+
    GousouJikumunto: 776, // 業槍ジークムント
    Rifia: 771, // リフィア
    Gyorru: 769, // ギョッル
    Mafu: 768, // マフー
    Syurugu: 763, // シュルグ
    MugenNoSyo: 759, // 夢幻の書
    MizuNoHimatsu: 755, // 水の飛沫
    SeireiNoBreath: 410, // 精霊のブレス
    AnyaryuNoBreath: 408, // 暗夜竜のブレス
    ManatsuNoBreath: 407, // 真夏のブレス
    KiriNoBreath: 406, // 霧のブレス
    MizuNoBreathPlus: 405, // 水のブレス+
    MizuNoBreath: 404, // 水のブレス
    JaryuNoBreath: 403, // 邪竜のブレス
    YamiNoBreathPlus: 400, // 闇のブレス+
    YamiNoBreath: 395, // 闇のブレス
    IzunNoKajitsu: 251, // イズンの果実
    Roputous: 249, // ロプトウス
    Nagurufaru: 246, // ナグルファル
    Gureipuniru: 245, // グレイプニル
    Gurimowaru: 241, // グリモワール
    Faraflame: 240, // ファラフレイム
    Simuberin: 234, // シムベリン
    Buryunhirude: 233, // ブリュンヒルデ
    ShiningBowPlus: 216, // シャイニングボウ+
    ShiningBow: 215,
    ShikkyuMyurugure: 209, // 疾弓ミュルグレ
    SenhimeNoWakyu: 208, // 戦姫の和弓
    Nizuheggu: 198, // ニーズヘッグ
    KuraineNoYumiPlus: 193, // クライネの弓
    KuraineNoYumi: 192,
    FujinYumi: 186, // 風神弓
    AnkigoroshiNoYumiPlus: 183, // 暗器殺しの弓
    AnkigoroshiNoYumi: 182,
    SerujuNoKyoufu: 172, // セルジュの恐斧
    Garumu: 171, // ガルム
    YoheidanNoSenfu: 167, // 傭兵団の戦斧
    TenraiArumazu: 166, // 天雷アルマーズ
    KamiraNoEnfu: 161, // カミラの艶斧
    Noatun: 132, // ノーアトゥーン
    GiyuNoYari: 115, // 義勇の槍
    HinokaNoKounagitou: 106, // ヒノカの紅薙刀
    Geirusukeguru: 98, // ゲイルスケグル
    Vidofuniru: 97, // ヴィドフニル
    MasyouNoYari: 96, // 魔性の槍
    Jikumunt: 82, // ジークムント
    Fensariru: 81, // フェンサリル
    KokouNoKen: 66, // 孤高の剣
    Niu: 65, // ニーウ
    Revatein: 64, // レーヴァテイン
    ShinkenFalcion: 61, // 神剣ファルシオン
    OukeNoKen: 60, // 王家の剣
    HikariNoKen: 53, // 光の剣
    FukenFalcion: 51, // 封剣ファルシオン
    SeikenThirufingu: 36, // 聖剣ティルフィング
    Rigarublade: 28, // リガルブレイド
    Ekkezakkusu: 26, // エッケザックス

    Uchikudakumono: 1158, // 打ち砕くもの
    HigaimosoNoYumi: 1160, // 被害妄想の弓
    GrayNoHyouken: 1161, // グレイの飄剣
    SuyakuNoKen: 1162, // 雀躍の剣
    KokyousyaNoYari: 1163, // 古強者の槍

    HakutoshinNoNinjin: 1170, // 白兎神の人参
    OgonNoFolkPlus: 1171, // 黄金のフォーク+
    HarukazeNoBreath: 1173, // 春風のブレス
    NinjinhuNoSosyokuPlus: 1175, // 人参風の装飾+

    VoidTome: 1176, // 絶無の書
    SpendthriftBowPlus: 1179, // お大尽の弓+
    RinkahNoOnikanabo: 1180, // リンカの鬼金棒
    AstralBreath: 1183, // 星竜のブレス

    SatougashiNoAnki: 1187, // 砂糖菓子の暗器
    AokarasuNoSyo: 1185, // 蒼鴉の書
    RosenshiNoKofu: 1186, // 老戦士の古斧
    IagosTome: 1188, // マクベスの惑書

    FeatherSword: 1234, // フェザーソード
    WindsOfChange: 1236, // 予兆の風
    WhitedownSpear: 1238, // 白き飛翔の槍

    AkaiRyukishiNoOno: 1288, // 赤い竜騎士の斧

    SeijuNoKeshinHiko: 1299, // 成獣の化身・飛行

    Aymr: 1302, // アイムール
    ChaosRagnell: 1308, // 混沌ラグネル
    DarkScripture: 1311, // 暗黒の聖書
    BloodTome: 1313, // 魔王の血書
    BrutalBreath: 1315, // 獣乱のブレス
    KarenNoYumi: 1305, // 佳麗の弓
    RuneAxe: 1306, // ルーンアクス
    JukishiNoJuso: 1307, // 重騎士の重槍

    Gurgurant: 1317, // グルグラント
    BridesFang: 1318, // 狼花嫁の牙
    PledgedBladePlus: 1320, // 花嫁の護刀+
    GroomsWings: 1322, // 白鷺花嫁の翼
    JoyfulVows: 1323, // 幸せの誓約
    HugeFanPlus: 1324, // 大きな扇子+
    DaichiBoshiNoBreath: 1350, // 大地母神のブレス
    ApotheosisSpear: 1356, // 裏の五連闘の宝槍
    Amatsu: 1358, // アマツ
    BarrierAxePlus: 1360, // バリアの斧+
    FlowerOfEase: 1361, // 微睡の花の剣
    LevinDagger: 1363, // サンダーダガー
    HewnLance: 1348, // ドニの朴槍
    SnipersBow: 1349, // 狙撃手の弓
    StalwartSword: 1347, // 忠臣の剣
    ExoticFruitJuice: 1366, // 楽園の果汁
    CoralBowPlus: 1368, // サンゴの弓+
    FloraGuidPlus: 1370, // 植物図鑑+
    SummerStrikers: 1372, // 一夏の神宝
    YashiNoKiNoTsuePlus: 1374, // ヤシの木の杖+
    VirtuousTyrfing: 1375, // 至聖ティルフィング
    StarpointLance: 1377, // 海角の星槍
    HiddenThornsPlus: 1379, // 花の髪飾り+
    MelonFloatPlus: 1381, // メロンフロート+
    ConchBouquetPlus: 1386, // ほら貝のブーケ+
    SunsPercussors: 1382, // 盛夏の神宝
    MeikiNoBreath: 1383, // 冥輝のブレス
    KurooujiNoYari: 1384, // 黒皇子の槍
    BenihimeNoOno: 1385, // 紅姫の斧
    KyupidNoYaPlus: 1388, // キューピットの矢+
    BladeOfShadow: 1390, // 影の英雄の剣
    SpearOfShadow: 1393, // 影の英雄の槍
    CaltropDaggerPlus: 1392, // 騎殺の暗器+
    HelsReaper: 1419, // 死鎌ヘル
    TomeOfOrder: 1436, // 魔道軍将の書
    SneeringAxe: 1437, // 笑面の斧
    SetsunasYumi: 1438, // セツナの緩弓
    SkyPirateClaw: 1423, // 天空の海賊の嘴爪
    HelmBowPlus: 1425, // 舵の弓+
    FlowingLancePlus: 1426, // 風見鶏の槍+
    GateAnchorAxe: 1427, // 波閉ざす錨の斧
    DeckSwabberPlus: 1429, // デッキブラシ+
    DarkSpikesT: 1445, // ダークスパイクT
    WindParthia: 1446, // 翠風パルティア
    MoonGradivus: 1449, // 蒼月グラディウス
    FlowerHauteclere: 1452, // 紅花オートクレール
    DanielMadeBow: 1447, // ダニエルの錬弓

    PrimordialBreath: 1468, // 神祖竜のブレス

    CourtlyMaskPlus: 1470, // 高貴な仮面+
    CourtlyFanPlus: 1472, // 高貴な扇+
    CourtlyBowPlus: 1474, // 高貴な弓+
    CourtlyCandlePlus: 1478, // 高貴な燭台+
    GiltGoblet: 1476, // 黄金のゴブレット

    // 絶望そして希望
    TalreganAxe: 1484, // ダルレカの激斧
    DoubleBow: 1480, // バルフレチェ
    SpiritedSpearPlus: 1482, // 士気旺盛の槍+
    BlarfoxPlus: 1479, // ブラーフォックス+
    FlameLance: 1486, // フレイムランス

    // プルメリア
    FlowerOfPlenty: 1488, // 豊潤の花

    // 竜たちの収穫祭
    MoonlessBreath: 1491, // 暁闇のブレス
    JokersWild: 1494, // 変身のカード
    BlackfireBreathPlus: 1496, // 黒夜のブレス+
    FrostfireBreath: 1498, // 蒼紅のブレス
    PaleBreathPlus: 1500, // 灰明のブレス+

    // 2020年10月錬成
    ObsessiveCurse: 1502, // 執念の呪
    EffiesLance: 1503, // エルフィの大槍

    // 2020年11月錬成
    EternalBreath: 1516, // 悠久のブレス
    ElisesStaff: 1517, // エリーゼの幼杖

    // 女神の僕たる者たち
    Thunderbrand: 1504, // 雷霆
    CaduceusStaff: 1505, // カドゥケウスの杖
    SpearOfAssal: 1508, // アッサルの槍
    SurvivalistBow: 1509, // 生存本能の弓

    DarkCreatorS: 1511, // 天帝の闇剣

    // 2020年10月末伝承ディミトリ
    Areadbhar: 1513, // アラドヴァル

    // 平常心の極意
    TwinStarAxe: 1518, // 業火の双斧

    // ベルンの王女
    InstantLancePlus: 1528, // 瞬撃の槍+
    TigerRoarAxe: 1526, // 虎の剛斧
    Aureola: 1530, // アーリアル

    // 2020年11月末 フレイヤ・スカビオサ
    NightmareHorn: 1539, // 悪夢の女王の角
    FlowerOfSorrow: 1536, // 不幸の花

    // 2020年12月第5部開幕記念
    TomeOfStorms: 1545, // 万雷の書
    ObsidianLance: 1543, // 黒曜の槍
    Lyngheior: 1541, // リュングヘイズ
    ReprisalAxePlus: 1547, // 反攻の斧+

    // 2020年12月武器錬成
    PurifyingBreath: 1567, // 天真のブレス
    ElenasStaff: 1566, // エルナの杖
    TomeOfFavors: 1565, // 寵愛の書

    // 聖なる夜の奇跡
    TannenbatonPlus: 1568, // 聖樹の杖+
    Hrist: 1571, // フリスト
    CandyCanePlus: 1572, // キャンディケイン+
    ReindeerBowPlus: 1576, // トナカイの弓+

    // 2020年12月末 伝承リリーナ
    StudiedForblaze: 1581, // 業炎フォルブレイズ

    // 2021年正月超英雄
    FirstDreamBow: 1583, // 甘い初夢の弓
    RenewedFang: 1585, // 賀正の人狼娘の爪牙
    RefreshedFang: 1586, // 賀正の妖狐王の爪牙
    BondOfTheAlfar: 1588, // 妖精姉妹の絆
    ResolvedFang: 1590, // 賀正の人狼王の爪牙

    // 2021年1月武器錬成
    ArdensBlade: 1591, // アーダンの固剣
    SpringtimeStaff: 1592, // 春陽の杖

    // 志を重ねて
    Grafcalibur: 1601, // グラフカリバー
    IndignantBow: 1603, // 義憤の強弓
    KiaStaff: 1605, // キアの杖
    Petrify: 1609, // ストーン

    // 熱砂の国の秘祭
    PlegianTorchPlus: 1610, // ペレジアの燭台+
    FellFlambeau: 1612, // 仄暗き邪竜の松明
    PlegianBowPlus: 1614, // ペレジアの弓+
    FellCandelabra: 1615, // 仄暗き邪痕の燭台
    PlegianAxePlus: 1618, // ペレジアの斧+

    // 2021年1月 神階セイロス
    AuroraBreath: 1620, // 極光のブレス

    // 王の愛は永遠に
    LoyalistAxe: 1635, // 護国の堅斧
    UnityBloomsPlus: 1633, // 平和の花+
    AmityBloomsPlus: 1624, // 共感の花+
    Thjalfi: 1627, // シャールヴィ
    PactBloomsPlus: 1626, // 約束の花+

    // 2021年2月 武器錬成
    SpySongBow: 1637, // 邪な曲弓
    Audhulma: 39, // アウドムラ

    // 命が刻むもの
    SilesseFrost: 1644, // シレジアの水晶
    SparkingTome: 1641, // 慕炎の書
    UnboundBlade: 1640, // 孤絶の剣
    UnboundBladePlus: 1639, // 孤絶の剣+

    // 2021年2月 伝承クロード
    Failnaught: 1646, // フェイルノート

    // フォドラの花種
    Luin: 1664, // ルーン
    SteadfastAxePlus: 1665, // 護衛の斧+
    SteadfastAxe: 1666, // 護衛の斧
    IcyFimbulvetr: 1668, // 氷槍フィンブル
    BansheeTheta: 1670, // バンシーθ

    // わがままな子兎
    LilacJadeBreath: 1676, // 紫翠のブレス
    SpringyBowPlus: 1673, // 春兎の弓+
    SpringyAxePlus: 1677, // 春兎の斧+
    SpringyLancePlus: 1674, // 春兎の槍+
    GullinkambiEgg: 1671, // グリンカムビの聖卵

    // 信頼という名の絆
    TomeOfReglay: 1689, // 銀の魔道軍将の書
    ReinBow: 1687, // 牽制の弓
    ReinBowPlus: 1686, // 牽制の弓+
    HotshotLance: 1684, // 凄腕の鋭槍

    // 幼き日の出会い
    LanceOfFrelia: 1694, // フレリアの宝槍
    StaffOfRausten: 1696, // ロストンの霊杖
    TomeOfGrado: 1698, // グラドの史書
    BladeOfRenais: 1699, // ルネスの礼剣
    BowOfFrelia: 1700, // フレリアの玉弓

    // 2021年4月　武器錬成
    Shamsir: 1682, // シャムシール
    FlowerLance: 1683, // スミアの花槍

    Skinfaxi: 1679, // スキンファクシ

    // 2021年4月 伝承シグルド
    HallowedTyrfing: 1701, // 聖裁ティルフィング

    // 暴雨の中を歩む者
    TwinCrestPower: 1704, // 双紋章の力
    VengefulLance: 1711, // 復讐鬼の槍
    TomeOfDespair: 1709, // 破滅の邪書
    AxeOfDespair: 1707, // 絶望の邪斧
    BereftLance: 1713, // 虚ろな槍

    // 2021年5月　武器錬成
    Ragnell: 27, // ラグネル
    Alondite: 35, // エタルド
    Raijinto: 20, // 雷神刀
    Siegfried: 25, // ジークフリート
    Gradivus: 87, // グラディウス

    // 愛と感謝の結婚式
    RoseQuartsBow: 1714, // 透き通る玻璃の弓
    ObservantStaffPlus: 1716, // 立会人の杖+
    LoveBouquetPlus: 1720, // 愛情のブーケ+
    WeddingBellAxe: 1718, // 幸せの鐘の斧
    LoveCandelabraPlus: 1721, // 結婚式の燭台+

    // 2021年5月 アスタルテ
    OrdersSentence: 1722, // 正の裁き

    // 第5部後半記念 新英雄＆ノート
    Hrimfaxi: 1731, // フリムファクシ
    Ladyblade: 1725, // レディソード
    HolyGradivus: 1727, // 聖槍グラディウス
    GronnfoxPlus: 1729, // グルンフォックス+
    BlarRabbitPlus: 1734, // ブラーラビット+

    // 極彩色の夏休み
    SunshadeStaff: 1736, // 夏陰の霊杖
    PeachyParfaitPlus: 1744, // フローズンパフェ+
    DivineSeaSpear: 1747, // 漁神の恵槍
    VictorfishPlus: 1742, // カツオ+
    SunflowerBowPlus: 1749, // 向日葵の弓+

    // 2021年6月 伝承ベレト
    ProfessorialText: 1751, // 師の導きの書

    // 2021年7月 武器錬成
    MaskingAxe: 1755, // 鉄面の斧
    Leiptr: 102, // レイプト
    StoutTomahawk: 147, // 剛斧トマホーク

    // あなたに夏の夢を
    BrightmareHorn: 1759, // 夏夜の悪夢の角
    RaydreamHorn: 1760, // 夏夜の夢の角
    TridentPlus: 1756, // トライデント+
    DolphinDiveAxe: 1762, // 波舞うイルカの斧
    ShellpointLancePlus: 1764, // 巻貝の槍+

    // 偽らざる明日へ＆ニフル
    SteadfastLancePlus: 1777, // 護衛の槍+
    SteadfastLance: 1778, // 護衛の槍
    FrostbiteBreath: 1772, // 絶氷のブレス
    FairFuryAxe: 1767, // 荒ぶる女子力の斧
    TigerSpirit: 1771, // 虎神・寅
    RauarRabbitPlus: 1775, // ラウアラビット+
    Ginnungagap: 1769, // ギンヌンガガプ

    // 2021年7月 神階英雄ウル
    HolyYewfelle: 1779, // 聖弓イチイバル

    // 恐るべき海賊たち
    SeaSearLance: 1790, // 炎海の灼槍
    CrossbonesClaw: 1784, // 凶兆の海賊の嘴爪
    EbonPirateClaw: 1785, // 射干玉の海賊の嘴爪
    MermaidBow: 1786, // 海泳ぐ人魚の弓
    HelmsmanAxePlus: 1783, // 操舵の斧+

    // 2021年8月 武器錬成
    PunishmentStaff: 1782, // 痛罵の杖
    LoyaltySpear: 1781, // 忠誠の槍

    // 2021年8月 希望の護り手たち
    // 男性
    GenesisFalchion: 1793, // 始祖ファルシオン
    ChargingHorn: 1802, // 突撃の角笛

    // 女性
    PhantasmTome: 1799, // 幻影の書
    BindingReginleif: 1796, // 絆槍レギンレイヴ

    // 大英雄線 ペレアス
    RauarLionPlus: 1806, // ラウアライオン+
};

const Support = {
    None: -1,
    Reposition: 413,
    Smite: 414, // ぶちかまし
    Drawback: 415, // 引き寄せ
    Shove: 424, // 体当たり
    Swap: 416, // 入れ替え
    FutureVision: 433, // 未来を移す瞳
    Pivot: 422, // 回り込み
    ToChangeFate: 1152, // 運命を変える!

    Sing: 411, // 歌う
    Dance: 412, // 踊る
    GrayWaves: 789, // ユラリユルレリ
    GentleDream: 1061, // やさしいゆめ
    WhimsicalDream: 1362, // しろいゆめ
    SweetDreams: 1489, // あまいゆめ
    FrightfulDream: 1537, // こわいゆめ
    Play: 1135, // 奏でる

    RallyAttack: 418,
    RallySpeed: 417,
    RallyDefense: 419,
    RallyResistance: 420,
    RallyAtkSpd: 426,
    RallyAtkDef: 431,
    RallyAtkRes: 428,
    RallySpdDef: 429,
    RallySpdRes: 430,
    RallyDefRes: 427,

    // 大応援
    RallyUpAtk: 435,
    RallyUpAtkPlus: 436,
    RallyUpRes: 1154,
    RallyUpResPlus: 1153,
    RallyUpSpd: 1501, // 速さの大応援
    RallyUpSpdPlus: 1499, // 速さの大応援+

    // 2種応援
    RallyAtkDefPlus: 876,
    RallyAtkResPlus: 1066,
    RallySpdResPlus: 932,
    RallySpdDefPlus: 434,
    RallyAtkSpdPlus: 756,
    RallyDefResPlus: 1001,

    Physic: 437, // リブロー
    PhysicPlus: 438, // リブロー+

    Sacrifice: 432, // 癒しの手
    Recover: 439, // リカバー
    RecoverPlus: 440, // リカバー+ 
    RestorePlus: 449, // レスト+
    HarshCommand: 423, // 一喝
    HarshCommandPlus: 905, // 一喝+

    ReciprocalAid: 425, // 相互援助
    ArdentSacrifice: 421, // 献身

    Heal: 447, // ライブ
    Reconcile: 446, // ヒール
    Rehabilitate: 441, // リバース
    RehabilitatePlus: 442, // リバース+
    Mend: 443, // リライブ

    Martyr: 444, // セインツ
    MartyrPlus: 445, // セインツ+
    Restore: 448, // レスト

    RescuePlus: 1506, // レスキュー+
    Rescue: 1512, // レスキュー
    ReturnPlus: 1606, // リターン+
    Return: 1607, // リターン
    NudgePlus: 1737, // プッシュ+
    Nudge: 1738, // プッシュ
};

const AssistType = {
    None: 0,
    Refresh: 1,
    Heal: 2,
    DonorHeal: 3,
    Restore: 4,
    Rally: 5,
    Move: 6,
};

const Special = {
    None: -1,
    Moonbow: 468,
    Luna: 467,
    Aether: 470,
    LunaFlash: 889,
    Glimmer: 462,
    Deadeye: 1481, // 狙撃
    Astra: 461,
    Bonfire: 455,
    Ignis: 450,
    Iceberg: 456,
    Glacies: 451,
    DraconicAura: 457,
    DragonFang: 452,
    Sirius: 956, // 天狼
    RupturedSky: 954, // 破天
    TwinBlades: 1043, // 双刃
    Taiyo: 493,
    Yuyo: 494,
    RegnalAstra: 465, // 剣姫の流星
    ImperialAstra: 1094, // 剣皇の流星
    OpenTheFuture: 1091, // 開世
    Fukusyu: 453, // 復讐
    Kessyu: 454, // 血讐
    Kagetsuki: 469, // 影月
    Setsujoku: 458, // 雪辱
    Hyouten: 460, // 氷点
    Youkage: 495, // 陽影
    Hotarubi: 459, // 蛍火
    HonoNoMonsyo: 466, // 炎の紋章
    HerosBlood: 1232, // 英雄の血脈
    KuroNoGekko: 471, // 黒の月光
    AoNoTenku: 472, // 蒼の天空
    RadiantAether2: 1628, // 蒼の天空・承
    MayhemAether: 1309, // 暴の天空
    Hoshikage: 463, // 星影
    Fukuryu: 464, // 伏竜
    BlueFrame: 473, // ブルーフレイム
    SeidrShell: 1542, // 魔弾

    GrowingFlame: 485,
    GrowingLight: 486,
    GrowingWind: 487,
    GrowingThunder: 488,
    BlazingFlame: 481,
    BlazingLight: 482,
    BlazingWind: 483,
    BlazingThunder: 484,
    RisingFrame: 489, // 砕火
    RisingLight: 490,
    RisingWind: 491,
    RisingThunder: 492,
    GiftedMagic: 1582, // 天与の魔道

    NjorunsZeal: 1021, // ノヴァの聖戦士
    Galeforce: 496, // 疾風迅雷
    Miracle: 497, // 祈り

    Nagatate: 477, // 長盾
    Otate: 475, // 大盾
    Kotate: 479, // 小盾
    Seitate: 474, // 聖盾
    Seii: 478, // 聖衣
    Seikabuto: 476, // 聖兜
    KoriNoSeikyo: 480, // 氷の聖鏡
    IceMirror2: 1629, // 氷の聖鏡・承

    ShippuNoSyukuhuku: 499, // 疾風の祝福
    DaichiNoSyukuhuku: 500, // 大地の祝福
    SeisuiNoSyukuhuku: 501, // 静水の祝福
    KindledFireBalm: 498, // 業火の祝福
    WindfireBalmPlus: 505, // 業火疾風の祝福+
    WindfireBalm: 504, // 業火疾風の祝福
    DelugeBalmPlus: 1507, // 疾風静水の祝福+
    DaichiSeisuiNoSyukuhuku: 506, // 大地静水の祝福
    DaichiSeisuiNoSyukuhukuPlus: 507, // 大地静水の祝福+
    GokaDaichiNoSyukuhukuPlus: 797, // 業火大地の祝福+
    GokaSeisuiNoSyukuhukuPlus: 1387, // 業火静水の祝福+
    Chiyu: 502, // 治癒
    Tensho: 503, // 天照
    RighteousWind: 1237, // 聖風
    ShiningEmblem: 1794, // 光炎の紋章

    NegatingFang: 1469, // 反竜穿

    HolyKnightAura: 1702, // グランベルの聖騎士

    SublimeHeaven: 1752, // 覇天

    RequiemDance: 1800, // 鎮魂の舞
};

const PassiveA = {
    None: -1,
    CloseCounter: 561, // 近距離反撃
    CloseReversal: 1803, // 近反・金剛の構え
    DistantCounter: 562, // 遠距離反撃
    DistantPressure: 1795, // 遠反・速さの渾身
    DeathBlow3: 528, // 鬼神の一撃3
    DeathBlow4: 529, // 鬼神の一撃4
    HienNoIchigeki1: 1149,
    HienNoIchigeki2: 1150,
    HienNoIchigeki3: 530,
    HienNoIchigeki4: 890,
    KongoNoIchigeki3: 531,
    MeikyoNoIchigeki3: 532,
    KishinHienNoIchigeki2: 533,
    KishinKongoNoIchigeki2: 534,
    KishinMeikyoNoIchigeki2: 535,
    HienKongoNoIchigeki2: 536,
    HienMeikyoNoIchigeki2: 537,
    KongoMeikyoNoIchigeki2: 538,
    KishinHienNoIchigeki3: 927,

    LifeAndDeath3: 527, // 死線3
    LifeAndDeath4: 1040, // 死線4
    Fury1: 1300,
    Fury2: 1301,
    Fury3: 526, // 獅子奮迅3
    Fury4: 825,
    DistantDef3: 564, // 遠距離防御3
    DistantDef4: 875, // 遠距離防御4
    CloseDef3: 563, // 近距離防御3
    CloseDef4: 1527, // 近距離防御4

    AtkSpdBond1: 1325,
    AtkSpdBond2: 1326,
    AtkSpdBond3: 574,
    AtkSpdBond4: 1019, // 攻撃速さの絆4
    AtkDefBond1: 1327,
    AtkDefBond2: 1328,
    AtkDefBond3: 575,
    AtkDefBond4: 1475,
    AtkResBond1: 1329,
    AtkResBond2: 1330,
    AtkResBond3: 576,
    AtkResBond4: 975, // 攻撃魔防の絆4
    SpdDefBond1: 1331,
    SpdDefBond2: 1332,
    SpdDefBond3: 577,
    SpdResBond1: 1333,
    SpdResBond2: 1334,
    SpdResBond3: 578,
    DefResBond1: 1335,
    DefResBond2: 1336,
    DefResBond3: 775,

    JaryuNoUroko: 585, // 邪竜の鱗
    DragonSkin2: 1754, // 邪竜の鱗・承
    Dragonscale: 1492, // 邪竜の大鱗

    // 密集
    AtkSpdForm3: 964,
    AtkDefForm3: 1055,
    AtkResForm3: 1495,
    SpdDefForm3: 992,
    SpdResForm3: 1137,
    DefResForm3: 1630,

    HeavyBlade1: 1256, // 剛剣1
    HeavyBlade2: 1257, // 剛剣2
    HeavyBlade3: 568, // 剛剣3
    HeavyBlade4: 1028, // 剛剣4
    FlashingBlade1: 1337, // 柔剣1
    FlashingBlade2: 1338, // 柔剣2
    FlashingBlade3: 569, // 柔剣3
    FlashingBlade4: 892, // 柔剣4


    AsherasChosen: 1044, // 女神の三雄

    // 構え
    KishinNoKamae3: 539,
    HienNoKamae3: 540,
    KongoNoKamae3: 541,
    MeikyoNoKamae3: 542,
    KishinHienNoKamae2: 543,
    KishinKongoNoKamae1: 1290,
    KishinKongoNoKamae2: 544,
    KishinMeikyoNoKamae2: 545,
    HienKongoNoKamae2: 546,
    HienMeikyoNoKamae1: 1119,
    HienMeikyoNoKamae2: 547,
    KongoMeikyoNoKamae2: 548,
    KongoNoKamae4: 766, // 金剛の構え4
    MeikyoNoKamae4: 894,
    KishinMeikyoNoKamae3: 1057,
    HienKongoNoKamae3: 1095,
    SwiftStance3: 1608,
    KishinKongoNoKamae3: 1174,
    KongoMeikyoNoKamae3: 1351,
    KishinHienNoKamae3: 1359,

    AishoGekika1: 1421,
    AishoGekika2: 1422,
    AishoGekika3: 560, // 相性激化3

    // 死闘
    AkaNoShitoHiko3: 582,
    MidoriNoShitoHoko3: 583,
    MuNoShitoHoko3: 584,
    AoNoShitoHiko3: 790,
    MidoriNoShitoHiko3: 864,
    AkaNoShitoHoko3: 929,
    AoNoShitoHoko3: 985,
    BDuelFlying4: 1645,
    RDuelInfantry4: 1642,
    BDuelInfantry4: 1669,
    CDuelCavalry4: 1717,

    HP1: 1115,
    HP2: 1116,
    HP3: 508,
    Atk3: 509,
    Spd3: 510,
    Def3: 511,
    Res1: 1117,
    Res2: 1118,
    Res3: 512,
    HpAtk2: 513,
    HpSpd2: 514,
    HpDef1: 1120,
    HpDef2: 515,
    HpRes2: 516,
    AtkSpd2: 517,
    AtkDef2: 518,
    AtkRes2: 519,
    SpdDef2: 520,
    SpdRes2: 521,
    DefRes2: 522,
    SyubiNoJosai3: 523, // 守備の城塞3
    MaboNoJosai3: 524, // 魔防の城塞3
    SyubiMaboNoJosai3: 525, // 守備魔防の城塞3

    // 孤軍
    AtkSpdSolo3: 580,
    AtkResSolo3: 581,
    AtkDefSolo3: 777,
    DefResSolo3: 822,
    SpdDefSolo3: 871,
    SpdResSolo3: 1098,
    AtkResSolo4: 1312,
    AtkSpdSolo4: 1316,
    AtkDefSolo4: 1428,
    SpdResSolo4: 1770,
    DefResSolo4: 1544,

    SvelNoTate: 565, // スヴェルの盾
    GuraniNoTate: 566, // グラ二の盾
    IotesShield: 567, // アイオテの盾

    AtkSpdPush3: 579, // 攻撃速さの渾身3
    AtkDefPush3: 862,
    AtkResPush3: 919,
    AtkResPush4: 1022, // 攻撃魔防の渾身4
    AtkSpdPush4: 971, // 攻撃速さの渾身4
    AtkDefPush4: 1177, // 攻撃守備の渾身4

    BrazenAtkSpd3: 556,
    BrazenAtkDef3: 557, // 攻撃守備の大覚醒3
    BrazenAtkRes3: 558,
    BrazenDefRes3: 559,
    BrazenSpdDef3: 995,
    BrazenSpdRes3: 1038,

    BrazenAtkSpd4: 939, // 大覚醒4

    KishinNoKokyu: 549, // 鬼神の呼吸
    KongoNoKokyu: 550, // 金剛の呼吸
    MeikyoNoKokyu: 551, // 明鏡の呼吸
    DartingBreath: 1310, // 飛燕の呼吸

    CloseFoil: 1181, // 金剛の反撃・近距離
    CloseWard: 1584, // 明鏡の反撃・近距離
    DistantFoil: 1182, // 金剛の反撃・遠距離
    DistantWard: 1088, // 明鏡の反撃・遠距離
    KishinKongoNoSyungeki: 805, // 鬼神金剛の瞬撃
    KishinMeikyoNoSyungeki: 923, // 鬼神明鏡の瞬撃
    SteadyImpact: 1424, // 飛燕金剛の瞬撃
    SwiftImpact: 1617, // 飛燕明鏡の瞬撃

    Kyokazohuku3: 849, // 強化増幅3

    YaibaNoSession3: 1111, // 刃のセッション
    TateNoSession3: 1107, // 盾のセッション

    HashinDanryuKen: 978, // 覇神断竜剣

    MadoNoYaiba3: 764, // 魔道の刃3

    DefiantAtk1: 1166,
    DefiantAtk2: 1167,
    DefiantAtk3: 552, // 攻撃の覚醒3
    DefiantSpd3: 553,
    DefiantDef3: 554,
    DefiantRes3: 555,

    SeimeiNoGoka3: 570, // 生命の業火
    SeimeiNoShippu3: 571,
    SeimeiNoDaichi3: 572,
    SeimeiNoSeisui3: 573,

    SacaNoOkite: 586, // サカの掟
    LawsOfSacae2: 1753, // サカの掟・承
    OstiasCounter: 587, // オスティアの反撃

    // 防城戦
    AtkSpdBojosen3: 1473,
    AtkResBojosen3: 881,
    SpdDefBojosen3: 907,
    DefResBojosen3: 918,
    SpdResBojosen3: 962,
    AtkDefBojosen3: 1008,
    AtkSpdBojosen4: 1773,

    // 攻城戦
    AtkDefKojosen3: 883,
    AtkSpdKojosen3: 914,
    SpdResKojosen3: 925,

    // 連帯
    AtkSpdUnity: 1801, // 攻撃速さの連帯
    AtkDefUnity: 1450, // 攻撃守備の連帯
    AtkResUnity: 1575, // 攻撃魔防の連帯

    // 機先
    AtkSpdCatch4: 1647, // 攻撃速さの機先4
    AtkDefCatch4: 1703, // 攻撃守備の機先4
    DefResCatch4: 1761, // 守備魔防の機先4

    // 万全
    AtkSpdIdeal4: 1688, // 攻撃速さの万全4
    AtkDefIdeal4: 1705,
    AtkResIdeal4: 1723,
    DefResIdeal4: 1791, // 守備魔防の万全4

    // 迫撃
    SurgeSparrow: 1797, // 鬼神飛燕の迫撃
};

const PassiveB = {
    None: -1,
    QuickRiposte1: 1254, // 切り返し1
    QuickRiposte2: 1255, // 切り返し2
    QuickRiposte3: 599, // 切り返し3
    DragonWall3: 1621, // 竜鱗障壁3
    DragonsIre3: 1493, // 竜の逆鱗3
    Vantage3: 596, // 待ち伏せ3
    Desperation3: 597, // 攻め立て3
    Cancel1: 1286,//キャンセル1
    Cancel2: 1287,//キャンセル2
    Cancel3: 631,//キャンセル3
    Kyuen2: 1121, // 救援の行路2
    Kyuen3: 594, // 救援の行路3
    Ridatsu3: 595, // 離脱の行路3
    HentaiHiko1: 1443, // 編隊飛行1
    HentaiHiko2: 1444, // 編隊飛行2
    HentaiHiko3: 635, // 編隊飛行3
    KyokugiHiKo1: 1394, // 曲技飛行1
    KyokugiHiKo2: 1395, // 曲技飛行2
    KyokugiHiKo3: 636, // 曲技飛行3
    WrathfulStaff3: 632, // 神罰の杖3
    DazzlingStaff3: 633, // 幻惑の杖3
    ChillAtk1: 1339,
    ChillAtk2: 1340,
    ChillAtk3: 614, // 攻撃の封印3
    ChillSpd1: 1341,
    ChillSpd2: 1342,
    ChillSpd3: 615, // 速さの封印3
    ChillDef1: 1343,
    ChillDef2: 1344,
    ChillDef3: 616, // 守備の封印3
    ChillRes1: 1345,
    ChillRes2: 1346,
    ChillRes3: 617, // 魔防の封印3
    ChillAtkDef2: 1524, // 攻撃守備の封印2
    ChillAtkRes2: 1169, // 攻撃魔防の封印2
    ChillAtkSpd2: 1239, // 攻撃速さの封印2
    ChillSpdDef2: 1319, // 速さ守備の封印2
    ChillSpdRes2: 1371, // 速さ魔防の封印2
    ChillDefRes2: 1613, // 守備魔防の封印2

    BoldFighter3: 601, // 攻撃隊形3
    VengefulFighter3: 602, // 迎撃隊形3
    WaryFighter3: 600, // 守備隊形3
    SpecialFighter3: 603,// 奥義隊形3
    CraftFighter3: 1483, // 抑止隊形3
    SlickFighter3: 1497, // 正面隊形・自己3

    MikiriTsuigeki3: 757, // 見切り・追撃効果3
    MikiriHangeki3: 810, // 見切り・反撃不可効果3

    KyokoNoWakuran3: 896, // 惑乱3

    BlazeDance1: 1278, // 業火の舞い1
    BlazeDance2: 1279, // 業火の舞い2
    BlazeDance3: 638, // 業火の舞い3
    GaleDance1: 1230, // 疾風の舞い1
    GaleDance2: 1231, // 疾風の舞い2
    GaleDance3: 639, // 疾風の舞い3
    EarthDance1: 1147, // 大地の舞い1
    EarthDance2: 1148, // 大地の舞い2
    EarthDance3: 640, // 大地の舞い3
    TorrentDance1: 1241, // 静水の舞い1
    TorrentDance2: 1242, // 静水の舞い2
    TorrentDance3: 762, // 静水の舞い3
    FirestormDance2: 641, // 業火疾風の舞い2
    CalderaDance1: 1240, // 業火大地の舞い1
    CalderaDance2: 987, // 業火大地の舞い2
    DelugeDance2: 644, // 疾風静水の舞い2
    FirefloodDance2: 642, // 業火静水の舞い2
    GeyserDance1: 1243, // 大地静水の舞い1
    GeyserDance2: 645, // 大地静水の舞い2
    RockslideDance2: 643, // 疾風大地の舞い2

    // 魅了
    AtkCantrip3: 1380, // 攻撃の魅了3
    DefCantrip3: 1471,
    ResCantrip3: 1589,

    AtkSpdLink2: 1133, // 攻撃速さの連携2
    AtkSpdLink3: 648, // 攻撃速さの連携3
    AtkResLink3: 760,
    AtkDefLink3: 649, // 攻撃守備の連携3
    SpdDefLink3: 860, // 速さ守備の連携3
    SpdResLink3: 650, // 速さ魔防の連携3
    DefResLink3: 651, // 守備魔防の連携3

    Swordbreaker3: 618, // 剣殺し3
    Lancebreaker3: 619,
    Axebreaker3: 620,
    Bowbreaker3: 621,
    Daggerbreaker3: 622,
    RedTomebreaker3: 623,
    BlueTomebreaker3: 624,
    GreenTomebreaker3: 625,

    LullAtkDef3: 950, // 攻撃守備の凪3
    LullAtkSpd3: 994, // 攻撃速さの凪3
    LullAtkRes3: 1109, // 攻撃魔防の凪3
    LullSpdDef3: 952, // 速さ守備の凪3
    LullSpdRes3: 1156,

    SabotageAtk3: 846, // 攻撃の混乱3
    SabotageSpd3: 1026, // 速さの混乱3
    SabotageDef3: 937, // 守備の混乱3
    SabotageRes3: 867, // 魔防の混乱3

    OgiNoRasen3: 654, // 奥義の螺旋3

    SealAtk1: 1455,
    SealAtk2: 1456,
    SealAtk3: 607,
    SealSpd1: 1457,
    SealSpd2: 1458,
    SealSpd3: 608,
    SealDef1: 1459,
    SealDef2: 1460,
    SealDef3: 609, // 守備封じ3
    SealRes1: 1461,
    SealRes2: 1462,
    SealRes3: 610, // 魔防封じ3
    SealAtkSpd1: 1463,
    SealAtkSpd2: 611, // 攻撃速さ封じ2
    SealAtkDef1: 1464,
    SealAtkDef2: 612,
    SealAtkRes2: 1604, // 攻撃魔防封じ2
    SealDefRes1: 1467,
    SealDefRes2: 613,
    SealSpdDef1: 1465,
    SealSpdDef2: 855,
    SealSpdRes1: 1466,
    SealSpdRes2: 1389, // 速さ魔防封じ2

    KoriNoHuin: 660, // 氷の封印
    ChillingSeal2: 1692, // 氷の封印・承
    ToketsuNoHuin: 770, // 凍結の封印

    Ikari3: 637, // 怒り3
    Renewal1: 1258, // 回復1
    Renewal2: 1259, // 回復2
    Renewal3: 605, // 回復3

    AtkFeint3: 817, // 攻撃の共謀3
    SpdFeint3: 652,
    DefFeint3: 653,
    ResFeint3: 829,

    // 大共謀
    AtkSpdRuse3: 973,
    AtkDefRuse3: 1141,
    AtkResRuse3: 1546,
    DefResRuse3: 935,
    SpdResRuse3: 1004,
    SpdDefRuse3: 1105,

    KillingIntent: 999, // 死んでほしいの

    PoisonStrike3: 604,
    SacaesBlessing: 655,

    Kazenagi3: 629, // 風薙ぎ3
    Mizunagi3: 630, // 水薙ぎ3

    Frenzy3: 1768, // 回避・攻め立て3
    Spurn3: 1391, // 回避・怒り3
    KaihiIchigekiridatsu3: 1053, // 回避・一撃離脱3
    KaihiTatakikomi3: 1100, // 回避・叩き込み3
    Kirikomi: 589, // 切り込み
    Tatakikomi: 588, // 叩き込み
    Hikikomi: 590, // 引き込み
    Ichigekiridatsu: 591, // 一撃離脱

    KyokaMukoKinkyori3: 646, // 強化無効・近距離3
    KyokaMukoEnkyori3: 647, // 強化無効・遠距離3

    Wanakaijo3: 858, // 罠解除3

    RunaBracelet: 667, // 月の腕輪
    SeimeiNoGofu3: 772, // 生命の護符

    ShisyaNoChojiriwo: 1114, // 死者の帳尻を
    YunesSasayaki: 976, // ユンヌの囁き
    SphiasSoul: 1076, // ソフィアの魂
    SDrink: 663, // Sドリンク
    BeokuNoKago: 656, // ベオクの加護

    TsuigekiTaikeiKisu3: 1009, // 追撃隊形・奇数3
    EvenFollowUp3: 1574, // 追撃隊形・偶数3

    HikariToYamito: 981, // 光と闇と

    GohoshiNoYorokobi1: 1252, // ご奉仕の喜び1
    GohoshiNoYorokobi2: 1253, // ご奉仕の喜び2
    GohoshiNoYorokobi3: 606, // ご奉仕の喜び3
    SeikishiNoKago: 657, // 聖騎士の加護
    Shishirenzan: 665, // 獅子連斬
    Bushido: 664, // 武士道
    Bushido2: 1693, // 武士道・承
    Recovering: 659, // リカバーリング
    TaiyoNoUdewa: 662, // 太陽の腕輪
    KyusyuTaikei3: 1072, // 急襲隊形3
    FuinNoTate: 666, // 封印の盾
    TeniNoKona: 661, // 転移の粉
    TsuigekiRing: 658, // 追撃リング
    TateNoKodo3: 634, // 盾の鼓動3
    // @TODO: 相性相殺1, 2は効果が異なるので時間がある時に実装する
    AisyoSosatsu3: 626, // 相性相殺
    Sashitigae3: 598, // 差し違え3
    ShingunSoshi3: 593, // 進軍阻止3
    DetailedReport: 1804, // 異常なしであります
    Surinuke3: 592, // すり抜け3
    Tenmakoku3: 1139, // 天馬行空3
    WyvernFlight3: 1529, // 飛竜行空3
    KodoNoHukanGusu3: 1136, // 鼓動の封緘・偶数3
    OddPulseTie3: 1321, // 鼓動の封緘・奇数3

    BeliefInLove: 1235, // 愛を信じますか?
    RagingStorm: 1303, // 狂嵐

    // 干渉
    AtkSpdSnag3: 1685, // 攻撃速さの干渉3
    AtkDefSnag3: 1587, // 攻撃守備の干渉3
    SpdResSnag3: 1367, // 速さ魔防の干渉3
    SpdDefSnag3: 1373, // 速さ守備の干渉3

    HolyWarsEnd: 1376, // 最後の聖戦
    GuardBearing3: 1378, // 警戒姿勢3
    DiveBomb3: 1430, // 空からの急襲3

    BlueLionRule: 1451, // 蒼き獅子王
    BlackEagleRule: 1453, // 黒鷲の覇王
    Atrocity: 1514, // 無惨
    BindingNecklace: 1540, // 束縛の首飾り
    FallenStar: 1651, // 落星
    SunTwinWing: 1680, // 双姫の陽翼
    MoonTwinWing: 1732, // 双姫の月翼
    ArmoredWall: 1706, // 覇鎧障壁
    MurderousLion: 1712, // 蒼き殺人鬼
    YngviAscendant: 1780, // ユングヴィの祖
    MoonlightBangle: 1798, // 華月の腕輪

    // 近影、遠影
    AtkDefNearTrace3: 1719, // 攻撃守備の近影3
    SpdDefNearTrace3: 1695, // 速さ守備の近影3
    AtkDefFarTrace3: 1715, // 攻撃守備の遠影3
    AtkResFarTrace3: 1746, // 攻撃魔防の遠影3
    SpdResFarTrace3: 1697, // 速さ魔防の遠影3

    // 怒涛
    FlowRefresh3: 1763, // 怒涛・再起3
};

const PassiveC = {
    None: -1,
    SpurAtk1: 1268,
    SpurAtk2: 1269,
    SpurAtk3: 670,
    SpurSpd1: 1273,
    SpurSpd2: 1274,
    SpurSpd3: 671,
    SpurDef1: 1264,
    SpurDef2: 1265,
    SpurDef3: 672,
    SpurRes1: 1276,
    SpurRes2: 1277,
    SpurRes3: 673,
    SpurAtkSpd1: 1270,
    SpurAtkSpd2: 674,
    SpurAtkDef2: 675,
    SpurAtkRes1: 1271,
    SpurAtkRes2: 676,
    SpurSpdDef1: 1142,
    SpurSpdDef2: 677,
    SpurSpdRes2: 678,
    SpurDefRes1: 1266,
    SpurDefRes2: 679,
    DriveAtk1: 1267,
    DriveAtk2: 680,
    DriveSpd1: 1272,
    DriveSpd2: 681,
    DriveDef1: 1245,
    DriveDef2: 682,
    DriveRes1: 1275,
    DriveRes2: 683,
    JointDriveAtk: 1184, // 攻撃の相互大紋章
    JointDriveSpd: 1357, // 速さの相互大紋章
    JointDriveRes: 1454, // 魔防の相互大紋章
    JointDriveDef: 1805, // 守備の相互大紋章

    GoadArmor: 686, // 重刃の紋章
    WardArmor: 687, // 重盾の紋章
    GoadCavalry: 688,
    WardCavalry: 689,
    GoadFliers: 690,
    WardFliers: 691,
    GoadDragons: 692,
    WardDragons: 693,
    GoadBeasts: 844,
    WardBeasts: 842,

    SavageBlow1: 1364, // 死の吐息1
    SavageBlow2: 1365, // 死の吐息2
    SavageBlow3: 669, // 死の吐息3

    CloseGuard1: 1353, // 近距離警戒1
    CloseGuard2: 1354, // 近距離警戒2
    CloseGuard3: 684, // 近距離警戒3
    DistantGuard1: 1355,
    DistantGuard2: 1143, // 遠距離警戒2
    DistantGuard3: 685, // 遠距離警戒3

    SorakaranoSendo3: 735,
    HikonoSendo3: 736,

    ThreatenAtk1: 1413,
    ThreatenAtk2: 1414,
    ThreatenAtk3: 718, // 攻撃の威嚇3
    ThreatenSpd1: 1415,
    ThreatenSpd2: 1416,
    ThreatenSpd3: 719,
    ThreatenDef1: 1411,
    ThreatenDef2: 1412,
    ThreatenDef3: 720,
    ThreatenRes1: 1417,
    ThreatenRes2: 1418,
    ThreatenRes3: 721,
    ThreatenAtkSpd3: 979,
    ThreatenAtkRes3: 1068,
    ThreatenAtkDef2: 1487,
    ThreatenAtkDef3: 1124,
    ThreatenAtkRes2: 1691,
    ThreatenSpdDef2: 1758,

    KodoNoGenen3: 909, // 鼓動の幻煙3

    AtkTactic1: 1291,
    AtkTactic2: 1292,
    AtkTactic3: 706, // 攻撃の指揮3
    SpdTactic1: 1293,
    SpdTactic2: 1294,
    SpdTactic3: 707,
    DefTactic1: 1295,
    DefTactic2: 1296,
    DefTactic3: 708,
    ResTactic1: 1297,
    ResTactic2: 1298,
    ResTactic3: 709,

    ArmorMarch3: 734, // 重装の行軍3

    OddAtkWave3: 710, // 攻撃の波・奇数3
    OddSpdWave3: 711,
    OddDefWave3: 712,
    OddResWave3: 713,
    EvenAtkWave3: 714, // 攻撃の波・偶数3
    EvenSpdWave3: 715,
    EvenDefWave3: 716,
    EvenResWave3: 717,

    HoneAtk3: 694, // 攻撃の鼓舞3
    HoneSpd3: 695,
    HoneDef3: 696,
    HoneRes3: 697,
    HoneAtk4: 795, // 攻撃の鼓舞4
    HoneSpd4: 853,
    HoneRes4: 1059,
    HoneDef4: 1369,
    HoneArmor: 698, // 重刃の鼓舞
    FortifyArmor: 699,
    HoneCavalry: 700,
    FortifyCavalry: 701,
    HoneFlyier: 702,
    FortifyFlyier: 703,
    HoneDragons: 704,
    FortifyDragons: 705,
    HoneBeasts: 807,
    FortifyBeasts: 808,

    JointHoneAtk: 989, // 相互鼓舞
    JointHoneSpd: 793, // 相互鼓舞
    JointHoneDef: 1015, // 相互鼓舞
    JointHoneRes: 1477,

    HokoNoKodo3: 731, // 歩行の鼓動3

    AtkSmoke1: 1403,
    AtkSmoke2: 1404,
    AtkSmoke3: 727, // 攻撃の紫煙3
    SpdSmoke1: 1405,
    SpdSmoke2: 1406,
    SpdSmoke3: 728, // 速さの紫煙3
    DefSmoke1: 1407,
    DefSmoke2: 1408,
    DefSmoke3: 729, // 守備の紫煙3
    ResSmoke1: 1409,
    ResSmoke2: 1410,
    ResSmoke3: 730, // 魔防の紫煙3

    AtkPloy3: 722, // 攻撃の謀策3
    SpdPloy3: 723, // 速さの謀策3
    DefPloy3: 724, // 守備の謀策3
    ResPloy3: 725, // 魔防の謀策3

    HajimariNoKodo3: 957,

    // 信義
    AtkSpdOath3: 1077, // 攻撃速さの信義3
    AtkDefOath3: 1045,
    AtkResOath3: 982,
    DefResOath3: 1092,
    SpdDefOath3: 1233,
    SpdResOath3: 1602,

    AtkOpening3: 779,
    SpdOpening3: 815, // 速さの開放3
    DefOpening3: 885,
    ResOpening3: 827,
    SpdDefGap3: 1522, // 速さ守備の大開放3
    SpdResGap3: 1034, // 速さ魔防の大開放3
    AtkResGap3: 1006,
    DefResGap3: 1070,
    AtkSpdGap3: 1086,
    AtkDefGap3: 1159,

    PanicSmoke3: 1000, // 恐慌の幻煙3

    // 奮起
    RouseAtkSpd3: 1510,
    RouseAtkDef3: 948,
    RouseDefRes3: 1036,
    RouseSpdRes3: 1127,
    RouseSpdDef3: 1157,
    RouseAtkRes3: 1314,

    SeiNoIbuki3: 668, // 生の息吹3
    HokoNoGogeki3: 732, // 歩行の剛撃3
    HokoNoJugeki3: 733, // 歩行の柔撃3
    HokoNoKokyu3: 921, // 歩行の呼吸3
    HokoNoMajin3: 961, // 歩行の魔刃3

    ArmoredStride3: 1304, // 重装の遊撃3

    // 牽制
    AtkSpdRein3: 1448, // 攻撃速さの牽制3
    AtkDefRein3: 1519, // 攻撃守備の牽制3
    AtkResRein3: 1490, // 攻撃魔防の牽制3
    SpdDefRein3: 1485, // 速さ守備の牽制3
    SpdResRein3: 1538, // 速さ魔防の牽制3
    DefResRein3: 1787, // 守備魔防の牽制3

    OddTempest3: 1515, // 迅雷風烈・奇数3
    EvenTempest3: 1681, // 迅雷風烈・偶数3

    // 快癒
    OddRecovery1: 1580, // 快癒・奇数1
    OddRecovery2: 1579, // 快癒・奇数2
    OddRecovery3: 1570, // 快癒・奇数3
    EvenRecovery1: 1739, // 快癒・奇数1
    EvenRecovery2: 1740, // 快癒・奇数2
    EvenRecovery3: 1741, // 快癒・奇数3

    ArFarSave3: 1634, // 兜の護り手・遠間3
    DrNearSave3: 1636, // 盾の護り手・近間3
    AdNearSave3: 1667, // 鎧の護り手・近間3

    FatalSmoke3: 1631, // 不治の幻煙3

    // 脅嚇
    AtkSpdMenace: 1733, // 攻撃速さの脅嚇
    AtkDefMenace: 1708, // 攻撃守備の脅嚇
    AtkResMenace: 1710, // 攻撃魔防の脅嚇
    DefResMenace: 1728, // 守備魔防の脅嚇

    StallPloy3: 1789, // 空転の奇策3

    // 専用
    SeimeiNoKagayaki: 773,
    ChaosNamed: 868, // 我が名は混沌
    SurtrsMenace: 767, // 炎王の威嚇
    SurtrsPortent: 1792, // 炎王の脅嚇
    WithEveryone: 754, // みんなと一緒に
    SolitaryDream: 898, // ひとりぼっちのゆめ
    DivineFang: 915, // 神竜王の牙
    KyokoNoKisaku3: 726, // 恐慌の奇策3
    AirOrders3: 819, // 先導の伝令・天3
    GroundOrders3: 911, // 先導の伝令・地3
    Upheaval: 823, // メガクェイク
    VisionOfArcadia: 933, // 理想郷となるように
    OstiasPulse: 753, // オスティアの鼓動
    Jagan: 811, // 邪眼
    HitoNoKanouseiWo: 850, // 人の可能性を
    ImpenetrableDark: 1178, // 見通せぬ深き暗闇
    MilaNoHaguruma: 1352, // ミラの歯車
    InevitableDeath: 1420, // 死からは逃れられぬ
    WingsOfLight: 1622, // 光輝く翼
    OrdersRestraint: 1724, // 束縛、秩序、安定
    DomainOfIce: 1774, // 絶氷結界
};

const PassiveS = {
    None: -1,
    HardyBearing1: 1244,
    HardyBearing2: 1144,
    HardyBearing3: 1074, // 不動の姿勢
    OgiNoKodou: 1078, // 奥義の鼓動
    ArmoredBoots: 1083, // 重装のブーツ
    RengekiBogyoKenYariOno3: 1080, // 連撃防御・剣槍斧3
    RengekiBogyoYumiAnki3: 1081, // 連撃防御・弓暗器3
    RengekiBogyoMado3: 1082, // 連撃防御・魔道3
    HayasaNoKyosei1: 1434, // 速さの虚勢1
    HayasaNoKyosei2: 1435, // 速さの虚勢2
    HayasaNoKyosei3: 1079, // 速さの虚勢3
    MaboNoKyosei1: 1431, // 魔防の虚勢1
    MaboNoKyosei2: 1432, // 魔防の虚勢2
    MaboNoKyosei3: 1433, // 魔防の虚勢3
    GoeiNoGuzo: 1396, // 護衛の偶像
    TozokuNoGuzoRakurai: 1397, // 盗賊の偶像
    TozokuNoGuzoKobu: 1398,
    TozokuNoGuzoKogun: 1399,
    TozokuNoGuzoKusuri: 1400,
    TozokuNoGuzoOugi: 1401,
    TozokuNoGuzoOdori: 1402,
};

/// 武器タイプが物理系の武器であるかを判定します。
function isPhysicalWeaponType(weaponType) {
    if (isWeaponTypeBeast(weaponType)) {
        return true;
    }
    if (isWeaponTypeDagger(weaponType)) {
        return true;
    }
    if (isWeaponTypeBow(weaponType)) {
        return true;
    }
    switch (weaponType) {
        case WeaponType.Sword:
        case WeaponType.Lance:
        case WeaponType.Axe:
            return true;
        default:
            return false;
    }
}

/// 武器錬成タイプが特殊錬成であるかを判定します。
function isWeaponSpecialRefined(weaponRefinementType) {
    switch (weaponRefinementType) {
        case WeaponRefinementType.Special:
        case WeaponRefinementType.Special_Hp3:
            return true;
        default:
            return false;
    }
}

/// 自身、敵共に反撃不可になる武器であるかどうかを判定します。
function isFiresweepWeapon(weapon) {
    switch (weapon) {
        case Weapon.MiraiNoSeikishiNoYari:
        case Weapon.FiresweepSword:
        case Weapon.FiresweepSwordPlus:
        case Weapon.FiresweepLance:
        case Weapon.FiresweepLancePlus:
        case Weapon.FiresweepBow:
        case Weapon.FiresweepBowPlus:
        case Weapon.FiresweepAxePlus:
            return true;
        default:
            return false;
    }
}

/// 補助スキルの射程を取得します。
function getAssistRange(support) {
    switch (support) {
        case Support.None:
            return 0;
        case Support.Physic:
        case Support.PhysicPlus:
            return 2;
        default: return 1;
    }
}

/// 補助スキルが大応援かどうかを判定します。
function isRallyUp(support) {
    switch (support) {
        case Support.RallyUpAtk:
        case Support.RallyUpAtkPlus:
        case Support.RallyUpSpd:
        case Support.RallyUpSpdPlus:
        case Support.RallyUpRes:
        case Support.RallyUpResPlus:
            return true;
        default:
            return false;
    }
}

/// 応援スキルの攻撃の強化量を取得します。
function getAtkBuffAmount(support) {
    switch (support) {
        case Support.RallyAttack: return 4;
        case Support.RallyUpAtk: return 4;
        case Support.RallyUpAtkPlus: return 6;
        case Support.RallyAtkSpd: return 3;
        case Support.RallyAtkDef: return 3;
        case Support.RallyAtkRes: return 3;
        case Support.RallyAtkSpdPlus:
        case Support.RallyAtkDefPlus:
        case Support.RallyAtkResPlus:
            return 6;
        default: return 0;
    }
}
/// 応援スキルの速さの強化量を取得します。
function getSpdBuffAmount(support) {
    switch (support) {
        case Support.RallySpeed: return 4;
        case Support.RallyUpSpd: return 4;
        case Support.RallyUpSpdPlus: return 6;
        case Support.RallyAtkSpd: return 3;
        case Support.RallySpdDef: return 3;
        case Support.RallySpdRes: return 3;
        case Support.RallySpdResPlus:
        case Support.RallySpdDefPlus:
        case Support.RallyAtkSpdPlus:
            return 6;
        default: return 0;
    }
}
/// 応援スキルの守備の強化量を取得します。
function getDefBuffAmount(support) {
    switch (support) {
        case Support.RallyDefense: return 4;
        case Support.RallySpdDef: return 3;
        case Support.RallyAtkDef: return 3;
        case Support.RallyDefRes: return 3;
        case Support.RallyAtkDefPlus:
        case Support.RallySpdDefPlus:
        case Support.RallyDefResPlus:
            return 6;
        default: return 0;
    }
}
/// 応援スキルの魔防の強化量を取得します。
function getResBuffAmount(support) {
    switch (support) {
        case Support.RallyUpRes: return 4;
        case Support.RallyUpResPlus: return 6;
        case Support.RallyResistance: return 4;
        case Support.RallyDefRes: return 3;
        case Support.RallySpdRes: return 3;
        case Support.RallyAtkRes: return 3;
        case Support.RallySpdResPlus:
        case Support.RallyDefResPlus:
        case Support.RallyAtkResPlus:
            return 6;
        default: return 0;
    }
}
/// 回復系の補助スキルの戦闘前補助実行可能な回復量を取得します。
/// https://vervefeh.github.io/FEH-AI/charts.html#chartF
function getPrecombatHealThreshold(support) {
    switch (support) {
        case Support.Sacrifice: return 1;
        case Support.Heal:
            return 5;
        case Support.Reconcile:
            return 7;
        case Support.Physic:
            return 8;
        case Support.PhysicPlus:
        case Support.Rehabilitate:
        case Support.RehabilitatePlus:
        case Support.Martyr:
        case Support.MartyrPlus:
        case Support.Recover:
        case Support.RecoverPlus:
        case Support.Restore:
        case Support.RestorePlus:
        case Support.Rescue:
        case Support.RescuePlus:
        case Support.Mend:
        case Support.Return:
        case Support.ReturnPlus:
        case Support.Nudge:
        case Support.NudgePlus:
            return 10;
        default:
            return -1;
    }
}

/// 範囲奥義かどうかを判定します。
function isRangedAttackSpecial(special) {
    switch (special) {
        case Special.GrowingFlame:
        case Special.GrowingLight:
        case Special.GrowingWind:
        case Special.GrowingThunder:
        case Special.BlazingFlame:
        case Special.BlazingLight:
        case Special.BlazingWind:
        case Special.BlazingThunder:
        case Special.RisingFlame:
        case Special.RisingLight:
        case Special.RisingWind:
        case Special.RisingThunder:
        case Special.GiftedMagic:
            return true;
        default:
            return false;
    }
}

/// 防御系の奥義かどうかを判定します。
function isDefenseSpecial(special) {
    switch (special) {
        case Special.Nagatate:
        case Special.Otate:  // 大盾
        case Special.Kotate: // 小盾
        case Special.Seitate: // 聖盾
        case Special.Seii:  // 聖衣
        case Special.Seikabuto: // 聖兜
        case Special.KoriNoSeikyo:
        case Special.IceMirror2:
        case Special.NegatingFang:
            return true;
        default:
            return false;
    }
}

/// 戦闘中に発動する攻撃系の奥義かどうかを判定します。
function isNormalAttackSpecial(special) {
    switch (special) {
        case Special.Moonbow:
        case Special.Luna:
        case Special.Aether:
        case Special.LunaFlash:
        case Special.Glimmer:
        case Special.Deadeye:
        case Special.Astra:
        case Special.Bonfire:
        case Special.Ignis:
        case Special.Iceberg:
        case Special.Glacies:
        case Special.HolyKnightAura:
        case Special.DraconicAura:
        case Special.DragonFang:
        case Special.Sirius: // 天狼
        case Special.RupturedSky: // 破天
        case Special.TwinBlades: // 双刃
        case Special.Taiyo:
        case Special.Yuyo:
        case Special.RegnalAstra: // 剣姫の流星
        case Special.ImperialAstra: // 剣皇の流星
        case Special.OpenTheFuture: // 開世
        case Special.Fukusyu: // 復讐
        case Special.Kessyu: // 血讐
        case Special.Kagetsuki: // 影月
        case Special.Setsujoku: // 雪辱
        case Special.Hyouten: // 氷点
        case Special.Youkage: // 陽影
        case Special.Hotarubi: // 蛍火
        case Special.ShiningEmblem: // 光炎の紋章
        case Special.HonoNoMonsyo: // 炎の紋章
        case Special.HerosBlood:
        case Special.KuroNoGekko: // 黒の月光
        case Special.AoNoTenku: // 蒼の天空
        case Special.RadiantAether2: // 蒼の天空・承
        case Special.MayhemAether: // 暴の天空
        case Special.Hoshikage: // 星影
        case Special.Fukuryu: // 伏竜
        case Special.BlueFrame: // ブルーフレイム
        case Special.SeidrShell: // 魔弾
        case Special.RighteousWind:
        case Special.SublimeHeaven:
            return true;
        default:
            return false;
    }
}

/// 再行動補助スキルかどうかを判定します。
function isRefreshSupportSkill(skillId) {
    switch (skillId) {
        case Support.Sing:
        case Support.Dance:
        case Support.GrayWaves:
        case Support.GentleDream:
        case Support.WhimsicalDream:
        case Support.SweetDreams:
        case Support.FrightfulDream:
        case Support.Play:
            return true;
        default:
            return false;
    }
}

/// 範囲奥義かどうかを判定します。
function isWeaponTypeBow(type) {
    return type == WeaponType.RedBow
        || type == WeaponType.BlueBow
        || type == WeaponType.GreenBow
        || type == WeaponType.ColorlessBow;
}

/// 武器タイプが暗器であるかを判定します。
function isWeaponTypeDagger(type) {
    return type == WeaponType.RedDagger
        || type == WeaponType.BlueDagger
        || type == WeaponType.GreenDagger
        || type == WeaponType.ColorlessDagger;
}

/// 武器タイプが魔法であるかを判定します。
function isWeaponTypeTome(type) {
    return type == WeaponType.RedTome
        || type == WeaponType.BlueTome
        || type == WeaponType.GreenTome
        || type == WeaponType.ColorlessTome;
}

/// 武器タイプが竜であるかを判定します。
function isWeaponTypeBreath(type) {
    return type == WeaponType.RedBreath
        || type == WeaponType.BlueBreath
        || type == WeaponType.GreenBreath
        || type == WeaponType.ColorlessBreath
        || type == WeaponType.Breath;
}

/// 武器タイプが獣であるかを判定します。
function isWeaponTypeBeast(type) {
    return type == WeaponType.RedBeast
        || type == WeaponType.BlueBeast
        || type == WeaponType.GreenBeast
        || type == WeaponType.ColorlessBeast
        || type == WeaponType.Beast;
}

/// 武器タイプが2距離射程の武器であるかを判定します。
function isRangedWeaponType(weaponType) {
    return isWeaponTypeDagger(weaponType)
        || isWeaponTypeTome(weaponType)
        || isWeaponTypeBow(weaponType)
        || weaponType == WeaponType.Staff;
}

/// 武器タイプが1距離射程の武器であるかを判定します。
function isMeleeWeaponType(weaponType) {
    return isWeaponTypeBreathOrBeast(weaponType)
        || weaponType == WeaponType.Sword
        || weaponType == WeaponType.Axe
        || weaponType == WeaponType.Lance;
}

/// 武器タイプが竜、もしくは獣であるかを判定します。
function isWeaponTypeBreathOrBeast(type) {
    return isWeaponTypeBeast(type) || isWeaponTypeBreath(type);
}

/// 武器タイプが継承可能であるかを判定します。
function isInheritableWeaponType(targetType, types) {
    for (let type of types) {
        if (type == targetType) {
            return true;
        }
        switch (type) {
            case WeaponType.All:
                return true;
            case WeaponType.ExceptStaff:
                if (targetType != WeaponType.Staff) {
                    return true;
                }
                break;
            case WeaponType.Bow:
                if (isWeaponTypeBow(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Dagger:
                if (isWeaponTypeDagger(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Tome:
                if (isWeaponTypeTome(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Beast:
                if (isWeaponTypeBeast(targetType)) {
                    return true;
                }
                break;
            case WeaponType.Breath:
                if (isWeaponTypeBreath(targetType)) {
                    return true;
                }
                break;
        }
    }
    return false;
}

function getColorFromWeaponType(weaponType) {
    switch (weaponType) {
        case WeaponType.Sword: return ColorType.Red;
        case WeaponType.RedTome: return ColorType.Red;
        case WeaponType.RedBreath: return ColorType.Red;
        case WeaponType.RedBeast: return ColorType.Red;
        case WeaponType.RedBow: return ColorType.Red;
        case WeaponType.RedDagger: return ColorType.Red;
        case WeaponType.Lance: return ColorType.Blue;
        case WeaponType.BlueTome: return ColorType.Blue;
        case WeaponType.BlueBreath: return ColorType.Blue;
        case WeaponType.BlueBeast: return ColorType.Blue;
        case WeaponType.BlueBow: return ColorType.Blue;
        case WeaponType.BlueDagger: return ColorType.Blue;
        case WeaponType.Axe: return ColorType.Green;
        case WeaponType.GreenTome: return ColorType.Green;
        case WeaponType.GreenBreath: return ColorType.Green;
        case WeaponType.GreenBeast: return ColorType.Green;
        case WeaponType.GreenBow: return ColorType.Green;
        case WeaponType.GreenDagger: return ColorType.Green;
        case WeaponType.Staff: return ColorType.Colorless;
        case WeaponType.ColorlessTome: return ColorType.Colorless;
        case WeaponType.ColorlessBreath: return ColorType.Colorless;
        case WeaponType.ColorlessBeast: return ColorType.Colorless;
        case WeaponType.ColorlessBow: return ColorType.Colorless;
        case WeaponType.ColorlessDagger: return ColorType.Colorless;
        default:
            throw new Error("Unexpected weapon type");
    }
}

function stringToWeaponType(input) {
    switch (input) {
        case "剣": return WeaponType.Sword;
        case "槍": return WeaponType.Lance;
        case "斧": return WeaponType.Axe;
        case "無魔": return WeaponType.ColorlessTome;
        case "赤魔": return WeaponType.RedTome;
        case "青魔": return WeaponType.BlueTome;
        case "緑魔": return WeaponType.GreenTome;
        case "赤竜": return WeaponType.RedBreath;
        case "青竜": return WeaponType.BlueBreath;
        case "緑竜": return WeaponType.GreenBreath;
        case "無竜": return WeaponType.ColorlessBreath;
        case "杖": return WeaponType.Staff;
        case "暗器": return WeaponType.ColorlessDagger;
        case "赤暗器": return WeaponType.RedDagger;
        case "青暗器": return WeaponType.BlueDagger;
        case "緑暗器": return WeaponType.GreenDagger;
        case "弓": return WeaponType.ColorlessBow;
        case "赤弓": return WeaponType.RedBow;
        case "青弓": return WeaponType.BlueBow;
        case "緑弓": return WeaponType.GreenBow;
        case "赤獣": return WeaponType.RedBeast;
        case "青獣": return WeaponType.BlueBeast;
        case "緑獣": return WeaponType.GreenBeast;
        case "獣": return WeaponType.ColorlessBeast;
        default:
            return WeaponType.None;
    }
}

function weaponTypeToString(weaponType) {
    switch (weaponType) {
        case WeaponType.Sword: return "剣";
        case WeaponType.ColorlessTome: return "無魔";
        case WeaponType.RedTome: return "赤魔";
        case WeaponType.RedBreath: return "赤竜";
        case WeaponType.RedBeast: return "赤獣";
        case WeaponType.RedBow: return "赤弓";
        case WeaponType.RedDagger: return "赤暗器";
        case WeaponType.Lance: return "槍";
        case WeaponType.BlueTome: return "青魔";
        case WeaponType.BlueBreath: return "青竜";
        case WeaponType.BlueBeast: return "青獣";
        case WeaponType.BlueBow: return "青弓";
        case WeaponType.BlueDagger: return "青暗器";
        case WeaponType.Axe: return "斧";
        case WeaponType.GreenTome: return "緑魔";
        case WeaponType.GreenBreath: return "緑竜";
        case WeaponType.GreenBeast: return "緑獣";
        case WeaponType.GreenBow: return "緑弓";
        case WeaponType.GreenDagger: return "緑暗器";
        case WeaponType.Staff: return "杖";
        case WeaponType.ColorlessBreath: return "竜";
        case WeaponType.ColorlessBeast: return "獣";
        case WeaponType.ColorlessBow: return "弓";
        case WeaponType.ColorlessDagger: return "暗器";
        case WeaponType.Breath: return "竜石";
        case WeaponType.Beast: return "獣";
        default:
            return "不明";
    }
}

/// 既に強化済みであるなどにより強化できない味方に対しても強制的に応援を実行できるスキルであるかを判定します。
function canRallyForcibly(skill) {
    switch (skill) {
        case Support.Uchikudakumono:
        case PassiveB.AtkFeint3:
        case PassiveB.SpdFeint3:
        case PassiveB.DefFeint3:
        case PassiveB.ResFeint3:
        case PassiveB.AtkSpdRuse3:
        case PassiveB.AtkDefRuse3:
        case PassiveB.AtkResRuse3:
        case PassiveB.DefResRuse3:
        case PassiveB.SpdResRuse3:
        case PassiveB.SpdDefRuse3:
            return true;
        default:
            return false;
    }
}

/// 戦闘前に発動するスペシャルであるかどうかを判定します。
function isPrecombatSpecial(special) {
    return isRangedAttackSpecial(special);
}

/// テレポート効果を持つスキルであるかどうかを判定します。
function isTeleportationSkill(skillId) {
    switch (skillId) {
        case Weapon.FlowerLance:
        case Weapon.FujinYumi:
        case Weapon.Gurimowaru:
        case Weapon.ApotheosisSpear:
        case Weapon.AstralBreath:
        case Weapon.Noatun:
        case Weapon.HinokaNoKounagitou:
        case Weapon.IzunNoKajitsu:
        case PassiveB.TeniNoKona:
        case PassiveB.Kyuen2:
        case PassiveB.Kyuen3:
        case PassiveB.Ridatsu3:
        case PassiveB.KyokugiHiKo1:
        case PassiveB.KyokugiHiKo2:
        case PassiveB.KyokugiHiKo3:
        case PassiveB.HentaiHiko1:
        case PassiveB.HentaiHiko2:
        case PassiveB.HentaiHiko3:
        case PassiveC.SorakaranoSendo3:
        case PassiveC.HikonoSendo3:
            return true;
        default:
            return false;
    }
}

/// 天駆の道の効果を持つスキルかどうか
function hasPathfinderEffect(skillId) {
    switch (skillId) {
        case Weapon.Hrimfaxi:
        case Weapon.Skinfaxi:
            return true;
        default:
            return false;
    }
}

/// スキル情報です。ユニットの初期化等に使用します。
class SkillInfo {
    constructor(id, name, might, specialCount, hp, atk, spd, def, res,
        effectives,
        invalidatedEffectives,
        cooldownCount,
        atkCount,
        counteratkCount,
        canCounterattackToAllDistance,
        isSacredSealAvailable,
        mightRefine,
        disableCounterattack,
        wrathfulStaff,
        assistType,
        isNoAdditionalImplRequired,
        specialRefineHpAdd,
        weaponType,
        sp,
        canInherit,
        inheritableWeaponTypes,
        inheritableMoveTypes,
        hasSpecialWeaponRefinement,
        hasStatusWeaponRefinement
    ) {
        this.id = id;
        this.detailPageUrl = "https://puarts.com/?fehskill=" + id;
        this.name = name;
        this.might = might;
        this.mightRefine = mightRefine;
        this.specialCount = specialCount;
        this.hp = hp;
        this.atk = atk;
        this.spd = spd;
        this.def = def;
        this.res = res;
        this.effectives = effectives;
        this.invalidatedEffectives = invalidatedEffectives;
        this.cooldownCount = cooldownCount;
        this.attackCount = atkCount;
        this.counterattackCount = counteratkCount;
        this.canCounterattackToAllDistance = canCounterattackToAllDistance;
        this.isSacredSealAvailable = isSacredSealAvailable;
        this.disableCounterattack = disableCounterattack;
        this.wrathfulStaff = wrathfulStaff;
        this.assistType = assistType;
        this.isAdditionalImplRequired = !isNoAdditionalImplRequired;
        this.specialRefineHpAdd = specialRefineHpAdd;
        this.weaponType = weaponType;
        this.sp = sp;
        this.canInherit = canInherit;
        this.inheritableWeaponTypes = inheritableWeaponTypes;
        this.inheritableMoveTypes = inheritableMoveTypes;
        this.hasSpecialWeaponRefinement = hasSpecialWeaponRefinement;
        this.hasStatusWeaponRefinement = hasStatusWeaponRefinement;

        this.type = SkillType.Weapon;
        this.weaponRefinementOptions = [];

        // 英雄情報から必要に応じて設定する
        this.releaseDateAsNumber = 0;
    }

    isDuel4() {
        return this.name.includes("死闘")
            && this.name.endsWith("4");
    }
    isDuel3() {
        return this.name.includes("死闘")
            && this.name.endsWith("3");
    }
}
/// @file
/// @brief Tile クラスとそれに関連するクラスや関数等の定義です。

const TileType = {
    Normal: 0,
    Forest: 1,
    Flier: 2,
    Trench: 3,
    Wall: 4,
    DefensiveTile: 5,
    DefensiveTrench: 6,
    DefensiveForest: 7,
};

function tileTypeToString(type) {
    switch (type) {
        case TileType.Normal: return "通常";
        case TileType.Forest: return "森";
        case TileType.Flier: return "飛行";
        case TileType.Trench: return "溝";
        case TileType.Wall: return "壁";
        case TileType.DefensiveTile: return "防御地形";
        case TileType.DefensiveTrench: return "溝+防御地形";
        case TileType.DefensiveForest: return "森+防御地形";
        default:
            return "不明";
    }
}
let TileTypeOptions = [];
for (let key in TileType) {
    let id = TileType[key];
    if (id == TileType.Wall) {
        continue;
    }
    TileTypeOptions.push({
        id: id,
        text: tileTypeToString(id)
    });
}


const CanNotReachTile = 1000000;
const ObstructTile = 10000; // 進軍阻止されているタイルのウェイト

/// ユニットをタイルに配置します。
function setUnitToTile(unit, tile) {
    if (unit.placedTile != null) {
        unit.placedTile.placedUnit = null;
    }
    unit.placedTile = tile;
    if (tile != null) {
        tile.placedUnit = unit;
        unit.setPos(tile.posX, tile.posY);
    }
    else {
        unit.setPos(-1, -1);
    }
}

/// マップを構成するタイルです。
class Tile {
    constructor(px, py) {
        this.posX = px;
        this.posY = py;
        this._type = TileType.Normal;
        this._obj = null;
        this._moveWeights = [];
        this._moveWeights[MoveType.Infantry] = 1;
        this._moveWeights[MoveType.Flying] = 1;
        this._moveWeights[MoveType.Armor] = 1;
        this._moveWeights[MoveType.Cavalry] = 1;
        this._neighbors = [];
        this._placedUnit = null;
        this._tempData = null;
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
        this._closestDistanceToEnemy = 0;
        this.tilePriority;

        this.isMovableForAlly = false;
        this.isMovableForEnemy = false;
        this.isAttackableForAlly = false;
        this.isAttackableForEnemy = false;

        this.threateningEnemies = [];
        this.threateningAllies = [];

        this.overridesCell = false;
        this.borderColor = "#000000";
        this.borderWidth = "1px";
        this.overrideText = "";

        this.snapshot = null;
    }

    createSnapshot() {
        let tile = new Tile(this.posX, this.posY);
        tile._dangerLevel = this._dangerLevel;
        tile._allyDangerLevel = this._allyDangerLevel;
        this.snapshot = tile;
    }

    __getEvalTile() {
        if (this.snapshot != null) {
            return this.snapshot;
        }
        return this;
    }

    perTurnStatusToString() {
        return "";
    }

    turnWideStatusToString() {
        return this._type + "";
    }

    fromPerTurnStatusString(value) {
    }

    fromTurnWideStatusString(value) {
        var splited = value.split(ValueDelimiter);
        var i = 0;
        if (Number.isInteger(Number(splited[i]))) { this._type = Number(splited[i]); ++i; }
    }

    get serialId() {
        return TileCookiePrefix + this.id;
    }

    get id() {
        return `${this.posX}_${this.posY}`;
    }

    get isStructurePlacable() {
        return !(this.type != TileType.Normal || this.obj instanceof BreakableWall || this.obj instanceof Wall);
    }

    isAttackableBySpecifiedGroup(groupId) {
        if (groupId == UnitGroupType.Ally) {
            return this.isAttackableForAlly;
        }
        else {
            return this.isAttackableForEnemy;
        }
    }

    isTreantenedBySpecifiedUnit(unit) {
        return this.threateningAllies.includes(unit) || this.threateningEnemies.includes(unit);
    }

    get isThreatenedByAlly() {
        return this._dangerLevel > 0;
    }
    get isThreatenedByEnemy() {
        return this._allyDangerLevel > 0;
    }

    overrideCell(text, borderWidth, borderColor) {
        this.overridesCell = true;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
        this.overrideText = text;
    }

    resetOverriddenCell() {
        this.overridesCell = false;
        this.borderColor = "#000000";
        this.borderWidth = "1px";
        this.overrideText = "";
    }

    get isDefensiveTile() {
        return this.type == TileType.DefensiveTile || this.type == TileType.DefensiveTrench || this.type == TileType.DefensiveForest;
    }

    positionToString() {
        return "(" + this.posX + ", " + this.posY + ")";
    }

    get closestDistanceToEnemy() {
        return this._closestDistanceToEnemy;
    }

    set closestDistanceToEnemy(value) {
        this._closestDistanceToEnemy = value;
    }

    getEnemyThreatFor(groupId) {
        let tile = this.__getEvalTile();
        switch (groupId) {
            case UnitGroupType.Enemy: return tile.dangerLevel;
            case UnitGroupType.Ally: return tile.allyDangerLevel;
            default:
                throw new Error("unexpected group id" + groupId);
        }
    }

    get dangerLevel() {
        return this._dangerLevel;
    }

    get allyDangerLevel() {
        return this._allyDangerLevel;
    }

    resetDangerLevel() {
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
    }

    increaseDangerLevel() {
        ++this._dangerLevel;
    }

    increaseAllyDangerLevel() {
        ++this._allyDangerLevel;
    }

    setObj(obj) {
        if (obj == null && this.obj != null) {
            this.obj.setPos(-1, -1);
        }

        this.obj = obj;

        if (this.obj != null) {
            this.obj.setPos(this.posX, this.posY);
        }
    }

    setUnit(unit) {
        setUnitToTile(unit, this);
    }


    isEmpty() {
        return this.isObjPlacable() && this.isUnitPlacable();
    }

    isObjPlacable() {
        return this._type == TileType.Normal && this._obj == null;
    }

    isObjPlaceableByNature() {
        return this._type == TileType.Normal && !(this._obj instanceof Wall);
    }

    isUnitPlacable() {
        return this.isMovableTile()
            && this._placedUnit == null
            && isMovableForUnit(this._obj);
    }
    isUnitPlacableForUnit(unit) {
        return this.isMovableTileForUnit(unit)
            && this._placedUnit == null
            && isMovableForUnit(this._obj);
    }

    isMovableTile() {
        return (this._type != TileType.Wall);
    }

    isMovableTileForUnit(unit) {
        return this.isMovableTileForMoveType(unit.moveType);
    }

    isMovableTileForMoveType(moveType) {
        return this._moveWeights[moveType] != CanNotReachTile
            && (this._obj == null || this._obj instanceof TrapBase || this._obj instanceof BreakableWall);
    }

    get tempData() {
        return this._tempData;
    }
    set tempData(value) {
        this._tempData = value;
    }

    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
        switch (value) {
            case TileType.Normal:
            case TileType.DefensiveTile:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                break;
            case TileType.Trench:
            case TileType.DefensiveTrench:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                this._moveWeights[MoveType.Cavalry] = 3;
                break;
            case TileType.Flier:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = CanNotReachTile;
                }
                this._moveWeights[MoveType.Flying] = 1;
                break;
            case TileType.Forest:
            case TileType.DefensiveForest:
                this._moveWeights[MoveType.Cavalry] = CanNotReachTile;
                this._moveWeights[MoveType.Flying] = 1;
                this._moveWeights[MoveType.Armor] = 1;
                this._moveWeights[MoveType.Infantry] = 2;
                break;
            case TileType.Wall:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = CanNotReachTile;
                }
                break;
            default:
                break;
        }
    }

    __isForestType() {
        return this._type == TileType.Forest || this._type == TileType.DefensiveForest;
    }

    __getTileMoveWeight(unit, isPathfinderEnabled = true) {
        if (isPathfinderEnabled && this.__canActivatePathfinder(unit)) {
            return 0;
        }

        if (this.__isForestType() && unit.moveType == MoveType.Infantry && unit.moveCount == 1) {
            // 歩行に1マス移動制限がかかっている場合は森地形のウェイトは通常地形と同じ
            return 1;
        }

        return this._moveWeights[unit.moveType];
    }

    /// 指定したユニットについて、このタイルで天駆の道が発動するか
    __canActivatePathfinder(unit) {
        if (this._placedUnit == null) {
            return false;
        }

        return this._placedUnit.groupId == unit.groupId
            && this._placedUnit.hasPathfinderEffect();
    }

    get obj() {
        return this._obj;
    }
    set obj(value) {
        if (this._obj != null) {
            this._obj.placedTile = null;
        }
        this._obj = value;
        if (this._obj != null) {
            this._obj.placedTile = this;
        }
    }

    get objType() {
        if (this._obj == null) {
            return ObjType.None;
        }
        return this._obj.type;
    }

    get placedUnit() {
        return this._placedUnit;
    }
    set placedUnit(value) {
        this._placedUnit = value;
    }

    get neighbors() {
        return this._neighbors;
    }

    addNeighbor(cell) {
        this._neighbors.push(cell);
    }

    get moveWeights() {
        return this._moveWeights;
    }

    examinesIsTeleportationRequiredForThisTile(unit) {
        for (let neighborTile of unit.placedTile.getMovableNeighborTiles(unit, unit.moveCount, false)) {
            if (neighborTile == this) {
                return false;
            }
        }
        return true;
    }

    calculateDistanceTo(posX, posY) {
        return Math.abs(this.posX - posX) + Math.abs(this.posY - posY);
    }

    calculateDistance(targetTile) {
        return this.calculateDistanceTo(targetTile.posX, targetTile.posY);
    }

    calculateDistanceToUnit(unit) {
        return this.calculateDistance(unit.placedTile);
    }

    calculateDistanceToClosestEnemyTile(moveUnit) {
        let alreadyTraced = [this];
        let maxDepth = this.__getMaxDepth();
        let ignoresBreakableWalls = moveUnit.hasWeapon;
        return this._calculateDistanceToClosestTile(
            alreadyTraced, this.placedUnit, maxDepth,
            tile => {
                return tile._placedUnit != null
                    && tile._placedUnit.groupId != this.placedUnit.groupId;
            },
            neighbors => {
            },
            true,
            ignoresBreakableWalls
        );
    }

    calculateUnitMovementCountToThisTile(
        moveUnit,
        fromTile = null,
        inputMaxDepth = -1,
        ignoresUnits = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true, // 天駆の道を考慮するか否か
    ) {
        if (fromTile == null) {
            fromTile = moveUnit.placedTile;
        }

        if (fromTile == this) {
            return 0;
        }

        let ignoresBreakableWalls = moveUnit.hasWeapon;
        let alreadyTraced = [fromTile];

        let maxDepth = inputMaxDepth;
        if (maxDepth < 0) {
            maxDepth = this.__getMaxDepth();
        }
        maxDepth = Math.min(this.__getMaxDepth(), maxDepth);
        return fromTile._calculateDistanceToClosestTile(
            alreadyTraced, moveUnit, maxDepth,
            tile => {
                return tile == this;
            },
            neighbors => {
                // 遅くなってしまった
                // let thisTile = this;
                // neighbors.sort(function (a, b) {
                //     return a.calculateDistance(thisTile) - b.calculateDistance(thisTile);
                // });
            },
            ignoresUnits,
            ignoresBreakableWalls,
            isUnitIgnoredFunc,
            isPathfinderEnabled
        );
    }

    __getMaxDepth() {
        // 最大深度が大きいと処理時間に影響するので現実的にありそうな最大にしておく
        return ((8 - 1) + (6 - 1)) + 4;
    }

    _calculateDistanceToClosestTile(
        alreadyTraced,
        moveUnit,
        maxDepth,
        isTargetTileFunc,
        sortNeighborsFunc,
        ignoresUnits = true,
        ignoresBreakableWalls = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true,
        currentDepth = 0,
        currentDistance = 0,
        closestDistance = CanNotReachTile
    ) {
        let neighbors = this._neighbors;
        sortNeighborsFunc(neighbors);
        for (let neighborTile of neighbors) {
            if (alreadyTraced.includes(neighborTile)) {
                continue;
            }
            alreadyTraced.push(neighborTile);

            let weight = neighborTile.getMoveWeight(
                moveUnit, ignoresUnits, ignoresBreakableWalls, isUnitIgnoredFunc, isPathfinderEnabled);
            if (weight >= CanNotReachTile) {
                // 通行不可
                continue;
            }

            let isObstructTile = weight == ObstructTile;
            if (isObstructTile) {
                // 進軍阻止
                weight = 1;
            }

            let nextDistance = currentDistance + weight;
            if (nextDistance >= closestDistance || nextDistance > maxDepth) {
                // これ以上評価の必要なし
                continue;
            }

            if (isTargetTileFunc(neighborTile)) {
                // 目的のタイルが見つかった
                if (nextDistance < closestDistance) {
                    closestDistance = nextDistance;
                }
                continue;
            }

            if (isObstructTile) {
                continue;
            }

            let nextAlreadyTraced = alreadyTraced.slice(0, alreadyTraced.length);
            let distance = neighborTile._calculateDistanceToClosestTile(
                nextAlreadyTraced,
                moveUnit,
                maxDepth,
                isTargetTileFunc,
                sortNeighborsFunc,
                ignoresUnits,
                ignoresBreakableWalls,
                isUnitIgnoredFunc,
                isPathfinderEnabled,
                currentDepth + 1, nextDistance, closestDistance);

            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    getMovableNeighborTiles(unit, maxDepth, ignoresUnits = false, ignoreWeightsExceptCanNotReach = false) {
        let result = [];
        result.push(this);
        let tracedDepthDict = {};
        tracedDepthDict[this.id] = -1;
        this.getNeighborTilesImpl(result, unit, maxDepth, false, ignoreWeightsExceptCanNotReach, ignoresUnits, tracedDepthDict);
        return result;
    }
    getNeighborTilesImpl(
        result,
        unit,
        maxDepth,
        ignoreWeights,
        ignoreWeightsExceptCanNotReach,
        ignoresUnits,
        tracedDepthDict,
        currentDepth = 0
    ) {
        for (let neighborTile of this._neighbors) {
            let key = neighborTile.id;
            let hasKey = key in tracedDepthDict;
            if (hasKey) {
                let oldDepth = tracedDepthDict[key];
                if (oldDepth <= currentDepth) {
                    continue;
                }
            }

            var weight = 1;
            if (ignoreWeights == false) {
                weight = neighborTile.getMoveWeight(unit, ignoresUnits, false);
            }

            let isObstructTile = weight == ObstructTile;
            if (isObstructTile) {
                // 進軍阻止
                weight = 1;
            }

            if (ignoreWeightsExceptCanNotReach) {
                if (weight != CanNotReachTile) {
                    weight = 1;
                }
            }

            if (weight == CanNotReachTile) {
                tracedDepthDict[key] = -1;
            }

            var nextDepth = currentDepth + weight;
            if (nextDepth > maxDepth) {
                continue;
            }

            tracedDepthDict[key] = currentDepth;
            if (!hasKey) {
                result.push(neighborTile);
            }
            if (isObstructTile) {
                continue;
            }

            neighborTile.getNeighborTilesImpl(
                result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits,
                tracedDepthDict, nextDepth);
        }
    }

    isEnemyUnitAvailable(moveUnit) {
        return this.placedUnit != null
            && this._placedUnit.groupId != moveUnit.groupId;
    }

    getMoveWeight(unit, ignoresUnits, ignoresBreakableWalls = false, isUnitIgnoredFunc = null, isPathfinderEnabled = true) {
        if (this._placedUnit != null && isUnitIgnoredFunc != null && !isUnitIgnoredFunc(this._placedUnit)) {
            // タイルのユニットを無視しないので障害物扱い
            return CanNotReachTile;
        }

        if (!ignoresUnits) {
            if (!unit.canActivatePass()) {
                if (this._placedUnit != null && unit.groupId != this._placedUnit.groupId) {
                    // 敵ユニットだったらオブジェクトと同じ扱い
                    return CanNotReachTile;
                }

                // 隣接マスに進軍阻止持ちがいるか確認
                for (let tile1Space of this.neighbors) {
                    if (tile1Space.isEnemyUnitAvailable(unit)
                        && tile1Space.placedUnit.canActivateObstractToAdjacentTiles(unit)
                    ) {
                        return ObstructTile;
                    }

                    // 2マス以内に進軍阻止持ちがいるか確認
                    for (let tile2Spaces of tile1Space.neighbors) {
                        if (tile2Spaces.isEnemyUnitAvailable(unit)
                            && tile2Spaces.placedUnit.canActivateObstractToTilesIn2Spaces(unit)
                        ) {
                            return ObstructTile;
                        }
                    }
                }
            }
        }

        var weight = this.__getTileMoveWeight(unit, isPathfinderEnabled);
        if (weight != CanNotReachTile && weight != 0) {
            if (unit.weapon == Weapon.FujinYumi && unit.isWeaponRefined && unit.hpPercentage >= 50) {
                weight = 1;
            }
        }
        if (this._obj == null) {
            return weight;
        }

        if (this._obj instanceof TrapBase) {
            return weight;
        }

        if (ignoresBreakableWalls) {
            if (!this._obj.isBreakable) {
                return CanNotReachTile;
            }

            if (this._obj instanceof BreakableWall) {
                return weight;
            }

            if (unit.groupId == UnitGroupType.Ally) {
                if (this._obj instanceof DefenceStructureBase) {
                    return weight;
                }
            }
            else {
                if (this._obj instanceof OffenceStructureBase) {
                    return weight;
                }
            }
        }

        return CanNotReachTile;
    }
}

/// マスの優先度を評価する際に使用するコンテキストです。
class TilePriorityContext {
    constructor(tile, unit) {
        this.unit = unit;
        this.tile = tile;
        this.isDefensiveTile = tile.isDefensiveTile;
        this.isTeleportationRequired = tile.examinesIsTeleportationRequiredForThisTile(unit);
        this.tileType = tile.type;

        // 教授の資料の movement required は移動力に関係ないただの距離のこと
        this.requiredMovementCount = tile.calculateDistanceToUnit(unit);

        // このマスに辿り着いた時の残りの移動力、ワープマスは0
        this.restMovementPower = 0;
        {
            let requiredMovementPower = tile.calculateUnitMovementCountToThisTile(
                unit,
                unit.placedTile,
                unit.moveCount
            );
            if (requiredMovementPower != CanNotReachTile) {
                this.restMovementPower = unit.getNormalMoveCount() - requiredMovementPower;
            }
        }

        this.tilePriority = tile.tilePriority;
        this.distanceFromDiagonal = 0;
        this.isPivotRequired = false;

        // 攻撃マスの決定に必要
        this.combatResult = CombatResult.Draw;
        this.damageRatio = 0;

        // ブロック破壊可能なタイル
        this.attackableTileContexts = [];
        this.bestTileToBreakBlock = null;

        this.priorityToAssist = 0;
        this.priorityToMove = 0;
        this.priorityToBreakBlock = 0;
        this.priorityOfTargetBlock = 0;
        this.priorityToAttack = 0;
    }

    get enemyThreat() {
        return this.tile.getEnemyThreatFor(this.unit.groupId);
    }

    __calcMinDiaglonalDist(targetTile, mapWidth, mapHeight) {
        let origX = targetTile.posX;
        let origY = targetTile.posY;
        let minDiagonalDist = 1000;
        for (let x = origX, y = origY; x < mapWidth && y < mapHeight; ++x, ++y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x < mapWidth && y >= 0; ++x, --y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x >= 0 && y < mapHeight; --x, ++y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x >= 0 && y >= 0; --x, --y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        return minDiagonalDist;
    }

    calcPriorityToAssist(assistUnit) {
        if (assistUnit.supportInfo == null) {
            return;
        }

        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        if (assistUnit.support == Support.Pivot) {
            this.priorityToAssist =
                defensiveTileWeight * 10000000
                - this.enemyThreat * 1000000
                + this.tilePriority;
        }
        else if (assistUnit.supportInfo.assistType == AssistType.Move) {
            let teleportationRequirementWeight = 0;
            let requiredMovementCount = this.requiredMovementCount;
            if (this.isTeleportationRequired) {
                teleportationRequirementWeight = 1;
                requiredMovementCount = 0;
            }
            this.priorityToAssist =
                defensiveTileWeight * 100000
                - this.enemyThreat * 10000
                + teleportationRequirementWeight * 5000
                - requiredMovementCount * 100
                + this.tilePriority;
        }
        else {
            let teleportationRequirementWeight = 0;
            let requiredMovementCount = this.requiredMovementCount;
            if (this.isTeleportationRequired) {
                teleportationRequirementWeight = 1;
                requiredMovementCount = 0;
            }
            let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);
            this.priorityToAssist =
                defensiveTileWeight * 1000000
                - this.enemyThreat * 110000
                + teleportationRequirementWeight * 50000
                + tileTypeWeight * 5000
                - requiredMovementCount * 100
                + this.tilePriority;
        }
    }

    calcPriorityToBreakBlock() {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }
        this.priorityToBreakBlock =
            defensiveTileWeight * 10000000
            - this.enemyThreat * 1000000
            + teleportationRequirementWeight * 500000
            + tileTypeWeight * 2000
            - requiredMovementCount * 100
            + this.tilePriority;
    }

    calcPriorityToMoveByCanto(moveUnit, mapWidth, mapHeight) {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(moveUnit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }

        this.distanceFromDiagonal = this.__calcMinDiaglonalDist(moveUnit.placedTile, mapWidth, mapHeight);

        this.priorityToMove =
            - this.enemyThreat * 10000000
            - this.restMovementPower * 1000000
            + defensiveTileWeight * 100000
            - this.distanceFromDiagonal * 5000
            + teleportationRequirementWeight * 2500
            - requiredMovementCount * 100
            + this.tilePriority;
    }

    calcPriorityToMove(moveUnit, chaseTargetTile, mapWidth, mapHeight) {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(moveUnit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) { teleportationRequirementWeight = 1; requiredMovementCount = 0; }

        this.distanceFromDiagonal = this.__calcMinDiaglonalDist(chaseTargetTile, mapWidth, mapHeight);

        this.priorityToMove =
            defensiveTileWeight * 10000000
            - this.enemyThreat * 1000000
            + teleportationRequirementWeight * 500000
            - pivotRequiredPriority * 100000
            - this.distanceFromDiagonal * 10000
            + tileTypeWeight * 2000
            - requiredMovementCount * 100
            + this.tilePriority;
    }

    calcPriorityToAttack() {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }
        let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);
        let combatResultPriority = this.__getCombatResultPriority();

        this.priorityToAttack =
            combatResultPriority * 400000 * 3 * 500 // とりあえず最大500ダメージ想定
            + this.damageRatio * 400000
            + defensiveTileWeight * 200000
            - this.enemyThreat * 20000
            + teleportationRequirementWeight * 10000
            + tileTypeWeight * 2000
            - requiredMovementCount * 100
            - this.tilePriority;
    }

    __getCombatResultPriority() {
        switch (this.combatResult) {
            case CombatResult.Loss: return 0;
            case CombatResult.Draw: return 1;
            case CombatResult.Win: return 2;
        }
    }

    __getTileTypePriority(unit, type) {
        switch (type) {
            case TileType.DefensiveForest:
            case TileType.Forest:
                return 2;
            case TileType.Flier:
                return 3;
            case TileType.DefensiveTrench:
            case TileType.Trench:
                if (unit.moveType == MoveType.Cavalry) {
                    return 1;
                }
                else {
                    return 0;
                }
            case TileType.Wall: return 0;
            case TileType.DefensiveTile: return 0;
            case TileType.Normal: return 0;
            default: return 0;
        }
    }
}
/// @file
/// @brief Map クラスとそれに関連するクラスや関数等の定義です。

const MapType_ArenaOffset = 50;
const MapType_ResonantBattlesOffset = MapType_ArenaOffset + 100;
const MapType_TempestTrialsOffset = MapType_ResonantBattlesOffset + 1000;
const MapType = {
    None: -1,

    // 飛空城
    Izumi: 0,
    Hyosetsu: 1,
    Haikyo: 2,
    Yukigesho: 3,
    Sabaku: 4,
    Harukaze: 5,
    Komorebi: 6,
    Wasurerareta: 7,
    Natsukusa: 8,
    Syakunetsu: 9,

    // 闘技場
    // https://feheroes.gamepedia.com/List_of_Arena_maps
    Arena_1: MapType_ArenaOffset + 0,
    Arena_2: MapType_ArenaOffset + 1,
    Arena_3: MapType_ArenaOffset + 2,
    Arena_4: MapType_ArenaOffset + 3,
    Arena_5: MapType_ArenaOffset + 4,
    Arena_6: MapType_ArenaOffset + 5,
    Arena_7: MapType_ArenaOffset + 6,
    Arena_8: MapType_ArenaOffset + 7,
    Arena_9: MapType_ArenaOffset + 8,
    Arena_10: MapType_ArenaOffset + 9,

    Arena_11: MapType_ArenaOffset + 10,
    Arena_12: MapType_ArenaOffset + 11,
    Arena_13: MapType_ArenaOffset + 12,
    Arena_14: MapType_ArenaOffset + 13,
    Arena_15: MapType_ArenaOffset + 14,
    Arena_16: MapType_ArenaOffset + 15,
    Arena_17: MapType_ArenaOffset + 16,
    Arena_18: MapType_ArenaOffset + 17,
    Arena_19: MapType_ArenaOffset + 18,
    Arena_20: MapType_ArenaOffset + 19,

    Arena_21: MapType_ArenaOffset + 20,
    Arena_22: MapType_ArenaOffset + 21,
    Arena_23: MapType_ArenaOffset + 22,
    Arena_24: MapType_ArenaOffset + 23,
    Arena_25: MapType_ArenaOffset + 24,

    Arena_26: MapType_ArenaOffset + 25,
    Arena_27: MapType_ArenaOffset + 26,
    Arena_28: MapType_ArenaOffset + 27,
    Arena_29: MapType_ArenaOffset + 28,
    Arena_30: MapType_ArenaOffset + 29,

    Arena_31: MapType_ArenaOffset + 30,
    Arena_32: MapType_ArenaOffset + 31,
    Arena_33: MapType_ArenaOffset + 32,
    Arena_34: MapType_ArenaOffset + 33,
    Arena_35: MapType_ArenaOffset + 34,
    Arena_46: MapType_ArenaOffset + 45,
    Arena_47: MapType_ArenaOffset + 46,
    Arena_48: MapType_ArenaOffset + 47,
    Arena_49: MapType_ArenaOffset + 48,
    Arena_50: MapType_ArenaOffset + 49,

    // 双界
    ResonantBattles_Default: MapType_ResonantBattlesOffset + 0,
    ResonantBattles_1: MapType_ResonantBattlesOffset + 1,
    ResonantBattles_2: MapType_ResonantBattlesOffset + 2,
    ResonantBattles_3: MapType_ResonantBattlesOffset + 3,
    ResonantBattles_4: MapType_ResonantBattlesOffset + 4,
    ResonantBattles_5: MapType_ResonantBattlesOffset + 5,
    ResonantBattles_6: MapType_ResonantBattlesOffset + 6,
    ResonantBattles_7: MapType_ResonantBattlesOffset + 7,
    ResonantBattles_8: MapType_ResonantBattlesOffset + 8,

    // 戦渦の連戦
    TempestTrials_KojoNoTakaraSagashi: MapType_TempestTrialsOffset + 0,
    TempestTrials_ButosaiNoKyodai: MapType_TempestTrialsOffset + 1,
    TempestTrials_ShinmaiNinjaNoHatsuNinmu: MapType_TempestTrialsOffset + 2,
};
const DefaultResonantBattleMap = MapType.ResonantBattles_8;
const DefaultTempestTrialsMap = MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu;
const AetherRaidMapImageFiles = [
    { id: MapType.Haikyo, fileName: "Haikyo.png" },
    { id: MapType.Harukaze, fileName: "Harukaze.png" },
    { id: MapType.Hyosetsu, fileName: "Hyosetsu.png" },
    { id: MapType.Izumi, fileName: "Izumi.png" },
    { id: MapType.Komorebi, fileName: "Komorebi.png" },
    { id: MapType.Natsukusa, fileName: "Natsukusa.png" },
    { id: MapType.Sabaku, fileName: "Sabaku.png" },
    { id: MapType.Syakunetsu, fileName: "Syakunetsu.png" },
    { id: MapType.Wasurerareta, fileName: "Wasurerareta.png" },
    { id: MapType.Yukigesho, fileName: "Yukigesyo.png" },
];
const ArenaMapImageFiles = [
    { id: MapType.Arena_1, fileName: "Arena_1.jpg" },
    { id: MapType.Arena_2, fileName: "Arena_2.png" },
    { id: MapType.Arena_3, fileName: "Arena_3.jpg" },
    { id: MapType.Arena_4, fileName: "Arena_4.png" },
    { id: MapType.Arena_5, fileName: "Arena_5.jpg" },
    { id: MapType.Arena_6, fileName: "Arena_6.png" },
    { id: MapType.Arena_7, fileName: "Arena_7.png" },
    { id: MapType.Arena_8, fileName: "Arena_8.png" },
    { id: MapType.Arena_9, fileName: "Arena_9.png" },
    { id: MapType.Arena_10, fileName: "Arena_10.png" },
    { id: MapType.Arena_11, fileName: "Arena_11.png" },
    { id: MapType.Arena_12, fileName: "Arena_12.png" },
    { id: MapType.Arena_13, fileName: "Arena_13.png" },
    { id: MapType.Arena_14, fileName: "Arena_14.png" },
    { id: MapType.Arena_15, fileName: "Arena_15.png" },
    { id: MapType.Arena_16, fileName: "Arena_16.png" },
    { id: MapType.Arena_17, fileName: "Arena_17.png" },
    { id: MapType.Arena_18, fileName: "Arena_18.png" },
    { id: MapType.Arena_19, fileName: "Arena_19.png" },
    { id: MapType.Arena_20, fileName: "Arena_20.png" },
    { id: MapType.Arena_21, fileName: "Arena_21.png" },
    { id: MapType.Arena_22, fileName: "Arena_22.png" },
    { id: MapType.Arena_23, fileName: "Arena_23.png" },
    { id: MapType.Arena_24, fileName: "Arena_24.png" },
    { id: MapType.Arena_25, fileName: "Arena_25.png" },
    { id: MapType.Arena_26, fileName: "Arena_26.jpg" },
    { id: MapType.Arena_27, fileName: "Arena_27.jpg" },
    { id: MapType.Arena_28, fileName: "Arena_28.jpg" },
    { id: MapType.Arena_29, fileName: "Arena_29.jpg" },
    { id: MapType.Arena_30, fileName: "Arena_30.png" },
    { id: MapType.Arena_31, fileName: "Arena_31.png" },
    { id: MapType.Arena_32, fileName: "Arena_32.png" },
    { id: MapType.Arena_33, fileName: "Arena_33.png" },
    { id: MapType.Arena_34, fileName: "Arena_34.png" },
    { id: MapType.Arena_35, fileName: "Arena_35.png" },
    { id: MapType.Arena_46, fileName: "Arena_46.png" },
    { id: MapType.Arena_47, fileName: "Arena_47.png" },
    { id: MapType.Arena_48, fileName: "Arena_48.png" },
    { id: MapType.Arena_49, fileName: "Arena_49.png" },
    { id: MapType.Arena_50, fileName: "Arena_50.png" },
];

const ResonantBattlesMapKindOptions = [
    { label: "更地", value: MapType.ResonantBattles_Default },
    { label: "2020/7/21～", value: MapType.ResonantBattles_1 },
    { label: "2020/7/28～", value: MapType.ResonantBattles_2 },
    { label: "2020/8/4～", value: MapType.ResonantBattles_3 },
    { label: "2020/8/11～", value: MapType.ResonantBattles_4 },
    { label: "2020/8/18～", value: MapType.ResonantBattles_5 },
    { label: "2020/8/25～", value: MapType.ResonantBattles_6 },
    { label: "2020/9/1～", value: MapType.ResonantBattles_7 },
    { label: "2020/9/8～", value: MapType.ResonantBattles_8 },
];

const TempestTrialsMapKindOptions = [
    { label: "皇女の宝探し(2020/8/8～)", value: MapType.TempestTrials_KojoNoTakaraSagashi },
    { label: "舞踏祭の兄妹(2020/9/8～)", value: MapType.TempestTrials_ButosaiNoKyodai },
    { label: "新米忍者の初任務(2020/11/07～)", value: MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu },
];

const ArenaMapKindOptions = [
    { label: "マップ1", value: MapType.Arena_1 },
    { label: "マップ2", value: MapType.Arena_2 },
    { label: "マップ3", value: MapType.Arena_3 },
    { label: "マップ4", value: MapType.Arena_4 },
    { label: "マップ5", value: MapType.Arena_5 },
    { label: "マップ6", value: MapType.Arena_6 },
    { label: "マップ7", value: MapType.Arena_7 },
    { label: "マップ8", value: MapType.Arena_8 },
    { label: "マップ9", value: MapType.Arena_9 },
    { label: "マップ10", value: MapType.Arena_10 },
    { label: "マップ11", value: MapType.Arena_11 },
    { label: "マップ12", value: MapType.Arena_12 },
    { label: "マップ13", value: MapType.Arena_13 },
    { label: "マップ14", value: MapType.Arena_14 },
    { label: "マップ15", value: MapType.Arena_15 },
    { label: "マップ16", value: MapType.Arena_16 },
    { label: "マップ17", value: MapType.Arena_17 },
    { label: "マップ18", value: MapType.Arena_18 },
    { label: "マップ19", value: MapType.Arena_19 },
    { label: "マップ20", value: MapType.Arena_20 },
    { label: "マップ21", value: MapType.Arena_21 },
    { label: "マップ22", value: MapType.Arena_22 },
    { label: "マップ23", value: MapType.Arena_23 },
    { label: "マップ24", value: MapType.Arena_24 },
    { label: "マップ25", value: MapType.Arena_25 },
    { label: "マップ26", value: MapType.Arena_26 },
    { label: "マップ27", value: MapType.Arena_27 },
    { label: "マップ28", value: MapType.Arena_28 },
    { label: "マップ29", value: MapType.Arena_29 },
    { label: "マップ30", value: MapType.Arena_30 },
    { label: "マップ31", value: MapType.Arena_31 },
    { label: "マップ32", value: MapType.Arena_32 },
    { label: "マップ33", value: MapType.Arena_33 },
    { label: "マップ34", value: MapType.Arena_34 },
    { label: "マップ35", value: MapType.Arena_35 },
    { label: "マップ46", value: MapType.Arena_46 },
    { label: "マップ47", value: MapType.Arena_47 },
    { label: "マップ48", value: MapType.Arena_48 },
    { label: "マップ49", value: MapType.Arena_49 },
    { label: "マップ50", value: MapType.Arena_50 },
];

const ArenaMapRotation = [
    // 1
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 2
    [
        { label: "マップ1", value: MapType.Arena_11 },
        { label: "マップ2", value: MapType.Arena_12 },
        { label: "マップ3", value: MapType.Arena_13 },
        { label: "マップ4", value: MapType.Arena_14 },
        { label: "マップ5", value: MapType.Arena_15 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 3
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_21 },
        { label: "マップ7", value: MapType.Arena_22 },
        { label: "マップ8", value: MapType.Arena_23 },
        { label: "マップ9", value: MapType.Arena_24 },
        { label: "マップ10", value: MapType.Arena_25 },
    ],
    // 4
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 5
    [
        { label: "マップ1", value: MapType.Arena_21 },
        { label: "マップ2", value: MapType.Arena_22 },
        { label: "マップ3", value: MapType.Arena_23 },
        { label: "マップ4", value: MapType.Arena_24 },
        { label: "マップ5", value: MapType.Arena_25 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 6
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_11 },
        { label: "マップ7", value: MapType.Arena_12 },
        { label: "マップ8", value: MapType.Arena_13 },
        { label: "マップ9", value: MapType.Arena_14 },
        { label: "マップ10", value: MapType.Arena_15 },
    ],
    // 7
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 8
    [
        { label: "マップ1", value: MapType.Arena_21 },
        { label: "マップ2", value: MapType.Arena_22 },
        { label: "マップ3", value: MapType.Arena_23 },
        { label: "マップ4", value: MapType.Arena_24 },
        { label: "マップ5", value: MapType.Arena_25 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 9
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_11 },
        { label: "マップ7", value: MapType.Arena_12 },
        { label: "マップ8", value: MapType.Arena_13 },
        { label: "マップ9", value: MapType.Arena_14 },
        { label: "マップ10", value: MapType.Arena_15 },
    ],
    // 10
    [
        { label: "マップ1", value: MapType.Arena_1 },
        { label: "マップ2", value: MapType.Arena_2 },
        { label: "マップ3", value: MapType.Arena_3 },
        { label: "マップ4", value: MapType.Arena_4 },
        { label: "マップ5", value: MapType.Arena_5 },
        { label: "マップ6", value: MapType.Arena_16 },
        { label: "マップ7", value: MapType.Arena_17 },
        { label: "マップ8", value: MapType.Arena_18 },
        { label: "マップ9", value: MapType.Arena_19 },
        { label: "マップ10", value: MapType.Arena_20 },
    ],
    // 11
    [
        { label: "マップ1", value: MapType.Arena_11 },
        { label: "マップ2", value: MapType.Arena_12 },
        { label: "マップ3", value: MapType.Arena_13 },
        { label: "マップ4", value: MapType.Arena_14 },
        { label: "マップ5", value: MapType.Arena_15 },
        { label: "マップ6", value: MapType.Arena_6 },
        { label: "マップ7", value: MapType.Arena_7 },
        { label: "マップ8", value: MapType.Arena_8 },
        { label: "マップ9", value: MapType.Arena_9 },
        { label: "マップ10", value: MapType.Arena_10 },
    ],
    // 12
    [
        { label: "マップ1", value: MapType.Arena_26 },
        { label: "マップ2", value: MapType.Arena_27 },
        { label: "マップ3", value: MapType.Arena_28 },
        { label: "マップ4", value: MapType.Arena_29 },
        { label: "マップ5", value: MapType.Arena_30 },
        { label: "マップ6", value: MapType.Arena_21 },
        { label: "マップ7", value: MapType.Arena_22 },
        { label: "マップ8", value: MapType.Arena_23 },
        { label: "マップ9", value: MapType.Arena_24 },
        { label: "マップ10", value: MapType.Arena_25 },
    ],
];

function tileTypeToThumb(tileType, mapType) {
    switch (tileType) {
        case TileType.Wall: return g_imageRootPath + 'Wall.jpg';
        case TileType.Trench: return g_imageRootPath + 'Trench.png';
        case TileType.DefensiveForest: return g_imageRootPath + 'DefensiveForest.png';
        case TileType.DefensiveTrench: return g_imageRootPath + 'DefensiveTrench.jpg';
        case TileType.Forest: return g_imageRootPath + 'Forest.png';
        case TileType.DefensiveTile: return g_imageRootPath + 'DefensiveTile.png';
        case TileType.Flier:
            switch (mapType) {
                case MapType.Sabaku:
                case MapType.Arena_5:
                case MapType.Arena_9:
                case MapType.Arena_12:
                case MapType.Arena_15:
                case MapType.Arena_20:
                case MapType.Arena_27:
                case MapType.Arena_28:
                case MapType.Arena_29:
                    return g_imageRootPath + 'Mountain.png';
                case MapType.Syakunetsu:
                case MapType.Arena_4:
                case MapType.Arena_10:
                case MapType.Arena_11:
                    return g_imageRootPath + 'Lava.png';
                case MapType.Izumi:
                    return g_imageRootPath + 'Pond.png';
                case MapType.Arena_22:
                    return g_imageRootPath + 'Cliff.png';
                default:
                    return g_imageRootPath + 'Flier.png';
            }
        default:
            return null;
    }
}

const DefaultTileColor = "#eee";
const SelectedTileColor = "#ffffff99";

function tileTypeToColor(type) {
    switch (type) {
        case TileType.Forest: return '#9c9';
        case TileType.Flier: return DefaultTileColor;
        case TileType.DefensiveTrench: return '#eee';
        case TileType.DefensiveTile: return '#ffc';
        case TileType.Trench:
            return DefaultTileColor;
        case TileType.Wall:
        case TileType.Normal:
        default:
            return DefaultTileColor;
    }
}

function getMapBackgroundImage(mapKind) {
    const root = g_imageRootPath + "TableBackground/";
    const arenaRoot = g_imageRootPath + "Maps/";
    switch (mapKind) {
        case MapType.Izumi: return root + "Izumi.png";
        case MapType.Haikyo: return root + "Haikyo.png";
        case MapType.Harukaze: return root + "Harukaze.png";
        case MapType.Hyosetsu: return root + "Hyosetsu.png";
        case MapType.Komorebi: return root + "Komorebi.png";
        case MapType.Natsukusa: return root + "Natsukusa.png";
        case MapType.Sabaku: return root + "Sabaku.png";
        case MapType.Syakunetsu: return root + "Syakunetsu.png";
        case MapType.Wasurerareta: return root + "Wasurerareta.png";
        case MapType.Yukigesho: return root + "Yukigesyo.png";
        case MapType.Arena_1: return arenaRoot + "Arena_1.jpg";
        case MapType.Arena_2: return arenaRoot + "Arena_2.png";
        case MapType.Arena_3: return arenaRoot + "Arena_3.jpg";
        case MapType.Arena_4: return arenaRoot + "Arena_4.png";
        case MapType.Arena_5: return arenaRoot + "Arena_5.jpg";
        case MapType.Arena_6: return arenaRoot + "Arena_6.png";
        case MapType.Arena_7: return arenaRoot + "Arena_7.png";
        case MapType.Arena_8: return arenaRoot + "Arena_8.png";
        case MapType.Arena_9: return arenaRoot + "Arena_9.png";
        case MapType.Arena_10: return arenaRoot + "Arena_10.png";
        case MapType.Arena_11: return arenaRoot + "Arena_11.png";
        case MapType.Arena_12: return arenaRoot + "Arena_12.png";
        case MapType.Arena_13: return arenaRoot + "Arena_13.png";
        case MapType.Arena_14: return arenaRoot + "Arena_14.png";
        case MapType.Arena_15: return arenaRoot + "Arena_15.png";
        case MapType.Arena_16: return arenaRoot + "Arena_16.png";
        case MapType.Arena_17: return arenaRoot + "Arena_17.png";
        case MapType.Arena_18: return arenaRoot + "Arena_18.png";
        case MapType.Arena_19: return arenaRoot + "Arena_19.png";
        case MapType.Arena_20: return arenaRoot + "Arena_20.png";
        case MapType.Arena_21: return arenaRoot + "Arena_21.png";
        case MapType.Arena_22: return arenaRoot + "Arena_22.png";
        case MapType.Arena_23: return arenaRoot + "Arena_23.png";
        case MapType.Arena_24: return arenaRoot + "Arena_24.png";
        case MapType.Arena_25: return arenaRoot + "Arena_25.png";
        case MapType.Arena_26: return arenaRoot + "Arena_26.jpg";
        case MapType.Arena_27: return arenaRoot + "Arena_27.jpg";
        case MapType.Arena_28: return arenaRoot + "Arena_28.jpg";
        case MapType.Arena_29: return arenaRoot + "Arena_29.jpg";
        case MapType.Arena_30: return arenaRoot + "Arena_30.png";
        case MapType.Arena_31: return arenaRoot + "Arena_31.png";
        case MapType.Arena_32: return arenaRoot + "Arena_32.png";
        case MapType.Arena_33: return arenaRoot + "Arena_33.png";
        case MapType.Arena_34: return arenaRoot + "Arena_34.png";
        case MapType.Arena_35: return arenaRoot + "Arena_35.png";
        case MapType.Arena_46: return arenaRoot + "Arena_46.png";
        case MapType.Arena_47: return arenaRoot + "Arena_47.png";
        case MapType.Arena_48: return arenaRoot + "Arena_48.png";
        case MapType.Arena_49: return arenaRoot + "Arena_49.png";
        case MapType.Arena_50: return arenaRoot + "Arena_50.png";
        default:
            throw new Error("Unknown map type " + mapKind);
    }
}

/// 戦闘マップを表すクラスです。
class Map {
    constructor(id, mapKind, gameVersion) {
        this._gameVersion = 0;
        this._type = -1;
        this._id = id;
        this._height = 0;
        this._width = 0;
        this._tiles = [];
        this._units = [];
        this._breakableWalls = [];
        this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));
        this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));
        this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));

        this._walls = [];
        this._walls.push(new Wall(g_idGenerator.generate()));
        this._walls.push(new Wall(g_idGenerator.generate()));

        // id の互換を維持するためにここから追加
        for (let i = this._breakableWalls.length; i < 16; ++i) {
            this._breakableWalls.push(new BreakableWall(g_idGenerator.generate()));
        }

        for (let i = this._walls.length; i < 16; ++i) {
            this._walls.push(new Wall(g_idGenerator.generate()));
        }

        this._showEnemyAttackRange = false;
        this._showAllyAttackRange = false;
        this._showClosestDistanceToEnemy = false;
        this._table = null;
        this.cellOffsetX = 0;
        this.cellOffsetY = 0;
        this.cellWidth = 38;
        this.cellHeight = 38;
        this.isHeaderEnabled = false;
        this.isIconOverlayDisabled = false;
        this.isTrapIconOverlayDisabled = false;

        this.isBackgroundImageEnabled = true;

        this.setMapSizeToNormal();

        this.changeMapKind(mapKind, gameVersion);

        this.sourceCode = "";

        // 拡張枠のユニットかどうかを判定する関数
        this.isExpansionUnitFunc = null;
    }

    perTurnStatusToString() {
        return "";
    }

    turnWideStatusToString() {
        let result = "";
        // for (let tile of this._tiles) {
        //     result += tile.serialId + NameValueDelimiter + tile.turnWideStatusToString() + ElemDelimiter;
        // }
        return result;
    }

    fromPerTurnStatusString(value) {
    }

    fromTurnWideStatusString(elemTexts) {
        // for (var i = 0; i < elemTexts.length; ++i) {
        //     var elemText = elemTexts[i];
        //     var splited = elemText.split(NameValueDelimiter);
        //     var serialId = splited[0];
        //     var value = splited[1];
        // }
    }

    /// すべてのタイルのスナップショットを作成します。スナップショットはNPCの動きの判定に使用します。
    createTileSnapshots() {
        for (let tile of this._tiles) {
            tile.createSnapshot();
        }
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    setMapSize(width, height) {
        if (this._width == width && this._height == height) {
            return;
        }

        this._width = width;
        this._height = height;

        this._tiles = [];
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var tile = new Tile(x, y);
                tile.tilePriority = x + (this._height - (y + 1)) * this._width;
                this._tiles.push(tile);
            }
        }

        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var tile = this.getTile(x, y);
                if (x + 1 < this._width) {
                    tile.addNeighbor(this.getTile(x + 1, y));
                }
                if (x - 1 >= 0) {
                    tile.addNeighbor(this.getTile(x - 1, y));
                }
                if (y + 1 < this._height) {
                    tile.addNeighbor(this.getTile(x, y + 1));
                }
                if (y - 1 >= 0) {
                    tile.addNeighbor(this.getTile(x, y - 1));
                }
            }
        }
    }

    setMapSizeToNormal() {
        this.setMapSize(6, 8);
    }
    setMapSizeToLarge() {
        this.setMapSize(8, 10);
    }

    setMapSizeToPawnsOfLoki() {
        this.setMapSize(4, 5);
    }

    resetOverriddenTiles() {
        for (let tile of this._tiles) {
            tile.resetOverriddenCell();
        }
    }

    getPosFromCellId(cellId) {
        let xy = getPositionFromCellId(cellId);
        let x = Number(xy[0]) - this.cellOffsetX;
        let y = Number(xy[1]) - this.cellOffsetY;
        return [x, y];
    }

    get id() {
        return this._id;
    }

    get showClosestDistanceToEnemy() {
        return this._showClosestDistanceToEnemy;
    }
    set showClosestDistanceToEnemy(value) {
        return this._showClosestDistanceToEnemy = value;
    }

    get showEnemyAttackRange() {
        return this._showEnemyAttackRange;
    }
    set showEnemyAttackRange(value) {
        return this._showEnemyAttackRange = value;
    }

    get showAllyAttackRange() {
        return this._showAllyAttackRange;
    }
    set showAllyAttackRange(value) {
        return this._showAllyAttackRange = value;
    }

    get breakableObjCountOfCurrentMapType() {
        switch (this._type) {
            case MapType.Izumi: // 泉の城
            case MapType.Hyosetsu: // 氷雪の城
            case MapType.Sabaku: // 砂漠の城
            case MapType.Komorebi: // 木漏れ日の城
            case MapType.Wasurerareta: // 忘れられた城
            case MapType.Natsukusa: // 夏草の城
            case MapType.Syakunetsu: // 灼熱の城
            case MapType.Yukigesho: // 雪化粧の城
                return 1;
            case MapType.Haikyo: // 廃墟の城
                return 3;
            case MapType.Harukaze: // 春風の城
                return 3;
            case MapType.Arena_3:
                return 14;
            case MapType.Arena_7:
                return 2;
            case MapType.Arena_10:
                return 2;
            case MapType.Arena_12:
                return 12;
            case MapType.Arena_13:
                return 8;
            case MapType.Arena_16:
                return 2;
            case MapType.Arena_17:
                return 4;
            case MapType.Arena_18:
                return 4;
            case MapType.Arena_19:
                return 4;
            case MapType.Arena_21:
                return 8;
            case MapType.Arena_26:
                return 12;
            case MapType.Arena_29:
                return 8;
            case MapType.Arena_31: return 4;
            case MapType.Arena_33: return 8;
            case MapType.Arena_34: return 2;
            case MapType.Arena_46: return 8;
            case MapType.Arena_48: return 7;
            case MapType.Arena_49: return 4;
            case MapType.Arena_50: return 7;
            case MapType.ResonantBattles_Default:
                return 8;
            case MapType.ResonantBattles_1:
                return 6;
            case MapType.ResonantBattles_2:
                return 9;
            case MapType.ResonantBattles_3:
            case MapType.ResonantBattles_4:
                return 0;
            case MapType.ResonantBattles_5: return 5;
            case MapType.ResonantBattles_6: return 4;
            case MapType.ResonantBattles_7: return 5;
            case MapType.ResonantBattles_8: return 3;
            case MapType.TempestTrials_KojoNoTakaraSagashi: return 1;
            case MapType.TempestTrials_ButosaiNoKyodai: return 0;
            case MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu: return 0;
            default:
                return 0;
        }
    }

    changeMapKind(mapKind, gameVersion) {
        if (this._type == mapKind && this._gameVersion == gameVersion) {
            return;
        }

        this._type = mapKind;
        this._gameVersion = gameVersion;
        this.resetPlacement();
    }

    resetPlacement(withUnits = false) {
        for (var i = 0; i < this._tiles.length; ++i) {
            var tile = this._tiles[i];
            tile.type = TileType.Normal;
            if (tile.obj != null) {
                if (tile.obj instanceof BreakableWall || tile.obj instanceof Wall) {
                    tile.setObj(null);
                }
            }
        }
        switch (this._type) {
            case MapType.None:
                break;
            case MapType.Izumi: // 泉の城
                {
                    this.setTileType(0, 4, TileType.Flier);
                    this.setTileType(5, 2, TileType.Flier);
                }
                break;
            case MapType.Hyosetsu: // 氷雪の城
                {
                    this.setTileType(1, 2, TileType.Forest);
                    this.setTileType(4, 4, TileType.Forest);
                    this.setTileType(3, 5, TileType.Forest);
                }
                break;
            case MapType.Haikyo: // 廃墟の城
                {
                    if (this._gameVersion == 360) {
                        this.__placeObjForcibly(this._walls[0], 2, 4);
                        this.__placeObjForcibly(this._breakableWalls[0], 1, 4);
                    }
                    else {
                        this.__placeObjForcibly(this._walls[1], 1, 4);
                        this.__placeObjForcibly(this._breakableWalls[0], 2, 4);
                    }
                    this.__placeObjForcibly(this._breakableWalls[1], 4, 4);
                    this.__placeObjForcibly(this._breakableWalls[2], 0, 2);
                    this.__setBreakableWallIconType(BreakableWallIconType.Wall);
                }
                break;
            case MapType.Yukigesho: // 雪化粧の城
                {
                    if (this._gameVersion == 360) {
                        this.__placeObjForcibly(this._breakableWalls[0], 0, 4);
                    }
                    else {
                        this.__placeObjForcibly(this._walls[0], 0, 4);
                    }
                    this.setTileType(1, 3, TileType.DefensiveTrench);
                    this.setTileType(2, 5, TileType.Forest);
                    this.setTileType(5, 2, TileType.DefensiveTrench);
                    this.__setBreakableWallIconType(BreakableWallIconType.Wall);
                }
                break;
            case MapType.Sabaku: // 砂漠の城
                {
                    this.setTileType(2, 2, TileType.Flier);
                    this.setTileType(2, 5, TileType.Flier);
                    this.setTileType(3, 5, TileType.Flier);
                }
                break;
            case MapType.Harukaze: // 春風の城
                {
                    this.__placeObjForcibly(this._walls[0], 2, 5);
                    if (this._gameVersion == 360) {
                        this.__placeObjForcibly(this._breakableWalls[2], 5, 5);
                    }
                    else {
                        this.__placeObjForcibly(this._walls[1], 5, 5);
                    }

                    this.__placeObjForcibly(this._breakableWalls[0], 0, 2);
                    this.__placeObjForcibly(this._breakableWalls[1], 3, 2);
                    this.__setBreakableWallIconType(BreakableWallIconType.Wall);
                }
                break;
            case MapType.Komorebi: // 木漏れ日の城
                {
                    this.setTileType(1, 4, TileType.Trench);
                    this.setTileType(2, 4, TileType.Forest);
                    this.setTileType(3, 2, TileType.Trench);
                    this.setTileType(4, 2, TileType.Trench);
                }
                break;
            case MapType.Wasurerareta: // 忘れられた城
                {
                    this.setTileType(1, 2, TileType.DefensiveTile);
                    this.setTileType(2, 2, TileType.DefensiveTile);
                    this.setTileType(1, 3, TileType.Forest);
                    this.__placeObjForcibly(this._walls[0], 5, 4);
                }
                break;
            case MapType.Natsukusa: // 夏草の城
                {
                    this.setTileType(3, 2, TileType.Forest);
                    this.setTileType(4, 2, TileType.Forest);
                    this.setTileType(4, 5, TileType.Forest);
                }
                break;
            case MapType.Syakunetsu: // 灼熱の城
                {
                    this.setTileType(5, 2, TileType.Flier);
                    this.setTileType(2, 4, TileType.Flier);
                    this.setTileType(2, 5, TileType.Flier);
                }
                break;
            case MapType.Arena_1:
                this.setTileType(0, 0, TileType.Forest);
                this.setTileType(0, 4, TileType.Forest);
                this.setTileType(0, 7, TileType.Forest);
                this.setTileType(1, 2, TileType.Forest);
                this.setTileType(2, 4, TileType.Forest);
                this.setTileType(2, 5, TileType.Forest);
                this.setTileType(2, 7, TileType.Forest);
                this.setTileType(3, 0, TileType.Forest);
                this.setTileType(3, 2, TileType.Forest);
                this.setTileType(3, 3, TileType.Forest);
                this.setTileType(4, 0, TileType.Forest);
                this.setTileType(4, 5, TileType.Forest);
                this.setTileType(5, 2, TileType.Forest);
                this.setTileType(5, 4, TileType.Forest);
                this.setTileType(5, 7, TileType.Forest);

                if (withUnits) {
                    this.__placeEnemyUnitBySlotIfExists(0, 1, 1);
                    this.__placeEnemyUnitBySlotIfExists(1, 2, 1);
                    this.__placeEnemyUnitBySlotIfExists(2, 3, 1);
                    this.__placeEnemyUnitBySlotIfExists(3, 4, 1);

                    this.__placeAllyUnitBySlotIfExists(0, 1, 6);
                    this.__placeAllyUnitBySlotIfExists(1, 2, 6);
                    this.__placeAllyUnitBySlotIfExists(2, 3, 6);
                    this.__placeAllyUnitBySlotIfExists(3, 4, 6);
                }

                break;
            case MapType.Arena_2:
                this.setTileType(0, 1, TileType.Flier);
                this.setTileType(0, 2, TileType.Flier);
                this.setTileType(0, 3, TileType.Forest);
                this.setTileType(0, 5, TileType.Flier);
                this.setTileType(0, 6, TileType.Flier);
                this.setTileType(0, 7, TileType.Flier);
                this.setTileType(2, 1, TileType.Flier);
                this.setTileType(2, 2, TileType.Flier);
                this.setTileType(2, 4, TileType.Forest);
                this.setTileType(2, 5, TileType.Flier);
                this.setTileType(2, 6, TileType.Flier);
                this.setTileType(4, 0, TileType.Forest);
                this.setTileType(4, 1, TileType.Flier);
                this.setTileType(4, 2, TileType.Flier);
                this.setTileType(4, 3, TileType.Forest);
                this.setTileType(4, 5, TileType.Flier);
                this.setTileType(4, 6, TileType.Flier);
                this.setTileType(5, 0, TileType.Flier);
                this.setTileType(5, 1, TileType.Flier);
                this.setTileType(5, 2, TileType.Flier);
                this.setTileType(5, 3, TileType.Forest);
                this.setTileType(5, 5, TileType.Flier);
                this.setTileType(5, 6, TileType.Flier);
                this.setTileType(5, 7, TileType.Forest);

                if (withUnits) {
                    this.__placeEnemyUnitBySlotIfExists(0, 0, 0);
                    this.__placeEnemyUnitBySlotIfExists(1, 1, 0);
                    this.__placeEnemyUnitBySlotIfExists(2, 2, 0);
                    this.__placeEnemyUnitBySlotIfExists(3, 3, 0);

                    this.__placeAllyUnitBySlotIfExists(0, 1, 7);
                    this.__placeAllyUnitBySlotIfExists(1, 2, 7);
                    this.__placeAllyUnitBySlotIfExists(2, 3, 7);
                    this.__placeAllyUnitBySlotIfExists(3, 4, 7);
                }
                break;
            case MapType.Arena_3:
                this.__placeBreakableWalls([
                    [0, 2], [2, 2], [5, 2],
                    [0, 3], [2, 3], [3, 3], [5, 3],
                    [0, 4], [2, 4], [3, 4], [5, 4],
                    [0, 5], [3, 5], [5, 5],
                ], BreakableWallIconType.Wall3);
                if (withUnits) {
                    this.__placeElemyUnits([[1, 7], [2, 7], [3, 7], [4, 7]]);
                    this.__placeAllyUnits([[1, 0], [2, 0], [3, 0], [4, 0]]);
                }
                break;
            case MapType.Arena_4:
                this.__setTileTypes([
                    [1, 0], [2, 0], [4, 0], [5, 0],
                    [0, 2], [1, 2], [3, 2], [4, 2],
                    [1, 4], [2, 4], [4, 4], [5, 4],
                    [0, 6], [1, 6], [3, 6], [4, 6],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnits([[1, 1], [2, 1], [3, 1], [4, 1]]);
                    this.__placeAllyUnits([[0, 7], [1, 7], [4, 7], [5, 7]]);
                }
                break;
            case MapType.Arena_5:
                this.__setTileTypes([
                    [3, 1],
                    [2, 2], [3, 2],
                    [2, 3], [3, 3],
                    [2, 4], [3, 4],
                    [2, 5], [3, 5],
                    [2, 6],
                ], TileType.Flier);
                this.__setTileTypes([
                    [4, 1],
                    [2, 1],
                    [4, 4],
                    [1, 5],
                    [3, 6],
                    [5, 7],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnits([[5, 1], [5, 2], [5, 5], [5, 6]]);
                    this.__placeAllyUnits([[0, 0], [0, 1], [0, 6], [0, 7]]);
                }
                break;
            case MapType.Arena_6:
                this.__setTileTypes([
                    [2, 3], [3, 3],
                    [2, 4], [3, 4],
                ], TileType.Flier);
                this.__setTileTypes([
                    [0, 0], [0, 7],
                    [1, 3],
                    [2, 5],
                    [3, 2], [3, 7],
                    [4, 0],
                    [5, 0], [5, 7],
                ], TileType.Forest);
                this.__setTileTypes([
                    [0, 2], [1, 2], [5, 2],
                    [4, 4],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeAllyUnits([[2, 0], [3, 0], [2, 1], [3, 1]]);
                    this.__placeElemyUnits([[1, 6], [2, 6], [3, 6], [4, 6]]);
                }
                break;
            case MapType.Arena_7:
                this.__placeWalls([
                    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
                    [0, 1], [1, 1],
                    [0, 6], [2, 6], [5, 6],
                ]);
                this.__placeBreakableWalls([
                    [5, 3], [0, 4],
                ], BreakableWallIconType.Wall2);
                this.__setTileTypes([
                    [1, 3],
                    [4, 2],
                    [1, 4],
                ], TileType.Flier);
                this.__setTileTypes([
                    [2, 3], [3, 3],
                    [2, 4], [4, 4],
                    [3, 5], [4, 5],
                ], TileType.Trench);
                this.__setTileTypes([
                    [4, 3],
                    [3, 4],
                    [2, 5],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnits([[2, 1], [3, 1], [4, 1], [5, 1]]);
                    this.__placeAllyUnits([[1, 7], [2, 7], [3, 7], [4, 7]]);
                }
                break;
            case MapType.Arena_8:
                this.__setTileTypesByPosYX([
                    [1, 4],
                    [2, 1],
                    [3, 3], [3, 4],
                    [5, 1], [5, 3],
                    [6, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 3],
                    [4, 1],
                    [5, 0], [5, 4], [5, 5],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_9:
                this.__setTileTypesByPosYX([
                    [0, 3],
                    [2, 4],
                    [5, 1],
                    [7, 2],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 1],
                    [6, 4],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [3, 2], [4, 3],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [0, 5],
                    [2, 1], [2, 2],
                    [5, 3], [5, 4],
                    [7, 0],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [3, 3],
                    [4, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnits([[0, 1], [0, 2], [0, 5], [0, 6]]);
                    this.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_10:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 1], [1, 4],
                    [3, 0], [3, 5],
                    [5, 0], [5, 3], [5, 4],
                    [6, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [4, 2],
                    [4, 3],
                ], TileType.Trench);
                this.__placeBreakableWallsByPosYX([
                    [3, 1], [3, 2],
                ], BreakableWallIconType.Wall2);
                this.__setTileTypesByPosYX([
                    [5, 1],
                    [6, 1], [6, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 3], [0, 4], [1, 5], [2, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 1], [7, 2]]);
                }
                break;
            case MapType.Arena_11:
                this.__setTileTypesByPosYX([
                    [0, 2], [0, 3],
                    [1, 2], [1, 3],
                    [3, 0], [3, 1], [3, 4], [3, 5],
                    [5, 1], [5, 4],
                    [7, 2], [7, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 0], [2, 1], [2, 4], [2, 5],
                    [4, 0], [4, 1], [4, 4], [4, 5],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[1, 0], [1, 1], [1, 4], [1, 5]]);
                    this.__placeElemyUnitsByPosYX([[6, 0], [6, 1], [6, 4], [6, 5]]);
                }
                break;
            case MapType.Arena_12:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5],
                    [7, 0], [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 2],
                    [2, 3], [2, 4],
                    [3, 1], [3, 2],
                    [4, 3], [4, 4],
                    [5, 1], [5, 2],
                    [6, 3], [6, 4],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [1, 3], [1, 4],
                    [2, 1], [2, 2],
                    [3, 3], [3, 4],
                    [4, 1], [4, 2],
                    [5, 3], [5, 4],
                    [6, 1], [6, 2],
                ], BreakableWallIconType.Wall3);

                if (withUnits) {
                    this.__placeAllyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeElemyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_13:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1],
                    [1, 0],
                    [2, 0], [2, 1],
                    [3, 0], [3, 1], [3, 4], [3, 5],
                    [4, 0], [4, 5],
                    [5, 5],
                    [6, 0], [6, 5],
                    [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
                ], TileType.Flier);
                this.__placeBreakableWallsByPosYX([
                    [2, 2], [2, 3], [2, 4], [2, 5],
                    [4, 1], [4, 2], [4, 3], [4, 4],
                ], BreakableWallIconType.Box);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[5, 1], [5, 2], [6, 1], [6, 2]]);
                }
                break;
            case MapType.Arena_14:
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 4],
                    [2, 0], [2, 2], [2, 3], [2, 5],
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                    [5, 0], [5, 2], [5, 3], [5, 5],
                    [6, 1], [6, 4],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 4],
                    [5, 1], [5, 4],
                ], TileType.DefensiveForest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_15:
                this.__setTileTypesByPosYX([
                    [3, 3], [3, 4],
                    [4, 1], [4, 2],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [3, 1], [4, 4],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [0, 0], [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 2],
                    [2, 2], [2, 3],
                    [5, 2], [5, 3],
                    [6, 3], [6, 4],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[1, 4], [1, 5], [2, 4], [2, 5]]);
                    this.__placeElemyUnitsByPosYX([[5, 0], [5, 1], [6, 0], [6, 1]]);
                }
                break;
            case MapType.Arena_16:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 5],
                    [6, 0], [6, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 3],
                    [5, 2], [5, 3],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [3, 2], [4, 5],
                ], BreakableWallIconType.Wall3);
                this.__placeWallsByPosYX([
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                ]);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_17:
                this.__setTileTypesByPosYX([
                    [2, 4], [4, 1],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 4], [2, 3], [2, 5], [3, 4],
                    [3, 1], [4, 0], [4, 2], [5, 1],
                ], TileType.Trench);
                this.__placeBreakableWallsByPosYX([
                    [2, 0], [2, 2],
                    [4, 3], [4, 5],
                ], BreakableWallIconType.Wall2);
                this.__placeWallsByPosYX([
                    [0, 0], [5, 4],
                    [6, 1], [7, 5],
                ]);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[6, 2], [6, 3], [7, 2], [7, 3]]);
                }
                break;
            case MapType.Arena_18:
                this.__placeBreakableWallsByPosYX([
                    [2, 2], [2, 4],
                    [3, 1], [3, 3], [3, 5],
                ], BreakableWallIconType.Wall2);
                this.__placeWallsByPosYX([
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                ]);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 2], [1, 4], [1, 5],
                    [2, 1], [2, 5],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [3, 2], [3, 4], [4, 3],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [5, 2], [6, 4], [7, 0],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 3],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_19:
                this.__placeBreakableWallsByPosYX([
                    [3, 2], [3, 3], [4, 2], [4, 3],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [0, 3], [0, 4], [0, 5],
                    [1, 5],
                    [2, 3],
                    [3, 4],
                    [4, 1],
                    [5, 2],
                    [6, 0],
                    [7, 0], [7, 1], [7, 2],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 2], [3, 1], [4, 4], [5, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [2, 0], [5, 5],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [1, 0], [1, 2], [2, 1]]);
                    this.__placeAllyUnitsByPosYX([[5, 4], [6, 3], [6, 5], [7, 4]]);
                }
                break;
            case MapType.Arena_20:
                this.__setTileTypesByPosYX([
                    [0, 0], [1, 0],
                    [3, 2],
                    [4, 5],
                    [5, 2],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 2], [1, 3],
                    [7, 2], [7, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 4],
                    [4, 1], [4, 3],
                    [6, 4],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 0], [7, 1]]);
                }
                break;
            case MapType.Arena_21:
                this.__placeBreakableWalls([
                    [1, 2], [1, 3], [1, 4], [1, 5],
                    [4, 2], [4, 3], [4, 4], [4, 5],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 5],
                    [3, 0], [3, 3],
                    [4, 2], [4, 5],
                    [5, 0], [5, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_22:
                this.__setTileTypesByPosYX([
                    [0, 1], [0, 5],
                    [3, 3],
                    [4, 1], [4, 5],
                    [6, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 2], [1, 4],
                    [3, 0], [3, 2], [3, 4],
                    [5, 0], [5, 2], [5, 4],
                    [7, 0], [7, 2], [7, 4],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 4], [0, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 1], [6, 2], [6, 4], [6, 5]]);
                }
                break;
            case MapType.Arena_23:
                this.__setTileTypesByPosYX([
                    [0, 2], [0, 3],
                    [2, 1], [2, 2], [2, 3], [2, 4],
                    [5, 1], [5, 2], [5, 3], [5, 4],
                    [7, 2], [7, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [3, 2], [3, 3],
                    [4, 2], [4, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_24:
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 2],
                    [3, 0], [3, 1], [3, 3], [3, 4],
                    [4, 1], [4, 4],
                    [5, 2], [5, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 5],
                    [2, 3],
                    [4, 2], [4, 5],
                    [5, 4],
                    [6, 1],
                ], TileType.DefensiveForest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_25:
                this.__setTileTypesByPosYX([
                    [3, 2], [3, 3],
                    [4, 2], [4, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 4],
                    [5, 1], [5, 4],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [2, 2], [2, 3],
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                    [5, 2], [5, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_26:
                this.__placeBreakableWallsByPosYX([
                    [2, 1], [2, 3], [2, 5],
                    [3, 0], [3, 2], [3, 4],
                    [4, 1], [4, 3], [4, 5],
                    [5, 0], [5, 2], [5, 4],
                ], BreakableWallIconType.Wall2);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;

            case MapType.Arena_27:
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 2],
                    [5, 3], [5, 4],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 3],
                    [2, 4],
                    [3, 4],
                    [4, 1],
                    [5, 1],
                    [7, 2],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_28:
                this.__setTileTypesByPosYX([
                    [2, 1], [2, 4],
                    [4, 3],
                    [5, 1], [5, 5],
                    [6, 0],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 0], [1, 2], [1, 3], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.Arena_29:
                this.__placeWallsByPosYX([
                    [0, 1], [0, 4],
                    [2, 1], [2, 4],
                    [5, 1], [5, 4],
                    [7, 1], [7, 4],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 1], [1, 4],
                    [2, 3],
                    [3, 1], [3, 4],
                    [4, 1], [4, 4],
                    [5, 2],
                    [6, 1], [6, 4],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5],
                    [3, 2],
                    [7, 0], [7, 3],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeAllyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeElemyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
                }
                break;
            case MapType.Arena_30:
                this.__placeWallsByPosYX([
                    [3, 0], [3, 2], [3, 4],
                    [7, 0], [7, 2], [7, 4],
                ]);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 3], [1, 5],
                    [5, 1], [5, 3], [5, 5],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [0, 4], [0, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [6, 2], [6, 3]]);
                }
                break;
            case MapType.Arena_31:
                this.__placeWallsByPosYX([
                    [7, 2],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [3, 3],
                    [4, 0, 2], [4, 1],
                    [7, 3],
                ], BreakableWallIconType.Wall3);

                this.__setTileTypesByPosYX([
                    [2, 4],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 3], [0, 4],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 5],
                    [1, 5],
                    [3, 2], [4, 2],
                    [5, 0],
                    [6, 0], [6, 1],
                    [7, 0], [7, 1],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[5, 5], [6, 4], [6, 5], [7, 4]]);
                    this.__placeAllyUnitsByPosYX([[1, 0], [1, 1], [2, 0], [2, 1]]);
                }
                break;
            case MapType.Arena_32:
                this.__placeWallsByPosYX([
                    [3, 2], [4, 2],
                ]);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5], [2, 3], [3, 3], [4, 3],
                    [7, 0], [7, 1], [7, 4], [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 1], [0, 3], [0, 4],
                    [1, 0],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [5, 2],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [5, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [7, 2], [7, 3],
                ], TileType.DefensiveTrench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[2, 5], [3, 4], [4, 4], [5, 5]]);
                    this.__placeAllyUnitsByPosYX([[2, 0], [3, 1], [4, 1], [5, 0]]);
                }
                break;
            case MapType.Arena_33:
                this.__placeWallsByPosYX([
                    [0, 0], [5, 5],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 0],
                    [4, 5], [5, 3], [5, 4],
                    [6, 2], [6, 5],
                    [7, 0], [7, 5],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [4, 2],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [1, 3],
                    [4, 4],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [5, 0],
                ], TileType.DefensiveTrench);

                this.__setTileTypesByPosYX([
                    [2, 2], [2, 5], [3, 1], [3, 2], [3, 5],
                    [4, 1],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [1, 1], [1, 4]]);
                    this.__placeAllyUnitsByPosYX([[6, 1], [6, 3], [7, 2], [7, 4]]);
                }
                break;
            case MapType.Arena_34:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 2],
                    [1, 0], [1, 1],
                    [2, 0], [2, 1], [2, 2],
                    [3, 0], [3, 1],
                    [4, 0],
                    [5, 0], [5, 1],
                    [6, 0],
                    [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 3], [1, 2],
                    [3, 4], [3, 5],
                    [6, 4], [6, 5],
                    [7, 3], [7, 4],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [4, 1],
                    [7, 0],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [4, 2, 2], [4, 3],
                ], BreakableWallIconType.Wall3);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                    this.__placeAllyUnitsByPosYX([[5, 4], [6, 2], [6, 3], [7, 2]]);
                }
                break;
            case MapType.Arena_35:
                this.__setTileTypesByPosYX([
                    [0, 2], [0, 3], [0, 4], [0, 5],
                    [2, 2], [2, 3],
                    [3, 0], [3, 2], [3, 3],
                    [4, 0], [4, 2],
                    [5, 2], [5, 3], [5, 4],
                    [7, 2], [7, 3], [7, 4], [7, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 0],
                    [0, 1],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [3, 1],
                    [4, 1], [4, 3],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 4], [1, 5], [2, 4], [2, 5]]);
                    this.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 0], [7, 1]]);
                }
                break;
            case MapType.Arena_46:
                this.__setTileTypesByPosYX([
                    [3, 1], [3, 2], [3, 4],
                    [4, 1], [4, 3], [4, 4],
                ], TileType.Flier);
                this.__placeWallsByPosYX([
                    [2, 3],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [0, 2], [0, 3],
                    [2, 2],
                    [3, 3],
                    [4, 2],
                    [6, 3],
                    [7, 2], [7, 3, 2],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [0, 0],
                    [0, 5],
                    [5, 3],
                    [7, 0],
                    [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [1, 3],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [5, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 5], [2, 5], [5, 5], [6, 5]]);
                    this.__placeAllyUnitsByPosYX([[1, 0], [2, 0], [5, 0], [6, 0]]);
                }
                break;
            case MapType.Arena_47:
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 2], [0, 4], [0, 5],
                    [1, 0],
                    [2, 3], [2, 4],
                    [4, 0], [4, 2], [4, 3],
                    [6, 2], [6, 3],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 3],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [2, 2], [4, 4], [5, 3],
                ], TileType.DefensiveForest);
                this.__setTileTypesByPosYX([
                    [1, 3],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [3, 4],
                    [7, 2],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[1, 5], [2, 5], [5, 5], [6, 5]]);
                    this.__placeAllyUnitsByPosYX([[2, 0], [3, 0], [6, 0], [7, 0]]);
                }
                break;
            case MapType.Arena_48:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 3], [1, 5],
                    [6, 0], [6, 3], [6, 5],
                ], TileType.Flier);
                this.__placeWallsByPosYX([
                    [4, 0], [4, 3], [4, 5],
                    [5, 0],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [2, 0], [2, 1],
                    [3, 0], [3, 1], [3, 2], [3, 5],
                    [5, 3],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [3, 3],
                    [4, 1], [4, 2],
                ], TileType.DefensiveTile);
                this.__setTileTypesByPosYX([
                    [4, 4],
                ], TileType.DefensiveTrench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                    this.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                }
                break;
            case MapType.Arena_49:
                this.__setTileTypesByPosYX([
                    [1, 0], [1, 3], [1, 4],
                    [2, 4],
                    [5, 1],
                    [6, 1], [6, 2], [6, 5],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [0, 0], [0, 5],
                    [2, 0],
                    [3, 0],
                    [4, 5],
                    [5, 5],
                    [7, 0], [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [3, 3],
                    [4, 2],
                ], TileType.DefensiveTile);
                this.__placeBreakableWallsByPosYX([
                    [3, 1], [3, 2],
                    [4, 3], [4, 4],
                ], BreakableWallIconType.Wall3);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                    this.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                }
                break;
            case MapType.Arena_50:
                this.__placeWallsByPosYX([
                    [0, 0], [0, 1], [0, 5],
                    [1, 1], [1, 4], [1, 5],
                    [3, 0],
                    [5, 0], [5, 5],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [0, 4, 2],
                    [1, 0],
                    [3, 2, 2], [3, 3], [3, 5],
                    [5, 1], [5, 3],
                ], BreakableWallIconType.Wall3);
                this.__setTileTypesByPosYX([
                    [6, 0], [6, 5],
                    [7, 0], [7, 5],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [3, 1], [3, 4],
                    [5, 2],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [4, 2],
                ], TileType.DefensiveTile);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [1, 2], [1, 3]]);
                    this.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                }
                break;
            case MapType.ResonantBattles_Default:
                break;
            case MapType.ResonantBattles_1:
                this.__placeWallsByPosYX([
                    [0, 1], [0, 2], [3, 4],
                    [5, 7],
                    [6, 6],
                    [7, 1],
                    [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 4],
                    [2, 3],
                    [3, 3],
                    [6, 7],
                    [7, 0], [7, 6],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [1, 6],
                    [2, 0],
                    [4, 7],
                    [5, 2],
                    [6, 4],
                    [7, 3],
                    [8, 7],
                    [9, 0],
                ], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 1], [2, 4], [3, 0], [3, 2], [3, 5],
                        [4, 2], [4, 4], [4, 7],
                        [5, 0], [5, 6],
                        [6, 1], [6, 5],
                    ]);
                }
                break;
            case MapType.ResonantBattles_2:
                this.__placeWallsByPosYX([
                    [0, 3], [0, 4],
                    [3, 2], [3, 5],
                    [6, 3], [6, 4],
                    [9, 0], [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 1], [1, 7],
                    [2, 5],
                    [6, 1], [6, 5], [6, 7],
                    [7, 0], [7, 2], [7, 6],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [3, 1],
                    [3, 7],
                    [4, 0],
                    [4, 6],
                ], TileType.Trench);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 1], [2, 4],
                        [3, 0], [3, 4], [3, 7],
                        [4, 2], [4, 3], [4, 5],
                        [5, 0], [5, 6], [5, 7],
                        [6, 2],
                    ]);
                }
                break;
            case MapType.ResonantBattles_3:
                this.__placeWallsByPosYX([
                    [9, 7],
                ]);

                this.__setTileTypesByPosYX([
                    [0, 0], [0, 4], [0, 7],
                    [1, 3], [1, 4], [1, 7],
                    [2, 3],
                    [4, 4],
                    [5, 4],
                    [6, 0], [6, 3], [6, 4],
                    [7, 0], [7, 1], [7, 7],
                    [8, 0], [8, 6], [8, 7],
                    [9, 0], [9, 6],
                ], TileType.Flier);

                this.__setTileTypesByPosYX([
                    [0, 2], [0, 6],
                    [3, 0],
                    [5, 7],
                    [7, 3],
                    [9, 1],
                ], TileType.Forest);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 0], [2, 1], [2, 7],
                        [3, 3], [3, 4], [3, 5], [3, 6],
                        [4, 2],
                        [5, 0], [5, 3], [5, 6],
                        [6, 7],
                    ]);
                }
                break;
            case MapType.ResonantBattles_4:
                this.__placeWallsByPosYX([
                    [0, 2], [0, 3],
                    [2, 5],
                    [3, 7],
                    [6, 6],
                    [8, 0],
                    [9, 7]
                ]);
                this.__setTileTypesByPosYX([
                    [4, 3],
                    [6, 1],
                ], TileType.Flier);
                this.__setTileTypesByPosYX([
                    [4, 2],
                    [4, 6],
                ], TileType.Trench);
                this.__setTileTypesByPosYX([
                    [1, 1], [1, 4], [1, 7],
                    [2, 7],
                    [3, 3],
                    [4, 5],
                    [5, 1],
                    [6, 4],
                    [7, 6],
                    [8, 2]
                ], TileType.Forest);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 2], [2, 3],
                        [3, 5], [3, 6],
                        [4, 0], [4, 1], [4, 4],
                        [5, 3], [5, 5], [5, 6], [5, 7],
                        [6, 3],
                    ]);
                }
                break;
            case MapType.ResonantBattles_5:
                this.__placeWallsByPosYX([
                    [0, 1], [0, 2], [0, 6],
                    [1, 4], [1, 5],
                    [2, 2],
                    [3, 7],
                    [4, 2],
                    [5, 0],
                    [6, 3],
                    [7, 1], [7, 2],
                    [9, 0], [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [2, 5],
                    [4, 5],
                    [5, 5],
                    [6, 4],
                    [8, 1],
                ], BreakableWallIconType.Wall);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 6],
                        [3, 1],
                        [3, 2], [3, 4],
                        [3, 5], [4, 0], [4, 4],
                        [5, 2], [5, 3], [5, 6], [5, 7],
                        [6, 1],
                    ]);
                }
                break;
            case MapType.ResonantBattles_6:
                this.__placeWallsByPosYX([
                    [4, 3], [4, 4],
                    [9, 0], [9, 7],
                ]);
                this.__placeBreakableWallsByPosYX([
                    [7, 1], [7, 3], [7, 4], [7, 6],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [0, 3],
                    [2, 7],
                    [5, 0],
                    [8, 7],
                ], TileType.Forest);
                this.__setTileTypesByPosYX([
                    [5, 2],
                    [5, 5],
                ], TileType.Trench);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 3],
                        [2, 4],
                        [3, 0], [3, 1],
                        [3, 5], [3, 6], [4, 2],
                        [5, 4], [5, 7], [6, 0], [6, 7],
                        [7, 2],
                    ]);
                }
                break;
            case MapType.ResonantBattles_7:
                this.__placeWallsByPosYX([
                    [0, 2], [4, 5],
                    [5, 2], [8, 0],
                    [9, 7]
                ]);
                this.__placeBreakableWallsByPosYX([
                    [1, 3], [1, 5],
                    [4, 0], [6, 6],
                    [8, 1],
                ], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([
                    [2, 0],
                    [2, 7],
                    [7, 4],
                    [7, 7],
                ], TileType.Flier);

                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([
                        [2, 2],
                        [2, 5],
                        [3, 0], [3, 2],
                        [3, 5], [3, 7], [4, 4],
                        [5, 3], [5, 7], [6, 0], [6, 5],
                        [7, 1],
                    ]);
                }
                break;
            case MapType.ResonantBattles_8:
                this.__placeWallsByPosYX([[0, 2], [0, 3], [0, 4], [0, 5], [9, 0], [9, 7],]);
                this.__placeBreakableWallsByPosYX([[1, 4], [7, 7], [8, 2],], BreakableWallIconType.Wall);
                this.__setTileTypesByPosYX([[4, 3], [4, 4], [5, 3], [5, 4],], TileType.Flier);
                this.__setTileTypesByPosYX([[3, 2], [4, 7], [5, 0], [6, 6], [7, 1],], TileType.Forest);
                if (withUnits) {
                    this.__placeElemyUnitsByPosYX([[2, 3], [2, 5], [3, 0], [3, 1], [3, 5], [4, 7], [5, 1], [5, 2], [5, 6], [6, 4], [7, 0], [7, 6],]);
                }
                break;
            case MapType.TempestTrials_KojoNoTakaraSagashi:
                this.__placeWallsByPosYX([
                    [1, 0], [1, 1],
                    [3, 4],
                    [4, 0],
                    [7, 5],
                ]);

                this.__placeBreakableWallsByPosYX([
                    [6, 2],
                ], BreakableWallIconType.Box);

                this.__setTileTypesByPosYX([
                    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
                    [1, 3], [1, 4],
                    [3, 3],
                    [5, 3],
                    [7, 0], [7, 3],
                ], TileType.Flier);
                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[2, 0], [2, 1], [2, 2], [3, 1]]);
                    this.__placeElemyUnitsByPosYX([[2, 5], [5, 5], [6, 4], [7, 2], [7, 4]]);
                }
                break;
            case MapType.TempestTrials_ButosaiNoKyodai:
                this.__placeWallsByPosYX([
                    [6, 0], [6, 1],
                    [7, 0], [7, 1],
                ]);

                this.__setTileTypesByPosYX([
                    [0, 0],
                    [1, 0], [1, 5],
                    [2, 5],
                    [3, 1],
                    [4, 4],
                    [6, 4],
                ], TileType.Forest);

                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[0, 2], [0, 3], [1, 2], [1, 3]]);
                    this.__placeElemyUnitsByPosYX([[3, 0], [3, 5], [5, 0], [5, 5], [7, 2]]);
                }
                break;
            case MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu:
                this.__placeWallsByPosYX([
                    [2, 2], [2, 3],
                    [3, 2], [3, 3],
                    [6, 0], [6, 1],
                    [6, 4], [6, 5],
                ]);

                this.__setTileTypesByPosYX([
                    [1, 5],
                    [4, 0],
                    [4, 4],
                ], TileType.Flier);

                if (withUnits) {
                    this.__placeAllyUnitsByPosYX([[6, 2], [6, 3], [7, 2], [7, 3]]);
                    this.__placeElemyUnitsByPosYX([[0, 0], [0, 2], [1, 4], [2, 1], [2, 5]]);
                }
                break;
            default:
                throw new Error("unexpected map kind " + this._type);
        }

        if (withUnits) {
            if (MapType_ResonantBattlesOffset <= this._type && this._type < MapType_TempestTrialsOffset) {
                // 双界の味方配置はどのマップも同じ
                this.__placeAllyUnitsByPosYX([[9, 2], [9, 3], [9, 4], [9, 5]]);
            }
        }
    }

    updateSourceCode() {
        let result = "// マップのセットアップ\n";
        result += this.__createSourceCodeForWallPlacement();
        result += this.__createSourceCodeForBreakableWallPlacement();
        result += this.__createSourceCodeForTileTypeSetting("Flier", TileType.Flier);
        result += this.__createSourceCodeForTileTypeSetting("Forest", TileType.Forest);
        result += "if (withUnits) {\n";
        result += this.__createSourceCodeForUnitPlacement(UnitGroupType.Enemy);
        result += "}\n";
        result += "// 敵のセットアップ\n"
        result += this.__createSourceCodeForEnemyUnitSetup();
        this.sourceCode = result;
    }
    __createSourceCodeForEnemyUnitSetup() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.placedUnit != null && x.placedUnit.groupId == UnitGroupType.Enemy)) {
            let unit = tile.placedUnit;
            elems += `[${unit.heroIndex},`;
            elems += `[${unit.weapon},${unit.weaponRefinement},${unit.support},${unit.special},${unit.passiveA},${unit.passiveB},${unit.passiveC},${unit.passiveS}],`;
            elems += `[${unit.hpAdd},${unit.atkAdd},${unit.spdAdd},${unit.defAdd},${unit.resAdd}],`;
            elems += `[${unit.hpGrowthRate},${unit.defGrowthRate},${unit.resGrowthRate}]],\n`;
        }
        if (elems == "") {
            return "";
        }
        return `heroInfos = [${elems}];`;
    }
    __createSourceCodeForUnitPlacement(groupType) {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.placedUnit != null && x.placedUnit.groupId == groupType)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        switch (groupType) {
            case UnitGroupType.Enemy: return `this.__placeElemyUnitsByPosYX([${elems}]);\n`;
            case UnitGroupType.Ally: return `this.__placeAllyUnitsByPosYX([${elems}]);\n`;
            default:
                throw new Error("invalid group type");
        }
    }
    __createSourceCodeForWallPlacement() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.obj instanceof Wall)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `this.__placeWallsByPosYX([${elems}]);\n`;
    }
    __createSourceCodeForBreakableWallPlacement() {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.obj instanceof BreakableWall)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `this.__placeBreakableWallsByPosYX([${elems}], BreakableWallIconType.Wall);\n`;
    }
    __createSourceCodeForTileTypeSetting(tileTypeText, tileType) {
        let elems = "";
        for (let tile of this.enumerateTiles(x => x.type == tileType)) {
            elems += `[${tile.posY},${tile.posX}],`;
        }
        if (elems == "") {
            return "";
        }
        return `this.__setTileTypesByPosYX([${elems}],TileType.${tileTypeText});\n`;
    }

    __setTileTypesByPosYX(positions, tileType) {
        for (let pos of positions) {
            this.setTileType(pos[1], pos[0], tileType);
        }
    }
    __setTileTypes(positions, tileType) {
        for (let pos of positions) {
            this.setTileType(pos[0], pos[1], tileType);
        }
    }
    __placeBreakableWalls(positions, type = BreakableWallIconType.Wall) {
        this.__placeBreakableWallsImpl(positions, 0, 1, type);
    }
    __placeBreakableWallsImpl(positions, xIndex, yIndex, type = BreakableWallIconType.Wall) {
        let i = 0;
        for (let pos of positions) {
            let wall = this._breakableWalls[i];
            wall.iconType = type;
            this.__placeObjForcibly(wall, pos[xIndex], pos[yIndex]);
            if (pos.length == 3) {
                let breakCount = pos[2];
                wall.breakCount = breakCount;
            } else {
                wall.breakCount = 1;
            }
            ++i;
        }
    }
    __setBreakableWallIconType(type) {
        for (let wall of this._breakableWalls) {
            wall.iconType = type;
        }
    }
    getBreakableWall(index) {
        if (index >= this._breakableWalls.length) {
            return null;
        }
        return this._breakableWalls[index];
    }
    getWall(index) {
        if (index >= this._walls.length) {
            return null;
        }
        return this._walls[index];
    }
    countWallsOnMap() {
        return this.countObjs(x => x instanceof Wall);
    }
    countBreakableWallsOnMap() {
        return this.countObjs(x => x instanceof BreakableWall);
    }
    __placeWalls(positions) {
        let i = 0;
        for (let pos of positions) {
            this.__placeObjForcibly(this._walls[i], pos[0], pos[1]);
            ++i;
        }
    }
    __placeBreakableWallsByPosYX(positions, type = BreakableWallIconType.Wall) {
        this.__placeBreakableWallsImpl(positions, 1, 0, type);
    }
    __placeWallsByPosYX(positions) {
        let i = 0;
        for (let pos of positions) {
            this.__placeObjForcibly(this._walls[i], pos[1], pos[0]);
            ++i;
        }
    }
    __placeElemyUnits(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeEnemyUnitBySlotIfExists(slot, pos[0], pos[1]);
            ++slot;
        }
    }
    __placeElemyUnitsByPosYX(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeEnemyUnitBySlotIfExists(slot, pos[1], pos[0]);
            ++slot;
        }
        this.__removeUnitsForGreaterSlotOrder(UnitGroupType.Enemy, positions.length - 1);
    }
    __placeAllyUnits(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeAllyUnitBySlotIfExists(slot, pos[0], pos[1]);
            ++slot;
        }
    }
    __placeAllyUnitsByPosYX(positions) {
        let slot = 0;
        for (let pos of positions) {
            this.__placeAllyUnitBySlotIfExists(slot, pos[1], pos[0]);
            ++slot;
        }
        this.__removeUnitsForGreaterSlotOrder(UnitGroupType.Ally, positions.length - 1);
    }
    __placeEnemyUnitBySlotIfExists(slotOrder, px, py) {
        let unit = this.__getEnemyUnit(slotOrder);
        if (unit == null) {
            return;
        }
        this.placeUnitForcibly(unit, px, py);
    }
    __placeAllyUnitBySlotIfExists(slotOrder, px, py) {
        let unit = this.__getAllyUnit(slotOrder);
        if (unit == null) {
            return;
        }
        this.placeUnitForcibly(unit, px, py);
    }
    __getEnemyUnit(slot) {
        return this.__getUnit(UnitGroupType.Enemy, slot);
    }
    __getAllyUnit(slot) {
        return this.__getUnit(UnitGroupType.Ally, slot);
    }
    __getUnit(groupId, slotOrder) {
        for (let unit of this._units) {
            if (unit.groupId == groupId && unit.slotOrder == slotOrder) {
                return unit;
            }
        }
        return null;
    }

    __removeUnitsForGreaterSlotOrder(groupId, slotOrderThreshold) {
        let removeTargets = [];
        for (let unit of this._units) {
            if (unit.groupId == groupId && unit.slotOrder > slotOrderThreshold) {
                removeTargets.push(unit);
            }
        }
        for (let unit of removeTargets) {
            this.removeUnit(unit);
        }
    }

    __placeObjForcibly(obj, posX, posY) {
        let tile = this.getTile(posX, posY);
        let oldObj = tile.obj;
        tile.setObj(null);
        this.placeObj(obj, posX, posY);
        if (oldObj != null) {
            this.placeObj(oldObj, posX, posY);
        }
    }

    // 指定ユニットの近くのユニットを列挙します。
    // distance: 近くと判定するユニットからのタイル数
    *enumerateNeighboringUnits(unit, distance) {
        var tile = this.findTileUnitPlaced(unit.id);
        if (tile != null) {
            var enumeratedUnits = [unit];
            for (let neighborTile of this.__enumerateNeighboringTiles(tile, distance)) {
                var neighborUnit = neighborTile.placedUnit;
                if (neighborUnit == null) {
                    continue;
                }
                if (enumeratedUnits.includes(neighborUnit)) {
                    continue;
                }

                yield neighborUnit;
                enumeratedUnits.push(neighborUnit);
            }
        }
    }

    *__enumerateNeighboringTiles(tile, distance) {
        if (distance > 0) {
            for (var i = 0; i < tile.neighbors.length; ++i) {
                var neighbor = tile.neighbors[i];
                yield neighbor;
                for (let neighborNeighbor of this.__enumerateNeighboringTiles(neighbor, distance - 1)) {
                    yield neighborNeighbor;
                }
            }
        }
    }

    *enumerateWallsOnMap() {
        for (let obj of this.enumerateObjs(x => x instanceof Wall)) {
            yield obj;
        }
    }

    *enumerateWalls() {
        for (var i = 0; i < this._walls.length; ++i) {
            var obj = this._walls[i];
            yield obj;
        }
    }

    *enumerateBreakableWalls() {
        for (var i = 0; i < this._breakableWalls.length; ++i) {
            var obj = this._breakableWalls[i];
            yield obj;
        }
    }

    *enumerateBreakableStructures(groupId) {
        for (let obj of this.enumerateBreakableWallsOfCurrentMapType()) {
            if (obj.isOnMap) {
                yield obj;
            }
        }
        switch (groupId) {
            case UnitGroupType.Ally:
                for (let obj of this.enumerateObjs(x => x instanceof DefenceStructureBase && x.isBreakable)) {
                    yield obj;
                }
                break;
            case UnitGroupType.Enemy:
                for (let obj of this.enumerateObjs(x => x instanceof OffenceStructureBase && x.isBreakable)) {
                    yield obj;
                }
                break;
            default:
                throw new Error("unexpected UnitGroupType " + groupId);
        }
    }

    countObjs(predicatorFunc) {
        let count = 0;
        for (let tile of this._tiles) {
            if (tile.obj == null) {
                continue;
            }
            if (predicatorFunc(tile.obj)) {
                ++count;
            }
        }
        return count;
    }

    *enumerateObjs(predicatorFunc) {
        for (let tile of this._tiles) {
            if (tile.obj == null) {
                continue;
            }
            if (predicatorFunc(tile.obj)) {
                yield tile.obj;
            }
        }
    }

    *enumerateBreakableWallsOfCurrentMapType() {
        for (var i = 0; i < this.breakableObjCountOfCurrentMapType; ++i) {
            var obj = this._breakableWalls[i];
            yield obj;
        }
    }

    findWallOrBreakableWallById(id) {
        let wall = this.findBreakbleWallById(id);
        if (wall != null) {
            return wall;
        }
        return this.findWallById(id);
    }

    findWallById(objId) {
        for (var i = 0; i < this._walls.length; ++i) {
            if (this._walls[i].id == objId) {
                return this._walls[i];
            }
        }
        return null;
    }

    findBreakbleWallById(objId) {
        for (var i = 0; i < this._breakableWalls.length; ++i) {
            if (this._breakableWalls[i].id == objId) {
                return this._breakableWalls[i];
            }
        }
        return null;
    }

    switchClosestDistanceToEnemy() {
        this._showClosestDistanceToEnemy = !this._showClosestDistanceToEnemy;
    }

    switchAllyAttackRange() {
        this._showAllyAttackRange = !this._showAllyAttackRange;
    }

    switchEnemyAttackRange() {
        this._showEnemyAttackRange = !this._showEnemyAttackRange;
    }

    getTile(x, y) {
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            // throw new Error("invalid index: x = " + x + ", y = " + y);
            return null;
        }
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            // throw new Error("tile index out of range: x = " + x + ", y = " + y);
            return null;
        }
        return this._tiles[y * this._width + x];
    }

    setTileType(x, y, type) {
        this.getTile(x, y).type = type;
    }

    exchangeObj(obj, x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return false;
        }
        if (targetTile.isEmpty()) {
            this.removeObj(obj);
            targetTile.setObj(obj);
            return true;
        }
        else {
            var destObj = targetTile.obj;
            var srcTile = this.findTileObjPlaced(obj.id);
            if (srcTile == null) {
                // 交換できない
                return false;
            }

            srcTile.setObj(destObj);

            this.removeObj(obj);
            targetTile.setObj(obj);
            return true;
        }
    }

    placeObj(obj, x, y) {
        var targetTile = this.findNeighborObjEmptyTile(x, y);
        if (targetTile == null) {
            return false;
        }

        this.removeObj(obj);
        targetTile.setObj(obj);
        return true;
    }
    placeObjToEmptyTile(obj) {
        var emptyTile;
        if (obj instanceof OffenceStructureBase) {
            emptyTile = this.__findEmptyTileOfOffenceStructure();
        }
        else {
            emptyTile = this.__findEmptyTileOfDiffenceStructure();
        }
        this.removeObj(obj);
        emptyTile.setObj(obj);
    }

    __findEmptyTileOfOffenceStructure() {
        return this.__findEmptyTile(0, 7, this._width, this._height);
    }

    __findEmptyTileOfDiffenceStructure() {
        return this.__findEmptyTile(0, 0, this._width, this._height - 1);
    }

    __findEmptyTile(offsetX, offsetY, width, height) {
        for (var y = offsetY; y < height; ++y) {
            for (var x = offsetX; x < width; ++x) {
                var tile = this.getTile(x, y);
                if (tile.isObjPlacable()) {
                    return tile;
                }
            }
        }
        return null;
    }
    findNeighborObjEmptyTile(x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }

        if (targetTile.isObjPlacable()) {
            return targetTile;
        }

        for (var i = 0; i < targetTile.neighbors.length; ++i) {
            var tile = targetTile.neighbors[i];
            if (tile.isObjPlacable()) {
                return tile;
            }
        }

        return null;
    }
    findNeighborUnitEmptyTile(x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        if (targetTile.isUnitPlacable()) {
            return targetTile;
        }

        for (var i = 0; i < targetTile.neighbors.length; ++i) {
            var tile = targetTile.neighbors[i];
            if (tile.isUnitPlacable()) {
                return tile;
            }
        }

        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                if (neighborNeighbor.isUnitPlacable()) {
                    return tile;
                }
            }
        }

        // 2回でもダメだったケースがあったので3回辿る
        for (let neighbor of targetTile.neighbors) {
            for (let neighborNeighbor of neighbor.neighbors) {
                for (let neighborNeighborNeighbor of neighborNeighbor.neighbors) {
                    if (neighborNeighborNeighbor.isUnitPlacable()) {
                        return tile;
                    }
                }
            }
        }

        return null;
    }
    removeObj(obj) {
        var tile = this.findTileObjPlaced(obj.id);
        if (tile != null) {
            // console.log(obj.id + " was removed");
            tile.setObj(null);
        }
        else {
            // console.log(obj.id + " was not found");
        }
    }

    findTileObjPlaced(objId) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                if (tile.obj != null) {
                    if (tile.obj.id == objId) {
                        return tile;
                    }
                }
            }
        }
        return null;
    }

    getTileObjsAsString() {
        var text = "";
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                if (tile.obj != null) {
                    text += tile.obj.id + "|";
                }
            }
        }
        return text;
    }

    *enumerateTiles(predicatorFunc = null) {
        for (let tile of this._tiles) {
            if (predicatorFunc == null || predicatorFunc(tile)) {
                yield tile;
            }
        }
    }

    *enumerateTilesInSpecifiedDistanceFrom(targetTile, targetDistance) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                var distance = tile.calculateDistance(targetTile);
                if (distance == targetDistance) {
                    yield tile;
                }
            }
        }
    }

    *enumerateTilesWithinSpecifiedDistance(targetTile, targetDistance) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                var distance = tile.calculateDistance(targetTile);
                if (distance <= targetDistance) {
                    yield tile;
                }
            }
        }
    }

    *enumerateAttackableTiles(attackerUnit, targetUnitTile) {
        for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(targetUnitTile, attackerUnit.attackRange)) {
            if (tile.isMovableTileForUnit(attackerUnit)) {
                yield tile;
            }
        }
    }

    isUnitAvailable(unit) {
        return this.findTileUnitPlaced(unit.id) != null;
    }

    isObjAvailable(obj) {
        return this.findTileObjPlaced(obj.id) != null;
    }

    findTileUnitPlaced(unitId) {
        for (var y = 0; y < this._height; ++y) {
            for (var x = 0; x < this._width; ++x) {
                var index = y * this._width + x;
                var tile = this._tiles[index];
                if (tile.placedUnit != null) {
                    if (tile.placedUnit.id == unitId) {
                        return tile;
                    }
                }
            }
        }
        return null;
    }

    placeUnit(unit, x, y) {
        if ((unit.posX == x) && (unit.posY == y)) {
            return;
        }

        // console.log("x = " + x + ", y = " + y);

        var tile = this.findNeighborUnitEmptyTile(x, y);
        if (tile == null) {
            console.error("could not find empty tile near the tile: (" + x + ", " + y + ")");
            return;
        }

        tile.setUnit(unit);

        if (!this.__isUnitAlreadyAdded(unit)) {
            this._units.push(unit);
        }
    }

    __isUnitAlreadyAdded(unit) {
        for (let u of this._units) {
            if (unit == u) {
                return true;
            }
        }
        return false;
    }

    getUnitOnTile(x, y) {
        var targetTile = this.getTile(x, y);
        if (targetTile == null) {
            return null;
        }
        return targetTile.placedUnit;
    }

    moveUnitForcibly(unit, x, y) {
        var currentTile = unit.placedTile;
        if (currentTile == null) {
            return false;
        }

        try {
            var targetTile = this.getTile(x, y);
            if (targetTile == null) {
                return false;
            }

            if (targetTile.placedUnit != null) {
                // スワップ
                var posX = currentTile.placedUnit.posX;
                var posY = currentTile.placedUnit.posY;
                currentTile.placedUnit = targetTile.placedUnit;
                currentTile.placedUnit.placedTile = currentTile;
                currentTile.placedUnit.setPos(posX, posY);
            }
            else {
                currentTile.placedUnit = null;
            }

            targetTile.placedUnit = unit;
            unit.placedTile = targetTile;
            unit.setPos(x, y);
        }
        catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    placeUnitForcibly(unit, x, y) {
        this.placeUnit(unit, x, y);
        this.moveUnitForcibly(unit, x, y);
    }

    moveUnit(unit, x, y) {
        if ((unit.posX == x) && (unit.posY == y)) {
            return;
        }

        this.moveUnitForcibly(unit, x, y);
    }
    removeUnit(unit) {
        var currentTile = this.findTileUnitPlaced(unit.id);
        if (currentTile != null) {
            currentTile.placedUnit = null;
        }

        this.__removeUnit(unit);
    }

    __removeUnit(unit) {
        unit.placedTile = null;
        unit.setPos(-1, -1);
        var unitIndex = this.__findUnitIndex(unit);
        if (unitIndex >= 0) {
            this._units.splice(unitIndex, 1);
        }
    }

    __findUnitIndex(unit) {
        for (var i = 0; i < this._units.length; ++i) {
            if (this._units[i] == unit) {
                return i;
            }
        }
        return -1;
    }

    getTileLabel(x, y) {
        return this.getTileLabelX(x) + this.getTileLabelY(y);
    }

    getTileLabelY(y) {
        return this._height - y;
    }

    getTileLabelX(x) {
        var charCode = "A".charCodeAt(0) + x;
        return String.fromCharCode(charCode);
    }

    getMinDistToAttackableTile(moveStartTile, moveUnit, targetUnitTile) {
        let dist = CanNotReachTile;
        for (let tile of this.enumerateAttackableTiles(moveUnit, targetUnitTile)) {
            let distLocal = tile.calculateUnitMovementCountToThisTile(moveUnit, moveStartTile, dist);
            // console.log("attackable tile: " + tile.positionToString() + ": distLocal=" + dist);
            if (distLocal < 0) {
                continue;
            }
            if (distLocal < dist) {
                dist = distLocal;
            }
        }
        return dist;
    }

    getNearestMovableTiles(
        moveUnit,
        targetUnitTile,
        additionalEvalTiles,
        evalsAttackableTiles = false,
        movableTiles = null,
        ignoresUnits = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true,
    ) {
        let nearestTiles = [];
        let minDist = CanNotReachTile;
        if (evalsAttackableTiles) {
            minDist = this.getMinDistToAttackableTile(moveUnit.placedTile, moveUnit, targetUnitTile);
        }
        else {
            minDist = targetUnitTile.calculateUnitMovementCountToThisTile(
                moveUnit, moveUnit.placedTile, -1, ignoresUnits, isUnitIgnoredFunc, isPathfinderEnabled);
        }
        // console.log(moveUnit.getNameWithGroup() + "のもっとも近い移動可能なタイルを調査: 現在のマスからの距離=" + minDist);
        let evalTiles = [];
        if (movableTiles != null) {
            for (let tile of movableTiles) {
                evalTiles.push(tile);
            }
        }
        else {
            for (let tile of this.enumerateMovableTiles(moveUnit, false, false, false)) {
                evalTiles.push(tile);
            }
        }
        for (let tile of additionalEvalTiles) {
            evalTiles.push(tile);
        }
        for (let movableTile of evalTiles) {
            // 自身のタイルも含めるべき(例外があれば考える)
            // if (movableTile == moveUnit.placedTile) {
            //     continue;
            // }

            // console.log(movableTile.positionToString() + "の距離を評価");
            let dist = CanNotReachTile;
            if (evalsAttackableTiles) {
                dist = this.getMinDistToAttackableTile(movableTile, moveUnit, targetUnitTile);
            } else {
                dist = targetUnitTile.calculateUnitMovementCountToThisTile(
                    moveUnit, movableTile, -1, ignoresUnits, isUnitIgnoredFunc, isPathfinderEnabled);
            }
            if (dist < 0) {
                continue;
            }

            // console.log(`dist=${dist}, minDist=${minDist}`);
            if (dist < minDist) {
                // console.log("もっとも近いタイルを更新");
                minDist = dist;
                nearestTiles = [movableTile];
            }
            else if (dist == minDist) {
                // console.log("もっとも近いタイルに追加");
                nearestTiles.push(movableTile);
            }
        }

        // console.log(nearestTiles);
        return nearestTiles;
    }

    calculateDistance(moveUnit, targetUnit) {
        let dist = 1000;

        for (let tile of targetUnit.placedTile.neighbors) {
            if (!tile.isMovableTileForUnit(moveUnit)) {
                continue;
            }

            let distLocal = tile.calculateUnitMovementCountToThisTile(moveUnit);
            if (distLocal < 0) {
                continue;
            }
            if (distLocal < dist) {
                dist = distLocal;
            }
        }
        if (dist == 1000) {
            return -1;
        }
        return dist;
    }

    calculateTurnRange(unit, targetUnit) {
        if (!unit.isOnMap || !targetUnit.isOnMap) {
            return -1;
        }

        let minDist = this.getMinDistToAttackableTile(unit.placedTile, unit, targetUnit);
        if (minDist == CanNotReachTile) {
            return -1;
        }

        minDist = minDist + 1;

        let turnRange = Math.ceil(minDist / parseFloat(unit.moveCount));
        return turnRange;
    }

    *enumeratePlaceableSafeTilesNextToThreatenedTiles(unit) {
        for (let tile of this.enumerateSafeTilesNextToThreatenedTiles(unit.groupId)) {
            if (!tile.isUnitPlacableForUnit(unit) || tile.placedUnit != null) {
                continue;
            }

            yield tile;
        }
    }
    enumerateSafeTilesNextToThreatenedTiles(groupId) {
        return this.enumerateTiles(tile => {
            if (!tile.isMovableTileForMoveType(MoveType.Flying)) {
                return false;
            }
            if (tile.getEnemyThreatFor(groupId) > 0) {
                return false;
            }
            for (let x of tile.neighbors) {
                if (x.getEnemyThreatFor(groupId) > 0) {
                    return true;
                }
            }
        });
    }

    * enumerateRangedSpecialTiles(targetTile, special) {
        for (let tile of this.__enumerateRangedSpecialTiles(targetTile, special)) {
            if (tile != null) {
                yield tile;
            }
        }
    }

    * __enumerateRangedSpecialTiles(targetTile, special) {
        switch (special) {
            case Special.RisingFrame:
            case Special.BlazingFlame:
                for (let x = targetTile.posX - 2; x <= targetTile.posX + 2; ++x) {
                    yield this.getTile(x, targetTile.posY);
                }
                break;
            case Special.GrowingFlame:
                for (let tile of this.__enumerateRangedSpecialTiles(targetTile, Special.RisingFrame)) {
                    yield tile;
                }
                for (let x = targetTile.posX - 1; x <= targetTile.posX + 1; x += 2) {
                    for (let y = targetTile.posY - 1; y <= targetTile.posY + 1; y += 2) {
                        yield this.getTile(x, y);
                    }
                }
                break;
            case Special.RisingLight:
            case Special.BlazingLight:
                yield targetTile;
                for (let x = targetTile.posX - 1; x <= targetTile.posX + 1; x += 2) {
                    for (let y = targetTile.posY - 1; y <= targetTile.posY + 1; y += 2) {
                        yield this.getTile(x, y);
                    }
                }
                break;
            case Special.GrowingLight:
                for (let tile of this.__enumerateRangedSpecialTiles(targetTile, Special.RisingLight)) {
                    yield tile;
                }
                yield this.getTile(targetTile.posX - 2, targetTile.posY);
                yield this.getTile(targetTile.posX + 2, targetTile.posY);
                yield this.getTile(targetTile.posX, targetTile.posY - 2);
                yield this.getTile(targetTile.posX, targetTile.posY + 2);
                break;
            case Special.RisingWind:
            case Special.BlazingWind:
            case Special.GiftedMagic:
                yield targetTile;
                yield this.getTile(targetTile.posX - 1, targetTile.posY);
                yield this.getTile(targetTile.posX + 1, targetTile.posY);
                yield this.getTile(targetTile.posX, targetTile.posY - 1);
                yield this.getTile(targetTile.posX, targetTile.posY + 1);
                break;
            case Special.GrowingWind:
                for (let x = targetTile.posX - 1; x <= targetTile.posX + 1; ++x) {
                    for (let y = targetTile.posY - 1; y <= targetTile.posY + 1; ++y) {
                        yield this.getTile(x, y);
                    }
                }
                break;
            case Special.RisingThunder:
            case Special.BlazingThunder:
                for (let y = targetTile.posY - 2; y <= targetTile.posY + 2; ++y) {
                    yield this.getTile(targetTile.posX, y);
                }
                break;
            case Special.GrowingThunder:
                for (let y = targetTile.posY - 3; y <= targetTile.posY + 3; ++y) {
                    yield this.getTile(targetTile.posX, y);
                }
                yield this.getTile(targetTile.posX - 1, targetTile.posY);
                yield this.getTile(targetTile.posX + 1, targetTile.posY);
                break;
        }
    }

    * enumerateMovableTiles(unit, ignoresUnits,
        includesUnitPlacedTile = true,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        for (let tile of this.enumerateMovableTilesImpl(
            unit,
            unit.moveCount,
            ignoresUnits, includesUnitPlacedTile, ignoresTeleportTile, unitPlacedTile)
        ) {
            yield tile;
        }
    }

    * enumerateMovableTilesForEnemyThreat(unit, ignoresUnits,
        includesUnitPlacedTile = true,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        for (let tile of this.enumerateMovableTilesImpl(
            unit,
            unit.moveCountAtBeginningOfTurn,
            ignoresUnits, includesUnitPlacedTile, ignoresTeleportTile, unitPlacedTile)
        ) {
            yield tile;
        }
    }

    *__enumerateTeleportTiles(
        unit
    ) {
        if (unit.hasStatusEffect(StatusEffectType.AirOrders)) {
            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                    yield tile;
                }
            }
        }

        for (let skillId of unit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.TomeOfFavors:
                    if (unit.isWeaponSpecialRefined) {
                        for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                            if (isWeaponTypeBeast(ally.weaponType)
                                && ally.heroInfo.canEquipRefreshSkill()
                            ) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case Weapon.FujinYumi:
                    if (unit.isWeaponSpecialRefined) {
                        if (unit.hpPercentage >= 50) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case Weapon.LanceOfFrelia:
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 2, false, true)) {
                            yield tile;
                        }
                    }
                    break;
                case Weapon.Gurimowaru:
                    if (unit.isWeaponRefined) {
                        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 2, false, true)) {
                                yield tile;
                            }
                        }
                    }
                    else {
                        if (unit.hpPercentage >= 50) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case PassiveB.TeniNoKona:
                case Weapon.ApotheosisSpear:
                    {
                        let threshold = 50;
                        if (skillId == PassiveB.TeniNoKona) {
                            threshold = 80;
                        }
                        else if (skillId == Weapon.ApotheosisSpear) {
                            threshold = 0;
                        }
                        if (unit.hpPercentage >= threshold) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
                case PassiveB.Kyuen2:
                case PassiveB.Kyuen3:
                case Weapon.FlowerLance:
                    for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                        let threshold = 0;
                        switch (skillId) {
                            case PassiveB.Kyuen2:
                                threshold = 40;
                                break;
                            case PassiveB.Kyuen3:
                                threshold = 50;
                                break;
                            case Weapon.FlowerLance:
                                threshold = 80;
                                break;
                        }
                        if (ally.hpPercentage <= threshold) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                yield tile;
                            }
                        }
                    }
                    break;
                case Weapon.AstralBreath:
                    for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                        if (unit.partnerHeroIndex == ally.heroIndex) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                yield tile;
                            }
                        }
                    }
                    break;
                case Weapon.Noatun:
                    {
                        let threshold = 50;
                        if (!unit.isWeaponRefined) {
                            threshold = 40;
                        }

                        if (unit.hpPercentage <= threshold) {
                            for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }

                        if (unit.isWeaponSpecialRefined) {
                            if (unit.hpPercentage >= 50) {
                                for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        yield tile;
                                    }
                                }
                            }
                        }
                    }
                    break;
                case PassiveB.Ridatsu3:
                    {
                        let threshold = 50;
                        if (unit.hpPercentage <= threshold) {
                            for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;

                case PassiveB.KyokugiHiKo1:
                case PassiveB.KyokugiHiKo2:
                case PassiveB.KyokugiHiKo3:
                    {
                        if (skillId == PassiveB.KyokugiHiKo3
                            || (skillId == PassiveB.KyokugiHiKo2 && unit.hpPercentage >= 50)
                            || (skillId == PassiveB.KyokugiHiKo1 && unit.isFullHp)
                        ) {
                            for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                                if (ally.moveType == MoveType.Armor
                                    || ally.moveType == MoveType.Infantry
                                    || ally.moveType == MoveType.Cavalry) {
                                    for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                        yield tile;
                                    }
                                }
                            }
                        }
                    }
                    break;
                case PassiveB.HentaiHiko1:
                case PassiveB.HentaiHiko2:
                case PassiveB.HentaiHiko3:
                    if (skillId == PassiveB.HentaiHiko3
                        || (skillId == PassiveB.HentaiHiko2 && unit.hpPercentage >= 50)
                        || (skillId == PassiveB.HentaiHiko1 && unit.isFullHp)
                    ) {
                        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            if (ally.moveType == MoveType.Flying) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                    }
                    break;
            }
        }

        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
            for (let skillId of ally.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.HinokaNoKounagitou:
                        if (ally.isWeaponSpecialRefined) {
                            if (unit.moveType == MoveType.Infantry || unit.moveType == MoveType.Flying) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                        break;
                    case Weapon.IzunNoKajitsu:
                        if (ally.hpPercentage >= 50) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                yield tile;
                            }
                        }
                        break;
                    case PassiveC.SorakaranoSendo3:
                        // 空からの先導
                        if (unit.moveType == MoveType.Armor
                            || unit.moveType == MoveType.Infantry) {
                            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                yield tile;
                            }
                        }
                        break;
                    case PassiveC.HikonoSendo3:
                        if (unit.moveType == MoveType.Flying) {
                            // 飛行の先導
                            if (ally.hasPassiveSkill(PassiveC.HikonoSendo3)) {
                                for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                                    yield tile;
                                }
                            }
                        }
                        break;
                }
            }
        }
    }

    __canWarp(targetTile, warpUnit) {
        for (let tile of this.enumerateTilesWithinSpecifiedDistance(targetTile, 4)) {
            if (tile.isEnemyUnitAvailable(warpUnit)
                && tile.placedUnit.passiveB == PassiveB.DetailedReport) {
                return false;
            }
        }
        return true;
    }

    *__enumerateAllMovableTilesImpl(
        unit,
        moveCount,
        ignoresUnits,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        let startTile = unit.placedTile;
        if (unitPlacedTile != null) {
            startTile = unitPlacedTile;
        }

        for (let tile of startTile.getMovableNeighborTiles(unit, moveCount, ignoresUnits)) {
            yield tile;
        }

        if (!ignoresTeleportTile) {
            for (let tile of this.__enumerateTeleportTiles(unit)) {
                if (!this.__canWarp(tile, unit)) {
                    continue;
                }

                if (unit.isCantoActivated()) {
                    if (tile.calculateDistanceToUnit(unit) <= unit.moveCountForCanto) {
                        yield tile;
                    }
                }
                else {
                    yield tile;
                }
            }
        }
    }

    * enumerateMovableTilesImpl(
        unit,
        moveCount,
        ignoresUnits,
        includesUnitPlacedTile = true,
        ignoresTeleportTile = false,
        unitPlacedTile = null
    ) {
        const enumerated = {};
        for (let tile of this.__enumerateAllMovableTilesImpl(unit, moveCount, ignoresUnits, ignoresTeleportTile, unitPlacedTile)) {
            if (tile.positionToString() in enumerated) {
                continue;
            }
            enumerated[tile.positionToString()] = tile;
            if (!includesUnitPlacedTile
                && tile.placedUnit != unit
                && !tile.isUnitPlacable()) {
                continue;
            }
            yield tile;
        }
    }

    examinesCanAttack(attackerUnit, attackTargetUnit, ignoresTeleportTile,
        moveTile = null, // 指定した場合は、指定タイルに移動した前提で評価します
        ignoreTileFunc = null,
        includesUnitPlacedTile = true
    ) {
        let doneTiles = [];
        console.log("movable tiles:");
        for (let neighborTile of this.enumerateMovableTiles(attackerUnit, false, includesUnitPlacedTile, ignoresTeleportTile, moveTile)) {
            if (ignoreTileFunc != null && ignoreTileFunc(neighborTile)) {
                continue;
            }
            for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(neighborTile, attackerUnit.attackRange)) {
                if (doneTiles.includes(tile)) {
                    continue;
                }
                doneTiles.push(tile);

                let targetTile = attackTargetUnit.placedTile;
                if (targetTile.posX == tile.posX && targetTile.posY == tile.posY) {
                    return true;
                }
            }
        }
        return false;
    }

    __setEnemyThreat(unit) {
        if (!unit.hasWeapon) {
            return;
        }

        var doneTiles = [];
        for (let neighborTile of this.enumerateMovableTilesForEnemyThreat(unit, true, true, true)) {
            for (let tile of this.enumerateTilesInSpecifiedDistanceFrom(neighborTile, unit.attackRange)) {
                if (doneTiles.includes(tile)) {
                    continue;
                }

                doneTiles.push(tile);
                switch (unit.groupId) {
                    case UnitGroupType.Ally:
                        if (!tile.threateningAllies.includes(unit)) {
                            tile.threateningAllies.push(unit);
                        }
                        tile.increaseDangerLevel();
                        break;
                    case UnitGroupType.Enemy:
                        if (!tile.threateningEnemies.includes(unit)) {
                            tile.threateningEnemies.push(unit);
                        }
                        tile.increaseAllyDangerLevel();
                        break;
                }
            }
        }
    }

    updateMovableAndAttackableTilesForUnit(unit) {
        unit.movableTiles = [];
        unit.attackableTiles = [];
        unit.assistableTiles = [];

        // ユニットの移動可能範囲、攻撃可能範囲を更新
        for (let tile of this.enumerateMovableTiles(unit, false)) {
            if (unit.movableTiles.includes(tile)) {
                continue;
            }

            unit.movableTiles.push(tile);
            if (unit.hasWeapon) {
                for (let attackableTile of this.enumerateTilesInSpecifiedDistanceFrom(tile, unit.attackRange)) {
                    if (!unit.attackableTiles.includes(attackableTile)) {
                        unit.attackableTiles.push(attackableTile);
                    }
                }
            }
            if (unit.hasSupport) {
                for (let assistableTile of this.enumerateTilesInSpecifiedDistanceFrom(tile, unit.assistRange)) {
                    if (!unit.assistableTiles.includes(assistableTile)) {
                        unit.assistableTiles.push(assistableTile);
                    }
                }
            }
        }
    }

    updateMovableAndAttackableTilesForAllUnits() {
        for (let unit of this._units) {
            this.updateMovableAndAttackableTilesForUnit(unit);
        }
    }

    /// タイルの状態を更新します。
    updateTiles(updatesEnemyThreat = true) {
        this.updateMovableAndAttackableTilesForAllUnits();

        // 各タイルの初期化
        for (let tile of this._tiles) {
            tile.resetDangerLevel();
            tile.closestDistanceToEnemy = -1;
            tile.isMovableForAlly = false;
            tile.isMovableForEnemy = false;
            tile.isAttackableForAlly = false;
            tile.isAttackableForEnemy = false;
            tile.threateningEnemies = [];
            tile.threateningAllies = [];
        }

        for (let unit of this._units) {
            if (unit.groupId == UnitGroupType.Enemy) {
                for (let tile of unit.movableTiles) {
                    tile.isMovableForEnemy = true;
                }
                for (let tile of unit.attackableTiles) {
                    tile.isAttackableForEnemy = true;
                }
            } else {
                for (let tile of unit.movableTiles) {
                    tile.isMovableForAlly = true;
                }
                for (let tile of unit.attackableTiles) {
                    tile.isAttackableForAlly = true;
                }
            }
        }

        // 危険度等を更新
        if (updatesEnemyThreat) {
            for (let unit of this._units) {
                this.__setEnemyThreat(unit);
            }
        }
    }

    /// Map を Table に変換します。
    toTable() {
        let isMapHeaderEnabled = this.isHeaderEnabled;
        if (isMapHeaderEnabled) {
            this.cellOffsetX = 1;
            this.cellOffsetY = 0;
        }

        var tableWidth = this._width + this.cellOffsetX;
        var tableHeight = this._height + this.cellOffsetY;

        if (this._table == null) {
            this._table = new Table(tableWidth, tableHeight);
        }
        else {
            this._table.resize(tableWidth, tableHeight);
        }
        var table = this._table;

        if (this.isBackgroundImageEnabled) {
            table.backgroundImage = `url(${getMapBackgroundImage(this._type)})`;
        }
        else {
            table.backgroundImage = "none";
        }

        // マップをテーブル化
        let cellWidth = this.cellWidth;
        let cellHeight = this.cellHeight;
        {
            // テーブルセルの初期化
            for (var y = 0; y < this._height; ++y) {
                for (var x = 0; x < this._width; ++x) {
                    var cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                    var fontColor = "#fff";
                    var tileText = this.getTileLabel(x, y);
                    cell.setToDefault();
                    cell.fontColor = fontColor;
                    cell.innerText = tileText;
                    cell.borderWidth = "1px";
                    // cell.borderColor = "transparent";
                    if (this.isBackgroundImageEnabled) {
                        cell.borderStyle = "none";
                        cell.bgColor = "transparent";
                    }
                    else {
                        let index = y * this._width + x;
                        let tile = this._tiles[index];
                        cell.bgColor = tileTypeToColor(tile.type);
                        cell.borderStyle = "solid";
                    }
                }
            }

            // 施設などの配置
            for (var y = 0; y < this._height; ++y) {
                if (isMapHeaderEnabled) {
                    var cell = table.getCell(0, y);
                    cell.type = CellType.Header;
                    cell.innerText = this.getTileLabelY(y);
                    cell.borderWidth = "0px";
                }
                for (var x = 0; x < this._width; ++x) {
                    var index = y * this._width + x;
                    var tile = this._tiles[index];
                    var obj = tile.obj;

                    var tileText = "";
                    // var tileText = this.getTileLabel(x, y);
                    if (!this.isBackgroundImageEnabled) {
                        var tileThumb = tileTypeToThumb(tile.type, this._type);
                        if (tileThumb != null) {
                            // なんかwidthを+2しないと合わなかった
                            let thumbWidth = cellWidth + 2;
                            tileText += "<img style='position:absolute;bottom:0;left:0;' src='" + tileThumb + "' width='" + thumbWidth + "px' />";
                        }
                    }

                    if (obj != null) {
                        let drawsObj = !this.isBackgroundImageEnabled
                            || !(obj instanceof Wall);
                        if (drawsObj) {
                            tileText += "<img style='position:absolute;bottom:0;left:0;' class='draggable-elem' id='" + tile.obj.id + "' src='" + obj.icon + "' width='" + cellWidth + "px' draggable='true' ondragstart='f_dragstart(event)' />";
                        }
                    }

                    var showTilePriority = false;
                    if (showTilePriority) {
                        tileText += tile.tilePriority;
                    }

                    var cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                    cell.innerText = tileText;
                    if (obj != null) {
                        this.__putStructureIconToCell(cell, obj);
                    }
                }
            }

            if (isMapHeaderEnabled) {
                {
                    var cell = table.getCell(0, this._height);
                    cell.borderWidth = "0px";
                }
                for (var x = 0; x < this._width; ++x) {
                    var cell = table.getCell(x + this.cellOffsetX, this._height);
                    cell.type = CellType.Header;
                    cell.innerText = this.getTileLabelX(x);
                    cell.borderWidth = "0px";
                }
            }
        }

        // 各ユニットの処理
        for (let unit of this._units) {
            // console.log(unit);
            var tile = unit.placedTile;
            var cell = table.getCell(tile.posX + this.cellOffsetX, tile.posY + this.cellOffsetY);
            switch (unit.groupId) {
                case UnitGroupType.Enemy:
                    {
                        this.__putUnitIconToCell(cell, unit);
                        // 敵への最短距離を表示
                        if (this.showClosestDistanceToEnemy) {
                            tile.closestDistanceToEnemy = tile.calculateDistanceToClosestEnemyTile(unit);
                        }
                    }
                    break;
                case UnitGroupType.Ally:
                    {
                        this.__putUnitIconToCell(cell, unit);
                    }
                    break;
            }
        }


        const shadowCss = this.__getShadowCss();
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                let index = y * this._width + x;
                let tile = this._tiles[index];
                let cell = table.getCell(x + this.cellOffsetX, y + this.cellOffsetY);
                this.setCellStyle(tile, cell);

                let additionalInnerText = "";
                let isBorderEnabled = false;
                if (this._showAllyAttackRange && tile.dangerLevel > 0) {
                    isBorderEnabled = true;
                    // 危険度の表示
                    additionalInnerText += "<span style='color:#0bf;font-size:12px;" + shadowCss + ";'><b>" + tile.dangerLevel + "</b></span>";
                }
                if (this._showEnemyAttackRange && tile.allyDangerLevel > 0) {
                    isBorderEnabled = true;
                    // 危険度の表示
                    additionalInnerText += "<span style='color:#f80;font-size:12px;" + shadowCss + ";'><b>" + tile.allyDangerLevel + "</b></span>";
                }

                if (tile.closestDistanceToEnemy > 0) {
                    // 敵への最短距離の表示
                    var closestDistance = tile.closestDistanceToEnemy;
                    if (tile.closestDistanceToEnemy > 100) {
                        // たどり着けない
                        closestDistance = "∞";
                    }
                    additionalInnerText += "<span style='color:#fff;font-size:12px;" + shadowCss + ";'><b>" + closestDistance + "</b></span>";
                }

                if (tile.overridesCell) {
                    cell.borderColor = tile.borderColor;
                    cell.borderWidth = tile.borderWidth;
                    additionalInnerText += tile.overrideText;
                }

                cell.innerText += "<div style='position:absolute;top:0;left:0;'>" + additionalInnerText + "</div>";

                let thisCellWidth = Number(cellWidth);
                let thisCellHeight = Number(cellHeight);
                if (!isBorderEnabled) {
                    thisCellWidth += 2;
                    thisCellHeight += 2;
                }

                // セルの中身を div で囲む
                cell.innerText = "<div class='cell-root' style='position:relative;width:" + thisCellWidth + "px;height:" + thisCellHeight + "px;'>" + cell.innerText + "</div>";
            }
        }

        return table;
    }

    setCellStyle(tile, cell) {
        const allyMovableTileColor = "#2ae";
        const enemyMovableTileColor = "#e88";
        const attackRangeBorderWidth = 1;
        if (this.isBackgroundImageEnabled) {
            cell.bgColor = "transparent";
        }
        else {
            cell.bgColor = tileTypeToColor(tile.type);
        }
        if (this.showAllyAttackRange) {
            const alpha = "40";
            if (tile.isAttackableForAlly) {
                cell.borderStyle = "solid";
                cell.borderColor = "#08f";
                cell.bgColor = "#dde0ee" + alpha;
            }
            if (tile.isMovableForAlly) {
                // cell.borderColor = allyMovableTileColor;
                // cell.bgColor = "#cbd6ee" + alpha;
            }
            cell.borderWidth = attackRangeBorderWidth + "px";
        }
        if (this.showEnemyAttackRange) {
            const alpha = "40";
            if (tile.isAttackableForEnemy) {
                cell.borderStyle = "solid";
                // cell.borderColor = "#e92";
                // cell.bgColor = "#eeccc5";
                cell.borderColor = "#f00";
                cell.bgColor = "#ff8888" + alpha;
            }
            if (tile.isMovableForEnemy) {
                // cell.borderColor = enemyMovableTileColor;
                // cell.bgColor = "#ebb";
                // cell.borderColor = "#f00";
                // cell.bgColor = "#ff8888" + alpha;
                // cell.borderColor = "transparent";
            }
            cell.borderWidth = attackRangeBorderWidth + "px";
        }

        if (this._showEnemyAttackRange && this._showAllyAttackRange && tile.dangerLevel > 0 && tile.allyDangerLevel > 0) {
            const alpha = "90";
            cell.borderColor = "#f0f";
            cell.bgColor = "#eee0ee" + alpha;
        }
    }


    * enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        for (let unit of this.enumerateUnitsInTheSameGroup(targetUnit)) {
            var dist = Math.abs(unit.posX - targetUnit.posX) + Math.abs(unit.posY - targetUnit.posY);
            if (dist <= spaces) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInTheSameGroup(targetUnit) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetUnit.groupId)) {
            if (unit != targetUnit) {
                yield unit;
            }
        }
    }

    * enumerateUnitsInSpecifiedGroup(groupId) {
        for (let unit of this._units) {
            if (unit.groupId == groupId) {
                yield unit;
            }
        }
    }

    __putStructureIconToCell(cell, structure) {
        if (structure.isSelected) {
            cell.bgColor = SelectedTileColor;
        }
        if (!this.isIconOverlayDisabled) {
            if (!this.isTrapIconOverlayDisabled || !(structure instanceof TrapBase)) {
                var shadowCss = this.__getShadowCss();
                if (structure.hasLevel) {
                    cell.innerText += "<span style='position:absolute;bottom:0;right:0;font-size:10px;" + shadowCss + ";'>"
                    cell.innerText += "LV." + structure.level;
                    cell.innerText += "</span>";
                }
            }
        }
    }

    __putUnitIconToCell(cell, unit) {
        var style = "";
        var color = "#bbeeff";
        {
            // 残りHPで枠線を変える
            if (unit.hpPercentage <= 50) {
                color = "#ff0000";
            } else if (unit.hpPercentage <= 75) {
                color = "#ffbb00";
            }
            if (color != "") {
                //style = "border: 2px " + color + " solid;border-radius: 50px 50px 50px 50px / 50px 50px 50px 50px;";
            }
        }

        if (unit.isActionDone) {
            style += "filter:grayscale(100%);filter:brightness(70%);";
        }

        if (unit.isSelected) {
            // style += "border: 1px #ffffff solid;border-radius: 50px 50px 50px 50px / 50px 50px 50px 50px;";
            // style += "filter:grayscale(0%);filter:brightness(120%);";
            cell.bgColor = SelectedTileColor;
            // cell.borderColor = "#ff0000";
        }

        // console.log("unit.id = " + unit.id + ", unit.icon = " + unit.icon);
        if (cell.innerText.includes("<img")) {
            cell.innerText += this.toImgElem(unit.id, unit.icon, style);
        }
        else {
            cell.innerText = this.toImgElem(unit.id, unit.icon, style);
        }

        if (!this.isIconOverlayDisabled) {
            var shadowCss = this.__getShadowCss();
            if (this.isExpansionUnitFunc != null && this.isExpansionUnitFunc(unit)) {
                cell.innerText += "<span style='position:absolute;bottom:0;right:0;'><img src='"
                    + g_imageRootPath + "ExpansionUnit.png" + "' style='width:15px' ></span>";
            }

            cell.innerText += "<span style='font-size:10px;color:" + color + ";position:absolute;bottom:0;left:0;" + shadowCss + ";'>"
                + unit.hp + "</span>";
            if (unit.maxSpecialCount > 0) {
                var specialCount = unit.specialCount;
                if (unit.specialCount == 0) {
                    specialCount = "<img src='" + g_imageRootPath + "Special.png" + "' style='width:12px;height:12px'>";
                }
                cell.innerText += "<span style='font-size:10px;color:#ffbbee;position:absolute;bottom:12px;left:0;" + shadowCss + ";'>"
                    + specialCount + "</span>";
            }

            // バフ、デバフ
            {
                cell.innerText += "<span style='position:absolute;bottom:0;right:0;" + shadowCss + ";'>"
                if (unit.isBuffed) {
                    cell.innerText += "<img src='" + g_imageRootPath + "BuffIcon.png" + "' style='height:12px'>";
                }
                if (unit.isDebuffed) {
                    cell.innerText += "<img src='" + g_imageRootPath + "DebuffIcon.png" + "' style='height:12px'>";
                }
                cell.innerText += "</span>";
            }

            // 状態異常
            {
                cell.innerText += "<span style='position:absolute;top:0;right:0;" + shadowCss + ";'>"
                for (let statusEffect of unit.statusEffects) {
                    cell.innerText += "<img src='" + statusEffectTypeToIconFilePath(statusEffect) + "' style='height:11px'>";
                }

                // todo: 暫定対処
                if (!unit.hasStatusEffect(StatusEffectType.MobilityIncreased) && unit.moveCount > unit.getNormalMoveCount()) {
                    cell.innerText += "<img src='" + statusEffectTypeToIconFilePath(StatusEffectType.MobilityIncreased) + "' style='height:11px'>";
                }
                cell.innerText += "</span>";
            }
        }
    }

    __getShadowCss() {
        const shadowColor = "#444";
        const shadowCss = "text-shadow: "
            + shadowColor + " 1px 1px 0px, " + shadowColor + " -1px 1px 0px,"
            + shadowColor + " 1px -1px 0px, " + shadowColor + " -1px -1px 0px,"
            + shadowColor + " 0px 1px 0px, " + shadowColor + " 0px -1px 0px,"
            + shadowColor + " -1px 0px 0px, " + shadowColor + " 1px 0px 0px";
        return shadowCss;
    }

    toImgElem(id, imagePath, additionalStyle) {
        return "<img style='position:absolute;bottom:0;left:0;" + additionalStyle + "' class='draggable-elem' id='" + id + "' src='" + imagePath + "' width='" + this.cellWidth + "px' draggable='true' ondragstart='f_dragstart(event)' />";
    }
}
/// @file
/// @brief マップ上の配置物を表すクラスとそれに関連する関数等の定義です。

const ObjType = {
    None: 0,
    BreakableWall: 1,
    Trap: 2,
};

const OrnamentSettings = [
    { label: "フェーの石像", icon: "FehStatue.png" },
    { label: "フェーの鏡餅", icon: "FehKagamiMochi.png" },
    { label: "2周年のアーチ", icon: "AnniversaryArch.png" },
    { label: "2周年のケーキ", icon: "AnniversaryCake.png" },
    { label: "白銀の王座", icon: "SilverThrone.png" },
    { label: "銅の王座", icon: "BronzeThrone.png" },
    { label: "黄金の王座", icon: "GoldenThrone.png" },
    { label: "あったか暖炉", icon: "Fireplace.png" },
    { label: "雪だるま", icon: "SnowFamily.png" },
    { label: "歓びの花壇", icon: "FlowerBed.png" },
    { label: "ハートの花飾り", icon: "HeartGarland.png" },
    { label: "レトロな街灯", icon: "Streetlamp.png" },
    { label: "武器屋", icon: "WeaponShop.png" },
    { label: "温泉", icon: "HotSprings.png" },
    { label: "宿屋", icon: "Inn.png" },
    { label: "アクセサリー屋", icon: "AccessoryShop.png" },
    { label: "翼竜の彫刻柱", icon: "DragonStatue.png" },
    { label: "鉄製の柵", icon: "IronFence.png" },
    { label: "みんなの本棚", icon: "Bookshelf.png" },
    { label: "絆の語らい", icon: "WordOfBonding.png" },
    { label: "絆の彩り", icon: "SightOfBonding.png" },
    { label: "絆の響き", icon: "SoundOfBonding.png" },
    { label: "音楽堂", icon: "ConcertHall.png" },
    { label: "金鹿の学級旗", icon: "GoldenDeerFlag.png" },
    { label: "青獅子の学級旗", icon: "BlueLionFlag.png" },
    { label: "黒鷲の学級旗", icon: "BlackEagleFlag.png" },
    { label: "畑", icon: "Hatake.png" },
    { label: "食堂", icon: "Syokudo.png" },
    { label: "魔女の窯", icon: "MajoNoKama.png" },
    { label: "かぼちゃのランタン", icon: "KabochaNoRantan.png" },
    { label: "オバケの棺", icon: "ObakeNoHitsugi.png" },
    { label: "年始の門飾り", icon: "NenshiNoKadokazari.png" },
    { label: "赤い灯籠", icon: "AkaiToro.png" },
    { label: "年始のお祝いゲート", icon: "NenshiNoOiwaiGate.png" },
    { label: "3周年カップケーキ", icon: "AnniversaryCupCake.png" },
    { label: "ニザヴェリルの歯車塊", icon: "NisavellirGear.png" },
    { label: "ニザヴェリルの鏡", icon: "NisavellirMirror.png" },
    { label: "グリンブルスティの像", icon: "GullinburstiStatue.png" },
];

function findOrnamentTypeIndexByIcon(icon) {
    for (let i = 0; i < OrnamentSettings.length; ++i) {
        let setting = OrnamentSettings[i];
        if (setting.icon == icon) {
            return i;
        }
    }
    return -1;
}

/// 配置物の基底クラスです。
class StructureBase {
    constructor(id) {
        this._id = id;
        this.level = 1;
        this.posX = -1;
        this.posY = -1;
        this.placedTile = null;

        this.isSelected = false;

        // シリアライズする時に一時的に使用
        this.ownerType = 0;
    }

    get isOnMap() {
        return this.placedTile != null;
    }

    get id() {
        return this._id;
    }

    get name() {
        return "不明";
    }

    get description() {
        return "";
    }

    get hasLevel() {
        return true;
    }

    get isRequired() {
        return false;
    }

    get icon() {
        return g_imageRootPath + this.iconFileName;
    }

    get iconFileName() {
        return "";
    }

    get isExecutable() {
        return true;
    }

    get isBreakable() {
        return true;
    }

    setPos(x, y) {
        this.posX = x;
        this.posY = y;
    }

    get serialId() {
        return StructureCookiePrefix + this.id;
    }

    perTurnStatusToString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY;
    }

    turnWideStatusToString() {
        return this.level;
    }

    fromPerTurnStatusString(value) {
        this.__fromPerTurnStatusStringImpl(value);
    }
    __fromPerTurnStatusStringImpl(value) {
        if (value == undefined) {
            console.trace("undefined な値が入力されました");
            return [[], 0];
        }

        var splited = value.split(ValueDelimiter);
        var i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.ownerType = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posY = Number(splited[i]); ++i; }
        return [splited, i];
    }

    fromTurnWideStatusString(value) {
        var splited = value.split(ValueDelimiter);
        var i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.level = Number(splited[i]); ++i; }
    }

    toString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + this.level;
    }

    fromString(value) {
        var splited = value.split(ValueDelimiter);
        var i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.ownerType = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posY = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.level = Number(splited[i]); ++i; }
    }
}

/// 攻撃施設の基底クラスです。
class OffenceStructureBase extends StructureBase {
    constructor(id) {
        super(id);
    }
}

/// 防衛施設の基底クラスです。
class DefenceStructureBase extends StructureBase {
    constructor(id) {
        super(id);
    }
}

class DefFortress extends DefenceStructureBase {
    constructor(id) {
        super(id);
        this.level = 5;
    }
    get iconFileName() {
        return "Fortress_Red.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "防衛砦";
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class OfFortress extends OffenceStructureBase {
    constructor(id) {
        super(id);
        this.level = 5;
    }
    get iconFileName() {
        return "Fortress.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "攻撃砦";
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class DefBoltTower extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTower_Red.png";
    }
    get name() {
        return "防衛・雷の塔";
    }
    get description() {
        let value = Number(this.level) * 5 + 5;
        return `3ターン開始時、この設備を中心とした縦7×3マスにいる敵に${value}ダメージ`;
    }
}

class OfBoltTower extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTower.png";
    }
    get name() {
        return "攻撃・雷の塔";
    }
    get description() {
        let value = Number(this.level) * 5 + 5;
        return `3ターン開始時、この設備を中心とした縦3列にいる敵に${value}ダメージ`;
    }
}

/// 脱出の縄梯子を表すクラスです。
class ExcapeLadder extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }

    get iconFileName() {
        return "EscapeLadder.png";
    }
    get name() {
        return "攻撃・脱出の縄梯子";
    }
    get isExecutable() {
        return false;
    }
    get hasLevel() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

/// エナジーの水瓶を表すクラスです。
class AetherAmphorae extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "AetherAmphorae.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "エナジーの水瓶";
    }
    get isExecutable() {
        return false;
    }
    get hasLevel() {
        return false;
    }
}
/// エナジーの泉を表すクラスです。
class AetherFountain extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "AetherFountain.png";
    }
    get isRequired() {
        return true;
    }
    get name() {
        return "エナジーの泉";
    }
    get isExecutable() {
        return false;
    }
    get hasLevel() {
        return false;
    }
}

class SafetyFence extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "SafetyFence.png";
    }
    get name() {
        return "攻撃・安全柵";
    }
    get description() {
        let value = Number(this.level);
        return `${value}ターン目まで、防衛部隊のターン開始時スキル発動後に、攻撃部隊全員が危険範囲外か、本設備を下段とした縦2×横7マスにいる時、防衛部隊全員を行動終了`;
    }
}

class DefArmorSchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "ArmorSchool_Red.png";
    }
    get name() {
        return "防衛・対重装訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵重装の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class OfArmorSchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "ArmorSchool.png";
    }
    get name() {
        return "攻撃・対重装訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵重装の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class DefCatapult extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "Catapult_Red.png";
    }
    get name() {
        return "防衛・投石機";
    }
}

class OfCatapult extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "Catapult.png";
    }
    get name() {
        return "攻撃・投石機";
    }
}

class DefCavalrySchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "CavalrySchool_Red.png";
    }
    get name() {
        return "防衛・対騎馬訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵騎馬の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class OfCavalrySchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "CavalrySchool.png";
    }
    get name() {
        return "攻撃・対騎馬訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵騎馬の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class DefFlierSchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "FlierSchool_Red.png";
    }
    get name() {
        return "防衛・対飛行訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵飛行の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class OfFlierSchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "FlierSchool.png";
    }
    get name() {
        return "攻撃・対飛行訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵飛行の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class DefHealingTower extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HealingTower_Red.png";
    }
    get name() {
        return "防衛・回復の塔";
    }
    get description() {
        let value = Number(this.level) * 5 + 5;
        return `ターン開始時、この設備を中心とした縦5×横5マスにいる味方を${value}回復`;
    }
}

class OfHealingTower extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HealingTower.png";
    }
    get name() {
        return "攻撃・回復の塔";
    }
    get description() {
        let value = Number(this.level) * 5 + 5;
        return `ターン開始時、この設備を中心とした縦3×横5マスにいる味方を${value}回復`;
    }
}

class DefInfantrySchool extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "InfantrySchool_Red.png";
    }
    get name() {
        return "防衛・対歩行訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵歩行の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class OfInfantrySchool extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "InfantrySchool.png";
    }
    get name() {
        return "攻撃・対歩行訓練所";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、この設備を中心とした縦3列にいる敵歩行の攻撃、速さ、守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class Ornament extends DefenceStructureBase {
    constructor(id) {
        super(id);
        this.ornamentTypeIndex = 0;
        this._icon = "";
        this.setIconByOrnamentTypeIndex();
    }
    get iconFileName() {
        return this._icon;
    }
    set iconFileName(value) {
        this._icon = value;
    }
    get name() {
        return "装飾・交流設備";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    setIconByOrnamentTypeIndex() {
        var icon = OrnamentSettings[this.ornamentTypeIndex].icon;
        this._icon = icon;
    }
}

class DefPanicManor extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "PanicManor_Red.png";
    }
    get name() {
        return "防衛・恐慌の館";
    }
    get description() {
        let threshold = Number(this.level) * 5 + 35;
        return `ターン開始時、この設備を中心とした縦7×横3マスにいるHP${threshold}以下の敵の強化を+ではなく-とする(敵の次回行動終了まで)`;
    }
}

class OfPanicManor extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "PanicManor.png";
    }
    get name() {
        return "攻撃・恐慌の館";
    }
    get description() {
        let threshold = Number(this.level) * 5 + 35;
        return `ターン開始時、この設備を中心とした縦3列にいるHP${threshold}以下の敵の強化を+ではなく-とする(敵の次回行動終了まで)`;
    }
}

class DefTacticsRoom extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "TacticsRoom_Red.png";
    }
    get name() {
        return "防衛・軍師の作戦室";
    }
    get description() {
        let value = Number(this.level) * 5 + 35;
        return `ターン開始時、この設備を中心とした縦7×3マスにいるHP${value}以下の弓、暗器、魔法、杖の敵の移動を最大1マスに制限(敵の次回行動終了まで)`;
    }
}

class OfTacticsRoom extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "TacticsRoom.png";
    }
    get name() {
        return "攻撃・軍師の作戦室";
    }
    get description() {
        let value = Number(this.level) * 5 + 35;
        return `ターン開始時、この設備と同じ縦列にいるHP${value}以下の弓、暗器、魔法、杖の敵の移動を最大1マスに制限(敵の次回行動終了まで)`;
    }
}

class DefBrightShrine extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BrightShrine_Red.png";
    }
    get name() {
        return "防衛・白の封印祠";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、敵軍内で最も攻撃+速さの合計値が高い敵の攻撃、速さ-${value}(敵の次回行動終了まで)`;
    }
}

class OfBrightShrine extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BrightShrine.png";
    }
    get name() {
        return "攻撃・白の封印祠";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、敵軍内で最も攻撃+速さの合計値が高い敵の攻撃、速さ-${value}(敵の次回行動終了まで)`;
    }
}

class DefDarkShrine extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "DarkShrine_Red.png";
    }
    get name() {
        return "防衛・黒の封印祠";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、敵軍内で最も守備+魔防の合計値が高い敵の守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}

class OfDarkShrine extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "DarkShrine.png";
    }
    get name() {
        return "攻撃・黒の封印祠";
    }
    get description() {
        let value = - 1 - Number(this.level);
        return `ターン開始時、敵軍内で最も守備+魔防の合計値が高い敵の守備、魔防-${value}(敵の次回行動終了まで)`;
    }
}


class OfHiyokuNoHisyo extends OffenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HiyokuNoHisyo.png";
    }
    get name() {
        return "比翼の飛翔";
    }
    get description() {
        let value = Number(this.level) + 2;
        return `1～${value}ターン目の間に最初に使用した比翼スキルを、もう一度だけ使用可能な状態にする ※ただし同ターンは使用不可`;
    }
}

class DefHiyokuNoTorikago extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HiyokuNoTorikago.png";
    }
    get name() {
        return "比翼の鳥籠";
    }
    get description() {
        let value = Number(this.level) + 2;
        return `防衛部隊に比翼英雄がいる時、1～${value}ターン目の間、敵は比翼スキルを使用できない`;
    }
}

class TileTypeStructureBase extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get name() {
        return "床";
    }
}

/// 罠の基底クラスです。
class TrapBase extends TileTypeStructureBase {
    constructor(id) {
        super(id);
    }
    get name() {
        return "罠";
    }
}

class FalseBoltTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTrap.png";
    }
    get name() {
        return "偽・落雷の罠";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class BoltTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "BoltTrap.png";
    }
    get name() {
        return "落雷の罠";
    }
    get isBreakable() {
        return false;
    }
    get description() {
        let value = Number(this.level) * 10;
        return `設置したマスで敵が移動終了したとき、その敵と周囲3マスにいる敵味方に${value}ダメージ(敵の攻撃や補助スキルはキャンセルされる)`;
    }
}

class FalseHeavyTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HeavyTrap.png";
    }
    get name() {
        return "偽・重圧の罠";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get isBreakable() {
        return false;
    }
}

class HeavyTrap extends TrapBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "HeavyTrap.png";
    }
    get name() {
        return "重圧の罠";
    }
    get isBreakable() {
        return false;
    }
    get description() {
        let value = Number(this.level) * 5 + 35;
        return `設置したマスで敵が移動終了したとき、その敵と周囲2マスにいるHP${value}以下の敵味方の移動を最大1マスに制限(敵の次回行動終了まで)(敵の攻撃や補助スキルはキャンセルされる)`;
    }
}

class Wall extends DefenceStructureBase {
    constructor(id) {
        super(id);
    }
    get iconFileName() {
        return "Wall.jpg";
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }
    get name() {
        return "壁";
    }
    get isBreakable() {
        return false;
    }
}

const BreakableWallIconType = {
    Wall: 0,
    Box: 1,
    Wall2: 2,
    Wall3: 3,
};

class BreakableWall extends DefenceStructureBase {
    constructor(id) {
        super(id);
        this.breakCount = 1;
        this.iconType = BreakableWallIconType.Wall;
    }
    get name() {
        return "壊せる壁";
    }

    get iconFileName() {
        switch (this.iconType) {
            case BreakableWallIconType.Box: return "BreakableBox.png";
            case BreakableWallIconType.Wall2: return "BreakableWall_1.png";
            case BreakableWallIconType.Wall3: return "BreakableWall_2.png";
            case BreakableWallIconType.Wall:
            default:
                return "BreakableWall.png";
        }
    }

    get isBroken() {
        return this.breakCount == 0;
    }
    get type() {
        return ObjType.BreakableWall;
    }
    get hasLevel() {
        return false;
    }
    get isExecutable() {
        return false;
    }

    perTurnStatusToString() {
        return super.perTurnStatusToString()
            + ValueDelimiter + this.breakCount;
    }

    fromPerTurnStatusString(value) {
        let result = super.__fromPerTurnStatusStringImpl(value);
        let splited = result[0];
        let i = result[1];
        if (Number.isInteger(Number(splited[i]))) { this.breakCount = Number(splited[i]); ++i; }
    }

    break() {
        if (this.isBroken) {
            return;
        }

        --this.breakCount;
    }
}

/// ユニットが通行可能な配置物であるかどうかを判定します。
function isMovableForUnit(structure) {
    if (structure == null) {
        return true;
    }

    return structure instanceof TrapBase;
}
/// @file
/// @brief Table クラスとそれに関連するクラスや関数等の定義です。

var CellType = {
    Normal: 0,
    Header: 1,
};

function getCellId(x, y) {
    return `${x}_${y}`;
}

function getPositionFromCellId(cellId) {
    let xy = cellId.split('_');
    let x = Number(xy[0]);
    let y = Number(xy[1]);
    return [x, y];
}

function updateCellBgColor(posX, posY, bgColor, boderColor = null) {
    let cellId = getCellId(posX, posY);
    let cell = document.getElementById(cellId);
    if (cell != null) {
        if (cell.style.backgroundColor != bgColor) {
            cell.style.backgroundColor = bgColor;
            if (boderColor != null) {
                cell.style.boderColor = boderColor;
            }
        }
    }
}

/// Table クラスのセルを表すクラスです。
class Cell {
    constructor() {
        this.setToDefault();
    }
    setToDefault() {
        this._type = CellType.Normal;
        this._innerText = '';
        this._bgColor = "#ffffff";
        this._fontColor = "#000000";
        this._borderColor = "#aaaaaa";
        this._borderWidth = "1px";
        this.borderStyle = "solid";
    }
    get innerText() {
        return this._innerText;
    }
    set innerText(value) {
        this._innerText = value;
    }
    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
    }
    get bgColor() {
        return this._bgColor;
    }
    set bgColor(value) {
        this._bgColor = value;
    }
    get fontColor() {
        return this._fontColor;
    }
    set fontColor(value) {
        this._fontColor = value;
    }
    get borderColor() {
        return this._borderColor;
    }
    set borderColor(value) {
        this._borderColor = value;
    }
    get borderWidth() {
        return this._borderWidth;
    }
    set borderWidth(value) {
        this._borderWidth = value;
    }

    getHtmlTagName() {
        switch (this.type) {
            case CellType.Header:
                return "th";
            case CellType.Normal:
                return "td";
            default:
                return "td";
        }
    }
}

/// HTMLのテーブルを構築するためのクラスです。
class Table {
    constructor(columnCount, rowCount) {
        this._columnCount = 0;
        this._rowCount = 0;
        this._cells = [];
        this.resize(columnCount, rowCount);
        this._onDropEvent = null;
        this._onDragOverEvent = null;
        this.onDragEndEvent = null;
        this._cellVerticalAlign = null;
        this._tableElem = null;
        this.backgroundImage = "none";
    }

    resize(columnCount, rowCount) {
        if (columnCount == this._columnCount && rowCount == this._rowCount) {
            return;
        }

        var oldCount = this._columnCount * this._rowCount;
        this._columnCount = columnCount;
        this._rowCount = rowCount;
        var newCount = columnCount * rowCount;
        var diff = newCount - oldCount;
        for (let i = 0; i < diff; ++i) {
            this._cells.push(new Cell());
        }
    }

    addHeaderRow(cellTexts) {
        let y = this._rowCount;
        this.resize(this._columnCount, this._rowCount + 1);
        for (let x = 0; x < this._columnCount; ++x) {
            let cell = this.getCell(x, y);
            cell.type = CellType.Header;
            cell.innerText = cellTexts[x];
        }
    }

    addRow(cellTexts) {
        let y = this._rowCount;
        this.resize(this._columnCount, this._rowCount + 1);
        for (let x = 0; x < this._columnCount; ++x) {
            let cell = this.getCell(x, y);
            cell.innerText = cellTexts[x];
        }
    }

    set cellVerticalAlign(value) {
        this._cellVerticalAlign = value;
    }

    get columnCount() {
        return this._columnCount;
    }

    get rowCount() {
        return this._rowCount;
    }

    getCell(x, y) {
        return this._cells[y * this._columnCount + x];
    }
    setCellInnerText(text, x, y) {
        this._cells[y * this._columnCount + x].innerText = text;
    }
    setCellType(type, x, y) {
        this._cells[y * this._columnCount + x].type = type;
    }

    get onDropEvent() {
        return this._onDropEvent;
    }

    get onDragOverEvent() {
        return this._onDragOverEvent;
    }

    set onDropEvent(value) {
        this._onDropEvent = value;
    }

    set onDragOverEvent(value) {
        this._onDragOverEvent = value;
    }

    updateTableElement() {
        if (this._tableElem == null) {
            this._tableElem = document.createElement("table");
            this._tableElem.setAttribute("border", "0");
        }

        {
            let style = "";
            style += `background-image:${this.backgroundImage};`;
            style += "background-size: contain;";
            // style += "border-collapse: separate;";
            style += "border-collapse: collapse;";
            style += "border-spacing: 0px;";
            style += "border-style:none;";
            this._tableElem.setAttribute("style", style);
        }

        this._updateTableElemSize();

        for (let y = 0; y < this._rowCount; ++y) {
            let trElem = this._tableElem.children[y];
            for (let x = 0; x < this._columnCount; ++x) {
                let cellElem = trElem.children[x];
                let cell = this.getCell(x, y);
                cellElem.setAttribute("class", 'droppable-elem');
                let style = "";
                style += `border-style: ${cell.borderStyle};`;
                style += "border-width: " + cell.borderWidth + ";";
                style += "border-color:" + cell.borderColor + ";";
                style += "background-color:" + cell.bgColor + ";";
                style += "color:" + cell.fontColor + ";";
                if (this._cellVerticalAlign != null) {
                    style += "vertical-align:" + this._cellVerticalAlign + ";";
                }
                cellElem.setAttribute("style", style);
                cellElem.setAttribute("id", getCellId(x, y));

                if (this._onDragOverEvent != null) {
                    cellElem.setAttribute("ondragover", this._onDragOverEvent);
                }
                if (this._onDropEvent != null) {
                    cellElem.setAttribute("ondrop", this._onDropEvent);
                }
                if (this.onDragEndEvent != null) {
                    cellElem.setAttribute("ondragend", this.onDragEndEvent);
                }
                cellElem.setAttribute("onmousedown", 'onItemSelected(event);');

                cellElem.innerHTML = cell.innerText;
            }
        }

        return this._tableElem;
    }

    _updateTableElemSize() {
        var diffRowCount = this._rowCount - this._tableElem.childElementCount;
        if (diffRowCount > 0) {
            for (let i = 0; i < diffRowCount; ++i) {
                let trElem = document.createElement("tr");
                this._tableElem.appendChild(trElem);
            }
        }
        else if (diffRowCount < 0) {
            let removeElems = [];
            for (let i = this._tableElem.childElementCount - 1; i >= this._rowCount; --i) {
                let childElem = this._tableElem.children[i];
                removeElems.push(childElem);
            }
            for (let elem of removeElems) {
                this._tableElem.removeChild(elem);
            }
        }

        for (let y = 0; y < this._rowCount; ++y) {
            let trElem = this._tableElem.children[y];
            var diffColumnCount = this._columnCount - trElem.childElementCount;
            if (diffColumnCount > 0) {
                for (let x = 0; x < diffColumnCount; ++x) {
                    let cell = this.getCell(x, y);
                    let cellElemName = cell.getHtmlTagName();
                    let cellElem = document.createElement(cellElemName);
                    trElem.appendChild(cellElem);
                }
            }
            else if (diffColumnCount < 0) {
                let removeElems = [];
                for (let x = trElem.childElementCount - 1; x >= this._columnCount; --x) {
                    let childElem = trElem.children[x];
                    removeElems.push(childElem);
                }
                for (let elem of removeElems) {
                    trElem.removeChild(elem);
                }
            }
        }

        for (let y = 0; y < this._rowCount; ++y) {
            let trElem = this._tableElem.children[y];
            for (let x = 0; x < this._columnCount; ++x) {
                let cellElem = trElem.children[x];
                let cell = this.getCell(x, y);
                let cellElemName = cell.getHtmlTagName();

                if (cellElem.tagName != cellElemName) {
                    var nextElem = cellElem.nextSibling;
                    trElem.removeChild(cellElem);
                    cellElem = document.createElement(cellElemName);

                    trElem.insertBefore(cellElem, nextElem);
                }
            }
        }
    }


    toHtml() {
        var html = "<table border='0' style='border-collapse: separate;border-width: 0px;' >";
        for (let y = 0; y < this._rowCount; ++y) {
            html += "<tr>";
            for (let x = 0; x < this._columnCount; ++x) {
                var index = y * this._columnCount + x;
                let cell = this._cells[index];
                let cellElemName = "td";
                switch (cell.type) {
                    case CellType.Header:
                        cellElemName = "th";
                        break;
                    case CellType.Normal:
                        cellElemName = "td";
                        break;
                    default:
                        break;
                }
                html += "<" + cellElemName + " class='droppable-elem' style='";
                html += "border-style: solid;";
                html += "border-width: " + cell.borderWidth + ";";
                html += "border-color:" + cell.borderColor + ";";
                html += "background-color:" + cell.bgColor + ";";
                html += "color:" + cell.fontColor + ";";
                if (this._cellVerticalAlign != null) {
                    html += "vertical-align:" + this._cellVerticalAlign + ";";
                }
                html += "' ";
                html += "id='" + x + "_" + y + "' ";
                if (this._onDragOverEvent != null) {
                    html += "ondragover='" + this._onDragOverEvent + "' ";
                }
                if (this._onDropEvent != null) {
                    html += "ondrop='" + this._onDropEvent + "' ";
                }
                html += ">" + cell.innerText + "</" + cellElemName + ">";
            }
            html += "</tr>";
        }
        html += "</table>";
        return html;
    }
}    /**
 * @file
 * @brief Unit クラスやそれに関連する関数や変数定義です。
 */

const UnitRarity = {
    Star1: 1,
    Star2: 2,
    Star3: 3,
    Star4: 4,
    Star5: 5,
};

const SeasonType = {
    None: -1,
    Light: 0,
    Dark: 1,
    Astra: 2,
    Anima: 3,
    Fire: 4,
    Water: 5,
    Wind: 6,
    Earth: 7,
};

const Hero = {
    HaloweenHector: 432,
    DuoEphraim: 443,
    ChristmasMarth: 462,
    NewYearAlfonse: 468,
    ValentineAlm: 484,
    SpringIdunn: 500,
    YoungPalla: 511,
    BridalMicaiah: 522,
    Mila: 524,
    SummerMia: 534,
    Thief: 547,
    RedThief: 548,
    BlueThief: 549,
    GreenThief: 550,
    SummerByleth: 540,
    PirateVeronica: 555,
    DuoSigurd: 566,
    HaloweenTiki: 577,
    DuoLyn: 588,
    DuoAltina: 609,
    DuoPeony: 615,
    PlegianDorothea: 625,
    DuoLif: 631,
    HarmonizedMyrrh: 648,
    DuoEirika: 659,
    HarmonizedCatria: 670,
    DuoHilda: 682,
    HarmonizedCaeda: 688,
    DuoHinoka: 700,
};

function isThiefIndex(heroIndex) {
    return heroIndex == Hero.Thief
        || heroIndex == Hero.RedThief
        || heroIndex == Hero.BlueThief
        || heroIndex == Hero.GreenThief;
}

function isThief(unit) {
    return isThiefIndex(unit.heroIndex);
}


const MoveType = {
    Infantry: 0,
    Flying: 1,
    Cavalry: 2,
    Armor: 3,
};

const IvType = {
    None: 0,
    Asset: 1, // 得意
    Flow: 2, // 不得意
}

const StatusType = {
    None: -1,
    Hp: 0,
    Atk: 1,
    Spd: 2,
    Def: 3,
    Res: 4,
};

const IvStateOptions = [
    { id: StatusType.None, text: "なし" },
    { id: StatusType.Hp, text: "HP" },
    { id: StatusType.Atk, text: "攻撃" },
    { id: StatusType.Spd, text: "速さ" },
    { id: StatusType.Def, text: "守備" },
    { id: StatusType.Res, text: "魔防" },
];

function statusTypeToString(type) {
    switch (type) {
        case StatusType.Hp: return "HP";
        case StatusType.Atk: return "攻撃";
        case StatusType.Spd: return "速さ";
        case StatusType.Def: return "守備";
        case StatusType.Res: return "魔防";
        case StatusType.None:
        default:
            return "-";
    }
}

function nameToStatusType(statusName) {
    if (statusName == "HP") {
        return StatusType.Hp;
    } else if (statusName == "攻撃") {
        return StatusType.Atk;
    } else if (statusName == "速さ") {
        return StatusType.Spd;
    } else if (statusName == "守備") {
        return StatusType.Def;
    } else if (statusName == "魔防") {
        return StatusType.Res;
    } else {
        return StatusType.None;
    }
}


const UnitGroupType = {
    Ally: 0,
    Enemy: 1,
};

const SummonerLevel =
{
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
};

function summonerLevelToString(level) {
    switch (level) {
        case SummonerLevel.C: return "C";
        case SummonerLevel.B: return "B";
        case SummonerLevel.A: return "A";
        case SummonerLevel.S: return "S";
        case SummonerLevel.None:
        default:
            return "-";
    }
}

const SummonerLevelOptions = [
    { id: SummonerLevel.None, text: "なし" },
    { id: SummonerLevel.C, text: "C" },
    { id: SummonerLevel.B, text: "B" },
    { id: SummonerLevel.A, text: "A" },
    { id: SummonerLevel.S, text: "S" },
];

const PartnerLevel =
{
    None: -1,
    C: 0,
    B: 1,
    A: 2,
    S: 3,
};


const BlessingType =
{
    None: -1,
    Hp5_Atk3: 0,
    Hp5_Spd4: 1,
    Hp5_Def5: 2,
    Hp5_Res5: 3,
    Hp3_Atk2: 4,
    Hp3_Spd3: 5,
    Hp3_Def4: 6,
    Hp3_Res4: 7,
    Hp3: 8,
};

const BlessingTypeOptions = [
    { id: BlessingType.None, text: "なし" },
    { id: BlessingType.Hp5_Atk3, text: "HP+5 攻撃+3" },
    { id: BlessingType.Hp5_Spd4, text: "HP+5 速さ+4" },
    { id: BlessingType.Hp5_Def5, text: "HP+5 守備+5" },
    { id: BlessingType.Hp5_Res5, text: "HP+5 魔防+5" },
    { id: BlessingType.Hp3_Atk2, text: "HP+3 攻撃+2" },
    { id: BlessingType.Hp3_Spd3, text: "HP+3 速さ+3" },
    { id: BlessingType.Hp3_Def4, text: "HP+3 守備+4" },
    { id: BlessingType.Hp3_Res4, text: "HP+3 魔防+4" },
    { id: BlessingType.Hp3, text: "HP+3" },
];

const CombatResult = {
    Win: 2,
    Draw: 1,
    Loss: 0,
};

const PerTurnStatusType = {
    None: -1,
    Pass: 0,
    ThreatensEnemy: 1,
    ThreatenedByEnemy: 2,
};

const StatusEffectType = {
    None: -1,
    Panic: 0, // 強化反転
    Gravity: 1, // 移動制限
    MobilityIncreased: 2, // 移動値加算
    CounterattacksDisrupted: 3, // 反撃不可付与
    TriangleAdept: 4, // 激化付与
    Guard: 5, // キャンセル
    AirOrders: 6, // 曲技付与
    EffectiveAgainstDragons: 7, // 竜特効付与
    Isolation: 8, // 補助不可
    BonusDoubler: 9, // 強化増幅
    SieldDragonArmor: 10, // 竜特効、重装特効無効
    TotalPenaltyDamage: 11, // 敵弱化ダメージ+
    ResonantBlades: 12, // 双界効果・刃
    Desperation: 13, // 攻め立て
    ResonantShield: 14, // 双界効果・盾
    Vantage: 15, // 待ち伏せ
    DeepWounds: 16, // 回復不可
    FallenStar: 17, // 落星
    ShieldFlying: 18, // 飛行特効無効
    FollowUpAttackMinus: 19, // 追撃不可
    Dodge: 20, // 回避
    TriangleAttack: 21, // トライアングルアタック
    FollowUpAttackPlus: 22, // 絶対追撃
    NullPanic: 23, // 見切り・パニック
    Stall: 24, // 空転
    CancelAffinity: 25, // 相性相殺
};

/// シーズンが光、闇、天、理のいずれかであるかを判定します。
function isMythicSeasonType(season) {
    switch (season) {
        case SeasonType.Light:
        case SeasonType.Dark:
        case SeasonType.Astra:
        case SeasonType.Anima:
            return true;
        default:
            return false;
    }
}

/// シーズンが火、地、水、風のいずれかであるかを判定します。
function isLegendarySeasonType(season) {
    return season != SeasonType.None && !isMythicSeasonType(season);
}

function moveTypeToString(moveType) {
    switch (moveType) {
        case MoveType.Infantry: return "歩行";
        case MoveType.Flying: return "飛行";
        case MoveType.Cavalry: return "騎馬";
        case MoveType.Armor: return "重装";
        default: return "不明";
    }
}

function colorTypeToString(colorType) {
    switch (colorType) {
        case ColorType.Red: return "赤";
        case ColorType.Blue: return "青";
        case ColorType.Green: return "緑";
        case ColorType.Colorless: return "無";
        default: return "不明";
    }
}

/// ステータス効果が不利なステータス効果であるかどうかを判定します。
function isNegativeStatusEffect(type) {
    switch (type) {
        case StatusEffectType.Panic:
        case StatusEffectType.Gravity:
        case StatusEffectType.CounterattacksDisrupted:
        case StatusEffectType.TriangleAdept:
        case StatusEffectType.Guard:
        case StatusEffectType.Isolation:
        case StatusEffectType.DeepWounds:
        case StatusEffectType.Stall:
            return true;
        default:
            return false;
    }
}

/// ステータス効果が有利なステータス効果であるかどうかを判定します。
function isPositiveStatusEffect(type) {
    return !isNegativeStatusEffect(type);
}

function statusEffectTypeToIconFilePath(value) {
    switch (value) {
        case StatusEffectType.Panic: return g_imageRootPath + "Penalty_Panic.png";
        case StatusEffectType.Gravity: return g_imageRootPath + "MovementRestriction.png";
        case StatusEffectType.MobilityIncreased: return g_imageRootPath + "MovementUp.png";
        case StatusEffectType.EffectiveAgainstDragons:
            return g_imageRootPath + "StatusEffect_EffectiveAgainstDragons.png";
        case StatusEffectType.Isolation:
            return g_imageRootPath + "StatusEffect_Isolation.png";
        case StatusEffectType.AirOrders:
            return g_imageRootPath + "StatusEffect_AirOrders.png";
        case StatusEffectType.Guard:
            return g_imageRootPath + "StatusEffect_Guard.png";
        case StatusEffectType.BonusDoubler:
            return g_imageRootPath + "StatusEffect_BonusDoubler.png";
        case StatusEffectType.CounterattacksDisrupted:
            return g_imageRootPath + "StatusEffect_CounterattacksDisrupted.png";
        case StatusEffectType.SieldDragonArmor:
            return g_imageRootPath + "StatusEffect_SieldDragonArmor.png";
        case StatusEffectType.TotalPenaltyDamage:
            return g_imageRootPath + "TotalPenaltyDamage.png";
        case StatusEffectType.ResonantBlades:
            return g_imageRootPath + "StatusEffect_ResonantBlades.png";
        case StatusEffectType.Desperation:
            return g_imageRootPath + "Desperation.png";
        case StatusEffectType.ResonantShield:
            return g_imageRootPath + "StatusEffect_ResonantShield.png";
        case StatusEffectType.Vantage:
            return g_imageRootPath + "StatusEffect_Vantage.png";
        case StatusEffectType.DeepWounds:
            return g_imageRootPath + "StatusEffect_DeepWounds.png";
        case StatusEffectType.FallenStar:
            return g_imageRootPath + "StatusEffect_FallenStar.png";
        case StatusEffectType.FollowUpAttackPlus:
            return g_imageRootPath + "StatusEffect_FollowUpAttackPlus.png";
        case StatusEffectType.FollowUpAttackMinus:
            return g_imageRootPath + "StatusEffect_FollowUpAttackMinus.png";
        case StatusEffectType.ShieldFlying:
            return g_imageRootPath + "StatusEffect_ShieldFlying.png";
        case StatusEffectType.Dodge:
            return g_imageRootPath + "StatusEffect_Dodge.png";
        case StatusEffectType.TriangleAttack:
            return g_imageRootPath + "StatusEffect_TriangleAttack.png";
        case StatusEffectType.NullPanic:
            return g_imageRootPath + "StatusEffect_NullPanic.png";
        case StatusEffectType.Stall:
            return g_imageRootPath + "StatusEffect_Stall.png";
        case StatusEffectType.TriangleAdept:
            return g_imageRootPath + "StatusEffect_TriangleAdept.png";
        case StatusEffectType.CancelAffinity:
            return g_imageRootPath + "StatusEffect_CancelAffinity.png";
        default: return "";
    }
}


function combatResultToString(result) {
    switch (result) {
        case CombatResult.Win: return "Win";
        case CombatResult.Draw: return "Draw";
        case CombatResult.Loss: return "Loss";
        default: return "Unknown";
    }
}

function groupIdToString(groupId) {
    switch (groupId) {
        case UnitGroupType.Ally: return "味方";
        case UnitGroupType.Enemy: return "敵";
        default: return "";
    }
}

/// 純粋成長率(%)から★5成長値を取得します。
function getGrowthAmountOfStar5FromPureGrowthRate(growthRateAsPercentage) {
    switch (growthRateAsPercentage) {
        case 20: return 8;
        case 25: return 10;
        case 30: return 13;
        case 35: return 15;
        case 40: return 17;
        case 45: return 19;
        case 50: return 22;
        case 55: return 24;
        case 60: return 26;
        case 65: return 28;
        case 70: return 30;
        case 75: return 33;
        case 80: return 35;
        case 85: return 37;
        case 90: return 39;
        default: return -1;
    }
}

/// ☆5の成長量から純粋成長率を計算します。
function getGrowthRateOfStar5Impl(growthAmount) {
    switch (growthAmount) {
        case 8: return 0.2;
        case 10: return 0.25;
        case 13: return 0.30;
        case 15: return 0.35;
        case 17: return 0.40;
        case 19: return 0.45;
        case 22: return 0.50;
        case 24: return 0.55;
        case 26: return 0.60;
        case 28: return 0.65;
        case 30: return 0.70;
        case 33: return 0.75;
        case 35: return 0.80;
        case 37: return 0.85;
        case 39: return 0.90;
        default:
            return -1;
    }
}
function getGrowthRateOfStar5(growthAmount) {
    let rate = getGrowthRateOfStar5Impl(growthAmount);
    if (rate < 0) {
        throw new Error("Invalid growth amount " + growthAmount);
    }
    return rate;
}

function calcAppliedGrowthRate(growthRate, rarity) {
    // let rate = growthRate * (0.79 + (0.07 * this.rarity));
    let rate = Math.floor(100 * growthRate * (0.79 + (0.07 * rarity))) * 0.01;
    return rate;
}

function calcGrowthValue(growthRate, rarity, level) {
    let rate = calcAppliedGrowthRate(growthRate, rarity);
    return Math.floor((level - 1) * rate);
}

// 成長値から苦手ステータスのLv40の変動値を取得します。
function getFlowStatus(growthValue) {
    switch (growthValue) {
        case 1:
        case 5:
        case 10:
            return -4;
        default:
            return -3;
    }
}

/// 成長値から得意ステータスのLv40の変動値を取得します。
function getAssetStatus(growthValue) {
    switch (growthValue) {
        case 2:
        case 6:
        case 11:
            return 4;
        default:
            return 3;
    }
}

/// 値が同じ場合の優先度を取得します。
function __getStatusRankValue(statusType) {
    switch (statusType) {
        case StatusType.Hp: return 4;
        case StatusType.Atk: return 3;
        case StatusType.Spd: return 2;
        case StatusType.Def: return 1;
        case StatusType.Res: return 0;
    }
}


/// 英雄情報です。ユニットの初期化に使用します。
class HeroInfo {
    constructor(name, icon, moveType, weaponType, attackRange,
        hp, atk, spd, def, res,
        hpLv1, atkLv1, spdLv1, defLv1, resLv1,
        hpVar, atkVar, spdVar, defVar, resVar,
        weapon, support, special, passiveA, passiveB, passiveC,
        seasonType,
        blessingType,
        epithet,
        pureNames,
        duelScore,
        weapons,
        supports,
        id,
        resplendent,
        origin,
        howToGet,
        releaseDate,
        specials,
        passiveAs,
        passiveBs,
        passiveCs
    ) {
        this.id = id;
        this.seasonType = seasonType;
        this.blessingType = blessingType;
        this.hp = hp;
        this.atk = atk;
        this.spd = spd;
        this.def = def;
        this.res = res;
        this._name = name;
        this._icon = icon;
        this._moveType = moveType;
        this._attackRange = attackRange;
        this.weapon = weapon;
        this.weaponTypeValue = stringToWeaponType(weaponType);
        this.weaponType = weaponType;
        this.support = support;
        this.special = special;
        this.passiveA = passiveA;
        this.passiveB = passiveB;
        this.passiveC = passiveC;
        this.hpLv1 = Number(hpLv1);
        this.atkLv1 = Number(atkLv1);
        this.spdLv1 = Number(spdLv1);
        this.defLv1 = Number(defLv1);
        this.resLv1 = Number(resLv1);
        this.hpLv1ForStar4 = 0;
        this.hpLv1ForStar3 = 0;
        this.hpLv1ForStar2 = 0;
        this.hpLv1ForStar1 = 0;
        this.atkLv1ForStar4 = 0;
        this.atkLv1ForStar3 = 0;
        this.atkLv1ForStar2 = 0;
        this.atkLv1ForStar1 = 0;
        this.spdLv1ForStar4 = 0;
        this.spdLv1ForStar3 = 0;
        this.spdLv1ForStar2 = 0;
        this.spdLv1ForStar1 = 0;
        this.defLv1ForStar4 = 0;
        this.defLv1ForStar3 = 0;
        this.defLv1ForStar2 = 0;
        this.defLv1ForStar1 = 0;
        this.resLv1ForStar4 = 0;
        this.resLv1ForStar3 = 0;
        this.resLv1ForStar2 = 0;
        this.resLv1ForStar1 = 0;

        this.hpIncrement = Number(hpVar.split('/')[1]);
        this.hpDecrement = Number(hpVar.split('/')[0]);
        this.atkIncrement = Number(atkVar.split('/')[1]);
        this.atkDecrement = Number(atkVar.split('/')[0]);
        this.spdIncrement = Number(spdVar.split('/')[1]);
        this.spdDecrement = Number(spdVar.split('/')[0]);
        this.defIncrement = Number(defVar.split('/')[1]);
        this.defDecrement = Number(defVar.split('/')[0]);
        this.resIncrement = Number(resVar.split('/')[1]);
        this.resDecrement = Number(resVar.split('/')[0]);

        this.epithet = epithet;
        this.pureNames = pureNames;
        this.duelScore = duelScore;

        this.weaponOptions = [];
        this.supportOptions = [];
        this.specialOptions = [];
        this.passiveAOptions = [];
        this.passiveBOptions = [];
        this.passiveCOptions = [];
        this.passiveSOptions = [];
        this.weapons = weapons;
        this.supports = supports;
        this.specials = specials;
        this.passiveAs = passiveAs;
        this.passiveBs = passiveBs;
        this.passiveCs = passiveCs;
        this.isResplendent = resplendent;
        this.origin = origin;
        this.howToGet = howToGet;
        this.releaseDate = releaseDate;
        this.releaseDateAsNumber = dateStrToNumber(releaseDate);

        // 偶像スキルシミュレーター用
        this.weaponOptionsForHallOfForms = [];
        this.supportOptionsForHallOfForms = [];
        this.specialOptionsForHallOfForms = [];
        this.passiveAOptionsForHallOfForms = [];
        this.passiveBOptionsForHallOfForms = [];
        this.passiveCOptionsForHallOfForms = [];
        this.passiveSOptionsForHallOfForms = [];

        this.__updateLv1Statuses();
    }

    get totalGrowthValue() {
        return this.hpGrowthValue + this.atkGrowthValue + this.spdGrowthValue + this.defGrowthValue +
            this.resGrowthValue;
    }

    getStatusTotalOfLv40() {
        return Number(this.hp) +
            Number(this.atk) +
            Number(this.spd) +
            Number(this.def) +
            Number(this.res);
    }
    getStatusTotalOfLv1() {
        return Number(this.hpLv1) +
            Number(this.atkLv1) +
            Number(this.spdLv1) +
            Number(this.defLv1) +
            Number(this.resLv1);
    }

    canEquipRefreshSkill() {
        for (let option of this.supportOptions) {
            if (isRefreshSupportSkill(option.id)) {
                return true;
            }
        }
        return false;
    }

    hasSkillInInitialSkill(skillId) {
        for (let id of this.weapons) {
            if (id == skillId) {
                return true;
            }
        }
        for (let id of this.supports) {
            if (id == skillId) {
                return true;
            }
        }
        return this.special == skillId
            || this.passiveA == skillId
            || this.passiveB == skillId
            || this.passiveC == skillId;
    }

    get detailPageUrl() {
        return "https://puarts.com/?fehhero=" + this.id;
    }

    get iconUrl() {
        return g_siteRootPath + "blog/images/FehHeroThumbs/" + this.icon;
    }

    getIconImgTag(size) {
        return `<img id='${this.id}' src='${this.iconUrl}' width='${size}px' />`;
    }
    getIconImgTagWithAnchor(size) {
        return `<a href='${this.detailPageUrl}' target='_blank'><img id='${this.id}' src='${this.iconUrl}' width='${size}px' /></a>`;
    }

    get name() {
        return this._name;
    }
    get icon() {
        return this._icon;
    }
    get attackRange() {
        return this._attackRange;
    }
    get moveType() {
        return this._moveType;
    }

    get hpGrowthValue() {
        return this.hp - this.hpLv1;
    }
    get atkGrowthValue() {
        return this.atk - this.atkLv1;
    }
    get spdGrowthValue() {
        return this.spd - this.spdLv1;
    }
    get defGrowthValue() {
        return this.def - this.defLv1;
    }
    get resGrowthValue() {
        return this.res - this.resLv1;
    }

    get maxDragonflower() {
        let releaseDate = this.releaseDateAsNumber;
        if (releaseDate > 20210816) {
            return 5;
        }

        if (releaseDate > 20200817) {
            return 10;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
                if (releaseDate < 20190101) {
                    // リリース日で二分探索したところ、獣登場の2019年が境界だった
                    return 20;
                }
                else {
                    return 15;
                }
            case MoveType.Flying:
            case MoveType.Armor:
            case MoveType.Cavalry:
            default:
                return 15;
        }
    }

    getHpGrowthRate() {
        return getGrowthRateOfStar5(this.hpGrowthValue);
    }

    calcHpOfSpecifiedLevel(level, rarity = 5, ivType = IvType.None) {
        let growthRate = this.getHpGrowthRate();
        switch (ivType) {
            case IvType.Asset:
                growthRate += 0.05;
                break;
            case IvType.Flow:
                growthRate -= 0.05;
                break;
            case IvType.None:
            default:
                break;
        }
        return this.getHpLv1(rarity) + calcGrowthValue(growthRate, rarity, level);
    }

    getHpLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.hpLv1ForStar1;
            case UnitRarity.Star2: return this.hpLv1ForStar2;
            case UnitRarity.Star3: return this.hpLv1ForStar3;
            case UnitRarity.Star4: return this.hpLv1ForStar4;
            case UnitRarity.Star5: return this.hpLv1;
        }
    }
    getAtkLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.atkLv1ForStar1;
            case UnitRarity.Star2: return this.atkLv1ForStar2;
            case UnitRarity.Star3: return this.atkLv1ForStar3;
            case UnitRarity.Star4: return this.atkLv1ForStar4;
            case UnitRarity.Star5: return this.atkLv1;
        }
    }
    getSpdLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.spdLv1ForStar1;
            case UnitRarity.Star2: return this.spdLv1ForStar2;
            case UnitRarity.Star3: return this.spdLv1ForStar3;
            case UnitRarity.Star4: return this.spdLv1ForStar4;
            case UnitRarity.Star5: return this.spdLv1;
        }
    }
    getDefLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.defLv1ForStar1;
            case UnitRarity.Star2: return this.defLv1ForStar2;
            case UnitRarity.Star3: return this.defLv1ForStar3;
            case UnitRarity.Star4: return this.defLv1ForStar4;
            case UnitRarity.Star5: return this.defLv1;
        }
    }
    getResLv1(rarity) {
        switch (rarity) {
            case UnitRarity.Star1: return this.resLv1ForStar1;
            case UnitRarity.Star2: return this.resLv1ForStar2;
            case UnitRarity.Star3: return this.resLv1ForStar3;
            case UnitRarity.Star4: return this.resLv1ForStar4;
            case UnitRarity.Star5: return this.resLv1;
        }
    }

    __updateLv1Statuses() {
        // ★5のLV1ステータスから他のレアリティのLV1ステータスを以下のロジックから逆算して推定
        // (正しく推定できない場合もあるかもしれない)
        // ☆2になると、HP以外の最も高い2つのステータスが1つずつ増加します
        // ☆3になると、HPと残りの2つのHP以外のステータスが1つずつ増加します
        // ☆4になると、HP以外の最も高い2つのステータスが1つずつ増加します
        // ☆5になると、HPと残りの2つのHP以外のステータスが1つずつ増加します

        this.hpLv1ForStar4 = this.hpLv1 - 1;
        this.hpLv1ForStar3 = this.hpLv1ForStar4;
        this.hpLv1ForStar2 = this.hpLv1ForStar3 - 1;
        this.hpLv1ForStar1 = this.hpLv1ForStar2;

        var statusList = [
            { type: StatusType.Atk, value: this.atkLv1 },
            { type: StatusType.Spd, value: this.spdLv1 },
            { type: StatusType.Def, value: this.defLv1 },
            { type: StatusType.Res, value: this.resLv1 },
        ];

        statusList.sort((a, b) => {
            let bPriority = b.value + __getStatusRankValue(b.type) * 0.1;
            let aPriority = a.value + __getStatusRankValue(a.type) * 0.1;
            return bPriority - aPriority;
        });

        let lowerStatuses = [statusList[2], statusList[3]];
        let heigherStatuses = [statusList[0], statusList[1]];

        for (let status of lowerStatuses) {
            switch (status.type) {
                case StatusType.Atk:
                    this.atkLv1ForStar4 = this.atkLv1 - 1;
                    this.atkLv1ForStar3 = this.atkLv1ForStar4;
                    this.atkLv1ForStar2 = this.atkLv1ForStar3 - 1;
                    this.atkLv1ForStar1 = this.atkLv1ForStar2;
                    break;
                case StatusType.Spd:
                    this.spdLv1ForStar4 = this.spdLv1 - 1;
                    this.spdLv1ForStar3 = this.spdLv1ForStar4;
                    this.spdLv1ForStar2 = this.spdLv1ForStar3 - 1;
                    this.spdLv1ForStar1 = this.spdLv1ForStar2;
                    break;
                case StatusType.Def:
                    this.defLv1ForStar4 = this.defLv1 - 1;
                    this.defLv1ForStar3 = this.defLv1ForStar4;
                    this.defLv1ForStar2 = this.defLv1ForStar3 - 1;
                    this.defLv1ForStar1 = this.defLv1ForStar2;
                    break;
                case StatusType.Res:
                    this.resLv1ForStar4 = this.resLv1 - 1;
                    this.resLv1ForStar3 = this.resLv1ForStar4;
                    this.resLv1ForStar2 = this.resLv1ForStar3 - 1;
                    this.resLv1ForStar1 = this.resLv1ForStar2;
                    break;
            }
        }
        for (let status of heigherStatuses) {
            switch (status.type) {
                case StatusType.Atk:
                    this.atkLv1ForStar4 = this.atkLv1;
                    this.atkLv1ForStar3 = this.atkLv1ForStar4 - 1;
                    this.atkLv1ForStar2 = this.atkLv1ForStar3;
                    this.atkLv1ForStar1 = this.atkLv1ForStar2 - 1;
                    break;
                case StatusType.Spd:
                    this.spdLv1ForStar4 = this.spdLv1;
                    this.spdLv1ForStar3 = this.spdLv1ForStar4 - 1;
                    this.spdLv1ForStar2 = this.spdLv1ForStar3;
                    this.spdLv1ForStar1 = this.spdLv1ForStar2 - 1;
                    break;
                case StatusType.Def:
                    this.defLv1ForStar4 = this.defLv1;
                    this.defLv1ForStar3 = this.defLv1ForStar4 - 1;
                    this.defLv1ForStar2 = this.defLv1ForStar3;
                    this.defLv1ForStar1 = this.defLv1ForStar2 - 1;
                    break;
                case StatusType.Res:
                    this.resLv1ForStar4 = this.resLv1;
                    this.resLv1ForStar3 = this.resLv1ForStar4 - 1;
                    this.resLv1ForStar2 = this.resLv1ForStar3;
                    this.resLv1ForStar1 = this.resLv1ForStar2 - 1;
                    break;
            }
        }
    }
}


/// ダメージ計算時のコンテキストです。 DamageCalculator でこのコンテキストに設定された値が使用されます。
class BattleContext {
    constructor() {
        this.hpBeforeCombat = 0;
        this.canFollowupAttack = false;
        this.canCounterattack = false;
        this.isVantabeActivatable = false; // 待ち伏せが発動可能か(敵の戦闘順入替スキル無関係の有効無効)
        this.isVantageActivated = false; // 待ち伏せが実際に発動するか(敵の戦闘順入替スキルを加味した有効無効)
        this.isDesperationActivatable = false; // 攻め立てが発動条件を満たすか
        this.isDesperationActivated = false; // 攻め立てが実際に発動するか
        this.isDefDesperationActivatable = false; // 受け攻め立ての発動条件を満たすか
        this.isDefDesperationActivated = false; // 最後の聖戦のように攻め立て受け側バージョン
        this.damageReductionRatioOfFirstAttack = 0;
        this.damageReductionRatioOfConsecutiveAttacks = 0;
        this.damageReductionRatioOfFollowupAttack = 0;
        this.reductionRatioOfDamageReductionRatioExceptSpecial = 0; // 奥義以外のダメージ軽減効果の軽減率(シャールヴィ)
        this.isEffectiveToOpponent = false;
        this.attackCount = 1;
        this.counterattackCount = 1;
        this.canCounterattackToAllDistance = false;
        // 奥義発動カウント変動量
        this.cooldownCountForAttack = 1;
        this.cooldownCountForDefense = 1;

        // 戦闘中に奥義が発動されたかどうか
        this.isSpecialActivated = false;

        // 自身の奥義発動カウント変動量を+1
        this.increaseCooldownCountForAttack = false;
        this.increaseCooldownCountForDefense = false;

        // 敵の奥義発動カウント変動量を-1
        this.reducesCooldownCount = false;

        // // 自身の発動カウント変動量-1を無効
        // this.invalidatesReduceCooldownCount = false;

        // // 敵の発動カウント変動量+1を無効
        // this.invalidatesIncreaseCooldownCount = false;

        // 守備魔防の低い方を参照を無効化
        this.invalidatesReferenceLowerMit = false;

        // 回復を無効化
        this.invalidatesHeal = false;

        // 強化無効
        this.invalidatesAtkBuff = false;
        this.invalidatesSpdBuff = false;
        this.invalidatesDefBuff = false;
        this.invalidatesResBuff = false;

        // 神罰の杖
        this.wrathfulStaff = false;

        // 戦闘中自身の弱化を無効化
        this.invalidatesOwnAtkDebuff = false;
        this.invalidatesOwnSpdDebuff = false;
        this.invalidatesOwnDefDebuff = false;
        this.invalidatesOwnResDebuff = false;

        // 守備魔防の低い方でダメージ計算
        this.refersMinOfDefOrRes = false;

        // 氷の聖鏡発動時などの軽減ダメージ保持用
        this.reducedDamageForNextAttack = 0;

        // 奥義発動後、自分の次の攻撃の効果(氷の聖鏡・承など)が発生するか
        this.nextAttackEffectAfterSpecialActivated = false;

        // 自分の次の攻撃のダメージに軽減をプラスする効果が発動するか
        this.nextAttackAddReducedDamageActivated = false;

        // 自分から攻撃したか
        this.initiatesCombat = false;

        // 2マス以内に味方がいるか
        this.isThereAnyUnitIn2Spaces = false;

        // 3マス以内に支援を組んでいる味方の組み合わせがいるか
        this.isThereAnyPartnerPairsIn3Spaces = false;

        // 追撃優先度
        this.followupAttackPriorityIncrement = 0;
        this.followupAttackPriorityDecrement = 0;

        // 戦闘前の範囲奥義で有効になるダメージ軽減率
        this.damageReductionRatioForPrecombat = 0;

        // 戦闘中常に有効になるダメージ軽減率
        // @NOTE: ダメージ軽減無効を考慮する必要があるので基本this.multDamageReductionRatioメソッドで値を設定する
        this.damageReductionRatio = 0;

        // 護り手が発動しているかどうか
        this.isSaviorActivated = false;

        // 攻撃時の追加ダメージ
        this.additionalDamage = 0;

        // 奥義発動時の追加ダメージ
        this.additionalDamageOfSpecial = 0;

        // 奥義以外のスキルによる「ダメージを〇〇%軽減」を無効
        this.invalidatesDamageReductionExceptSpecialOnSpecialActivation = false;

        // 敵は反撃不可
        this.invalidatesCounterattack = false;

        // 自分の攻撃でダメージを与えた時のHP回復量
        this.healedHpByAttack = 0;

        // 追撃不可を無効
        this.invalidatesInvalidationOfFollowupAttack = false;

        // 絶対追撃を無効
        this.invalidatesAbsoluteFollowupAttack = false;

        // 無属性に対して有利
        this.isAdvantageForColorless = false;

        // ダメージ加算する「攻撃-守備」の割合
        this.rateOfAtkMinusDefForAdditionalDamage = 0;

        // 奥義発動時の「敵の守備、魔防-〇%扱い」のパーセンテージ
        this.specialSufferPercentage = 0;

        // 奥義発動時の「与えるダメージ〇倍」の倍率
        this.specialMultDamage = 1;

        // 奥義発動時の「奥義ダメージに加算」の加算ダメージ
        this.specialAddDamage = 0;

        // 奥義発動時の「与えたダメージの〇%自分を回復」のパーセンテージ(1.0が100%)
        this.specialDamageRatioToHeal = 0;

        // 奥義発動時の「自分の最大HPの〇%回復」のパーセンテージ
        this.maxHpRatioToHealBySpecial = 0;

        // 与えたダメージの〇%自分を回復
        this.damageRatioToHeal = 0;

        // 範囲奥義のダメージ倍率
        this.precombatSpecialDamageMult = 0;
    }

    increaseCooldownCountForBoth() {
        this.increaseCooldownCountForAttack = true;
        this.increaseCooldownCountForDefense = true;
    }

    clearPrecombatState() {
        this.damageReductionRatio = 0;
        this.additionalDamage = 0;
        this.precombatSpecialDamageMult = 0;
        this.damageReductionRatioForPrecombat = 0;
    }

    clear() {
        this.clearPrecombatState();

        this.canFollowupAttack = false;
        this.canCounterattack = false;
        this.isVantabeActivatable = false;
        this.isVantageActivated = false; // 待ち伏せ
        this.isDesperationActivatable = false;
        this.isDesperationActivated = false; // 攻め立て
        this.isDefDesperationActivatable = false;
        this.isDefDesperationActivated = false;
        this.damageReductionRatioOfFirstAttack = 0;
        this.damageReductionRatioOfConsecutiveAttacks = 0;
        this.damageReductionRatioOfFollowupAttack = 0;
        this.isEffectiveToOpponent = false;
        this.attackCount = 1;
        this.counterattackCount = 1;
        this.canCounterattackToAllDistance = false;
        // 奥義発動カウント
        this.cooldownCountForAttack = 1;
        this.cooldownCountForDefense = 1;

        this.isSpecialActivated = false;

        this.increaseCooldownCountForAttack = false;
        this.increaseCooldownCountForDefense = false;
        this.reducesCooldownCount = false;

        // 守備魔防の低い方を参照を無効化
        this.invalidatesReferenceLowerMit = false;

        // 強化無効
        this.invalidatesAtkBuff = false;
        this.invalidatesSpdBuff = false;
        this.invalidatesDefBuff = false;
        this.invalidatesResBuff = false;

        // 神罰の杖
        this.wrathfulStaff = false;

        this.invalidatesOwnAtkDebuff = false;
        this.invalidatesOwnSpdDebuff = false;
        this.invalidatesOwnDefDebuff = false;
        this.invalidatesOwnResDebuff = false;

        this.refersMinOfDefOrRes = false;
        this.reducedDamageForNextAttack = 0;
        this.nextAttackEffectAfterSpecialActivated = false;

        // // 自身の発動カウント変動量-1を無効
        // this.invalidatesReduceCooldownCount = false;

        // // 敵の発動カウント変動量+1を無効
        // this.invalidatesIncreaseCooldownCount = false;

        this.initiatesCombat = false;
        this.isThereAnyUnitIn2Spaces = false;
        this.isThereAnyPartnerPairsIn3Spaces = false;
        this.followupAttackPriorityIncrement = 0;
        this.followupAttackPriorityDecrement = 0;

        this.isSaviorActivated = false;

        this.invalidatesCounterattack = false;
        this.healedHpByAttack = 0;
        this.invalidatesInvalidationOfFollowupAttack = false;
        this.invalidatesAbsoluteFollowupAttack = false;
        this.invalidatesHeal = false;
        this.isAdvantageForColorless = false;
        this.additionalDamageOfSpecial = 0;
        this.rateOfAtkMinusDefForAdditionalDamage = 0;
        this.specialSufferPercentage = 0;
        this.specialMultDamage = 1;
        this.specialAddDamage = 0;
        this.specialDamageRatioToHeal = 0;
        this.maxHpRatioToHealBySpecial = 0;
        this.damageRatioToHeal = 0;
    }

    invalidateAllBuffs() {
        this.invalidatesAtkBuff = true;
        this.invalidatesSpdBuff = true;
        this.invalidatesDefBuff = true;
        this.invalidatesResBuff = true;
    }

    invalidateAllOwnDebuffs() {
        this.invalidatesOwnAtkDebuff = true;
        this.invalidatesOwnSpdDebuff = true;
        this.invalidatesOwnDefDebuff = true;
        this.invalidatesOwnResDebuff = true;
    }

    // ダメージ軽減無効(シャールヴィなど)
    static calcDamageReductionRatio(damageReductionRatio, atkUnit) {
        let reducedRatio = Math.trunc(damageReductionRatio * 100 * atkUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial) * 0.01;
        return damageReductionRatio - reducedRatio;
    }

    // ダメージ軽減積
    static multDamageReductionRatio(sourceRatio, ratio, atkUnit) {
        let modifiedRatio = BattleContext.calcDamageReductionRatio(ratio, atkUnit);
        return 1 - (1 - sourceRatio) * (1 - modifiedRatio);
    }

    // 範囲奥義のダメージ軽減積
    static multDamageReductionRatioForSpecial(sourceRatio, ratio) {
        return 1 - (1 - sourceRatio) * (1 - ratio);
    }

    // ダメージ軽減積
    multDamageReductionRatio(ratio, atkUnit) {
        this.damageReductionRatio = BattleContext.multDamageReductionRatio(this.damageReductionRatio, ratio, atkUnit);
    }

    // 最初の攻撃のダメージ軽減積
    multDamageReductionRatioOfFirstAttack(ratio, atkUnit) {
        this.damageReductionRatioOfFirstAttack = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfFirstAttack, ratio, atkUnit);
    }

    // 連撃のダメージ軽減積
    multDamageReductionRatioOfConsecutiveAttacks(ratio, atkUnit) {
        this.damageReductionRatioOfConsecutiveAttacks = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfConsecutiveAttacks, ratio, atkUnit);
    }

    // 追撃のダメージ軽減積
    multDamageReductionRatioOfFollowupAttack(ratio, atkUnit) {
        this.damageReductionRatioOfFollowupAttack = BattleContext.multDamageReductionRatio(this.damageReductionRatioOfFollowupAttack, ratio, atkUnit);
    }

    // 範囲奥義のダメージ軽減積
    multDamageReductionRatioOfPrecombatSpecial(ratio) {
        this.damageReductionRatioForPrecombat = BattleContext.multDamageReductionRatioForSpecial(
            this.damageReductionRatioForPrecombat, ratio);
    }
}

/// 攻撃可能なユニット情報です。
class AttackableUnitInfo {
    constructor(targetUnit) {
        this.targetUnit = targetUnit;
        this.tiles = [];
        this.bestTileToAttack = null;
        this.damageRatios = [];
        this.combatResults = [];
        this.combatResultDetails = [];
    }

    toString() {
        let result = this.targetUnit.getNameWithGroup() + ": ";
        for (let tile of this.tiles) {
            result += "(" + tile.posX + "," + tile.posY + ")";
        }
        return result;
    }
}

/// 攻撃の優先度評価に使用するコンテキストです。
class AttackEvaluationContext {
    constructor() {
        this.damageRatio = 0;
        this.combatResult = CombatResult.Draw;
        this.isDebufferTier1 = false;
        this.isDebufferTier2 = false;
        this.isAfflictor = false;
        this.isSpecialChargeIncreased = false;
        this.movementRange = 0;

        this.attackPriority = 0;
        this.attackTargetPriorty = 0;
    }

    calcAttackTargetPriority(attackTarget) {
        let specialChargeIncreasedPriority = 0;
        if (this.isSpecialChargeIncreased) {
            specialChargeIncreasedPriority = 1;
        }

        let debufferTier1Priority = 0;
        if (this.isDebufferTier1) {
            debufferTier1Priority = 1;
        }
        let debufferTier2Priority = 0;
        if (this.isDebufferTier2) {
            debufferTier2Priority = 1;
        }

        this.attackTargetPriorty =
            this.combatResult * 1000000 +
            debufferTier1Priority * 500000 +
            debufferTier2Priority * 250000 +
            this.damageRatio * 100 +
            specialChargeIncreasedPriority * 10 +
            attackTarget.slotOrder;
    }

    calcAttackPriority(attacker) {
        let specialChargeIncreasedPriority = 0;
        if (this.isSpecialChargeIncreased) {
            specialChargeIncreasedPriority = 1;
        }
        let debuffPriority1 = 0;
        let debuffPriority2 = 0;
        if (this.isDebufferTier1) {
            debuffPriority1 = 1;
        } else if (this.isDebufferTier2) {
            debuffPriority2 = 1;
        }
        let afflictorPriority = 0;
        if (this.isAfflictor) {
            afflictorPriority = 1;
        }
        this.movementRange = attacker.moveCount;

        this.attackPriority =
            this.combatResult * 1000000 +
            debuffPriority1 * 500000 +
            debuffPriority2 * 250000 +
            afflictorPriority * 100000 +
            this.damageRatio * 100 +
            this.movementRange * 20 +
            specialChargeIncreasedPriority * 10 +
            attacker.slotOrder;
    }
}

/// 補助行動の優先度を計算するためのクラスです。
class AssistableUnitInfo {
    constructor(targetUnit) {
        this.targetUnit = targetUnit;
        this.assistableTiles = [];

        this.hasThreatenedByEnemyStatus = targetUnit.actionContext.hasThreatenedByEnemyStatus;
        this.hasThreatensEnemyStatus = targetUnit.actionContext.hasThreatensEnemyStatus;
        this.amountOfStatsActuallyBuffed = 0;
        this.amountHealed = 0;
        this.distanceFromClosestEnemy = targetUnit.distanceFromClosestEnemy;
        this.visibleStatTotal = targetUnit.getVisibleStatusTotal();
        this.slotOrder = targetUnit.slotOrder;
        this.isTeleportationRequired = false;
        this.requiredMovementCount = 0;
        this.numOfOtherEligibleTargetsBuffed = 0;
        this.isIntendedAndLowestSlot = false;

        this.assistTargetPriority = 0;
        this.rallyUpTargetPriority = 0;

        this.bestTileToAssist = null;
        this.hasStatAndNonstatDebuff = 0;
    }

    calcAssistTargetPriority(assistUnit, isPrecombat = true) {
        switch (assistUnit.supportInfo.assistType) {
            case AssistType.Refresh:
                this.assistTargetPriority = this.__calcRefreshTargetPriority();
                break;
            case AssistType.Heal:
                this.assistTargetPriority = this.__calcHealTargetPriority(assistUnit);
                break;
            case AssistType.Rally:
                this.assistTargetPriority = this.__calcRallyTargetPriority(assistUnit, isPrecombat);
                break;
            case AssistType.Move:
                this.assistTargetPriority = this.__calcMovementTargetPriority(assistUnit);
                break;
            case AssistType.Restore:
                this.assistTargetPriority = this.__calcRestoreTargetPriority(assistUnit);
                break;
        }
    }

    __calcRestoreTargetPriority(assistUnit) {
        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
        let nagativeEffectPriority = 0;
        let amountHealedPriority = 0;
        let visibleStatTotalPriority = 0;
        if (!this.targetUnit.hasNegativeStatusEffect()) {
            nagativeEffectPriority = 1;
            amountHealedPriority = this.amountHealed;
            visibleStatTotalPriority = this.visibleStatTotal;
        }

        return nagativeEffectPriority * 1000000
            + amountHealedPriority * 10000
            + visibleStatTotalPriority * 10
            + this.targetUnit.slotOrder;
    }

    __calcMovementTargetPriority(assistUnit) {
        this.requiredMovementCount = this.bestTileToAssist.calculateUnitMovementCountToThisTile(assistUnit);

        let assistedWithTeleportSkillPriority = 0;
        if (this.isTeleportationRequired) {
            assistedWithTeleportSkillPriority = 1;
        }

        return assistedWithTeleportSkillPriority * 1000000
            + this.visibleStatTotal * 500
            - this.requiredMovementCount * 10
            + this.slotOrder;
    }

    __calcHealTargetPriority(assistUnit) {
        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
        return this.amountHealed * 1000000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }

    __calcRefreshTargetPriority() {
        let hasThreatensEnemyStatusPriority = 0;
        if (this.hasThreatensEnemyStatus) {
            hasThreatensEnemyStatusPriority = 1;
        }
        return hasThreatensEnemyStatusPriority * 1000000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }
    __calcRallyTargetPriority(assistUnit, isPrecombat) {
        this.hasStatAndNonstatDebuff = 0;
        if (assistUnit.support == Support.HarshCommandPlus) {
            // 一喝+は弱化と状態異常の両方が付与されてるユニットが最優先
            if (this.targetUnit.hasStatDebuff() && this.targetUnit.hasNonstatDebuff()) {
                this.hasStatAndNonstatDebuff = 1;
            }
        }

        this.amountOfStatsActuallyBuffed = 0;
        if (isPrecombat) {
            if (!isRallyUp(assistUnit.support)) {
                this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
            }
        }
        else {
            this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
        }

        return this.hasStatAndNonstatDebuff * 1000000
            + this.amountOfStatsActuallyBuffed * 300000
            - this.distanceFromClosestEnemy * 3000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }
}

/// 敵の動き計算時のコンテキスト
class ActionContext {
    constructor() {
        // 補助のコンテキスト
        this.assistPriority = 0;
        this.assistableUnitInfos = [];
        this.hasThreatenedByEnemyStatus = false;
        this.hasThreatensEnemyStatus = false;
        this.bestTileToAssist = null;
        this.bestTargetToAssist = null;
        this.isBlocker = false;

        // 攻撃者選択のコンテキスト
        this.attackableUnitInfos = [];
        this.bestTargetToAttack = null;
        this.attackEvalContexts = {}; // key=target unit, value=AttackEvaluationContext
        this.bestAttacker = null;

        // その他(オリジナルAI用)
        this.attackableTiles = [];

        // 移動のコンテキスト
        this.movePriority = 0;
    }

    clear() {
        this.assistPriority = 0;
        this.assistableUnitInfos = [];
        this.hasThreatensEnemyStatus = false;
        this.hasThreatenedByEnemyStatus = false;
        this.hasThreatensEnemyStatus = false;
        this.bestTileToAssist = null;
        this.bestTargetToAssist = null;
        this.isBlocker = false;

        this.attackableUnitInfos = [];
        this.bestTargetToAttack = null;
        this.attackEvalContexts = {};
        this.bestAttacker = null;
        this.attackableTiles = [];

        this.movePriority = 0;
    }
    findAssistableUnitInfo(unit) {
        for (let info of this.assistableUnitInfos) {
            if (info.targetUnit == unit) {
                return info;
            }
        }
        return null;
    }
    findAttackableUnitInfo(unit) {
        for (let info of this.attackableUnitInfos) {
            if (info.targetUnit == unit) {
                return info;
            }
        }
        return null;
    }

    removeAttackableUnitInfosWhereBestTileIsEmpty() {
        var result = this.attackableUnitInfos.filter(function (item) {
            return item.bestTileToAttack != null;
        });
        this.attackableUnitInfos = result;
    }
}

const NotReserved = -2;

/// ユニットのインスタンス
class Unit {
    constructor(id = "", name = "", unitGroupType = UnitGroupType.Ally, moveType = MoveType.Infantry, icon = "", attackRange = 1) {
        this._id = id;
        this._name = name;
        this._groupId = unitGroupType;
        this._moveType = moveType;
        this._hp = 1;
        this._maxHp = 1;
        this._atk = 50;
        this._spd = 40;
        this._def = 30;
        this._res = 30;
        this._posX = 0;
        this._posY = 0;
        this._attackRange = attackRange;
        this._placedTile = null;
        this._moveCount = 1;
        this.moveCountAtBeginningOfTurn = 1;
        this.heroInfo = null;

        this.level = 40;
        this.rarity = UnitRarity.Star5;

        this.battleContext = new BattleContext();
        this.actionContext = new ActionContext();

        this.slotOrder = 0;

        this.weaponRefinement = WeaponRefinementType.None;
        this.summonerLevel = SummonerLevel.None; // 絆レベル
        this.merge = 0; // 限界突破数
        this.dragonflower = 0; // 神竜の花
        this.blessingEffects = [];
        this.blessing1 = BlessingType.None;
        this.blessing2 = BlessingType.None;
        this.blessing3 = BlessingType.None;
        this.blessing4 = BlessingType.None;
        this.blessing5 = BlessingType.None;
        this.blessing6 = BlessingType.None;
        this.grantedBlessing = SeasonType.None; // 付与された祝福
        this.providableBlessingSeason = SeasonType.None; // 付与できる祝福
        this.hpLv1 = 0;
        this.atkLv1 = 0;
        this.spdLv1 = 0;
        this.defLv1 = 0;
        this.resLv1 = 0;
        this.hpLvN = 0;
        this.atkLvN = 0;
        this.spdLvN = 0;
        this.defLvN = 0;
        this.resLvN = 0;
        this.hpIncrement = 0;
        this.hpDecrement = 0;
        this.atkIncrement = 0;
        this.atkDecrement = 0;
        this.spdIncrement = 0;
        this.spdDecrement = 0;
        this.defIncrement = 0;
        this.defDecrement = 0;
        this.resIncrement = 0;
        this.resDecrement = 0;

        this.ivHighStat = StatusType.None;
        this.ivLowStat = StatusType.None;

        this.restHp = 1; // ダメージ計算で使うHP
        this.reservedDamage = 0;
        this.reservedHeal = 0;
        this.reservedStatusEffects = [];
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;

        this.tmpSpecialCount = 0; // ダメージ計算で使う奥義カウント
        this.weaponType = '';
        this.specialCount = 0;
        this.maxSpecialCount = 0;

        this._maxHpWithSkills = 0;
        this.hpAdd = 0;
        this.hpMult = 1.0;
        this._atkBuff = 0; this._atkDebuff = 0; this.atkSpur = 0; this.atkAdd = 0; this.atkMult = 1.0; this.atkWithSkills = 0;
        this._spdBuff = 0; this._spdDebuff = 0; this.spdSpur = 0; this.spdAdd = 0; this.spdMult = 1.0; this.spdWithSkills = 0;
        this._defBuff = 0; this._defDebuff = 0; this.defSpur = 0; this.defAdd = 0; this.defMult = 1.0; this.defWithSkills = 0;
        this._resBuff = 0; this._resDebuff = 0; this.resSpur = 0; this.resAdd = 0; this.resMult = 1.0; this.resWithSkills = 0;
        this.weapon = -1;
        this.support = -1;
        this.special = -1;
        this.passiveA = -1;
        this.passiveB = -1;
        this.passiveC = -1;
        this.passiveS = -1;
        this.deffensiveTile = false; // 防御床
        this.setMoveCountFromMoveType();

        this.hpGrowthValue = 0;
        this.atkGrowthValue = 0;
        this.spdGrowthValue = 0;
        this.defGrowthValue = 0;
        this.resGrowthValue = 0;

        this.hpGrowthRate = 0.0;
        this.atkGrowthRate = 0.0;
        this.spdGrowthRate = 0.0;
        this.resGrowthRate = 0.0;
        this.defGrowthRate = 0.0;

        this.hpAppliedGrowthRate = 0.0;
        this.atkAppliedGrowthRate = 0.0;
        this.spdAppliedGrowthRate = 0.0;
        this.resAppliedGrowthRate = 0.0;
        this.defAppliedGrowthRate = 0.0;


        this.isActionDone = false;
        this.isBonusChar = false;

        this.statusEffects = [];
        this.bonuses = [];

        this.perTurnStatuses = [];
        this.distanceFromClosestEnemy = -1;

        this.weaponInfo = null;
        this.supportInfo = null;
        this.specialInfo = null;
        this.passiveAInfo = null;
        this.passiveBInfo = null;
        this.passiveCInfo = null;
        this.passiveSInfo = null;

        this.partnerHeroIndex = 0;
        this.partnerLevel = PartnerLevel.None; // 支援レベル

        this.isTransformed = false; // 化身
        this.isResplendent = false; // 神装化

        this.isEnemyActionTriggered = false; // 敵AIが行動開始したかどうか

        this.movementOrder = 0;

        // 双界で護衛が初期位置に戻るのに必要
        this.initPosX = 0;
        this.initPosY = 0;

        // 迅雷やノヴァの聖戦士が発動したかを記録しておく
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;
        this.isOneTimeActionActivatedForFallenStar = false;

        // 比翼スキルを使用したか
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;

        // Unitの情報を記録しておく用
        this.snapshot = null;

        this.isSelected = false;
        this.blessingCount = 2;

        // 査定計算用
        this.arenaScore = 0;
        this.totalSp = 0;
        this.rating = 0;
        this.rarityScore = 0;
        this.levelScore = 0;
        this.weaponSp = 0;
        this.specialSp = 0;
        this.supportSp = 0;
        this.passiveASp = 0;
        this.passiveBSp = 0;
        this.passiveCSp = 0;
        this.passiveSSp = 0;

        // 攻撃可能なタイル
        this.movableTiles = [];
        this.attackableTiles = [];
        this.assistableTiles = [];

        // シリアライズする時に一時的に使用
        this.ownerType = 0;
        this.heroIndex = 0;

        // select2でオプションが変わった時に値がリセットされるので一時保存しておく用
        this.reservedWeapon = NotReserved;
        this.reservedSupport = NotReserved;
        this.reservedSpecial = NotReserved;
        this.reservedPassiveA = NotReserved;
        this.reservedPassiveB = NotReserved;
        this.reservedPassiveC = NotReserved;
        this.reservedPassiveS = NotReserved;

        this.chaseTargetTile = null;

        this.moveCountForCanto = 0; // 再移動の移動マス数
        this.isCantoActivatedInCurrentTurn = false; // 現在ターンで再移動が1度でも発動したかどうか

        // ロキの盤上遊戯で一時的に限界突破を変える必要があるので、元の限界突破数を記録する用
        this.originalMerge = 0;
        this.originalDragonflower = 0;

        this.warFundsCost; // ロキの盤上遊戯で購入に必要な軍資金

        this.originalTile = null; // 護り手のように一時的に移動する際に元の位置を記録しておく用

        this.restMoveCount = 0; // 再移動(残り)で参照する残り移動量
    }

    saveCurrentHpAndSpecialCount() {
        this.restHp = this.hp;
        this.tmpSpecialCount = this.specialCount;
    }

    applyRestHpAndTemporarySpecialCount() {
        this.hp = this.restHp;
        this.specialCount = this.tmpSpecialCount;
    }

    saveOriginalTile() {
        this.originalTile = this.placedTile;
    }

    restoreOriginalTile() {
        this.originalTile.setUnit(this);
        this.originalTile = null;
    }

    canActivateCanto() {
        if (!this.isActionDone || this.isCantoActivatedInCurrentTurn) {
            return false;
        }

        return true;
    }

    /// 再移動が発動可能なら発動します。
    activateCantoIfPossible(moveCountForCanto) {
        if (!this.isActionDone || this.isCantoActivatedInCurrentTurn) {
            return;
        }

        this.moveCountForCanto = moveCountForCanto;

        if (this.moveCountForCanto > 0) {
            this.isActionDone = false;
            this.isCantoActivatedInCurrentTurn = true;
        }
    }

    __calcMoveCountForCanto() {
        let moveCountForCanto = 0;
        for (let skillId of this.enumerateSkills()) {
            // 同系統効果複数時、最大値適用
            switch (skillId) {
                case Weapon.Lyngheior:
                    moveCountForCanto = Math.max(moveCountForCanto, 3);
                    break;
                case Weapon.FlowerLance:
                    moveCountForCanto = Math.max(moveCountForCanto, 2);
                    break;
            }
        }
        return moveCountForCanto;
    }

    /// 再移動の発動を終了します。
    deactivateCanto() {
        this.moveCountForCanto = 0;
    }

    /// 再移動が発動しているとき、trueを返します。
    isCantoActivated() {
        return this.moveCountForCanto > 0;
    }

    chaseTargetTileToString() {
        if (this.chaseTargetTile == null) {
            return "null";
        }
        return this.chaseTargetTile.positionToString();
    }

    __calcAppliedGrowthRate(growthRate) {
        return calcAppliedGrowthRate(growthRate, this.rarity);
    }

    __calcGrowthValue(growthRate) {
        let rate = this.__calcAppliedGrowthRate(growthRate);
        return Math.floor((this.level - 1) * rate);
    }

    getGrowthRate(growthAmount, statusName) {
        try {
            return getGrowthRateOfStar5(growthAmount);
        }
        catch (e) {
            console.error(`${this.name} ${statusName}: ` + e.message, e.name);

            // ステータスが判明してないキャラの実装時にテストしやすいよう適当な値を返しておく
            return 0.8;
        }
    }

    clearReservedSkills() {
        this.reservedWeapon = NotReserved;
        this.reservedSupport = NotReserved;
        this.reservedSpecial = NotReserved;
        this.reservedPassiveA = NotReserved;
        this.reservedPassiveB = NotReserved;
        this.reservedPassiveC = NotReserved;
        this.reservedPassiveS = NotReserved;
    }

    reserveCurrentSkills() {
        this.reservedWeapon = this.weapon;
        this.reservedSupport = this.support;
        this.reservedSpecial = this.special;
        this.reservedPassiveA = this.passiveA;
        this.reservedPassiveB = this.passiveB;
        this.reservedPassiveC = this.passiveC;
        this.reservedPassiveS = this.passiveS;
    }

    restoreReservedSkills() {
        this.restoreReservedWeapon();
        this.restoreReservedSupport();
        this.restoreReservedSpecial();
        this.restoreReservedPassiveA();
        this.restoreReservedPassiveB();
        this.restoreReservedPassiveC();
        this.restoreReservedPassiveS();
    }

    hasReservedWeapon() {
        return this.reservedWeapon != NotReserved;
    }
    restoreReservedWeapon() {
        if (this.reservedWeapon != NotReserved) {
            this.weapon = this.reservedWeapon;
            this.reservedWeapon = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedSupport() {
        return this.reservedSupport != NotReserved;
    }
    restoreReservedSupport() {
        if (this.reservedSupport != NotReserved) {
            this.support = this.reservedSupport;
            this.reservedSupport = NotReserved;
            return true;
        }
    }
    hasReservedSpecial() {
        return this.reservedSpecial != NotReserved;
    }
    restoreReservedSpecial() {
        if (this.reservedSpecial != NotReserved) {
            this.special = this.reservedSpecial;
            this.reservedSpecial = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveA() {
        return this.reservedPassiveA != NotReserved;
    }
    restoreReservedPassiveA() {
        if (this.reservedPassiveA != NotReserved) {
            this.passiveA = this.reservedPassiveA;
            this.reservedPassiveA = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveB() {
        return this.reservedPassiveB != NotReserved;
    }
    restoreReservedPassiveB() {
        if (this.reservedPassiveB != NotReserved) {
            this.passiveB = this.reservedPassiveB;
            this.reservedPassiveB = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveC() {
        return this.reservedPassiveC != NotReserved;
    }
    restoreReservedPassiveC() {
        if (this.reservedPassiveC != NotReserved) {
            this.passiveC = this.reservedPassiveC;
            this.reservedPassiveC = NotReserved;
            return true;
        }
        return false;
    }
    hasReservedPassiveS() {
        return this.reservedPassiveS != NotReserved;
    }
    restoreReservedPassiveS() {
        if (this.reservedPassiveS != NotReserved) {
            this.passiveS = this.reservedPassiveS;
            this.reservedPassiveS = NotReserved;
            return true;
        }
        return false;
    }

    // 攻撃可能なユニット
    *enumerateAttackableUnits() {
        for (let tile of this.attackableTiles) {
            if (tile.placedUnit != null && tile.placedUnit.groupId != this.groupId) {
                yield tile.placedUnit;
            }
        }
    }

    get atkBuff() {
        return Number(this._atkBuff);
    }
    set atkBuff(value) {
        this._atkBuff = Number(value);
    }
    get spdBuff() {
        return Number(this._spdBuff);
    }
    set spdBuff(value) {
        this._spdBuff = Number(value);
    }
    get defBuff() {
        return Number(this._defBuff);
    }
    set defBuff(value) {
        this._defBuff = Number(value);
    }
    get resBuff() {
        return Number(this._resBuff);
    }
    set resBuff(value) {
        this._resBuff = Number(value);
    }


    get atkDebuff() {
        return Number(this._atkDebuff);
    }
    set atkDebuff(value) {
        this._atkDebuff = Number(value);
    }
    get spdDebuff() {
        return Number(this._spdDebuff);
    }
    set spdDebuff(value) {
        this._spdDebuff = Number(value);
    }
    get defDebuff() {
        return Number(this._defDebuff);
    }
    set defDebuff(value) {
        this._defDebuff = Number(value);
    }
    get resDebuff() {
        return Number(this._resDebuff);
    }
    set resDebuff(value) {
        this._resDebuff = Number(value);
    }

    clearSkills() {
        this.weapon = -1;
        this.weaponRefinement = WeaponRefinementType.None;
        this.support = -1;
        this.special = -1;
        this.passiveA = -1;
        this.passiveB = -1;
        this.passiveC = -1;
        this.passiveS = -1;
        this.weaponInfo = null;
        this.supportInfo = null;
        this.specialInfo = null;
        this.passiveAInfo = null;
        this.passiveBInfo = null;
        this.passiveCInfo = null;
        this.passiveSInfo = null;
    }

    resetStatusAdd() {
        this.hpAdd = 0;
        this.atkAdd = 0;
        this.spdAdd = 0;
        this.defAdd = 0;
        this.resAdd = 0;
    }

    resetStatusMult() {
        this.hpMult = 1.0;
        this.atkMult = 1.0;
        this.spdMult = 1.0;
        this.defMult = 1.0;
        this.resMult = 1.0;
    }

    resetStatusAdjustment() {
        this.resetStatusAdd();
        this.resetStatusMult();
    }

    get maxHpWithSkills() {
        let result = Math.floor(Number(this._maxHpWithSkills) * Number(this.hpMult) + Number(this.hpAdd));
        return Math.min(result, 99);
    }

    set maxHpWithSkillsWithoutAdd(value) {
        this._maxHpWithSkills = Math.min(value, 99);
    }

    get maxHpWithSkillsWithoutAdd() {
        return Number(this._maxHpWithSkills);
    }

    set maxHpWithSkills(value) {
        this._maxHpWithSkills = Math.min(value, 99);
        if (this.hp > this.maxHpWithSkills) {
            this.hp = this.maxHpWithSkills;
        }
    }

    clearBlessingEffects() {
        this.blessingEffects = [];
    }
    addBlessingEffect(blessingEffect) {
        this.blessingEffects.push(blessingEffect);
    }
    __syncBlessingEffects() {
        this.blessing1 = BlessingType.None;
        this.blessing2 = BlessingType.None;
        this.blessing3 = BlessingType.None;
        this.blessing4 = BlessingType.None;
        this.blessing5 = BlessingType.None;
        this.blessing6 = BlessingType.None;
        if (this.blessingEffects.length > 0) {
            this.blessing1 = this.blessingEffects[0];
        }
        if (this.blessingEffects.length > 1) {
            this.blessing2 = this.blessingEffects[1];
        }
        if (this.blessingEffects.length > 2) {
            this.blessing3 = this.blessingEffects[2];
        }
        if (this.blessingEffects.length > 3) {
            this.blessing4 = this.blessingEffects[3];
        }
        if (this.blessingEffects.length > 4) {
            this.blessing5 = this.blessingEffects[4];
        }
        if (this.blessingEffects.length > 5) {
            this.blessing6 = this.blessingEffects[5];
        }
    }

    turnWideStatusToString() {
        return this.heroIndex
            + ValueDelimiter + this.weapon
            + ValueDelimiter + this.support
            + ValueDelimiter + this.special
            + ValueDelimiter + this.passiveA
            + ValueDelimiter + this.passiveB
            + ValueDelimiter + this.passiveC
            + ValueDelimiter + this.passiveS
            + ValueDelimiter + this.blessing1
            + ValueDelimiter + this.blessing2
            + ValueDelimiter + this.blessing3
            + ValueDelimiter + this.merge
            + ValueDelimiter + this.dragonflower
            + ValueDelimiter + this.ivHighStat
            + ValueDelimiter + this.ivLowStat
            + ValueDelimiter + this.summonerLevel
            + ValueDelimiter + boolToInt(this.isBonusChar)
            + ValueDelimiter + this.weaponRefinement
            + ValueDelimiter + this.partnerHeroIndex
            + ValueDelimiter + this.partnerLevel
            + ValueDelimiter + this.slotOrder
            + ValueDelimiter + this.blessing4
            + ValueDelimiter + this.hpAdd
            + ValueDelimiter + this.atkAdd
            + ValueDelimiter + this.spdAdd
            + ValueDelimiter + this.defAdd
            + ValueDelimiter + this.resAdd
            + ValueDelimiter + this.blessing5
            + ValueDelimiter + this.grantedBlessing
            + ValueDelimiter + boolToInt(this.isResplendent)
            + ValueDelimiter + this.level
            + ValueDelimiter + this.rarity
            + ValueDelimiter + this.initPosX
            + ValueDelimiter + this.initPosY
            + ValueDelimiter + this.hpMult
            + ValueDelimiter + this.atkMult
            + ValueDelimiter + this.spdMult
            + ValueDelimiter + this.defMult
            + ValueDelimiter + this.resMult
            + ValueDelimiter + this.defGrowthRate
            + ValueDelimiter + this.resGrowthRate
            + ValueDelimiter + this.blessing6
            ;
    }

    perTurnStatusToString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + boolToInt(this.isActionDone)
            + ValueDelimiter + this.hp
            + ValueDelimiter + this.atkBuff
            + ValueDelimiter + this.spdBuff
            + ValueDelimiter + this.defBuff
            + ValueDelimiter + this.resBuff
            + ValueDelimiter + this.atkDebuff
            + ValueDelimiter + this.spdDebuff
            + ValueDelimiter + this.defDebuff
            + ValueDelimiter + this.resDebuff
            + ValueDelimiter + this.moveCount
            + ValueDelimiter + this.specialCount
            + ValueDelimiter + this.statusEffectsToString()
            + ValueDelimiter + boolToInt(this.isTransformed)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForSpecial)
            + ValueDelimiter + boolToInt(this.isDuoOrHarmonicSkillActivatedInThisTurn)
            + ValueDelimiter + this.duoOrHarmonizedSkillActivationCount
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForSupport)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForPassiveB)
            + ValueDelimiter + this.moveCountAtBeginningOfTurn
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForWeapon)
            + ValueDelimiter + boolToInt(this.isEnemyActionTriggered)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForShieldEffect)
            + ValueDelimiter + this.perTurnStatusesToString()
            + ValueDelimiter + this.distanceFromClosestEnemy
            + ValueDelimiter + this.movementOrder
            + ValueDelimiter + this.moveCountForCanto
            + ValueDelimiter + boolToInt(this.isCantoActivatedInCurrentTurn)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForFallenStar)
            + ValueDelimiter + this.restMoveCount
            ;
    }


    fromTurnWideStatusString(value) {
        let splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.heroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weapon = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.support = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.special = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveA = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveB = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveC = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveS = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing1 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing2 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing3 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.merge = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.dragonflower = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivHighStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivLowStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.summonerLevel = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isBonusChar = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weaponRefinement = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.partnerHeroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.partnerLevel = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.slotOrder = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing4 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.hpAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resAdd = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing5 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.grantedBlessing = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isResplendent = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.level = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.rarity = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosY = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.hpMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.atkMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.spdMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.defMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.resMult = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.defGrowthRate = Number(splited[i]); ++i; }
        if (Number.isFinite(Number(splited[i]))) { this.resGrowthRate = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing6 = Number(splited[i]); ++i; }
    }

    fromPerTurnStatusString(value) {
        let splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.ownerType = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posY = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isActionDone = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.hp = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this._moveCount = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.specialCount = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.setStatusEffectsFromString(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isTransformed = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForSpecial = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isDuoOrHarmonicSkillActivatedInThisTurn = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.duoOrHarmonizedSkillActivationCount = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForSupport = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForPassiveB = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.moveCountAtBeginningOfTurn = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForWeapon = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isEnemyActionTriggered = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForShieldEffect = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.setPerTurnStatusesFromString(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.distanceFromClosestEnemy = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.movementOrder = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.moveCountForCanto = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isCantoActivatedInCurrentTurn = intToBool(Number(splited[i])); ++i; }
        if (splited[i] != undefined) { this.isOneTimeActionActivatedForFallenStar = intToBool(Number(splited[i])); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.restMoveCount = Number(splited[i]); ++i; }
    }


    toString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + this.heroIndex
            + ValueDelimiter + this.weapon
            + ValueDelimiter + this.support
            + ValueDelimiter + this.special
            + ValueDelimiter + this.passiveA
            + ValueDelimiter + this.passiveB
            + ValueDelimiter + this.passiveC
            + ValueDelimiter + this.passiveS
            + ValueDelimiter + this.blessing1
            + ValueDelimiter + this.blessing2
            + ValueDelimiter + this.blessing3
            + ValueDelimiter + this.merge
            + ValueDelimiter + this.dragonflower
            + ValueDelimiter + this.ivHighStat
            + ValueDelimiter + this.ivLowStat
            + ValueDelimiter + this.summonerLevel
            + ValueDelimiter + boolToInt(this.isBonusChar)
            + ValueDelimiter + this.weaponRefinement
            + ValueDelimiter + boolToInt(this.isActionDone)
            + ValueDelimiter + this.hp
            + ValueDelimiter + this.atkBuff
            + ValueDelimiter + this.spdBuff
            + ValueDelimiter + this.defBuff
            + ValueDelimiter + this.resBuff
            + ValueDelimiter + this.atkDebuff
            + ValueDelimiter + this.spdDebuff
            + ValueDelimiter + this.defDebuff
            + ValueDelimiter + this.resDebuff
            + ValueDelimiter + this.moveCount
            + ValueDelimiter + this.specialCount
            + ValueDelimiter + this.statusEffectsToString()
            + ValueDelimiter + this.partnerHeroIndex
            + ValueDelimiter + this.partnerLevel
            + ValueDelimiter + boolToInt(this.isTransformed)
            + ValueDelimiter + this.slotOrder
            + ValueDelimiter + boolToInt(this.isResplendent)
            + ValueDelimiter + this.moveCountAtBeginningOfTurn
            + ValueDelimiter + this.level
            + ValueDelimiter + this.rarity
            + ValueDelimiter + this.initPosX
            + ValueDelimiter + this.initPosY
            ;
    }

    fromString(value) {
        let splited = value.split(ValueDelimiter);

        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.ownerType = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.posY = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.heroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weapon = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.support = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.special = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveA = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveB = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveC = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.passiveS = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing1 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing2 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.blessing3 = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.merge = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.dragonflower = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivHighStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.ivLowStat = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.summonerLevel = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isBonusChar = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.weaponRefinement = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isActionDone = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.hp = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resBuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.atkDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.spdDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.defDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.resDebuff = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this._moveCount = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.specialCount = Number(splited[i]); ++i; }
        this.setStatusEffectsFromString(splited[i]); ++i;
        if (Number.isInteger(Number(splited[i]))) { this.partnerHeroIndex = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.partnerLevel = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isTransformed = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.slotOrder = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.isResplendent = toBoolean(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.moveCountAtBeginningOfTurn = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.level = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.rarity = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosX = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) { this.initPosY = Number(splited[i]); ++i; }
    }

    // 応援を強制的に実行可能かどうか
    canRallyForcibly() {
        for (let skillId of this.enumerateSkills()) {
            if (canRallyForcibly(skillId)) {
                return true;
            }
        }
        return false;
    }

    get canGrantBlessing() {
        return !this.isLegendaryHero && !this.isMythicHero;
    }

    get isLegendaryHero() {
        return this.providableBlessingSeason != SeasonType.None
            && !isMythicSeasonType(this.providableBlessingSeason);
    }

    get isMythicHero() {
        return isMythicSeasonType(this.providableBlessingSeason);
    }

    /// 防衛神階かどうかを取得します。
    get isDefenseMythicHero() {
        return this.providableBlessingSeason == SeasonType.Anima
            || this.providableBlessingSeason == SeasonType.Dark;
    }

    get debuffTotal() {
        return this.atkDebuffTotal + this.spdDebuffTotal + this.defDebuffTotal + this.resDebuffTotal;
    }

    get atkDebuffTotal() {
        if (this.battleContext.invalidatesOwnAtkDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.atkDebuff - this.atkBuff;
        }
        return this.atkDebuff;
    }
    get spdDebuffTotal() {
        if (this.battleContext.invalidatesOwnSpdDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.spdDebuff - this.spdBuff;
        }
        return this.spdDebuff;
    }
    get defDebuffTotal() {
        if (this.battleContext.invalidatesOwnDefDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.defDebuff - this.defBuff;
        }
        return this.defDebuff;
    }
    get resDebuffTotal() {
        if (this.battleContext.invalidatesOwnResDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.resDebuff - this.resBuff;
        }
        return this.resDebuff;
    }

    isMeleeWeaponType() {
        return isMeleeWeaponType(this.weaponType);
    }

    isRangedWeaponType() {
        return isRangedWeaponType(this.weaponType);
    }

    addBlessing() {
        if (this.blessingCount == 5) {
            return;
        }
        ++this.blessingCount;
    }

    removeBlessing() {
        if (this.blessingCount == 1) {
            return;
        }
        --this.blessingCount;
    }

    createSnapshot() {
        this.snapshot = new Unit();
        this.snapshot._id = this._id;
        this.snapshot.maxSpecialCount = this.maxSpecialCount;
        this.snapshot._maxHp = this._maxHp;
        this.snapshot.hpAdd = this.hpAdd;
        this.snapshot.hpMult = this.hpMult;
        this.snapshot.restHp = this.restHp;
        this.snapshot.tmpSpecialCount = this.tmpSpecialCount;
        this.snapshot._atk = this._atk;
        this.snapshot._spd = this._spd;
        this.snapshot._def = this._def;
        this.snapshot._res = this._res;
        this.snapshot._maxHpWithSkills = this._maxHpWithSkills;
        this.snapshot.atkWithSkills = this.atkWithSkills;
        this.snapshot.spdWithSkills = this.spdWithSkills;
        this.snapshot.defWithSkills = this.defWithSkills;
        this.snapshot.resWithSkills = this.resWithSkills;
        this.snapshot.weaponRefinement = this.weaponRefinement;
        this.snapshot.warFundsCost = this.warFundsCost;
        this.snapshot.level = this.level;
        this.snapshot.heroInfo = this.heroInfo;
        this.snapshot.weaponInfo = this.weaponInfo;
        this.snapshot.supportInfo = this.supportInfo;
        this.snapshot.specialInfo = this.specialInfo;
        this.snapshot.passiveAInfo = this.passiveAInfo;
        this.snapshot.passiveBInfo = this.passiveBInfo;
        this.snapshot.passiveCInfo = this.passiveCInfo;
        this.snapshot.passiveSInfo = this.passiveSInfo;
        this.snapshot.fromString(this.toString());
        return this.snapshot;
    }
    deleteSnapshot() {
        this.snapshot = null;
    }

    perTurnStatusesToString() {
        if (this.perTurnStatuses.length == 0) {
            return String(PerTurnStatusType.None);
        }
        let result = "";
        for (let elem of this.perTurnStatuses) {
            result += elem + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }
    setPerTurnStatusesFromString(value) {
        this.perTurnStatuses = [];
        if (value == null || value == undefined) {
            return;
        }
        if (Number(value) == PerTurnStatusType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited == "") { continue; }
            let status = Number(splited);
            if (Number.isInteger(status)) {
                this.addPerTurnStatus(status);
            }
        }
    }

    statusEffectsToString() {
        if (this.statusEffects.length == 0) {
            return String(StatusEffectType.None);
        }
        let result = "";
        for (let statusEffect of this.statusEffects) {
            result += statusEffect + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }
    setStatusEffectsFromString(value) {
        this.statusEffects = [];
        if (value == null || value == undefined) {
            return;
        }
        if (Number(value) == StatusEffectType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited == "") { continue; }
            let statusEffect = Number(splited);
            if (Number.isInteger(statusEffect)) {
                this.addStatusEffect(statusEffect);
            }
        }
    }
    addAllSpur(amount) {
        let amountNum = Number(amount);
        this.atkSpur += amountNum;
        this.spdSpur += amountNum;
        this.defSpur += amountNum;
        this.resSpur += amountNum;
    }

    get isHarmonicHero() {
        return this.heroInfo != null
            && (
                this.heroIndex == Hero.SummerMia
                || this.heroIndex == Hero.PirateVeronica
                || this.heroIndex == Hero.HaloweenTiki
            );
    }

    get isDuoHero() {
        return this.heroInfo != null
            && (this.heroIndex == Hero.HaloweenHector
                || this.heroIndex == Hero.DuoEphraim
                || this.heroIndex == Hero.ChristmasMarth
                || this.heroIndex == Hero.NewYearAlfonse
                || this.heroIndex == Hero.ValentineAlm
                || this.heroIndex == Hero.SpringIdunn
                || this.heroIndex == Hero.YoungPalla
                || this.heroIndex == Hero.BridalMicaiah
                || this.heroIndex == Hero.SummerByleth
                || this.heroIndex == Hero.DuoSigurd
                || this.heroIndex == Hero.DuoLyn
                || this.heroIndex == Hero.DuoAltina
                || this.heroIndex == Hero.DuoPeony
                || this.heroIndex == Hero.PlegianDorothea
                || this.heroIndex == Hero.DuoLif
                || this.heroIndex == Hero.HarmonizedMyrrh
                || this.heroIndex == Hero.DuoEirika
                || this.heroIndex == Hero.HarmonizedCatria
                || this.heroIndex == Hero.DuoHilda
                || this.heroIndex == Hero.HarmonizedCaeda
                || this.heroIndex == Hero.DuoHinoka
            );
    }

    get hasWeapon() {
        return this.weapon != Weapon.None;
    }

    get hasSpecial() {
        return this.special != Special.None;
    }

    get isSpecialCharged() {
        return this.hasSpecial && this.specialCount == 0;
    }

    isAdvantageForColorless(enemyUnit) {
        if (this.weapon == Weapon.BloodTome) {
            return isRangedWeaponType(enemyUnit.weaponType) && enemyUnit.color == ColorType.Colorless;
        }
        return this.weapon == Weapon.EtherealBreath
            || this.weapon == Weapon.KinsekiNoSyo
            || this.weapon == Weapon.GunshiNoRaisyo
            || this.weapon == Weapon.KokukarasuNoSyo
            || this.weapon == Weapon.GunshiNoFusho
            || this.weapon == Weapon.Blarraven
            || this.weapon == Weapon.BlarravenPlus
            || this.weapon == Weapon.Gronnraven
            || this.weapon == Weapon.GronnravenPlus
            || this.weapon == Weapon.Rauarraven
            || this.weapon == Weapon.RauarravenPlus
            || this.weapon == Weapon.YukyuNoSyo
            || this.weapon == Weapon.Nagurufaru
            || this.weapon == Weapon.TomeOfOrder
            ;
    }

    getBuffTotalInCombat(enemyUnit) {
        return this.getAtkBuffInCombat(enemyUnit)
            + this.getSpdBuffInCombat(enemyUnit)
            + this.getDefBuffInCombat(enemyUnit)
            + this.getResBuffInCombat(enemyUnit);
    }

    getDebuffTotalInCombat() {
        return this.getAtkDebuffInCombat()
            + this.getSpdDebuffInCombat()
            + this.getDefDebuffInCombat()
            + this.getResDebuffInCombat();
    }

    get buffTotal() {
        if (this.isPanicEnabled) {
            return 0;
        }
        return this.atkBuff + this.spdBuff + this.defBuff + this.resBuff;
    }

    get debuffTotal() {
        return this.atkDebuffTotal + this.spdDebuffTotal + this.defDebuffTotal + this.resDebuffTotal;
    }

    isWeaponEffectiveAgainst(type) {
        if (this.weaponInfo != null) {
            for (let effective of this.weaponInfo.effectives) {
                if (effective == type) {
                    return true;
                }
            }
        }
        return false;
    }

    hasEffective(type) {
        if (this.isWeaponEffectiveAgainst(type)) {
            return true;
        }

        if (type == EffectiveType.Dragon) {
            if (this.hasStatusEffect(StatusEffectType.EffectiveAgainstDragons)) {
                return true;
            }
        }
        return false;
    }

    calculateDistanceToUnit(unit) {
        if (this.placedTile == null || unit.placedTile == null) {
            return CanNotReachTile;
        }
        return this.placedTile.calculateDistanceToUnit(unit);
    }

    reserveToAddStatusEffect(statusEffect) {
        if (this.reservedStatusEffects.some(x => x == statusEffect)) {
            return;
        }
        this.reservedStatusEffects.push(statusEffect);
    }

    reserveToClearNegativeStatusEffects() {
        this.reservedStatusEffects = this.__getPositiveStatusEffects(this.reservedStatusEffects);
    }

    clearNegativeStatusEffects() {
        this.statusEffects = this.getPositiveStatusEffects();
    }
    clearPositiveStatusEffects() {
        this.statusEffects = this.getNegativeStatusEffects();
    }

    // 弱化以外の状態異常が付与されているか
    hasNonstatDebuff() {
        for (let effect of this.statusEffects) {
            if (isNegativeStatusEffect(effect)) {
                return true;
            }
        }
        return false;
    }

    // 弱化が付与されているか
    hasStatDebuff() {
        if ((!this.battleContext.invalidatesOwnAtkDebuff && this.atkDebuff < 0)
            || (!this.battleContext.invalidatesOwnSpdDebuff && this.spdDebuff < 0)
            || (!this.battleContext.invalidatesOwnResDebuff && this.resDebuff < 0)
            || (!this.battleContext.invalidatesOwnDefDebuff && this.defDebuff < 0)
        ) {
            return true;
        }
    }

    // 状態異常が付与されているか
    hasNegativeStatusEffect() {
        return this.hasNonstatDebuff() || this.hasStatDebuff();
    }

    hasPositiveStatusEffect(enemyUnit = null) {
        for (let effect of this.statusEffects) {
            if (isPositiveStatusEffect(effect)) {
                return true;
            }
        }

        if (enemyUnit != null) {
            if ((!enemyUnit.battleContext.invalidatesAtkBuff && this.atkBuff > 0)
                || (!enemyUnit.battleContext.invalidatesSpdBuff && this.spdBuff > 0)
                || (!enemyUnit.battleContext.invalidatesResBuff && this.resBuff > 0)
                || (!enemyUnit.battleContext.invalidatesDefBuff && this.defBuff > 0)
            ) {
                return true;
            }
        }

        return false;
    }

    __getPositiveStatusEffects(statusEffects) {
        let result = [];
        for (let effect of statusEffects) {
            if (isPositiveStatusEffect(effect)) {
                result.push(effect);
            }
        }
        return result;
    }

    getPositiveStatusEffects() {
        return this.__getPositiveStatusEffects(this.statusEffects);
    }

    getNegativeStatusEffects() {
        let result = [];
        for (let effect of this.statusEffects) {
            if (isNegativeStatusEffect(effect)) {
                result.push(effect);
            }
        }
        return result;
    }

    addStatusEffect(statusEffectType) {
        if (this.hasStatusEffect(statusEffectType)) {
            return;
        }
        this.statusEffects.push(statusEffectType);
    }

    clearPerTurnStatuses() {
        this.perTurnStatuses = [];
    }

    hasPassStatus() {
        return this.hasPerTurnStatus(PerTurnStatusType.Pass);
    }

    addPerTurnStatus(value) {
        if (this.hasPerTurnStatus(value)) {
            return;
        }
        this.perTurnStatuses.push(value);
    }

    get hasAnyStatusEffect() {
        return this.statusEffects.length > 0;
    }

    hasPerTurnStatus(value) {
        for (let elem of this.perTurnStatuses) {
            if (elem == value) {
                return true;
            }
        }
        return false;
    }

    hasStatusEffect(statusEffectType) {
        for (let statusEffect of this.statusEffects) {
            if (statusEffect == statusEffectType) {
                return true;
            }
        }
        return false;
    }

    isNextTo(unit) {
        let dist = Math.abs(this.posX - unit.posX) + Math.abs(this.posY - unit.posY);
        return dist == 1;
    }

    getActualAttackRange(attackTargetUnit) {
        if (this.isCantoActivated()) {
            return 0;
        }

        let dist = calcDistance(this.posX, this.posY, attackTargetUnit.posX, attackTargetUnit.posY);
        return dist;
    }

    /// すり抜けを発動可能ならtrue、そうでなければfalseを返します。
    canActivatePass() {
        return (this.passiveB == PassiveB.Surinuke3 && this.hpPercentage >= 25)
            || (this.weapon == Weapon.FujinYumi && !this.isWeaponRefined && this.hpPercentage >= 50);
    }

    /// 2マス以内の敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
    canActivateObstractToTilesIn2Spaces(moveUnit) {
        return (this.passiveB == PassiveB.DetailedReport && moveUnit.attackRange == 2);
    }

    /// 隣接マスの敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
    canActivateObstractToAdjacentTiles(moveUnit) {
        return (this.passiveB == PassiveB.ShingunSoshi3 && this.hpPercentage >= 50)
            || (this.passiveB == PassiveB.DetailedReport)
            || (this.passiveS == PassiveS.GoeiNoGuzo && moveUnit.attackRange == 2);
    }

    get isOnMap() {
        return this.placedTile != null;
    }

    get isBuffed() {
        if (this.isPanicEnabled) {
            return false;
        }
        return this.atkBuff > 0 ||
            this.spdBuff > 0 ||
            this.defBuff > 0 ||
            this.resBuff > 0;
    }

    get isDebuffed() {
        return this.atkDebuff < 0 ||
            this.spdDebuff < 0 ||
            this.defDebuff < 0 ||
            this.resDebuff < 0;
    }

    get isSpecialCountMax() {
        return this.specialCount == this.maxSpecialCount;
    }

    setSpecialCountToMax() {
        this.specialCount = this.maxSpecialCount;
    }

    resetAllState() {
        this.hp = this.maxHpWithSkills;
        this.specialCount = this.maxSpecialCount;
        this.isActionDone = false;
        this.isTransformed = false;
        this.setMoveCountFromMoveType();
        this.resetBuffs();
        this.resetDebuffs();
        this.statusEffects = [];
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;
        this.initPosX = this.posX;
        this.initPosY = this.posY;
        if (this.groupId == UnitGroupType.Enemy) {
            this.isEnemyActionTriggered = false;
        }
        else {
            this.isEnemyActionTriggered = true;
        }
    }

    canDisableEnemySpursFromAlly() {
        return this.passiveC == PassiveC.ImpenetrableDark;
    }

    resetSpurs() {
        this.atkSpur = 0;
        this.spdSpur = 0;
        this.defSpur = 0;
        this.resSpur = 0;
    }

    resetBuffs() {
        this.atkBuff = 0;
        this.spdBuff = 0;
        this.defBuff = 0;
        this.resBuff = 0;
    }

    reserveToResetDebuffs() {
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    resetDebuffs() {
        this.atkDebuff = 0;
        this.spdDebuff = 0;
        this.defDebuff = 0;
        this.resDebuff = 0;
    }

    resetOneTimeActionActivationStates() {
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;
        this.isOneTimeActionActivatedForFallenStar = false;
        this.isCantoActivatedInCurrentTurn = false;
    }

    isOnInitPos() {
        return this.posX == this.initPosX && this.posY == this.initPosY;
    }

    beginAction() {
        if (!this.isActionDone) {
            return;
        }

        this.isActionDone = false;
        this.resetBuffs();
        this.setMoveCountFromMoveType();
        this.clearPositiveStatusEffects();
    }

    // 行動終了状態にする
    endAction() {
        if (this.isActionDone) {
            return;
        }

        this.isActionDone = true;
        if (this.isMovementRestricted) {
            this.setMoveCountFromMoveType();
        }
        this.resetDebuffs();
        this.clearNegativeStatusEffects();
    }

    applyAllBuff(amount) {
        this.applyAtkBuff(amount);
        this.applySpdBuff(amount);
        this.applyDefBuff(amount);
        this.applyResBuff(amount);
    }

    reserveToApplyAllDebuff(amount) {
        this.reserveToApplyAtkDebuff(amount);
        this.reserveToApplySpdDebuff(amount);
        this.reserveToApplyDefDebuff(amount);
        this.reserveToApplyResDebuff(amount);
    }

    applyAllDebuff(amount) {
        this.applyAtkDebuff(amount);
        this.applySpdDebuff(amount);
        this.applyDefDebuff(amount);
        this.applyResDebuff(amount);
    }

    getHighestStatuses() {
        let maxStatuses = [StatusType.Atk];
        let unit = this;
        let maxValue = unit.getAtkInPrecombat() - 15; // 攻撃は-15して比較
        {
            let value = unit.getSpdInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Spd];
                maxValue = value;
            }
            else if (value == maxValue) {
                maxStatuses.push(StatusType.Spd);
            }
        }
        {
            let value = unit.getDefInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Def];
                maxValue = value;
            }
            else if (value == maxValue) {
                maxStatuses.push(StatusType.Def);
            }
        }
        {
            let value = unit.getResInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Res];
                maxValue = value;
            }
            else if (value == maxValue) {
                maxStatuses.push(StatusType.Res);
            }
        }
        return maxStatuses;
    }

    applyAtkBuff(buffAmount) {
        if (this.atkBuff < buffAmount) {
            this.atkBuff = buffAmount;
            return true;
        }
        return false;
    }

    applySpdBuff(buffAmount) {
        if (this.spdBuff < buffAmount) {
            this.spdBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyDefBuff(buffAmount) {
        if (this.defBuff < buffAmount) {
            this.defBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyResBuff(buffAmount) {
        if (this.resBuff < buffAmount) {
            this.resBuff = buffAmount;
            return true;
        }
        return false;
    }

    reserveToApplyAtkDebuff(amount) {
        if (this.reservedAtkDebuff > amount) {
            this.reservedAtkDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToApplySpdDebuff(amount) {
        if (this.reservedSpdDebuff > amount) {
            this.reservedSpdDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToApplyDefDebuff(amount) {
        if (this.reservedDefDebuff > amount) {
            this.reservedDefDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToApplyResDebuff(amount) {
        if (this.reservedResDebuff > amount) {
            this.reservedResDebuff = amount;
            return true;
        }
        return false;
    }

    applyAtkDebuff(amount) {
        if (this.atkDebuff > amount) {
            this.atkDebuff = amount;
            return true;
        }
        return false;
    }

    applySpdDebuff(amount) {
        if (this.spdDebuff > amount) {
            this.spdDebuff = amount;
            return true;
        }
        return false;
    }

    applyDefDebuff(amount) {
        if (this.defDebuff > amount) {
            this.defDebuff = amount;
            return true;
        }
        return false;
    }

    applyResDebuff(amount) {
        if (this.resDebuff > amount) {
            this.resDebuff = amount;
            return true;
        }
        return false;
    }

    modifySpecialCount() {
        if (this.specialCount > Number(this.maxSpecialCount)) {
            this.specialCount = Number(this.maxSpecialCount);
        }
        else if (Number(this.specialCount) < 0) {
            this.specialCount = 0;
        }
    }

    increaseSpecialCount(amount) {
        this.specialCount = Number(this.specialCount) + amount;
        if (this.specialCount > Number(this.maxSpecialCount)) {
            this.specialCount = Number(this.maxSpecialCount);
        }
    }
    reduceSpecialCount(amount) {
        this.specialCount = Number(this.specialCount) - amount;
        if (Number(this.specialCount) < 0) {
            this.specialCount = 0;
        }
    }
    reduceSpecialCountToZero() {
        this.specialCount = 0;
    }

    get currentDamage() {
        return this.maxHpWithSkills - this.hp;
    }

    initReservedHp() {
        this.reservedDamage = 0;
        this.reservedHeal = 0;
    }

    initReservedStatusEffects() {
        this.reservedStatusEffects = Array.from(this.statusEffects);
    }

    initReservedDebuffs() {
        this.reservedAtkDebuff = this.atkDebuff;
        this.reservedSpdDebuff = this.spdDebuff;
        this.reservedDefDebuff = this.defDebuff;
        this.reservedResDebuff = this.resDebuff;
    }

    applyReservedDebuffs() {
        this.atkDebuff = this.reservedAtkDebuff;
        this.spdDebuff = this.reservedSpdDebuff;
        this.defDebuff = this.reservedDefDebuff;
        this.resDebuff = this.reservedResDebuff;
    }

    applyReservedStatusEffects() {
        this.statusEffects = this.reservedStatusEffects;
    }

    applyReservedHp(leavesOneHp) {
        let healHp = this.reservedHeal;
        if (this.hasStatusEffect(StatusEffectType.DeepWounds)) {
            healHp = 0;
        }
        this.hp = Number(this.hp) - this.reservedDamage + healHp;
        this.modifyHp(leavesOneHp);
    }

    reserveTakeDamage(damageAmount) {
        this.reservedDamage += damageAmount;
    }

    reserveHeal(healAmount) {
        this.reservedHeal += healAmount;
    }

    modifyHp(leavesOneHp = false) {
        if (this.hp > this.maxHpWithSkills) {
            this.hp = this.maxHpWithSkills;
        }
        else if (this.hp <= 0) {
            if (leavesOneHp) {
                this.hp = 1;
            }
            else {
                this.hp = 0;
            }
        }
    }

    takeDamage(damageAmount, leavesOneHp = false) {
        if (this.isDead) {
            return;
        }
        let hp = this.hp - damageAmount;
        if (hp < 1) {
            if (leavesOneHp) {
                hp = 1;
            } else {
                hp = 0;
            }
        }
        this.hp = hp;
    }

    heal(healAmount) {
        if (this.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return 0;
        }

        let damage = this.maxHpWithSkills - this.hp;
        let hp = this.hp + healAmount;
        if (hp > this.maxHpWithSkills) {
            hp = this.maxHpWithSkills;
        }
        this.hp = hp;
        return Math.min(damage, healAmount);
    }

    get isAlive() {
        return this.hp > 0;
    }

    get isDead() {
        return this.hp == 0;
    }

    get serialId() {
        return UnitCookiePrefix + this.id;
    }

    get hasRefreshAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Refresh;
    }
    get hasHealAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Heal;
    }
    get hasDonorHealAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.DonorHeal;
    }
    get hasRestoreAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Restore;
    }
    get hasRallyAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Rally;
    }
    get hasMoveAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType == AssistType.Move;
    }

    get isWeaponEquipped() {
        return this.weapon != Weapon.None;
    }

    get isWeaponSpecialRefined() {
        return this.weaponRefinement == WeaponRefinementType.Special
            || this.weaponRefinement == WeaponRefinementType.Special_Hp3;
    }
    get isWeaponRefined() {
        return this.weaponRefinement != WeaponRefinementType.None;
    }

    get maxDragonflower() {
        if (this.heroInfo == null) {
            return 0;
        }

        return this.heroInfo.maxDragonflower;
    }

    get hpPercentage() {
        if (this.hp >= this.maxHpWithSkills) {
            return 100;
        }
        return Math.round((100 * this.hp / this.maxHpWithSkills) * 100) / 100;
    }

    /// 戦闘のダメージ計算時の残りHPです。戦闘のダメージ計算のみで使用できます。
    get restHpPercentage() {
        if (this.restHp >= this.maxHpWithSkills) {
            return 100;
        }
        return Math.round((100 * this.restHp / this.maxHpWithSkills) * 100) / 100;
    }
    get isRestHpFull() {
        return this.restHp >= this.maxHpWithSkills;
    }
    get hasPanic() {
        return this.hasStatusEffect(StatusEffectType.Panic);
    }

    get isPanicEnabled() {
        return !this.canNullPanic() && this.hasPanic;
    }

    getNormalMoveCount() {
        switch (this.passiveS) {
            case PassiveS.GoeiNoGuzo:
            case PassiveS.TozokuNoGuzoRakurai:
            case PassiveS.TozokuNoGuzoKobu:
            case PassiveS.TozokuNoGuzoKogun:
            case PassiveS.TozokuNoGuzoKusuri:
            case PassiveS.TozokuNoGuzoOugi:
            case PassiveS.TozokuNoGuzoOdori:
                return 1;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
            case MoveType.Flying:
                return 2;
            case MoveType.Armor:
                return 1;
            case MoveType.Cavalry:
                return 3;
            default:
                return 1;
        }
    }

    setMoveCountFromMoveType() {
        this._moveCount = this.getNormalMoveCount();
    }

    get isMovementRestricted() {
        return this.moveCount < this.getNormalMoveCount();
    }

    get isMobilityIncreased() {
        return this.moveCount > this.getNormalMoveCount();
    }

    getNameWithGroup() {
        return this.name + "(" + groupIdToString(this.groupId) + ")";
    }

    get color() {
        switch (this.weaponType) {
            case WeaponType.Sword:
            case WeaponType.RedTome:
            case WeaponType.RedBreath:
            case WeaponType.RedBeast:
            case WeaponType.RedBow:
            case WeaponType.RedDagger:
                return ColorType.Red;
            case WeaponType.Lance:
            case WeaponType.BlueTome:
            case WeaponType.BlueBreath:
            case WeaponType.BlueBeast:
            case WeaponType.BlueBow:
            case WeaponType.BlueDagger:
                return ColorType.Blue;
            case WeaponType.Axe:
            case WeaponType.GreenTome:
            case WeaponType.GreenBreath:
            case WeaponType.GreenBeast:
            case WeaponType.GreenBow:
            case WeaponType.GreenDagger:
                return ColorType.Green;
            case WeaponType.Staff:
            case WeaponType.ColorlessTome:
            case WeaponType.ColorlessBreath:
            case WeaponType.ColorlessBeast:
            case WeaponType.ColorlessBow:
            case WeaponType.ColorlessDagger:
                return ColorType.Colorless;
            default:
                return ColorType.Unknown;
        }
    }

    get moveCount() {
        if (this.isCantoActivated()) {
            return this.moveCountForCanto;
        }
        if (this.hasStatusEffect(StatusEffectType.Gravity)) {
            return 1;
        }
        if (this.hasStatusEffect(StatusEffectType.MobilityIncreased)) {
            if (this.hasStatusEffect(StatusEffectType.Stall)) {
                return 1;
            }
            return this.getNormalMoveCount() + 1;
        }
        return this._moveCount;
    }

    set moveCount(value) {
        this._moveCount = value;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get hp() {
        return this._hp;
    }

    setHpInValidRange(value, leavesOneHp = true) {
        this._hp = value;
        if (this._hp > this.maxHpWithSkills) {
            this._hp = this.maxHpWithSkills;
        }
        if (value <= 0) {
            if (leavesOneHp) {
                this._hp = 1;
            } else {
                this._hp = 0;
            }
        }
    }

    set hp(value) {
        this._hp = value;
    }

    get maxHp() {
        return this._maxHp;
    }

    get isFullHp() {
        return this.hp == this.maxHpWithSkills;
    }

    set maxHp(value) {
        this._maxHp = value;
    }

    get atk() {
        return this._atk;
    }

    set atk(value) {
        this._atk = value;
    }

    get spd() {
        return this._spd;
    }

    set spd(value) {
        this._spd = value;
    }

    get def() {
        return this._def;
    }

    set def(value) {
        this._def = value;
    }

    get res() {
        return this._res;
    }

    set res(value) {
        this._res = value;
    }

    get icon() {
        if (this.heroInfo == null) {
            return g_siteRootPath + "images/dummy.png";
        }
        return this.heroInfo.iconUrl;
    }

    get attackRange() {
        if (this.isCantoActivated()) {
            return 0;
        }

        if (this.weapon == Weapon.None) {
            return 0;
        }
        return this._attackRange;
    }
    set attackRange(value) {
        this._attackRange = value;
    }

    get enemyGroupId() {
        if (this.groupId == UnitGroupType.Ally) {
            return UnitGroupType.Enemy;
        }
        return UnitGroupType.Ally;
    }

    get groupId() {
        return this._groupId;
    }
    get moveType() {
        return this._moveType;
    }
    set moveType(value) {
        this._moveType = value;
    }

    get posX() {
        return this._posX;
    }
    set posX(value) {
        this._posX = value;
    }

    get posY() {
        return this._posY;
    }
    set posY(value) {
        this._posY = value;
    }

    get placedTile() {
        return this._placedTile;
    }
    set placedTile(value) {
        this._placedTile = value;
    }

    applyAtkUnity() {
        let targetUnit = this;
        targetUnit.atkSpur += 5;
        let debuff = targetUnit.getAtkDebuffInCombat();
        if (debuff < 0) {
            targetUnit.atkSpur += -debuff * 2;
        }
    }
    applySpdUnity() {
        let targetUnit = this;
        targetUnit.spdSpur += 5;
        let debuff = targetUnit.getSpdDebuffInCombat();
        if (debuff < 0) {
            targetUnit.spdSpur += -debuff * 2;
        }
    }
    applyDefUnity() {
        let targetUnit = this;
        targetUnit.defSpur += 5;
        let debuff = targetUnit.getDefDebuffInCombat();
        if (debuff < 0) {
            targetUnit.defSpur += -debuff * 2;
        }
    }
    applyResUnity() {
        let targetUnit = this;
        targetUnit.resSpur += 5;
        let debuff = targetUnit.getResDebuffInCombat();
        if (debuff < 0) {
            targetUnit.resSpur += -debuff * 2;
        }
    }

    /// 装備中の武器名を取得します。
    getWeaponName() {
        if (this.weaponInfo == null) {
            return "‐";
        }
        return this.weaponInfo.name;
    }
    /// 装備中のAスキル名を取得します。
    getPassiveAName() {
        if (this.passiveAInfo == null) {
            return "‐";
        }
        return this.passiveAInfo.name;
    }
    /// 装備中の聖印名を取得します。
    getPassiveSName() {
        if (this.passiveSInfo == null) {
            return "‐";
        }
        return this.passiveSInfo.name;
    }

    getVisibleStatusTotal() {
        return this.getAtkInPrecombat()
            + this.getSpdInPrecombat()
            + this.getDefInPrecombat()
            + this.getResInPrecombat();
    }

    setPos(x, y) {
        this.posX = x;
        this.posY = y;
    }

    getTriangleAdeptAdditionalRatio() {
        if (this.passiveA == PassiveA.AishoGekika3
            || this.weapon == Weapon.AsahiNoKen
            || this.weapon == Weapon.AsahiNoKenPlus
            || this.weapon == Weapon.SoukaiNoYari
            || this.weapon == Weapon.SoukaiNoYariPlus
            || this.weapon == Weapon.ShinryokuNoOno
            || this.weapon == Weapon.ShinryokuNoOnoPlus
            || this.weapon == Weapon.WakakiMogyuNoYari
            || this.weapon == Weapon.WakakiKurohyoNoKen
            || this.weapon == Weapon.ShinginNoSeiken
            || this.weapon == Weapon.YoheidanNoSenfu
            || (this.weapon == Weapon.Forukuvangu && this.isWeaponSpecialRefined)
            || (this.weapon == Weapon.TomeOfOrder && this.isWeaponSpecialRefined)
            || this.hasStatusEffect(StatusEffectType.TriangleAdept)
        ) {
            return 0.2;
        } else if (this.passiveA == PassiveA.AishoGekika2) {
            return 0.15;
        } else if (this.passiveA == PassiveA.AishoGekika1) {
            return 0.1;
        }
        return 0;
    }

    // @TODO: 相性相殺の修正で呼び出さなくなったので動作確認後に削除
    hasTriangleAdeptSkill() {
        return this.passiveA == PassiveA.AishoGekika3
            || this.passiveA == PassiveA.AishoGekika2
            || this.passiveA == PassiveA.AishoGekika1
            || this.weapon == Weapon.AsahiNoKen
            || this.weapon == Weapon.AsahiNoKenPlus
            || this.weapon == Weapon.SoukaiNoYari
            || this.weapon == Weapon.SoukaiNoYariPlus
            || this.weapon == Weapon.ShinryokuNoOno
            || this.weapon == Weapon.ShinryokuNoOnoPlus
            || this.weapon == Weapon.WakakiMogyuNoYari
            || this.weapon == Weapon.WakakiKurohyoNoKen
            || this.weapon == Weapon.ShinginNoSeiken
            || this.weapon == Weapon.YoheidanNoSenfu
            || (this.weapon == Weapon.Forukuvangu && this.isWeaponSpecialRefined)
            || (this.weapon == Weapon.TomeOfOrder && this.isWeaponSpecialRefined)
            ;
    }

    // 「自分のスキルによる3すくみ激化を無効化」
    neutralizesSelfTriangleAdvantage() {
        // @TODO: 相性相殺1,2も同様
        return this.hasPassiveSkill(PassiveB.AisyoSosatsu3) || this.hasStatusEffect(StatusEffectType.CancelAffinity);
    }

    // 「相性不利の時、敵スキルによる3すくみ激化を反転」
    reversesTriangleAdvantage() {
        // @TODO: 相性相殺1,2は反転しない
        return this.hasPassiveSkill(PassiveB.AisyoSosatsu3) || this.hasStatusEffect(StatusEffectType.CancelAffinity);
    }

    __getBuffMultiply() {
        if (!this.canNullPanic() && this.hasPanic) {
            return -1;
        }
        return 1;
    }

    canNullPanic() {
        return this.hasStatusEffect(StatusEffectType.NullPanic);
    }

    getSpdInPrecombatWithoutDebuff() {
        return Number(this.spdWithSkills) + Number(this.spdBuff) * this.__getBuffMultiply();
    }
    getSpdInPrecombat() {
        return Math.min(99, this.getSpdInPrecombatWithoutDebuff() + Number(this.spdDebuff));
    }
    getEvalAtkInCombat(enemyUnit = null) {
        let val = this.getAtkInCombat(enemyUnit) + this.__getEvalAtkAdd();
        return val;
    }
    getEvalSpdInCombat(enemyUnit = null) {
        let val = this.getSpdInCombat(enemyUnit) + this.__getEvalSpdAdd();
        return val;
    }
    getEvalSpdInPrecombat() {
        let val = this.getSpdInPrecombat() + this.__getEvalSpdAdd();
        return val;
    }
    __getEvalAtkAdd() {
        return 0;
    }
    __getEvalSpdAdd() {
        switch (this.passiveS) {
            case PassiveS.HayasaNoKyosei1:
                return 5;
            case PassiveS.HayasaNoKyosei2:
                return 8;
            case PassiveS.HayasaNoKyosei3:
                return 10;
            default:
                return 0;
        }
    }

    getAtkInPrecombatWithoutDebuff() {
        return Number(this.atkWithSkills) + Number(this.atkBuff) * this.__getBuffMultiply();
    }
    getAtkInPrecombat() {
        return Math.min(99, this.getAtkInPrecombatWithoutDebuff() + Number(this.atkDebuff));
    }

    __getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
        let buffMult = this.__getBuffMultiply();
        let buff = 0;
        if (getInvalidatesFunc()) {
            if (buffMult < 0) {
                buff = getBuffFunc() * buffMult;
            }
        }
        else {
            buff = getBuffFunc() * buffMult;
        }

        if (buff < 0 && getInvalidateOwnDebuffFunc()) {
            return 0;
        }

        return buff;
    }

    getAtkBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesAtkBuff,
            () => Number(this.atkBuff),
            () => this.battleContext.invalidatesOwnAtkDebuff
        );
    }
    getSpdBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesSpdBuff,
            () => Number(this.spdBuff),
            () => this.battleContext.invalidatesOwnSpdDebuff
        );
    }
    getResBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesResBuff,
            () => Number(this.resBuff),
            () => this.battleContext.invalidatesOwnResDebuff
        );
    }
    getDefBuffInCombat(enemyUnit) {
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesDefBuff,
            () => Number(this.defBuff),
            () => this.battleContext.invalidatesOwnDefDebuff
        );
    }

    __getStatusInCombat(getInvalidatesFunc, getStatusWithoutBuffFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
        let statusWithoutBuff = getStatusWithoutBuffFunc();
        let buff = this.__getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc);
        let total = statusWithoutBuff + buff;
        return total;
    }

    getAtkInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesAtkBuff,
            () => this.__getAtkInCombatWithoutBuff(),
            () => Number(this.atkBuff),
            () => this.battleContext.invalidatesOwnAtkDebuff
        );
    }
    getSpdInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesSpdBuff,
            () => this.__getSpdInCombatWithoutBuff(),
            () => Number(this.spdBuff),
            () => this.battleContext.invalidatesOwnSpdDebuff
        );
    }
    getDefInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesDefBuff,
            () => this.__getDefInCombatWithoutBuff(),
            () => Number(this.defBuff),
            () => this.battleContext.invalidatesOwnDefDebuff
        );
    }

    getResInCombat(enemyUnit = null) {
        return this.__getStatusInCombat(
            () => enemyUnit == null ? false : enemyUnit.battleContext.invalidatesResBuff,
            () => this.__getResInCombatWithoutBuff(),
            () => Number(this.resBuff),
            () => this.battleContext.invalidatesOwnResDebuff
        );
    }
    getAtkDebuffInCombat() {
        return this.battleContext.invalidatesOwnAtkDebuff ? 0 : Number(this.atkDebuff);
    }
    getSpdDebuffInCombat() {
        return this.battleContext.invalidatesOwnSpdDebuff ? 0 : Number(this.spdDebuff);
    }
    getDefDebuffInCombat() {
        return this.battleContext.invalidatesOwnDefDebuff ? 0 : Number(this.defDebuff);
    }
    getResDebuffInCombat() {
        return this.battleContext.invalidatesOwnResDebuff ? 0 : Number(this.resDebuff);
    }

    __getAtkInCombatWithoutBuff() {
        return (Number(this.atkWithSkills) + this.getAtkDebuffInCombat() + Number(this.atkSpur));
    }
    __getSpdInCombatWithoutBuff() {
        return (Number(this.spdWithSkills) + this.getSpdDebuffInCombat() + Number(this.spdSpur));
    }
    __getDefInCombatWithoutBuff() {
        return (Number(this.defWithSkills) + this.getDefDebuffInCombat() + Number(this.defSpur));
    }
    __getResInCombatWithoutBuff() {
        return (Number(this.resWithSkills) + this.getResDebuffInCombat() + Number(this.resSpur));
    }

    getEvalDefInPrecombat() {
        return this.getDefInPrecombat() + this.__getEvalDefAdd();
    }
    getEvalDefInCombat(enemyUnit = null) {
        let val = this.getDefInCombat(enemyUnit) + this.__getEvalDefAdd();
        return val;
    }

    getDefInPrecombatWithoutDebuff() {
        var mit = Number(this.defWithSkills);
        var mitBuff = Number(this.defBuff) * this.__getBuffMultiply();
        return mit + mitBuff;
    }
    getDefInPrecombat() {
        return Math.min(99, this.getDefInPrecombatWithoutDebuff() + Number(this.defDebuff));
    }
    getResInPrecombatWithoutDebuff() {
        var mit = Number(this.resWithSkills);
        var mitBuff = Number(this.resBuff) * this.__getBuffMultiply();
        return mit + mitBuff;
    }
    getResInPrecombat() {
        return Math.min(99, this.getResInPrecombatWithoutDebuff() + Number(this.resDebuff));
    }
    getEvalResInCombat(enemyUnit = null) {
        let val = this.getResInCombat(enemyUnit) + this.__getEvalResAdd();
        return val;
    }
    getEvalResInPrecombat() {
        let val = this.getResInPrecombat() + this.__getEvalResAdd();
        return val;
    }
    __getEvalDefAdd() {
        switch (this.passiveS) {
            default:
                return 0;
        }
    }
    __getEvalResAdd() {
        switch (this.passiveS) {
            case PassiveS.MaboNoKyosei1:
                return 5;
            case PassiveS.MaboNoKyosei2:
                return 8;
            case PassiveS.MaboNoKyosei3:
                return 10;
            default:
                return 0;
        }
    }

    hasSkill(skillId) {
        for (let id of this.enumerateSkills()) {
            if (id == skillId) {
                return true;
            }
        }
        return false;
    }

    hasPassiveSkill(skillId) {
        for (let id of this.enumeratePassiveSkills()) {
            if (id == skillId) {
                return true;
            }
        }
        return false;
    }

    isPhysicalAttacker() {
        switch (this.weaponType) {
            case WeaponType.Sword:
            case WeaponType.RedBeast:
            case WeaponType.RedBow:
            case WeaponType.RedDagger:
            case WeaponType.Lance:
            case WeaponType.BlueBeast:
            case WeaponType.BlueBow:
            case WeaponType.BlueDagger:
            case WeaponType.Axe:
            case WeaponType.GreenBeast:
            case WeaponType.GreenBow:
            case WeaponType.GreenDagger:
            case WeaponType.ColorlessBeast:
            case WeaponType.ColorlessBow:
            case WeaponType.ColorlessDagger:
                return true;
            default:
                return false;
        }
    }

    updateStatusByWeaponRefinement() {
        switch (this.weaponRefinement) {
            case WeaponRefinementType.Special_Hp3: this._maxHpWithSkills += 3; break;
            case WeaponRefinementType.Hp5_Atk2: this._maxHpWithSkills += 5; this.atkWithSkills += 2; break;
            case WeaponRefinementType.Hp5_Spd3: this._maxHpWithSkills += 5; this.spdWithSkills += 3; break;
            case WeaponRefinementType.Hp5_Def4: this._maxHpWithSkills += 5; this.defWithSkills += 4; break;
            case WeaponRefinementType.Hp5_Res4: this._maxHpWithSkills += 5; this.resWithSkills += 4; break;
            case WeaponRefinementType.Hp2_Atk1: this._maxHpWithSkills += 2; this.atkWithSkills += 1; break;
            case WeaponRefinementType.Hp2_Spd2: this._maxHpWithSkills += 2; this.spdWithSkills += 2; break;
            case WeaponRefinementType.Hp2_Def3: this._maxHpWithSkills += 2; this.defWithSkills += 3; break;
            case WeaponRefinementType.Hp2_Res3: this._maxHpWithSkills += 2; this.resWithSkills += 3; break;
            default: break;
        }
    }

    updateStatusBySummonerLevel() {
        switch (this.summonerLevel) {
            case SummonerLevel.C:
                this._maxHpWithSkills += 3;
                this.resWithSkills += 2;
                break;
            case SummonerLevel.B:
                this._maxHpWithSkills += 4;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                break;
            case SummonerLevel.A:
                this._maxHpWithSkills += 4;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                this.spdWithSkills += 2;
                break;
            case SummonerLevel.S:
                this._maxHpWithSkills += 5;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                this.spdWithSkills += 2;
                this.atkWithSkills += 2;
                break;
            default:
                break;
        }
    }

    updateStatusByBlessing() {
        this.__syncBlessingEffects();
        this.__updateStatusByBlessing(this.blessing1);
        this.__updateStatusByBlessing(this.blessing2);
        this.__updateStatusByBlessing(this.blessing3);
        this.__updateStatusByBlessing(this.blessing4);
        this.__updateStatusByBlessing(this.blessing5);
        this.__updateStatusByBlessing(this.blessing6);
    }

    __updateStatusByBlessing(blessing) {
        switch (blessing) {
            case BlessingType.Hp5_Atk3: this._maxHpWithSkills += 5; this.atkWithSkills += 3; break;
            case BlessingType.Hp5_Spd4: this._maxHpWithSkills += 5; this.spdWithSkills += 4; break;
            case BlessingType.Hp5_Def5: this._maxHpWithSkills += 5; this.defWithSkills += 5; break;
            case BlessingType.Hp5_Res5: this._maxHpWithSkills += 5; this.resWithSkills += 5; break;
            case BlessingType.Hp3_Atk2: this._maxHpWithSkills += 3; this.atkWithSkills += 2; break;
            case BlessingType.Hp3_Spd3: this._maxHpWithSkills += 3; this.spdWithSkills += 3; break;
            case BlessingType.Hp3_Def4: this._maxHpWithSkills += 3; this.defWithSkills += 4; break;
            case BlessingType.Hp3_Res4: this._maxHpWithSkills += 3; this.resWithSkills += 4; break;
            case BlessingType.Hp3: this._maxHpWithSkills += 3; break;
            default: break;
        }
    }

    setIvHighStat(value, updatesPureGrowthRate = true) {
        if (this.ivHighStat == value) {
            return;
        }
        this.ivHighStat = value;
        this.updateBaseStatus(updatesPureGrowthRate);
    }
    setIvLowStat(value, updatesPureGrowthRate = true) {
        if (this.ivLowStat == value) {
            return;
        }
        this.ivLowStat = value;
        this.updateBaseStatus(updatesPureGrowthRate);
    }

    updateBaseStatus(updatesPureGrowthRate = true) {
        if (this.heroInfo == null) {
            throw new Error("heroInfo must not be null.");
        }

        var hpLv1IvChange = 0;
        var atkLv1IvChange = 0;
        var spdLv1IvChange = 0;
        var defLv1IvChange = 0;
        var resLv1IvChange = 0;
        switch (this.ivHighStat) {
            case StatusType.None: break;
            case StatusType.Hp: hpLv1IvChange = 1; break;
            case StatusType.Atk: atkLv1IvChange = 1; break;
            case StatusType.Spd: spdLv1IvChange = 1; break;
            case StatusType.Def: defLv1IvChange = 1; break;
            case StatusType.Res: resLv1IvChange = 1; break;
        }

        if (this.merge == 0) {
            switch (this.ivLowStat) {
                case StatusType.None: break;
                case StatusType.Hp: hpLv1IvChange = -1; break;
                case StatusType.Atk: atkLv1IvChange = -1; break;
                case StatusType.Spd: spdLv1IvChange = -1; break;
                case StatusType.Def: defLv1IvChange = -1; break;
                case StatusType.Res: resLv1IvChange = -1; break;
            }
        }

        this.hpLv1 = this.heroInfo.getHpLv1(this.rarity) + hpLv1IvChange;
        this.atkLv1 = this.heroInfo.getAtkLv1(this.rarity) + atkLv1IvChange;
        this.spdLv1 = this.heroInfo.getSpdLv1(this.rarity) + spdLv1IvChange;
        this.defLv1 = this.heroInfo.getDefLv1(this.rarity) + defLv1IvChange;
        this.resLv1 = this.heroInfo.getResLv1(this.rarity) + resLv1IvChange;

        this.__updateGrowth(updatesPureGrowthRate);
    }

    updatePureGrowthRate() {
        this.hpGrowthValue = this.heroInfo.hp - this.heroInfo.hpLv1;
        this.atkGrowthValue = this.heroInfo.atk - this.heroInfo.atkLv1;
        this.spdGrowthValue = this.heroInfo.spd - this.heroInfo.spdLv1;
        this.defGrowthValue = this.heroInfo.def - this.heroInfo.defLv1;
        this.resGrowthValue = this.heroInfo.res - this.heroInfo.resLv1;

        if (this.atkGrowthValue == 0) {
            // ステータス未入力
            this.hpGrowthValue = 35;
            this.atkGrowthValue = 35;
            this.spdGrowthValue = 35;
            this.defGrowthValue = 35;
            this.resGrowthValue = 35;
        }

        this.hpGrowthRate = this.getGrowthRate(this.hpGrowthValue, "hp");
        this.atkGrowthRate = this.getGrowthRate(this.atkGrowthValue, "atk");
        this.spdGrowthRate = this.getGrowthRate(this.spdGrowthValue, "spd");
        this.defGrowthRate = this.getGrowthRate(this.defGrowthValue, "def");
        this.resGrowthRate = this.getGrowthRate(this.resGrowthValue, "res");

        switch (this.ivHighStat) {
            case StatusType.None: break;
            case StatusType.Hp: this.hpGrowthRate += 0.05; break;
            case StatusType.Atk: this.atkGrowthRate += 0.05; break;
            case StatusType.Spd: this.spdGrowthRate += 0.05; break;
            case StatusType.Def: this.defGrowthRate += 0.05; break;
            case StatusType.Res: this.resGrowthRate += 0.05; break;
        }

        if (this.merge == 0) {
            switch (this.ivLowStat) {
                case StatusType.None: break;
                case StatusType.Hp: this.hpGrowthRate -= 0.05; break;
                case StatusType.Atk: this.atkGrowthRate -= 0.05; break;
                case StatusType.Spd: this.spdGrowthRate -= 0.05; break;
                case StatusType.Def: this.defGrowthRate -= 0.05; break;
                case StatusType.Res: this.resGrowthRate -= 0.05; break;
            }
        }
    }

    __updateGrowth(updatesPureGrowthRate = true) {
        if (updatesPureGrowthRate) {
            this.updatePureGrowthRate();
        }

        this.hpAppliedGrowthRate = this.__calcAppliedGrowthRate(this.hpGrowthRate);
        this.atkAppliedGrowthRate = this.__calcAppliedGrowthRate(this.atkGrowthRate);
        this.spdAppliedGrowthRate = this.__calcAppliedGrowthRate(this.spdGrowthRate);
        this.defAppliedGrowthRate = this.__calcAppliedGrowthRate(this.defGrowthRate);
        this.resAppliedGrowthRate = this.__calcAppliedGrowthRate(this.resGrowthRate);

        this.hpLvN = this.hpLv1 + this.__calcGrowthValue(this.hpGrowthRate);
        this.atkLvN = this.atkLv1 + this.__calcGrowthValue(this.atkGrowthRate);
        this.spdLvN = this.spdLv1 + this.__calcGrowthValue(this.spdGrowthRate);
        this.defLvN = this.defLv1 + this.__calcGrowthValue(this.defGrowthRate);
        this.resLvN = this.resLv1 + this.__calcGrowthValue(this.resGrowthRate);
    }

    /// 入力した成長率に対して、得意ステータスの上昇値を取得します。
    calcAssetStatusIncrement(growthRate) {
        return this.__calcGrowthValue(growthRate + 0.05) - this.__calcGrowthValue(growthRate) + 1;
    }

    /// 入力した成長率に対して、不得意ステータスの減少値を取得します。
    calcFlowStatusDecrement(growthRate) {
        return this.__calcGrowthValue(growthRate - 0.05) - this.__calcGrowthValue(growthRate) - 1;
    }

    updateStatusByMergeAndDragonFlower() {
        // todo: 本来はキャラ毎の個体値上昇値を参照
        var hpLv1IvChange = 0;
        var atkLv1IvChange = 0;
        var spdLv1IvChange = 0;
        var defLv1IvChange = 0;
        var resLv1IvChange = 0;
        switch (this.ivHighStat) {
            case StatusType.None: break;
            case StatusType.Hp: hpLv1IvChange = 1; break;
            case StatusType.Atk: atkLv1IvChange = 1; break;
            case StatusType.Spd: spdLv1IvChange = 1; break;
            case StatusType.Def: defLv1IvChange = 1; break;
            case StatusType.Res: resLv1IvChange = 1; break;
        }

        switch (this.ivLowStat) {
            case StatusType.None: break;
            case StatusType.Hp: hpLv1IvChange = -1; break;
            case StatusType.Atk: atkLv1IvChange = -1; break;
            case StatusType.Spd: spdLv1IvChange = -1; break;
            case StatusType.Def: defLv1IvChange = -1; break;
            case StatusType.Res: resLv1IvChange = -1; break;
        }

        // 限界突破によるステータス上昇
        if (this.merge > 0 || this.dragonflower > 0) {
            var statusList = [
                { type: StatusType.Hp, value: this.heroInfo.hpLv1 + hpLv1IvChange },
                { type: StatusType.Atk, value: this.heroInfo.atkLv1 + atkLv1IvChange },
                { type: StatusType.Spd, value: this.heroInfo.spdLv1 + spdLv1IvChange },
                { type: StatusType.Def, value: this.heroInfo.defLv1 + defLv1IvChange },
                { type: StatusType.Res, value: this.heroInfo.resLv1 + resLv1IvChange },
            ];
            statusList.sort((a, b) => {
                return b.value - a.value;
            });
            var updateStatus = (statItr) => {
                var statIndex = statItr % 5;
                switch (statusList[statIndex].type) {
                    case StatusType.Hp: this._maxHpWithSkills += 1; break;
                    case StatusType.Atk: this.atkWithSkills += 1; break;
                    case StatusType.Spd: this.spdWithSkills += 1; break;
                    case StatusType.Def: this.defWithSkills += 1; break;
                    case StatusType.Res: this.resWithSkills += 1; break;
                }
            };

            if (this.merge > 0 && this.ivHighStat == StatusType.None) {
                // 基準値で限界突破済み
                updateStatus(0);
                updateStatus(1);
                updateStatus(2);
            }

            // 限界突破
            for (let mergeItr = 0, statItr = 0; mergeItr < this.merge; ++mergeItr) {
                updateStatus(statItr);
                statItr += 1;
                updateStatus(statItr);
                statItr += 1;
            }

            // 神竜の花
            for (let i = 0; i < this.dragonflower; ++i) {
                updateStatus(i);
            }
        }
    }

    canHeal(requiredHealAmount = 1) {
        if (this.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return false;
        }

        return this.currentDamage >= requiredHealAmount;
    }

    *enumerateSkills() {
        if (this.weapon != null) { yield this.weapon; }
        if (this.support != null) { yield this.support; }
        if (this.special != null) { yield this.special; }
        if (this.passiveA != null) { yield this.passiveA; }
        if (this.passiveB != null) { yield this.passiveB; }
        if (this.passiveC != null) { yield this.passiveC; }
        if (this.passiveS != null) { yield this.passiveS; }
    }

    *enumeratePassiveSkills() {
        if (this.passiveA != null) { yield this.passiveA; }
        if (this.passiveB != null) { yield this.passiveB; }
        if (this.passiveC != null) { yield this.passiveC; }
        if (this.passiveS != null) { yield this.passiveS; }
    }

    hasDagger7Effect() {
        switch (this.weapon) {
            case Weapon.Pesyukado:
            case Weapon.SaizoNoBakuenshin:
                return false;
            default:
                return !this.hasDagger6Effect()
                    && !this.hasDagger5Effect()
                    && !this.hasDagger4Effect()
                    && !this.hasDagger3Effect()
                    && this.weapon != Weapon.PoisonDaggerPlus
                    && this.weapon != Weapon.PoisonDagger
                    && this.weapon != Weapon.DeathlyDagger
                    && isWeaponTypeDagger(this.weaponType);
        }
    }
    hasDagger6Effect() {
        switch (this.weapon) {
            case Weapon.ShienNoAnkiPlus:
            case Weapon.MitteiNoAnki:
                return true;
            default: return false;
        }
    }
    hasDagger5Effect() {
        switch (this.weapon) {
            case Weapon.GinNoAnki:
            case Weapon.RogueDaggerPlus:
            case Weapon.SyukuseiNoAnki:
            case Weapon.YoiyamiNoDanougi:
            case Weapon.RyokuunNoMaiougi:
            case Weapon.SeitenNoMaiougi:
            case Weapon.AnsatsuSyuriken:
            case Weapon.Kagamimochi:
            case Weapon.ButosaiNoSensu:
                return true;
            default: return false;
        }
    }
    hasDagger4Effect() {
        switch (this.weapon) {
            case Weapon.ShienNoAnki:
                return true;
            default: return false;
        }
    }
    hasDagger3Effect() {
        switch (this.weapon) {
            case Weapon.TetsuNoAnki:
            case Weapon.DouNoAnki:
            case Weapon.RogueDagger:
                return true;
            default: return false;
        }
    }

    __hasDuel3Skill() {
        if (this.passiveAInfo == null) {
            return false;
        }

        return this.passiveAInfo.isDuel3();
    }

    __hasDuel4Skill() {
        if (this.passiveAInfo == null) {
            return false;
        }

        return this.passiveAInfo.isDuel4();
    }


    get totalPureGrowthRate() {
        return Number(this.hpGrowthRate)
            + Number(this.atkGrowthRate)
            + Number(this.spdGrowthRate)
            + Number(this.defGrowthRate)
            + Number(this.resGrowthRate);
    }

    updateArenaScore(majorSeason = SeasonType.None, minorSeason = SeasonType.None) {
        if (this.heroIndex < 0) {
            this.weaponSp = 0;
            this.supportSp = 0;
            this.specialSp = 0;
            this.passiveASp = 0;
            this.passiveBSp = 0;
            this.passiveCSp = 0;
            this.passiveSSp = 0;
            this.totalSp = 0;
            this.arenaScore = this.__calcArenaScore(0, 0, 0, 0);
            return;
        }

        let totalSp = 0;
        let weaponSp = 0;
        if (this.weaponInfo != null) {
            weaponSp = this.weaponInfo.sp;
            if (weaponSp == 300 && this.isWeaponRefined) {
                weaponSp += 50;
            }
            totalSp += weaponSp;
        }
        let specialSp = 0;
        if (this.specialInfo != null) {
            specialSp = this.specialInfo.sp;
            totalSp += this.specialInfo.sp;
        }
        let supportSp = 0;
        if (this.supportInfo != null) {
            supportSp = this.supportInfo.sp;
            totalSp += this.supportInfo.sp;
        }
        let passiveASp = 0;
        if (this.passiveAInfo != null) {
            passiveASp = this.passiveAInfo.sp;
            totalSp += this.passiveAInfo.sp;
        }
        let passiveBSp = 0;
        if (this.passiveBInfo != null) {
            passiveBSp = this.passiveBInfo.sp;
            totalSp += this.passiveBInfo.sp;
        }
        let passiveCSp = 0;
        if (this.passiveCInfo != null) {
            passiveCSp = this.passiveCInfo.sp;
            totalSp += this.passiveCInfo.sp;
        }
        let passiveSSp = 0;
        if (this.passiveSInfo != null) {
            passiveSSp = this.passiveSInfo.sp;
            totalSp += this.passiveSInfo.sp;
        }

        let rating = this.heroInfo.getStatusTotalOfLv40();

        this.weaponSp = weaponSp;
        this.supportSp = supportSp;
        this.specialSp = specialSp;
        this.passiveASp = passiveASp;
        this.passiveBSp = passiveBSp;
        this.passiveCSp = passiveCSp;
        this.passiveSSp = passiveSSp;

        if (rating < this.heroInfo.duelScore) {
            rating = this.heroInfo.duelScore;
        }
        if (rating < 170 && this.__hasDuel3Skill()) {
            rating = 170;
        }
        else if (this.__hasDuel4Skill()) {
            if (this.isMythicHero || this.isLegendaryHero) {
                if (rating < 175) {
                    rating = 175;
                }
            }
            else {
                if (rating < 180) {
                    rating = 180;
                }
            }
        }

        this.totalSp = totalSp;

        let merge = Number(this.merge);
        if (majorSeason != SeasonType.None && this.providableBlessingSeason == majorSeason) {
            merge += 10;
        }
        else if (minorSeason != SeasonType.None && this.providableBlessingSeason == minorSeason) {
            merge += 5;
        }

        let score = this.__calcArenaScore(rating, totalSp, merge, 5);
        this.arenaScore = score;
    }

    __calcArenaScore(rating, totalSp, rebirthCount, rarity = 5) {
        let base = 150;
        let rarityBase = rarity * 2 + 45;
        let levelScore = 0;
        switch (rarity) {
            case 5:
                levelScore = Math.floor(this.level * 2.33);
                break;
            case 4:
                levelScore = Math.floor(this.level * 2.15);
                break;
            case 3:
                levelScore = Math.floor(this.level * 2.03);
                break;
            case 2:
                levelScore = Math.floor(this.level * 1.87);
                break;
            case 1:
                levelScore = Math.floor(this.level * 1.74);
                break;
        }
        this.rarityScore = rarityBase;
        this.levelScore = levelScore;

        let baseStatusTotal = rating;
        if (rebirthCount >= 1) {
            baseStatusTotal += 3;
        }
        this.rating = baseStatusTotal;
        return base + levelScore + rarityBase + Math.floor(baseStatusTotal / 5) + Math.floor((totalSp) / 100) + (rebirthCount * 2);
    }

    initializeSkillsToDefault() {
        let heroInfo = this.heroInfo;
        this.weapon = heroInfo.weapon;
        this.weaponRefinement = WeaponRefinementType.None;
        this.support = heroInfo.support;
        this.special = heroInfo.special;
        this.passiveA = heroInfo.passiveA;
        this.passiveB = heroInfo.passiveB;
        this.passiveC = heroInfo.passiveC;
        // this.passiveS = PassiveS.None;
    }

    hasMovementAssist() {
        if (this.supportInfo == null) {
            return false;
        }

        return this.supportInfo.assistType == AssistType.Move;
    }

    setGrantedBlessingIfPossible(value) {
        if (this.providableBlessingSeason != SeasonType.None) {
            this.grantedBlessing = value;
        }
    }

    get detailPageUrl() {
        if (this.heroInfo == null) {
            return "";
        }
        return this.heroInfo.detailPageUrl;
    }

    /// データベースの英雄情報からユニットを初期化します。
    initByHeroInfo(heroInfo) {
        let isHeroInfoChanged = this.heroInf != heroInfo;
        if (!isHeroInfoChanged) {
            return;
        }

        this.heroInfo = heroInfo;
        this.providableBlessingSeason = heroInfo.seasonType;
        if (this.providableBlessingSeason != SeasonType.None) {
            this.grantedBlessing = SeasonType.None;
        }

        this.name = heroInfo.name;

        this.weaponType = stringToWeaponType(heroInfo.weaponType);
        this.attackRange = heroInfo.attackRange;
        this.moveType = heroInfo.moveType;
        this.maxHp = heroInfo.hp;
        this.atk = heroInfo.atk;
        this.spd = heroInfo.spd;
        this.def = heroInfo.def;
        this.res = heroInfo.res;
        if (heroInfo.atk == 0) {
            // まだDBにステータスが定義されていないので適当に割り当て
            if (heroInfo.hp == 0) {
                this.maxHp = 40;
            }
            this.atk = 40;
            this.spd = 40;
            this.def = 30;
            this.res = 30;
        }

        this.hpLv1 = heroInfo.hpLv1;
        this.atkLv1 = heroInfo.atkLv1;
        this.spdLv1 = heroInfo.spdLv1;
        this.defLv1 = heroInfo.defLv1;
        this.resLv1 = heroInfo.resLv1;
        this.hpIncrement = heroInfo.hpIncrement;
        this.atkIncrement = heroInfo.atkIncrement;
        this.spdIncrement = heroInfo.spdIncrement;
        this.defIncrement = heroInfo.defIncrement;
        this.resIncrement = heroInfo.resIncrement;
        this.hpDecrement = heroInfo.hpDecrement;
        this.atkDecrement = heroInfo.atkDecrement;
        this.spdDecrement = heroInfo.spdDecrement;
        this.defDecrement = heroInfo.defDecrement;
        this.resDecrement = heroInfo.resDecrement;

        // this.updatePureGrowthRate();
    }

    updateStatusByWeapon() {
        if (this.weapon != Weapon.None) {
            let weaponInfo = this.weaponInfo;
            if (weaponInfo != null) {
                if (this.weaponRefinement != WeaponRefinementType.None) {
                    this.atkWithSkills += weaponInfo.mightRefine;
                } else {
                    this.atkWithSkills += weaponInfo.might;
                }
                this.atkWithSkills += weaponInfo.atk;
                this.spdWithSkills += weaponInfo.spd;
                this.defWithSkills += weaponInfo.def;
                this.resWithSkills += weaponInfo.res;
            }

            switch (this.weapon) {
                case Weapon.MasyouNoYari:
                    if (this.isWeaponRefined) {
                        // 武器錬成なしの時に攻速は+2されてる
                        this.atkWithSkills += 1;
                        this.spdWithSkills += 1;
                        this.defWithSkills += 3;
                        this.resWithSkills += 3;
                    }
                    break;
            }
        }
    }

    resetMaxSpecialCount() {
        if (this.special == Special.None) {
            this.maxSpecialCount = 0;
            this.specialCount = 0;
            return;
        }

        if (this.specialInfo == null) {
            console.error("special ID " + this.special + " was not found.");
            return;
        }

        let specialCountMax = this.specialInfo.specialCount;
        if (this.weaponInfo != null) {
            specialCountMax += this.weaponInfo.cooldownCount;
            switch (this.weapon) {
                case Weapon.Ragnell:
                case Weapon.Alondite:
                    if (this.isWeaponSpecialRefined) {
                        specialCountMax -= 1;
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (this.isWeaponRefined) {
                        specialCountMax -= 1;
                    }
                    break;
            }
        }

        this.maxSpecialCount = specialCountMax;
        if (this.specialCount > this.maxSpecialCount) {
            this.specialCount = this.maxSpecialCount;
        }
    }

    /// テレポート系スキルを所持していたり、状態が付与されていて、テレポートが可能な状態かどうかを判定します。
    canTeleport() {
        if (this.hasStatusEffect(StatusEffectType.AirOrders)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (isTeleportationSkill(skillId)) {
                return true;
            }
        }
        return false;
    }

    __canExecuteHarshCommand(targetUnit) {
        if (!targetUnit.isDebuffed) {
            return false;
        }
        if (targetUnit.atkDebuff < 0 && -targetUnit.atkDebuff > (targetUnit.atkBuff)) { return true; }
        if (targetUnit.spdDebuff < 0 && -targetUnit.spdDebuff > (targetUnit.spdBuff)) { return true; }
        if (targetUnit.defDebuff < 0 && -targetUnit.defDebuff > (targetUnit.defBuff)) { return true; }
        if (targetUnit.resDebuff < 0 && -targetUnit.resDebuff > (targetUnit.resBuff)) { return true; }
        return false;
    }

    /// 応援や一喝を実行可能かどうかを返します。
    canRallyTo(targetUnit, buffAmountThreshold) {
        let assistUnit = this;
        switch (assistUnit.support) {
            case Support.HarshCommandPlus:
                if (targetUnit.hasNegativeStatusEffect()) {
                    return true;
                }
                return this.__canExecuteHarshCommand(targetUnit);
            case Support.HarshCommand:
                return this.__canExecuteHarshCommand(targetUnit);
            default:
                if ((getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff) >= buffAmountThreshold) { return true; }
                if ((getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff) >= buffAmountThreshold) { return true; }
                if ((getDefBuffAmount(assistUnit.support) - targetUnit.defBuff) >= buffAmountThreshold) { return true; }
                if ((getResBuffAmount(assistUnit.support) - targetUnit.resBuff) >= buffAmountThreshold) { return true; }
                return false;
        }
    }

    /// 実際に補助可能なユニットとタイルを列挙します。
    *enumerateActuallyAssistableUnitAndTiles() {
        for (let unit of this.enumerateAssistableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist == this.assistRange) {
                    yield [unit, tile];
                }
            }
        }
    }

    /// 実際に破壊可能な配置物とタイルを列挙します。
    *enumerateActuallyBreakableStructureAndTiles() {
        for (let structure of this.enumerateBreakableStructures()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistance(structure.placedTile);
                if (dist == this.attackRange) {
                    yield [structure, tile];
                }
            }
        }
    }

    /// 実際に攻撃可能なユニットとタイルを列挙します。
    *enumerateActuallyAttackableUnitAndTiles() {
        for (let unit of this.enumerateAttackableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist == this.attackRange) {
                    yield [unit, tile];
                }
            }
        }
    }

    /// 補助可能なユニットを列挙します。
    *enumerateAssistableUnits() {
        for (let tile of this.assistableTiles) {
            let unit = tile.placedUnit;
            if (unit === this) continue;
            if (unit != null && unit.groupId == this.groupId) {
                if (unit.hasStatusEffect(StatusEffectType.Isolation)) {
                    continue;
                }

                yield unit;
            }
        }
    }

    /// 攻撃可能なユニットを列挙します。
    *enumerateAttackableUnits() {
        for (let tile of this.attackableTiles) {
            if (tile.placedUnit != null && tile.placedUnit.groupId != this.groupId) {
                yield tile.placedUnit;
            }
        }
    }

    /// 攻撃可能な壊せる壁や施設を列挙します。
    *enumerateBreakableStructures() {
        for (let tile of this.attackableTiles) {
            if (tile.obj != null && this.canBreak(tile.obj)) {
                yield tile.obj;
            }
        }
    }

    /// 移動可能なマスを列挙します。
    *enumerateMovableTiles(ignoresTileUnitPlaced = true) {
        for (let tile of this.movableTiles) {
            if (ignoresTileUnitPlaced || (tile.placedUnit == null || tile.placedUnit == this)) {
                yield tile;
            }
        }
    }

    /// ユニットが破壊可能な配置物であるかどうかを判定します。
    canBreak(structure) {
        return structure instanceof BreakableWall
            || (structure.isBreakable
                && (
                    (this.groupId == UnitGroupType.Ally && structure instanceof DefenceStructureBase)
                    || (this.groupId == UnitGroupType.Enemy && structure instanceof OffenceStructureBase)
                ));
    }

    /// 補助スキルの射程です。
    get assistRange() {
        return getAssistRange(this.support);
    }

    /// 補助スキルを所持していればtrue、そうでなければfalseを返します。
    get hasSupport() {
        return this.support != Support.None;
    }

    /// 天駆の道の効果を持つか
    hasPathfinderEffect() {
        for (let skillId of this.enumerateSkills()) {
            if (hasPathfinderEffect(skillId)) {
                return true;
            }
        }
        return false;
    }

    get isTome() {
        return isWeaponTypeTome(this.weaponType);
    }
}

/// ユニットが待ち伏せや攻め立てなどの攻撃順変更効果を無効化できるかどうかを判定します。
function canDisableAttackOrderSwapSkill(unit, restHpPercentage) {
    for (let skillId of unit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.StudiedForblaze:
                if (restHpPercentage >= 25) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing1:
                if (restHpPercentage == 100) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing2:
                if (restHpPercentage >= 50) {
                    return true;
                }
                break;
            case PassiveS.HardyBearing3:
            case Weapon.DawnSuzu:
            case Weapon.YoiyamiNoDanougi:
            case Weapon.YoiyamiNoDanougiPlus:
            case Weapon.SeitenNoMaiougi:
            case Weapon.SeitenNoMaiougiPlus:
            case Weapon.RyokuunNoMaiougi:
            case Weapon.RyokuunNoMaiougiPlus:
            case Weapon.RyusatsuNoAnkiPlus:
            case Weapon.CaltropDaggerPlus:
                return true;
        }
    }
    return false;
}

function calcBuffAmount(assistUnit, targetUnit) {
    let totalBuffAmount = 0;
    switch (assistUnit.support) {
        case Support.HarshCommand:
            {
                if (!targetUnit.isPanicEnabled) {
                    totalBuffAmount += targetUnit.atkDebuff;
                    totalBuffAmount += targetUnit.spdDebuff;
                    totalBuffAmount += targetUnit.defDebuff;
                    totalBuffAmount += targetUnit.resDebuff;
                }
            }
            break;
        case Support.HarshCommandPlus:
            {
                totalBuffAmount += targetUnit.atkDebuff;
                totalBuffAmount += targetUnit.spdDebuff;
                totalBuffAmount += targetUnit.defDebuff;
                totalBuffAmount += targetUnit.resDebuff;
            }
            break;
        default:
            {
                let buffAmount = getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
                buffAmount = getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
                buffAmount = getDefBuffAmount(assistUnit.support) - targetUnit.defBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
                buffAmount = getResBuffAmount(assistUnit.support) - targetUnit.resBuff;
                if (buffAmount > 0) { totalBuffAmount += buffAmount; }
            }
            break;
    }
    return totalBuffAmount;
}

/// @brief 回復補助の回復量を取得します。
/// @param {Unit} assistUnit 補助者のユニット
/// @param {Unit} targetUnit 補助対象のユニット
function calcHealAmount(assistUnit, targetUnit) {
    let healAmount = 0;
    switch (assistUnit.support) {
        case Support.Heal:
            healAmount = 5;
            break;
        case Support.Reconcile:
            healAmount = 7;
            break;
        case Support.Physic:
            healAmount = 8;
            break;
        case Support.Mend:
            healAmount = 10;
            break;
        case Support.Recover:
            healAmount = 15;
            break;
        case Support.Martyr:
            healAmount = assistUnit.currentDamage + 7;
            break;
        case Support.MartyrPlus:
            healAmount = assistUnit.currentDamage + Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 7) { healAmount += 7; }
            break;
        case Support.Rehabilitate:
            {
                let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
                if (targetUnit.hp <= halfHp) {
                    healAmount += (halfHp - targetUnit.hp) * 2;
                }
                healAmount += 7;
            }
            break;
        case Support.RehabilitatePlus:
            {
                healAmount += Math.floor(assistUnit.getAtkInPrecombat() * 0.5) - 10;
                if (healAmount < 7) { healAmount = 7; }

                let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
                if (targetUnit.hp <= halfHp) {
                    healAmount += (halfHp - targetUnit.hp) * 2;
                }
                healAmount += 7;
            }
            break;
        case Support.PhysicPlus:
        case Support.RestorePlus:
        case Support.RescuePlus:
        case Support.ReturnPlus:
        case Support.NudgePlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 8) { healAmount = 8; }
            break;
        case Support.Restore:
        case Support.Rescue:
        case Support.Return:
        case Support.Nudge:
            healAmount = 8;
            break;
        case Support.RecoverPlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5) + 10;
            if (healAmount < 15) { healAmount = 15; }
            break;
        default:
            return 0;
    }
    if (targetUnit.currentDamage < healAmount) {
        return targetUnit.currentDamage;
    }
    return healAmount;
}

/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier1(attackUnit, targetUnit) {
    return attackUnit.weapon == Weapon.Hlidskjalf;
}

/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier2(attackUnit, targetUnit) {
    for (let skillId of attackUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.RogueDagger:
            case Weapon.RogueDaggerPlus:
                if (attackUnit.weaponRefinement == WeaponRefinementType.None) {
                    return true;
                }
                break;
            case Weapon.PoisonDagger:
            case Weapon.PoisonDaggerPlus:
                if (targetUnit.moveType == MoveType.Infantry) {
                    return true;
                }
                break;
            case Weapon.KittyPaddle:
            case Weapon.KittyPaddlePlus:
                if (isWeaponTypeTome(targetUnit.weapon)) {
                    return true;
                }
                break;
            case PassiveB.SealDef3:
            case PassiveB.SealRes3:
            case PassiveB.SealAtkDef2:
            case PassiveB.SealAtkRes2:
            case PassiveB.SealDefRes2:
            case PassiveB.SealSpdDef2:
                return true;
        }
    }
    return false;
}

/// ユニットがアフリクターであるかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartH
function isAfflictor(attackUnit, lossesInCombat) {
    for (let skillId of attackUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.TigerSpirit:
                if (attackUnit.snapshot.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.FrostbiteBreath:
                if (attackUnit.snapshot.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.Pain:
            case Weapon.PainPlus:
            case Weapon.Panic:
            case Weapon.PanicPlus:
            case Weapon.FlashPlus:
            // case Weapon.Candlelight:
            // case Weapon.CandlelightPlus:
            case Weapon.LegionsAxe:
            case Weapon.LegionsAxePlus:
            case Weapon.MonstrousBow:
            case Weapon.MonstrousBowPlus:
            case Weapon.DeathlyDagger:
                return true;
            case PassiveC.PanicSmoke3:
            case PassiveB.PoisonStrike3:
                if (lossesInCombat) {
                    return false;
                }
                return true;
            case Weapon.GhostNoMadosyoPlus:
                if (attackUnit.isWeaponRefined) {
                    return true;
                }
                return false;
        }
    }
    return false;
}

function canRefereshTo(targetUnit) {
    return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
}
/// @file
/// @brief DamageCalculator クラスとそれに関連するクラスや関数等の定義です。

var TriangleAdvantage = {
    None: 0,
    Advantageous: 1,
    Disadvantageous: 2,
};

/// ダメージ計算時に一時的に使用するコンテキストです。
class DamageCalcContext {
    constructor() {
        this.isCounterattack = false;
        this.isFollowupAttack = false;
        this.attackedUnitHistory = []; // 攻撃したユニットの履歴
    }

    isFirstAttack(atkUnit) {
        for (let unit of this.attackedUnitHistory) {
            if (unit == atkUnit) {
                return false;
            }
        }

        return true;
    }

    isConsecutiveAttack(atkUnit) {
        return this.attackedUnitHistory[this.attackedUnitHistory.length - 1] == atkUnit;
    }
}

/// ダメージ計算結果を表すクラスです。
class DamageCalcResult {
    constructor() {
        this.atkUnit_totalAttackCount = 0;
        this.defUnit_totalAttackCount = 0;
        this.atkUnit_actualTotalAttackCount = 0;
        this.defUnit_actualTotalAttackCount = 0;
        this.atkUnit_normalAttackDamage = 0;
        this.defUnit_normalAttackDamage = 0;

        this.preCombatDamage = 0;

        // 護り手ユニットかそうでないかを後で区別できるよう結果に戦ったユニットを記録しておく
        this.defUnit = null;
    }
}

/// ダメージ計算を行うためのクラスです。
class DamageCalculator {
    constructor() {
        this._rawLog = "";
        this._log = "";
        this._simpleLog = "";
        this.isLogEnabled = true;
    }

    get rawLog() {
        return this._rawLog;
    }

    get log() {
        return this._log;
    }
    get simpleLog() {
        return this._simpleLog.substring(0, this._simpleLog.length - "<br/>".length);
    }

    examinesCanFollowupAttack(atkUnit, defUnit) {
        var totalSpdAtk = atkUnit.getSpdInCombat(defUnit);
        var totalSpdDef = defUnit.getSpdInCombat(atkUnit);
        this.writeDebugLog(`${atkUnit.getNameWithGroup()}の速さによる追撃評価:`);
        this.__logSpdInCombat(atkUnit, defUnit, TabChar);
        this.__logSpdInCombat(defUnit, atkUnit, TabChar);
        if (totalSpdAtk >= totalSpdDef + 5) {
            this.writeDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが5以上高いので追撃可能");
            return true;
        }

        this.writeDebugLog(TabChar + atkUnit.getNameWithGroup() + "は速さが足りないので追撃不可");
        return false;
    }

    __logSpdInCombat(unit, enemyUnit, tab = "") {
        this.writeDebugLog(tab + unit.getNameWithGroup()
            + `の戦闘中速さ${unit.getSpdInCombat(enemyUnit)}(速さ${unit.spdWithSkills}、強化${unit.getSpdBuffInCombat(enemyUnit)}、弱化${unit.spdDebuff}、戦闘中強化${unit.spdSpur})`);
    }

    writeSimpleLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._simpleLog += log + "<br/>";
    }

    writeLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._log += log + "<br/>";
        this._rawLog += log + "\n";
    }
    writeDebugLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._log += "<span style='font-size:10px; color:#666666'>" + log + "</span><br/>";
        this._rawLog += log + "\n";
    }
    writeRestHpLog(unit) {
        if (!this.isLogEnabled) {
            return;
        }
        this.writeLog(unit.name + "の残りHP " + unit.restHp + "/" + unit.maxHpWithSkills);
    }

    clearLog() {
        this._log = "";
        this._simpleLog = "";
        this._rawLog = "";
    }

    /// ダメージ計算を行います。
    /// @param {Unit} atkUnit 攻撃をするユニットです。
    /// @param {Unit} defUnit 攻撃を受けるユニットです。
    calc(atkUnit, defUnit) {
        // 初期化
        var context = new DamageCalcContext();
        var result = new DamageCalcResult();
        result.defUnit = defUnit;

        // 戦闘中ダメージ計算
        this.writeDebugLog("戦闘中ダメージ計算..");

        if (defUnit.battleContext.isVantageActivated) {
            // 反撃
            this.__counterattack(atkUnit, defUnit, result, context);
            // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

            if (defUnit.battleContext.isDefDesperationActivated) {
                // 反撃の追撃
                this.__followupCounterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 攻撃
                this.__attack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 攻撃の追撃
                this.__followupAttack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
            }
            else {
                // 攻撃
                this.__attack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                if (atkUnit.battleContext.isDesperationActivated) {
                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
                else {
                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
            }
        }
        else {
            // 攻撃
            this.__attack(atkUnit, defUnit, result, context);
            // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

            if (atkUnit.battleContext.isDesperationActivated) {
                // 攻撃の追撃
                this.__followupAttack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 反撃
                this.__counterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                // 反撃の追撃
                this.__followupCounterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
            } else {
                // 反撃
                this.__counterattack(atkUnit, defUnit, result, context);
                // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                if (defUnit.battleContext.isDefDesperationActivated) {
                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);

                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
                else {
                    // 攻撃の追撃
                    this.__followupAttack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }

                    // 反撃の追撃
                    this.__followupCounterattack(atkUnit, defUnit, result, context);
                    // if (this.__isAnyoneDead(atkUnit, defUnit)) { return result; }
                }
            }
        }

        return result;
    }

    __isDead(unit) {
        if (unit.restHp == 0) {
            return true;
        }
        return false;
    }

    __isAnyoneDead(atkUnit, defUnit) {
        if (this.__isDead(atkUnit)) {
            return true;
        }
        if (this.__isDead(defUnit)) {
            return true;
        }
        return false;
    }

    __attack(atkUnit, defUnit, result, context) {
        context.isCounterattack = false;
        context.isFollowupAttack = false;
        var combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
        result.atkUnit_normalAttackDamage = combatResult.damagePerAttack;
        result.atkUnit_totalAttackCount += combatResult.attackCount;
        if (atkUnit.restHp > 0) {
            result.atkUnit_actualTotalAttackCount += combatResult.attackCount;
        }
    }

    __followupAttack(atkUnit, defUnit, result, context) {
        if (atkUnit.battleContext.canFollowupAttack) {
            context.isCounterattack = false;
            context.isFollowupAttack = true;
            var combatResult = this.__calcCombatDamage(atkUnit, defUnit, context);
            result.atkUnit_totalAttackCount += combatResult.attackCount;
            if (atkUnit.restHp > 0) {
                result.atkUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __counterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack) {
            context.isCounterattack = true;
            context.isFollowupAttack = false;
            var combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_normalAttackDamage = combatResult.damagePerAttack;
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }

            if (atkUnit.restHp == 0) {
                this.writeLog(atkUnit.getNameWithGroup() + "は戦闘不能");
                return result;
            }
        }
    }

    __followupCounterattack(atkUnit, defUnit, result, context) {
        if (defUnit.battleContext.canCounterattack && defUnit.battleContext.canFollowupAttack) {
            context.isCounterattack = true;
            context.isFollowupAttack = true;
            var combatResult = this.__calcCombatDamage(defUnit, atkUnit, context);
            result.defUnit_totalAttackCount += combatResult.attackCount;
            if (defUnit.restHp > 0) {
                result.defUnit_actualTotalAttackCount += combatResult.attackCount;
            }
        }
    }

    __calcFixedAddDamage(atkUnit, defUnit, isPrecombat) {
        let fixedAddDamage = 0;
        if (atkUnit.hasStatusEffect(StatusEffectType.TotalPenaltyDamage)) {
            fixedAddDamage += -defUnit.debuffTotal;
        }

        fixedAddDamage += atkUnit.battleContext.additionalDamage;
        fixedAddDamage += this.__getAtkMinusDefAdditionalDamage(
            atkUnit, defUnit, atkUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage, isPrecombat);
        return fixedAddDamage;
    }

    __getAtkMinusDefAdditionalDamage(atkUnit, defUnit, rate, isPrecombat) {
        let atk = 0;
        let value = 0;
        if (isPrecombat) {
            atk = atkUnit.getAtkInPrecombat();
            value = defUnit.getDefInPrecombat();
        }
        else {
            atk = atkUnit.getAtkInCombat(defUnit);
            value = defUnit.getDefInCombat(atkUnit);
        }

        if (atk > value) {
            return Math.trunc((atk - value) * rate);
        }
        return 0;
    }

    __calcAddDamageForDiffOf70Percent(atkUnit, defUnit, isPrecombat, getPrecombatFunc, getCombatFunc) {
        let diff = 0;
        if (isPrecombat) {
            diff = getPrecombatFunc(atkUnit) - getPrecombatFunc(defUnit);
        }
        else {
            diff = getCombatFunc(atkUnit, defUnit) - getCombatFunc(defUnit, atkUnit);
        }
        if (diff > 0) {
            let addDamage = Math.trunc(diff * 0.7);
            if (addDamage > 7) {
                addDamage = 7;
            }
            return addDamage;
        }
        return 0;
    }
    __getAtkInCombatDetail(unit, enemyUnit) {
        return `攻撃${unit.atkWithSkills}、強化${unit.getAtkBuffInCombat(enemyUnit)}、弱化${unit.getAtkDebuffInCombat()}、戦闘中強化${Number(unit.atkSpur)}`;
    }
    __getDefInCombatDetail(unit, enemyUnit) {
        return `守備${unit.defWithSkills}、強化${unit.getDefBuffInCombat(enemyUnit)}、弱化${unit.getDefDebuffInCombat()}、戦闘中強化${unit.defSpur}`;
    }
    __getResInCombatDetail(unit, enemyUnit) {
        return `魔防${unit.resWithSkills}、強化${unit.getResBuffInCombat(enemyUnit)}、弱化${unit.getResDebuffInCombat()}、戦闘中強化${unit.resSpur}`;
    }

    __calcCombatDamage(atkUnit, defUnit, context) {
        if (!this.__isDead(atkUnit)) {
            this.writeDebugLog("----");
            if (context.isCounterattack) {
                this.writeLog(atkUnit.getNameWithGroup() + "が" + defUnit.getNameWithGroup() + "に反撃");
            }
            else {
                if (context.isFollowupAttack) {
                    this.writeLog(atkUnit.getNameWithGroup() + "が" + defUnit.getNameWithGroup() + "に追撃");
                }
                else {
                    this.writeLog(atkUnit.getNameWithGroup() + "が" + defUnit.getNameWithGroup() + "を攻撃");
                }
            }
        }

        this.__calcAndSetCooldownCount(atkUnit, defUnit,
            [atkUnit.passiveA, atkUnit.passiveS],
            [defUnit.passiveA, defUnit.passiveS]);

        let totalAtk = atkUnit.getAtkInCombat(defUnit);

        let totalAtkDetailLog = this.__getAtkInCombatDetail(atkUnit, defUnit);

        var atkDamageAdd = 0;
        var atkCountPerOneAttack = 1;
        if (context.isCounterattack) {
            atkCountPerOneAttack = atkUnit.battleContext.counterattackCount;
        } else {
            atkCountPerOneAttack = atkUnit.battleContext.attackCount;
        }

        var atkCount = atkCountPerOneAttack;
        let specialMultDamage = atkUnit.battleContext.specialMultDamage;
        let specialAddDamage = atkUnit.battleContext.specialAddDamage;
        var reduceAtkHalf = atkUnit.weaponType == WeaponType.Staff;
        if (atkUnit.battleContext.wrathfulStaff) {
            reduceAtkHalf = false;
        }

        var effectiveAtk = atkUnit.battleContext.isEffectiveToOpponent;

        let mitHp = defUnit.restHp;
        let totalMit = 0;

        let totalMitDefailLog = "";
        let refersLowerMit = (atkUnit.battleContext.refersMinOfDefOrRes
            || (defUnit.attackRange == 2 && isWeaponTypeBreath(atkUnit.weaponType)));
        if (refersLowerMit && !defUnit.battleContext.invalidatesReferenceLowerMit) {
            this.writeDebugLog("守備魔防の低い方でダメージ計算");
            var defInCombat = defUnit.getDefInCombat(atkUnit);
            var resInCombat = defUnit.getResInCombat(atkUnit);
            totalMit = Math.min(defInCombat, resInCombat);
            if (resInCombat < defInCombat) {
                totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
            }
            else {
                totalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
            }
        }
        else if (atkUnit.weapon === Weapon.FlameLance) {
            if (atkUnit.snapshot.restHpPercentage >= 50) {
                this.writeDebugLog("魔防参照");
                totalMit = defUnit.getResInCombat(atkUnit);
                totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
            }
        }
        else if ((atkUnit.weapon == Weapon.HelsReaper)) {
            if (isWeaponTypeTome(defUnit.weaponType) || defUnit.weaponType == WeaponType.Staff) {
                this.writeDebugLog("守備参照");
                totalMit = defUnit.getDefInCombat(atkUnit);
                totalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
            }
            else {
                this.writeDebugLog("魔防参照");
                totalMit = defUnit.getResInCombat(atkUnit);
                totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
            }
        }
        else if (atkUnit.isPhysicalAttacker()) {
            this.writeDebugLog("守備参照");
            totalMit = defUnit.getDefInCombat(atkUnit);
            totalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
        }
        else {
            this.writeDebugLog("魔防参照");
            totalMit = defUnit.getResInCombat(atkUnit);
            totalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
        }

        let specialTotalMit = totalMit; // 攻撃側の奥義発動時の防御力
        let specialTotalMitDefailLog = "";

        let fixedAddDamage = this.__calcFixedAddDamage(atkUnit, defUnit, false);
        let fixedSpecialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;
        let invalidatesDamageReductionExceptSpecialOnSpecialActivation = atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation;
        switch (atkUnit.special) {
            case Special.Fukusyu:
                specialAddDamage = Math.trunc((atkUnit.maxHpWithSkills - atkUnit.restHp) * 0.5);
                this.writeDebugLog(`復讐による加算ダメージ${specialAddDamage}`);
                break;
            case Special.Setsujoku:
            case Special.Kessyu:
                specialAddDamage = Math.trunc((atkUnit.maxHpWithSkills - atkUnit.restHp) * 0.3);
                break;

            case Special.KoriNoSeikyo:
                // 通常ダメージに加算
                if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    fixedAddDamage += atkUnit.battleContext.reducedDamageForNextAttack;
                    atkUnit.battleContext.reducedDamageForNextAttack = 0;
                    atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                }
                break;
            case Special.IceMirror2:
                if (atkUnit.battleContext.nextAttackEffectAfterSpecialActivated) {
                    fixedAddDamage += Math.trunc(atkUnit.getResInCombat(defUnit) * 0.4);
                    atkUnit.battleContext.nextAttackEffectAfterSpecialActivated = false;
                }
                break;
            case Special.NegatingFang:
                if (atkUnit.battleContext.nextAttackEffectAfterSpecialActivated) {
                    fixedAddDamage += Math.trunc(atkUnit.getAtkInCombat(defUnit) * 0.3);
                    atkUnit.battleContext.nextAttackEffectAfterSpecialActivated = false;
                }
                break;
            case Special.SeidrShell:
                specialAddDamage = 15;
                if (!defUnit.battleContext.invalidatesReferenceLowerMit) {
                    this.writeDebugLog("魔弾の守備魔防の低い方でダメージ計算");
                    let defInCombat = defUnit.getDefInCombat(atkUnit);
                    let resInCombat = defUnit.getResInCombat(atkUnit);
                    specialTotalMit = Math.min(defInCombat, resInCombat);
                    if (resInCombat < defInCombat) {
                        specialTotalMitDefailLog = this.__getResInCombatDetail(defUnit, atkUnit);
                    }
                    else {
                        specialTotalMitDefailLog = this.__getDefInCombatDetail(defUnit, atkUnit);
                    }
                }
                break;
            default:
                break;
        }

        let attackAdvRatio = 0;
        {
            var attackTriangleAdv = this.calcAttackerTriangleAdvantage(atkUnit, defUnit);
            var triangleAdeptRate = 0;
            let triangleMult = 0;
            switch (attackTriangleAdv) {
                case TriangleAdvantage.Advantageous:
                    triangleAdeptRate = 0.2;
                    triangleMult = 1;
                    break;
                case TriangleAdvantage.Disadvantageous:
                    triangleAdeptRate = 0.2;
                    triangleMult = -1;
                    break;
                case TriangleAdvantage.None:
                default:
                    break;
            }

            // 相性激化
            let atkAdditionalRatio = atkUnit.getTriangleAdeptAdditionalRatio();
            let defAdditionalRatio = defUnit.getTriangleAdeptAdditionalRatio();
            // 相性相殺: 自分のスキルによる相性激化を無効
            if (atkUnit.neutralizesSelfTriangleAdvantage()) {
                atkAdditionalRatio = 0;
            }
            if (defUnit.neutralizesSelfTriangleAdvantage()) {
                defAdditionalRatio = 0;
            }
            let additionalRatio = Math.max(atkAdditionalRatio, defAdditionalRatio);
            // @TODO: 相性相殺1,2の実装
            // 相性相殺3: 相性不利の時、相手の相性激化を反転
            if (attackTriangleAdv === TriangleAdvantage.Disadvantageous) {
                if (atkUnit.reversesTriangleAdvantage()) {
                    // 自分が相性不利で自分が相性相殺3を持っている時反転する
                    additionalRatio = -defAdditionalRatio;
                }
            } else if (attackTriangleAdv === TriangleAdvantage.Advantageous) {
                if (defUnit.reversesTriangleAdvantage()) {
                    // 相手が相性不利で相手が相性相殺3を持っている時反転する
                    additionalRatio = -atkAdditionalRatio;
                }
            }
            attackAdvRatio = triangleMult * (triangleAdeptRate + additionalRatio);
            this.writeDebugLog("相性による攻撃補正値: " + attackAdvRatio);
        }

        var mitAdvRatio = 0.0;
        if (defUnit.placedTile.isDefensiveTile) {
            this.writeDebugLog(defUnit.getNameWithGroup() + "は防御地形補正 1.3");
            mitAdvRatio = 0.3;
        }

        var damageReduceRatio = 1.0;
        if (reduceAtkHalf) {
            damageReduceRatio *= 0.5;
        }


        this.writeDebugLog("補正前の攻撃:" + totalAtk + `(${totalAtkDetailLog})`);
        var finalAtk = totalAtk;
        if (effectiveAtk) {
            // 特効
            finalAtk = Math.trunc(finalAtk * 1.5);
            this.writeDebugLog("特効補正値: 1.5");
        }

        let addAdjustAtk = finalAtk * attackAdvRatio;
        this.writeDebugLog(`相性による攻撃加算: ${Math.trunc(addAdjustAtk)}(${addAdjustAtk})`);
        finalAtk = finalAtk + Math.trunc(addAdjustAtk);

        this.writeDebugLog("補正前の耐久:" + totalMit + `(${totalMitDefailLog})`);
        if (totalMit != specialTotalMit) {
            this.writeDebugLog("奥義発動時の補正前の耐久:" + specialTotalMit + `(${specialTotalMitDefailLog})`);
        }
        var finalMit = Math.trunc(totalMit + totalMit * mitAdvRatio);
        this.writeDebugLog("補正後の攻撃:" + finalAtk + "、耐久:" + finalMit);
        var damage = Math.trunc((finalAtk - finalMit) * damageReduceRatio) + atkDamageAdd;
        if (damage < 0) {
            damage = 0;
        }
        this.writeDebugLog("加算ダメージ:" + fixedAddDamage);
        damage += fixedAddDamage;

        var specialSuffer = atkUnit.battleContext.specialSufferPercentage;
        var sufferRatio = (specialSuffer / 100.0);

        var specialFinalMit = Math.trunc((specialTotalMit - Math.trunc(specialTotalMit * sufferRatio)) + (specialTotalMit * mitAdvRatio));
        var specialDamage = Math.trunc((finalAtk - specialFinalMit) * damageReduceRatio * specialMultDamage) + specialAddDamage + atkDamageAdd;
        if (specialDamage < 0) {
            specialDamage = 0;
        }
        specialDamage += fixedAddDamage;
        this.writeDebugLog("奥義加算ダメージ:" + fixedSpecialAddDamage);
        specialDamage += fixedSpecialAddDamage;
        this.writeDebugLog("通常ダメージ=" + damage + ", 奥義ダメージ=" + specialDamage);

        let totalDamage = this.__calcAttackTotalDamage(
            context,
            atkUnit,
            defUnit,
            atkCount,
            damage,
            specialDamage,
            invalidatesDamageReductionExceptSpecialOnSpecialActivation
        );

        if (!this.__isDead(atkUnit)) {
            // 攻撃側が倒されていたらダメージを反映しない(潜在ダメージ計算のためにダメージ計算は必要)
            var restHp = Math.max(0, mitHp - totalDamage);
            defUnit.restHp = restHp;
            this.writeLog(defUnit.getNameWithGroup() + "の残りHP " + defUnit.restHp + "/" + defUnit.maxHpWithSkills);
            this.writeLog(atkUnit.getNameWithGroup() + "の残りHP " + atkUnit.restHp + "/" + atkUnit.maxHpWithSkills);
            if (this.__isDead(defUnit)) {
                this.writeLog(defUnit.getNameWithGroup() + "は戦闘不能");
            }
        }
        var result = new Object();
        result.damagePerAttack = damage;
        result.attackCount = atkCount;
        return result;
    }


    calcPreCombatDamage(atkUnit, defUnit) {
        this.writeDebugLog("戦闘前ダメージ計算..");
        if (isPrecombatSpecial(atkUnit.special) == false) {
            this.writeDebugLog(`${atkUnit.getNameWithGroup()}は範囲奥義を持たない`);
            return;
        }

        var isSpecialActivated = false;
        if (atkUnit.maxSpecialCount > 0) {
            if (atkUnit.tmpSpecialCount == 0) {
                isSpecialActivated = true;
            }
        }

        if (!isSpecialActivated) {
            this.writeDebugLog(`${atkUnit.getNameWithGroup()}は範囲奥義を発動できない(発動カウント${atkUnit.tmpSpecialCount})`);
            return false;
        }

        atkUnit.battleContext.isSpecialActivated = true;
        var totalDamage = this.calcPrecombatDamage(atkUnit, defUnit);
        if (defUnit.restHp - totalDamage < 1) {
            totalDamage = defUnit.restHp - 1;
        }

        this.writeLog("範囲奥義によるダメージ" + totalDamage);
        this.writeSimpleLog(atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>範囲奥義によるダメージ" + totalDamage);
        this.__restoreMaxSpecialCount(atkUnit);

        defUnit.restHp = defUnit.restHp - totalDamage;
        this.writeRestHpLog(defUnit);
        return totalDamage;
    }

    calcPrecombatDamage(atkUnit, defUnit) {
        let precombatTotalMit = 0;
        if (atkUnit.isPhysicalAttacker()) {
            this.writeDebugLog("守備参照");
            precombatTotalMit = defUnit.getDefInPrecombat();
        }
        else {
            this.writeDebugLog("魔防参照");
            precombatTotalMit = defUnit.getResInPrecombat();
        }

        let tmpMit = precombatTotalMit;
        if (defUnit.placedTile.isDefensiveTile) {
            tmpMit *= 1.3;
        }

        let rangedSpecialDamage = Math.trunc(Math.max(0, atkUnit.getAtkInPrecombat() - tmpMit) * atkUnit.battleContext.precombatSpecialDamageMult);

        var addDamage = this.__calcFixedAddDamage(atkUnit, defUnit, true);
        let specialAddDamage = atkUnit.battleContext.additionalDamageOfSpecial;
        let damage = rangedSpecialDamage + addDamage + specialAddDamage;

        let damageReductionRatio = defUnit.battleContext.damageReductionRatioForPrecombat;

        let reducedDamage = Math.trunc(damage * damageReductionRatio);
        let currentDamage = Math.max(damage - reducedDamage, 0);

        if (damageReductionRatio > 0.0) {
            this.writeDebugLog("ダメージ軽減" + damageReductionRatio * 100 + "%");
            this.writeDebugLog("ダメージ:" + damage + "→" + currentDamage);
        }
        return currentDamage;
    }


    __calcAndSetCooldownCount(atkUnit, defUnit, atkUnitSkillIds, defUnitSkillIds) {
        atkUnit.battleContext.cooldownCountForAttack = 1;
        defUnit.battleContext.cooldownCountForAttack = 1;
        atkUnit.battleContext.cooldownCountForDefense = 1;
        defUnit.battleContext.cooldownCountForDefense = 1;
        if (atkUnit.battleContext.increaseCooldownCountForAttack) {
            atkUnit.battleContext.cooldownCountForAttack += 1;
        }
        if (atkUnit.battleContext.increaseCooldownCountForDefense) {
            atkUnit.battleContext.cooldownCountForDefense += 1;
        }
        if (defUnit.battleContext.increaseCooldownCountForAttack) {
            defUnit.battleContext.cooldownCountForAttack += 1;
        }
        if (defUnit.battleContext.increaseCooldownCountForDefense) {
            defUnit.battleContext.cooldownCountForDefense += 1;
        }

        if (defUnit.battleContext.reducesCooldownCount) {
            atkUnit.battleContext.cooldownCountForAttack -= 1;
            atkUnit.battleContext.cooldownCountForDefense -= 1;
        }
        if (atkUnit.battleContext.reducesCooldownCount) {
            defUnit.battleContext.cooldownCountForAttack -= 1;
            defUnit.battleContext.cooldownCountForDefense -= 1;
        }
    }

    calcAttackerTriangleAdvantage(atkUnit, defUnit) {
        var atkColor = atkUnit.color;
        var defColor = defUnit.color;
        this.writeDebugLog("[相性判定] 攻撃属性:" + colorTypeToString(atkColor) + "、防御属性:" + colorTypeToString(defColor));

        if (atkUnit.color == ColorType.Red) {
            if (defUnit.color == ColorType.Green) {
                return TriangleAdvantage.Advantageous;
            }
            if (defUnit.color == ColorType.Blue) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.color == ColorType.Blue) {
            if (defUnit.color == ColorType.Red) {
                return TriangleAdvantage.Advantageous;
            }
            else if (defUnit.color == ColorType.Green) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.color == ColorType.Green) {
            if (defUnit.color == ColorType.Blue) {
                return TriangleAdvantage.Advantageous;
            }
            else if (defUnit.color == ColorType.Red) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.battleContext.isAdvantageForColorless
            || atkUnit.isAdvantageForColorless(defUnit)
        ) {
            this.writeDebugLog(atkUnit.getNameWithGroup() + "は無属性に有利");
            if (defUnit.color == ColorType.Colorless) {
                return TriangleAdvantage.Advantageous;
            }
        }

        if (defUnit.battleContext.isAdvantageForColorless
            || defUnit.isAdvantageForColorless(atkUnit)
        ) {
            this.writeDebugLog(defUnit.getNameWithGroup() + "は無属性に有利");
            if (atkUnit.color == ColorType.Colorless) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        this.writeDebugLog("相性補正なし");
        return TriangleAdvantage.None;
    }

    __getDodgeDamageReductionRatio(atkUnit, defUnit) {
        let defUnitSpd = defUnit.getEvalSpdInCombat(atkUnit);
        let atkUnitSpd = atkUnit.getEvalSpdInCombat(defUnit);
        let diff = defUnitSpd - atkUnitSpd;
        if (diff > 0) {
            let percentage = diff * 4;
            if (percentage > 40) {
                percentage = 40;
            }

            this.writeDebugLog(`回避スキルによりダメージ${percentage}%軽減(速さの差 ${defUnitSpd}-${atkUnitSpd}=${diff})`);
            return percentage / 100.0;
        }

        return 0;
    }

    __getDamageReductionRatio(skillId, atkUnit, defUnit) {
        switch (skillId) {
            case Weapon.LilacJadeBreath:
                if (atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) {
                    return 0.4;
                }
                break;
            case Weapon.Areadbhar:
                let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                if (diff > 0 && defUnit.snapshot.restHpPercentage >= 25) {
                    let percentage = Math.min(diff * 4, 40);
                    this.writeDebugLog(`アラドヴァルによりダメージ${percentage}%軽減(速さの差 ${(defUnit.getEvalSpdInCombat(atkUnit))}-${(atkUnit.getEvalSpdInCombat(defUnit))}=${diff})`);
                    return percentage / 100.0;
                }
                break;
            case Weapon.GiltGoblet:
                if ((atkUnit.battleContext.initiatesCombat || atkUnit.snapshot.restHpPercentage === 100) &&
                    isWeaponTypeTome(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case Weapon.BloodTome:
                if (isRangedWeaponType(atkUnit.weaponType)) {
                    return 0.5;
                }
                break;
            case PassiveB.DragonWall3:
            case Weapon.NewFoxkitFang:
                {
                    let resDiff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
                    if (resDiff > 0) {
                        let percentage = resDiff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog("ダメージ" + percentage + "%軽減");
                        return percentage / 100.0;
                    }
                }
                break;
            case Weapon.BrightmareHorn: {
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    {
                        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                        if (diff > 0) {
                            let percentage = diff * 4;
                            if (percentage > 40) {
                                percentage = 40;
                            }

                            this.writeDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                            return percentage / 100.0;
                        }
                    }
                }
            }
                break;
            case Weapon.NightmareHorn:
            case Weapon.NewBrazenCatFang:
                {
                    let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog(`武器スキル(${defUnit.weaponInfo.name})によりダメージ${percentage}%軽減`);
                        return percentage / 100.0;
                    }
                }
                break;
            case PassiveB.MoonTwinWing:
                if (defUnit.snapshot.restHpPercentage >= 25) {
                    return this.__getDodgeDamageReductionRatio(atkUnit, defUnit);
                }
                break;
            case PassiveB.Bushido2:
            case PassiveB.Frenzy3:
            case PassiveB.Spurn3:
            case PassiveB.KaihiIchigekiridatsu3:
            case PassiveB.KaihiTatakikomi3:
                return this.__getDodgeDamageReductionRatio(atkUnit, defUnit);
            case PassiveB.BlueLionRule:
                {
                    let defUnitDef = defUnit.getEvalDefInCombat(atkUnit);
                    let atkUnitDef = atkUnit.getEvalDefInCombat(defUnit);
                    let diff = defUnitDef - atkUnitDef;
                    if (diff > 0) {
                        let percentage = diff * 4;
                        if (percentage > 40) {
                            percentage = 40;
                        }

                        this.writeDebugLog(`蒼き獅子王によりダメージ${percentage}%軽減(守備の差 ${defUnitDef}-${atkUnitDef}=${diff})`);
                        return percentage / 100.0;
                    }
                }
                break;
        }

        return 0;
    }

    __calcAttackTotalDamage(
        context, atkUnit, defUnit, attackCount, normalDamage, specialDamage,
        invalidatesDamageReductionExceptSpecialOnSpecialActivation
    ) {
        let hasAtkUnitSpecial = atkUnit.hasSpecial && isNormalAttackSpecial(atkUnit.special);
        let hasDefUnitSpecial = defUnit.hasSpecial && isDefenseSpecial(defUnit.special);

        let atkReduceSpCount = atkUnit.battleContext.cooldownCountForAttack;
        let defReduceSpCount = defUnit.battleContext.cooldownCountForDefense;
        let totalDamage = 0;
        for (let i = 0; i < attackCount; ++i) {
            let isDefUnitAlreadyDead = defUnit.restHp <= totalDamage;
            if (isDefUnitAlreadyDead) {
                return totalDamage;
            }
            let isAtkUnitalreadyDead = atkUnit.restHp == 0;
            if (isAtkUnitalreadyDead) {
                return totalDamage;
            }

            let activatesAttackerSpecial = hasAtkUnitSpecial && atkUnit.tmpSpecialCount == 0;
            let activatesDefenderSpecial = hasDefUnitSpecial && defUnit.tmpSpecialCount == 0;
            let damageReductionRatio = 1.0;
            let damageReductionValue = 0;

            // 奥義以外のダメージ軽減
            {
                // 計算機の外側で設定されたダメージ軽減率
                damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatio;

                for (let skillId of defUnit.enumerateSkills()) {
                    let ratio = this.__getDamageReductionRatio(skillId, atkUnit, defUnit);
                    if (ratio > 0) {
                        damageReductionRatio *= 1.0 - BattleContext.calcDamageReductionRatio(ratio, atkUnit);
                    }
                }

                if (defUnit.hasStatusEffect(StatusEffectType.Dodge)) {
                    let ratio = this.__getDodgeDamageReductionRatio(atkUnit, defUnit);
                    if (ratio > 0) {
                        damageReductionRatio *= 1.0 - BattleContext.calcDamageReductionRatio(ratio, atkUnit);
                    }
                }

                {
                    if (context.isFirstAttack(atkUnit)) {
                        // 初回攻撃
                        damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfFirstAttack;
                    } else if (context.isConsecutiveAttack(atkUnit)) {
                        // 連続した攻撃
                        damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfConsecutiveAttacks;
                    }

                    if (context.isFollowupAttack) {
                        // 追撃
                        damageReductionRatio *= 1.0 - defUnit.battleContext.damageReductionRatioOfFollowupAttack;
                    }
                }
            }

            let invalidatesDamageReductionExceptSpecial =
                activatesAttackerSpecial && invalidatesDamageReductionExceptSpecialOnSpecialActivation;
            if (invalidatesDamageReductionExceptSpecial) {
                this.writeDebugLog("奥義以外のダメージ軽減を無効化");
                damageReductionRatio = 1.0;
            }

            // 奥義によるダメージ軽減
            let isDefenderSpecialActivated = false;
            if (activatesDefenderSpecial) {
                let attackRange = atkUnit.getActualAttackRange(defUnit);
                switch (defUnit.special) {
                    case Special.NegatingFang:
                        damageReductionRatio *= 1.0 - 0.3;
                        isDefenderSpecialActivated = true;
                        break;
                    case Special.Seikabuto:
                    case Special.Seii:
                    case Special.KoriNoSeikyo:
                        if (attackRange == 2) {
                            damageReductionRatio *= 1.0 - 0.3;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.IceMirror2:
                        if (attackRange === 2) {
                            damageReductionRatio *= 1.0 - 0.4;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.Seitate:
                        if (attackRange == 2) {
                            damageReductionRatio *= 1.0 - 0.5;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.Kotate:
                    case Special.Nagatate:
                        if (attackRange == 1) {
                            damageReductionRatio *= 1.0 - 0.3;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                    case Special.Otate:
                        if (attackRange == 1) {
                            damageReductionRatio *= 1.0 - 0.5;
                            isDefenderSpecialActivated = true;
                        }
                        break;
                }

                if (isDefenderSpecialActivated) {
                    if (defUnit.passiveB == PassiveB.TateNoKodo3) {
                        damageReductionValue = 5;
                    }
                    this.__restoreMaxSpecialCount(defUnit);
                }
            }

            damageReductionRatio = 1.0 - damageReductionRatio;

            let currentDamage = 0;
            if (activatesAttackerSpecial) {
                atkUnit.battleContext.isSpecialActivated = true;
                // 奥義発動
                currentDamage = this.__calcUnitAttackDamage(defUnit, atkUnit, specialDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context);
                this.writeLog("奥義によるダメージ" + currentDamage);
                this.writeSimpleLog(" " + atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>奥義ダメージ" + currentDamage);
                this.__restoreMaxSpecialCount(atkUnit);

                // 奥義発動時の回復
                {
                    let actualDamage = currentDamage;
                    if (defUnit.restHp < currentDamage) {
                        actualDamage = defUnit.restHp;
                    }

                    let healedHp = Math.trunc(actualDamage * atkUnit.battleContext.specialDamageRatioToHeal);
                    healedHp += Math.trunc(atkUnit.maxHpWithSkills * atkUnit.battleContext.maxHpRatioToHealBySpecial);

                    if (atkUnit.passiveB == PassiveB.TaiyoNoUdewa) {
                        healedHp += Math.trunc(actualDamage * 0.3);
                    }

                    this.__heal(atkUnit, healedHp, defUnit);
                }
            }
            else {
                // 通常攻撃
                currentDamage = this.__calcUnitAttackDamage(defUnit, atkUnit, normalDamage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context);
                this.writeLog("通常攻撃によるダメージ" + currentDamage);
                this.writeSimpleLog(atkUnit.getNameWithGroup() + "→" + defUnit.getNameWithGroup() + "<br/>通常攻撃ダメージ" + currentDamage);
                this.__reduceSpecialCount(atkUnit, atkReduceSpCount);
            }

            {
                let healHpAmount = this.__getHealAmountByAttack(atkUnit, defUnit, currentDamage);
                if (healHpAmount > 0) {
                    this.writeDebugLog(`${atkUnit.getNameWithGroup()}は${healHpAmount}回復`);
                    this.__heal(atkUnit, healHpAmount, defUnit);
                }
            }

            if (this.__canActivateMiracle(defUnit, atkUnit)
                && (defUnit.restHp - totalDamage > 1)
                && (defUnit.restHp - totalDamage - currentDamage <= 0)
            ) {
                this.writeLog("祈り効果発動、" + defUnit.getNameWithGroup() + "はHP1残る");
                // @TODO: 現在の実装だとフィヨルムの氷の聖鏡に将来祈りが外付け出来るようになった場合も祈り軽減がダメージに加算されるのでその時にこの挙動が正しいのか検証する
                if (defUnit.battleContext.nextAttackAddReducedDamageActivated) {
                    let currentHp = defUnit.restHp - totalDamage;
                    let miracleDamage = currentHp - 1;
                    let miracleReducedDamage = currentDamage - miracleDamage;
                    defUnit.battleContext.reducedDamageForNextAttack += miracleReducedDamage;
                }
                totalDamage = defUnit.restHp - 1;
                if (defUnit.special == Special.Miracle) {
                    this.__restoreMaxSpecialCount(defUnit);
                }
            }
            else {
                totalDamage += currentDamage;
            }

            if (!isDefenderSpecialActivated) {
                this.__reduceSpecialCount(defUnit, defReduceSpCount);
            }
            context.attackedUnitHistory.push(atkUnit);

            this.writeDebugLog(defUnit.getNameWithGroup() + "の残りHP" + (defUnit.restHp - totalDamage) + "/" + defUnit.maxHpWithSkills);
        }

        return totalDamage;
    }

    __getHealAmountByAttack(targetUnit, defUnit, currentDamage) {
        let healedHp = targetUnit.battleContext.healedHpByAttack;
        healedHp += Math.trunc(currentDamage * targetUnit.battleContext.damageRatioToHeal);
        return healedHp;
    }

    __canActivateMiracle(unit, atkUnit) {
        if (unit.special == Special.Miracle && unit.tmpSpecialCount == 0) {
            return true;
        }
        if (unit.weapon == Weapon.Thirufingu
            && unit.snapshot.restHpPercentage >= 50) {
            return true;
        }
        else if (unit.weapon == Weapon.HelsReaper) {
            if (!isWeaponTypeTome(atkUnit.weaponType) && atkUnit.weaponType != WeaponType.Staff) {
                return true;
            }
        }
        return false;
    }

    __heal(unit, healedHp, enemyUnit) {
        if (enemyUnit.battleContext.invalidatesHeal) {
            return;
        }
        if (unit.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return;
        }

        unit.restHp += healedHp;
        if (unit.restHp > unit.maxHpWithSkills) {
            unit.restHp = unit.maxHpWithSkills;
        }
        this.writeDebugLog(unit.getNameWithGroup() + "は" + healedHp + "回復: HP=" + unit.restHp + "/" + unit.maxHpWithSkills);
    }

    __calcUnitAttackDamage(defUnit, atkUnit, damage, damageReductionRatio, damageReductionValue, activatesDefenderSpecial, context) {
        let reducedDamage = Math.trunc(damage * damageReductionRatio) + damageReductionValue;
        var currentDamage = Math.max(damage - reducedDamage, 0);
        if (damageReductionRatio > 0.0) {
            this.writeDebugLog("ダメージ軽減" + damageReductionRatio * 100 + "%");
            this.writeDebugLog("ダメージ-" + damageReductionValue);
            this.writeDebugLog("ダメージ:" + damage + "→" + currentDamage);
        }

        if (activatesDefenderSpecial) {
            switch (defUnit.special) {
                case Special.IceMirror2:
                    if (atkUnit.getActualAttackRange(defUnit) !== 2) break;
                case Special.NegatingFang:
                    defUnit.battleContext.nextAttackEffectAfterSpecialActivated = true;
                    break;
            }
        }

        // 自分の次の攻撃の時にダメージ軽減加算をするための処理
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Special.KoriNoSeikyo:
                    if (activatesDefenderSpecial) {
                        if (atkUnit.getActualAttackRange(defUnit) !== 2) break;
                        defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                        defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                    }
                    break;
                case Weapon.Ginnungagap:
                    // @TODO: ギンヌンガガプ発動条件についてきちんと検証する
                    if (!context.isFirstAttack(atkUnit)) break;
                    if (atkUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation) break;
                    if (defUnit.snapshot.restHpPercentage >= 25) {
                        let isTomeOrStaff = atkUnit.isTome || (atkUnit.weaponType === WeaponType.Staff);
                        if (defUnit.battleContext.initiatesCombat ||
                            (atkUnit.battleContext.initiatesCombat && isTomeOrStaff)) {
                            defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                            defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                        }
                    }
                    break;
            }
        }
        return currentDamage;
    }

    __restoreMaxSpecialCount(unit) {
        this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + unit.tmpSpecialCount + "→" + unit.maxSpecialCount);
        unit.tmpSpecialCount = unit.maxSpecialCount;
    }

    __reduceSpecialCount(unit, reduceSpCount) {
        if (!unit.hasSpecial) {
            return;
        }

        var currentSpCount = unit.tmpSpecialCount;
        unit.tmpSpecialCount -= reduceSpCount;
        if (unit.tmpSpecialCount < 0) {
            unit.tmpSpecialCount = 0;
        }
        this.writeDebugLog(unit.getNameWithGroup() + "の奥義カウント" + currentSpCount + "→" + unit.tmpSpecialCount);
    }
}
/// @file
/// @brief TurnSetting クラスとそれに関連するクラスや関数等の定義です。

/// シリアライズ可能なシミュレーターの設定です。
class TurnSetting {
    constructor(turn) {
        this._turn = turn;
        this._app = null;
        this._structures = [];
        this._units = [];
        this._deserializedStructures = [];
        this._tiles = [];
    }
    setAppData(appData) {
        this._app = appData;
    }
    get serialId() {
        return TurnSettingCookiePrefix + this._turn;
    }
    pushUnit(setting) {
        this._units.push(setting);
    }
    pushStructure(setting) {
        this._structures.push(setting);
    }
    pushTile(tile) {
        this._tiles.push(tile);
    }

    __findUnit(serialId) {
        for (var i = 0; i < this._units.length; ++i) {
            var unit = this._units[i];
            if (unit.serialId == serialId) {
                return unit;
            }
        }
        return null;
    }
    __findStructure(serialId) {
        for (var i = 0; i < this._structures.length; ++i) {
            var structure = this._structures[i];
            if (structure.serialId == serialId) {
                return structure;
            }
        }
        return null;
    }
    __findTile(serialId) {
        for (var i = 0; i < this._tiles.length; ++i) {
            var target = this._tiles[i];
            if (target.serialId == serialId) {
                return target;
            }
        }
        return null;
    }

    isDeserialized(structure) {
        for (let st of this._deserializedStructures) {
            if (st == structure) {
                return true;
            }
        }
        return false;
    }

    perTurnStatusToString() {
        return this.__toString(x => x.perTurnStatusToString());
    }

    turnWideStatusToString() {
        return this.__toString(x => x.turnWideStatusToString());
    }

    toString() {
        return this.__toString(x => x.toString());
    }

    __toString(toStringFunc) {
        var result = "";
        if (this._app != null) {
            result += "map" + NameValueDelimiter + toStringFunc(this._app) + ElemDelimiter;
        }
        for (var i = 0; i < this._units.length; ++i) {
            var unit = this._units[i];
            result += unit.serialId + NameValueDelimiter + toStringFunc(unit) + ElemDelimiter;
        }
        for (var i = 0; i < this._structures.length; ++i) {
            var structure = this._structures[i];
            result += structure.serialId + NameValueDelimiter + toStringFunc(structure) + ElemDelimiter;
        }
        for (let i = 0; i < this._tiles.length; ++i) {
            let tile = this._tiles[i];
            let serialized = toStringFunc(tile);
            if (serialized != "") {
                result += tile.serialId + NameValueDelimiter + serialized + ElemDelimiter;
            }
        }
        return result;
    }

    fromPerTurnStatusString(source) {
        var elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromPerTurnStatusString(v));
    }

    fromTurnWideStatusString(source) {
        var elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromTurnWideStatusString(v));
    }

    fromString(source) {
        var elemTexts = source.split(ElemDelimiter);
        elemTexts = elemTexts.filter(n => n);
        this.__fromString(elemTexts, (x, v) => x.fromString(v));
    }

    __fromString(elemTexts, fromStringFunc) {
        this._deserializedStructures = []
        for (var i = 0; i < elemTexts.length; ++i) {
            var elemText = elemTexts[i];
            var splited = elemText.split(NameValueDelimiter);
            var serialId = splited[0];
            var value = splited[1];
            if (serialId == "map") {
                if (this._app != null) {
                    fromStringFunc(this._app, value);
                }
            }
            else if (serialId.startsWith(UnitCookiePrefix)) {
                var unit = this.__findUnit(serialId);
                if (unit != null) {
                    fromStringFunc(unit, value);
                    unit.createSnapshot();
                    unit.reserveCurrentSkills();
                }
            }
            else if (serialId.startsWith(StructureCookiePrefix)) {
                var structure = this.__findStructure(serialId);
                if (structure != null) {
                    // console.log(serialId + "=" + value);
                    fromStringFunc(structure, value);
                    // console.log("   " + structure.posX + ", " + structure.posY);
                    this._deserializedStructures.push(structure);
                }
            }
            else if (serialId.startsWith(TileCookiePrefix)) {
                let tile = this.__findTile(serialId);
                if (tile != null) {
                    fromStringFunc(tile, value);
                }
            }
        }
    }
}
/// @file
/// @brief AudioManager クラスとそれに関連するクラスや関数等の定義です。

const SoundEffectId = {
    Break: 0,
    Refresh: 1,
    Attack: 2,
    MovementAssist: 3,
    DoubleAttack: 4,
    Heal: 5,
    Rally: 6,
    PlayerPhase: 7,
    EnemyPhase: 8,
    Dead: 9,
    Trap: 10,
    Move: 11,
};
const BgmId = {
    Bgm01: 0,
    Bgm02: 1,
    Bgm03: 2,
    Bgm04: 3,
    Bgm05: 4,
    Bgm06: 5,
    Bgm07: 6,
    Bgm08: 7,
    Bgm09: 8,
    Bgm10: 9,
    Bgm11: 10,
    Bgm12: 11,
    Bgm13: 12,
    Bgm14: 13,
    Bgm15: 14,
    Bgm16: 15,
    Bgm17: 16,
    Bgm18: 17,
    Bgm19: 18,
    Bgm20: 19,
    Bgm21: 20,
    Bgm22: 21,
};

/// BGMやSEなどシミュレーター上で鳴らす音を管理するクラスです。
class AudioManager {
    constructor() {
        this.isSoundEffectEnabled = false;
        this.isBgmEnabled = false;
        this.currentBgmId = BgmId.Bgm20;
        this._bgmList = {};
        this._bgmSelectedCounts = {};
        this._soundEffectList = {};
        this._playQueue = new Queue(100);
        this.changesBgmRandomlyOnLoop = false;

        for (let key in BgmId) {
            this._bgmSelectedCounts[BgmId[key]] = 0;
        }
    }

    setBgmRandom() {
        let candidates = this.getBgmCandidates();
        let index = Math.floor(candidates.length * Math.random());
        this.currentBgmId = Number(candidates[index]);
        ++this._bgmSelectedCounts[this.currentBgmId];
    }

    getBgmCandidates() {
        let candidates = [];
        let min = this.__findMinSelectedCount();
        for (let key in this._bgmSelectedCounts) {
            let count = this._bgmSelectedCounts[key];
            if (count == min) {
                candidates.push(key);
            }
        }
        return candidates;
    }

    __findMinSelectedCount() {
        let min = 1000;
        for (let key in this._bgmSelectedCounts) {
            let count = this._bgmSelectedCounts[key];
            if (count < min) {
                min = count;
            }
        }
        return min;
    }

    playBgm() {
        let audio = this.__getBgmAudio(this.currentBgmId);
        audio.play();
    }
    pauseBgm() {
        let audio = this.__getBgmAudio(this.currentBgmId);
        audio.pause();
    }

    playSoundEffectImmediately(id) {
        if (!this.isSoundEffectEnabled) {
            return;
        }
        let audio = this.__getSoundEffectAudio(id);
        this._playQueue.enqueue(audio);
        this.__play(audio);
    }

    playSoundEffect(id) {
        if (!this.isSoundEffectEnabled) {
            return;
        }

        let audio = this.__getSoundEffectAudio(id);
        let isPlaying = this._playQueue.length > 0;
        this._playQueue.enqueue(audio);
        if (!isPlaying) {
            this.__play(audio);
        }
    }

    // 遅延初期化用に分ける
    __registerBgmResource(id) {
        this.__registerBgm(id, this.__getBgmFileName(id));
    }
    __getBgmFileName(id) {
        switch (id) {
            case BgmId.Bgm01: return "Bgm01.mp3";
            case BgmId.Bgm02: return "Bgm02.mp3";
            case BgmId.Bgm03: return "Bgm03.mp3";
            case BgmId.Bgm04: return "Bgm04.mp3";
            case BgmId.Bgm05: return "Bgm05.mp3";
            case BgmId.Bgm06: return "Bgm06.mp3";
            case BgmId.Bgm07: return "Bgm07.mp3";
            case BgmId.Bgm08: return "Bgm08.mp3";
            case BgmId.Bgm09: return "Bgm09.mp3";
            case BgmId.Bgm10: return "Bgm10.mp3";
            case BgmId.Bgm11: return "Bgm11.mp3";
            case BgmId.Bgm12: return "Bgm12.mp3";
            case BgmId.Bgm13: return "Bgm13.mp3";
            case BgmId.Bgm14: return "Bgm14.mp3";
            case BgmId.Bgm15: return "Bgm15.mp3";
            case BgmId.Bgm16: return "Bgm16.mp3";
            case BgmId.Bgm17: return "Bgm17.mp3";
            case BgmId.Bgm18: return "Bgm18.mp3";
            case BgmId.Bgm19: return "Bgm19.mp3";
            case BgmId.Bgm20: return "Bgm20.mp3";
            case BgmId.Bgm21: return "Bgm21.mp3";
            case BgmId.Bgm22: return "FE13_13_DontSpeakHerName.mp3";
            default: return "Bgm20.mp3";
        }
    }
    __registerSoundEffectResources() {
        this.__registerSoundEffect(SoundEffectId.Break, "Break.mp3");
        this.__registerSoundEffect(SoundEffectId.Refresh, "Refresh.mp3");
        this.__registerSoundEffect(SoundEffectId.Attack, "Attack.mp3");
        this.__registerSoundEffect(SoundEffectId.MovementAssist, "MovementAssist.mp3");
        this.__registerSoundEffect(SoundEffectId.DoubleAttack, "DoubleAttack.mp3");
        this.__registerSoundEffect(SoundEffectId.Heal, "Heal.mp3");
        this.__registerSoundEffect(SoundEffectId.Rally, "Rally.mp3");
        this.__registerSoundEffect(SoundEffectId.PlayerPhase, "PlayerPhase.mp3");
        this.__registerSoundEffect(SoundEffectId.EnemyPhase, "EnemyPhase.mp3");
        this.__registerSoundEffect(SoundEffectId.Dead, "Dead.mp3");
        this.__registerSoundEffect(SoundEffectId.Trap, "Trap.mp3");
        this.__registerSoundEffect(SoundEffectId.Move, "Move.mp3");
    }
    __isBgmResourceRegistered(id) {
        return id in this._bgmList;
    }
    __isSoundEffectResourceRegistered() {
        return Object.keys(this._soundEffectList).length > 0;
    }

    __getBgmAudio(id) {
        if (!this.__isBgmResourceRegistered(id)) {
            this.__registerBgmResource(id);
        }
        let audio = this._bgmList[this.currentBgmId];
        return audio;
    }

    __getSoundEffectAudio(id) {
        if (!this.__isSoundEffectResourceRegistered()) {
            this.__registerSoundEffectResources();
        }
        let audio = this._soundEffectList[id];
        return audio;
    }

    __play(audio) {
        // console.log("再生: " + audio.src);
        audio.play();
    }

    __registerSoundEffect(id, fileName) {
        let audio = new Audio();
        audio.src = g_audioRootPath + fileName;
        let self = this;
        audio.addEventListener("ended", function () {
            let endedAudio = self._playQueue.dequeue();
            // console.log("再生終了: " + endedAudio.src);
            if (self._playQueue.length > 0) {
                self.__play(self._playQueue.topValue);
            }
        }, false);
        this._soundEffectList[id] = audio;
    }
    __registerBgm(id, fileName) {
        let audio = new Audio();
        let self = this;
        audio.src = g_audioRootPath + "Bgm/" + fileName;
        audio.addEventListener("ended", function () {
            audio.currentTime = 0;
            if (self.changesBgmRandomlyOnLoop) {
                self.setBgmRandom();
                self.playBgm();
            }
            else {
                audio.play();
            }
        }, false);
        this._bgmList[id] = audio;
    }
}
/**
 * @file
 * @brief 模擬戦機能で使用する飛空城防衛プリセットの定義です。
 */

const AetherRaidDefensePreset = {
    PresetDark20200809: 0,
    Yume20200821: 1,
    PresetDark20200822: 2,
    PresetAnima20200815: 3,
    PresetAnima20191014: 4,
    PresetAnima20190820: 5,
    KaibaMila20200823: 6,
    PresetDark20200627: 7,
    PresetAnima20200816: 8,
    PresetAnima20200826: 9,
    PresetAnima20201105: 10,
    PresetAnima20210216: 11,
    PresetAnima20210306: 12,
};

/// 飛空城防衛プリセットを表すクラスです。
class AetherRaidDefensePresetInfo {
    constructor(id, title, setting, provider = "", season = SeasonType.None) {
        this.id = id;
        this.text = title;
        this.setting = setting;
        this.provider = provider;
        this.description = "";
        this.season = season;
    }

    getProviderHtml() {
        let html = "";
        const twitterUrl = "https://twitter.com/";
        if (this.provider.startsWith(twitterUrl)) {
            let twitterId = this.provider.substring(twitterUrl.length, this.provider.length);
            html += `提供者: <a href="${this.provider}" target="_blank" style="color:blue">${twitterId}</a>`;
        }
        return html;
    }
}

const AetherRaidDefensePresetOptions_AnimaSeason = [
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20210306,
        "[砂漠]特別枠トラップ",
        "C4VwTgdg7glgJgUwLwFsCGAHJAWAPgBlwEZjTDCAmA4gLhAhmAH0F8kKAOQogVgDYOubNgCcuHvh64RAdhJ8AzFV4yxPLtQW4AtCSKFBJXTpLcqhY3mPlqN41sLZCU86T1uCAOjz5PCnnQMzAhESIp6fBQyuDL8QgLE+PiG+mJE4TEy0YRaxnzipMbWJtT2JTYVJQ5CzrjV7g1eUr7YgYwsFGFRxJEWJNgJXFKx0by84pwlRf24ylOm5SVSxZV9i04FC43uvnzNnnttwQpI/PlE2DL52ERUoqP4FMqpuAKEb5olPnXzpQvGVBWtj+P0ctW+2zIfn2MiOLGwp0mRAUfD0KLucVSUkU+RERBIMnw+WmJX0BVyRn+VJBqxBxQ2Lg8kN2+0O9HaCB4OASqUIIkkiTxxGwEmILxEPAeMkEOVJfMKlJppMWtLKYM2TM1vmyngC7OCfBwHD0RFUuA4V3iggt2PwEQUeH43wpiWkCsW2RKxIWqpI1QZP0hOwOMJoAGdmCcAhGmAiiOHmFz4zGOGEE0wREhYTH8UgOOneEhk8x0qcCzIiwXU9GS5ni0wKGx6xRQs3OvWFBW+OmFJma7HWzRmPgmGx8EOmERR0hx8wKNPZ0wFAuJ9gV4n16PJzOJ1PQov5/uJ8uj8w16emDxt4uR51F1O7xP550KMeGzuz+/F1fH8Olx/J3/A8gLfE5FzXMCJyvSC/wRe9YwA+c4LfZDP1Qy8EJvS8AKnLlgK5V9I2wwjY2w78yInEdDXg6inyYWiiIY0imKvJiRwreCOLoriiJ40i+KvLiAG5QEgad0Cwbg/jhVgZ1mYEeFcWlKi0RVlOoH06U08gZP3UFqB4ap1JsLRAW04EpMqElVhku8yGobAjIs5yqDM5zKnM6yLJksChAU4znK0ZZzI85yvIqGS4PkhZHPcuKqBdALPLU7z9RYPCPGcT0AsoeSgVpZKVVsGTqMDahUTigq8pC4FCvyggezkx10yilx0wyyh01TWp60zGx61zRxaBzDKtFaHNSuccs5JIV8c26n45trOScnTRsZvENa9Kkfsnia2Yew4gpxxjXsVoamMbiQF1jHjISgA="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20210216,
        "[忘れられた]リターントラップ",
        "C4VwTgdg7glgJgUwLwFsCGAHJB2APgBlwEZiDTCAmMogLhAhmAH0F8kKAOAVlwBZDeRKrwBsHXF3ziOAThG5sAZhKTxisgFoSRQkRKEtuQ4RNGVZsqdOH1Awj1ultTggDpbrrlzoNmCIkhcnBZEiiLC2HiquCJEvAr48tGGKfoxuFQkxhYGztlWmllp/BJ8Ls7O+K7yVSLe9IwsFEgi+HhEXNhFfGK4HBQ8elzy2PgqHISO2eqpOXOGVPmWhbiOJQ7lm1WKPFW8Po0Iii16xFwc3R39EhTtOjLERBzxQXhTxaTx2d8kM2kFuTm6wymwqbg82AOfl4SEUoz6HHEggevAuElCCk6uBkWJ02C+3UM0hBs0BgIJywKpL49lBW08bl49V8LC4LQoulag1a8l4MiiUhiRDwShIozeK101HmaUM8iWVN+ZGBVClYP07jcIihLBE7Pa4QERF5XBIMgo6mNFDFygSD1m2TSlxlkspK2ywMGdI1dS13gAzsxjgHmDDaIGmGzw8xsC0aBGOIF48w9Eh9hGOkho0xjbDkznY9mnkmMzIs/mOeWI9aq8wKM1s2EcPm4c2I4JywBuUCQJhsdBYSpmHWsJCTZbYXZugEg7oz0yq5aGFGWEcBATkCTz6cgxb/HeL6xm1arhp+ZrjtKSHcz9R7m9kRxHvogkwj46UTfX7cFS1zbdPtK7SniyCAwmqZDfg+C5lAqbqHisUQgYcbKfqYXjQcsVA8HBBQIYC4g1AQI56rSV7xD+WGwfuM74SEAItmOZQhkw4HkPmqGlPg+axhuij5om6H5qmG4UMJnEkOmKakSCUkFkxVD8RmgknnJRBlguFZsOOLE1p+ukXqQLFNqYSlBrxpRie2AR/CENCdkAA"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20201105,
        "[廃墟]U字",
        "C4VwTgdg7glgJgUwLwFsCGAHJAmAPgBlwEYDjTC9CiAuECGYAfQXySIDYBmYgFgFZcPItwC0JPuzx8AHAE5cAdk7jOPXHlHjiAkmNx7C8wnt0lC58vpLdCPQgLUknZZ/gB07Am859a9JghEONLS6rIKVoLS3HzYEex8akpO+ApqGpF48qaRxmaZuZYWejaC9rjczlVk7j5ePn4MzNhIPHG4srKhejzsERLyndn4I7h8nJqRBhWCM9Pz+dMWxTm25XjV1bV8I7t7+zZufL50TQicrbIbRMeRveLY2Teesnz92KEZ03hqeaQLc3yy3+1lIdjGLkhWzcvyOjQCPGCAi4giIP3YoT4RDUfFkSWUY2x6kBxCoIMKixIaiWRUipXBDlImxq3i8x3hzD4SFioWE7CcnEkggxY2wAlxagxJC4nj0cqBU1WhT0AhpwPlYPK+WZZg8XgS1AAzkwLr5jYxETRzVyrUwFGwjUxpEgFI7GLIXW6bg7zRxuV77bbGERnWamEQPUHsKwo0Eoy0g4L/ebOPawxa4262j6mDwLjQANygSCMVjoLBkvIclhIWw1XD82nAiyUQrNpm0jX4atBQiVUhYptDr4K9ujxUEastCj1oRD9sj+cd9WrasXMn5fhL4GL9sWcdd6uIusWBTjvfEvBq2kH1enAJcyukTihC874nX4G33Ju9czHhZrWELdtaQHmG69r7m6zoziBTAejO2Beo+ZBIb67BAekAaYRUXowWQnBeghELptGQECGhTDYL2EKEea2DTgOv4YX2k4ppBMyURmQFUsQWaMWojhZn+M6FkAA=="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20190826,
        "[忘れられた]フラッシュヒールトラップ飛行パ",
        "C4VwTgdg7glgJgUwLwFsCGAHJB2APgBlwEYDizCAmUogLhAhmAH0F8kBmADgDZdOBOXABYivIdzwBWCr0kDc3foUkTcAWhIb1JIsu36thQ/qMlC50qdx5CQvezI7HxOg2YIiSIoOyc8IhyFJEmlOBXZJBX4Q7CEDTR1CBwSTXEErFIss1Ns9KicCl3pGFgokMN8xIkDVaV5uCKjlbjCtNsTcByp20nT9brNLIeNc3EjCidcShHYkCklI9nYU8TDOfEiGzejifFj4/V0x3AHU4y0HEaGrCztjh0IJorcWIQ4KNfwqklWxoPDtiQWqcehYeudBlo4ldslDSHdIlRHs4dFN3JI5vwfHJhAj8A5JNhBA0HIogY1wYMHp1UkRISEctd9JFRuNqCiXABnZizSQ0blMN60AUY4XMbBIbj85icHDSpj8JB8gVEUXy0RK9USsVMIiy5XMbxeeUUNg6iiec1lHXsbiS+XsCVSgUiY0AblAkCYbHQWGRpjRLDYSXIuKZ2QsVEugwj7NhmUDHiQlFDQjisdjVGhMfDobBCeK7jKyMGQhsueyVFOGbjwwLLxmyZptxzNZT1YredIoMTbxTFltncrJ0ZsdbB3wiYx/vh45rVdHTPHPYFs1snXlfcs8unxwo8olFh1svXk4Fisj6t3SXVdpT7C1Ta66pPNIfKovI4NTFNTZ+Js8dcrT/MYHTvY4bUPY4z2YV1o0OGg3SAA="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20200816,
        "[廃墟]伝令ルピナス",
        "C4VwTgdg7glgJgUwLwFsCGAHJAmAPgBlwEZjTDC9CiAuECGYAfQXyQFZ8B2XATh5IC0JHmwAsuNgDY8bHuM7ZuY7ngDMuIcULq8mzYX0aSB4wTPkjudYVGE2uPCSekntekwREko/sSJsnfzxRSQAOXmx1EUIeUMcucTVLU0FUs0NNNItsy0NbCRdC5xo6BmZsb0VeWMsQ8KkeasaifFaJVXU9NJarB1zTDJJdUxyTSxs7cyKXNzKEVUqYnhsiYfb6uVww+22+zucxrvSBkn2pnM1rXHz7SmnXUo9RdmxwolVJJw/gsIlse1k4n4JE4qnsR0uZnERzGY2hI3O/ShkxS91mHjY3kk4hanHBJDqEW4uMkWziEkkjSSmQofRh40s+MRFnpN16VDRAGcmAs2NRuYxnjQBZjhUxOEhJPymKEkJxpYweJKFf4kGLGERJOwVRL1URZXyBUQlersKxTV5TRV1R9lQLVBKpQLRJaFaJrW6FjQANygSCMVjoLAIoTo5isWmmKTMmN4NajKZ3Fkkez4MOeJAcqNJmMWOMMhO0i4giTpiraKaiVO5xN0hEJnNjUmidMLItmDg1nJ3QyFvrFgqqdPPDkWfJ97t1rv9qaaRLpzEJtjVidmfO92OI7AAalOxAVbdIhqYI4KaZFmbMQ4FEpsDgVsos6qVd71i9I2BVWoretvfU/RqPr0AFMMal42AqZqXgCkFeBWx6MNg5Ydge37XAQB5/vY6oupeBL7s6yHiDinrgX0PpAA="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20190820,
        "[溶岩]開幕35ダメ、恐怖のクロニエ城",
        // "C4VwTgdg7glgJgUwLwFsCGAHJBOAPgBlwEYDizCBmUogLhAhmAH0F8kKKB2XADgCYSAFiJVB2bvz64AbPkL8q0ogFZcAWhIb1JIoSmDthwluMlTpQpdJaTuQYVUHCOsjroNmCIuy68BdkTtxPylZeT5FImlDGx1KO2szI0NNJKsrWNJ7XFVVF3zid0YWPh8Jf2FRYMkZOT8qZUEpTK1dXCpm1MTuzos+81tsvNcRt3pihAoyvyFAsXLQuoUZIgMWuPaEzPNzKlt07sGHXClnUcLxz0Fp-lmqhdrwhuEYrrbRTdsvoWSDgaShpsCvkip5lEh7AZsMoeAEqNCDMolLw2pw+NF1q8sV1zKoMmk+nshGcqPEzsCaABnZhTZRU5jXWjUpjgpnMaRIaT0picTncnh85nYQXMXRITjclRINlMIi8mVEAV05lEYUyvhsdXedWlGXCaU0ADcoEgTDY6CwZ1MoJYbEITlIylJ-RdZ1U+1d1D62xtXiQxySTs9fzI7oJB3DZH2vtK5MdzpDEZyvxdkZxBF9Uz0fSDidTyY9eYJPsuLGu8UDCeDXrD1at3pxvvBZNIGrrfSkvRDkfrJm5Wc2gm55eTFG5zfI3I58T43N5VlnzIFx3w3OF6UlduokonVDHKvnCUXouXJxOkvXCSHzI1-rI1+YAjvJH3j9jpFfTH1RJSRqAA"
        // "turnwide=map=9|0|1|0|1|1|0|0|0|1:unit_e0=337|821|413|497|822|600|823|615|-1|-1|-1|10|2|4|-1|-1|0|-1|0|-1|0|-1|0|0|0|0|0|-1|-1|0|40|5|4|0|1|1|1|1|1:unit_e1=337|821|413|497|822|600|823|616|-1|-1|-1|10|3|4|0|-1|0|-1|0|-1|1|-1|0|0|0|0|0|-1|-1|0|40|5|5|1|1|1|1|1|1:unit_e2=337|821|413|497|822|600|823|542|-1|-1|-1|10|3|2|-1|-1|0|-1|0|-1|2|-1|0|0|0|0|0|-1|-1|0|40|5|1|1|1|1|1|1|1:unit_e3=337|821|413|497|822|600|823|614|-1|-1|-1|10|3|4|-1|-1|0|-1|0|-1|3|-1|0|0|0|0|0|-1|-1|0|40|5|2|0|1|1|1|1|1:unit_e4=337|821|413|497|822|600|823|541|-1|-1|-1|10|3|4|3|-1|0|-1|0|-1|4|-1|0|0|0|0|0|-1|-1|0|40|5|3|1|1|1|1|1|1:unit_e5=404|958|413|954|561|810|726|-1|-1|-1|-1|-1|-1|-1|1|-1|0|-1|5|0|0|-1|0|0|0|0|3|-1|40|1|3|0|3|0|1|1|1|1|1:st_3=5:st_5=1:st_6=6:st_7=6:st_8=6:st_9=6:st_10=7:st_15=1:st_17=1:st_18=5:st_19=1:st_20=1:st_21=1:st_22=1:st_41=1:;turn_0=map=0|1|0|-1:unit_e0=0|4|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e1=0|5|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e2=0|1|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e3=0|2|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e4=0|3|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e5=0|3|0|0|20|0|0|0|0|0|0|0|0|2|2|-1|0|0|0|0|1|0|0|0|0|1|0|-1|0:st_3=0|3|4:st_5=0|1|0:st_6=0|3|2:st_7=0|0|2:st_8=0|5|0:st_9=0|0|0:st_10=0|0|1:st_15=0|3|3:st_17=0|4|2:st_18=0|2|2:st_19=0|4|4:st_20=0|1|4:st_21=0|1|3:st_22=0|0|3:st_41=3|-1|-1|1:;"
        // "turnwide=map=9|0|1|0|1|1|0|0|0|1:unit_e0=337|821|413|497|822|600|823|615|-1|-1|-1|10|2|4|-1|-1|0|-1|0|-1|0|-1|0|0|0|0|0|-1|-1|0|40|5|4|0|1|1|1|1|1:unit_e1=337|821|413|497|822|600|823|616|-1|-1|-1|10|3|4|0|-1|0|-1|0|-1|1|-1|0|0|0|0|0|-1|-1|0|40|5|5|1|1|1|1|1|1:unit_e2=337|821|413|497|822|600|823|542|-1|-1|-1|10|3|2|-1|-1|0|-1|0|-1|2|-1|0|0|0|0|0|-1|-1|0|40|5|1|1|1|1|1|1|1:unit_e3=337|821|413|497|822|600|823|614|-1|-1|-1|10|3|4|-1|-1|0|-1|0|-1|3|-1|0|0|0|0|0|-1|-1|0|40|5|2|0|1|1|1|1|1:unit_e4=337|821|413|497|822|600|823|541|-1|-1|-1|10|3|4|3|-1|0|-1|0|-1|4|-1|0|0|0|0|0|-1|-1|0|40|5|3|1|1|1|1|1|1:unit_e5=404|958|413|954|561|810|726|-1|-1|-1|-1|-1|-1|-1|1|-1|0|-1|5|0|0|-1|0|0|0|0|3|-1|40|1|3|0|3|0|1|1|1|1|1:st_3=5:st_4=1:st_5=1:st_6=6:st_7=6:st_8=6:st_9=6:st_10=7:st_15=1:st_17=1:st_18=5:st_19=1:st_20=1:st_21=1:st_22=1:st_41=1:;turn_0=map=0|1|0|-1:unit_e0=0|4|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e1=0|5|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e2=0|1|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e3=0|2|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e4=0|3|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e5=0|3|0|0|20|0|0|0|0|0|0|0|0|2|2|-1|0|0|0|0|1|0|0|0|0|1|0|-1|0:st_3=0|3|4:st_4=0|5|3:st_5=0|1|0:st_6=0|3|2:st_7=0|0|2:st_8=0|5|0:st_9=0|0|0:st_10=0|0|1:st_15=0|3|3:st_17=0|4|2:st_18=0|2|2:st_19=0|4|4:st_20=0|1|4:st_21=0|1|3:st_22=0|0|3:st_41=3|-1|-1|1:;"
        "turnwide=map=9|0|1|0|1|1|0|0|0|1:unit_e0=337|821|413|497|822|600|823|615|-1|-1|-1|10|2|4|-1|-1|0|-1|0|-1|0|-1|0|0|0|0|0|-1|-1|0|40|5|4|0|1|1|1|1|1:unit_e1=337|821|413|497|822|600|823|616|-1|-1|-1|10|3|4|0|-1|0|-1|0|-1|1|-1|0|0|0|0|0|-1|-1|0|40|5|5|1|1|1|1|1|1:unit_e2=337|821|413|497|822|600|823|542|-1|-1|-1|10|3|2|-1|-1|0|-1|0|-1|2|-1|0|0|0|0|0|-1|-1|0|40|5|1|1|1|1|1|1|1:unit_e3=337|821|413|497|822|600|823|614|-1|-1|-1|10|3|4|-1|-1|0|-1|0|-1|3|-1|0|0|0|0|0|-1|-1|0|40|5|2|0|1|1|1|1|1:unit_e4=337|821|413|497|822|600|823|541|-1|-1|-1|10|3|4|3|-1|0|-1|0|-1|4|-1|0|0|0|0|0|-1|-1|0|40|5|3|1|1|1|1|1|1:unit_e5=404|958|413|954|561|810|726|570|0|0|0|10|5|-1|-1|-1|1|-1|0|-1|5|0|0|0|0|0|0|0|3|0|40|5|3|0|1|1|1|1|1:st_3=5:st_4=1:st_5=1:st_6=6:st_7=6:st_8=6:st_9=6:st_15=1:st_17=1:st_18=5:st_19=1:st_20=1:st_21=1:st_22=1:st_36=6:st_41=1:;turn_0=map=0|1|0|-1:unit_e0=0|4|0|0|50|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e1=0|5|1|0|48|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e2=0|1|1|0|50|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e3=0|2|0|0|50|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e4=0|3|1|0|51|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e5=0|3|0|0|85|0|0|0|0|0|0|0|0|2|2|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:st_3=0|3|4:st_4=0|5|3:st_5=0|1|0:st_6=0|3|2:st_7=0|0|2:st_8=0|5|0:st_9=0|0|0:st_15=0|3|3:st_17=0|4|2:st_18=0|2|2:st_19=0|4|4:st_20=0|1|4:st_21=0|1|3:st_22=0|0|3:st_36=0|0|1:st_41=3|-1|-1|1:;"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20200815,
        "[氷雪]攻めにくい、受けにくい",
        "C4VwTgdg7glgJgUwLwFsCGAHJBGAPgBlz0L2NwGYCiAuECGYAfQXxwDY2iAOATlwBZsAVgFsuuHgHY8PIQCYi+JbiFt+VBZWyERAWjz7chwsaNlThS1UOVC-HbgWkiL0rXpME2JPy6ds2OTqAeQi-GIqwkSBnGIibFGEmo5UJgbmGS4WqdZ4tgIOzkWu7gzMckhceZSG-DycUnhCvLhifNqS6kkUiipm-aZ8aSnZVsNaBX0krjPYpZ7kSOTkkrhccnj8cgrhCqp7POrrlHED6QJ9hleZ4-1jOddU9n0K08VzdGUI-D5yqzw8cS1CKNCQAxTKVR8R6GbR9c6mRGbO45KyPOyFKjvGifTxCJDycQxUjkNg7KQqOTxUkSAK4ST4VYwvJ9GrnYbDPRke7DUzPERWbFzADOTEWQmoosYPxFTHxssYkiQkklTC4ytVjG0GqlAR8muEOANbAJBqVCuw6olup4RqlclYCo2dqY2xdjFJSDkmsERoA3KBIIxWOgsNM0vNmKxumRVKj41ZKApRvHubk7pGvEg3lQIjyEylk2n88WzgRMxVBbmBQX7pQubWsfH0ZnFt0rPJG-c8EWuy57i3ccwfuGnjX8-cFL2J02B+zM-j84I+1Y9iiZ6WW1K21RrUwR1NNYunpqlYnNerVwboz18AbvHZy7rjyJvbqTd091qzylyAbL4WBq2tMf72jeTSas60z8JBlYXAqnqEFoPreGy-RzH6QA",
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20191014,
        "[氷雪]ドマドマクリセシ",
        "C4VwTgdg7glgJgUwLwFsCGAHJBGAPgBlz0L2NwGYCiAuECGYAfQXxwFY9zs3cBaPACwA2AOy425HmwCcA3EIAcAJiL4RcwoX64FuOXO3aSmvmSNUTWzlQGEpVUkSfZa9JgmxJySwuQVW9NiEdJR4hfDwRcjlsNV0TbVjxUxTzeJS8c0sqbUpCW2SY52KXOgZmJSQlfwphPQK2fCkRaXlveSFWoWwNHMiKXBVDMmwVAKGybIC8vTsBkhKaMvdyL3IxZUFsYOFdNmrxWRDKNhFg4ZSxIouA6ZSpvvvZ5J5HN6W3ZgE1jaUtnl24gOMjkyhOIh4F20rUolBuT20BkmFke5gaA3eb1c5QQbCqCh47QEoz0inE+D2RyieA4vQCSV0mSZDkekOR2VyNjmvUxNAAzkxVmxqALGN8XKK8RKmCIkCIRUwFHKFYxpEghCrtkhhaLsLLpYxsEqdUxsGqDT4cCq-lbRUpKgbyEJ1Sr1i7RcSrQBuUCQRisdBYBZWbHuVhzEwcFEPEwqOHs6NODnM-Ch5iefJJw6JmPOW4s5GJFE3NMISq+FECVq57KOLIousJhalT4IVZzMhVnPdxs9pz1kykUvfCtkCTdh54CYFxNFhIp0t4zMmEQ1xMqFN92tPVOi9uFFUjhwqpdUJQq2VzcgqpVzc+itUma+650V++my+DAia296Qaax8qBNRhLTmYCbRMARrXLP9gKdJBg1dT9NEPTx4wyagvSAA"
    ),
];

const AetherRaidDefensePresetOptions_DarkSeason = [
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.KaibaMila20200823,
        "[忘れられた]ミラミラミラミラ",
        "C4VwTgdg7glgJgUwLwFsCGAHJB2APgRlwAYDTDCAmYggLhAhmAH0EikKBWA7KgWkIAsHLhwBsefAGZsADlzZJXfERlU1uKsoIlC/XHpIBOagY3USFk4UsCSSsg/J0GzBPiQcKAgopLYxuAKiclIchIaKPp64ovjeegnW1JJmpmnk+kmWlonUtrhclhnFzowsFB5eUUZEXEEhioSxolFUooYtuaYkKXxJ6alZ5laZeXakOo609GUIkpXeoTpERILBUYQyQa0xMlxdQ959IyR6Kd3Dp7pJ+VxUk8XTLiwCC9XyAfUbuBFKim1bUa5LTec7XE6jeJDbJAm7jFIPRylVwcJBCchEATgoRcDqaZTGQxEYzCOTqTTLWGjK4jO6XYYXW64FKPEoAZ2Y8w4NA5TFe+B5zFRAt5oiQIuY2A8gqYMhwMuU4oVwoVYolTHwUvV+DlFAVhiVvIobHVFHcpoq6skYskMuk7BlWKVAG5QJAmGx0FgMldkSw2Ii/IV6TCSFQwSHhvcGYRCn63EhQ4FoZGw4NU9RozlCHhuTNXBVJjYU0m08dS5n6XoWgJ4/M08WMzD1Bck1nacz468esNthXm+n+2YYXojvHUT2ku0m1HmdSM+2wwBqQgsu2JwIFR0bsMyicFYgysXjPW8qUkMe8uVp7UBzfa/cpW28/DHuen5iajdUWsv69mZ9PwNNNuSNO9YxlM0NxSUDmAoQtN1/Tk3yUO1z03IhHXcCM9AFZ0gA",
        "https://twitter.com/kaiba51480780"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetDark20200627,
        "[泉]霧亜、アルシャロ、ブラミの鉄壁",
        "C4VwTgdg7glgJgUwLwFsCGAHJAGAPgRlz0JINwCYiCAuECGYAfQWyQFZtL98B2ANlwBaQgBY2A7jx4F82AJwyeADgLYeIoYWGaylStu15DOo4Tzmqpk7hF42NsqSe16TBPiQipM7Cu1jibF8fBTk2aTYAZg1iHQV7LUSqY20ki3SdMxs7XEjHfJIXBmZyTz4VWTkrANVg7nlcHkiSNRVY1JyklKztfSyMqyzbXHsuAscit0jPJQl8aJlI+xFykbr5gSbCcsp2wgqdAx7j3OsBzKph5aonCbpihBEkJYVZgRF8ZdW5Hns2OQ0cm4uHK9iOOgECUOJ2qZ0syTS2RGp1it3wk2YbCQ5CUy2W+EoKxUHBUSjkm2ajXIAj2qhBCOseSsYP68MGlxyu3GhQAzkxpmxqHzGE90cKsWKmEokDwhUw5Eg+HLGLIZcrPkhJSq+Ox1TxNerpYLhfgFVryKxzR5zaUtZF9UrhZEFcamB8DQBuUCQRisdBYVnCDEsHAOIas84WSh5YyRihsnT2bDBjx4PJZKIJuOEuHnLkWbQRYOlPBjOw0rMJ6O5qsJ7TvYPTPAxKh8CtxqPx2OV/MM+yRYNPNPwkS9jvxvqVzsZfwUYNY0vwvgKcedyfjscUADUhHTyqbp1dItDpeVC5uyulsWTwoV6XVrGH5HV595THwOubuT1ob0htDGjPiad5kEeFqhn8yrkKm8ZgSWDhHvaEE0E6IFJsq7oxkk6IekAA===",
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetDark20200809,
        "[泉]害悪補助親子",
        "C4VwTgdg7glgJgUwLwFsCGAHJAGAPgRlzz0MLwGYiCAuECGYAfQWyXwDZ2CBOb3b7AFZ+ggCz8A7IW6CATLgnY8g-BKqUAtKTzytuPXpLF9ZE1WPG9p0ctzjSBR6Vr0mCfElnY+s0cNGylKLsABy4clzsXgpK4eSUFGb4ibqEhgSWDukWVFZUNuG4lA4lNHQMzLJIotyk+CoE9fLB8oLs0oJ4AnyCvOpJieIGpul6qeYTeMP5tvKlJS4VCORInXOqXHrBYfiqarvejRI72BJDaRcZhYSaI3dFZjmZj3a2805lrsyi1diUMv4OCIuBFwtxxDI1IIzmZpslcPJxqN7udJhNpngCv4qO98Is3IJPBJEfhxKJ4nZQnFKL1xKFhMluGFElZZnYXsjCtk0RjXtccR9nABnJgrQTUEWMH54yWEmVMCRICQSpghJUqxjcdWS5Lapj1NgajirI2K+WMfBq8U6rXmryGyWyDx2qrm8iK5WS0TO6gAblAkEYrHQWBIuTx5TcrExjmUpieaMo4wTxnj4ce+OYHkSpgaKcTCJe+bTU0u2EzCCqOlj4S4+ZyiKLaLDOQxFZWYes4nrE0b3ITJdhZArPxjxmCzcnfcHOUHbcjzEJLaoecnDcL-bRc7LGo7K41o8K5dlOHMGsVxnIGrViWPTC1tivOujhbvFqXjmt+vYp5pptPrRGje7JfhaD44hq9q2KIkHZoUoGyFWVCyLuF7XAeHi3EkfpAA"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetDark20200822,
        "[溶岩]遠距離受け耐久盛り盛りクロム",
        "C4VwTgdg7glgJgUwLwFsCGAHJBOAPgRlwAZiCySBmU-ALhAhmAH0EikAWbQ-fAVm74AmXOwBswgBxFeubLxI8J7XLwDsosgFpC23Bpk7DpXSRO4zJS8aMl2JGcO5knteoxb4kEwhSq72qqq4EoIyvBJ4+ETRBETYElpGUSq4wrpmeKZOFqRWZoR2KS7OznQMzAiCSBSChNjYJKoRIqIJ6hqiFB0SMq0G5kYyCgMjWdapo7lT6YQK9tQlLmXuCBQcvBr1c6IFrbjtKtjKfXpSIzOxpGk2k7p+s1N5N4UOC8Wu5SzsHPjC2KrKdiCQHiYLSWTqAj4JR6LqJEbJfoXMZjZQ5Kwo0gvciLUpuCq8HAJQSiNG7II8QJQuJQmG8QQJIy6RHwsxswgydHTB62eZWd4EGgAZ2Ya14wuY31oIqYhOlzFUHAlTAkSHFMp4So1cuV+FEat1ivlTGhBo12CQxsEbCtnitVWNXUtyooivYyvYdpoAG5QJAmGx0FhhlllhU2CRHKR5I9Y1ZhNc41MeeMTGGPEhhg9eMoMUnKBMuXmU2M0-iWFV+VchvmpgnJnmq3nkenVpmJlYgbW8-Wi8nYy3ywhviGsRpG0neyXY9PB58EISJ+wEhOJ1R7t2cU9Ri727YPXvcBRlYuUkRlYr5sbVfHdZ4C+fte2qMa9e2fIb36ldTeJoJdRa8zqsw1rtsowFMLUX4QYIlYpMeMpOrY36IZeIjEB6ngbsyPpAA"
    ),
];

let _offenseAstraPresetId = 0;
const AetherRaidOffensePresetOptions_AstraSeason = [
    new AetherRaidDefensePresetInfo(
        _offenseAstraPresetId++,
        "フレン&ブルーニャ",
        "C4VwTgdg7glgJgUwLwgjYB9AhgBiQVgA4BGAH2Px33IDYcbzKB2UgTibJoGYvSbDq/agCZSOMeXHUAtGVml54xQrLjVE8ZpWlR4gCxSdfcibJmxAOj2WaALlTpsxJFxJtivPcWt7+pfMIMNPhkrBSkTDgs8jFmhnIJEsryiVpp2soG/hIM5nmW+NQ4Fvj2aJhYwkh6AZJ6ol68xDh6TS3W+KwMkQz4XKwZic2k1onJ6vKiyulKqSOG1rmmy8U1NmWOWFxIdGr4XiPCohT1bMIsrLU0NAN9vLHaw/djE6+kzxqfs9r6hrxL+VUJUsNQ2FT0BCYTT0hEI5BhAxSOCOkkC8NY4n43wewzUgySb2s0y++N+2UEy3yxV4xSYpQcFXw1RCdTIjRGNFEhA4bFY1gxAyYQqMWmGwymZBpP201HUM20unm2U4lJWVgKpQA3KBIBg8AzsHhxKIGJjTST5cdpfLjRI3nCimIwU4kFpzacbSTRBKLZ9FW9HZpnZVXSNjPoWJ70t7rb7/QTlRpg9txP8JHprFHPrwPlmpW8GIqcMGIYZ3YHfVpFcT5eoC+8kwasEy8eaoZWvUYayS6wmWJmnZqgA=",
    ),
    new AetherRaidDefensePresetInfo(
        _offenseAstraPresetId++,
        "伝エガ&リリス",
        "C4VwTgdg7glgJgUwLwgjYB9AhgBiQVhwBYAfARjIA4BmEos2ogNkvJzIE4T9KuLLS+AOykATCRwSpkgLRkSchfNnz8DErUnLpOxeMlFJ+EuKblz8yxIB0xnLfwAuVOmxkk1SvI7r6pZqz4omZMaiQ+xkI4QkqximRG5oqKKlLxsZKZuvIpdImSZlZFNvh2ts5omFiiSERBbETi9LQJRC3EghxmUWb41FzJOZYGSUNp2noZOlmDUobcdCSFFiv2dTZMFa5Y1EhMOFr49HSi4mRH4hyiMRz1TExcfbSz8ZLPY7mf8u/T2VPzxloy2KylsNjqWyqRAIQhaREorDI8IGw1ObGC5CIHAKlFSswSUg+E2JC1yWRmYwMiWMwJWoM01iEThcVXwBHUDBwTV8XXRiOoOBaAtICSErH0hK0WlimlihFIjHM5L+uQB5lpxXsZi1TgA3KBIBg8CzsHhJKYpPguMqbVIJWTfubCeMSIFpJC3EgstqTo6/eJxA7bRKSXZ3Sbql7Fj6iDFbcGTFN44npaljNocB6dlGgXNSMnlbQfgWNM7UmYJZmI9DEjGwyWnakS9oSWZZVXKtg2dKfVE/bbvkm/S2XTF8xJHLqgA=",
    ),
];

let _offenseLightPresetId = 0;
const AetherRaidOffensePresetOptions_LightSeason = [
    new AetherRaidDefensePresetInfo(
        _offenseLightPresetId++,
        "W伝承リーフ",
        "C4VwTgdg7glgJgUwLwgjYB9AhgBiQZgEYA2AHwA5DzSAWQm246gVgCYzzidSB2H/XjgCcpALSExE8b1ICp80t2aLJK6dw0ru09bSWlWpMhJOlTOAHStll5swBcqdNkJIazYzmbVCOYhJomXiFuYnwyHj8jcm0FaWVDWNUkpIVNdNVdGn0JYzN88wsBS3dHNEwsViQ2BkJ8Zm46ARoeMjZlZiEROrZBHkyFZvydCRTVQ10MpKz9BjzTQv7LHjLnLHw3fG6cVka6sx2THcNiMN5WEWYaQzkDA/u40eTVAUmtNTS9UmUBeYL82yKCylJwVGibba7Wj7XysCRsfqdMinbY8ai3Qy+B4DD64hhvDIjFTZb4qP4LIE2YEOUHYZhIfwmbwKQjeCYSTj9EIiaQY96PXFJZQE95Exr6IkUwrFCw8BwAblAkAweFpuCQ3BOxKeU3emruIoyTyeYq0qwqrm4uWJIl1usM7L1TuNuIJ5uwVUaRmJDDtTodzz9LumOsU7vWGtk3tCob93AEr1jzpUJs+GnD4M0ZBjTr9CcDuYBRdN6bV9MTzyuhd1t0N/JTrtj9nlQA==",
    ),


];


function findAetherRaidDefensePreset(id) {
    for (let option of AetherRaidDefensePresetOptions_DarkSeason) {
        if (option.id == id) {
            return option;
        }
    }
    for (let option of AetherRaidDefensePresetOptions_AnimaSeason) {
        if (option.id == id) {
            return option;
        }
    }
    return null;
}
/// @file
/// @brief AppData クラスとそれに関連するクラスや関数等の定義です。

/// 全ての英雄情報を格納するデータベースです。
class HeroDataBase {
    constructor(heroInfos) {
        this._heroInfos = heroInfos;
        this._nameToInfoDict = {};
        for (let info of heroInfos) {
            this._nameToInfoDict[info.name] = info;
        }

        this._nameToIndexDict = {};
        for (let i = 0; i < this._heroInfos.length; ++i) {
            let info = this._heroInfos[i];
            this._nameToIndexDict[info.name] = i;
        }
    }

    get data() {
        return this._heroInfos;
    }

    get length() {
        return this._heroInfos.length;
    }

    get(index) {
        return this._heroInfos[index];
    }

    findIcon(name) {
        let info = this.findInfo(name);
        if (info == null) {
            return null;
        }
        return info.icon;
    }

    findInfo(name) {
        return this._nameToInfoDict[name];
    }

    findIndexOfInfo(name) {
        return this._nameToIndexDict[name];
    }
}


function createUnitViewModel(id, unitGroupType) {
    return new Unit(id, "", unitGroupType, MoveType.Infantry, "", 1);
}

function __registerSkillOptions(options, infos) {
    for (let info of infos) {
        options.push({ id: info.id, text: info.name });
    }
}
function __registerPassiveSOptions(options, infos) {
    for (let info of infos) {
        if (info.isSacredSealAvailable) {
            options.push({ id: info.id, text: info.name });
        }
    }
}
function __findSkillInfo(skillInfos, id) {
    for (let info of skillInfos) {
        if (info.id == id) {
            return info;
        }
    }

    return null;
}

const TabChar = "&emsp;&emsp;";
const g_idGenerator = new IdGenerator();
const g_deffenceStructureContainer = new StructureContainer('deffenceStructureContainer');
const g_offenceStructureContainer = new StructureContainer('offenceStructureContainer');

const OcrSettingTarget = {
    SelectedTarget: 0,
    AllEnemies: 1,
    AllAllies: 2,
    MapStructures: 3,
};

const SettingCompressMode = {
    None: 0,
    Utf16: 1,
    Base64: 2,
    Uri: 3,
};

const ItemType = {
    None: -1,
    RakuraiNoJufu: 0,
    KobuNoTsunobue: 1,
    KogunNoBoots: 2,
    Tokkoyaku: 3,
    OugiNoYaiba: 4,
    OdorikoNoVeru: 5,
};
function getItemTypeName(itemType) {
    switch (itemType) {
        case ItemType.RakuraiNoJufu: return "落雷の呪符";
        case ItemType.KobuNoTsunobue: return "鼓舞の角笛";
        case ItemType.KogunNoBoots: return "行軍のブーツ";
        case ItemType.Tokkoyaku: return "特効薬";
        case ItemType.OugiNoYaiba: return "奥義の刃";
        case ItemType.OdorikoNoVeru: return "踊り子のヴェール";
        default: return "不明なアイテム";
    }
}

const GameMode = {
    AetherRaid: 0,
    Arena: 1,
    AllegianceBattles: 2,
    ResonantBattles: 3,
    TempestTrials: 4,
    PawnsOfLoki: 5,
};

// 選択モード
const SelectMode = {
    Normal: 0,
    Tile: 1, // タイル編集用
};
const SelectModeOptions = [
    { text: "通常", id: SelectMode.Normal },
    { text: "地形編集", id: SelectMode.Tile },
];

const PawnsOfLokiDifficality = {
    Begginer: 0,
    Intermediate: 1,
    Advanced: 2,
};

const PawnsOfLokiDifficalityOptions = [
    { text: "初級", id: PawnsOfLokiDifficality.Begginer },
    { text: "中級", id: PawnsOfLokiDifficality.Intermediate },
    { text: "上級", id: PawnsOfLokiDifficality.Advanced },
];

function getPawnsOfLokiDifficalityScore(difficality) {
    switch (difficality) {
        case PawnsOfLokiDifficality.Begginer: return 215;
        case PawnsOfLokiDifficality.Intermediate: return 315;
        case PawnsOfLokiDifficality.Advanced: return 415;
        default: throw new Error("unexpected defficality");
    }
}

const MaxEnemyUnitCount = 12;
const MaxAllyUnitCount = 20;

/// シミュレーターの持つデータです。
class AppData {
    constructor() {
        this.gameVersion = 360;
        this.gameVersionOptions = [{ label: "3.6.0(2019/6のアプデ後)", value: 360 },];
        this.gameMode = GameMode.AetherRaid;
        this.gameModeOptions = [
            { label: "飛空城", value: GameMode.AetherRaid },
            { label: "闘技場", value: GameMode.Arena },
            // { label: "フレンドダブル", value: GameMode.AllegianceBattles },
            { label: "双界を越えて", value: GameMode.ResonantBattles },
            { label: "戦渦の連戦", value: GameMode.TempestTrials },
            { label: "ロキの盤上遊戯", value: GameMode.PawnsOfLoki },
        ];
        this.mapKind = MapType.Izumi;
        this.mapKindOptions = [
            { label: "泉の城", value: MapType.Izumi },
            { label: "氷雪の城", value: MapType.Hyosetsu },
            { label: "廃墟の城", value: MapType.Haikyo },
            { label: "雪化粧の城", value: MapType.Yukigesho },
            { label: "砂漠の城", value: MapType.Sabaku },
            { label: "春風の城", value: MapType.Harukaze },
            { label: "木漏れ日の城", value: MapType.Komorebi },
            { label: "忘れられた城", value: MapType.Wasurerareta },
            { label: "夏草の城", value: MapType.Natsukusa },
            { label: "灼熱の城", value: MapType.Syakunetsu },
        ];
        this.aetherRaidMenuStyle = "";

        this.audioManager = new AudioManager();

        // 査定
        this.arenaScore = 0;
        this.primeArenaScore = 0;
        this.arenaScoreForEnemy = 0;
        this.primeArenaScoreForEnemy = 0;

        this.aetherRaidDefenseLiftLoss = 0; // 飛空城防衛失敗レート

        // 双界
        this.resonantBattleInterval = 1; // 双位
        this.resonantBattleItems = [];

        // シーズン設定
        this.isLightSeason = true;
        this.isAstraSeason = false;
        this.isFireSeason = false;
        this.isEarthSeason = false;
        this.isWindSeason = false;
        this.isWaterSeason = false;

        // シリアライズ設定
        this.settingCompressMode = SettingCompressMode.None;
        this.settingCompressModeOptions = [
            { id: SettingCompressMode.None, text: "未圧縮" },
            // { id: SettingCompressMode.Utf16, text: "UTF-16形式" },
            { id: SettingCompressMode.Base64, text: "Base64形式" },
            { id: SettingCompressMode.Uri, text: "URIで使用可能な形式" },
        ];
        this.exportSettingText = "";
        this.exportsEnemySettings = true;
        this.exportsAllySettings = true;
        this.exportsDefenceSettings = true;
        this.exportsOffenceSettings = true;
        this.exportsMapSettings = false;

        // 画像解析設定
        this.ocrProgress = "";
        this.ocrResult = "";
        this.ocrCropX = 0;
        this.ocrCropY = 0;
        this.ocrSettingTarget = OcrSettingTarget.AllEnemies;
        this.showOcrImage = false;
        this.debugTemplateIndex = -1;
        this.debugTemplateCount = 1;
        this.currentTemplateIndex = 0;
        this.corrThresholdRate = 0.85;
        this.ignoresUnitTileForAutoMapReplace = false;
        this.templateMatchMethod = 5;
        this.templateMatchMethodOptions = [
            { text: "TM_SQDIFF", id: 0 },
            { text: "TM_SQDIFF_NORMED", id: 1 },
            { text: "TM_CCORR", id: 2 },
            { text: "TM_CCORR_NORMED", id: 3 },
            { text: "TM_CCOEFF", id: 4 },
            { text: "TM_CCOEFF_NORMED", id: 5 },
        ];
        this.imageSizeShrinkDiv = 4;
        this.useWhitelistForOcr = false;

        // おまかせ設定
        this.limitsExamineRangeToMovableRange = false;
        this.limitsExamineRangeToThreatenedRange = false;
        this.limitsExamineRangeToNoTrapTiles = true;

        // ミョルニル査定計算設定
        this.mjolnirsStrikeTier = 1;
        this.mjolnirsStrikeMajorSeason = SeasonType.None;
        this.mjolnirsStrikeMinorSeason = SeasonType.None;
        this.mjolnirsStrikeSeasonOptions = [
            { id: SeasonType.None, text: "なし" },
            { id: SeasonType.Light, text: "光" },
            { id: SeasonType.Dark, text: "闇" },
            { id: SeasonType.Astra, text: "天" },
            { id: SeasonType.Anima, text: "理" },
        ];

        // 偶像の天楼のスキルシミュレーター用
        this.hallOfFormsSkillSimWeapon = Weapon.None;
        this.hallOfFormsSkillSimSupport = Support.None;
        this.hallOfFormsSkillSimSpecial = Special.None;
        this.hallOfFormsSkillSimPassiveA = PassiveA.None;
        this.hallOfFormsSkillSimPassiveB = PassiveB.None;
        this.hallOfFormsSkillSimPassiveC = PassiveC.None;
        this.hallOfFormsSkillSimPassiveS = PassiveS.None;

        // ロキの盤上遊戯の設定
        this.pawnsOfLokiTotalScore = 0;
        this.pawnsOfLokiDifficality = PawnsOfLokiDifficality.Advanced;
        this.pawnsOfLokiMaxWeaponTypeBonusA = 0;
        this.pawnsOfLokiMaxWeaponTypeBonusB = 0;
        this.pawnsOfLokiMaxMoveTypeBonus = 0;
        this.pawnsOfLokiMaxMoveTypePairBonus = 0;
        this.pawnsOfLokiTurnCount = 12;
        this.pawnsOfLokiWarFunds = 0;
        this.pawnsOfLokiRank = 10;
        this.pawnsOfLokiMaxComboPatternCount = 0;

        // その他の設定

        this.rbEnemySettingInputHp = 0;
        this.rbEnemySettingInputAtk = 0;
        this.rbEnemySettingInputSpd = 0;
        this.rbEnemySettingInputDef = 0;
        this.rbEnemySettingInputRes = 0;

        this.selectMode = SelectMode.Normal;

        // 耐久、殲滅力テスト
        this.durabilityTestAllyUnitId = "";
        this.durabilityTestEnemyUnitId = "";
        this.durabilityTestLog = "結果がここに表示されます";
        this.durabilityTestChargesSpecialCount = false;
        this.durabilityTestDefaultSpecial = Special.None;
        this.durabilityTestCalcPotentialDamage = false;
        this.durabilityTestBattleCount = 1;
        this.durabilityTestIsAllyUnitOffence = false;
        this.durabilityTestHealsHpFull = true;
        this.durabilityTestLogDamageCalcDetailIfLose = false;
        this.durabilityTestIsLogEnabled = true;
        this.durabilityTestEquipAllDistCounter = false;
        this.durabilityTestAppliesSkillsForBeginningOfTurn = false;

        // 飛空城防衛、攻撃プリセット
        this.aetherRaidDefensePreset = 0;
        this.aetherRaidDefensePresetDescription = "";
        this.resetCurrentAetherRaidDefensePreset();
        this.aetherRaidOffensePresetIndex = 0;

        // その他
        this.changesBgmRandomly = true;
        this.showMovableRangeWhenMovingUnit = true;
        this.currentTurn = 0;
        this.currentTurnType = UnitGroupType.Ally;

        this.isEnemyActionTriggered = true;
        this.isAutoLoadTurnSettingEnabled = false;
        this.simulatesEnemyActionOneByOne = true;
        this.isCommandUndoable = true;
        this.autoChangeDetail = true;
        this.currentItemIndex = -1;
        this.attackerUnitIndex = 6;
        this.attackTargetUnitIndex = 0;
        this.attackerInfo = "";
        this.attackTargetInfo = "";
        this.damageCalcLog = "";
        this.simpleLog = "";
        this.isPotentialDamageDetailEnabled = false;

        this.enableAllSkillOptions = false; // スキルを継承可能なものだけに制限しない
        this.disableLowRankSkillOptions = false; // 下位スキルを表示する

        this.showDetailLog = true;
        this.isDebugMenuEnabled = DebugModeDefault;
        this.debugMenuStyle = "";
        this.attackInfoTdStyle = "";
        this.units = [];
        for (let i = 0; i < MaxEnemyUnitCount; ++i) {
            this.units.push(createUnitViewModel("e" + i, UnitGroupType.Enemy));
        }
        for (let i = 0; i < MaxAllyUnitCount; ++i) {
            this.units.push(createUnitViewModel("a" + i, UnitGroupType.Ally));
        }
        this.enemyUnits = [];
        this.allyUnits = [];
        this.updateEnemyAndAllyUnits();

        this.durabilityTestAllyUnitId = this.allyUnits[0].id;
        this.durabilityTestEnemyUnitId = this.enemyUnits[0].id;

        this.heroOptions = [
            { id: -1, text: "なし" },
        ];
        this.ivStateOptions = [
            { id: StatusType.None, text: "なし" },
            { id: StatusType.Hp, text: "HP" },
            { id: StatusType.Atk, text: "攻撃" },
            { id: StatusType.Spd, text: "速さ" },
            { id: StatusType.Def, text: "守備" },
            { id: StatusType.Res, text: "魔防" },
        ];
        this.selectionOptions = [
            { id: -1, text: "未選択" },
            { id: 0, text: "敵A" },
            { id: 1, text: "敵B" },
            { id: 2, text: "敵C" },
            { id: 3, text: "敵D" },
            { id: 4, text: "敵E" },
            { id: 5, text: "敵F" },
            { id: 6, text: "味方A" },
            { id: 7, text: "味方B" },
            { id: 8, text: "味方C" },
            { id: 9, text: "味方D" },
            { id: 10, text: "味方E" },
        ];
        this.moveTypeOptions = [
            { id: MoveType.Infantry, text: "歩行" },
            { id: MoveType.Flying, text: "飛行" },
            { id: MoveType.Cavalry, text: "騎馬" },
            { id: MoveType.Armor, text: "重装" },
        ];

        this.blessingOptions = [
            { id: BlessingType.None, text: "なし" },
            { id: BlessingType.Hp5_Atk3, text: "HP+5、攻撃+3" },
            { id: BlessingType.Hp5_Spd4, text: "HP+5、速さ+4" },
            { id: BlessingType.Hp5_Def5, text: "HP+5、守備+5" },
            { id: BlessingType.Hp5_Res5, text: "HP+5、魔防+5" },
            { id: BlessingType.Hp3_Atk2, text: "HP+3、攻撃+2" },
            { id: BlessingType.Hp3_Spd3, text: "HP+3、速さ+3" },
            { id: BlessingType.Hp3_Def4, text: "HP+3、守備+4" },
            { id: BlessingType.Hp3_Res4, text: "HP+3、魔防+4" },
            { id: BlessingType.Hp3, text: "HP+3" },
        ];
        this.seasonOptions = [
            { id: SeasonType.None, text: "なし" },
            { id: SeasonType.Light, text: "光" },
            { id: SeasonType.Dark, text: "闇" },
            { id: SeasonType.Astra, text: "天" },
            { id: SeasonType.Anima, text: "理" },
            { id: SeasonType.Fire, text: "火" },
            { id: SeasonType.Water, text: "水" },
            { id: SeasonType.Wind, text: "風" },
            { id: SeasonType.Earth, text: "地" },
        ];
        this.weaponRefinementOptions = [
            { id: WeaponRefinementType.None, text: "錬成なし" },
            { id: WeaponRefinementType.Special, text: "特殊" },
            { id: WeaponRefinementType.Special_Hp3, text: "特殊、HP+3" },
            { id: WeaponRefinementType.Hp5_Atk2, text: "HP+5、攻撃+2" },
            { id: WeaponRefinementType.Hp5_Spd3, text: "HP+5、速さ+3" },
            { id: WeaponRefinementType.Hp5_Def4, text: "HP+5、守備+4" },
            { id: WeaponRefinementType.Hp5_Res4, text: "HP+5、魔防+4" },
            { id: WeaponRefinementType.Hp2_Atk1, text: "HP+2、攻撃+1" },
            { id: WeaponRefinementType.Hp2_Spd2, text: "HP+2、速さ+2" },
            { id: WeaponRefinementType.Hp2_Def3, text: "HP+2、守備+3" },
            { id: WeaponRefinementType.Hp2_Res3, text: "HP+2、魔防+3" },
            { id: WeaponRefinementType.WrathfulStaff, text: "神罰の杖" },
            { id: WeaponRefinementType.DazzlingStaff, text: "幻惑の杖" },
        ];
        this.summonerLevelOptions = [
            { id: SummonerLevel.None, text: "なし" },
            { id: SummonerLevel.C, text: "C" },
            { id: SummonerLevel.B, text: "B" },
            { id: SummonerLevel.A, text: "A" },
            { id: SummonerLevel.S, text: "S" },
        ];
        this.partnerLevelOptions = [
            { id: PartnerLevel.None, text: "なし" },
            { id: PartnerLevel.C, text: "C" },
            { id: PartnerLevel.B, text: "B" },
            { id: PartnerLevel.A, text: "A" },
            { id: PartnerLevel.S, text: "S" },
        ];
        this.weaponOptions = [
            { id: -1, text: "なし" }
        ];
        this.supportOptions = [
            { id: -1, text: "なし" }
        ];
        this.specialOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveAOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveBOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveCOptions = [
            { id: -1, text: "なし" }
        ];
        this.passiveSOptions = [
            { id: -1, text: "なし" }
        ];

        this.ornamentTypeOptions = [
        ];
        for (let i = 0; i < OrnamentSettings.length; ++i) {
            let setting = OrnamentSettings[i];
            this.ornamentTypeOptions.push({ id: i, text: setting.label });
        }

        this.templateImageFiles = [];

        this.templateBlessingImageFiles = [
            { id: SeasonType.Anima, fileName: "Blessing_Anima.png" },
            { id: SeasonType.Dark, fileName: "Blessing_Dark.png" },
            { id: SeasonType.Astra, fileName: "Blessing_Astra.png" },
            { id: SeasonType.Light, fileName: "Blessing_Light.png" },
            { id: SeasonType.Fire, fileName: "Blessing_Fire.png" },
            { id: SeasonType.Wind, fileName: "Blessing_Wind.png" },
            { id: SeasonType.Water, fileName: "Blessing_Water.png" },
            { id: SeasonType.Earth, fileName: "Blessing_Earth.png" },
        ];

        this.templateWeaponRefinementImageFiles = [
            { id: WeaponRefinementType.Hp5_Atk2, fileName: "WeaponRefine_Atk.png" },
            { id: WeaponRefinementType.Hp5_Spd3, fileName: "WeaponRefine_Spd.png" },
            { id: WeaponRefinementType.Hp5_Def4, fileName: "WeaponRefine_Def.png" },
            { id: WeaponRefinementType.Hp5_Res4, fileName: "WeaponRefine_Res.png" },
            { id: WeaponRefinementType.WrathfulStaff, fileName: "WeaponRefine_WrathfulStaff.png" },
            { id: WeaponRefinementType.DazzlingStaff, fileName: "WeaponRefine_DazzlingStaff.png" },
        ];

        this.mapImageFiles = AetherRaidMapImageFiles;
        this.arenaMapImageFiles = ArenaMapImageFiles;

        this.weaponCount = 0;
        this.weaponImplCount = 0;
        this.supportCount = 0;
        this.supportImplCount = 0;
        this.specialCount = 0;
        this.specialImplCount = 0;
        this.passiveACount = 0;
        this.passiveAImplCount = 0;
        this.passiveBCount = 0;
        this.passiveBImplCount = 0;
        this.passiveCCount = 0;
        this.passiveCImplCount = 0;
        this.passiveSCount = 0;
        this.passiveSImplCount = 0;
        this.commandQueuePerAction = new CommandQueue(100);
        this.commandQueue = new CommandQueue(100);

        this.heroInfos = null;
        this.weaponInfos = [];
        this.supportInfos = [];
        this.specialInfos = [];
        this.passiveAInfos = [];
        this.passiveBInfos = [];
        this.passiveCInfos = [];
        this.passiveSInfos = [];
        this.skillIdToInfoDict = {};
        this.skillNameToInfoDict = {};

        this.isCombatOccuredInCurrentTurn = false; // 現在のターンで戦闘が発生したかどうか

        {
            // 生成順を変えるとIDが変わってしまうので注意
            this.defenseStructureStorage = new Storage(g_idGenerator.generate());
            this.offenceStructureStorage = new Storage(g_idGenerator.generate());
            this.createStructures();
            this.map = new Map(g_idGenerator.generate(), this.mapKind, this.gameVersion);
            this.map.isExpansionUnitFunc = x => {
                return this.isSpecialSlotUnit(x);
            };
        }

        this.addStructuresToSelectionOptions();
        this.registerTemplateImages();
        this.applyDebugMenuVisibility();
        this.updateTargetInfoTdStyle();
    }

    setAllSeasonEnabled() {
        this.isLightSeason = true;
        this.isAstraSeason = true;
        this.isFireSeason = true;
        this.isEarthSeason = true;
        this.isWindSeason = true;
        this.isWaterSeason = true;
    }

    getEnemyExpansionUnitOnMap() {
        if (this.gameMode != GameMode.AetherRaid) {
            return null;
        }

        let lastSlotIndex = this.enemyUnits.length - 1;
        for (let unit of this.enemyUnits) {
            if (unit.isOnMap && unit.slotOrder == lastSlotIndex) {
                return unit;
            }
        }

        return null;
    }

    isSpecialSlotUnit(unit) {
        if (this.gameMode != GameMode.AetherRaid) {
            return false;
        }

        let lastSlotIndex = this.allyUnits.length - 1;
        if (unit.groupId == UnitGroupType.Enemy) {
            lastSlotIndex = this.enemyUnits.length - 1;
        }
        return unit.slotOrder == lastSlotIndex;
    }

    setPawnsOfLokiTurnCountByRank() {
        this.pawnsOfLokiTurnCount = this.__getPawnsOfLokiTurnCountOfRank();
    }

    __getPawnsOfLokiTurnCountOfRank() {
        switch (this.pawnsOfLokiRank) {
            case 1:
            case 2: // 不明
            case 3: // 不明
                return 9;
            case 4:
            case 5:
            case 6:
                return 10;
            case 7: // 不明
            case 8:
                return 11;
            case 9:
            case 10:
                return 12;

        }
    }

    getPawnsOfLokiDifficalityScore() {
        return getPawnsOfLokiDifficalityScore(this.pawnsOfLokiDifficality);
    }
    get totalSkillCount() {
        return this.weaponCount
            + this.supportCount
            + this.specialCount
            + this.passiveACount
            + this.passiveBCount
            + this.passiveCCount
            + this.passiveSCount;
    }
    get totalImplementedSkillCount() {
        return this.weaponImplCount
            + this.supportImplCount
            + this.specialImplCount
            + this.passiveAImplCount
            + this.passiveBImplCount
            + this.passiveCImplCount
            + this.passiveSImplCount;
    }

    initHeroInfos(heroInfos) {
        this.heroInfos = new HeroDataBase(heroInfos);
    }

    __registerInfosToDict(skillInfos) {
        for (let info of skillInfos) {
            this.skillIdToInfoDict[info.id] = info;
            this.skillNameToInfoDict[info.name] = info;
        }
    }

    registerSkillOptions(weapons, supports, specials, passiveAs, passiveBs, passiveCs, passiveSs) {
        this.weaponInfos = weapons;
        this.supportInfos = supports;
        this.specialInfos = specials;
        this.passiveAInfos = passiveAs;
        this.passiveBInfos = passiveBs;
        this.passiveCInfos = passiveCs;
        this.passiveSInfos = passiveSs;

        this.__registerInfosToDict(weapons);
        this.__registerInfosToDict(supports);
        this.__registerInfosToDict(specials);
        this.__registerInfosToDict(passiveAs);
        this.__registerInfosToDict(passiveBs);
        this.__registerInfosToDict(passiveCs);
        this.__registerInfosToDict(passiveSs);

        __registerSkillOptions(this.weaponOptions, weapons);
        __registerSkillOptions(this.supportOptions, supports);
        __registerSkillOptions(this.specialOptions, specials);
        __registerSkillOptions(this.passiveAOptions, passiveAs);
        __registerSkillOptions(this.passiveBOptions, passiveBs);
        __registerSkillOptions(this.passiveCOptions, passiveCs);
        __registerSkillOptions(this.passiveSOptions, passiveSs);
        __registerPassiveSOptions(this.passiveSOptions, passiveAs);
        __registerPassiveSOptions(this.passiveSOptions, passiveBs);
        __registerPassiveSOptions(this.passiveSOptions, passiveCs);
    }
    __updateUnitSkillInfo(unit) {
        unit.weaponInfo = this.findSkillInfoByDict(unit.weapon);
        unit.supportInfo = this.findSkillInfoByDict(unit.support);
        unit.specialInfo = this.findSkillInfoByDict(unit.special);
        unit.passiveAInfo = this.findSkillInfoByDict(unit.passiveA);
        unit.passiveBInfo = this.findSkillInfoByDict(unit.passiveB);
        unit.passiveCInfo = this.findSkillInfoByDict(unit.passiveC);
        unit.passiveSInfo = this.findSkillInfoByDict(unit.passiveS);
    }

    findSkillInfoByDict(id) {
        return this.skillIdToInfoDict[id];
    }
    findSkillInfoByName(name) {
        let result = this.skillNameToInfoDict[name];
        if (result) {
            return result;
        }
        return null;
    }

    __findWeaponInfo(id) {
        return this.findSkillInfoByDict(id);
    }

    __findSupportInfo(id) {
        return this.findSkillInfoByDict(id);
    }

    __findSpecialInfo(id) {
        return this.findSkillInfoByDict(id);
    }

    __findPassiveAInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveBInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveCInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __findPassiveSInfo(id) {
        return this.findSkillInfoByDict(id);
    }
    __updateStatusByPassiveA(unit, skillId) {
        let skillInfo = this.findSkillInfoByDict(skillId);
        if (skillInfo == null) {
            return;
        }
        unit.maxHpWithSkillsWithoutAdd += skillInfo.hp;
        unit.atkWithSkills += skillInfo.atk;
        unit.spdWithSkills += skillInfo.spd;
        unit.defWithSkills += skillInfo.def;
        unit.resWithSkills += skillInfo.res;
    }
    __showStatusToAttackerInfo() {
        let unit = this.currentUnit;
        if (unit == null) { return; }
        let info = "HP:" + unit.hp + "/" + unit.maxHpWithSkills + "(" + unit.hpPercentage + "%)<br/>"
            + "攻:" + unit.getAtkInPrecombat()
            + " 速:" + unit.getSpdInPrecombat()
            + " 守:" + unit.getDefInPrecombat()
            + " 魔:" + unit.getResInPrecombat();
        if (unit.groupId == UnitGroupType.Ally) {
            // this.attackerInfo = info;
        } else {
            // this.attackTargetInfo = info;
        }
    }
    __updateStatusBySkillsAndMergeForAllHeroes(updatesPureGrowthRate = false) {
        for (let unit of this.enumerateUnits()) {
            if (unit.heroInfo == null) {
                this.initializeByHeroInfo(unit, unit.heroIndex);
            }
            this.__updateStatusBySkillsAndMerges(unit, updatesPureGrowthRate);
        }
    }
    __updateStatusBySkillsAndMerges(unit, updatesPureGrowthRate = false) {
        this.__updateUnitSkillInfo(unit);

        unit.updateBaseStatus(updatesPureGrowthRate);

        unit.maxHpWithSkillsWithoutAdd = unit.hpLvN;
        unit.atkWithSkills = Math.floor(Number(unit.atkLvN) * Number(unit.atkMult) + Number(unit.atkAdd));
        unit.spdWithSkills = Math.floor(Number(unit.spdLvN) * Number(unit.spdMult) + Number(unit.spdAdd));
        unit.defWithSkills = Math.floor(Number(unit.defLvN) * Number(unit.defMult) + Number(unit.defAdd));
        unit.resWithSkills = Math.floor(Number(unit.resLvN) * Number(unit.resMult) + Number(unit.resAdd));

        // 個体値と限界突破によるステータス上昇
        unit.updateStatusByMergeAndDragonFlower();

        // 祝福効果
        {
            unit.clearBlessingEffects();
            for (let ally of this.enumerateUnitsInTheSameGroup(unit, false)) {
                if (!this.isBlessingEffectEnabled(unit, ally)) {
                    continue;
                }
                let heroInfo = ally.heroInfo;
                if (heroInfo == null) {
                    continue;
                }
                unit.addBlessingEffect(heroInfo.blessingType);
            }

            unit.updateStatusByBlessing();
        }

        // 武器錬成
        unit.updateStatusByWeaponRefinement();

        // 召喚士との絆
        unit.updateStatusBySummonerLevel();

        unit.updateStatusByWeapon();

        if (unit.passiveA != PassiveA.None) {
            this.__updateStatusByPassiveA(unit, unit.passiveA);
        }
        if (unit.passiveS != PassiveS.None) {
            this.__updateStatusByPassiveA(unit, unit.passiveS);
        }
        switch (unit.weapon) {
            case Weapon.SyunsenAiraNoKen:
                if (unit.isWeaponRefined) {
                    unit.atkWithSkills += 3;
                }
                break;
            case Weapon.Mistoruthin:
                if (unit.isWeaponSpecialRefined) {
                    unit.atkWithSkills += 3;
                    unit.spdWithSkills += 3;
                    unit.defWithSkills += 3;
                    unit.resWithSkills += 3;
                }
                break;
            case Weapon.KokouNoKen:
            case Weapon.Bashirikosu:
                if (unit.isWeaponSpecialRefined) {
                    unit.spdWithSkills += 5;
                    unit.atkWithSkills += 5;
                    unit.defWithSkills -= 5;
                    unit.resWithSkills -= 5;
                }
                break;
            case Weapon.Yatonokami:
                if (unit.weaponRefinement != WeaponRefinementType.None) {
                    unit.atkWithSkills += 2;
                    unit.spdWithSkills += 2;
                    unit.defWithSkills += 2;
                    unit.resWithSkills += 2;
                }
                break;
            case Weapon.BatoruNoGofu:
            case Weapon.HinataNoMoutou:
                if (unit.isWeaponSpecialRefined) {
                    unit.atkWithSkills += 3;
                    unit.spdWithSkills += 3;
                    unit.defWithSkills += 3;
                    unit.resWithSkills += 3;
                }
                break;
        }

        // 化身によるステータス変化
        if (unit.isTransformed) {
            switch (unit.weapon) {
                case Weapon.EbonPirateClaw:
                case Weapon.CrossbonesClaw:
                case Weapon.ResolvedFang:
                case Weapon.RefreshedFang:
                case Weapon.RenewedFang:
                case Weapon.RaydreamHorn:
                case Weapon.BrightmareHorn:
                case Weapon.NightmareHorn:
                case Weapon.BrazenCatFang:
                case Weapon.TaguelFang:
                case Weapon.TaguelChildFang:
                case Weapon.FoxkitFang:
                case Weapon.NewBrazenCatFang:
                case Weapon.NewFoxkitFang:
                case Weapon.KarasuOuNoHashizume:
                case Weapon.TakaouNoHashizume:
                case Weapon.YoukoohNoTsumekiba:
                case Weapon.JunaruSenekoNoTsumekiba:
                case Weapon.ShishiouNoTsumekiba:
                case Weapon.TrasenshiNoTsumekiba:
                case Weapon.JinroMusumeNoTsumekiba:
                case Weapon.JinroOuNoTsumekiba:
                case Weapon.OkamijoouNoKiba:
                case Weapon.ShirasagiNoTsubasa:
                case Weapon.SeijuNoKeshinHiko:
                case Weapon.BridesFang:
                case Weapon.GroomsWings:
                case Weapon.SkyPirateClaw:
                case Weapon.TwinCrestPower:
                    unit.atkWithSkills += 2;
                    break;
            }
        }

        // 砦レベル差
        {
            let offenceFortlessLevel = Number(this.findOffenceFortress().level);
            let defenceFortlessLevel = Number(this.findDefenseFortress().level);
            let fortressLevelDiff = offenceFortlessLevel - defenceFortlessLevel;
            if (fortressLevelDiff < 0) {
                if (unit.groupId == UnitGroupType.Enemy) {
                    let diff = Math.abs(fortressLevelDiff);
                    unit.atkWithSkills += 4 * diff;
                    unit.spdWithSkills += 4 * diff;
                    unit.defWithSkills += 4 * diff;
                    unit.resWithSkills += 4 * diff;
                }
            }
            else if (fortressLevelDiff > 0) {
                if (unit.groupId == UnitGroupType.Ally) {
                    let diff = Math.abs(fortressLevelDiff);
                    unit.atkWithSkills += 4 * diff;
                    unit.spdWithSkills += 4 * diff;
                    unit.defWithSkills += 4 * diff;
                    unit.resWithSkills += 4 * diff;
                }
            }
        }

        // ボナキャラ補正
        if (unit.isBonusChar) {
            unit.maxHpWithSkillsWithoutAdd += 10;
            unit.atkWithSkills += 4;
            unit.spdWithSkills += 4;
            unit.defWithSkills += 4;
            unit.resWithSkills += 4;
        }

        // 神装
        if (unit.isResplendent) {
            unit.maxHpWithSkillsWithoutAdd += 2;
            unit.atkWithSkills += 2;
            unit.spdWithSkills += 2;
            unit.defWithSkills += 2;
            unit.resWithSkills += 2;
        }

        switch (this.gameMode) {
            case GameMode.Arena:
                this.updateArenaScore(unit);
                break;
            case GameMode.AetherRaid:
                this.updateAetherRaidDefenseLiftLoss(unit);
                break;
        }

        this.__showStatusToAttackerInfo();
    }

    initializeByHeroInfo(unit, heroIndex, initEditableAttrs = true) {
        if (heroIndex < 0) {
            unit.heroIndex = heroIndex;
        }

        let heroInfo = this.heroInfos.get(heroIndex);
        if (heroInfo == null) {
            console.log("heroInfo was not found:" + heroIndex);
            return;
        }

        if (unit.heroIndex != heroIndex) {
            unit.heroIndex = heroIndex;
        }

        unit.initByHeroInfo(heroInfo);

        if (this.gameMode != GameMode.ResonantBattles
            || unit.groupId == UnitGroupType.Ally) {
            // 双界の敵以外は成長率を操作することはないのでリセット
            unit.updatePureGrowthRate();
            unit.resetStatusAdd();
            unit.resetStatusMult();
        }

        if (initEditableAttrs) {
            unit.level = 40;
            unit.merge = 0;
            unit.dragonflower = 0;
            unit.initializeSkillsToDefault();
            unit.setMoveCountFromMoveType();
            unit.reserveCurrentSkills();
            unit.isBonusChar = false;
            if (!unit.heroInfo.isResplendent) {
                unit.isResplendent = false;
            }
            unit.updatePureGrowthRate();
        }
        this.__updateStatusBySkillsAndMerges(unit, false);
        unit.resetMaxSpecialCount();
        if (initEditableAttrs) {
            unit.specialCount = unit.maxSpecialCount;
            unit.hp = unit.maxHpWithSkills;
        }
    }

    getDurabilityTestAlly() {
        return this.findUnitById(this.durabilityTestAllyUnitId);
    }
    getDurabilityTestEnemy() {
        return this.findUnitById(this.durabilityTestEnemyUnitId);
    }

    hasItem(itemType) {
        for (let item of this.resonantBattleItems) {
            if (item == itemType) {
                return true;
            }
        }
        return false;
    }

    clearItems() {
        this.resonantBattleItems = [];
    }

    removeItem(itemType) {
        var index = this.__findIndexOfBattleItem(itemType);
        if (index >= 0) {
            this.resonantBattleItems.splice(index, 1);
        }
    }

    __findIndexOfBattleItem(item) {
        for (let i = 0; i < this.resonantBattleItems.length; ++i) {
            if (this.resonantBattleItems[i] == item) {
                return i;
            }
        }
        return -1;
    }

    getResonantBattlesEnemyLevelForAdvanced() {
        switch (Number(this.resonantBattleInterval)) {
            case 1:
            case 2:
                return 40;
            case 3:
            case 4:
                return 41;
            case 5:
            case 6:
                return 42;
            case 7:
            case 8:
                return 43;
            default:
                return 35 + Number(this.resonantBattleInterval);
        }
    }

    isBlessingEffectEnabled(targetUnit, providerUnit) {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                {
                    if (targetUnit.grantedBlessing == SeasonType.None && targetUnit.providableBlessingSeason == SeasonType.None) {
                        // 祝福付与なし、かつ伝承英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason == SeasonType.None) {
                        return false;
                    }

                    if (isMythicSeasonType(targetUnit.providableBlessingSeason)) {
                        // 神階英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用者の祝福がシーズンに合わない
                        return false;
                    }

                    if (targetUnit.grantedBlessing == providerUnit.providableBlessingSeason) {
                        // 祝福が一致した
                        return true;
                    }

                    if (!isMythicSeasonType(providerUnit.providableBlessingSeason)) {
                        // 適用者が伝承英雄、かつ、対象も伝承英雄
                        return false;
                    }

                    let isSeasonLegendaryUnit = this.examinesIsCurrentSeason(targetUnit.providableBlessingSeason);
                    if (isSeasonLegendaryUnit) {
                        return true;
                    }

                    return false;
                }
            case GameMode.Arena:
                {
                    if (targetUnit.grantedBlessing == SeasonType.None
                        && targetUnit.providableBlessingSeason == SeasonType.None) {
                        // 祝福付与なし、かつ神階英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason == SeasonType.None
                        || isMythicSeasonType(providerUnit.providableBlessingSeason)
                    ) {
                        return false;
                    }

                    if (isLegendarySeasonType(targetUnit.providableBlessingSeason)) {
                        // 対象が伝承英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用者の祝福がシーズンに合わない
                        return false;
                    }

                    if (targetUnit.grantedBlessing == providerUnit.providableBlessingSeason) {
                        // 祝福が一致した
                        return true;
                    }

                    let isSeasonMythicUnit = this.examinesIsCurrentSeason(targetUnit.providableBlessingSeason);
                    if (isSeasonMythicUnit) {
                        return true;
                    }

                    return false;
                }
                break;
            case GameMode.ResonantBattles:
                {
                    if (targetUnit.grantedBlessing == SeasonType.None
                        && targetUnit.providableBlessingSeason == SeasonType.None) {
                        // 祝福付与なし、かつ神階英雄でもない
                        return false;
                    }
                    if (providerUnit.providableBlessingSeason == SeasonType.None
                        || isMythicSeasonType(providerUnit.providableBlessingSeason)
                    ) {
                        return false;
                    }

                    if (isLegendarySeasonType(targetUnit.providableBlessingSeason)) {
                        // 対象が伝承英雄なので祝福付与なし
                        return false;
                    }

                    if (!this.examinesIsCurrentSeason(providerUnit.providableBlessingSeason)) {
                        // 適用者の祝福がシーズンに合わない
                        return false;
                    }

                    if (targetUnit.grantedBlessing == providerUnit.providableBlessingSeason) {
                        // 祝福が一致した
                        return true;
                    }

                    return false;
                }
            default:
                return false;
        }
    }

    __calcPrimeArenaScore(units) {
        let score = 0;
        for (let unit of units) {
            score += unit.arenaScore;
        }

        return score / units.length;
    }

    __calcArenaScore(units) {
        let score = 0;
        let bressingCount = 0;
        for (let unit of units) {
            score += unit.arenaScore;
            for (let ally of units) {
                if (ally == unit) {
                    continue;
                }
                if (this.isBlessingEffectEnabled(unit, ally)) {
                    ++bressingCount;
                }
            }
        }

        score = Math.floor(score / units.length) * 2 + bressingCount * 2;
        let tier = Number(this.mjolnirsStrikeTier);
        if (tier <= 5) {
            score += 0;
        }
        else if (tier <= 10) {
            score += 8;
        }
        else if (tier <= 14) {
            score += 16;
        }
        else if (tier <= 17) {
            score += 48;
        }
        else if (tier <= 20) {
            score += 68;
        }
        else if (tier == 21) {
            score += 88;
        }
        return score;
    }

    updateArenaScoreOfUnit(unit) {
        unit.updateArenaScore(this.mjolnirsStrikeMajorSeason, this.mjolnirsStrikeMinorSeason);
    }

    *enumerateCurrentSeasonDefenseMythicUnits(groupId) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(groupId)) {
            if (!this.isSpecialSlotUnit(unit)
                && unit.isDefenseMythicHero
                && this.examinesIsCurrentSeason(unit.providableBlessingSeason)) {
                yield unit;
            }
        }
    }

    __calcAetherRaidDefenseLiftLoss() {
        let liftLoss = -100;
        let defenseProviders = Array.from(this.enumerateCurrentSeasonDefenseMythicUnits(UnitGroupType.Enemy));
        let providerCount = defenseProviders.length;
        if (providerCount == 0) {
            return liftLoss;
        }

        let bonusMythicUnitAvailable = defenseProviders.some(x => x.isBonusChar);
        if (bonusMythicUnitAvailable) {
            liftLoss += 20;
        }

        let totalMerge = defenseProviders.reduce(
            (accumulator, unit) => accumulator + Number(unit.merge),
            0
        );
        liftLoss += totalMerge;

        // 神階英雄数(最大2体)x祝福付与英雄数x5
        if (providerCount > 2) {
            providerCount = 2;
        }

        let provider = defenseProviders[0];
        let bressingEffectedUnitCount = 0;
        for (let unit of this.enemyUnits.filter(x => !defenseProviders.some(y => y == x))) {
            if (this.isSpecialSlotUnit(unit)) {
                continue;
            }

            if (!this.isBlessingEffectEnabled(unit, provider)) {
                continue;
            }

            ++bressingEffectedUnitCount;
        }

        liftLoss += providerCount * bressingEffectedUnitCount * 5;

        return liftLoss;
    }

    updateAetherRaidDefenseLiftLoss() {
        this.aetherRaidDefenseLiftLoss = this.__calcAetherRaidDefenseLiftLoss();
    }

    updateArenaScoreOfParties() {
        this.arenaScore = this.__calcArenaScore(this.allyUnits);
        this.primeArenaScore = this.__calcPrimeArenaScore(this.allyUnits);
        this.arenaScoreForEnemy = this.__calcArenaScore(this.enemyUnits);
        this.primeArenaScoreForEnemy = this.__calcPrimeArenaScore(this.enemyUnits);
    }
    updateArenaScore(unit) {
        this.updateArenaScoreOfUnit(unit);
        this.updateArenaScoreOfParties();
    }

    updateEnemyAndAllyUnits() {
        let enemyCount = this.getEnemyCount();
        let allyCount = this.getAllyCount();
        this.updateEnemyAndAllyUnitCount(enemyCount, allyCount);
    }
    updateEnemyAndAllyUnitCount(enemyCount, allyCount) {
        this.enemyUnits = [];
        for (let i = 0; i < enemyCount; ++i) {
            let unit = this.units[i];
            unit.slotOrder = i;
            this.enemyUnits.push(unit);
        }
        let allyOffset = MaxEnemyUnitCount;
        let allyEnd = allyOffset + allyCount;
        this.allyUnits = [];
        for (let i = allyOffset; i < allyEnd; ++i) {
            let unit = this.units[i];
            unit.slotOrder = i - allyOffset;
            this.allyUnits.push(unit);
        }
    }

    examinesEnemyActionTriggered(unit) {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                return this.isEnemyActionTriggered;
            case GameMode.ResonantBattles:
                if (unit.groupId == UnitGroupType.Ally) {
                    return true;
                }
                if (isThief(unit)) {
                    return true;
                }
                return unit.isEnemyActionTriggered;
            case GameMode.Arena:
            case GameMode.TempestTrials:
            case GameMode.PawnsOfLoki:
            default:
                return true;
        }
    }

    updateTargetInfoTdStyle() {
        let width = (this.map.cellWidth * 6) / 2 + 10;
        this.attackInfoTdStyle = `width: ${width}px;font-size:8px;color:white;`;
    }

    updateExportText() {
        this.exportSettingText = exportSettingsAsString(
            this.exportsAllySettings,
            this.exportsEnemySettings,
            this.exportsOffenceSettings,
            this.exportsDefenceSettings,
            this.exportsMapSettings);
    }

    decompressSettingAutomatically(inputText) {
        let decompressed = LZString.decompressFromUTF16(inputText);
        if (decompressed != null) {
            return decompressed;
        }
        decompressed = LZString.decompressFromBase64(inputText);
        if (decompressed != null) {
            return decompressed;
        }
        decompressed = LZString.decompressFromEncodedURIComponent(inputText);
        if (decompressed != null) {
            return decompressed;
        }
        return inputText;
    }

    decompressSetting(inputText) {
        switch (this.settingCompressMode) {
            case SettingCompressMode.Utf16:
                return LZString.decompressFromUTF16(inputText);
            case SettingCompressMode.Base64:
                return LZString.decompressFromBase64(inputText);
            case SettingCompressMode.Uri:
                return LZString.decompressFromEncodedURIComponent(inputText);
            case SettingCompressMode.None:
            default:
                return inputText;
        }
    }

    compressSetting(inputText) {
        switch (this.settingCompressMode) {
            case SettingCompressMode.Utf16:
                return LZString.compressToUTF16(inputText);
            case SettingCompressMode.Base64:
                return LZString.compressToBase64(inputText);
            case SettingCompressMode.Uri:
                return LZString.compressToEncodedURIComponent(inputText);
            case SettingCompressMode.None:
            default:
                return inputText;
        }
    }

    getSelectedItems() {
        let items = [];
        for (let item of this.enumerateSelectedItems()) {
            items.push(item);
        }
        return items;
    }

    *enumerateSelectedItems(predicatorFunc = null) {
        for (let item of this.enumerateItems()) {
            if (predicatorFunc != null && predicatorFunc(item)) {
                if (item.isSelected) {
                    yield item;
                }
            }
        }
    }

    get isSupportActivationDisabled() {
        return this.currentTurn == 0;
    }

    get maxTurn() {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                {
                    let add = 0;
                    if (this.examinesIsCurrentSeason(SeasonType.Light)) {
                        for (let unit of this.allyUnits) {
                            if (unit.passiveC == PassiveC.MilaNoHaguruma) {
                                ++add;
                            }
                        }
                    }
                    return 7 + add;
                }
            case GameMode.ResonantBattles: return 20;
            case GameMode.Arena: return 20;
            case GameMode.TempestTrials: return 20;
            case GameMode.PawnsOfLoki:
                // todo: 本当は盤位で最大値が決まる。盤位1は9ターン、盤位4は10ターンだったが法則は不明
                return 20;
        }
    }

    getLabelOfMap(mapType) {
        for (let option of this.mapKindOptions) {
            if (option.value == mapType) {
                return option.label;
            }
        }
        for (let option of ArenaMapKindOptions) {
            if (option.value == mapType) {
                return option.label;
            }
        }
        return "";
    }

    getDefenceStructures(predicator) {
        let result = [];
        for (let st of this.defenseStructureStorage.objs) {
            if (predicator(st)) {
                result.push(st);
            }
        }
        return result;
    }

    registerTemplateImages() {
        for (let st of this.defenseStructureStorage.objs) {
            if (st instanceof FalseBoltTrap || st instanceof FalseHeavyTrap || st instanceof Ornament) {
                continue;
            }
            this.templateImageFiles.push(st.iconFileName);
        }
        for (let setting of OrnamentSettings) {
            this.templateImageFiles.push(setting.icon);
        }
    }

    isSelected(id) {
        let item = this.findItemById(id);
        if (item == null) {
            return false;
        }
        return item.isSelected;
    }

    selectAddCurrentItem() {
        let currentItem = this.currentItem;
        for (let item of this.enumerateItems()) {
            if (item == currentItem) {
                item.isSelected = true;
                break;
            }
        }
        this.setAttackerAndAttackTargetInfo();
    }

    selectCurrentItem() {
        let currentItem = this.currentItem;
        for (let item of this.enumerateItems()) {
            if (item == currentItem) {
                item.isSelected = true;
            }
            else {
                item.isSelected = false;
            }
        }

        this.setAttackerAndAttackTargetInfo();
    }

    clearCurrentItemSelection() {
        this.currentItemIndex = -1;
    }

    setAttackerAndAttackTargetInfo() {
        let currentUnit = this.currentUnit;
        if (currentUnit != null) {
            if (currentUnit.groupId == UnitGroupType.Ally) {
                this.attackerUnitIndex = this.currentItemIndex;
            }
            else {
                this.attackTargetUnitIndex = this.currentItemIndex;
            }
        }
    }

    examinesIsCurrentSeason(season) {
        for (let currentSeason of this.enumerateCurrentSeasons()) {
            if (season == currentSeason) {
                return true;
            }
        }
        return false;
    }

    *enumerateCurrentSeasons() {
        if (this.isLightSeason) {
            yield SeasonType.Light;
            yield SeasonType.Dark;
        }
        if (this.isAstraSeason) {
            yield SeasonType.Astra;
            yield SeasonType.Anima;
        }
        if (this.isFireSeason) {
            yield SeasonType.Fire;
        }
        if (this.isWaterSeason) {
            yield SeasonType.Water;
        }
        if (this.isEarthSeason) {
            yield SeasonType.Earth;
        }
        if (this.isWindSeason) {
            yield SeasonType.Wind;
        }
    }

    battileItemsToString() {
        if (this.resonantBattleItems.length == 0) {
            return String(ItemType.None);
        }
        let result = "";
        for (let item of this.resonantBattleItems) {
            result += item + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }

    setBattleItemsFromString(value) {
        this.resonantBattleItems = [];
        if (value == null || value == undefined) {
            return;
        }
        if (Number(value) == ItemType.None) {
            return;
        }
        for (let splited of value.split(ArrayValueElemDelimiter)) {
            if (splited == "") { continue; }
            let item = Number(splited);
            if (Number.isInteger(item)) {
                this.resonantBattleItems.push(item);
            }
        }
    }

    perTurnStatusToString() {
        return this.currentTurnType
            + ValueDelimiter + boolToInt(this.isEnemyActionTriggered)
            + ValueDelimiter + this.currentTurn
            + ValueDelimiter + this.battileItemsToString()
            + ValueDelimiter + boolToInt(this.isCombatOccuredInCurrentTurn)
            ;
    }

    turnWideStatusToString() {
        return this.mapKind
            + ValueDelimiter + boolToInt(this.isLightSeason)
            + ValueDelimiter + boolToInt(this.isAstraSeason)
            + ValueDelimiter + boolToInt(this.isFireSeason)
            + ValueDelimiter + boolToInt(this.isWaterSeason)
            + ValueDelimiter + boolToInt(this.isWindSeason)
            + ValueDelimiter + boolToInt(this.isEarthSeason)
            + ValueDelimiter + this.settingCompressMode
            + ValueDelimiter + this.gameMode
            + ValueDelimiter + this.resonantBattleInterval
            ;
    }

    fromPerTurnStatusString(value) {
        var splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.currentTurnType = Number(splited[i]); ++i; }
        this.isEnemyActionTriggered = intToBool(Number(splited[i])); ++i;
        if (Number.isInteger(Number(splited[i]))) { this.currentTurn = Number(splited[i]); ++i; }
        if (splited[i] != undefined) { this.setBattleItemsFromString(splited[i]); ++i; }
        if (splited[i] != undefined) { this.isCombatOccuredInCurrentTurn = intToBool(Number(splited[i])); ++i; }
    }

    fromTurnWideStatusString(value) {
        var splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this.mapKind = Number(splited[i]); ++i; }
        this.isLightSeason = intToBool(Number(splited[i])); ++i;
        this.isAstraSeason = intToBool(Number(splited[i])); ++i;
        this.isFireSeason = intToBool(Number(splited[i])); ++i;
        this.isWaterSeason = intToBool(Number(splited[i])); ++i;
        this.isWindSeason = intToBool(Number(splited[i])); ++i;
        this.isEarthSeason = intToBool(Number(splited[i])); ++i;
        if (Number.isInteger(Number(splited[i]))) { this.settingCompressMode = Number(splited[i]); ++i; }
        if (Number.isInteger(Number(splited[i]))) {
            let newValue = Number(splited[i]);
            let isGameModeChanged = newValue != this.gameMode;
            if (isGameModeChanged) {
                this.gameMode = newValue;
                this.setPropertiesForCurrentGameMode();
                this.updateEnemyAndAllyUnits();
            }

            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) { this.resonantBattleInterval = Number(splited[i]); ++i; }
    }

    setPropertiesForCurrentGameMode() {
        switch (this.gameMode) {
            case GameMode.AetherRaid:
                this.map.isBackgroundImageEnabled = true;
                this.showAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            case GameMode.Arena:
                this.map.isBackgroundImageEnabled = true;
                this.hideAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            case GameMode.ResonantBattles:
                this.map.isBackgroundImageEnabled = false;
                this.hideAetherRaidManu();
                this.map.setMapSizeToLarge();
                break;
            case GameMode.TempestTrials:
                this.map.isBackgroundImageEnabled = false;
                this.hideAetherRaidManu();
                this.map.setMapSizeToNormal();
                break;
            case GameMode.PawnsOfLoki:
                this.map.isBackgroundImageEnabled = false;
                this.hideAetherRaidManu();
                this.map.setMapSizeToPawnsOfLoki();
            default:
                break;
        }
    }

    sortUnitsBySlotOrder() {
        this.enemyUnits.sort(function (a, b) {
            return a.slotOrder - b.slotOrder;
        });
        this.allyUnits.sort(function (a, b) {
            return a.slotOrder - b.slotOrder;
        });
    }

    resetCurrentAetherRaidDefensePreset() {
        if (this.isAstraSeason) {
            this.aetherRaidDefensePreset = AetherRaidDefensePresetOptions_AnimaSeason[0].id;
        }
        else {
            this.aetherRaidDefensePreset = AetherRaidDefensePresetOptions_DarkSeason[0].id;
        }

        this.updateAetherRaidDefensePresetDescription();
    }

    updateAetherRaidDefensePresetDescription() {
        let preset = findAetherRaidDefensePreset(this.aetherRaidDefensePreset);
        if (preset == null) {
            return;
        }

        this.aetherRaidDefensePresetDescription = preset.getProviderHtml();
    }

    get currentUnit() {
        if (this.currentItemIndex < 0) {
            return null;
        }

        if (this.currentItemIndex < this.enemyUnits.length) {
            return this.enemyUnits[this.currentItemIndex];
        }

        if (this.currentItemIndex < (MaxEnemyUnitCount + this.allyUnits.length)) {
            return this.allyUnits[this.currentItemIndex - MaxEnemyUnitCount];
        }
        return null;
    }

    get currentStructure() {
        let item = this.currentItem;
        if (item instanceof StructureBase) {
            return item;
        }
        return null;
    }

    get currentItem() {
        return this.findItem(this.currentItemIndex);
    }

    hideAetherRaidManu() {
        this.aetherRaidMenuStyle = "display:none;";
    }
    showAetherRaidManu() {
        this.aetherRaidMenuStyle = "";
    }

    hideDebugMenu() {
        this.debugMenuStyle = "display:none;";
        // this.debugMenuStyle = "visibility: collapse;";
    }
    showDebugMenu() {
        this.debugMenuStyle = "";
    }
    applyDebugMenuVisibility() {
        if (this.isDebugMenuEnabled) {
            this.showDebugMenu();
        }
        else {
            this.hideDebugMenu();
        }
    }

    findDefenseFortress() {
        for (let st of this.defenseStructureStorage.objs) {
            if (st instanceof DefFortress) {
                return st;
            }
        }
        return null;
    }

    findOffenceFortress() {
        for (let st of this.offenceStructureStorage.objs) {
            if (st instanceof OfFortress) {
                return st;
            }
        }
        return null;
    }

    createStructures() {
        this.registerDefenceStructure(new DefFortress(g_idGenerator.generate()));
        this.registerDefenceStructure(new AetherFountain(g_idGenerator.generate()));
        this.registerDefenceStructure(new AetherAmphorae(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefBoltTower(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefTacticsRoom(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefHealingTower(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefPanicManor(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefCatapult(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefInfantrySchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefArmorSchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefCavalrySchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefFlierSchool(g_idGenerator.generate()));
        this.registerDefenceStructure(new FalseBoltTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new BoltTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new FalseHeavyTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new HeavyTrap(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerDefenceStructure(new Ornament(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfFortress(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfBoltTower(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfTacticsRoom(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfHealingTower(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfPanicManor(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfCatapult(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfInfantrySchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfArmorSchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfCavalrySchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfFlierSchool(g_idGenerator.generate()));
        this.registerOffenceStructure(new ExcapeLadder(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfBrightShrine(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfDarkShrine(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefBrightShrine(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefDarkShrine(g_idGenerator.generate()));
        this.registerOffenceStructure(new OfHiyokuNoHisyo(g_idGenerator.generate()));
        this.registerDefenceStructure(new DefHiyokuNoTorikago(g_idGenerator.generate()));
        // this.registerDefenceStructure(new BoltTrap(g_idGenerator.generate()));
        // this.registerDefenceStructure(new HeavyTrap(g_idGenerator.generate()));
        this.registerOffenceStructure(new SafetyFence(g_idGenerator.generate()));
    }

    registerDefenceStructure(structure) {
        this.defenseStructureStorage.register(structure);
        g_deffenceStructureContainer.addStructure(structure);
    }
    registerOffenceStructure(structure) {
        this.offenceStructureStorage.register(structure);
        g_offenceStructureContainer.addStructure(structure);
    }

    addStructuresToSelectionOptions() {
        for (let structure of this.offenceStructureStorage.objs) {
            let newId = this.selectionOptions[this.selectionOptions.length - 1].id + 1;
            this.selectionOptions.push({ id: newId, text: "攻撃施設" + structure.id });
        }
        for (let structure of this.defenseStructureStorage.objs) {
            let newId = this.selectionOptions[this.selectionOptions.length - 1].id + 1;
            this.selectionOptions.push({ id: newId, text: "防衛施設" + structure.id });
        }
    }

    findItem(itemIndex) {
        let index = 0;
        for (let i = 0; i < this.enemyUnits.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.enemyUnits[i];
            }
        }
        index = MaxEnemyUnitCount;
        for (let i = 0; i < this.allyUnits.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.allyUnits[i];
            }
        }
        index = MaxEnemyUnitCount + MaxAllyUnitCount;
        for (let i = 0; i < this.offenceStructureStorage.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.offenceStructureStorage.objs[i];
            }
        }
        for (let i = 0; i < this.defenseStructureStorage.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.defenseStructureStorage.objs[i];
            }
        }
        for (let i = 0; i < this.map._tiles.length; ++i, ++index) {
            if (index == itemIndex) {
                return this.map._tiles[i];
            }
        }
        return null;
    }

    findUnitById(id) {
        for (let unit of this.enumerateUnits()) {
            if (unit.id == id) {
                return unit;
            }
        }
        return null;
    }

    findItemById(id) {
        for (let item of this.enumerateItems()) {
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }

    *enumerateUnits() {
        for (let unit of this.enumerateEnemyUnits()) {
            yield unit;
        }
        for (let unit of this.enumerateAllyUnits()) {
            yield unit;
        }
    }

    enumerateAllEnemyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Enemy, 1000);
    }
    enumerateAllAllyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Ally, 1000);
    }

    enumerateAllyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Ally, this.allyUnits.length);
    }

    enumerateEnemyUnits() {
        return this.__enumerateUnitsForSpecifiedGroup(UnitGroupType.Enemy, this.enemyUnits.length);
    }

    * enumerateUnitsInSpecifiedGroup(groupId) {
        switch (groupId) {
            case UnitGroupType.Enemy:
                for (let unit of this.enumerateEnemyUnits()) {
                    yield unit;
                }
                break;
            case UnitGroupType.Ally:
                for (let unit of this.enumerateAllyUnits()) {
                    yield unit;
                }
                break;
        }
    }
    * enumerateUnitsInTheSameGroup(targetUnit, withTargetUnit = false) {
        for (let unit of this.enumerateUnitsInSpecifiedGroup(targetUnit.groupId)) {
            if (withTargetUnit || unit != targetUnit) {
                yield unit;
            }
        }
    }

    findEnemyUnitBySlotOrder(slotOrder) {
        for (let unit of this.enumerateEnemyUnits()) {
            if (unit.slotOrder == slotOrder) {
                return unit;
            }
        }
        return null;
    }

    *__enumerateUnitsForSpecifiedGroup(groupId, groupUnitMaxCount) {
        let maxCount = groupUnitMaxCount;
        let count = 0;
        for (let unit of this.units) {
            if (unit.groupId != groupId) {
                continue;
            }

            yield unit;
            ++count;
            if (count == maxCount) {
                return;
            }
        }
    }

    get totalComboBonus() {
        return this.pawnsOfLokiMaxWeaponTypeBonusA
            + this.pawnsOfLokiMaxWeaponTypeBonusB
            + this.pawnsOfLokiMaxMoveTypeBonus
            + this.pawnsOfLokiMaxMoveTypePairBonus;
    }


    getEnemyCount() {
        switch (this.gameMode) {
            case GameMode.AetherRaid: return 7;
            case GameMode.Arena: return 4;
            case GameMode.ResonantBattles: return 12;
            case GameMode.TempestTrials: return 6;
            case GameMode.PawnsOfLoki: return 8;
        }
    }
    getAllyCount() {
        switch (this.gameMode) {
            case GameMode.AetherRaid: return 6;
            case GameMode.Arena: return 4;
            case GameMode.ResonantBattles: return 4;
            case GameMode.TempestTrials: return 4;
            case GameMode.PawnsOfLoki: return 8 + 4 + 5; // 戦闘枠+補助枠+ショップ
        }
    }

    *enumerateItems() {
        for (let unit of this.enumerateUnits()) {
            yield unit;
        }
        for (let st of this.offenceStructureStorage.objs) {
            yield st;
        }
        for (let st of this.defenseStructureStorage.objs) {
            yield st;
        }
    }

    findIndexOfItem(id) {
        let index = 0;
        for (let i = 0; i < this.enemyUnits.length; ++i, ++index) {
            let unit = this.enemyUnits[i];
            if (unit.id == id) {
                return index;
            }
        }
        index = MaxEnemyUnitCount;
        for (let i = 0; i < this.allyUnits.length; ++i, ++index) {
            let unit = this.allyUnits[i];
            if (unit.id == id) {
                return index;
            }
        }

        index = MaxEnemyUnitCount + MaxAllyUnitCount;
        for (let i = 0; i < this.offenceStructureStorage.length; ++i, ++index) {
            let st = this.offenceStructureStorage.objs[i];
            if (st.id == id) {
                return index;
            }
        }
        for (let i = 0; i < this.defenseStructureStorage.length; ++i, ++index) {
            let st = this.defenseStructureStorage.objs[i];
            if (st.id == id) {
                return index;
            }
        }
        for (let i = 0; i < this.map._tiles.length; ++i, ++index) {
            let tile = this.map._tiles[i];
            if (tile.id == id) {
                return index;
            }
        }
        return -1;
    }

    clearReservedSkillsForAllUnits() {
        for (let unit of this.units) {
            unit.clearReservedSkills();
        }
    }
}

let g_appData = new AppData();
/// @file
/// @brief SettingManager クラスとそれに関連する関数等の定義です。

// todo: ビューに依存してしまっているのでどうにかする
function changeCurrentUnitTab(tabIndex) {
    // $('.jquery .tabs li').removeClass('active').eq(tabIndex).addClass('active');
    if (tabIndex < 0) {
        $('.jquery .contents li').removeClass('active');
        return;
    }
    $('.jquery .contents li').removeClass('active').eq(tabIndex).addClass('active');

    // アイコン
    $('.weaponIcon').attr('src', g_imageRootPath + "Weapon.png");
    $('.supportIcon').attr('src', g_imageRootPath + "Support.png");
    $('.specialIcon').attr('src', g_imageRootPath + "Special.png");
    // $('.urlJumpIcon').attr('src', g_imageRootPath + "UrlJump.png");
}

/// シリアライズ可能なシミュレーターの設定を管理するクラスです。
class SettingManager {
    constructor() {
        this._cookieWriter = new CookieWriter();
    }

    __examineOwnerTypeOfUnit(unit) {
        if (g_appData.map.isUnitAvailable(unit)) {
            return OwnerType.Map;
        }
        else {
            return OwnerType.TrashBox;
        }
    }

    __examineOwnerTypeOfStructure(structure) {
        if (g_appData.map.isObjAvailable(structure)) {
            return OwnerType.Map;
        }
        if (g_deffenceStructureContainer.isAvailable(structure.id)) {
            return OwnerType.DefenceStorage;
        }
        if (g_offenceStructureContainer.isAvailable(structure.id)) {
            return OwnerType.OffenceStorage;
        }

        return OwnerType.TrashBox;
    }

    __writeSetting(setting) {
        let serializable = setting.toString();
        this._cookieWriter.write(setting.serialId, serializable);
    }

    __readSetting(setting) {
        let deserialized = this._cookieWriter.read(setting.serialId);
        if (deserialized == null) {
            return false;
        }

        setting.fromString(deserialized);
        return true;
    }

    __setSerialSettingToUnit(unit) {
        // console.log("saving unit (" + unit.name + ", " + unit.posX + ", " + unit.posY + ")");
        let heroIndex = g_appData.heroInfos.findIndexOfInfo(unit.name);
        if (heroIndex < 0) {
            console.error(unit.id + ' was not found in database.');
            return;
        }
        let ownerType = this.__examineOwnerTypeOfUnit(unit);
        unit.heroIndex = heroIndex;
        unit.ownerType = ownerType;
    }

    __setSerialSettingToStructure(structure) {
        let ownerType = this.__examineOwnerTypeOfStructure(structure);
        structure.ownerType = ownerType;
        switch (ownerType) {
            case OwnerType.Map:
            case OwnerType.TrashBox:
                return structure;
            case OwnerType.OffenceStorage:
            case OwnerType.DefenceStorage:
                // デフォルト位置なので保存する必要なし
                return null;
            default:
                return null;
        }
    }

    __setUnitFromSerialSetting(unit) {
        let evalUnit = unit.snapshot != null ? unit.snapshot : unit;
        switch (evalUnit.ownerType) {
            case OwnerType.Map:
                {
                    let posX = evalUnit.posX;
                    let posY = evalUnit.posY;
                    let targetTile = g_appData.map.getTile(posX, posY);
                    if (targetTile != null && targetTile.placedUnit != null) {
                        moveUnitToTrashBox(targetTile.placedUnit);
                    }

                    let success = g_appData.map.moveUnitForcibly(unit, posX, posY);
                    if (!success) {
                        unit.posX = -1;
                        unit.posY = -1;
                        moveUnitToMap(unit, posX, posY);
                    }
                    // console.log("move " + unit.id + " to (" + unit.posX + ", " + unit.posY + ")");
                }
                break;
            case OwnerType.TrashBox:
                {
                    // console.log("move " + unit.id + " to trash box");
                    moveUnitToTrashBox(unit);
                }
                break;
            default:
                throw new Error("unknown owner type of unit " + unit.ownerType);
        }
    }

    __findStructure(id) {
        let structure = g_appData.defenseStructureStorage.findById(id);
        if (structure != null) {
            return structure;
        }

        structure = g_appData.offenceStructureStorage.findById(id);
        return structure;
    }

    __setStructureFromSerialSetting(structure) {
        switch (structure.ownerType) {
            case OwnerType.Map:
                {
                    let posX = structure.posX;
                    let posY = structure.posY;
                    let targetTile = g_appData.map.getTile(posX, posY);
                    if (targetTile.isObjPlaceableByNature()) {
                        if (targetTile != null && targetTile.obj != null) {
                            moveStructureToTrashBox(targetTile.obj);
                        }
                        moveStructureToMap(structure, posX, posY);
                        console.log("move " + structure.id + " to (" + structure.posX + ", " + structure.posY + ")");
                    }
                }
                break;
            case OwnerType.DefenceStorage:
                moveStructureToDefenceStorage(structure);
                break;
            case OwnerType.OffenceStorage:
                moveStructureToOffenceStorage(structure);
                break;
            case OwnerType.TrashBox:
                moveStructureToTrashBox(structure);
                break;
            default:
                throw new Error("Unknown OwnerType " + structure.ownerType);
        }
    }

    convertToPerTurnSetting(
        loadsAllies = true,
        loadsEnemies = true,
        loadsOffenceStructures = true,
        loadsDefenseStructures = true,
        exportsMapSettings = false
    ) {
        let currentTurn = g_appData.currentTurn;
        let turnSetting = new TurnSetting(currentTurn);

        // ユニットの設定を保存
        if (loadsEnemies) {
            for (let unit of g_appData.enumerateEnemyUnits()) {
                this.__setSerialSettingToUnit(unit);
                turnSetting.pushUnit(unit);
            }
        }
        if (loadsAllies) {
            for (let unit of g_appData.enumerateAllyUnits()) {
                this.__setSerialSettingToUnit(unit);
                turnSetting.pushUnit(unit);
            }
        }

        // 防衛施設の設定
        if (loadsDefenseStructures) {
            turnSetting.setAppData(g_appData);
            // console.log("saving defense structures");
            for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }

            // マップオブジェクトの設定
            // console.log("saving map objects");
            for (let structure of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }
        }

        // 攻撃施設の設定
        if (loadsOffenceStructures) {
            // console.log("saving offence structures");
            for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }
        }

        if (exportsMapSettings) {
            for (let structure of g_appData.map.enumerateWallsOnMap()) {
                let setting = this.__setSerialSettingToStructure(structure);
                if (setting != null) {
                    turnSetting.pushStructure(setting);
                }
            }

            for (let tile of g_appData.map.enumerateTiles()) {
                turnSetting.pushTile(tile);
            }
        }

        return turnSetting;
    }

    convertCurrentSettingsToDict(
        loadsAllies = true,
        loadsEnemies = true,
        loadsOffenceStructures = true,
        loadsDefenseStructures = true,
        exportsMapSettings = false
    ) {
        let turnSetting = this.convertToPerTurnSetting(
            loadsAllies, loadsEnemies, loadsOffenceStructures, loadsDefenseStructures, exportsMapSettings);
        let result = {};
        result[TurnWideCookieId] = turnSetting.turnWideStatusToString();
        result[turnSetting.serialId] = turnSetting.perTurnStatusToString();
        return result;
    }

    saveSettings() {
        let savesMap = g_appData.mapKind == MapType.ResonantBattles_Default;
        let dict = this.convertCurrentSettingsToDict(true, true, true, true, savesMap);
        for (let key in dict) {
            console.log("delete " + key + "..");
            this._cookieWriter.delete(key);
            let settingText = dict[key];
            console.log(document.cookie);
            console.log("save " + key + "..");
            console.log("value = " + settingText);
            let compressed = LZString.compressToBase64(settingText);
            // let compressed = LZString.compressToBase64(settingText);
            console.log(`compressed: ${compressed}`);
            this._cookieWriter.write(key, compressed);
        }
    }

    loadSettingsFromDict(
        settingDict,
        loadsAllySettings = true,
        loadsEnemySettings = true,
        loadsOffenceSettings = true,
        loadsDefenceSettings = true,
        loadsMapSettings = false,
        clearsAllFirst = true,
    ) {
        try {
            g_disableUpdateUi = true;
            let currentTurn = g_appData.currentTurn;
            let turnSetting = new TurnSetting(currentTurn);
            if (loadsDefenceSettings) {
                turnSetting.setAppData(g_appData);
            }

            if (clearsAllFirst) {
                if (settingDict[turnSetting.serialId]) {
                    if (loadsDefenceSettings) {
                        // リセット位置が重なって不定になるのを防ぐために最初に取り除く
                        for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                            moveStructureToDefenceStorage(structure);
                        }
                    }
                    if (loadsOffenceSettings) {
                        // リセット位置が重なって不定になるのを防ぐために最初に取り除く
                        for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                            moveStructureToOffenceStorage(structure);
                        }
                    }
                    if (loadsEnemySettings) {
                        for (let unit of g_appData.enumerateEnemyUnits()) {
                            moveUnitToTrashBox(unit);
                        }
                    }
                    if (loadsAllySettings) {
                        for (let unit of g_appData.enumerateAllyUnits()) {
                            moveUnitToTrashBox(unit);
                        }
                    }

                    g_appData.map.resetPlacement();
                }
            }

            if (loadsEnemySettings) {
                for (let unit of g_appData.enumerateAllEnemyUnits()) {
                    turnSetting.pushUnit(unit);
                }
            }
            if (loadsAllySettings) {
                for (let unit of g_appData.enumerateAllAllyUnits()) {
                    turnSetting.pushUnit(unit);
                }
            }
            if (loadsOffenceSettings) {
                for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                    turnSetting.pushStructure(structure);
                }
            }
            if (loadsDefenceSettings) {
                for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                    turnSetting.pushStructure(structure);
                }
                for (let structure of g_appData.map.enumerateBreakableWalls()) {
                    turnSetting.pushStructure(structure);
                }
            }
            if (loadsMapSettings) {
                for (let structure of g_appData.map.enumerateWalls()) {
                    turnSetting.pushStructure(structure);
                }
                for (let tile of g_appData.map.enumerateTiles()) {
                    turnSetting.pushTile(tile);
                }
            }

            // heroIndexChangedイベントが走ってスキルなどが上書きされないよう
            // 現在のユニットを未設定にしておく
            g_appData.clearCurrentItemSelection();
            changeCurrentUnitTab(-1);

            if (settingDict[turnSetting.serialId] == null && settingDict[TurnWideCookieId] == null) {
                console.log("failed to load turn setting");
                resetPlacement();
                updateAllUi();
                return;
            }

            if (settingDict[TurnWideCookieId]) {
                turnSetting.fromTurnWideStatusString(settingDict[TurnWideCookieId]);
                if (loadsDefenceSettings) {
                    // マップ種類
                    g_appData.map.changeMapKind(g_appData.mapKind, g_appData.gameVersion);
                }

                if (loadsEnemySettings) {
                    // console.log("敵の設定をロード");
                    for (let unit of g_appData.enumerateEnemyUnits()) {
                        g_appData.initializeByHeroInfo(unit, unit.heroIndex, false);
                    }
                }
                if (loadsAllySettings) {
                    // console.log("味方の設定をロード");
                    for (let unit of g_appData.enumerateAllyUnits()) {
                        g_appData.initializeByHeroInfo(unit, unit.heroIndex, false);
                    }
                }
            }

            if (settingDict[turnSetting.serialId]) {
                turnSetting.fromPerTurnStatusString(settingDict[turnSetting.serialId]);

                // 施設の設定をロード
                if (loadsDefenceSettings) {
                    // マップオブジェクトのロード
                    // console.log("loading map objects");
                    // console.log("map object count: " + g_appData.map.breakableObjCountOfCurrentMapType);
                    for (let structure of g_appData.map.enumerateBreakableWallsOfCurrentMapType()) {
                        // console.log(structure.id);
                        if (!turnSetting.isDeserialized(structure)) { continue; }
                        // console.log(structure.id + " is deserialized");
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }

                    // console.log("loading deffence structures");
                    for (let structure of g_appData.defenseStructureStorage.enumerateAllObjs()) {
                        if (!turnSetting.isDeserialized(structure)) { continue; }
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }
                }

                if (loadsOffenceSettings) {
                    // console.log("loading offence structures");
                    for (let structure of g_appData.offenceStructureStorage.enumerateAllObjs()) {
                        if (!turnSetting.isDeserialized(structure)) { continue; }
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }
                }

                if (loadsEnemySettings) {
                    // console.log("敵の設定をロード");
                    for (let unit of g_appData.enumerateEnemyUnits()) {
                        this.__setUnitFromSerialSetting(unit);
                    }
                }
                if (loadsAllySettings) {
                    // console.log("味方の設定をロード");
                    for (let unit of g_appData.enumerateAllyUnits()) {
                        this.__setUnitFromSerialSetting(unit);
                    }
                }

                if (loadsMapSettings) {
                    for (let structure of g_appData.map.enumerateWalls()) {
                        // console.log(structure.id);
                        if (!turnSetting.isDeserialized(structure)) {
                            removeFromAll(structure);
                            continue;
                        }
                        // console.log(structure.id + " is deserialized");
                        try {
                            this.__setStructureFromSerialSetting(structure);
                        } catch (e) {
                            moveToDefault(structure);
                        }
                    }
                }
            }
        }
        finally {
            g_disableUpdateUi = false;
        }

        g_appData.sortUnitsBySlotOrder();

        // 祝福を反映させるために更新が必要
        g_appData.__updateStatusBySkillsAndMergeForAllHeroes(false);

        g_appData.map.createTileSnapshots();
    }

    loadSettings() {
        let currentTurn = g_appData.currentTurn;
        let turnSetting = new TurnSetting(currentTurn);
        let dict = {};
        dict[TurnWideCookieId] = null;
        dict[turnSetting.serialId] = null;
        for (let key in dict) {
            let readText = this._cookieWriter.read(key);
            let decompressed = LZString.decompressFromBase64(readText);
            console.log(`decompressed: ${decompressed}`);
            dict[key] = decompressed;
        }
        if (dict[TurnWideCookieId] == null && dict[turnSetting.serialId] == null) {
            console.log("ターン" + currentTurn + "の設定なし");
            return;
        }
        let loadsMap = g_appData.mapKind == MapType.ResonantBattles_Default;
        this.loadSettingsFromDict(dict, true, true, true, true, loadsMap);
    }
}

function test_createDefaultUnit(groupId = UnitGroupType.Ally) {
  let unit = new Unit("", "テストユニット", groupId);
  unit.placedTile = new Tile(0, 0);
  unit.maxHpWithSkills = 40;
  unit.hp = unit.maxHpWithSkills;
  unit.weapon = Weapon.SilverSwordPlus;
  unit.weaponType = WeaponType.Sword;
  unit.moveType = MoveType.Infantry;
  unit.atkWithSkills = 40;
  unit.spdWithSkills = 40;
  unit.defWithSkills = 30;
  unit.resWithSkills = 30;
  unit.createSnapshot();
  unit.saveCurrentHpAndSpecialCount();
  return unit;
}

/// テスト用のダメージ計算機です。
class test_DamageCalculator {
  constructor() {
    this.damageCalc = new DamageCalculator();
    this.isLogEnabled = false;
  }

  __examinesCanCounterattackBasically(atkUnit, defUnit) {
    if (!defUnit.hasWeapon) {
      return false;
    }

    if (defUnit.battleContext.canCounterattackToAllDistance) {
      return true;
    }

    return atkUnit.attackRange == defUnit.attackRange;
  }

  calcDamage(atkUnit, defUnit) {
    defUnit.battleContext.canCounterattack = this.__examinesCanCounterattackBasically(atkUnit, defUnit);
    atkUnit.battleContext.canFollowupAttack = this.damageCalc.examinesCanFollowupAttack(atkUnit, defUnit);
    defUnit.battleContext.canFollowupAttack = !atkUnit.battleContext.canFollowupAttack;

    let result = this.damageCalc.calc(atkUnit, defUnit);
    if (this.isLogEnabled) {
      console.log(this.damageCalc.rawLog);
    }
    this.damageCalc.clearLog();
    return result;
  }
}

function test_calcDamage(atkUnit, defUnit, isLogEnabled = false) {
  let calclator = new test_DamageCalculator();
  calclator.isLogEnabled = isLogEnabled;
  return calclator.calcDamage(atkUnit, defUnit);
}


/// 復讐のダメージ計算テストです。
test('DamageCalculatorVengeanceTest', () => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.special = Special.Fukusyu;
  atkUnit.specialCount = 2;

  defUnit.atkWithSkills = 51;
  defUnit.spdWithSkills = atkUnit.spdWithSkills - 5;

  let result = test_calcDamage(atkUnit, defUnit, true);

  expect(result.atkUnit_normalAttackDamage).toBe(10);
  expect(result.atkUnit_totalAttackCount).toBe(2);
  expect(result.defUnit_normalAttackDamage).toBe(21);
  expect(result.defUnit_totalAttackCount).toBe(1);

  let specialDamage = Math.trunc(result.defUnit_normalAttackDamage * result.defUnit_totalAttackCount * 0.5);
  let normalAttackDamage = result.atkUnit_normalAttackDamage * result.atkUnit_totalAttackCount;
  let actualDamageDealt = defUnit.maxHpWithSkills - defUnit.restHp;
  expect(actualDamageDealt - normalAttackDamage).toBe(specialDamage);
});

/// シンプルなダメージ計算テストです。
test('DamageCalculatorSimple', () => {
  let atkUnit = test_createDefaultUnit();
  let defUnit = test_createDefaultUnit(UnitGroupType.Enemy);
  atkUnit.atkWithSkills = 40;
  defUnit.defWithSkills = 30;
  defUnit.spdWithSkills = atkUnit.spdWithSkills - 5;

  let result = test_calcDamage(atkUnit, defUnit);

  expect(result.atkUnit_normalAttackDamage).toBe(10);
  expect(result.atkUnit_totalAttackCount).toBe(2);
});