#!/bin/bash

# DAMO Cashier APP 打包脚本
# 使用方法: ./build-app.sh [android|ios|both]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "🚀 DAMO Cashier APP 打包工具" $BLUE
print_message "=================================" $BLUE

# 检查参数
PLATFORM=${1:-"android"}
if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "both" ]]; then
    print_message "❌ 无效的平台参数。使用: android, ios, 或 both" $RED
    exit 1
fi

# 检查必要文件
print_message "📋 检查项目文件..." $YELLOW

required_files=("manifest.json" "pages.json" "main.js" "App.vue")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_message "❌ 缺少必要文件: $file" $RED
        exit 1
    fi
done

# 检查图标文件
print_message "🖼️  检查应用图标..." $YELLOW
icon_dir="unpackage/res/icons"
if [[ ! -d "$icon_dir" ]]; then
    print_message "❌ 图标目录不存在: $icon_dir" $RED
    exit 1
fi

# 检查Android图标
android_icons=("72x72.png" "96x96.png" "144x144.png" "192x192.png")
for icon in "${android_icons[@]}"; do
    if [[ ! -f "$icon_dir/$icon" ]]; then
        print_message "⚠️  缺少Android图标: $icon" $YELLOW
    fi
done

# 检查iOS图标
ios_icons=("20x20.png" "29x29.png" "40x40.png" "58x58.png" "60x60.png" "76x76.png" "80x80.png" "87x87.png" "120x120.png" "152x152.png" "167x167.png" "180x180.png" "1024x1024.png")
for icon in "${ios_icons[@]}"; do
    if [[ ! -f "$icon_dir/$icon" ]]; then
        print_message "⚠️  缺少iOS图标: $icon" $YELLOW
    fi
done

# 显示当前配置
print_message "📱 当前应用配置:" $BLUE
if command -v jq &> /dev/null; then
    APP_NAME=$(jq -r '.name' manifest.json)
    VERSION_NAME=$(jq -r '.versionName' manifest.json)
    VERSION_CODE=$(jq -r '.versionCode' manifest.json)
    APP_ID=$(jq -r '.appid' manifest.json)
    
    echo "   应用名称: $APP_NAME"
    echo "   版本名称: $VERSION_NAME"
    echo "   版本号: $VERSION_CODE"
    echo "   应用ID: $APP_ID"
else
    print_message "   (安装jq以显示详细配置信息)" $YELLOW
fi

echo ""

# 创建打包信息文件
create_build_info() {
    local platform=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > "build-info-${platform}.txt" << EOF
DAMO Cashier APP 打包信息
========================

平台: $platform
打包时间: $timestamp
版本: 1.4.5 (145)
API地址: https://www.vdamo.com

打包配置:
- 最小Android版本: API 23 (Android 6.0)
- 目标Android版本: API 33 (Android 13)
- 最小iOS版本: iOS 9.0
- 架构支持: armeabi-v7a, arm64-v8a

功能特性:
✅ 收银台操作
✅ 会员管理
✅ 商品管理
✅ 订单处理
✅ 交班功能
✅ 桌台管理
✅ 实时通知
✅ 多语言支持 (中文/英文/泰文)
✅ 扫码支付
✅ 打印功能
✅ 双屏显示

权限说明:
- 相机权限: 扫码功能
- 网络权限: API数据同步
- 存储权限: 本地数据缓存
- 振动权限: 操作反馈
- 闪光灯权限: 扫码辅助

注意事项:
1. 确保设备网络连接正常
2. 首次使用需要登录验证
3. 建议在WiFi环境下使用
4. 定期更新应用版本

技术支持: 
- 项目地址: https://github.com/shiftshen/cashierkiro.git
- 在线演示: https://www.vdamo.com/cashier/#/
EOF
}

# HBuilderX 打包指南
show_hbuilderx_guide() {
    local platform=$1
    
    print_message "📖 HBuilderX 云打包指南 ($platform):" $BLUE
    echo ""
    echo "1. 下载并安装 HBuilderX App开发版"
    echo "   https://www.dcloud.io/hbuilderx.html"
    echo ""
    echo "2. 导入项目:"
    echo "   - 打开 HBuilderX"
    echo "   - 文件 → 导入 → 从本地目录导入"
    echo "   - 选择当前项目目录"
    echo ""
    echo "3. 配置应用信息:"
    echo "   - 打开 manifest.json"
    echo "   - 检查应用名称、版本号、图标等配置"
    echo ""
    
    if [[ "$platform" == "android" || "$platform" == "both" ]]; then
        echo "4. Android 打包:"
        echo "   - 右键项目 → 发行 → 原生App-云打包"
        echo "   - 选择 Android 平台"
        echo "   - 选择证书类型:"
        echo "     * 使用DCloud证书 (测试用)"
        echo "     * 使用自有证书 (正式发布)"
        echo "   - 点击打包，等待完成"
        echo ""
    fi
    
    if [[ "$platform" == "ios" || "$platform" == "both" ]]; then
        echo "4. iOS 打包:"
        echo "   - 需要 Apple 开发者账号"
        echo "   - 准备 iOS 证书 (.p12) 和描述文件 (.mobileprovision)"
        echo "   - 右键项目 → 发行 → 原生App-云打包"
        echo "   - 选择 iOS 平台"
        echo "   - 上传证书和描述文件"
        echo "   - 点击打包，等待完成"
        echo ""
    fi
    
    echo "5. 下载安装包:"
    echo "   - 打包完成后会收到邮件通知"
    echo "   - 或在 HBuilderX 中查看打包状态"
    echo "   - 下载 APK/IPA 文件进行测试"
    echo ""
}

# 离线打包指南
show_offline_guide() {
    local platform=$1
    
    print_message "🔧 离线打包指南 ($platform):" $BLUE
    echo ""
    
    if [[ "$platform" == "android" || "$platform" == "both" ]]; then
        echo "Android 离线打包:"
        echo "1. 安装 Android Studio"
        echo "2. 在 HBuilderX 中生成本地打包资源:"
        echo "   发行 → 原生App-本地打包 → 生成本地打包App资源"
        echo "3. 下载 Android 离线SDK"
        echo "4. 将资源集成到 Android 项目"
        echo "5. 使用 Android Studio 编译APK"
        echo ""
    fi
    
    if [[ "$platform" == "ios" || "$platform" == "both" ]]; then
        echo "iOS 离线打包:"
        echo "1. 需要 macOS 系统和 Xcode"
        echo "2. 下载 iOS 离线SDK"
        echo "3. 在 HBuilderX 中生成本地打包资源"
        echo "4. 将资源集成到 iOS 项目"
        echo "5. 使用 Xcode 编译IPA"
        echo ""
    fi
}

# 创建证书生成脚本
create_certificate_script() {
    cat > "generate-android-certificate.sh" << 'EOF'
#!/bin/bash

# Android 证书生成脚本

echo "🔐 生成 Android 签名证书"
echo "========================="

# 证书信息
KEYSTORE_NAME="damo-cashier.keystore"
KEY_ALIAS="damocashier"
VALIDITY_DAYS=36500  # 100年

echo "请输入证书信息:"
read -p "密钥库密码: " KEYSTORE_PASSWORD
read -p "密钥密码 (回车使用相同密码): " KEY_PASSWORD
KEY_PASSWORD=${KEY_PASSWORD:-$KEYSTORE_PASSWORD}

read -p "姓名: " DNAME_CN
read -p "组织单位: " DNAME_OU  
read -p "组织: " DNAME_O
read -p "城市: " DNAME_L
read -p "省份: " DNAME_ST
read -p "国家代码 (如 CN): " DNAME_C

# 生成证书
keytool -genkey \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -keystore "$KEYSTORE_NAME" \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$DNAME_CN, OU=$DNAME_OU, O=$DNAME_O, L=$DNAME_L, ST=$DNAME_ST, C=$DNAME_C"

if [[ $? -eq 0 ]]; then
    echo "✅ 证书生成成功: $KEYSTORE_NAME"
    echo ""
    echo "证书信息:"
    echo "文件名: $KEYSTORE_NAME"
    echo "别名: $KEY_ALIAS"
    echo "密码: $KEYSTORE_PASSWORD"
    echo ""
    echo "⚠️  请妥善保管证书文件和密码!"
else
    echo "❌ 证书生成失败"
    exit 1
fi
EOF

    chmod +x "generate-android-certificate.sh"
    print_message "📄 已创建证书生成脚本: generate-android-certificate.sh" $GREEN
}

# 主要功能
main() {
    print_message "🎯 准备打包平台: $PLATFORM" $GREEN
    
    # 创建打包信息
    create_build_info $PLATFORM
    print_message "📄 已创建打包信息文件: build-info-${PLATFORM}.txt" $GREEN
    
    # 创建证书生成脚本
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        create_certificate_script
    fi
    
    echo ""
    print_message "✅ 项目检查完成，可以开始打包!" $GREEN
    echo ""
    
    # 显示打包选项
    print_message "请选择打包方式:" $BLUE
    echo "1. HBuilderX 云打包 (推荐)"
    echo "2. 离线打包"
    echo "3. 显示详细指南"
    echo ""
    
    read -p "请输入选项 (1-3): " choice
    
    case $choice in
        1)
            show_hbuilderx_guide $PLATFORM
            ;;
        2)
            show_offline_guide $PLATFORM
            ;;
        3)
            show_hbuilderx_guide $PLATFORM
            show_offline_guide $PLATFORM
            ;;
        *)
            print_message "显示 HBuilderX 云打包指南 (默认):" $YELLOW
            show_hbuilderx_guide $PLATFORM
            ;;
    esac
    
    print_message "🎉 打包准备完成!" $GREEN
    print_message "📚 详细文档请查看: APP_BUILD_GUIDE.md" $BLUE
}

# 运行主程序
main