import { ref, onMounted, onUnmounted } from "@vue/composition-api";
import { ipcRenderer } from "electron";
import _ from "lodash";
import { utils } from "@wt/lib-stock";

export function useSearchStock(
    store,
    dataType = "stockTrend"
    // defaultCode = "000001.SZ"
) {
    let defaultCode = "000001.SZ";
    let defaultList = store.getters.queryCodes("");
    if (!_.isEmpty(defaultList) && _.isArray(defaultList)) {
        defaultCode = defaultList[0].value;
    }

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
            console.log(`结果：${infos && infos.length}, %o`, infos);
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
                name: dataType,
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
                name: dataType,
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
            utils.checkTradeData(rawData.data);

            dailyData.value = rawData;
            console.log(
                `日线数据长度：${dailyData.value &&
                    dailyData.value.data &&
                    dailyData.value.data.length}, ${rawData.tsCode}, %o`,
                info
            );
        }
    };

    // let timerQuoteId;
    // const refreshTodayQuote = async () => {
    //     if (dailyData && dailyData.tsCode) {
    //         console.log(`执行实时数据更新 [${dailyData.tsCode}]...`);

    //         ipcRenderer.send("data-stock-read", {
    //             name: "rtQuote",
    //             tsCode: dailyData.tsCode
    //         });
    //     }

    //     timerQuoteId = setTimeout(refreshTodayQuote, 30 * 1000);
    //     console.log(`${timerQuoteId} added!`);
    // };

    // const rtDataReady = (event, data) => {
    //     console.log(`接收实时数据：%o`, data);
    //     // 已经接收到最新数据，更新并添加到数据中，然后更新图示

    //     if (dailyData && dailyData.data && dailyData.data.length > 0 && data) {
    //         let lastData = dailyData.data[dailyData.data.length - 1];
    //         console.log(
    //             `比较更新数据[${dailyData.data.length}]：${lastData.trade_date} ${data.trade_date}`
    //         );
    //         if (lastData.trade_date === data.trade_date) {
    //             dailyData.data[dailyData.length - 1] = data;
    //         } else if (lastData.trade_date < data.trade_date) {
    //             data.adj_factor = lastData.adj_factor;
    //             dailyData.data.push(data);
    //         } else {
    //             return;
    //         }

    //         // console.log("更新图形！");
    //         // let updatedData = splitData(dailyData);
    //         // let option = getGraphOption(updatedData);

    //         // dailyChart.setOption(option, true);
    //     }
    // };

    onMounted(() => {
        // 设置返回数据响应
        if (dataType === "stockTrend") {
            ipcRenderer.on("data-stockTrend-ready", dataReady);
        } else {
            ipcRenderer.on("data-stockDaily-ready", dataReady);
        }

        // ipcRenderer.on("data-rtQuote-ready", rtDataReady);
        // 初始化数据读取
        console.log(`${dataType} 初始化！`);
        initRefreshGraph();
    });

    onUnmounted(() => {
        console.log("remove all listeners in stock daily!");
        if (dataType === "stockTrend") {
            ipcRenderer.removeAllListeners("data-stockTrend-ready");
        } else {
            ipcRenderer.removeAllListeners("data-stockDaily-ready");
        }
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
