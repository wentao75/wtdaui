import { onMounted, onUnmounted, watch } from "@vue/composition-api";
import echarts from "echarts";
import _ from "lodash";
import { indicators, utils } from "@wt/lib-stock";

export default function(store, graphElementId, props) {
    // const tsCode = ref("");

    // const downColor = params.downColor;
    // const upColor = params.upColor;

    let dailyData = null;
    let dailyChart = null;

    const splitData = stockData => {
        var categoryData = [];
        var values = [];
        // let changes = [];

        let dailyData = stockData.data; //.reverse();
        utils.checkTradeData(dailyData);

        // let kcData = KC.keltner(dailyData, { n: 20, m: 1.5 });
        let source = "close";
        console.log(`params: %o`, props.params);
        let kcData = indicators.KC.calculate(dailyData, {
            n: (props && props.params.n) || 20,
            m: (props && props.params.m) || 1.5,
            type1: "ema",
            type2: "ma",
            source
        });
        let bollData = indicators.BOLL.calculate(dailyData, {
            n: (props && props.params.n) || 20,
            m: (props && props.params.bm) || 2,
            ma: "ema",
            source
        });

        let mtmData = indicators.MTM.calculate(dailyData, {
            n: 12,
            source
            // source: "close"
        });

        for (var i = 0; i < dailyData.length - 1; i++) {
            categoryData.push(dailyData[i].trade_date);
            values.push([
                dailyData[i].open,
                dailyData[i].close,
                dailyData[i].high,
                dailyData[i].low
            ]);

            // changes.push([
            //     dailyData[i].trade_date,
            //     _.round(
            //         ((dailyData[i].high - dailyData[i].low) * 100) /
            //             dailyData[i].open,
            //         2
            //     )
            // ]);
            // volumes.push([
            //     i,
            //     dailyData[i].vol,
            //     dailyData[i].open > dailyData[i].close ? 1 : -1
            // ]);
        }

        return {
            categoryData: categoryData,
            values: values,
            kc: kcData,
            boll: bollData,
            mtm: mtmData,
            info: stockData.info
        };
    };

    const getGraphOption = data => {
        // 这里需要计算一下zoom的显示范围
        let dataLen = data && data.values ? data.values.length : 0;
        let start = 100 / dataLen;
        if (start >= 1) {
            start = 0;
        } else {
            start = 100 - Number((start * 100).toFixed(2));
        }
        return {
            backgroundColor: "#000",
            // backgroundColor: "#fff",
            title: {
                text:
                    data &&
                    data.info &&
                    data.info.ts_code + " " + data.info.name, //"K线图",
                top: 10,
                left: "5%"
            },
            animation: false,
            legend: {
                top: 10,
                // bottom: 10,
                right: "5%"
                // data: ["日K线", "短期趋势", "中期趋势", "长期趋势"]
            },
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "cross"
                },
                backgroundColor: "#000", //"rgba(245, 245, 245, 0.8)",
                borderWidth: 1,
                borderColor: "#fff",
                padding: 10,
                textStyle: {
                    color: "#fff"
                },
                position: function(pos, params, el, elRect, size) {
                    var obj = { top: 60 };
                    obj[
                        ["left", "right"][+(pos[0] < size.viewSize[0] / 2)]
                    ] = 30;
                    return obj;
                },
                formatter: function(params) {
                    let paramK;
                    let paramKC = [];
                    let paramBOLL = [];
                    let paramMTM;
                    params.forEach(param => {
                        if (param.seriesIndex >= 1 && param.seriesIndex <= 3) {
                            paramKC[param.seriesIndex - 1] = param;
                        } else if (param.seriesIndex === 0) {
                            paramK = param;
                        } else if (
                            param.seriesIndex === 4 ||
                            param.seriesIndex === 5
                        ) {
                            paramBOLL[param.seriesIndex - 4] = param;
                        } else if (param.seriesIndex === 6) {
                            paramMTM = param;
                        }
                    });

                    return [
                        paramK.name + '<hr size=1 style="margin: 3px 0">',
                        "均值: " + paramKC[0].data + "<br/>",
                        "开盘: " + paramK.data[1] + "<br/>",
                        "收盘: " + paramK.data[2] + "<br/>",
                        "最高: " + paramK.data[3] + "<br/>",
                        "最低: " + paramK.data[4] + "<br/>",
                        "KC上沿: " + paramKC[1].data + "<br/>",
                        "KC下沿: " + paramKC[2].data + "<br/>",
                        "BOLL上沿: " + paramBOLL[0].data + "<br/>",
                        "BOLL下沿: " + paramBOLL[1].data + "<br/>",
                        "MTM: " + paramMTM.data
                    ].join("");
                }
                // extraCssText: 'width: 170px'
            },
            axisPointer: {
                link: { xAxisIndex: "all" },
                label: {
                    backgroundColor: "#000"
                }
            },
            grid: [
                {
                    left: "5%",
                    right: "5%",
                    height: "60%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "73%",
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
                    scale: true
                    // splitArea: {
                    //     show: true
                    // }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLabel: { show: true }, //formatter: "{value}%" },
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
                    top: "96%",
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
                        color: props.params.upColor,
                        color0: props.params.downColor,
                        borderColor: null,
                        borderColor0: null
                    }
                },
                {
                    name: "均值",
                    type: "line",
                    data: data && data.kc && data.kc[0],
                    symbol: "none",
                    smooth: false,
                    lineStyle: {
                        color: "#ff0",
                        opacity: 1,
                        width: 1
                    }
                },
                {
                    name: "KC上沿",
                    type: "line",
                    data: data && data.kc && data.kc[1],
                    showSymbol: false,
                    smooth: false,
                    lineStyle: {
                        color: "#0ff",
                        width: 1,
                        opacity: 1
                    }
                },
                {
                    name: "KC下沿",
                    type: "line",
                    data: data && data.kc && data.kc[2],
                    showSymbol: false,
                    smooth: false,
                    lineStyle: {
                        color: "#0ff",
                        width: 1,
                        opacity: 1
                    }
                },
                {
                    name: "BOLL上沿",
                    type: "line",
                    data: data && data.boll && data.boll[1],
                    showSymbol: false,
                    smooth: false,
                    lineStyle: {
                        color: "#f0f",
                        width: 1,
                        opacity: 1
                    }
                },
                {
                    name: "BOLL下沿",
                    type: "line",
                    data: data && data.boll && data.boll[2],
                    showSymbol: false,
                    smooth: false,
                    lineStyle: {
                        color: "#f0f",
                        width: 1,
                        opacity: 1
                    }
                },
                {
                    name: "MTM",
                    type: "bar", //"line",
                    data: data && data.mtm,
                    symbol: "none",
                    // smooth: true,
                    xAxisIndex: 1,
                    yAxisIndex: 1
                    // markLine: {
                    //     data: [{ type: "average", name: "平均值" }],
                    //     label: {
                    //         formatter: "{c}%"
                    //     }
                    // }
                }
            ]
        };
    };

    const dailyChartResize = () => {
        dailyChart.resize();
    };

    const dataReady = rawData => {
        console.log("trend 处理数据 ...");
        let graphElement = document.getElementById(graphElementId);

        if (dailyChart === null) {
            dailyChart = echarts.init(graphElement);

            window.addEventListener("resize", dailyChartResize);
        }

        if (_.isEmpty(rawData)) {
            console.log(`数据为空，不继续处理...`);
            return;
        }
        dailyData = rawData;
        console.log(
            `日线数据长度：${dailyData &&
                dailyData.data &&
                dailyData.data.length}, ${rawData && rawData.tsCode}, %o`,
            rawData && rawData.info
        );

        let data = splitData(dailyData);
        let option = getGraphOption(data);

        dailyChart.setOption(option, true);
        dailyChart.resize();
        console.log("trend 数据设置完毕！");
    };

    onMounted(() => {
        console.log("trend onMounted");
        dataReady(props.data);
        // if (dailyChart) {
        //     dailyChart.resize();
        // }
        // watchEffect(() => {
        // watch(props, () => {
        //     dataReady(); //props.dailyData);
        // });
    });

    onUnmounted(() => {
        console.log("trend onUnmounted");
        if (dailyChart !== null) {
            dailyChart.clear();
            dailyChart.dispose();
        }
        window.removeEventListener("resize", dailyChartResize);
    });

    watch(
        () => props.data,
        data => {
            console.log("数据变化，开始trendGraph处理...");
            dataReady(data);
        }
    );

    return {
        dataReady
    };
}
