// Enhanced Service Worker for PWA functionality
const CACHE_NAME = 'cashier-pwa-v2';
const OFFLINE_CACHE = 'cashier-offline-v1';
const RUNTIME_CACHE = 'cashier-runtime-v1';

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源 - 缓存优先
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
    strategy: 'cacheFirst',
    cacheName: CACHE_NAME
  },
  // API请求 - 网络优先
  api: {
    pattern: /\/api\//,
    strategy: 'networkFirst',
    cacheName: RUNTIME_CACHE
  },
  // 页面 - 网络优先，离线时使用缓存
  pages: {
    pattern: /\.html$|\/$/,
    strategy: 'networkFirst',
    cacheName: RUNTIME_CACHE
  }
};

// 需要预缓存的资源
const urlsToCache = [
  '/',
  '/offline.html',
  '/static/css/app.css',
  '/static/js/app.js',
  '/static/icons/icon-192x192.png',
  '/static/icons/icon-512x512.png',
  '/static/fonts/iconfont.woff2'
];

// 离线页面内容
const OFFLINE_PAGE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>离线模式 - 收银系统</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .offline-container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 400px;
        }
        .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .offline-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .offline-message {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .retry-btn {
            background: #007aff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        .retry-btn:hover {
            background: #0056cc;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📴</div>
        <div class="offline-title">网络连接中断</div>
        <div class="offline-message">
            您当前处于离线状态。<br>
            部分功能可能无法使用，请检查网络连接。
        </div>
        <button class="retry-btn" onclick="window.location.reload()">
            重新连接
        </button>
    </div>
</body>
</html>
`;

// Install event - 预缓存资源
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(urlsToCache);
      }),
      // 缓存离线页面
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('📴 Caching offline page');
        return cache.put('/offline.html', new Response(OFFLINE_PAGE, {
          headers: { 'Content-Type': 'text/html' }
        }));
      })
    ]).then(() => {
      console.log('✅ Service Worker installed');
      // 立即激活新的Service Worker
      self.skipWaiting();
    })
  );
});

// Activate event - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== RUNTIME_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated');
      
      // 通知客户端缓存已更新
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_UPDATED',
            payload: { cacheName: CACHE_NAME }
          });
        });
      });
    })
  );
});

// Fetch event - 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非HTTP请求
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // 确定缓存策略
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('Fetch failed:', error);
        return handleOfflineResponse(request);
      })
  );
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      handleBackgroundSync()
    );
  }
});

// 推送通知事件
self.addEventListener('push', (event) => {
  console.log('📬 Push message received');
  
  let notificationData = {
    title: '收银系统',
    body: '您有新的消息',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/badge-72x72.png'
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag || 'default',
      data: notificationData.data,
      actions: notificationData.actions || []
    })
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  // 打开应用
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 如果已有窗口打开，聚焦到该窗口
      for (const client of clients) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 否则打开新窗口
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// 消息事件
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

/**
 * 确定缓存策略
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // 检查各种模式
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url.pathname) || config.pattern.test(url.href)) {
      return config;
    }
  }
  
  // 默认策略
  return {
    strategy: 'networkFirst',
    cacheName: RUNTIME_CACHE
  };
}

/**
 * 处理请求
 */
async function handleRequest(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cache);
    case 'networkFirst':
      return networkFirst(request, cache);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cache);
    default:
      return networkFirst(request, cache);
  }
}

/**
 * 缓存优先策略
 */
async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * 网络优先策略
 */
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * 过期重新验证策略
 */
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || networkResponsePromise;
}

/**
 * 处理离线响应
 */
async function handleOfflineResponse(request) {
  const url = new URL(request.url);
  
  // 对于页面请求，返回离线页面
  if (request.mode === 'navigate') {
    const offlineCache = await caches.open(OFFLINE_CACHE);
    return offlineCache.match('/offline.html');
  }
  
  // 对于API请求，返回离线数据或错误响应
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 其他请求返回网络错误
  return new Response('Network error', { status: 503 });
}

/**
 * 处理后台同步
 */
async function handleBackgroundSync() {
  console.log('🔄 Processing background sync...');
  
  try {
    // 获取离线队列数据
    const cache = await caches.open(RUNTIME_CACHE);
    const offlineRequests = await getOfflineRequests();
    
    for (const requestData of offlineRequests) {
      try {
        const response = await fetch(requestData.url, requestData.options);
        
        if (response.ok) {
          console.log('✅ Synced offline request:', requestData.url);
          await removeOfflineRequest(requestData.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync request:', requestData.url, error);
      }
    }
    
    // 通知客户端同步完成
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        payload: { completed: true }
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * 获取离线请求队列
 */
async function getOfflineRequests() {
  // 这里应该从IndexedDB或其他持久化存储获取
  // 简化实现，返回空数组
  return [];
}

/**
 * 移除离线请求
 */
async function removeOfflineRequest(id) {
  // 这里应该从持久化存储中移除
  console.log('Removing offline request:', id);
}

/**
 * 清理所有缓存
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('🚀 Enhanced Service Worker loaded');