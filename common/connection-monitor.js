/**
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

    console.log(`🔗 连接开始: ${connectionId} -> ${url}`)

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

    console.log(`✅ 连接结束: ${connectionId} (耗时: ${duration}ms)`)
  }

  // 处理超时
  handleTimeout(connectionId) {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return

    console.warn(`⏰ 连接超时: ${connectionId} -> ${connection.url}`)
    
    this.activeConnections.delete(connectionId)
    this.connectionStats.active--
    this.connectionStats.timeout++

    // 触发告警
    this.triggerAlert('connection_timeout', connection)
  }

  // 触发告警
  triggerAlert(type, data) {
    console.error(`🚨 数据库连接告警: ${type}`, data)
    
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
      console.warn(`⚠️ 发现长时间运行的连接: ${longRunningConnections.length} 个`)
      longRunningConnections.forEach(conn => {
        console.warn(`   ${conn.id}: ${conn.duration}ms - ${conn.url}`)
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
    console.warn(`🚨 强制关闭所有活跃连接: ${this.activeConnections.size} 个`)
    
    this.activeConnections.forEach((connection, id) => {
      this.endConnection(id, false)
    })
  }
}

// 全局连接监控器
const connectionMonitor = new ConnectionMonitor()

export default connectionMonitor