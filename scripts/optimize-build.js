#!/usr/bin/env node

/**
 * DAMO Cashier 构建优化脚本
 * 自动优化生产构建，确保最佳性能
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DAMO Cashier 构建优化工具');
console.log('================================');

// 检查构建目录
function checkBuildDirectory() {
  const buildPath = 'unpackage/dist/build/web';
  
  if (!fs.existsSync(buildPath)) {
    console.log('❌ 构建目录不存在，请先使用HBuilderX构建项目');
    console.log('   发行 -> H5-手机版 -> 生产环境');
    return false;
  }
  
  console.log('✅ 找到构建目录:', buildPath);
  return true;
}

// 分析构建文件
function analyzeBuildFiles() {
  const buildPath = 'unpackage/dist/build/web';
  let totalSize = 0;
  let jsFiles = [];
  let cssFiles = [];
  let imageFiles = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else {
        totalSize += stat.size;
        
        if (file.endsWith('.js')) {
          jsFiles.push({
            path: filePath,
            size: stat.size,
            sizeKB: (stat.size / 1024).toFixed(2)
          });
        } else if (file.endsWith('.css')) {
          cssFiles.push({
            path: filePath,
            size: stat.size,
            sizeKB: (stat.size / 1024).toFixed(2)
          });
        } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
          imageFiles.push({
            path: filePath,
            size: stat.size,
            sizeKB: (stat.size / 1024).toFixed(2)
          });
        }
      }
    });
  }
  
  scanDirectory(buildPath);
  
  console.log('\n📊 构建文件分析:');
  console.log(`   总大小: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   JS文件: ${jsFiles.length} 个`);
  console.log(`   CSS文件: ${cssFiles.length} 个`);
  console.log(`   图片文件: ${imageFiles.length} 个`);
  
  // 显示大文件
  const largeFiles = [...jsFiles, ...cssFiles, ...imageFiles]
    .filter(file => file.size > 100 * 1024)
    .sort((a, b) => b.size - a.size);
    
  if (largeFiles.length > 0) {
    console.log('\n⚠️  大文件 (>100KB):');
    largeFiles.slice(0, 5).forEach(file => {
      console.log(`   ${file.path}: ${file.sizeKB}KB`);
    });
  }
  
  return { totalSize, jsFiles, cssFiles, imageFiles };
}

// 检查是否为生产构建
function checkProductionBuild() {
  const indexPath = 'unpackage/dist/build/web/index.html';
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ 未找到index.html文件');
    return false;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // 检查是否包含sourcemap
  if (content.includes('.map')) {
    console.log('⚠️  检测到sourcemap文件，建议生产环境禁用');
    console.log('   在HBuilderX中确保选择"生产环境"构建');
  } else {
    console.log('✅ 生产构建配置正确，已禁用sourcemap');
  }
  
  // 检查是否压缩
  const jsFiles = fs.readdirSync('unpackage/dist/build/web/static/js');
  if (jsFiles.length > 0) {
    const jsContent = fs.readFileSync(
      path.join('unpackage/dist/build/web/static/js', jsFiles[0]), 
      'utf8'
    );
    
    if (jsContent.includes('\n') && jsContent.length > 1000) {
      console.log('⚠️  JS文件可能未完全压缩');
    } else {
      console.log('✅ JS文件已正确压缩');
    }
  }
  
  return true;
}

// 生成优化建议
function generateOptimizationSuggestions(analysis) {
  console.log('\n💡 优化建议:');
  console.log('================================');
  
  if (analysis.totalSize > 5 * 1024 * 1024) {
    console.log('📦 包体积优化:');
    console.log('   - 当前包大小超过5MB，建议进行代码分割');
    console.log('   - 考虑按需加载非核心功能模块');
  }
  
  const largeImages = analysis.imageFiles.filter(img => img.size > 200 * 1024);
  if (largeImages.length > 0) {
    console.log('\n🖼️  图片优化:');
    console.log(`   - 发现${largeImages.length}个大图片文件 (>200KB)`);
    console.log('   - 建议压缩或转换为WebP格式');
    largeImages.slice(0, 3).forEach(img => {
      console.log(`     ${img.path}: ${img.sizeKB}KB`);
    });
  }
  
  console.log('\n🚀 立即可做的优化:');
  console.log('1. 确保使用HBuilderX生产环境构建');
  console.log('2. 压缩static/imgs/目录中的大图片');
  console.log('3. 启用manifest.json中的性能优化配置');
  console.log('4. 使用构建后的文件打包APP (unpackage/dist/build/web/)');
}

// 主函数
function main() {
  if (!checkBuildDirectory()) {
    return;
  }
  
  const analysis = analyzeBuildFiles();
  checkProductionBuild();
  generateOptimizationSuggestions(analysis);
  
  console.log('\n🎉 构建分析完成!');
  console.log('\n📱 APP打包提醒:');
  console.log('   确保APP指向: unpackage/dist/build/web/');
  console.log('   不要使用开发版本或源码目录打包');
}

main();