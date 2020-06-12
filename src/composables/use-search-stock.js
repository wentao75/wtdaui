import { ref, onMounted, onUnmounted } from "@vue/composition-api";
import { ipcRenderer } from "electron";
import _ from "lodash";

export function useSearchStock(store, defaultCode = "000001.SZ") {
    const tsCode = ref(defaultCode);
    const selectedTsCode = ref(defaultCode);
    const loading = ref(false);
    const dailyData = ref(null);

    const queryStockCode = (queryString, cb) => {
        setTimeout(() => {
            // log.info(`查询：${queryString}`);
            console.log(`查询：${queryString}`);
            // 这里调整到通过vuex store传入来处理
            let infos = store.getters.queryCodes(queryString);
            // log.info(`结果：${infos && infos.length}`);
            console.log(`结果：${infos && infos.length}`);
            cb(infos);
        }, 0);
    };

    const refreshGraph = () => {
        // console.log(tsCode);
        if (
            //this.$store.state.initDataFinished &&
            !_.isEmpty(tsCode.value) &&
            /^\d{6}\..{2}$/.test(tsCode.value)
        ) {
            console.log(`${tsCode.value} 测试通过！`);
            loading.value = true;
            selectedTsCode.value = tsCode.value;
            ipcRenderer.send("data-stock-read", {
                name: "stockTrend",
                tsCode: selectedTsCode.value
            });
        }
    };

    const handleSelect = () => {
        refreshGraph();
    };

    const initRefreshGraph = () => {
        if (store.state.initDataFinished) {
            ipcRenderer.send("data-stock-read", {
                name: "stockTrend",
                tsCode: selectedTsCode.value
            });
        } else {
            setTimeout(initRefreshGraph, 0);
        }
    };

    // 响应返回数据
    const dataReady = (event, rawData) => {
        console.log("响应数据返回");
        loading.value = false;
        if (rawData) {
            let info = store.getters.queryInfoByCode(rawData.tsCode);
            rawData.info = info;

            dailyData.value = rawData;
            console.log(
                `日线数据长度：${dailyData.vale &&
                    dailyData.value.data &&
                    dailyData.value.data.length}, ${rawData.tsCode}, %o`,
                info
            );
        }

        // let graphElement = document.getElementById("graph");
        // if (this.dailyChart === null) {
        //     // this.dailyChart.clear();
        //     // this.dailyChart.dispose();
        //     this.dailyChart = this.echarts.init(graphElement);
        //     window.addEventListener("resize", () => {
        //         this.dailyChart.resize();
        //     });
        // }

        // let info = this.$store.getters.queryInfoByCode(rawData.tsCode);
        // rawData.info = info;
        // this.dailyData = rawData;
        // console.log(
        //     `日线数据长度：${this.dailyData &&
        //         this.dailyData.data &&
        //         this.dailyData.data.length}, ${rawData.tsCode}, %o`,
        //     info
        // );

        // let data = this.splitData(this.dailyData);
        // let option = this.getGraphOption(data);
        // this.dailyChart.setOption(option, true);
        // this.dailyChart.resize();
    };

    onMounted(() => {
        // 设置返回数据响应
        ipcRenderer.on("data-stockTrend-ready", dataReady);
        // 初始化数据读取
        console.log("TrendGraph 初始化！");
        initRefreshGraph();
    });

    // onUnmounted() {},
    onUnmounted(() => {
        // if (this.dailyChart !== null) {
        //     this.dailyChart.clear();
        //     this.dailyChart.dispose();
        // }
        console.log("remove all listeners in stock daily!");
        ipcRenderer.removeAllListeners("data-stockTrend-ready");
    });

    return {
        tsCode,
        selectedTsCode,
        loading,
        dailyData,
        queryStockCode,
        handleSelect
    };
}
