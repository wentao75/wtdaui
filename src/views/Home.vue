<template>
    <el-container>
        <el-header
            ><el-autocomplete
                placeholder="请输入股票代码"
                v-model="tsCode"
                :fetch-suggestions="queryStockCode"
                @select="handleSelect"
                clearable
            ></el-autocomplete
        ></el-header>
        <el-main v-loading="loading || !$store.state.initDataFinished">
            <TrendGraph :tsCode="selectedTsCode" :data="dailyData" />
            <!-- <div id="graph" :style="graphStyle"></div> -->

            <!-- <RelationsOfVolatile :tsCode="graphTsCode" /> -->
        </el-main>
        <!-- <div id="home"></div> -->
    </el-container>
</template>

<script>
import { useStore } from "../composables/use-store.js";
import { useSearchStock } from "../composables/use-search-stock.js";

// @ is an alias to /src
import TrendGraph from "@/components/TrendGraph.vue";
// import RelationsOfVolatile from "@/comonents/RelationsOfVolatile.vue";

export default {
    name: "StockHome",
    setup() {
        const store = useStore();
        const {
            tsCode,
            selectedTsCode,
            loading,
            dailyData,
            queryStockCode,
            handleSelect
        } = useSearchStock(store);

        return {
            tsCode,
            selectedTsCode,
            loading,
            dailyData,
            queryStockCode,
            handleSelect
        };
    },

    components: {
        TrendGraph
        // RelationsOfVolatile
    }
};
</script>

<style>
#home {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
}
</style>
