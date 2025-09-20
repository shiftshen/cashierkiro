#!/usr/bin/env node

/**
 * 自动修复常见代码问题
 */

const fs = require('fs');
const path = require('path');

class CommonIssuesFixer {
  constructor() {
    this.fixedFiles = [];
    this.excludeDirs = ['node_modules', '.git', 'unpackage', '.codebuddy'];
  }

  // 修复Vue文件中的常见问题
  fixVueFile(filePath, content) {
    let fixed = content;
    let hasChanges = false;

    // 修复v-for缺少key的问题
    const vForRegex = /<[^>]*v-for="[^"]*"[^>]*(?!.*:key)/g;
    if (vForRegex.test(fixed)) {
      // 这是一个复杂的修复，需要手动处理
      console.log(`⚠️  ${filePath}: 发现v-for缺少:key，需要手动修复`);
    }

    // 移除多余的空行
    const originalLines = fixed.split('\n').length;
    fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
    if (fixed.split('\n').length !== originalLines) {
      hasChanges = true;
    }

    // 统一缩进（使用2个空格）
    const lines = fixed.split('\n');
    const fixedLines = lines.map(line => {
      if (line.startsWith('\t')) {
        return line.replace(/^\t+/, match => '  '.repeat(match.length));
      }
      return line;
    });
    
    if (fixedLines.join('\n') !== fixed) {
      fixed = fixedLines.join('\n');
      hasChanges = true;
    }

    return { content: fixed, hasChanges };
  }

  // 修复JavaScript文件中的常见问题
  fixJSFile(filePath, content) {
    let fixed = content;
    let hasChanges = false;

    // 移除console.log（保留console.error和console.warn）
    const consoleLogRegex = /console\.log\([^)]*\);?\s*\n?/g;
    if (consoleLogRegex.test(fixed)) {
      fixed = fixed.replace(consoleLogRegex, '');
      hasChanges = true;
    }

    // 添加缺失的分号
    const lines = fixed.split('\n');
    const fixedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.includes('//') &&
          /^(let|const|var|return|throw)\s/.test(trimmed)) {
        return line + ';';
      }
      return line;
    });

    if (fixedLines.join('\n') !== fixed) {
      fixed = fixedLines.join('\n');
      hasChanges = true;
    }

    // 移除多余的空行
    fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');

    return { content: fixed, hasChanges };
  }

  // 修复JSON文件
  fixJSONFile(filePath, content) {
    let hasChanges = false;
    
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      
      if (formatted !== content.trim()) {
        return { content: formatted + '\n', hasChanges: true };
      }
    } catch (error) {
      console.log(`⚠️  ${filePath}: JSON格式错误，跳过修复`);
    }

    return { content, hasChanges };
  }

  // 处理单个文件
  fixFile(filePath) {
    const ext = path.extname(filePath);
    if (!['.js', '.vue', '.json'].includes(ext)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let result;

      if (ext === '.vue') {
        result = this.fixVueFile(filePath, content);
      } else if (ext === '.js') {
        result = this.fixJSFile(filePath, content);
      } else if (ext === '.json') {
        result = this.fixJSONFile(filePath, content);
      }

      if (result && result.hasChanges) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        this.fixedFiles.push(filePath);
        console.log(`✅ 修复: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ 修复失败: ${filePath}`, error.message);
    }
  }

  // 递归处理目录
  fixDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (!this.excludeDirs.includes(item)) {
          this.fixDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        this.fixFile(itemPath);
      }
    });
  }

  // 运行修复
  run() {
    console.log('🔧 开始自动修复常见代码问题...');
    this.fixDirectory('.');
    
    console.log('\n📊 修复完成:');
    console.log(`修复文件数: ${this.fixedFiles.length}`);
    
    if (this.fixedFiles.length > 0) {
      console.log('\n修复的文件:');
      this.fixedFiles.forEach(file => console.log(`  ${file}`));
    }
  }
}

// 运行修复
if (require.main === module) {
  const fixer = new CommonIssuesFixer();
  fixer.run();
}

module.exports = CommonIssuesFixer;