/**
 * 称重功能本地计算管理器
 * 实现称重数据的本地计算和异步同步
 */

class WeightManager {
  constructor() {
    this.syncQueue = []
    this.isOnline = navigator.onLine
    this.productCache = new Map()
    this.syncInProgress = false
    this.maxQueueSize = 100
    
    this.setupNetworkListeners()
    this.startPeriodicSync()
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('📶 网络已连接，开始同步称重数据')
      this.syncWeightQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📵 网络已断开，称重数据将本地缓存')
    })
  }

  /**
   * 本地处理称重数据
   * @param {number} rawWeight - 原始重量
   * @param {Object} product - 商品信息
   * @param {Object} options - 额外选项
   * @returns {Object} 计算结果
   */
  processWeight(rawWeight, product, options = {}) {
    try {
      const weight = parseFloat(rawWeight) || 0
      const unitPrice = this.getUnitPrice(product)
      
      if (weight <= 0) {
        throw new Error('重量必须大于0')
      }
      
      if (unitPrice <= 0) {
        throw new Error('商品单价无效')
      }

      const result = {
        weight: weight,
        unitPrice: unitPrice,
        totalPrice: (weight * unitPrice).toFixed(2),
        productId: product.id || product.spuId,
        productName: product.name,
        timestamp: Date.now(),
        offline: !this.isOnline,
        storeId: options.storeId,
        tableId: options.tableId,
        diningType: options.diningType,
        userId: options.userId || 0
      }

      // 立即返回结果，提升用户体验
      console.log('⚖️ 本地称重计算完成:', result)
      
      // 异步同步到服务器
      this.syncToServer(result)
      
      // 生成打印数据（如果需要）
      if (options.enablePrint) {
        this.generatePrintData(result, options)
      }

      return result
    } catch (error) {
      console.error('称重计算失败:', error)
      throw error
    }
  }

  /**
   * 获取商品单价
   * @param {Object} product - 商品信息
   * @returns {number} 单价
   */
  getUnitPrice(product) {
    // 优先使用折扣价
    if (product.discountPice && parseFloat(product.discountPice) > 0) {
      return parseFloat(product.discountPice)
    }
    
    // 使用原价
    if (product.price && parseFloat(product.price) > 0) {
      return parseFloat(product.price)
    }
    
    // 从缓存中获取
    const cachedProduct = this.productCache.get(product.id || product.spuId)
    if (cachedProduct && cachedProduct.price) {
      return parseFloat(cachedProduct.price)
    }
    
    throw new Error('无法获取商品价格')
  }

  /**
   * 异步同步到服务器
   * @param {Object} weightData - 称重数据
   */
  async syncToServer(weightData) {
    if (!this.isOnline) {
      this.addToSyncQueue(weightData)
      return
    }

    try {
      // 这里应该调用实际的API
      const response = await uni.request({
        url: '/channel/weight/sync',
        method: 'POST',
        data: weightData,
        timeout: 5000
      })

      if (response.statusCode === 200) {
        console.log('✅ 称重数据同步成功')
      } else {
        throw new Error(`同步失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('称重数据同步失败:', error)
      this.addToSyncQueue(weightData)
    }
  }

  /**
   * 添加到同步队列
   * @param {Object} weightData - 称重数据
   */
  addToSyncQueue(weightData) {
    // 防止队列过大
    if (this.syncQueue.length >= this.maxQueueSize) {
      console.warn('⚠️ 称重同步队列已满，移除最旧的数据')
      this.syncQueue.shift()
    }

    this.syncQueue.push(weightData)
    console.log(`📦 称重数据已加入队列，当前队列长度: ${this.syncQueue.length}`)
    
    // 保存到本地存储
    this.saveQueueToStorage()
  }

  /**
   * 批量同步队列中的称重数据
   */
  async syncWeightQueue() {
    if (this.syncQueue.length === 0 || this.syncInProgress || !this.isOnline) {
      return
    }

    this.syncInProgress = true
    console.log(`🔄 开始批量同步 ${this.syncQueue.length} 条称重数据`)

    try {
      const batchSize = 10 // 每批处理10条
      const batches = []
      
      for (let i = 0; i < this.syncQueue.length; i += batchSize) {
        batches.push(this.syncQueue.slice(i, i + batchSize))
      }

      let successCount = 0
      let failedItems = []

      for (const batch of batches) {
        try {
          const response = await uni.request({
            url: '/channel/weight/batch',
            method: 'POST',
            data: { weights: batch },
            timeout: 10000
          })

          if (response.statusCode === 200) {
            successCount += batch.length
          } else {
            failedItems.push(...batch)
          }
        } catch (error) {
          console.error('批量同步失败:', error)
          failedItems.push(...batch)
        }
      }

      // 更新队列，只保留失败的项目
      this.syncQueue = failedItems
      this.saveQueueToStorage()

      console.log(`✅ 称重数据同步完成: 成功 ${successCount} 条，失败 ${failedItems.length} 条`)
      
      if (failedItems.length > 0) {
        console.log('⚠️ 部分数据同步失败，将在下次网络可用时重试')
      }
    } catch (error) {
      console.error('批量同步过程出错:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * 生成打印数据
   * @param {Object} weightResult - 称重结果
   * @param {Object} options - 选项
   */
  generatePrintData(weightResult, options) {
    const printData = {
      storename: options.storeName || '',
      name: weightResult.productName,
      weight: weightResult.weight,
      avgprice: (weightResult.unitPrice * 100).toFixed(2), // 转换为分
      price: (parseFloat(weightResult.totalPrice) * 100).toFixed(2), // 转换为分
      tablename: options.tableName || '',
      created_at: uni.$u.timeFormat(new Date(weightResult.timestamp), 'yyyy-mm-dd hh:MM:ss'),
      height: 20
    }

    // 调用打印插件
    // #ifdef APP-PLUS
    try {
      const cashierPrint = uni.requireNativePlugin('CashierPrint')
      if (cashierPrint != null) {
        cashierPrint.PrintGoodsWeight(printData, res => {
          console.log('🖨️ 称重小票打印结果:', res)
        })
      }
    } catch (error) {
      console.error('打印称重小票失败:', error)
    }
    // #endif

    return printData
  }

  /**
   * 缓存商品信息
   * @param {Object} product - 商品信息
   */
  cacheProduct(product) {
    if (product && (product.id || product.spuId)) {
      this.productCache.set(product.id || product.spuId, {
        id: product.id || product.spuId,
        name: product.name,
        price: product.price,
        discountPice: product.discountPice,
        weightSwitch: product.weightSwitch,
        cachedAt: Date.now()
      })
    }
  }

  /**
   * 清理过期的商品缓存
   */
  cleanExpiredCache() {
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30分钟

    this.productCache.forEach((product, id) => {
      if (now - product.cachedAt > maxAge) {
        this.productCache.delete(id)
      }
    })
  }

  /**
   * 保存队列到本地存储
   */
  saveQueueToStorage() {
    try {
      uni.setStorageSync('weight_sync_queue', this.syncQueue)
    } catch (error) {
      console.error('保存称重队列失败:', error)
    }
  }

  /**
   * 从本地存储恢复队列
   */
  loadQueueFromStorage() {
    try {
      const savedQueue = uni.getStorageSync('weight_sync_queue')
      if (Array.isArray(savedQueue)) {
        this.syncQueue = savedQueue
        console.log(`📦 从本地存储恢复 ${this.syncQueue.length} 条称重数据`)
      }
    } catch (error) {
      console.error('恢复称重队列失败:', error)
    }
  }

  /**
   * 启动定期同步
   */
  startPeriodicSync() {
    // 应用启动时恢复队列
    this.loadQueueFromStorage()
    
    // 每30秒尝试同步一次
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncWeightQueue()
      }
    }, 30000)
    
    // 每5分钟清理一次过期缓存
    setInterval(() => {
      this.cleanExpiredCache()
    }, 5 * 60 * 1000)
  }

  /**
   * 获取同步状态
   * @returns {Object} 状态信息
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      cacheSize: this.productCache.size,
      lastSyncTime: this.lastSyncTime || null
    }
  }

  /**
   * 手动触发同步
   */
  async forcSync() {
    if (this.isOnline) {
      await this.syncWeightQueue()
    } else {
      console.log('📵 网络不可用，无法同步')
    }
  }

  /**
   * 清空同步队列
   */
  clearSyncQueue() {
    this.syncQueue = []
    this.saveQueueToStorage()
    console.log('🗑️ 称重同步队列已清空')
  }
}

// 创建全局实例
const weightManager = new WeightManager()

export default weightManager