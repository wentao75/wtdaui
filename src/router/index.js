import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import Indicator from "../views/Indicator.vue";

Vue.use(VueRouter);

const routes = [
    {
        path: "/",
        redirect: "/indicator"
    },
    {
        path: "/home",
        name: "Home",
        component: Home
    },
    {
        path: "/indicator",
        name: "Indicator",
        component: Indicator
    }
    // {
    //     path: "/trend",
    //     name: "StockTrend",
    //     component: () =>
    //         import(
    //             /* webpackChunkName: "stock" */ "../components/TrendGraph.vue"
    //         )
    // }
];

const router = new VueRouter({
    mode: "hash",
    base: process.env.BASE_URL,
    routes
});

export default router;
