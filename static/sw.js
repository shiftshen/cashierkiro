/**
 * DAMO Cashier Service Worker
 * 处理缓存策略和离线功能
 */

const CACHE_NAME = 'damo-cashier-v1'
const API_CACHE_NAME = 'damo-api-cache-v1'
const IMAGE_CACHE_NAME = 'damo-image-cache-v1'

// 需要预缓存的静态资源
const STATIC_RESOURCES = [
  '/',
  '/static/css/app.css',
  '/static/js/app.js',
  '/static/js/chunk-vendors.js',
  '/static/fonts/iconfont.woff2',
  '/manifest.json'
]

// 可缓存的API路径
const CACHEABLE_APIS = [
  '/channel/goods',
  '/channel/category', 
  '/channel/store',
  '/channel/config'
]

// 缓存时间配置（毫秒）
const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60 * 1000, // 7天
  api: 30 * 60 * 1000,             // 30分钟
  image: 24 * 60 * 60 * 1000       // 1天
}

// Service Worker 安装事件
self.addEventListener('install', event => {
  console.log('🔧 Service Worker 安装中...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 预缓存静态资源')
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => {
        console.log('✅ Service Worker 安装完成')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('❌ Service Worker 安装失败:', error)
      })
  )
})

// Service Worker 激活事件
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker 激活中...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 清理旧版本缓存
            if (cacheName.startsWith('damo-') && 
                cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ 清理旧缓存:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker 激活完成')
        return self.clients.claim()
      })
  )
})

// 拦截网络请求
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }
  
  // 根据资源类型选择缓存策略
  if (isStaticResource(request)) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request, API_CACHE_NAME))
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME))
  }
})

// 判断是否为静态资源
function isStaticResource(request) {
  const url = new URL(request.url)
  return url.pathname.includes('/static/') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.html')
}

// 判断是否为API请求
function isAPIRequest(request) {
  const url = new URL(request.url)
  return CACHEABLE_APIS.some(api => url.pathname.includes(api))
}

// 判断是否为图片请求
function isImageRequest(request) {
  const url = new URL(request.url)
  return /\\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname)
}

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  try {
    // 先查找缓存
    const cachedResponse = await caches.match(request)
    if (cachedResponse && !isCacheExpired(cachedResponse, 'static')) {
      return cachedResponse
    }
    
    // 缓存未命中或已过期，从网络获取
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      const responseWithTimestamp = addTimestamp(response.clone())
      await cache.put(request, responseWithTimestamp)
    }
    
    return response
  } catch (error) {
    console.error('缓存优先策略失败:', error)
    
    // 网络失败时返回缓存（即使过期）
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 返回离线页面或错误响应
    return new Response('离线模式', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// 网络优先策略
async function networkFirst(request, cacheName) {
  try {
    // 先尝试网络请求
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      const responseWithTimestamp = addTimestamp(response.clone())
      await cache.put(request, responseWithTimestamp)
    }
    
    return response
  } catch (error) {
    console.log('网络请求失败，尝试缓存:', error)
    
    // 网络失败时查找缓存
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 返回错误响应
    return new Response(JSON.stringify({
      error: '网络不可用',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// 添加时间戳到响应头
function addTimestamp(response) {
  const headers = new Headers(response.headers)
  headers.set('cached-at', Date.now().toString())
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

// 检查缓存是否过期
function isCacheExpired(response, type) {
  const cachedAt = response.headers.get('cached-at')
  if (!cachedAt) return false
  
  const age = Date.now() - parseInt(cachedAt)
  const maxAge = CACHE_MAX_AGE[type] || CACHE_MAX_AGE.static
  
  return age > maxAge
}

// 监听消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// 定期清理过期缓存
setInterval(async () => {
  try {
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('damo-')) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          const response = await cache.match(request)
          if (response && isCacheExpired(response, getCacheType(cacheName))) {
            await cache.delete(request)
            console.log('🗑️ 清理过期缓存:', request.url)
          }
        }
      }
    }
  } catch (error) {
    console.error('清理缓存失败:', error)
  }
}, 60 * 60 * 1000) // 每小时清理一次

// 获取缓存类型
function getCacheType(cacheName) {
  if (cacheName.includes('api')) return 'api'
  if (cacheName.includes('image')) return 'image'
  return 'static'
}