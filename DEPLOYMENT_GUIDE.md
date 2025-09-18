# DAMO Cashier 项目开发部署完整指南

## 项目概述

**项目类型：** uni-app 收银系统  
**技术栈：** Vue 2 + uView UI + Vuex + WebSocket  
**开发工具：** HBuilderX 或 VS Code + uni-app 插件  
**部署方式：** H5 Web 应用 + 原生 App

## 快速部署方案

### 方案一：使用已构建版本（推荐）

```bash
# 1. 克隆项目
git clone [项目地址]
cd cashier-master

# 2. 安装依赖
npm install

# 3. 直接运行生产版本
npm run serve

# 4. 访问系统
open http://localhost:8091
```

### 方案二：开发模式部署

```bash
# 1. 安装 HBuilderX
# 下载地址：https://www.dcloud.io/hbuilderx.html

# 2. 用 HBuilderX 打开项目

# 3. 运行到浏览器
# 点击 运行 -> 运行到浏览器 -> Chrome

# 4. 或使用命令行
npx @dcloudio/uvm
```

## 环境要求

### 必需环境
- **Node.js:** >= 14.0.0
- **npm:** >= 6.0.0
- **浏览器:** Chrome/Safari/Firefox 最新版

### 可选环境
- **HBuilderX:** 用于完整开发体验
- **Android Studio:** 用于 Android 打包
- **Xcode:** 用于 iOS 打包

## 项目结构分析

```
cashier-master/
├── api/                    # API 接口配置
│   ├── core.js            # 核心接口（登录、统计等）
│   ├── goods.js           # 商品管理接口
│   ├── order.js           # 订单处理接口
│   └── store.js           # 店铺管理接口
├── common/                # 公共工具
│   ├── request.js         # HTTP 请求封装
│   └── socket.js          # WebSocket 连接
├── custom/                # 自定义配置
│   ├── config.js          # 应用配置
│   └── siteroot.js        # API 根地址配置
├── pages/                 # 页面文件
│   ├── login/             # 登录相关页面
│   ├── home/              # 收银台主页
│   ├── handover/          # 交班功能
│   └── table/             # 桌台管理
├── unpackage/dist/build/web/  # 已构建的 H5 版本
├── manifest.json          # uni-app 配置文件
├── pages.json            # 页面路由配置
└── package.json          # 项目依赖配置
```

## 关键配置文件

### 1. API 配置 (custom/siteroot.js)
```javascript
var site = {
    version: "1.0",
    screenurl: "web/index.html#/",
    siteroot: 'https://www.vdamo.com'  // 线上 API 地址
}
```

### 2. 开发服务器配置 (package.json)
```json
{
  "scripts": {
    "serve": "npx http-server unpackage/dist/build/web -p 8091 -c-1 --cors",
    "dev": "npx http-server unpackage/dist/build/web -p 8091 -c-1 --cors",
    "start": "npm run serve"
  }
}
```

### 3. H5 配置 (manifest.json)
```json
{
  "h5": {
    "router": {
      "base": "./",
      "mode": "history"
    },
    "devServer": {
      "disableHostCheck": true,
      "port": 8091,
      "proxy": {
        "/channel": {
          "target": "https://www.vdamo.com",
          "changeOrigin": true,
          "secure": true
        }
      }
    }
  }
}
```

## 开发流程

### 1. 项目初始化
```bash
# 检查环境
node --version  # >= 14.0.0
npm --version   # >= 6.0.0

# 安装依赖
npm install

# 验证部署
node verify-deployment.js
```

### 2. 启动开发服务器
```bash
# 方式一：使用 npm 脚本
npm run serve

# 方式二：使用便捷脚本
./start-dev.sh

# 方式三：手动启动
npx http-server unpackage/dist/build/web -p 8091 -c-1 --cors
```

### 3. 访问应用
- **主应用：** http://localhost:8091
- **登录页面：** 自动跳转到登录界面
- **收银台：** 登录后进入收银系统

## 功能模块说明

### 核心功能
1. **用户登录** - 支持账号密码登录
2. **收银台** - 商品扫码、计算、支付
3. **会员管理** - 会员信息、积分、余额
4. **订单管理** - 订单查询、退款、打印
5. **交班功能** - 收银员交班统计
6. **桌台管理** - 餐饮桌台服务

### API 接口
- **基础路径：** https://www.vdamo.com/channel/
- **登录接口：** POST /channel/login
- **统计接口：** GET /channel/statistics
- **会员接口：** GET /channel/member
- **订单接口：** POST /channel/order

### 实时功能
- **WebSocket：** wss://www.vdamo.com/ws
- **订单通知** - 新订单实时提醒
- **语音播报** - 订单金额语音提示

## 常见问题解决

### 1. 端口占用
```bash
# 查看端口占用
lsof -ti:8091

# 杀死占用进程
lsof -ti:8091 | xargs kill -9

# 使用其他端口
npx http-server unpackage/dist/build/web -p 8092 -c-1 --cors
```

### 2. CORS 跨域问题
```bash
# 确保启动参数包含 --cors
npx http-server . -p 8091 -c-1 --cors

# 或在 manifest.json 中配置代理
```

### 3. API 连接失败
```bash
# 检查网络连接
curl https://www.vdamo.com/channel/profix

# 检查防火墙设置
# 确保可以访问 https://www.vdamo.com
```

### 4. 页面空白或加载失败
```bash
# 检查构建文件是否存在
ls -la unpackage/dist/build/web/

# 重新启动服务器
pkill -f "http-server"
npm run serve
```

## 生产部署

### H5 部署
```bash
# 1. 使用已构建版本
cp -r unpackage/dist/build/web/* /var/www/html/

# 2. 配置 Nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 移动端打包
```bash
# Android 打包
# 1. 用 HBuilderX 打开项目
# 2. 发行 -> 原生 App-云打包
# 3. 选择 Android 平台
# 4. 配置签名证书
# 5. 开始打包

# iOS 打包
# 1. 发行 -> 原生 App-云打包
# 2. 选择 iOS 平台
# 3. 配置证书和描述文件
# 4. 开始打包
```

## 开发建议

### 1. 代码规范
- 使用 ESLint + Prettier
- 遵循 Vue 2 开发规范
- 组件命名使用 PascalCase

### 2. 调试技巧
- 使用浏览器开发者工具
- 启用 Vue Devtools
- 查看 Network 面板检查 API 调用

### 3. 性能优化
- 图片资源压缩
- 代码分割和懒加载
- API 请求缓存

## 快速命令参考

```bash
# 项目初始化
npm install

# 启动开发服务器
npm run serve

# 验证部署
node verify-deployment.js

# 查看端口占用
lsof -i:8091

# 停止服务器
pkill -f "http-server"

# 重启服务器
npm run serve

# 访问应用
open http://localhost:8091
```

## 总结

这个 DAMO Cashier 项目是一个完整的 uni-app 收银系统，支持多平台部署。关键点：

1. **使用已构建版本** - 直接运行 `unpackage/dist/build/web` 目录
2. **API 连接线上** - 所有数据来自 https://www.vdamo.com
3. **简单部署** - 只需 `npm install` + `npm run serve`
4. **完整功能** - 登录、收银、会员、订单等全功能

下次遇到类似项目，直接按照这个指南操作即可快速部署和开发。