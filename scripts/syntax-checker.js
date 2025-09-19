#!/usr/bin/env node
/**
 * Vue文件语法检查器
 * 检查常见的JavaScript语法错误
 */

const fs = require('fs');
const path = require('path');

class SyntaxChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }
    
    /**
     * 检查Vue文件
     */
    checkVueFile(filePath) {
        console.log(`🔍 检查文件: ${filePath}`);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // 检查script部分
            const scriptStart = lines.findIndex(line => line.includes('<script>'));
            const scriptEnd = lines.findIndex(line => line.includes('</script>'));
            
            if (scriptStart !== -1 && scriptEnd !== -1) {
                this.checkScriptSection(lines.slice(scriptStart + 1, scriptEnd), filePath, scriptStart + 1);
            }
            
        } catch (error) {
            this.errors.push({
                file: filePath,
                error: `文件读取失败: ${error.message}`
            });
        }
    }
    
    /**
     * 检查script部分
     */
    checkScriptSection(lines, filePath, startLine) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = startLine + i;
            
            // 检查常见语法错误
            this.checkDuplicateAsync(line, filePath, lineNumber);
            this.checkExportDefault(line, filePath, lineNumber);
            this.checkMethodsStructure(line, filePath, lineNumber);
            this.checkBrackets(line, filePath, lineNumber);
            this.checkCommas(line, filePath, lineNumber, lines, i);
        }
    }
    
    /**
     * 检查重复的async关键字
     */
    checkDuplicateAsync(line, filePath, lineNumber) {
        if (/async\s+async/.test(line)) {
            this.errors.push({
                file: filePath,
                line: lineNumber,
                error: '重复的async关键字',
                content: line.trim()
            });
        }
    }
    
    /**
     * 检查export default语法
     */
    checkExportDefault(line, filePath, lineNumber) {
        if (/export\s+default\s*\(\s*\{/.test(line)) {
            this.errors.push({
                file: filePath,
                line: lineNumber,
                error: 'export default语法错误，不应该有额外的括号',
                content: line.trim(),
                suggestion: 'export default {'
            });
        }
    }
    
    /**
     * 检查methods结构
     */
    checkMethodsStructure(line, filePath, lineNumber) {
        // 检查methods中的方法定义
        if (/^\s*async\s*$/.test(line)) {
            this.errors.push({
                file: filePath,
                line: lineNumber,
                error: '孤立的async关键字',
                content: line.trim()
            });
        }
    }
    
    /**
     * 检查括号匹配
     */
    checkBrackets(line, filePath, lineNumber) {
        const openBrackets = (line.match(/\{/g) || []).length;
        const closeBrackets = (line.match(/\}/g) || []).length;
        
        // 简单的括号检查（不是完整的语法分析）
        if (line.includes('export default') && openBrackets === 0 && closeBrackets === 0) {
            if (!line.includes('{') && !line.includes('(')) {
                this.warnings.push({
                    file: filePath,
                    line: lineNumber,
                    warning: 'export default后可能缺少对象定义',
                    content: line.trim()
                });
            }
        }
    }
    
    /**
     * 检查逗号
     */
    checkCommas(line, filePath, lineNumber, lines, index) {
        // 检查对象属性后是否缺少逗号
        if (/^\s*\}\s*$/.test(line) && index > 0) {
            const prevLine = lines[index - 1];
            if (prevLine && /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/.test(prevLine)) {
                // 这是一个方法定义，检查前面是否有逗号
                let checkIndex = index - 2;
                while (checkIndex >= 0 && /^\s*$/.test(lines[checkIndex])) {
                    checkIndex--;
                }
                
                if (checkIndex >= 0) {
                    const beforeMethod = lines[checkIndex];
                    if (beforeMethod && !beforeMethod.trim().endsWith(',') && !beforeMethod.trim().endsWith('{')) {
                        this.warnings.push({
                            file: filePath,
                            line: startLine + checkIndex,
                            warning: '方法定义前可能缺少逗号',
                            content: beforeMethod.trim()
                        });
                    }
                }
            }
        }
    }
    
    /**
     * 检查目录中的所有Vue文件
     */
    checkDirectory(dirPath) {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.checkDirectory(fullPath);
            } else if (file.endsWith('.vue')) {
                this.checkVueFile(fullPath);
            }
        }
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        console.log('\n📊 语法检查报告');
        console.log('='.repeat(50));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ 未发现语法问题');
            return;
        }
        
        if (this.errors.length > 0) {
            console.log(`\n❌ 发现 ${this.errors.length} 个错误:`);
            this.errors.forEach((error, index) => {
                console.log(`\n${index + 1}. ${error.file}:${error.line || '?'}`);
                console.log(`   错误: ${error.error}`);
                if (error.content) {
                    console.log(`   内容: ${error.content}`);
                }
                if (error.suggestion) {
                    console.log(`   建议: ${error.suggestion}`);
                }
            });
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️ 发现 ${this.warnings.length} 个警告:`);
            this.warnings.forEach((warning, index) => {
                console.log(`\n${index + 1}. ${warning.file}:${warning.line || '?'}`);
                console.log(`   警告: ${warning.warning}`);
                if (warning.content) {
                    console.log(`   内容: ${warning.content}`);
                }
            });
        }
        
        // 保存报告
        const report = {
            timestamp: new Date().toISOString(),
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length
            }
        };
        
        fs.writeFileSync('syntax-check-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 详细报告已保存: syntax-check-report.json');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const checker = new SyntaxChecker();
    
    // 检查主要目录
    const dirsToCheck = [
        'pages',
        'components'
    ];
    
    console.log('🚀 开始Vue文件语法检查...\n');
    
    for (const dir of dirsToCheck) {
        if (fs.existsSync(dir)) {
            console.log(`📁 检查目录: ${dir}`);
            checker.checkDirectory(dir);
        }
    }
    
    checker.generateReport();
}

module.exports = SyntaxChecker;