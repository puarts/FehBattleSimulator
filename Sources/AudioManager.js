

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
        let candidates = this.__getBgmCandidates();
        let index = Math.floor(candidates.length * Math.random());
        this.currentBgmId = Number(candidates[index]);
        ++this._bgmSelectedCounts[this.currentBgmId];
    }

    __getBgmCandidates() {
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
