<template>
    <el-container>
        <el-header>
            <el-button-group>
                <el-button
                    v-if="$store.getters.isFavorite(selectedTsCode)"
                    type="info"
                    icon="el-icon-star-off"
                    size="small"
                    @click="removeFavorite"
                    circle
                ></el-button>
                <el-button
                    v-if="!$store.getters.isFavorite(selectedTsCode)"
                    type="success"
                    icon="el-icon-star-off"
                    size="small"
                    @click="addFavorite"
                    circle
                ></el-button>
            </el-button-group>
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
                <el-radio-button label="squeeze" value="squeeze"
                    >鸡排</el-radio-button
                >
                <el-radio-button label="daily" value="daily"
                    >日常</el-radio-button
                >
            </el-radio-group>
        </el-header>

        <el-main v-loading="loading || !$store.state.initDataFinished">
            <SqueezeGraph
                v-if="activeGraph === 'squeeze'"
                :tsCode="selectedTsCode"
                :data="dailyData"
                :rtData="refRTData"
            />
            <DailyGraph
                v-if="activeGraph === 'daily'"
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
import useFavorites from "../composables/use-favorites.js";
// import _ from "lodash";

// @ is an alias to /src
import DailyGraph from "@/components/DailyGraph.vue";
import SqueezeGraph from "../components/SqueezeGraph.vue";
// import { watch } from "@vue/composition-api";

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

        const { refRTData } = useUpdateQuote(selectedTsCode);

        const { addFavorite, removeFavorite } = useFavorites(
            store,
            selectedTsCode
        );

        return {
            tsCode,
            selectedTsCode,
            loading,
            dailyData,
            refRTData,
            // updateDaily,
            queryStockCode,
            handleSelect,

            addFavorite,
            removeFavorite
        };
    },

    components: {
        DailyGraph,
        SqueezeGraph
    }
};
</script>

<style>
.el-autocomplete {
    margin: 10px 10px 10px 2px;
}

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
