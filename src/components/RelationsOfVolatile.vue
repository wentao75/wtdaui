<template>
    <el-container>
        <el-header
            ><el-autocomplete
                placeholder="请输入股票代码"
                v-model="graphTsCode"
                :fetch-suggestions="queryStockCode"
                @select="handleSelect"
                clearable
            ></el-autocomplete
        ></el-header>
        <el-main v-loading="loading || !$store.state.initDataFinished">
            <div id="graph" :style="graphStyle"></div>
        </el-main>
    </el-container>
</template>

<script>
// 这个组件用来计算和显示指定一个daily价格变动的分布图，使用点图显示
// 横坐标为开盘价与最低价波幅占比；纵坐标为开盘价与收盘价的价差
export default {
    name: "RelationsOfVolatile",
    props: {
        tsCode: String
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
