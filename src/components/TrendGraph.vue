<template>
    <div id="graph" :style="graphStyle"></div>
</template>

<script>
import { ipcRenderer } from "electron";
// import moment from "moment";

export default {
    name: "TrendGraph",
    data() {
        return {
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
    props: {
        tsCode: String
    },
    methods: {
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
        dataReady(event, rawData) {
            let graphElement = document.getElementById("graph");

            if (this.dailyChart) {
                this.dailyChart.clear();
                this.dailyChart.dispose();
            }
            this.dailyChart = this.echarts.init(graphElement);
            this.dailyChart.resize();

            window.addEventListener("resize", () => {
                this.dailyChart.resize();
            });

            this.dailyData = rawData;
            console.log(
                `日线数据长度：${this.dailyData &&
                    this.dailyData.data &&
                    this.dailyData.data.length}`
            );

            let data = this.splitData(this.dailyData);
            let option = {
                title: {
                    text:
                        data &&
                        data.info &&
                        data.info.ts_code + " " + data.info.name, //"K线图",
                    left: 20
                },
                backgroundColor: "#fff",
                animation: false,
                legend: {
                    // bottom: 10,
                    left: "center",
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
                        left: "10%",
                        right: "8%",
                        height: "50%"
                    },
                    {
                        left: "10%",
                        right: "8%",
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
                        start: 98,
                        end: 100
                    },
                    {
                        show: true,
                        xAxisIndex: [0, 1],
                        type: "slider",
                        top: "90%",
                        start: 98,
                        end: 100
                    }
                ],
                series: [
                    {
                        name: "日K线",
                        type: "candlestick",
                        data: data.values,
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
                        data: data.trends[0],
                        smooth: false,
                        lineStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: "中期趋势",
                        type: "line",
                        data: data.trends[1],
                        smooth: false,
                        lineStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: "长期趋势",
                        type: "line",
                        data: data.trends[2],
                        smooth: false,
                        lineStyle: {
                            opacity: 1
                        }
                    },
                    {
                        name: "区间量",
                        type: "line",
                        data: data.changes,
                        symbol: "none",
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        markLine: {
                            data: [{ type: "average", name: "平均值" }]
                        }
                    }
                ]
            };

            this.dailyChart.setOption(option, true);
        }
    },
    created() {
        // 设置返回数据响应
        ipcRenderer.on("data-stockTrend-ready", this.dataReady);
    },
    mounted() {
        // 初始化数据读取
        // 发出数据读取请求
        ipcRenderer.send("data-stock-read", {
            name: "stockTrend",
            tsCode: this.tsCode // this.$route.params.tsCode
        });
    },
    unmounted() {},
    destroyed() {
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
