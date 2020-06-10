# wtdaui

使用本地数据绘制和计算交易数据

[TOC]

## 功能及目标记录

### 基础数据显示

-   股票列表（深/沪）和指数列表（深/沪/??），显示什么？信息 or 价格
-   自选列表（或者持仓，关注列表），这个应该是入口常规功能，针对关注或者持有股票的列表查看，这里应该显示持仓或者盈亏以及相应的指标信息
-   股票信息和数据查看，主要是针对不同的计算和指标进行图形展示及分析，这个部分待扩展的内容应当较多，如果形成明确的量化规则计算库，那么主要是针对执行规则的计算和展示；同时也应当有针对性的新规则分析和对比等功能。

### 量化计算规则

这个部分应当是核心功能，首先是规则添加和分析，然后是不同规则的组合和计算输出，最终是根据规则的自动化持续应用

这个部分待考虑的内容还比较多，目前还在收集单一的指标和计算方法，如何组合以形成可搭配的规则库还没有想法 ☹️

## 踩坑记录

-   2020.6.3 尝试了一次 electron:build 打包发布结果，过程正常，只有几个 warning 提示（console 输出警告），在 mac 上生成了 dmg，运行后始终显示白页面...，因为没有任何日志，不知道问题在哪里，考虑了一下，添加了 electron-log 包用于输出文件日志（生产用），打印日志发现存在 main 和 renderer 日志，并且启动后的初始数据加载都有输出日志；但是和 dev 环境的输出比较后发现一个问题，没有页面显示后对应的事件触发，初步怀疑是 vue 过程有加载，但是没有显示！进行了 google 问题搜索，也尝试了一些更多的日志输出，最后在一个网页发现了一个提示：vue router 不能使用 history 模式，修改为“hash“模式后，页面正常显示！
-

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

### Run your unit tests

```
yarn test:unit
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
