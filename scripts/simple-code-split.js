#!/usr/bin/env node

/**
 * 简化的代码分割优化脚本
 */

const fs = require('fs');
const path = require('path');

console.log('📦 代码分割优化工具');
console.log('================================');

// 分析组件大小
function analyzeComponents() {
  const pagesDir = 'pages';
  const components = [];
  
  function scan(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scan(filePath);
      } else if (file.endsWith('.vue')) {
        const content = fs.readFileSync(filePath, 'utf8');
        components.push({
          path: filePath,
          size: content.length,
          sizeKB: (content.length / 1024).toFixed(2)
        });
      }
    });
  }
  
  scan(pagesDir);
  return components.sort((a, b) => b.size - a.size);
}

// 创建异步组件加载器
function createAsyncLoader() {
  const loaderCode = `/**
 * 异步组件加载器
 */
export function createAsyncComponent(importFunc, options = {}) {
  return {
    component: importFunc,
    loading: options.loading || {
      template: '<view class="loading">加载中...</view>'
    },
    error: options.error || {
      template: '<view class="error">加载失败</view>'
    },
    delay: options.delay || 200,
    timeout: options.timeout || 10000
  }
}`;

  fs.writeFileSync('common/async-component-loader.js', loaderCode);
  console.log('✅ 创建异步组件加载器');
}

// 更新pages.json预加载配置
function updatePagesConfig() {
  const pagesJson = JSON.parse(fs.readFileSync('pages.json', 'utf8'));
  
  // 添加预加载规则
  pagesJson.preloadRule = {
    "pages/home/index": {
      "network": "all",
      "packages": ["pages/table"]
    }
  };
  
  // 添加优化配置
  if (!pagesJson.globalStyle) pagesJson.globalStyle = {};
  pagesJson.globalStyle.optimization = {
    subPackages: true
  };
  
  fs.writeFileSync('pages.json', JSON.stringify(pagesJson, null, 2));
  console.log('✅ 更新pages.json预加载配置');
}

// 主函数
function main() {
  const components = analyzeComponents();
  
  console.log('📊 组件分析:');
  console.log('   总组件数:', components.length);
  console.log('   大型组件:', components.filter(c => c.size > 10000).length, '个');
  
  if (components.length > 0) {
    console.log('\\n🔍 最大的5个组件:');
    components.slice(0, 5).forEach(comp => {
      console.log('  ', comp.path, ':', comp.sizeKB + 'KB');
    });
  }
  
  createAsyncLoader();
  updatePagesConfig();
  
  console.log('\\n🎉 代码分割优化完成!');
  console.log('\\n📋 下一步:');
  console.log('1. 在大型组件中使用异步加载');
  console.log('2. 测试页面加载性能');
}

main();