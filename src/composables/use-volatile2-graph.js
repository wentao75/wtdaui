import { onMounted, onUnmounted } from "@vue/composition-api";
import echarts from "echarts";
import _ from "lodash";

export default function(store, graphElementId, props) {
    let dailyChart = null;
    let dailyData = null;

    const splitData = stockData => {
        // 这里根据日线数据分析交易日幅度（尤其是宽幅交易日），开盘价和收盘价的位置
        var open = [];
        var close = [];

        dailyData = stockData.data;
        let min = 0;
        let max = 0;
        for (var i = 0; i < dailyData.length; i++) {
            if (
                dailyData[i].open < dailyData[i].low ||
                dailyData[i].close < dailyData[i].low ||
                dailyData[i].close > dailyData[i].high ||
                dailyData[i].open > dailyData[i].high ||
                dailyData[i].low > dailyData[i].high
            ) {
                console.log(
                    `异常数据：${dailyData[i].trade_date}, %o`,
                    dailyData[i]
                );
                continue;
            }
            let x =
                ((dailyData[i].high - dailyData[i].low) * 100) /
                dailyData[i].open;
            x = _.round(x, 2);

            let y1 =
                ((dailyData[i].open - dailyData[i].low) * 100) /
                (dailyData[i].high - dailyData[i].low);
            let y2 =
                ((dailyData[i].close - dailyData[i].low) * 100) /
                (dailyData[i].high - dailyData[i].low);
            y1 = _.round(y1, 2);
            y2 = _.round(y2, 2);
            if (x > max) max = x;
            if (x < min) min = x;

            open.push([x, y1]);
            close.push([x, y2]);
        }

        return {
            info: stockData.info,
            values: [close, open],
            min,
            max
        };
    };

    const getGraphOption = data => {
        return {
            title: {
                text: `${data && data.info && data.info.ts_code} ${
                    data.info.name
                } 波幅与开盘/收盘分布`,
                left: "5%"
                // top: 0
            },
            visualMap: [
                {
                    min: data.min,
                    max: data.max,
                    dimension: 0,
                    orient: "vertical",
                    right: 10,
                    top: "20%",
                    text: ["最高", "最低"],
                    calculable: true,
                    seriesIndex: 0,
                    inRange: {
                        // color: ["rgba(255, 0, 0, 0.1)", "rgba(255, 0, 0, 1)"],
                        // color: ["#ff0000", "#ff0000"],
                        symbolSize: [5, 20],
                        colorAlpha: [0.1, 1]
                    },
                    formatter: "{value}%"
                },
                {
                    min: data.min,
                    max: data.max,
                    dimension: 0,
                    orient: "vertical",
                    right: 10,
                    bottom: "20%",
                    text: ["最高", "最低"],
                    calculable: true,
                    seriesIndex: 1,
                    inRange: {
                        // color: ["rgba(0, 0, 255, 0.1)", "rgba(0, 0, 255, 1)"],
                        symbolSize: [5, 20],
                        colorAlpha: [0.1, 1]
                    },
                    formatter: "{value}%"
                }
            ],
            tooltip: {
                trigger: "item",
                axisPointer: {
                    type: "cross"
                }
            },
            grid: [
                {
                    left: "5%",
                    right: "100"
                    // height: "50%"
                }
            ],
            xAxis: [
                {
                    type: "value",
                    name: "波幅",
                    nameLocation: "middle",
                    axisLabel: {
                        show: true,
                        formatter: "{value}%"
                    }
                }
            ],
            yAxis: [
                {
                    type: "value",
                    name: "价格位置",
                    nameLocation: "middle"
                }
            ],
            series: [
                {
                    name: "开盘价位置",
                    type: "scatter",
                    symbol: "circle",
                    symbolSize: 5,
                    itemStyle: {
                        color: ""
                    },
                    data: data.values[0]
                },
                {
                    name: "收盘价位置",
                    type: "scatter",
                    symbol: "diamond",
                    symbolSize: 5,
                    data: data.values[1]
                }
            ]
        };
    };

    const dailyChartResize = () => {
        dailyChart.resize();
    };

    const dataReady = rawData => {
        console.log("volatile2 处理数据 ...");
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
        console.log("volatile2 处理数据完毕！");
    };

    onMounted(() => {
        console.log("volatile2 onMounted");
        dataReady(props.data);
    });

    onUnmounted(() => {
        console.log("volatile2 onUnmounted");
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
