<template>
    <el-container>
        <el-header>
            <el-autocomplete
                popper-class="my-autocomplete"
                placeholder="请输入股票代码"
                v-model="tsCode"
                :fetch-suggestions="queryStockCode"
                @select="handleSelect"
                clearable
            >
                <template slot-scope="{ item }">
                    <span class="stockcode"> {{ item.value }}</span
                    ><span class="stockname">{{ item.name }}</span>
                </template>
            </el-autocomplete>
            <el-radio-group v-model="activeGraph">
                <el-radio-button label="daily" value="daily"
                    >日常</el-radio-button
                >
                <el-radio-button label="squeeze" value="squeeze"
                    >鸡排</el-radio-button
                >
            </el-radio-group>
        </el-header>
        <el-main v-loading="loading || !$store.state.initDataFinished">
            <DailyGraph
                v-if="activeGraph === 'daily'"
                :tsCode="selectedTsCode"
                :data="dailyData"
                :rtData="refRTData"
            />
            <SqueezeGraph
                v-if="activeGraph === 'squeeze'"
                :tsCode="selectedTsCode"
                :data="dailyData"
                :rtData="refRTData"
            />
        </el-main>
    </el-container>
</template>

<script>
import { useStore } from "../composables/use-store.js";
import { useSearchStock } from "../composables/use-search-stock.js";
import useUpdateQuote from "../composables/use-update-quote.js";
// import _ from "lodash";

// @ is an alias to /src
import DailyGraph from "@/components/DailyGraph.vue";
import SqueezeGraph from "../components/SqueezeGraph.vue";
import { watch } from "@vue/composition-api";

export default {
    name: "StockHome",
    data() {
        return {
            activeGraph: "daily"
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

        const { refRTData } = useUpdateQuote(selectedTsCode);

        watch(
            () => refRTData,
            () => {
                console.log(`界面发现数据更新，写入数据：%o`, refRTData);
                dailyData.value.rtData = refRTData.value;
                // updateDaily(refRTData.value, dailyData.data);
            }
        );

        // watch(
        //     () => store.state.defaultStockCode,
        //     () => {
        //         console.log(`设置默认股票代码`);
        //         if (
        //             _.isEmpty(tsCode.value) &&
        //             _.isEmpty(selectedTsCode) &&
        //             !_.isEmpty(store.state.defaultStockCode)
        //         ) {
        //             tsCode.value = store.state.defaultStockCode;
        //         }
        //     }
        // );

        // watchEffect(() => {
        //     console.log(`实时数据更新，updateDaily, %o`, quoteData);
        //     updateDaily(quoteData, dailyData);
        // });

        return {
            tsCode,
            selectedTsCode,
            loading,
            dailyData,
            refRTData,
            // updateDaily,
            queryStockCode,
            handleSelect
        };
    },

    components: {
        DailyGraph,
        SqueezeGraph
    }
};
</script>

<style>
.my-autocomplete {
    margin: 12px;
}

.my-autocomplete li {
    line-height: 24px;
    padding: 7px;
}

.stockcode {
    text-overflow: ellipsis;
    overflow: hidden;
}
.stockname {
    float: right;
    color: #b4b4b4;
}

.highlighted .stockname {
    color: #ddd;
}

.el-tab-pane .el-tabs {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 100%;
}
</style>
