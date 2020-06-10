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
import { ipcRenderer } from "electron";
import _ from "lodash";
import log from "electron-log";
// import moment from "moment";

export default {
    name: "TrendGraph",
    data() {
        return {
            loading: false,
            graphTsCode: this.tsCode,
            downColor: "#00da3c",
            upColor: "#ec0000",
            dailyData: [],
            dailyChart: null,
            graphStyle: {
                width: "100%",
                height: "100%"
            }
        };
    },
    watch: {
        graphTsCode: function() {
            this.debouncedRefreshGraph();
        }
    },
    props: {
        tsCode: String
    },
    methods: {
        refreshGraph: function() {
            if (
                this.$store.state.initDataFinished &&
                !_.isEmpty(this.graphTsCode) &&
                /^\d{6}\..{2}$/.test(this.graphTsCode)
            ) {
                console.log(`${this.graphTsCode} 测试通过！`);
                this.loading = true;
                ipcRenderer.send("data-stock-read", {
                    name: "stockTrend",
                    tsCode: this.graphTsCode // this.$route.params.tsCode
                });
            }
        },
        splitData: function(stockData) {
            var categoryData = [];
            var values = [];
            let changes = [];
            // var volumes = [];

            let dailyData = stockData.data.reverse();
            for (var i = 0; i < dailyData.length; i++) {
                categoryData.push(dailyData[i].trade_date);
                values.push([
                    dailyData[i].open,
                    dailyData[i].close,
                    dailyData[i].high,
                    dailyData[i].low
                ]);

                changes.push([
                    i,
                    (
                        (dailyData[i].high - dailyData[i].low) /
                        dailyData[i].open
                    ).toFixed(3)
                ]);
                // volumes.push([
                //     i,
                //     dailyData[i].vol,
                //     dailyData[i].open > dailyData[i].close ? 1 : -1
                // ]);
            }

            return {
                categoryData: categoryData,
                values: values,
                // volumes: volumes,
                changes: changes,
                trends: stockData.trends,
                info: stockData.info
            };
        },
        getGraphOption(data) {
            // 这里需要计算一下zoom的显示范围
            let dataLen = data && data.values ? data.values.length : 0;
            let start = 300 / dataLen;
            if (start >= 1) {
                start = 0;
            } else {
                start = 100 - Number((start * 100).toFixed(2));
            }
            return {
                title: {
                    text:
                        data &&
                        data.info &&
                        data.info.ts_code + " " + data.info.name, //"K线图",
                    left: "5%"
                },
                backgroundColor: "#fff",
                animation: false,
                legend: {
                    // bottom: 10,
                    right: "5%",
                    data: ["日K线", "短期趋势", "中期趋势", "长期趋势"]
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: {
                        type: "cross"
                    },
                    backgroundColor: "rgba(245, 245, 245, 0.8)",
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    textStyle: {
                        color: "#000"
                    },
                    position: function(pos, params, el, elRect, size) {
                        var obj = { top: 10 };
                        obj[
                            ["left", "right"][+(pos[0] < size.viewSize[0] / 2)]
                        ] = 30;
                        return obj;
                    },
                    formatter: function(params) {
                        // console.log('formatter: ', params[0], params[1], params[2], params[4])
                        let tmp = params.filter(param => {
                            return param.seriesIndex === 0;
                        });
                        if (!tmp || !Array.isArray(tmp) || tmp.length !== 1) {
                            return "";
                        }
                        let paramK = tmp[0];

                        tmp = params.filter(param => {
                            return param.seriesIndex === 4;
                        });
                        if (!tmp || !Array.isArray(tmp) || tmp.length !== 1) {
                            return "";
                        }
                        let paramVol = tmp[0];

                        return [
                            paramK.name + '<hr size=1 style="margin: 3px 0">',
                            "开盘: " + paramK.data[1] + "<br/>",
                            "收盘: " + paramK.data[2] + "<br/>",
                            "最高: " + paramK.data[3] + "<br/>",
                            "最低: " + paramK.data[4] + "<br/>",
                            "区间量: " + paramVol.data[1]
                        ].join("");
                    }
                    // extraCssText: 'width: 170px'
                },
                axisPointer: {
                    link: { xAxisIndex: "all" },
                    label: {
                        backgroundColor: "#777"
                    }
                },
                visualMap: {
                    show: false,
                    seriesIndex: 4,
                    dimension: 2,
                    pieces: [
                        {
                            value: 1,
                            color: this.downColor
                        },
                        {
                            value: -1,
                            color: this.upColor
                        }
                    ]
                },
                grid: [
                    {
                        left: "5%",
                        right: "5%",
                        height: "50%"
                    },
                    {
                        left: "5%",
                        right: "5%",
                        top: "63%",
                        height: "21%"
                    }
                ],
                xAxis: [
                    {
                        type: "category",
                        data: data.categoryData,
                        scale: true,
                        boundaryGap: false,
                        axisLine: { onZero: false },
                        splitLine: { show: false },
                        splitNumber: 20,
                        min: "dataMin",
                        max: "dataMax",
                        axisPointer: {
                            z: 100
                        }
                    },
                    {
                        type: "category",
                        gridIndex: 1,
                        data: data.categoryData,
                        scale: true,
                        boundaryGap: false,
                        axisLine: { onZero: false },
                        axisTick: { show: false },
                        splitLine: { show: false },
                        axisLabel: { show: false },
                        splitNumber: 20,
                        min: "dataMin",
                        max: "dataMax"
                    }
                ],
                yAxis: [
                    {
                        scale: true,
                        splitArea: {
                            show: true
                        }
                    },
                    {
                        scale: true,
                        gridIndex: 1,
                        splitNumber: 2,
                        axisLabel: { show: true },
                        axisLine: { show: false },
                        axisTick: { show: true },
                        splitLine: { show: true }
                    }
                ],
                dataZoom: [
                    {
                        type: "inside",
                        xAxisIndex: [0, 1],
                        start: start,
                        end: 100
                    },
                    {
                        show: true,
                        xAxisIndex: [0, 1],
                        type: "slider",
                        top: "90%",
                        start: start,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: "日K线",
                        type: "candlestick",
                        data: data && data.values,
                        itemStyle: {
                            color: this.upColor,
                            color0: this.downColor,
                            borderColor: null,
                            borderColor0: null
                        }
                    },
                    {
                        name: "短期趋势",
                        type: "line",
                        data: data && data.trends && data.trends[0],
                        smooth: false,
                        lineStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: "中期趋势",
                        type: "line",
                        data: data && data.trends && data.trends[1],
                        smooth: false,
                        lineStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: "长期趋势",
                        type: "line",
                        data: data && data.trends && data.trends[2],
                        smooth: false,
                        lineStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: "区间量",
                        type: "line",
                        data: data && data.changes,
                        symbol: "none",
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        markLine: {
                            data: [{ type: "average", name: "平均值" }]
                        }
                    }
                ]
            };
        },
        dataReady(event, rawData) {
            log.info("响应数据返回");
            console.log("响应数据返回");
            this.loading = false;
            let graphElement = document.getElementById("graph");

            if (this.dailyChart === null) {
                // this.dailyChart.clear();
                // this.dailyChart.dispose();
                this.dailyChart = this.echarts.init(graphElement);
                window.addEventListener("resize", () => {
                    this.dailyChart.resize();
                });
            }

            let info = this.$store.getters.queryInfoByCode(rawData.tsCode);
            rawData.info = info;
            this.dailyData = rawData;
            log.info(
                `日线数据长度：${this.dailyData &&
                    this.dailyData.data &&
                    this.dailyData.data.length}, ${rawData.tsCode}, ${info}`
            );
            console.log(
                `日线数据长度：${this.dailyData &&
                    this.dailyData.data &&
                    this.dailyData.data.length}, ${rawData.tsCode}, %o`,
                info
            );

            let data = this.splitData(this.dailyData);
            let option = this.getGraphOption(data);
            this.dailyChart.setOption(option, true);
            this.dailyChart.resize();
        },
        initRefreshGraph() {
            if (this.$store.state.initDataFinished) {
                ipcRenderer.send("data-stock-read", {
                    name: "stockTrend",
                    tsCode: this.graphTsCode // this.$route.params.tsCode
                });
            } else {
                setTimeout(this.initRefreshGraph, 0);
            }
        },
        queryStockCode(queryString, cb) {
            setTimeout(() => {
                log.info(`查询：${queryString}`);
                console.log(`查询：${queryString}`);
                let infos = this.$store.getters.queryCodes(queryString);
                log.info(`结果：${infos && infos.length}`);
                console.log(`结果：${infos && infos.length}`);
                cb(infos);
            }, 0);
        },
        handleSelect() {
            this.refreshGraph();
        }
    },
    created() {
        // 设置返回数据响应
        ipcRenderer.on("data-stockTrend-ready", this.dataReady);

        this.debouncedRefreshGraph = _.debounce(this.refreshGraph, 500);
    },
    mounted() {
        // 初始化数据读取
        // 发出数据读取请求
        log.info("TrendGraph 初始化！");
        this.initRefreshGraph();
    },
    unmounted() {},
    destroyed() {
        if (this.dailyChart !== null) {
            this.dailyChart.clear();
            this.dailyChart.dispose();
        }
        console.log("remove all listeners in stock daily!");
        ipcRenderer.removeAllListeners("data-stockTrend-ready");
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#graph {
    padding: 0px;
}
</style>
