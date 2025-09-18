/**
 * 优化的 WebSocket 连接管理器
 * 提供连接池、智能重连、消息队列等高级功能
 */

class WebSocketManager {
  constructor() {
    this.connections = new Map() // 连接池
    this.messageQueue = new Map() // 消息队列
    this.reconnectStrategies = new Map() // 重连策略
    this.connectionStates = new Map() // 连接状态
    this.heartbeatIntervals = new Map() // 心跳间隔
    this.messageHandlers = new Map() // 消息处理器
    this.config = {
      maxConnections: 5,
      heartbeatInterval: 30000, // 30秒
      reconnectDelay: 5000, // 5秒
      maxReconnectAttempts: 10,
      messageQueueSize: 100,
      connectionTimeout: 10000 // 10秒
    }
    
    this.init()
  }

  init() {
    this.setupNetworkMonitoring()
    this.setupVisibilityMonitoring()
    console.log('🔌 WebSocket 管理器初始化完成')
  }

  // 设置网络监控
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('📶 网络已连接，恢复 WebSocket 连接')
      this.resumeAllConnections()
    })

    window.addEventListener('offline', () => {
      console.log('📵 网络已断开，暂停 WebSocket 连接')
      this.pauseAllConnections()
    })
  }

  // 设置页面可见性监控
  setupVisibilityMonitoring() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 应用进入后台，调整连接策略')
        this.adjustForBackground()
      } else {
        console.log('📱 应用回到前台，恢复连接策略')
        this.adjustForForeground()
      }
    })
  }

  // 创建连接
  async createConnection(connectionId, config) {
    if (this.connections.has(connectionId)) {
      console.warn(`连接 ${connectionId} 已存在`)
      return this.connections.get(connectionId)
    }

    if (this.connections.size >= this.config.maxConnections) {
      throw new Error('连接池已满，无法创建新连接')
    }

    const connectionConfig = {
      url: config.url,
      protocols: config.protocols || [],
      heartbeatInterval: config.heartbeatInterval || this.config.heartbeatInterval,
      reconnectDelay: config.reconnectDelay || this.config.reconnectDelay,
      maxReconnectAttempts: config.maxReconnectAttempts || this.config.maxReconnectAttempts,
      autoReconnect: config.autoReconnect !== false,
      messageQueueSize: config.messageQueueSize || this.config.messageQueueSize,
      ...config
    }

    try {
      const connection = await this.establishConnection(connectionId, connectionConfig)
      this.connections.set(connectionId, connection)
      this.connectionStates.set(connectionId, 'connected')
      this.messageQueue.set(connectionId, [])
      
      console.log(`✅ WebSocket 连接创建成功: ${connectionId}`)
      return connection
    } catch (error) {
      console.error(`❌ WebSocket 连接创建失败: ${connectionId}`, error)
      throw error
    }
  }

  // 建立连接
  async establishConnection(connectionId, config) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('连接超时'))
      }, this.config.connectionTimeout)

      // 构建连接 URL
      const url = this.buildConnectionUrl(config)
      
      const socketTask = uni.connectSocket({
        url,
        protocols: config.protocols,
        success: () => {
          console.log(`🔌 开始建立连接: ${connectionId}`)
        },
        fail: (error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })

      // 连接打开事件
      socketTask.onOpen(() => {
        clearTimeout(timeout)
        console.log(`🎉 连接已建立: ${connectionId}`)
        
        // 设置心跳
        this.setupHeartbeat(connectionId, socketTask, config)
        
        // 处理消息队列
        this.processMessageQueue(connectionId)
        
        resolve({
          id: connectionId,
          socketTask,
          config,
          state: 'connected',
          reconnectAttempts: 0,
          lastActivity: Date.now()
        })
      })

      // 连接关闭事件
      socketTask.onClose((res) => {
        console.log(`🔌 连接已关闭: ${connectionId}`, res)
        this.handleConnectionClose(connectionId, res)
      })

      // 连接错误事件
      socketTask.onError((error) => {
        console.error(`❌ 连接错误: ${connectionId}`, error)
        this.handleConnectionError(connectionId, error)
      })

      // 消息接收事件
      socketTask.onMessage((message) => {
        this.handleMessage(connectionId, message)
      })
    })
  }

  // 构建连接 URL
  buildConnectionUrl(config) {
    let url = config.url
    
    // 添加认证参数
    const token = uni.getStorageSync('token')
    const uniacid = uni.getStorageSync('uniacid')
    const storeId = uni.getStorageSync('storeId')
    
    const params = new URLSearchParams()
    if (token) params.append('Authorization', `Bearer ${token}`)
    if (uniacid) params.append('uniacid', uniacid)
    if (storeId) params.append('storeId', storeId)
    
    // 添加自定义参数
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        params.append(key, value)
      })
    }
    
    const queryString = params.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
    
    return url
  }

  // 设置心跳
  setupHeartbeat(connectionId, socketTask, config) {
    const heartbeatInterval = setInterval(() => {
      if (this.connectionStates.get(connectionId) === 'connected') {
        this.sendHeartbeat(connectionId, socketTask)
      }
    }, config.heartbeatInterval)
    
    this.heartbeatIntervals.set(connectionId, heartbeatInterval)
  }

  // 发送心跳
  sendHeartbeat(connectionId, socketTask) {
    const heartbeatMessage = {
      type: 'heartbeat',
      timestamp: Date.now(),
      connectionId
    }
    
    socketTask.send({
      data: JSON.stringify(heartbeatMessage),
      success: () => {
        // 更新最后活动时间
        const connection = this.connections.get(connectionId)
        if (connection) {
          connection.lastActivity = Date.now()
        }
      },
      fail: (error) => {
        console.error(`💓 心跳发送失败: ${connectionId}`, error)
        this.handleConnectionError(connectionId, error)
      }
    })
  }

  // 处理连接关闭
  handleConnectionClose(connectionId, closeEvent) {
    this.connectionStates.set(connectionId, 'closed')
    this.clearHeartbeat(connectionId)
    
    const connection = this.connections.get(connectionId)
    if (connection && connection.config.autoReconnect) {
      this.scheduleReconnect(connectionId)
    }
    
    // 触发关闭事件
    this.emitEvent(connectionId, 'close', closeEvent)
  }

  // 处理连接错误
  handleConnectionError(connectionId, error) {
    this.connectionStates.set(connectionId, 'error')
    
    const connection = this.connections.get(connectionId)
    if (connection && connection.config.autoReconnect) {
      this.scheduleReconnect(connectionId)
    }
    
    // 触发错误事件
    this.emitEvent(connectionId, 'error', error)
  }

  // 安排重连
  scheduleReconnect(connectionId) {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    if (connection.reconnectAttempts >= connection.config.maxReconnectAttempts) {
      console.error(`❌ 连接 ${connectionId} 重连次数已达上限`)
      this.emitEvent(connectionId, 'maxReconnectAttemptsReached')
      return
    }
    
    connection.reconnectAttempts++
    const delay = this.calculateReconnectDelay(connection.reconnectAttempts, connection.config.reconnectDelay)
    
    console.log(`🔄 ${delay}ms 后重连 ${connectionId} (第 ${connection.reconnectAttempts} 次)`)
    
    setTimeout(() => {
      this.reconnect(connectionId)
    }, delay)
  }

  // 计算重连延迟（指数退避）
  calculateReconnectDelay(attempts, baseDelay) {
    return Math.min(baseDelay * Math.pow(2, attempts - 1), 30000) // 最大30秒
  }

  // 重连
  async reconnect(connectionId) {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    try {
      console.log(`🔄 开始重连: ${connectionId}`)
      
      // 清理旧连接
      this.clearHeartbeat(connectionId)
      
      // 建立新连接
      const newConnection = await this.establishConnection(connectionId, connection.config)
      
      // 更新连接信息
      newConnection.reconnectAttempts = connection.reconnectAttempts
      this.connections.set(connectionId, newConnection)
      this.connectionStates.set(connectionId, 'connected')
      
      console.log(`✅ 重连成功: ${connectionId}`)
      this.emitEvent(connectionId, 'reconnected')
      
    } catch (error) {
      console.error(`❌ 重连失败: ${connectionId}`, error)
      this.scheduleReconnect(connectionId)
    }
  }

  // 发送消息
  sendMessage(connectionId, message, options = {}) {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error(`连接 ${connectionId} 不存在`)
    }
    
    const state = this.connectionStates.get(connectionId)
    if (state !== 'connected') {
      if (options.queueIfDisconnected !== false) {
        this.queueMessage(connectionId, message, options)
        return Promise.resolve()
      } else {
        throw new Error(`连接 ${connectionId} 未连接，当前状态: ${state}`)
      }
    }
    
    return new Promise((resolve, reject) => {
      const messageData = typeof message === 'string' ? message : JSON.stringify(message)
      
      connection.socketTask.send({
        data: messageData,
        success: (res) => {
          connection.lastActivity = Date.now()
          resolve(res)
        },
        fail: (error) => {
          if (options.queueIfFailed !== false) {
            this.queueMessage(connectionId, message, options)
            resolve() // 不抛出错误，因为消息已排队
          } else {
            reject(error)
          }
        }
      })
    })
  }

  // 消息排队
  queueMessage(connectionId, message, options) {
    const queue = this.messageQueue.get(connectionId) || []
    
    if (queue.length >= this.config.messageQueueSize) {
      // 队列已满，移除最旧的消息
      queue.shift()
    }
    
    queue.push({
      message,
      options,
      timestamp: Date.now()
    })
    
    this.messageQueue.set(connectionId, queue)
    console.log(`📤 消息已排队: ${connectionId}, 队列长度: ${queue.length}`)
  }

  // 处理消息队列
  processMessageQueue(connectionId) {
    const queue = this.messageQueue.get(connectionId) || []
    if (queue.length === 0) return
    
    console.log(`📤 处理消息队列: ${connectionId}, ${queue.length} 条消息`)
    
    const processNext = () => {
      if (queue.length === 0) return
      
      const { message, options } = queue.shift()
      this.sendMessage(connectionId, message, { ...options, queueIfDisconnected: false })
        .then(() => {
          // 延迟处理下一条消息，避免过快发送
          setTimeout(processNext, 100)
        })
        .catch((error) => {
          console.error('处理队列消息失败:', error)
          setTimeout(processNext, 100)
        })
    }
    
    processNext()
  }

  // 处理接收到的消息
  handleMessage(connectionId, messageEvent) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.lastActivity = Date.now()
    }
    
    try {
      let messageData = messageEvent.data
      
      // 跳过心跳响应
      if (messageData === 'success' || messageData === 'heartbeat') {
        return
      }
      
      // 尝试解析 JSON
      if (typeof messageData === 'string') {
        try {
          messageData = JSON.parse(messageData)
        } catch (e) {
          // 保持原始字符串
        }
      }
      
      // 过滤登录消息
      if (messageData && messageData.msgType === 'login') {
        return
      }
      
      // 触发消息事件
      this.emitEvent(connectionId, 'message', messageData)
      
    } catch (error) {
      console.error(`处理消息失败: ${connectionId}`, error)
    }
  }

  // 注册消息处理器
  onMessage(connectionId, handler) {
    if (!this.messageHandlers.has(connectionId)) {
      this.messageHandlers.set(connectionId, new Set())
    }
    
    this.messageHandlers.get(connectionId).add(handler)
    
    // 返回取消注册函数
    return () => {
      const handlers = this.messageHandlers.get(connectionId)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  // 触发事件
  emitEvent(connectionId, eventType, data) {
    const handlers = this.messageHandlers.get(connectionId)
    if (!handlers) return
    
    handlers.forEach(handler => {
      try {
        if (typeof handler === 'function') {
          handler({ type: eventType, data, connectionId })
        } else if (handler[eventType]) {
          handler[eventType](data, connectionId)
        }
      } catch (error) {
        console.error('事件处理器执行失败:', error)
      }
    })
  }

  // 关闭连接
  closeConnection(connectionId) {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    console.log(`🔌 关闭连接: ${connectionId}`)
    
    // 清理资源
    this.clearHeartbeat(connectionId)
    this.connectionStates.set(connectionId, 'closed')
    
    // 关闭 WebSocket
    connection.socketTask.close({
      code: 1000,
      reason: 'Normal closure'
    })
    
    // 从连接池移除
    this.connections.delete(connectionId)
    this.messageQueue.delete(connectionId)
    this.messageHandlers.delete(connectionId)
  }

  // 清理心跳
  clearHeartbeat(connectionId) {
    const heartbeatInterval = this.heartbeatIntervals.get(connectionId)
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      this.heartbeatIntervals.delete(connectionId)
    }
  }

  // 调整后台策略
  adjustForBackground() {
    // 延长心跳间隔
    this.connections.forEach((connection, connectionId) => {
      this.clearHeartbeat(connectionId)
      const config = { ...connection.config, heartbeatInterval: 60000 } // 1分钟
      this.setupHeartbeat(connectionId, connection.socketTask, config)
    })
  }

  // 调整前台策略
  adjustForForeground() {
    // 恢复正常心跳间隔
    this.connections.forEach((connection, connectionId) => {
      this.clearHeartbeat(connectionId)
      this.setupHeartbeat(connectionId, connection.socketTask, connection.config)
    })
  }

  // 暂停所有连接
  pauseAllConnections() {
    this.connections.forEach((connection, connectionId) => {
      this.connectionStates.set(connectionId, 'paused')
      this.clearHeartbeat(connectionId)
    })
  }

  // 恢复所有连接
  resumeAllConnections() {
    this.connections.forEach((connection, connectionId) => {
      if (this.connectionStates.get(connectionId) === 'paused') {
        this.reconnect(connectionId)
      }
    })
  }

  // 获取连接状态
  getConnectionState(connectionId) {
    return this.connectionStates.get(connectionId) || 'not_found'
  }

  // 获取所有连接状态
  getAllConnectionStates() {
    const states = {}
    this.connectionStates.forEach((state, connectionId) => {
      states[connectionId] = state
    })
    return states
  }

  // 获取连接统计
  getConnectionStats(connectionId) {
    const connection = this.connections.get(connectionId)
    if (!connection) return null
    
    const queue = this.messageQueue.get(connectionId) || []
    
    return {
      id: connectionId,
      state: this.connectionStates.get(connectionId),
      reconnectAttempts: connection.reconnectAttempts,
      lastActivity: connection.lastActivity,
      queueLength: queue.length,
      config: connection.config
    }
  }

  // 获取所有连接统计
  getAllConnectionStats() {
    const stats = {}
    this.connections.forEach((connection, connectionId) => {
      stats[connectionId] = this.getConnectionStats(connectionId)
    })
    return stats
  }

  // 清理所有连接
  cleanup() {
    console.log('🧹 清理所有 WebSocket 连接')
    
    this.connections.forEach((connection, connectionId) => {
      this.closeConnection(connectionId)
    })
    
    this.connections.clear()
    this.messageQueue.clear()
    this.connectionStates.clear()
    this.heartbeatIntervals.clear()
    this.messageHandlers.clear()
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }
}

// 创建全局实例
const webSocketManager = new WebSocketManager()

export default webSocketManager