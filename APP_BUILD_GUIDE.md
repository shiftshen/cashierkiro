# DAMO Cashier - APP打包指南

## 📱 uni-app APP打包完整教程

### 方案概述

uni-app提供多种APP打包方式：
1. **HBuilderX云打包** (推荐) - 最简单，无需本地环境
2. **离线打包** - 需要Android Studio/Xcode
3. **CLI命令行打包** - 适合CI/CD

## 🚀 方案一：HBuilderX云打包 (推荐)

### 1. 安装HBuilderX

```bash
# 下载HBuilderX
# 访问：https://www.dcloud.io/hbuilderx.html
# 选择"App开发版"下载
```

### 2. 导入项目

1. 打开HBuilderX
2. 文件 → 导入 → 从本地目录导入
3. 选择项目根目录 `cashierkiro`

### 3. 配置APP信息

在HBuilderX中打开 `manifest.json`，配置以下信息：

#### 基础配置
- **应用名称**: DAMO CASHIER
- **应用ID**: __UNI__90E2460 (已配置)
- **版本名称**: 1.4.5
- **版本号**: 145

#### App图标配置
项目已包含完整图标集：
- Android: `unpackage/res/icons/` (72x72 到 192x192)
- iOS: `unpackage/res/icons/` (20x20 到 1024x1024)

### 4. Android打包

#### 4.1 云打包步骤
1. 在HBuilderX中右键项目
2. 发行 → 原生App-云打包
3. 选择 Android
4. 配置打包参数：

```
打包类型: 正式版
证书: 使用DCloud证书 (测试用) 或 自有证书
渠道包: 不使用
```

#### 4.2 自定义证书 (可选)
如需自定义证书，创建Android证书：

```bash
# 生成Android证书
keytool -genkey -alias cashier -keyalg RSA -keysize 2048 -validity 36500 -keystore cashier.keystore

# 证书信息示例
# 密钥库口令: your_password
# 名字与姓氏: DAMO Cashier
# 组织单位名称: IT Department  
# 组织名称: DAMO
# 城市或区域名称: Shanghai
# 省/市/自治区名称: Shanghai
# 该单位的双字母国家/地区代码: CN
```

#### 4.3 打包配置
```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "ACCESS_NETWORK_STATE", 
      "ACCESS_WIFI_STATE",
      "CHANGE_NETWORK_STATE",
      "CHANGE_WIFI_STATE",
      "VIBRATE",
      "FLASHLIGHT",
      "READ_PHONE_STATE",
      "WAKE_LOCK"
    ],
    "abiFilters": ["armeabi-v7a", "arm64-v8a"],
    "minSdkVersion": 23,
    "targetSdkVersion": 33
  }
}
```

### 5. iOS打包

#### 5.1 云打包步骤
1. 发行 → 原生App-云打包
2. 选择 iOS
3. 配置证书和描述文件

#### 5.2 iOS证书要求
需要Apple开发者账号和以下文件：
- **开发证书**: iOS Development Certificate (.p12)
- **发布证书**: iOS Distribution Certificate (.p12)  
- **描述文件**: Provisioning Profile (.mobileprovision)

#### 5.3 获取iOS证书
```bash
# 在Mac上生成证书请求文件
# 1. 打开"钥匙串访问"
# 2. 证书助理 → 从证书颁发机构请求证书
# 3. 上传到Apple Developer Center
# 4. 下载证书并导出为.p12格式
```

## 🛠️ 方案二：离线打包

### Android离线打包

#### 1. 环境准备
```bash
# 安装Android Studio
# 下载地址: https://developer.android.com/studio

# 安装JDK 8+
# 配置ANDROID_HOME环境变量
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### 2. 生成离线打包资源
1. HBuilderX → 发行 → 原生App-本地打包 → 生成本地打包App资源
2. 资源生成在 `unpackage/resources/`

#### 3. 集成到Android项目
```bash
# 下载Android离线SDK
# https://nativesupport.dcloud.net.cn/AppDocs/download/android

# 将生成的资源复制到Android项目
cp -r unpackage/resources/* /path/to/android-project/app/src/main/assets/
```

### iOS离线打包

#### 1. 环境准备
- macOS系统
- Xcode 12+
- iOS离线SDK

#### 2. 集成步骤
```bash
# 下载iOS离线SDK  
# https://nativesupport.dcloud.net.cn/AppDocs/download/ios

# 将uni-app资源集成到iOS项目
# 按照官方文档配置Xcode项目
```

## 📦 方案三：CLI命令行打包

### 1. 安装uni-app CLI
```bash
npm install -g @dcloudio/uvm
npm install -g @dcloudio/cli
```

### 2. 构建项目
```bash
# 构建为App资源
uni build --platform app-plus

# 构建为H5
uni build --platform h5

# 构建为微信小程序
uni build --platform mp-weixin
```

## 🔧 打包优化配置

### 1. 性能优化
```json
{
  "app-plus": {
    "optimization": {
      "subPackages": true
    },
    "runmode": "liberate",
    "compatible": {
      "ignoreVersion": true
    }
  }
}
```

### 2. 网络配置
```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "schemes": ["https"],
        "networkSecurityConfig": {
          "domain-config": [
            {
              "domains": ["www.vdamo.com"],
              "cleartextTrafficPermitted": true
            }
          ]
        }
      }
    }
  }
}
```

### 3. 启动页配置
```json
{
  "app-plus": {
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    }
  }
}
```

## 📋 打包检查清单

### 打包前检查
- [ ] 应用名称和版本号已更新
- [ ] 图标文件完整 (Android: 72x72-192x192, iOS: 20x20-1024x1024)
- [ ] 权限配置正确
- [ ] API地址配置正确 (https://www.vdamo.com)
- [ ] 原生插件配置完整

### Android检查
- [ ] 最小SDK版本: 23 (Android 6.0)
- [ ] 目标SDK版本: 33 (Android 13)
- [ ] ABI架构: armeabi-v7a, arm64-v8a
- [ ] 签名证书配置

### iOS检查  
- [ ] 最小iOS版本: 9.0
- [ ] 开发/发布证书有效
- [ ] 描述文件匹配
- [ ] Bundle ID正确

## 🚀 快速打包脚本

创建自动化打包脚本：

```bash
#!/bin/bash
# build-app.sh

echo "🚀 开始打包DAMO Cashier APP..."

# 检查HBuilderX CLI
if ! command -v cli &> /dev/null; then
    echo "❌ 请先安装HBuilderX CLI"
    exit 1
fi

# 清理旧的构建文件
echo "🧹 清理构建缓存..."
rm -rf unpackage/dist/build/app-plus

# 构建APP资源
echo "📦 构建APP资源..."
cli publish --platform app-plus --project .

# 检查构建结果
if [ -d "unpackage/dist/build/app-plus" ]; then
    echo "✅ APP资源构建成功!"
    echo "📁 构建文件位置: unpackage/dist/build/app-plus"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "🎉 打包完成! 请使用HBuilderX进行云打包或离线打包"
```

## 📱 测试和发布

### 1. 测试流程
```bash
# 安装测试APK
adb install app-debug.apk

# 查看日志
adb logcat | grep "DAMO"

# 测试功能
# - 登录功能
# - 收银操作  
# - 网络连接
# - 摄像头扫码
# - 打印功能
```

### 2. 发布到应用商店

#### Android发布
- Google Play Store
- 华为应用市场
- 小米应用商店
- OPPO软件商店
- vivo应用商店

#### iOS发布
- App Store Connect
- 企业分发
- TestFlight测试

## 🔍 常见问题

### 1. 打包失败
```bash
# 检查manifest.json语法
# 确保所有图标文件存在
# 验证证书有效性
```

### 2. 网络请求失败
```bash
# 检查网络安全配置
# 添加域名白名单
# 配置HTTPS证书
```

### 3. 原生插件问题
```bash
# 确保插件版本兼容
# 检查插件配置
# 验证权限设置
```

## 📞 技术支持

- **uni-app官方文档**: https://uniapp.dcloud.net.cn/
- **打包教程**: https://uniapp.dcloud.net.cn/tutorial/app-base.html
- **原生插件**: https://nativesupport.dcloud.net.cn/

---

按照以上指南，你可以成功将DAMO Cashier打包成Android和iOS应用！推荐使用HBuilderX云打包，最简单快捷。