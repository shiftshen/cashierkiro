<template>
  <view class="offline-data-demo">
    <view class="demo-header">
      <text class="title">离线数据管理器演示</text>
      <view class="status-indicator" :class="{ online: isOnline, offline: !isOnline }">
        {{ isOnline ? '在线' : '离线' }}
      </view>
    </view>

    <view class="demo-section">
      <text class="section-title">数据操作</text>
      
      <view class="demo-controls">
        <button @click="saveTestData" class="demo-btn">保存测试数据</button>
        <button @click="loadTestData" class="demo-btn">加载数据</button>
        <button @click="deleteTestData" class="demo-btn danger">删除数据</button>
      </view>

      <view class="demo-controls">
        <button @click="forcSync" class="demo-btn">强制同步</button>
        <button @click="clearAllData" class="demo-btn danger">清空所有数据</button>
        <button @click="getStats" class="demo-btn">获取统计</button>
      </view>
    </view>

    <view class="demo-section">
      <text class="section-title">同步队列 ({{ syncQueueLength }})</text>
      <view class="sync-queue">
        <view v-for="item in syncQueue" :key="item.id" class="sync-item">
          <text class="sync-type">{{ item.type }}</text>
          <text class="sync-action">{{ item.action }}</text>
          <text class="sync-key">{{ item.key }}</text>
          <text class="sync-retry">重试: {{ item.retryCount || 0 }}</text>
        </view>
        <view v-if="syncQueueLength === 0" class="empty-queue">
          <text>同步队列为空</text>
        </view>
      </view>
    </view>

    <view class="demo-section">
      <text class="section-title">数据统计</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-label">餐桌数据</text>
          <text class="stat-value">{{ stats.dataTypes?.table?.count || 0 }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">称重数据</text>
          <text class="stat-value">{{ stats.dataTypes?.weight?.count || 0 }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">商品数据</text>
          <text class="stat-value">{{ stats.dataTypes?.goods?.count || 0 }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">订单数据</text>
          <text class="stat-value">{{ stats.dataTypes?.order?.count || 0 }}</text>
        </view>
      </view>
    </view>

    <view class="demo-section">
      <text class="section-title">操作日志</text>
      <scroll-view class="log-container" scroll-y>
        <view v-for="(log, index) in logs" :key="index" class="log-item">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-message" :class="log.type">{{ log.message }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'OfflineDataDemo',
  
  data() {
    return {
      isOnline: navigator.onLine,
      syncQueueLength: 0,
      syncQueue: [],
      stats: {},
      logs: [],
      offlineDataManager: null
    }
  },
  
  async mounted() {
    await this.initOfflineManager()
    this.setupEventListeners()
    this.startStatusUpdates()
  },
  
  methods: {
    // 初始化离线数据管理器
    async initOfflineManager() {
      try {
        const offlineManagerModule = await import('@/common/offline-data-manager.js')
        this.offlineDataManager = offlineManagerModule.default
        this.addLog('success', '离线数据管理器初始化成功')
        await this.updateStats()
      } catch (error) {
        this.addLog('error', '离线数据管理器初始化失败: ' + error.message)
      }
    },
    
    // 设置事件监听
    setupEventListeners() {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.addLog('info', '网络已连接')
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
        this.addLog('warning', '网络已断开')
      })
    },
    
    // 开始状态更新
    startStatusUpdates() {
      setInterval(async () => {
        await this.updateStats()
        this.updateSyncQueue()
      }, 2000)
    },
    
    // 保存测试数据
    async saveTestData() {
      if (!this.offlineDataManager) {
        this.addLog('error', '离线数据管理器未初始化')
        return
      }
      
      const testData = {\n        id: Date.now(),\n        name: '测试餐桌',\n        status: 'occupied',\n        people: Math.floor(Math.random() * 8) + 1,\n        updatedAt: new Date().toISOString()\n      }\n      \n      try {\n        const success = await this.offlineDataManager.setData('table', testData.id.toString(), testData)\n        if (success) {\n          this.addLog('success', `保存测试数据成功: ${testData.id}`)\n        } else {\n          this.addLog('error', '保存测试数据失败')\n        }\n      } catch (error) {\n        this.addLog('error', '保存数据异常: ' + error.message)\n      }\n    },\n    \n    // 加载测试数据\n    async loadTestData() {\n      if (!this.offlineDataManager) {\n        this.addLog('error', '离线数据管理器未初始化')\n        return\n      }\n      \n      try {\n        // 获取最近的数据键\n        const keys = await this.getRecentDataKeys('table')\n        if (keys.length === 0) {\n          this.addLog('warning', '没有找到测试数据')\n          return\n        }\n        \n        const key = keys[0]\n        const data = await this.offlineDataManager.getData('table', key)\n        if (data) {\n          this.addLog('success', `加载数据成功: ${JSON.stringify(data)}`)\n        } else {\n          this.addLog('warning', '数据不存在或已过期')\n        }\n      } catch (error) {\n        this.addLog('error', '加载数据异常: ' + error.message)\n      }\n    },\n    \n    // 删除测试数据\n    async deleteTestData() {\n      if (!this.offlineDataManager) {\n        this.addLog('error', '离线数据管理器未初始化')\n        return\n      }\n      \n      try {\n        const keys = await this.getRecentDataKeys('table')\n        if (keys.length === 0) {\n          this.addLog('warning', '没有数据可删除')\n          return\n        }\n        \n        const key = keys[0]\n        const success = await this.offlineDataManager.deleteData('table', key)\n        if (success) {\n          this.addLog('success', `删除数据成功: ${key}`)\n        } else {\n          this.addLog('error', '删除数据失败')\n        }\n      } catch (error) {\n        this.addLog('error', '删除数据异常: ' + error.message)\n      }\n    },\n    \n    // 强制同步\n    async forcSync() {\n      if (!this.offlineDataManager) {\n        this.addLog('error', '离线数据管理器未初始化')\n        return\n      }\n      \n      try {\n        await this.offlineDataManager.forceSync()\n        this.addLog('info', '强制同步已触发')\n      } catch (error) {\n        this.addLog('error', '强制同步失败: ' + error.message)\n      }\n    },\n    \n    // 清空所有数据\n    async clearAllData() {\n      if (!this.offlineDataManager) {\n        this.addLog('error', '离线数据管理器未初始化')\n        return\n      }\n      \n      try {\n        const success = await this.offlineDataManager.clearAllData()\n        if (success) {\n          this.addLog('success', '所有离线数据已清空')\n          await this.updateStats()\n        } else {\n          this.addLog('error', '清空数据失败')\n        }\n      } catch (error) {\n        this.addLog('error', '清空数据异常: ' + error.message)\n      }\n    },\n    \n    // 获取统计信息\n    async getStats() {\n      await this.updateStats()\n      this.addLog('info', '统计信息已更新')\n    },\n    \n    // 更新统计信息\n    async updateStats() {\n      if (!this.offlineDataManager) return\n      \n      try {\n        this.stats = await this.offlineDataManager.getStats()\n        this.syncQueueLength = this.stats.syncQueueLength || 0\n      } catch (error) {\n        console.error('更新统计信息失败:', error)\n      }\n    },\n    \n    // 更新同步队列显示\n    updateSyncQueue() {\n      if (!this.offlineDataManager) return\n      \n      // 这里应该从 offlineDataManager 获取同步队列\n      // 由于访问限制，我们模拟一些数据\n      this.syncQueue = []\n    },\n    \n    // 获取最近的数据键\n    async getRecentDataKeys(type) {\n      try {\n        const info = uni.getStorageInfoSync()\n        const prefix = `damo_offline_${type}_`\n        return info.keys\n          .filter(key => key.startsWith(prefix))\n          .sort((a, b) => b.localeCompare(a))\n          .slice(0, 5)\n          .map(key => key.replace(prefix, ''))\n      } catch (error) {\n        console.error('获取数据键失败:', error)\n        return []\n      }\n    },\n    \n    // 添加日志\n    addLog(type, message) {\n      const log = {\n        time: new Date().toLocaleTimeString(),\n        type,\n        message\n      }\n      \n      this.logs.unshift(log)\n      \n      // 限制日志数量\n      if (this.logs.length > 50) {\n        this.logs = this.logs.slice(0, 50)\n      }\n      \n      console.log(`[${type.toUpperCase()}] ${message}`)\n    }\n  }\n}\n</script>\n\n<style lang=\"scss\" scoped>\n.offline-data-demo {\n  padding: 20px;\n  background: #f5f5f5;\n  min-height: 100vh;\n}\n\n.demo-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 20px;\n  padding: 15px;\n  background: white;\n  border-radius: 8px;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}\n\n.title {\n  font-size: 18px;\n  font-weight: bold;\n  color: #333;\n}\n\n.status-indicator {\n  padding: 4px 12px;\n  border-radius: 12px;\n  font-size: 12px;\n  font-weight: bold;\n  \n  &.online {\n    background: #4CAF50;\n    color: white;\n  }\n  \n  &.offline {\n    background: #f44336;\n    color: white;\n  }\n}\n\n.demo-section {\n  margin-bottom: 20px;\n  padding: 15px;\n  background: white;\n  border-radius: 8px;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}\n\n.section-title {\n  display: block;\n  font-size: 16px;\n  font-weight: bold;\n  color: #333;\n  margin-bottom: 15px;\n}\n\n.demo-controls {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n  margin-bottom: 10px;\n}\n\n.demo-btn {\n  padding: 8px 16px;\n  border: none;\n  border-radius: 4px;\n  background: #2196F3;\n  color: white;\n  font-size: 14px;\n  cursor: pointer;\n  \n  &:hover {\n    opacity: 0.8;\n  }\n  \n  &.danger {\n    background: #f44336;\n  }\n}\n\n.sync-queue {\n  max-height: 200px;\n  overflow-y: auto;\n}\n\n.sync-item {\n  display: flex;\n  gap: 10px;\n  padding: 8px;\n  border-bottom: 1px solid #eee;\n  font-size: 12px;\n}\n\n.sync-type {\n  color: #2196F3;\n  font-weight: bold;\n}\n\n.sync-action {\n  color: #FF9800;\n}\n\n.sync-key {\n  color: #666;\n  flex: 1;\n}\n\n.sync-retry {\n  color: #f44336;\n}\n\n.empty-queue {\n  text-align: center;\n  color: #999;\n  padding: 20px;\n}\n\n.stats-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));\n  gap: 10px;\n}\n\n.stat-item {\n  text-align: center;\n  padding: 10px;\n  background: #f8f9fa;\n  border-radius: 4px;\n}\n\n.stat-label {\n  display: block;\n  font-size: 12px;\n  color: #666;\n  margin-bottom: 5px;\n}\n\n.stat-value {\n  display: block;\n  font-size: 18px;\n  font-weight: bold;\n  color: #333;\n}\n\n.log-container {\n  height: 200px;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  padding: 10px;\n  background: #fafafa;\n}\n\n.log-item {\n  display: flex;\n  gap: 10px;\n  margin-bottom: 5px;\n  font-size: 12px;\n}\n\n.log-time {\n  color: #999;\n  min-width: 80px;\n}\n\n.log-message {\n  flex: 1;\n  \n  &.success {\n    color: #4CAF50;\n  }\n  \n  &.error {\n    color: #f44336;\n  }\n  \n  &.warning {\n    color: #FF9800;\n  }\n  \n  &.info {\n    color: #2196F3;\n  }\n}\n</style>"