<template>
    <div id="graph" style="width:100%;height:100%"></div>
</template>

<script>
import { useStore } from "../composables/use-store.js";
import useSqueezeGraph from "../composables/use-ttm-squeeze-graph.js";

export default {
    name: "DailyGraph",
    props: {
        tsCode: String,
        data: Object,
        params: {
            type: Object,
            required: false,
            default: () => ({
                downColor: "#00da3c",
                upColor: "#ec0000",
                n: 20,
                m: 1.5,
                bm: 2
            })
        }
    },

    setup(props) {
        const store = useStore();
        const { dataReady } = useSqueezeGraph(store, "graph", props);

        return {
            dataReady
        };
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#graph {
    padding: 0px;
}
</style>
