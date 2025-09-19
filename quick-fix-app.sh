#!/bin/bash

echo "🔧 APP空白页面快速修复..."

# 1. 备份原始文件
cp common/request.js common/request.backup.js
echo "✅ 已备份 request.js"

# 2. 使用APP安全版本
cp common/request-app-safe.js common/request.js
echo "✅ 已应用APP安全版本"

# 3. 清理编译缓存
rm -rf unpackage/
echo "✅ 已清理编译缓存"

# 4. 重新编译
echo "🔄 开始重新编译..."
npm run build:app-plus

echo "🎉 快速修复完成！"
echo "📱 请重新打包APP进行测试"
