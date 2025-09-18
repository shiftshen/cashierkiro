#!/usr/bin/env node

/**
 * 数据库锁死问题分析工具
 * 排查可能导致数据库锁死的代码模式
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 数据库锁死问题分析工具');
console.log('================================');

// 可能导致数据库锁死的模式
const DEADLOCK_PATTERNS = [
  {
    name: '并发请求同一资源',
    pattern: /setInterval.*request|setTimeout.*request/g,
    description: '定时器中的并发请求可能导致资源竞争',
    severity: 'high'
  },
  {
    name: '未处理的Promise',
    pattern: /request\([^)]*\)(?!\s*\.then|\s*\.catch|\s*await)/g,
    description: '未正确处理的异步请求可能导致连接泄漏',
    severity: 'medium'
  },
  {
    name: '循环中的数据库操作',
    pattern: /(for|while).*{[^}]*request[^}]*}/gs,
    description: '循环中的数据库操作可能导致连接池耗尽',
    severity: 'high'
  },
  {
    name: '嵌套事务',
    pattern: /request.*{[^}]*request[^}]*}/gs,
    description: '嵌套的数据库请求可能导致死锁',
    severity: 'high'
  },
  {
    name: '长时间运行的请求',
    pattern: /timeout\s*:\s*[0-9]{5,}/g,
    description: '超长超时时间可能导致连接长时间占用',
    severity: 'medium'
  },
  {
    name: '频繁轮询',
    pattern: /setInterval.*[0-9]{1,3}\s*\)/g,
    description: '高频轮询可能导致服务器压力过大',
    severity: 'medium'
  },
  {
    name: '同步存储操作',
    pattern: /setStorageSync|getStorageSync/g,
    description: '同步存储操作可能阻塞主线程',
    severity: 'low'
  },
  {
    name: '未限制的并发',
    pattern: /Promise\.all.*request/g,
    description: '无限制的并发请求可能压垮服务器',
    severity: 'high'
  }
];

// 分析文件中的潜在问题
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    DEADLOCK_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          const lineNumber = getLineNumber(content, match);
          issues.push({
            file: filePath,
            line: lineNumber,
            pattern: pattern.name,
            code: match.trim(),
            description: pattern.description,
            severity: pattern.severity
          });
        });
      }
    });
    
    return issues;
  } catch (error) {
    console.error(`分析文件失败: ${filePath}`, error);
    return [];
  }
}

// 获取匹配内容的行号
function getLineNumber(content, match) {
  const beforeMatch = content.substring(0, content.indexOf(match));
  return beforeMatch.split('\\n').length;
}

// 扫描目录
function scanDirectory(dir, extensions = ['.js', '.vue']) {
  const issues = [];
  
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules和.git目录
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'unpackage') {
          scan(filePath);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const fileIssues = analyzeFile(filePath);
        issues.push(...fileIssues);
      }
    });
  }
  
  scan(dir);
  return issues;
}

// 分析轮询模式
function analyzePollingPatterns() {
  console.log('\\n🔄 分析轮询模式...');
  
  const pollingFiles = [
    'pages/home/components/desk.vue',
    'pages/home/components/billing.vue',
    'pages/table/index.vue'
  ];
  
  const pollingIssues = [];
  
  pollingFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 查找setInterval模式
      const intervalMatches = content.match(/setInterval\([^)]*,\s*([0-9]+)\s*\)/g);
      if (intervalMatches) {
        intervalMatches.forEach(match => {
          const interval = parseInt(match.match(/([0-9]+)\s*\)$/)[1]);
          const lineNumber = getLineNumber(content, match);
          
          pollingIssues.push({
            file,
            line: lineNumber,
            interval,
            code: match,
            risk: interval < 5000 ? 'high' : interval < 10000 ? 'medium' : 'low'
          });
        });
      }
    }
  });
  
  return pollingIssues;
}

// 分析请求并发模式
function analyzeConcurrencyPatterns() {
  console.log('\\n⚡ 分析并发模式...');
  
  const concurrencyIssues = [];
  const files = ['common/request.js', 'common/socket.js'];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 查找可能的并发问题
      const patterns = [
        {
          name: '无限制并发',
          regex: /Promise\.all\([^)]*\)/g,
          risk: 'high'
        },
        {
          name: '请求重试机制',
          regex: /retry|重试/gi,
          risk: 'medium'
        },
        {
          name: '请求队列',
          regex: /queue|队列/gi,
          risk: 'low'
        }
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
          matches.forEach(match => {
            const lineNumber = getLineNumber(content, match);
            concurrencyIssues.push({
              file,
              line: lineNumber,
              pattern: pattern.name,
              code: match,
              risk: pattern.risk
            });
          });
        }
      });
    }
  });
  
  return concurrencyIssues;
}

// 生成修复建议
function generateFixSuggestions(issues, pollingIssues, concurrencyIssues) {
  console.log('\\n🔧 修复建议:');
  console.log('================================');
  
  // 高危问题
  const highRiskIssues = issues.filter(issue => issue.severity === 'high');
  if (highRiskIssues.length > 0) {
    console.log('🚨 高危问题 (需要立即修复):');
    highRiskIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.pattern}`);
      console.log(`     ${issue.description}`);
      console.log(`     代码: ${issue.code.substring(0, 80)}...`);
    });
  }
  
  // 轮询优化建议
  if (pollingIssues.length > 0) {
    console.log('\\n🔄 轮询优化建议:');
    pollingIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - 间隔 ${issue.interval}ms (${issue.risk} 风险)`);
      
      if (issue.interval < 3000) {
        console.log('     建议: 增加轮询间隔到至少3秒');
      }
      if (issue.interval < 10000) {
        console.log('     建议: 使用智能轮询，根据页面活跃状态调整频率');
      }
    });
  }
  
  // 并发优化建议
  if (concurrencyIssues.length > 0) {
    console.log('\\n⚡ 并发优化建议:');
    concurrencyIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.pattern} (${issue.risk} 风险)`);
    });
  }
  
  // 通用修复建议
  console.log('\\n💡 通用修复建议:');
  console.log('1. 请求限流:');
  console.log('   - 实现请求队列，限制并发数量');
  console.log('   - 使用防抖和节流技术');
  
  console.log('\\n2. 连接池管理:');
  console.log('   - 设置合理的连接超时时间');
  console.log('   - 实现连接复用机制');
  
  console.log('\\n3. 错误处理:');
  console.log('   - 添加请求重试机制');
  console.log('   - 实现熔断器模式');
  
  console.log('\\n4. 监控和日志:');
  console.log('   - 添加请求性能监控');
  console.log('   - 记录数据库连接状态');
}

// 创建请求限流器示例
function createRequestLimiterExample() {
  console.log('\\n🚦 创建请求限流器示例...');
  
  const limiterCode = `/**
 * 请求限流器
 * 防止并发请求过多导致数据库锁死
 */

class RequestLimiter {
  constructor(maxConcurrent = 5, queueLimit = 100) {
    this.maxConcurrent = maxConcurrent
    this.queueLimit = queueLimit
    this.activeRequests = 0
    this.requestQueue = []
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      queued: 0
    }
  }

  async request(requestFn, priority = 1) {
    return new Promise((resolve, reject) => {
      const requestItem = {
        requestFn,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      }

      // 检查队列是否已满
      if (this.requestQueue.length >= this.queueLimit) {
        reject(new Error('请求队列已满'))
        return
      }

      // 如果当前并发数未达到限制，直接执行
      if (this.activeRequests < this.maxConcurrent) {
        this.executeRequest(requestItem)
      } else {
        // 否则加入队列
        this.requestQueue.push(requestItem)
        this.requestQueue.sort((a, b) => b.priority - a.priority)
        this.stats.queued++
      }
    })
  }

  async executeRequest(requestItem) {
    this.activeRequests++
    this.stats.total++

    try {
      const result = await requestItem.requestFn()
      this.stats.success++
      requestItem.resolve(result)
    } catch (error) {
      this.stats.failed++
      requestItem.reject(error)
    } finally {
      this.activeRequests--
      this.processQueue()
    }
  }

  processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const nextRequest = this.requestQueue.shift()
      this.executeRequest(nextRequest)
    }
  }

  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length
    }
  }
}

// 全局请求限流器实例
const requestLimiter = new RequestLimiter(3, 50) // 最多3个并发，队列限制50

export default requestLimiter`;

  fs.writeFileSync('common/request-limiter.js', limiterCode);
  console.log('✅ 已创建请求限流器: common/request-limiter.js');
}

// 创建数据库连接监控器
function createConnectionMonitor() {
  console.log('\\n📊 创建连接监控器示例...');
  
  const monitorCode = `/**
 * 数据库连接监控器
 * 监控请求状态，预防连接泄漏
 */

class ConnectionMonitor {
  constructor() {
    this.activeConnections = new Map()
    this.connectionStats = {
      total: 0,
      active: 0,
      completed: 0,
      failed: 0,
      timeout: 0
    }
    this.maxConnectionTime = 30000 // 30秒超时
    
    this.startMonitoring()
  }

  // 开始监控连接
  startConnection(connectionId, url, method = 'GET') {
    const connection = {
      id: connectionId,
      url,
      method,
      startTime: Date.now(),
      status: 'active'
    }

    this.activeConnections.set(connectionId, connection)
    this.connectionStats.total++
    this.connectionStats.active++

    console.log(\`🔗 连接开始: \${connectionId} -> \${url}\`)

    // 设置超时检查
    setTimeout(() => {
      if (this.activeConnections.has(connectionId)) {
        this.handleTimeout(connectionId)
      }
    }, this.maxConnectionTime)

    return connection
  }

  // 结束连接
  endConnection(connectionId, success = true) {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return

    const duration = Date.now() - connection.startTime
    connection.endTime = Date.now()
    connection.duration = duration
    connection.status = success ? 'completed' : 'failed'

    this.activeConnections.delete(connectionId)
    this.connectionStats.active--

    if (success) {
      this.connectionStats.completed++
    } else {
      this.connectionStats.failed++
    }

    console.log(\`✅ 连接结束: \${connectionId} (耗时: \${duration}ms)\`)
  }

  // 处理超时
  handleTimeout(connectionId) {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return

    console.warn(\`⏰ 连接超时: \${connectionId} -> \${connection.url}\`)
    
    this.activeConnections.delete(connectionId)
    this.connectionStats.active--
    this.connectionStats.timeout++

    // 触发告警
    this.triggerAlert('connection_timeout', connection)
  }

  // 触发告警
  triggerAlert(type, data) {
    console.error(\`🚨 数据库连接告警: \${type}\`, data)
    
    // 这里可以添加更多告警逻辑
    // 比如发送通知、记录日志等
  }

  // 开始监控
  startMonitoring() {
    // 每10秒检查一次连接状态
    setInterval(() => {
      this.checkConnectionHealth()
    }, 10000)
  }

  // 检查连接健康状态
  checkConnectionHealth() {
    const now = Date.now()
    const longRunningConnections = []

    this.activeConnections.forEach((connection, id) => {
      const duration = now - connection.startTime
      if (duration > 15000) { // 超过15秒的连接
        longRunningConnections.push({ id, duration, ...connection })
      }
    })

    if (longRunningConnections.length > 0) {
      console.warn(\`⚠️ 发现长时间运行的连接: \${longRunningConnections.length} 个\`)
      longRunningConnections.forEach(conn => {
        console.warn(\`   \${conn.id}: \${conn.duration}ms - \${conn.url}\`)
      })
    }

    // 检查活跃连接数
    if (this.connectionStats.active > 10) {
      this.triggerAlert('too_many_connections', {
        active: this.connectionStats.active,
        total: this.connectionStats.total
      })
    }
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.connectionStats,
      activeConnections: Array.from(this.activeConnections.values())
    }
  }

  // 强制关闭所有连接
  forceCloseAll() {
    console.warn(\`🚨 强制关闭所有活跃连接: \${this.activeConnections.size} 个\`)
    
    this.activeConnections.forEach((connection, id) => {
      this.endConnection(id, false)
    })
  }
}

// 全局连接监控器
const connectionMonitor = new ConnectionMonitor()

export default connectionMonitor`;

  fs.writeFileSync('common/connection-monitor.js', monitorCode);
  console.log('✅ 已创建连接监控器: common/connection-monitor.js');
}

// 主函数
function main() {
  console.log('🔍 开始分析数据库锁死风险...');
  
  const issues = scanDirectory('.');
  const pollingIssues = analyzePollingPatterns();
  const concurrencyIssues = analyzeConcurrencyPatterns();
  
  console.log(`\\n📊 分析结果:`);
  console.log(`   发现潜在问题: ${issues.length} 个`);
  console.log(`   轮询模式问题: ${pollingIssues.length} 个`);
  console.log(`   并发模式问题: ${concurrencyIssues.length} 个`);
  
  generateFixSuggestions(issues, pollingIssues, concurrencyIssues);
  createRequestLimiterExample();
  createConnectionMonitor();
  
  console.log('\\n🎉 数据库锁死分析完成!');
  console.log('\\n⚠️ 重点关注:');
  console.log('1. 餐桌状态轮询频率 (建议从3秒改为10秒)');
  console.log('2. 称重功能的并发请求');
  console.log('3. WebSocket连接的重连机制');
  console.log('4. 批量操作的事务处理');
}

main();