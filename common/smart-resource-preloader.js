/**
 * 智能资源预加载器
 * 基于用户行为模式和网络状况智能预加载资源
 */

class SmartResourcePreloader {
  constructor() {
    this.userBehavior = new Map() // 用户行为统计
    this.preloadQueue = [] // 预加载队列
    this.loadedResources = new Set() // 已加载资源
    this.networkInfo = { type: 'unknown', speed: 'unknown' }
    this.isPreloading = false
    this.maxConcurrentPreloads = 3
    this.preloadStrategies = new Map()
    
    this.init()
  }

  async init() {
    this.setupNetworkMonitoring()
    this.setupUserBehaviorTracking()
    this.registerPreloadStrategies()
    this.startPreloadWorker()
    console.log('🚀 智能资源预加载器初始化完成')
  }

  // 设置网络监控
  setupNetworkMonitoring() {
    // 检测网络连接类型
    if ('connection' in navigator) {
      const connection = navigator.connection
      this.networkInfo = {
        type: connection.effectiveType || 'unknown',
        speed: this.getNetworkSpeed(connection),
        saveData: connection.saveData || false
      }
      
      connection.addEventListener('change', () => {
        this.networkInfo = {
          type: connection.effectiveType || 'unknown',
          speed: this.getNetworkSpeed(connection),
          saveData: connection.saveData || false
        }
        console.log('📶 网络状况变化:', this.networkInfo)
        this.adjustPreloadStrategy()
      })
    }

    // 监听在线/离线状态
    window.addEventListener('online', () => {
      console.log('📶 网络已连接，恢复预加载')
      this.resumePreloading()
    })

    window.addEventListener('offline', () => {
      console.log('📵 网络已断开，暂停预加载')
      this.pausePreloading()
    })
  }

  // 获取网络速度等级
  getNetworkSpeed(connection) {
    if (!connection) return 'unknown'
    
    const downlink = connection.downlink || 0
    if (downlink >= 10) return 'fast'
    if (downlink >= 1.5) return 'medium'
    if (downlink >= 0.5) return 'slow'
    return 'very-slow'
  }

  // 设置用户行为跟踪
  setupUserBehaviorTracking() {
    // 跟踪页面访问
    this.trackPageVisit = (pagePath) => {
      const visits = this.userBehavior.get(pagePath) || { count: 0, lastVisit: 0, avgStayTime: 0 }
      visits.count++
      visits.lastVisit = Date.now()
      this.userBehavior.set(pagePath, visits)
      
      // 预测下一个可能访问的页面
      this.predictNextPages(pagePath)
    }

    // 跟踪停留时间
    this.trackStayTime = (pagePath, stayTime) => {
      const visits = this.userBehavior.get(pagePath) || { count: 0, lastVisit: 0, avgStayTime: 0 }
      visits.avgStayTime = (visits.avgStayTime * (visits.count - 1) + stayTime) / visits.count
      this.userBehavior.set(pagePath, visits)
    }

    // 跟踪点击行为
    this.trackClick = (element, targetPage) => {
      const clickData = {
        element: element.tagName + (element.className ? '.' + element.className : ''),
        targetPage,
        timestamp: Date.now()
      }
      
      // 记录点击模式
      const clickPattern = this.userBehavior.get('clickPatterns') || []
      clickPattern.push(clickData)
      if (clickPattern.length > 100) clickPattern.shift() // 保持最近100次点击
      this.userBehavior.set('clickPatterns', clickPattern)
    }
  }

  // 注册预加载策略
  registerPreloadStrategies() {
    // 页面预加载策略
    this.preloadStrategies.set('page', {
      priority: 1,
      condition: (resource) => this.shouldPreloadPage(resource),
      loader: (resource) => this.preloadPage(resource)
    })

    // 图片预加载策略
    this.preloadStrategies.set('image', {
      priority: 2,
      condition: (resource) => this.shouldPreloadImage(resource),
      loader: (resource) => this.preloadImage(resource)
    })

    // API 数据预加载策略
    this.preloadStrategies.set('api', {
      priority: 3,
      condition: (resource) => this.shouldPreloadAPI(resource),
      loader: (resource) => this.preloadAPI(resource)
    })

    // 字体预加载策略
    this.preloadStrategies.set('font', {
      priority: 4,
      condition: (resource) => this.shouldPreloadFont(resource),
      loader: (resource) => this.preloadFont(resource)
    })
  }

  // 预测下一个可能访问的页面
  predictNextPages(currentPage) {
    const predictions = []
    
    // 基于历史访问模式预测
    const pageTransitions = this.getPageTransitions(currentPage)
    pageTransitions.forEach(transition => {
      predictions.push({
        type: 'page',
        resource: transition.targetPage,
        probability: transition.probability,
        reason: 'historical_pattern'
      })
    })

    // 基于业务逻辑预测
    const businessPredictions = this.getBusinessLogicPredictions(currentPage)
    predictions.push(...businessPredictions)

    // 添加到预加载队列
    predictions.forEach(prediction => {
      if (prediction.probability > 0.3) { // 概率阈值
        this.addToPreloadQueue(prediction)
      }
    })
  }

  // 获取页面转换模式
  getPageTransitions(currentPage) {
    const clickPatterns = this.userBehavior.get('clickPatterns') || []
    const transitions = new Map()
    
    clickPatterns.forEach(click => {
      if (click.targetPage && click.targetPage !== currentPage) {
        const key = `${currentPage}->${click.targetPage}`
        const count = transitions.get(key) || 0
        transitions.set(key, count + 1)
      }
    })

    const totalTransitions = Array.from(transitions.values()).reduce((sum, count) => sum + count, 0)
    
    return Array.from(transitions.entries()).map(([key, count]) => ({
      targetPage: key.split('->')[1],
      probability: count / totalTransitions,
      count
    })).sort((a, b) => b.probability - a.probability)
  }

  // 基于业务逻辑的预测
  getBusinessLogicPredictions(currentPage) {
    const predictions = []
    
    // 收银台相关预测
    if (currentPage === '/pages/home/index') {
      predictions.push(
        { type: 'page', resource: '/pages/table/index', probability: 0.7, reason: 'business_flow' },
        { type: 'api', resource: '/channel/table', probability: 0.8, reason: 'data_dependency' },
        { type: 'api', resource: '/channel/goods', probability: 0.6, reason: 'likely_needed' }
      )
    }
    
    // 桌台管理相关预测
    if (currentPage === '/pages/table/index') {
      predictions.push(
        { type: 'page', resource: '/pages/table/orderPay', probability: 0.5, reason: 'business_flow' },
        { type: 'api', resource: '/channel/order', probability: 0.7, reason: 'data_dependency' }
      )
    }

    // 登录页面预测
    if (currentPage === '/pages/login/index') {
      predictions.push(
        { type: 'page', resource: '/pages/home/index', probability: 0.9, reason: 'login_success' },
        { type: 'api', resource: '/channel/user/info', probability: 0.8, reason: 'post_login' }
      )
    }

    return predictions
  }

  // 添加到预加载队列
  addToPreloadQueue(resource) {
    // 检查是否已经在队列中或已加载
    const resourceKey = `${resource.type}:${resource.resource}`
    if (this.loadedResources.has(resourceKey)) {
      return
    }

    const existingIndex = this.preloadQueue.findIndex(item => 
      item.type === resource.type && item.resource === resource.resource
    )

    if (existingIndex !== -1) {
      // 更新现有项的概率
      this.preloadQueue[existingIndex].probability = Math.max(
        this.preloadQueue[existingIndex].probability,
        resource.probability
      )
    } else {
      // 添加新项
      this.preloadQueue.push({
        ...resource,
        addedAt: Date.now(),
        attempts: 0
      })
    }

    // 按优先级和概率排序
    this.preloadQueue.sort((a, b) => {
      const strategyA = this.preloadStrategies.get(a.type)
      const strategyB = this.preloadStrategies.get(b.type)
      
      if (strategyA.priority !== strategyB.priority) {
        return strategyA.priority - strategyB.priority
      }
      
      return b.probability - a.probability
    })
  }

  // 开始预加载工作器
  startPreloadWorker() {
    setInterval(() => {
      this.processPreloadQueue()
    }, 1000) // 每秒检查一次

    // 空闲时预加载
    if ('requestIdleCallback' in window) {
      const idlePreload = (deadline) => {
        while (deadline.timeRemaining() > 0 && this.preloadQueue.length > 0) {
          this.processNextPreload()
        }
        requestIdleCallback(idlePreload)
      }
      requestIdleCallback(idlePreload)
    }
  }

  // 处理预加载队列
  async processPreloadQueue() {
    if (!navigator.onLine || this.networkInfo.saveData) {
      return // 离线或省流量模式不预加载
    }

    const concurrentCount = this.getCurrentConcurrentCount()
    const maxAllowed = this.getMaxConcurrentPreloads()

    while (concurrentCount < maxAllowed && this.preloadQueue.length > 0) {
      await this.processNextPreload()
    }
  }

  // 处理下一个预加载项
  async processNextPreload() {
    if (this.preloadQueue.length === 0) return

    const item = this.preloadQueue.shift()
    const strategy = this.preloadStrategies.get(item.type)

    if (!strategy || !strategy.condition(item)) {
      return
    }

    const resourceKey = `${item.type}:${item.resource}`
    
    try {
      console.log(`🔄 预加载 ${item.type}: ${item.resource} (概率: ${item.probability.toFixed(2)})`)
      
      await strategy.loader(item)
      this.loadedResources.add(resourceKey)
      
      console.log(`✅ 预加载完成: ${resourceKey}`)
    } catch (error) {
      console.error(`❌ 预加载失败: ${resourceKey}`, error)
      
      // 重试机制
      item.attempts++
      if (item.attempts < 3) {
        setTimeout(() => {
          this.preloadQueue.unshift(item)
        }, 5000 * item.attempts) // 递增延迟重试
      }
    }
  }

  // 页面预加载条件
  shouldPreloadPage(resource) {
    return resource.probability > 0.4 && this.networkInfo.speed !== 'very-slow'
  }

  // 图片预加载条件
  shouldPreloadImage(resource) {
    return resource.probability > 0.5 && this.networkInfo.speed !== 'very-slow'
  }

  // API 预加载条件
  shouldPreloadAPI(resource) {
    return resource.probability > 0.6 && this.networkInfo.speed !== 'slow'
  }

  // 字体预加载条件
  shouldPreloadFont(resource) {
    return resource.probability > 0.3 // 字体优先级较高
  }

  // 预加载页面
  async preloadPage(resource) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = resource.resource
    document.head.appendChild(link)

    return new Promise((resolve, reject) => {
      link.onload = resolve
      link.onerror = reject
      setTimeout(reject, 10000) // 10秒超时
    })
  }

  // 预加载图片
  async preloadImage(resource) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = reject
      img.src = resource.resource
      setTimeout(reject, 15000) // 15秒超时
    })
  }

  // 预加载 API 数据
  async preloadAPI(resource) {
    try {
      const response = await uni.request({
        url: resource.resource,
        method: 'GET',
        timeout: 10000
      })

      if (response.statusCode === 200) {
        // 缓存 API 响应
        const cacheKey = `api_cache_${resource.resource}`
        uni.setStorageSync(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5分钟 TTL
        })
      }

      return response
    } catch (error) {
      throw new Error(`API 预加载失败: ${error.message}`)
    }
  }

  // 预加载字体
  async preloadFont(resource) {
    if ('fonts' in document) {
      const fontFace = new FontFace('preload-font', `url(${resource.resource})`)
      await fontFace.load()
      document.fonts.add(fontFace)
    } else {
      // 降级方案
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = resource.resource
      document.head.appendChild(link)
    }
  }

  // 获取当前并发数
  getCurrentConcurrentCount() {
    // 这里应该跟踪当前正在进行的预加载数量
    return 0 // 简化实现
  }

  // 获取最大并发数
  getMaxConcurrentPreloads() {
    switch (this.networkInfo.speed) {
      case 'fast': return 5
      case 'medium': return 3
      case 'slow': return 1
      case 'very-slow': return 0
      default: return 2
    }
  }

  // 调整预加载策略
  adjustPreloadStrategy() {
    if (this.networkInfo.saveData || this.networkInfo.speed === 'very-slow') {
      this.pausePreloading()
    } else {
      this.resumePreloading()
    }
  }

  // 暂停预加载
  pausePreloading() {
    this.isPreloading = false
    console.log('⏸️ 预加载已暂停')
  }

  // 恢复预加载
  resumePreloading() {
    this.isPreloading = true
    console.log('▶️ 预加载已恢复')
  }

  // 手动触发预加载
  preload(type, resource, options = {}) {
    const item = {
      type,
      resource,
      probability: options.probability || 1.0,
      reason: options.reason || 'manual',
      ...options
    }
    
    this.addToPreloadQueue(item)
  }

  // 获取预加载统计
  getStats() {
    return {
      queueLength: this.preloadQueue.length,
      loadedCount: this.loadedResources.size,
      networkInfo: this.networkInfo,
      userBehaviorEntries: this.userBehavior.size,
      isPreloading: this.isPreloading
    }
  }

  // 清理过期缓存
  cleanupCache() {
    try {
      const info = uni.getStorageInfoSync()
      const now = Date.now()
      
      info.keys.forEach(key => {
        if (key.startsWith('api_cache_')) {
          try {
            const cached = uni.getStorageSync(key)
            if (cached && cached.timestamp + cached.ttl < now) {
              uni.removeStorageSync(key)
            }
          } catch (error) {
            // 忽略清理错误
          }
        }
      })
    } catch (error) {
      console.error('缓存清理失败:', error)
    }
  }

  // 导出用户行为数据（用于分析）
  exportBehaviorData() {
    return {
      userBehavior: Object.fromEntries(this.userBehavior),
      networkInfo: this.networkInfo,
      timestamp: Date.now()
    }
  }
}

// 创建全局实例
const smartResourcePreloader = new SmartResourcePreloader()

export default smartResourcePreloader