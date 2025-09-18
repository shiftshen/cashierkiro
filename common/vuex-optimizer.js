/**
 * Vuex状态管理优化器
 * 优化大量状态更新，防止响应式系统阻塞主线程
 */

class VuexOptimizer {
  constructor() {
    this.batchUpdates = new Map()
    this.updateQueue = []
    this.isProcessing = false
    this.batchDelay = 16 // 一帧的时间
    
    this.init()
  }

  init() {
    console.log('📦 Vuex优化器已启动')
  }

  /**
   * 批量更新状态
   * @param {Object} store - Vuex store实例
   * @param {Array} mutations - 要执行的mutations数组
   */
  async batchCommit(store, mutations) {
    // 将mutations添加到队列
    mutations.forEach(mutation => {
      this.updateQueue.push({
        store,
        mutation: mutation.type,
        payload: mutation.payload,
        timestamp: Date.now()
      })
    })

    // 开始处理队列
    if (!this.isProcessing) {
      this.processUpdateQueue()
    }
  }

  /**
   * 处理更新队列
   */
  async processUpdateQueue() {
    if (this.updateQueue.length === 0) return

    this.isProcessing = true

    // 按store分组
    const groupedUpdates = new Map()
    
    this.updateQueue.forEach(update => {
      const storeKey = this.getStoreKey(update.store)
      if (!groupedUpdates.has(storeKey)) {
        groupedUpdates.set(storeKey, [])
      }
      groupedUpdates.get(storeKey).push(update)
    })

    // 清空队列
    this.updateQueue = []

    // 批量执行更新
    for (const [storeKey, updates] of groupedUpdates) {
      await this.executeBatchUpdates(updates)
      
      // 让出主线程控制权
      await this.yieldToMainThread()
    }

    this.isProcessing = false

    // 如果还有新的更新，继续处理
    if (this.updateQueue.length > 0) {
      setTimeout(() => this.processUpdateQueue(), this.batchDelay)
    }
  }

  /**
   * 执行批量更新
   * @param {Array} updates - 更新数组
   */
  async executeBatchUpdates(updates) {
    if (updates.length === 0) return

    const store = updates[0].store

    // 合并相同类型的mutations
    const mergedMutations = this.mergeMutations(updates)

    // 执行合并后的mutations
    mergedMutations.forEach(({ mutation, payload }) => {
      try {
        store.commit(mutation, payload)
      } catch (error) {
        console.error('Vuex mutation执行失败:', error)
      }
    })
  }

  /**
   * 合并相同类型的mutations
   * @param {Array} updates - 更新数组
   */
  mergeMutations(updates) {
    const mutationMap = new Map()

    updates.forEach(update => {
      const key = update.mutation
      
      if (mutationMap.has(key)) {
        // 合并payload
        const existing = mutationMap.get(key)
        existing.payload = this.mergePayloads(existing.payload, update.payload)
      } else {
        mutationMap.set(key, {
          mutation: update.mutation,
          payload: update.payload
        })
      }
    })

    return Array.from(mutationMap.values())
  }

  /**
   * 合并载荷数据
   * @param {any} existing - 现有载荷
   * @param {any} newPayload - 新载荷
   */
  mergePayloads(existing, newPayload) {
    // 如果是对象，进行深度合并
    if (typeof existing === 'object' && typeof newPayload === 'object' && 
        existing !== null && newPayload !== null && 
        !Array.isArray(existing) && !Array.isArray(newPayload)) {
      return { ...existing, ...newPayload }
    }

    // 如果是数组，合并数组
    if (Array.isArray(existing) && Array.isArray(newPayload)) {
      return [...existing, ...newPayload]
    }

    // 其他情况，新值覆盖旧值
    return newPayload
  }

  /**
   * 优化大对象的响应式处理
   * @param {Object} store - Vuex store
   * @param {string} mutation - mutation名称
   * @param {Object} largeObject - 大对象
   */
  async optimizeLargeObjectUpdate(store, mutation, largeObject) {
    // 如果对象很大，分批处理
    if (this.isLargeObject(largeObject)) {
      const chunks = this.chunkObject(largeObject)
      
      for (const chunk of chunks) {
        store.commit(mutation, chunk)
        await this.yieldToMainThread()
      }
    } else {
      store.commit(mutation, largeObject)
    }
  }

  /**
   * 判断是否为大对象
   * @param {Object} obj - 对象
   */
  isLargeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return false
    
    // 简单判断：属性数量或JSON字符串长度
    const keys = Object.keys(obj)
    if (keys.length > 100) return true
    
    try {
      const jsonStr = JSON.stringify(obj)
      return jsonStr.length > 50000 // 50KB
    } catch (error) {
      return false
    }
  }

  /**
   * 分块处理大对象
   * @param {Object} obj - 大对象
   * @param {number} chunkSize - 每块大小
   */
  chunkObject(obj, chunkSize = 50) {
    const chunks = []
    const keys = Object.keys(obj)
    
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunkKeys = keys.slice(i, i + chunkSize)
      const chunk = {}
      
      chunkKeys.forEach(key => {
        chunk[key] = obj[key]
      })
      
      chunks.push(chunk)
    }
    
    return chunks
  }

  /**
   * 优化数组更新
   * @param {Object} store - Vuex store
   * @param {string} mutation - mutation名称
   * @param {Array} array - 数组数据
   * @param {Object} options - 选项
   */
  async optimizeArrayUpdate(store, mutation, array, options = {}) {
    const { chunkSize = 100, useVirtualization = false } = options

    if (array.length <= chunkSize) {
      // 小数组直接更新
      store.commit(mutation, array)
      return
    }

    if (useVirtualization) {
      // 虚拟化处理：只更新可见部分
      const visibleRange = options.visibleRange || { start: 0, end: chunkSize }
      const visibleData = array.slice(visibleRange.start, visibleRange.end)
      
      store.commit(mutation, {
        data: visibleData,
        total: array.length,
        range: visibleRange
      })
    } else {
      // 分块更新
      for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize)
        
        store.commit(mutation, {
          data: chunk,
          isChunk: true,
          chunkIndex: Math.floor(i / chunkSize),
          isLastChunk: i + chunkSize >= array.length
        })
        
        await this.yieldToMainThread()
      }
    }
  }

  /**
   * 创建防抖的状态更新
   * @param {Object} store - Vuex store
   * @param {string} mutation - mutation名称
   * @param {number} delay - 防抖延迟
   */
  createDebouncedCommit(store, mutation, delay = 300) {
    let timer = null
    
    return (payload) => {
      if (timer) {
        clearTimeout(timer)
      }
      
      timer = setTimeout(() => {
        store.commit(mutation, payload)
        timer = null
      }, delay)
    }
  }

  /**
   * 创建节流的状态更新
   * @param {Object} store - Vuex store
   * @param {string} mutation - mutation名称
   * @param {number} delay - 节流延迟
   */
  createThrottledCommit(store, mutation, delay = 100) {
    let lastExecution = 0
    
    return (payload) => {
      const now = Date.now()
      
      if (now - lastExecution >= delay) {
        store.commit(mutation, payload)
        lastExecution = now
      }
    }
  }

  /**
   * 优化计算属性
   * @param {Function} computedFn - 计算函数
   * @param {Array} dependencies - 依赖项
   */
  optimizeComputed(computedFn, dependencies = []) {
    let cachedResult = null
    let lastDependencies = null

    return function() {
      // 检查依赖是否变化
      const currentDependencies = dependencies.map(dep => 
        typeof dep === 'function' ? dep() : dep
      )

      if (lastDependencies && this.arraysEqual(currentDependencies, lastDependencies)) {
        return cachedResult
      }

      // 重新计算
      cachedResult = computedFn.apply(this, arguments)
      lastDependencies = currentDependencies

      return cachedResult
    }
  }

  /**
   * 数组相等比较
   * @param {Array} arr1 - 数组1
   * @param {Array} arr2 - 数组2
   */
  arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false
    
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }
    
    return true
  }

  /**
   * 获取store的唯一标识
   * @param {Object} store - Vuex store
   */
  getStoreKey(store) {
    return store._uid || 'default'
  }

  /**
   * 让出主线程控制权
   */
  yieldToMainThread() {
    return new Promise(resolve => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(resolve)
      } else {
        setTimeout(resolve, 0)
      }
    })
  }

  /**
   * 获取优化统计
   */
  getStats() {
    return {
      queuedUpdates: this.updateQueue.length,
      isProcessing: this.isProcessing,
      batchedStores: this.batchUpdates.size
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.updateQueue = []
    this.batchUpdates.clear()
    this.isProcessing = false
    
    console.log('🗑️ Vuex优化器已清理')
  }
}

// 创建全局实例
const vuexOptimizer = new VuexOptimizer()

export default vuexOptimizer