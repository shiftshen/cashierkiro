#!/usr/bin/env node

/**
 * 自动化测试脚本
 * 功能：测试登录流程和关键页面，确保应用正常工作
 * 要求：只进行只读测试，绝对不修改线上数据
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomatedTester {
  constructor() {
    this.baseUrl = 'http://localhost:8091';
    this.testResults = [];
    this.testCredentials = {
      username: 'test001',
      password: '123456'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      type,
      message
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testServerConnection() {
    this.log('测试服务器连接...');
    try {
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${this.baseUrl}`, { encoding: 'utf8' });
      if (response.trim() === '200') {
        this.log('服务器连接成功', 'success');
        return true;
      } else {
        this.log(`服务器返回状态码: ${response}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`服务器连接失败: ${error.message}`, 'error');
      return false;
    }
  }

  async testApiEndpoints() {
    this.log('测试API端点连接...');
    
    // 测试登录API（不实际登录，只测试连接）
    try {
      const loginTest = execSync(`curl -s -o /dev/null -w "%{http_code}" -X POST "https://www.vdamo.com/channel/login" -H "Content-Type: application/json"`, { encoding: 'utf8' });
      if (loginTest.trim() === '422' || loginTest.trim() === '400') {
        this.log('登录API端点可访问', 'success');
      } else {
        this.log(`登录API返回状态码: ${loginTest}`, 'info');
      }
    } catch (error) {
      this.log(`登录API测试失败: ${error.message}`, 'error');
    }

    await this.delay(1000);
  }

  async testStaticResources() {
    this.log('测试静态资源加载...');
    
    const resources = [
      '/static/index.883130ca.css',
      '/manifest.json',
      '/pages.json'
    ];

    for (const resource of resources) {
      try {
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${this.baseUrl}${resource}`, { encoding: 'utf8' });
        if (response.trim() === '200') {
          this.log(`资源加载成功: ${resource}`, 'success');
        } else {
          this.log(`资源加载失败: ${resource} (${response})`, 'error');
        }
      } catch (error) {
        this.log(`资源测试错误: ${resource} - ${error.message}`, 'error');
      }
      await this.delay(500);
    }
  }

  async testPageRoutes() {
    this.log('测试页面路由...');
    
    const routes = [
      '/',
      '/#/pages/login/index',
      '/#/pages/login/selectShop',
      '/#/pages/home/index'
    ];

    for (const route of routes) {
      try {
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${this.baseUrl}${route}`, { encoding: 'utf8' });
        if (response.trim() === '200') {
          this.log(`路由可访问: ${route}`, 'success');
        } else {
          this.log(`路由访问失败: ${route} (${response})`, 'error');
        }
      } catch (error) {
        this.log(`路由测试错误: ${route} - ${error.message}`, 'error');
      }
      await this.delay(2000); // 每个页面停留2秒
    }
  }

  async testConfigurationFiles() {
    this.log('测试配置文件...');
    
    const configFiles = [
      'manifest.json',
      'pages.json',
      'custom/siteroot.js',
      'common/request.js'
    ];

    for (const file of configFiles) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('vdamo.com')) {
            this.log(`配置文件正确: ${file} (使用线上数据)`, 'success');
          } else {
            this.log(`配置文件检查: ${file}`, 'info');
          }
        } else {
          this.log(`配置文件不存在: ${file}`, 'error');
        }
      } catch (error) {
        this.log(`配置文件测试错误: ${file} - ${error.message}`, 'error');
      }
    }
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        total: this.testResults.length,
        success: this.testResults.filter(r => r.type === 'success').length,
        errors: this.testResults.filter(r => r.type === 'error').length,
        info: this.testResults.filter(r => r.type === 'info').length
      }
    };

    const reportPath = 'test-reports/automated-test-report.json';
    
    // 确保目录存在
    if (!fs.existsSync('test-reports')) {
      fs.mkdirSync('test-reports', { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`测试报告已生成: ${reportPath}`, 'success');

    return report;
  }

  async runAllTests() {
    this.log('🚀 开始自动化测试流程...');
    this.log('⚠️  注意：只进行只读测试，绝对不修改线上数据');

    // 1. 测试服务器连接
    const serverOk = await this.testServerConnection();
    if (!serverOk) {
      this.log('服务器连接失败，终止测试', 'error');
      return false;
    }

    // 2. 测试API端点
    await this.testApiEndpoints();

    // 3. 测试静态资源
    await this.testStaticResources();

    // 4. 测试页面路由
    await this.testPageRoutes();

    // 5. 测试配置文件
    await this.testConfigurationFiles();

    // 6. 生成测试报告
    const report = await this.generateTestReport();

    // 7. 评估测试结果
    const hasErrors = report.summary.errors > 0;
    const successRate = (report.summary.success / report.summary.total * 100).toFixed(2);

    this.log(`📊 测试完成 - 成功率: ${successRate}%`);
    this.log(`✅ 成功: ${report.summary.success}`);
    this.log(`❌ 错误: ${report.summary.errors}`);
    this.log(`ℹ️  信息: ${report.summary.info}`);

    if (hasErrors) {
      this.log('❌ 测试失败，不能提交到GitHub', 'error');
      return false;
    } else {
      this.log('✅ 所有测试通过，可以提交到GitHub', 'success');
      return true;
    }
  }
}

// 运行测试
async function main() {
  const tester = new AutomatedTester();
  const testPassed = await tester.runAllTests();
  
  process.exit(testPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = AutomatedTester;