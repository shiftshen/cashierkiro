#!/usr/bin/env node

/**
 * 应用修复测试脚本
 * 验证登录后页面空白问题的修复效果
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 应用修复验证测试');
console.log('================================');

// 检查关键文件修复状态
const checks = [
  {
    name: '异步组件加载器修复',
    file: 'common/async-component-loader.js',
    check: (content) => {
      return content.includes('() => ({') && content.includes('component: importFunc()');
    }
  },
  {
    name: '主页面组件导入修复',
    file: 'pages/home/index.vue',
    check: (content) => {
      return content.includes('() => import(\'./components/billing.vue\')') && 
             !content.includes('createAsyncComponent(');
    }
  },
  {
    name: '用户角色默认值修复',
    file: 'pages/home/index.vue',
    check: (content) => {
      return content.includes('roleData.length === 0') && 
             content.includes('return [\'diandan\', \'zhuotai\'];');
    }
  },
  {
    name: 'PWA管理器暂时禁用',
    file: 'pages/home/index.vue',
    check: (content) => {
      return content.includes('// import PWAManager') && 
             content.includes('<!-- <pwa-manager /> -->');
    }
  },
  {
    name: 'Store用户数据初始化',
    file: 'store/index.js',
    check: (content) => {
      return content.includes('uni.getStorageSync(\'user_info\') || {}');
    }
  }
];

let passedChecks = 0;
let totalChecks = checks.length;

console.log('📋 执行修复验证检查...\n');

checks.forEach((check, index) => {
  try {
    if (fs.existsSync(check.file)) {
      const content = fs.readFileSync(check.file, 'utf8');
      const passed = check.check(content);
      
      if (passed) {
        console.log(`✅ ${index + 1}. ${check.name}`);
        passedChecks++;
      } else {
        console.log(`❌ ${index + 1}. ${check.name}`);
        console.log(`   文件: ${check.file}`);
      }
    } else {
      console.log(`⚠️ ${index + 1}. ${check.name} - 文件不存在: ${check.file}`);
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${check.name} - 检查失败: ${error.message}`);
  }
});

console.log('\n📊 检查结果:');
console.log('================================');
console.log(`通过检查: ${passedChecks}/${totalChecks}`);
console.log(`成功率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 所有修复检查通过！');
  console.log('\n📋 下一步操作:');
  console.log('1. 重新编译应用');
  console.log('2. 测试登录功能');
  console.log('3. 验证页面内容是否正常显示');
  console.log('4. 检查浏览器控制台是否有错误信息');
  console.log('5. 使用 debug-user-info.html 检查用户数据');
} else {
  console.log('\n⚠️ 部分检查未通过，请检查相关文件');
}

// 生成测试报告
const report = {
  timestamp: new Date().toISOString(),
  totalChecks,
  passedChecks,
  successRate: (passedChecks / totalChecks) * 100,
  checks: checks.map((check, index) => ({
    name: check.name,
    file: check.file,
    passed: fs.existsSync(check.file) ? check.check(fs.readFileSync(check.file, 'utf8')) : false
  }))
};

fs.writeFileSync('app-fix-test-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 测试报告已生成: app-fix-test-report.json');

// 检查编译相关问题
console.log('\n🔧 编译问题检查:');
console.log('================================');

// 检查深度选择器修复
const deepSelectorFiles = [
  'components/goods/goodsNum.vue',
  'components/language/language.vue',
  'pages/home/index.vue'
];

let deepSelectorFixed = 0;
deepSelectorFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('::v-deep(') && !content.includes('/deep/')) {
      console.log(`✅ ${file} - 深度选择器已修复`);
      deepSelectorFixed++;
    } else if (content.includes('/deep/')) {
      console.log(`❌ ${file} - 仍包含旧的 /deep/ 语法`);
    } else {
      console.log(`ℹ️ ${file} - 无深度选择器`);
      deepSelectorFixed++;
    }
  }
});

console.log(`\n深度选择器修复: ${deepSelectorFixed}/${deepSelectorFiles.length} 个文件`);

// 检查 manifest.json 配置
if (fs.existsSync('manifest.json')) {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (manifest.sassImplementationName === 'dart-sass') {
    console.log('✅ manifest.json - SASS 编译器配置正确');
  } else {
    console.log('❌ manifest.json - SASS 编译器配置需要更新为 dart-sass');
  }
  
  if (manifest.h5 && manifest.h5.router && manifest.h5.router.mode === 'hash') {
    console.log('✅ manifest.json - H5 路由模式配置正确');
  } else {
    console.log('⚠️ manifest.json - 建议使用 hash 路由模式');
  }
}

console.log('\n🚀 修复验证完成！');
console.log('\n💡 故障排除建议:');
console.log('1. 如果页面仍然空白，请检查浏览器控制台的 JavaScript 错误');
console.log('2. 确认用户登录后 localStorage 中有正确的用户信息');
console.log('3. 检查网络请求是否正常，特别是获取用户角色的接口');
console.log('4. 使用 debug-user-info.html 页面检查用户数据完整性');
console.log('5. 如果组件仍然不显示，检查 v-if 条件中的角色权限逻辑');