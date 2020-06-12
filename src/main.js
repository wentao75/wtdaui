import Vue from "vue";
import App from "./App.vue";
import VueCompositionApi from "@vue/composition-api";
import router from "./router";
import store from "./store";
import Echarts from "echarts";
import "./plugins/element.js";
import { ipcRenderer } from "electron";
import log from "electron-log";

Vue.use(VueCompositionApi);

Vue.config.productionTip = false;
Vue.prototype.echarts = Echarts;

// 考虑在这里进行store中股票列表的初始化，为后续的查询以及界面响应提供信息
ipcRenderer.send("init-stockList");
ipcRenderer.on("init-stockList-ready", (event, data) => {
    // 返回股票列表数据，更新store中对应的数据内容
    log.log(
        `返回股票列表 ${data &&
            data.stock &&
            data.stock.length}, 指数列表：${data &&
            data.index &&
            data.index.length}`
    );
    console.log(
        `返回股票列表 ${data &&
            data.stock &&
            data.stock.length}, 指数列表：${data &&
            data.index &&
            data.index.length}, %o`,
        event
    );
    // store.commit("setStockList", data.stock);
    // store.commit("setIndexList", data.index);
    store.dispatch("setListData", data);
});

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");
