/**
 * 用于读取雪球的实时数据
 */
import _ from "lodash";
import moment from "moment";
import axios from "axios";

const UserAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36";
const Cookie =
    "xq_a_token=636e3a77b735ce64db9da253b75cbf49b2518316; xqat=636e3a77b735ce64db9da253b75cbf49b2518316; xq_r_token=91c25a6a9038fa2532dd45b2dd9b573a35e28cfd; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOi0xLCJpc3MiOiJ1YyIsImV4cCI6MTYwMjY0MzAyMCwiY3RtIjoxNjAwMDUxOTg3OTQ2LCJjaWQiOiJkOWQwbjRBWnVwIn0.TNC6hkwIKQ0z-CRn8jyqFvIB5hhBAOoFR9qbs2A7dTov2TjcCejgWroA-MPgT22bQZtHb3k01HN-oIqpWSfsx2FVNsYp42EUz-eJWIdhW1SfWRy5FQ1RqHr4z1RtjZFZYEa3pWDNUM1CPOLIVrPE6CDj7Fs9rHywcU9zDR0kvjT-cACGC7AGP2iT4dFvEG-05oV1wFEKYU0okzK55mmNRmd6SK99P6i1LLHRgnnL9jPaMBS3Tv_uCySV2x_x3OkHQyFnWqrMToKNj8oYUnO6gYsxyKqkrfLkObnbGg4aMujFwCY0tBgtD0xVemwwgImlwz0TkYUfLXDhJmPmRRYXJw; u=841600052036729; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1600067869";

async function readXueqiuQuotec(tsCode) {
    // https://stock.xueqiu.com/v5/stock/realtime/quotec.json?
    // symbol = SH600276
    // _ = 1600052075408

    /**
     * 返回数据格式：
{
    "data": [
        {
            "symbol": "SH600276", // 代码
            "current": 92.14, // 最新价
            "percent": 0.36, // 涨幅
            "chg": 0.33, // 变化
            "timestamp": 1600052072020, // 时间
            "volume": 6855370, // 成交量
            "amount": 6.30631398e8, // 成交额
            "market_capital": 4.8896397642e11, //
            "float_market_capital": 4.87949292041e11, //
            "turnover_rate": 0.13, // 换手率
            "amplitude": 1.11, // 振幅
            "open": 92.1, // 开盘
            "last_close": 91.81, // 昨收
            "high": 92.38, // 最高
            "low": 91.36, // 最低
            "avg_price": 91.991, // 均价
            "trade_volume": 6600, //
            "side": -1, //
            "is_trade": true, // 是否交易
            "level": 1, //
            "trade_session": null,
            "trade_type": null,
            "current_year_percent": 26.64, //
            "trade_unique_id": "6855370",
            "type": 11,
            "bid_appl_seq_num": null,
            "offer_appl_seq_num": null,
            "volume_ext": null,
            "traded_amount_ext": null
        }
    ],
    "error_code": 0,
    "error_description": null
}     * 
     */

    // let now = moment();
    // let nowTicks = now.valueOf();

    let symbol =
        tsCode &&
        _.isString(tsCode) &&
        `${tsCode.slice(7, 9)}${tsCode.slice(0, 6)}`;
    let url = `https://stock.xueqiu.com/v5/stock/realtime/quotec.json?symbol=${symbol}`;
    // let params = {
    //     symbol,
    //     _: nowTicks
    // };

    console.log(`${url}`);
    // axios.default.withCredentials = true;
    let response = await axios.request({
        url,
        // params,
        // withCredentials: true,
        headers: {
            Host: "stock.xueqiu.com",
            Accept: "application/json",
            "User-Agent": UserAgent,
            "Accept-Language":
                "zh,zh-CN;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6",
            "Accept-Encoding": "gzip, deflate, br",
            Cookie,
            Connection: "keep-alive"
        }
    });
    if (response && response.data && response.data.error_code === 0) {
        let rtData = response.data.data && response.data.data[0];
        let dataTime = moment(rtData.timestamp);
        console.log(
            `实时数据返回[${dataTime.format("YYYYMMDD HH:mm:SS")}]：%o`,
            rtData
        );

        let dayData = {
            ts_code: tsCode,
            trade_date: dataTime.format("YYYYMMDD"),
            pre_close: rtData.last_close,
            open: rtData.open, // 开盘
            high: rtData.high, // 最高
            low: rtData.low, // 最低
            close: rtData.current,
            change: rtData.chg,
            pct_chg: rtData.percent,
            vol: rtData.volumn,
            amount: rtData.amount,
            prevadj_factor: 1,
            update_time: rtData.timestamp
        };
        return dayData;
    } else {
        console.log(
            `发生错误，${response &&
                response.data &&
                response.data.error_code} [${response &&
                response.data &&
                response.data.error_description}]`
        );
    }
}

async function readXueqiuMinutes(symbol, date, days) {
    // https://stock.xueqiu.com/v5/stock/chart/kline.json?
    // symbol=SZ300420
    // begin=1599635805884
    // period=1m
    // type = before normal after
    // count = -284
    // indicator = kline

    let beginDate = moment();
    if (!date) {
        moment(date, "YYYYMMDD");
        beginDate.hour(15);
        beginDate.minute(0);
        beginDate.second(0);
    }
    let begin = beginDate.valueOf();

    let count = -days * 4 * 60 + 1;
    let url = `https://stock.xueqiu.com/v5/stock/chart/kline.json`;
    let params = {
        symbol,
        begin,
        period: "1m",
        type: "before",
        count,
        indicator: "kline"
    };
    console.log(`%o`, params);
    // axios.default.withCredentials = true;
    let response = await axios.request({
        url,
        params,
        withCredentials: true,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
            Cookie:
                "device_id=4a184072524f1f96bf3a2603eb712be2; xq_a_token=4db837b914fc72624d814986f5b37e2a3d9e9944; xqat=4db837b914fc72624d814986f5b37e2a3d9e9944; xq_r_token=2d6d6cc8e57501dfe571d2881cabc6a5f2542bf8; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOi0xLCJpc3MiOiJ1YyIsImV4cCI6MTYwMDQ4MzAwNywiY3RtIjoxNTk4ODU5ODM5MzYxLCJjaWQiOiJkOWQwbjRBWnVwIn0.CPq63_E4gQtmMXVJFiIPineaN5nFA90mf_fr290Lfg96cCKeVesH7leATK0FZHo2q5pTAhLYnuey6cDVz7Duh_ZAV8OsRnq_viA8uPJPGBXK2I8fUJedZE1Orf0wZHRhpDwVboERdBFVhbUgPHhngAUeIHEMjDwucrhirtFEbTg-b2ZZad2YHpL6-lqUbD_187BuSaKFacb1HvY2miwIHFCNqS1J9Uc_QMDbj0eG2o0UBChr-KeL68rXMaj1vjtIfQCJEakCWQtxjF8F69RyMqksTGJO6JPxaD63wam7OYzo6jkh-2aAfxL7yQuEVBOv05xXItNVNQoqdgpnAIuj0A; u=141598859857213; s=ck12x6ozui; Hm_lvt_1db88642e346389874251b5a1eded6e3=1597807498,1598859858,1599128717,1599547986; _ga=GA1.2.587638619.1599548114; _gid=GA1.2.382854151.1599548114; is_overseas=0; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1599554211"
        }
    });
    if (response && response.data && response.data.error_code === 0) {
        console.log(
            `
        数据内容：%o
        数据条数：${response.data.data.item && response.data.data.item.length}
        `,
            response.data.data.column
        );

        let index = 0;
        for (let item of response.data.data.item) {
            index++;
            console.log(
                `${index}: ${moment(item[0]).format("YYYY-MM-DD HH:mm:ss")}, ${
                    item[2]
                }, ${item[3]}, ${item[4]}, ${item[5]}`
            );
        }
    } else {
        console.log(
            `发生错误，${response &&
                response.data &&
                response.data.error_code} [${response &&
                response.data &&
                response.data.error_description}]`
        );
    }
}

export default { readXueqiuQuotec, readXueqiuMinutes };
