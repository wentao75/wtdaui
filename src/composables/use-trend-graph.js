import { onMounted, onUnmounted } from "@vue/composition-api";
import echarts from "echarts";
import _ from "lodash";

export default function(store, graphElementId, props) {
    // const tsCode = ref("");

    // const downColor = params.downColor;
    // const upColor = params.upColor;

    let dailyData = null;
    let dailyChart = null;

    const splitData = stockData => {
        var categoryData = [];
        var values = [];
        let changes = [];

        let dailyData = stockData.data; //.reverse();
        for (var i = dailyData.length - 1; i >= 0; i--) {
            categoryData.push(dailyData[i].trade_date);
            values.push([
                dailyData[i].open,
                dailyData[i].close,
                dailyData[i].high,
                dailyData[i].low
            ]);

            changes.push([
                dailyData[i].trade_date,
                _.round(
                    ((dailyData[i].high - dailyData[i].low) * 100) /
                        dailyData[i].open,
                    2
                )
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
    };

    const getGraphOption = data => {
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
                        color: props.params.downColor
                    },
                    {
                        value: -1,
                        color: props.params.upColor
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
                    axisLabel: { show: true, formatter: "{value}%" },
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
                        color: props.params.upColor,
                        color0: props.params.downColor,
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
                        data: [{ type: "average", name: "平均值" }],
                        label: {
                            formatter: "{c}%"
                        }
                    }
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

    return {
        dataReady
    };
}
