
const TabId = {
    Basic: 0,
    Advanced: 1,
};

const TabLabels = [
    { id: TabId.Basic, label: "基本" },
    { id: TabId.Advanced, label: "詳細" },
];


/**
 * @param  {Number} a
 * @param  {Number} b
 */
function __calcSquredDifference(a, b) {
    return (a - b) * (a - b);
}
/**
 * @param  {HeroInfo[]} heroInfos
 * @param  {Number[]} averages
 */
function __calcDispersion(heroInfos, averages) {
    let sumOfDispersion = 0;
    let maxDispersion = 0;
    for (let heroInfo of heroInfos) {
        let dispersion = 0;
        dispersion += __calcSquredDifference(heroInfo.hp, averages[0]);
        dispersion += __calcSquredDifference(heroInfo.atk, averages[1]);
        dispersion += __calcSquredDifference(heroInfo.spd, averages[2]);
        dispersion += __calcSquredDifference(heroInfo.def, averages[3]);
        dispersion += __calcSquredDifference(heroInfo.res, averages[4]);
        if (dispersion > maxDispersion) {
            maxDispersion = dispersion;
        }
        sumOfDispersion += dispersion;
    }
    return [sumOfDispersion, maxDispersion];
}
function __calcStandardDeviation(heroInfos, averages) {
    let dispersion = 0;
    for (let heroInfo of heroInfos) {
        dispersion += __calcSquredDifference(heroInfo.hp, averages[0]);
        dispersion += __calcSquredDifference(heroInfo.atk, averages[1]);
        dispersion += __calcSquredDifference(heroInfo.spd, averages[2]);
        dispersion += __calcSquredDifference(heroInfo.def, averages[3]);
        dispersion += __calcSquredDifference(heroInfo.res, averages[4]);
    }
    return dispersion;
}

/**
 * @param  {HeroInfo[]} heroInfos
 */
function __calcAverages(heroInfos) {
    let count = heroInfos.length;
    let hp = 0;
    let atk = 0;
    let spd = 0;
    let def = 0;
    let res = 0;
    for (let unit of heroInfos) {
        hp += unit.hp;
        atk += unit.atk;
        spd += unit.spd;
        def += unit.def;
        res += unit.res;
    }
    return [hp / count, atk / count, spd / count, def / count, res / count];
}

function __calcOriginalStatusAverages(heroInfos) {
    let count = heroInfos.length;
    let hp = 0;
    let atk = 0;
    let spd = 0;
    let def = 0;
    let res = 0;
    for (let unit of heroInfos) {
        hp += unit.originalHp;
        atk += unit.originalAtk;
        spd += unit.originalSpd;
        def += unit.originalDef;
        res += unit.originalRes;
    }
    return [hp / count, atk / count, spd / count, def / count, res / count];
}

const getZeroPaddingNumber = (num, places) => String(num).padStart(places, '0');


/**
 * @param  {HeroInfo[]} heroInfos
 */
function __calcAverageAndDispersion(heroInfos) {
    return __calcDispersion(heroInfos, __calcAverages(heroInfos));
}

const g_dispersionCache = {};
function removeDispersionCache(relatedId) {
    let removeKeys = [];
    for (let key in g_dispersionCache) {
        if (key.includes(relatedId)) {
            removeKeys.push(key);
        }
    }
    for (let key of removeKeys) {
        delete g_dispersionCache[key];
    }
}
/**
 * @param  {String} mergedClusterId
 * @param  {StatusCluster} cluster1
 * @param  {StatusCluster} cluster2
 * @param  {Boolean} isCacheEnabled=false
 */
function __calcMergedClusterAverageAndDispersion(
    mergedClusterId, mergedHeroInfos, isCacheEnabled = false
) {
    if (isCacheEnabled && mergedClusterId in g_dispersionCache) {
        return g_dispersionCache[mergedClusterId];
    }
    else {
        let mergedUnits = mergedHeroInfos;
        let result = __calcAverageAndDispersion(mergedUnits);
        let mergedDispersion = result[0];
        g_dispersionCache[mergedClusterId] = result;
        return result;
    }
}



class StatusCluster {
    constructor(id) {
        this.id = id;
        this.name = "グループ";
        /** @type {HeroInfo[]} */
        this.heroInfos = [];
        /**
         *  正規化後の平均
         * @type {Number[]}
         * */
        this.averages = [];
        /**
         *  正規化前の平均
         * @type {Number[]}
         * */
        this.actualAverages = [];
        this.sumOfDispersion = 0;
        this.dispersion = 0;
        this.standardDeviation = 0;
        this.maxDeviation = 0;
    }

    /**
     * @param  {HeroInfo} element
     */
    addUnit(element) {
        this.heroInfos.push(element);
    }

    /**
     * ウォード法でクラスター間の距離を計算します。
     * @param  {StatusCluster} cluster
     * @param  {Boolean} usesCache=false
     */
    calcWardMethodDistanceAndStandardDeviation(cluster, usesCache = false) {
        let mergedClusterId = this.__getMergedClusterId(cluster);
        let heroInfos = distinct(this.heroInfos.concat(cluster.heroInfos));
        let result = __calcMergedClusterAverageAndDispersion(mergedClusterId, heroInfos, usesCache);
        let mergedSumOfDispersion = result[0];
        let maxDispersion = result[1];
        return [
            mergedSumOfDispersion - cluster.sumOfDispersion - this.sumOfDispersion,
            Math.sqrt(mergedSumOfDispersion / heroInfos.length),
            Math.sqrt(maxDispersion)
        ];
    }

    /**
     * @param  {StatusCluster} cluster
     */
    __getMergedClusterId(cluster) {
        return `${this.id}-${cluster.id}`;
    }

    updateStatusAverages() {
        this.averages = __calcAverages(this.heroInfos);
    }

    updateActualStatusAverage() {
        this.actualAverages = __calcOriginalStatusAverages(this.heroInfos);
    }

    updateDispersion() {
        let result = __calcDispersion(this.heroInfos, this.averages);
        this.sumOfDispersion = result[0];
        let maxDispersion = result[1];
        this.dispersion = this.sumOfDispersion / this.heroInfos.length;
        this.standardDeviation = Math.sqrt(this.dispersion);
        this.maxDeviation = Math.sqrt(maxDispersion);
    }

    __updateAveragesAndDispersion() {
        this.updateStatusAverages();
        this.updateDispersion();
    }

    /**
     * @param  {StatusCluster} cluster
     * @param  {Boolean} usesCache=false
     */
    mergeCluster(cluster, usesCache = false) {
        this.heroInfos = distinct(this.heroInfos.concat(cluster.heroInfos));
        if (usesCache) {
            removeDispersionCache(this.id);
            removeDispersionCache(cluster.id);
        }
        this.__updateAveragesAndDispersion();
    }
}

const ClusteringAlgorithm = {
    Ward: 0,
    // KMeans: 1,
};

const ClusteringHeroType = {
    All: 0,
    InfantryMelee: 1,
    InfantryPhysRanged: 2,
    InfantryMagicRanged: 3,
    ArmorMelee: 4,
    ArmorPhysRanged: 5,
    ArmorMagicRanged: 6,
    CavalryMelee: 7,
    CavalryPhysRanged: 8,
    CavalryMagicRanged: 9,
    FlyingMelee: 10,
    FlyingPhysRanged: 11,
    FlyingMagicRanged: 12,
};

const ClusteringHeroTypeOptions = [
    { label: "全て(重い)", value: ClusteringHeroType.All },
    { label: "歩行近接", value: ClusteringHeroType.InfantryMelee },
    { label: "歩行物理間接", value: ClusteringHeroType.InfantryPhysRanged },
    { label: "歩行魔法間接", value: ClusteringHeroType.InfantryMagicRanged },
    { label: "重装近接", value: ClusteringHeroType.ArmorMelee },
    { label: "重装物理間接", value: ClusteringHeroType.ArmorPhysRanged },
    { label: "重装魔法間接", value: ClusteringHeroType.ArmorMagicRanged },
    { label: "騎馬近接", value: ClusteringHeroType.CavalryMelee },
    { label: "騎馬物理間接", value: ClusteringHeroType.CavalryPhysRanged },
    { label: "騎馬魔法間接", value: ClusteringHeroType.CavalryMagicRanged },
    { label: "飛行近接", value: ClusteringHeroType.FlyingMelee },
    { label: "飛行物理間接", value: ClusteringHeroType.FlyingPhysRanged },
    { label: "飛行魔法間接", value: ClusteringHeroType.FlyingMagicRanged },
];

/**
 * @param  {HeroInfo} heroInfo
 * @returns {ClusteringHeroType}
 */
function getHeroType(heroInfo) {
    switch (heroInfo.moveType) {
        case MoveType.Infantry:
            {
                if (heroInfo.attackRange === 2) {
                    if (isPhysicalWeaponType(heroInfo.weaponTypeValue)) {
                        return ClusteringHeroType.InfantryPhysRanged;
                    }
                    else {
                        return ClusteringHeroType.InfantryMagicRanged;
                    }
                }
                else {
                    return ClusteringHeroType.InfantryMelee;
                }
            }
        case MoveType.Armor:
            {
                if (heroInfo.attackRange === 2) {
                    if (isPhysicalWeaponType(heroInfo.weaponTypeValue)) {
                        return ClusteringHeroType.ArmorPhysRanged;
                    }
                    else {
                        return ClusteringHeroType.ArmorMagicRanged;
                    }
                }
                else {
                    return ClusteringHeroType.ArmorMelee;
                }
            }
        case MoveType.Cavalry:
            {
                if (heroInfo.attackRange === 2) {
                    if (isPhysicalWeaponType(heroInfo.weaponTypeValue)) {
                        return ClusteringHeroType.CavalryPhysRanged;
                    }
                    else {
                        return ClusteringHeroType.CavalryMagicRanged;
                    }
                }
                else {
                    return ClusteringHeroType.CavalryMelee;
                }
            }
        case MoveType.Flying:
            {
                if (heroInfo.attackRange === 2) {
                    if (isPhysicalWeaponType(heroInfo.weaponTypeValue)) {
                        return ClusteringHeroType.FlyingPhysRanged;
                    }
                    else {
                        return ClusteringHeroType.FlyingMagicRanged;
                    }
                }
                else {
                    return ClusteringHeroType.FlyingMelee;
                }
            }
    }
}

class ClusterDistanceInfo {
    constructor(distance, standardDeviation, cluster1, cluster2, maxDeviation) {
        /** @type {StatusCluster} */
        this.cluster1 = cluster1;
        /** @type {StatusCluster} */
        this.cluster2 = cluster2;
        /** @type {Number} */
        this.distance = distance;
        /** @type {Number} */
        this.standardDeviation = standardDeviation;
        this.maxDeviation = maxDeviation;
    }
}

class ClusteringHeroInfo {
    constructor(heroInfo, totalStatusAverage) {
        /** @type {HeroInfo} */
        this.heroInfo = heroInfo;
        let total = this.heroInfo.totalStatus / 5;
        let multiply = totalStatusAverage / 5;
        this.hp = this.heroInfo.hp * multiply / total;
        this.atk = this.heroInfo.atk * multiply / total;
        this.spd = this.heroInfo.spd * multiply / total;
        this.def = this.heroInfo.def * multiply / total;
        this.res = this.heroInfo.res * multiply / total;
    }

    get isHero() {
        return this.heroInfo.howToGet != "";
    }

    get name() {
        return this.heroInfo.name;
    }

    get detailPageUrl() {
        return this.heroInfo.detailPageUrl;
    }

    get iconUrl() {
        return this.heroInfo.iconUrl;
    }

    get originalHp() {
        return this.heroInfo.hp;
    }
    get originalAtk() {
        return this.heroInfo.atk;
    }
    get originalSpd() {
        return this.heroInfo.spd;
    }
    get originalDef() {
        return this.heroInfo.def;
    }
    get originalRes() {
        return this.heroInfo.res;
    }

    get moveType() {
        return this.heroInfo.moveType;
    }
    get attackRange() {
        return this.heroInfo.attackRange;
    }
    get weaponTypeValue() {
        return this.heroInfo.weaponTypeValue;
    }
}

class HeroStatusClustererData extends HeroDatabase {
    /**
     * @param  {HeroInfo[]} inputHeroInfos
     */
    constructor(inputHeroInfos) {
        super(inputHeroInfos);

        this.clusteringHeroInfos = [];
        let totalStatusAverage = 0;
        for (let heroInfo of this.data) {
            totalStatusAverage += heroInfo.totalStatus;
        }
        totalStatusAverage = totalStatusAverage / this.data.length;
        for (let heroInfo of this.data) {
            this.clusteringHeroInfos.push(new ClusteringHeroInfo(heroInfo, totalStatusAverage));
        }

        /** @type {StatusCluster[]} */
        this.clusters = [];

        /** @type {ClusteringHeroType} */
        this.clusteringHeroType = ClusteringHeroType.InfantryMelee;

        this.initClusters();

        /** @type {Number} */
        this.targetClusterCount = 5;

        /** @type {Number} */
        this.maxStandardDeviation = 6;
        this.maxMaxDeviation = 8;

        /** @type {ClusteringAlgorithm} */
        this.clusteringAlgorithm = ClusteringAlgorithm.Ward;

        this.isCurrentSortOrderDescending = false;

        this.isDebugMode = false;

        this.activeTabIndex = 0;

        // ウォード法関連 -----
        this.saveMinClusterPairCountForWard = 1;
        // --------------------
    }

    initClusters() {
        this.__initClusters(x => x.isHero && (this.clusteringHeroType == ClusteringHeroType.All || getHeroType(x) == this.clusteringHeroType));
    }

    /**
     * @param  {Function} predicateClusterHeroFunc
     */
    __initClusters(predicateClusterHeroFunc) {
        let clusterId = 0;
        let heroInfos = this.clusteringHeroInfos;
        this.clusters = [];
        for (let heroInfo of heroInfos) {
            if (!predicateClusterHeroFunc(heroInfo)) {
                continue;
            }

            let cluster = new StatusCluster(getZeroPaddingNumber(clusterId, 5));
            ++clusterId;
            cluster.addUnit(heroInfo);
            cluster.updateStatusAverages();
            cluster.updateDispersion();
            cluster.updateActualStatusAverage();
            this.clusters.push(cluster);
        }
    }

    mergeClusters() {
        let self = this;
        let clusterCount = this.clusters.length;
        let targetClusterCount = this.targetClusterCount;
        let mergeClusterCount = clusterCount - this.targetClusterCount;
        let saveMinClusterPairCount = this.saveMinClusterPairCountForWard;
        let startTime = Date.now();
        let iterateCount = mergeClusterCount;
        let prevClusterCount = clusterCount;
        let breakFunc = () => {
            console.log(`prevClusterCount=${prevClusterCount}, self.clusters.length=${self.clusters.length}`);
            let isBroken = prevClusterCount == self.clusters.length || self.clusters.length <= targetClusterCount;
            prevClusterCount = self.clusters.length;
            return isBroken;
        };
        // iterateCount = 5;
        // breakFunc = null;
        startProgressiveProcess(
            iterateCount,
            (iter) => {
                using(new ScopedStopwatch(time => console.log("クラスターの結合1回: " + time + " ms")), () => {
                    self.__mergeMinimuDistanceClusterPair(
                        self.clusters.length - saveMinClusterPairCount < targetClusterCount ? 1 : saveMinClusterPairCount);
                });
                console.log(`${iter} キャッシュの長さ: ${Object.keys(g_dispersionCache).length}`);
            },
            () => {
            },
            () => {
                const endTime = Date.now();
                let diff = endTime - startTime;
                for (let cluster of self.clusters) {
                    cluster.updateActualStatusAverage();
                }
                console.log(`iterateCount=${iterateCount}`);
                console.log("mergeClusterCount=" + mergeClusterCount);
                console.log("目標までのクラスター結合: " + diff + " ms");
            },
            0,
            breakFunc
        );
    }

    __mergeMinimuDistanceClusterPair(saveMinClusterPairCount = 10) {
        let clusterCount = this.clusters.length;

        /** @type {ClusterDistanceInfo[]} */
        let minDistanceClusterPairs = [];

        let isCacheEnabled = true;
        let self = this;
        let log = "";
        using(new ScopedStopwatch(time => log += "分散の計算: " + time + " ms"), () => {
            for (let i = 0; i < clusterCount; ++i) {
                for (let j = i + 1; j < clusterCount; ++j) {
                    let cluster1 = self.clusters[i];
                    let cluster2 = self.clusters[j];
                    let distanceAndSd = cluster1.calcWardMethodDistanceAndStandardDeviation(cluster2, isCacheEnabled);
                    let distance = distanceAndSd[0];
                    let sd = distanceAndSd[1];
                    let maxDeviation = distanceAndSd[2];
                    if (minDistanceClusterPairs.length < saveMinClusterPairCount) {
                        minDistanceClusterPairs.push(new ClusterDistanceInfo(distance, sd, cluster1, cluster2, maxDeviation));
                        minDistanceClusterPairs.sort((a, b) => a.distance - b.distance);
                    }
                    else {
                        for (let clusterIndex = 0; clusterIndex < minDistanceClusterPairs.length; ++clusterIndex) {
                            let info = minDistanceClusterPairs[clusterIndex];
                            if (distance < info.distance) {
                                minDistanceClusterPairs[clusterIndex] = new ClusterDistanceInfo(distance, sd, cluster1, cluster2, maxDeviation);
                                break;
                            }
                        }
                    }
                }
            }
        });

        using(new ScopedStopwatch(time => log += ", クラスターの結合とキャッシュ削除: " + time + " ms"), () => {
            this.__removeColidedClusterPairs(minDistanceClusterPairs);

            for (let info of minDistanceClusterPairs) {
                console.log(`${info.cluster1.id} ${info.cluster2.id}: distance=${info.distance}, standardDeviation=${info.standardDeviation}`);
            }

            for (let info of minDistanceClusterPairs) {
                if (info.standardDeviation > self.maxStandardDeviation) {
                    continue;
                }
                if (info.maxDeviation > self.maxMaxDeviation) {
                    continue;
                }

                // console.log(`cluster1 ${info.cluster1.id} count = ${info.cluster1.heroInfos.length}`);
                // for (let heroInfo of info.cluster1.heroInfos) {
                //     console.log(`${heroInfo.name}`);
                // }
                // console.log(`cluster2 ${info.cluster2.id} count = ${info.cluster2.heroInfos.length}`);
                // for (let heroInfo of info.cluster2.heroInfos) {
                //     console.log(`${heroInfo.name}`);
                // }
                let total = info.cluster1.heroInfos.length + info.cluster2.heroInfos.length;

                info.cluster1.mergeCluster(info.cluster2, isCacheEnabled);
                // console.log(`merged count = ${info.cluster1.heroInfos.length}`);
                if (total != info.cluster1.heroInfos.length) {
                    throw new Error(`${total}!=${info.cluster1.heroInfos.length}`);
                }
                self.__removeCluster(info.cluster2);
            }
        });

        console.log(log);
    }

    __removeColidedClusterPairs(minDistanceClusterPairs) {
        let prevCount = 0;
        do {
            prevCount = minDistanceClusterPairs.length;
            this.__removeFirstColidedClusterPair(minDistanceClusterPairs);
        } while (minDistanceClusterPairs.length < prevCount);
    }

    __removeFirstColidedClusterPair(minDistanceClusterPairs) {
        for (let i = minDistanceClusterPairs.length - 1; i >= 0; --i) {
            for (let j = i - 1; j >= 0; --j) {
                let clusterPair1 = minDistanceClusterPairs[i];
                let clusterPair2 = minDistanceClusterPairs[j];
                if (clusterPair1.cluster1 != clusterPair2.cluster1
                    || clusterPair1.cluster1 != clusterPair2.cluster2
                    || clusterPair1.cluster2 != clusterPair2.cluster1
                    || clusterPair1.cluster2 != clusterPair2.cluster2
                ) {
                    const index = minDistanceClusterPairs.indexOf(clusterPair1);
                    minDistanceClusterPairs.splice(index, 1);
                    return;
                }
            }
        }
    }

    /**
     * @param  {StatusCluster} cluster
     */
    __removeCluster(cluster) {
        const index = this.clusters.indexOf(cluster);
        this.clusters.splice(index, 1);
        if (this.clusters.indexOf(cluster) >= 0) {
            throw new Error(`failed to remove ${cluster.id}`);
        }
    }

    sortClusters(statusIndex) {
        this.isCurrentSortOrderDescending = !this.isCurrentSortOrderDescending;
        if (this.isCurrentSortOrderDescending) {
            this.clusters.sort((a, b) => b.averages[statusIndex] - a.averages[statusIndex]);
        }
        else {
            this.clusters.sort((a, b) => a.averages[statusIndex] - b.averages[statusIndex]);
        }
    }
}

let g_heroStatusClustererData = null;
let g_heroStatusClustererViewModel = null;
function initializeStatusClusterer(heroInfos) {
    g_heroStatusClustererData = new HeroStatusClustererData(heroInfos);
    g_heroStatusClustererViewModel = new Vue({
        el: "#heroStatusClusterer",
        data: g_heroStatusClustererData,
        methods: {
            mergeClusters() {
                g_heroStatusClustererData.initClusters();
                g_heroStatusClustererData.mergeClusters();
            },
            clusteringTargetChanged() {
                g_heroStatusClustererData.initClusters();
            },
            changeTab(index) {
                this.activeTabIndex = index;
            },
        }
    });
}
