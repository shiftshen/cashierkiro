/**
 * 请求安全增强器
 * 在不修改现有request.js的情况下提供安全保护
 */

class RequestSafety {
  constructor() {
    this.activeRequests = new Map()
    this.requestStats = {
      total: 0,
      concurrent: 0,
      maxConcurrent: 0,
      errors: 0
    }
    this.maxConcurrentRequests = 8 // 最大并发请求数
    this.requestTimeout = 15000 // 15秒超时
    
    this.startMonitoring()
  }

  /**
   * 安全的请求包装器
   * @param {Function} originalRequest - 原始请求函数
   * @param {Object} options - 请求选项
   */
  async safeRequest(originalRequest, options) {
    const requestId = this.generateRequestId()
    
    try {
      // 检查并发限制
      if (this.requestStats.concurrent >= this.maxConcurrentRequests) {
        console.warn('🚦 请求并发数达到限制，等待中...')
        await this.waitForSlot()
      }
      
      // 记录请求开始
      this.recordRequestStart(requestId, options)
      
      // 设置超时保护
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('请求超时'))
        }, this.requestTimeout)
      })
      
      // 执行原始请求
      const requestPromise = originalRequest(options)
      
      // 竞速执行
      const result = await Promise.race([requestPromise, timeoutPromise])
      
      // 记录请求成功
      this.recordRequestEnd(requestId, true)
      
      return result
      
    } catch (error) {
      // 记录请求失败
      this.recordRequestEnd(requestId, false)
      
      // 如果是超时错误，记录特殊日志
      if (error.message === '请求超时') {
        console.error('⏰ 请求超时:', options.url)
      }
      
      throw error
    }
  }

  /**
   * 等待请求槽位
   */
  async waitForSlot() {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.requestStats.concurrent < this.maxConcurrentRequests) {
          resolve()
        } else {
          setTimeout(checkSlot, 100) // 100ms后重试
        }
      }
      checkSlot()
    })
  }

  /**
   * 记录请求开始
   */
  recordRequestStart(requestId, options) {
    this.activeRequests.set(requestId, {
      url: options.url,
      startTime: Date.now(),
      method: options.method || 'GET'
    })
    
    this.requestStats.total++
    this.requestStats.concurrent++
    
    if (this.requestStats.concurrent > this.requestStats.maxConcurrent) {
      this.requestStats.maxConcurrent = this.requestStats.concurrent
    }
  }

  /**
   * 记录请求结束
   */
  recordRequestEnd(requestId, success) {
    const request = this.activeRequests.get(requestId)
    if (request) {
      const duration = Date.now() - request.startTime
      console.log(`📡 请求完成: ${request.url} (${duration}ms) ${success ? '✅' : '❌'}`)
      
      this.activeRequests.delete(requestId)
      this.requestStats.concurrent--
      
      if (!success) {
        this.requestStats.errors++
      }
    }
  }

  /**
   * 生成请求ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  /**
   * 开始监控
   */
  startMonitoring() {
    setInterval(() => {
      this.checkRequestHealth()
    }, 10000) // 每10秒检查一次
  }

  /**
   * 检查请求健康状态
   */
  checkRequestHealth() {
    const stats = this.getStats()
    
    // 检查是否有长时间运行的请求
    const now = Date.now()
    const longRunningRequests = []
    
    this.activeRequests.forEach((request, id) => {
      const duration = now - request.startTime
      if (duration > 10000) { // 超过10秒
        longRunningRequests.push({ id, duration, ...request })
      }
    })
    
    if (longRunningRequests.length > 0) {
      console.warn(`⚠️ 发现长时间运行的请求: ${longRunningRequests.length} 个`)
    }
    
    // 检查错误率
    if (stats.total > 10 && stats.errorRate > 20) {
      console.error(`🚨 请求错误率过高: ${stats.errorRate.toFixed(1)}%`)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.requestStats,
      errorRate: this.requestStats.total > 0 ? (this.requestStats.errors / this.requestStats.total) * 100 : 0,
      activeRequestsCount: this.activeRequests.size
    }
  }

  /**
   * 强制清理所有活跃请求
   */
  forceCleanup() {
    console.warn(`🧹 强制清理 ${this.activeRequests.size} 个活跃请求`)
    this.activeRequests.clear()
    this.requestStats.concurrent = 0
  }
}

// 创建全局实例
const requestSafety = new RequestSafety()

export default requestSafety