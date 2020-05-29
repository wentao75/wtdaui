"use strict";

import { app, protocol, BrowserWindow, ipcMain } from "electron";
import {
    createProtocol,
    installVueDevtools
} from "vue-cli-plugin-electron-builder/lib";

import {
    readStockData,
    readStockList,
    // readStockIndexList,
    stockDataNames
} from "@wt/lib-wtda-query";

// const stockData = require("@wt/lib-wtda");
//     readStockData,
//     readStockList,
//     // readStockIndexList,
//     stockDataNames
// } from "@wt/lib-wtda";

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
        createWindow();
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
    prepareStockList();
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

const _stockListMap = {};
/**
 * 准备股票列表，可以为后续的相应操作提供基础的内存数据支持
 */
async function prepareStockList() {
    try {
        let stockListData = await readStockList();
        console.log(
            `读取股票列表数据：${stockListData && stockListData.data.length}`
        );
        if (
            stockListData &&
            stockListData.data &&
            stockListData.data.length > 0
        ) {
            while (stockListData.data.length > 0) {
                let item = stockListData.data.pop();
                _stockListMap[item.ts_code] = item;
            }
        }
        stockListData = null;
    } catch (error) {
        console.error(`读取股票列表时发生异常：%{error}`);
    }
}

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
        let stockDailyData = await readStockData(
            stockDataNames.daily,
            args.tsCode
        );
        event.sender.send(
            "data-stockDaily-ready",
            stockDailyData && stockDailyData.data
        );
    } else if (args.name === "stockTrend") {
        console.log("stockTrend 事件：%o", args);
        let stockTrendData = await readStockData(
            stockDataNames.trend,
            args.tsCode
        );
        stockTrendData.info = _stockListMap[args.tsCode];
        event.sender.send("data-stockTrend-ready", stockTrendData);
    }
});
