#!/usr/bin/env node

/**
 * PWA 设置脚本
 * 自动配置PWA相关文件和设置
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DAMO Cashier PWA 设置工具');
console.log('================================');

// 检查必要文件
function checkRequiredFiles() {
  console.log('📋 检查PWA必要文件...');
  
  const requiredFiles = [
    'static/sw.js',
    'static/manifest.json',
    'common/pwa-cache-manager.js',
    'components/pwa/pwa-manager.vue'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    } else {
      console.log('✅', file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('\\n❌ 缺少以下文件:');
    missingFiles.forEach(file => {
      console.log('   -', file);
    });
    return false;
  }
  
  return true;
}

// 更新HTML文件添加PWA相关标签
function updateHTMLFile() {
  console.log('\\n📝 更新HTML文件...');
  
  const indexPath = 'unpackage/dist/build/web/index.html';
  
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️ 未找到构建后的index.html文件');
    console.log('   请先运行构建命令: npm run build:h5');
    return false;
  }
  
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // 检查是否已经添加了PWA标签
  if (htmlContent.includes('manifest.json')) {
    console.log('✅ PWA标签已存在');
    return true;
  }
  
  // 添加PWA相关标签
  const pwaMetaTags = `
  <!-- PWA Manifest -->
  <link rel="manifest" href="/static/manifest.json">
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#4275F4">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="DAMO收银">
  
  <!-- PWA Icons -->
  <link rel="apple-touch-icon" href="/static/icons/icon-192x192.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/static/icons/icon-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/static/icons/icon-512x512.png">
  
  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  </script>`;
  
  // 在</head>标签前插入PWA标签
  htmlContent = htmlContent.replace('</head>', pwaMetaTags + '\\n</head>');
  
  fs.writeFileSync(indexPath, htmlContent);
  console.log('✅ HTML文件已更新');
  
  return true;
}

// 创建PWA图标
function createPWAIcons() {
  console.log('\\n🎨 检查PWA图标...');
  
  const iconDir = 'static/icons';
  
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  
  const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const existingIcons = [];
  const missingIcons = [];
  
  requiredSizes.forEach(size => {
    const iconPath = `${iconDir}/icon-${size}x${size}.png`;
    if (fs.existsSync(iconPath)) {
      existingIcons.push(size);
    } else {
      missingIcons.push(size);
    }
  });
  
  console.log(`✅ 已存在图标: ${existingIcons.length}个`);
  
  if (missingIcons.length > 0) {
    console.log(`⚠️ 缺少图标尺寸: ${missingIcons.join(', ')}`);
    console.log('   建议使用以下工具生成图标:');
    console.log('   - https://realfavicongenerator.net/');
    console.log('   - https://www.pwabuilder.com/imageGenerator');
  }
  
  return missingIcons.length === 0;
}

// 验证Service Worker
function validateServiceWorker() {
  console.log('\\n🔧 验证Service Worker...');
  
  const swPath = 'static/sw.js';
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  const checks = [
    { name: 'install事件', pattern: /addEventListener\('install'/ },
    { name: 'activate事件', pattern: /addEventListener\('activate'/ },
    { name: 'fetch事件', pattern: /addEventListener\('fetch'/ },
    { name: '缓存策略', pattern: /cacheFirst|networkFirst/ },
    { name: '缓存清理', pattern: /caches\.delete/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(swContent)) {
      console.log('✅', check.name);
    } else {
      console.log('❌', check.name);
    }
  });
}

// 生成PWA配置报告
function generatePWAReport() {
  console.log('\\n📊 PWA配置报告');
  console.log('================================');
  
  const report = {
    manifest: fs.existsSync('static/manifest.json'),
    serviceWorker: fs.existsSync('static/sw.js'),
    cacheManager: fs.existsSync('common/pwa-cache-manager.js'),
    pwaComponent: fs.existsSync('components/pwa/pwa-manager.vue'),
    icons: fs.existsSync('static/icons'),
    htmlUpdated: false
  };
  
  // 检查HTML是否已更新
  const indexPath = 'unpackage/dist/build/web/index.html';
  if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    report.htmlUpdated = htmlContent.includes('manifest.json');
  }
  
  console.log('📋 配置状态:');
  Object.entries(report).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const name = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`   ${status} ${name}`);
  });
  
  const completedCount = Object.values(report).filter(Boolean).length;
  const totalCount = Object.keys(report).length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  console.log(`\\n📈 完成度: ${completedCount}/${totalCount} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('🎉 PWA配置完成！');
  } else {
    console.log('⚠️ 还有配置项需要完善');
  }
  
  return report;
}

// 生成使用指南
function generateUsageGuide() {
  console.log('\\n📚 PWA使用指南');
  console.log('================================');
  
  console.log('🚀 启用PWA功能:');
  console.log('1. 构建生产版本: npm run build:h5');
  console.log('2. 运行此脚本: node scripts/setup-pwa.js');
  console.log('3. 部署到HTTPS服务器');
  console.log('4. 在支持的浏览器中访问应用');
  
  console.log('\\n📱 PWA功能特性:');
  console.log('- 🔄 离线缓存: 静态资源和API数据缓存');
  console.log('- 📲 应用安装: 添加到主屏幕');
  console.log('- 🔔 更新提醒: 自动检测新版本');
  console.log('- 📵 离线模式: 网络断开时继续工作');
  
  console.log('\\n🛠️ 开发调试:');
  console.log('- Chrome DevTools > Application > Service Workers');
  console.log('- Chrome DevTools > Application > Storage');
  console.log('- Lighthouse PWA审计');
  
  console.log('\\n⚠️ 注意事项:');
  console.log('- PWA需要HTTPS环境（localhost除外）');
  console.log('- Service Worker更新需要刷新页面');
  console.log('- 缓存策略需要根据业务需求调整');
}

// 主函数
function main() {
  const hasRequiredFiles = checkRequiredFiles();
  
  if (!hasRequiredFiles) {
    console.log('\\n❌ 缺少必要文件，请先创建相关文件');
    return;
  }
  
  updateHTMLFile();
  createPWAIcons();
  validateServiceWorker();
  
  const report = generatePWAReport();
  generateUsageGuide();
  
  console.log('\\n🎉 PWA设置完成！');
  
  if (report.htmlUpdated) {
    console.log('\\n✅ 可以开始测试PWA功能');
    console.log('   在Chrome中打开应用，检查是否出现安装提示');
  } else {
    console.log('\\n⚠️ 请先构建应用，然后重新运行此脚本');
  }
}

main();