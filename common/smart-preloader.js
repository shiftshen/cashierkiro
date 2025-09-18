/**
 * 智能资源预加载器
 * 基于用户行为模式和网络状况智能预加载资源
 */

class SmartPreloader {
  constructor() {
    this.userBehavior = {
      pageVisits: new Map(),
      navigationPatterns: [],
      timeSpent: new Map(),
      interactions: new Map()
    }
    
    this.preloadQueue = []
    this.preloadedResources = new Set()
    this.isPreloading = false
    this.networkSpeed = 'unknown'
    
    // 预加载策略配置
    this.strategies = {
      // 基于访问频率
      frequency: {
        enabled: true,
        threshold: 3, // 访问3次以上的页面
        weight: 0.4
      },
      // 基于导航模式
      navigation: {
        enabled: true,
        sequenceLength: 3, // 分析3步导航序列
        weight: 0.3
      },
      // 基于停留时间
      timeSpent: {
        enabled: true,
        threshold: 30000, // 停留30秒以上
        weight: 0.2
      },
      // 基于网络状况
      network: {
        enabled: true,
        weight: 0.1
      }
    }
    
    this.init()
  }

  async init() {
    this.loadUserBehavior()
    this.detectNetworkSpeed()
    this.setupEventListeners()
    this.startBehaviorAnalysis()
    
    console.log('🧠 智能预加载器已启动')
  }

  // 设置事件监听
  setupEventListeners() {
    // 监听页面访问
    uni.$on('page-visit', (pageInfo) => {
      this.recordPageVisit(pageInfo)
    })

    // 监听页面离开
    uni.$on('page-leave', (pageInfo) => {
      this.recordPageLeave(pageInfo)
    })

    // 监听用户交互
    uni.$on('user-interaction', (interactionInfo) => {
      this.recordInteraction(interactionInfo)
    })

    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.detectNetworkSpeed()
      this.resumePreloading()
    })

    window.addEventListener('offline', () => {
      this.pausePreloading()
    })
  }

  // 记录页面访问
  recordPageVisit(pageInfo) {
    const { path, timestamp = Date.now() } = pageInfo
    
    // 更新访问计数
    const visits = this.userBehavior.pageVisits.get(path) || 0
    this.userBehavior.pageVisits.set(path, visits + 1)
    
    // 记录导航模式
    this.userBehavior.navigationPatterns.push({
      path,
      timestamp,
      from: this.currentPage
    })
    
    // 限制导航历史长度
    if (this.userBehavior.navigationPatterns.length > 100) {
      this.userBehavior.navigationPatterns.shift()
    }
    
    this.currentPage = path
    this.pageStartTime = timestamp
    
    // 分析并预加载
    this.analyzeAndPreload()
  }

  // 记录页面离开
  recordPageLeave(pageInfo) {
    const { path, timestamp = Date.now() } = pageInfo
    
    if (this.pageStartTime) {
      const timeSpent = timestamp - this.pageStartTime
      const existingTime = this.userBehavior.timeSpent.get(path) || 0
      this.userBehavior.timeSpent.set(path, existingTime + timeSpent)
    }
  }

  // 记录用户交互
  recordInteraction(interactionInfo) {
    const { type, target, timestamp = Date.now() } = interactionInfo
    
    const key = `${this.currentPage}_${type}_${target}`
    const interactions = this.userBehavior.interactions.get(key) || 0
    this.userBehavior.interactions.set(key, interactions + 1)
  }

  // 分析并预加载
  async analyzeAndPreload() {
    if (!navigator.onLine) return
    
    const predictions = this.predictNextPages()
    const resources = this.predictNextResources()
    
    // 根据预测结果进行预加载
    for (const prediction of predictions) {
      if (prediction.confidence > 0.6) { // 置信度大于60%
        this.preloadPage(prediction.path, prediction.priority)
      }
    }
    
    for (const resource of resources) {
      if (resource.confidence > 0.5) { // 置信度大于50%
        this.preloadResource(resource.url, resource.type, resource.priority)
      }
    }
  }

  // 预测下一个页面
  predictNextPages() {
    const predictions = []
    const currentPath = this.currentPage
    
    if (!currentPath) return predictions
    
    // 基于访问频率的预测
    if (this.strategies.frequency.enabled) {
      this.userBehavior.pageVisits.forEach((visits, path) => {
        if (path !== currentPath && visits >= this.strategies.frequency.threshold) {
          predictions.push({
            path,
            confidence: Math.min(visits / 10, 1) * this.strategies.frequency.weight,
            reason: 'frequency',
            priority: 2
          })
        }
      })
    }
    
    // 基于导航模式的预测
    if (this.strategies.navigation.enabled) {
      const recentPatterns = this.userBehavior.navigationPatterns
        .filter(p => p.from === currentPath)
        .slice(-20) // 最近20次导航
      
      const nextPageCounts = new Map()
      recentPatterns.forEach(pattern => {
        const count = nextPageCounts.get(pattern.path) || 0
        nextPageCounts.set(pattern.path, count + 1)
      })
      
      nextPageCounts.forEach((count, path) => {
        const confidence = (count / recentPatterns.length) * this.strategies.navigation.weight
        predictions.push({
          path,
          confidence,
          reason: 'navigation',
          priority: 1
        })
      })
    }
    
    // 基于停留时间的预测
    if (this.strategies.timeSpent.enabled) {
      this.userBehavior.timeSpent.forEach((time, path) => {
        if (path !== currentPath && time >= this.strategies.timeSpent.threshold) {
          const confidence = Math.min(time / 300000, 1) * this.strategies.timeSpent.weight // 5分钟为满分
          predictions.push({
            path,
            confidence,
            reason: 'timeSpent',
            priority: 3
          })
        }
      })
    }
    
    // 合并和排序预测结果
    const mergedPredictions = this.mergePredictions(predictions)
    return mergedPredictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  // 预测下一个资源
  predictNextResources() {
    const resources = []
    
    // 基于当前页面预测需要的资源
    const currentPageResources = this.getPageResources(this.currentPage)
    
    currentPageResources.forEach(resource => {
      resources.push({
        url: resource.url,
        type: resource.type,
        confidence: 0.8,
        priority: resource.priority || 2
      })
    })
    
    return resources
  }

  // 获取页面相关资源
  getPageResources(pagePath) {
    const resourceMap = {
      '/pages/home/index': [
        { url: '/api/store/info', type: 'api', priority: 1 },
        { url: '/api/goods/category', type: 'api', priority: 2 },
        { url: '/static/imgs/logo.png', type: 'image', priority: 3 }
      ],
      '/pages/table/index': [
        { url: '/api/table/list', type: 'api', priority: 1 },
        { url: '/api/table/area', type: 'api', priority: 2 }
      ],
      '/pages/login/index': [
        { url: '/static/imgs/lbg.webp', type: 'image', priority: 1 }
      ]
    }
    
    return resourceMap[pagePath] || []
  }

  // 预加载页面
  async preloadPage(pagePath, priority = 2) {
    if (this.preloadedResources.has(pagePath)) {
      return // 已经预加载过
    }
    
    try {
      console.log(`🔮 预加载页面: ${pagePath} (优先级: ${priority})`)
      
      // 预加载页面组件
      const componentPath = this.getComponentPath(pagePath)
      if (componentPath) {
        await import(componentPath)
        this.preloadedResources.add(pagePath)
        console.log(`✅ 页面预加载完成: ${pagePath}`)
      }
    } catch (error) {
      console.error(`页面预加载失败: ${pagePath}`, error)
    }
  }

  // 预加载资源
  async preloadResource(url, type, priority = 2) {
    if (this.preloadedResources.has(url)) {
      return // 已经预加载过
    }
    
    // 根据网络状况决定是否预加载
    if (!this.shouldPreloadBasedOnNetwork(type, priority)) {
      return
    }
    
    try {
      console.log(`🔮 预加载资源: ${url} (类型: ${type}, 优先级: ${priority})`)
      
      switch (type) {
        case 'api':
          await this.preloadAPI(url)
          break
        case 'image':
          await this.preloadImage(url)
          break
        case 'script':
          await this.preloadScript(url)
          break
        case 'style':
          await this.preloadStyle(url)
          break
      }
      
      this.preloadedResources.add(url)
      console.log(`✅ 资源预加载完成: ${url}`)
    } catch (error) {
      console.error(`资源预加载失败: ${url}`, error)
    }
  }

  // 预加载API数据
  async preloadAPI(url) {
    try {
      const response = await uni.request({
        url: url,
        method: 'GET',
        timeout: 5000
      })
      
      if (response.statusCode === 200) {
        // 缓存API响应
        const cacheKey = `preload_api_${url}`
        uni.setStorageSync(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          url: url
        })
      }
    } catch (error) {
      console.warn('API预加载失败:', url, error)
    }
  }

  // 预加载图片
  async preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = url
    })
  }

  // 预加载脚本
  async preloadScript(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = url
      link.onload = () => resolve()
      link.onerror = () => reject(new Error('脚本预加载失败'))
      document.head.appendChild(link)
    })
  }

  // 预加载样式
  async preloadStyle(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = url
      link.onload = () => resolve()
      link.onerror = () => reject(new Error('样式预加载失败'))
      document.head.appendChild(link)
    })
  }

  // 检测网络速度
  async detectNetworkSpeed() {
    try {
      const startTime = Date.now()
      const response = await fetch('/static/imgs/logo.png?t=' + Date.now(), {
        cache: 'no-cache'
      })
      const endTime = Date.now()
      
      const duration = endTime - startTime
      const size = parseInt(response.headers.get('content-length') || '10000')
      const speed = size / (duration / 1000) // bytes per second
      
      if (speed > 1000000) { // > 1MB/s
        this.networkSpeed = 'fast'
      } else if (speed > 100000) { // > 100KB/s
        this.networkSpeed = 'medium'
      } else {
        this.networkSpeed = 'slow'
      }
      
      console.log(`📶 网络速度检测: ${this.networkSpeed} (${Math.round(speed / 1024)}KB/s)`)
    } catch (error) {
      console.warn('网络速度检测失败:', error)
      this.networkSpeed = 'unknown'
    }
  }

  // 基于网络状况判断是否应该预加载
  shouldPreloadBasedOnNetwork(resourceType, priority) {
    if (!navigator.onLine) return false
    
    switch (this.networkSpeed) {
      case 'fast':
        return true // 快速网络，预加载所有资源
        
      case 'medium':
        return priority <= 2 // 中速网络，只预加载高优先级资源
        
      case 'slow':
        return priority === 1 // 慢速网络，只预加载最高优先级资源
        
      default:
        return priority === 1 // 未知网络，保守策略
    }
  }

  // 获取组件路径
  getComponentPath(pagePath) {
    const componentMap = {
      '/pages/home/index': '@/pages/home/index.vue',
      '/pages/table/index': '@/pages/table/index.vue',
      '/pages/table/table': '@/pages/table/table.vue',
      '/pages/login/index': '@/pages/login/index.vue'
    }
    
    return componentMap[pagePath]
  }

  // 合并预测结果
  mergePredictions(predictions) {
    const merged = new Map()
    
    predictions.forEach(prediction => {
      const existing = merged.get(prediction.path)
      if (existing) {
        existing.confidence += prediction.confidence
        existing.reasons.push(prediction.reason)
      } else {
        merged.set(prediction.path, {
          ...prediction,
          reasons: [prediction.reason]
        })
      }
    })
    
    return Array.from(merged.values())
  }

  // 开始行为分析
  startBehaviorAnalysis() {
    // 每30秒分析一次用户行为
    setInterval(() => {
      this.analyzeBehaviorPatterns()
    }, 30000)
    
    // 每5分钟保存用户行为数据
    setInterval(() => {
      this.saveUserBehavior()
    }, 5 * 60 * 1000)
  }

  // 分析行为模式
  analyzeBehaviorPatterns() {
    const patterns = this.extractNavigationPatterns()
    const hotPages = this.identifyHotPages()
    
    // 基于分析结果调整预加载策略
    this.adjustPreloadStrategy(patterns, hotPages)
  }

  // 提取导航模式
  extractNavigationPatterns() {
    const patterns = new Map()
    const recentNavigation = this.userBehavior.navigationPatterns.slice(-50)
    
    for (let i = 0; i < recentNavigation.length - 1; i++) {
      const current = recentNavigation[i]
      const next = recentNavigation[i + 1]
      
      const pattern = `${current.path} -> ${next.path}`
      const count = patterns.get(pattern) || 0
      patterns.set(pattern, count + 1)
    }
    
    return patterns
  }

  // 识别热点页面
  identifyHotPages() {
    const hotPages = []
    
    this.userBehavior.pageVisits.forEach((visits, path) => {
      const timeSpent = this.userBehavior.timeSpent.get(path) || 0
      const score = visits * 0.6 + (timeSpent / 60000) * 0.4 // 访问次数权重60%，停留时间权重40%
      
      if (score > 2) { // 热点阈值
        hotPages.push({ path, score, visits, timeSpent })
      }
    })
    
    return hotPages.sort((a, b) => b.score - a.score)
  }

  // 调整预加载策略
  adjustPreloadStrategy(patterns, hotPages) {
    // 根据热点页面调整预加载优先级
    hotPages.forEach(page => {
      if (page.score > 5) {
        // 高热度页面，提高预加载优先级
        this.preloadPage(page.path, 1)
      }
    })
  }

  // 保存用户行为数据
  saveUserBehavior() {
    try {
      const behaviorData = {
        pageVisits: Array.from(this.userBehavior.pageVisits.entries()),
        navigationPatterns: this.userBehavior.navigationPatterns.slice(-50),
        timeSpent: Array.from(this.userBehavior.timeSpent.entries()),
        interactions: Array.from(this.userBehavior.interactions.entries()).slice(-100)
      }
      
      uni.setStorageSync('user_behavior_data', behaviorData)
    } catch (error) {
      console.error('保存用户行为数据失败:', error)
    }
  }

  // 加载用户行为数据
  loadUserBehavior() {
    try {
      const behaviorData = uni.getStorageSync('user_behavior_data')
      if (behaviorData) {
        this.userBehavior.pageVisits = new Map(behaviorData.pageVisits || [])
        this.userBehavior.navigationPatterns = behaviorData.navigationPatterns || []
        this.userBehavior.timeSpent = new Map(behaviorData.timeSpent || [])
        this.userBehavior.interactions = new Map(behaviorData.interactions || [])
        
        console.log('📚 用户行为数据已加载')
      }
    } catch (error) {
      console.error('加载用户行为数据失败:', error)
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
    this.analyzeAndPreload()
  }

  // 获取预加载统计
  getPreloadStats() {
    return {
      preloadedCount: this.preloadedResources.size,
      queueLength: this.preloadQueue.length,
      networkSpeed: this.networkSpeed,
      isPreloading: this.isPreloading,
      behaviorData: {
        visitedPages: this.userBehavior.pageVisits.size,
        navigationPatterns: this.userBehavior.navigationPatterns.length,
        interactions: this.userBehavior.interactions.size
      }
    }
  }

  // 清理预加载缓存
  clearPreloadCache() {
    this.preloadedResources.clear()
    this.preloadQueue = []
    
    // 清理预加载的API缓存
    const allKeys = uni.getStorageInfoSync().keys
    const preloadKeys = allKeys.filter(key => key.startsWith('preload_'))
    
    preloadKeys.forEach(key => {
      uni.removeStorageSync(key)
    })
    
    console.log('🗑️ 预加载缓存已清理')
  }
}

// 创建全局实例
const smartPreloader = new SmartPreloader()

export default smartPreloader