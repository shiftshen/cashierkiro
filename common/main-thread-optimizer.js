/**
 * 主线程性能优化器
 * 防止主线程阻塞，优化大数据处理和计算密集型任务
 */

class MainThreadOptimizer {
  constructor() {
    this.workerPool = new Map()
    this.taskQueue = []
    this.isProcessing = false
    this.maxWorkers = 2 // 最大Worker数量
    this.taskTimeout = 30000 // 30秒超时
    
    this.debounceTimers = new Map()
    this.throttleTimers = new Map()
    
    this.init()
  }

  init() {
    this.setupPerformanceMonitoring()
    this.startTaskProcessor()
    console.log('🚀 主线程优化器已启动')
  }

  // 设置性能监控
  setupPerformanceMonitoring() {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // 超过50ms的任务
              console.warn('🐌 检测到长任务:', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              })
              
              // 触发优化建议
              this.suggestOptimization(entry)
            }
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('长任务监控不支持:', error)
      }
    }
  }

  // 建议优化
  suggestOptimization(taskEntry) {
    if (taskEntry.duration > 100) {
      console.log('💡 建议: 将长时间运行的任务移至Web Worker')
    }
    
    if (taskEntry.duration > 200) {
      console.log('💡 建议: 使用时间切片技术分解任务')
    }
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} delay - 延迟时间(ms)
   * @param {string} key - 唯一标识
   */
  debounce(func, delay = 300, key = 'default') {
    return (...args) => {
      // 清除之前的定时器
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key))
      }
      
      // 设置新的定时器
      const timer = setTimeout(() => {
        func.apply(this, args)
        this.debounceTimers.delete(key)
      }, delay)
      
      this.debounceTimers.set(key, timer)
    }
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} delay - 间隔时间(ms)
   * @param {string} key - 唯一标识
   */
  throttle(func, delay = 100, key = 'default') {
    return (...args) => {
      if (this.throttleTimers.has(key)) {
        return // 如果在冷却期内，直接返回
      }
      
      // 执行函数
      func.apply(this, args)
      
      // 设置冷却期
      const timer = setTimeout(() => {
        this.throttleTimers.delete(key)
      }, delay)
      
      this.throttleTimers.set(key, timer)
    }
  }

  /**
   * 时间切片处理大数组
   * @param {Array} array - 要处理的数组
   * @param {Function} processor - 处理函数
   * @param {number} chunkSize - 每次处理的数量
   * @param {number} delay - 每次处理间隔(ms)
   */
  async processArrayInChunks(array, processor, chunkSize = 100, delay = 5) {
    const results = []
    
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize)
      
      // 处理当前块
      const chunkResults = chunk.map(processor)
      results.push(...chunkResults)
      
      // 让出主线程控制权
      if (i + chunkSize < array.length) {
        await this.yieldToMainThread(delay)
      }
    }
    
    return results
  }

  /**
   * 让出主线程控制权
   * @param {number} delay - 延迟时间(ms)
   */
  yieldToMainThread(delay = 0) {
    return new Promise(resolve => {
      if (delay > 0) {
        setTimeout(resolve, delay)
      } else {
        // 使用MessageChannel实现零延迟
        const channel = new MessageChannel()
        channel.port2.onmessage = () => resolve()
        channel.port1.postMessage(null)
      }
    })
  }

  /**
   * 在Web Worker中执行任务
   * @param {Function|string} task - 要执行的任务
   * @param {any} data - 传递给任务的数据
   * @param {Object} options - 选项
   */
  async runInWorker(task, data, options = {}) {
    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId()
      const timeout = options.timeout || this.taskTimeout
      
      // 创建任务对象
      const taskObj = {
        id: taskId,
        task: typeof task === 'function' ? task.toString() : task,
        data,
        resolve,
        reject,
        timeout: setTimeout(() => {
          reject(new Error('Worker任务超时'))
        }, timeout)
      }
      
      // 添加到队列
      this.taskQueue.push(taskObj)
      
      // 开始处理
      this.processTaskQueue()
    })
  }

  // 处理任务队列
  async processTaskQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return
    }
    
    this.isProcessing = true
    
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()
      
      try {
        const worker = await this.getAvailableWorker()
        await this.executeTaskInWorker(worker, task)
      } catch (error) {
        clearTimeout(task.timeout)
        task.reject(error)
      }
    }
    
    this.isProcessing = false
  }

  // 获取可用的Worker
  async getAvailableWorker() {
    // 查找空闲的Worker
    for (const [id, worker] of this.workerPool) {
      if (!worker.busy) {
        return worker
      }
    }
    
    // 如果没有空闲Worker且未达到最大数量，创建新的
    if (this.workerPool.size < this.maxWorkers) {
      return this.createWorker()
    }
    
    // 等待Worker空闲
    return new Promise((resolve) => {
      const checkWorker = () => {
        for (const [id, worker] of this.workerPool) {
          if (!worker.busy) {
            resolve(worker)
            return
          }
        }
        setTimeout(checkWorker, 10)
      }
      checkWorker()
    })
  }

  // 创建Worker
  createWorker() {
    const workerId = this.generateWorkerId()
    
    // 创建Worker代码
    const workerCode = `
      self.onmessage = function(e) {
        const { taskId, task, data } = e.data
        
        try {
          let result
          
          if (typeof task === 'string') {
            // 如果是字符串，尝试作为函数执行
            const func = new Function('data', task + '; return typeof taskFunction !== "undefined" ? taskFunction(data) : data')
            result = func(data)
          } else {
            // 直接执行
            result = task(data)
          }
          
          self.postMessage({
            taskId,
            success: true,
            result
          })
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message
          })
        }
      }
    `
    
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))
    
    const workerObj = {
      id: workerId,
      worker,
      busy: false,
      createdAt: Date.now()
    }
    
    this.workerPool.set(workerId, workerObj)
    console.log(`🔧 创建Worker: ${workerId}`)
    
    return workerObj
  }

  // 在Worker中执行任务
  executeTaskInWorker(workerObj, task) {
    return new Promise((resolve, reject) => {
      workerObj.busy = true
      
      const handleMessage = (e) => {
        const { taskId, success, result, error } = e.data
        
        if (taskId === task.id) {
          workerObj.worker.removeEventListener('message', handleMessage)
          workerObj.busy = false
          clearTimeout(task.timeout)
          
          if (success) {
            task.resolve(result)
            resolve(result)
          } else {
            const err = new Error(error)
            task.reject(err)
            reject(err)
          }
        }
      }
      
      workerObj.worker.addEventListener('message', handleMessage)
      
      // 发送任务到Worker
      workerObj.worker.postMessage({
        taskId: task.id,
        task: task.task,
        data: task.data
      })
    })
  }

  /**
   * 优化JSON解析
   * @param {string} jsonString - JSON字符串
   * @param {boolean} useWorker - 是否使用Worker
   */
  async parseJSON(jsonString, useWorker = false) {
    if (!useWorker || jsonString.length < 10000) {
      // 小数据直接解析
      return JSON.parse(jsonString)
    }
    
    // 大数据使用Worker解析
    return this.runInWorker(`
      function taskFunction(data) {
        return JSON.parse(data)
      }
    `, jsonString)
  }

  /**
   * 优化数组排序
   * @param {Array} array - 要排序的数组
   * @param {Function} compareFn - 比较函数
   * @param {boolean} useWorker - 是否使用Worker
   */
  async sortArray(array, compareFn, useWorker = false) {
    if (!useWorker || array.length < 1000) {
      // 小数组直接排序
      return array.sort(compareFn)
    }
    
    // 大数组使用Worker排序
    return this.runInWorker(`
      function taskFunction(data) {
        const { array, compareFnStr } = data
        const compareFn = new Function('a', 'b', compareFnStr)
        return array.sort(compareFn)
      }
    `, {
      array,
      compareFnStr: compareFn.toString().replace(/^function[^{]*{/, '').replace(/}$/, '')
    })
  }

  /**
   * 优化数组过滤
   * @param {Array} array - 要过滤的数组
   * @param {Function} filterFn - 过滤函数
   * @param {boolean} useChunks - 是否使用时间切片
   */
  async filterArray(array, filterFn, useChunks = false) {
    if (!useChunks || array.length < 1000) {
      return array.filter(filterFn)
    }
    
    // 使用时间切片处理
    const results = []
    await this.processArrayInChunks(array, (item) => {
      if (filterFn(item)) {
        results.push(item)
      }
    })
    
    return results
  }

  /**
   * 优化DOM操作
   * @param {Function} domOperations - DOM操作函数
   */
  async optimizeDOMOperations(domOperations) {
    // 使用DocumentFragment减少重排
    const fragment = document.createDocumentFragment()
    
    // 批量执行DOM操作
    await this.yieldToMainThread()
    domOperations(fragment)
    
    // 一次性插入到DOM
    return fragment
  }

  /**
   * 创建防抖搜索
   * @param {Function} searchFn - 搜索函数
   * @param {number} delay - 防抖延迟
   */
  createDebouncedSearch(searchFn, delay = 300) {
    return this.debounce(async (query) => {
      if (!query || query.length < 2) return []
      
      try {
        return await searchFn(query)
      } catch (error) {
        console.error('搜索失败:', error)
        return []
      }
    }, delay, 'search')
  }

  /**
   * 创建节流滚动处理
   * @param {Function} scrollFn - 滚动处理函数
   * @param {number} delay - 节流延迟
   */
  createThrottledScroll(scrollFn, delay = 16) {
    return this.throttle((event) => {
      // 使用requestAnimationFrame优化滚动
      requestAnimationFrame(() => {
        scrollFn(event)
      })
    }, delay, 'scroll')
  }

  /**
   * 优化Vuex状态更新
   * @param {Object} store - Vuex store
   * @param {string} mutation - mutation名称
   * @param {any} payload - 载荷
   */
  async optimizeVuexUpdate(store, mutation, payload) {
    // 批量更新状态
    await this.yieldToMainThread()
    
    store.commit(mutation, payload)
    
    // 让Vue有时间处理响应式更新
    await this.$nextTick()
  }

  // 生成任务ID
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 生成Worker ID
  generateWorkerId() {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 开始任务处理器
  startTaskProcessor() {
    // 定期清理空闲的Worker
    setInterval(() => {
      this.cleanupWorkers()
    }, 60000) // 每分钟清理一次
  }

  // 清理Worker
  cleanupWorkers() {
    const now = Date.now()
    const maxIdleTime = 5 * 60 * 1000 // 5分钟空闲时间
    
    for (const [id, workerObj] of this.workerPool) {
      if (!workerObj.busy && (now - workerObj.createdAt) > maxIdleTime) {
        workerObj.worker.terminate()
        this.workerPool.delete(id)
        console.log(`🗑️ 清理空闲Worker: ${id}`)
      }
    }
  }

  // 获取性能统计
  getPerformanceStats() {
    return {
      activeWorkers: Array.from(this.workerPool.values()).filter(w => w.busy).length,
      totalWorkers: this.workerPool.size,
      queuedTasks: this.taskQueue.length,
      debounceTimers: this.debounceTimers.size,
      throttleTimers: this.throttleTimers.size
    }
  }

  // 销毁优化器
  destroy() {
    // 清理所有定时器
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.throttleTimers.forEach(timer => clearTimeout(timer))
    
    // 终止所有Worker
    this.workerPool.forEach(workerObj => {
      workerObj.worker.terminate()
    })
    
    // 清空队列
    this.taskQueue.forEach(task => {
      clearTimeout(task.timeout)
      task.reject(new Error('优化器已销毁'))
    })
    
    console.log('🗑️ 主线程优化器已销毁')
  }
}

// 创建全局实例
const mainThreadOptimizer = new MainThreadOptimizer()

export default mainThreadOptimizer