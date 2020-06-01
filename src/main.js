import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Echarts from "echarts";
import "./plugins/element.js";

Vue.config.productionTip = false;
Vue.prototype.echarts = Echarts;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");
