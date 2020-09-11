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
                <el-radio-button label="squeeze" value="squeeze"
                    >Sequeeze</el-radio-button
                >
            </el-radio-group>
        </el-header>
        <el-main v-loading="loading || !$store.state.initDataFinished">
            <DailyGraph
                v-if="activeGraph === 'squeeze'"
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
import DailyGraph from "@/components/DailyGraph.vue";

export default {
    name: "StockHome",
    data() {
        return {
            activeGraph: "squeeze"
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
        } = useSearchStock(store, "stockDaily");

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
        DailyGraph
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
