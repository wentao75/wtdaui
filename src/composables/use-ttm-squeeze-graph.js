/**
 * 这个图的目标是在Squeeze基础上添加动能长中短期的波动对比，用以确认方向和是否保持交易
 *
 */
import { onMounted, onUnmounted, watch } from "@vue/composition-api";
import echarts from "echarts";
import _ from "lodash";
import { indicators, utils } from "@wt/lib-stock";

export default function(store, graphElementId, props) {
    let dailyData = null;
    let dailyChart = null;

    const splitData = stockData => {
        var categoryData = [];
        var values = [];
        // let changes = [];
        let squeezeFlags = [];

        let dailyData = stockData.data; //.reverse();
        utils.checkTradeData(dailyData);

        let source = "close";
        let mmsource = "hl";
        console.log(`params: %o`, props.params);
        let digits = 3;

        // 基础的Squeeze数据
        let squeezeData = indicators.SQUEEZE.calculate(dailyData, {
            source,
            ma: "ma",
            n: (props && props.params.n) || 20,
            bm: (props && props.params.bm) || 2,
            km: (props && props.params.m) || 1.5,
            mt: "MTM", // "MTM"
            mn: 12,
            mm: 1,
            mmsource,
            digits
        });

        let mtmData2 = indicators.MTM.calculate(dailyData, {
            n: 16,
            m: 5,
            source,
            digits
        });
        let mtmData3 = indicators.MTM.calculate(dailyData, {
            n: 21,
            m: 10,
            source,
            digits
        });
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
            let up = dailyData[i].close >= dailyData[i].open;
            // HA pattern
            // if (i > 0) {
            //     let o = (dailyData[i - 1].open + dailyData[i - 1].close) / 2;
            //     let c =
            //         (dailyData[i].open +
            //             dailyData[i].high +
            //             dailyData[i].low +
            //             dailyData[i].close) /
            //         4;
            //     up = c >= o;
            // }
            // TTM pattern
            if (i > 6) {
                let upTotal = !up;
                for (let j = 0; j < 6; j++) {
                    let c =
                        (dailyData[i - 1 - j].open +
                            dailyData[i - 1 - j].high +
                            dailyData[i - 1 - j].low +
                            dailyData[i - 1 - j].close) /
                        4;
                    let o =
                        (dailyData[i - 1 - j].high + dailyData[i - 1 - j].low) /
                        2;
                    if ((c >= o && upTotal) || (c < o && !upTotal)) continue;
                    else {
                        upTotal = up;
                        break;
                    }
                }
                up = upTotal;
            }
            values.push([
                dailyData[i].trade_date,
                dailyData[i].open,
                dailyData[i].close,
                dailyData[i].low,
                dailyData[i].high,
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
            mtm2: mtmData2,
            mtm3: mtmData3,
            squeeze: squeezeData,
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

        let halfWidth = api.size([1, 0])[0] * 0.25;
        let style = api.style({
            stroke: up ? "#f00" : "#0f0",
            fill: up ? "#f00" : "#0f0"
        });

        // let hPoint;
        // let lPoint;
        // if (api.value(1) > api.value(2)) {
        //     hPoint = openPoint;
        //     lPoint = closePoint;
        // } else {
        //     hPoint = closePoint;
        //     lPoint = openPoint;
        // }
        return {
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
                // position: function(pos, params, el, elRect, size) {
                //     var obj = { top: 60 };
                //     obj[
                //         ["left", "right"][+(pos[0] < size.viewSize[0] / 2)]
                //     ] = 30;
                //     return obj;
                // },
                formatter: function(params) {
                    let paramK;
                    let paramKC = [];
                    let paramBOLL = [];
                    let paramMTM;
                    let paramMTM2;
                    let paramMTM3;
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
                        } else if (param.seriesIndex === 8) {
                            paramMTM2 = param;
                        } else if (param.seriesIndex === 9) {
                            paramMTM3 = param;
                        }
                    });

                    return [
                        paramK.name + '<hr size=1 style="margin: 3px 0">',
                        "均值: " +
                            (paramKC && paramKC[0] && paramKC[0].data) +
                            " [" +
                            (paramMTM && paramMTM.data && paramMTM.data[2]) +
                            "] <br/>",
                        "开: " +
                            (paramK && paramK.data && paramK.data[1]) +
                            " 收: " +
                            (paramK && paramK.data && paramK.data[2]) +
                            "<br/>",
                        "高: " +
                            (paramK && paramK.data && paramK.data[3]) +
                            " 低: " +
                            (paramK && paramK.data && paramK.data[4]) +
                            "<br/>",
                        "KC  : [" +
                            (paramKC && paramKC[1] && paramKC[1].data) +
                            ", " +
                            (paramKC && paramKC[2] && paramKC[2].data) +
                            "] <br/>",
                        "BOLL: [" +
                            (paramBOLL && paramBOLL[0] && paramBOLL[0].data) +
                            ", " +
                            (paramBOLL && paramBOLL[1] && paramBOLL[1].data) +
                            "] <br/>",
                        "MTM: [" +
                            (paramMTM && paramMTM.data && paramMTM.data[1]) +
                            ", " +
                            (paramMTM2 && paramMTM2.data) +
                            ", " +
                            (paramMTM3 && paramMTM3.data) +
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
                    xAxisIndex: 1,
                    yAxisIndex: 1
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
                    name: "挤牌-能量 B",
                    type: "bar", //"line",
                    data: data && data.mtm2,
                    symbol: "none",
                    symbolSize: 3,
                    // smooth: true,
                    xAxisIndex: 2,
                    yAxisIndex: 2
                },
                {
                    // 9
                    name: "挤牌-能量 C",
                    type: "bar", //"line",
                    data: data && data.mtm3,
                    symbol: "none",
                    symbolSize: 3,
                    // smooth: true,
                    xAxisIndex: 3,
                    yAxisIndex: 3
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
                // {
                //     type: "piecewise",
                //     pieces: [
                //         {
                //             gte: 0,
                //             color: "#f00"
                //         },
                //         {
                //             lt: 0,
                //             color: "#0f0"
                //         }
                //     ],
                //     show: false,
                //     seriesIndex: 0,
                //     dimensions: 4
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
        console.log("trend 数据设置完毕！");
    };

    const updateGraph = rtData => {
        console.log(`更新图形！%o`, rtData);
        if (dailyData) {
            let updatedData = splitData(dailyData);
            let option = getGraphOption(updatedData);

            dailyChart.setOption(option, false);
        }
    };

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

    return {
        dataReady,
        updateGraph
    };
}
