<template>
  <view class="websocket-monitor">
    <view class="monitor-header">
      <text class="title">WebSocket 连接监控</text>
      <view class="global-status" :class="globalStatusClass">
        {{ globalStatusText }}
      </view>
    </view>

    <!-- 全局统计 -->
    <view class="stats-section">
      <text class="section-title">全局统计</text>
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value">{{ totalConnections }}</text>
          <text class="stat-label">总连接数</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ activeConnections }}</text>
          <text class="stat-label">活跃连接</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ totalQueuedMessages }}</text>
          <text class="stat-label">队列消息</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ averageLatency }}ms</text>
          <text class="stat-label">平均延迟</text>
        </view>
      </view>
    </view>

    <!-- 连接列表 -->
    <view class="connections-section">
      <text class="section-title">连接详情</text>
      <view class="connections-list">
        <view 
          v-for="(connection, connectionId) in connections" 
          :key="connectionId"
          class="connection-item"
          :class="{ 
            connected: connection.state === 'connected',
            error: connection.state === 'error',
            closed: connection.state === 'closed'
          }"
        >
          <view class="connection-header">
            <view class="connection-info">
              <text class="connection-id">{{ connectionId }}</text>
              <view class="connection-status" :class="connection.state">
                {{ getStatusText(connection.state) }}
              </view>
            </view>
            <view class="connection-actions">
              <button 
                v-if="connection.state !== 'connected'" 
                @click="reconnectConnection(connectionId)"
                class="action-btn reconnect"
              >
                重连
              </button>
              <button 
                @click="closeConnection(connectionId)"
                class="action-btn close"
              >
                关闭
              </button>
            </view>
          </view>

          <view class="connection-details">
            <view class="detail-row">
              <text class="detail-label">重连次数:</text>
              <text class="detail-value">{{ connection.reconnectAttempts || 0 }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">队列长度:</text>
              <text class="detail-value">{{ connection.queueLength || 0 }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">最后活动:</text>
              <text class="detail-value">{{ formatLastActivity(connection.lastActivity) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">心跳间隔:</text>
              <text class="detail-value">{{ connection.config?.heartbeatInterval || 0 }}ms</text>
            </view>
          </view>

          <!-- 连接配置 -->
          <view class="connection-config" v-if="showConfig[connectionId]">
            <text class="config-title">连接配置</text>
            <view class="config-content">
              <pre>{{ JSON.stringify(connection.config, null, 2) }}</pre>
            </view>
          </view>

          <view class="connection-footer">
            <button 
              @click="toggleConfig(connectionId)"
              class="toggle-btn"
            >
              {{ showConfig[connectionId] ? '隐藏配置' : '显示配置' }}
            </button>
            <button 
              @click="testConnection(connectionId)"
              class="test-btn"
            >
              测试连接
            </button>
          </view>
        </view>

        <view v-if="Object.keys(connections).length === 0" class="empty-connections">
          <text>暂无 WebSocket 连接</text>
        </view>
      </view>
    </view>

    <!-- 消息日志 -->
    <view class="logs-section">
      <view class="logs-header">
        <text class="section-title">消息日志</text>
        <view class="logs-controls">
          <button @click="clearLogs" class="clear-btn">清空日志</button>
          <switch :checked="autoScroll" @change="toggleAutoScroll" />
          <text class="control-label">自动滚动</text>
        </view>
      </view>
      <scroll-view 
        class="logs-container" 
        scroll-y 
        :scroll-top="scrollTop"
        :scroll-with-animation="true"
      >
        <view v-for="(log, index) in logs" :key="index" class="log-item">
          <text class="log-time">{{ formatTime(log.timestamp) }}</text>
          <text class="log-connection">{{ log.connectionId }}</text>
          <text class="log-type" :class="log.type">{{ log.type }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
        <view v-if="logs.length === 0" class="empty-logs">
          <text>暂无日志</text>
        </view>
      </scroll-view>
    </view>

    <!-- 操作面板 -->
    <view class="actions-section">
      <button @click="refreshStats" class="action-btn">刷新统计</button>
      <button @click="reconnectAll" class="action-btn">重连所有</button>
      <button @click="closeAll" class="action-btn danger">关闭所有</button>
      <button @click="exportLogs" class="action-btn">导出日志</button>
    </view>

    <!-- 创建连接弹窗 -->
    <uni-popup ref="createConnectionPopup" type="center">
      <view class="popup-content">
        <text class="popup-title">创建新连接</text>
        <view class="form-item">
          <text class="form-label">连接ID</text>
          <input v-model="newConnection.id" placeholder="输入连接ID" />
        </view>
        <view class="form-item">
          <text class="form-label">WebSocket URL</text>
          <input v-model="newConnection.url" placeholder="ws://..." />
        </view>
        <view class="form-item">
          <text class="form-label">心跳间隔 (ms)</text>
          <input v-model.number="newConnection.heartbeatInterval" type="number" />
        </view>
        <view class="popup-actions">
          <button @click="cancelCreateConnection" class="cancel-btn">取消</button>
          <button @click="confirmCreateConnection" class="confirm-btn">创建</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'WebSocketMonitor',
  
  data() {
    return {
      connections: {},
      logs: [],
      showConfig: {},
      autoScroll: true,
      scrollTop: 0,
      newConnection: {
        id: '',
        url: '',
        heartbeatInterval: 30000
      },
      webSocketManager: null,
      updateInterval: null
    }
  },
  
  computed: {
    totalConnections() {
      return Object.keys(this.connections).length
    },
    
    activeConnections() {
      return Object.values(this.connections).filter(conn => conn.state === 'connected').length
    },
    
    totalQueuedMessages() {
      return Object.values(this.connections).reduce((total, conn) => total + (conn.queueLength || 0), 0)
    },
    
    averageLatency() {
      // 这里可以实现延迟计算逻辑
      return 0
    },
    
    globalStatusClass() {
      if (this.activeConnections === 0) return 'status-error'
      if (this.activeConnections < this.totalConnections) return 'status-warning'
      return 'status-success'
    },
    
    globalStatusText() {
      if (this.totalConnections === 0) return '无连接'
      if (this.activeConnections === 0) return '全部断开'
      if (this.activeConnections < this.totalConnections) return '部分连接'
      return '全部连接'
    }
  },
  
  async mounted() {
    await this.initWebSocketManager()
    this.startMonitoring()
  },
  
  beforeDestroy() {
    this.stopMonitoring()
  },
  
  methods: {
    // 初始化 WebSocket 管理器
    async initWebSocketManager() {
      try {
        const webSocketManagerModule = await import('@/common/websocket-manager.js')
        this.webSocketManager = webSocketManagerModule.default
        
        // 监听所有连接的事件
        this.setupGlobalEventListeners()
        
      } catch (error) {
        console.error('初始化 WebSocket 管理器失败:', error)
        this.addLog('system', 'error', '初始化失败: ' + error.message)
      }
    },
    
    // 设置全局事件监听
    setupGlobalEventListeners() {
      // 这里可以添加全局事件监听逻辑
      // 由于 WebSocketManager 的设计，我们通过轮询来获取状态
    },
    
    // 开始监控
    startMonitoring() {
      this.refreshStats()
      this.updateInterval = setInterval(() => {
        this.refreshStats()
      }, 2000) // 每2秒更新一次
    },
    
    // 停止监控
    stopMonitoring() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }
    },
    
    // 刷新统计信息
    refreshStats() {
      if (this.webSocketManager) {
        this.connections = this.webSocketManager.getAllConnectionStats()
      }
    },
    
    // 获取状态文本
    getStatusText(state) {
      const statusMap = {
        'connected': '已连接',
        'connecting': '连接中',
        'closed': '已关闭',
        'error': '错误',
        'paused': '已暂停'
      }
      return statusMap[state] || state
    },
    
    // 格式化最后活动时间
    formatLastActivity(timestamp) {
      if (!timestamp) return '未知'
      
      const now = Date.now()
      const diff = now - timestamp
      
      if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      return `${Math.floor(diff / 3600000)}小时前`
    },
    
    // 格式化时间
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
    
    // 重连连接
    async reconnectConnection(connectionId) {
      try {
        await this.webSocketManager.reconnect(connectionId)
        this.addLog(connectionId, 'info', '手动重连成功')
        uni.showToast({
          title: '重连成功',
          icon: 'success'
        })
      } catch (error) {
        this.addLog(connectionId, 'error', '手动重连失败: ' + error.message)
        uni.showToast({
          title: '重连失败',
          icon: 'error'
        })
      }
    },
    
    // 关闭连接
    closeConnection(connectionId) {
      uni.showModal({
        title: '确认关闭',
        content: `确定要关闭连接 ${connectionId} 吗？`,
        success: (res) => {
          if (res.confirm) {
            this.webSocketManager.closeConnection(connectionId)
            this.addLog(connectionId, 'info', '连接已关闭')
            uni.showToast({
              title: '连接已关闭',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 测试连接
    async testConnection(connectionId) {
      try {
        const testMessage = {
          type: 'test',
          timestamp: Date.now(),
          message: 'Connection test'
        }
        
        await this.webSocketManager.sendMessage(connectionId, testMessage)
        this.addLog(connectionId, 'info', '测试消息发送成功')
        uni.showToast({
          title: '测试成功',
          icon: 'success'
        })
      } catch (error) {
        this.addLog(connectionId, 'error', '测试失败: ' + error.message)
        uni.showToast({
          title: '测试失败',
          icon: 'error'
        })
      }
    },
    
    // 切换配置显示
    toggleConfig(connectionId) {
      this.$set(this.showConfig, connectionId, !this.showConfig[connectionId])
    },
    
    // 重连所有连接
    reconnectAll() {
      uni.showModal({
        title: '确认重连',
        content: '确定要重连所有连接吗？',
        success: (res) => {
          if (res.confirm) {
            Object.keys(this.connections).forEach(connectionId => {
              if (this.connections[connectionId].state !== 'connected') {
                this.reconnectConnection(connectionId)
              }
            })
          }
        }
      })
    },
    
    // 关闭所有连接
    closeAll() {
      uni.showModal({
        title: '确认关闭',
        content: '确定要关闭所有连接吗？这将断开所有 WebSocket 连接。',
        success: (res) => {
          if (res.confirm) {
            this.webSocketManager.cleanup()
            this.addLog('system', 'info', '所有连接已关闭')
            uni.showToast({
              title: '所有连接已关闭',
              icon: 'success'
            })
          }
        }
      })
    },
    
    // 添加日志
    addLog(connectionId, type, message) {
      const log = {
        timestamp: Date.now(),
        connectionId,
        type,
        message
      }
      
      this.logs.unshift(log)
      
      // 限制日志数量
      if (this.logs.length > 200) {
        this.logs = this.logs.slice(0, 200)
      }
      
      // 自动滚动
      if (this.autoScroll) {
        this.$nextTick(() => {
          this.scrollTop = 0
        })
      }
    },
    
    // 清空日志
    clearLogs() {
      this.logs = []
      uni.showToast({
        title: '日志已清空',
        icon: 'success'
      })
    },
    
    // 切换自动滚动
    toggleAutoScroll(event) {
      this.autoScroll = event.detail.value
    },
    
    // 导出日志
    exportLogs() {
      const logsText = this.logs.map(log => 
        `${this.formatTime(log.timestamp)} [${log.connectionId}] ${log.type.toUpperCase()}: ${log.message}`
      ).join('\\n')
      
      uni.setClipboardData({
        data: logsText,
        success: () => {
          uni.showToast({
            title: '日志已复制到剪贴板',
            icon: 'success'
          })
        }
      })
    },
    
    // 创建新连接
    confirmCreateConnection() {
      if (!this.newConnection.id || !this.newConnection.url) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'error'
        })
        return
      }
      
      this.webSocketManager.createConnection(this.newConnection.id, {
        url: this.newConnection.url,
        heartbeatInterval: this.newConnection.heartbeatInterval
      }).then(() => {
        this.addLog(this.newConnection.id, 'info', '连接创建成功')
        this.cancelCreateConnection()
        uni.showToast({
          title: '连接创建成功',
          icon: 'success'
        })
      }).catch((error) => {
        this.addLog(this.newConnection.id, 'error', '连接创建失败: ' + error.message)
        uni.showToast({
          title: '连接创建失败',
          icon: 'error'
        })
      })
    },
    
    // 取消创建连接
    cancelCreateConnection() {
      this.newConnection = {
        id: '',
        url: '',
        heartbeatInterval: 30000
      }
      this.$refs.createConnectionPopup.close()
    }
  }
}
</script>

<style lang=\"scss\" scoped>
.websocket-monitor {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.global-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  
  &.status-success {
    background: #4CAF50;
    color: white;
  }
  
  &.status-warning {
    background: #FF9800;
    color: white;
  }
  
  &.status-error {
    background: #f44336;
    color: white;
  }
}

.stats-section, .connections-section, .logs-section, .actions-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #2196F3;
  margin-bottom: 5px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.connections-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.connection-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  
  &.connected {
    border-color: #4CAF50;
    background: #f8fff8;
  }
  
  &.error {
    border-color: #f44336;
    background: #fff8f8;
  }
  
  &.closed {
    border-color: #999;
    background: #f8f8f8;
  }
}

.connection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.connection-id {
  font-weight: bold;
  color: #333;
}

.connection-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  
  &.connected {
    background: #4CAF50;
    color: white;
  }
  
  &.error {
    background: #f44336;
    color: white;
  }
  
  &.closed {
    background: #999;
    color: white;
  }
}

.connection-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  
  &.reconnect {
    background: #FF9800;
    color: white;
  }
  
  &.close {
    background: #f44336;
    color: white;
  }
  
  &.danger {
    background: #f44336;
    color: white;
  }
}

.connection-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-size: 12px;
  color: #333;
  font-weight: bold;
}

.connection-config {
  margin: 10px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.config-title {
  display: block;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 5px;
}

.config-content pre {
  font-size: 10px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
}

.connection-footer {
  display: flex;
  gap: 8px;
}

.toggle-btn, .test-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  background: #2196F3;
  color: white;
  cursor: pointer;
}

.empty-connections, .empty-logs {
  text-align: center;
  color: #999;
  padding: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.clear-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  background: #f44336;
  color: white;
  cursor: pointer;
}

.control-label {
  font-size: 12px;
  color: #666;
}

.logs-container {
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background: #fafafa;
}

.log-item {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}

.log-time {
  color: #999;
  min-width: 80px;
}

.log-connection {
  color: #666;
  min-width: 100px;
}

.log-type {
  min-width: 50px;
  font-weight: bold;
  
  &.info {
    color: #2196F3;
  }
  
  &.error {
    color: #f44336;
  }
  
  &.warning {
    color: #FF9800;
  }
  
  &.success {
    color: #4CAF50;
  }
}

.log-message {
  flex: 1;
  color: #333;
}

.actions-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.actions-section .action-btn {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
}

.popup-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
}

.popup-title {
  display: block;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #ccc;
  color: #333;
}

.confirm-btn {
  background: #2196F3;
  color: white;
}
</style>"