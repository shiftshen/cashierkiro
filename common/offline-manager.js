import localforage from 'localforage'

// 配置存储实例
const cacheStore = localforage.createInstance({
  name: 'damo_cashier',
  storeName: 'cache'
})

const queueStore = localforage.createInstance({
  name: 'damo_cashier', 
  storeName: 'offline_queue'
})

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupNetworkListeners()
  }

  // 网络状态监听
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineQueue()
      uni.$emit('network-online')
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      uni.$emit('network-offline')
    })
  }

  // 缓存数据
  async cacheData(key, data, ttl = 3600000) { // 默认1小时
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl
    }
    await cacheStore.setItem(key, cacheItem)
  }

  // 获取缓存数据
  async getCachedData(key) {
    try {
      const cacheItem = await cacheStore.getItem(key)
      if (!cacheItem) return null
      
      const { data, timestamp, ttl } = cacheItem
      if (Date.now() - timestamp > ttl) {
        await cacheStore.removeItem(key)
        return null
      }
      
      return data
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  }

  // 添加到离线队列
  async addToQueue(operation) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const queueItem = {
      id,
      ...operation,
      timestamp: Date.now()
    }
    await queueStore.setItem(id, queueItem)
    return id
  }

  // 同步离线队列
  async syncOfflineQueue() {
    try {
      const keys = await queueStore.keys()
      console.log(`开始同步 ${keys.length} 个离线操作`)
      
      for (const key of keys) {
        const item = await queueStore.getItem(key)
        if (!item) continue
        
        try {
          // 执行网络请求
          const response = await uni.request({
            url: item.url,
            method: item.method || 'POST',
            data: item.data,
            header: item.header
          })
          
          if (response[1].statusCode === 200) {
            await queueStore.removeItem(key)
            console.log(`同步成功: ${item.type}`)
            
            // 触发同步成功事件
            uni.$emit('sync-success', {
              type: item.type,
              data: response[1].data
            })
          }
        } catch (error) {
          console.error(`同步失败: ${item.type}`, error)
        }
      }
    } catch (error) {
      console.error('同步队列失败:', error)
    }
  }

  // 获取离线队列状态
  async getQueueStatus() {
    try {
      const keys = await queueStore.keys()
      return {
        count: keys.length,
        items: keys
      }
    } catch (error) {
      return { count: 0, items: [] }
    }
  }

  // 清理过期缓存
  async clearExpiredCache() {
    try {
      const keys = await cacheStore.keys()
      for (const key of keys) {
        const item = await cacheStore.getItem(key)
        if (item && Date.now() - item.timestamp > item.ttl) {
          await cacheStore.removeItem(key)
        }
      }
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
  }

  // 清空所有缓存
  async clearAllCache() {
    try {
      await cacheStore.clear()
      console.log('所有缓存已清空')
    } catch (error) {
      console.error('清空缓存失败:', error)
    }
  }

  // 清空离线队列
  async clearQueue() {
    try {
      await queueStore.clear()
      console.log('离线队列已清空')
    } catch (error) {
      console.error('清空队列失败:', error)
    }
  }
}

export default new OfflineManager()