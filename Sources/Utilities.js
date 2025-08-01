/// @file
/// @brief ユーティリティークラス、関数等の定義です。
/**
 * ObjectUtil
 */
class ObjectUtil {
    static makeMapFromObj(object) {
        return new Map(Object.entries(object).map(([text, value]) => [value, text]));
    }

    static makeOptionFromObj(object) {
        return Object.entries(object).map(([text, value]) => ({value, text}));
    }

    static getKeyName(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
}

/**
 * @template T
 */
class TreeNode {
    /**
     * @param {T} item
     */
    constructor(item) {
        /** @type {T} */
        this.item = item;
        /** @type {TreeNode[]} */
        this.branches = [];
    }
}

/**
 * スタックを表すコンテナクラスです。
 * @template T
 */
class Stack {
    /** @type {T[]} */
    #array = [];
    #maxLength = 0;

    constructor(maxLength) {
        this.#maxLength = maxLength;
        this.#array = [];
    }

    get length() {
        return this.#array.length;
    }

    /**
     * @param {T} value
     */
    push(value) {
        if (this.#array.length === this.#maxLength) {
            this.#array.shift();
        }
        this.#array.push(value);
    }

    /**
     * @returns {T | undefined}
     */
    pop() {
        return this.#array.pop();
    }

    clear() {
        this.#array = [];
    }

    get data() {
        return this.#array;
    }
}

/**
 * キューを表すコンテナクラスです。
 * @template T
 */
class Queue {
    /** @type {T[]} */
    #array = [];
    #maxLength = 0;

    constructor(maxLength) {
        this.#maxLength = maxLength;
        this.#array = [];
    }

    /**
     * @param {T} value
     */
    enqueue(value) {
        if (this.#array.length === this.#maxLength) {
            this.#array.shift();
        }
        this.#array.push(value);
    }

    /**
     * @returns {T | null}
     */
    dequeue() {
        return !this.isEmpty() ? this.#array.shift() : null;
    }

    /**
     * @returns {T | null}
     */
    pop() {
        return !this.isEmpty() ? this.#array.pop() : null;
    }

    clear() {
        this.#array = [];
    }

    /**
     * @returns {T | null}
     */
    get topValue() {
        return this.isEmpty() ? null : this.#array[0];
    }

    /**
     * @returns {T | null}
     */
    get lastValue() {
        return this.isEmpty() ? null : this.#array[this.#array.length - 1];
    }

    /**
     * @returns {number}
     */
    get length() {
        return this.#array.length;
    }

    /**
     * @returns {T[]}
     */
    get data() {
        return this.#array;
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return this.length === 0;
    }
}

/// クッキーの保存や読み込みを管理するクラスです。
class CookieWriter {
    constructor() {
        this.useCookieJs = false;
        this.domain = ".fire-emblem.fun"
    }

    delete(name) {
        if (this.useCookieJs) {
            $.removeCookie(name);
        } else {
            document.cookie = `${name}=; max-age=0;`;
        }
    }

    write(name, value) {
        if (this.useCookieJs) {
            $.cookie(name, value);
        } else {
            document.cookie = `${name}=${value}`;
        }
        // console.log("write:" + document.cookie);
    }

    read(name) {
        if (this.useCookieJs) {
            return $.cookie(name);
        } else {
            // console.log("read:" + document.cookie);
            if (document.cookie !== "") {
                let settings = document.cookie.split(';');
                for (let settingIndex = 0; settingIndex < settings.length; ++settingIndex) {
                    let elemText = settings[settingIndex];
                    let keyValue = elemText.split('=');
                    if (keyValue.length < 2) {
                        // console.error("invalid cookie: " + settings[settingIndex]);
                        continue;
                    }
                    let settingName = keyValue[0].trim();
                    if (settingName !== name) {
                        continue;
                    }
                    return elemText.substring(keyValue[0].length + 1).trim();
                }
            }
        }
        return null;
    }
}

class LocalStorageUtil {
    /**
     * 数値をローカルストレージに保存します。
     * @param {string} key - 保存するためのキー。
     * @param {number} value - 保存する数値。
     */
    static setNumber(key, value) {
        if (typeof value === 'number') {
            localStorage.setItem(key, value.toString());
        } else {
            console.error('Value must be a number');
        }
    }

    /**
     * ローカルストレージから数値を取得します。
     * @param {string} key - 取得するためのキー。
     * @param {number} defaultValue - キーが見つからない場合のデフォルト値。
     * @returns {number} - 取得した数値、またはデフォルト値。
     */
    static getNumber(key, defaultValue = 0) {
        const value = localStorage.getItem(key);
        return value !== null ? parseFloat(value) : defaultValue;
    }

    static getBoolean(key, defaultValue = false) {
        const value = localStorage.getItem(key);
        return value !== null ? value === 'true' : defaultValue;
    }

    /**
     * @param {string} key
     * @param {boolean} value
     */
    static setBoolean(key, value) {
        localStorage.setItem(key, value ? 'true' : 'false');
    }

    static toggleBoolean(key) {
        const value = this.getBoolean(key);
        this.setBoolean(key, !value);
    }

    static getJson(key, defaultValue = null) {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
    }

    static setJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * ローカルストレージから数値を削除します。
     * @param {string} key - 削除するためのキー。
     */
    static removeNumber(key) {
        localStorage.removeItem(key);
    }

    static removeKey(key) {
        localStorage.removeItem(key);
    }

    /**
     * ローカルストレージの全ての数値をクリアします。
     */
    static clear() {
        localStorage.clear();
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

        document.addEventListener('visibilitychange', function () {
            // 画面を離れた際にShift, Controlのフラグが残り続けるのでリセットする
            self.isShiftKeyPressing = false;
            self.isControlKeyPressing = false;
        });
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
class ObjectStorage {
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
        for (let i = 0; i < this._objs.length; ++i) {
            let obj = this._objs[i];
            if (obj.id == id) {
                return obj;
            }
        }
        return null;
    }

    * enumerateAllObjs() {
        for (let i = 0; i < this._objs.length; ++i) {
            let obj = this._objs[i];
            yield obj;
        }
    }

    * enumerateRequiredObjs() {
        for (let i = 0; i < this._objs.length; ++i) {
            let obj = this._objs[i];
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
        let index = this._structures.indexOf(structure);
        if (index < 0) {
            return;
        }
        this._structures.splice(index, 1);
    }

    findStructure(id) {
        for (let i = 0; i < this._structures.length; ++i) {
            let structure = this._structures[i];
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
        let html = "";
        for (let i = 0; i < this._structures.length; ++i) {
            let structure = this._structures[i];
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
        let diff = endTime - this._startTime;
        this._logFunc(diff);
    }
}

class ScopedPerformanceTimer {
    constructor(logFunc) {
        this._logFunc = logFunc;
        this._startTime = performance.now();
    }

    dispose() {
        const endTime = performance.now();
        let diff = endTime - this._startTime;
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
            function (command) {
                command.undo();
            },
            this.undoStack, this.redoStack,
            CommandType.End, CommandType.Begin);
    }

    redo() {
        this.__undoRedoImpl(
            function (command) {
                command.execute();
            },
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

/**
 * 現在のスレッドを指定時間の間、スピンループでスリープします。
 */
function sleep(waitMilliseconds) {
    let startMilliseconds = new Date();
    while (new Date() - startMilliseconds < waitMilliseconds) ;
}

/**
 * 新しいスレッドで処理を開始します。
 */
function startProgressiveProcess(
    iterMax, // 繰り返し回数
    mainProcess, // メイン処理
    showProgress, // 進捗表示処理
    onProcessFinished = null, // 終了処理,
    waitMilliseconds = 0,
    breakLoopFunc = null,
) {
    if (iterMax === 0) {
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
        breakLoop = breakLoopFunc?.() ?? iter >= iterMax;

        if (!breakLoop) {
            setTimeout(tmp, 0);
        } else if (!endProcess) {
            onProcessFinished?.();
            endProcess = true;
        }
    }, 0);
}

/// 一定区間で破棄するインスタンスの区間を指定します。
function using_(disposable, func) {
    const result = func();
    disposable.dispose();
    return result;
}

function getFirstElementByTagName(elements, targetTagName) {
    return elements.find(e => e.tagName === targetTagName) || null;
}

function distinct(array) {
    return [...new Set(array)];
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
    return value ? 1 : 0;
}

function intToBool(value) {
    return value !== 0;
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

    let s1_len = s1.length;
    let s2_len = s2.length;
    if (s1_len === 0) {
        return s2_len;
    }
    if (s2_len === 0) {
        return s1_len;
    }

    // BEGIN STATIC
    let split = false;
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

    let v0 = new Array(s1_len + 1);
    let v1 = new Array(s1_len + 1);

    let s1_idx = 0, s2_idx = 0, cost = 0;
    for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
        v0[s1_idx] = s1_idx;
    }
    let char_s1 = '', char_s2 = '';
    for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
        v1[0] = s2_idx;
        char_s2 = s2[s2_idx - 1];

        for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
            char_s1 = s1[s1_idx];
            cost = (char_s1 == char_s2) ? 0 : 1;
            let m_min = v0[s1_idx + 1] + 1;
            let b = v1[s1_idx] + 1;
            let c = v0[s1_idx] + cost;
            if (b < m_min) {
                m_min = b;
            }
            if (c < m_min) {
                m_min = c;
            }
            v1[s1_idx + 1] = m_min;
        }
        let v_tmp = v0;
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

/**
 * @param {HTMLElement} srcCanvas
 * @param {HTMLElement} destCanvas
 * @param {function(*, *, *): *} zeroValuePixelPredicator
 */
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
            } else if (binarize) {
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

async function cropAndPostProcessAndOcr(
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

/**
 * @param source
 * @param ocrProgressFunc
 * @param ocrResultFunc
 * @param ocrLang
 * @param whitelist
 * @param blacklist
 * @returns {Promise<*>}
 */
async function executeTesseractRecognize(
    source,
    ocrProgressFunc,
    ocrResultFunc,
    ocrLang = "jpn",
    whitelist = "",
    blacklist = ""
) {
    const promise = Tesseract.recognize(source, {
        lang: ocrLang,
        tessedit_pageseg_mode: "RAW_LINE",
        tessedit_char_whitelist: whitelist,
        tessedit_char_blacklist: blacklist,
    });

    promise.progress(ocrProgressFunc);

    const result = await promise;
    return ocrResultFunc(result);

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

/**
 * @param destCanvas
 * @param srcImageOrCanvas
 * @param offsetPercentageX
 * @param offsetPercentageY
 * @param widthPercentage
 * @param heightPercentage
 * @param binarizeThreshold
 * @param ocrProgressFunc
 * @param ocrResultFunc
 * @param ocrLang
 * @param whitelist
 * @param blacklist
 * @returns {Promise<*>}
 */
async function cropAndBinarizeImageAndOcr(
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
        for (let i = 0; i < src.data.length; i = i + 4) {
            let y = ~~(0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2]);
            let ret = (y > binarizeThreshold) ? 255 : 0;
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

/**
 * @param  {String} ocrResult
 * @returns {String[]}
 */
function convertOcrResultToArray(ocrResult) {
    let splited = ocrResult.split("\n");
    let filtered = splited.filter(function (el) {
        return el != "" && el != null;
    });
    let result = [];
    for (let i = 0; i < filtered.length; ++i) {
        let trimed = filtered[i].replace(/ /g, '');
        if (trimed != "") {
            result.push(trimed);
        }
    }
    return result;
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

/**
 * 指定されたURLから画像を非同期に読み込みます。
 *
 * @param {string} src - 画像のURLまたはファイルパス
 * @returns {Promise<HTMLImageElement>} 画像の読み込みが成功した場合、読み込まれた画像を含む Promise を返します。
 * @throws {Error} 画像の読み込み中にエラーが発生した場合、エラーを含む Promise が返されます。
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

/**
 * 指定されたファイルを非同期に読み込みます。
 * ファイルの内容をデータURL形式で返します。
 *
 * @param {Blob} file - 読み込むファイルオブジェクト
 * @returns {Promise} ファイルの読み込みが成功した場合、読み込まれたファイルデータを含む Promise を返します。
 * @throws {Error} ファイルの読み込み中にエラーが発生した場合、エラーを含む Promise が返されます。
 */
function loadFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

/**
 * ファイルを読み込み、その内容を画像として処理します。
 * 読み込んだ画像を指定された関数で処理します。
 *
 * @param {Blob} file - 読み込むファイルオブジェクト
 * @param {function} processFunc - 画像を処理するためのコールバック関数。画像が読み込まれた後に呼び出されます。
 * @return {Promise}
 * この関数は、読み込まれた画像を引数として受け取ります。
 */
async function loadAndProcessImage(file, processFunc) {
    try {
        const evt = await loadFile(file);  // loadFileが完了するまで待機
        const image = await loadImage(evt.target.result);  // loadImageが完了するまで待機
        return processFunc(image);  // 画像処理関数を呼び出す
    } catch (error) {
        console.error("Error loading or processing image:", error);
    }
}

function matTypeToString(mat) {
    switch (mat.type()) {
        case cv.CV_8U:
            return "CV_8U";
        case cv.CV_8S:
            return "CV_8S";
        case cv.CV_16U:
            return "CV_16U";
        case cv.CV_16S:
            return "CV_16S";
        case cv.CV_32S:
            return "CV_32S";
        case cv.CV_32F:
            return "CV_32F";
        case cv.CV_64F:
            return "CV_64F";

        case cv.CV_8UC4:
            return "CV_8UC4";

        case cv.CV_8SC4:
            return "CV_8SC4";

        case cv.CV_16UC4:
            return "CV_16UC4";


        case cv.CV_16SC1:
            return "CV_16SC1";
        case cv.CV_16SC2:
            return "CV_16SC2";
        case cv.CV_16SC3:
            return "CV_16SC3";
        case cv.CV_16SC4:
            return "CV_16SC4";

        case cv.CV_32SC1:
            return "CV_32SC1";
        case cv.CV_32SC2:
            return "CV_32SC2";
        case cv.CV_32SC3:
            return "CV_32SC3";
        case cv.CV_32SC4:
            return "CV_32SC4";

        case cv.CV_32FC1:
            return "CV_32FC1";
        case cv.CV_32FC2:
            return "CV_32FC2";
        case cv.CV_32FC3:
            return "CV_32FC3";
        case cv.CV_32FC4:
            return "CV_32FC4";
        default:
            return mat.type();
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function selectText(containerid) {

    let node = document.getElementById(containerid);

    if (document.selection) {
        let range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        let range = document.createRange();
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
}

const ErrorCorrectionValue = 1.0 / 100000;

/**
 * 浮動小数の誤差を加味して floor します。
 */
function floorNumberWithFloatError(value) {
    return Math.floor(value + ErrorCorrectionValue);
}

/**
 * 浮動小数の誤差を加味して trunc します。
 */
function truncNumberWithFloatError(value) {
    let revisedValue = value;
    if (value < 0) {
        revisedValue -= ErrorCorrectionValue;
    } else {
        revisedValue += ErrorCorrectionValue;
    }
    return Math.trunc(revisedValue);
}

/**
 * 小数を指定した桁数で丸めます。
 */
function roundFloat(value, precision = 6) {
    const factor = 10 ** precision;
    const revertFactor = 1.0 / factor;
    return Math.round(value * factor) * revertFactor;
}

/**
 * @param  {Number} number
 */
function getIncHtml(number) {
    if (number < 0) {
        return `<span style="color: #ffaaaa">${number}</span>`
    } else if (number > 0) {
        return `<span style="color: #00eeee">+${number}</span>`
    }
    return `+${number}`;
}

/**
 * @returns {HTMLImageElement}
 */
function getSpecialChargedImgTag() {
    let imgTag = document.createElement('img');
    imgTag.src = `${g_imageRootPath}Special.png`;
    return imgTag;
}

/**
 * @param {number} divineVein
 * @returns {HTMLElement}
 */
function getDivineVeinTag(divineVein) {
    if (divineVein === DivineVeinType.None) {
        return document.createElement('div');
    }
    let imgTag = document.createElement('img');
    let path = getDivineVeinImgPath(divineVein);
    if (path) {
        imgTag.src = path;
    }
    return imgTag;
}

/**
 * @param {number} divineVein
 * @returns {string|null}
 */
function getDivineVeinImgPath(divineVein) {
    if (divineVein === DivineVeinType.None) return null;
    return [
        '',
        'DivineVein_Stone.webp',
        'DivineVein_Flame.webp',
        'DivineVein_Green.webp',
        'DivineVein_Haze.webp',
        'DivineVein_Water.jpg',
        'DivineVein_Ice.webp',
    ].map(img => `${g_imageRootPath}${img}`)[divineVein] ?? null;
}

/**
 * @param {number} divineVein
 * @returns {string|null}
 */
function getDivineVeinPath(divineVein) {
    if (divineVein === DivineVeinType.None) return null;
    return [
        0, // None
        56, // Stone
        55, // Flame
        65, // Green
        67, // Haze
        75, // Water
        80, // Ice
    ].map(img => `${g_siteRootPath}?fehse=${img}`)[divineVein];
}

function getDivineVeinTitle(divineVein) {
    return [
        // None
        '',
        // Stone
        '付与されたマスに入る者は以下の効果を受ける。\n味方は受けた範囲奥義のダメージを50%軽減(巨影の範囲奥義を除く)。\n味方は戦闘中、守備、魔防+6、敵の奥義による攻撃のダメージ-10(範囲奥義を除く)(付与マスに既に天脈がある場合、それを上書きする)(同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Flame
        '付与されたマスに入る者は以下の効果を受ける。\n射程2の敵は、移動しづらくなる(移動する際、移動をさらに+1消費する。敵の移動タイプの基本移動力を超えて消費しない。「自分が移動可能な地形を平地のように移動可能」の効果はこの影響を受けない)。\n敵は敵軍ターン開始時に7ダメージ(ダメージ後のHPは最低1)。\n敵は戦闘開始後に7ダメージ(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)(付与マスに既に天脈がある場合、それを上書きする)(同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Green
        '付与されたマスに入る者は以下の効果を受ける\n敵はこのマスから、および、このマスへのスキル効果によるワープ移動不可(すり抜けを持つ敵には無効)(制圧戦の拠点等の地形効果によるワープ移動は可)\n敵は戦闘中、奥義発動カウント変動量-1 (同系統効果複数時、最大値適用)(付与マスに既に天脈がある場合、それを上書きする) (同じタイミングに異なる複数の天脈の付与が 発生した場合、天脈は消滅する)',
        // Haze
        '付与されたマスに入る者は以下の効果を受ける\n敵は戦闘中、攻撃、速さ、守備、魔防-5、強化の+が無効になる(無効になるのは、鼓舞や応援等の効果)(付与マスに既に天脈がある場合、それを上書きする)(同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Water
        '付与されたマスに入る者は以下の効果を受ける 射程2の敵は、移動しづらくなる(移動する際、移動をさらに+1消費する。 敵の移動タイプの基本移動力を超えて消費しない。「自分が移動可能な地形を平地のように移動可能」の効果はこの影響を受けない)\n敵は戦闘中、速さ-5、奥義以外のスキルによる 「ダメージを○○%軽減」を半分無効 (無効にする数値は端数切捨て) (範囲奥義を除く)(付与マスに既に天脈がある場合、それを上書きする) (同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する)',
        // Ice
        '付与されたマスは以下の状態になる\n敵軍は進入不可、破壊可能(HP1)\n自軍は進入、および、待機可能\n【天脈・氷】上に自軍がいる場合は 【天新・氷】の破壊より自軍への攻撃が優先される (付与マスに既に天脈がある場合、それを上書きする) (同じタイミングに異なる複数の天脈の付与が 発生した場合、天顔は消滅する) (ロキの上遊戯では付与されない)',
    ][divineVein] ?? '';
}

function getSkillIconDivTag(unit) {
    let div = document.createElement('div');
    if (unit == null) {
        return div;
    }
    let html = '';

    // 補助
    {
        let imgTag = document.createElement('img');
        imgTag.src = `${g_imageRootPath}Support.png`;
        if (!unit.hasSupport) {
            imgTag.classList.add('summary-icon-grey');
        } else {
            imgTag.title = unit.supportInfo?.name;
        }
        html += `<div style="position: relative">${imgTag.outerHTML}</div>`;
    }

    // 奥義
    {
        let imgTag = document.createElement('img');
        if (unit.hasEmblemHero()) {
            imgTag.src = EngagedSpecialIcon[unit.emblemHeroIndex];
        } else {
            imgTag.src = `${g_imageRootPath}Special.png`;
        }
        if (!unit.hasSpecial) {
            imgTag.classList.add('summary-icon-grey');
        } else {
            imgTag.title = unit.specialInfo?.name;
        }
        html += `<div style="position: relative">${imgTag.outerHTML}</div>`;
    }

    // パッシブ
    let infos = [
        unit.passiveAInfo, unit.passiveBInfo, unit.passiveCInfo,
        unit.passiveSInfo, unit.passiveXInfo,
    ];
    let skillTypes = [
        'A.png', 'B.png', 'C.png',
        'S.png', 'X.webp',
    ];
    infos.forEach((info, index) => {
        let icon = document.createElement('img');
        let title = 'スキルなし';
        if (info) {
            icon.src = info.iconPath;
            title = infos[index]?.name;
        } else {
            icon.src = `${g_imageRootPath}None.png`;
        }
        let skillType = `<img src="${g_imageRootPath}${skillTypes[index]}" class="skill-type"/>`;
        html += `<div title="${title}" style="position: relative">${icon.outerHTML}${skillType}</div>`;
    });

    div.innerHTML = html;
    return div;
}

/**
 * @param statusEffect
 * @returns {string}
 */
function getStatsEffectImgTagStr(statusEffect) {
    return `<img 
         src="${statusEffectTypeToIconFilePath(statusEffect)}"
         title="${getStatusEffectName(statusEffect)}" 
         alt="${getStatusEffectName(statusEffect)}"/>`;
}

function getKeyByValue(dict, value) {
    for (let key in dict) {
        if (dict[key] === value) {
            return key;
        }
    }
    return null;
}

class IterUtil {

    /**
     * valueFuncを適用した最大値を求める。
     * @template T
     * @param {Iterable<T>|Generator<T>} iterable
     * @param {(i: T) => number} valueFunc
     * @param {number} initValue
     * @returns {number}
     */
    static maxValue(iterable, valueFunc, initValue) {
        let maxValue = initValue;
        for (let e of iterable) {
            let value = valueFunc(e);
            if (value >= maxValue) {
                maxValue = value;
            }
        }
        return maxValue;
    }

    /**
     * valueFuncを適用した最小値を求める。
     * @template T
     * @param {Iterable<T>|Generator<T>} iterable
     * @param {(i: T) => number} valueFunc
     * @param {number} initValue
     * @returns {number}
     */
    static minValue(iterable, valueFunc, initValue) {
        return -this.maxValue(iterable, e => -valueFunc(e), -initValue);
    }

    /**
     * valueFuncを最大にする要素を一つ求める。
     * 最初に見つかったものを返す。
     * @template T
     * @param {Iterable<T>|Generator<T>} iterable
     * @param {(i: T) => number} valueFunc
     * @returns {T}
     */
    static maxElement(iterable, valueFunc) {
        let maxValue = Number.MIN_SAFE_INTEGER;
        let maxElement = null;
        for (let e of iterable) {
            let value = valueFunc(e);
            if (value >= maxValue) {
                maxValue = value;
                maxElement = e;
            }
        }
        return maxElement;
    }

    /**
     * valueFuncを最小にする要素を一つ求める。
     * 最初に見つかったものを返す。
     * @template T
     * @param {Iterable<T>|Generator<T>} iterable
     * @param {(i: T) => number} valueFunc
     * @returns {T}
     */
    static minElement(iterable, valueFunc) {
        return this.maxElement(iterable, e => -valueFunc(e));
    }

    /**
     * valueFuncを最大にする要素を全て求める。
     * @template T
     * @param {Iterable<T>|Generator<T>} iterable
     * @param {(i: T) => number} valueFunc
     * @returns {T[]}
     */
    static maxElements(iterable, valueFunc) {
        let maxValue = Number.MIN_SAFE_INTEGER;
        let maxElements = [];
        for (let e of iterable) {
            let value = valueFunc(e);
            if (value > maxValue) {
                maxValue = value;
                maxElements = [e];
            } else if (value === maxValue) {
                maxElements.push(e);
            }
        }
        return maxElements;
    }

    /**
     * valueFuncを最小にする要素を全て求める。
     * @template T
     * @param {Iterable<T>|Generator<T>} iterable
     * @param {(i: T) => number} valueFunc
     * @returns {T[]}
     */
    static minElements(iterable, valueFunc) {
        return this.maxElements(iterable, e => -valueFunc(e));
    }

    /**
     * @template T
     * @param {...Iterable<T>} iterables
     * @returns {Iterable<T>}
     */
    static* concat(...iterables) {
        for (const iterable of iterables) {
            yield* iterable;
        }
    }

    /**
     * @template T1, T2
     * @param {Iterable<T1>} iterable
     * @param {function(T1): T2} func
     * @return {Iterable<T2>}
     */
    static* map(iterable, func) {
        for (const value of iterable) {
            yield func(value);
        }
    }

    /**
     * @template T
     * @param {Iterable<T>} iterable
     * @param {function(T): boolean} func
     * @return {Iterable<T>}
     */
    static* filter(iterable, func) {
        for (const value of iterable) {
            if (func(value)) yield value;
        }
    }

    /**
     * @template T
     * @param {...Iterable<T>} iterables
     * @returns {Set<T>}
     */
    static unique(...iterables) {
        return new Set(this.concat(...iterables));
    }

    /**
     * @template T
     * @param {Iterable<T>} iterable
     * @param {T} value
     * @returns {boolean}
     */
    static has(iterable, value) {
        for (const e of iterable) {
            if (e === value) {
                return true;
            }
        }
        return false;
    }
}

class GeneratorUtil {

    /**
     * @template T
     * @param {...Generator<T>} generators
     * @returns Generator<T>
     */
    static* combine(...generators) {
        for (let gen of generators) {
            yield* gen;
        }
    }

    /**
     * @param {...Generator} generators
     * @returns {Generator<Array>}
     */
    static* zip(...generators) {
        while (true) {
            // noinspection JSMismatchedCollectionQueryUpdate
            let values = [];
            for (let generator of generators) {
                let result = generator.next();
                if (result.done) {
                    break;
                }
                values.push(result.value);
            }
            yield values;
        }
    }

    /**
     * @template T
     * @param {Generator<T>} generator
     * @param {(i: T) => boolean} pred
     * @returns {Generator<T>}
     */
    static* filter(generator, pred) {
        for (const value of generator) {
            if (pred(value)) {
                yield value;
            }
        }
    }

    /**
     * @template T
     * @param {Generator<T>} generator
     * @param {(i: T) => boolean} pred
     * @returns {boolean}
     */
    static some(generator, pred) {
        for (const value of generator) {
            if (pred(value)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @template T
     * @param {Generator<T>} generator
     * @param {(i: T) => any} func
     * @returns {void}
     */
    static forEach(generator, func) {
        for (const value of generator) {
            func(value);
        }
    }

    /**
     * @template T
     * @param {Generator<T>} generator
     * @returns {number}
     */
    static count(generator) {
        let count = 0;
        for (const value of generator) {
            count++;
        }
        return count;
    }

    /**
     * @template T
     * @param {Generator<T>} generator
     * @param {(i: T) => boolean} pred
     * @returns {number}
     */
    static countIf(generator, pred) {
        return this.count(this.filter(generator, pred));
    }

    /**
     * @template T
     * @param {Generator<T>} generator
     * @returns {T[]}
     */
    static toArray(generator) {
        return Array.from(generator);
    }
}

class ArrayUtil {
    /**
     * @param {boolean[]} array1
     * @param {boolean[]} array2
     */
    static and(array1, array2) {
        return array1.map((value, index) => value && array2[index]);
    }

    /**
     * @param {boolean[]} array1
     * @param {boolean[]} array2
     */
    static or(array1, array2) {
        return array1.map((value, index) => value || array2[index]);
    }

    /**
     * @param {number[]} array1
     * @param {number[]} array2
     */
    static add(array1, array2) {
        return array1.map((value, index) => value + array2[index]);
    }

    /**
     * @param {number[]} array1
     * @param {number[]} array2
     */
    static sub(array1, array2) {
        return array1.map((value, index) => value - array2[index]);
    }

    /**
     * @param {number[]} array1
     * @param {number[]} array2
     */
    static mult(array1, array2) {
        return array1.map((value, index) => value * array2[index]);
    }

    /**
     * @param {...Array<number>} arrays
     * @returns {number[]}
     */
    static min(...arrays) {
        // 配列の最大長を取得
        const maxLength = Math.max(...arrays.map(arr => arr.length));

        // 各インデックスの最小値を求める
        return Array.from({length: maxLength}, (_, i) => {
            return Math.min(...arrays.map(arr => arr[i] ?? Infinity));
        });
    }

    /**
     * @param {...Array<number>} arrays
     * @returns {number[]}
     */
    static maxByIndex(...arrays) {
        // 配列の最大長を取得
        const maxLength = Math.max(...arrays.map(arr => arr.length));

        // 各インデックスの最大値を求める
        return Array.from({length: maxLength}, (_, i) => {
            return Math.max(...arrays.map(arr => arr[i] ?? -Infinity));
        });
    }

    /**
     * @template T1
     * @template T2
     * @template T3
     * @param {T1[]} array1
     * @param {T2[]} array2
     * @param {function(T1, T2): T3} func
     */
    static apply(array1, array2, func) {
        return array1.map((value, index) => func(value, array2[index]));
    }

    static sum(array) {
        return array.reduce((a, b) => a + b, 0);
    }
}

/**
 * Utility class for performing set operations.
 */
class SetUtil {
    /**
     * Computes the union of multiple sets.
     * @template T
     * @param {...Set<T>} sets - A list of sets.
     * @returns {Set<T>} A new set that contains all unique elements from all sets.
     */
    static union(...sets) {
        return new Set(sets.reduce((acc, set) => [...acc, ...set], []));
    }

    /**
     * Computes the intersection of multiple sets.
     * @template T
     * @param {...Set<T>} sets - A list of sets.
     * @returns {Set<T>} A new set that contains elements present in all sets.
     */
    static intersection(...sets) {
        if (sets.length === 0) return new Set();
        return sets.reduce((acc, set) => new Set([...acc].filter(item => set.has(item))));
    }

    /**
     * Computes the difference of multiple sets.
     * @template T
     * @param {Set<T>} baseSet - The base set.
     * @param {...Set<T>} sets - A list of sets to subtract from the base set.
     * @returns {Set<T>} A new set that contains elements in the base set but not in the other sets.
     */
    static difference(baseSet, ...sets) {
        return sets.reduce((acc, set) => new Set([...acc].filter(item => !set.has(item))), baseSet);
    }

    /**
     * Computes the symmetric difference of multiple sets.
     * @template T
     * @param {...Set<T>} sets - A list of sets.
     * @returns {Set<T>} A new set that contains elements in either one of the sets but not in both.
     */
    static symmetricDifference(...sets) {
        if (sets.length === 0) return new Set();
        return sets.reduce((acc, set) => {
            const union = SetUtil.union(acc, set);
            const intersection = SetUtil.intersection(acc, set);
            return SetUtil.difference(union, intersection);
        });
    }

    /**
     * @template T
     * @param {Set<T>} targetSet
     * @param {Iterable<T>} items
     */
    static addAll(targetSet, items) {
        for (const item of items) {
            targetSet.add(item);
        }
    }

    static toString(set) {
        return `{${Array.from(set).join(',')}}`;
    }
}

class MathUtil {
    /**
     * 「最低min、最大max」した値を返す。
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static ensureMinMax(value, min, max) {
        let v = value;
        v = MathUtil.ensureMin(v, min);
        v = MathUtil.ensureMax(v, max);
        return v;
    }

    /**
     * 「最低min」した値を返す。
     * @param {number} value
     * @param {number} min
     * @returns {number}
     */
    static ensureMin(value, min) {
        return Math.max(value, min);
    }

    /**
     * 「最大max」した値を返す。
     * @param {number} value
     * @param {number} max
     * @returns {number}
     */
    static ensureMax(value, max) {
        return Math.min(value, max);
    }

    static truncByPercentage(ratio) {
        return Math.trunc(ratio * 100) / 100;
    }
}

class DebugUtil {
    static getSkillName(unit, info) {
        return `${unit.nameWithGroup}の${info.name}`;
    }
}

class MapUtil {
    static INF = Infinity;

    // --- 優先度付きキュー（ダイクストラ法で使用） ---
    static PriorityQueue = class {
        constructor() {
            this.queue = [];
        }

        enqueue(cost, index) {
            this.queue.push({ cost, index });
            this.queue.sort((a, b) => a.cost - b.cost); // コストの昇順ソート
        }

        dequeue() {
            return this.queue.shift(); // 最小コストの要素を取り出す
        }

        isEmpty() {
            return this.queue.length === 0;
        }
    };

    // --- 最短コスト計算（ダイクストラ法） ---
    static minCost(costMap, width, height, startX, startY) {
        const minCostMap = Array(width * height).fill(this.INF);
        const startIndex = startX + startY * width; // 計算式変更
        minCostMap[startIndex] = 0;

        // 優先度付きキューを作成
        const pq = new this.PriorityQueue();
        pq.enqueue(0, startIndex);

        // 4方向移動（上、下、左、右）
        const directions = [-width, width, -1, 1];

        while (!pq.isEmpty()) {
            const { cost: currentCost, index } = pq.dequeue();
            if (currentCost > minCostMap[index]) continue;

            for (const d of directions) {
                const newIndex = index + d;
                const x = index % width;
                const y = Math.floor(index / width);
                const newX = newIndex % width;
                const newY = Math.floor(newIndex / width);

                if (
                    newIndex >= 0 && newIndex < width * height &&
                    Math.abs(x - newX) + Math.abs(y - newY) === 1 &&
                    costMap[newIndex] !== this.INF
                ) {
                    const newCost = currentCost + costMap[newIndex];
                    if (newCost < minCostMap[newIndex]) {
                        minCostMap[newIndex] = newCost;
                        pq.enqueue(newCost, newIndex);
                    }
                }
            }
        }
        return minCostMap;
    }

    // --- 最小コストのマスを取得 ---
    static getMinCostIndexes(costMap) {
        let minCost = Math.min(...costMap.filter(cost => cost !== this.INF));
        return costMap
            .map((cost, index) => (cost === minCost ? index : -1))
            .filter(index => index !== -1);
    }

    // --- 上・右の優先順位でインデックスをソート ---
    static sortIndexesByPriorityOfCallingCircleTile(cells, width) {
        return cells.sort((a, b) => {
            const ax = a % width, ay = Math.floor(a / width);
            const bx = b % width, by = Math.floor(b / width);
            return ay - by || bx - ax;
        });
    }

    static calculateDistanceMap(width, height, startX, startY) {
        const distanceMap = Array(width * height).fill(0);
        for (let i = 0; i < width * height; i++) {
            const x = i % width;
            const y = Math.floor(i / width);
            distanceMap[i] = Math.abs(x - startX) + Math.abs(y - startY);
        }
        return distanceMap;
    }
}

class HtmlLogUtil {
    /**
     * @param {Unit} unit
     * @returns {string}
     */
    static groupNameSpan(unit) {
        let isAlly = unit.groupId === UnitGroupType.Ally;
        let groupClass = isAlly ? "log-ally" : "log-enemy";
        let groupName = isAlly ? "自" : "敵";
        return `<span class="${groupClass}">${groupName}</span>`
    }

    static damageSpan(damage) {
        return `<span class="log-damage">${damage}</span>`;
    }

    static specialSpan(text) {
        return `<span class="log-special-str">${text}</span>`;
    }
}

/**
 * A utility class for Base62 encoding and decoding of arbitrary strings.
 * Uses UTF-8 encoding internally and BigInt for precision.
 */
class Base62 {
    // noinspection SpellCheckingInspection
    /** @private @constant {string} The Base62 character set (0-9, A-Z, a-z) */
    static #CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    /** @private @constant {bigint} The base (62) as BigInt */
    static #BASE = BigInt(Base62.#CHARS.length);

    /**
     * Encodes an arbitrary UTF-8 string into a Base62 string.
     *
     * @param {string} str - The input string to encode.
     * @returns {string} The Base62-encoded string.
     *
     * @example
     * const encoded = Base62.encode("Hello🌸");
     * console.log(encoded); // => e.g., "9Hnd82..." (Base62)
     */
    static encode(str) {
        const utf8 = new TextEncoder().encode(str);
        let num = BigInt(0);
        for (let byte of utf8) {
            num = (num << 8n) + BigInt(byte);
        }

        if (num === 0n) return Base62.#CHARS[0];

        let result = '';
        while (num > 0n) {
            result = Base62.#CHARS[num % Base62.#BASE] + result;
            num /= Base62.#BASE;
        }
        return result;
    }

    /**
     * Decodes a Base62 string back to the original UTF-8 string.
     *
     * @param {string} base62Str - A valid Base62-encoded string.
     * @returns {string} The original decoded string.
     *
     * @throws {Error} If the input contains invalid Base62 characters.
     *
     * @example
     * const decoded = Base62.decode("9Hnd82...");
     * console.log(decoded); // => "Hello🌸"
     */
    static decode(base62Str) {
        let num = BigInt(0);
        for (let c of base62Str) {
            const index = Base62.#CHARS.indexOf(c);
            if (index === -1) throw new Error(`Invalid character: ${c}`);
            num = num * Base62.#BASE + BigInt(index);
        }

        const bytes = [];
        while (num > 0n) {
            bytes.unshift(Number(num & 0xFFn));
            num >>= 8n;
        }

        return new TextDecoder().decode(new Uint8Array(bytes));
    }

    static tryDecode(base62Str, defaultValue = null) {
        let result = defaultValue;
        try {
            result = this.decode(base62Str);
        } catch (e) {
            return result;
        }
        return result;
    }
}

class Base62Util {
    static encodeSet(set) {
        return Base62.encode(JSON.stringify(Array.from(set)));
    }

    static decodeSet(str) {
        return new Set(JSON.parse(Base62.decode(str)));
    }
}

class JsonUtil {
    static tryParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }
}
