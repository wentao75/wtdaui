import Vue from "vue";
import Vuex from "vuex";
import _ from "lodash";
import { ipcRenderer } from "electron";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        initDataFinished: false,
        defaultStockCode: "",
        symbolMap: null,
        stockList: null,
        indexList: null,
        favoriteList: null,
        squeezeList: null
    },
    getters: {
        isFavorite: state => symbol => {
            if (_.isEmpty(symbol) && symbol.length !== 9) return false;
            for (let fav of state.favoriteList) {
                if (fav.ts_code === symbol) return true;
            }
            return false;
        },
        queryCodeBySymbol: state => symbol => {
            if (_.isEmpty(symbol) && symbol.length !== 6) return [];
            return state.symbolMap.get(symbol);
        },
        queryInfoByCode: state => code => {
            if (_.isEmpty(code)) return null;
            // console.log(
            //     `${code}, %o, %o, %o, %o`,
            //     state.stockList,
            //     state.indexList,
            //     state.stockList && state.stockList.get(code),
            //     state.indexList && state.indexList.get(code)
            // );
            return (
                (state.stockList && state.stockList.get(code)) ||
                (state.indexList && state.indexList.get(code))
            );
        },
        // 通过输入字符串过滤查询符合的股票代码列表
        queryCodes: state => query => {
            // 使用字符串查询是否有匹配的代码
            if (_.isEmpty(query)) return state.favoriteList;
            let codes = [];
            for (let code of state.stockList.keys()) {
                if (code.match(query)) {
                    let tmp = state.stockList.get(code);
                    codes.push({ value: code, name: tmp.name, stock: tmp });
                }
            }
            for (let code of state.indexList.keys()) {
                if (code.match(query)) {
                    let tmp = state.indexList.get(code);
                    codes.push({ value: code, name: tmp.name, stock: tmp });
                }
            }
            for (let stock of state.stockList.values()) {
                if (stock.name.match(query)) {
                    codes.push({
                        value: stock.ts_code,
                        name: stock.name,
                        stock
                    });
                }
            }
            for (let fav of state.favoriteList) {
                if (fav.ts_code.match(query)) continue;
                codes.push(fav);
            }
            return codes;
        }
    },
    mutations: {
        setInitDataFinished(state) {
            console.log(`初始化完成！`);
            state.initDataFinished = true;
        },
        setStockList(state, data) {
            console.log(`setStockList`);
            state.stockList = data;
        },
        setIndexList(state, data) {
            console.log(`setIndexList`);
            state.indexList = data;
        },
        setSymbols(state, data) {
            console.log(`setSymbols`);
            state.symbolMap = data;
        },
        setFavorites(state, data) {
            state.favoriteList = data;
        },
        setDefaultStockCode(state, data) {
            console.log(`设置默认代码：${data}`);
            state.defaultStockCode = data;
        },
        setSqueezes(state, data) {
            state.squeezeList = data;
        }
    },
    actions: {
        setListData({ commit }, data) {
            // 这里需要从原始的数组，准备symbol map和两个队列信息
            if (!data) return;
            let tmpSymbolMap = new Map();
            let tmpStockMap = new Map();
            let tmpIndexMap = new Map();
            if (data.stock && data.stock.length > 0) {
                for (let i = 0; i < data.stock.length - 1; i++) {
                    let tmp = data.stock[i];
                    let symbol = tmp.symbol;
                    let tsCode = tmp.ts_code;
                    if (tmpSymbolMap.has(symbol)) {
                        if (Array.isArray(tmpSymbolMap.get(symbol))) {
                            tmpSymbolMap.get(symbol).push(tsCode);
                        } else {
                            tmpSymbolMap.set(symbol, [
                                tmpSymbolMap.get(symbol),
                                tsCode
                            ]);
                        }
                    } else {
                        tmpSymbolMap.set(symbol, tsCode);
                    }

                    tmpStockMap.set(tsCode, tmp);
                }
            }
            commit("setStockList", tmpStockMap);

            if (data.index && data.index.length > 0) {
                for (let i = 0; i < data.index.length - 1; i++) {
                    let tmp = data.index[i];
                    //let symbol = tmp.symbol;
                    let tsCode = tmp.ts_code;
                    let symbol = tsCode.substring(0, 6);
                    if (tmpSymbolMap.has(symbol)) {
                        if (Array.isArray(tmpSymbolMap.get(symbol))) {
                            tmpSymbolMap.get(symbol).push(tsCode);
                        } else {
                            tmpSymbolMap.set(symbol, [
                                tmpSymbolMap[symbol],
                                tsCode
                            ]);
                        }
                    } else {
                        tmpSymbolMap.set(symbol, tsCode);
                    }

                    tmpIndexMap.set(tsCode, tmp);
                }
            }
            commit("setIndexList", tmpIndexMap);
            commit("setSymbols", tmpSymbolMap);

            let favList = [];
            if (data && data.favorites) {
                for (let code of data.favorites) {
                    let stock = tmpStockMap.get(code);
                    if (stock) {
                        favList.push({
                            value: code,
                            ts_code: code,
                            name: stock.name
                        });
                    }
                }
            }
            commit("setFavorites", favList);
            if (favList && favList.length > 0) {
                commit("setDefaultStockCode", favList[0].ts_code);
            }

            // 这里需要调整报告数据的格式，同时将必要的数据填入
            // let reportLists = [];
            if (data && data.reports) {
                let reports = data.reports;
                if (!_.isNil(reports) && !_.isEmpty(reports)) {
                    for (let rptData of reports) {
                        //let rptData = reports[rpt];
                        // let dataLists = [];
                        if (
                            rptData &&
                            rptData.data &&
                            rptData.data.length > 0
                        ) {
                            for (let dataList of rptData.data) {
                                // let dataList = rptData[stateName];

                                // let tmpData = [];
                                for (let list of dataList.data) {
                                    // if (_.isEmpty(list)) continue;
                                    let tmpList = [];
                                    for (let code of list.data) {
                                        let stock = tmpStockMap.get(code);
                                        if (stock) {
                                            tmpList.push({
                                                ts_code: code,
                                                name: stock.name
                                            });
                                        }
                                    }
                                    list.data = tmpList;
                                    // tmpData.push(tmpList);
                                    // console.log(
                                    //     `报告数据：${rpt}-${stateName}[${tmpData.length -
                                    //         1}] ${tmpList.length}条`
                                    // );
                                }

                                // dataLists.push({
                                //     label: stateName,
                                //     data: tmpData
                                // });
                                // console.log(
                                //     `报告数据：${rpt}-${stateName} ${tmpData.length}条`
                                // );
                            }
                        }
                        // reportLists.push({
                        //     label: rpt,
                        //     data: dataLists
                        // });
                    }
                }
            }

            // let squeezeList = [[], []];
            // if (data && data.reports && data.reports.squeeze) {
            //     if (data.reports.squeeze.buyList) {
            //         for (let list of data.reports.squeeze.buyList) {
            //             if (_.isEmpty(list)) continue;
            //             let tmpList = [];
            //             for (let code of list) {
            //                 let stock = tmpStockMap.get(code);
            //                 if (stock) {
            //                     tmpList.push({
            //                         ts_code: code,
            //                         name: stock.name
            //                     });
            //                 }
            //             }
            //             squeezeList[0].push(tmpList);
            //         }
            //     }
            //     if (data.reports.squeeze.readyList) {
            //         for (let list of data.reports.squeeze.readyList) {
            //             if (_.isEmpty(list)) continue;
            //             let tmpList = [];
            //             for (let code of list) {
            //                 let stock = tmpStockMap.get(code);
            //                 if (stock) {
            //                     tmpList.push({
            //                         ts_code: code,
            //                         name: stock.name
            //                     });
            //                 }
            //             }
            //             squeezeList[1].push(tmpList);
            //         }
            //     }
            // }
            console.log(`squeeze: %o`, data.reports); //reportLists);
            commit("setSqueezes", data.reports); //reportLists);

            commit("setInitDataFinished");
            tmpIndexMap = null;
            tmpStockMap = null;
            tmpSymbolMap = null;
        },
        setFavorites({ commit, state }, favorites) {
            let favList = [];
            if (favorites) {
                for (let code of favorites) {
                    let stock = state.stockList.get(code);
                    if (stock) {
                        favList.push({
                            value: code,
                            ts_code: code,
                            name: stock.name
                        });
                    }
                }
            }
            commit("setFavorites", favList);
        },
        addFavorite(context, tsCode) {
            ipcRenderer.send("data-stock-read", {
                name: "addFavorites",
                data: tsCode
            });
        },
        removeFavorite(context, tsCode) {
            ipcRenderer.send("data-stock-read", {
                name: "removeFavorites",
                data: tsCode
            });
        }
    },
    modules: {}
});
