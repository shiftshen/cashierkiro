#!/usr/bin/env node

/**
 * 代码质量检查脚本
 * 检查常见的代码问题和潜在bug
 */

const fs = require('fs');
const path = require('path');

class CodeQualityChecker {
  constructor() {
    this.issues = [];
    this.checkedFiles = 0;
    this.excludeDirs = ['node_modules', '.git', 'unpackage', '.codebuddy'];
  }

  // 检查文件内容的常见问题
  checkFileContent(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 检查console.log（生产环境应该移除）
      if (line.includes('console.log') && !line.includes('//') && !line.includes('/*')) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: 'warning',
          message: '发现console.log，生产环境应该移除'
        });
      }

      // 检查TODO/FIXME注释
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: 'info',
          message: '发现待办事项注释'
        });
      }

      // 检查硬编码的测试数据
      if (line.includes('test001') || line.includes('123456') || line.includes('localhost')) {
        issues.push({
          file: filePath,
          line: lineNum,
          type: 'error',
          message: '发现硬编码的测试数据或本地地址'
        });
      }

      // 检查空的catch块
      if (line.trim() === 'catch (e) {}' || line.trim() === 'catch(e){}') {
        issues.push({
          file: filePath,
          line: lineNum,
          type: 'warning',
          message: '空的异常处理块'
        });
      }

      // 检查未使用的变量（简单检查）
      const varMatch = line.match(/(?:let|const|var)\s+(\w+)\s*=/);
      if (varMatch && !content.includes(varMatch[1] + '.') && !content.includes(varMatch[1] + '[')) {
        // 简单检查，可能有误报
      }
    });

    return issues;
  }

  // 检查Vue文件特定问题
  checkVueFile(filePath, content) {
    const issues = [];

    // 检查v-for缺少key
    if (content.includes('v-for') && !content.includes(':key')) {
      issues.push({
        file: filePath,
        line: 0,
        type: 'warning',
        message: 'v-for可能缺少:key属性'
      });
    }

    // 检查未使用的组件
    const componentMatches = content.match(/import\s+(\w+)\s+from/g);
    if (componentMatches) {
      componentMatches.forEach(match => {
        const componentName = match.match(/import\s+(\w+)\s+from/)[1];
        if (!content.includes(`<${componentName}`) && !content.includes(`'${componentName}'`)) {
          issues.push({
            file: filePath,
            line: 0,
            type: 'warning',
            message: `可能未使用的组件导入: ${componentName}`
          });
        }
      });
    }

    return issues;
  }

  // 检查JavaScript文件
  checkJSFile(filePath, content) {
    const issues = [];

    // 检查未处理的Promise
    if (content.includes('.then(') && !content.includes('.catch(')) {
      issues.push({
        file: filePath,
        line: 0,
        type: 'warning',
        message: 'Promise缺少错误处理'
      });
    }

    // 检查全局变量使用
    if (content.includes('window.') && filePath.includes('common/')) {
      issues.push({
        file: filePath,
        line: 0,
        type: 'warning',
        message: '在通用模块中使用window对象，可能影响APP兼容性'
      });
    }

    return issues;
  }

  // 递归检查目录
  checkDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (!this.excludeDirs.includes(item)) {
          this.checkDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        this.checkFile(itemPath);
      }
    });
  }

  // 检查单个文件
  checkFile(filePath) {
    const ext = path.extname(filePath);
    if (!['.js', '.vue', '.json'].includes(ext)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.checkedFiles++;

      let issues = this.checkFileContent(filePath, content);

      if (ext === '.vue') {
        issues = issues.concat(this.checkVueFile(filePath, content));
      } else if (ext === '.js') {
        issues = issues.concat(this.checkJSFile(filePath, content));
      }

      this.issues = this.issues.concat(issues);
    } catch (error) {
      console.error(`检查文件失败: ${filePath}`, error.message);
    }
  }

  // 生成报告
  generateReport() {
    console.log('\n🔍 代码质量检查报告');
    console.log('='.repeat(50));
    console.log(`检查文件数: ${this.checkedFiles}`);
    console.log(`发现问题数: ${this.issues.length}`);

    if (this.issues.length === 0) {
      console.log('\n✅ 未发现代码质量问题！');
      return;
    }

    // 按类型分组
    const grouped = this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});

    Object.keys(grouped).forEach(type => {
      const typeIcon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`\n${typeIcon} ${type.toUpperCase()} (${grouped[type].length}个):`);
      
      grouped[type].forEach(issue => {
        const location = issue.line > 0 ? `:${issue.line}` : '';
        console.log(`  ${issue.file}${location}`);
        console.log(`    ${issue.message}`);
      });
    });

    // 统计信息
    console.log('\n📊 统计信息:');
    console.log(`  错误: ${grouped.error?.length || 0}`);
    console.log(`  警告: ${grouped.warning?.length || 0}`);
    console.log(`  信息: ${grouped.info?.length || 0}`);
  }

  // 运行检查
  run() {
    console.log('🚀 开始代码质量检查...');
    this.checkDirectory('.');
    this.generateReport();
    
    // 返回错误数量，用于CI/CD
    const errorCount = this.issues.filter(issue => issue.type === 'error').length;
    return errorCount;
  }
}

// 运行检查
if (require.main === module) {
  const checker = new CodeQualityChecker();
  const errorCount = checker.run();
  process.exit(errorCount > 0 ? 1 : 0);
}

module.exports = CodeQualityChecker;