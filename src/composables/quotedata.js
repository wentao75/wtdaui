const updateDaily = (rt, rawData) => {
    let daily = rawData && rawData.data;
    if (rt && rawData && rawData.info && rt.ts_code !== rawData.info.ts_code) {
        console.log(
            `不同数据，无法合并 ${rt && rt.ts_code} ${rawData &&
                rawData.info &&
                rawData.info.ts_code}`
        );
        return rawData;
    }
    if (daily && daily.length > 0 && rt) {
        let lastData = daily[daily.length - 1];
        console.log(
            `比较更新数据[${daily.length}]：${lastData.trade_date} ${rt.trade_date}`
        );
        if (lastData.trade_date === rt.trade_date) {
            daily[daily.length - 1] = rt;
        } else if (lastData.trade_date < rt.trade_date) {
            rt.adj_factor = lastData.adj_factor;
            daily.push(rt);
        }
    }
    return rawData;
};

export default { updateDaily };
