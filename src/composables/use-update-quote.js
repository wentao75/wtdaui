import { ref, onMounted, onUnmounted, watch } from "@vue/composition-api";
import { ipcRenderer } from "electron";
import moment from "moment";

export default function(tsCode) {
    const refRTData = ref(null);
    // let lastTime;

    let beginTime = "092500";
    let endTime = "150100";
    const needUpdate = () => {
        // if (lastTime) {
        if (refRTData.value === null) return true;

        let now = moment();
        let week = now.day();
        if (week === 0 || week === 6) return false;
        // if (now.diff(lastTime, "days") > 0) return true;
        let nowTime = now.format("HHmmss");
        if (nowTime >= beginTime && nowTime <= endTime) return true;
        // }
        return false;
    };

    let timerQuoteId;
    const refreshQuote = () => {
        // clearTimeout(timerQuoteId);
        if (tsCode && tsCode.value && needUpdate()) {
            console.log(`执行实时数据更新 [${tsCode.value}]...`);

            ipcRenderer.send("data-stock-read", {
                name: "rtQuote",
                tsCode: tsCode.value
            });
        }

        timerQuoteId = setTimeout(refreshQuote, 30 * 1000);
        console.log(`${timerQuoteId} added!`);
    };

    const rtDataReady = (event, data) => {
        console.log(`接收实时数据：%o`, data);
        // 已经接收到最新数据，更新并添加到数据中，然后更新图示

        refRTData.value = data;
        console.log(`实时数据更新完毕（可以检查是否有响应！！）！%o`, data);
    };

    onMounted(() => {
        ipcRenderer.on("data-rtQuote-ready", rtDataReady);
        clearTimeout(timerQuoteId);
        timerQuoteId = setTimeout(refreshQuote, 0);
    });

    onUnmounted(() => {
        ipcRenderer.removeAllListeners("data-rtQuote-ready");
        clearTimeout(timerQuoteId);
    });

    watch(
        () => tsCode.value,
        () => {
            console.log(`代码更新，重新调整计时器`);
            refRTData.value = null;
            clearTimeout(timerQuoteId);
            timerQuoteId = setTimeout(refreshQuote, 0);
        }
    );

    return { refRTData };
}
