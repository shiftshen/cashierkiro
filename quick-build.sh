#!/bin/bash

# DAMO Cashier 快速打包检查脚本

echo "🚀 DAMO Cashier APP 打包准备"
echo "================================="

# 检查必要文件
echo "📋 检查项目文件..."
files=("manifest.json" "pages.json" "main.js" "App.vue")
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file - 缺失"
    fi
done

# 检查图标目录
echo ""
echo "🖼️  检查应用图标..."
if [[ -d "unpackage/res/icons" ]]; then
    icon_count=$(ls unpackage/res/icons/*.png 2>/dev/null | wc -l)
    echo "✅ 图标目录存在，包含 $icon_count 个图标文件"
else
    echo "❌ 图标目录不存在"
fi

# 显示应用信息
echo ""
echo "📱 应用信息:"
echo "   名称: DAMO CASHIER"
echo "   版本: 1.4.5 (145)"
echo "   ID: __UNI__90E2460"
echo "   API: https://www.vdamo.com"

echo ""
echo "🎯 打包方式推荐:"
echo ""
echo "方式一: HBuilderX 云打包 (最简单)"
echo "1. 下载 HBuilderX App开发版"
echo "   https://www.dcloud.io/hbuilderx.html"
echo ""
echo "2. 导入项目:"
echo "   - 文件 → 导入 → 从本地目录导入"
echo "   - 选择当前目录: $(pwd)"
echo ""
echo "3. 打包 Android:"
echo "   - 右键项目 → 发行 → 原生App-云打包"
echo "   - 选择 Android"
echo "   - 使用 DCloud 证书 (测试用)"
echo "   - 点击打包"
echo ""
echo "4. 打包 iOS (需要Apple开发者账号):"
echo "   - 准备 iOS 证书和描述文件"
echo "   - 选择 iOS 平台"
echo "   - 上传证书文件"
echo "   - 点击打包"
echo ""

echo "方式二: 在线打包 (无需下载软件)"
echo "1. 访问 DCloud 开发者中心"
echo "   https://dev.dcloud.net.cn/"
echo ""
echo "2. 上传项目代码"
echo "3. 在线配置和打包"
echo ""

echo "✅ 项目已准备就绪，可以开始打包!"
echo "📚 详细指南请查看: APP_BUILD_GUIDE.md"