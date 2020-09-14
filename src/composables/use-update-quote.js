import { ref, onMounted, onUnmounted, watch } from "@vue/composition-api";
import { ipcRenderer } from "electron";

export default function(props) {
    const quoteData = ref(null);

    let timerQuoteId;
    const refreshQuote = async () => {
        // clearTimeout(timerQuoteId);
        if (props && props.tsCode) {
            console.log(`执行实时数据更新 [${props.tsCode}]...`);

            ipcRenderer.send("data-stock-read", {
                name: "rtQuote",
                tsCode: props.tsCode
            });
        }

        timerQuoteId = setTimeout(refreshQuote, 30 * 1000);
        console.log(`${timerQuoteId} added!`);
    };

    const rtDataReady = (event, data) => {
        console.log(`接收实时数据：%o`, data);
        // 已经接收到最新数据，更新并添加到数据中，然后更新图示

        let dailyData = props.data;
        if (dailyData && dailyData.data && dailyData.data.length > 0 && data) {
            let lastData = dailyData.data[dailyData.data.length - 1];
            console.log(
                `比较更新数据[${dailyData.data.length}]：${lastData.trade_date} ${data.trade_date}`
            );
            if (lastData.trade_date === data.trade_date) {
                dailyData.data[dailyData.length - 1] = data;
            } else if (lastData.trade_date < data.trade_date) {
                data.adj_factor = lastData.adj_factor;
                dailyData.data.push(data);
            } else {
                return;
            }

            console.log(`实时数据更新完毕！%o`, data);
            quoteData.value = data;
        }
    };

    // const updateDailyData = (dailyData, rtData) => {

    // }

    onMounted(() => {
        ipcRenderer.on("data-rtQuote-ready", rtDataReady);
        clearTimeout(timerQuoteId);
        setTimeout(refreshQuote, 0);
    });

    onUnmounted(() => {
        ipcRenderer.removeAllListeners("data-rtQuote-ready");
        clearTimeout(timerQuoteId);
    });

    watch(
        () => props.tsCode,
        () => {
            clearTimeout(timerQuoteId);
            setTimeout(refreshQuote, 0);
        }
    );
    return { quoteData };
}
