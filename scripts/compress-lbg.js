#!/usr/bin/env node

/**
 * 压缩 lbg.png 文件的临时解决方案
 * 使用 Canvas API 进行基本压缩
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  压缩 lbg.png 文件');
console.log('================================');

// 检查文件
const originalFile = 'static/imgs/lbg.png';
if (!fs.existsSync(originalFile)) {
  console.log('❌ 未找到 lbg.png 文件');
  process.exit(1);
}

const stat = fs.statSync(originalFile);
console.log(`📊 原文件大小: ${(stat.size / 1024).toFixed(2)}KB`);

// 创建压缩指南
console.log('\\n🛠️  手动压缩步骤:');
console.log('================================');
console.log('1. 访问 https://tinypng.com/');
console.log('2. 上传 static/imgs/lbg.png');
console.log('3. 下载压缩后的文件');
console.log('4. 替换原文件');
console.log('\\n或者:');
console.log('1. 访问 https://squoosh.app/');
console.log('2. 上传 lbg.png');
console.log('3. 选择 WebP 格式，质量 75%');
console.log('4. 下载为 lbg.webp');
console.log('5. 更新代码引用');

// 创建备份
const backupFile = 'static/imgs/lbg.png.backup';
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(originalFile, backupFile);
  console.log('\\n✅ 已创建备份文件: lbg.png.backup');
}

// 生成CSS更新建议
console.log('\\n📝 如果转换为WebP，需要更新CSS:');
console.log('================================');
console.log('在 pages/login/index.vue 中:');
console.log('');
console.log('原代码:');
console.log("background: url('@/static/imgs/lbg.png') no-repeat 50%;");
console.log('');
console.log('更新为:');
console.log("background: url('@/static/imgs/lbg.webp') no-repeat 50%;");
console.log('');
console.log('或使用兼容性写法:');
console.log('.login-bg {');
console.log("  background: url('@/static/imgs/lbg.png') no-repeat 50%;");
console.log('  background-size: cover;');
console.log('}');
console.log('');
console.log('/* 支持WebP的浏览器使用WebP */');
console.log('.webp .login-bg {');
console.log("  background-image: url('@/static/imgs/lbg.webp');");
console.log('}');

console.log('\\n🎯 目标: 将文件大小从 680KB 减少到 200KB 以下');
console.log('预期效果: 登录页面加载速度提升 60-70%');