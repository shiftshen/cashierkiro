/**
 * 预加载配置管理器
 * 管理预加载规则和策略配置
 */

class PreloadConfigManager {
  constructor() {
    this.config = {
      // 全局开关
      enabled: true,
      debugMode: false,
      
      // 网络策略
      networkStrategies: {
        'fast': {
          maxConcurrent: 5,
          enableImagePreload: true,
          enablePagePreload: true,
          enableAPIPreload: true,
          probabilityThreshold: 0.3
        },
        'medium': {
          maxConcurrent: 3,
          enableImagePreload: true,
          enablePagePreload: true,
          enableAPIPreload: true,
          probabilityThreshold: 0.4
        },
        'slow': {
          maxConcurrent: 1,
          enableImagePreload: false,
          enablePagePreload: true,
          enableAPIPreload: true,
          probabilityThreshold: 0.6
        },
        'very-slow': {
          maxConcurrent: 0,
          enableImagePreload: false,
          enablePagePreload: false,
          enableAPIPreload: false,
          probabilityThreshold: 0.8
        }
      },
      
      // 页面预加载规则
      pageRules: [
        {
          from: '/pages/login/index',
          to: '/pages/home/index',
          probability: 0.9,
          condition: 'login_success'
        },
        {
          from: '/pages/home/index',
          to: '/pages/table/index',
          probability: 0.7,
          condition: 'business_flow'
        },
        {
          from: '/pages/table/index',
          to: '/pages/table/orderPay',
          probability: 0.5,
          condition: 'table_selected'
        }
      ],
      
      // API 预加载规则
      apiRules: [
        {
          trigger: '/pages/home/index',
          apis: [
            { url: '/channel/table', probability: 0.8 },
            { url: '/channel/goods', probability: 0.6 },
            { url: '/channel/user/info', probability: 0.7 }
          ]
        },
        {
          trigger: '/pages/table/index',
          apis: [
            { url: '/channel/order', probability: 0.7 },
            { url: '/channel/table/status', probability: 0.9 }
          ]
        }
      ],
      
      // 资源预加载规则
      resourceRules: [
        {
          type: 'image',
          pattern: '/static/imgs/common/*',
          probability: 0.8,
          condition: 'app_start'
        },
        {
          type: 'font',
          pattern: '/static/fonts/*',
          probability: 0.9,
          condition: 'app_start'
        }
      ],
      
      // 用户行为分析配置
      behaviorAnalysis: {
        enabled: true,
        trackClicks: true,
        trackStayTime: true,
        trackScrolling: false,
        maxHistorySize: 1000,
        analysisInterval: 60000 // 1分钟分析一次
      },
      
      // 缓存配置
      cache: {
        apiCacheTTL: 5 * 60 * 1000, // 5分钟
        imageCacheTTL: 24 * 60 * 60 * 1000, // 24小时
        pageCacheTTL: 10 * 60 * 1000, // 10分钟
        maxCacheSize: 50 * 1024 * 1024 // 50MB
      }
    }
    
    this.loadConfig()
  }

  // 加载配置
  loadConfig() {
    try {
      const savedConfig = uni.getStorageSync('preload_config')
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) }
        console.log('📋 预加载配置已加载')
      }
    } catch (error) {
      console.error('加载预加载配置失败:', error)
    }
  }

  // 保存配置
  saveConfig() {
    try {
      uni.setStorageSync('preload_config', JSON.stringify(this.config))
      console.log('💾 预加载配置已保存')
    } catch (error) {
      console.error('保存预加载配置失败:', error)
    }
  }

  // 获取网络策略
  getNetworkStrategy(networkSpeed) {
    return this.config.networkStrategies[networkSpeed] || this.config.networkStrategies['medium']
  }

  // 获取页面预加载规则
  getPageRules(fromPage) {
    return this.config.pageRules.filter(rule => rule.from === fromPage)
  }

  // 获取 API 预加载规则
  getAPIRules(triggerPage) {
    const rule = this.config.apiRules.find(rule => rule.trigger === triggerPage)
    return rule ? rule.apis : []
  }

  // 获取资源预加载规则
  getResourceRules(condition) {
    return this.config.resourceRules.filter(rule => rule.condition === condition)
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
  }

  // 添加页面规则
  addPageRule(rule) {
    this.config.pageRules.push(rule)
    this.saveConfig()
  }

  // 添加 API 规则
  addAPIRule(rule) {
    const existingIndex = this.config.apiRules.findIndex(r => r.trigger === rule.trigger)
    if (existingIndex !== -1) {
      this.config.apiRules[existingIndex] = rule
    } else {
      this.config.apiRules.push(rule)
    }
    this.saveConfig()
  }

  // 添加资源规则
  addResourceRule(rule) {
    this.config.resourceRules.push(rule)
    this.saveConfig()
  }

  // 删除规则
  removeRule(type, index) {
    switch (type) {
      case 'page':
        this.config.pageRules.splice(index, 1)
        break
      case 'api':
        this.config.apiRules.splice(index, 1)
        break
      case 'resource':
        this.config.resourceRules.splice(index, 1)
        break
    }
    this.saveConfig()
  }

  // 启用/禁用预加载
  setEnabled(enabled) {
    this.config.enabled = enabled
    this.saveConfig()
  }

  // 设置调试模式
  setDebugMode(debugMode) {
    this.config.debugMode = debugMode
    this.saveConfig()
  }

  // 重置为默认配置
  resetToDefault() {
    uni.removeStorageSync('preload_config')
    this.loadConfig()
  }

  // 导出配置
  exportConfig() {
    return JSON.stringify(this.config, null, 2)
  }

  // 导入配置
  importConfig(configString) {
    try {
      const newConfig = JSON.parse(configString)
      this.config = newConfig
      this.saveConfig()
      return true
    } catch (error) {
      console.error('导入配置失败:', error)
      return false
    }
  }

  // 获取完整配置
  getConfig() {
    return { ...this.config }
  }

  // 验证配置
  validateConfig(config = this.config) {
    const errors = []

    // 验证网络策略
    Object.keys(config.networkStrategies).forEach(speed => {
      const strategy = config.networkStrategies[speed]
      if (typeof strategy.maxConcurrent !== 'number' || strategy.maxConcurrent < 0) {
        errors.push(`网络策略 ${speed} 的 maxConcurrent 无效`)
      }
      if (typeof strategy.probabilityThreshold !== 'number' || 
          strategy.probabilityThreshold < 0 || strategy.probabilityThreshold > 1) {
        errors.push(`网络策略 ${speed} 的 probabilityThreshold 无效`)
      }
    })

    // 验证页面规则
    config.pageRules.forEach((rule, index) => {
      if (!rule.from || !rule.to) {
        errors.push(`页面规则 ${index} 缺少 from 或 to 字段`)
      }
      if (typeof rule.probability !== 'number' || rule.probability < 0 || rule.probability > 1) {
        errors.push(`页面规则 ${index} 的 probability 无效`)
      }
    })

    // 验证 API 规则
    config.apiRules.forEach((rule, index) => {
      if (!rule.trigger || !Array.isArray(rule.apis)) {
        errors.push(`API 规则 ${index} 格式无效`)
      }
      rule.apis?.forEach((api, apiIndex) => {
        if (!api.url) {
          errors.push(`API 规则 ${index} 的 API ${apiIndex} 缺少 url`)
        }
        if (typeof api.probability !== 'number' || api.probability < 0 || api.probability > 1) {
          errors.push(`API 规则 ${index} 的 API ${apiIndex} probability 无效`)
        }
      })
    })

    return errors
  }

  // 获取统计信息
  getStats() {
    return {
      pageRulesCount: this.config.pageRules.length,
      apiRulesCount: this.config.apiRules.length,
      resourceRulesCount: this.config.resourceRules.length,
      enabled: this.config.enabled,
      debugMode: this.config.debugMode
    }
  }
}

// 创建全局实例
const preloadConfigManager = new PreloadConfigManager()

export default preloadConfigManager