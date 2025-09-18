/**
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

export default requestLimiter