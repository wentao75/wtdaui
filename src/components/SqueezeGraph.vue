<template>
    <div id="graph" style="width:100%;height:100%"></div>
</template>

<script>
import { useStore } from "../composables/use-store.js";
import useSqueezeGraph from "../composables/use-ttm-squeeze-graph.js";
import useQuoteData from "../composables/use-update-quote.js";
import { watch, watchEffect } from "@vue/composition-api";

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
        const { dataReady, updateGraph } = useSqueezeGraph(
            store,
            "graph",
            props
        );
        const { quoteData } = useQuoteData(props, updateGraph);

        watch(
            () => quoteData && quoteData.update_time,
            quoteData => {
                console.log("侦测到实时数据变化，更新图形！");
                updateGraph(quoteData);
            }
        );

        watchEffect(() => {
            console.log(`watch effect quote data: %o`, quoteData);
        });

        return {
            dataReady,
            quoteData
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
