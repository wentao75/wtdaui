import { onMounted, onUnmounted, watch } from "@vue/composition-api";
// import { ipcRenderer } from "electron";
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
        let squeezeFlags = [];

        let dailyData = stockData.data; //.reverse();
        utils.checkTradeData(dailyData);

        // let kcData = KC.keltner(dailyData, { n: 20, m: 1.5 });
        let source = "close";
        console.log(`params: %o`, props.params);
        let digits = 3;
        let squeezeData = indicators.SQUEEZE.calculate(dailyData, {
            source,
            ma: "ema",
            n: (props && props.params.n) || 20,
            bm: (props && props.params.bm) || 2,
            km: (props && props.params.m) || 1.5,
            mt: "AO", // "MTM"
            mn: 5,
            mm: 12,
            mmsource: "hl",
            digits
        });

        let kcData = indicators.KC.calculate(dailyData, {
            n: 14,
            m: 1.5,
            type1: "ema",
            type2: "ma",
            source,
            digits
        });
        // let bollData = indicators.BOLL.calculate(dailyData, {
        //     n: (props && props.params.n) || 20,
        //     m: (props && props.params.bm) || 2,
        //     ma: "ema",
        //     source,
        //     digits
        // });

        let mtmData = indicators.MTM.calculate(dailyData, {
            n: 14,
            m: 1,
            source,
            digits
            // source: "close"
        });
        // let mtmData = indicators.AO.calculate(dailyData, {
        //     n: 5,
        //     m: 12,
        //     source,
        //     digits
        //     // source: "close"
        // });

        for (let i = 0; i < dailyData.length; i++) {
            categoryData.push(dailyData[i].trade_date);
            values.push([
                dailyData[i].open,
                dailyData[i].close,
                dailyData[i].high,
                dailyData[i].low
            ]);

            if (squeezeData[6][i] === indicators.SQUEEZE.states.READY) {
                squeezeFlags[i] = 0;
            } else {
                //squeezeFlags[i] = "--";
            }

            squeezeData[5][i] = [i, squeezeData[5][i], squeezeData[6][i]];
        }

        return {
            categoryData: categoryData,
            values: values,
            kc: kcData,
            mtm: mtmData,
            squeeze: squeezeData,
            flags: squeezeFlags,
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
            textStyle: {
                color: "#fff"
            },
            // backgroundColor: "#fff",
            title: {
                text:
                    data &&
                    data.info &&
                    data.info.ts_code + " " + data.info.name, //"K线图",
                textStyle: {
                    color: "#fff"
                },
                top: 10,
                left: "5%"
            },
            animation: false,
            legend: {
                textStyle: {
                    color: "#fff"
                },
                top: 10,
                // bottom: 10,
                right: "5%",
                data: [
                    "ATR-均值",
                    "ATR-上",
                    "ATR-下",
                    "挤牌-均值",
                    "挤牌-B上",
                    "挤牌-B下",
                    "挤牌-K上",
                    "挤牌-K下"
                ]
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
                    let paramMM;
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
                        } else if (param.seriesIndex === 12) {
                            paramMM = param;
                        }
                    });

                    return [
                        paramK.name + '<hr size=1 style="margin: 3px 0">',
                        "均值: " +
                            (paramKC && paramKC[0] && paramKC[0].data) +
                            " [" +
                            (paramMTM && paramMTM.data && paramMTM.data[1]) +
                            ", " +
                            (paramMTM && paramMTM.data && paramMTM.data[2]) +
                            "] <br/>",
                        "开: " +
                            (paramK && paramK.data && paramK.data[1]) +
                            "  收: " +
                            (paramK && paramK.data && paramK.data[2]) +
                            "<br/>",
                        "高: " +
                            (paramK && paramK.data && paramK.data[3]) +
                            ", 低: " +
                            (paramK && paramK.data && paramK.data[4]) +
                            "<br/>",
                        "KC: [" +
                            (paramKC && paramKC[1] && paramKC[1].data) +
                            ", " +
                            (paramKC && paramKC[2] && paramKC[2].data) +
                            "] <br/>",
                        "BOLL: [" +
                            (paramBOLL && paramBOLL[0] && paramBOLL[0].data) +
                            ", " +
                            (paramBOLL && paramBOLL[1] && paramBOLL[1].data) +
                            "]<br/>",
                        "MTM: " + (paramMM && paramMM.data) + "<br/>"
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
                    height: "42%" //"60%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "51%", //"73%",
                    height: "13%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "65%",
                    height: "13%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "80%",
                    height: "13%"
                }
                // {
                //     left: "5%",
                //     right: "5%",
                //     height: "42%" //"60%"
                // },
                // {
                //     left: "5%",
                //     right: "5%",
                //     top: "51%", //"73%",
                //     height: "24%"
                // },
                // {
                //     left: "5%",
                //     right: "5%",
                //     top: "79%",
                //     height: "15%"
                // }
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
                    splitNumber: 20,
                    min: "dataMin",
                    max: "dataMax"
                },
                {
                    type: "category",
                    gridIndex: 2,
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
                },
                {
                    type: "category",
                    gridIndex: 3,
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
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: "#777",
                            type: "dashed"
                        }
                    }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: "#777",
                            type: "dashed"
                        }
                    }
                },
                {
                    scale: true,
                    gridIndex: 2,
                    splitNumber: 3,
                    axisLabel: { show: true },
                    axisLine: { show: false },
                    axisTick: { show: true },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: "#777",
                            type: "dashed"
                        }
                    }
                },
                {
                    scale: true,
                    gridIndex: 3,
                    splitNumber: 3,
                    axisLabel: { show: true },
                    axisLine: { show: false },
                    axisTick: { show: true },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: "#777",
                            type: "dashed"
                        }
                    }
                }
            ],
            dataZoom: [
                {
                    type: "inside",
                    xAxisIndex: [0, 1, 2, 3],
                    start: start,
                    end: 100
                },
                {
                    show: true,
                    xAxisIndex: [0, 1, 2, 3],
                    type: "slider",
                    top: "96%",
                    start: start,
                    end: 100
                }
            ],
            series: [
                {
                    // 0
                    name: "K线",
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
                    // 1
                    name: "挤牌-均值",
                    type: "line",
                    data: data && data.squeeze && data.squeeze[0],
                    symbol: "none",
                    smooth: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: "#ff0",
                        opacity: 0.5,
                        width: 1
                    }
                },
                {
                    // 2
                    name: "挤牌-K上",
                    type: "line",
                    data: data && data.squeeze && data.squeeze[3],
                    showSymbol: false,
                    smooth: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: "#0ff",
                        width: 2,
                        opacity: 0.5
                    }
                },
                {
                    // 3
                    name: "挤牌-K下",
                    type: "line",
                    data: data && data.squeeze && data.squeeze[4],
                    showSymbol: false,
                    smooth: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: "#0ff",
                        width: 2,
                        opacity: 0.5
                    }
                },
                {
                    // 4
                    name: "挤牌-B上",
                    type: "line",
                    data: data && data.squeeze && data.squeeze[1],
                    showSymbol: false,
                    smooth: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: "#bbb",
                        width: 1,
                        opacity: 0.5
                    }
                },
                {
                    // 5
                    name: "挤牌-B下",
                    type: "line",
                    data: data && data.squeeze && data.squeeze[2],
                    showSymbol: false,
                    smooth: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: "#bbb",
                        width: 1,
                        opacity: 0.5
                    }
                },
                {
                    // 6
                    name: "挤牌-能量",
                    type: "bar", //"line",
                    data: data && data.squeeze && data.squeeze[5],
                    symbol: "none",
                    symbolSize: 3,
                    // smooth: true,
                    xAxisIndex: 3,
                    yAxisIndex: 3
                },
                {
                    // 7
                    name: "挤牌-标记",
                    type: "scatter", //"line",
                    data: data && data.flags,
                    symbol: "circle",
                    itemStyle: {
                        color: "#FF0",
                        borderType: "solid",
                        opacity: 1
                    },
                    xAxisIndex: 3,
                    yAxisIndex: 3
                },
                {
                    // 8
                    name: "ATR-均值",
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
                    // 9
                    name: "ATR-上",
                    type: "line",
                    data: data && data.kc && data.kc[1],
                    showSymbol: false,
                    smooth: false,
                    lineStyle: {
                        color: "#0ff",
                        width: 2,
                        opacity: 1
                    }
                },
                {
                    // 10
                    name: "ATR-下",
                    type: "line",
                    data: data && data.kc && data.kc[2],
                    showSymbol: false,
                    smooth: false,
                    lineStyle: {
                        color: "#0ff",
                        width: 2,
                        opacity: 1
                    }
                },
                {
                    // 11
                    name: "K线",
                    type: "candlestick",
                    data: data && data.values,
                    itemStyle: {
                        color: props.params.upColor,
                        color0: props.params.downColor,
                        borderColor: null,
                        borderColor0: null
                    },
                    xAxisIndex: 1,
                    yAxisIndex: 1
                },
                {
                    // 12
                    name: "MTM",
                    type: "bar", //"line",
                    data: data && data.mtm,
                    symbol: "none",
                    symbolSize: 3,
                    // smooth: true,
                    xAxisIndex: 2,
                    yAxisIndex: 2
                }
            ],
            visualMap: [
                {
                    type: "piecewise",
                    pieces: [
                        {
                            value: indicators.SQUEEZE.states.REST,
                            color: "#777"
                        },
                        {
                            value: indicators.SQUEEZE.states.READY,
                            color: "#777"
                        },
                        { value: indicators.SQUEEZE.states.BUY, color: "#F00" },
                        { value: indicators.SQUEEZE.states.SELL, color: "#0F0" }
                    ],
                    show: false,
                    seriesIndex: 6,
                    dimensions: 6
                }
            ]
        };
    };

    const dailyChartResize = () => {
        dailyChart.resize();
    };

    const dataReady = rawData => {
        console.log("daily squeeze 处理数据 ...");
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
        // dailyChart.dispatchAction({
        //     type: "legendUnSelect",
        //     name: "均值"
        // });
        dailyChart.resize();

        // timerQuoteId = setTimeout(refreshTodayQuote, 0);
        console.log("daily squeeze 数据设置完毕！");
    };

    const updateGraph = rtData => {
        console.log(`更新图形！%o`, rtData);
        if (dailyData) {
            let updatedData = splitData(dailyData);
            let option = getGraphOption(updatedData);

            dailyChart.setOption(option, true);
        }
    };

    onMounted(() => {
        console.log("daily squeeze onMounted");
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
        console.log("daily  squeeze onUnmounted");
        if (dailyChart !== null) {
            dailyChart.clear();
            dailyChart.dispose();
        }
        window.removeEventListener("resize", dailyChartResize);
    });

    watch(
        () => props.data,
        data => {
            console.log("数据变化，开始DailyGraph处理...");
            dataReady(data);
        }
    );

    return {
        dataReady,
        updateGraph
    };
}
