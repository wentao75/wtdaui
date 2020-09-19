import { onMounted, onUnmounted, watch } from "@vue/composition-api";
// import { ipcRenderer } from "electron";
import echarts from "echarts";
import _ from "lodash";
import { indicators, utils } from "@wt/lib-stock";
import quoteDataUtil from "./quotedata";

export default function(store, graphElementId, props) {
    // const tsCode = ref("");

    // const downColor = params.downColor;
    // const upColor = params.upColor;

    let stockData = null;
    // let dailyData = null;
    let dailyChart = null;
    // let currentGraphOption = null;

    const splitData = rawData => {
        var categoryData = [];
        var values = [];
        // let changes = [];
        let squeezeFlags = [];

        let dailyData = rawData.data; //.reverse();
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
            mt: "MTM", // "MTM"
            mn: 12,
            mm: 1,
            tn: 5,
            tm: 21,
            tl: 34,
            // mmsource: "hl",
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
            n: 12,
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
            let up = dailyData[i].close >= dailyData[i].open;
            // HA pattern
            if (i > 0) {
                let o = (dailyData[i - 1].open + dailyData[i - 1].close) / 2;
                let c =
                    (dailyData[i].open +
                        dailyData[i].high +
                        dailyData[i].low +
                        dailyData[i].close) /
                    4;
                //up = c >= o;
                // 1/0表示正常升降，3/2表示修改升降
                if (up) {
                    up = c >= o ? 1 : 2;
                } else {
                    up = c >= o ? 3 : 0;
                }
            }

            values.push([
                dailyData[i].open,
                dailyData[i].close,
                dailyData[i].low,
                dailyData[i].high,
                dailyData[i].trade_date,
                up
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
            info: rawData.info
        };
    };

    const renderAMK = (params, api) => {
        let xValue = api.value(4);
        let openPoint = api.coord([xValue, api.value(0)]);
        let closePoint = api.coord([xValue, api.value(1)]);
        let lowPoint = api.coord([xValue, api.value(2)]);
        let highPoint = api.coord([xValue, api.value(3)]);
        let up = api.value(5);

        let halfWidth = api.size([1, 0])[0] * 0.25;
        let color =
            up === 1 ? "#f00" : up === 0 ? "#0f0" : up === 2 ? "#0ff" : "#f99";
        let style = api.style({
            stroke: color,
            fill: color
        });
        // console.log(`params: %o， api, %o`, params, api);

        let hPoint;
        let lPoint;
        if (api.value(1) > api.value(2)) {
            hPoint = openPoint;
            lPoint = closePoint;
        } else {
            hPoint = closePoint;
            lPoint = openPoint;
        }
        return {
            type: "group",
            // 美国线
            // children: [
            //     {
            //         type: "line",
            //         shape: {
            //             x1: lowPoint[0],
            //             y1: lowPoint[1],
            //             x2: highPoint[0],
            //             y2: highPoint[1]
            //         },
            //         style: style
            //     },
            //     {
            //         type: "line",
            //         shape: {
            //             x1: openPoint[0],
            //             y1: openPoint[1],
            //             x2: openPoint[0] - halfWidth,
            //             y2: openPoint[1]
            //         },
            //         style: style
            //     },
            //     {
            //         type: "line",
            //         shape: {
            //             x1: closePoint[0],
            //             y1: closePoint[1],
            //             x2: closePoint[0] + halfWidth,
            //             y2: closePoint[1]
            //         },
            //         style: style
            //     }
            // ]
            // K
            children: [
                {
                    type: "line",
                    shape: {
                        x1: lowPoint[0],
                        y1: lowPoint[1],
                        x2: lPoint[0],
                        y2: lPoint[1]
                    },
                    style: style
                },
                {
                    type: "line",
                    shape: {
                        x1: hPoint[0],
                        y1: hPoint[1],
                        x2: highPoint[0],
                        y2: highPoint[1]
                    },
                    style: style
                },
                {
                    type: "rect",
                    shape: {
                        x: hPoint[0] - halfWidth,
                        y: hPoint[1],
                        width: halfWidth * 2,
                        height: lPoint[1] - hPoint[1]
                    },
                    style: style
                }
            ]
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
                            (paramK && paramK.data && paramK.data[4]) +
                            ", 低: " +
                            (paramK && paramK.data && paramK.data[3]) +
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
                        label: { show: false },
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
                    max: "dataMax",
                    axisPointer: {
                        label: {
                            show: false
                        }
                    }
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
                    max: "dataMax",
                    axisPointer: {
                        label: {
                            show: false
                        }
                    }
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
                    max: "dataMax",
                    axisPointer: {
                        label: {
                            show: true
                        }
                    }
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
                    type: "custom", //"candlestick",
                    renderItem: renderAMK,
                    data: data && data.values,
                    encode: {
                        x: 4,
                        y: [0, 1, 2, 3],
                        tooltip: [0, 1, 2, 3]
                    },
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
                        color: "#ff69b4",
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
                        color: "#ff69b4",
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
                    xAxisIndex: 2,
                    yAxisIndex: 2
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
                    xAxisIndex: 2,
                    yAxisIndex: 2
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
                    data: data && data.squeeze && data.squeeze[9],
                    symbol: "none",
                    symbolSize: 3,
                    barGap: "-100%",
                    // smooth: true,
                    xAxisIndex: 3,
                    yAxisIndex: 3,
                    itemStyle: {
                        color: "#FFA500"
                    }
                },
                {
                    // 13
                    name: "MTM",
                    type: "bar", //"line",
                    data: data && data.squeeze && data.squeeze[8],
                    symbol: "none",
                    symbolSize: 3,
                    barGap: "-100%",
                    // smooth: true,
                    xAxisIndex: 3,
                    yAxisIndex: 3,
                    itemStyle: {
                        color: "#FF4500"
                    }
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
                    dimensions: 2
                }
                // {
                //     type: "piecewise",
                //     pieces: [
                //         {
                //             gte: 0,
                //             color: "#F00",
                //             opacity: 0.5
                //         },
                //         {
                //             lt: 0,
                //             color: "#0F0",
                //             opacity: 0.5
                //         }
                //     ],
                //     show: false,
                //     seriesIndex: 12
                // }
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
        stockData = rawData;
        let dailyData = rawData.data;
        console.log(
            `日线数据长度：${dailyData && dailyData.length}, ${rawData &&
                rawData.tsCode}, %o`,
            rawData && rawData.info
        );
        utils.checkTradeData(dailyData);

        let data = splitData(stockData);
        let graphOption = getGraphOption(data);

        dailyChart.setOption(graphOption, true);
        // dailyChart.dispatchAction({
        //     type: "legendUnSelect",
        //     name: "均值"
        // });
        dailyChart.resize();

        // timerQuoteId = setTimeout(refreshTodayQuote, 0);
        console.log("daily squeeze 数据设置完毕！");
    };

    const updateGraphOption = (option, data) => {
        //     values: values,
        //     kc: kcData,
        //     mtm: mtmData,
        //     squeeze: squeezeData,
        //     flags: squeezeFlags,
        let series = option.series;
        let xAxis = option.xAxis;
        // let data0 = series[0].data;

        series[0].data = data && data.values;
        series[1].data = data && data.squeeze && data.squeeze[0];
        series[2].data = data && data.squeeze && data.squeeze[3];
        series[3].data = data && data.squeeze && data.squeeze[4];
        series[4].data = data && data.squeeze && data.squeeze[1];
        series[5].data = data && data.squeeze && data.squeeze[2];
        series[6].data = data && data.squeeze && data.squeeze[5];
        series[7].data = data && data.flags;
        series[8].data = data && data.kc && data.kc[0];
        series[9].data = data && data.kc && data.kc[1];
        series[10].data = data && data.kc && data.kc[2];
        series[11].data = data && data.values;
        series[12].data = data && data.squeeze && data.squeeze[9];
        series[13].data = data && data.squeeze && data.squeeze[8];

        xAxis[0].data = data && data.categoryData;
        xAxis[1].data = data && data.categoryData;
        xAxis[2].data = data && data.categoryData;
        xAxis[3].data = data && data.categoryData;

        // if (
        //     data &&
        //     data.values &&
        //     (data.values.length === data0.length ||
        //         data.values.length === data0.length + 1) &&
        //     data0.length > 0
        // ) {
        //     xAxis[0].data[data.values.length - 1] =
        //         data.categoryData[data.categoryData.length - 1];
        //     xAxis[1].data[data.values.length - 1] =
        //         data.categoryData[data.categoryData.length - 1];
        //     xAxis[2].data[data.values.length - 1] =
        //         data.categoryData[data.categoryData.length - 1];
        //     xAxis[3].data[data.values.length - 1] =
        //         data.categoryData[data.categoryData.length - 1];

        //     data0[data.values.length - 1] = data.values[data.values.length - 1];
        //     series[11].data[data.values.length - 1] =
        //         data.values[data.values.length - 1];

        //     series[1].data[data.values.length - 1] =
        //         data.squeeze[0][data.squeeze[0].length - 1];
        //     series[2].data[data.values.length - 1] =
        //         data.squeeze[3][data.values.length - 1];
        //     series[3].data[data.values.length - 1] =
        //         data.squeeze[4][data.squeeze[4].length - 1];
        //     series[4].data[data.values.length - 1] =
        //         data.squeeze[1][data.squeeze[1].length - 1];
        //     series[5].data[data.values.length - 1] =
        //         data.squeeze[2][data.squeeze[2].length - 1];
        //     series[6].data[data.values.length - 1] =
        //         data.squeeze[5][data.squeeze[5].length - 1];

        //     series[7].data[data.values.length - 1] =
        //         data.flags[data.flags.length - 1];

        //     series[8].data[data.values.length - 1] =
        //         data.kc[0][data.kc[0].length - 1];
        //     series[9].data[data.values.length - 1] =
        //         data.kc[1][data.kc[1].length - 1];
        //     series[10].data[data.values.length - 1] =
        //         data.kc[2][data.kc[2].length - 1];

        //     series[12].data[data.values.length - 1] =
        //         data.mtm[data.mtm.length - 1];
        //     // } else if (
        //     //     data &&
        //     //     data.values &&
        //     //     data.values.length === data0.length + 1
        //     // ) {
        //     //     xAxis[0].data.push(data.categoryData[data.categoryData.length - 1]);
        //     //     xAxis[1].data.push(data.categoryData[data.categoryData.length - 1]);
        //     //     xAxis[2].data.push(data.categoryData[data.categoryData.length - 1]);
        //     //     xAxis[3].data.push(data.categoryData[data.categoryData.length - 1]);

        //     //     data0.push(data.values[data.values.length - 1]);
        //     //     // series[11].data.push(data.values[data.values.length - 1]);

        //     //     series[1].data.push(data.squeeze[0][data.squeeze[0].length - 1]);
        //     //     series[2].data.push(data.squeeze[3][data.squeeze[3].length - 1]);
        //     //     series[3].data.push(data.squeeze[4][data.squeeze[4].length - 1]);
        //     //     series[4].data.push(data.squeeze[1][data.squeeze[1].length - 1]);
        //     //     series[5].data.push(data.squeeze[2][data.squeeze[2].length - 1]);
        //     //     series[6].data.push(data.squeeze[5][data.squeeze[5].length - 1]);

        //     //     series[7].data.push(data.flags[data.flags.length - 1]);

        //     //     series[8].data.push(data.kc[0][data.kc[0].length - 1]);
        //     //     series[9].data.push(data.kc[1][data.kc[1].length - 1]);
        //     //     series[10].data.push(data.kc[2][data.kc[2].length - 1]);

        //     //     series[12].data.push(data.mtm[data.mtm.length - 1]);
        // }
    };

    const updateGraph = rawData => {
        if (rawData) {
            stockData = rawData;
            let updatedData = splitData(stockData);
            let currentGraphOption = dailyChart.getOption();
            updateGraphOption(currentGraphOption, updatedData);
            //let option = getGraphOption(updatedData);

            dailyChart.setOption(currentGraphOption, false);
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
            console.log("日线数据变化，开始DailyGraph处理...");
            if (props.rtData) {
                console.log("合并日线和实时数据 ...");
                quoteDataUtil.updateDaily(props.rtData, data);
            }
            dataReady(data);
        }
    );

    watch(
        () => props.rtData,
        rt => {
            if (stockData && stockData.data && stockData.data.length > 0) {
                console.log(
                    `实时数据在daily-graph中侦测到变化，合并更新 ${stockData &&
                        stockData.data &&
                        stockData.data.length}, [%o]`,

                    rt
                );
                quoteDataUtil.updateDaily(rt, stockData);
                updateGraph(stockData);
                console.log(
                    `daily-graph合并后数据：${stockData &&
                        stockData.data &&
                        stockData.data.length} %o`,
                    stockData &&
                        stockData.data &&
                        stockData.data[stockData.data.length - 1]
                );
            }
        }
    );

    return {
        dataReady,
        updateGraph
    };
}
