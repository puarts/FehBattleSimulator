
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

class IdGenerator {
    constructor() {
        this._currentId = 0;
    }

    generate() {
        ++this._currentId;
        return this._currentId;
    }
}

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
        document.getElementById(this._uiId).innerHTML = this.toHtml();
    }
}

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

class Command {
    constructor(label, doFunc, undoFunc, doUserData = null, undoUserData = null, type = CommandType.Normal) {
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
        console.log("current undo stack ----");
        for (let command of this.undoStack.data) {
            console.log(`${command.label}: ${command.type}`);
        }
        console.log("----");
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


function sleep(waitMilliseconds) {
    var startMilliseconds = new Date();
    while (new Date() - startMilliseconds < waitMilliseconds);
}

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
    document.body.appendChild(element);
    element.onload = onloadFunc;
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
