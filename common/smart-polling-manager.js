/**
 * 智能轮询管理器
 * 根据页面活跃状态和网络状况智能调整轮询频率
 */

class SmartPollingManager {
  constructor() {
    this.pollingInstances = new Map()
    this.isPageActive = true
    this.isOnline = navigator.onLine
    this.defaultIntervals = {
      active: 10000,    // 页面活跃时10秒
      inactive: 30000,  // 页面非活跃时30秒
      offline: 60000    // 离线时60秒（用于检测网络恢复）
    }
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 页面可见性监听
    document.addEventListener('visibilitychange', () => {
      this.isPageActive = !document.hidden
      this.adjustAllPollingFrequency()
    })

    // 网络状态监听
    window.addEventListener('online', () => {
      this.isOnline = true
      this.adjustAllPollingFrequency()
      console.log('📶 网络已连接，恢复正常轮询')
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.adjustAllPollingFrequency()
      console.log('📵 网络已断开，降低轮询频率')
    })
  }

  /**
   * 创建智能轮询实例
   * @param {string} name - 轮询实例名称
   * @param {Function} callback - 轮询回调函数
   * @param {Object} options - 配置选项
   */
  createPolling(name, callback, options = {}) {
    const config = {
      activeInterval: options.activeInterval || this.defaultIntervals.active,
      inactiveInterval: options.inactiveInterval || this.defaultIntervals.inactive,
      offlineInterval: options.offlineInterval || this.defaultIntervals.offline,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000
    }

    const instance = {
      name,
      callback,
      config,
      timer: null,
      retryCount: 0,
      lastSuccessTime: Date.now(),
      isRunning: false
    }

    this.pollingInstances.set(name, instance)
    return instance
  }

  /**
   * 启动轮询
   * @param {string} name - 轮询实例名称
   */
  startPolling(name) {
    const instance = this.pollingInstances.get(name)
    if (!instance) {
      console.error(`轮询实例 ${name} 不存在`)
      return
    }

    if (instance.isRunning) {
      console.log(`轮询实例 ${name} 已在运行`)
      return
    }

    instance.isRunning = true
    this.scheduleNext(instance)
    console.log(`🔄 启动智能轮询: ${name}`)
  }

  /**
   * 停止轮询
   * @param {string} name - 轮询实例名称
   */
  stopPolling(name) {
    const instance = this.pollingInstances.get(name)
    if (!instance) return

    if (instance.timer) {
      clearTimeout(instance.timer)
      instance.timer = null
    }
    instance.isRunning = false
    console.log(`⏹️ 停止轮询: ${name}`)
  }

  /**
   * 调度下次轮询
   * @param {Object} instance - 轮询实例
   */
  scheduleNext(instance) {
    if (!instance.isRunning) return

    const interval = this.getCurrentInterval(instance)
    
    instance.timer = setTimeout(async () => {
      if (!instance.isRunning) return

      try {
        await instance.callback()
        instance.retryCount = 0
        instance.lastSuccessTime = Date.now()
        
        // 成功后调度下次轮询
        this.scheduleNext(instance)
      } catch (error) {
        console.error(`轮询 ${instance.name} 执行失败:`, error)
        this.handlePollingError(instance, error)
      }
    }, interval)
  }

  /**
   * 获取当前轮询间隔
   * @param {Object} instance - 轮询实例
   * @returns {number} 轮询间隔（毫秒）
   */
  getCurrentInterval(instance) {
    if (!this.isOnline) {
      return instance.config.offlineInterval
    }
    
    if (this.isPageActive) {
      return instance.config.activeInterval
    } else {
      return instance.config.inactiveInterval
    }
  }

  /**
   * 处理轮询错误
   * @param {Object} instance - 轮询实例
   * @param {Error} error - 错误对象
   */
  handlePollingError(instance, error) {
    instance.retryCount++
    
    if (instance.retryCount <= instance.config.maxRetries) {
      console.log(`🔄 轮询 ${instance.name} 重试 ${instance.retryCount}/${instance.config.maxRetries}`)
      
      // 指数退避重试
      const retryDelay = instance.config.retryDelay * Math.pow(2, instance.retryCount - 1)
      
      instance.timer = setTimeout(() => {
        this.scheduleNext(instance)
      }, retryDelay)
    } else {
      console.error(`❌ 轮询 ${instance.name} 达到最大重试次数，暂停轮询`)
      instance.isRunning = false
      
      // 30秒后尝试恢复
      setTimeout(() => {
        if (!instance.isRunning) {
          console.log(`🔄 尝试恢复轮询: ${instance.name}`)
          instance.retryCount = 0
          this.startPolling(instance.name)
        }
      }, 30000)
    }
  }

  /**
   * 调整所有轮询频率
   */
  adjustAllPollingFrequency() {
    this.pollingInstances.forEach((instance, name) => {
      if (instance.isRunning) {
        console.log(`⚙️ 调整轮询频率: ${name} -> ${this.getCurrentInterval(instance)}ms`)
      }
    })
  }

  /**
   * 获取轮询状态
   * @param {string} name - 轮询实例名称
   * @returns {Object} 状态信息
   */
  getPollingStatus(name) {
    const instance = this.pollingInstances.get(name)
    if (!instance) return null

    return {
      name: instance.name,
      isRunning: instance.isRunning,
      currentInterval: this.getCurrentInterval(instance),
      retryCount: instance.retryCount,
      lastSuccessTime: instance.lastSuccessTime,
      timeSinceLastSuccess: Date.now() - instance.lastSuccessTime
    }
  }

  /**
   * 获取所有轮询状态
   * @returns {Array} 所有轮询状态
   */
  getAllPollingStatus() {
    const statuses = []
    this.pollingInstances.forEach((instance, name) => {
      statuses.push(this.getPollingStatus(name))
    })
    return statuses
  }

  /**
   * 销毁轮询管理器
   */
  destroy() {
    this.pollingInstances.forEach((instance, name) => {
      this.stopPolling(name)
    })
    this.pollingInstances.clear()
  }
}

// 创建全局实例
const smartPollingManager = new SmartPollingManager()

export default smartPollingManager