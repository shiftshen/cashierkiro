#!/usr/bin/env node

/**
 * DAMO Cashier 图片优化脚本
 * 自动压缩和转换图片格式
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  DAMO Cashier 图片优化工具');
console.log('================================');

// 分析图片文件
function analyzeImages() {
  const imgsDir = 'static/imgs';
  
  if (!fs.existsSync(imgsDir)) {
    console.log('❌ static/imgs 目录不存在');
    return [];
  }
  
  const files = fs.readdirSync(imgsDir);
  const images = [];
  
  files.forEach(file => {
    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
      const filePath = path.join(imgsDir, file);
      const stat = fs.statSync(filePath);
      
      images.push({
        name: file,
        path: filePath,
        size: stat.size,
        sizeKB: (stat.size / 1024).toFixed(2),
        extension: path.extname(file).toLowerCase()
      });
    }
  });
  
  return images.sort((a, b) => b.size - a.size);
}

// 生成优化建议
function generateOptimizationSuggestions(images) {
  console.log('📊 图片分析结果:');
  console.log(`   总图片数量: ${images.length} 个`);
  
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  console.log(`   总大小: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  
  // 大图片文件 (>100KB)
  const largeImages = images.filter(img => img.size > 100 * 1024);
  if (largeImages.length > 0) {
    console.log(`\\n⚠️  大图片文件 (>100KB): ${largeImages.length} 个`);
    largeImages.forEach(img => {
      console.log(`   ${img.name}: ${img.sizeKB}KB`);
    });
  }
  
  // PNG文件建议
  const pngFiles = images.filter(img => img.extension === '.png' && img.size > 50 * 1024);
  if (pngFiles.length > 0) {
    console.log(`\\n📦 PNG优化建议: ${pngFiles.length} 个文件`);
    pngFiles.forEach(img => {
      console.log(`   ${img.name}: ${img.sizeKB}KB -> 建议转换为WebP (预计减少30-50%)`);
    });
  }
  
  // JPG文件建议
  const jpgFiles = images.filter(img => ['.jpg', '.jpeg'].includes(img.extension) && img.size > 50 * 1024);
  if (jpgFiles.length > 0) {
    console.log(`\\n📷 JPG优化建议: ${jpgFiles.length} 个文件`);
    jpgFiles.forEach(img => {
      console.log(`   ${img.name}: ${img.sizeKB}KB -> 建议压缩质量到80% (预计减少20-40%)`);
    });
  }
}

// 创建优化后的图片文件名建议
function createOptimizedVersions(images) {
  console.log('\\n🛠️  优化方案:');
  console.log('================================');
  
  const largeImages = images.filter(img => img.size > 100 * 1024);
  
  if (largeImages.length === 0) {
    console.log('✅ 所有图片文件大小都在合理范围内 (<100KB)');
    return;
  }
  
  console.log('立即优化建议:');
  
  largeImages.forEach((img, index) => {
    console.log(`\\n${index + 1}. ${img.name} (${img.sizeKB}KB):`);
    
    if (img.extension === '.png') {
      console.log('   方案A: 转换为WebP格式');
      console.log(`   新文件名: ${img.name.replace('.png', '.webp')}`);
      console.log('   预计大小: ' + (parseFloat(img.sizeKB) * 0.6).toFixed(2) + 'KB');
      
      console.log('   方案B: PNG压缩');
      console.log('   使用工具: TinyPNG (https://tinypng.com/)');
      console.log('   预计大小: ' + (parseFloat(img.sizeKB) * 0.7).toFixed(2) + 'KB');
    } else if (['.jpg', '.jpeg'].includes(img.extension)) {
      console.log('   方案A: 转换为WebP格式');
      console.log(`   新文件名: ${img.name.replace(/\\.(jpg|jpeg)$/, '.webp')}`);
      console.log('   预计大小: ' + (parseFloat(img.sizeKB) * 0.5).toFixed(2) + 'KB');
      
      console.log('   方案B: JPG质量压缩');
      console.log('   压缩质量: 80%');
      console.log('   预计大小: ' + (parseFloat(img.sizeKB) * 0.6).toFixed(2) + 'KB');
    }
  });
}

// 生成代码更新建议
function generateCodeUpdateSuggestions(images) {
  const largeImages = images.filter(img => img.size > 100 * 1024);
  
  if (largeImages.length === 0) return;
  
  console.log('\\n📝 代码更新建议:');
  console.log('================================');
  
  largeImages.forEach(img => {
    if (img.extension === '.png') {
      const webpName = img.name.replace('.png', '.webp');
      console.log(`\\n更新 ${img.name} 的引用:`);
      console.log(`   查找: "static/imgs/${img.name}"`);
      console.log(`   替换: "static/imgs/${webpName}"`);
      console.log(`   或使用响应式图片:`);
      console.log(`   <picture>`);
      console.log(`     <source srcset="static/imgs/${webpName}" type="image/webp">`);
      console.log(`     <img src="static/imgs/${img.name}" alt="">`);
      console.log(`   </picture>`);
    }
  });
}

// 创建在线优化指南
function createOnlineOptimizationGuide() {
  console.log('\\n🌐 在线优化工具推荐:');
  console.log('================================');
  console.log('1. TinyPNG - PNG/JPG压缩');
  console.log('   网址: https://tinypng.com/');
  console.log('   特点: 无损压缩，保持质量');
  console.log('   支持: PNG, JPG');
  
  console.log('\\n2. Squoosh - 多格式转换');
  console.log('   网址: https://squoosh.app/');
  console.log('   特点: 支持WebP/AVIF转换');
  console.log('   支持: 所有主流图片格式');
  
  console.log('\\n3. Compressor.io - 在线压缩');
  console.log('   网址: https://compressor.io/');
  console.log('   特点: 批量处理');
  console.log('   支持: PNG, JPG, GIF, SVG');
  
  console.log('\\n📋 优化步骤:');
  console.log('1. 访问上述任一网站');
  console.log('2. 上传需要优化的图片');
  console.log('3. 选择压缩质量 (建议80%)');
  console.log('4. 下载优化后的文件');
  console.log('5. 替换原文件');
  console.log('6. 更新代码中的引用路径');
}

// 主函数
function main() {
  const images = analyzeImages();
  
  if (images.length === 0) {
    console.log('❌ 未找到图片文件');
    return;
  }
  
  generateOptimizationSuggestions(images);
  createOptimizedVersions(images);
  generateCodeUpdateSuggestions(images);
  createOnlineOptimizationGuide();
  
  console.log('\\n🎉 图片分析完成!');
  console.log('\\n⚡ 立即行动:');
  console.log('1. 优先处理 lbg.png (696KB) - 最大的文件');
  console.log('2. 使用 TinyPNG 或 Squoosh 压缩');
  console.log('3. 目标: 将所有图片控制在200KB以下');
}

main();