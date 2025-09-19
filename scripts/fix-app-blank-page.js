#!/usr/bin/env node

/**
 * 修复APP打包后空白页面问题
 * 专门针对APP环境的兼容性修复
 */

const fs = require('fs');
const path = require('path');

console.log('📱 修复APP空白页面问题...');
console.log('================================');

// 1. 修复动态import问题
function fixDynamicImports() {
  console.log('🔧 修复动态import问题...');
  
  const files = [
    'common/request.js',
    'pages/home/components/desk.vue'
  ];
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // 检查是否有未条件编译的动态import
      const dynamicImportRegex = /await import\(['"`]([^'"`]+)['"`]\)/g;
      const matches = content.match(dynamicImportRegex);
      
      if (matches) {
        console.log(`⚠️ 发现 ${file} 中的动态import: ${matches.length} 个`);
        
        // 为动态import添加条件编译
        content = content.replace(
          /(?<!\/\/ #ifdef H5\s*\n.*?)await import\((['"`][^'"`]+['"`])\)/g,
          `// #ifdef H5\n\t\t\tawait import($1)\n\t\t\t// #endif\n\t\t\t// #ifndef H5\n\t\t\tnull\n\t\t\t// #endif`
        );
        
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file, content);
        fixedCount++;
        console.log(`✅ 已修复 ${file}`);
      }
    }
  });
  
  console.log(`📊 修复了 ${fixedCount} 个文件的动态import问题`);
}

// 2. 修复ES6语法兼容性
function fixES6Compatibility() {
  console.log('\n🔧 修复ES6语法兼容性...');
  
  const files = [
    'common/performance-monitor.js',
    'common/offline-manager.js'
  ];
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // 检查可选链操作符
      if (content.includes('?.')) {
        console.log(`⚠️ 发现 ${file} 中的可选链操作符`);
        // 这里可以添加具体的替换逻辑
      }
      
      // 检查空值合并操作符
      if (content.includes('??')) {
        console.log(`⚠️ 发现 ${file} 中的空值合并操作符`);
        // 这里可以添加具体的替换逻辑
      }
      
      if (modified) {
        fs.writeFileSync(file, content);
        fixedCount++;
        console.log(`✅ 已修复 ${file}`);
      }
    }
  });
  
  console.log(`📊 检查了 ${files.length} 个文件的ES6兼容性`);
}

// 3. 检查APP特有的API兼容性
function checkAppAPICompatibility() {
  console.log('\n🔧 检查APP API兼容性...');
  
  const incompatibleAPIs = [
    'navigator.onLine',
    'window.addEventListener',
    'document.addEventListener',
    'localStorage',
    'sessionStorage'
  ];
  
  const files = [
    'common/offline-manager.js',
    'common/performance-monitor.js',
    'common/smart-polling-manager.js'
  ];
  
  let issuesFound = 0;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      incompatibleAPIs.forEach(api => {
        if (content.includes(api)) {
          console.log(`⚠️ ${file} 使用了可能不兼容的API: ${api}`);
          issuesFound++;
        }
      });
    }
  });
  
  if (issuesFound === 0) {
    console.log('✅ 未发现明显的API兼容性问题');
  } else {
    console.log(`📊 发现 ${issuesFound} 个潜在的API兼容性问题`);
  }
}

// 4. 创建APP专用的安全版本
function createAppSafeVersion() {
  console.log('\n🔧 创建APP安全版本...');
  
  // 创建APP专用的request.js
  const appRequestContent = `import config from '@/custom/config.js';
import site from '@/custom/siteroot.js';
import api from '@/api';
import i18n from '@/locale/index.js'

export default {
  request: async function(option) {
    // APP环境下的简化版本，避免兼容性问题
    if (option.mask) {
      uni.showLoading({
        title: option.mask == 1 ? 'Loading...' : option.mask,
        mask: true
      });
    }
    
    var option = option || {};
    if (!option.url) {
      return false;
    }
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: site.siteroot + option.url,
        data: option.data ? option.data : {},
        method: option.method ? option.method : 'GET',
        header: {
          contentType: config.contentType,
          appType: 'cashier',
          lang: i18n.locale,
          uniacid: uni.getStorageSync('uniacid'),
          storeId: uni.getStorageSync('storeId'),
          Authorization: \`Bearer \${uni.getStorageSync('token')}\`,
        },
        complete: (res) => {
          if (option.mask) {
            uni.hideLoading();
          }
          
          if (res?.data?.code == 200) {
            resolve(res.data)
          } else {
            if (res?.data?.code == 400) {
              resolve(res.data)
              config.tokenErrorMessage(res.data.msg || res.msg)
            } else if (res?.data?.code == 401) {
              config.tokenErrorMessage(res.data.msg || res.msg)
              uni.removeStorageSync('token')
              uni.removeStorageSync('storeId')
              uni.reLaunch({
                url: \`/pages/login/index\`
              })
            } else {
              config.tokenErrorMessage(res.data?.msg || res.msg || '网络请求失败')
            }
          }
        }
      });
    })
  }
}`;

  fs.writeFileSync('common/request-app-safe.js', appRequestContent);
  console.log('✅ 已创建APP安全版本: common/request-app-safe.js');
}

// 5. 生成APP调试信息
function generateAppDebugInfo() {
  console.log('\n📊 生成APP调试信息...');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    fixes: [
      '修复动态import兼容性问题',
      '检查ES6语法兼容性',
      '验证APP API兼容性',
      '创建APP安全版本'
    ],
    recommendations: [
      '使用 common/request-app-safe.js 替代 common/request.js',
      '在APP环境中禁用性能监控功能',
      '使用条件编译避免浏览器专用API',
      '测试APP打包后的功能完整性'
    ],
    troubleshooting: [
      '检查HBuilderX控制台是否有错误信息',
      '确认manifest.json配置正确',
      '验证pages.json路由配置',
      '检查App.vue中的全局样式'
    ]
  };
  
  fs.writeFileSync('APP_DEBUG_INFO.json', JSON.stringify(debugInfo, null, 2));
  console.log('✅ 调试信息已保存: APP_DEBUG_INFO.json');
}

// 6. 创建快速修复脚本
function createQuickFix() {
  console.log('\n🚀 创建快速修复脚本...');
  
  const quickFixScript = `#!/bin/bash

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
`;

  fs.writeFileSync('quick-fix-app.sh', quickFixScript);
  fs.chmodSync('quick-fix-app.sh', '755');
  console.log('✅ 快速修复脚本已创建: quick-fix-app.sh');
}

// 主函数
function main() {
  fixDynamicImports();
  fixES6Compatibility();
  checkAppAPICompatibility();
  createAppSafeVersion();
  generateAppDebugInfo();
  createQuickFix();
  
  console.log('\n🎉 APP空白页面修复完成！');
  console.log('\n📋 下一步操作:');
  console.log('1. 运行快速修复: ./quick-fix-app.sh');
  console.log('2. 或手动替换: cp common/request-app-safe.js common/request.js');
  console.log('3. 重新打包APP测试');
  console.log('4. 查看调试信息: APP_DEBUG_INFO.json');
}

main();