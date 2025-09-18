#!/usr/bin/env node

/**
 * 修复 /deep/ 深度选择器语法
 * 将 /deep/ 替换为 ::v-deep 以兼容 dart-sass
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复深度选择器语法工具');
console.log('================================');

// 需要处理的文件扩展名
const fileExtensions = ['.vue', '.scss', '.sass', '.css'];

// 统计信息
let processedFiles = 0;
let replacedCount = 0;
const errorFiles = [];

// 递归扫描目录
function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ 目录不存在: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git 等目录
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'unpackage') {
        scanDirectory(filePath);
      }
    } else if (fileExtensions.some(ext => file.endsWith(ext))) {
      processFile(filePath);
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否包含 /deep/ 语法
    if (content.includes('/deep/')) {
      console.log(`📝 处理文件: ${filePath}`);
      
      let newContent = content;
      let fileReplacedCount = 0;
      
      // 替换各种 /deep/ 语法模式
      const patterns = [
        // 标准的 /deep/ 语法
        {
          pattern: /\/deep\/\s*([.#][\w-]+)/g,
          replacement: '::v-deep($1)',
          description: '标准深度选择器'
        },
        // 带空格的 /deep/ 语法
        {
          pattern: /\s+\/deep\/\s+([.#][\w-]+)/g,
          replacement: ' ::v-deep($1)',
          description: '带空格的深度选择器'
        },
        // 行首的 /deep/ 语法
        {
          pattern: /^(\s*)\/deep\/\s*([.#][\w-]+)/gm,
          replacement: '$1::v-deep($2)',
          description: '行首深度选择器'
        },
        // 复杂的 /deep/ 语法（包含多个类名）
        {
          pattern: /\/deep\/\s*([.#][\w-]+(?:\s*[.#][\w-]+)*)/g,
          replacement: '::v-deep($1)',
          description: '复杂深度选择器'
        }
      ];
      
      patterns.forEach(({ pattern, replacement, description }) => {
        const matches = newContent.match(pattern);
        if (matches) {
          console.log(`  🔄 ${description}: ${matches.length} 处替换`);
          newContent = newContent.replace(pattern, replacement);
          fileReplacedCount += matches.length;
        }
      });
      
      // 如果有替换，写入文件
      if (fileReplacedCount > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✅ 完成替换: ${fileReplacedCount} 处`);
        replacedCount += fileReplacedCount;
        processedFiles++;
      }
    }
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error.message);
    errorFiles.push({ file: filePath, error: error.message });
  }
}

// 验证修复结果
function validateFixes() {
  console.log('\n🔍 验证修复结果...');
  
  let remainingIssues = 0;
  
  function checkDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        checkDirectory(filePath);
      } else if (fileExtensions.some(ext => file.endsWith(ext))) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('/deep/')) {
            console.log(`⚠️ 仍有 /deep/ 语法: ${filePath}`);
            remainingIssues++;
          }
        } catch (error) {
          // 忽略读取错误
        }
      }
    });
  }
  
  checkDirectory('.');
  
  if (remainingIssues === 0) {
    console.log('✅ 所有 /deep/ 语法已修复');
  } else {
    console.log(`⚠️ 仍有 ${remainingIssues} 个文件包含 /deep/ 语法`);
  }
}

// 创建备份
function createBackup() {
  const backupDir = 'backup_before_deep_fix';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  console.log(`📦 创建备份到: ${backupDir}`);
  
  // 这里可以添加备份逻辑，但为了简化，我们跳过
  console.log('💡 建议在运行前手动创建 git commit 作为备份');
}

// 主函数
function main() {
  console.log('开始修复深度选择器语法...\n');
  
  // 扫描主要目录
  const dirsToScan = [
    'components',
    'pages', 
    'static/css',
    'common'
  ];
  
  dirsToScan.forEach(dir => {
    console.log(`📂 扫描目录: ${dir}`);
    scanDirectory(dir);
  });
  
  // 输出统计信息
  console.log('\n📊 修复统计:');
  console.log('================================');
  console.log(`处理文件数: ${processedFiles}`);
  console.log(`替换次数: ${replacedCount}`);
  console.log(`错误文件数: ${errorFiles.length}`);
  
  if (errorFiles.length > 0) {
    console.log('\n❌ 错误文件列表:');
    errorFiles.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }
  
  // 验证修复结果
  validateFixes();
  
  console.log('\n🎉 深度选择器语法修复完成!');
  console.log('\n💡 建议:');
  console.log('1. 运行编译测试确认修复效果');
  console.log('2. 检查样式是否正常显示');
  console.log('3. 如有问题可以回滚 git commit');
}

main();