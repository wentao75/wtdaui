/**
 * 这个图的目标是在Squeeze基础上添加动能长中短期的波动对比，用以确认方向和是否保持交易
 *
 */
import { onMounted, onUnmounted, watch } from "@vue/composition-api";
import echarts from "echarts";
import _ from "lodash";
import { indicators, utils } from "@wt/lib-stock";
import quoteDataUtil from "./quotedata";

export default function(store, graphElementId, props) {
    let stockData = null;
    let dailyChart = null;

    const splitData = rawData => {
        var categoryData = [];
        // K 线
        var values = [];
        // let changes = [];
        let squeezeFlags = [];
        // let mm = []; // 动量数据
        // let waves = [];
        let ema50 = [];
        let ema8 = [];
        let ema21 = [];

        let dailyData = rawData.data;
        utils.checkTradeData(dailyData);

        let source = "close";
        // let mmsource = "hl";
        console.log(`params: %o`, props.params);
        let digits = 3;

        let trends = indicators.TTMTrend.calculate(dailyData, {
            n: 6,
            type: "HA"
        });

        // 基础的Squeeze数据
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
            digits
        });

        // [hist1, hist2, hist3, hist4, hist5, hist6, macd6]
        let ttmwaveData = indicators.TTMWave.calculate(dailyData, {
            source,
            n: 5,
            ma: 21,
            la: 34,
            mb: 55,
            lb: 89,
            mc: 144,
            lc: 233,
            digits
        });

        let scalper = indicators.Scalper.calculate(dailyData);
        // console.log(`scalper: %o`, scalper);

        ema50 = indicators.MA.calculate(dailyData, {
            n: 50,
            type: "ema",
            source: "close",
            digits: 3
        });
        ema8 = indicators.MA.calculate(dailyData, {
            n: 8,
            type: "ema",
            source: "close",
            digits: 3
        });
        ema21 = indicators.MA.calculate(dailyData, {
            n: 21,
            type: "ema",
            source: "close",
            digits: 3
        });

        // let mtmData2 = indicators.MTM.calculate(dailyData, {
        //     n: 16,
        //     m: 5,
        //     source,
        //     digits
        // });
        // let mtmData3 = indicators.MTM.calculate(dailyData, {
        //     n: 21,
        //     m: 10,
        //     source,
        //     digits
        // });
        // let mtmData2 = indicators.AO.calculate(dailyData, {
        //     n: 5,
        //     m: 22,
        //     source: mmsource,
        //     digits
        // });
        // let mtmData3 = indicators.AO.calculate(dailyData, {
        //     n: 5,
        //     m: 35,
        //     source: mmsource,
        //     digits
        // });

        for (let i = 0; i < dailyData.length; i++) {
            categoryData.push(dailyData[i].trade_date);
            values.push([
                dailyData[i].trade_date,
                dailyData[i].open,
                dailyData[i].close,
                dailyData[i].low,
                dailyData[i].high,
                trends[i],
                scalper[i][1]
            ]);

            if (squeezeData[6][i] === indicators.SQUEEZE.states.READY) {
                squeezeFlags[i] = 0;
            } else {
                //squeezeFlags[i] = "--";
            }

            // mm.push([i, squeezeData[5][i], squeezeData[6][i]]);
            squeezeData[5][i] = [
                i,
                squeezeData[5][i], // mm
                squeezeData[6][i] // state
            ];
        }

        return {
            categoryData: categoryData,
            values: values,
            ttmwave: ttmwaveData,
            squeeze: squeezeData,
            scalper,
            ema50,
            ema8,
            ema21,
            flags: squeezeFlags,
            info: stockData.info
        };
    };

    const renderAMK = (params, api) => {
        let xValue = api.value(0);
        let openPoint = api.coord([xValue, api.value(1)]);
        let closePoint = api.coord([xValue, api.value(2)]);
        let lowPoint = api.coord([xValue, api.value(3)]);
        let highPoint = api.coord([xValue, api.value(4)]);
        let up = api.value(5);
        let scalper = api.value(6);

        let halfWidth = api.size([1, 0])[0] * 0.25;
        let color =
            up === 1 ? "#f00" : up === 0 ? "#0f0" : up === 2 ? "#0ff" : "#f99";
        let style = api.style({
            stroke: color,
            fill: color
        });

        let flagHalfWidth = api.size([1, 0])[0] * 0.3;
        let flagHeight = 2 * flagHalfWidth * 0.87;
        // let flagChild;
        let invisibleUp = true;
        let invisibleDown = true;
        if (scalper === indicators.Scalper.states.BUY_READY) {
            // 画一个向上的红色三角形
            invisibleUp = false;
        } else if (scalper === indicators.Scalper.states.SELL_READY) {
            // 画一个向下的绿色三角形
            invisibleDown = false;
        }
        // console.log(`params: %o， api, %o`, params, api);

        // let hPoint;
        // let lPoint;
        // if (api.value(1) > api.value(2)) {
        //     hPoint = openPoint;
        //     lPoint = closePoint;
        // } else {
        //     hPoint = closePoint;
        //     lPoint = openPoint;
        // }
        let item = {
            type: "group",
            children: [
                {
                    type: "line",
                    shape: {
                        x1: lowPoint[0],
                        y1: lowPoint[1],
                        x2: highPoint[0],
                        y2: highPoint[1]
                    },
                    style: style
                },
                {
                    type: "line",
                    shape: {
                        x1: openPoint[0],
                        y1: openPoint[1],
                        x2: openPoint[0] - halfWidth,
                        y2: openPoint[1]
                    },
                    style: style
                },
                {
                    type: "line",
                    shape: {
                        x1: closePoint[0],
                        y1: closePoint[1],
                        x2: closePoint[0] + halfWidth,
                        y2: closePoint[1]
                    },
                    style: style
                },
                {
                    type: "polyline",
                    invisible: invisibleUp,
                    shape: {
                        points: [
                            [lowPoint[0], lowPoint[1] + 8],
                            [
                                lowPoint[0] - flagHalfWidth,
                                lowPoint[1] + 8 + flagHeight
                            ],
                            [
                                lowPoint[0] + flagHalfWidth,
                                lowPoint[1] + 8 + flagHeight
                            ]
                        ]
                    },
                    style: api.style({
                        stroke: "#F00",
                        fill: "#F00"
                    })
                },
                {
                    type: "polyline",
                    invisible: invisibleDown,
                    shape: {
                        points: [
                            [highPoint[0], highPoint[1] - 8],
                            [
                                highPoint[0] - flagHalfWidth,
                                highPoint[1] - 8 - flagHeight
                            ],
                            [
                                highPoint[0] + flagHalfWidth,
                                highPoint[1] - 8 - flagHeight
                            ]
                        ]
                    },
                    style: api.style({
                        stroke: "#0F0",
                        fill: "#0F0"
                    })
                }
            ]
            //     children: [
            //     {
            //         type: "line",
            //         shape: {
            //             x1: lowPoint[0],
            //             y1: lowPoint[1],
            //             x2: lPoint[0],
            //             y2: lPoint[1]
            //         },
            //         style: style
            //     },
            //     {
            //         type: "line",
            //         shape: {
            //             x1: hPoint[0],
            //             y1: hPoint[1],
            //             x2: highPoint[0],
            //             y2: highPoint[1]
            //         },
            //         style: style
            //     },
            //     {
            //         type: "rect",
            //         shape: {
            //             x: hPoint[0] - halfWidth,
            //             y: hPoint[1],
            //             width: halfWidth * 2,
            //             height: lPoint[1] - hPoint[1]
            //         },
            //         style: style
            //     }
            // ]
        };
        // if (flagChild) {
        //     item.children.push(flagChild);
        // }
        return item;
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
        let barGap = "-100%";
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
                    "均线8",
                    "均线21",
                    "均线50",
                    // "挤牌-均值",
                    // "挤牌-B上",
                    // "挤牌-B下",
                    // "挤牌-K上",
                    // "挤牌-K下",
                    "WaveA",
                    "WaveB",
                    "WaveC"
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
                    var obj = { top: "5%" };
                    obj[["left", "right"][+(pos[0] < size.viewSize[0] / 2)]] =
                        "5%";
                    return obj;
                },
                formatter: function(params) {
                    let paramK;
                    // let paramKC = [];
                    // let paramBOLL = [];
                    let paramMTM;
                    let paramWavea = [];
                    let paramWaveb = [];
                    let paramWavec = [];
                    let paramEma50;
                    let paramEma8;
                    let paramEma21;
                    params.forEach(param => {
                        // if (param.seriesIndex >= 1 && param.seriesIndex <= 3) {
                        //     paramKC[param.seriesIndex - 1] = param;
                        // } else
                        if (param.seriesIndex === 0) {
                            paramK = param;
                            // } else if (
                            //     param.seriesIndex === 4 ||
                            //     param.seriesIndex === 5
                            // ) {
                            //     paramBOLL[param.seriesIndex - 4] = param;
                        } else if (param.seriesIndex === 6 - 5) {
                            paramMTM = param;
                        } else if (param.seriesIndex === 8 - 5) {
                            paramWavea[0] = param;
                        } else if (param.seriesIndex === 9 - 5) {
                            paramWavea[1] = param;
                        } else if (param.seriesIndex === 10 - 5) {
                            paramWaveb[0] = param;
                        } else if (param.seriesIndex === 11 - 5) {
                            paramWaveb[1] = param;
                        } else if (param.seriesIndex === 12 - 5) {
                            paramWavec[0] = param;
                        } else if (param.seriesIndex === 13 - 5) {
                            paramWavec[1] = param;
                        } else if (param.seriesIndex === 14 - 5) {
                            paramEma8 = param;
                        } else if (param.seriesIndex === 15 - 5) {
                            paramEma21 = param;
                        } else if (param.seriesIndex === 16 - 5) {
                            paramEma50 = param;
                        }
                    });

                    return [
                        paramK.name + '<hr size=1 style="margin: 3px 0">',
                        // "均值: " +
                        //     (paramKC && paramKC[0] && paramKC[0].data) +
                        "信号 [" + (paramMTM && paramMTM.data[2]) + "] <br/>",
                        "EMA: [" +
                            (paramEma8 && paramEma8.data) +
                            ", " +
                            (paramEma21 && paramEma21.data) +
                            ", " +
                            (paramEma50 && paramEma50.data) +
                            "] <br/>",
                        "开: " +
                            (paramK && paramK.data && paramK.data[1]) +
                            " 收: " +
                            (paramK && paramK.data && paramK.data[2]) +
                            "<br/>",
                        "高: " +
                            (paramK && paramK.data && paramK.data[4]) +
                            " 低: " +
                            (paramK && paramK.data && paramK.data[3]) +
                            "<br/>",
                        // "KC  : [" +
                        //     (paramKC && paramKC[1] && paramKC[1].data) +
                        //     ", " +
                        //     (paramKC && paramKC[2] && paramKC[2].data) +
                        //     "] <br/>",
                        // "BOLL: [" +
                        //     (paramBOLL && paramBOLL[0] && paramBOLL[0].data) +
                        //     ", " +
                        //     (paramBOLL && paramBOLL[1] && paramBOLL[1].data) +
                        //     "] <br/>",
                        "MTM: " + (paramMTM && paramMTM.data[1]) + "<br/>",
                        "Wave A: [" +
                            (paramWavea && paramWavea[0].data) +
                            ", " +
                            (paramWavea && paramWavea[1].data) +
                            "] <br/>",
                        "Wave B: [" +
                            (paramWaveb && paramWaveb[0].data) +
                            ", " +
                            (paramWaveb && paramWaveb[1].data) +
                            "] <br/>",
                        "Wave C: [" +
                            (paramWavec && paramWavec[0].data) +
                            ", " +
                            (paramWavec && paramWavec[1].data) +
                            "] <br/>"
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
                    height: "10%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "62%",
                    height: "9%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "73%",
                    height: "9%"
                },
                {
                    left: "5%",
                    right: "5%",
                    top: "84%",
                    height: "9%"
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
                    // splitNumber: 20,
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
                    axisLabel: { show: false },
                    // splitNumber: 20,
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
                    // splitNumber: 20,
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
                    // splitNumber: 20,
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
                    gridIndex: 4,
                    data: data.categoryData,
                    scale: true,
                    boundaryGap: false,
                    axisLine: { onZero: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    // splitNumber: 20,
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
                    splitNumber: 2,
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
                    gridIndex: 2,
                    splitNumber: 2,
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
                    splitNumber: 2,
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
                    gridIndex: 4,
                    splitNumber: 2,
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
                    xAxisIndex: [0, 1, 2, 3, 4],
                    start: start,
                    end: 100
                },
                {
                    show: true,
                    xAxisIndex: [0, 1, 2, 3, 4],
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
                    //type: "candlestick",
                    type: "custom",
                    renderItem: renderAMK,
                    data: data && data.values,
                    encode: {
                        x: 0,
                        y: [1, 2, 3, 4],
                        tooltip: [1, 2, 3, 4]
                    },
                    itemStyle: {
                        color: props.params.upColor,
                        color0: props.params.downColor,
                        borderColor: null,
                        borderColor0: null,
                        lineWidth: 2,
                        borderWidth: 2
                    }
                },
                // {
                //     // 1
                //     name: "挤牌-均值",
                //     type: "line",
                //     data: data && data.squeeze && data.squeeze[0],
                //     symbol: "none",
                //     smooth: false,
                //     lineStyle: {
                //         color: "#ff0",
                //         opacity: 0.5,
                //         width: 1
                //     }
                // },
                // {
                //     // 2
                //     name: "挤牌-K上",
                //     type: "line",
                //     data: data && data.squeeze && data.squeeze[3],
                //     showSymbol: false,
                //     smooth: false,
                //     lineStyle: {
                //         color: "#0ff",
                //         width: 2,
                //         opacity: 0.5
                //     }
                // },
                // {
                //     // 3
                //     name: "挤牌-K下",
                //     type: "line",
                //     data: data && data.squeeze && data.squeeze[4],
                //     showSymbol: false,
                //     smooth: false,
                //     lineStyle: {
                //         color: "#0ff",
                //         width: 2,
                //         opacity: 0.5
                //     }
                // },
                // {
                //     // 4
                //     name: "挤牌-B上",
                //     type: "line",
                //     data: data && data.squeeze && data.squeeze[1],
                //     showSymbol: false,
                //     smooth: false,
                //     lineStyle: {
                //         color: "#bbb",
                //         width: 1,
                //         opacity: 0.5
                //     }
                // },
                // {
                //     // 5
                //     name: "挤牌-B下",
                //     type: "line",
                //     data: data && data.squeeze && data.squeeze[2],
                //     showSymbol: false,
                //     smooth: false,
                //     lineStyle: {
                //         color: "#bbb",
                //         width: 1,
                //         opacity: 0.5
                //     }
                // },
                {
                    // 6
                    name: "挤牌-能量",
                    type: "bar", //"line",
                    data: data && data.squeeze && data.squeeze[5],
                    symbol: "none",
                    symbolSize: 3,
                    // smooth: true,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    itemStyle: {
                        color: "#FA8072"
                    }
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
                    xAxisIndex: 1,
                    yAxisIndex: 1
                },
                {
                    // 8
                    name: "WaveA",
                    type: "bar", //"line",
                    data: data && data.ttmwave[1], //ttmwave[0],
                    symbol: "none",
                    symbolSize: 3,
                    barGap,
                    // smooth: true,
                    xAxisIndex: 2,
                    yAxisIndex: 2,
                    itemStyle: {
                        color: "#FFD700"
                    }
                },
                {
                    // 9
                    name: "WaveA",
                    type: "bar", //"line",
                    data: data && data.ttmwave[0], //ttmwave[0],
                    symbol: "none",
                    symbolSize: 3,
                    barGap,
                    // smooth: true,
                    xAxisIndex: 2,
                    yAxisIndex: 2,
                    itemStyle: {
                        color: "#FF3030"
                    }
                },
                {
                    // 10
                    name: "WaveB",
                    type: "bar", //"line",
                    data: data && data.ttmwave[3],
                    symbol: "none",
                    symbolSize: 3,
                    barGap,
                    // smooth: true,
                    xAxisIndex: 3,
                    yAxisIndex: 3,
                    itemStyle: {
                        color: "#FF00FF"
                    }
                },
                {
                    // 11
                    name: "WaveB",
                    type: "bar", //"line",
                    data: data && data.ttmwave[2],
                    symbol: "none",
                    symbolSize: 3,
                    barGap,
                    // smooth: true,
                    xAxisIndex: 3,
                    yAxisIndex: 3,
                    itemStyle: {
                        color: "#00FFFF"
                    }
                },
                {
                    // 12
                    name: "WaveC",
                    type: "bar", //"line",
                    data: data && data.ttmwave[6],
                    // data: data && data.ttmwave[5],
                    symbol: "none",
                    symbolSize: 3,
                    barGap,
                    // smooth: true,
                    xAxisIndex: 4,
                    yAxisIndex: 4,
                    itemStyle: {
                        color: "#FFA500"
                    }
                },
                {
                    // 13
                    name: "WaveC",
                    type: "bar", //"line",
                    data: data && data.ttmwave[4],
                    symbol: "none",
                    symbolSize: 3,
                    // smooth: true,
                    barGap,
                    xAxisIndex: 4,
                    yAxisIndex: 4,
                    itemStyle: {
                        color: "#FF4500"
                    }
                },
                {
                    // 14
                    name: "均线8",
                    type: "line",
                    data: data && data.ema8,
                    symbol: "none",
                    smooth: false,
                    lineStyle: {
                        color: "#fff",
                        opacity: 1,
                        width: 1,
                        type: "dotted"
                    }
                },
                {
                    // 15
                    name: "均线21",
                    type: "line",
                    data: data && data.ema21,
                    symbol: "none",
                    smooth: false,
                    lineStyle: {
                        color: "#fff",
                        opacity: 1,
                        width: 1
                        // type: "dashed"
                    }
                },
                {
                    // 16
                    name: "均线50",
                    type: "line",
                    data: data && data.ema50,
                    symbol: "none",
                    smooth: false,
                    lineStyle: {
                        color: "#999",
                        opacity: 0.6,
                        width: 2
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
                    seriesIndex: 1,
                    dimensions: 2
                }
                // {
                //     type: "piecewise",
                //     pieces: [
                //         {
                //             gte: 0,
                //             color: "#FF3030"
                //         },
                //         {
                //             lt: 0,
                //             color: "#0abab5"
                //         }
                //     ],
                //     show: false,
                //     seriesIndex: 6,
                //     dimensions: 0
                // }
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
        stockData = rawData;
        let dailyData = stockData && stockData.data;
        console.log(
            `日线数据长度：${dailyData && dailyData.length}, ${rawData &&
                rawData.tsCode}, %o`,
            rawData && rawData.info
        );

        let data = splitData(stockData);
        let option = getGraphOption(data);

        dailyChart.setOption(option, true);
        // dailyChart.dispatchAction({
        //     type: "legendUnSelect",
        //     name: "均值"
        // });
        dailyChart.resize();
        console.log("trend 数据设置完毕！");
    };

    const updateGraphOption = (option, data) => {
        let series = option.series;
        let xAxis = option.xAxis;

        series[0].data = data && data.values;
        // series[1].data = data && data.squeeze && data.squeeze[0];
        // series[2].data = data && data.squeeze && data.squeeze[3];
        // series[3].data = data && data.squeeze && data.squeeze[4];
        // series[4].data = data && data.squeeze && data.squeeze[1];
        // series[5].data = data && data.squeeze && data.squeeze[2];
        series[6 - 5].data = data && data.squeeze && data.squeeze[5];
        series[7 - 5].data = data && data.flags;
        series[8 - 5].data = data && data.ttmwave[1];
        series[9 - 5].data = data && data.ttmwave[0];
        series[10 - 5].data = data && data.ttmwave[3];
        series[11 - 5].data = data && data.ttmwave[2];
        // series[12].data = data && data.ttmwave[5];
        series[12 - 5].data = data && data.ttmwave[6];
        series[13 - 5].data = data && data.ttmwave[4];
        series[14 - 5].data = data && data.ema8;
        series[15 - 5].data = data && data.ema21;
        series[16 - 5].data = data && data.ema50;

        xAxis[0].data = data && data.categoryData;
        xAxis[1].data = data && data.categoryData;
        xAxis[2].data = data && data.categoryData;
        xAxis[3].data = data && data.categoryData;
        xAxis[4].data = data && data.categoryData;
    };

    const updateGraph = rawData => {
        console.log(`更新图形！`);
        if (rawData) {
            stockData = rawData;
            let updatedData = splitData(stockData);
            let currentGraphOption = dailyChart.getOption();
            updateGraphOption(currentGraphOption, updatedData);
            //let option = getGraphOption(updatedData);

            dailyChart.setOption(currentGraphOption, false);
        }
    };

    // const updateGraph = rtData => {
    //     console.log(`更新图形！%o`, rtData);
    //     if (stockData) {
    //         let updatedData = splitData(dailyData);
    //         let option = getGraphOption(updatedData);

    //         dailyChart.setOption(option, false);
    //     }
    // };

    onMounted(() => {
        console.log("ttm squeeze onMounted");
        dataReady(props.data);
    });

    onUnmounted(() => {
        console.log("ttm squeeze onUnmounted");
        if (dailyChart !== null) {
            dailyChart.clear();
            dailyChart.dispose();
        }
        window.removeEventListener("resize", dailyChartResize);
    });

    watch(
        () => props.data,
        data => {
            console.log("数据变化，开始TTM Squeeze Graph处理...");
            dataReady(data);
        }
    );

    watch(
        () => props.rtData,
        rt => {
            if (stockData && stockData.data && stockData.data.length > 0) {
                console.log(
                    `实时数据在sequeeze-graph中侦测到变化，合并更新 ${stockData &&
                        stockData.data &&
                        stockData.data.length}, [%o]`,

                    rt
                );
                quoteDataUtil.updateDaily(rt, stockData);
                updateGraph(stockData);
                console.log(
                    `sequeeze-graph合并后数据：${stockData &&
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
