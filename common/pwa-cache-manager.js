/**
 * PWA 缓存管理器
 * 实现离线缓存和资源管理
 */

class PWACacheManager {
  constructor() {
    this.cacheName = 'damo-cashier-v1'
    this.apiCacheName = 'damo-api-cache-v1'
    this.imageCacheName = 'damo-image-cache-v1'
    
    this.cacheStrategies = {
      // 静态资源：缓存优先
      static: 'cache-first',
      // API数据：网络优先
      api: 'network-first',
      // 图片：缓存优先
      image: 'cache-first'
    }
    
    this.maxCacheAge = {
      static: 7 * 24 * 60 * 60 * 1000, // 7天
      api: 30 * 60 * 1000,             // 30分钟
      image: 24 * 60 * 60 * 1000       // 1天
    }
    
    this.init()
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker()
        await this.setupCaches()
        console.log('🔧 PWA缓存管理器初始化完成')
      } catch (error) {
        console.error('PWA缓存管理器初始化失败:', error)
      }
    } else {
      console.log('⚠️ 当前环境不支持Service Worker')
    }
  }

  // 注册Service Worker
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ Service Worker注册成功:', registration.scope)
      
      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 发现新版本，准备更新')
            this.notifyUpdate()
          }
        })
      })
      
      return registration
    } catch (error) {
      console.error('Service Worker注册失败:', error)
      throw error
    }
  }

  // 设置缓存
  async setupCaches() {
    await this.cacheStaticResources()
    await this.setupAPICache()
  }

  // 缓存静态资源
  async cacheStaticResources() {
    const cache = await caches.open(this.cacheName)
    
    const staticResources = [
      '/',
      '/static/css/app.css',
      '/static/js/app.js',
      '/static/js/chunk-vendors.js',
      '/static/fonts/iconfont.woff2',
      '/manifest.json'
    ]
    
    try {
      await cache.addAll(staticResources)
      console.log('✅ 静态资源缓存完成')
    } catch (error) {
      console.error('静态资源缓存失败:', error)
    }
  }

  // 设置API缓存
  async setupAPICache() {
    // API缓存将在请求时动态添加
    console.log('✅ API缓存策略已设置')
  }

  // 缓存API响应
  async cacheAPIResponse(request, response) {
    if (!this.shouldCacheAPI(request)) {
      return response
    }

    const cache = await caches.open(this.apiCacheName)
    const responseClone = response.clone()
    
    // 添加时间戳
    const responseWithTimestamp = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: {
        ...responseClone.headers,
        'cached-at': Date.now().toString()
      }
    })
    
    await cache.put(request, responseWithTimestamp)
    return response
  }

  // 判断是否应该缓存API
  shouldCacheAPI(request) {
    const url = new URL(request.url)
    
    // 缓存商品、分类、店铺信息等相对稳定的数据
    const cacheableAPIs = [
      '/channel/goods',
      '/channel/category',
      '/channel/store',
      '/channel/config'
    ]
    
    return cacheableAPIs.some(api => url.pathname.includes(api))
  }

  // 获取缓存的API响应
  async getCachedAPIResponse(request) {
    const cache = await caches.open(this.apiCacheName)
    const cachedResponse = await cache.match(request)
    
    if (!cachedResponse) {
      return null
    }
    
    // 检查缓存是否过期
    const cachedAt = cachedResponse.headers.get('cached-at')
    if (cachedAt) {
      const age = Date.now() - parseInt(cachedAt)
      if (age > this.maxCacheAge.api) {
        await cache.delete(request)
        return null
      }
    }
    
    return cachedResponse
  }

  // 网络优先策略
  async networkFirst(request) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await this.cacheAPIResponse(request, response.clone())
      }
      return response
    } catch (error) {
      console.log('网络请求失败，尝试使用缓存:', error)
      const cachedResponse = await this.getCachedAPIResponse(request)
      if (cachedResponse) {
        console.log('✅ 使用缓存响应')
        return cachedResponse
      }
      throw error
    }
  }

  // 缓存优先策略
  async cacheFirst(request) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    try {
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(this.cacheName)
        await cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      console.error('缓存优先策略失败:', error)
      throw error
    }
  }

  // 清理过期缓存
  async cleanExpiredCache() {
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('damo-')) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          const response = await cache.match(request)
          const cachedAt = response.headers.get('cached-at')
          
          if (cachedAt) {
            const age = Date.now() - parseInt(cachedAt)
            const maxAge = this.getMaxAge(cacheName)
            
            if (age > maxAge) {
              await cache.delete(request)
              console.log('🗑️ 清理过期缓存:', request.url)
            }
          }
        }
      }
    }
  }

  // 获取最大缓存时间
  getMaxAge(cacheName) {
    if (cacheName.includes('api')) return this.maxCacheAge.api
    if (cacheName.includes('image')) return this.maxCacheAge.image
    return this.maxCacheAge.static
  }

  // 预缓存关键资源
  async precacheResources(urls) {
    const cache = await caches.open(this.cacheName)
    
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          await cache.put(url, response)
          console.log('✅ 预缓存完成:', url)
        }
      } catch (error) {
        console.error('预缓存失败:', url, error)
      }
    }
  }

  // 获取缓存状态
  async getCacheStatus() {
    const cacheNames = await caches.keys()
    const status = {}
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('damo-')) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        status[cacheName] = {
          count: keys.length,
          size: await this.calculateCacheSize(cache, keys)
        }
      }
    }
    
    return status
  }

  // 计算缓存大小
  async calculateCacheSize(cache, keys) {
    let totalSize = 0
    
    for (const key of keys.slice(0, 10)) { // 只计算前10个，避免性能问题
      try {
        const response = await cache.match(key)
        if (response && response.body) {
          const reader = response.body.getReader()
          let size = 0
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.length
          }
          
          totalSize += size
        }
      } catch (error) {
        // 忽略计算错误
      }
    }
    
    return totalSize
  }

  // 清空所有缓存
  async clearAllCache() {
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('damo-')) {
        await caches.delete(cacheName)
        console.log('🗑️ 清空缓存:', cacheName)
      }
    }
  }

  // 通知更新
  notifyUpdate() {
    // 可以通过uni.$emit发送全局事件
    if (typeof uni !== 'undefined') {
      uni.$emit('app-update-available')
    }
    
    // 或者显示更新提示
    if (typeof uni !== 'undefined' && uni.showModal) {
      uni.showModal({
        title: '发现新版本',
        content: '应用有新版本可用，是否立即更新？',
        success: (res) => {
          if (res.confirm) {
            window.location.reload()
          }
        }
      })
    }
  }

  // 手动更新
  async updateApp() {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }
}

// 创建全局实例
const pwaCacheManager = new PWACacheManager()

export default pwaCacheManager