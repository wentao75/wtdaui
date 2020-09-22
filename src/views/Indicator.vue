<template>
    <el-container>
        <el-aside style="width: 200px;">
            <el-menu :collapse="false" @select="handleSelectMenu">
                <el-submenu index="1">
                    <template slot="title">
                        <i class="el-icon-s-home"></i>
                        <span slot="title">自选</span>
                    </template>
                    <!-- <el-menu-item-group> -->
                    <el-menu-item
                        style="line-height: 24px; height: 26px; padding-left: 10px; padding-right: 24px;"
                        :index="item.value"
                        v-for="item in $store.state.favoriteList"
                        :key="item.value"
                    >
                        <el-col>
                            <span class="stockcode">{{ item.ts_code }}</span>
                            <span class="stockname">{{ item.name }}</span>
                        </el-col>
                    </el-menu-item>
                    <!-- </el-menu-item-group> -->
                </el-submenu>
                <el-submenu index="2">
                    <template slot="title">
                        <i class="el-icon-finished"></i>
                        <span slot="title">鸡排</span>
                    </template>
                    <el-submenu index="2-1">
                        <template slot="title">买入</template>
                        <el-submenu
                            :index="'2-1-' + index"
                            v-for="(list, index) in $store.state.squeezeList &&
                                $store.state.squeezeList[0]"
                            :key="'2-1-' + index"
                        >
                            <template slot="title"
                                ><el-badge :value="list.length" class="item"
                                    >分组{{ index + 1 }}</el-badge
                                ></template
                            >
                            <el-menu-item
                                style="line-height: 24px; height: 26px; padding-left: 10px; padding-right: 24px;"
                                :index="item.ts_code"
                                v-for="item in list"
                                :key="item.ts_code"
                            >
                                <el-col>
                                    <span class="stockcode">{{
                                        item.ts_code
                                    }}</span>
                                    <span class="stockname">{{
                                        item.name
                                    }}</span>
                                </el-col>
                            </el-menu-item>
                        </el-submenu>
                    </el-submenu>
                    <el-submenu index="2-2">
                        <template slot="title">准备</template>
                        <el-submenu
                            :index="'2-2-' + index"
                            v-for="(list, index) in $store.state.squeezeList &&
                                $store.state.squeezeList[1]"
                            :key="'2-2-' + index"
                        >
                            <template slot="title">
                                <el-badge :value="list.length" class="item">
                                    分组{{ index + 1 }}</el-badge
                                ></template
                            >
                            <el-menu-item
                                style="line-height: 24px; height: 26px; padding-left: 10px; padding-right: 24px;"
                                :index="item.ts_code"
                                v-for="item in list"
                                :key="item.ts_code"
                            >
                                <el-col>
                                    <span class="stockcode">{{
                                        item.ts_code
                                    }}</span>
                                    <span class="stockname">{{
                                        item.name
                                    }}</span>
                                </el-col>
                            </el-menu-item>
                        </el-submenu>
                    </el-submenu>
                </el-submenu>
            </el-menu>
        </el-aside>
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
                        <span class="stockcode">{{ item.value }}</span>
                        <span class="stockname">{{ item.name }}</span>
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
    methods: {},
    setup() {
        const store = useStore();
        const {
            tsCode,
            selectedTsCode,
            loading,
            dailyData,
            queryStockCode,
            handleSelect,
            refreshGraph
        } = useSearchStock(store, "stockDaily");

        const { refRTData } = useUpdateQuote(selectedTsCode);

        const { addFavorite, removeFavorite } = useFavorites(
            store,
            selectedTsCode
        );

        const handleSelectMenu = index => {
            // console.log(`menu select ${index}`);
            tsCode.value = index;
            refreshGraph();
        };

        return {
            tsCode,
            selectedTsCode,
            loading,
            dailyData,
            refRTData,
            // updateDaily,
            queryStockCode,
            handleSelect,
            refreshGraph,

            addFavorite,
            removeFavorite,

            handleSelectMenu
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

.el-menu-item {
    height: 26px;
    line-height: 24px;
}
.item {
    padding-left: 0px;
    height: 36px;
}
</style>
