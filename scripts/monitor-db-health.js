#!/usr/bin/env node

/**
 * 数据库健康监控脚本
 * 定期检查可能导致锁死的问题
 */

const fs = require('fs');

console.log('🏥 数据库健康监控');
console.log('==================');

// 检查高频轮询
function checkPollingFrequency() {
  console.log('🔍 检查轮询频率...');
  
  const files = [
    'pages/home/components/desk.vue',
    'pages/home/components/billing.vue'
  ];
  
  const issues = [];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 查找setInterval
      const intervalMatches = content.match(/setInterval\([^)]*,\s*([0-9]+)\s*\)/g);
      if (intervalMatches) {
        intervalMatches.forEach(match => {
          const interval = parseInt(match.match(/([0-9]+)\s*\)$/)[1]);
          if (interval < 5000) {
            issues.push({
              file,
              interval,
              code: match,
              severity: interval < 3000 ? 'high' : 'medium'
            });
          }
        });
      }
    }
  });
  
  if (issues.length > 0) {
    console.log('⚠️ 发现高频轮询:');
    issues.forEach(issue => {
      console.log(`   ${issue.file}: ${issue.interval}ms (${issue.severity})`);
    });
  } else {
    console.log('✅ 轮询频率正常');
  }
  
  return issues;
}

// 检查并发请求模式
function checkConcurrentPatterns() {
  console.log('\\n🔍 检查并发请求模式...');
  
  const files = [
    'common/request.js',
    'common/weight-manager.js'
  ];
  
  const issues = [];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 查找Promise.all模式
      const promiseAllMatches = content.match(/Promise\.all\([^)]*\)/g);
      if (promiseAllMatches) {
        issues.push({
          file,
          pattern: 'Promise.all',
          count: promiseAllMatches.length,
          risk: 'medium'
        });
      }
      
      // 查找循环中的请求
      const loopRequestMatches = content.match(/(for|while).*{[^}]*request[^}]*}/gs);
      if (loopRequestMatches) {
        issues.push({
          file,
          pattern: '循环中的请求',
          count: loopRequestMatches.length,
          risk: 'high'
        });
      }
    }
  });
  
  if (issues.length > 0) {
    console.log('⚠️ 发现并发风险:');
    issues.forEach(issue => {
      console.log(`   ${issue.file}: ${issue.pattern} (${issue.risk})`);
    });
  } else {
    console.log('✅ 并发模式正常');
  }
  
  return issues;
}

// 生成健康报告
function generateHealthReport(pollingIssues, concurrentIssues) {
  console.log('\\n📊 健康报告');
  console.log('============');
  
  const totalIssues = pollingIssues.length + concurrentIssues.length;
  const highRiskIssues = [...pollingIssues, ...concurrentIssues].filter(issue => 
    issue.severity === 'high' || issue.risk === 'high'
  ).length;
  
  console.log(`总问题数: ${totalIssues}`);
  console.log(`高风险问题: ${highRiskIssues}`);
  
  if (totalIssues === 0) {
    console.log('🎉 数据库健康状况良好!');
  } else if (highRiskIssues === 0) {
    console.log('✅ 数据库健康状况尚可，建议优化');
  } else {
    console.log('🚨 发现高风险问题，建议立即处理');
  }
  
  // 生成建议
  console.log('\\n💡 优化建议:');
  
  if (pollingIssues.some(issue => issue.interval < 5000)) {
    console.log('1. 将高频轮询间隔调整到5秒以上');
  }
  
  if (concurrentIssues.some(issue => issue.risk === 'high')) {
    console.log('2. 为循环中的请求添加并发限制');
  }
  
  console.log('3. 启用请求监控和限流机制');
  console.log('4. 定期检查数据库连接池状态');
}

// 主函数
function main() {
  const pollingIssues = checkPollingFrequency();
  const concurrentIssues = checkConcurrentPatterns();
  
  generateHealthReport(pollingIssues, concurrentIssues);
  
  console.log('\\n🔧 快速修复命令:');
  console.log('node scripts/fix-polling-frequency.js  # 修复轮询频率');
  console.log('node scripts/add-request-limits.js     # 添加请求限制');
}

main();