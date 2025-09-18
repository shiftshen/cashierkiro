/**
 * 离线数据管理器
 * 统一管理本地缓存、数据同步和冲突解决
 */

class OfflineDataManager {
  constructor() {
    this.storagePrefix = 'damo_offline_'
    this.syncQueue = []
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    this.conflictResolvers = new Map()
    this.dataSchemas = new Map()
    
    // 数据类型配置
    this.dataTypes = {
      TABLE_STATUS: 'table_status',
      GOODS_LIST: 'goods_list',
      MEMBER_INFO: 'member_info',
      ORDER_DATA: 'order_data',
      WEIGHT_DATA: 'weight_data',
      CONFIG_DATA: 'config_data'
    }
    
    // 缓存策略配置
    this.cacheStrategies = {
      [this.dataTypes.TABLE_STATUS]: {
        maxAge: 5 * 60 * 1000,      // 5分钟
        syncPriority: 1,             // 高优先级
        conflictStrategy: 'server_wins'
      },
      [this.dataTypes.GOODS_LIST]: {
        maxAge: 30 * 60 * 1000,     // 30分钟
        syncPriority: 2,             // 中优先级
        conflictStrategy: 'server_wins'
      },
      [this.dataTypes.MEMBER_INFO]: {
        maxAge: 10 * 60 * 1000,     // 10分钟
        syncPriority: 1,             // 高优先级
        conflictStrategy: 'merge'
      },
      [this.dataTypes.ORDER_DATA]: {
        maxAge: 0,                   // 不缓存，立即同步
        syncPriority: 0,             // 最高优先级
        conflictStrategy: 'client_wins'
      },
      [this.dataTypes.WEIGHT_DATA]: {
        maxAge: 60 * 1000,          // 1分钟
        syncPriority: 1,             // 高优先级
        conflictStrategy: 'client_wins'
      },
      [this.dataTypes.CONFIG_DATA]: {
        maxAge: 60 * 60 * 1000,     // 1小时
        syncPriority: 3,             // 低优先级
        conflictStrategy: 'server_wins'
      }
    }
    
    this.init()
  }

  async init() {
    this.setupNetworkListeners()
    this.setupDataSchemas()
    this.startPeriodicSync()
    await this.loadSyncQueue()
    
    console.log('📦 离线数据管理器初始化完成')
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('📶 网络已连接，开始同步离线数据')
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📵 网络已断开，启用离线模式')
    })
  }

  setupDataSchemas() {
    // 定义数据结构模式，用于验证和冲突解决
    this.dataSchemas.set(this.dataTypes.TABLE_STATUS, {
      id: 'string',
      name: 'string',
      state: 'number',
      people: 'number',
      minutes: 'number',
      order: 'object',
      lastUpdated: 'number'
    })

    this.dataSchemas.set(this.dataTypes.WEIGHT_DATA, {
      id: 'string',
      weight: 'number',
      unitPrice: 'number',
      totalPrice: 'number',
      productId: 'string',
      timestamp: 'number',
      synced: 'boolean'
    })
  }

  /**
   * 存储数据到本地缓存
   * @param {string} dataType - 数据类型
   * @param {string} key - 数据键
   * @param {any} data - 数据内容
   * @param {Object} options - 选项
   */
  async setData(dataType, key, data, options = {}) {
    try {
      const storageKey = this.getStorageKey(dataType, key)
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        version: options.version || 1,
        source: options.source || 'local',
        synced: options.synced || false
      }

      // 验证数据结构
      if (this.dataSchemas.has(dataType)) {
        this.validateDataSchema(data, this.dataSchemas.get(dataType))
      }

      // 存储到本地
      uni.setStorageSync(storageKey, cacheData)
      
      // 如果需要同步且当前离线，添加到同步队列
      if (!cacheData.synced && !this.isOnline) {
        this.addToSyncQueue(dataType, key, data, 'set')
      }

      console.log(`💾 数据已缓存: ${dataType}/${key}`)
      return true
    } catch (error) {
      console.error('数据存储失败:', error)
      return false
    }
  }

  /**
   * 从本地缓存获取数据
   * @param {string} dataType - 数据类型
   * @param {string} key - 数据键
   * @param {Object} options - 选项
   */
  async getData(dataType, key, options = {}) {
    try {
      const storageKey = this.getStorageKey(dataType, key)
      const cacheData = uni.getStorageSync(storageKey)

      if (!cacheData) {
        return null
      }

      // 检查缓存是否过期
      const strategy = this.cacheStrategies[dataType]
      if (strategy && strategy.maxAge > 0) {
        const age = Date.now() - cacheData.timestamp
        if (age > strategy.maxAge) {
          console.log(`⏰ 缓存已过期: ${dataType}/${key}`)
          
          if (options.allowExpired) {
            return cacheData.data
          } else {
            this.removeData(dataType, key)
            return null
          }
        }
      }

      console.log(`📖 从缓存读取: ${dataType}/${key}`)
      return cacheData.data
    } catch (error) {
      console.error('数据读取失败:', error)
      return null
    }
  }

  /**
   * 删除缓存数据
   * @param {string} dataType - 数据类型
   * @param {string} key - 数据键
   */
  async removeData(dataType, key) {
    try {
      const storageKey = this.getStorageKey(dataType, key)
      uni.removeStorageSync(storageKey)
      
      // 添加删除操作到同步队列
      if (!this.isOnline) {
        this.addToSyncQueue(dataType, key, null, 'delete')
      }

      console.log(`🗑️ 数据已删除: ${dataType}/${key}`)
      return true
    } catch (error) {
      console.error('数据删除失败:', error)
      return false
    }
  }

  /**
   * 批量获取数据
   * @param {string} dataType - 数据类型
   * @param {Array} keys - 数据键数组
   */
  async getBatchData(dataType, keys) {
    const results = {}
    
    for (const key of keys) {
      const data = await this.getData(dataType, key)
      if (data !== null) {
        results[key] = data
      }
    }
    
    return results
  }

  /**
   * 获取数据类型的所有缓存
   * @param {string} dataType - 数据类型
   */
  async getAllData(dataType) {
    try {
      const prefix = this.getStorageKey(dataType, '')
      const allKeys = uni.getStorageInfoSync().keys
      const matchingKeys = allKeys.filter(key => key.startsWith(prefix))
      
      const results = {}
      for (const storageKey of matchingKeys) {
        const cacheData = uni.getStorageSync(storageKey)
        if (cacheData) {
          const originalKey = storageKey.replace(prefix, '')
          results[originalKey] = cacheData.data
        }
      }
      
      return results
    } catch (error) {
      console.error('批量数据读取失败:', error)
      return {}
    }
  }

  /**
   * 添加到同步队列
   * @param {string} dataType - 数据类型
   * @param {string} key - 数据键
   * @param {any} data - 数据内容
   * @param {string} operation - 操作类型 (set/delete)
   */
  addToSyncQueue(dataType, key, data, operation) {
    const syncItem = {
      id: this.generateSyncId(),
      dataType,
      key,
      data,
      operation,
      timestamp: Date.now(),
      retryCount: 0,
      priority: this.cacheStrategies[dataType]?.syncPriority || 2
    }

    this.syncQueue.push(syncItem)
    this.saveSyncQueue()
    
    console.log(`📤 添加到同步队列: ${dataType}/${key} (${operation})`)
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log(`🔄 开始处理同步队列: ${this.syncQueue.length} 项`)

    // 按优先级排序
    this.syncQueue.sort((a, b) => a.priority - b.priority)

    const failedItems = []
    let successCount = 0

    for (const item of this.syncQueue) {
      try {
        const success = await this.syncSingleItem(item)
        if (success) {
          successCount++
        } else {
          item.retryCount++
          if (item.retryCount < 3) {
            failedItems.push(item)
          }
        }
      } catch (error) {
        console.error('同步项目失败:', error)
        item.retryCount++
        if (item.retryCount < 3) {
          failedItems.push(item)
        }
      }
    }

    this.syncQueue = failedItems
    this.saveSyncQueue()
    this.syncInProgress = false

    console.log(`✅ 同步完成: 成功 ${successCount} 项，失败 ${failedItems.length} 项`)
  }

  /**
   * 同步单个项目
   * @param {Object} item - 同步项目
   */
  async syncSingleItem(item) {
    try {
      // 这里需要根据实际API接口实现
      const apiUrl = this.getApiUrl(item.dataType, item.operation)
      
      let response
      if (item.operation === 'set') {
        response = await uni.request({
          url: apiUrl,
          method: 'POST',
          data: item.data,
          timeout: 10000
        })
      } else if (item.operation === 'delete') {
        response = await uni.request({
          url: `${apiUrl}/${item.key}`,
          method: 'DELETE',
          timeout: 10000
        })
      }

      if (response.statusCode === 200) {
        // 标记为已同步
        if (item.operation === 'set') {
          await this.setData(item.dataType, item.key, item.data, { synced: true })
        }
        return true
      } else {
        console.error('同步失败:', response.statusCode, response.data)
        return false
      }
    } catch (error) {
      console.error('同步请求失败:', error)
      return false
    }
  }

  /**
   * 数据冲突解决
   * @param {string} dataType - 数据类型
   * @param {any} localData - 本地数据
   * @param {any} serverData - 服务器数据
   */
  resolveConflict(dataType, localData, serverData) {
    const strategy = this.cacheStrategies[dataType]?.conflictStrategy || 'server_wins'

    switch (strategy) {
      case 'server_wins':
        return serverData

      case 'client_wins':
        return localData

      case 'merge':
        return this.mergeData(localData, serverData)

      case 'timestamp':
        const localTime = localData.lastUpdated || localData.timestamp || 0
        const serverTime = serverData.lastUpdated || serverData.timestamp || 0
        return serverTime > localTime ? serverData : localData

      default:
        return serverData
    }
  }

  /**
   * 合并数据
   * @param {any} localData - 本地数据
   * @param {any} serverData - 服务器数据
   */
  mergeData(localData, serverData) {
    if (typeof localData === 'object' && typeof serverData === 'object') {
      return { ...serverData, ...localData }
    }
    return serverData
  }

  /**
   * 验证数据结构
   * @param {any} data - 数据
   * @param {Object} schema - 数据模式
   */
  validateDataSchema(data, schema) {
    for (const [field, type] of Object.entries(schema)) {
      if (data.hasOwnProperty(field)) {
        const actualType = typeof data[field]
        if (actualType !== type && !(type === 'object' && data[field] === null)) {
          console.warn(`数据类型不匹配: ${field} 期望 ${type}，实际 ${actualType}`)
        }
      }
    }
  }

  /**
   * 获取存储键
   * @param {string} dataType - 数据类型
   * @param {string} key - 数据键
   */
  getStorageKey(dataType, key) {
    return `${this.storagePrefix}${dataType}_${key}`
  }

  /**
   * 获取API URL
   * @param {string} dataType - 数据类型
   * @param {string} operation - 操作类型
   */
  getApiUrl(dataType, operation) {
    const apiMap = {
      [this.dataTypes.TABLE_STATUS]: '/channel/table',
      [this.dataTypes.GOODS_LIST]: '/channel/goods',
      [this.dataTypes.MEMBER_INFO]: '/channel/member',
      [this.dataTypes.ORDER_DATA]: '/channel/order',
      [this.dataTypes.WEIGHT_DATA]: '/channel/weight',
      [this.dataTypes.CONFIG_DATA]: '/channel/config'
    }

    return apiMap[dataType] || '/channel/sync'
  }

  /**
   * 生成同步ID
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存同步队列
   */
  saveSyncQueue() {
    try {
      uni.setStorageSync(`${this.storagePrefix}sync_queue`, this.syncQueue)
    } catch (error) {
      console.error('保存同步队列失败:', error)
    }
  }

  /**
   * 加载同步队列
   */
  async loadSyncQueue() {
    try {
      const savedQueue = uni.getStorageSync(`${this.storagePrefix}sync_queue`)
      if (Array.isArray(savedQueue)) {
        this.syncQueue = savedQueue
        console.log(`📦 恢复同步队列: ${this.syncQueue.length} 项`)
      }
    } catch (error) {
      console.error('加载同步队列失败:', error)
    }
  }

  /**
   * 启动定期同步
   */
  startPeriodicSync() {
    // 每30秒尝试同步一次
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue()
      }
    }, 30000)

    // 每5分钟清理过期缓存
    setInterval(() => {
      this.cleanExpiredCache()
    }, 5 * 60 * 1000)
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache() {
    try {
      const allKeys = uni.getStorageInfoSync().keys
      const offlineKeys = allKeys.filter(key => key.startsWith(this.storagePrefix))
      
      let cleanedCount = 0
      
      for (const key of offlineKeys) {
        if (key.includes('sync_queue')) continue // 跳过同步队列
        
        const cacheData = uni.getStorageSync(key)
        if (cacheData && cacheData.timestamp) {
          // 提取数据类型
          const dataType = this.extractDataTypeFromKey(key)
          const strategy = this.cacheStrategies[dataType]
          
          if (strategy && strategy.maxAge > 0) {
            const age = Date.now() - cacheData.timestamp
            if (age > strategy.maxAge) {
              uni.removeStorageSync(key)
              cleanedCount++
            }
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 清理过期缓存: ${cleanedCount} 项`)
      }
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
  }

  /**
   * 从存储键提取数据类型
   * @param {string} storageKey - 存储键
   */
  extractDataTypeFromKey(storageKey) {
    const withoutPrefix = storageKey.replace(this.storagePrefix, '')
    const parts = withoutPrefix.split('_')
    return parts[0]
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats() {
    try {
      const allKeys = uni.getStorageInfoSync().keys
      const offlineKeys = allKeys.filter(key => key.startsWith(this.storagePrefix))
      
      const stats = {
        totalItems: 0,
        totalSize: 0,
        byType: {},
        syncQueueSize: this.syncQueue.length
      }
      
      for (const key of offlineKeys) {
        if (key.includes('sync_queue')) continue
        
        const dataType = this.extractDataTypeFromKey(key)
        if (!stats.byType[dataType]) {
          stats.byType[dataType] = { count: 0, size: 0 }
        }
        
        const data = uni.getStorageSync(key)
        if (data) {
          const size = JSON.stringify(data).length
          stats.totalItems++
          stats.totalSize += size
          stats.byType[dataType].count++
          stats.byType[dataType].size += size
        }
      }
      
      return stats
    } catch (error) {
      console.error('获取缓存统计失败:', error)
      return null
    }
  }

  /**
   * 清空所有缓存
   */
  async clearAllCache() {
    try {
      const allKeys = uni.getStorageInfoSync().keys
      const offlineKeys = allKeys.filter(key => key.startsWith(this.storagePrefix))
      
      for (const key of offlineKeys) {
        uni.removeStorageSync(key)
      }
      
      this.syncQueue = []
      console.log('🗑️ 所有离线缓存已清空')
      return true
    } catch (error) {
      console.error('清空缓存失败:', error)
      return false
    }
  }

  /**
   * 手动触发同步
   */
  async forceSync() {
    if (this.isOnline) {
      await this.processSyncQueue()
    } else {
      console.log('📵 网络不可用，无法同步')
    }
  }
}

// 创建全局实例
const offlineDataManager = new OfflineDataManager()

export default offlineDataManager