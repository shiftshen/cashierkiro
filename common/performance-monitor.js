/**
 * 性能监控系统
 * 监控应用性能指标，收集性能数据，生成性能报告
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // 页面性能指标
      pageLoad: {
        loadTime: 0,
        domReady: 0,
        firstPaint: 0,
        firstContentfulPaint: 0
      },
      
      // API性能指标
      api: {
        requests: [],
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: []
      },
      
      // 内存使用指标
      memory: {
        used: 0,
        total: 0,
        limit: 0,
        history: []
      },
      
      // 用户交互指标
      interaction: {
        inputLatency: [],
        scrollPerformance: [],
        touchResponseTime: []
      },
      
      // 自定义业务指标
      business: {
        tableLoadTime: [],
        weightCalculationTime: [],
        orderProcessTime: []
      }
    }
    
    this.observers = new Map()
    this.isMonitoring = false
    this.reportInterval = 60000 // 1分钟报告一次
    this.maxHistorySize = 100
    
    this.init()
  }

  async init() {
    this.setupPerformanceObservers()
    this.startMemoryMonitoring()
    this.startInteractionMonitoring()
    this.startPeriodicReporting()
    
    console.log('📊 性能监控系统已启动')
    this.isMonitoring = true
  }

  // 设置性能观察器
  setupPerformanceObservers() {
    // 页面加载性能
    if (typeof performance !== 'undefined' && performance.timing) {
      this.measurePageLoadPerformance()
    }

    // 长任务监控
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLongTask(entry)
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (error) {
        console.warn('长任务监控不支持:', error)
      }

      // 导航性能监控
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationTiming(entry)
          }
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navigationObserver)
      } catch (error) {
        console.warn('导航性能监控不支持:', error)
      }

      // 资源加载监控
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceTiming(entry)
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (error) {
        console.warn('资源性能监控不支持:', error)
      }
    }
  }

  // 测量页面加载性能
  measurePageLoadPerformance() {
    const timing = performance.timing
    
    this.metrics.pageLoad = {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint()
    }
  }

  // 获取首次绘制时间
  getFirstPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint')
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
      return firstPaint ? firstPaint.startTime : 0
    } catch (error) {
      return 0
    }
  }

  // 获取首次内容绘制时间
  getFirstContentfulPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      return fcp ? fcp.startTime : 0
    } catch (error) {
      return 0
    }
  }

  // 记录长任务
  recordLongTask(entry) {
    console.warn('🐌 检测到长任务:', {
      duration: entry.duration,
      startTime: entry.startTime,
      name: entry.name
    })
    
    // 触发长任务告警
    if (entry.duration > 100) { // 超过100ms
      this.triggerAlert('long_task', {
        duration: entry.duration,
        startTime: entry.startTime
      })
    }
  }

  // 记录导航时间
  recordNavigationTiming(entry) {
    this.metrics.pageLoad = {
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      responseTime: entry.responseEnd - entry.responseStart,
      dnsTime: entry.domainLookupEnd - entry.domainLookupStart
    }
  }

  // 记录资源加载时间
  recordResourceTiming(entry) {
    if (entry.duration > 1000) { // 超过1秒的资源
      console.warn('🐌 慢资源加载:', {
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize
      })
    }
  }

  // 监控API请求性能
  monitorAPIRequest(url, method, startTime) {
    const requestId = this.generateRequestId()
    const request = {
      id: requestId,
      url,
      method,
      startTime,
      endTime: null,
      duration: null,
      success: null,
      error: null
    }
    
    this.metrics.api.requests.push(request)
    
    // 限制历史记录大小
    if (this.metrics.api.requests.length > this.maxHistorySize) {
      this.metrics.api.requests.shift()
    }
    
    return requestId
  }

  // 完成API请求监控
  completeAPIRequest(requestId, success, error = null) {
    const request = this.metrics.api.requests.find(r => r.id === requestId)
    if (!request) return

    request.endTime = Date.now()
    request.duration = request.endTime - request.startTime
    request.success = success
    request.error = error

    // 更新统计数据
    this.updateAPIStats()

    // 检查慢请求
    if (request.duration > 5000) { // 超过5秒
      this.metrics.api.slowRequests.push(request)
      this.triggerAlert('slow_api', request)
    }

    console.log(`📡 API请求完成: ${request.url} (${request.duration}ms)`)
  }

  // 更新API统计数据
  updateAPIStats() {
    const recentRequests = this.metrics.api.requests.slice(-50) // 最近50个请求
    
    if (recentRequests.length === 0) return

    // 计算平均响应时间
    const totalTime = recentRequests.reduce((sum, req) => sum + (req.duration || 0), 0)
    this.metrics.api.averageResponseTime = totalTime / recentRequests.length

    // 计算错误率
    const errorCount = recentRequests.filter(req => !req.success).length
    this.metrics.api.errorRate = (errorCount / recentRequests.length) * 100
  }

  // 开始内存监控
  startMemoryMonitoring() {
    setInterval(() => {
      this.measureMemoryUsage()
    }, 10000) // 每10秒监控一次
  }

  // 测量内存使用
  measureMemoryUsage() {
    if (performance.memory) {
      const memInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      }

      this.metrics.memory = {
        ...memInfo,
        history: [...this.metrics.memory.history, memInfo].slice(-20) // 保留最近20条记录
      }

      // 检查内存泄漏
      this.checkMemoryLeak()
    }
  }

  // 检查内存泄漏
  checkMemoryLeak() {
    const history = this.metrics.memory.history
    if (history.length < 5) return

    // 检查内存是否持续增长
    const recent = history.slice(-5)
    const isIncreasing = recent.every((curr, index) => {
      if (index === 0) return true
      return curr.used > recent[index - 1].used
    })

    if (isIncreasing) {
      const growth = recent[recent.length - 1].used - recent[0].used
      if (growth > 10 * 1024 * 1024) { // 增长超过10MB
        this.triggerAlert('memory_leak', {
          growth: growth,
          current: recent[recent.length - 1].used
        })
      }
    }
  }

  // 开始交互监控
  startInteractionMonitoring() {
    // 监控输入延迟
    document.addEventListener('input', (event) => {
      this.measureInputLatency(event)
    })

    // 监控滚动性能
    let scrollStartTime = 0
    document.addEventListener('scroll', () => {
      if (scrollStartTime === 0) {
        scrollStartTime = performance.now()
      }
    }, { passive: true })

    document.addEventListener('scrollend', () => {
      if (scrollStartTime > 0) {
        const scrollDuration = performance.now() - scrollStartTime
        this.recordScrollPerformance(scrollDuration)
        scrollStartTime = 0
      }
    })

    // 监控触摸响应
    document.addEventListener('touchstart', (event) => {
      this.measureTouchResponse(event)
    }, { passive: true })
  }

  // 测量输入延迟
  measureInputLatency(event) {
    const latency = performance.now() - event.timeStamp
    this.metrics.interaction.inputLatency.push({
      latency,
      timestamp: Date.now(),
      type: event.type
    })

    // 限制历史记录
    if (this.metrics.interaction.inputLatency.length > 50) {
      this.metrics.interaction.inputLatency.shift()
    }

    // 检查高延迟
    if (latency > 100) {
      console.warn('🐌 输入延迟过高:', latency + 'ms')
    }
  }

  // 记录滚动性能
  recordScrollPerformance(duration) {
    this.metrics.interaction.scrollPerformance.push({
      duration,
      timestamp: Date.now()
    })

    if (this.metrics.interaction.scrollPerformance.length > 20) {
      this.metrics.interaction.scrollPerformance.shift()
    }
  }

  // 测量触摸响应
  measureTouchResponse(event) {
    const responseTime = performance.now() - event.timeStamp
    this.metrics.interaction.touchResponseTime.push({
      responseTime,
      timestamp: Date.now()
    })

    if (this.metrics.interaction.touchResponseTime.length > 30) {
      this.metrics.interaction.touchResponseTime.shift()
    }
  }

  // 监控业务指标
  startBusinessMetric(metricName) {
    const startTime = performance.now()
    return {
      end: () => {
        const duration = performance.now() - startTime
        this.recordBusinessMetric(metricName, duration)
        return duration
      }
    }
  }

  // 记录业务指标
  recordBusinessMetric(metricName, duration) {
    if (!this.metrics.business[metricName]) {
      this.metrics.business[metricName] = []
    }

    this.metrics.business[metricName].push({
      duration,
      timestamp: Date.now()
    })

    // 限制历史记录
    if (this.metrics.business[metricName].length > 50) {
      this.metrics.business[metricName].shift()
    }

    console.log(`📈 业务指标 ${metricName}: ${duration.toFixed(2)}ms`)
  }

  // 触发性能告警
  triggerAlert(type, data) {
    console.warn(`🚨 性能告警: ${type}`, data)
    
    // 可以在这里添加更多告警逻辑
    // 比如发送到监控服务器、显示用户通知等
    
    // 发送到全局事件
    if (typeof uni !== 'undefined') {
      uni.$emit('performance-alert', { type, data, timestamp: Date.now() })
    }
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: Date.now(),
      summary: this.generateSummary(),
      details: {
        pageLoad: this.metrics.pageLoad,
        api: this.getAPIStats(),
        memory: this.getMemoryStats(),
        interaction: this.getInteractionStats(),
        business: this.getBusinessStats()
      },
      recommendations: this.generateRecommendations()
    }

    return report
  }

  // 生成摘要
  generateSummary() {
    return {
      overallScore: this.calculateOverallScore(),
      criticalIssues: this.getCriticalIssues(),
      performanceGrade: this.getPerformanceGrade()
    }
  }

  // 计算总体评分
  calculateOverallScore() {
    let score = 100
    
    // 页面加载时间扣分
    if (this.metrics.pageLoad.loadTime > 3000) score -= 20
    else if (this.metrics.pageLoad.loadTime > 2000) score -= 10
    
    // API响应时间扣分
    if (this.metrics.api.averageResponseTime > 2000) score -= 15
    else if (this.metrics.api.averageResponseTime > 1000) score -= 8
    
    // 错误率扣分
    if (this.metrics.api.errorRate > 5) score -= 20
    else if (this.metrics.api.errorRate > 2) score -= 10
    
    // 内存使用扣分
    const memoryUsage = this.metrics.memory.used / this.metrics.memory.limit
    if (memoryUsage > 0.8) score -= 15
    else if (memoryUsage > 0.6) score -= 8
    
    return Math.max(0, score)
  }

  // 获取关键问题
  getCriticalIssues() {
    const issues = []
    
    if (this.metrics.pageLoad.loadTime > 5000) {
      issues.push('页面加载时间过长')
    }
    
    if (this.metrics.api.errorRate > 10) {
      issues.push('API错误率过高')
    }
    
    if (this.metrics.memory.used / this.metrics.memory.limit > 0.9) {
      issues.push('内存使用率过高')
    }
    
    return issues
  }

  // 获取性能等级
  getPerformanceGrade() {
    const score = this.calculateOverallScore()
    
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  // 获取API统计
  getAPIStats() {
    return {
      totalRequests: this.metrics.api.requests.length,
      averageResponseTime: this.metrics.api.averageResponseTime,
      errorRate: this.metrics.api.errorRate,
      slowRequestsCount: this.metrics.api.slowRequests.length
    }
  }

  // 获取内存统计
  getMemoryStats() {
    return {
      current: this.metrics.memory.used,
      peak: Math.max(...this.metrics.memory.history.map(h => h.used)),
      average: this.metrics.memory.history.reduce((sum, h) => sum + h.used, 0) / this.metrics.memory.history.length,
      usageRate: (this.metrics.memory.used / this.metrics.memory.limit) * 100
    }
  }

  // 获取交互统计
  getInteractionStats() {
    const inputLatencies = this.metrics.interaction.inputLatency.map(i => i.latency)
    const touchResponses = this.metrics.interaction.touchResponseTime.map(t => t.responseTime)
    
    return {
      averageInputLatency: inputLatencies.length > 0 ? inputLatencies.reduce((a, b) => a + b) / inputLatencies.length : 0,
      averageTouchResponse: touchResponses.length > 0 ? touchResponses.reduce((a, b) => a + b) / touchResponses.length : 0,
      scrollEvents: this.metrics.interaction.scrollPerformance.length
    }
  }

  // 获取业务统计
  getBusinessStats() {
    const stats = {}
    
    Object.entries(this.metrics.business).forEach(([key, values]) => {
      if (values.length > 0) {
        const durations = values.map(v => v.duration)
        stats[key] = {
          count: values.length,
          average: durations.reduce((a, b) => a + b) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations)
        }
      }
    })
    
    return stats
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = []
    
    if (this.metrics.pageLoad.loadTime > 3000) {
      recommendations.push('优化页面加载时间：考虑代码分割、资源压缩、CDN加速')
    }
    
    if (this.metrics.api.averageResponseTime > 1000) {
      recommendations.push('优化API响应时间：检查数据库查询、添加缓存、优化算法')
    }
    
    if (this.metrics.api.errorRate > 5) {
      recommendations.push('降低API错误率：改善错误处理、增加重试机制、监控服务健康')
    }
    
    if (this.metrics.memory.used / this.metrics.memory.limit > 0.7) {
      recommendations.push('优化内存使用：检查内存泄漏、优化数据结构、及时清理缓存')
    }
    
    return recommendations
  }

  // 开始定期报告
  startPeriodicReporting() {
    setInterval(() => {
      const report = this.generateReport()
      console.log('📊 性能报告:', report.summary)
      
      // 可以将报告发送到服务器
      this.sendReportToServer(report)
    }, this.reportInterval)
  }

  // 发送报告到服务器
  async sendReportToServer(report) {
    try {
      // 这里可以实现发送到监控服务器的逻辑
      console.log('📤 性能报告已生成，可发送到监控服务器')
    } catch (error) {
      console.error('发送性能报告失败:', error)
    }
  }

  // 生成请求ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 停止监控
  stop() {
    this.isMonitoring = false
    
    // 断开所有观察器
    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers.clear()
    
    console.log('📊 性能监控已停止')
  }

  // 获取实时指标
  getRealTimeMetrics() {
    return {
      isMonitoring: this.isMonitoring,
      currentMemory: this.metrics.memory.used,
      activeRequests: this.metrics.api.requests.filter(r => !r.endTime).length,
      lastReportTime: Date.now()
    }
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor