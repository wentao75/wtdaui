<template>
    <div id="graph" style="width:100%;height:100%"></div>
</template>

<script>
import { useStore } from "../composables/use-store";
import useVolatileGraph from "../composables/use-volatile2-graph";
// 这个组件用来计算和显示指定一个daily价格变动的分布图，使用点图显示
// 横坐标为开盘价与最低价波幅占比；纵坐标为开盘价与收盘价的价差
export default {
    name: "VolatileGraph",
    props: {
        tsCode: String,
        data: Object
    },
    setup(props) {
        const store = useStore();
        const { dataReady } = useVolatileGraph(store, "graph", props);
        return {
            dataReady
        };
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
