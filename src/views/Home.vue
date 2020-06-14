<template>
    <el-container>
        <el-header>
            <el-autocomplete
                placeholder="请输入股票代码"
                v-model="tsCode"
                :fetch-suggestions="queryStockCode"
                @select="handleSelect"
                clearable
            ></el-autocomplete>
            <el-radio-group v-model="activeGraph">
                <el-radio-button label="trend" value="trend"
                    >趋势图</el-radio-button
                >
                <el-radio-button label="volatile" value="volatile"
                    >开盘分布</el-radio-button
                >
            </el-radio-group>
        </el-header>
        <el-main v-loading="loading || !$store.state.initDataFinished">
            <TrendGraph
                v-if="activeGraph === 'trend'"
                :tsCode="selectedTsCode"
                :data="dailyData"
            />
            <RelationsOfVolatile
                v-if="activeGraph === 'volatile'"
                :tsCode="selectedTsCode"
                :data="dailyData"
            />
        </el-main>
    </el-container>
</template>

<script>
import { useStore } from "../composables/use-store.js";
import { useSearchStock } from "../composables/use-search-stock.js";

// @ is an alias to /src
import TrendGraph from "@/components/TrendGraph.vue";
import RelationsOfVolatile from "@/components/RelationsOfVolatile.vue";

export default {
    name: "StockHome",
    data() {
        return {
            activeGraph: "trend"
        };
    },
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
        TrendGraph,
        RelationsOfVolatile
    }
};
</script>

<style>
.el-autocomplete {
    margin: 10px;
}
.el-tab-pane .el-tabs {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
}
</style>
