import { onMounted, onUnmounted, watch } from "@vue/composition-api";
import echarts from "echarts";
import _ from "lodash";

export default function(store, graphElementId, props) {
    let dailyChart = null;
    let dailyData = null;

    const splitData = stockData => {
        // 这里根据日线数据计算对应的开盘价与波幅结果，形成绘制点
        var values = [];

        dailyData = stockData.data;
        let min = 0;
        let max = 0;
        for (var i = 0; i < dailyData.length; i++) {
            let x =
                ((dailyData[i].open - dailyData[i].low) * 100) /
                (dailyData[i].high - dailyData[i].low);
            x = _.round(x, 2);
            if (x > 100 || x < 0) {
                console.log(
                    `异常数据：${x}, ${dailyData[i].trade_date}, %o`,
                    dailyData[i]
                );
                continue;
            }
            let y = dailyData[i].close - dailyData[i].open;
            y = _.round(y, 2);
            if (y > max) max = y;
            if (y < min) min = y;
            //categoryData.push(dailyData[i].trade_date);
            values.push([x, y]);
        }

        return {
            info: stockData.info,
            values: values,
            min,
            max
        };
    };

    const getGraphOption = data => {
        return {
            title: {
                text: `${data && data.info && data.info.ts_code} ${
                    data.info.name
                } 开盘价与波幅关系`,
                left: "5%"
                // top: 0
            },
            visualMap: {
                min: 0, //data.min,
                max: 100, //data.max,
                dimension: 0,
                orient: "vertical",
                right: 10,
                top: "center",
                text: ["最高", "最低"],
                calculable: true,
                inRange: {
                    color: ["#ff0000", "#2fff00"]
                },
                formatter: "{value}%"
            },
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
                    name: "(开盘价-最低价)/波幅",
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
                    name: "收盘价-开盘价",
                    nameLocation: "middle"
                }
            ],
            series: [
                {
                    name: "开盘价位置",
                    type: "scatter",
                    symbolSize: 5,
                    // itemStyle: {
                    //     normal: {
                    //         label: {
                    //             show: true,
                    //             formatter: "{c}%"
                    //         }
                    //         // borderWidth: 0.2,
                    //         // borderColor: '#fff'
                    //     }
                    // },
                    data: data.values
                }
            ]
        };
    };

    const dailyChartResize = () => {
        dailyChart.resize();
    };

    const dataReady = rawData => {
        console.log("volatile 处理数据 ...");
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
        console.log("volatile 处理数据完毕！");
    };

    onMounted(() => {
        console.log("volatile onMounted");
        dataReady(props.data);
    });

    onUnmounted(() => {
        console.log("volatile onUnmounted");
        if (dailyChart !== null) {
            dailyChart.clear();
            dailyChart.dispose();
        }
        window.removeEventListener("resize", dailyChartResize);
    });

    watch(
        () => props.data,
        data => {
            console.log("数据变化，开始VolatileGraph处理...");
            dataReady(data);
        }
    );

    return {
        dataReady
    };
}
