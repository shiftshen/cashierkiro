# DAMO Cashier - 收银系统

基于 uni-app 开发的跨平台收银系统，支持 H5、Android、iOS 等多平台部署。

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/shiftshen/cashierkiro.git
cd cashierkiro

# 安装依赖
npm install

# 启动开发服务器
npm run serve

# 访问系统
open http://localhost:8091
```

## 📋 技术栈

- **框架**: uni-app (Vue 2)
- **UI库**: uView UI
- **状态管理**: Vuex
- **国际化**: vue-i18n
- **实时通信**: WebSocket
- **样式**: SCSS/SASS

## 🎯 主要功能

- 🔐 用户登录认证
- 💰 收银台操作
- 👥 会员管理
- 📦 商品管理
- 📊 订单处理
- 🔄 交班功能
- 🍽️ 桌台管理
- 🔔 实时通知

## 📱 多平台支持

- **H5**: 浏览器访问
- **Android**: 原生 App
- **iOS**: 原生 App
- **微信小程序**: 小程序版本

## 🛠️ 开发环境

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 可选工具
- HBuilderX (推荐)
- VS Code + uni-app 插件

## 📖 详细文档

查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 获取完整的开发和部署指南。

## 🔧 配置说明

### API 配置
API 配置位于 `custom/siteroot.js`：
```javascript
var site = {
    siteroot: 'https://www.vdamo.com'  // API 服务器地址
}
```

### 开发服务器
默认运行在 http://localhost:8091

## 📁 项目结构

```
├── api/                    # API 接口配置
├── common/                # 公共工具和组件
├── custom/                # 自定义配置
├── pages/                 # 页面文件
├── static/                # 静态资源
├── store/                 # Vuex 状态管理
├── uni_modules/           # uni-app 模块
├── unpackage/dist/build/web/  # 构建输出 (H5)
├── App.vue               # 应用入口
├── main.js               # 主文件
├── manifest.json         # uni-app 配置
└── pages.json           # 页面路由配置
```

## 🚀 部署

### 开发环境
```bash
npm run serve
```

### 生产环境
使用 `unpackage/dist/build/web/` 目录下的构建文件部署到 Web 服务器。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

本项目仅供学习和开发使用。

## 📞 支持

如有问题，请提交 Issue 或联系开发团队。