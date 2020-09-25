"use strict";

import { app, protocol, BrowserWindow, ipcMain } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";

import {
    readStockData,
    readStockList,
    readStockIndexList,
    stockDataNames
} from "@wt/lib-wtda-query";

import _ from "lodash";
import { favorites, search } from "@wt/lib-stock";

import xueqiu from "./data/xueqiu";
import log from "electron-log";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1200,
        height: 910,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        win.loadURL("app://./index.html");
    }

    win.on("closed", () => {
        win = null;
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        try {
            createWindow();
        } catch (error) {
            log.error(`创建窗口发生错误：${error}`);
        }
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installVueDevtools();
        } catch (e) {
            console.error("Vue Devtools failed to install:", e.toString());
        }
    }
    // prepareStockList();
    createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", data => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}

//const _stockListMap = {};
//const _indexListMap = {};
/**
 * 准备股票列表，可以为后续的相应操作提供基础的内存数据支持
 */
async function prepareStockList() {
    try {
        let stockListData = await readStockList();
        console.log(
            `读取股票列表数据：${stockListData && stockListData.data.length}`
        );
        log.info(
            `读取股票列表数据：${stockListData && stockListData.data.length}`
        );

        let indexListData = await readStockIndexList();
        if (
            indexListData &&
            indexListData.data &&
            indexListData.data.length > 0
        ) {
            indexListData.data = indexListData.data.filter(item => {
                return item.market === "SSE" || item.market === "SZSE";
            });
        }
        log.info(
            `读取指数列表数据：${indexListData &&
                indexListData.data &&
                indexListData.data.length}`
        );
        console.log(
            `读取指数列表数据：${indexListData &&
                indexListData.data &&
                indexListData.data.length}`
        );
        let favoritesData = await favorites.readFavorites();
        if (!favoritesData || _.isEmpty(favoritesData.favorites)) {
            await favorites.addFavorites([
                // "600036.SH",
                // "601318.SH",
                // "600276.SH",
                // "600489.SH",
                // "000725.SZ",
                // "000568.SZ",
                // "002352.SZ"
            ]);
        }
        log.info(
            `读取自选列表：${favoritesData &&
                favoritesData.favorites &&
                favoritesData.favorites.length}`
        );
        // let favList = [];
        // for (let code of favoritesData.favorites) {
        //     for (let stock of stockListData.data) {
        //         if (code.match(stock.ts_code)) {
        //             favList.push({
        //                 value: code,
        //                 ts_code: code,
        //                 name: stock.name
        //             });
        //         }
        //     }
        // }
        let reports = await search.readReports();
        // 这里仅取出报告数据部分传入！
        reports = reports && reports.reports;

        // log.info(
        //     `获得报告列表：${reports &&
        //         reports.squeeze &&
        //         reports.squeeze.buyList &&
        //         reports.squeeze.buyList.length}`
        // );
        return {
            stock: stockListData.data,
            index: indexListData.data,
            favorites: favoritesData.favorites, // favList
            reports
        };
    } catch (error) {
        log.error(`读取股票/指数列表时发生异常：${error}`);
        console.error(`读取股票/指数列表时发生异常：${error}`);
    }
}

ipcMain.on("init-stockList", async function(event) {
    try {
        let data = await prepareStockList();
        event.sender.send("init-stockList-ready", data);
    } catch (error) {
        log.error(`读取股票列表时发生异常：${error}`);
        console.log("获取股票列表时发生错误");
    }
});

ipcMain.on("data-stock-read", async function(event, args) {
    console.log("收到数据读取事件，开始读取：", args);

    if (args.name === "stockBasic") {
        let stockListData = await readStockList();
        if (stockListData !== null) {
            console.log("stock list data updated @ ", stockListData.updateTime);
            console.log(
                "ipcMain data ready: ",
                stockListData.data && stockListData.data.length
            );
            event.sender.send("data-stockBasic-ready", stockListData.data);
        }
    } else if (args.name === "stockCompany") {
        // ts.stockCompany(args.tsCode, args.exchange).then((data) => {
        //     event.sender.send("data-stockCompany-ready", data)
        // })
    } else if (args.name === "stockDaily") {
        console.log("stockDaily send: ", args);
        try {
            let stockDailyData = await readStockData(
                stockDataNames.daily,
                args.tsCode
            );
            if (stockDailyData.data && stockDailyData.data.length > 0) {
                stockDailyData.data = stockDailyData.data.slice(0, 1000);
            }
            stockDailyData.tsCode = args.tsCode;
            event.sender.send("data-stockDaily-ready", stockDailyData);
        } catch (error) {
            console.error(`未能读取stockDaily数据！ ${error}`);
            event.sender.send("data-stockDaily-ready");
        }
    } else if (args.name === "stockTrend") {
        log.info(`stockTrend 事件：, %o`, args);
        console.log("stockTrend 事件：%o", args);
        let stockTrendData = await readStockData(
            stockDataNames.trend,
            args.tsCode
        );
        log.info(`trend: %o`, stockTrendData.data[0]);
        //TODO: 需要单独获取股票或者指数的名称信息
        //stockTrendData.info = _stockListMap[args.tsCode];
        stockTrendData.tsCode = args.tsCode;
        event.sender.send("data-stockTrend-ready", stockTrendData);
    } else if (args.name === "rtQuote") {
        log.info(`rtQuote 事件：, %o`, args);
        console.log("rtQuote 事件：%o", args);
        try {
            let quoteData = await xueqiu.readXueqiuQuotec(args.tsCode);
            log.info(`rtQuote 返回: %o`, quoteData);
            event.sender.send("data-rtQuote-ready", quoteData);
        } catch (error) {
            console.error(`读取实时数据错误: %o`, error);
        }
    } else if (args.name === "addFavorites") {
        log.info(`addFavorites 事件：, %o`, args);
        let favData = await favorites.addFavorites(args.data);
        event.sender.send("favorites-ready", favData && favData.favorites);
    } else if (args.name === "removeFavorites") {
        log.info(`removeFavorites 事件：, %o`, args);
        let favData = await favorites.removeFavorites(args.data);
        event.sender.send("favorites-ready", favData && favData.favorites);
    }
});
